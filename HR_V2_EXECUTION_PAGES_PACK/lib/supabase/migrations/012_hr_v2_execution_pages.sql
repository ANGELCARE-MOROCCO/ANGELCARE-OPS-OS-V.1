-- HR V2 Execution Pages compatibility migration
-- Safe: no drops, no destructive schema rewrite.
create extension if not exists pgcrypto;

create table if not exists public.hr_replacement_requests (
  id uuid primary key default gen_random_uuid(),
  absent_user_id uuid,
  replacement_user_id uuid,
  roster_id uuid,
  shift_date date,
  reason text,
  urgency text default 'normal',
  status text default 'open',
  notes text,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hr_payroll_preparation (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  payroll_month date,
  base_salary numeric default 0,
  bonus numeric default 0,
  deduction numeric default 0,
  attendance_days numeric default 0,
  overtime_hours numeric default 0,
  status text default 'draft',
  notes text,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hr_audit_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  actor_user_id uuid,
  module text,
  action text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.hr_positions add column if not exists permissions text[] default '{}';
alter table public.hr_positions add column if not exists active boolean not null default true;
alter table public.hr_positions add column if not exists updated_at timestamptz not null default now();

alter table public.hr_staff_profiles add column if not exists manager_user_id uuid;
alter table public.hr_staff_profiles add column if not exists start_date date;
alter table public.hr_staff_profiles add column if not exists probation_end_date date;
alter table public.hr_staff_profiles add column if not exists salary_base numeric;
alter table public.hr_staff_profiles add column if not exists payroll_code text;
alter table public.hr_staff_profiles add column if not exists notes text;
alter table public.hr_staff_profiles add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.hr_staff_profiles add column if not exists updated_at timestamptz not null default now();

alter table public.hr_rosters add column if not exists location text;
alter table public.hr_rosters add column if not exists status text default 'scheduled';
alter table public.hr_rosters add column if not exists duty_type text default 'standard';
alter table public.hr_rosters add column if not exists notes text;
alter table public.hr_rosters add column if not exists created_by uuid;
alter table public.hr_rosters add column if not exists updated_at timestamptz not null default now();

alter table public.hr_leave_requests add column if not exists coverage_impact text;
alter table public.hr_leave_requests add column if not exists reviewed_by uuid;
alter table public.hr_leave_requests add column if not exists reviewed_at timestamptz;
alter table public.hr_leave_requests add column if not exists created_by uuid;
alter table public.hr_leave_requests add column if not exists updated_at timestamptz not null default now();

alter table public.hr_staff_documents add column if not exists document_type text;
alter table public.hr_staff_documents add column if not exists status text default 'missing';
alter table public.hr_staff_documents add column if not exists expires_at date;
alter table public.hr_staff_documents add column if not exists verified_by uuid;
alter table public.hr_staff_documents add column if not exists verified_at timestamptz;
alter table public.hr_staff_documents add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.hr_staff_documents add column if not exists updated_at timestamptz not null default now();

alter table public.hr_staff_notifications add column if not exists title text;
alter table public.hr_staff_notifications add column if not exists status text default 'active';
alter table public.hr_staff_notifications add column if not exists created_by uuid;
alter table public.hr_staff_notifications add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.hr_staff_notifications add column if not exists updated_at timestamptz not null default now();
