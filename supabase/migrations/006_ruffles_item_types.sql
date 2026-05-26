-- Extend plans/events for Ruffles product spec (no trips/itinerary_items migration)

alter table plans add column if not exists vibe text;
alter table plans add column if not exists is_template boolean default false;

alter table events add column if not exists item_type text;
alter table events add column if not exists tags text[];
alter table events add column if not exists estimated_cost text;
alter table events add column if not exists source_type text;
alter table events add column if not exists source_text text;
alter table events add column if not exists external_url text;

-- Draft matching (Phase 8)
alter table drafts add column if not exists matched_at timestamptz;
alter table drafts add column if not exists match_partner_draft_id uuid references drafts(id);

create index if not exists idx_events_item_type on events(item_type) where item_type is not null;
create index if not exists idx_drafts_source_url on drafts(couple_id, source_url) where source_url is not null;
