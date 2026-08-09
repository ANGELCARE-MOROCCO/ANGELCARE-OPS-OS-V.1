-- Content Command Center live schema
-- REVIEW BEFORE RUNNING IN SUPABASE

create extension if not exists pgcrypto;

create table if not exists public.market_content_assets (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  status text not null default 'draft',
  owner_id uuid,
  campaign_id uuid,
  channel text,
  scheduled_date date,
  due_date date,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.market_content_deliverables (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid,
  title text not null,
  status text not null default 'queued',
  readiness integer not null default 0,
  owner_id uuid,
  blocked_reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.market_content_approvals (
  id uuid primary key default gen_random_uuid(),
  target_table text not null,
  target_id uuid not null,
  reviewer_id uuid,
  state text not null default 'review',
  comments jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.market_content_publications (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid references public.market_content_assets(id) on delete set null,
  channel text not null,
  state text not null default 'queued',
  provider_payload jsonb not null default '{}'::jsonb,
  scheduled_for timestamptz,
  dispatched_at timestamptz,
  failure_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.market_content_ai_runs (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid references public.market_content_assets(id) on delete set null,
  action text not null,
  input text not null,
  output text,
  quality_score integer,
  state text not null default 'review_required',
  created_at timestamptz not null default now()
);

create table if not exists public.market_content_realtime_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null,
  entity_table text not null,
  entity_id uuid,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.market_content_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  entity_table text not null,
  entity_id uuid,
  action text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_market_content_assets_status on public.market_content_assets(status);
create index if not exists idx_market_content_assets_campaign on public.market_content_assets(campaign_id);
create index if not exists idx_market_content_assets_scheduled_date on public.market_content_assets(scheduled_date);
create index if not exists idx_market_content_deliverables_campaign on public.market_content_deliverables(campaign_id);
create index if not exists idx_market_content_approvals_target on public.market_content_approvals(target_table, target_id);
create index if not exists idx_market_content_publications_asset on public.market_content_publications(asset_id);
create index if not exists idx_market_content_ai_runs_asset on public.market_content_ai_runs(asset_id);
create index if not exists idx_market_content_realtime_events_name on public.market_content_realtime_events(event_name);
create index if not exists idx_market_content_audit_entity on public.market_content_audit_log(entity_table, entity_id);

alter table public.market_content_assets enable row level security;
alter table public.market_content_deliverables enable row level security;
alter table public.market_content_approvals enable row level security;
alter table public.market_content_publications enable row level security;
alter table public.market_content_ai_runs enable row level security;
alter table public.market_content_realtime_events enable row level security;
alter table public.market_content_audit_log enable row level security;

-- TEMPORARY SAFE DEV POLICIES.
-- Replace with your real role/permission checks before production.
drop policy if exists "authenticated can read content assets" on public.market_content_assets;
create policy "authenticated can read content assets"
on public.market_content_assets for select
to authenticated
using (true);

drop policy if exists "authenticated can write content assets" on public.market_content_assets;
create policy "authenticated can write content assets"
on public.market_content_assets for insert
to authenticated
with check (true);

drop policy if exists "authenticated can update content assets" on public.market_content_assets;
create policy "authenticated can update content assets"
on public.market_content_assets for update
to authenticated
using (true)
with check (true);

-- Repeat strict production policies for other tables after confirming role model.