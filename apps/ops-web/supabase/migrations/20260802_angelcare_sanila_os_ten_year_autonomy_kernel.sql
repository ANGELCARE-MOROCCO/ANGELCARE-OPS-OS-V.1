begin;

create extension if not exists pgcrypto;

create or replace function public.angelcare360_autonomy_set_updated_at()
returns trigger language plpgsql security invoker set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.angelcare360_autonomy_reject_mutation()
returns trigger language plpgsql security invoker set search_path = public as $$
begin
  raise exception 'Autonomy Kernel append-only ledger cannot be updated or deleted';
end;
$$;

create table if not exists public.angelcare360_operator_autonomy_metadata_definitions (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  description text,
  domain text not null,
  entity_type text not null,
  current_version integer not null default 0 check (current_version >= 0),
  lifecycle_status text not null default 'draft' check (lifecycle_status in ('draft','review','approved','published','deprecated','retired')),
  owner_role text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.angelcare360_operator_autonomy_metadata_versions (
  id uuid primary key default gen_random_uuid(),
  definition_id uuid not null references public.angelcare360_operator_autonomy_metadata_definitions(id) on delete restrict,
  version_number integer not null check (version_number > 0),
  schema_json jsonb not null default '{}'::jsonb,
  ui_schema_json jsonb not null default '{}'::jsonb,
  validation_json jsonb not null default '{}'::jsonb,
  compatibility_json jsonb not null default '{}'::jsonb,
  checksum text not null,
  status text not null default 'review' check (status in ('draft','review','approved','published','deprecated','retired')),
  effective_from timestamptz,
  effective_to timestamptz,
  created_at timestamptz not null default now(),
  unique(definition_id, version_number),
  unique(definition_id, checksum)
);

create table if not exists public.angelcare360_operator_autonomy_workflow_definitions (
  id uuid primary key default gen_random_uuid(), key text not null unique, name text not null,
  domain text not null, entity_type text not null, current_version integer not null default 0 check (current_version >= 0),
  lifecycle_status text not null default 'draft' check (lifecycle_status in ('draft','review','approved','published','deprecated','retired')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.angelcare360_operator_autonomy_workflow_versions (
  id uuid primary key default gen_random_uuid(),
  definition_id uuid not null references public.angelcare360_operator_autonomy_workflow_definitions(id) on delete restrict,
  version_number integer not null check (version_number > 0),
  states_json jsonb not null default '[]'::jsonb,
  transitions_json jsonb not null default '[]'::jsonb,
  sla_json jsonb not null default '{}'::jsonb,
  automation_json jsonb not null default '[]'::jsonb,
  checksum text not null,
  status text not null default 'review' check (status in ('draft','review','approved','published','deprecated','retired')),
  created_at timestamptz not null default now(),
  unique(definition_id, version_number), unique(definition_id, checksum)
);

create table if not exists public.angelcare360_operator_autonomy_workflow_instances (
  id uuid primary key default gen_random_uuid(),
  workflow_version_id uuid not null references public.angelcare360_operator_autonomy_workflow_versions(id) on delete restrict,
  subject_type text not null, subject_id text not null, current_state text not null,
  context_json jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(), completed_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(workflow_version_id, subject_type, subject_id)
);

create table if not exists public.angelcare360_operator_autonomy_workflow_events (
  id uuid primary key default gen_random_uuid(),
  workflow_instance_id uuid not null references public.angelcare360_operator_autonomy_workflow_instances(id) on delete restrict,
  event_type text not null, from_state text, to_state text, transition_key text,
  payload_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.angelcare360_operator_autonomy_policy_definitions (
  id uuid primary key default gen_random_uuid(), key text not null unique, name text not null,
  domain text not null, scope_type text not null, current_version integer not null default 0 check (current_version >= 0),
  lifecycle_status text not null default 'draft' check (lifecycle_status in ('draft','review','approved','published','deprecated','retired')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.angelcare360_operator_autonomy_policy_versions (
  id uuid primary key default gen_random_uuid(),
  definition_id uuid not null references public.angelcare360_operator_autonomy_policy_definitions(id) on delete restrict,
  version_number integer not null check (version_number > 0),
  condition_json jsonb not null default '{}'::jsonb,
  actions_json jsonb not null default '[]'::jsonb,
  authority_json jsonb not null default '{}'::jsonb,
  exception_json jsonb not null default '{}'::jsonb,
  checksum text not null,
  status text not null default 'review' check (status in ('draft','review','approved','published','deprecated','retired')),
  created_at timestamptz not null default now(),
  unique(definition_id, version_number), unique(definition_id, checksum)
);

create table if not exists public.angelcare360_operator_autonomy_policy_evaluations (
  id uuid primary key default gen_random_uuid(),
  policy_version_id uuid not null references public.angelcare360_operator_autonomy_policy_versions(id) on delete restrict,
  subject_type text not null, subject_id text, matched boolean not null,
  input_json jsonb not null default '{}'::jsonb,
  output_json jsonb not null default '{}'::jsonb,
  evidence_json jsonb not null default '{}'::jsonb,
  evaluator_version text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.angelcare360_operator_autonomy_changesets (
  id uuid primary key default gen_random_uuid(), changeset_code text not null unique,
  title text not null, domain text not null,
  status text not null default 'draft' check (status in ('draft','submitted','approved','rejected','scheduled','executing','verified','rolled_back')),
  requested_by uuid, change_json jsonb not null default '{}'::jsonb,
  impact_json jsonb not null default '{}'::jsonb, rollback_json jsonb not null default '{}'::jsonb,
  validation_json jsonb not null default '{}'::jsonb,
  effective_at timestamptz, submitted_at timestamptz, execution_started_at timestamptz,
  verified_at timestamptz, rolled_back_at timestamptz, rollback_reason text,
  rollback_evidence_json jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

alter table public.angelcare360_operator_autonomy_changesets add column if not exists execution_started_at timestamptz;
alter table public.angelcare360_operator_autonomy_changesets add column if not exists verified_at timestamptz;
alter table public.angelcare360_operator_autonomy_changesets add column if not exists rolled_back_at timestamptz;
alter table public.angelcare360_operator_autonomy_changesets add column if not exists rollback_reason text;
alter table public.angelcare360_operator_autonomy_changesets add column if not exists rollback_evidence_json jsonb;

create table if not exists public.angelcare360_operator_autonomy_changeset_approvals (
  id uuid primary key default gen_random_uuid(),
  changeset_id uuid not null references public.angelcare360_operator_autonomy_changesets(id) on delete restrict,
  decision text not null check (decision in ('approved','rejected')),
  reason text not null, decided_by uuid, authority_role text,
  created_at timestamptz not null default now()
);

create table if not exists public.angelcare360_operator_autonomy_entitlement_compiler_runs (
  id uuid primary key default gen_random_uuid(), run_code text not null unique,
  tenant_id uuid, client_id uuid, subscription_id uuid, entitlement_snapshot_id uuid,
  status text not null check (status in ('running','completed','failed')),
  input_json jsonb not null default '{}'::jsonb,
  result_json jsonb, error_json jsonb,
  compiler_version text not null,
  started_at timestamptz not null default now(), completed_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.angelcare360_operator_autonomy_provisioning_jobs (
  id uuid primary key default gen_random_uuid(), job_code text not null unique,
  tenant_id uuid, client_id uuid, subscription_id uuid, entitlement_snapshot_id uuid,
  operation text not null, idempotency_key text not null unique,
  status text not null default 'queued' check (status in ('queued','running','verification','completed','failed','dead_letter')),
  attempts integer not null default 0 check (attempts >= 0), max_attempts integer not null default 5 check (max_attempts > 0),
  next_attempt_at timestamptz, locked_at timestamptz, completed_at timestamptz,
  payload_json jsonb not null default '{}'::jsonb, result_json jsonb, error_json jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.angelcare360_operator_autonomy_provisioning_steps (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.angelcare360_operator_autonomy_provisioning_jobs(id) on delete restrict,
  step_key text not null, status text not null check (status in ('queued','running','completed','failed','skipped')),
  input_json jsonb not null default '{}'::jsonb, output_json jsonb, error_json jsonb,
  started_at timestamptz, completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.angelcare360_operator_autonomy_dead_letters (
  id uuid primary key default gen_random_uuid(), source_type text not null, source_id uuid not null,
  payload_json jsonb not null default '{}'::jsonb, error_json jsonb not null default '{}'::jsonb,
  status text not null default 'open' check (status in ('open','investigating','requeued','resolved','discarded')),
  resolved_at timestamptz, created_at timestamptz not null default now()
);

create table if not exists public.angelcare360_operator_autonomy_event_outbox (
  id uuid primary key default gen_random_uuid(), aggregate_type text not null, aggregate_id uuid not null,
  event_type text not null, payload_json jsonb not null default '{}'::jsonb,
  idempotency_key text not null unique,
  status text not null default 'pending' check (status in ('pending','processing','published','failed')),
  attempts integer not null default 0, next_attempt_at timestamptz, published_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.angelcare360_operator_autonomy_meter_definitions (
  id uuid primary key default gen_random_uuid(), meter_key text not null unique, name text not null,
  unit text not null, aggregation_method text not null default 'sum', reset_schedule text,
  measurement_source text not null, default_included_quantity numeric not null default 0,
  soft_limit_pct numeric not null default 70, warning_limit_pct numeric not null default 90,
  critical_limit_pct numeric not null default 95, hard_limit_pct numeric not null default 100,
  lifecycle_status text not null default 'published' check (lifecycle_status in ('draft','review','approved','published','deprecated','retired')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.angelcare360_operator_autonomy_meter_samples (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null, meter_key text not null,
  measured_at timestamptz not null, quantity numeric not null,
  source text not null, source_event_id text not null,
  dimensions_json jsonb not null default '{}'::jsonb,
  confidence_pct numeric not null default 100 check (confidence_pct between 0 and 100),
  created_at timestamptz not null default now(),
  unique(tenant_id, meter_key, source, source_event_id)
);

create table if not exists public.angelcare360_operator_autonomy_capacity_snapshots (
  id uuid primary key default gen_random_uuid(), tenant_id uuid, meter_key text not null,
  measured_at timestamptz not null,
  included_quantity numeric not null default 0, reserved_quantity numeric not null default 0,
  consumed_quantity numeric not null default 0, forecast_quantity numeric not null default 0,
  pressure_pct numeric not null default 0, confidence_pct numeric not null default 0,
  source_freshness_at timestamptz,
  state text not null check (state in ('healthy','watch','warning','critical','blocked','stale')),
  created_at timestamptz not null default now()
);

create table if not exists public.angelcare360_operator_autonomy_threshold_events (
  id uuid primary key default gen_random_uuid(), event_key text not null unique,
  tenant_id uuid, meter_key text not null, threshold_pct numeric not null, pressure_pct numeric not null,
  severity text not null check (severity in ('info','warning','critical')),
  snapshot_id uuid references public.angelcare360_operator_autonomy_capacity_snapshots(id) on delete restrict,
  status text not null default 'open' check (status in ('open','acknowledged','resolved')),
  resolved_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.angelcare360_operator_autonomy_extension_manifests (
  id uuid primary key default gen_random_uuid(), extension_key text not null unique, name text not null,
  description text, current_version text not null default '0.0.0',
  lifecycle_status text not null default 'draft' check (lifecycle_status in ('draft','review','approved','published','deprecated','retired')),
  compatibility_status text not null default 'unknown' check (compatibility_status in ('unknown','compatible','conditional','incompatible')),
  manifest_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.angelcare360_operator_autonomy_extension_versions (
  id uuid primary key default gen_random_uuid(),
  extension_id uuid not null references public.angelcare360_operator_autonomy_extension_manifests(id) on delete restrict,
  version text not null, manifest_json jsonb not null default '{}'::jsonb, checksum text not null,
  compatibility_json jsonb not null default '{}'::jsonb,
  status text not null default 'review' check (status in ('draft','review','approved','published','deprecated','retired')),
  created_at timestamptz not null default now(), unique(extension_id, version), unique(extension_id, checksum)
);

create table if not exists public.angelcare360_operator_autonomy_release_candidates (
  id uuid primary key default gen_random_uuid(), release_code text not null unique, name text not null,
  version text not null, channel text not null check (channel in ('internal','pilot','limited','general')),
  status text not null default 'draft' check (status in ('draft','review','approved','scheduled','rolling_out','paused','completed','rolled_back','failed')),
  changeset_id uuid references public.angelcare360_operator_autonomy_changesets(id) on delete restrict,
  scope_json jsonb not null default '{}'::jsonb, rollout_json jsonb not null default '{}'::jsonb,
  rollback_json jsonb not null default '{}'::jsonb, verification_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.angelcare360_operator_autonomy_release_assignments (
  id uuid primary key default gen_random_uuid(),
  release_candidate_id uuid not null references public.angelcare360_operator_autonomy_release_candidates(id) on delete restrict,
  target_type text not null, target_id text not null,
  status text not null default 'pending' check (status in ('pending','eligible','blocked','deployed','verified','rolled_back','failed')),
  result_json jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(release_candidate_id, target_type, target_id)
);

create table if not exists public.angelcare360_operator_autonomy_runbooks (
  id uuid primary key default gen_random_uuid(), runbook_key text not null unique, name text not null,
  domain text not null, version integer not null default 1, lifecycle_status text not null default 'published',
  steps_json jsonb not null default '[]'::jsonb, rollback_json jsonb not null default '{}'::jsonb,
  owner_role text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.angelcare360_operator_autonomy_certification_controls (
  id uuid primary key default gen_random_uuid(), control_key text not null unique, control_name text not null,
  domain text not null, criticality text not null check (criticality in ('mandatory','high','standard')),
  status text not null default 'not_verified' check (status in ('not_verified','in_progress','passed','failed','waived')),
  evidence_required text not null, owner_role text, last_verified_at timestamptz, expires_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.angelcare360_operator_autonomy_certification_evidence (
  id uuid primary key default gen_random_uuid(),
  control_id uuid not null references public.angelcare360_operator_autonomy_certification_controls(id) on delete restrict,
  status text not null check (status in ('not_verified','in_progress','passed','failed','waived')),
  evidence_json jsonb not null default '{}'::jsonb, evidence_uri text,
  verified_by uuid, expires_at timestamptz, created_at timestamptz not null default now()
);

create table if not exists public.angelcare360_operator_autonomy_recovery_rehearsals (
  id uuid primary key default gen_random_uuid(), rehearsal_code text not null unique, scope text not null,
  status text not null default 'planned' check (status in ('planned','running','passed','failed')),
  target_rpo_minutes integer, actual_rpo_minutes integer, target_rto_minutes integer, actual_rto_minutes integer,
  evidence_json jsonb not null default '{}'::jsonb, executed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists autonomy_metadata_versions_definition_idx on public.angelcare360_operator_autonomy_metadata_versions(definition_id, version_number desc);
create index if not exists autonomy_workflow_events_instance_idx on public.angelcare360_operator_autonomy_workflow_events(workflow_instance_id, created_at desc);
create index if not exists autonomy_policy_evaluations_subject_idx on public.angelcare360_operator_autonomy_policy_evaluations(subject_type, subject_id, created_at desc);
create index if not exists autonomy_changesets_status_idx on public.angelcare360_operator_autonomy_changesets(status, created_at desc);
create index if not exists autonomy_provisioning_ready_idx on public.angelcare360_operator_autonomy_provisioning_jobs(status, next_attempt_at, created_at);
create index if not exists autonomy_meter_samples_tenant_idx on public.angelcare360_operator_autonomy_meter_samples(tenant_id, meter_key, measured_at desc);
create index if not exists autonomy_capacity_tenant_idx on public.angelcare360_operator_autonomy_capacity_snapshots(tenant_id, meter_key, measured_at desc);
create index if not exists autonomy_controls_domain_idx on public.angelcare360_operator_autonomy_certification_controls(domain, criticality, status);

-- updated_at triggers are recreated safely.
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'angelcare360_operator_autonomy_metadata_definitions',
    'angelcare360_operator_autonomy_workflow_definitions',
    'angelcare360_operator_autonomy_workflow_instances',
    'angelcare360_operator_autonomy_policy_definitions',
    'angelcare360_operator_autonomy_changesets',
    'angelcare360_operator_autonomy_entitlement_compiler_runs',
    'angelcare360_operator_autonomy_provisioning_jobs',
    'angelcare360_operator_autonomy_event_outbox',
    'angelcare360_operator_autonomy_meter_definitions',
    'angelcare360_operator_autonomy_threshold_events',
    'angelcare360_operator_autonomy_extension_manifests',
    'angelcare360_operator_autonomy_release_candidates',
    'angelcare360_operator_autonomy_release_assignments',
    'angelcare360_operator_autonomy_runbooks',
    'angelcare360_operator_autonomy_certification_controls'
  ] loop
    execute format('drop trigger if exists autonomy_updated_at on public.%I', table_name);
    execute format('create trigger autonomy_updated_at before update on public.%I for each row execute function public.angelcare360_autonomy_set_updated_at()', table_name);
  end loop;
end $$;

-- Append-only evidence and event ledgers.
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'angelcare360_operator_autonomy_metadata_versions',
    'angelcare360_operator_autonomy_workflow_versions',
    'angelcare360_operator_autonomy_workflow_events',
    'angelcare360_operator_autonomy_policy_versions',
    'angelcare360_operator_autonomy_policy_evaluations',
    'angelcare360_operator_autonomy_changeset_approvals',
    'angelcare360_operator_autonomy_provisioning_steps',
    'angelcare360_operator_autonomy_meter_samples',
    'angelcare360_operator_autonomy_capacity_snapshots',
    'angelcare360_operator_autonomy_extension_versions',
    'angelcare360_operator_autonomy_certification_evidence'
  ] loop
    execute format('drop trigger if exists autonomy_append_only on public.%I', table_name);
    execute format('create trigger autonomy_append_only before update or delete on public.%I for each row execute function public.angelcare360_autonomy_reject_mutation()', table_name);
  end loop;
end $$;

-- Service-role-only data plane. Browser clients receive no direct table privileges.
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'angelcare360_operator_autonomy_metadata_definitions','angelcare360_operator_autonomy_metadata_versions',
    'angelcare360_operator_autonomy_workflow_definitions','angelcare360_operator_autonomy_workflow_versions','angelcare360_operator_autonomy_workflow_instances','angelcare360_operator_autonomy_workflow_events',
    'angelcare360_operator_autonomy_policy_definitions','angelcare360_operator_autonomy_policy_versions','angelcare360_operator_autonomy_policy_evaluations',
    'angelcare360_operator_autonomy_changesets','angelcare360_operator_autonomy_changeset_approvals',
    'angelcare360_operator_autonomy_entitlement_compiler_runs','angelcare360_operator_autonomy_provisioning_jobs','angelcare360_operator_autonomy_provisioning_steps','angelcare360_operator_autonomy_dead_letters','angelcare360_operator_autonomy_event_outbox',
    'angelcare360_operator_autonomy_meter_definitions','angelcare360_operator_autonomy_meter_samples','angelcare360_operator_autonomy_capacity_snapshots','angelcare360_operator_autonomy_threshold_events',
    'angelcare360_operator_autonomy_extension_manifests','angelcare360_operator_autonomy_extension_versions','angelcare360_operator_autonomy_release_candidates','angelcare360_operator_autonomy_release_assignments',
    'angelcare360_operator_autonomy_runbooks','angelcare360_operator_autonomy_certification_controls','angelcare360_operator_autonomy_certification_evidence','angelcare360_operator_autonomy_recovery_rehearsals'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('revoke all on table public.%I from public, anon, authenticated', table_name);
    execute format('grant select, insert, update, delete on table public.%I to service_role', table_name);
  end loop;
end $$;

insert into public.angelcare360_operator_autonomy_meter_definitions
(meter_key,name,unit,aggregation_method,reset_schedule,measurement_source,default_included_quantity,soft_limit_pct,warning_limit_pct,critical_limit_pct,hard_limit_pct,lifecycle_status)
values
('named_users','Named users','users','latest','monthly','identity-ledger',100,70,90,95,100,'published'),
('concurrent_sessions','Concurrent sessions','sessions','max','daily','session-ledger',25,70,90,95,100,'published'),
('institutions','Institutions','institutions','latest',null,'tenant-registry',1,70,90,95,100,'published'),
('student_records','Student records','records','latest','monthly','angelcare360-core',500,70,90,95,100,'published'),
('storage_gb','Storage','GB','latest','monthly','windows-storage-meter',20,70,90,95,100,'published'),
('email_volume','Email volume','messages','sum','monthly','email-os',5000,70,90,95,100,'published'),
('api_calls','API calls','calls','sum','monthly','gateway-meter',100000,70,90,95,100,'published'),
('automation_executions','Automation executions','runs','sum','monthly','automation-ledger',10000,70,90,95,100,'published')
on conflict (meter_key) do update set
  name=excluded.name, unit=excluded.unit, aggregation_method=excluded.aggregation_method,
  reset_schedule=excluded.reset_schedule, measurement_source=excluded.measurement_source,
  default_included_quantity=excluded.default_included_quantity, updated_at=now();

insert into public.angelcare360_operator_autonomy_certification_controls
(control_key,control_name,domain,criticality,status,evidence_required,owner_role)
values
('SEC-TENANT-ISOLATION','Tenant isolation and cross-tenant denial','Security','mandatory','not_verified','Automated negative tests proving that tenant A cannot read or mutate tenant B.','operator_admin'),
('SEC-PERMISSIONS','Mutation permission enforcement','Security','mandatory','not_verified','Role and permission matrix tests for every critical mutation.','operator_admin'),
('SEC-DEPENDENCIES','Dependency vulnerability governance','Security','mandatory','not_verified','Current dependency audit, risk acceptance and remediation SLA.','operator_admin'),
('REL-BACKUP-RESTORE','Database backup and point-in-time restore','Reliability','mandatory','not_verified','Successful restoration rehearsal with measured RPO and RTO.','operator_admin'),
('REL-JOB-RECOVERY','Durable job retry and dead-letter recovery','Reliability','mandatory','not_verified','Failure injection proving retry, terminal isolation and safe requeue.','operator_admin'),
('REL-EMAIL-RECOVERY','Email OS delivery and inbound recovery','Reliability','high','not_verified','Queue interruption and replay rehearsal with no duplicate delivery.','operator_admin'),
('SCALE-MULTITENANT','Multi-tenant load and database performance','Scale','mandatory','not_verified','Load test at target tenant/user volume with query and queue budgets.','operator_admin'),
('PERF-BROWSER','Browser memory and motion budget','Scale','mandatory','not_verified','Intel Retina Mac and target-device memory test on heavy workspaces.','operator_admin'),
('CHANGE-MIGRATION','Migration and rollback verification','Change Management','mandatory','not_verified','Forward migration, rollback and historical compatibility evidence.','operator_admin'),
('OBS-PRODUCTION','Production observability and alert routing','Operations','mandatory','not_verified','Logs, metrics, traces, queue health and actionable alert drill.','operator_admin'),
('DR-DISASTER','Disaster recovery runbook and rehearsal','Operations','mandatory','not_verified','End-to-end infrastructure failure rehearsal and restoration evidence.','operator_admin'),
('E2E-CRITICAL','End-to-end critical customer journeys','Quality','mandatory','not_verified','Automated acceptance of tenant activation, billing, support, entitlement and access journeys.','operator_admin'),
('QUALITY-ACCESSIBILITY','Accessibility and browser compatibility','Quality','high','not_verified','Accessibility audit and supported-browser evidence.','operator_admin'),
('QUALITY-DATA','Data migration and reconciliation integrity','Quality','high','not_verified','Source-to-target reconciliation and exception ledger.','operator_admin')
on conflict (control_key) do update set
  control_name=excluded.control_name, domain=excluded.domain, criticality=excluded.criticality,
  evidence_required=excluded.evidence_required, owner_role=excluded.owner_role, updated_at=now();

commit;
