-- SALES MODULE V30 PACK 7 — GOVERNANCE RELIABILITY
-- Safe additive migration. Does not alter existing sales tables.

create table if not exists public.sales_execution_rules (
  id uuid primary key default gen_random_uuid(),
  rule_name text not null,
  trigger_condition text not null,
  control_action text not null,
  owner_role text not null default 'sales_manager',
  severity text not null default 'medium',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.sales_approval_lanes (
  id uuid primary key default gen_random_uuid(),
  lane_name text not null,
  requester_role text not null,
  approver_role text not null,
  required_when text not null,
  expected_result text not null,
  max_delay_minutes integer not null default 120,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.sales_sla_command_timers (
  id uuid primary key default gen_random_uuid(),
  lead_temperature text not null,
  first_response_minutes integer not null,
  next_action_minutes integer not null,
  escalation_rule text not null,
  owner_role text not null default 'team_lead',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.sales_agent_task_discipline (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid,
  deal_id uuid,
  next_action text not null,
  expected_outcome text,
  deadline_at timestamptz,
  quality_status text not null default 'pending',
  supervisor_note text,
  created_at timestamptz not null default now()
);

create table if not exists public.sales_escalation_matrix (
  id uuid primary key default gen_random_uuid(),
  risk_name text not null,
  escalation_level text not null,
  response_action text not null,
  max_delay_minutes integer not null default 240,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.sales_permission_controls (
  id uuid primary key default gen_random_uuid(),
  permission_name text not null,
  allowed_roles text[] not null default '{}',
  restriction_rule text not null,
  requires_audit boolean not null default true,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.sales_deal_quality_gates (
  id uuid primary key default gen_random_uuid(),
  gate_name text not null,
  pass_condition text not null,
  failure_action text not null,
  gate_order integer not null default 1,
  is_required boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.sales_supervisor_control_events (
  id uuid primary key default gen_random_uuid(),
  event_zone text not null,
  command_action text not null,
  expected_output text,
  owner_id uuid,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists idx_sales_execution_rules_active on public.sales_execution_rules(is_active);
create index if not exists idx_sales_approval_lanes_active on public.sales_approval_lanes(is_active);
create index if not exists idx_sales_sla_command_timers_temperature on public.sales_sla_command_timers(lead_temperature);
create index if not exists idx_sales_agent_task_discipline_deadline on public.sales_agent_task_discipline(deadline_at, quality_status);
create index if not exists idx_sales_supervisor_control_events_status on public.sales_supervisor_control_events(status, created_at);
