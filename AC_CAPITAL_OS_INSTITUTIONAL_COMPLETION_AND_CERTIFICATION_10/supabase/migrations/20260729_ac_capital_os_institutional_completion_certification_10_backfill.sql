begin;

-- IC10 non-destructive canonical relationship reconciliation.
-- Invalid/missing references are registered as integrity issues; no business row is deleted.

insert into public.ac_capital_entity_links(from_type, from_id, relation_type, to_type, to_id, metadata)
select 'opportunity', q.radar_opportunity_id, 'qualified-by', 'qualification', q.id,
       jsonb_build_object('source','IC10_BACKFILL','reconciled_at',now())
from public.ac_capital_qualification_dossiers q
where q.radar_opportunity_id is not null
on conflict (from_type, from_id, relation_type, to_type, to_id) do nothing;

insert into public.ac_capital_entity_links(from_type, from_id, relation_type, to_type, to_id, metadata)
select 'qualification', c.qualification_dossier_id, 'produced-case', 'case', c.id,
       jsonb_build_object('source','IC10_BACKFILL','reconciled_at',now())
from public.ac_capital_cases c
where c.qualification_dossier_id is not null
on conflict (from_type, from_id, relation_type, to_type, to_id) do nothing;

insert into public.ac_capital_entity_links(from_type, from_id, relation_type, to_type, to_id, metadata)
select 'case', p.case_id::uuid, 'entered-pipeline', 'pipeline', p.id,
       jsonb_build_object('source','IC10_BACKFILL','reconciled_at',now())
from public.ac_capital_pipeline_records p
where p.case_id is not null
  and p.case_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
on conflict (from_type, from_id, relation_type, to_type, to_id) do nothing;

update public.ac_capital_universal_approvals
set snapshot_hash = encode(digest(snapshot::text, 'sha256'), 'hex'),
    updated_at = now()
where coalesce(snapshot_hash, '') = ''
  and snapshot is not null;

insert into public.ac_capital_integrity_issues(
  issue_code, entity_type, entity_id, severity, status, title, detail,
  recommended_action, auto_repairable, detected_snapshot, detected_at, created_at, updated_at
)
select
  'IC10_PIPELINE_CANONICAL_FIELDS_MISSING', 'pipeline', p.id,
  case when nullif(p.case_id,'') is null then 'critical' else 'high' end,
  'open', 'Pipeline record is missing canonical execution fields',
  concat_ws('; ',
    case when nullif(p.case_id,'') is null then 'case link missing' end,
    case when nullif(trim(p.owner),'') is null then 'owner missing' end,
    case when nullif(trim(p.next_action),'') is null then 'next action missing' end
  ),
  'Open the pipeline dossier and complete the canonical case, owner and next action before advancement.',
  false, to_jsonb(p), now(), now(), now()
from public.ac_capital_pipeline_records p
where nullif(p.case_id,'') is null
   or nullif(trim(p.owner),'') is null
   or nullif(trim(p.next_action),'') is null
on conflict (issue_code, entity_type, entity_id) do update set
  severity = excluded.severity,
  status = 'open',
  detail = excluded.detail,
  detected_snapshot = excluded.detected_snapshot,
  detected_at = now(),
  updated_at = now();

insert into public.ac_capital_integrity_issues(
  issue_code, entity_type, entity_id, severity, status, title, detail,
  recommended_action, auto_repairable, detected_snapshot, detected_at, created_at, updated_at
)
select
  'IC10_CASE_QUALIFICATION_MISSING', 'case', c.id, 'critical', 'open',
  'Funding case lacks qualification provenance',
  coalesce(c.case_title, 'Funding case') || ' cannot be certified without qualification or founder override.',
  'Link the canonical qualification dossier or create a documented founder override.',
  false, to_jsonb(c), now(), now(), now()
from public.ac_capital_cases c
where c.qualification_dossier_id is null
on conflict (issue_code, entity_type, entity_id) do update set
  detected_snapshot = excluded.detected_snapshot,
  detected_at = now(),
  updated_at = now();

insert into public.ac_capital_integrity_issues(
  issue_code, entity_type, entity_id, severity, status, title, detail,
  recommended_action, auto_repairable, detected_snapshot, detected_at, created_at, updated_at
)
select
  'IC10_APPROVAL_SNAPSHOT_INCOMPLETE', 'approval', a.id, 'critical', 'open',
  'Approval lacks exact-version snapshot evidence',
  concat('Approval ', a.id, ' for ', a.object_type, ' version ', a.object_version, ' is incomplete.'),
  'Supersede this approval and request a new exact-version decision.',
  false, to_jsonb(a), now(), now(), now()
from public.ac_capital_universal_approvals a
where a.status = 'approved'
  and (coalesce(a.object_version,'') = '' or a.snapshot = '{}'::jsonb or coalesce(a.snapshot_hash,'') = '')
on conflict (issue_code, entity_type, entity_id) do update set
  detected_snapshot = excluded.detected_snapshot,
  detected_at = now(),
  updated_at = now();

-- Reconciliation also closes prior IC10 findings when the underlying defect is gone.
update public.ac_capital_integrity_issues i
set status = 'resolved',
    resolved_at = now(),
    resolution_note = 'Resolved by IC10 reconciliation: canonical pipeline fields are now complete.',
    updated_at = now()
from public.ac_capital_pipeline_records p
where i.issue_code = 'IC10_PIPELINE_CANONICAL_FIELDS_MISSING'
  and i.entity_type = 'pipeline'
  and i.entity_id = p.id
  and nullif(p.case_id,'') is not null
  and nullif(trim(p.owner),'') is not null
  and nullif(trim(p.next_action),'') is not null
  and i.status <> 'resolved';

update public.ac_capital_integrity_issues i
set status = 'resolved',
    resolved_at = now(),
    resolution_note = 'Resolved by IC10 reconciliation: qualification provenance is present.',
    updated_at = now()
from public.ac_capital_cases c
where i.issue_code = 'IC10_CASE_QUALIFICATION_MISSING'
  and i.entity_type = 'case'
  and i.entity_id = c.id
  and c.qualification_dossier_id is not null
  and i.status <> 'resolved';

update public.ac_capital_integrity_issues i
set status = 'resolved',
    resolved_at = now(),
    resolution_note = 'Resolved by IC10 reconciliation: exact-version approval snapshot is complete.',
    updated_at = now()
from public.ac_capital_universal_approvals a
where i.issue_code = 'IC10_APPROVAL_SNAPSHOT_INCOMPLETE'
  and i.entity_type = 'approval'
  and i.entity_id = a.id
  and coalesce(a.object_version,'') <> ''
  and a.snapshot <> '{}'::jsonb
  and coalesce(a.snapshot_hash,'') <> ''
  and i.status <> 'resolved';

notify pgrst, 'reload schema';
commit;
