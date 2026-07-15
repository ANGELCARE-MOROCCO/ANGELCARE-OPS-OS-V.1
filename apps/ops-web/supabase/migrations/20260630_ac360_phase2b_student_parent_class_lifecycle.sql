-- AngelCare 360 Phase 2B - Student, Parent & Class Lifecycle Runtime Hardening
-- Ref: AC360-PH2B-LIFECYCLE-RUNTIME-2026-06-30
-- Scope: DB-first lifecycle transition, guardian linking, class transfer, integrity, and capacity hardening.
-- Strict rule: backend/system logic only. No front-end school UI in this phase.
-- Safe to run multiple times on Supabase Postgres.

create extension if not exists pgcrypto;

-- Compatibility bridge for Phase 1D/1E/2A installations.
alter table if exists public.ac360_app_action_wiring
  add column if not exists fallback_action_key text;

-- -----------------------------------------------------------------------------
-- 1. Lifecycle hardening tables
-- -----------------------------------------------------------------------------
create table if not exists public.ac360_school_lifecycle_rules (
  rule_key text primary key,
  entity_type text not null,
  from_state text,
  to_state text not null,
  allowed boolean not null default true,
  requires_reason boolean not null default false,
  requires_guardian boolean not null default false,
  requires_active_class boolean not null default false,
  creates_task boolean not null default false,
  severity text not null default 'info',
  description text,
  metadata_json jsonb not null default '{}'::jsonb,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (entity_type in ('student','guardian','class','enrollment','family_link')),
  check (severity in ('debug','info','warning','high','critical')),
  check (status in ('active','disabled','archived'))
);

drop trigger if exists trg_ac360_school_lifecycle_rules_updated_at on public.ac360_school_lifecycle_rules;
create trigger trg_ac360_school_lifecycle_rules_updated_at
before update on public.ac360_school_lifecycle_rules
for each row execute function public.ac360_touch_updated_at();

create table if not exists public.ac360_school_lifecycle_events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  campus_id uuid references public.ac360_campuses(id) on delete set null,
  entity_type text not null,
  entity_id uuid not null,
  action_key text references public.ac360_action_registry(action_key) on delete set null,
  from_status text,
  to_status text,
  from_enrollment_status text,
  to_enrollment_status text,
  reason text,
  decision text not null default 'applied',
  actor_app_user_id uuid,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  check (entity_type in ('student','guardian','class','enrollment','family_link')),
  check (decision in ('requested','applied','blocked','reverted','archived'))
);

create table if not exists public.ac360_school_class_transfer_events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  student_id uuid not null references public.ac360_school_students(id) on delete cascade,
  from_class_id uuid references public.ac360_school_classes(id) on delete set null,
  to_class_id uuid not null references public.ac360_school_classes(id) on delete cascade,
  from_enrollment_id uuid references public.ac360_school_class_enrollments(id) on delete set null,
  to_enrollment_id uuid references public.ac360_school_class_enrollments(id) on delete set null,
  transfer_date date not null default current_date,
  reason text,
  status text not null default 'applied',
  actor_app_user_id uuid,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  check (status in ('requested','applied','cancelled','archived'))
);

create table if not exists public.ac360_school_capacity_snapshots (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  campus_id uuid references public.ac360_campuses(id) on delete set null,
  class_id uuid references public.ac360_school_classes(id) on delete cascade,
  capacity_key text not null default 'class_students',
  current_value numeric not null default 0,
  limit_value numeric,
  usage_ratio numeric,
  decision text not null default 'ok',
  source text not null default 'phase_2b_lifecycle',
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  check (decision in ('ok','near_limit','at_limit','over_limit','unknown'))
);

create table if not exists public.ac360_school_integrity_runs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  status text not null default 'completed',
  score numeric not null default 100,
  critical_count integer not null default 0,
  warning_count integer not null default 0,
  result_json jsonb not null default '{}'::jsonb,
  actor_app_user_id uuid,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  check (status in ('completed','warning','critical','failed'))
);

create table if not exists public.ac360_school_integrity_findings (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.ac360_school_integrity_runs(id) on delete cascade,
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  finding_key text not null,
  severity text not null default 'warning',
  entity_type text,
  entity_id uuid,
  message text not null,
  recommendation text,
  metadata_json jsonb not null default '{}'::jsonb,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  check (severity in ('info','warning','high','critical')),
  check (status in ('open','resolved','ignored','archived'))
);

-- -----------------------------------------------------------------------------
-- 2. Indexes + RLS
-- -----------------------------------------------------------------------------
create index if not exists idx_ac360_school_lifecycle_events_org_entity on public.ac360_school_lifecycle_events(org_id, entity_type, entity_id, created_at desc);
create index if not exists idx_ac360_school_lifecycle_events_action on public.ac360_school_lifecycle_events(action_key, created_at desc);
create index if not exists idx_ac360_school_class_transfer_org_student on public.ac360_school_class_transfer_events(org_id, student_id, created_at desc);
create index if not exists idx_ac360_school_capacity_snapshots_org_class on public.ac360_school_capacity_snapshots(org_id, class_id, created_at desc);
create index if not exists idx_ac360_school_integrity_runs_org_created on public.ac360_school_integrity_runs(org_id, created_at desc);
create index if not exists idx_ac360_school_integrity_findings_run on public.ac360_school_integrity_findings(run_id, severity, status);

alter table public.ac360_school_lifecycle_events enable row level security;
alter table public.ac360_school_lifecycle_rules enable row level security;
alter table public.ac360_school_class_transfer_events enable row level security;
alter table public.ac360_school_capacity_snapshots enable row level security;
alter table public.ac360_school_integrity_runs enable row level security;
alter table public.ac360_school_integrity_findings enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array[
    'ac360_school_lifecycle_rules','ac360_school_lifecycle_events','ac360_school_class_transfer_events',
    'ac360_school_capacity_snapshots','ac360_school_integrity_runs','ac360_school_integrity_findings'
  ] loop
    if not exists (select 1 from pg_policies where schemaname='public' and tablename=t and policyname=t || '_service_role_all') then
      execute format('create policy %I on public.%I for all using (auth.role() = ''service_role'') with check (auth.role() = ''service_role'')', t || '_service_role_all', t);
    end if;
  end loop;
