-- HR UNIFIED MODULE V2.1 - HARD STABLE SQL REPLACEMENT
-- Use this INSTEAD OF the previous broken V2 SQL files.
-- It repairs partially-created tables before indexes/seeds.

create extension if not exists pgcrypto;

-- =========================
-- CREATE TABLES IF MISSING
-- =========================

create table if not exists hr_recruitment_candidates (
  id uuid primary key default gen_random_uuid()
);

create table if not exists hr_recruitment_pipeline (
  id uuid primary key default gen_random_uuid()
);

create table if not exists hr_candidate_evaluations (
  id uuid primary key default gen_random_uuid()
);

create table if not exists hr_onboarding_steps (
  id uuid primary key default gen_random_uuid()
);

create table if not exists hr_onboarding_checklists (
  id uuid primary key default gen_random_uuid()
);

create table if not exists hr_staff_documents (
  id uuid primary key default gen_random_uuid()
);

create table if not exists hr_staff_performance_reviews (
  id uuid primary key default gen_random_uuid()
);

create table if not exists hr_attendance_corrections (
  id uuid primary key default gen_random_uuid()
);

create table if not exists hr_roster_conflicts (
  id uuid primary key default gen_random_uuid()
);

create table if not exists hr_execution_tasks (
  id uuid primary key default gen_random_uuid()
);

create table if not exists hr_audit_logs (
  id uuid primary key default gen_random_uuid()
);

-- =========================
-- REPAIR / ADD ALL COLUMNS
-- =========================

alter table hr_recruitment_candidates add column if not exists opening_id uuid;
alter table hr_recruitment_candidates add column if not exists full_name text not null default '';
alter table hr_recruitment_candidates add column if not exists phone text;
alter table hr_recruitment_candidates add column if not exists email text;
alter table hr_recruitment_candidates add column if not exists city text;
alter table hr_recruitment_candidates add column if not exists source text;
alter table hr_recruitment_candidates add column if not exists stage text not null default 'new';
alter table hr_recruitment_candidates add column if not exists status text not null default 'active';
alter table hr_recruitment_candidates add column if not exists rating numeric default 0;
alter table hr_recruitment_candidates add column if not exists availability text;
alter table hr_recruitment_candidates add column if not exists expected_salary numeric;
alter table hr_recruitment_candidates add column if not exists assigned_to uuid;
alter table hr_recruitment_candidates add column if not exists next_action text;
alter table hr_recruitment_candidates add column if not exists next_action_at timestamptz;
alter table hr_recruitment_candidates add column if not exists risk_level text default 'normal';
alter table hr_recruitment_candidates add column if not exists notes text;
alter table hr_recruitment_candidates add column if not exists created_at timestamptz not null default now();
alter table hr_recruitment_candidates add column if not exists updated_at timestamptz not null default now();

alter table hr_recruitment_pipeline add column if not exists candidate_id uuid;
alter table hr_recruitment_pipeline add column if not exists opening_id uuid;
alter table hr_recruitment_pipeline add column if not exists stage text not null default 'new';
alter table hr_recruitment_pipeline add column if not exists status text not null default 'active';
alter table hr_recruitment_pipeline add column if not exists owner_id uuid;
alter table hr_recruitment_pipeline add column if not exists decision text;
alter table hr_recruitment_pipeline add column if not exists score numeric default 0;
alter table hr_recruitment_pipeline add column if not exists next_step text;
alter table hr_recruitment_pipeline add column if not exists due_at timestamptz;
alter table hr_recruitment_pipeline add column if not exists notes text;
alter table hr_recruitment_pipeline add column if not exists created_at timestamptz not null default now();
alter table hr_recruitment_pipeline add column if not exists updated_at timestamptz not null default now();

