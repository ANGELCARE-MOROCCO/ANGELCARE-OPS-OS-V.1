-- ANGELCARE REVENUE COMMAND CENTER STABILIZATION V1
-- Source-of-truth prospects table.
-- Run this in Supabase before injecting the TSX files.

create extension if not exists pgcrypto;

create table if not exists public.revenue_prospects (
  id text primary key,
  name text not null default 'Unnamed prospect',
  city text not null default 'Unassigned',
  stage text not null default 'new_lead',
  priority text not null default 'medium',
  value_mad numeric not null default 0,
  score numeric not null default 0,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists revenue_prospects_city_idx on public.revenue_prospects(city);
create index if not exists revenue_prospects_stage_idx on public.revenue_prospects(stage);
create index if not exists revenue_prospects_priority_idx on public.revenue_prospects(priority);
create index if not exists revenue_prospects_updated_at_idx on public.revenue_prospects(updated_at desc);
create index if not exists revenue_prospects_data_gin_idx on public.revenue_prospects using gin(data);

create or replace function public.revenue_prospects_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  if new.data is null then new.data = '{}'::jsonb; end if;
  new.data = jsonb_set(new.data, '{updatedAt}', to_jsonb(new.updated_at::text), true);
  return new;
end $$;

drop trigger if exists trg_revenue_prospects_touch on public.revenue_prospects;
create trigger trg_revenue_prospects_touch before update on public.revenue_prospects
for each row execute function public.revenue_prospects_touch_updated_at();

alter table public.revenue_prospects enable row level security;

drop policy if exists authenticated_all_revenue_prospects on public.revenue_prospects;
create policy authenticated_all_revenue_prospects
on public.revenue_prospects
for all
to authenticated
using (true)
with check (true);

create or replace function public.revenue_prospects_count()
returns integer language sql security definer as $$
  select count(*)::integer from public.revenue_prospects;
$$;