end $$;

-- -----------------------------------------------------------------------------
-- 3. Phase 2B action registry + strict route wiring
-- -----------------------------------------------------------------------------
insert into public.ac360_action_registry(action_key, feature_key, engine_code, label, description, entitlement_key, meter_key, credit_cost, restriction_behavior, metadata_json) values
('school.student.transition','student_core','AC360-ENG-45','Transition student lifecycle','Move a student between prospect/pre-enrolled/enrolled/paused/withdrawn/graduated statuses.','students.lifecycle.transition',null,0,'block','{"access_type":"write","phase":"phase_2b_student_parent_class_lifecycle","lifecycle_entity":"student"}'::jsonb),
('school.student.archive','student_core','AC360-ENG-45','Archive student safely','Archive a student without deleting data and refresh capacity.','students.lifecycle.archive',null,0,'block','{"access_type":"write","phase":"phase_2b_student_parent_class_lifecycle","data_strategy":"archive_not_delete"}'::jsonb),
('school.guardian.link','parent_portal_basic','AC360-ENG-46','Link guardian to student','Create or update parent/guardian relationship, pickup and billing permissions.','parents.guardian.link',null,0,'block','{"access_type":"write","phase":"phase_2b_student_parent_class_lifecycle"}'::jsonb),
('school.guardian.portal_status.update','parent_portal_basic','AC360-ENG-46','Update guardian portal status','Invite, activate, restrict or disable guardian portal access.','parents.portal.status_update',null,0,'block','{"access_type":"write","phase":"phase_2b_student_parent_class_lifecycle"}'::jsonb),
('school.class.transfer_student','classroom_core','AC360-ENG-47','Transfer student class','Move one student from current class to a target class with enrollment history preserved.','classes.student.transfer',null,0,'block','{"access_type":"write","phase":"phase_2b_student_parent_class_lifecycle"}'::jsonb),
('school.class.capacity.reconcile','classroom_core','AC360-ENG-47','Reconcile class capacity','Measure class occupancy and update class full/active status safely.','classes.capacity.reconcile',null,0,'block','{"access_type":"write","phase":"phase_2b_student_parent_class_lifecycle"}'::jsonb),
('school.class.close','classroom_core','AC360-ENG-47','Close/archive class','Close class lifecycle while preserving enrollment history.','classes.lifecycle.close',null,0,'block','{"access_type":"write","phase":"phase_2b_student_parent_class_lifecycle"}'::jsonb),
('school.lifecycle.integrity_check','student_core','AC360-ENG-45','Run school lifecycle integrity check','Validate students, guardians, active enrollments and class capacity consistency.','school_ops.lifecycle.integrity',null,0,'block','{"access_type":"write","phase":"phase_2b_student_parent_class_lifecycle"}'::jsonb)
on conflict (action_key) do update set
  feature_key=excluded.feature_key,
  engine_code=excluded.engine_code,
  label=excluded.label,
  description=excluded.description,
  entitlement_key=excluded.entitlement_key,
  meter_key=excluded.meter_key,
  credit_cost=excluded.credit_cost,
  restriction_behavior=excluded.restriction_behavior,
  metadata_json=public.ac360_action_registry.metadata_json || excluded.metadata_json,
  updated_at=now();

insert into public.ac360_app_action_wiring(
  wiring_key, route_path, http_method, action_key, feature_key, engine_code, target_module, target_table,
  enforcement_mode, quantity_strategy, idempotency_strategy, current_capacity_strategy, fallback_action_key, status, description, metadata_json
) values
('ac360.school_lifecycle.student.transition','/api/ac360/school-lifecycle/students/transition','POST','school.student.transition','student_core','AC360-ENG-45','angelcare_360_school_lifecycle','ac360_school_students','strict','fixed_1','request_or_generated',null,null,'active','Transitions student lifecycle under AC360 guard doctrine.','{"phase":"phase_2b","no_frontend":true}'::jsonb),
('ac360.school_lifecycle.student.archive','/api/ac360/school-lifecycle/students/archive','POST','school.student.archive','student_core','AC360-ENG-45','angelcare_360_school_lifecycle','ac360_school_students','strict','fixed_1','request_or_generated','students_live_count',null,'active','Archives student safely and refreshes student capacity.','{"phase":"phase_2b","capacity_key":"students"}'::jsonb),
('ac360.school_lifecycle.guardian.link','/api/ac360/school-lifecycle/guardians/link','POST','school.guardian.link','parent_portal_basic','AC360-ENG-46','angelcare_360_school_lifecycle','ac360_school_student_guardians','strict','fixed_1','request_or_generated',null,null,'active','Links guardian to student under relationship governance.','{"phase":"phase_2b"}'::jsonb),
('ac360.school_lifecycle.guardian.portal_status','/api/ac360/school-lifecycle/guardians/portal-status','POST','school.guardian.portal_status.update','parent_portal_basic','AC360-ENG-46','angelcare_360_school_lifecycle','ac360_school_guardians','strict','fixed_1','request_or_generated',null,null,'active','Updates guardian portal lifecycle status.','{"phase":"phase_2b"}'::jsonb),
('ac360.school_lifecycle.class.transfer','/api/ac360/school-lifecycle/classes/transfer','POST','school.class.transfer_student','classroom_core','AC360-ENG-47','angelcare_360_school_lifecycle','ac360_school_class_enrollments','strict','fixed_1','request_or_generated',null,null,'active','Transfers student between classes while preserving enrollment history.','{"phase":"phase_2b"}'::jsonb),
('ac360.school_lifecycle.class.capacity_reconcile','/api/ac360/school-lifecycle/classes/capacity-reconcile','POST','school.class.capacity.reconcile','classroom_core','AC360-ENG-47','angelcare_360_school_lifecycle','ac360_school_capacity_snapshots','strict','fixed_1','request_or_generated','classes_live_count',null,'active','Reconciles class occupancy and records capacity snapshot.','{"phase":"phase_2b"}'::jsonb),
('ac360.school_lifecycle.class.close','/api/ac360/school-lifecycle/classes/close','POST','school.class.close','classroom_core','AC360-ENG-47','angelcare_360_school_lifecycle','ac360_school_classes','strict','fixed_1','request_or_generated',null,null,'active','Closes class lifecycle without deleting records.','{"phase":"phase_2b","data_strategy":"archive_not_delete"}'::jsonb),
('ac360.school_lifecycle.integrity_check','/api/ac360/school-lifecycle/integrity-check','POST','school.lifecycle.integrity_check','student_core','AC360-ENG-45','angelcare_360_school_lifecycle','ac360_school_integrity_runs','strict','fixed_1','request_or_generated',null,null,'active','Runs student/guardian/class lifecycle integrity checks.','{"phase":"phase_2b"}'::jsonb)
on conflict (wiring_key) do update set
  route_path=excluded.route_path,
  http_method=excluded.http_method,
  action_key=excluded.action_key,
  feature_key=excluded.feature_key,
  engine_code=excluded.engine_code,
  target_module=excluded.target_module,
  target_table=excluded.target_table,
  enforcement_mode=excluded.enforcement_mode,
  quantity_strategy=excluded.quantity_strategy,
  idempotency_strategy=excluded.idempotency_strategy,
  current_capacity_strategy=excluded.current_capacity_strategy,
  fallback_action_key=excluded.fallback_action_key,
  status=excluded.status,
  description=excluded.description,
  metadata_json=public.ac360_app_action_wiring.metadata_json || excluded.metadata_json,
  updated_at=now();

