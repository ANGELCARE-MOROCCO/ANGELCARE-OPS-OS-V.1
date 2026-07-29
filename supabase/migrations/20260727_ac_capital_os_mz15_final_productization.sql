create extension if not exists pgcrypto;

create table if not exists public.ac_capital_mz15_setting_change_requests (
  id uuid primary key default gen_random_uuid(),
  setting_key text not null,
  current_value text,
  requested_value text,
  reason text not null,
  risk_level text not null default 'Medium',
  requested_by text,
  approval_status text not null default 'Pending Review',
  decided_by text,
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ac_capital_mz15_sop_progress (
  id uuid primary key default gen_random_uuid(),
  sop_id text not null,
  sop_title text not null,
  user_id text,
  user_name text,
  status text not null default 'In Progress',
  completed_steps text[] not null default '{}',
  evidence_reference text,
  escalation_note text,
  reviewed_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ac_capital_mz15_browser_acceptance_runs (
  id uuid primary key default gen_random_uuid(),
  route text not null,
  status text not null,
  page_loaded boolean not null default false,
  api_resolved boolean not null default false,
  primary_action_tested boolean not null default false,
  modal_tested boolean not null default false,
  drawer_tested boolean not null default false,
  keyboard_tested boolean not null default false,
  responsive_tested boolean not null default false,
  response_status integer,
  primary_api_state text,
  primary_action_state text,
  drawer_state text,
  keyboard_state text,
  responsive_state text,
  screenshot_path text,
  evidence jsonb not null default '{}'::jsonb,
  console_errors text[] not null default '{}',
  notes text,
  tested_by text,
  tested_at timestamptz not null default now()
);

create table if not exists public.ac_capital_mz15_ui_audit_events (
  id uuid primary key default gen_random_uuid(),
  actor text,
  workspace text not null,
  action text not null,
  object_type text,
  object_id text,
  result text,
  proof_reference text,
  approval_status text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.ac_capital_mz15_setting_change_requests enable row level security;
alter table public.ac_capital_mz15_sop_progress enable row level security;
alter table public.ac_capital_mz15_browser_acceptance_runs enable row level security;
alter table public.ac_capital_mz15_ui_audit_events enable row level security;

create index if not exists ac_capital_mz15_setting_change_requests_status_idx on public.ac_capital_mz15_setting_change_requests(approval_status);
create index if not exists ac_capital_mz15_sop_progress_user_idx on public.ac_capital_mz15_sop_progress(user_id, status);
create index if not exists ac_capital_mz15_browser_acceptance_route_idx on public.ac_capital_mz15_browser_acceptance_runs(route, tested_at desc);
create index if not exists ac_capital_mz15_ui_audit_workspace_idx on public.ac_capital_mz15_ui_audit_events(workspace, created_at desc);
