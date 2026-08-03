begin;

insert into storage.buckets (id,name,public) values ('angelcare360-report-cards','angelcare360-report-cards',false) on conflict(id) do update set public=false;

-- ANGELCARE 360 PRODUCT REALITY ENFORCEMENT & LONG-TERM MATURITY FINALIZATION
-- Additive only. Existing operational tables remain authoritative.

create table if not exists public.angelcare360_product_reality_operation_catalog (
  id uuid primary key default gen_random_uuid(),
  operation_key text not null unique,
  domain_key text not null,
  label text not null,
  description text,
  permission_key text not null,
  module_key text,
  capability_key text,
  feature_key text,
  lifecycle_guard text,
  requires_approval boolean not null default false,
  idempotent boolean not null default true,
  audit_event text not null,
  command_family text not null,
  operator_only boolean not null default false,
  status text not null default 'published',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status in ('draft','review','published','suspended','deprecated','retired','archived'))
);

alter table public.angelcare360_product_reality_operation_catalog add column if not exists operator_only boolean not null default false;

create table if not exists public.angelcare360_product_runtime_operation_gates (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  operation_key text not null references public.angelcare360_product_reality_operation_catalog(operation_key) on delete restrict,
  state text not null default 'enabled',
  reason text,
  priority integer not null default 100,
  effective_from timestamptz not null default now(),
  effective_to timestamptz,
  status text not null default 'active',
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(school_id, operation_key, priority, effective_from),
  check (state in ('enabled','blocked','suspended','approval_required')),
  check (status in ('active','inactive','archived'))
);

create table if not exists public.angelcare360_product_reality_policy_versions (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  policy_key text not null,
  domain_key text not null,
  name text not null,
  version_number integer not null default 1,
  configuration jsonb not null default '{}'::jsonb,
  status text not null default 'draft',
  effective_from timestamptz not null default now(),
  effective_to timestamptz,
  supersedes_policy_version_id uuid references public.angelcare360_product_reality_policy_versions(id) on delete set null,
  published_by uuid,
  published_at timestamptz,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(school_id, policy_key, version_number),
  check (status in ('draft','review','published','suspended','superseded','archived'))
);

create table if not exists public.angelcare360_product_reality_executions (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  operation_key text not null references public.angelcare360_product_reality_operation_catalog(operation_key) on delete restrict,
  entity_id uuid,
  idempotency_key text not null,
  state text not null default 'requested',
  request_payload jsonb not null default '{}'::jsonb,
  result_payload jsonb not null default '{}'::jsonb,
  reason text,
  effective_at timestamptz,
  requested_by uuid,
  requested_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  retry_count integer not null default 0,
  last_error text,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(school_id,idempotency_key),
  check (state in ('requested','validating','approved','executing','completed','partially_failed','failed','compensating','compensated','cancelled'))
);

create table if not exists public.angelcare360_product_reality_provisioning_events (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  tenant_id uuid,
  operation_key text not null,
  item_type text not null,
  item_key text not null,
  requested_quantity numeric,
  state text not null default 'requested',
  reason text,
  source_assignment_id uuid,
  entitlement_snapshot_id uuid,
  execution_id uuid references public.angelcare360_product_reality_executions(id) on delete set null,
  requested_by uuid,
  requested_at timestamptz not null default now(),
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  check (state in ('requested','checking','provisioning','verified','failed','rolled_back','cancelled'))
);

create table if not exists public.angelcare360_product_meter_consumption (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  tenant_id uuid,
  meter_key text not null,
  current_value numeric not null default 0,
  reserved_value numeric not null default 0,
  allowed_value numeric,
  unit text,
  status text not null default 'active',
  measured_at timestamptz not null default now(),
  source_entity_type text,
  source_entity_id uuid,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(school_id,meter_key),
  check (status in ('active','warning','reached','paused','stale','unknown'))
);

