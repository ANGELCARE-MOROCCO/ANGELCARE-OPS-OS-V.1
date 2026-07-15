create table if not exists public.hr_approvals (
  id uuid primary key default gen_random_uuid(),
  request_type text not null,
  entity_type text null,
  entity_id uuid null,
  requester_id uuid null,
  approver_id uuid null,
  status text not null default 'pending',
  priority text not null default 'normal',
  payload jsonb not null default '{}'::jsonb,
  decision_note text null,
  created_at timestamptz not null default now(),
  decided_at timestamptz null
);
create table if not exists public.hr_payroll_inputs (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid null,
  user_id uuid null,
  period_start date not null,
  period_end date not null,
  worked_minutes integer not null default 0,
  overtime_minutes integer not null default 0,
  absence_days numeric not null default 0,
  late_minutes integer not null default 0,
  status text not null default 'draft',
  source text not null default 'attendance_engine',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.hr_audit_log (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  entity_type text null,
  entity_id uuid null,
  actor_id uuid null,
  before jsonb null,
  after jsonb null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
