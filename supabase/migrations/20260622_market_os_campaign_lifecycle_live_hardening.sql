create extension if not exists pgcrypto;

alter table public.market_os_campaigns
  add column if not exists priority text not null default 'normal',
  add column if not exists budget_mad numeric not null default 0,
  add column if not exists spent_mad numeric not null default 0,
  add column if not exists revenue_mad numeric not null default 0,
  add column if not exists start_date date,
  add column if not exists end_date date,
  add column if not exists score numeric not null default 0,
  add column if not exists payload jsonb not null default '{}'::jsonb,
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists created_at timestamptz not null default now();

alter table public.market_os_campaign_tasks
  add column if not exists payload jsonb not null default '{}'::jsonb,
  add column if not exists priority text not null default 'normal',
  add column if not exists proof_url text,
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists created_at timestamptz not null default now();

alter table public.market_os_campaign_approvals
  add column if not exists payload jsonb not null default '{}'::jsonb,
  add column if not exists decision_notes text,
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists created_at timestamptz not null default now();

alter table public.market_os_campaign_budget_entries
  add column if not exists payload jsonb not null default '{}'::jsonb,
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists created_at timestamptz not null default now();

alter table public.market_os_campaign_calendar_items
  add column if not exists payload jsonb not null default '{}'::jsonb,
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists created_at timestamptz not null default now();

alter table public.market_os_campaign_assets
  add column if not exists payload jsonb not null default '{}'::jsonb,
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists created_at timestamptz not null default now();

alter table public.market_os_campaign_risks
  add column if not exists payload jsonb not null default '{}'::jsonb,
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists created_at timestamptz not null default now();

create table if not exists public.market_os_audit_log (
  id uuid primary key default gen_random_uuid(),
  action_key text not null,
  title text,
  engine text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_market_os_campaigns_updated_at on public.market_os_campaigns(updated_at desc);
create index if not exists idx_market_os_campaigns_payload_gin on public.market_os_campaigns using gin(payload);