insert into public.ac360_permissions(permission_key, category, label, description, risk_level, is_system_locked) values
('ac360.school_lifecycle.view','AC360 School Lifecycle','View lifecycle runtime','Allows viewing lifecycle dashboard and integrity results.', 'medium', true),
('ac360.school_lifecycle.write','AC360 School Lifecycle','Execute lifecycle transitions','Allows guarded lifecycle transitions, guardian linking, and class transfers.', 'high', true),
('ac360.school_lifecycle.integrity','AC360 School Lifecycle','Run lifecycle integrity checks','Allows running integrity and capacity consistency checks.', 'critical', true)
on conflict (permission_key) do update set label=excluded.label, description=excluded.description, risk_level=excluded.risk_level, updated_at=now();

insert into public.ac360_school_lifecycle_rules(rule_key, entity_type, from_state, to_state, allowed, requires_reason, requires_guardian, requires_active_class, creates_task, severity, description, metadata_json, status) values
('student.prospect_to_pre_enrolled','student','prospect','pre_enrolled',true,false,true,false,false,'info','Prospect can become pre-enrolled once guardian/contact exists.','{"phase":"phase_2b"}'::jsonb,'active'),
('student.pre_enrolled_to_enrolled','student','pre_enrolled','enrolled',true,false,true,true,false,'info','Pre-enrolled student can become enrolled once class assignment is ready.','{"phase":"phase_2b"}'::jsonb,'active'),
('student.enrolled_to_paused','student','enrolled','paused',true,true,false,false,true,'warning','Pause requires reason and may create follow-up task.','{"phase":"phase_2b"}'::jsonb,'active'),
('student.enrolled_to_withdrawn','student','enrolled','withdrawn',true,true,false,false,true,'high','Withdrawal requires reason and preserves archive.','{"phase":"phase_2b"}'::jsonb,'active'),
('student.enrolled_to_graduated','student','enrolled','graduated',true,false,false,false,false,'info','Graduation preserves alumni history.','{"phase":"phase_2b"}'::jsonb,'active'),
('guardian.not_invited_to_invited','guardian','not_invited','invited',true,false,false,false,false,'info','Guardian can be invited to portal.','{"phase":"phase_2b"}'::jsonb,'active'),
('guardian.active_to_restricted','guardian','active','restricted',true,true,false,false,true,'high','Portal restriction requires reason.','{"phase":"phase_2b"}'::jsonb,'active'),
('class.active_to_full','class','active','full',true,false,false,false,false,'warning','Class becomes full once capacity is reached.','{"phase":"phase_2b"}'::jsonb,'active'),
('class.active_to_archived','class','active','archived',true,true,false,false,true,'high','Class archiving requires reason and preserves enrollments.','{"phase":"phase_2b"}'::jsonb,'active')
on conflict (rule_key) do update set
  entity_type=excluded.entity_type,
  from_state=excluded.from_state,
  to_state=excluded.to_state,
  allowed=excluded.allowed,
  requires_reason=excluded.requires_reason,
  requires_guardian=excluded.requires_guardian,
  requires_active_class=excluded.requires_active_class,
  creates_task=excluded.creates_task,
  severity=excluded.severity,
  description=excluded.description,
  metadata_json=public.ac360_school_lifecycle_rules.metadata_json || excluded.metadata_json,
  status=excluded.status,
  updated_at=now();

insert into public.ac360_automation_rules(rule_key, label, system_group, trigger_event, condition_json, action_json, sort_order, status, phase) values
('phase2b.guardian_required_before_enrollment','Student must have guardian before full enrollment','School Lifecycle System','school.student.transition','{"to_enrollment_status":"enrolled","requires_guardian":true}'::jsonb,'{"block_or_warn":"warn","create_integrity_finding":true}'::jsonb,131,'active','phase_2b_student_parent_class_lifecycle'),
('phase2b.class_capacity_reconcile_after_transfer','Reconcile class capacity after transfer','School Lifecycle System','school.class.transfer_student','{"after_transfer":true}'::jsonb,'{"run_capacity_reconcile":true,"measure_capacity":true}'::jsonb,132,'active','phase_2b_student_parent_class_lifecycle'),
('phase2b.archive_not_delete_student','Archived students preserve all historical records','School Lifecycle System','school.student.archive','{"delete_strategy":"disabled"}'::jsonb,'{"archive_not_delete":true,"refresh_capacity":true}'::jsonb,133,'active','phase_2b_student_parent_class_lifecycle'),
('phase2b.integrity_check_before_ui','Lifecycle integrity gate before UI build','School Lifecycle System','school.lifecycle.integrity_check','{"ui_build_allowed":false}'::jsonb,'{"require_zero_critical_findings_before_ui":true}'::jsonb,134,'active','phase_2b_student_parent_class_lifecycle')
on conflict (rule_key) do update set label=excluded.label, condition_json=excluded.condition_json, action_json=excluded.action_json, sort_order=excluded.sort_order, status=excluded.status, phase=excluded.phase, updated_at=now();

