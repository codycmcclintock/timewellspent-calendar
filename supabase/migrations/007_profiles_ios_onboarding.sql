-- Align profiles for web + native iOS (additive).
-- Do NOT run the greenfield iOS profiles snippet on an existing project.

alter table public.profiles
  add column if not exists onboarding_completed boolean not null default false,
  add column if not exists updated_at timestamptz not null default now();

-- Existing users with a couple are treated as profile-onboarded
update public.profiles p
set onboarding_completed = true,
    updated_at = now()
where exists (
  select 1 from public.couple_members cm where cm.user_id = p.id
);

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Unified sign-up: OAuth metadata, notification prefs, iOS onboarding flag
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name, avatar_url, onboarding_completed)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(coalesce(new.email, ''), '@', 1)
    ),
    new.raw_user_meta_data->>'avatar_url',
    false
  );
  insert into public.notification_preferences (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$ language plpgsql security definer;
