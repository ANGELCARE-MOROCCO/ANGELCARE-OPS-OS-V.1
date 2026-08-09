-- ANGELCARE 360 AREA 10 — STUDENT 360 MASTER DOSSIER
-- Additive production migration. No auth/session mutation. No global RLS mutation.
begin;

do $$
begin
  if to_regclass('public.angelcare360_students') is null then raise exception 'AREA10 PREFLIGHT: angelcare360_students is missing'; end if;
  if to_regclass('public.angelcare360_class_enrollments') is null then raise exception 'AREA10 PREFLIGHT: angelcare360_class_enrollments is missing'; end if;
  if to_regclass('public.angelcare360_operator_product_operations') is null then raise exception 'AREA10 PREFLIGHT: Product Constitution operation registry is missing'; end if;
  if to_regclass('public.angelcare360_area9_handover_outcomes') is null then raise exception 'AREA10 PREFLIGHT: Area 9 handover authority is missing; Area 9 SQL must be applied first'; end if;
end $$;
create table if not exists public.angelcare360_area10_student_profiles (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null,
  student_id uuid not null,
  operational_state text not null default 'active',
  preferred_name text,
  primary_language text,
  readiness_state text not null default 'review',
  safety_summary text,
  metadata_json jsonb not null default '{}'::jsonb,
  created_by_user_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (school_id, student_id)
);
alter table public.angelcare360_area10_student_profiles enable row level security;
revoke all on table public.angelcare360_area10_student_profiles from anon, authenticated;
grant all on table public.angelcare360_area10_student_profiles to service_role;
create index if not exists angelcare360_area10_student_profiles_school_student_idx on public.angelcare360_area10_student_profiles(school_id, student_id);
create index if not exists angelcare360_area10_student_profiles_created_idx on public.angelcare360_area10_student_profiles(school_id, created_at desc);

