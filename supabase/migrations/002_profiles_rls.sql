-- Safe to re-run: drops policies first if they already exist

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (id = auth.uid());

drop policy if exists "notif_insert_own" on public.notification_preferences;
create policy "notif_insert_own" on public.notification_preferences
  for insert with check (user_id = auth.uid());
