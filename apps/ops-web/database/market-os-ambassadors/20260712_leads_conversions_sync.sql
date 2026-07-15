-- AngelCare Market OS Ambassadors - Leads & Conversions production sync tables
-- Reviewable, non-destructive migration. Execute manually in Supabase SQL editor when ready.

create table if not exists public.market_os_ambassador_leads (
  id text primary key,
  lead_name text,
  parent_name text,
  email text,
  phone text,
  city text,
  region text,
  zone text,
  source text,
  lead_type text,
  status text default 'new',
  score numeric default 0,
  ambassador_id text,
  territory_id text,
  next_followup_at date,
  qualified_at timestamptz,
  converted_at timestamptz,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  archived_at timestamptz
);

create table if not exists public.market_os_ambassador_conversions (
  id text primary key,
  lead_id text,
  lead_name text,
  parent_name text,
  ambassador_id text,
  ambassador_name text,
  territory_id text,
  city text,
  region text,
  offer_name text,
  value numeric default 0,
  currency text default 'MAD',
  status text default 'pending',
  validation_decision text,
  validation_note text,
  proof_url text,
  validated_by text,
  validated_at timestamptz,
  rejected_at timestamptz,
  paid_at timestamptz,
  score numeric default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  archived_at timestamptz
);

create index if not exists market_os_ambassador_leads_status_idx on public.market_os_ambassador_leads(status);
create index if not exists market_os_ambassador_leads_ambassador_idx on public.market_os_ambassador_leads(ambassador_id);
create index if not exists market_os_ambassador_leads_city_idx on public.market_os_ambassador_leads(city);
create index if not exists market_os_ambassador_conversions_status_idx on public.market_os_ambassador_conversions(status);
create index if not exists market_os_ambassador_conversions_lead_idx on public.market_os_ambassador_conversions(lead_id);
create index if not exists market_os_ambassador_conversions_ambassador_idx on public.market_os_ambassador_conversions(ambassador_id);
