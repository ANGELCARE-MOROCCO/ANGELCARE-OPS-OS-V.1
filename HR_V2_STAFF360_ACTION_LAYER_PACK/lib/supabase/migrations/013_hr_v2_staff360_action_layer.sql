-- HR V2 Staff 360 + Action Layer compatibility migration
-- Safe additive migration. Does not drop existing HR architecture.

create extension if not exists pgcrypto;

create table if not exists public.hr_action_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  action_type text not null,
  title text,
  status text not null default 'draft',
  priority text default 'medium',
  payload jsonb not null default '{}'::jsonb,
  assigned_to uuid,
  due_at timestamptz,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hr_onboarding_checklists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  stage text not null default 'intake',
  checklist jsonb not null default '[]'::jsonb,
  status text not null default 'open',
  owner_user_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hr_roster_patterns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  department text,
  duty_type text default 'standard',
  start_time time,
  end_time time,
  days text[] default '{}',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.hr_staff_profiles add column if not exists full_name text;
alter table public.hr_staff_profiles add column if not exists phone text;
alter table public.hr_staff_profiles add column if not exists emergency_contact text;
alter table public.hr_staff_profiles add column if not exists profile_status text default 'incomplete';
alter table public.hr_staff_profiles add column if not exists readiness_score int default 0;
alter table public.hr_staff_profiles add column if not exists updated_at timestamptz not null default now();

alter table public.hr_rosters add column if not exists coverage_status text default 'covered';
alter table public.hr_rosters add column if not exists shift_code text;
alter table public.hr_rosters add column if not exists department text;
alter table public.hr_rosters add column if not exists supervisor_user_id uuid;

create index if not exists hr_action_events_user_idx on public.hr_action_events(user_id);
create index if not exists hr_rosters_user_shift_idx on public.hr_rosters(user_id, shift_date);
create index if not exists hr_staff_profiles_department_idx on public.hr_staff_profiles(department);
