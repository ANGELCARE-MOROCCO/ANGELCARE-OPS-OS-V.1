create table if not exists public.hr_workforce_actions (
  id uuid primary key default gen_random_uuid(),
  action_type text not null,
  staff_id uuid null,
  roster_id uuid null,
  attendance_id uuid null,
  priority text default 'normal',
  status text default 'open',
  notes text null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.hr_workforce_alerts (
  id uuid primary key default gen_random_uuid(),
  alert_type text not null,
  staff_id uuid null,
  roster_id uuid null,
  attendance_id uuid null,
  severity text default 'warning',
  status text default 'open',
  title text,
  description text,
  created_at timestamptz default now(),
  resolved_at timestamptz null
);

alter table if exists public.hr_staff_profiles
  add column if not exists full_name text,
  add column if not exists department text,
  add column if not exists position text,
  add column if not exists city text,
  add column if not exists user_id uuid null,
  add column if not exists employment_status text default 'active';

alter table if exists public.hr_attendance_records
  add column if not exists staff_id uuid null,
  add column if not exists user_id uuid null,
  add column if not exists work_date date null,
  add column if not exists punch_in_at timestamptz null,
  add column if not exists punch_out_at timestamptz null,
  add column if not exists validation_status text default 'pending',
  add column if not exists source text default 'hr';

alter table if exists public.hr_roster_assignments
  add column if not exists staff_id uuid null,
  add column if not exists staff_name text null,
  add column if not exists work_date date null,
  add column if not exists start_time time null,
  add column if not exists end_time time null,
  add column if not exists status text default 'planned',
  add column if not exists location text null,
  add column if not exists department text null,
  add column if not exists city text null;

create table if not exists public.app_attendance_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null,
  staff_id uuid null,
  event_type text not null,
  event_at timestamptz default now(),
  source text default 'overhead_panel',
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);
