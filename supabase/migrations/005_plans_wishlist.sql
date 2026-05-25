-- Plans wishlist + link ingestion + pro gate

alter table public.couples
  add column if not exists is_pro boolean not null default false;

alter table public.plans
  add column if not exists destination text,
  add column if not exists destination_key text,
  add column if not exists status text not null default 'building'
    check (status in ('building', 'scheduled')),
  add column if not exists trip_length_days int,
  add column if not exists date_mode text not null default 'flexible_month'
    check (date_mode in ('flexible_month', 'exact')),
  add column if not exists flexible_month text,
  add column if not exists day_themes jsonb default '{}';

create unique index if not exists plans_couple_destination_key
  on public.plans (couple_id, destination_key)
  where destination_key is not null;

alter table public.drafts
  add column if not exists plan_id uuid references public.plans (id) on delete cascade,
  add column if not exists suggested_day date,
  add column if not exists sort_order int not null default 0,
  add column if not exists place_name text;

create index if not exists drafts_plan_id_idx on public.drafts (plan_id);
