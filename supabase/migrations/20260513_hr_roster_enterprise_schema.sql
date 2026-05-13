create table if not exists public.hr_roster_assignments (
  id uuid primary key default gen_random_uuid(),
  title text default 'Shift',
  staff_id uuid null,
  user_id uuid null,
  staff_name text null,
  department text null,
  city text null,
  location text null,
  work_date date null,
  start_time time null,
  end_time time null,
  shift_type text default 'standard',
  status text default 'planned',
  repeat_rule text null,
  repeat_until date null,
  notes text null,
  deleted_at timestamptz null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table if exists public.hr_roster_assignments
  add column if not exists title text default 'Shift',
  add column if not exists staff_id uuid null,
  add column if not exists user_id uuid null,
  add column if not exists staff_name text null,
  add column if not exists department text null,
  add column if not exists city text null,
  add column if not exists location text null,
  add column if not exists work_date date null,
  add column if not exists start_time time null,
  add column if not exists end_time time null,
  add column if not exists shift_type text default 'standard',
  add column if not exists status text default 'planned',
  add column if not exists repeat_rule text null,
  add column if not exists repeat_until date null,
  add column if not exists notes text null,
  add column if not exists deleted_at timestamptz null,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

create table if not exists public.hr_shift_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  shift_type text default 'standard',
  start_time time null,
  end_time time null,
  department text null,
  city text null,
  default_notes text null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.hr_roster_conflicts (
  id uuid primary key default gen_random_uuid(),
  roster_id uuid null,
  staff_id uuid null,
  conflict_type text not null,
  severity text default 'warning',
  status text default 'open',
  description text null,
  created_at timestamptz default now(),
  resolved_at timestamptz null
);

create index if not exists idx_hr_roster_assignments_staff on public.hr_roster_assignments(staff_id);
create index if not exists idx_hr_roster_assignments_date on public.hr_roster_assignments(work_date);
create index if not exists idx_hr_roster_assignments_status on public.hr_roster_assignments(status);
