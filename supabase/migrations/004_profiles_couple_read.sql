-- Allow couple members to read each other's display names (header, invites)
drop policy if exists "profiles_select_couple" on public.profiles;
create policy "profiles_select_couple"
  on public.profiles for select
  using (
    id = auth.uid()
    or exists (
      select 1
      from public.couple_members mine
      join public.couple_members theirs on theirs.couple_id = mine.couple_id
      where mine.user_id = auth.uid()
        and theirs.user_id = profiles.id
    )
  );
