-- Ruffles initial schema

create extension if not exists "uuid-ossp";

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table public.couples (
  id uuid primary key default gen_random_uuid(),
  name text,
  invite_token text unique not null default encode(gen_random_bytes(16), 'hex'),
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

create table public.couple_members (
  couple_id uuid not null references public.couples (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null default 'member',
  joined_at timestamptz not null default now(),
  primary key (couple_id, user_id)
);

create table public.plans (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples (id) on delete cascade,
  slug text not null,
  title text not null,
  description text,
  cover_image_url text,
  starts_on date,
  ends_on date,
  created_at timestamptz not null default now(),
  unique (couple_id, slug)
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples (id) on delete cascade,
  plan_id uuid references public.plans (id) on delete set null,
  created_by uuid references public.profiles (id),
  scope text not null check (scope in ('us', 'mine', 'theirs')),
  category text,
  title text not null,
  description text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  timezone text not null default 'America/Los_Angeles',
  place_name text,
  address text,
  location_lat numeric,
  location_lng numeric,
  driving_distance_mi numeric,
  driving_duration_min int,
  cost_cents int,
  cost_is_free boolean not null default false,
  hours_label text,
  notes text,
  bring_items text[] default '{}',
  cover_image_url text,
  completed_at timestamptz,
  sort_order int default 0,
  legacy_uid text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index events_legacy_uid_couple on public.events (couple_id, legacy_uid)
  where legacy_uid is not null;

create table public.drafts (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples (id) on delete cascade,
  created_by uuid references public.profiles (id),
  source_url text,
  source_type text check (source_type in ('paste', 'instagram', 'tiktok')),
  title text,
  status text not null default 'draft' check (status in ('draft', 'enriched', 'scheduled')),
  raw_metadata jsonb default '{}',
  created_at timestamptz not null default now()
);

create table public.todos (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples (id) on delete cascade,
  created_by uuid references public.profiles (id),
  title text not null,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.ics_feed_tokens (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  token text unique not null,
  created_at timestamptz not null default now(),
  rotated_at timestamptz
);

create table public.notification_preferences (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  email_on_us_events boolean not null default true
);

-- Updated_at trigger
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger events_updated_at
  before update on public.events
  for each row execute function public.set_updated_at();

-- Auto profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  insert into public.notification_preferences (user_id) values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS
alter table public.profiles enable row level security;
alter table public.couples enable row level security;
alter table public.couple_members enable row level security;
alter table public.plans enable row level security;
alter table public.events enable row level security;
alter table public.drafts enable row level security;
alter table public.todos enable row level security;
alter table public.ics_feed_tokens enable row level security;
alter table public.notification_preferences enable row level security;

create or replace function public.user_couple_ids()
returns setof uuid as $$
  select couple_id from public.couple_members where user_id = auth.uid();
$$ language sql stable security definer;

-- Profiles
create policy "profiles_select_own" on public.profiles for select using (id = auth.uid());
create policy "profiles_update_own" on public.profiles for update using (id = auth.uid());

-- Couples
create policy "couples_select_member" on public.couples for select
  using (id in (select public.user_couple_ids()));
create policy "couples_insert_auth" on public.couples for insert
  with check (auth.uid() is not null and created_by = auth.uid());
create policy "couples_update_member" on public.couples for update
  using (id in (select public.user_couple_ids()));

-- Couple members
create policy "members_select_same_couple" on public.couple_members for select
  using (couple_id in (select public.user_couple_ids()));
create policy "members_insert_self" on public.couple_members for insert
  with check (user_id = auth.uid());
create policy "members_select_invite" on public.couple_members for select using (true);

-- Plans
create policy "plans_all_member" on public.plans for all
  using (couple_id in (select public.user_couple_ids()))
  with check (couple_id in (select public.user_couple_ids()));

-- Events
create policy "events_select_member" on public.events for select
  using (couple_id in (select public.user_couple_ids()));
create policy "events_insert_member" on public.events for insert
  with check (
    couple_id in (select public.user_couple_ids())
    and created_by = auth.uid()
  );
create policy "events_update_member" on public.events for update
  using (
    couple_id in (select public.user_couple_ids())
    and (
      scope = 'us'
      or created_by = auth.uid()
    )
  );
create policy "events_delete_member" on public.events for delete
  using (
    couple_id in (select public.user_couple_ids())
    and (
      scope = 'us'
      or created_by = auth.uid()
    )
  );

-- Drafts
create policy "drafts_all_member" on public.drafts for all
  using (couple_id in (select public.user_couple_ids()))
  with check (couple_id in (select public.user_couple_ids()) and created_by = auth.uid());

-- Todos
create policy "todos_all_member" on public.todos for all
  using (couple_id in (select public.user_couple_ids()))
  with check (couple_id in (select public.user_couple_ids()));

-- ICS tokens (own row only)
create policy "ics_select_own" on public.ics_feed_tokens for select using (user_id = auth.uid());
create policy "ics_insert_own" on public.ics_feed_tokens for insert with check (user_id = auth.uid());
create policy "ics_update_own" on public.ics_feed_tokens for update using (user_id = auth.uid());

-- Notification prefs
create policy "notif_own" on public.notification_preferences for all using (user_id = auth.uid());

-- Realtime
alter publication supabase_realtime add table public.events;
