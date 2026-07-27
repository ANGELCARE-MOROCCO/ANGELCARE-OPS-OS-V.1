create extension if not exists pgcrypto;

create table if not exists public.ac_capital_live_wiring_status (
  id uuid primary key default gen_random_uuid(),
  workspace text not null,
  api_route text,
  data_mode text not null default 'seeded-fallback',
  source text not null default 'seeded',
  supabase_read_enabled boolean not null default false,
  supabase_write_enabled boolean not null default false,
  ai_provider_mode text not null default 'dry-run',
  storage_status text not null default 'not_configured',
  report_status text not null default 'foundation',
  automation_gate_status text not null default 'manual-safe',
  approval_guard_status text not null default 'active',
  qa_status text not null default 'pending',
  last_checked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ac_capital_runtime_feature_flags (
  id uuid primary key default gen_random_uuid(),
  flag_key text not null unique,
  flag_value text not null,
  description text,
  risk_level text,
  requires_founder_approval boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ac_capital_report_exports (
  id uuid primary key default gen_random_uuid(),
  report_type text not null,
  format text not null default 'markdown',
  status text not null default 'Generated',
  output_reference text,
  metadata jsonb not null default '{}'::jsonb,
  generated_by text,
  created_at timestamptz not null default now()
);

create table if not exists public.ac_capital_storage_objects (
  id uuid primary key default gen_random_uuid(),
  bucket text not null default 'ac-capital-data-room',
  storage_path text not null,
  original_filename text,
  mime_type text,
  file_size_bytes bigint,
  sensitivity text not null default 'Internal',
  owner text,
  package_category text,
  founder_approval_required boolean not null default false,
  signed_url_created boolean not null default false,
  status text not null default 'metadata-created',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ac_capital_automation_gate_events (
  id uuid primary key default gen_random_uuid(),
  gate_type text not null,
  status text not null default 'Logged',
  approval_status text,
  proof_reference text,
  metadata jsonb not null default '{}'::jsonb,
  actor text,
  created_at timestamptz not null default now()
);

create table if not exists public.ac_capital_provider_execution_logs (
  id uuid primary key default gen_random_uuid(),
  provider_authority text not null default '/ai-provider-control',
  module_key text not null default 'ac_capital_os',
  agent_key text,
  execution_mode text not null default 'dry-run',
  provider_mode text not null default 'provider-control',
  live_run_allowed boolean not null default false,
  request_payload jsonb,
  response_payload jsonb,
  status text not null default 'dry-run',
  warning text,
  created_at timestamptz not null default now()
);

create table if not exists public.ac_capital_production_qa_runs (
  id uuid primary key default gen_random_uuid(),
  qa_name text not null,
  status text not null,
  checked_items text[] not null default '{}',
  failures text[] not null default '{}',
  warnings text[] not null default '{}',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.ac_capital_live_wiring_status enable row level security;
alter table public.ac_capital_runtime_feature_flags enable row level security;
alter table public.ac_capital_report_exports enable row level security;
alter table public.ac_capital_storage_objects enable row level security;
alter table public.ac_capital_automation_gate_events enable row level security;
alter table public.ac_capital_provider_execution_logs enable row level security;
alter table public.ac_capital_production_qa_runs enable row level security;
