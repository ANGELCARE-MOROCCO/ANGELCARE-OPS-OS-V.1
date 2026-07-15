-- HR Mega 03 Attendance Architecture - SAFE EXISTING TABLES VERSION
-- Purpose: normalize attendance event tables without deleting existing data.

create extension if not exists pgcrypto;

create table if not exists public.app_attendance_logs (
  id uuid primary key default gen_random_uuid()
);

alter table public.app_attendance_logs
  add column if not exists user_id uuid null,
  add column if not exists staff_id uuid null,
  add column if not exists source text not null default 'overhead_panel',
  add column if not exists event_type text not null default 'punch_in',
  add column if not exists event_at timestamptz null,
  add column if not exists location_label text null,
  add column if not exists latitude numeric null,
  add column if not exists longitude numeric null,
  add column if not exists device_fingerprint text null,
  add column if not exists note text null,
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists created_at timestamptz not null default now();

-- Backfill event_at from whichever legacy timestamp exists.
do $$
begin
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='app_attendance_logs' and column_name='timestamp') then
    execute 'update public.app_attendance_logs set event_at = coalesce(event_at, "timestamp"::timestamptz) where event_at is null';
  end if;

  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='app_attendance_logs' and column_name='punched_at') then
    execute 'update public.app_attendance_logs set event_at = coalesce(event_at, punched_at::timestamptz) where event_at is null';
  end if;

  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='app_attendance_logs' and column_name='created_at') then
    execute 'update public.app_attendance_logs set event_at = coalesce(event_at, created_at::timestamptz) where event_at is null';
  end if;
end $$;

update public.app_attendance_logs set event_at = now() where event_at is null;
alter table public.app_attendance_logs alter column event_at set default now();
alter table public.app_attendance_logs alter column event_at set not null;

create table if not exists public.hr_attendance_records (
  id uuid primary key default gen_random_uuid()
);

alter table public.hr_attendance_records
  add column if not exists user_id uuid null,
  add column if not exists staff_id uuid null,
  add column if not exists work_date date null,
  add column if not exists punch_in_at timestamptz null,
  add column if not exists punch_out_at timestamptz null,
  add column if not exists total_minutes integer not null default 0,
  add column if not exists overtime_minutes integer not null default 0,
  add column if not exists late_minutes integer not null default 0,
  add column if not exists status text not null default 'open',
  add column if not exists source text not null default 'sync_engine',
  add column if not exists exceptions jsonb not null default '[]'::jsonb,
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

update public.hr_attendance_records
set work_date = coalesce(work_date, punch_in_at::date, punch_out_at::date, created_at::date, current_date)
where work_date is null;

alter table public.hr_attendance_records alter column work_date set default current_date;
alter table public.hr_attendance_records alter column work_date set not null;

-- Indexes created after columns are guaranteed to exist.
create index if not exists idx_app_attendance_logs_user_event on public.app_attendance_logs(user_id, event_at);
create index if not exists idx_app_attendance_logs_staff_event on public.app_attendance_logs(staff_id, event_at);
create index if not exists idx_hr_attendance_records_user_date on public.hr_attendance_records(user_id, work_date);
create index if not exists idx_hr_attendance_records_staff_date on public.hr_attendance_records(staff_id, work_date);

-- Avoid duplicate daily user records where possible. This is safer than adding a hard unique constraint that may fail on legacy duplicates.
create unique index if not exists uq_hr_attendance_records_user_work_date
on public.hr_attendance_records(user_id, work_date)
where user_id is not null;