create table if not exists public.angelcare360_area10_health_instructions (
  id uuid primary key default gen_random_uuid(), school_id uuid not null, student_id uuid not null,
  instruction_type text not null, title text not null, instruction text not null, severity text not null default 'standard',
  source_kind text not null default 'family_declaration', source_reference text, evidence_document_id uuid,
  effective_from timestamptz not null default now(), effective_until timestamptz, status text not null default 'active',
  verified_at timestamptz, verified_by_user_id uuid, archived_at timestamptz, created_by_user_id uuid,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.angelcare360_area10_health_instructions enable row level security;
revoke all on table public.angelcare360_area10_health_instructions from anon, authenticated;
grant all on table public.angelcare360_area10_health_instructions to service_role;
create index if not exists angelcare360_area10_health_instructions_school_student_idx on public.angelcare360_area10_health_instructions(school_id, student_id);
create index if not exists angelcare360_area10_health_instructions_status_idx on public.angelcare360_area10_health_instructions(school_id, status);
create index if not exists angelcare360_area10_health_instructions_created_idx on public.angelcare360_area10_health_instructions(school_id, created_at desc);

create table if not exists public.angelcare360_area10_medication_plans (
  id uuid primary key default gen_random_uuid(), school_id uuid not null, student_id uuid not null,
  medication_name text not null, dosage_instruction text not null, schedule_instruction text not null,
  authorization_document_id uuid, medical_evidence_document_id uuid, effective_from timestamptz not null default now(), effective_until timestamptz,
  status text not null default 'active', created_by_user_id uuid, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.angelcare360_area10_medication_plans enable row level security;
revoke all on table public.angelcare360_area10_medication_plans from anon, authenticated;
grant all on table public.angelcare360_area10_medication_plans to service_role;
create index if not exists angelcare360_area10_medication_plans_school_student_idx on public.angelcare360_area10_medication_plans(school_id, student_id);
create index if not exists angelcare360_area10_medication_plans_status_idx on public.angelcare360_area10_medication_plans(school_id, status);
create index if not exists angelcare360_area10_medication_plans_created_idx on public.angelcare360_area10_medication_plans(school_id, created_at desc);

create table if not exists public.angelcare360_area10_medication_administrations (
  id uuid primary key default gen_random_uuid(), school_id uuid not null, student_id uuid not null, medication_plan_id uuid,
  administered_at timestamptz not null default now(), outcome text not null, dosage_given text, note text, administered_by_user_id uuid,
  created_at timestamptz not null default now()
);
alter table public.angelcare360_area10_medication_administrations enable row level security;
revoke all on table public.angelcare360_area10_medication_administrations from anon, authenticated;
grant all on table public.angelcare360_area10_medication_administrations to service_role;
create index if not exists angelcare360_area10_medication_administrations_school_student_idx on public.angelcare360_area10_medication_administrations(school_id, student_id);
create index if not exists angelcare360_area10_medication_administrations_created_idx on public.angelcare360_area10_medication_administrations(school_id, created_at desc);

create table if not exists public.angelcare360_area10_authorizations (
  id uuid primary key default gen_random_uuid(), school_id uuid not null, student_id uuid not null,
  authorization_type text not null, scope_label text not null, valid_from timestamptz, valid_until timestamptz,
  evidence_document_id uuid, status text not null default 'requested', verified_at timestamptz, verified_by_user_id uuid,
  created_by_user_id uuid, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.angelcare360_area10_authorizations enable row level security;
revoke all on table public.angelcare360_area10_authorizations from anon, authenticated;
grant all on table public.angelcare360_area10_authorizations to service_role;
create index if not exists angelcare360_area10_authorizations_school_student_idx on public.angelcare360_area10_authorizations(school_id, student_id);
create index if not exists angelcare360_area10_authorizations_status_idx on public.angelcare360_area10_authorizations(school_id, status);
create index if not exists angelcare360_area10_authorizations_created_idx on public.angelcare360_area10_authorizations(school_id, created_at desc);

create table if not exists public.angelcare360_area10_adaptation_plans (
  id uuid primary key default gen_random_uuid(), school_id uuid not null, student_id uuid not null,
  starts_at timestamptz not null default now(), target_end_at timestamptz, owner_user_id uuid, status text not null default 'active',
  summary text, outcome text, created_by_user_id uuid, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.angelcare360_area10_adaptation_plans enable row level security;
revoke all on table public.angelcare360_area10_adaptation_plans from anon, authenticated;
grant all on table public.angelcare360_area10_adaptation_plans to service_role;
create index if not exists angelcare360_area10_adaptation_plans_school_student_idx on public.angelcare360_area10_adaptation_plans(school_id, student_id);
create index if not exists angelcare360_area10_adaptation_plans_status_idx on public.angelcare360_area10_adaptation_plans(school_id, status);
create index if not exists angelcare360_area10_adaptation_plans_created_idx on public.angelcare360_area10_adaptation_plans(school_id, created_at desc);

create table if not exists public.angelcare360_area10_adaptation_checkpoints (
  id uuid primary key default gen_random_uuid(), school_id uuid not null, student_id uuid not null, adaptation_plan_id uuid,
  checkpoint_key text not null, scheduled_at timestamptz, completed_at timestamptz, observations_json jsonb not null default '{}'::jsonb,
  status text not null default 'planned', completed_by_user_id uuid, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.angelcare360_area10_adaptation_checkpoints enable row level security;
revoke all on table public.angelcare360_area10_adaptation_checkpoints from anon, authenticated;
grant all on table public.angelcare360_area10_adaptation_checkpoints to service_role;
create index if not exists angelcare360_area10_adaptation_checkpoints_school_student_idx on public.angelcare360_area10_adaptation_checkpoints(school_id, student_id);
create index if not exists angelcare360_area10_adaptation_checkpoints_status_idx on public.angelcare360_area10_adaptation_checkpoints(school_id, status);
create index if not exists angelcare360_area10_adaptation_checkpoints_created_idx on public.angelcare360_area10_adaptation_checkpoints(school_id, created_at desc);

create table if not exists public.angelcare360_area10_wellbeing_observations (
  id uuid primary key default gen_random_uuid(), school_id uuid not null, student_id uuid not null,
  observation_kind text not null default 'wellbeing', observed_at timestamptz not null default now(), observed_fact text not null,
  context text, adult_interpretation text, action_taken text, follow_up text, created_by_user_id uuid,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.angelcare360_area10_wellbeing_observations enable row level security;
revoke all on table public.angelcare360_area10_wellbeing_observations from anon, authenticated;
grant all on table public.angelcare360_area10_wellbeing_observations to service_role;
create index if not exists angelcare360_area10_wellbeing_observations_school_student_idx on public.angelcare360_area10_wellbeing_observations(school_id, student_id);
create index if not exists angelcare360_area10_wellbeing_observations_created_idx on public.angelcare360_area10_wellbeing_observations(school_id, created_at desc);

create table if not exists public.angelcare360_area10_support_plans (
  id uuid primary key default gen_random_uuid(), school_id uuid not null, student_id uuid not null,
  plan_type text not null, objective text not null, need_statement text, actions_json jsonb not null default '[]'::jsonb,
  owner_user_id uuid, starts_at timestamptz not null default now(), review_at timestamptz, success_condition text,
  status text not null default 'active', outcome text, closed_at timestamptz, created_by_user_id uuid,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.angelcare360_area10_support_plans enable row level security;
revoke all on table public.angelcare360_area10_support_plans from anon, authenticated;
grant all on table public.angelcare360_area10_support_plans to service_role;
create index if not exists angelcare360_area10_support_plans_school_student_idx on public.angelcare360_area10_support_plans(school_id, student_id);
create index if not exists angelcare360_area10_support_plans_status_idx on public.angelcare360_area10_support_plans(school_id, status);
create index if not exists angelcare360_area10_support_plans_created_idx on public.angelcare360_area10_support_plans(school_id, created_at desc);

create table if not exists public.angelcare360_area10_support_reviews (
  id uuid primary key default gen_random_uuid(), school_id uuid not null, student_id uuid not null, support_plan_id uuid,
  reviewed_at timestamptz not null default now(), outcome text not null, evidence text, next_review_at timestamptz,
  reviewed_by_user_id uuid, created_at timestamptz not null default now()
);
alter table public.angelcare360_area10_support_reviews enable row level security;
revoke all on table public.angelcare360_area10_support_reviews from anon, authenticated;
grant all on table public.angelcare360_area10_support_reviews to service_role;
create index if not exists angelcare360_area10_support_reviews_school_student_idx on public.angelcare360_area10_support_reviews(school_id, student_id);
create index if not exists angelcare360_area10_support_reviews_created_idx on public.angelcare360_area10_support_reviews(school_id, created_at desc);

create table if not exists public.angelcare360_area10_incidents (
  id uuid primary key default gen_random_uuid(), school_id uuid not null, student_id uuid not null,
  incident_type text not null, title text not null, facts text not null, occurred_at timestamptz not null default now(), location_label text,
  severity text not null default 'standard', immediate_action text, parent_notification_state text not null default 'not_required',
  assigned_to_user_id uuid, evidence_json jsonb not null default '{}'::jsonb, follow_up_required boolean not null default false,
  follow_up_due_at timestamptz, resolution text, acknowledged_at timestamptz, acknowledged_by_user_id uuid,
  resolved_at timestamptz, resolved_by_user_id uuid, status text not null default 'open', created_by_user_id uuid,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.angelcare360_area10_incidents enable row level security;
revoke all on table public.angelcare360_area10_incidents from anon, authenticated;
grant all on table public.angelcare360_area10_incidents to service_role;
create index if not exists angelcare360_area10_incidents_school_student_idx on public.angelcare360_area10_incidents(school_id, student_id);
create index if not exists angelcare360_area10_incidents_status_idx on public.angelcare360_area10_incidents(school_id, status);
create index if not exists angelcare360_area10_incidents_created_idx on public.angelcare360_area10_incidents(school_id, created_at desc);

create table if not exists public.angelcare360_area10_transitions (
  id uuid primary key default gen_random_uuid(), school_id uuid not null, student_id uuid not null,
  transition_type text not null, from_label text, to_label text not null, target_class_id uuid, target_section_id uuid,
  effective_at timestamptz, reason text, readiness_json jsonb not null default '{}'::jsonb, canonical_deep_link text,
  status text not null default 'prepared', created_by_user_id uuid, updated_by_user_id uuid,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.angelcare360_area10_transitions enable row level security;
revoke all on table public.angelcare360_area10_transitions from anon, authenticated;
grant all on table public.angelcare360_area10_transitions to service_role;
create index if not exists angelcare360_area10_transitions_school_student_idx on public.angelcare360_area10_transitions(school_id, student_id);
create index if not exists angelcare360_area10_transitions_status_idx on public.angelcare360_area10_transitions(school_id, status);
create index if not exists angelcare360_area10_transitions_created_idx on public.angelcare360_area10_transitions(school_id, created_at desc);

create table if not exists public.angelcare360_area10_departures (
  id uuid primary key default gen_random_uuid(), school_id uuid not null, student_id uuid not null,
  departure_type text not null, effective_at timestamptz, reason text, checklist_json jsonb not null default '{}'::jsonb,
  status text not null default 'prepared', completed_at timestamptz, created_by_user_id uuid, updated_by_user_id uuid,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.angelcare360_area10_departures enable row level security;
revoke all on table public.angelcare360_area10_departures from anon, authenticated;
grant all on table public.angelcare360_area10_departures to service_role;
create index if not exists angelcare360_area10_departures_school_student_idx on public.angelcare360_area10_departures(school_id, student_id);
create index if not exists angelcare360_area10_departures_status_idx on public.angelcare360_area10_departures(school_id, status);
create index if not exists angelcare360_area10_departures_created_idx on public.angelcare360_area10_departures(school_id, created_at desc);

create table if not exists public.angelcare360_area10_tasks (
  id uuid primary key default gen_random_uuid(), school_id uuid not null, student_id uuid not null,
  category text not null default 'student', title text not null, detail text, assigned_to_user_id uuid, due_at timestamptz,
  expected_outcome text, source_deep_link text, priority text not null default 'normal', status text not null default 'open',
  completion_note text, completed_at timestamptz, created_by_user_id uuid,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.angelcare360_area10_tasks enable row level security;
revoke all on table public.angelcare360_area10_tasks from anon, authenticated;
grant all on table public.angelcare360_area10_tasks to service_role;
create index if not exists angelcare360_area10_tasks_school_student_idx on public.angelcare360_area10_tasks(school_id, student_id);
create index if not exists angelcare360_area10_tasks_status_idx on public.angelcare360_area10_tasks(school_id, status);
create index if not exists angelcare360_area10_tasks_created_idx on public.angelcare360_area10_tasks(school_id, created_at desc);

create table if not exists public.angelcare360_area10_notes (
  id uuid primary key default gen_random_uuid(), school_id uuid not null, student_id uuid not null,
  note_kind text not null default 'operational', title text, body text not null, visibility text not null default 'internal',
  created_by_user_id uuid, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.angelcare360_area10_notes enable row level security;
revoke all on table public.angelcare360_area10_notes from anon, authenticated;
grant all on table public.angelcare360_area10_notes to service_role;
create index if not exists angelcare360_area10_notes_school_student_idx on public.angelcare360_area10_notes(school_id, student_id);
create index if not exists angelcare360_area10_notes_created_idx on public.angelcare360_area10_notes(school_id, created_at desc);

create table if not exists public.angelcare360_area10_integration_links (
  id uuid primary key default gen_random_uuid(), school_id uuid not null, student_id uuid not null,
  source_area text not null, source_entity_type text not null, source_entity_id text not null, relationship_kind text not null,
  metadata_json jsonb not null default '{}'::jsonb, status text not null default 'active',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (school_id, student_id, source_area, source_entity_type, source_entity_id, relationship_kind)
);
alter table public.angelcare360_area10_integration_links enable row level security;
revoke all on table public.angelcare360_area10_integration_links from anon, authenticated;
grant all on table public.angelcare360_area10_integration_links to service_role;
create index if not exists angelcare360_area10_integration_links_school_student_idx on public.angelcare360_area10_integration_links(school_id, student_id);
create index if not exists angelcare360_area10_integration_links_status_idx on public.angelcare360_area10_integration_links(school_id, status);
create index if not exists angelcare360_area10_integration_links_created_idx on public.angelcare360_area10_integration_links(school_id, created_at desc);

create table if not exists public.angelcare360_area10_action_receipts (
  id uuid primary key default gen_random_uuid(), school_id uuid not null, student_id uuid not null,
  action_key text not null, idempotency_key text not null, actor_user_id uuid, result_json jsonb not null default '{}'::jsonb,
  status text not null default 'completed', created_at timestamptz not null default now(),
  unique (school_id, action_key, idempotency_key)
);
alter table public.angelcare360_area10_action_receipts enable row level security;
revoke all on table public.angelcare360_area10_action_receipts from anon, authenticated;
grant all on table public.angelcare360_area10_action_receipts to service_role;
create index if not exists angelcare360_area10_action_receipts_school_student_idx on public.angelcare360_area10_action_receipts(school_id, student_id);
create index if not exists angelcare360_area10_action_receipts_status_idx on public.angelcare360_area10_action_receipts(school_id, status);
create index if not exists angelcare360_area10_action_receipts_created_idx on public.angelcare360_area10_action_receipts(school_id, created_at desc);

-- Product Constitution registration uses the canonical existing schema.
insert into public.angelcare360_operator_product_operations
  (operation_key, route_path, feature_key, operation_name, permission_key, audit_event, mutation_endpoints, source_confidence, status)
values
  ('student.view', '/angelcare-360-command-center/eleves', 'student360.master-dossier', 'student · view', 'angelcare360.people.view', 'student360.student.view', '[]'::jsonb, 'canonical-source-backed', 'published'),
  ('student.view_sensitive', '/angelcare-360-command-center/eleves', 'student360.master-dossier', 'student · view sensitive', 'angelcare360.people.view', 'student360.student.view_sensitive', '["/api/angelcare360/students/area10"]'::jsonb, 'canonical-source-backed', 'published'),
  ('student.update_identity', '/angelcare-360-command-center/eleves', 'student360.master-dossier', 'student · update identity', 'angelcare360.people.update', 'student360.student.update_identity', '["/api/angelcare360/students/area10"]'::jsonb, 'canonical-source-backed', 'published'),
  ('student.update_status', '/angelcare-360-command-center/eleves', 'student360.master-dossier', 'student · update status', 'angelcare360.people.update', 'student360.student.update_status', '["/api/angelcare360/students/area10"]'::jsonb, 'canonical-source-backed', 'published'),
  ('student.request_verification', '/angelcare-360-command-center/eleves', 'student360.master-dossier', 'student · request verification', 'angelcare360.people.update', 'student360.student.request_verification', '["/api/angelcare360/students/area10"]'::jsonb, 'canonical-source-backed', 'published'),
  ('student_enrollment.view', '/angelcare-360-command-center/eleves', 'student360.master-dossier', 'student enrollment · view', 'angelcare360.people.view', 'student360.student_enrollment.view', '[]'::jsonb, 'canonical-source-backed', 'published'),
  ('student_enrollment.update', '/angelcare-360-command-center/eleves', 'student360.master-dossier', 'student enrollment · update', 'angelcare360.people.update', 'student360.student_enrollment.update', '["/api/angelcare360/students/area10"]'::jsonb, 'canonical-source-backed', 'published'),
  ('student_enrollment.transition', '/angelcare-360-command-center/eleves', 'student360.master-dossier', 'student enrollment · transition', 'angelcare360.people.update', 'student360.student_enrollment.transition', '["/api/angelcare360/students/area10"]'::jsonb, 'canonical-source-backed', 'published'),
  ('student_enrollment.close', '/angelcare-360-command-center/eleves', 'student360.master-dossier', 'student enrollment · close', 'angelcare360.people.update', 'student360.student_enrollment.close', '["/api/angelcare360/students/area10"]'::jsonb, 'canonical-source-backed', 'published'),
  ('student_placement.view', '/angelcare-360-command-center/eleves', 'student360.master-dossier', 'student placement · view', 'angelcare360.people.view', 'student360.student_placement.view', '[]'::jsonb, 'canonical-source-backed', 'published'),
  ('student_placement.request_change', '/angelcare-360-command-center/eleves', 'student360.master-dossier', 'student placement · request change', 'angelcare360.people.update', 'student360.student_placement.request_change', '["/api/angelcare360/students/area10"]'::jsonb, 'canonical-source-backed', 'published'),
  ('student_placement.preview_transition', '/angelcare-360-command-center/eleves', 'student360.master-dossier', 'student placement · preview transition', 'angelcare360.people.view', 'student360.student_placement.preview_transition', '[]'::jsonb, 'canonical-source-backed', 'published'),
  ('student_health.view', '/angelcare-360-command-center/eleves', 'student360.master-dossier', 'student health · view', 'angelcare360.people.view', 'student360.student_health.view', '[]'::jsonb, 'canonical-source-backed', 'published'),
  ('student_health.view_sensitive', '/angelcare-360-command-center/eleves', 'student360.master-dossier', 'student health · view sensitive', 'angelcare360.people.view', 'student360.student_health.view_sensitive', '["/api/angelcare360/students/area10"]'::jsonb, 'canonical-source-backed', 'published'),
  ('student_health.add_instruction', '/angelcare-360-command-center/eleves', 'student360.master-dossier', 'student health · add instruction', 'angelcare360.people.create', 'student360.student_health.add_instruction', '["/api/angelcare360/students/area10"]'::jsonb, 'canonical-source-backed', 'published'),
  ('student_health.update_instruction', '/angelcare-360-command-center/eleves', 'student360.master-dossier', 'student health · update instruction', 'angelcare360.people.update', 'student360.student_health.update_instruction', '["/api/angelcare360/students/area10"]'::jsonb, 'canonical-source-backed', 'published'),
  ('student_health.verify', '/angelcare-360-command-center/eleves', 'student360.master-dossier', 'student health · verify', 'angelcare360.people.update', 'student360.student_health.verify', '["/api/angelcare360/students/area10"]'::jsonb, 'canonical-source-backed', 'published'),
  ('student_health.expire', '/angelcare-360-command-center/eleves', 'student360.master-dossier', 'student health · expire', 'angelcare360.people.update', 'student360.student_health.expire', '["/api/angelcare360/students/area10"]'::jsonb, 'canonical-source-backed', 'published'),
  ('student_health.archive', '/angelcare-360-command-center/eleves', 'student360.master-dossier', 'student health · archive', 'angelcare360.people.update', 'student360.student_health.archive', '["/api/angelcare360/students/area10"]'::jsonb, 'canonical-source-backed', 'published'),
  ('student_medication.create', '/angelcare-360-command-center/eleves', 'student360.master-dossier', 'student medication · create', 'angelcare360.people.create', 'student360.student_medication.create', '["/api/angelcare360/students/area10"]'::jsonb, 'canonical-source-backed', 'published'),
  ('student_medication.update', '/angelcare-360-command-center/eleves', 'student360.master-dossier', 'student medication · update', 'angelcare360.people.update', 'student360.student_medication.update', '["/api/angelcare360/students/area10"]'::jsonb, 'canonical-source-backed', 'published'),
  ('student_medication.record_administration', '/angelcare-360-command-center/eleves', 'student360.master-dossier', 'student medication · record administration', 'angelcare360.people.update', 'student360.student_medication.record_administration', '["/api/angelcare360/students/area10"]'::jsonb, 'canonical-source-backed', 'published'),
  ('student_medication.record_missed', '/angelcare-360-command-center/eleves', 'student360.master-dossier', 'student medication · record missed', 'angelcare360.people.update', 'student360.student_medication.record_missed', '["/api/angelcare360/students/area10"]'::jsonb, 'canonical-source-backed', 'published'),
  ('student_medication.close', '/angelcare-360-command-center/eleves', 'student360.master-dossier', 'student medication · close', 'angelcare360.people.update', 'student360.student_medication.close', '["/api/angelcare360/students/area10"]'::jsonb, 'canonical-source-backed', 'published'),
  ('student_document.request', '/angelcare-360-command-center/eleves', 'student360.master-dossier', 'student document · request', 'angelcare360.people.update', 'student360.student_document.request', '["/api/angelcare360/students/area10"]'::jsonb, 'canonical-source-backed', 'published'),
  ('student_document.receive', '/angelcare-360-command-center/eleves', 'student360.master-dossier', 'student document · receive', 'angelcare360.people.update', 'student360.student_document.receive', '["/api/angelcare360/students/area10"]'::jsonb, 'canonical-source-backed', 'published'),
  ('student_document.verify', '/angelcare-360-command-center/eleves', 'student360.master-dossier', 'student document · verify', 'angelcare360.people.update', 'student360.student_document.verify', '["/api/angelcare360/students/area10"]'::jsonb, 'canonical-source-backed', 'published'),
  ('student_document.replace', '/angelcare-360-command-center/eleves', 'student360.master-dossier', 'student document · replace', 'angelcare360.people.update', 'student360.student_document.replace', '["/api/angelcare360/students/area10"]'::jsonb, 'canonical-source-backed', 'published'),
  ('student_document.archive', '/angelcare-360-command-center/eleves', 'student360.master-dossier', 'student document · archive', 'angelcare360.people.update', 'student360.student_document.archive', '["/api/angelcare360/students/area10"]'::jsonb, 'canonical-source-backed', 'published'),
  ('student_consent.view', '/angelcare-360-command-center/eleves', 'student360.master-dossier', 'student consent · view', 'angelcare360.people.view', 'student360.student_consent.view', '[]'::jsonb, 'canonical-source-backed', 'published'),
  ('student_consent.request', '/angelcare-360-command-center/eleves', 'student360.master-dossier', 'student consent · request', 'angelcare360.people.update', 'student360.student_consent.request', '["/api/angelcare360/students/area10"]'::jsonb, 'canonical-source-backed', 'published'),
  ('student_consent.verify', '/angelcare-360-command-center/eleves', 'student360.master-dossier', 'student consent · verify', 'angelcare360.people.update', 'student360.student_consent.verify', '["/api/angelcare360/students/area10"]'::jsonb, 'canonical-source-backed', 'published'),
  ('student_consent.expire', '/angelcare-360-command-center/eleves', 'student360.master-dossier', 'student consent · expire', 'angelcare360.people.update', 'student360.student_consent.expire', '["/api/angelcare360/students/area10"]'::jsonb, 'canonical-source-backed', 'published'),
  ('student_attendance.view', '/angelcare-360-command-center/eleves', 'student360.master-dossier', 'student attendance · view', 'angelcare360.people.view', 'student360.student_attendance.view', '[]'::jsonb, 'canonical-source-backed', 'published'),
  ('student_attendance.request_correction', '/angelcare-360-command-center/eleves', 'student360.master-dossier', 'student attendance · request correction', 'angelcare360.people.update', 'student360.student_attendance.request_correction', '["/api/angelcare360/students/area10"]'::jsonb, 'canonical-source-backed', 'published'),
  ('student_attendance.justify', '/angelcare-360-command-center/eleves', 'student360.master-dossier', 'student attendance · justify', 'angelcare360.people.update', 'student360.student_attendance.justify', '["/api/angelcare360/students/area10"]'::jsonb, 'canonical-source-backed', 'published'),
  ('student_attendance.escalate', '/angelcare-360-command-center/eleves', 'student360.master-dossier', 'student attendance · escalate', 'angelcare360.people.update', 'student360.student_attendance.escalate', '["/api/angelcare360/students/area10"]'::jsonb, 'canonical-source-backed', 'published'),
  ('student_academic.view', '/angelcare-360-command-center/eleves', 'student360.master-dossier', 'student academic · view', 'angelcare360.people.view', 'student360.student_academic.view', '[]'::jsonb, 'canonical-source-backed', 'published'),
  ('student_academic.request_review', '/angelcare-360-command-center/eleves', 'student360.master-dossier', 'student academic · request review', 'angelcare360.people.update', 'student360.student_academic.request_review', '["/api/angelcare360/students/area10"]'::jsonb, 'canonical-source-backed', 'published'),
  ('student_academic.add_observation', '/angelcare-360-command-center/eleves', 'student360.master-dossier', 'student academic · add observation', 'angelcare360.people.create', 'student360.student_academic.add_observation', '["/api/angelcare360/students/area10"]'::jsonb, 'canonical-source-backed', 'published'),
  ('student_wellbeing.add_observation', '/angelcare-360-command-center/eleves', 'student360.master-dossier', 'student wellbeing · add observation', 'angelcare360.people.create', 'student360.student_wellbeing.add_observation', '["/api/angelcare360/students/area10"]'::jsonb, 'canonical-source-backed', 'published'),
  ('student_wellbeing.create_support_plan', '/angelcare-360-command-center/eleves', 'student360.master-dossier', 'student wellbeing · create support plan', 'angelcare360.people.create', 'student360.student_wellbeing.create_support_plan', '["/api/angelcare360/students/area10"]'::jsonb, 'canonical-source-backed', 'published'),
  ('student_wellbeing.update_support_plan', '/angelcare-360-command-center/eleves', 'student360.master-dossier', 'student wellbeing · update support plan', 'angelcare360.people.update', 'student360.student_wellbeing.update_support_plan', '["/api/angelcare360/students/area10"]'::jsonb, 'canonical-source-backed', 'published'),
  ('student_wellbeing.review_support_plan', '/angelcare-360-command-center/eleves', 'student360.master-dossier', 'student wellbeing · review support plan', 'angelcare360.people.update', 'student360.student_wellbeing.review_support_plan', '["/api/angelcare360/students/area10"]'::jsonb, 'canonical-source-backed', 'published'),
  ('student_wellbeing.close_support_plan', '/angelcare-360-command-center/eleves', 'student360.master-dossier', 'student wellbeing · close support plan', 'angelcare360.people.update', 'student360.student_wellbeing.close_support_plan', '["/api/angelcare360/students/area10"]'::jsonb, 'canonical-source-backed', 'published'),
  ('student_incident.create', '/angelcare-360-command-center/eleves', 'student360.master-dossier', 'student incident · create', 'angelcare360.people.create', 'student360.student_incident.create', '["/api/angelcare360/students/area10"]'::jsonb, 'canonical-source-backed', 'published'),
  ('student_incident.acknowledge', '/angelcare-360-command-center/eleves', 'student360.master-dossier', 'student incident · acknowledge', 'angelcare360.people.update', 'student360.student_incident.acknowledge', '["/api/angelcare360/students/area10"]'::jsonb, 'canonical-source-backed', 'published'),
  ('student_incident.assign', '/angelcare-360-command-center/eleves', 'student360.master-dossier', 'student incident · assign', 'angelcare360.people.create', 'student360.student_incident.assign', '["/api/angelcare360/students/area10"]'::jsonb, 'canonical-source-backed', 'published'),
  ('student_incident.add_evidence', '/angelcare-360-command-center/eleves', 'student360.master-dossier', 'student incident · add evidence', 'angelcare360.people.create', 'student360.student_incident.add_evidence', '["/api/angelcare360/students/area10"]'::jsonb, 'canonical-source-backed', 'published'),
  ('student_incident.request_followup', '/angelcare-360-command-center/eleves', 'student360.master-dossier', 'student incident · request followup', 'angelcare360.people.update', 'student360.student_incident.request_followup', '["/api/angelcare360/students/area10"]'::jsonb, 'canonical-source-backed', 'published'),
  ('student_incident.resolve', '/angelcare-360-command-center/eleves', 'student360.master-dossier', 'student incident · resolve', 'angelcare360.people.update', 'student360.student_incident.resolve', '["/api/angelcare360/students/area10"]'::jsonb, 'canonical-source-backed', 'published'),
  ('student_incident.reopen', '/angelcare-360-command-center/eleves', 'student360.master-dossier', 'student incident · reopen', 'angelcare360.people.update', 'student360.student_incident.reopen', '["/api/angelcare360/students/area10"]'::jsonb, 'canonical-source-backed', 'published'),
  ('student_service.view', '/angelcare-360-command-center/eleves', 'student360.master-dossier', 'student service · view', 'angelcare360.people.view', 'student360.student_service.view', '[]'::jsonb, 'canonical-source-backed', 'published'),
  ('student_service.request_activation', '/angelcare-360-command-center/eleves', 'student360.master-dossier', 'student service · request activation', 'angelcare360.people.update', 'student360.student_service.request_activation', '["/api/angelcare360/students/area10"]'::jsonb, 'canonical-source-backed', 'published'),
  ('student_service.request_change', '/angelcare-360-command-center/eleves', 'student360.master-dossier', 'student service · request change', 'angelcare360.people.update', 'student360.student_service.request_change', '["/api/angelcare360/students/area10"]'::jsonb, 'canonical-source-backed', 'published'),
  ('student_service.request_stop', '/angelcare-360-command-center/eleves', 'student360.master-dossier', 'student service · request stop', 'angelcare360.people.update', 'student360.student_service.request_stop', '["/api/angelcare360/students/area10"]'::jsonb, 'canonical-source-backed', 'published'),
  ('student_transition.prepare', '/angelcare-360-command-center/eleves', 'student360.master-dossier', 'student transition · prepare', 'angelcare360.people.update', 'student360.student_transition.prepare', '["/api/angelcare360/students/area10"]'::jsonb, 'canonical-source-backed', 'published'),
  ('student_transition.validate', '/angelcare-360-command-center/eleves', 'student360.master-dossier', 'student transition · validate', 'angelcare360.people.update', 'student360.student_transition.validate', '["/api/angelcare360/students/area10"]'::jsonb, 'canonical-source-backed', 'published'),
  ('student_transition.request_approval', '/angelcare-360-command-center/eleves', 'student360.master-dossier', 'student transition · request approval', 'angelcare360.people.update', 'student360.student_transition.request_approval', '["/api/angelcare360/students/area10"]'::jsonb, 'canonical-source-backed', 'published'),
  ('student_transition.execute', '/angelcare-360-command-center/eleves', 'student360.master-dossier', 'student transition · execute', 'angelcare360.people.update', 'student360.student_transition.execute', '["/api/angelcare360/students/area10"]'::jsonb, 'canonical-source-backed', 'published'),
  ('student_transition.retry', '/angelcare-360-command-center/eleves', 'student360.master-dossier', 'student transition · retry', 'angelcare360.people.update', 'student360.student_transition.retry', '["/api/angelcare360/students/area10"]'::jsonb, 'canonical-source-backed', 'published'),
  ('student_transition.cancel', '/angelcare-360-command-center/eleves', 'student360.master-dossier', 'student transition · cancel', 'angelcare360.people.update', 'student360.student_transition.cancel', '["/api/angelcare360/students/area10"]'::jsonb, 'canonical-source-backed', 'published'),
  ('student_departure.prepare', '/angelcare-360-command-center/eleves', 'student360.master-dossier', 'student departure · prepare', 'angelcare360.people.update', 'student360.student_departure.prepare', '["/api/angelcare360/students/area10"]'::jsonb, 'canonical-source-backed', 'published'),
  ('student_departure.validate', '/angelcare-360-command-center/eleves', 'student360.master-dossier', 'student departure · validate', 'angelcare360.people.update', 'student360.student_departure.validate', '["/api/angelcare360/students/area10"]'::jsonb, 'canonical-source-backed', 'published'),
  ('student_departure.execute', '/angelcare-360-command-center/eleves', 'student360.master-dossier', 'student departure · execute', 'angelcare360.people.update', 'student360.student_departure.execute', '["/api/angelcare360/students/area10"]'::jsonb, 'canonical-source-backed', 'published'),
  ('student_departure.archive', '/angelcare-360-command-center/eleves', 'student360.master-dossier', 'student departure · archive', 'angelcare360.people.update', 'student360.student_departure.archive', '["/api/angelcare360/students/area10"]'::jsonb, 'canonical-source-backed', 'published'),
  ('student_task.assign', '/angelcare-360-command-center/eleves', 'student360.master-dossier', 'student task · assign', 'angelcare360.people.create', 'student360.student_task.assign', '["/api/angelcare360/students/area10"]'::jsonb, 'canonical-source-backed', 'published'),
  ('student_task.complete', '/angelcare-360-command-center/eleves', 'student360.master-dossier', 'student task · complete', 'angelcare360.people.update', 'student360.student_task.complete', '["/api/angelcare360/students/area10"]'::jsonb, 'canonical-source-backed', 'published'),
  ('student_task.reopen', '/angelcare-360-command-center/eleves', 'student360.master-dossier', 'student task · reopen', 'angelcare360.people.update', 'student360.student_task.reopen', '["/api/angelcare360/students/area10"]'::jsonb, 'canonical-source-backed', 'published'),
  ('student_note.add', '/angelcare-360-command-center/eleves', 'student360.master-dossier', 'student note · add', 'angelcare360.people.update', 'student360.student_note.add', '["/api/angelcare360/students/area10"]'::jsonb, 'canonical-source-backed', 'published'),
  ('student_history.view', '/angelcare-360-command-center/eleves', 'student360.master-dossier', 'student history · view', 'angelcare360.people.view', 'student360.student_history.view', '[]'::jsonb, 'canonical-source-backed', 'published'),
  ('student_evidence.request', '/angelcare-360-command-center/eleves', 'student360.master-dossier', 'student evidence · request', 'angelcare360.people.update', 'student360.student_evidence.request', '["/api/angelcare360/students/area10"]'::jsonb, 'canonical-source-backed', 'published'),
  ('student_topup.request', '/angelcare-360-command-center/eleves', 'student360.master-dossier', 'student topup · request', 'angelcare360.people.update', 'student360.student_topup.request', '["/api/angelcare360/students/area10"]'::jsonb, 'canonical-source-backed', 'published')
on conflict (operation_key) do update set
  route_path = excluded.route_path,
  feature_key = excluded.feature_key,
  operation_name = excluded.operation_name,
  permission_key = excluded.permission_key,
  audit_event = excluded.audit_event,
  mutation_endpoints = excluded.mutation_endpoints,
  source_confidence = excluded.source_confidence,
  status = excluded.status,
  updated_at = now();

commit;

-- Refresh API schema only after successful commit.
notify pgrst, 'reload schema';

select
  'AREA 10 STUDENT 360 MASTER DOSSIER APPLIED' as result,
  17 as protected_area10_tables,
  73 as canonical_operations,
  'UNTOUCHED' as authentication_and_global_sessions,
  'REQUESTED_AFTER_COMMIT' as postgrest_schema_reload;
