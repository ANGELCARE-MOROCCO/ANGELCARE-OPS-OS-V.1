begin;

create extension if not exists pgcrypto;

-- AC CAPITAL OS IC10 · Institutional Completion & Live Certification
-- Additive governance/certification layer. Existing capital records are preserved.

do $preflight$
begin
  if to_regclass('public.ac_capital_orchestrator_events') is null
     or to_regclass('public.ac_capital_universal_approvals') is null
     or to_regclass('public.ac_capital_artifacts') is null
     or to_regclass('public.ac_capital_command_results') is null
     or to_regclass('public.ac_capital_entity_links') is null
     or to_regclass('public.ac_capital_cases') is null
     or to_regclass('public.ac_capital_case_founder_approvals') is null
     or to_regclass('public.ac_capital_qualification_dossiers') is null
     or to_regclass('public.ac_capital_radar_opportunities') is null
     or to_regclass('public.ac_capital_pipeline_records') is null
     or to_regclass('public.ac_capital_pipeline_submissions') is null
     or to_regclass('public.ac_capital_pipeline_stage_events') is null
     or to_regclass('public.ac_capital_stage_gate_evaluations') is null
     or to_regclass('public.ac_capital_submission_proofs') is null
     or to_regclass('public.ac_capital_strategy_reports') is null then
    raise exception 'AC_CAPITAL_IC10_FINAL09_PREREQUISITES_MISSING';
  end if;
end
$preflight$;

alter table public.ac_capital_integrity_issues
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

alter table public.ac_capital_universal_approvals
  add column if not exists snapshot_hash text,
  add column if not exists superseded_at timestamptz,
  add column if not exists superseded_by_version text,
  add column if not exists superseded_reason text;

create table if not exists public.ac_capital_certification_runs (
  id uuid primary key default gen_random_uuid(),
  run_type text not null,
  status text not null default 'NOT TESTED',
  scope jsonb not null default '{}'::jsonb,
  environment jsonb not null default '{}'::jsonb,
  summary text,
  totals jsonb not null default '{}'::jsonb,
  started_by text,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status in ('running','CERTIFIED','PARTIALLY CERTIFIED','BLOCKED','FAILED','NOT TESTED'))
);

create table if not exists public.ac_capital_certification_checks (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.ac_capital_certification_runs(id) on delete cascade,
  workspace_key text not null default '',
  scenario_key text not null default '',
  gate_key text not null,
  required boolean not null default true,
  status text not null default 'NOT TESTED',
  severity text not null default 'medium',
  summary text not null,
  evidence jsonb not null default '{}'::jsonb,
  checked_by text,
  checked_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(run_id, workspace_key, scenario_key, gate_key),
  check (status in ('CERTIFIED','PARTIALLY CERTIFIED','BLOCKED','FAILED','NOT TESTED'))
);

create table if not exists public.ac_capital_certification_evidence (
  id uuid primary key default gen_random_uuid(),
  check_id uuid references public.ac_capital_certification_checks(id) on delete set null,
  workspace_key text not null default '',
  scenario_key text not null default '',
  evidence_type text not null default 'operator-evidence',
  title text not null,
  reference text,
  payload jsonb not null default '{}'::jsonb,
  recorded_by text,
  recorded_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.ac_capital_workspace_certifications (
  id uuid primary key default gen_random_uuid(),
  workspace_key text not null unique,
  workspace_label text not null,
  route_path text not null,
  visual_identity text not null,
  status text not null default 'NOT TESTED',
  critical boolean not null default true,
  required_gates text[] not null default '{}',
  last_run_id uuid references public.ac_capital_certification_runs(id) on delete set null,
  metrics jsonb not null default '{}'::jsonb,
  blocking_reasons jsonb not null default '[]'::jsonb,
  certified_by text,
  certified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status in ('CERTIFIED','PARTIALLY CERTIFIED','BLOCKED','FAILED','NOT TESTED'))
);

create table if not exists public.ac_capital_scenario_certifications (
  id uuid primary key default gen_random_uuid(),
  scenario_key text not null unique,
  title text not null,
  description text,
  required boolean not null default true,
  status text not null default 'NOT TESTED',
  current_step integer not null default 0,
  total_steps integer not null default 0,
  blocking_reasons jsonb not null default '[]'::jsonb,
  started_at timestamptz,
  finished_at timestamptz,
  certified_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status in ('CERTIFIED','PARTIALLY CERTIFIED','BLOCKED','FAILED','NOT TESTED'))
);

create table if not exists public.ac_capital_scenario_steps (
  id uuid primary key default gen_random_uuid(),
  scenario_key text not null references public.ac_capital_scenario_certifications(scenario_key) on delete cascade,
  step_key text not null,
  sequence_no integer not null,
  label text not null,
  workspace_key text not null,
  status text not null default 'NOT TESTED',
  summary text,
  evidence jsonb not null default '{}'::jsonb,
  completed_by text,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(scenario_key, step_key),
  check (status in ('CERTIFIED','PARTIALLY CERTIFIED','BLOCKED','FAILED','NOT TESTED'))
);

create table if not exists public.ac_capital_certification_signoffs (
  id uuid primary key default gen_random_uuid(),
  certification_status text not null,
  statement text not null,
  snapshot jsonb not null default '{}'::jsonb,
  snapshot_hash text not null,
  signed_by text not null,
  signed_at timestamptz not null default now(),
  revoked_by text,
  revoked_at timestamptz,
  revocation_reason text,
  created_at timestamptz not null default now(),
  check (certification_status in ('CERTIFIED','REVOKED'))
);

