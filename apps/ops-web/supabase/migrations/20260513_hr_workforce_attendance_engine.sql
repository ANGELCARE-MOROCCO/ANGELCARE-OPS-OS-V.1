alter table if exists public.hr_attendance_records
  add column if not exists staff_id uuid null,
  add column if not exists user_id uuid null,
  add column if not exists work_date date null,
  add column if not exists punch_in_at timestamptz null,
  add column if not exists punch_out_at timestamptz null,
  add column if not exists validation_status text default 'pending',
  add column if not exists status text default 'recorded',
  add column if not exists source text default 'hr',
  add column if not exists updated_at timestamptz default now();

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

create index if not exists idx_hr_attendance_staff_date on public.hr_attendance_records(staff_id, work_date);
create index if not exists idx_hr_attendance_user_date on public.hr_attendance_records(user_id, work_date);
create index if not exists idx_app_attendance_logs_staff on public.app_attendance_logs(staff_id);
create index if not exists idx_app_attendance_logs_user on public.app_attendance_logs(user_id);
