-- Attendance Enterprise Core Schema
-- Safe additive migration. Does not drop existing data.

create table if not exists public.app_attendance_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null,
  staff_id uuid null,
  event_type text not null,
  event_at timestamptz default now(),
  source text default 'overhead_panel',
  status text default 'recorded',
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

alter table if exists public.hr_attendance_records
  add column if not exists staff_id uuid null,
  add column if not exists user_id uuid null,
  add column if not exists profile_id uuid null,
  add column if not exists work_date date null,
  add column if not exists punch_in_at timestamptz null,
  add column if not exists punch_out_at timestamptz null,
  add column if not exists break_start_at timestamptz null,
  add column if not exists break_end_at timestamptz null,
  add column if not exists attendance_status text default 'pending',
  add column if not exists validation_status text default 'pending',
  add column if not exists source text default 'hr',
  add column if not exists location text null,
  add column if not exists shift_id uuid null,
  add column if not exists roster_id uuid null,
  add column if not exists payroll_status text default 'not_ready',
  add column if not exists overtime_minutes integer default 0,
  add column if not exists late_minutes integer default 0,
  add column if not exists total_minutes integer default 0,
  add column if not exists updated_at timestamptz default now();

create table if not exists public.hr_attendance_actions (
  id uuid primary key default gen_random_uuid(),
  attendance_id uuid null,
  staff_id uuid null,
  action_type text not null,
  status text default 'open',
  priority text default 'normal',
  notes text,
  payload jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.hr_attendance_corrections (
  id uuid primary key default gen_random_uuid(),
  attendance_id uuid null,
  staff_id uuid null,
  correction_type text not null,
  requested_value jsonb default '{}'::jsonb,
  status text default 'pending',
  reason text,
  created_at timestamptz default now(),
  resolved_at timestamptz null
);

create table if not exists public.hr_attendance_live_state (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid null,
  user_id uuid null,
  current_status text default 'not_in',
  last_event_type text,
  last_event_at timestamptz,
  current_attendance_id uuid null,
  source text default 'system',
  updated_at timestamptz default now()
);

create index if not exists idx_app_attendance_logs_staff on public.app_attendance_logs(staff_id);
create index if not exists idx_app_attendance_logs_user on public.app_attendance_logs(user_id);
create index if not exists idx_app_attendance_logs_event_at on public.app_attendance_logs(event_at);
create index if not exists idx_hr_attendance_staff_date on public.hr_attendance_records(staff_id, work_date);
create index if not exists idx_hr_attendance_user_date on public.hr_attendance_records(user_id, work_date);
create index if not exists idx_hr_attendance_status on public.hr_attendance_records(validation_status, attendance_status);
create index if not exists idx_hr_attendance_actions_status on public.hr_attendance_actions(status);
create index if not exists idx_hr_attendance_live_state_staff on public.hr_attendance_live_state(staff_id);
