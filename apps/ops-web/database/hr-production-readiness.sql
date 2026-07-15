-- AngelCare HR production readiness compatibility migration
-- Idempotent. It only creates missing HR operational tables used by visible HR workflows.

create extension if not exists pgcrypto;

create table if not exists public.hr_staff_profiles (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  name text,
  first_name text,
  last_name text,
  email text unique,
  phone text,
  department text,
  position text,
  job_title text,
  role text,
  manager text,
  location text,
  city text,
  employment_status text default 'Active',
  status text default 'active',
  employment_type text,
  start_date date,
  notes text,
  source text default 'hr-production-readiness',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.hr_roster_shifts (
  id uuid primary key default gen_random_uuid(),
  title text default 'Scheduled shift',
  employee_id uuid,
  employee_name text,
  department text,
  role text,
  location text,
  city text,
  shift_date date not null default current_date,
  date date,
  start_time text default '09:00',
  end_time text default '17:00',
  break_minutes integer default 0,
  status text default 'scheduled',
  notes text,
  source text default 'hr-production-readiness',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.hr_onboarding_tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  employee_id uuid,
  employee_name text,
  owner text,
  assigned_to text,
  department text,
  due_date date,
  status text default 'pending',
  completed boolean default false,
  progress integer default 0,
  notes text,
  source text default 'hr-production-readiness',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.hr_leave_requests (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid,
  employee_name text,
  leave_type text default 'Annual Leave',
  type text,
  start_date date,
  end_date date,
  duration_days numeric default 1,
  status text default 'pending',
  manager text,
  reason text,
  notes text,
  source text default 'hr-production-readiness',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.hr_documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  document_name text,
  employee_id uuid,
  employee_name text,
  document_type text default 'Employee File',
  type text,
  expiry_date date,
  status text default 'active',
  signature_status text default 'pending',
  compliance_status text default 'under_review',
  url text,
  notes text,
  source text default 'hr-production-readiness',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.hr_settings (
  id uuid primary key default gen_random_uuid(),
  key text not null,
  value jsonb,
  status text default 'active',
  source text default 'hr-production-readiness',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.hr_audit_logs (
  id uuid primary key default gen_random_uuid(),
  module text default 'hr',
  source text,
  action text,
  status text,
  title text,
  description text,
  entity_type text,
  entity_id uuid,
  created_at timestamptz default now()
);

create index if not exists hr_staff_profiles_status_idx on public.hr_staff_profiles(status);
create index if not exists hr_staff_profiles_department_idx on public.hr_staff_profiles(department);
create index if not exists hr_roster_shifts_date_idx on public.hr_roster_shifts(shift_date);
create index if not exists hr_roster_shifts_employee_idx on public.hr_roster_shifts(employee_id);
create index if not exists hr_onboarding_tasks_status_idx on public.hr_onboarding_tasks(status);
create index if not exists hr_leave_requests_status_idx on public.hr_leave_requests(status);
create index if not exists hr_documents_status_idx on public.hr_documents(status);
create index if not exists hr_audit_logs_created_idx on public.hr_audit_logs(created_at desc);
