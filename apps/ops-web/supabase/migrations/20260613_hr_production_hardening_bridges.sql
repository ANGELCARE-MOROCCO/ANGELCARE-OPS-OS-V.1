create extension if not exists pgcrypto;

-- Core bridge/compatibility tables used by the live HR module.

create table if not exists public.hr_staff (
  id uuid primary key default gen_random_uuid(),
  full_name text not null default '',
  name text,
  phone text,
  email text,
  city text,
  department text,
  position text,
  job_title text,
  role text,
  employment_status text default 'active',
  status text default 'active',
  contract_type text,
  start_date date,
  archived_at timestamptz,
  user_id uuid,
  identity_status text,
  identity_source text,
  identity_linked_at timestamptz,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table if exists public.hr_staff add column if not exists full_name text not null default '';
alter table if exists public.hr_staff add column if not exists name text;
alter table if exists public.hr_staff add column if not exists phone text;
alter table if exists public.hr_staff add column if not exists email text;
alter table if exists public.hr_staff add column if not exists city text;
alter table if exists public.hr_staff add column if not exists department text;
alter table if exists public.hr_staff add column if not exists position text;
alter table if exists public.hr_staff add column if not exists job_title text;
alter table if exists public.hr_staff add column if not exists role text;
alter table if exists public.hr_staff add column if not exists employment_status text default 'active';
alter table if exists public.hr_staff add column if not exists status text default 'active';
alter table if exists public.hr_staff add column if not exists contract_type text;
alter table if exists public.hr_staff add column if not exists start_date date;
alter table if exists public.hr_staff add column if not exists archived_at timestamptz;
alter table if exists public.hr_staff add column if not exists user_id uuid;
alter table if exists public.hr_staff add column if not exists identity_status text;
alter table if exists public.hr_staff add column if not exists identity_source text;
alter table if exists public.hr_staff add column if not exists identity_linked_at timestamptz;
alter table if exists public.hr_staff add column if not exists notes text;
alter table if exists public.hr_staff add column if not exists created_at timestamptz default now();
alter table if exists public.hr_staff add column if not exists updated_at timestamptz default now();

create table if not exists public.hr_recruitment_candidates (
  id uuid primary key default gen_random_uuid(),
  opening_id uuid,
  job_id uuid,
  full_name text not null default '',
  phone text,
  email text,
  city text,
  source text,
  stage text not null default 'new',
  pipeline_stage text default 'new',
  status text not null default 'active',
  rating numeric default 0,
  score numeric default 0,
  availability text,
  availability_date date,
  expected_salary numeric,
  assigned_to uuid,
  next_action text,
  next_action_at timestamptz,
  decision text default 'pending',
  risk_level text default 'normal',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table if exists public.hr_recruitment_candidates add column if not exists opening_id uuid;
alter table if exists public.hr_recruitment_candidates add column if not exists job_id uuid;
alter table if exists public.hr_recruitment_candidates add column if not exists full_name text not null default '';
alter table if exists public.hr_recruitment_candidates add column if not exists phone text;
alter table if exists public.hr_recruitment_candidates add column if not exists email text;
alter table if exists public.hr_recruitment_candidates add column if not exists city text;
alter table if exists public.hr_recruitment_candidates add column if not exists source text;
alter table if exists public.hr_recruitment_candidates add column if not exists stage text not null default 'new';
alter table if exists public.hr_recruitment_candidates add column if not exists pipeline_stage text default 'new';
alter table if exists public.hr_recruitment_candidates add column if not exists status text not null default 'active';
alter table if exists public.hr_recruitment_candidates add column if not exists rating numeric default 0;
alter table if exists public.hr_recruitment_candidates add column if not exists score numeric default 0;
alter table if exists public.hr_recruitment_candidates add column if not exists availability text;
alter table if exists public.hr_recruitment_candidates add column if not exists availability_date date;
alter table if exists public.hr_recruitment_candidates add column if not exists expected_salary numeric;
alter table if exists public.hr_recruitment_candidates add column if not exists assigned_to uuid;
alter table if exists public.hr_recruitment_candidates add column if not exists next_action text;
alter table if exists public.hr_recruitment_candidates add column if not exists next_action_at timestamptz;
alter table if exists public.hr_recruitment_candidates add column if not exists decision text default 'pending';
alter table if exists public.hr_recruitment_candidates add column if not exists risk_level text default 'normal';
alter table if exists public.hr_recruitment_candidates add column if not exists notes text;
alter table if exists public.hr_recruitment_candidates add column if not exists created_at timestamptz not null default now();
alter table if exists public.hr_recruitment_candidates add column if not exists updated_at timestamptz not null default now();

create table if not exists public.hr_approval_requests (
  id uuid primary key default gen_random_uuid(),
  request_type text,
  entity_type text,
  entity_id uuid,
  title text not null default '',
  requester_name text,
  approver_name text,
  status text default 'pending',
  priority text default 'normal',
  decision_notes text,
  decided_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.hr_leave_requests (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid,
  employee_name text not null default '',
  department text,
  leave_type text,
  start_date date,
  end_date date,
  duration text,
  manager text,
  status text default 'pending',
  approved_by text,
  decision text,
  decision_at timestamptz,
  reason text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.hr_documents (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid,
  employee_name text,
  title text not null default '',
  department text,
  document_type text,
  file_url text,
  expiry_date date,
  owner text,
  status text default 'pending',
  signature_status text,
  compliance_status text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.hr_staff_documents (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid,
  document_type text not null default 'document',
  title text not null default '',
  file_url text,
  expiry_date date,
  stage text not null default 'valid',
  status text not null default 'active',
  verification_status text default 'pending',
  verified_by uuid,
  verified_at timestamptz,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.hr_onboarding_journeys (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid,
  candidate_id uuid,
  title text not null default '',
  position text,
  department text,
  status text default 'planned',
  stage text,
  start_date date,
  completion_rate numeric default 0,
  manager text,
  location text,
  employment_type text,
  email text,
  phone text,
  owner text,
  progress numeric default 0,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.hr_onboarding_tasks (
  id uuid primary key default gen_random_uuid(),
  onboarding_id uuid,
  staff_id uuid,
  candidate_id uuid,
  title text not null default '',
  category text default 'general',
  stage text default 'preboarding',
  status text default 'pending',
  owner text,
  due_date date,
  completed_at timestamptz,
  evidence_url text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.hr_onboarding_documents (
  id uuid primary key default gen_random_uuid(),
  onboarding_id uuid,
  staff_id uuid,
  candidate_id uuid,
  title text not null default '',
  document_type text,
  status text default 'required',
  due_date date,
  file_url text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.hr_onboarding_checklists (
  id uuid primary key default gen_random_uuid(),
  name text not null default '',
  role_key text,
  department_id uuid,
  stage text not null default 'active',
  status text not null default 'active',
  checklist jsonb not null default '[]'::jsonb,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.hr_onboarding_activity (
  id uuid primary key default gen_random_uuid(),
  onboarding_id uuid,
  staff_id uuid,
  candidate_id uuid,
  title text not null default '',
  type text default 'note',
  status text default 'recorded',
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.hr_training_programs (
  id uuid primary key default gen_random_uuid(),
  title text not null default '',
  position_title text,
  department text,
  category text,
  training_type text,
  requirement_level text default 'recommended',
  priority text default 'normal',
  status text default 'active',
  duration_minutes integer default 60,
  description text,
  resource_url text,
  video_url text,
  pdf_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.hr_position_training_requirements (
  id uuid primary key default gen_random_uuid(),
  position_title text not null default '',
  training_id uuid,
  training_title text not null default '',
  requirement_level text default 'recommended',
  due_days integer default 14,
  status text default 'active',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.hr_training_resources (
  id uuid primary key default gen_random_uuid(),
  training_id uuid,
  position_title text,
  title text not null default '',
  resource_type text default 'training',
  resource_url text,
  notes text,
  status text default 'active',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.hr_training_assignments (
  id uuid primary key default gen_random_uuid(),
  training_id uuid,
  staff_id uuid,
  user_id uuid,
  staff_name text,
  employee_name text,
  staff_email text,
  position_title text,
  department text,
  title text not null default '',
  training_title text,
  category text,
  status text default 'assigned',
  progress_percent integer default 0,
  assigned_at timestamptz,
  due_at timestamptz,
  due_date date,
  priority text default 'normal',
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  last_activity_at timestamptz,
  completed_at timestamptz,
  approved_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.hr_training_records (
  id uuid primary key default gen_random_uuid(),
  training_id uuid,
  staff_id uuid,
  user_id uuid,
  staff_name text,
  employee_name text,
  staff_email text,
  position_title text,
  department text,
  title text not null default '',
  training_title text,
  category text,
  status text default 'assigned',
  progress_percent integer default 0,
  assigned_at timestamptz,
  due_at timestamptz,
  due_date date,
  priority text default 'normal',
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  last_activity_at timestamptz,
  completed_at timestamptz,
  approved_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.hr_training_audit_logs (
  id uuid primary key default gen_random_uuid(),
  action text not null default '',
  entity_type text,
  entity_id uuid,
  title text,
  notes text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists public.hr_recruitment_pipeline (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid,
  opening_id uuid,
  stage text not null default 'new',
  status text not null default 'active',
  owner_id uuid,
  decision text,
  score numeric default 0,
  next_step text,
  due_at timestamptz,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.hr_schedule_activity_log (
  id uuid primary key default gen_random_uuid(),
  module text not null default 'hr',
  action text not null default '',
  entity_type text,
  entity_id uuid,
  title text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.hr_saved_views (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  module text,
  name text not null default '',
  description text,
  filters jsonb not null default '{}'::jsonb,
  sort_by text,
  is_default boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.hr_calendar_events (
  id uuid primary key default gen_random_uuid(),
  title text not null default '',
  description text,
  event_at timestamptz,
  end_at timestamptz,
  event_type text,
  module text default 'hr',
  staff_id uuid,
  candidate_id uuid,
  status text default 'planned',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.hr_escalations (
  id uuid primary key default gen_random_uuid(),
  title text not null default '',
  description text,
  severity text default 'medium',
  status text default 'open',
  owner text,
  source_table text,
  source_record_id uuid,
  due_at timestamptz,
  resolved_at timestamptz,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.hr_daily_operations (
  id uuid primary key default gen_random_uuid(),
  title text not null default '',
  operation_date date default current_date,
  module text default 'hr',
  status text default 'open',
  owner text,
  summary text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.hr_quality_reviews (
  id uuid primary key default gen_random_uuid(),
  title text not null default '',
  review_type text,
  status text default 'open',
  severity text default 'medium',
  score numeric default 0,
  owner text,
  reviewed_at timestamptz,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.hr_bulk_actions (
  id uuid primary key default gen_random_uuid(),
  title text not null default '',
  action_type text,
  status text default 'draft',
  target_table text,
  target_count integer default 0,
  run_at timestamptz,
  owner text,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.hr_launch_checks (
  id uuid primary key default gen_random_uuid(),
  title text not null default '',
  status text default 'pending',
  owner text,
  checklist jsonb not null default '[]'::jsonb,
  notes text,
  executed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.hr_adoption_tracker (
  id uuid primary key default gen_random_uuid(),
  title text not null default '',
  audience text,
  status text default 'open',
  metric_name text,
  metric_value numeric,
  target_value numeric,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.hr_kpi_drilldowns (
  id uuid primary key default gen_random_uuid(),
  title text not null default '',
  metric_key text,
  scope text,
  status text default 'open',
  owner text,
  drilldown jsonb not null default '{}'::jsonb,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.hr_sla_tracking (
  id uuid primary key default gen_random_uuid(),
  title text not null default '',
  sla_name text,
  status text default 'open',
  severity text default 'medium',
  due_at timestamptz,
  resolved_at timestamptz,
  owner text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.hr_activity_timeline (
  id uuid primary key default gen_random_uuid(),
  module text default 'hr',
  source text default 'hr-production',
  action text not null default '',
  entity_type text,
  entity_id uuid,
  title text,
  description text,
  status text default 'recorded',
  severity text default 'info',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.hr_audit_logs (
  id uuid primary key default gen_random_uuid(),
  module text default 'hr',
  source text default 'hr-production',
  action text not null default '',
  entity_type text,
  entity_id uuid,
  title text,
  description text,
  status text default 'recorded',
  severity text default 'info',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.hr_approvals (
  id uuid primary key default gen_random_uuid(),
  title text not null default '',
  request_type text,
  entity_type text,
  entity_id uuid,
  requester_name text,
  approver_name text,
  status text default 'pending',
  priority text default 'normal',
  notes text,
  decision_notes text,
  decided_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Canonical field repair for existing tables.
alter table if exists public.hr_staff_profiles add column if not exists user_id uuid;
alter table if exists public.hr_staff_profiles add column if not exists job_title text;
alter table if exists public.hr_staff_profiles add column if not exists role text;
alter table if exists public.hr_staff_profiles add column if not exists location text;
alter table if exists public.hr_staff_profiles add column if not exists branch_office text;
alter table if exists public.hr_staff_profiles add column if not exists archived_at timestamptz;
alter table if exists public.hr_staff_profiles add column if not exists identity_status text;
alter table if exists public.hr_staff_profiles add column if not exists identity_source text;
alter table if exists public.hr_staff_profiles add column if not exists identity_linked_at timestamptz;
alter table if exists public.hr_staff_profiles add column if not exists status text default 'active';

alter table if exists public.hr_candidates add column if not exists opening_id uuid;
alter table if exists public.hr_candidates add column if not exists stage text default 'new';
alter table if exists public.hr_candidates add column if not exists status text default 'active';
alter table if exists public.hr_candidates add column if not exists rating numeric default 0;
alter table if exists public.hr_candidates add column if not exists availability text;
alter table if exists public.hr_candidates add column if not exists assigned_to uuid;
alter table if exists public.hr_candidates add column if not exists next_action text;
alter table if exists public.hr_candidates add column if not exists next_action_at timestamptz;
alter table if exists public.hr_candidates add column if not exists risk_level text default 'normal';
alter table if exists public.hr_candidates add column if not exists notes text;

alter table if exists public.hr_training_records add column if not exists training_id uuid;
alter table if exists public.hr_training_records add column if not exists staff_id uuid;
alter table if exists public.hr_training_records add column if not exists user_id uuid;
alter table if exists public.hr_training_records add column if not exists staff_name text;
alter table if exists public.hr_training_records add column if not exists employee_name text;
alter table if exists public.hr_training_records add column if not exists staff_email text;
alter table if exists public.hr_training_records add column if not exists position_title text;
alter table if exists public.hr_training_records add column if not exists department text;
alter table if exists public.hr_training_records add column if not exists title text;
alter table if exists public.hr_training_records add column if not exists training_title text;
alter table if exists public.hr_training_records add column if not exists category text;
alter table if exists public.hr_training_records add column if not exists status text default 'assigned';
alter table if exists public.hr_training_records add column if not exists progress_percent integer default 0;
alter table if exists public.hr_training_records add column if not exists assigned_at timestamptz;
alter table if exists public.hr_training_records add column if not exists due_at timestamptz;
alter table if exists public.hr_training_records add column if not exists due_date date;
alter table if exists public.hr_training_records add column if not exists priority text default 'normal';
alter table if exists public.hr_training_records add column if not exists notes text;
alter table if exists public.hr_training_records add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table if exists public.hr_training_records add column if not exists last_activity_at timestamptz;
alter table if exists public.hr_training_records add column if not exists completed_at timestamptz;
alter table if exists public.hr_training_records add column if not exists approved_at timestamptz;

alter table if exists public.hr_training_assignments add column if not exists training_id uuid;
alter table if exists public.hr_training_assignments add column if not exists staff_id uuid;
alter table if exists public.hr_training_assignments add column if not exists user_id uuid;
alter table if exists public.hr_training_assignments add column if not exists staff_name text;
alter table if exists public.hr_training_assignments add column if not exists employee_name text;
alter table if exists public.hr_training_assignments add column if not exists staff_email text;
alter table if exists public.hr_training_assignments add column if not exists position_title text;
alter table if exists public.hr_training_assignments add column if not exists department text;
alter table if exists public.hr_training_assignments add column if not exists title text;
alter table if exists public.hr_training_assignments add column if not exists training_title text;
alter table if exists public.hr_training_assignments add column if not exists category text;
alter table if exists public.hr_training_assignments add column if not exists status text default 'assigned';
alter table if exists public.hr_training_assignments add column if not exists progress_percent integer default 0;
alter table if exists public.hr_training_assignments add column if not exists assigned_at timestamptz;
alter table if exists public.hr_training_assignments add column if not exists due_at timestamptz;
alter table if exists public.hr_training_assignments add column if not exists due_date date;
alter table if exists public.hr_training_assignments add column if not exists priority text default 'normal';
alter table if exists public.hr_training_assignments add column if not exists notes text;
alter table if exists public.hr_training_assignments add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table if exists public.hr_training_assignments add column if not exists last_activity_at timestamptz;
alter table if exists public.hr_training_assignments add column if not exists completed_at timestamptz;
alter table if exists public.hr_training_assignments add column if not exists approved_at timestamptz;

alter table if exists public.hr_leave_requests add column if not exists staff_id uuid;
alter table if exists public.hr_leave_requests add column if not exists employee_name text;
alter table if exists public.hr_leave_requests add column if not exists department text;
alter table if exists public.hr_leave_requests add column if not exists leave_type text;
alter table if exists public.hr_leave_requests add column if not exists start_date date;
alter table if exists public.hr_leave_requests add column if not exists end_date date;
alter table if exists public.hr_leave_requests add column if not exists duration text;
alter table if exists public.hr_leave_requests add column if not exists manager text;
alter table if exists public.hr_leave_requests add column if not exists status text default 'pending';
alter table if exists public.hr_leave_requests add column if not exists approved_by text;
alter table if exists public.hr_leave_requests add column if not exists decision text;
alter table if exists public.hr_leave_requests add column if not exists decision_at timestamptz;
alter table if exists public.hr_leave_requests add column if not exists reason text;
alter table if exists public.hr_leave_requests add column if not exists notes text;

alter table if exists public.hr_documents add column if not exists staff_id uuid;
alter table if exists public.hr_documents add column if not exists employee_name text;
alter table if exists public.hr_documents add column if not exists title text;
alter table if exists public.hr_documents add column if not exists department text;
alter table if exists public.hr_documents add column if not exists document_type text;
alter table if exists public.hr_documents add column if not exists file_url text;
alter table if exists public.hr_documents add column if not exists expiry_date date;
alter table if exists public.hr_documents add column if not exists owner text;
alter table if exists public.hr_documents add column if not exists status text default 'pending';
alter table if exists public.hr_documents add column if not exists signature_status text;
alter table if exists public.hr_documents add column if not exists compliance_status text;
alter table if exists public.hr_documents add column if not exists notes text;

alter table if exists public.hr_staff_documents add column if not exists staff_id uuid;
alter table if exists public.hr_staff_documents add column if not exists document_type text not null default 'document';
alter table if exists public.hr_staff_documents add column if not exists title text not null default '';
alter table if exists public.hr_staff_documents add column if not exists file_url text;
alter table if exists public.hr_staff_documents add column if not exists expiry_date date;
alter table if exists public.hr_staff_documents add column if not exists stage text not null default 'valid';
alter table if exists public.hr_staff_documents add column if not exists status text not null default 'active';
alter table if exists public.hr_staff_documents add column if not exists verification_status text default 'pending';
alter table if exists public.hr_staff_documents add column if not exists verified_by uuid;
alter table if exists public.hr_staff_documents add column if not exists verified_at timestamptz;
alter table if exists public.hr_staff_documents add column if not exists notes text;
alter table if exists public.hr_staff_documents add column if not exists created_at timestamptz default now();
alter table if exists public.hr_staff_documents add column if not exists updated_at timestamptz default now();

alter table if exists public.hr_onboarding_journeys add column if not exists staff_id uuid;
alter table if exists public.hr_onboarding_journeys add column if not exists candidate_id uuid;
alter table if exists public.hr_onboarding_journeys add column if not exists title text;
alter table if exists public.hr_onboarding_journeys add column if not exists position text;
alter table if exists public.hr_onboarding_journeys add column if not exists department text;
alter table if exists public.hr_onboarding_journeys add column if not exists status text default 'planned';
alter table if exists public.hr_onboarding_journeys add column if not exists stage text;
alter table if exists public.hr_onboarding_journeys add column if not exists start_date date;
alter table if exists public.hr_onboarding_journeys add column if not exists completion_rate numeric default 0;
alter table if exists public.hr_onboarding_journeys add column if not exists manager text;
alter table if exists public.hr_onboarding_journeys add column if not exists location text;
alter table if exists public.hr_onboarding_journeys add column if not exists employment_type text;
alter table if exists public.hr_onboarding_journeys add column if not exists email text;
alter table if exists public.hr_onboarding_journeys add column if not exists phone text;
alter table if exists public.hr_onboarding_journeys add column if not exists owner text;
alter table if exists public.hr_onboarding_journeys add column if not exists progress numeric default 0;
alter table if exists public.hr_onboarding_journeys add column if not exists notes text;

alter table if exists public.hr_onboarding_tasks add column if not exists onboarding_id uuid;
alter table if exists public.hr_onboarding_tasks add column if not exists staff_id uuid;
alter table if exists public.hr_onboarding_tasks add column if not exists candidate_id uuid;
alter table if exists public.hr_onboarding_tasks add column if not exists title text;
alter table if exists public.hr_onboarding_tasks add column if not exists category text default 'general';
alter table if exists public.hr_onboarding_tasks add column if not exists stage text default 'preboarding';
alter table if exists public.hr_onboarding_tasks add column if not exists status text default 'pending';
alter table if exists public.hr_onboarding_tasks add column if not exists owner text;
alter table if exists public.hr_onboarding_tasks add column if not exists due_date date;
alter table if exists public.hr_onboarding_tasks add column if not exists completed_at timestamptz;
alter table if exists public.hr_onboarding_tasks add column if not exists evidence_url text;
alter table if exists public.hr_onboarding_tasks add column if not exists notes text;

alter table if exists public.hr_onboarding_documents add column if not exists onboarding_id uuid;
alter table if exists public.hr_onboarding_documents add column if not exists staff_id uuid;
alter table if exists public.hr_onboarding_documents add column if not exists candidate_id uuid;
alter table if exists public.hr_onboarding_documents add column if not exists title text;
alter table if exists public.hr_onboarding_documents add column if not exists document_type text;
alter table if exists public.hr_onboarding_documents add column if not exists status text default 'required';
alter table if exists public.hr_onboarding_documents add column if not exists due_date date;
alter table if exists public.hr_onboarding_documents add column if not exists file_url text;
alter table if exists public.hr_onboarding_documents add column if not exists notes text;

alter table if exists public.hr_onboarding_checklists add column if not exists name text not null default '';
alter table if exists public.hr_onboarding_checklists add column if not exists role_key text;
alter table if exists public.hr_onboarding_checklists add column if not exists department_id uuid;
alter table if exists public.hr_onboarding_checklists add column if not exists stage text not null default 'active';
alter table if exists public.hr_onboarding_checklists add column if not exists status text not null default 'active';
alter table if exists public.hr_onboarding_checklists add column if not exists checklist jsonb not null default '[]'::jsonb;
alter table if exists public.hr_onboarding_checklists add column if not exists notes text;

alter table if exists public.hr_onboarding_activity add column if not exists onboarding_id uuid;
alter table if exists public.hr_onboarding_activity add column if not exists staff_id uuid;
alter table if exists public.hr_onboarding_activity add column if not exists candidate_id uuid;
alter table if exists public.hr_onboarding_activity add column if not exists title text;
alter table if exists public.hr_onboarding_activity add column if not exists type text default 'note';
alter table if exists public.hr_onboarding_activity add column if not exists status text default 'recorded';
alter table if exists public.hr_onboarding_activity add column if not exists notes text;

alter table if exists public.hr_schedule_activity_log add column if not exists module text default 'hr';
alter table if exists public.hr_schedule_activity_log add column if not exists action text;
alter table if exists public.hr_schedule_activity_log add column if not exists entity_type text;
alter table if exists public.hr_schedule_activity_log add column if not exists entity_id uuid;
alter table if exists public.hr_schedule_activity_log add column if not exists title text;
alter table if exists public.hr_schedule_activity_log add column if not exists details jsonb not null default '{}'::jsonb;

alter table if exists public.hr_saved_views add column if not exists user_id uuid;
alter table if exists public.hr_saved_views add column if not exists module text;
alter table if exists public.hr_saved_views add column if not exists name text;
alter table if exists public.hr_saved_views add column if not exists description text;
alter table if exists public.hr_saved_views add column if not exists filters jsonb not null default '{}'::jsonb;
alter table if exists public.hr_saved_views add column if not exists sort_by text;
alter table if exists public.hr_saved_views add column if not exists is_default boolean default false;

alter table if exists public.hr_calendar_events add column if not exists title text;
alter table if exists public.hr_calendar_events add column if not exists description text;
alter table if exists public.hr_calendar_events add column if not exists event_at timestamptz;
alter table if exists public.hr_calendar_events add column if not exists end_at timestamptz;
alter table if exists public.hr_calendar_events add column if not exists event_type text;
alter table if exists public.hr_calendar_events add column if not exists module text default 'hr';
alter table if exists public.hr_calendar_events add column if not exists staff_id uuid;
alter table if exists public.hr_calendar_events add column if not exists candidate_id uuid;
alter table if exists public.hr_calendar_events add column if not exists status text default 'planned';
alter table if exists public.hr_calendar_events add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table if exists public.hr_escalations add column if not exists title text;
alter table if exists public.hr_escalations add column if not exists description text;
alter table if exists public.hr_escalations add column if not exists severity text default 'medium';
alter table if exists public.hr_escalations add column if not exists status text default 'open';
alter table if exists public.hr_escalations add column if not exists owner text;
alter table if exists public.hr_escalations add column if not exists source_table text;
alter table if exists public.hr_escalations add column if not exists source_record_id uuid;
alter table if exists public.hr_escalations add column if not exists due_at timestamptz;
alter table if exists public.hr_escalations add column if not exists resolved_at timestamptz;
alter table if exists public.hr_escalations add column if not exists notes text;
alter table if exists public.hr_escalations add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table if exists public.hr_daily_operations add column if not exists title text;
alter table if exists public.hr_daily_operations add column if not exists operation_date date default current_date;
alter table if exists public.hr_daily_operations add column if not exists module text default 'hr';
alter table if exists public.hr_daily_operations add column if not exists status text default 'open';
alter table if exists public.hr_daily_operations add column if not exists owner text;
alter table if exists public.hr_daily_operations add column if not exists summary text;
alter table if exists public.hr_daily_operations add column if not exists details jsonb not null default '{}'::jsonb;

alter table if exists public.hr_quality_reviews add column if not exists title text;
alter table if exists public.hr_quality_reviews add column if not exists review_type text;
alter table if exists public.hr_quality_reviews add column if not exists status text default 'open';
alter table if exists public.hr_quality_reviews add column if not exists severity text default 'medium';
alter table if exists public.hr_quality_reviews add column if not exists score numeric default 0;
alter table if exists public.hr_quality_reviews add column if not exists owner text;
alter table if exists public.hr_quality_reviews add column if not exists reviewed_at timestamptz;
alter table if exists public.hr_quality_reviews add column if not exists notes text;
alter table if exists public.hr_quality_reviews add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table if exists public.hr_bulk_actions add column if not exists title text;
alter table if exists public.hr_bulk_actions add column if not exists action_type text;
alter table if exists public.hr_bulk_actions add column if not exists status text default 'draft';
alter table if exists public.hr_bulk_actions add column if not exists target_table text;
alter table if exists public.hr_bulk_actions add column if not exists target_count integer default 0;
alter table if exists public.hr_bulk_actions add column if not exists run_at timestamptz;
alter table if exists public.hr_bulk_actions add column if not exists owner text;
alter table if exists public.hr_bulk_actions add column if not exists notes text;
alter table if exists public.hr_bulk_actions add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table if exists public.hr_launch_checks add column if not exists title text;
alter table if exists public.hr_launch_checks add column if not exists status text default 'pending';
alter table if exists public.hr_launch_checks add column if not exists owner text;
alter table if exists public.hr_launch_checks add column if not exists checklist jsonb not null default '[]'::jsonb;
alter table if exists public.hr_launch_checks add column if not exists notes text;
alter table if exists public.hr_launch_checks add column if not exists executed_at timestamptz;

alter table if exists public.hr_adoption_tracker add column if not exists title text;
alter table if exists public.hr_adoption_tracker add column if not exists audience text;
alter table if exists public.hr_adoption_tracker add column if not exists status text default 'open';
alter table if exists public.hr_adoption_tracker add column if not exists metric_name text;
alter table if exists public.hr_adoption_tracker add column if not exists metric_value numeric;
alter table if exists public.hr_adoption_tracker add column if not exists target_value numeric;
alter table if exists public.hr_adoption_tracker add column if not exists notes text;

alter table if exists public.hr_kpi_drilldowns add column if not exists title text;
alter table if exists public.hr_kpi_drilldowns add column if not exists metric_key text;
alter table if exists public.hr_kpi_drilldowns add column if not exists scope text;
alter table if exists public.hr_kpi_drilldowns add column if not exists status text default 'open';
alter table if exists public.hr_kpi_drilldowns add column if not exists owner text;
alter table if exists public.hr_kpi_drilldowns add column if not exists drilldown jsonb not null default '{}'::jsonb;
alter table if exists public.hr_kpi_drilldowns add column if not exists notes text;

alter table if exists public.hr_sla_tracking add column if not exists title text;
alter table if exists public.hr_sla_tracking add column if not exists sla_name text;
alter table if exists public.hr_sla_tracking add column if not exists status text default 'open';
alter table if exists public.hr_sla_tracking add column if not exists severity text default 'medium';
alter table if exists public.hr_sla_tracking add column if not exists due_at timestamptz;
alter table if exists public.hr_sla_tracking add column if not exists resolved_at timestamptz;
alter table if exists public.hr_sla_tracking add column if not exists owner text;
alter table if exists public.hr_sla_tracking add column if not exists notes text;

alter table if exists public.hr_activity_timeline add column if not exists module text default 'hr';
alter table if exists public.hr_activity_timeline add column if not exists source text default 'hr-production';
alter table if exists public.hr_activity_timeline add column if not exists action text;
alter table if exists public.hr_activity_timeline add column if not exists entity_type text;
alter table if exists public.hr_activity_timeline add column if not exists entity_id uuid;
alter table if exists public.hr_activity_timeline add column if not exists title text;
alter table if exists public.hr_activity_timeline add column if not exists description text;
alter table if exists public.hr_activity_timeline add column if not exists status text default 'recorded';
alter table if exists public.hr_activity_timeline add column if not exists severity text default 'info';
alter table if exists public.hr_activity_timeline add column if not exists payload jsonb not null default '{}'::jsonb;

alter table if exists public.hr_audit_logs add column if not exists module text default 'hr';
alter table if exists public.hr_audit_logs add column if not exists source text default 'hr-production';
alter table if exists public.hr_audit_logs add column if not exists action text;
alter table if exists public.hr_audit_logs add column if not exists entity_type text;
alter table if exists public.hr_audit_logs add column if not exists entity_id uuid;
alter table if exists public.hr_audit_logs add column if not exists title text;
alter table if exists public.hr_audit_logs add column if not exists description text;
alter table if exists public.hr_audit_logs add column if not exists status text default 'recorded';
alter table if exists public.hr_audit_logs add column if not exists severity text default 'info';
alter table if exists public.hr_audit_logs add column if not exists payload jsonb not null default '{}'::jsonb;

-- Bridges keep legacy tables and canonical tables in sync without destructive migration.
create or replace function public.fn_hr_sync_staff_bridge()
returns trigger
language plpgsql
as $$
begin
  if pg_trigger_depth() > 1 then
    return coalesce(new, old);
  end if;

  if tg_op = 'DELETE' then
    if tg_table_name = 'hr_staff_profiles' then
      delete from public.hr_staff where id = old.id;
    else
      delete from public.hr_staff_profiles where id = old.id;
    end if;
    return old;
  end if;

  if tg_table_name = 'hr_staff_profiles' then
    insert into public.hr_staff (
      id, full_name, name, phone, email, city, department, position, job_title, role,
      employment_status, status, contract_type, start_date, archived_at, user_id,
      identity_status, identity_source, identity_linked_at, notes, created_at, updated_at
    ) values (
      new.id,
      coalesce(new.full_name, new.name, ''),
      coalesce(new.name, new.full_name, ''),
      new.phone, new.email, new.city, new.department,
      coalesce(new.position, new.job_title, new.role),
      coalesce(new.job_title, new.position, new.role),
      coalesce(new.role, new.position, new.job_title),
      coalesce(new.employment_status, new.status, 'active'),
      coalesce(new.status, new.employment_status, 'active'),
      new.contract_type, new.start_date, new.archived_at, new.user_id,
      new.identity_status, new.identity_source, new.identity_linked_at, new.notes,
      coalesce(new.created_at, now()), coalesce(new.updated_at, now())
    )
    on conflict (id) do update set
      full_name = excluded.full_name,
      name = excluded.name,
      phone = excluded.phone,
      email = excluded.email,
      city = excluded.city,
      department = excluded.department,
      position = excluded.position,
      job_title = excluded.job_title,
      role = excluded.role,
      employment_status = excluded.employment_status,
      status = excluded.status,
      contract_type = excluded.contract_type,
      start_date = excluded.start_date,
      archived_at = excluded.archived_at,
      user_id = excluded.user_id,
      identity_status = excluded.identity_status,
      identity_source = excluded.identity_source,
      identity_linked_at = excluded.identity_linked_at,
      notes = excluded.notes,
      updated_at = excluded.updated_at;
  else
    insert into public.hr_staff_profiles (
      id, full_name, phone, email, city, department, position, employment_status, contract_type,
      start_date, archived_at, user_id, identity_status, identity_source, identity_linked_at,
      notes, created_at, updated_at
    ) values (
      new.id,
      coalesce(new.full_name, new.name, ''),
      new.phone, new.email, new.city, new.department,
      coalesce(new.position, new.job_title, new.role),
      coalesce(new.employment_status, new.status, 'active'),
      new.contract_type, new.start_date, new.archived_at, new.user_id,
      new.identity_status, new.identity_source, new.identity_linked_at,
      new.notes, coalesce(new.created_at, now()), coalesce(new.updated_at, now())
    )
    on conflict (id) do update set
      full_name = excluded.full_name,
      phone = excluded.phone,
      email = excluded.email,
      city = excluded.city,
      department = excluded.department,
      position = excluded.position,
      employment_status = excluded.employment_status,
      contract_type = excluded.contract_type,
      start_date = excluded.start_date,
      archived_at = excluded.archived_at,
      user_id = excluded.user_id,
      identity_status = excluded.identity_status,
      identity_source = excluded.identity_source,
      identity_linked_at = excluded.identity_linked_at,
      notes = excluded.notes,
      updated_at = excluded.updated_at;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_hr_staff_profiles_bridge on public.hr_staff_profiles;
create trigger trg_hr_staff_profiles_bridge
after insert or update or delete on public.hr_staff_profiles
for each row execute function public.fn_hr_sync_staff_bridge();

drop trigger if exists trg_hr_staff_bridge on public.hr_staff;
create trigger trg_hr_staff_bridge
after insert or update or delete on public.hr_staff
for each row execute function public.fn_hr_sync_staff_bridge();

create or replace function public.fn_hr_sync_candidate_bridge()
returns trigger
language plpgsql
as $$
begin
  if pg_trigger_depth() > 1 then
    return coalesce(new, old);
  end if;

  if tg_op = 'DELETE' then
    if tg_table_name = 'hr_candidates' then
      delete from public.hr_recruitment_candidates where id = old.id;
    else
      delete from public.hr_candidates where id = old.id;
    end if;
    return old;
  end if;

  if tg_table_name = 'hr_candidates' then
    insert into public.hr_recruitment_candidates (
      id, opening_id, job_id, full_name, phone, email, city, source, stage, pipeline_stage,
      status, rating, score, availability, availability_date, expected_salary, assigned_to,
      next_action, next_action_at, decision, risk_level, notes, created_at, updated_at
    ) values (
      new.id,
      coalesce(new.opening_id, new.job_id),
      new.job_id,
      coalesce(new.full_name, ''),
      new.phone, new.email, new.city, new.source,
      coalesce(new.stage, new.pipeline_stage, 'new'),
      coalesce(new.pipeline_stage, new.stage, 'new'),
      coalesce(new.status, 'active'),
      coalesce(new.rating, new.score, 0),
      coalesce(new.score, new.rating, 0),
      new.availability, new.availability_date, new.expected_salary, new.assigned_to,
      new.next_action, new.next_action_at, new.decision, new.risk_level, new.notes,
      coalesce(new.created_at, now()), coalesce(new.updated_at, now())
    )
    on conflict (id) do update set
      opening_id = excluded.opening_id,
      job_id = excluded.job_id,
      full_name = excluded.full_name,
      phone = excluded.phone,
      email = excluded.email,
      city = excluded.city,
      source = excluded.source,
      stage = excluded.stage,
      pipeline_stage = excluded.pipeline_stage,
      status = excluded.status,
      rating = excluded.rating,
      score = excluded.score,
      availability = excluded.availability,
      availability_date = excluded.availability_date,
      expected_salary = excluded.expected_salary,
      assigned_to = excluded.assigned_to,
      next_action = excluded.next_action,
      next_action_at = excluded.next_action_at,
      decision = excluded.decision,
      risk_level = excluded.risk_level,
      notes = excluded.notes,
      updated_at = excluded.updated_at;
  else
    insert into public.hr_candidates (
      id, opening_id, job_id, full_name, phone, email, city, source, stage, pipeline_stage,
      status, score, expected_salary, availability_date, interview_date, decision, notes,
      created_at, updated_at
    ) values (
      new.id,
      coalesce(new.opening_id, new.job_id),
      new.job_id,
      coalesce(new.full_name, ''),
      new.phone, new.email, new.city, new.source,
      coalesce(new.stage, new.pipeline_stage, 'new'),
      coalesce(new.pipeline_stage, new.stage, 'new'),
      coalesce(new.status, 'active'),
      coalesce(new.score, new.rating, 0),
      new.expected_salary, new.availability_date, null,
      new.decision, new.notes,
      coalesce(new.created_at, now()), coalesce(new.updated_at, now())
    )
    on conflict (id) do update set
      opening_id = excluded.opening_id,
      job_id = excluded.job_id,
      full_name = excluded.full_name,
      phone = excluded.phone,
      email = excluded.email,
      city = excluded.city,
      source = excluded.source,
      pipeline_stage = excluded.pipeline_stage,
      stage = excluded.stage,
      status = excluded.status,
      score = excluded.score,
      expected_salary = excluded.expected_salary,
      availability_date = excluded.availability_date,
      decision = excluded.decision,
      notes = excluded.notes,
      updated_at = excluded.updated_at;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_hr_candidates_bridge on public.hr_candidates;
create trigger trg_hr_candidates_bridge
after insert or update or delete on public.hr_candidates
for each row execute function public.fn_hr_sync_candidate_bridge();

drop trigger if exists trg_hr_recruitment_candidates_bridge on public.hr_recruitment_candidates;
create trigger trg_hr_recruitment_candidates_bridge
after insert or update or delete on public.hr_recruitment_candidates
for each row execute function public.fn_hr_sync_candidate_bridge();

create or replace function public.fn_hr_sync_training_bridge()
returns trigger
language plpgsql
as $$
begin
  if pg_trigger_depth() > 1 then
    return coalesce(new, old);
  end if;

  if tg_op = 'DELETE' then
    if tg_table_name = 'hr_training_assignments' then
      delete from public.hr_training_records where id = old.id;
    else
      delete from public.hr_training_assignments where id = old.id;
    end if;
    return old;
  end if;

  if tg_table_name = 'hr_training_assignments' then
    insert into public.hr_training_records (
      id, training_id, staff_id, user_id, staff_name, employee_name, staff_email, position_title,
      department, title, training_title, category, status, progress_percent, assigned_at, due_at,
      due_date, priority, notes, metadata, last_activity_at, completed_at, approved_at, created_at, updated_at
    ) values (
      new.id, new.training_id, new.staff_id, new.user_id, new.staff_name, new.employee_name, new.staff_email,
      new.position_title, new.department, new.title, new.training_title, new.category, new.status,
      new.progress_percent, new.assigned_at, new.due_at, new.due_date, new.priority, new.notes,
      coalesce(new.metadata, '{}'::jsonb), new.last_activity_at, new.completed_at, new.approved_at,
      coalesce(new.created_at, now()), coalesce(new.updated_at, now())
    )
    on conflict (id) do update set
      training_id = excluded.training_id,
      staff_id = excluded.staff_id,
      user_id = excluded.user_id,
      staff_name = excluded.staff_name,
      employee_name = excluded.employee_name,
      staff_email = excluded.staff_email,
      position_title = excluded.position_title,
      department = excluded.department,
      title = excluded.title,
      training_title = excluded.training_title,
      category = excluded.category,
      status = excluded.status,
      progress_percent = excluded.progress_percent,
      assigned_at = excluded.assigned_at,
      due_at = excluded.due_at,
      due_date = excluded.due_date,
      priority = excluded.priority,
      notes = excluded.notes,
      metadata = excluded.metadata,
      last_activity_at = excluded.last_activity_at,
      completed_at = excluded.completed_at,
      approved_at = excluded.approved_at,
      updated_at = excluded.updated_at;
  else
    insert into public.hr_training_assignments (
      id, training_id, staff_id, user_id, staff_name, employee_name, staff_email, position_title,
      department, title, training_title, category, status, progress_percent, assigned_at, due_at,
      due_date, priority, notes, metadata, last_activity_at, completed_at, approved_at, created_at, updated_at
    ) values (
      new.id, new.training_id, new.staff_id, new.user_id, new.staff_name, new.employee_name, new.staff_email,
      new.position_title, new.department, new.title, new.training_title, new.category, new.status,
      new.progress_percent, new.assigned_at, new.due_at, new.due_date, new.priority, new.notes,
      coalesce(new.metadata, '{}'::jsonb), new.last_activity_at, new.completed_at, new.approved_at,
      coalesce(new.created_at, now()), coalesce(new.updated_at, now())
    )
    on conflict (id) do update set
      training_id = excluded.training_id,
      staff_id = excluded.staff_id,
      user_id = excluded.user_id,
      staff_name = excluded.staff_name,
      employee_name = excluded.employee_name,
      staff_email = excluded.staff_email,
      position_title = excluded.position_title,
      department = excluded.department,
      title = excluded.title,
      training_title = excluded.training_title,
      category = excluded.category,
      status = excluded.status,
      progress_percent = excluded.progress_percent,
      assigned_at = excluded.assigned_at,
      due_at = excluded.due_at,
      due_date = excluded.due_date,
      priority = excluded.priority,
      notes = excluded.notes,
      metadata = excluded.metadata,
      last_activity_at = excluded.last_activity_at,
      completed_at = excluded.completed_at,
      approved_at = excluded.approved_at,
      updated_at = excluded.updated_at;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_hr_training_assignments_bridge on public.hr_training_assignments;
create trigger trg_hr_training_assignments_bridge
after insert or update or delete on public.hr_training_assignments
for each row execute function public.fn_hr_sync_training_bridge();

drop trigger if exists trg_hr_training_records_bridge on public.hr_training_records;
create trigger trg_hr_training_records_bridge
after insert or update or delete on public.hr_training_records
for each row execute function public.fn_hr_sync_training_bridge();

create index if not exists idx_hr_leave_requests_status on public.hr_leave_requests(status);
create index if not exists idx_hr_documents_status on public.hr_documents(status);
create index if not exists idx_hr_documents_staff on public.hr_documents(staff_id);
create index if not exists idx_hr_onboarding_tasks_status on public.hr_onboarding_tasks(status);
create index if not exists idx_hr_training_assignments_status on public.hr_training_assignments(status);
create index if not exists idx_hr_training_records_status on public.hr_training_records(status);
create index if not exists idx_hr_recruitment_candidates_stage on public.hr_recruitment_candidates(stage);
create index if not exists idx_hr_candidates_stage on public.hr_candidates(pipeline_stage);
create index if not exists idx_hr_schedule_activity_log_created_at on public.hr_schedule_activity_log(created_at desc);
