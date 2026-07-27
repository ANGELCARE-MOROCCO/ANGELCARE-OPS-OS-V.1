-- AC CAPITAL OS - Mega Ultra ZIP 03
-- Capital Radar + Web/Gemini Research Adapter UI foundation
-- This migration defines radar-ready structures. It does not store or expose provider secrets.

create table if not exists public.ac_capital_radar_sources (
  id uuid primary key default gen_random_uuid(),
  source_name text not null,
  source_url text,
  source_type text not null default 'web',
  country text,
  region text,
  source_confidence integer not null default 50 check (source_confidence between 0 and 100),
  verification_status text not null default 'needs_review',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ac_capital_radar_research_runs (
  id uuid primary key default gen_random_uuid(),
  run_label text not null,
  adapter_name text not null,
  adapter_mode text not null check (adapter_mode in ('manual','simulated','gemini-ready','web-ready')),
  status text not null default 'completed',
  opportunities_detected integer not null default 0,
  sources_captured integer not null default 0,
  failed_sources integer not null default 0,
  human_review_required integer not null default 0,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  safety_note text not null default 'No provider keys are stored in radar records.'
);

create table if not exists public.ac_capital_radar_opportunities (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  opportunity_type text not null,
  country text,
  region text,
  amount_min numeric,
  amount_max numeric,
  amount_range_label text,
  currency_label text not null default 'Dh',
  deadline date,
  deadline_label text,
  deadline_heat text not null default 'unknown' check (deadline_heat in ('cold','watch','warm','hot','critical','unknown')),
  source_id uuid references public.ac_capital_radar_sources(id) on delete set null,
  source_url text,
  source_name text,
  source_confidence integer not null default 50 check (source_confidence between 0 and 100),
  eligibility_preview text,
  angelcare_relevance_preview text,
  detected_by text not null default 'AC Capital Research Adapter',
  why_captured text,
  status text not null default 'detected' check (status in ('detected','watchlist','source-review','ready-for-qualification','duplicate','rejected')),
  handoff_status text not null default 'not-ready' check (handoff_status in ('not-ready','ready-for-qualification','needs-human-confirmation','blocked-missing-source','blocked-missing-deadline')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ac_capital_radar_opportunity_tags (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references public.ac_capital_radar_opportunities(id) on delete cascade,
  tag text not null,
  tag_type text not null default 'detected_keyword',
  created_at timestamptz not null default now(),
  unique(opportunity_id, tag, tag_type)
);

create table if not exists public.ac_capital_radar_handoff_queue (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references public.ac_capital_radar_opportunities(id) on delete cascade,
  target_workspace text not null default 'qualification-engine',
  handoff_status text not null default 'pending',
  coordinator_instruction text,
  created_by text default 'ai-system',
  reviewed_by text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ac_capital_radar_opportunities_status_idx on public.ac_capital_radar_opportunities(status);
create index if not exists ac_capital_radar_opportunities_heat_idx on public.ac_capital_radar_opportunities(deadline_heat);
create index if not exists ac_capital_radar_opportunities_region_idx on public.ac_capital_radar_opportunities(region);
create index if not exists ac_capital_radar_handoff_queue_status_idx on public.ac_capital_radar_handoff_queue(handoff_status);
