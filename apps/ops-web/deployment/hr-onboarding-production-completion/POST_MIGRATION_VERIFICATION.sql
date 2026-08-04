-- Read-only post-migration verification.
select
  to_regclass('public.hr_onboarding_journeys') as journeys,
  to_regclass('public.hr_onboarding_tasks') as tasks,
  to_regclass('public.hr_onboarding_documents') as documents,
  to_regclass('public.hr_onboarding_activity') as activity,
  to_regclass('public.hr_onboarding_checklists') as checklists,
  to_regclass('public.hr_onboarding_checklist_assignments') as assignments,
  to_regclass('public.hr_onboarding_idempotency') as idempotency;

select
  to_regprocedure('public.hr_onboarding_execute(text,jsonb,jsonb)') as executor,
  to_regprocedure('public.hr_onboarding_ensure_journey(text,text,jsonb,jsonb)') as lifecycle_bridge,
  to_regprocedure('public.hr_onboarding_recalculate_progress(text)') as progress_engine,
  to_regprocedure('public.hr_onboarding_gate_ready(text,text)') as gate_engine;

select trigger_name, event_object_table, action_timing, event_manipulation
from information_schema.triggers
where trigger_schema = 'public'
  and event_object_table like 'hr_onboarding%'
order by event_object_table, trigger_name, event_manipulation;

select checklist_key, name, lifecycle_status, version, is_published, jsonb_array_length(items) as item_count
from public.hr_onboarding_checklists
where checklist_key = 'angelcare-standard-onboarding-v1';

select id, name, public, file_size_limit, allowed_mime_types
from storage.buckets
where id = 'hr-onboarding-documents';

select table_name, column_name
from information_schema.columns
where table_schema = 'public'
  and table_name like 'hr_onboarding%'
  and column_name in ('journey_key','task_key','document_key','activity_key','checklist_key','tenant_key','organization_key','version','archived_at','metadata')
order by table_name, column_name;

select schemaname, tablename, policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename like 'hr_onboarding%'
order by tablename, policyname;
