begin;

-- Data-preserving rollback: disable the final authority module while
-- preserving every metric, evidence, QA, security, release and audit record.
update public.angelcare_marketplace_modules
set
  status = 'disabled',
  enabled = false,
  health_status = 'unknown',
  updated_at = now()
where module_key = 'final-launch-authority-universe';

update public.angelcare_marketplace_release_records
set status = 'blocked'
where status in (
  'draft',
  'evidence_collection',
  'gate_review',
  'conditional_approval',
  'approved_for_limited_release',
  'approved_for_phased_release',
  'approved_for_production'
);

insert into public.angelcare_marketplace_rollback_records(
  release_id,
  trigger_reason,
  status,
  transaction_history_preserved,
  runbook,
  evidence
)
select
  id,
  'Final authority safe rollback requested',
  'prepared',
  true,
  jsonb_build_object(
    'strategy',
    'disable final authority and preserve all transactional evidence'
  ),
  jsonb_build_object(
    'source',
    'SAFE_ROLLBACK',
    'requested_at',
    now()
  )
from public.angelcare_marketplace_release_records
order by created_at desc
limit 1;

commit;
