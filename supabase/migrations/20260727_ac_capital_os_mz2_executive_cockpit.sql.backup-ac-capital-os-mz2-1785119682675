-- AC CAPITAL OS - Mega Ultra ZIP 02
-- Capital Executive Cockpit foundation tables for readiness, metrics, command plan, AI-prepared actions and dashboard snapshots.

create table if not exists public.ac_capital_executive_snapshots (
  id uuid primary key default gen_random_uuid(),
  snapshot_date date not null default current_date,
  readiness_score numeric(5,2) not null default 0,
  active_routes_count integer not null default 0,
  ai_actions_count integer not null default 0,
  deadline_risks_count integer not null default 0,
  document_blockers_count integer not null default 0,
  pipeline_value_label text not null default '0 Dh',
  morocco_routes_count integer not null default 0,
  international_routes_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ac_capital_command_priorities (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  instruction text not null,
  owner text not null,
  priority text not null check (priority in ('critical', 'high', 'medium', 'low')),
  due_at timestamptz,
  status text not null default 'open' check (status in ('open', 'in_progress', 'blocked', 'done', 'cancelled')),
  source text not null default 'executive-cockpit',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ac_capital_ai_prepared_actions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  opportunity_label text not null,
  readiness_summary text not null,
  human_action text not null,
  risk_level text not null check (risk_level in ('low', 'medium', 'high', 'critical')),
  status text not null default 'awaiting_human_review' check (status in ('awaiting_human_review', 'approved', 'revision_requested', 'executed', 'archived')),
  deadline_label text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ac_capital_document_blockers (
  id uuid primary key default gen_random_uuid(),
  document_title text not null,
  needed_for text not null,
  owner text not null,
  status text not null default 'missing',
  risk_level text not null default 'medium' check (risk_level in ('low', 'medium', 'high', 'critical')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ac_capital_deadline_risks (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  deadline_at timestamptz,
  deadline_label text not null,
  status text not null,
  risk_level text not null check (risk_level in ('low', 'medium', 'high', 'critical')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ac_capital_command_priorities_status_idx on public.ac_capital_command_priorities(status, priority);
create index if not exists ac_capital_ai_prepared_actions_status_idx on public.ac_capital_ai_prepared_actions(status, risk_level);
create index if not exists ac_capital_document_blockers_owner_idx on public.ac_capital_document_blockers(owner, risk_level);
create index if not exists ac_capital_deadline_risks_level_idx on public.ac_capital_deadline_risks(risk_level, deadline_at);
