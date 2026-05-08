-- AngelCare HR Unified Module V1
create extension if not exists pgcrypto;

create table if not exists hr_departments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text unique,
  owner text,
  mission text,
  status text default 'active',
  headcount_target integer default 0,
  budget_owner text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists hr_positions (
  id uuid primary key default gen_random_uuid(),
  department_id uuid references hr_departments(id) on delete set null,
  title text not null,
  job_family text,
  level text,
  status text default 'active',
  headcount_target integer default 0,
  base_salary numeric default 0,
  required_skills text,
  responsibilities text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists hr_staff_profiles (
  id uuid primary key default gen_random_uuid(),
  app_user_id uuid null,
  full_name text not null,
  phone text,
  email text,
  city text,
  department text,
  position text,
  employment_status text default 'active',
  contract_type text,
  start_date date,
  emergency_contact text,
  skills text,
  certifications text,
  performance_notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists hr_opening_jobs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  department text,
  position text,
  city text,
  contract_type text,
  hiring_priority text default 'normal',
  status text default 'open',
  openings_count integer default 1,
  salary_min numeric default 0,
  salary_max numeric default 0,
  target_start_date date,
  required_skills text,
  mission_context text,
  approval_owner text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists hr_candidates (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text,
  email text,
  city text,
  source text,
  job_id uuid references hr_opening_jobs(id) on delete set null,
  desired_position text,
  pipeline_stage text default 'new',
  score integer default 0,
  expected_salary numeric default 0,
  availability_date date,
  interview_date date,
  decision text default 'pending',
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists hr_onboarding_cases (
  id uuid primary key default gen_random_uuid(),
  staff_profile_id uuid references hr_staff_profiles(id) on delete set null,
  candidate_id uuid references hr_candidates(id) on delete set null,
  full_name text not null,
  role text,
  department text,
  status text default 'planned',
  start_date date,
  contract_collected boolean default false,
  documents_collected boolean default false,
  training_assigned boolean default false,
  buddy_owner text,
  probation_end_date date,
  checklist text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists hr_rosters (
  id uuid primary key default gen_random_uuid(),
  staff_profile_id uuid references hr_staff_profiles(id) on delete set null,
  staff_name text not null,
  shift_date date not null,
  start_time text,
  end_time text,
  location text,
  area text,
  duty_type text,
  status text default 'planned',
  mission_ref text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists hr_attendance_records (
  id uuid primary key default gen_random_uuid(),
  staff_profile_id uuid references hr_staff_profiles(id) on delete set null,
  staff_name text not null,
  attendance_date date not null,
  check_in text,
  check_out text,
  status text default 'present',
  validation_status text default 'pending',
  correction_reason text,
  approved_by text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists hr_tasks (
  id uuid primary key default gen_random_uuid(),
  task_type text not null,
  title text not null,
  owner text,
  priority text default 'medium',
  status text default 'open',
  due_date date,
  related_module text,
  related_record_id text,
  description text,
  outcome text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists hr_activity_log (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid null,
  source_table text not null,
  record_id text,
  action text not null,
  details jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);



-- V1 idempotency guard: if a table existed from a previous partial run,
-- create table if not exists will not add missing columns, so we add them safely.
alter table hr_departments add column if not exists name text;
alter table hr_departments add column if not exists code text;
alter table hr_departments add column if not exists owner text;
alter table hr_departments add column if not exists mission text;
alter table hr_departments add column if not exists status text default 'active';
alter table hr_departments add column if not exists headcount_target integer default 0;
alter table hr_departments add column if not exists budget_owner text;
alter table hr_departments add column if not exists notes text;
alter table hr_departments add column if not exists created_at timestamptz default now();
alter table hr_departments add column if not exists updated_at timestamptz default now();

alter table hr_positions add column if not exists department_id uuid references hr_departments(id) on delete set null;
alter table hr_positions add column if not exists title text;
alter table hr_positions add column if not exists job_family text;
alter table hr_positions add column if not exists level text;
alter table hr_positions add column if not exists status text default 'active';
alter table hr_positions add column if not exists headcount_target integer default 0;
alter table hr_positions add column if not exists base_salary numeric default 0;
alter table hr_positions add column if not exists required_skills text;
alter table hr_positions add column if not exists responsibilities text;
alter table hr_positions add column if not exists notes text;
alter table hr_positions add column if not exists created_at timestamptz default now();
alter table hr_positions add column if not exists updated_at timestamptz default now();

alter table hr_staff_profiles add column if not exists app_user_id uuid null;
alter table hr_staff_profiles add column if not exists full_name text;
alter table hr_staff_profiles add column if not exists phone text;
alter table hr_staff_profiles add column if not exists email text;
alter table hr_staff_profiles add column if not exists city text;
alter table hr_staff_profiles add column if not exists department text;
alter table hr_staff_profiles add column if not exists position text;
alter table hr_staff_profiles add column if not exists employment_status text default 'active';
alter table hr_staff_profiles add column if not exists contract_type text;
alter table hr_staff_profiles add column if not exists start_date date;
alter table hr_staff_profiles add column if not exists emergency_contact text;
alter table hr_staff_profiles add column if not exists skills text;
alter table hr_staff_profiles add column if not exists certifications text;
alter table hr_staff_profiles add column if not exists performance_notes text;
alter table hr_staff_profiles add column if not exists created_at timestamptz default now();
alter table hr_staff_profiles add column if not exists updated_at timestamptz default now();

alter table hr_opening_jobs add column if not exists title text;
alter table hr_opening_jobs add column if not exists department text;
alter table hr_opening_jobs add column if not exists position text;
alter table hr_opening_jobs add column if not exists city text;
alter table hr_opening_jobs add column if not exists contract_type text;
alter table hr_opening_jobs add column if not exists hiring_priority text default 'normal';
alter table hr_opening_jobs add column if not exists status text default 'open';
alter table hr_opening_jobs add column if not exists openings_count integer default 1;
alter table hr_opening_jobs add column if not exists salary_min numeric default 0;
alter table hr_opening_jobs add column if not exists salary_max numeric default 0;
alter table hr_opening_jobs add column if not exists target_start_date date;
alter table hr_opening_jobs add column if not exists required_skills text;
alter table hr_opening_jobs add column if not exists mission_context text;
alter table hr_opening_jobs add column if not exists approval_owner text;
alter table hr_opening_jobs add column if not exists notes text;
alter table hr_opening_jobs add column if not exists created_at timestamptz default now();
alter table hr_opening_jobs add column if not exists updated_at timestamptz default now();

alter table hr_candidates add column if not exists full_name text;
alter table hr_candidates add column if not exists phone text;
alter table hr_candidates add column if not exists email text;
alter table hr_candidates add column if not exists city text;
alter table hr_candidates add column if not exists source text;
alter table hr_candidates add column if not exists job_id uuid references hr_opening_jobs(id) on delete set null;
alter table hr_candidates add column if not exists desired_position text;
alter table hr_candidates add column if not exists pipeline_stage text default 'new';
alter table hr_candidates add column if not exists score integer default 0;
alter table hr_candidates add column if not exists expected_salary numeric default 0;
alter table hr_candidates add column if not exists availability_date date;
alter table hr_candidates add column if not exists interview_date date;
alter table hr_candidates add column if not exists decision text default 'pending';
alter table hr_candidates add column if not exists notes text;
alter table hr_candidates add column if not exists created_at timestamptz default now();
alter table hr_candidates add column if not exists updated_at timestamptz default now();

alter table hr_onboarding_cases add column if not exists staff_profile_id uuid references hr_staff_profiles(id) on delete set null;
alter table hr_onboarding_cases add column if not exists candidate_id uuid references hr_candidates(id) on delete set null;
alter table hr_onboarding_cases add column if not exists full_name text;
alter table hr_onboarding_cases add column if not exists role text;
alter table hr_onboarding_cases add column if not exists department text;
alter table hr_onboarding_cases add column if not exists status text default 'planned';
alter table hr_onboarding_cases add column if not exists start_date date;
alter table hr_onboarding_cases add column if not exists contract_collected boolean default false;
alter table hr_onboarding_cases add column if not exists documents_collected boolean default false;
alter table hr_onboarding_cases add column if not exists training_assigned boolean default false;
alter table hr_onboarding_cases add column if not exists buddy_owner text;
alter table hr_onboarding_cases add column if not exists probation_end_date date;
alter table hr_onboarding_cases add column if not exists checklist text;
alter table hr_onboarding_cases add column if not exists notes text;
alter table hr_onboarding_cases add column if not exists created_at timestamptz default now();
alter table hr_onboarding_cases add column if not exists updated_at timestamptz default now();

alter table hr_rosters add column if not exists staff_profile_id uuid references hr_staff_profiles(id) on delete set null;
alter table hr_rosters add column if not exists staff_name text;
alter table hr_rosters add column if not exists shift_date date;
alter table hr_rosters add column if not exists start_time text;
alter table hr_rosters add column if not exists end_time text;
alter table hr_rosters add column if not exists location text;
alter table hr_rosters add column if not exists area text;
alter table hr_rosters add column if not exists duty_type text;
alter table hr_rosters add column if not exists status text default 'planned';
alter table hr_rosters add column if not exists mission_ref text;
alter table hr_rosters add column if not exists notes text;
alter table hr_rosters add column if not exists created_at timestamptz default now();
alter table hr_rosters add column if not exists updated_at timestamptz default now();

alter table hr_attendance_records add column if not exists staff_profile_id uuid references hr_staff_profiles(id) on delete set null;
alter table hr_attendance_records add column if not exists staff_name text;
alter table hr_attendance_records add column if not exists attendance_date date;
alter table hr_attendance_records add column if not exists check_in text;
alter table hr_attendance_records add column if not exists check_out text;
alter table hr_attendance_records add column if not exists status text default 'present';
alter table hr_attendance_records add column if not exists validation_status text default 'pending';
alter table hr_attendance_records add column if not exists correction_reason text;
alter table hr_attendance_records add column if not exists approved_by text;
alter table hr_attendance_records add column if not exists notes text;
alter table hr_attendance_records add column if not exists created_at timestamptz default now();
alter table hr_attendance_records add column if not exists updated_at timestamptz default now();

alter table hr_tasks add column if not exists task_type text;
alter table hr_tasks add column if not exists title text;
alter table hr_tasks add column if not exists owner text;
alter table hr_tasks add column if not exists priority text default 'medium';
alter table hr_tasks add column if not exists status text default 'open';
alter table hr_tasks add column if not exists due_date date;
alter table hr_tasks add column if not exists related_module text;
alter table hr_tasks add column if not exists related_record_id text;
alter table hr_tasks add column if not exists description text;
alter table hr_tasks add column if not exists outcome text;
alter table hr_tasks add column if not exists created_at timestamptz default now();
alter table hr_tasks add column if not exists updated_at timestamptz default now();

alter table hr_activity_log add column if not exists actor_user_id uuid null;
alter table hr_activity_log add column if not exists source_table text;
alter table hr_activity_log add column if not exists record_id text;
alter table hr_activity_log add column if not exists action text;
alter table hr_activity_log add column if not exists details jsonb default '{}'::jsonb;
alter table hr_activity_log add column if not exists created_at timestamptz default now();

create index if not exists idx_hr_jobs_status on hr_opening_jobs(status);
create index if not exists idx_hr_candidates_stage on hr_candidates(pipeline_stage);
create index if not exists idx_hr_onboarding_status on hr_onboarding_cases(status);
create index if not exists idx_hr_staff_status on hr_staff_profiles(employment_status);
create index if not exists idx_hr_rosters_shift_date on hr_rosters(shift_date);
create index if not exists idx_hr_attendance_date on hr_attendance_records(attendance_date);
create index if not exists idx_hr_tasks_status_due on hr_tasks(status, due_date);

insert into hr_departments (name, code, owner, mission, status, headcount_target, budget_owner, notes) values
('Operations', 'OPS', 'Operations Director', 'Field execution, caregiver planning, replacements and service quality.', 'active', 20, 'CEO', 'Core AngelCare delivery department'),
('Academy', 'ACAD', 'Academy Director', 'Training, certification, trainee readiness and trainer coordination.', 'active', 8, 'CEO', 'Professional training center business line'),
('Revenue', 'REV', 'Revenue Director', 'Sales, partnerships, institutional growth and client acquisition.', 'active', 10, 'CEO', 'Growth and market domination department'),
('Administration', 'ADMIN', 'Office Manager', 'Internal operations, documentation, compliance and support.', 'active', 6, 'CEO', 'Headquarter backbone')
on conflict (code) do nothing;
