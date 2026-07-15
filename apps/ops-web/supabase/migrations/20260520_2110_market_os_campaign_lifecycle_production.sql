create extension if not exists pgcrypto;
create table if not exists public.market_os_campaigns (
  id uuid primary key default gen_random_uuid(), title text not null, objective text, owner text, city text, audience text,
  status text not null default 'draft', priority text not null default 'normal', budget_mad numeric not null default 0,
  start_date date, end_date date, score numeric not null default 0, payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.market_os_campaign_tasks (
  id uuid primary key default gen_random_uuid(), campaign_id uuid references public.market_os_campaigns(id) on delete cascade,
  title text not null, owner text, status text not null default 'todo', priority text not null default 'normal', due_date date,
  proof_url text, payload jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.market_os_campaign_budget_entries (
  id uuid primary key default gen_random_uuid(), campaign_id uuid references public.market_os_campaigns(id) on delete cascade,
  label text not null, amount_mad numeric not null default 0, category text, status text not null default 'planned', payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.market_os_campaign_calendar_items (
  id uuid primary key default gen_random_uuid(), campaign_id uuid references public.market_os_campaigns(id) on delete cascade,
  title text not null, starts_at timestamptz, ends_at timestamptz, owner text, status text not null default 'planned', payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.market_os_campaign_approvals (
  id uuid primary key default gen_random_uuid(), campaign_id uuid references public.market_os_campaigns(id) on delete cascade,
  title text not null, requested_by text, approved_by text, status text not null default 'requested', decision_notes text, payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.market_os_campaign_assets (
  id uuid primary key default gen_random_uuid(), campaign_id uuid references public.market_os_campaigns(id) on delete cascade,
  title text not null, asset_type text not null default 'document', url text, status text not null default 'draft', payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.market_os_campaign_risks (
  id uuid primary key default gen_random_uuid(), campaign_id uuid references public.market_os_campaigns(id) on delete cascade,
  title text not null, severity text not null default 'medium', status text not null default 'open', mitigation text, payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.market_os_campaigns enable row level security;
alter table public.market_os_campaign_tasks enable row level security;
alter table public.market_os_campaign_budget_entries enable row level security;
alter table public.market_os_campaign_calendar_items enable row level security;
alter table public.market_os_campaign_approvals enable row level security;
alter table public.market_os_campaign_assets enable row level security;
alter table public.market_os_campaign_risks enable row level security;
do $$ declare t text; begin foreach t in array array['market_os_campaigns','market_os_campaign_tasks','market_os_campaign_budget_entries','market_os_campaign_calendar_items','market_os_campaign_approvals','market_os_campaign_assets','market_os_campaign_risks'] loop execute format('create policy %I on public.%I for all to authenticated using (true) with check (true)', t||'_authenticated_all', t); end loop; exception when duplicate_object then null; end $$;
