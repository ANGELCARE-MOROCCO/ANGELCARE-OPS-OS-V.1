-- AngelCare HR Production Unified Schema
-- Safe to run multiple times. Creates missing core HR tables and compatibility views.
create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create table if not exists public.hr_departments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text unique,
  owner text,
  mission text,
  status text not null default 'active',
  headcount_target integer default 0,
  budget_owner text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hr_positions (
  id uuid primary key default gen_random_uuid(),
  department_id uuid references public.hr_departments(id) on delete set null,
  title text not null,
  job_family text,
  level text,
  status text not null default 'active',
  headcount_target integer default 0,
  base_salary numeric default 0,
  required_skills text,
  responsibilities text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hr_staff (
  id uuid primary key default gen_random_uuid(),
  app_user_id uuid,
  full_name text not null,
  phone text,
  email text,
  city text,
  department text,
  position text,
  employment_status text not null default 'active',
  contract_type text,
  start_date date,
  end_date date,
  emergency_contact text,
  skills text,
  certifications text,
  performance_notes text,
  compliance_status text not null default 'pending',
  mission_capacity integer default 0,
  hourly_cost numeric default 0,
  monthly_salary numeric default 0,
  source text default 'hr',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hr_job_openings (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  department text,
  position text,
  city text,
  contract_type text,
  hiring_priority text not null default 'normal',
  status text not null default 'open',
  openings_count integer not null default 1,
  salary_min numeric default 0,
  salary_max numeric default 0,
  target_start_date date,
  required_skills text,
  mission_context text,
  approval_owner text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hr_recruitment_candidates (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text,
  email text,
  city text,
  source text,
  job_id uuid references public.hr_job_openings(id) on delete set null,
  desired_position text,
  pipeline_stage text not null default 'new',
  score integer default 0,
  expected_salary numeric default 0,
  availability_date date,
  interview_date timestamptz,
  decision text not null default 'pending',
  notes text,
  converted_staff_id uuid references public.hr_staff(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hr_onboarding_cases (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid references public.hr_staff(id) on delete cascade,
  candidate_id uuid references public.hr_recruitment_candidates(id) on delete set null,
  full_name text,
  role text,
  department text,
  status text not null default 'planned',
  start_date date,
  probation_end_date date,
  buddy_owner text,
  checklist text,
  notes text,
  contract_collected boolean default false,
  documents_collected boolean default false,
  training_assigned boolean default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hr_staff_documents (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid references public.hr_staff(id) on delete cascade,
  document_type text not null,
  title text not null,
  file_url text,
  status text not null default 'missing',
  expiry_date date,
  owner text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hr_rosters (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid references public.hr_staff(id) on delete set null,
  staff_name text,
  shift_date date not null,
  start_time time,
  end_time time,
  location text,
  area text,
  duty_type text,
  mission_ref text,
  status text not null default 'planned',
  conflict_status text not null default 'clear',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hr_attendance (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid references public.hr_staff(id) on delete set null,
  staff_name text,
  attendance_date date not null,
  check_in time,
  check_out time,
  status text not null default 'present',
  validation_status text not null default 'pending',
  correction_reason text,
  approved_by text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hr_attendance_corrections (
  id uuid primary key default gen_random_uuid(),
  attendance_id uuid references public.hr_attendance(id) on delete cascade,
  staff_id uuid references public.hr_staff(id) on delete set null,
  requested_by text,
  requested_status text,
  requested_check_in time,
  requested_check_out time,
  reason text,
  approval_status text not null default 'pending',
  approved_by text,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hr_staff_performance_reviews (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid references public.hr_staff(id) on delete cascade,
  review_period text,
  reviewer text,
  score integer default 0,
  strengths text,
  risks text,
  next_actions text,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hr_approval_requests (
  id uuid primary key default gen_random_uuid(),
  request_type text not null,
  source_table text,
  source_record_id uuid,
  title text not null,
  requested_by text,
  approver text,
  status text not null default 'pending',
  decision_notes text,
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hr_execution_tasks (
  id uuid primary key default gen_random_uuid(),
  task_type text,
  title text not null,
  owner text,
  priority text not null default 'medium',
  status text not null default 'open',
  due_date date,
  related_module text,
  related_record_id uuid,
  related_staff_id uuid references public.hr_staff(id) on delete set null,
  description text,
  outcome text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hr_activity_log (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid,
  actor_label text,
  source_table text not null,
  record_id text,
  action text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.hr_sync_events (
  id uuid primary key default gen_random_uuid(),
  sync_type text not null,
  source_module text,
  target_module text,
  source_record_id text,
  status text not null default 'pending',
  payload jsonb not null default '{}'::jsonb,
  result jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  processed_at timestamptz
);

create table if not exists public.hr_data_quality_checks (
  id uuid primary key default gen_random_uuid(),
  check_key text not null,
  severity text not null default 'medium',
  title text not null,
  source_table text,
  source_record_id text,
  status text not null default 'open',
  recommendation text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table if not exists public.hr_service_requests (
  id uuid primary key default gen_random_uuid(),
  requester text,
  request_type text not null,
  title text not null,
  priority text not null default 'medium',
  status text not null default 'open',
  owner text,
  due_date date,
  description text,
  resolution text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hr_playbooks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text,
  owner text,
  status text not null default 'active',
  steps text,
  risk_controls text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hr_templates (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  template_type text,
  owner text,
  status text not null default 'active',
  content text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Compatibility views for previous naming used in your current code.
-- IMPORTANT: Some AngelCare builds already created these names as TABLES.
-- PostgreSQL cannot replace a table with a view, so this block only creates
-- compatibility views when the relation name does not already exist.
DO $$
BEGIN
  IF to_regclass('public.hr_staff_profiles') IS NULL THEN
    EXECUTE 'create view public.hr_staff_profiles as select * from public.hr_staff';
  END IF;

  IF to_regclass('public.hr_opening_jobs') IS NULL THEN
    EXECUTE 'create view public.hr_opening_jobs as select * from public.hr_job_openings';
  END IF;

  IF to_regclass('public.hr_candidates') IS NULL THEN
    EXECUTE 'create view public.hr_candidates as select * from public.hr_recruitment_candidates';
  END IF;

  IF to_regclass('public.hr_attendance_records') IS NULL THEN
    EXECUTE 'create view public.hr_attendance_records as select * from public.hr_attendance';
  END IF;

  IF to_regclass('public.hr_tasks') IS NULL THEN
    EXECUTE 'create view public.hr_tasks as select * from public.hr_execution_tasks';
  END IF;

  IF to_regclass('public.hr_onboarding_steps') IS NULL THEN
    EXECUTE 'create view public.hr_onboarding_steps as select * from public.hr_onboarding_cases';
  END IF;

  IF to_regclass('public.hr_onboarding_checklists') IS NULL THEN
    EXECUTE 'create view public.hr_onboarding_checklists as select * from public.hr_onboarding_cases';
  END IF;
END $$;



-- ============================================================
-- Existing-table hardening: CREATE TABLE IF NOT EXISTS does not
-- add missing columns when a table already exists. This section
-- safely adds every production HR column only when absent.
-- ============================================================

alter table if exists public.hr_departments
  add column if not exists name text,
  add column if not exists code text,
  add column if not exists owner text,
  add column if not exists mission text,
  add column if not exists status text default 'active',
  add column if not exists headcount_target integer default 0,
  add column if not exists budget_owner text,
  add column if not exists notes text,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

alter table if exists public.hr_positions
  add column if not exists department_id uuid,
  add column if not exists title text,
  add column if not exists job_family text,
  add column if not exists level text,
  add column if not exists status text default 'active',
  add column if not exists headcount_target integer default 0,
  add column if not exists base_salary numeric default 0,
  add column if not exists required_skills text,
  add column if not exists responsibilities text,
  add column if not exists notes text,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

alter table if exists public.hr_staff
  add column if not exists app_user_id uuid,
  add column if not exists full_name text,
  add column if not exists phone text,
  add column if not exists email text,
  add column if not exists city text,
  add column if not exists department text,
  add column if not exists position text,
  add column if not exists employment_status text default 'active',
  add column if not exists contract_type text,
  add column if not exists start_date date,
  add column if not exists end_date date,
  add column if not exists emergency_contact text,
  add column if not exists skills text,
  add column if not exists certifications text,
  add column if not exists performance_notes text,
  add column if not exists compliance_status text default 'pending',
  add column if not exists mission_capacity integer default 0,
  add column if not exists hourly_cost numeric default 0,
  add column if not exists monthly_salary numeric default 0,
  add column if not exists source text default 'hr',
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

alter table if exists public.hr_staff_profiles
  add column if not exists app_user_id uuid,
  add column if not exists full_name text,
  add column if not exists phone text,
  add column if not exists email text,
  add column if not exists city text,
  add column if not exists department text,
  add column if not exists position text,
  add column if not exists employment_status text default 'active',
  add column if not exists contract_type text,
  add column if not exists start_date date,
  add column if not exists end_date date,
  add column if not exists emergency_contact text,
  add column if not exists skills text,
  add column if not exists certifications text,
  add column if not exists performance_notes text,
  add column if not exists compliance_status text default 'pending',
  add column if not exists mission_capacity integer default 0,
  add column if not exists hourly_cost numeric default 0,
  add column if not exists monthly_salary numeric default 0,
  add column if not exists source text default 'hr',
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

alter table if exists public.hr_job_openings
  add column if not exists title text,
  add column if not exists department text,
  add column if not exists position text,
  add column if not exists city text,
  add column if not exists contract_type text,
  add column if not exists hiring_priority text default 'normal',
  add column if not exists status text default 'open',
  add column if not exists openings_count integer default 1,
  add column if not exists salary_min numeric default 0,
  add column if not exists salary_max numeric default 0,
  add column if not exists target_start_date date,
  add column if not exists required_skills text,
  add column if not exists mission_context text,
  add column if not exists approval_owner text,
  add column if not exists notes text,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

alter table if exists public.hr_opening_jobs
  add column if not exists title text,
  add column if not exists department text,
  add column if not exists position text,
  add column if not exists city text,
  add column if not exists contract_type text,
  add column if not exists hiring_priority text default 'normal',
  add column if not exists status text default 'open',
  add column if not exists openings_count integer default 1,
  add column if not exists salary_min numeric default 0,
  add column if not exists salary_max numeric default 0,
  add column if not exists target_start_date date,
  add column if not exists required_skills text,
  add column if not exists mission_context text,
  add column if not exists approval_owner text,
  add column if not exists notes text,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

alter table if exists public.hr_recruitment_candidates
  add column if not exists full_name text,
  add column if not exists phone text,
  add column if not exists email text,
  add column if not exists city text,
  add column if not exists source text,
  add column if not exists job_id uuid,
  add column if not exists desired_position text,
  add column if not exists pipeline_stage text default 'new',
  add column if not exists score integer default 0,
  add column if not exists expected_salary numeric default 0,
  add column if not exists availability_date date,
  add column if not exists interview_date timestamptz,
  add column if not exists decision text default 'pending',
  add column if not exists notes text,
  add column if not exists converted_staff_id uuid,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

alter table if exists public.hr_candidates
  add column if not exists full_name text,
  add column if not exists phone text,
  add column if not exists email text,
  add column if not exists city text,
  add column if not exists source text,
  add column if not exists job_id uuid,
  add column if not exists desired_position text,
  add column if not exists pipeline_stage text default 'new',
  add column if not exists score integer default 0,
  add column if not exists expected_salary numeric default 0,
  add column if not exists availability_date date,
  add column if not exists interview_date timestamptz,
  add column if not exists decision text default 'pending',
  add column if not exists notes text,
  add column if not exists converted_staff_id uuid,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

alter table if exists public.hr_attendance
  add column if not exists staff_id uuid,
  add column if not exists staff_name text,
  add column if not exists attendance_date date,
  add column if not exists check_in time,
  add column if not exists check_out time,
  add column if not exists status text default 'present',
  add column if not exists validation_status text default 'pending',
  add column if not exists correction_reason text,
  add column if not exists approved_by text,
  add column if not exists notes text,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

alter table if exists public.hr_attendance_records
  add column if not exists staff_id uuid,
  add column if not exists staff_name text,
  add column if not exists attendance_date date,
  add column if not exists check_in time,
  add column if not exists check_out time,
  add column if not exists status text default 'present',
  add column if not exists validation_status text default 'pending',
  add column if not exists correction_reason text,
  add column if not exists approved_by text,
  add column if not exists notes text,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

alter table if exists public.hr_rosters
  add column if not exists staff_id uuid,
  add column if not exists staff_name text,
  add column if not exists shift_date date,
  add column if not exists start_time time,
  add column if not exists end_time time,
  add column if not exists location text,
  add column if not exists area text,
  add column if not exists duty_type text,
  add column if not exists mission_ref text,
  add column if not exists status text default 'planned',
  add column if not exists conflict_status text default 'clear',
  add column if not exists notes text,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

-- Triggers
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'hr_departments','hr_positions','hr_staff','hr_job_openings','hr_recruitment_candidates','hr_onboarding_cases',
    'hr_staff_documents','hr_rosters','hr_attendance','hr_attendance_corrections','hr_staff_performance_reviews',
    'hr_approval_requests','hr_execution_tasks','hr_service_requests','hr_playbooks','hr_templates'
  ] LOOP
    EXECUTE format('drop trigger if exists trg_%I_updated_at on public.%I', t, t);
    EXECUTE format('create trigger trg_%I_updated_at before update on public.%I for each row execute function public.set_updated_at()', t, t);
  END LOOP;
END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='hr_staff' AND column_name='employment_status') THEN CREATE INDEX IF NOT EXISTS idx_hr_staff_status ON public.hr_staff(employment_status); END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='hr_staff' AND column_name='department') THEN CREATE INDEX IF NOT EXISTS idx_hr_staff_department ON public.hr_staff(department); END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='hr_recruitment_candidates' AND column_name='pipeline_stage') THEN CREATE INDEX IF NOT EXISTS idx_hr_candidates_stage ON public.hr_recruitment_candidates(pipeline_stage); END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='hr_attendance' AND column_name='attendance_date') THEN CREATE INDEX IF NOT EXISTS idx_hr_attendance_date ON public.hr_attendance(attendance_date); END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='hr_rosters' AND column_name='shift_date') THEN CREATE INDEX IF NOT EXISTS idx_hr_rosters_date ON public.hr_rosters(shift_date); END IF; END $$;
create index if not exists idx_hr_tasks_status on public.hr_execution_tasks(status);
create index if not exists idx_hr_approvals_status on public.hr_approval_requests(status);
