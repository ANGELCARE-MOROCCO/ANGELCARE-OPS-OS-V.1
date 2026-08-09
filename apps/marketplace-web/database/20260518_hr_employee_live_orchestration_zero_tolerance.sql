-- HR Employee Live Orchestration Layer
-- Safe/idempotent migration for Add Employee live save + cross-module sync.
-- Run in Supabase SQL editor before production use.

create extension if not exists pgcrypto;

create table if not exists public.hr_staff_profiles (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid,
  first_name text,
  last_name text,
  preferred_name text,
  full_name text,
  name text,
  display_name text,
  email text,
  work_email text,
  phone text,
  mobile text,
  national_id text,
  cin text,
  date_of_birth date,
  place_of_birth text,
  nationality text default 'Moroccan',
  gender text,
  marital_status text,
  children_count integer default 0,
  address text,
  city text,
  postal_code text,
  country text default 'Morocco',
  branch_office text,
  office text,
  location text,
  work_city text,
  remote_option text,
  work_type text,
  position text,
  job_title text,
  department text,
  manager text,
  reports_to text,
  employment_status text default 'active',
  status text default 'active',
  employment_type text,
  start_date date,
  hire_date date,
  probation_end_date date,
  contract_type text,
  salary numeric,
  base_salary numeric,
  currency text default 'MAD',
  payment_method text,
  cnss_number text,
  amo_number text,
  emergency_contact_name text,
  emergency_contact_phone text,
  emergency_contact_relation text,
  onboarding_status text default 'pending',
  create_login_account boolean default false,
  send_welcome_email boolean default false,
  profile_completeness integer default 0,
  readiness_score integer default 0,
  risk_score integer default 0,
  source text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists hr_staff_profiles_email_idx on public.hr_staff_profiles(email);
create index if not exists hr_staff_profiles_department_idx on public.hr_staff_profiles(department);
create index if not exists hr_staff_profiles_status_idx on public.hr_staff_profiles(status);

alter table public.hr_staff_profiles add column if not exists profile_id uuid;
alter table public.hr_staff_profiles add column if not exists first_name text;
alter table public.hr_staff_profiles add column if not exists last_name text;
alter table public.hr_staff_profiles add column if not exists preferred_name text;
alter table public.hr_staff_profiles add column if not exists full_name text;
alter table public.hr_staff_profiles add column if not exists name text;
alter table public.hr_staff_profiles add column if not exists display_name text;
alter table public.hr_staff_profiles add column if not exists email text;
alter table public.hr_staff_profiles add column if not exists work_email text;
alter table public.hr_staff_profiles add column if not exists phone text;
alter table public.hr_staff_profiles add column if not exists mobile text;
alter table public.hr_staff_profiles add column if not exists national_id text;
alter table public.hr_staff_profiles add column if not exists cin text;
alter table public.hr_staff_profiles add column if not exists date_of_birth date;
alter table public.hr_staff_profiles add column if not exists place_of_birth text;
alter table public.hr_staff_profiles add column if not exists nationality text default 'Moroccan';
alter table public.hr_staff_profiles add column if not exists gender text;
alter table public.hr_staff_profiles add column if not exists marital_status text;
alter table public.hr_staff_profiles add column if not exists children_count integer default 0;
alter table public.hr_staff_profiles add column if not exists address text;
alter table public.hr_staff_profiles add column if not exists city text;
alter table public.hr_staff_profiles add column if not exists postal_code text;
alter table public.hr_staff_profiles add column if not exists country text default 'Morocco';
alter table public.hr_staff_profiles add column if not exists branch_office text;
alter table public.hr_staff_profiles add column if not exists office text;
alter table public.hr_staff_profiles add column if not exists location text;
alter table public.hr_staff_profiles add column if not exists work_city text;
alter table public.hr_staff_profiles add column if not exists remote_option text;
alter table public.hr_staff_profiles add column if not exists work_type text;
alter table public.hr_staff_profiles add column if not exists position text;
alter table public.hr_staff_profiles add column if not exists job_title text;
alter table public.hr_staff_profiles add column if not exists department text;
alter table public.hr_staff_profiles add column if not exists manager text;
alter table public.hr_staff_profiles add column if not exists reports_to text;
alter table public.hr_staff_profiles add column if not exists employment_status text default 'active';
alter table public.hr_staff_profiles add column if not exists status text default 'active';
alter table public.hr_staff_profiles add column if not exists employment_type text;
alter table public.hr_staff_profiles add column if not exists start_date date;
alter table public.hr_staff_profiles add column if not exists hire_date date;
alter table public.hr_staff_profiles add column if not exists probation_end_date date;
alter table public.hr_staff_profiles add column if not exists contract_type text;
alter table public.hr_staff_profiles add column if not exists salary numeric;
alter table public.hr_staff_profiles add column if not exists base_salary numeric;
alter table public.hr_staff_profiles add column if not exists currency text default 'MAD';
alter table public.hr_staff_profiles add column if not exists payment_method text;
alter table public.hr_staff_profiles add column if not exists cnss_number text;
alter table public.hr_staff_profiles add column if not exists amo_number text;
alter table public.hr_staff_profiles add column if not exists emergency_contact_name text;
alter table public.hr_staff_profiles add column if not exists emergency_contact_phone text;
alter table public.hr_staff_profiles add column if not exists emergency_contact_relation text;
alter table public.hr_staff_profiles add column if not exists onboarding_status text default 'pending';
alter table public.hr_staff_profiles add column if not exists create_login_account boolean default false;
alter table public.hr_staff_profiles add column if not exists send_welcome_email boolean default false;
alter table public.hr_staff_profiles add column if not exists profile_completeness integer default 0;
alter table public.hr_staff_profiles add column if not exists readiness_score integer default 0;
alter table public.hr_staff_profiles add column if not exists risk_score integer default 0;
alter table public.hr_staff_profiles add column if not exists source text;
alter table public.hr_staff_profiles add column if not exists created_at timestamptz default now();
alter table public.hr_staff_profiles add column if not exists updated_at timestamptz default now();

create table if not exists public.hr_contracts (id uuid primary key default gen_random_uuid(), employee_id uuid, staff_id uuid, profile_id uuid, employee_name text, contract_type text, type text, status text, start_date date, probation_end_date date, salary numeric, currency text default 'MAD', source text, created_at timestamptz default now(), updated_at timestamptz default now());
create table if not exists public.hr_documents (id uuid primary key default gen_random_uuid(), employee_id uuid, staff_id uuid, profile_id uuid, employee_name text, title text, document_type text, status text, file_name text, source text, created_at timestamptz default now(), updated_at timestamptz default now());
create table if not exists public.hr_employee_emergency_contacts (id uuid primary key default gen_random_uuid(), employee_id uuid, staff_id uuid, profile_id uuid, name text, phone text, relation text, is_primary boolean default true, source text, created_at timestamptz default now(), updated_at timestamptz default now());
create table if not exists public.hr_onboarding_tasks (id uuid primary key default gen_random_uuid(), employee_id uuid, staff_id uuid, profile_id uuid, title text, task text, status text, priority text, due_date date, source text, created_at timestamptz default now(), updated_at timestamptz default now());
create table if not exists public.hr_payroll_inputs (id uuid primary key default gen_random_uuid(), employee_id uuid, staff_id uuid, profile_id uuid, employee_name text, salary numeric, base_salary numeric, currency text default 'MAD', payment_method text, cnss_number text, amo_number text, status text, source text, created_at timestamptz default now(), updated_at timestamptz default now());
create table if not exists public.hr_attendance_profiles (id uuid primary key default gen_random_uuid(), employee_id uuid, staff_id uuid, profile_id uuid, employee_name text, schedule_name text, work_city text, branch_office text, status text, source text, created_at timestamptz default now(), updated_at timestamptz default now());
create table if not exists public.hr_performance_reviews (id uuid primary key default gen_random_uuid(), employee_id uuid, staff_id uuid, profile_id uuid, employee_name text, review_cycle text, status text, score numeric, due_date date, source text, created_at timestamptz default now(), updated_at timestamptz default now());
create table if not exists public.hr_training_records (id uuid primary key default gen_random_uuid(), employee_id uuid, staff_id uuid, profile_id uuid, employee_name text, training_name text, title text, status text, progress numeric default 0, source text, created_at timestamptz default now(), updated_at timestamptz default now());
create table if not exists public.hr_role_permission_assignments (id uuid primary key default gen_random_uuid(), employee_id uuid, staff_id uuid, profile_id uuid, employee_name text, role_name text, status text, source text, created_at timestamptz default now(), updated_at timestamptz default now());
create table if not exists public.hr_audit_logs (id uuid primary key default gen_random_uuid(), employee_id uuid, staff_id uuid, profile_id uuid, module text, action text, status text, title text, description text, entity_type text, source text, created_at timestamptz default now(), updated_at timestamptz default now());
create table if not exists public.hr_activity_timeline (id uuid primary key default gen_random_uuid(), employee_id uuid, staff_id uuid, profile_id uuid, module text, action text, status text, title text, description text, entity_type text, source text, created_at timestamptz default now(), updated_at timestamptz default now());
create table if not exists public.hr_sync_events (id uuid primary key default gen_random_uuid(), employee_id uuid, staff_id uuid, profile_id uuid, module text, event_type text, status text, payload jsonb default '{}'::jsonb, source text, created_at timestamptz default now(), updated_at timestamptz default now());

create or replace function public.hr_touch_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

do $$
declare t text;
begin
  foreach t in array array['hr_staff_profiles','hr_contracts','hr_documents','hr_employee_emergency_contacts','hr_onboarding_tasks','hr_payroll_inputs','hr_attendance_profiles','hr_performance_reviews','hr_training_records','hr_role_permission_assignments','hr_audit_logs','hr_activity_timeline','hr_sync_events'] loop
    execute format('drop trigger if exists %I_touch_updated_at on public.%I', t, t);
    execute format('create trigger %I_touch_updated_at before update on public.%I for each row execute function public.hr_touch_updated_at()', t, t);
  end loop;
end $$;