alter table hr_candidate_evaluations add column if not exists candidate_id uuid;
alter table hr_candidate_evaluations add column if not exists evaluator_id uuid;
alter table hr_candidate_evaluations add column if not exists stage text not null default 'screening';
alter table hr_candidate_evaluations add column if not exists status text not null default 'draft';
alter table hr_candidate_evaluations add column if not exists score numeric default 0;
alter table hr_candidate_evaluations add column if not exists communication_score numeric default 0;
alter table hr_candidate_evaluations add column if not exists reliability_score numeric default 0;
alter table hr_candidate_evaluations add column if not exists care_fit_score numeric default 0;
alter table hr_candidate_evaluations add column if not exists recommendation text;
alter table hr_candidate_evaluations add column if not exists notes text;
alter table hr_candidate_evaluations add column if not exists created_at timestamptz not null default now();
alter table hr_candidate_evaluations add column if not exists updated_at timestamptz not null default now();

alter table hr_onboarding_steps add column if not exists onboarding_id uuid;
alter table hr_onboarding_steps add column if not exists staff_id uuid;
alter table hr_onboarding_steps add column if not exists candidate_id uuid;
alter table hr_onboarding_steps add column if not exists title text not null default '';
alter table hr_onboarding_steps add column if not exists category text default 'general';
alter table hr_onboarding_steps add column if not exists stage text not null default 'preboarding';
alter table hr_onboarding_steps add column if not exists status text not null default 'pending';
alter table hr_onboarding_steps add column if not exists owner_id uuid;
alter table hr_onboarding_steps add column if not exists due_at timestamptz;
alter table hr_onboarding_steps add column if not exists completed_at timestamptz;
alter table hr_onboarding_steps add column if not exists evidence_url text;
alter table hr_onboarding_steps add column if not exists notes text;
alter table hr_onboarding_steps add column if not exists created_at timestamptz not null default now();
alter table hr_onboarding_steps add column if not exists updated_at timestamptz not null default now();

alter table hr_onboarding_checklists add column if not exists name text not null default '';
alter table hr_onboarding_checklists add column if not exists role_key text;
alter table hr_onboarding_checklists add column if not exists department_id uuid;
alter table hr_onboarding_checklists add column if not exists stage text not null default 'active';
alter table hr_onboarding_checklists add column if not exists status text not null default 'active';
alter table hr_onboarding_checklists add column if not exists checklist jsonb not null default '[]'::jsonb;
alter table hr_onboarding_checklists add column if not exists notes text;
alter table hr_onboarding_checklists add column if not exists created_at timestamptz not null default now();
alter table hr_onboarding_checklists add column if not exists updated_at timestamptz not null default now();

alter table hr_staff_documents add column if not exists staff_id uuid;
alter table hr_staff_documents add column if not exists document_type text not null default 'document';
alter table hr_staff_documents add column if not exists title text not null default '';
alter table hr_staff_documents add column if not exists file_url text;
alter table hr_staff_documents add column if not exists expiry_date date;
alter table hr_staff_documents add column if not exists stage text not null default 'valid';
alter table hr_staff_documents add column if not exists status text not null default 'active';
alter table hr_staff_documents add column if not exists verification_status text default 'pending';
alter table hr_staff_documents add column if not exists verified_by uuid;
alter table hr_staff_documents add column if not exists verified_at timestamptz;
alter table hr_staff_documents add column if not exists notes text;
alter table hr_staff_documents add column if not exists created_at timestamptz not null default now();
alter table hr_staff_documents add column if not exists updated_at timestamptz not null default now();

alter table hr_staff_performance_reviews add column if not exists staff_id uuid;
alter table hr_staff_performance_reviews add column if not exists reviewer_id uuid;
alter table hr_staff_performance_reviews add column if not exists period_start date;
alter table hr_staff_performance_reviews add column if not exists period_end date;
alter table hr_staff_performance_reviews add column if not exists stage text not null default 'draft';
alter table hr_staff_performance_reviews add column if not exists status text not null default 'open';
alter table hr_staff_performance_reviews add column if not exists overall_score numeric default 0;
alter table hr_staff_performance_reviews add column if not exists punctuality_score numeric default 0;
alter table hr_staff_performance_reviews add column if not exists quality_score numeric default 0;
alter table hr_staff_performance_reviews add column if not exists reliability_score numeric default 0;
alter table hr_staff_performance_reviews add column if not exists client_feedback_score numeric default 0;
alter table hr_staff_performance_reviews add column if not exists strengths text;
alter table hr_staff_performance_reviews add column if not exists improvements text;
alter table hr_staff_performance_reviews add column if not exists action_plan text;
alter table hr_staff_performance_reviews add column if not exists notes text;
alter table hr_staff_performance_reviews add column if not exists created_at timestamptz not null default now();
alter table hr_staff_performance_reviews add column if not exists updated_at timestamptz not null default now();