alter table public.ac_capital_certification_signoffs
  add column if not exists snapshot_hash text;

update public.ac_capital_certification_signoffs
set snapshot_hash = encode(digest(snapshot::text, 'sha256'), 'hex')
where coalesce(snapshot_hash, '') = '';

alter table public.ac_capital_certification_signoffs
  alter column snapshot_hash set not null;

create index if not exists ac_capital_certification_runs_started_idx
  on public.ac_capital_certification_runs(started_at desc);
create index if not exists ac_capital_certification_checks_workspace_idx
  on public.ac_capital_certification_checks(workspace_key, gate_key, checked_at desc);
create index if not exists ac_capital_certification_checks_scenario_idx
  on public.ac_capital_certification_checks(scenario_key, gate_key, checked_at desc);
create index if not exists ac_capital_certification_evidence_workspace_idx
  on public.ac_capital_certification_evidence(workspace_key, recorded_at desc);
create index if not exists ac_capital_workspace_certifications_status_idx
  on public.ac_capital_workspace_certifications(critical desc, status, updated_at desc);
create index if not exists ac_capital_scenario_certifications_status_idx
  on public.ac_capital_scenario_certifications(required desc, status, updated_at desc);

-- Exact-version approval invalidation. A material record-version change revokes old authority.
create or replace function public.ac_capital_ic10_supersede_approvals()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
declare
  object_name text;
  new_version text;
  old_version text;
  material_old jsonb;
  material_new jsonb;
begin
  object_name := case tg_table_name
    when 'ac_capital_cases' then 'case'
    when 'ac_capital_artifacts' then 'artifact'
    when 'ac_capital_qualification_dossiers' then 'qualification'
    when 'ac_capital_pipeline_records' then 'pipeline'
    when 'ac_capital_strategy_reports' then 'report'
    else null
  end;

  if object_name is null then return new; end if;
  new_version := coalesce(to_jsonb(new)->>'record_version', to_jsonb(new)->>'current_version', '1');
  old_version := coalesce(to_jsonb(old)->>'record_version', to_jsonb(old)->>'current_version', '1');

  material_old := to_jsonb(old)
    - 'record_version' - 'updated_at' - 'founder_approval_status'
    - 'approval_status' - 'approved_by' - 'approved_at' - 'approved_version'
    - 'immutable_snapshot_hash' - 'last_integrity_check_at' - 'health_status'
    - 'last_automation_agent' - 'last_automation_at';
  material_new := to_jsonb(new)
    - 'record_version' - 'updated_at' - 'founder_approval_status'
    - 'approval_status' - 'approved_by' - 'approved_at' - 'approved_version'
    - 'immutable_snapshot_hash' - 'last_integrity_check_at' - 'health_status'
    - 'last_automation_agent' - 'last_automation_at';

  if new_version is distinct from old_version
     and material_new is distinct from material_old then
    update public.ac_capital_universal_approvals
       set status = 'superseded',
           superseded_at = now(),
           superseded_by_version = new_version,
           superseded_reason = format('%s advanced from version %s to %s', object_name, old_version, new_version),
           decision_note = coalesce(decision_note || E'\n', '') || format('Superseded automatically by IC10: object advanced to version %s.', new_version),
           updated_at = now()
     where object_type = object_name
       and object_id = new.id
       and object_version = old_version
       and status in ('pending','approved','conditionally-approved');
  end if;
  return new;
end
$function$;

-- Approved artifacts are immutable while approval remains active.
create or replace function public.ac_capital_ic10_protect_approved_artifact()
returns trigger
language plpgsql
as $function$
begin
  if old.approval_status = 'approved'
     and new.approval_status = 'approved'
     and (
       new.current_version is distinct from old.current_version
       or new.content_snapshot is distinct from old.content_snapshot
       or new.source_snapshot is distinct from old.source_snapshot
       or new.entity_type is distinct from old.entity_type
       or new.entity_id is distinct from old.entity_id
       or new.immutable_snapshot_hash is distinct from old.immutable_snapshot_hash
     ) then
    raise exception 'AC_CAPITAL_APPROVED_ARTIFACT_IMMUTABLE';
  end if;
  return new;
end
$function$;

do $triggers$
declare
  target text;
begin
  foreach target in array array[
    'ac_capital_cases',
    'ac_capital_artifacts',
    'ac_capital_qualification_dossiers',
    'ac_capital_pipeline_records',
    'ac_capital_strategy_reports'
  ] loop
    if to_regclass('public.' || target) is not null then
      execute format('drop trigger if exists %I on public.%I', 'ac_capital_ic10_supersede_approvals_trg', target);
      execute format(
        'create trigger ac_capital_ic10_supersede_approvals_trg after update on public.%I for each row execute function public.ac_capital_ic10_supersede_approvals()',
        target
      );
    end if;
  end loop;

  drop trigger if exists ac_capital_ic10_protect_approved_artifact_trg on public.ac_capital_artifacts;
  create trigger ac_capital_ic10_protect_approved_artifact_trg
    before update on public.ac_capital_artifacts
    for each row execute function public.ac_capital_ic10_protect_approved_artifact();
end
$triggers$;