create table if not exists public.angelcare360_product_reality_workflow_definitions (
  id uuid primary key default gen_random_uuid(), school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  workflow_key text not null, domain_key text not null, name text not null, description text,
  status text not null default 'draft', created_by uuid, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(school_id,workflow_key)
);
create table if not exists public.angelcare360_product_reality_workflow_versions (
  id uuid primary key default gen_random_uuid(), school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  workflow_definition_id uuid not null references public.angelcare360_product_reality_workflow_definitions(id) on delete cascade,
  version_number integer not null, state_machine jsonb not null default '{}'::jsonb, status text not null default 'draft',
  effective_from timestamptz, effective_to timestamptz, published_by uuid, published_at timestamptz,
  created_by uuid, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(workflow_definition_id,version_number)
);
create table if not exists public.angelcare360_product_reality_workflow_instances (
  id uuid primary key default gen_random_uuid(), school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  domain_key text not null, workflow_key text not null, workflow_version_id uuid references public.angelcare360_product_reality_workflow_versions(id) on delete restrict,
  entity_type text not null, entity_id uuid not null, current_state text not null, status text not null default 'active',
  started_by uuid, started_at timestamptz not null default now(), completed_at timestamptz,
  metadata_json jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(school_id,workflow_key,entity_type,entity_id)
);
create table if not exists public.angelcare360_product_reality_workflow_events (
  id uuid primary key default gen_random_uuid(), school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  workflow_instance_id uuid not null references public.angelcare360_product_reality_workflow_instances(id) on delete cascade,
  from_state text, to_state text not null, operation_key text, reason text, evidence_json jsonb not null default '{}'::jsonb,
  actor_user_id uuid, execution_id uuid references public.angelcare360_product_reality_executions(id) on delete set null,
  occurred_at timestamptz not null default now()
);
create table if not exists public.angelcare360_product_reality_approvals (
  id uuid primary key default gen_random_uuid(), school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  operation_key text not null, entity_type text not null, entity_id uuid, decision text not null default 'pending',
  reason text, evidence_json jsonb not null default '{}'::jsonb, requested_by uuid, requested_at timestamptz not null default now(),
  decided_by uuid, decided_at timestamptz, execution_id uuid references public.angelcare360_product_reality_executions(id) on delete set null,
  status text not null default 'open', created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.angelcare360_product_reality_approvals add column if not exists request_payload jsonb not null default '{}'::jsonb;
alter table public.angelcare360_product_reality_approvals add column if not exists decision_result jsonb not null default '{}'::jsonb;
alter table public.angelcare360_product_reality_approvals add column if not exists idempotency_key text;
alter table public.angelcare360_product_reality_approvals add column if not exists requested_execution_id uuid references public.angelcare360_product_reality_executions(id) on delete set null;
create unique index if not exists ac360_reality_approval_idempotency_uq on public.angelcare360_product_reality_approvals(school_id,idempotency_key) where idempotency_key is not null;

create table if not exists public.angelcare360_product_reality_evidence_bindings (
  id uuid primary key default gen_random_uuid(), school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  evidence_type text not null, document_id uuid references public.angelcare360_documents(id) on delete set null,
  entity_type text not null, entity_id uuid, workflow_instance_id uuid references public.angelcare360_product_reality_workflow_instances(id) on delete set null,
  sensitivity text not null default 'standard', validation_state text not null default 'submitted', submitted_by uuid, submitted_at timestamptz not null default now(),
  validated_by uuid, validated_at timestamptz, retention_policy text, checksum text, metadata_json jsonb not null default '{}'::jsonb
);
create table if not exists public.angelcare360_product_reality_exceptions (
  id uuid primary key default gen_random_uuid(), school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  domain_key text not null, domain text, title text not null, detail text, status text not null default 'open', severity text not null default 'warning',
  operation_key text, entity_type text, entity_id uuid, owner_user_id uuid, due_at timestamptz,
  resolution text, resolved_by uuid, resolved_at timestamptz, metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.angelcare360_institution_lifecycle_events (
  id uuid primary key default gen_random_uuid(), school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  institution_id uuid not null references public.angelcare360_schools(id) on delete cascade, from_state text, to_state text not null, reason text,
  policy_version integer, effective_at timestamptz not null default now(), execution_id uuid references public.angelcare360_product_reality_executions(id) on delete set null,
  actor_user_id uuid, created_at timestamptz not null default now()
);
create table if not exists public.angelcare360_academic_year_lifecycle_events (
  id uuid primary key default gen_random_uuid(), school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  academic_year_id uuid not null references public.angelcare360_academic_years(id) on delete cascade, from_state text, to_state text not null, reason text,
  policy_version integer, effective_at timestamptz not null default now(), execution_id uuid references public.angelcare360_product_reality_executions(id) on delete set null,
  actor_user_id uuid, created_at timestamptz not null default now()
);
create table if not exists public.angelcare360_academic_year_rollover_runs (
  id uuid primary key default gen_random_uuid(), school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  source_academic_year_id uuid not null references public.angelcare360_academic_years(id) on delete restrict,
  target_academic_year_id uuid not null references public.angelcare360_academic_years(id) on delete restrict,
  run_code text not null, status text not null default 'draft', idempotency_key text,
  summary_json jsonb not null default '{}'::jsonb, result_json jsonb not null default '{}'::jsonb,
  requested_by uuid, requested_at timestamptz not null default now(), executed_by uuid, executed_at timestamptz,
  execution_id uuid references public.angelcare360_product_reality_executions(id) on delete set null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(school_id,run_code)
);
create table if not exists public.angelcare360_academic_year_rollover_items (
  id uuid primary key default gen_random_uuid(), school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  rollover_run_id uuid not null references public.angelcare360_academic_year_rollover_runs(id) on delete cascade,
  student_id uuid not null references public.angelcare360_students(id) on delete restrict,
  source_class_id uuid, source_section_id uuid, decision text not null, target_class_id uuid, target_section_id uuid,
  status text not null default 'proposed', result_json jsonb not null default '{}'::jsonb, metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(rollover_run_id,student_id)
);

create table if not exists public.angelcare360_people_master (
  id uuid primary key default gen_random_uuid(), school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  person_code text not null, full_name text not null, first_name text, last_name text, date_of_birth date, national_id text, email text, phone text,
  normalized_name text, normalized_email text, normalized_phone text, source_type text, source_id uuid,
  status text not null default 'active', merged_into_person_id uuid references public.angelcare360_people_master(id) on delete set null,
  created_by uuid, updated_by uuid, metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(school_id,source_type,source_id), unique(school_id,person_code)
);
create table if not exists public.angelcare360_person_role_links (
  id uuid primary key default gen_random_uuid(), school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  person_id uuid not null references public.angelcare360_people_master(id) on delete cascade,
  role_type text not null, role_record_id uuid not null, status text not null default 'active', effective_from timestamptz, effective_to timestamptz,
  created_by uuid, updated_by uuid, metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(school_id,role_type,role_record_id)
);
create table if not exists public.angelcare360_person_merge_plans (
  id uuid primary key default gen_random_uuid(), school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  survivor_person_id uuid not null references public.angelcare360_people_master(id) on delete restrict,
  source_person_id uuid not null references public.angelcare360_people_master(id) on delete restrict,
  reason text, impact_json jsonb not null default '{}'::jsonb, status text not null default 'draft',
  approved_by uuid, approved_at timestamptz, executed_by uuid, executed_at timestamptz,
  execution_id uuid references public.angelcare360_product_reality_executions(id) on delete set null, created_by uuid,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.angelcare360_guardian_authorities (
  id uuid primary key default gen_random_uuid(), school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  student_id uuid not null references public.angelcare360_students(id) on delete cascade,
  parent_id uuid not null references public.angelcare360_parents(id) on delete cascade,
  authority_type text not null, relationship_type text, legal_guardian boolean not null default false, custody_authority boolean not null default false,
  financial_responsibility boolean not null default false, communication_priority integer not null default 0, emergency_priority integer not null default 0,
  pickup_authorized boolean not null default false, restricted_contact boolean not null default false,
  effective_from date not null default current_date, effective_to date, evidence_document_id uuid references public.angelcare360_documents(id) on delete set null,
  restrictions_json jsonb not null default '{}'::jsonb, status text not null default 'active', created_by uuid, updated_by uuid,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(school_id,student_id,parent_id,authority_type,effective_from)
);
create table if not exists public.angelcare360_student_lifecycle_events (
  id uuid primary key default gen_random_uuid(), school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  student_id uuid not null references public.angelcare360_students(id) on delete cascade, from_state text, to_state text not null, reason text,
  effective_at timestamptz not null default now(), source_type text, source_id uuid,
  execution_id uuid references public.angelcare360_product_reality_executions(id) on delete set null, actor_user_id uuid,
  before_snapshot jsonb not null default '{}'::jsonb, after_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.angelcare360_admission_interviews (
  id uuid primary key default gen_random_uuid(), school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  application_id uuid not null references public.angelcare360_admission_applications(id) on delete cascade,
  interview_code text not null, scheduled_at timestamptz, completed_at timestamptz, interviewer_user_id uuid,
  format text not null default 'in_person', location text, template_version_id uuid,
  criteria_json jsonb not null default '{}'::jsonb, outcome text, recommendation text, notes text,
  status text not null default 'scheduled', created_by uuid, updated_by uuid,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(school_id,interview_code)
);
create table if not exists public.angelcare360_admission_decisions (
  id uuid primary key default gen_random_uuid(), school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  application_id uuid not null references public.angelcare360_admission_applications(id) on delete cascade,
  decision text not null, reason text, conditions_json jsonb not null default '{}'::jsonb, evidence_json jsonb not null default '{}'::jsonb,
  authority_user_id uuid, decision_at timestamptz not null default now(), status text not null default 'final',
  execution_id uuid references public.angelcare360_product_reality_executions(id) on delete set null,
  created_by uuid, updated_by uuid, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(school_id,application_id)
);
create table if not exists public.angelcare360_admission_workflow_events (
  id uuid primary key default gen_random_uuid(), school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  application_id uuid not null references public.angelcare360_admission_applications(id) on delete cascade,
  from_stage text, to_stage text not null, reason text, policy_version integer,
  execution_id uuid references public.angelcare360_product_reality_executions(id) on delete set null,
  actor_user_id uuid, created_at timestamptz not null default now()
);

create table if not exists public.angelcare360_school_day_rules (
  id uuid primary key default gen_random_uuid(), school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  academic_year_id uuid not null references public.angelcare360_academic_years(id) on delete cascade,
  day_of_week integer not null, is_operational boolean not null default true, starts_at time, ends_at time,
  status text not null default 'active', created_by uuid, updated_by uuid, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(school_id,academic_year_id,day_of_week), check(day_of_week between 1 and 7)
);
create table if not exists public.angelcare360_timetable_publication_versions (
  id uuid primary key default gen_random_uuid(), school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  academic_year_id uuid not null references public.angelcare360_academic_years(id) on delete restrict,
  version_number integer not null, version_code text not null, status text not null default 'draft',
  effective_from timestamptz, effective_to timestamptz, source_signature text not null, slot_snapshot jsonb not null default '[]'::jsonb,
  supersedes_version_id uuid references public.angelcare360_timetable_publication_versions(id) on delete set null,
  published_by uuid, published_at timestamptz, superseded_at timestamptz,
  execution_id uuid references public.angelcare360_product_reality_executions(id) on delete set null, created_by uuid,
  created_at timestamptz not null default now(), unique(school_id,academic_year_id,version_number), unique(school_id,academic_year_id,source_signature)
);
create table if not exists public.angelcare360_curriculum_versions (
  id uuid primary key default gen_random_uuid(), school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  academic_year_id uuid not null references public.angelcare360_academic_years(id) on delete cascade,
  class_id uuid references public.angelcare360_classes(id) on delete cascade, subject_id uuid references public.angelcare360_subjects(id) on delete cascade,
  curriculum_code text not null, name text not null, version_number integer not null default 1, status text not null default 'draft',
  effective_from date, effective_to date, supersedes_version_id uuid references public.angelcare360_curriculum_versions(id) on delete set null,
  published_by uuid, published_at timestamptz, created_by uuid, updated_by uuid,
  metadata_json jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(school_id,curriculum_code,version_number)
);
create table if not exists public.angelcare360_curriculum_units (
  id uuid primary key default gen_random_uuid(), school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  curriculum_version_id uuid not null references public.angelcare360_curriculum_versions(id) on delete cascade,
  unit_code text not null, title text not null, objective text, planned_order integer not null default 1,
  planned_hours numeric, status text not null default 'active', metadata_json jsonb not null default '{}'::jsonb,
  created_by uuid, updated_by uuid, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(curriculum_version_id,unit_code)
);
create table if not exists public.angelcare360_grading_policy_versions (
  id uuid primary key default gen_random_uuid(), school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  academic_year_id uuid references public.angelcare360_academic_years(id) on delete cascade,
  term_id uuid references public.angelcare360_terms(id) on delete set null, class_id uuid references public.angelcare360_classes(id) on delete set null,
  subject_id uuid references public.angelcare360_subjects(id) on delete set null, policy_code text not null,
  version_number integer not null default 1, specificity integer not null default 0,
  minimum_score numeric not null default 0, maximum_score numeric not null default 20, passing_score numeric not null default 10,
  rounding_decimals integer not null default 2, missing_grade_behavior text not null default 'exclude_until_finalization',
  exemption_behavior text not null default 'exclude', weight_normalization boolean not null default true,
  configuration jsonb not null default '{}'::jsonb, status text not null default 'draft', effective_from timestamptz not null default now(), effective_to timestamptz,
  published_by uuid, published_at timestamptz, created_by uuid, updated_by uuid, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(school_id,policy_code,version_number)
);
create table if not exists public.angelcare360_grade_revisions (
  id uuid primary key default gen_random_uuid(), school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  mark_id uuid not null references public.angelcare360_marks(id) on delete cascade, revision_number integer not null default 1,
  before_snapshot jsonb not null default '{}'::jsonb, after_snapshot jsonb not null default '{}'::jsonb, reason text,
  policy_version_id uuid references public.angelcare360_grading_policy_versions(id) on delete set null,
  correction_request_id uuid references public.angelcare360_grade_correction_requests(id) on delete set null,
  execution_id uuid references public.angelcare360_product_reality_executions(id) on delete set null, changed_by uuid,
  created_at timestamptz not null default now()
);
create table if not exists public.angelcare360_report_card_document_versions (
  id uuid primary key default gen_random_uuid(), school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  report_card_id uuid not null references public.angelcare360_report_cards(id) on delete cascade,
  document_id uuid references public.angelcare360_documents(id) on delete set null,
  version_number integer not null, version_code text not null, source_signature text not null, document_sha256 text not null,
  file_path text not null, storage_bucket text not null default 'angelcare360-report-cards', file_size_bytes bigint,
  template_assignment_id uuid, template_version integer, status text not null default 'generated',
  supersedes_version_id uuid references public.angelcare360_report_card_document_versions(id) on delete set null,
  generated_by uuid, generated_at timestamptz not null default now(), approved_by uuid, approved_at timestamptz,
  published_by uuid, published_at timestamptz, superseded_at timestamptz,
  execution_id uuid references public.angelcare360_product_reality_executions(id) on delete set null, created_by uuid,
  created_at timestamptz not null default now(), unique(report_card_id,version_number), unique(report_card_id,document_sha256,status)
);
create table if not exists public.angelcare360_notification_intents (
  id uuid primary key default gen_random_uuid(), school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  intent_type text not null, source_entity_type text not null, source_entity_id uuid not null, recipient_id uuid,
  template_purpose text not null, deduplication_key text not null, channel_eligibility jsonb not null default '[]'::jsonb,
  status text not null default 'pending', entitlement_state text not null default 'eligible', requested_by uuid, requested_at timestamptz not null default now(),
  processed_at timestamptz, delivery_reference text, failure_reason text, metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(school_id,deduplication_key)
);


-- Long-term historical assignments and operational exceptions omitted by the original operational schema.
create table if not exists public.angelcare360_student_enrollments (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  student_id uuid not null references public.angelcare360_students(id) on delete cascade,
  academic_year_id uuid not null references public.angelcare360_academic_years(id) on delete restrict,
  class_id uuid references public.angelcare360_classes(id) on delete set null,
  section_id uuid references public.angelcare360_sections(id) on delete set null,
  enrollment_code text not null,
  enrollment_type text not null default 'standard',
  lifecycle_state text not null default 'enrolled',
  starts_on date not null default current_date,
  ends_on date,
  effective_from timestamptz not null default now(),
  effective_to timestamptz,
  source_type text,
  source_id uuid,
  status text not null default 'active',
  created_by uuid,
  updated_by uuid,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(school_id,student_id,academic_year_id),
  unique(school_id,enrollment_code),
  check(status in ('active','completed','transferred','withdrawn','graduated','superseded','archived'))
);

create table if not exists public.angelcare360_planned_absences (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  student_id uuid not null references public.angelcare360_students(id) on delete cascade,
  academic_year_id uuid not null references public.angelcare360_academic_years(id) on delete restrict,
  starts_on date not null,
  ends_on date not null,
  reason text not null,
  evidence_document_id uuid references public.angelcare360_documents(id) on delete set null,
  approval_state text not null default 'pending',
  approved_by uuid,
  approved_at timestamptz,
  reconciliation_state text not null default 'pending',
  requested_by uuid,
  execution_id uuid references public.angelcare360_product_reality_executions(id) on delete set null,
  status text not null default 'active',
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check(ends_on >= starts_on),
  check(approval_state in ('pending','approved','rejected','cancelled')),
  check(reconciliation_state in ('pending','scheduled','reconciled','failed')),
  check(status in ('active','completed','cancelled','archived'))
);

create table if not exists public.angelcare360_timetable_substitute_assignments (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  timetable_slot_id uuid not null references public.angelcare360_timetable_slots(id) on delete cascade,
  original_staff_id uuid references public.angelcare360_staff(id) on delete set null,
  substitute_staff_id uuid not null references public.angelcare360_staff(id) on delete restrict,
  effective_from date not null,
  effective_to date not null,
  reason text not null,
  approval_state text not null default 'approved',
  approved_by uuid,
  approved_at timestamptz,
  execution_id uuid references public.angelcare360_product_reality_executions(id) on delete set null,
  status text not null default 'active',
  created_by uuid,
  updated_by uuid,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(school_id,timetable_slot_id,effective_from,effective_to),
  check(effective_to >= effective_from),
  check(status in ('active','completed','cancelled','archived'))
);

create table if not exists public.angelcare360_report_card_template_assignments (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  academic_year_id uuid references public.angelcare360_academic_years(id) on delete cascade,
  class_id uuid references public.angelcare360_classes(id) on delete cascade,
  template_key text not null,
  template_version integer not null default 1,
  configuration jsonb not null default '{}'::jsonb,
  effective_from timestamptz not null default now(),
  effective_to timestamptz,
  status text not null default 'published',
  published_by uuid,
  published_at timestamptz,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(school_id,academic_year_id,class_id,template_key,template_version),
  check(status in ('draft','review','published','superseded','archived'))
);
alter table public.angelcare360_report_card_document_versions add column if not exists storage_bucket text not null default 'angelcare360-report-cards';
alter table public.angelcare360_report_card_document_versions add column if not exists template_assignment_id uuid;
alter table public.angelcare360_report_card_document_versions add column if not exists template_version integer;

do $$ begin
  if not exists (select 1 from pg_constraint where conname='ac360_report_doc_template_assignment_fk') then
    alter table public.angelcare360_report_card_document_versions add constraint ac360_report_doc_template_assignment_fk foreign key(template_assignment_id) references public.angelcare360_report_card_template_assignments(id) on delete set null;
  end if;
end $$;

-- Extend MZ1 Product Kernel entitlement rows to carry capability/service truth and units.
alter table public.angelcare360_operator_tenant_entitlement_items add column if not exists unit text;
do $$ declare c record; begin
  for c in select conname from pg_constraint where conrelid='public.angelcare360_operator_tenant_entitlement_items'::regclass and contype='c' and pg_get_constraintdef(oid) ilike '%item_type%' loop
    execute format('alter table public.angelcare360_operator_tenant_entitlement_items drop constraint %I',c.conname);
  end loop;
end $$;
alter table public.angelcare360_operator_tenant_entitlement_items add constraint ac360_entitlement_items_type_reality_ck check (item_type in ('module','capability','feature','addon','meter','service'));

-- Extend MZ2/MZ3 evidence ledgers so approvals execute real mutations.
alter table public.angelcare360_customer_management_decisions add column if not exists operation_key text;
alter table public.angelcare360_customer_management_decisions add column if not exists operation_payload jsonb not null default '{}'::jsonb;
alter table public.angelcare360_customer_management_decisions add column if not exists decision_result jsonb not null default '{}'::jsonb;
alter table public.angelcare360_people_duplicate_cases add column if not exists pair_key text;
alter table public.angelcare360_people_duplicate_cases add column if not exists left_person_id uuid references public.angelcare360_people_master(id) on delete set null;
alter table public.angelcare360_people_duplicate_cases add column if not exists right_person_id uuid references public.angelcare360_people_master(id) on delete set null;
alter table public.angelcare360_people_duplicate_cases add column if not exists confidence_score numeric(5,2) not null default 0;
alter table public.angelcare360_people_duplicate_cases add column if not exists matching_evidence jsonb not null default '{}'::jsonb;
alter table public.angelcare360_people_duplicate_cases add column if not exists conflicting_fields jsonb not null default '{}'::jsonb;
alter table public.angelcare360_people_duplicate_cases add column if not exists severity text not null default 'warning';
alter table public.angelcare360_people_duplicate_cases add column if not exists metadata_json jsonb not null default '{}'::jsonb;
alter table public.angelcare360_people_duplicate_cases add column if not exists execution_result jsonb not null default '{}'::jsonb;
update public.angelcare360_people_duplicate_cases set pair_key=coalesce(pair_key,id::text), confidence_score=greatest(confidence_score,match_score) where pair_key is null;
create unique index if not exists ac360_people_duplicate_pair_idx on public.angelcare360_people_duplicate_cases(school_id,pair_key) where pair_key is not null;
alter table public.angelcare360_admission_conversion_runs add column if not exists severity text not null default 'info';
alter table public.angelcare360_admission_conversion_runs add column if not exists requested_by uuid;
alter table public.angelcare360_admission_conversion_runs add column if not exists resolved_by uuid;
alter table public.angelcare360_admission_conversion_runs add column if not exists resolved_at timestamptz;
alter table public.angelcare360_admission_conversion_runs add column if not exists result_json jsonb not null default '{}'::jsonb;
alter table public.angelcare360_admission_conversion_runs add column if not exists metadata_json jsonb not null default '{}'::jsonb;
alter table public.angelcare360_admission_conversion_runs add column if not exists updated_at timestamptz not null default now();
do $$ declare c record; begin
  for c in select conname from pg_constraint where conrelid='public.angelcare360_admission_conversion_runs'::regclass and contype='c' and pg_get_constraintdef(oid) ilike '%status%' loop execute format('alter table public.angelcare360_admission_conversion_runs drop constraint %I',c.conname); end loop;
end $$;
alter table public.angelcare360_admission_conversion_runs add constraint ac360_admission_conversion_status_reality_ck check(status in ('pending','running','completed','succeeded','partially_succeeded','failed','rolled_back'));

alter table public.angelcare360_attendance_day_closures add column if not exists closure_code text;
alter table public.angelcare360_attendance_day_closures add column if not exists class_id uuid references public.angelcare360_classes(id) on delete set null;
create unique index if not exists ac360_attendance_closure_code_idx on public.angelcare360_attendance_day_closures(school_id,closure_code) where closure_code is not null;
alter table public.angelcare360_average_computation_revisions add column if not exists subject_id uuid references public.angelcare360_subjects(id) on delete set null;
alter table public.angelcare360_average_computation_revisions add column if not exists execution_id uuid references public.angelcare360_product_reality_executions(id) on delete set null;
alter table public.angelcare360_report_card_publication_runs add column if not exists publication_code text;
create unique index if not exists ac360_report_publication_code_idx on public.angelcare360_report_card_publication_runs(school_id,publication_code) where publication_code is not null;
alter table public.angelcare360_attendance_correction_requests add column if not exists execution_result jsonb not null default '{}'::jsonb;
alter table public.angelcare360_attendance_day_closures add column if not exists execution_result jsonb not null default '{}'::jsonb;
alter table public.angelcare360_timetable_publication_runs add column if not exists execution_result jsonb not null default '{}'::jsonb;
alter table public.angelcare360_grade_correction_requests add column if not exists execution_result jsonb not null default '{}'::jsonb;
alter table public.angelcare360_academic_validation_batches add column if not exists execution_result jsonb not null default '{}'::jsonb;
alter table public.angelcare360_report_card_publication_runs add column if not exists execution_result jsonb not null default '{}'::jsonb;

-- Base operational schema extensions used by the real execution engine.
alter table public.angelcare360_marks add column if not exists mark_state text not null default 'entered';
do $$ declare c record; begin
  for c in select conname from pg_constraint where conrelid='public.angelcare360_attendance_records'::regclass and contype='c' and pg_get_constraintdef(oid) ilike '%attendance_status%' loop execute format('alter table public.angelcare360_attendance_records drop constraint %I',c.conname); end loop;
end $$;
alter table public.angelcare360_attendance_records add constraint ac360_attendance_status_reality_ck check(attendance_status in ('present','absent','late','excused','authorized_absence','medical_absence','remote','left_early','unmarked'));
do $$ declare c record; begin
  for c in select conname from pg_constraint where conrelid='public.angelcare360_lessons'::regclass and contype='c' and pg_get_constraintdef(oid) ilike '%status%' loop execute format('alter table public.angelcare360_lessons drop constraint %I',c.conname); end loop;
end $$;
alter table public.angelcare360_lessons add constraint ac360_lessons_status_reality_ck check(status in ('planned','scheduled','delivered','partially_delivered','rescheduled','cancelled','completed','archived'));
do $$ declare c record; begin
  for c in select conname from pg_constraint where conrelid='public.angelcare360_assignments'::regclass and contype='c' and pg_get_constraintdef(oid) ilike '%status%' loop execute format('alter table public.angelcare360_assignments drop constraint %I',c.conname); end loop;
end $$;
alter table public.angelcare360_assignments add constraint ac360_assignments_status_reality_ck check(status in ('draft','review','published','active','due','closed','review_in_progress','completed','archived'));
do $$ declare c record; begin
  for c in select conname from pg_constraint where conrelid='public.angelcare360_assignment_submissions'::regclass and contype='c' and pg_get_constraintdef(oid) ilike '%status%' loop execute format('alter table public.angelcare360_assignment_submissions drop constraint %I',c.conname); end loop;
end $$;
alter table public.angelcare360_assignment_submissions add constraint ac360_submission_status_reality_ck check(status in ('expected','draft','not_submitted','submitted','late','returned','resubmission_requested','resubmitted','reviewed','completed','graded','archived'));

-- Runtime operation catalogue generated from the signed registry.
insert into public.angelcare360_product_reality_operation_catalog(
  operation_key,domain_key,label,description,permission_key,module_key,capability_key,feature_key,lifecycle_guard,requires_approval,idempotent,audit_event,command_family,operator_only
) values
  ('product.entitlement.assert', 'product', 'Valider le droit effectif', 'Vérifie package, entitlement, provisioning, opération et capacité avant mutation.', 'administration.view', 'administration', 'administration.overview', null, null, false, true, 'product.entitlement.asserted', 'product', false),
  ('product.policy.publish', 'product', 'Publier une policy versionnée', 'Crée et publie une version effective de doctrine opérationnelle.', 'administration.update', 'administration', 'administration.parametres', null, null, true, true, 'product.policy.published', 'product', true),
  ('product.operation_gate.upsert', 'product', 'Gouverner une opération runtime', 'Active, bloque, suspend ou soumet à approbation une opération tenant.', 'administration.update', 'administration', 'administration.parametres', null, null, true, true, 'product.operation_gate.updated', 'product', true),
  ('product.approval.decide', 'product', 'Décider une approbation runtime', 'Approuve ou rejette une opération gouvernée puis exécute sa mutation réelle.', 'administration.update', 'administration', 'administration.parametres', null, 'shared_approval', false, true, 'product.approval.decided', 'product', true),
  ('institution.transition', 'institution', 'Changer le lifecycle établissement', 'Applique une transition gouvernée après readiness.', 'administration.update', 'administration', 'administration.etablissements', null, 'institution_lifecycle', true, true, 'institution.transitioned', 'institution', false),
  ('academic_year.transition', 'academic_year', 'Changer le lifecycle année scolaire', 'Publie, active, clôture ou archive une année scolaire.', 'annees_scolaires.update', 'administration', 'administration.annees_scolaires', null, 'academic_year_lifecycle', true, true, 'academic_year.transitioned', 'academic_year', false),
  ('academic_year.rollover.preview', 'academic_year', 'Préparer le rollover', 'Construit les propositions de promotion, redoublement, transfert et sortie.', 'annees_scolaires.update', 'administration', 'administration.annees_scolaires', null, 'academic_year_rollover', false, true, 'academic_year.rollover.previewed', 'rollover', false),
  ('academic_year.rollover.execute', 'academic_year', 'Exécuter le rollover', 'Applique les décisions approuvées sans dupliquer les affectations.', 'annees_scolaires.update', 'administration', 'administration.annees_scolaires', null, 'academic_year_rollover', true, true, 'academic_year.rollover.executed', 'rollover', false),
  ('person.identity.synchronize', 'people', 'Synchroniser l’identité canonique', 'Crée ou relie le person master aux rôles élève, parent et personnel.', 'people.update', 'people', 'people.overview', null, null, false, true, 'person.identity.synchronized', 'people', false),
  ('person.duplicates.scan', 'people', 'Scanner les doublons', 'Détecte les rapprochements documentés sans fusion automatique.', 'people.update', 'people', 'people.qualite_donnees', null, null, false, true, 'person.duplicates.scanned', 'people', false),
  ('person.merge.execute', 'people', 'Fusionner deux personnes', 'Réconcilie les rôles et références puis archive la source.', 'people.update', 'people', 'people.qualite_donnees', null, 'person_merge', true, true, 'person.merge.executed', 'people', false),
  ('guardian.authority.upsert', 'guardian', 'Gouverner une autorité guardian', 'Distingue relation, garde, paiement, communication, urgence et pickup.', 'parents.update', 'people', 'people.relations', null, 'guardian_authority', true, true, 'guardian.authority.updated', 'guardian', false),
  ('student.transition', 'student', 'Changer le lifecycle élève', 'Applique inscription, suspension, transfert, retrait, promotion ou graduation.', 'eleves.update', 'people', 'people.eleves', null, 'student_lifecycle', true, true, 'student.transitioned', 'student', false),
  ('admission.transition', 'admissions', 'Faire progresser une admission', 'Applique une transition versionnée avec historique.', 'admissions.update', 'admissions', 'admissions.pipeline', null, 'admission_workflow', false, true, 'admission.transitioned', 'admissions', false),
  ('admission.interview.record', 'admissions', 'Enregistrer un entretien', 'Persiste agenda, grille, outcome et recommandation.', 'admissions.update', 'admissions', 'admissions.entretiens', null, 'admission_workflow', false, true, 'admission.interview.recorded', 'admissions', false),
  ('admission.decision.record', 'admissions', 'Décider une admission', 'Valide capacité, autorité et evidence avant décision.', 'admissions.update', 'admissions', 'admissions.decisions', null, 'admission_workflow', true, true, 'admission.decision.recorded', 'admissions', false),
  ('admission.convert', 'admissions', 'Convertir en élève', 'Crée ou réutilise student, guardian, lien, enrollment et assignment.', 'admissions.update', 'admissions', 'admissions.conversions', null, 'admission_workflow', true, true, 'admission.converted', 'admissions', false),
  ('attendance.planned_absence.upsert', 'attendance', 'Gouverner une absence planifiée', 'Enregistre une absence future, son evidence et sa reconciliation de présence.', 'attendance.update', 'attendance', 'presences.absences', null, 'attendance_calendar', true, true, 'attendance.planned_absence.updated', 'attendance', false),
  ('attendance.mark', 'attendance', 'Marquer la présence', 'Upsert autoritaire et unique dans une session non clôturée.', 'attendance.update', 'attendance', 'presences.jour', null, 'attendance_calendar', false, true, 'attendance.marked', 'attendance', false),
  ('attendance.correction.request', 'attendance', 'Demander une correction', 'Capture avant/après, reason et evidence.', 'attendance.update', 'attendance', 'presences.corrections', null, 'attendance_correction', false, true, 'attendance.correction.requested', 'attendance', false),
  ('attendance.correction.approve', 'attendance', 'Appliquer une correction', 'Met à jour le record réel et son historique.', 'attendance.update', 'attendance', 'presences.corrections', null, 'attendance_correction', true, true, 'attendance.correction.applied', 'attendance', false),
  ('attendance.close', 'attendance', 'Clôturer la présence', 'Verrouille les sessions après readiness.', 'attendance.update', 'attendance', 'presences.cloture', null, 'attendance_closure', true, true, 'attendance.closed', 'attendance', false),
  ('attendance.reopen', 'attendance', 'Rouvrir la présence', 'Rouvre une session verrouillée avec justification.', 'attendance.update', 'attendance', 'presences.cloture', null, 'attendance_closure', true, true, 'attendance.reopened', 'attendance', false),
  ('timetable.slot.upsert', 'timetable', 'Enregistrer un créneau', 'Valide professeur, classe, matière, horaires et conflits.', 'emploi_du_temps.update', 'academics', 'emploi_du_temps.classes', null, 'timetable_constraints', false, true, 'timetable.slot.saved', 'timetable', false),
  ('timetable.slot.archive', 'timetable', 'Archiver un créneau', 'Archive un brouillon ou crée une révision de suppression.', 'emploi_du_temps.update', 'academics', 'emploi_du_temps.classes', null, 'timetable_constraints', false, true, 'timetable.slot.archived', 'timetable', false),
  ('timetable.substitute.assign', 'timetable', 'Affecter un remplaçant', 'Versionne une couverture temporaire et son impact planning.', 'emploi_du_temps.update', 'academics', 'emploi_du_temps.enseignants', null, 'timetable_constraints', true, true, 'timetable.substitute.assigned', 'timetable', false),
  ('timetable.publish', 'timetable', 'Publier un emploi du temps', 'Crée un snapshot immutable et supersède la version antérieure.', 'emploi_du_temps.update', 'academics', 'emploi_du_temps.calendrier', null, 'timetable_publication', true, true, 'timetable.published', 'timetable', false),
  ('curriculum.unit.upsert', 'curriculum', 'Gouverner une unité curriculum', 'Crée ou révise une unité, ses objectifs et sa séquence.', 'academics.update', 'academics', 'academique.cours', null, 'curriculum_version', false, true, 'curriculum.unit.updated', 'curriculum', false),
  ('curriculum.version.publish', 'curriculum', 'Publier un programme', 'Publie une version curriculum historisable.', 'academics.update', 'academics', 'academique.cours', null, 'curriculum_version', true, true, 'curriculum.version.published', 'curriculum', false),
  ('lesson.transition', 'curriculum', 'Changer l’état d’un cours', 'Passe un cours planifié à livré, partiel, reporté ou annulé.', 'academics.update', 'academics', 'academique.cours', null, 'lesson_lifecycle', false, true, 'lesson.transitioned', 'curriculum', false),
  ('homework.transition', 'homework', 'Changer l’état d’un devoir', 'Gouverne publication, échéance, clôture, review et archive.', 'academics.update', 'academics', 'academique.devoirs', null, 'homework_lifecycle', false, true, 'homework.transitioned', 'homework', false),
  ('submission.transition', 'homework', 'Changer l’état d’une soumission', 'Gouverne remise, retard, retour, resoumission et review.', 'academics.update', 'academics', 'academique.soumissions', null, 'submission_lifecycle', false, true, 'submission.transitioned', 'homework', false),
  ('grade.record', 'assessment', 'Enregistrer une note', 'Valide scale, étudiant, assessment et policy version.', 'academics.update', 'academics', 'academique.notes', null, 'grading_policy', false, true, 'grade.recorded', 'assessment', false),
  ('grade.correction.request', 'assessment', 'Demander une correction de note', 'Capture la revision souhaitée et son evidence.', 'academics.update', 'academics', 'academique.notes', null, 'grading_policy', false, true, 'grade.correction.requested', 'assessment', false),
  ('grade.correction.approve', 'assessment', 'Appliquer une correction de note', 'Met à jour la note réelle, crée revision et invalide les résultats.', 'academics.update', 'academics', 'academique.notes', null, 'grading_policy', true, true, 'grade.correction.applied', 'assessment', false),
  ('average.recompute', 'assessment', 'Recalculer les moyennes', 'Recalcule de façon déterministe avec preuve des inputs.', 'academics.update', 'academics', 'academique.moyennes', null, 'grading_policy', false, true, 'average.recomputed', 'assessment', false),
  ('academic.validation.complete', 'assessment', 'Valider un lot académique', 'Vérifie completeness et policy avant finalisation.', 'academics.update', 'academics', 'academique.moyennes', null, 'academic_validation', true, true, 'academic.validation.completed', 'assessment', false),
  ('report_card.template.assign', 'report_cards', 'Affecter un template bulletin', 'Versionne et affecte un template compatible à une institution et un contexte académique.', 'academics.update', 'academics', 'academique.bulletins', null, 'report_card_readiness', true, true, 'report_card.template.assigned', 'report_cards', false),
  ('report_card.generate', 'report_cards', 'Générer un bulletin', 'Crée le record, les lignes, le document réel et sa version.', 'academics.update', 'academics', 'academique.bulletins', null, 'report_card_readiness', false, true, 'report_card.generated', 'report_cards', false),
  ('report_card.publish', 'report_cards', 'Publier un bulletin', 'Publie une version immutable, disponible et supersédable.', 'academics.update', 'academics', 'academique.bulletins', null, 'report_card_readiness', true, true, 'report_card.published', 'report_cards', false),
  ('capacity.consume', 'capacity', 'Consommer une capacité', 'Réserve et confirme une unité de meter autorisée.', 'administration.update', 'administration', 'administration.overview', null, 'capacity_policy', false, true, 'capacity.consumed', 'capacity', false),
  ('capacity.topup.activate', 'capacity', 'Activer un top-up', 'Recompile entitlement, provisionne allowance et audite.', 'administration.update', 'administration', 'administration.overview', null, 'capacity_policy', true, true, 'capacity.topup.activated', 'capacity', false)
on conflict(operation_key) do update set domain_key=excluded.domain_key,label=excluded.label,description=excluded.description,permission_key=excluded.permission_key,module_key=excluded.module_key,capability_key=excluded.capability_key,feature_key=excluded.feature_key,lifecycle_guard=excluded.lifecycle_guard,requires_approval=excluded.requires_approval,idempotent=excluded.idempotent,audit_event=excluded.audit_event,command_family=excluded.command_family,operator_only=excluded.operator_only,status='published',updated_at=now();

-- Canonical policy versions, seeded per existing school and editable later through Operator authority.
insert into public.angelcare360_product_reality_policy_versions(school_id,policy_key,domain_key,name,version_number,configuration,status,effective_from,published_at)
select s.id,p.policy_key,p.domain_key,p.name,1,p.configuration,'published',now(),now()
from public.angelcare360_schools s
cross join (values
 ('institution_lifecycle','institution','Lifecycle établissement','{"states":["draft","setup_in_progress","readiness_review","ready","active","suspended","closing","archived"],"transitions":{"draft":["setup_in_progress"],"setup_in_progress":["readiness_review"],"readiness_review":["ready","setup_in_progress"],"ready":["active"],"active":["suspended","closing"],"suspended":["active","closing"],"closing":["archived"]}}'::jsonb),
 ('academic_year_lifecycle','academic_year','Lifecycle année scolaire','{"states":["draft","configured","published","active","closing","closed","archived"],"transitions":{"draft":["configured"],"configured":["published"],"published":["active"],"active":["closing"],"closing":["closed"],"closed":["archived"]}}'::jsonb),
 ('student_lifecycle','student','Lifecycle élève','{"states":["candidate","pre_enrolled","enrolled","active","suspended","transferred","withdrawn","repeating","promoted","graduated","alumni","archived"]}'::jsonb),
 ('admission_workflow','admissions','Workflow admissions','{"stages":["new_request","qualified","dossier_open","documents_pending","interview_required","interview_completed","under_review","information_requested","decision_required","conditional_acceptance","accepted","waitlisted","rejected","conversion_ready","converted","closed"]}'::jsonb),
 ('attendance_calendar','attendance','Calendrier et états de présence','{"states":["present","absent","late","excused","authorized_absence","medical_absence","remote","left_early","unmarked"],"graceMinutes":10,"closeRequiresCompleteMarks":true}'::jsonb),
 ('timetable_constraints','timetable','Contraintes emploi du temps','{"teacherOverlap":true,"classOverlap":true,"subjectAssignment":true,"activeContext":true,"effectiveDates":true,"roomOverlapWhenConfigured":true}'::jsonb),
 ('grading_policy','assessment','Politique de notation','{"minimum":0,"maximum":20,"passing":10,"rounding":2,"missingGrade":"exclude_until_finalization","absentAssessment":"missing","weightNormalization":true}'::jsonb),
 ('report_card_readiness','report_cards','Readiness bulletin','{"requireGrades":true,"requireAverages":true,"requireValidation":true,"requireTemplate":true,"requireAppreciations":false}'::jsonb)
) as p(policy_key,domain_key,name,configuration)
on conflict(school_id,policy_key,version_number) do nothing;

insert into public.angelcare360_grading_policy_versions(school_id,policy_code,version_number,specificity,minimum_score,maximum_score,passing_score,rounding_decimals,missing_grade_behavior,exemption_behavior,weight_normalization,configuration,status,effective_from,published_at)
select id,'DEFAULT-20',1,0,0,20,10,2,'exclude_until_finalization','exclude',true,'{"source":"product_reality_enforcement"}'::jsonb,'published',now(),now()
from public.angelcare360_schools
on conflict(school_id,policy_code,version_number) do nothing;

insert into public.angelcare360_school_day_rules(school_id,academic_year_id,day_of_week,is_operational,status)
select y.school_id,y.id,d.day,true,'active' from public.angelcare360_academic_years y cross join (values(1),(2),(3),(4),(5)) d(day)
on conflict(school_id,academic_year_id,day_of_week) do nothing;

-- Indexes for scale and deterministic lookup.
create index if not exists ac360_reality_execution_school_state_idx on public.angelcare360_product_reality_executions(school_id,state,requested_at);
create index if not exists ac360_reality_policy_school_domain_idx on public.angelcare360_product_reality_policy_versions(school_id,domain_key,status,effective_from);
create index if not exists ac360_reality_exception_school_status_idx on public.angelcare360_product_reality_exceptions(school_id,status,severity,created_at desc);
create index if not exists ac360_reality_workflow_school_entity_idx on public.angelcare360_product_reality_workflow_instances(school_id,entity_type,entity_id,status);
create index if not exists ac360_reality_approval_school_status_idx on public.angelcare360_product_reality_approvals(school_id,status,requested_at);
create index if not exists ac360_reality_meter_school_idx on public.angelcare360_product_meter_consumption(school_id,meter_key,status);
create index if not exists ac360_people_master_identity_idx on public.angelcare360_people_master(school_id,normalized_name,normalized_email,normalized_phone);
create index if not exists ac360_guardian_authority_student_idx on public.angelcare360_guardian_authorities(school_id,student_id,status,effective_from);
create index if not exists ac360_rollover_items_run_status_idx on public.angelcare360_academic_year_rollover_items(rollover_run_id,status);
create index if not exists ac360_admission_workflow_event_idx on public.angelcare360_admission_workflow_events(school_id,application_id,created_at);
create index if not exists ac360_timetable_version_school_idx on public.angelcare360_timetable_publication_versions(school_id,academic_year_id,status,version_number desc);
create index if not exists ac360_grade_revision_mark_idx on public.angelcare360_grade_revisions(school_id,mark_id,created_at desc);
create index if not exists ac360_report_version_report_idx on public.angelcare360_report_card_document_versions(school_id,report_card_id,status,version_number desc);
create index if not exists ac360_enrollment_student_year_idx on public.angelcare360_student_enrollments(school_id,student_id,academic_year_id,status);
create index if not exists ac360_planned_absence_student_dates_idx on public.angelcare360_planned_absences(school_id,student_id,starts_on,ends_on,status);
create index if not exists ac360_substitute_assignment_dates_idx on public.angelcare360_timetable_substitute_assignments(school_id,timetable_slot_id,effective_from,effective_to,status);
create index if not exists ac360_report_template_scope_idx on public.angelcare360_report_card_template_assignments(school_id,academic_year_id,class_id,status,template_version desc);
create index if not exists ac360_notification_intent_status_idx on public.angelcare360_notification_intents(school_id,status,requested_at);

-- Server-authority tables: RLS enabled, browser roles revoked, service role retained.
do $$ declare t text; begin
  foreach t in array array[
    'angelcare360_product_reality_operation_catalog','angelcare360_product_runtime_operation_gates','angelcare360_product_reality_policy_versions',
    'angelcare360_product_reality_executions','angelcare360_product_reality_provisioning_events','angelcare360_product_meter_consumption',
    'angelcare360_product_reality_workflow_definitions','angelcare360_product_reality_workflow_versions','angelcare360_product_reality_workflow_instances',
    'angelcare360_product_reality_workflow_events','angelcare360_product_reality_approvals','angelcare360_product_reality_evidence_bindings',
    'angelcare360_product_reality_exceptions','angelcare360_institution_lifecycle_events','angelcare360_academic_year_lifecycle_events',
    'angelcare360_academic_year_rollover_runs','angelcare360_academic_year_rollover_items','angelcare360_people_master','angelcare360_person_role_links',
    'angelcare360_person_merge_plans','angelcare360_guardian_authorities','angelcare360_student_lifecycle_events','angelcare360_admission_interviews',
    'angelcare360_admission_decisions','angelcare360_admission_workflow_events','angelcare360_school_day_rules','angelcare360_timetable_publication_versions',
    'angelcare360_curriculum_versions','angelcare360_curriculum_units','angelcare360_grading_policy_versions','angelcare360_grade_revisions',
    'angelcare360_report_card_document_versions','angelcare360_notification_intents','angelcare360_student_enrollments','angelcare360_planned_absences',
    'angelcare360_timetable_substitute_assignments','angelcare360_report_card_template_assignments'
  ] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('drop policy if exists angelcare360_service_role_all on public.%I',t);
    execute format('create policy angelcare360_service_role_all on public.%I for all using (auth.role() = ''service_role'') with check (auth.role() = ''service_role'')',t);
    execute format('revoke all on public.%I from anon, authenticated',t);
    execute format('grant all on public.%I to service_role',t);
  end loop;
end $$;

commit;