alter table hr_attendance_corrections add column if not exists attendance_id uuid;
alter table hr_attendance_corrections add column if not exists staff_id uuid;
alter table hr_attendance_corrections add column if not exists requested_by uuid;
alter table hr_attendance_corrections add column if not exists approved_by uuid;
alter table hr_attendance_corrections add column if not exists correction_type text not null default 'manual_correction';
alter table hr_attendance_corrections add column if not exists original_value jsonb not null default '{}'::jsonb;
alter table hr_attendance_corrections add column if not exists requested_value jsonb not null default '{}'::jsonb;
alter table hr_attendance_corrections add column if not exists reason text;
alter table hr_attendance_corrections add column if not exists stage text not null default 'requested';
alter table hr_attendance_corrections add column if not exists status text not null default 'pending';
alter table hr_attendance_corrections add column if not exists approved_at timestamptz;
alter table hr_attendance_corrections add column if not exists rejected_at timestamptz;
alter table hr_attendance_corrections add column if not exists notes text;
alter table hr_attendance_corrections add column if not exists created_at timestamptz not null default now();
alter table hr_attendance_corrections add column if not exists updated_at timestamptz not null default now();

alter table hr_roster_conflicts add column if not exists roster_id uuid;
alter table hr_roster_conflicts add column if not exists staff_id uuid;
alter table hr_roster_conflicts add column if not exists conflict_type text not null default 'schedule_conflict';
alter table hr_roster_conflicts add column if not exists severity text default 'medium';
alter table hr_roster_conflicts add column if not exists stage text not null default 'detected';
alter table hr_roster_conflicts add column if not exists status text not null default 'open';
alter table hr_roster_conflicts add column if not exists detected_at timestamptz not null default now();
alter table hr_roster_conflicts add column if not exists resolved_by uuid;
alter table hr_roster_conflicts add column if not exists resolved_at timestamptz;
alter table hr_roster_conflicts add column if not exists resolution text;
alter table hr_roster_conflicts add column if not exists notes text;
alter table hr_roster_conflicts add column if not exists created_at timestamptz not null default now();
alter table hr_roster_conflicts add column if not exists updated_at timestamptz not null default now();

alter table hr_execution_tasks add column if not exists title text not null default '';
alter table hr_execution_tasks add column if not exists task_type text not null default 'general';
alter table hr_execution_tasks add column if not exists module_area text default 'hr';
alter table hr_execution_tasks add column if not exists priority text default 'medium';
alter table hr_execution_tasks add column if not exists stage text not null default 'open';
alter table hr_execution_tasks add column if not exists status text not null default 'open';
alter table hr_execution_tasks add column if not exists assigned_to uuid;
alter table hr_execution_tasks add column if not exists related_staff_id uuid;
alter table hr_execution_tasks add column if not exists related_candidate_id uuid;
alter table hr_execution_tasks add column if not exists related_opening_id uuid;
alter table hr_execution_tasks add column if not exists due_at timestamptz;
alter table hr_execution_tasks add column if not exists completed_at timestamptz;
alter table hr_execution_tasks add column if not exists description text;
alter table hr_execution_tasks add column if not exists notes text;
alter table hr_execution_tasks add column if not exists created_at timestamptz not null default now();
alter table hr_execution_tasks add column if not exists updated_at timestamptz not null default now();

alter table hr_audit_logs add column if not exists actor_id uuid;
alter table hr_audit_logs add column if not exists action text not null default '';
alter table hr_audit_logs add column if not exists entity_type text not null default '';
alter table hr_audit_logs add column if not exists entity_id uuid;
alter table hr_audit_logs add column if not exists stage text not null default 'logged';
alter table hr_audit_logs add column if not exists status text not null default 'ok';
alter table hr_audit_logs add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table hr_audit_logs add column if not exists notes text;
alter table hr_audit_logs add column if not exists created_at timestamptz not null default now();
alter table hr_audit_logs add column if not exists updated_at timestamptz not null default now();