-- -----------------------------------------------------------------------------
-- 4. Lifecycle RPC helpers
-- -----------------------------------------------------------------------------
create or replace function public.ac360_school_record_lifecycle_event(
  p_org_id uuid,
  p_campus_id uuid,
  p_entity_type text,
  p_entity_id uuid,
  p_action_key text,
  p_from_status text default null,
  p_to_status text default null,
  p_from_enrollment_status text default null,
  p_to_enrollment_status text default null,
  p_reason text default null,
  p_actor_app_user_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
as $$
declare
  v_event_id uuid;
begin
  insert into public.ac360_school_lifecycle_events(
    org_id, campus_id, entity_type, entity_id, action_key, from_status, to_status,
    from_enrollment_status, to_enrollment_status, reason, decision, actor_app_user_id, metadata_json
  ) values (
    p_org_id, p_campus_id, p_entity_type, p_entity_id, p_action_key, p_from_status, p_to_status,
    p_from_enrollment_status, p_to_enrollment_status, p_reason, 'applied', p_actor_app_user_id, coalesce(p_metadata,'{}'::jsonb)
  ) returning id into v_event_id;

  insert into public.ac360_school_operation_events(org_id, campus_id, event_key, action_key, entity_type, entity_id, severity, message, actor_app_user_id, metadata_json)
  values (p_org_id, p_campus_id, 'phase2b.lifecycle.event', p_action_key, p_entity_type, p_entity_id, 'info', 'AC360 Phase 2B lifecycle event recorded.', p_actor_app_user_id, jsonb_build_object('lifecycleEventId', v_event_id) || coalesce(p_metadata,'{}'::jsonb));

  return v_event_id;
end;
$$;

create or replace function public.ac360_school_transition_student(
  p_org_id uuid,
  p_student_id uuid,
  p_to_enrollment_status text,
  p_to_status text default null,
  p_reason text default null,
  p_actor_app_user_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_student public.ac360_school_students%rowtype;
  v_new_status text;
  v_event_id uuid;
  v_guardian_count integer := 0;
  v_enrollment_count integer := 0;
begin
  if p_org_id is null or p_student_id is null then raise exception 'p_org_id and p_student_id are required'; end if;
  select * into v_student from public.ac360_school_students where org_id = p_org_id and id = p_student_id for update;
  if v_student.id is null then raise exception 'Student not found for this organization'; end if;

  select count(*) into v_guardian_count from public.ac360_school_student_guardians where org_id = p_org_id and student_id = p_student_id and status = 'active';
  select count(*) into v_enrollment_count from public.ac360_school_class_enrollments where org_id = p_org_id and student_id = p_student_id and status = 'active';

  if p_to_enrollment_status in ('enrolled','active') and v_guardian_count = 0 then
    insert into public.ac360_school_integrity_findings(run_id, org_id, finding_key, severity, entity_type, entity_id, message, recommendation, metadata_json)
    select r.id, p_org_id, 'student_enrollment_without_guardian', 'high', 'student', p_student_id, 'Student enrollment transition requested without active guardian link.', 'Link at least one guardian before operational enrollment.', coalesce(p_metadata,'{}'::jsonb)
    from public.ac360_school_integrity_runs r where false;
    -- No blocking here: Phase 2B logs and lets guard/policy decide in later UI workflow.
  end if;

  v_new_status := coalesce(p_to_status, case when p_to_enrollment_status in ('withdrawn','graduated','archived') then 'archived' when p_to_enrollment_status = 'paused' then 'inactive' else 'active' end);

  update public.ac360_school_students
  set enrollment_status = p_to_enrollment_status,
      status = v_new_status,
      exited_on = case when p_to_enrollment_status in ('withdrawn','graduated','archived') then coalesce(exited_on, current_date) else exited_on end,
      archived_at = case when v_new_status = 'archived' then coalesce(archived_at, now()) else archived_at end,
      metadata_json = metadata_json || jsonb_build_object('lastLifecycleTransitionAt', now(), 'lastLifecycleReason', p_reason),
      updated_at = now()
  where id = p_student_id and org_id = p_org_id;

  v_event_id := public.ac360_school_record_lifecycle_event(
    p_org_id, v_student.campus_id, 'student', p_student_id, 'school.student.transition',
    v_student.status, v_new_status, v_student.enrollment_status, p_to_enrollment_status,
    p_reason, p_actor_app_user_id, coalesce(p_metadata,'{}'::jsonb) || jsonb_build_object('guardianCount', v_guardian_count, 'activeEnrollmentCount', v_enrollment_count)
  );

  perform public.ac360_measure_capacity(p_org_id, 'students', public.ac360_school_current_capacity(p_org_id,'students'), 'ac360_school_students', '{"source":"phase_2b_student_transition"}'::jsonb);

  return jsonb_build_object('ok', true, 'studentId', p_student_id, 'eventId', v_event_id, 'fromStatus', v_student.status, 'toStatus', v_new_status, 'fromEnrollmentStatus', v_student.enrollment_status, 'toEnrollmentStatus', p_to_enrollment_status, 'guardianCount', v_guardian_count, 'activeEnrollmentCount', v_enrollment_count);
end;
$$;

create or replace function public.ac360_school_archive_student(
  p_org_id uuid,
  p_student_id uuid,
  p_reason text default null,
  p_actor_app_user_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
as $$
begin
  return public.ac360_school_transition_student(p_org_id, p_student_id, 'archived', 'archived', coalesce(p_reason,'Archived through Phase 2B safe archive.'), p_actor_app_user_id, coalesce(p_metadata,'{}'::jsonb) || '{"archiveStrategy":"archive_not_delete"}'::jsonb);
end;
$$;

create or replace function public.ac360_school_link_guardian(
  p_org_id uuid,
  p_student_id uuid,
  p_guardian_id uuid,
  p_relation_label text default 'guardian',
  p_is_primary boolean default false,
  p_can_pickup boolean default true,
  p_can_receive_billing boolean default true,
  p_can_receive_reports boolean default true,
  p_actor_app_user_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_student public.ac360_school_students%rowtype;
  v_guardian public.ac360_school_guardians%rowtype;
  v_link public.ac360_school_student_guardians%rowtype;
  v_event_id uuid;
begin
  if p_org_id is null or p_student_id is null or p_guardian_id is null then raise exception 'p_org_id, p_student_id and p_guardian_id are required'; end if;
  select * into v_student from public.ac360_school_students where org_id = p_org_id and id = p_student_id;
  if v_student.id is null then raise exception 'Student not found for this organization'; end if;
  select * into v_guardian from public.ac360_school_guardians where org_id = p_org_id and id = p_guardian_id;
  if v_guardian.id is null then raise exception 'Guardian not found for this organization'; end if;

  if p_is_primary then
    update public.ac360_school_student_guardians set is_primary = false, updated_at = now() where org_id = p_org_id and student_id = p_student_id;
  end if;

  insert into public.ac360_school_student_guardians(org_id, student_id, guardian_id, relation_label, is_primary, can_pickup, can_receive_billing, can_receive_reports, status, metadata_json)
  values (p_org_id, p_student_id, p_guardian_id, coalesce(p_relation_label,'guardian'), coalesce(p_is_primary,false), coalesce(p_can_pickup,true), coalesce(p_can_receive_billing,true), coalesce(p_can_receive_reports,true), 'active', coalesce(p_metadata,'{}'::jsonb))
  on conflict (org_id, student_id, guardian_id) do update set
    relation_label = excluded.relation_label,
    is_primary = excluded.is_primary,
    can_pickup = excluded.can_pickup,
    can_receive_billing = excluded.can_receive_billing,
    can_receive_reports = excluded.can_receive_reports,
    status = 'active',
    metadata_json = public.ac360_school_student_guardians.metadata_json || excluded.metadata_json,
    updated_at = now()
  returning * into v_link;

  v_event_id := public.ac360_school_record_lifecycle_event(
    p_org_id, v_student.campus_id, 'family_link', v_link.id, 'school.guardian.link', null, 'active', null, null,
    'Guardian linked to student.', p_actor_app_user_id, coalesce(p_metadata,'{}'::jsonb) || jsonb_build_object('studentId', p_student_id, 'guardianId', p_guardian_id)
  );

  return jsonb_build_object('ok', true, 'linkId', v_link.id, 'studentId', p_student_id, 'guardianId', p_guardian_id, 'eventId', v_event_id, 'isPrimary', v_link.is_primary);
end;
$$;

create or replace function public.ac360_school_update_guardian_portal_status(
  p_org_id uuid,
  p_guardian_id uuid,
  p_portal_status text,
  p_status text default null,
  p_reason text default null,
  p_actor_app_user_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_guardian public.ac360_school_guardians%rowtype;
  v_new_status text;
  v_event_id uuid;
begin
  select * into v_guardian from public.ac360_school_guardians where org_id = p_org_id and id = p_guardian_id for update;
  if v_guardian.id is null then raise exception 'Guardian not found for this organization'; end if;
  v_new_status := coalesce(p_status, case when p_portal_status in ('restricted','disabled') then 'inactive' else 'active' end);

  update public.ac360_school_guardians
  set portal_status = p_portal_status,
      status = v_new_status,
      metadata_json = metadata_json || jsonb_build_object('lastPortalStatusChangeAt', now(), 'lastPortalStatusReason', p_reason),
      updated_at = now()
  where org_id = p_org_id and id = p_guardian_id;

  v_event_id := public.ac360_school_record_lifecycle_event(
    p_org_id, v_guardian.campus_id, 'guardian', p_guardian_id, 'school.guardian.portal_status.update',
    v_guardian.status, v_new_status, v_guardian.portal_status, p_portal_status,
    p_reason, p_actor_app_user_id, coalesce(p_metadata,'{}'::jsonb)
  );

  return jsonb_build_object('ok', true, 'guardianId', p_guardian_id, 'eventId', v_event_id, 'fromPortalStatus', v_guardian.portal_status, 'toPortalStatus', p_portal_status, 'status', v_new_status);
end;
$$;

create or replace function public.ac360_school_reconcile_class_capacity(
  p_org_id uuid,
  p_class_id uuid,
  p_actor_app_user_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_class public.ac360_school_classes%rowtype;
  v_current numeric := 0;
  v_limit numeric;
  v_ratio numeric;
  v_decision text := 'unknown';
  v_snapshot_id uuid;
begin
  select * into v_class from public.ac360_school_classes where org_id = p_org_id and id = p_class_id for update;
  if v_class.id is null then raise exception 'Class not found for this organization'; end if;

  select count(*)::numeric into v_current
  from public.ac360_school_class_enrollments e
  join public.ac360_school_students s on s.id = e.student_id and s.org_id = e.org_id
  where e.org_id = p_org_id and e.class_id = p_class_id and e.status = 'active' and s.status = 'active' and s.enrollment_status in ('pre_enrolled','enrolled','active');

  v_limit := v_class.capacity_students;
  v_ratio := case when coalesce(v_limit,0) > 0 then v_current / v_limit else null end;
  v_decision := case
    when v_limit is null or v_limit <= 0 then 'unknown'
    when v_current > v_limit then 'over_limit'
    when v_current = v_limit then 'at_limit'
    when v_current >= (v_limit * 0.9) then 'near_limit'
    else 'ok'
  end;

  if v_class.status <> 'archived' then
    update public.ac360_school_classes
    set status = case when v_decision in ('at_limit','over_limit') then 'full' else 'active' end,
        metadata_json = metadata_json || jsonb_build_object('lastCapacityReconcileAt', now(), 'currentStudents', v_current, 'capacityDecision', v_decision),
        updated_at = now()
    where id = p_class_id and org_id = p_org_id;
  end if;

  insert into public.ac360_school_capacity_snapshots(org_id, campus_id, class_id, capacity_key, current_value, limit_value, usage_ratio, decision, source, metadata_json)
  values (p_org_id, v_class.campus_id, p_class_id, 'class_students', v_current, v_limit, v_ratio, v_decision, 'phase_2b_reconcile', coalesce(p_metadata,'{}'::jsonb))
  returning id into v_snapshot_id;

  insert into public.ac360_school_operation_events(org_id, campus_id, event_key, action_key, entity_type, entity_id, severity, message, actor_app_user_id, metadata_json)
  values (p_org_id, v_class.campus_id, 'phase2b.class.capacity_reconciled', 'school.class.capacity.reconcile', 'class', p_class_id, case when v_decision in ('over_limit','at_limit') then 'warning' else 'info' end, 'Class capacity reconciled.', p_actor_app_user_id, jsonb_build_object('snapshotId', v_snapshot_id, 'decision', v_decision, 'current', v_current, 'limit', v_limit));

  return jsonb_build_object('ok', true, 'classId', p_class_id, 'snapshotId', v_snapshot_id, 'currentStudents', v_current, 'capacityStudents', v_limit, 'usageRatio', v_ratio, 'decision', v_decision);
end;
$$;

create or replace function public.ac360_school_transfer_student_class(
  p_org_id uuid,
  p_student_id uuid,
  p_to_class_id uuid,
  p_from_class_id uuid default null,
  p_transfer_date date default current_date,
  p_reason text default null,
  p_actor_app_user_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_student public.ac360_school_students%rowtype;
  v_to_class public.ac360_school_classes%rowtype;
  v_from_enrollment public.ac360_school_class_enrollments%rowtype;
  v_new_enrollment public.ac360_school_class_enrollments%rowtype;
  v_transfer_id uuid;
  v_to_reconcile jsonb;
  v_from_reconcile jsonb := null;
begin
  select * into v_student from public.ac360_school_students where org_id = p_org_id and id = p_student_id;
  if v_student.id is null then raise exception 'Student not found for this organization'; end if;
  select * into v_to_class from public.ac360_school_classes where org_id = p_org_id and id = p_to_class_id and status in ('active','full','restricted');
  if v_to_class.id is null then raise exception 'Target class not found or unavailable for this organization'; end if;

  if p_from_class_id is not null then
    select * into v_from_enrollment from public.ac360_school_class_enrollments
    where org_id = p_org_id and student_id = p_student_id and class_id = p_from_class_id and status = 'active'
    order by created_at desc limit 1 for update;
  else
    select * into v_from_enrollment from public.ac360_school_class_enrollments
    where org_id = p_org_id and student_id = p_student_id and status = 'active'
    order by created_at desc limit 1 for update;
  end if;

  if v_from_enrollment.id is not null then
    update public.ac360_school_class_enrollments set status = 'completed', ends_on = coalesce(p_transfer_date, current_date), updated_at = now()
    where id = v_from_enrollment.id;
  end if;

  insert into public.ac360_school_class_enrollments(org_id, student_id, class_id, academic_year_id, status, starts_on, metadata_json)
  values (p_org_id, p_student_id, p_to_class_id, coalesce(v_to_class.academic_year_id, v_student.academic_year_id), 'active', coalesce(p_transfer_date,current_date), coalesce(p_metadata,'{}'::jsonb) || jsonb_build_object('createdByTransfer', true))
  on conflict (org_id, student_id, class_id, starts_on) do update set status = 'active', ends_on = null, metadata_json = public.ac360_school_class_enrollments.metadata_json || excluded.metadata_json, updated_at = now()
  returning * into v_new_enrollment;

  insert into public.ac360_school_class_transfer_events(org_id, student_id, from_class_id, to_class_id, from_enrollment_id, to_enrollment_id, transfer_date, reason, status, actor_app_user_id, metadata_json)
  values (p_org_id, p_student_id, v_from_enrollment.class_id, p_to_class_id, v_from_enrollment.id, v_new_enrollment.id, coalesce(p_transfer_date,current_date), p_reason, 'applied', p_actor_app_user_id, coalesce(p_metadata,'{}'::jsonb))
  returning id into v_transfer_id;

  perform public.ac360_school_record_lifecycle_event(p_org_id, v_to_class.campus_id, 'enrollment', v_new_enrollment.id, 'school.class.transfer_student', v_from_enrollment.status, 'active', null, null, p_reason, p_actor_app_user_id, jsonb_build_object('transferId', v_transfer_id, 'studentId', p_student_id, 'fromClassId', v_from_enrollment.class_id, 'toClassId', p_to_class_id) || coalesce(p_metadata,'{}'::jsonb));

  v_to_reconcile := public.ac360_school_reconcile_class_capacity(p_org_id, p_to_class_id, p_actor_app_user_id, coalesce(p_metadata,'{}'::jsonb) || jsonb_build_object('sourceTransferId', v_transfer_id));
  if v_from_enrollment.class_id is not null and v_from_enrollment.class_id <> p_to_class_id then
    v_from_reconcile := public.ac360_school_reconcile_class_capacity(p_org_id, v_from_enrollment.class_id, p_actor_app_user_id, coalesce(p_metadata,'{}'::jsonb) || jsonb_build_object('sourceTransferId', v_transfer_id));
  end if;

  return jsonb_build_object('ok', true, 'transferId', v_transfer_id, 'studentId', p_student_id, 'fromClassId', v_from_enrollment.class_id, 'toClassId', p_to_class_id, 'newEnrollmentId', v_new_enrollment.id, 'toClassCapacity', v_to_reconcile, 'fromClassCapacity', v_from_reconcile);
end;
$$;

create or replace function public.ac360_school_close_class(
  p_org_id uuid,
  p_class_id uuid,
  p_reason text default null,
  p_actor_app_user_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_class public.ac360_school_classes%rowtype;
  v_active_count integer := 0;
  v_event_id uuid;
begin
  select * into v_class from public.ac360_school_classes where org_id = p_org_id and id = p_class_id for update;
  if v_class.id is null then raise exception 'Class not found for this organization'; end if;
  select count(*) into v_active_count from public.ac360_school_class_enrollments where org_id = p_org_id and class_id = p_class_id and status = 'active';

  update public.ac360_school_classes
  set status = 'archived', archived_at = coalesce(archived_at, now()), metadata_json = metadata_json || jsonb_build_object('closedAt', now(), 'closeReason', p_reason, 'activeEnrollmentCountAtClose', v_active_count), updated_at = now()
  where org_id = p_org_id and id = p_class_id;

  v_event_id := public.ac360_school_record_lifecycle_event(p_org_id, v_class.campus_id, 'class', p_class_id, 'school.class.close', v_class.status, 'archived', null, null, p_reason, p_actor_app_user_id, coalesce(p_metadata,'{}'::jsonb) || jsonb_build_object('activeEnrollmentCount', v_active_count));
  perform public.ac360_measure_capacity(p_org_id, 'classes', public.ac360_school_current_capacity(p_org_id,'classes'), 'ac360_school_classes', '{"source":"phase_2b_class_close"}'::jsonb);

  return jsonb_build_object('ok', true, 'classId', p_class_id, 'eventId', v_event_id, 'activeEnrollmentCountAtClose', v_active_count, 'status', 'archived');
end;
$$;

create or replace function public.ac360_school_run_lifecycle_integrity_check(
  p_org_id uuid,
  p_actor_app_user_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_run_id uuid;
  v_students_without_guardians integer := 0;
  v_students_without_class integer := 0;
  v_over_capacity_classes integer := 0;
  v_duplicate_primary integer := 0;
  v_critical integer := 0;
  v_warning integer := 0;
  v_score numeric := 100;
  rec record;
begin
  if p_org_id is null then raise exception 'p_org_id is required'; end if;

  select count(*) into v_students_without_guardians
  from public.ac360_school_students s
  where s.org_id = p_org_id and s.status = 'active' and s.enrollment_status in ('pre_enrolled','enrolled','active')
    and not exists (select 1 from public.ac360_school_student_guardians sg where sg.org_id = p_org_id and sg.student_id = s.id and sg.status = 'active');

  select count(*) into v_students_without_class
  from public.ac360_school_students s
  where s.org_id = p_org_id and s.status = 'active' and s.enrollment_status in ('enrolled','active')
    and not exists (select 1 from public.ac360_school_class_enrollments e where e.org_id = p_org_id and e.student_id = s.id and e.status = 'active');

  with class_counts as (
    select c.id, c.capacity_students, count(e.id)::integer as enrolled_count
    from public.ac360_school_classes c
    left join public.ac360_school_class_enrollments e on e.org_id = c.org_id and e.class_id = c.id and e.status = 'active'
    where c.org_id = p_org_id and c.status in ('active','full')
    group by c.id, c.capacity_students
  )
  select count(*) into v_over_capacity_classes
  from class_counts where capacity_students is not null and capacity_students > 0 and enrolled_count > capacity_students;

  select count(*) into v_duplicate_primary
  from (
    select student_id
    from public.ac360_school_student_guardians
    where org_id = p_org_id and status = 'active' and is_primary = true
    group by student_id
    having count(*) > 1
  ) x;

  v_critical := v_over_capacity_classes;
  v_warning := v_students_without_guardians + v_students_without_class + v_duplicate_primary;
  v_score := greatest(0, 100 - (v_critical * 20) - (v_warning * 5));

  insert into public.ac360_school_integrity_runs(org_id, status, score, critical_count, warning_count, result_json, actor_app_user_id, metadata_json)
  values (
    p_org_id,
    case when v_critical > 0 then 'critical' when v_warning > 0 then 'warning' else 'completed' end,
    v_score, v_critical, v_warning,
    jsonb_build_object(
      'studentsWithoutGuardians', v_students_without_guardians,
      'studentsWithoutActiveClass', v_students_without_class,
      'overCapacityClasses', v_over_capacity_classes,
      'duplicatePrimaryGuardians', v_duplicate_primary,
      'uiBuildAllowed', false
    ),
    p_actor_app_user_id,
    coalesce(p_metadata,'{}'::jsonb)
  ) returning id into v_run_id;

  if v_students_without_guardians > 0 then
    insert into public.ac360_school_integrity_findings(run_id, org_id, finding_key, severity, message, recommendation, metadata_json)
    values (v_run_id, p_org_id, 'students_without_guardians', 'warning', 'Active/pre-enrolled students exist without active guardian links.', 'Link at least one guardian to every active or pre-enrolled student before UI rollout.', jsonb_build_object('count', v_students_without_guardians));
  end if;
  if v_students_without_class > 0 then
    insert into public.ac360_school_integrity_findings(run_id, org_id, finding_key, severity, message, recommendation, metadata_json)
    values (v_run_id, p_org_id, 'students_without_active_class', 'warning', 'Enrolled students exist without active class enrollment.', 'Assign every enrolled student to an active class before operational launch.', jsonb_build_object('count', v_students_without_class));
  end if;
  if v_over_capacity_classes > 0 then
    insert into public.ac360_school_integrity_findings(run_id, org_id, finding_key, severity, message, recommendation, metadata_json)
    values (v_run_id, p_org_id, 'over_capacity_classes', 'critical', 'One or more classes are over configured capacity.', 'Reduce class enrollment or increase class capacity before production UI use.', jsonb_build_object('count', v_over_capacity_classes));
  end if;
  if v_duplicate_primary > 0 then
    insert into public.ac360_school_integrity_findings(run_id, org_id, finding_key, severity, message, recommendation, metadata_json)
    values (v_run_id, p_org_id, 'duplicate_primary_guardians', 'warning', 'One or more students have multiple primary guardians.', 'Keep only one primary guardian per student.', jsonb_build_object('count', v_duplicate_primary));
  end if;

  insert into public.ac360_school_operation_events(org_id, event_key, action_key, entity_type, entity_id, severity, message, actor_app_user_id, metadata_json)
  values (p_org_id, 'phase2b.lifecycle.integrity_check.completed', 'school.lifecycle.integrity_check', 'integrity_run', v_run_id, case when v_critical > 0 then 'critical' when v_warning > 0 then 'warning' else 'info' end, 'AC360 Phase 2B lifecycle integrity check completed.', p_actor_app_user_id, jsonb_build_object('runId', v_run_id, 'score', v_score, 'critical', v_critical, 'warning', v_warning));

  return jsonb_build_object('ok', true, 'runId', v_run_id, 'score', v_score, 'criticalCount', v_critical, 'warningCount', v_warning, 'uiBuildAllowed', false, 'result', (select result_json from public.ac360_school_integrity_runs where id = v_run_id));
end;
$$;

create or replace function public.ac360_school_lifecycle_dashboard(
  p_org_id uuid default null
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_org_id uuid := p_org_id;
  v_counts jsonb := '{}'::jsonb;
  v_latest_integrity jsonb := null;
  v_recent_events jsonb := '[]'::jsonb;
  v_class_capacity jsonb := '[]'::jsonb;
  v_wiring_count integer := 0;
begin
  select count(*) into v_wiring_count from public.ac360_app_action_wiring where wiring_key like 'ac360.school_lifecycle.%' and status='active';

  if v_org_id is not null then
    v_counts := jsonb_build_object(
      'activeStudents', public.ac360_school_current_capacity(v_org_id, 'students'),
      'guardians', (select count(*) from public.ac360_school_guardians where org_id = v_org_id and status = 'active'),
      'guardianLinks', (select count(*) from public.ac360_school_student_guardians where org_id = v_org_id and status = 'active'),
      'activeClasses', public.ac360_school_current_capacity(v_org_id, 'classes'),
      'activeEnrollments', (select count(*) from public.ac360_school_class_enrollments where org_id = v_org_id and status = 'active'),
      'lifecycleEvents', (select count(*) from public.ac360_school_lifecycle_events where org_id = v_org_id),
      'transfers', (select count(*) from public.ac360_school_class_transfer_events where org_id = v_org_id),
      'integrityRuns', (select count(*) from public.ac360_school_integrity_runs where org_id = v_org_id)
    );

    select to_jsonb(r) into v_latest_integrity
    from public.ac360_school_integrity_runs r where r.org_id = v_org_id order by r.created_at desc limit 1;

    select coalesce(jsonb_agg(to_jsonb(e) order by e.created_at desc), '[]'::jsonb) into v_recent_events
    from (select * from public.ac360_school_lifecycle_events where org_id = v_org_id order by created_at desc limit 25) e;

    select coalesce(jsonb_agg(to_jsonb(x) order by x.name), '[]'::jsonb) into v_class_capacity
    from (
      select c.id, c.class_code, c.name, c.status, c.capacity_students,
        count(e.id)::integer as active_enrollments,
        case when coalesce(c.capacity_students,0) > 0 then round((count(e.id)::numeric / c.capacity_students::numeric), 4) else null end as usage_ratio
      from public.ac360_school_classes c
      left join public.ac360_school_class_enrollments e on e.org_id = c.org_id and e.class_id = c.id and e.status='active'
      where c.org_id = v_org_id and c.status <> 'archived'
      group by c.id, c.class_code, c.name, c.status, c.capacity_students
      limit 100
    ) x;
  end if;

  return jsonb_build_object(
    'ok', v_wiring_count >= 8,
    'phase', 'phase_2b_student_parent_class_lifecycle',
    'uiBuildAllowed', false,
    'message', 'Phase 2B hardens student, parent and class lifecycle runtime only. UI remains locked until explicit user instructions.',
    'activeLifecycleWiringCount', v_wiring_count,
    'counts', v_counts,
    'latestIntegrityRun', v_latest_integrity,
    'recentLifecycleEvents', v_recent_events,
    'classCapacity', v_class_capacity,
    'checkedAt', now()
  );
end;
$$;

-- -----------------------------------------------------------------------------
-- 5. Module matrix update + audit event
-- -----------------------------------------------------------------------------
insert into public.ac360_school_ops_modules(module_key, engine_code, feature_key, label, phase, status, data_tables, guarded_actions, metadata_json) values
('student_parent_class_lifecycle','AC360-ENG-45','student_core','Student, Parent & Class Lifecycle Runtime','phase_2b_student_parent_class_lifecycle','backend_ready',array['ac360_school_lifecycle_events','ac360_school_class_transfer_events','ac360_school_integrity_runs','ac360_school_integrity_findings'],array['school.student.transition','school.student.archive','school.guardian.link','school.guardian.portal_status.update','school.class.transfer_student','school.class.capacity.reconcile','school.class.close','school.lifecycle.integrity_check'],'{"ui_pending":true,"no_frontend":true}'::jsonb)
on conflict (module_key) do update set engine_code=excluded.engine_code, feature_key=excluded.feature_key, label=excluded.label, phase=excluded.phase, status=excluded.status, data_tables=excluded.data_tables, guarded_actions=excluded.guarded_actions, metadata_json=public.ac360_school_ops_modules.metadata_json || excluded.metadata_json, updated_at=now();

insert into public.ac360_policy_events(org_id, event_key, severity, message, metadata_json)
select null, 'phase2b.student_parent_class_lifecycle.migration_applied', 'info', 'AC360 Phase 2B student, parent and class lifecycle runtime hardening migration applied.', '{"phase":"phase_2b_student_parent_class_lifecycle","ui_build_allowed":false}'::jsonb
where to_regclass('public.ac360_policy_events') is not null;
