alter table public.events
  add column if not exists confidence text check (confidence in ('high', 'medium', 'low')),
  add column if not exists needs_confirmation text[] default '{}';

alter table public.plans
  add column if not exists day_themes jsonb default '{}';