-- Existing V1/partial tables protection.
do $$
declare r record;
begin
  for r in
    select tablename
    from pg_tables
    where schemaname = 'public'
      and tablename in (
        'hr_departments','hr_positions','hr_job_openings','hr_openings',
        'hr_staff','hr_rosters','hr_attendance','hr_tasks',
        'hr_onboarding','hr_onboarding_plans','hr_applications','hr_recruitment'
      )
  loop
    execute format('alter table public.%I add column if not exists stage text', r.tablename);
    execute format('alter table public.%I add column if not exists status text', r.tablename);
    execute format('alter table public.%I add column if not exists notes text', r.tablename);
    execute format('alter table public.%I add column if not exists updated_at timestamptz not null default now()', r.tablename);
  end loop;
end $$;

-- =========================
-- INDEXES AFTER COLUMN REPAIR
-- =========================

create index if not exists idx_hr_recruitment_candidates_stage on hr_recruitment_candidates(stage);
create index if not exists idx_hr_recruitment_candidates_status on hr_recruitment_candidates(status);
create index if not exists idx_hr_recruitment_candidates_opening_id on hr_recruitment_candidates(opening_id);

create index if not exists idx_hr_recruitment_pipeline_stage on hr_recruitment_pipeline(stage);
create index if not exists idx_hr_recruitment_pipeline_candidate on hr_recruitment_pipeline(candidate_id);

create index if not exists idx_hr_onboarding_steps_staff on hr_onboarding_steps(staff_id);
create index if not exists idx_hr_onboarding_steps_status on hr_onboarding_steps(status);

create index if not exists idx_hr_staff_documents_staff on hr_staff_documents(staff_id);
create index if not exists idx_hr_staff_documents_status on hr_staff_documents(status);

create index if not exists idx_hr_staff_performance_reviews_staff on hr_staff_performance_reviews(staff_id);

create index if not exists idx_hr_attendance_corrections_staff on hr_attendance_corrections(staff_id);
create index if not exists idx_hr_attendance_corrections_status on hr_attendance_corrections(status);

create index if not exists idx_hr_roster_conflicts_staff on hr_roster_conflicts(staff_id);
create index if not exists idx_hr_roster_conflicts_status on hr_roster_conflicts(status);

create index if not exists idx_hr_execution_tasks_status on hr_execution_tasks(status);
create index if not exists idx_hr_execution_tasks_module_area on hr_execution_tasks(module_area);

create index if not exists idx_hr_audit_logs_entity on hr_audit_logs(entity_type, entity_id);

-- =========================
-- SAFE SEED
-- =========================

insert into hr_execution_tasks (title, task_type, module_area, priority, stage, status, description)
select * from (values
  ('Validate urgent caregiver recruitment pipeline', 'recruitment_pipeline', 'recruitment', 'high', 'open', 'open', 'Review new candidates, interviews, and hiring blockers.'),
  ('Audit onboarding documents and missing proofs', 'onboarding_documents', 'onboarding', 'high', 'open', 'open', 'Check identity, contract, medical/admin documents and integration steps.'),
  ('Review attendance anomalies and corrections', 'attendance_control', 'attendance', 'medium', 'open', 'open', 'Investigate late/missing clock records and correction requests.'),
  ('Optimize weekly roster coverage', 'roster_planning', 'rosters', 'high', 'open', 'open', 'Check uncovered shifts, conflicts, replacements and caregiver availability.'),
  ('Update departments and position matrix', 'org_design', 'departments', 'medium', 'open', 'open', 'Maintain departments, positions, responsibilities and target headcount.')
) as v(title, task_type, module_area, priority, stage, status, description)
where not exists (
  select 1 from hr_execution_tasks t where t.title = v.title
);

select 'HR V2.1 hard stable SQL installed successfully' as result;