-- Atomic case approval request: case version, universal authority, legacy bridge and event.
create or replace function public.ac_capital_ic10_request_case_approval(
  p_case_id uuid,
  p_approval_item text,
  p_reason text,
  p_comments text,
  p_risk_level text,
  p_requested_by text,
  p_approver text,
  p_due_date date
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $function$
declare
  case_row public.ac_capital_cases%rowtype;
  approval_row public.ac_capital_universal_approvals%rowtype;
  legacy_row public.ac_capital_case_founder_approvals%rowtype;
  event_row public.ac_capital_orchestrator_events%rowtype;
  v_object_version text;
  snapshot_hash text;
begin
  if nullif(trim(p_approval_item), '') is null then
    raise exception 'AC_CAPITAL_APPROVAL_ITEM_REQUIRED';
  end if;

  select * into case_row
  from public.ac_capital_cases
  where id = p_case_id
  for update;
  if not found then raise exception 'AC_CAPITAL_CASE_NOT_FOUND'; end if;

  update public.ac_capital_cases
  set founder_approval_status = 'pending',
      updated_at = now()
  where id = p_case_id
  returning * into case_row;

  v_object_version := coalesce(case_row.record_version, 1)::text;
  snapshot_hash := encode(digest(to_jsonb(case_row)::text, 'sha256'), 'hex');

  select * into approval_row
  from public.ac_capital_universal_approvals
  where object_type = 'case'
    and object_id = p_case_id
    and object_version = v_object_version
    and status = 'pending'
  order by requested_at desc
  limit 1;

  if approval_row.id is null then
    insert into public.ac_capital_universal_approvals(
      approval_type, object_type, object_id, object_version,
      snapshot, snapshot_hash, diff_snapshot, evidence_package,
      decision_requested, risk_level, status, approver_role,
      requested_by, requested_at, expires_at, updated_at
    ) values (
      'case-release', 'case', p_case_id, v_object_version,
      to_jsonb(case_row) || jsonb_build_object('_snapshotHash', snapshot_hash),
      snapshot_hash, '{}'::jsonb,
      jsonb_build_object(
        'approvalItem', p_approval_item,
        'reason', p_reason,
        'comments', p_comments
      ),
      p_approval_item, coalesce(nullif(p_risk_level, ''), 'high'),
      'pending', 'founder', p_requested_by, now(),
      case when p_due_date is null then null else p_due_date::timestamptz end,
      now()
    ) returning * into approval_row;
  end if;

  select * into legacy_row
  from public.ac_capital_case_founder_approvals
  where case_id = p_case_id
    and comments like ('Universal approval ' || approval_row.id::text || '%')
  order by created_at desc
  limit 1;

  if legacy_row.id is null then
    insert into public.ac_capital_case_founder_approvals(
      case_id, approval_item, status, reason, approver,
      due_date, comments, updated_at
    ) values (
      p_case_id, p_approval_item, 'required', p_reason,
      coalesce(nullif(p_approver, ''), 'Founder / Managing Director'),
      p_due_date,
      format('Universal approval %s · version %s · hash %s', approval_row.id, v_object_version, snapshot_hash),
      now()
    ) returning * into legacy_row;
  end if;

  insert into public.ac_capital_orchestrator_events(
    event_type, entity_type, entity_id, source_workspace, payload,
    idempotency_key, priority, status, available_at, created_by, updated_at
  ) values (
    'case.approval.requested', 'case', p_case_id, 'cases',
    jsonb_build_object(
      'approvalId', approval_row.id,
      'objectVersion', v_object_version,
      'snapshotHash', snapshot_hash
    ),
    format('case.approval.requested:%s:%s', p_case_id, v_object_version),
    'high', 'queued', now(), p_requested_by, now()
  ) on conflict (idempotency_key) do nothing
  returning * into event_row;

  return jsonb_build_object(
    'case', to_jsonb(case_row),
    'approval', to_jsonb(approval_row),
    'legacyApproval', to_jsonb(legacy_row),
    'event', case when event_row.id is null then null else to_jsonb(event_row) end,
    'objectVersion', v_object_version,
    'snapshotHash', snapshot_hash
  );
end
$function$;

-- Atomic exact-version universal approval decision.
create or replace function public.ac_capital_ic10_decide_approval(
  p_approval_id uuid,
  p_decision text,
  p_note text,
  p_conditions jsonb,
  p_decided_by text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $function$
declare
  approval_row public.ac_capital_universal_approvals%rowtype;
  decision_value text := lower(coalesce(p_decision,''));
  status_value text;
  table_name text;
  version_expression text;
  current_version text := '1';
  object_snapshot jsonb := '{}'::jsonb;
  event_row public.ac_capital_orchestrator_events%rowtype;
begin
  if decision_value = 'request-revision' then decision_value := 'revision'; end if;
  if decision_value not in ('approve','reject','revision') then
    raise exception 'AC_CAPITAL_UNSUPPORTED_APPROVAL_DECISION';
  end if;

  select * into approval_row
  from public.ac_capital_universal_approvals
  where id = p_approval_id
  for update;
  if not found then raise exception 'AC_CAPITAL_APPROVAL_NOT_FOUND'; end if;

  table_name := case approval_row.object_type
    when 'case' then 'ac_capital_cases'
    when 'artifact' then 'ac_capital_artifacts'
    when 'qualification' then 'ac_capital_qualification_dossiers'
    when 'pipeline' then 'ac_capital_pipeline_records'
    when 'report' then 'ac_capital_strategy_reports'
    else null
  end;
  version_expression := case approval_row.object_type
    when 'artifact' then 'coalesce(current_version, record_version, 1)::text'
    else 'coalesce(record_version, 1)::text'
  end;

  if table_name is not null and approval_row.object_id is not null then
    execute format('select %s, to_jsonb(t) from public.%I t where id = $1', version_expression, table_name)
      into current_version, object_snapshot
      using approval_row.object_id;
    if object_snapshot is null or object_snapshot = '{}'::jsonb then
      raise exception 'AC_CAPITAL_APPROVAL_OBJECT_NOT_FOUND';
    end if;
  else
    current_version := approval_row.object_version;
    object_snapshot := approval_row.snapshot;
  end if;

  if decision_value = 'approve' and current_version is distinct from approval_row.object_version then
    update public.ac_capital_universal_approvals
    set status = 'superseded',
        superseded_at = now(),
        superseded_by_version = current_version,
        superseded_reason = format('Approval requested for version %s; object is version %s.', approval_row.object_version, current_version),
        decision_note = coalesce(nullif(p_note,''), format('Object advanced to version %s.', current_version)),
        updated_at = now()
    where id = p_approval_id
    returning * into approval_row;

    return jsonb_build_object(
      'conflict', true,
      'requestedVersion', approval_row.object_version,
      'currentVersion', current_version,
      'approval', to_jsonb(approval_row),
      'object', object_snapshot
    );
  end if;

  status_value := case decision_value
    when 'approve' then 'approved'
    when 'reject' then 'rejected'
    else 'revision-requested'
  end;

  update public.ac_capital_universal_approvals
  set status = status_value,
      decided_by = p_decided_by,
      decided_at = now(),
      decision_note = coalesce(nullif(p_note,''), decision_value),
      conditions = coalesce(p_conditions, conditions, '[]'::jsonb),
      snapshot_hash = coalesce(nullif(snapshot_hash,''), encode(digest(snapshot::text,'sha256'),'hex')),
      updated_at = now()
  where id = p_approval_id
  returning * into approval_row;

  if decision_value = 'approve' and approval_row.object_type = 'case' then
    update public.ac_capital_cases
    set founder_approval_status = 'approved', updated_at = now()
    where id = approval_row.object_id;
  elsif decision_value = 'approve' and approval_row.object_type = 'artifact' then
    update public.ac_capital_artifacts
    set approval_status = 'approved',
        approved_version = current_version::integer,
        approved_by = p_decided_by,
        approved_at = now(),
        immutable_snapshot_hash = coalesce(nullif(approval_row.snapshot_hash,''), encode(digest(approval_row.snapshot::text,'sha256'),'hex')),
        updated_at = now()
    where id = approval_row.object_id;
  end if;

  if decision_value = 'approve' then
    insert into public.ac_capital_orchestrator_events(
      event_type, entity_type, entity_id, source_workspace, payload,
      idempotency_key, priority, status, available_at, created_by, updated_at
    ) values (
      'approval.granted','approval',approval_row.id,'approvals',
      jsonb_build_object('approvalId',approval_row.id,'objectType',approval_row.object_type,'objectId',approval_row.object_id,'objectVersion',current_version,'decisionNote',p_note),
      format('approval.granted:%s:%s',approval_row.id,current_version),
      'high','queued',now(),p_decided_by,now()
    ) on conflict (idempotency_key) do nothing
    returning * into event_row;
  end if;

  return jsonb_build_object(
    'conflict', false,
    'governedVersion', current_version,
    'approval', to_jsonb(approval_row),
    'object', object_snapshot,
    'event', case when event_row.id is null then null else to_jsonb(event_row) end
  );
end
$function$;

-- Atomic, idempotent, exact-version governed submission recording.
create or replace function public.ac_capital_ic10_record_submission(
  p_pipeline_record_id uuid,
  p_case_id uuid,
  p_approval_id uuid,
  p_recipient text,
  p_method text,
  p_proof_reference text,
  p_proof_type text,
  p_documents text[],
  p_submitted_by text,
  p_submitted_at timestamptz,
  p_coordinator_task_id uuid default null,
  p_confirmation_received boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $function$
declare
  pipeline_row public.ac_capital_pipeline_records%rowtype;
  case_row public.ac_capital_cases%rowtype;
  approval_row public.ac_capital_universal_approvals%rowtype;
  submission_row public.ac_capital_pipeline_submissions%rowtype;
  proof_row public.ac_capital_submission_proofs%rowtype;
  case_uuid uuid;
  case_version text;
begin
  if nullif(trim(p_proof_reference), '') is null then
    raise exception 'AC_CAPITAL_SUBMISSION_PROOF_REQUIRED';
  end if;
  if nullif(trim(p_recipient), '') is null then
    raise exception 'AC_CAPITAL_SUBMISSION_RECIPIENT_REQUIRED';
  end if;

  select * into pipeline_row
  from public.ac_capital_pipeline_records
  where id = p_pipeline_record_id
  for update;
  if not found then raise exception 'AC_CAPITAL_PIPELINE_NOT_FOUND'; end if;

  case_uuid := coalesce(
    p_case_id,
    case when coalesce(pipeline_row.case_id, '') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
      then pipeline_row.case_id::uuid else null end
  );
  if case_uuid is null then raise exception 'AC_CAPITAL_SUBMISSION_CASE_REQUIRED'; end if;

  select * into case_row from public.ac_capital_cases where id = case_uuid;
  if not found then raise exception 'AC_CAPITAL_SUBMISSION_CASE_NOT_FOUND'; end if;
  case_version := coalesce(case_row.record_version, 1)::text;

  select * into approval_row
  from public.ac_capital_universal_approvals
  where object_type = 'case'
    and object_id = case_uuid
    and object_version = case_version
    and status = 'approved'
    and (p_approval_id is null or id = p_approval_id)
  order by decided_at desc nulls last, requested_at desc
  limit 1;
  if not found then
    raise exception 'AC_CAPITAL_SUBMISSION_EXACT_VERSION_APPROVAL_REQUIRED:case=%:version=%', case_uuid, case_version;
  end if;

  select * into proof_row
  from public.ac_capital_submission_proofs
  where pipeline_record_id = p_pipeline_record_id
    and proof_reference = p_proof_reference
  order by created_at desc
  limit 1;

  if proof_row.id is not null then
    return jsonb_build_object(
      'idempotent', true,
      'pipeline', to_jsonb(pipeline_row),
      'proof', to_jsonb(proof_row),
      'approval', to_jsonb(approval_row)
    );
  end if;

  insert into public.ac_capital_pipeline_submissions(
    pipeline_record_id, case_id, submitted_by, submitted_at, recipient, method,
    documents_included, version_submitted, proof_of_submission_reference,
    confirmation_received, result_status, updated_at
  ) values (
    p_pipeline_record_id, case_uuid::text, p_submitted_by,
    coalesce(p_submitted_at, now()), p_recipient, coalesce(nullif(p_method,''),'Manual'),
    coalesce(p_documents, '{}'), case_version, p_proof_reference,
    coalesce(p_confirmation_received, false), 'Submitted', now()
  ) returning * into submission_row;

  insert into public.ac_capital_submission_proofs(
    pipeline_record_id, case_id, coordinator_task_id, approval_id,
    submission_channel, recipient, submitted_at, proof_reference, proof_type,
    submitted_by, status, metadata, updated_at
  ) values (
    p_pipeline_record_id, case_uuid, p_coordinator_task_id, approval_row.id,
    coalesce(nullif(p_method,''),'Manual'), p_recipient, coalesce(p_submitted_at, now()),
    p_proof_reference, coalesce(nullif(p_proof_type,''),'manual-evidence'),
    p_submitted_by, 'recorded',
    jsonb_build_object('documentsIncluded',coalesce(to_jsonb(p_documents),'[]'::jsonb),'caseVersion',case_version),
    now()
  ) returning * into proof_row;

  insert into public.ac_capital_pipeline_stage_events(
    pipeline_record_id, previous_stage, new_stage, changed_by, changed_at,
    reason, evidence_reference, comments
  ) values (
    p_pipeline_record_id, pipeline_row.stage, 'Submitted', p_submitted_by, now(),
    'Exact-version approved manual submission proof recorded.', p_proof_reference,
    format('IC10 approval %s · case version %s', approval_row.id, case_version)
  );

  update public.ac_capital_pipeline_records
  set stage = 'Submitted',
      last_activity_at = now(),
      next_action = 'Confirm receipt and schedule follow-up',
      record_version = coalesce(record_version,1) + 1,
      updated_at = now()
  where id = p_pipeline_record_id
  returning * into pipeline_row;

  insert into public.ac_capital_stage_gate_evaluations(
    entity_type, entity_id, workspace_key, requested_stage, passed,
    evaluated_gates, blockers, evaluated_by, evaluated_at
  ) values (
    'pipeline', p_pipeline_record_id, 'pipeline', 'Submitted', true,
    jsonb_build_array(
      jsonb_build_object('gateKey','PIPELINE_APPROVAL_VALID','passed',true,'approvalId',approval_row.id,'objectVersion',case_version),
      jsonb_build_object('gateKey','PIPELINE_SUBMISSION_PROOF','passed',true,'proofId',proof_row.id)
    ),
    '[]'::jsonb, p_submitted_by, now()
  );

  insert into public.ac_capital_orchestrator_events(
    event_type, entity_type, entity_id, source_workspace, payload,
    idempotency_key, priority, status, available_at, created_by, updated_at
  ) values (
    'submission.recorded', 'pipeline', p_pipeline_record_id, 'pipeline',
    jsonb_build_object('submissionId',submission_row.id,'proofId',proof_row.id,'caseId',case_uuid,'approvalId',approval_row.id,'caseVersion',case_version),
    format('submission.recorded:%s:%s',p_pipeline_record_id,encode(digest(p_proof_reference,'sha256'),'hex')),
    'high','queued',now(),p_submitted_by,now()
  ) on conflict (idempotency_key) do nothing;

  return jsonb_build_object(
    'idempotent', false,
    'pipeline', to_jsonb(pipeline_row),
    'submission', to_jsonb(submission_row),
    'proof', to_jsonb(proof_row),
    'approval', to_jsonb(approval_row),
    'caseVersion', case_version
  );
end
$function$;

-- Canonical lifecycle projection for reconciliation and board evidence.
create or replace view public.ac_capital_ic10_lifecycle_trace as
select
  o.id as opportunity_id,
  o.title as opportunity_title,
  o.status as opportunity_status,
  q.id as qualification_id,
  q.status as qualification_status,
  q.decision_label,
  c.id as case_id,
  c.status as case_status,
  c.founder_approval_status,
  p.id as pipeline_id,
  p.stage as pipeline_stage,
  p.status as pipeline_status,
  p.owner as pipeline_owner,
  p.next_action,
  p.deadline,
  greatest(
    coalesce(o.updated_at, o.created_at),
    coalesce(q.updated_at, q.created_at),
    coalesce(c.updated_at, c.created_at),
    coalesce(p.updated_at, p.created_at)
  ) as lifecycle_updated_at
from public.ac_capital_radar_opportunities o
left join public.ac_capital_qualification_dossiers q
  on q.radar_opportunity_id::text = o.id::text
left join public.ac_capital_cases c
  on c.qualification_dossier_id::text = q.id::text
left join public.ac_capital_pipeline_records p
  on p.case_id::text = c.id::text;

-- Contract initialization. These rows are NOT certification claims.
insert into public.ac_capital_workspace_certifications(
  workspace_key, workspace_label, route_path, visual_identity, status, critical, required_gates, updated_at
) values
('orchestrator','Capital Executive Orchestrator','/ac-capital-os/orchestrator','Executive control bridge, workflow supervision and exception command.','NOT TESTED',true,array['route','data','crud','ai','workflow','integrity','governance','recovery','visual','accessibility','performance','artifact'],now()),
('radar','Capital Radar','/ac-capital-os/radar','External intelligence war room with evidence validation and deadline radar.','NOT TESTED',true,array['route','data','crud','ai','workflow','integrity','governance','recovery','visual','accessibility','performance','artifact'],now()),
('funders','Funder Intelligence Room','/ac-capital-os/funders','Institutional funder dossier, thesis and relationship strategy room.','NOT TESTED',true,array['route','data','crud','ai','workflow','integrity','governance','recovery','visual','accessibility','performance','artifact'],now()),
('qualification','Qualification Committee','/ac-capital-os/qualification','Evidence-backed underwriting chamber and committee decision room.','NOT TESTED',true,array['route','data','crud','ai','workflow','integrity','governance','recovery','visual','accessibility','performance','artifact'],now()),
('data-room','Due Diligence Data Room','/ac-capital-os/data-room','Secure proof vault, requirement matrix, expiry and contradiction control.','NOT TESTED',true,array['route','data','crud','ai','workflow','integrity','governance','recovery','visual','accessibility','performance','artifact'],now()),
('cases','Funding Case Factory','/ac-capital-os/cases','Evidence-linked board-grade funding case production studio.','NOT TESTED',true,array['route','data','crud','ai','workflow','integrity','governance','recovery','visual','accessibility','performance','artifact'],now()),
('pipeline','Capital Pipeline','/ac-capital-os/pipeline','Stage-gated capital portfolio, forecast and recovery command center.','NOT TESTED',true,array['route','data','crud','ai','workflow','integrity','governance','recovery','visual','accessibility','performance','artifact'],now()),
('approvals','Founder Approval Chamber','/ac-capital-os/approvals','Exact-version board authority, evidence and consequence chamber.','NOT TESTED',true,array['route','data','crud','ai','workflow','integrity','governance','recovery','visual','accessibility','performance','artifact'],now()),
('coordinator','Coordinator Mission Desk','/ac-capital-os/coordinator','Dispatch-grade human external-execution mission center.','NOT TESTED',true,array['route','data','crud','ai','workflow','integrity','governance','recovery','visual','accessibility','performance','artifact'],now()),
('artifacts','Artifact Factory','/ac-capital-os/artifacts','Premium A4 and multi-format governed document production studio.','NOT TESTED',true,array['route','data','crud','ai','workflow','integrity','governance','recovery','visual','accessibility','performance','artifact'],now()),
('reports','Executive Report Studio','/ac-capital-os/reports','Evidence-bound founder and board reporting studio.','NOT TESTED',true,array['route','data','crud','ai','workflow','integrity','governance','recovery','visual','accessibility','performance','artifact'],now()),
('doctrine','Doctrine Vault','/ac-capital-os/doctrine','Constitutional rules, prompt governance and conflict-control center.','NOT TESTED',true,array['route','data','crud','ai','workflow','integrity','governance','recovery','visual','accessibility','performance','artifact'],now()),
('strategy','Strategy War Room','/ac-capital-os/strategy','Capital-mix, financing scenario and strategic decision laboratory.','NOT TESTED',false,array['route','data','crud','ai','workflow','integrity','governance','recovery','visual','accessibility','performance','artifact'],now()),
('learning','Learning & Institutional Memory','/ac-capital-os/learning','Win/loss, objection, proof-friction and controlled improvement laboratory.','NOT TESTED',false,array['route','data','crud','ai','workflow','integrity','governance','recovery','visual','accessibility','performance','artifact'],now()),
('ai-operations','AI Operations Control','/ac-capital-os/ai-control','Provider, agent, schedule, quota, execution and emergency-control headquarters.','NOT TESTED',true,array['route','data','crud','ai','workflow','integrity','governance','recovery','visual','accessibility','performance','artifact'],now())
on conflict (workspace_key) do update set
  workspace_label = excluded.workspace_label,
  route_path = excluded.route_path,
  visual_identity = excluded.visual_identity,
  critical = excluded.critical,
  required_gates = excluded.required_gates,
  updated_at = now();

insert into public.ac_capital_scenario_certifications(
  scenario_key, title, description, required, status, total_steps, current_step, updated_at
) values
('grant-lifecycle','Grant lifecycle','Public research through submission proof and learning.',true,'NOT TESTED',11,0,now()),
('bank-financing','Bank financing dossier','Eligibility, proof readiness, bank dossier and approval-controlled mission.',true,'NOT TESTED',7,0,now()),
('rejection','Evidence-backed rejection','Hard disqualifier blocks downstream case creation and preserves learning.',true,'NOT TESTED',5,0,now()),
('deadline-change','Deadline change response','Source change reprioritizes workflow without duplicate notifications.',true,'NOT TESTED',5,0,now()),
('provider-failure','Provider failure recovery','No false completion, preserved evidence and controlled retry/dead letter.',true,'NOT TESTED',5,0,now()),
('approval-version','Approval version integrity','Edited approved objects supersede old authority and block release.',true,'NOT TESTED',4,0,now()),
('concurrency','Worker concurrency','One lease holder processes one event without duplicate records.',true,'NOT TESTED',3,0,now()),
('artifact-integrity','Artifact integrity','All formats open and approved snapshots remain immutable.',true,'NOT TESTED',5,0,now())
on conflict (scenario_key) do update set
  title = excluded.title,
  description = excluded.description,
  required = excluded.required,
  total_steps = excluded.total_steps,
  updated_at = now();


insert into public.ac_capital_scenario_steps(
  scenario_key, step_key, sequence_no, label, workspace_key, status, summary, evidence, updated_at
) values
('grant-lifecycle','research',1,'Run Tavily and OpenRouter research','radar','NOT TESTED','Live evidence has not been recorded.','{}'::jsonb,now()),
('grant-lifecycle','validate',2,'Validate authoritative source evidence','radar','NOT TESTED','Live evidence has not been recorded.','{}'::jsonb,now()),
('grant-lifecycle','opportunity',3,'Create canonical opportunity','radar','NOT TESTED','Live evidence has not been recorded.','{}'::jsonb,now()),
('grant-lifecycle','qualification',4,'Run AI qualification and persist evidence-backed criteria','qualification','NOT TESTED','Live evidence has not been recorded.','{}'::jsonb,now()),
('grant-lifecycle','proof',5,'Create and resolve proof requirements','data-room','NOT TESTED','Live evidence has not been recorded.','{}'::jsonb,now()),
('grant-lifecycle','case',6,'Generate structured funding case','cases','NOT TESTED','Live evidence has not been recorded.','{}'::jsonb,now()),
('grant-lifecycle','artifacts',7,'Generate and open PDF and DOCX','artifacts','NOT TESTED','Live evidence has not been recorded.','{}'::jsonb,now()),
('grant-lifecycle','approval',8,'Approve exact case or artifact version','approvals','NOT TESTED','Live evidence has not been recorded.','{}'::jsonb,now()),
('grant-lifecycle','mission',9,'Create coordinator execution pack','coordinator','NOT TESTED','Live evidence has not been recorded.','{}'::jsonb,now()),
('grant-lifecycle','submission',10,'Record manual submission proof','pipeline','NOT TESTED','Live evidence has not been recorded.','{}'::jsonb,now()),
('grant-lifecycle','outcome',11,'Record outcome and learning','learning','NOT TESTED','Live evidence has not been recorded.','{}'::jsonb,now()),
('bank-financing','program',1,'Create or validate bank program','radar','NOT TESTED','Live evidence has not been recorded.','{}'::jsonb,now()),
('bank-financing','eligibility',2,'Verify eligibility and financial requirements','qualification','NOT TESTED','Live evidence has not been recorded.','{}'::jsonb,now()),
('bank-financing','documents',3,'Record Data Room proof metadata','data-room','NOT TESTED','Live evidence has not been recorded.','{}'::jsonb,now()),
('bank-financing','readiness',4,'Run proof readiness analysis','data-room','NOT TESTED','Live evidence has not been recorded.','{}'::jsonb,now()),
('bank-financing','dossier',5,'Generate bank financing dossier','artifacts','NOT TESTED','Live evidence has not been recorded.','{}'::jsonb,now()),
('bank-financing','approval',6,'Approve exact dossier version','approvals','NOT TESTED','Live evidence has not been recorded.','{}'::jsonb,now()),
('bank-financing','mission',7,'Prepare bank communication mission','coordinator','NOT TESTED','Live evidence has not been recorded.','{}'::jsonb,now()),
('rejection','evidence',1,'Capture evidence','radar','NOT TESTED','Live evidence has not been recorded.','{}'::jsonb,now()),
('rejection','disqualifier',2,'Detect hard disqualifier','qualification','NOT TESTED','Live evidence has not been recorded.','{}'::jsonb,now()),
('rejection','reject',3,'Persist rejection reason','qualification','NOT TESTED','Live evidence has not been recorded.','{}'::jsonb,now()),
('rejection','block',4,'Confirm no case or pipeline record was created','orchestrator','NOT TESTED','Live evidence has not been recorded.','{}'::jsonb,now()),
('rejection','learning',5,'Record controlled learning','learning','NOT TESTED','Live evidence has not been recorded.','{}'::jsonb,now()),
('deadline-change','refresh',1,'Revalidate source','radar','NOT TESTED','Live evidence has not been recorded.','{}'::jsonb,now()),
('deadline-change','update',2,'Update opportunity deadline','radar','NOT TESTED','Live evidence has not been recorded.','{}'::jsonb,now()),
('deadline-change','priority',3,'Reprioritize pipeline','pipeline','NOT TESTED','Live evidence has not been recorded.','{}'::jsonb,now()),
('deadline-change','missions',4,'Reschedule missions','coordinator','NOT TESTED','Live evidence has not been recorded.','{}'::jsonb,now()),
('deadline-change','notify',5,'Create one governed notification','orchestrator','NOT TESTED','Live evidence has not been recorded.','{}'::jsonb,now()),
('provider-failure','fail',1,'Trigger controlled provider failure','ai-operations','NOT TESTED','Live evidence has not been recorded.','{}'::jsonb,now()),
('provider-failure','honest',2,'Confirm failed status and exact error','ai-operations','NOT TESTED','Live evidence has not been recorded.','{}'::jsonb,now()),
('provider-failure','duplicates',3,'Confirm no duplicate business records','orchestrator','NOT TESTED','Live evidence has not been recorded.','{}'::jsonb,now()),
('provider-failure','retry',4,'Retry or move to dead letter','ai-operations','NOT TESTED','Live evidence has not been recorded.','{}'::jsonb,now()),
('provider-failure','restore',5,'Restore provider and complete successfully','ai-operations','NOT TESTED','Live evidence has not been recorded.','{}'::jsonb,now()),
('approval-version','approve',1,'Approve version N','approvals','NOT TESTED','Live evidence has not been recorded.','{}'::jsonb,now()),
('approval-version','edit',2,'Edit object to version N+1','cases','NOT TESTED','Live evidence has not been recorded.','{}'::jsonb,now()),
('approval-version','supersede',3,'Confirm old approval is superseded','approvals','NOT TESTED','Live evidence has not been recorded.','{}'::jsonb,now()),
('approval-version','block',4,'Confirm external execution remains blocked','coordinator','NOT TESTED','Live evidence has not been recorded.','{}'::jsonb,now()),
('concurrency','ticks',1,'Start two runtime ticks','ai-operations','NOT TESTED','Live evidence has not been recorded.','{}'::jsonb,now()),
('concurrency','lease',2,'Confirm one lease holder','orchestrator','NOT TESTED','Live evidence has not been recorded.','{}'::jsonb,now()),
('concurrency','single',3,'Confirm one execution and no duplicates','orchestrator','NOT TESTED','Live evidence has not been recorded.','{}'::jsonb,now()),
('artifact-integrity','generate',1,'Generate PDF, DOCX, XLSX, CSV, JSON and ZIP','artifacts','NOT TESTED','Live evidence has not been recorded.','{}'::jsonb,now()),
('artifact-integrity','open',2,'Open and inspect each format','artifacts','NOT TESTED','Live evidence has not been recorded.','{}'::jsonb,now()),
('artifact-integrity','hash',3,'Verify stored hashes and byte sizes','artifacts','NOT TESTED','Live evidence has not been recorded.','{}'::jsonb,now()),
('artifact-integrity','approve',4,'Approve exact artifact version','approvals','NOT TESTED','Live evidence has not been recorded.','{}'::jsonb,now()),
('artifact-integrity','immutable',5,'Confirm approved snapshot cannot be overwritten','artifacts','NOT TESTED','Live evidence has not been recorded.','{}'::jsonb,now())
on conflict (scenario_key, step_key) do update set
  sequence_no = excluded.sequence_no,
  label = excluded.label,
  workspace_key = excluded.workspace_key,
  updated_at = now();

-- Row-level security for authenticated internal access. Server-side permissions remain authoritative.
do $rls$
declare
  target text;
begin
  foreach target in array array[
    'ac_capital_certification_runs','ac_capital_certification_checks',
    'ac_capital_certification_evidence','ac_capital_workspace_certifications',
    'ac_capital_scenario_certifications','ac_capital_scenario_steps',
    'ac_capital_certification_signoffs'
  ] loop
    execute format('alter table public.%I enable row level security', target);
    execute format('drop policy if exists %I on public.%I', target || '_authenticated_all', target);
    execute format('drop policy if exists %I on public.%I', target || '_authenticated_read', target);
    execute format(
      'create policy %I on public.%I for select to authenticated using (true)',
      target || '_authenticated_read', target
    );
  end loop;
end
$rls$;

-- All mutations remain server-authoritative. RPCs are not directly callable by browser roles.
revoke all on function public.ac_capital_ic10_request_case_approval(uuid,text,text,text,text,text,text,date) from public, anon, authenticated;
revoke all on function public.ac_capital_ic10_decide_approval(uuid,text,text,jsonb,text) from public, anon, authenticated;
revoke all on function public.ac_capital_ic10_record_submission(uuid,uuid,uuid,text,text,text,text,text[],text,timestamptz,uuid,boolean) from public, anon, authenticated;
grant execute on function public.ac_capital_ic10_request_case_approval(uuid,text,text,text,text,text,text,date) to service_role;
grant execute on function public.ac_capital_ic10_decide_approval(uuid,text,text,jsonb,text) to service_role;
grant execute on function public.ac_capital_ic10_record_submission(uuid,uuid,uuid,text,text,text,text,text[],text,timestamptz,uuid,boolean) to service_role;

notify pgrst, 'reload schema';

commit;
