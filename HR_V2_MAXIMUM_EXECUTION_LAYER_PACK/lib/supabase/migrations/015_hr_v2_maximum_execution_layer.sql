-- HR V2 Maximum Execution Layer
-- Idempotent compatibility migration. Does not drop existing HR backbone.
create extension if not exists pgcrypto;

create table if not exists public.hr_execution_audit_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null default 'system',
  title text not null,
  description text,
  source_module text,
  source_table text,
  source_id uuid,
  user_id uuid,
  severity text default 'info',
  status text default 'open',
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hr_execution_action_queue (
  id uuid primary key default gen_random_uuid(),
  action_type text not null,
  title text not null,
  description text,
  assigned_to uuid,
  related_user_id uuid,
  priority text default 'medium',
  status text default 'pending',
  due_at timestamptz,
  source_module text,
  target_route text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hr_sync_control_snapshots (
  id uuid primary key default gen_random_uuid(),
  sync_date date not null default current_date,
  staff_count int default 0,
  roster_count int default 0,
  leave_count int default 0,
  notification_count int default 0,
  approval_count int default 0,
  mission_count int default 0,
  task_count int default 0,
  incident_count int default 0,
  attendance_count int default 0,
  health_score int default 75,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.hr_payroll_preparation_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  payroll_month date not null default date_trunc('month', now())::date,
  base_salary numeric default 0,
  attendance_days int default 0,
  absence_days int default 0,
  late_count int default 0,
  overtime_hours numeric default 0,
  bonus_amount numeric default 0,
  deduction_amount numeric default 0,
  status text default 'draft',
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hr_capacity_plans (
  id uuid primary key default gen_random_uuid(),
  plan_date date not null default current_date,
  department text,
  required_staff int default 0,
  scheduled_staff int default 0,
  available_staff int default 0,
  gap int generated always as (coalesce(required_staff,0) - coalesce(scheduled_staff,0)) stored,
  risk_level text default 'normal',
  action_plan text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hr_workflow_templates (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  title text not null,
  category text,
  trigger text,
  steps jsonb not null default '[]'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists hr_workflow_templates_code_unique on public.hr_workflow_templates(code);

insert into public.hr_workflow_templates(code, title, category, trigger, steps) values
('absence_to_replacement','Absence → Replacement → Client Continuity','Roster / Attendance','absence_reported','["Detect absence","Find replacement","Notify supervisor","Update roster","Log audit event"]'::jsonb),
('leave_approval_chain','Leave Request Approval Chain','Leave','leave_request_created','["HR review","Manager review","Coverage check","Approve or reject","Notify staff"]'::jsonb),
('new_staff_onboarding','New Staff Onboarding','Staff','staff_profile_created','["Create profile","Assign position","Assign documents","Assign training","Plan first roster"]'::jsonb),
('incident_corrective_action','Incident Corrective Action','Compliance','incident_created','["Classify severity","Assign owner","Investigate","Corrective action","Close with learning note"]'::jsonb),
('payroll_monthly_preparation','Monthly Payroll Preparation','Payroll','month_end','["Collect attendance","Collect leave","Calculate deductions","Validate bonuses","Export payroll prep"]'::jsonb)
on conflict(code) do update set
  title = excluded.title,
  category = excluded.category,
  trigger = excluded.trigger,
  steps = excluded.steps,
  updated_at = now();

-- Compatibility columns for existing backbone. Keep these safe and idempotent.
alter table if exists public.hr_staff_profiles add column if not exists employee_code text;
alter table if exists public.hr_staff_profiles add column if not exists phone text;
alter table if exists public.hr_staff_profiles add column if not exists emergency_contact text;
alter table if exists public.hr_staff_profiles add column if not exists work_location text;
alter table if exists public.hr_staff_profiles add column if not exists readiness_score int default 70;
alter table if exists public.hr_staff_profiles add column if not exists risk_level text default 'normal';

alter table if exists public.hr_rosters add column if not exists shift_label text;
alter table if exists public.hr_rosters add column if not exists coverage_status text default 'covered';
alter table if exists public.hr_rosters add column if not exists replacement_required boolean default false;

alter table if exists public.hr_staff_notifications add column if not exists priority text default 'normal';
alter table if exists public.hr_staff_notifications add column if not exists target_route text;

insert into public.hr_execution_audit_events(event_type,title,description,source_module,severity,status)
values ('migration','HR V2 Maximum Execution Layer installed','Premium execution, sync control, payroll prep and capacity layers added.','hr','success','closed');
