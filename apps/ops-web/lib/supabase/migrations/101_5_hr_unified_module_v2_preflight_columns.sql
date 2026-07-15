-- HR Unified Module V2 - Preflight Schema Stabilizer
-- Run this BEFORE rerunning 102_hr_unified_module_v2_execution_layer.sql
-- Purpose: add V2 columns safely when V1 tables already exist from a previous migration.

alter table if exists hr_recruitment_candidates
  add column if not exists stage text default 'new',
  add column if not exists pipeline_stage text default 'new',
  add column if not exists source text,
  add column if not exists score integer default 0,
  add column if not exists recruiter text,
  add column if not exists interview_date date,
  add column if not exists next_action text,
  add column if not exists decision text,
  add column if not exists notes text,
  add column if not exists updated_at timestamptz default now();

alter table if exists hr_onboarding_cases
  add column if not exists stage text default 'preboarding',
  add column if not exists progress integer default 0,
  add column if not exists owner text,
  add column if not exists start_date date,
  add column if not exists expected_completion_date date,
  add column if not exists risk_level text default 'normal',
  add column if not exists blocker text,
  add column if not exists updated_at timestamptz default now();

alter table if exists hr_staff_profiles
  add column if not exists staff_code text,
  add column if not exists employee_status text default 'active',
  add column if not exists department_id uuid,
  add column if not exists position_id uuid,
  add column if not exists manager_id uuid,
  add column if not exists phone text,
  add column if not exists email text,
  add column if not exists city text,
  add column if not exists contract_type text,
  add column if not exists hire_date date,
  add column if not exists performance_score integer default 0,
  add column if not exists compliance_status text default 'pending',
  add column if not exists updated_at timestamptz default now();

alter table if exists hr_rosters
  add column if not exists roster_status text default 'planned',
  add column if not exists shift_type text,
  add column if not exists conflict_status text default 'clear',
  add column if not exists approval_status text default 'draft',
  add column if not exists updated_at timestamptz default now();

alter table if exists hr_attendance_records
  add column if not exists correction_status text default 'none',
  add column if not exists approval_status text default 'pending',
  add column if not exists correction_reason text,
  add column if not exists approved_by text,
  add column if not exists updated_at timestamptz default now();

alter table if exists hr_openings
  add column if not exists opening_status text default 'open',
  add column if not exists urgency text default 'normal',
  add column if not exists pipeline_target integer default 0,
  add column if not exists budget_status text default 'pending',
  add column if not exists updated_at timestamptz default now();

alter table if exists hr_departments
  add column if not exists updated_at timestamptz default now();

alter table if exists hr_positions
  add column if not exists updated_at timestamptz default now();

alter table if exists hr_tasks
  add column if not exists task_type text default 'general',
  add column if not exists priority text default 'medium',
  add column if not exists owner text,
  add column if not exists due_date date,
  add column if not exists updated_at timestamptz default now();

-- Safe indexes used by V2 dashboards. These are harmless if columns already exist.
create index if not exists idx_hr_recruitment_candidates_stage on hr_recruitment_candidates(stage);
create index if not exists idx_hr_onboarding_cases_stage on hr_onboarding_cases(stage);
create index if not exists idx_hr_staff_profiles_employee_status on hr_staff_profiles(employee_status);
create index if not exists idx_hr_rosters_conflict_status on hr_rosters(conflict_status);
create index if not exists idx_hr_attendance_records_approval_status on hr_attendance_records(approval_status);
create index if not exists idx_hr_tasks_task_type on hr_tasks(task_type);

