-- AngelCare HR Attendance Sync Enterprise Patch
-- Safe patch: adds missing columns/tables without dropping existing data.

create extension if not exists pgcrypto;

create table if not exists public.app_attendance_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  action text not null,
  note text,
  created_at timestamptz not null default now()
);

alter table if exists public.app_attendance_logs add column if not exists staff_profile_id uuid;
alter table if exists public.app_attendance_logs add column if not exists source text default 'overhead_panel';
alter table if exists public.app_attendance_logs add column if not exists device_context jsonb default '{}'::jsonb;
alter table if exists public.app_attendance_logs add column if not exists attendance_date date generated always as ((created_at at time zone 'Africa/Casablanca')::date) stored;
alter table if exists public.app_attendance_logs add column if not exists ip_address text;
alter table if exists public.app_attendance_logs add column if not exists validation_status text default 'auto_accepted';

create table if not exists public.hr_attendance_records (
  id uuid primary key default gen_random_uuid(),
  staff_profile_id uuid,
  user_id uuid,
  staff_name text,
  attendance_date date not null default current_date,
  check_in timestamptz,
  check_out timestamptz,
  lunch_start timestamptz,
  lunch_end timestamptz,
  status text default 'present',
  validation_status text default 'auto_synced',
  source text default 'overhead_panel',
  total_minutes integer default 0,
  break_minutes integer default 0,
  overtime_minutes integer default 0,
  late_minutes integer default 0,
  missing_punch boolean default false,
  anomaly_reason text,
  correction_reason text,
  approved_by text,
  notes text,
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);

alter table if exists public.hr_attendance_records add column if not exists user_id uuid;
alter table if exists public.hr_attendance_records add column if not exists staff_profile_id uuid;
alter table if exists public.hr_attendance_records add column if not exists staff_name text;
alter table if exists public.hr_attendance_records add column if not exists attendance_date date default current_date;
alter table if exists public.hr_attendance_records add column if not exists check_in timestamptz;
alter table if exists public.hr_attendance_records add column if not exists check_out timestamptz;
alter table if exists public.hr_attendance_records add column if not exists lunch_start timestamptz;
alter table if exists public.hr_attendance_records add column if not exists lunch_end timestamptz;
alter table if exists public.hr_attendance_records add column if not exists source text default 'overhead_panel';
alter table if exists public.hr_attendance_records add column if not exists total_minutes integer default 0;
alter table if exists public.hr_attendance_records add column if not exists break_minutes integer default 0;
alter table if exists public.hr_attendance_records add column if not exists overtime_minutes integer default 0;
alter table if exists public.hr_attendance_records add column if not exists late_minutes integer default 0;
alter table if exists public.hr_attendance_records add column if not exists missing_punch boolean default false;
alter table if exists public.hr_attendance_records add column if not exists anomaly_reason text;
alter table if exists public.hr_attendance_records add column if not exists validation_status text default 'auto_synced';
alter table if exists public.hr_attendance_records add column if not exists updated_at timestamptz default now();
alter table if exists public.hr_attendance_records add column if not exists created_at timestamptz default now();

alter table if exists public.hr_staff_profiles add column if not exists user_id uuid;
alter table if exists public.hr_staff_profiles add column if not exists full_name text;
alter table if exists public.hr_staff_profiles add column if not exists department text;
alter table if exists public.hr_staff_profiles add column if not exists position text;
alter table if exists public.hr_staff_profiles add column if not exists employment_status text default 'active';

create unique index if not exists hr_attendance_records_user_day_idx
on public.hr_attendance_records (user_id, attendance_date)
where user_id is not null;

create index if not exists app_attendance_logs_user_date_idx
on public.app_attendance_logs (user_id, created_at desc);

create index if not exists hr_attendance_records_day_idx
on public.hr_attendance_records (attendance_date desc);

create or replace function public.hr_recalculate_attendance_record(record_id uuid)
returns void
language plpgsql
as $$
declare
  r record;
  work_minutes integer := 0;
  pause_minutes integer := 0;
  anomaly text := null;
  miss boolean := false;
begin
  select * into r from public.hr_attendance_records where id = record_id;
  if not found then return; end if;

  if r.check_in is not null and r.check_out is not null then
    work_minutes := greatest(0, floor(extract(epoch from (r.check_out - r.check_in)) / 60)::integer);
  end if;

  if r.lunch_start is not null and r.lunch_end is not null then
    pause_minutes := greatest(0, floor(extract(epoch from (r.lunch_end - r.lunch_start)) / 60)::integer);
  end if;

  if r.check_in is null or r.check_out is null then
    miss := true;
    anomaly := 'missing_clock_pair';
  elsif r.check_out < r.check_in then
    miss := true;
    anomaly := 'clock_out_before_clock_in';
  elsif work_minutes > 14 * 60 then
    anomaly := 'unusually_long_shift';
  end if;

  update public.hr_attendance_records
  set total_minutes = greatest(0, work_minutes - pause_minutes),
      break_minutes = pause_minutes,
      overtime_minutes = greatest(0, greatest(0, work_minutes - pause_minutes) - 8 * 60),
      missing_punch = miss,
      anomaly_reason = anomaly,
      status = case
        when miss then 'needs_review'
        when check_in is not null and check_out is null then 'in_progress'
        when check_in is not null and check_out is not null then 'completed'
        else coalesce(status, 'pending')
      end,
      updated_at = now()
  where id = record_id;
end;
$$;
