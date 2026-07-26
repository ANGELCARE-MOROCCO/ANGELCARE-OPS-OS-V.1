-- MEGA ZIP 10 — OBJECT AND RLS VERIFICATION
with expected(table_name) as (values
  ('revenue_campaign_segments'),('revenue_campaign_segment_versions'),('revenue_campaign_audience_snapshots'),('revenue_campaign_audience_members'),
  ('revenue_campaign_recipient_eligibility'),('revenue_campaign_recipients'),('revenue_campaign_suppressions'),('revenue_campaign_frequency_decisions'),
  ('revenue_campaign_sequences'),('revenue_campaign_sequence_versions'),('revenue_campaign_sequence_steps'),('revenue_campaign_sequence_branches'),
  ('revenue_campaign_templates'),('revenue_campaign_template_versions'),('revenue_campaign_enrollments'),('revenue_campaign_step_executions'),
  ('revenue_campaign_dispatch_attempts'),('revenue_campaign_replies'),('revenue_campaign_sdr_assignments'),('revenue_campaign_provider_readiness'),
  ('revenue_campaign_sender_readiness'),('revenue_campaign_approvals'),('revenue_campaign_risks'),('revenue_campaign_evidence'),
  ('revenue_campaign_status_history'),('revenue_campaign_conversion_events'),('revenue_campaign_attributions'),('revenue_campaign_attribution_conflicts'),
  ('revenue_campaign_costs'),('revenue_campaign_performance_periods'),('revenue_campaign_experiments'),('revenue_campaign_experiment_variants'),
  ('revenue_campaign_recovery_plans'),('revenue_campaign_recovery_checkpoints')
), state as (
  select e.table_name,
    to_regclass('public.'||e.table_name) is not null as table_exists,
    coalesce(c.relrowsecurity,false) as rls_enabled,
    (select count(*) from pg_policies p where p.schemaname='public' and p.tablename=e.table_name) as policy_count
  from expected e
  left join pg_class c on c.oid=to_regclass('public.'||e.table_name)
)
select table_name,
  case when table_exists then 'PASS' else 'FAIL' end as table_status,
  case when rls_enabled then 'PASS' else 'FAIL' end as rls_status,
  case when policy_count>=1 then 'PASS' else 'FAIL' end as policy_status,
  policy_count
from state order by table_name;

select object_name,case when available then 'PASS' else 'FAIL' end as status
from (values
  ('public.revenue_campaign_command_view',to_regclass('public.revenue_campaign_command_view') is not null),
  ('public.revenue_campaign_recipient_command_view',to_regclass('public.revenue_campaign_recipient_command_view') is not null),
  ('public.revenue_sdr_campaign_queue_view',to_regclass('public.revenue_sdr_campaign_queue_view') is not null),
  ('public.revenue_evaluate_campaign_recipient',to_regprocedure('public.revenue_evaluate_campaign_recipient(uuid,text,uuid,text,text,uuid)') is not null),
  ('public.revenue_freeze_campaign_audience',to_regprocedure('public.revenue_freeze_campaign_audience(uuid,uuid,uuid,text,jsonb,jsonb,uuid)') is not null),
  ('public.revenue_enroll_campaign_recipient',to_regprocedure('public.revenue_enroll_campaign_recipient(uuid,text,uuid,uuid,text,text,text,uuid,text)') is not null),
  ('public.revenue_approve_campaign_sequence',to_regprocedure('public.revenue_approve_campaign_sequence(uuid,integer,uuid)') is not null),
  ('public.revenue_evaluate_campaign_readiness',to_regprocedure('public.revenue_evaluate_campaign_readiness(uuid,uuid)') is not null),
  ('public.revenue_launch_campaign',to_regprocedure('public.revenue_launch_campaign(uuid,uuid,text)') is not null),
  ('public.revenue_dispatch_campaign_step',to_regprocedure('public.revenue_dispatch_campaign_step(uuid,text,text,uuid,text)') is not null),
  ('public.revenue_record_campaign_provider_event',to_regprocedure('public.revenue_record_campaign_provider_event(uuid,text,text,text,timestamptz,jsonb,uuid)') is not null),
  ('public.revenue_process_campaign_reply',to_regprocedure('public.revenue_process_campaign_reply(uuid,text,text,text,text,uuid)') is not null),
  ('public.revenue_create_campaign_attribution',to_regprocedure('public.revenue_create_campaign_attribution(uuid,uuid,text,text,text,numeric,numeric,text,text,uuid)') is not null),
  ('public.revenue_close_campaign_performance_period',to_regprocedure('public.revenue_close_campaign_performance_period(uuid,uuid)') is not null)
) x(object_name,available);


-- Sensitive Phase 10 support data and mutation RPCs must not be directly accessible to authenticated clients.
with sensitive_tables(table_name) as (values
  ('revenue_campaign_recipients'),('revenue_campaign_recipient_eligibility'),('revenue_campaign_suppressions'),
  ('revenue_campaign_dispatch_attempts'),('revenue_campaign_replies'),('revenue_campaign_attributions'),('revenue_campaign_costs')
)
select table_name,
  case when has_table_privilege('authenticated','public.'||table_name,'SELECT') then 'FAIL' else 'PASS' end as authenticated_direct_select,
  case when has_table_privilege('anon','public.'||table_name,'SELECT') then 'FAIL' else 'PASS' end as anon_direct_select
from sensitive_tables order by table_name;

select routine_name,
  case when has_function_privilege('authenticated',signature,'EXECUTE') then 'FAIL' else 'PASS' end as authenticated_execute,
  case when has_function_privilege('service_role',signature,'EXECUTE') then 'PASS' else 'FAIL' end as service_role_execute
from (values
  ('revenue_freeze_campaign_audience','public.revenue_freeze_campaign_audience(uuid,uuid,uuid,text,jsonb,jsonb,uuid)'),
  ('revenue_enroll_campaign_recipient','public.revenue_enroll_campaign_recipient(uuid,text,uuid,uuid,text,text,text,uuid,text)'),
  ('revenue_approve_campaign_sequence','public.revenue_approve_campaign_sequence(uuid,integer,uuid)'),
  ('revenue_launch_campaign','public.revenue_launch_campaign(uuid,uuid,text)'),
  ('revenue_dispatch_campaign_step','public.revenue_dispatch_campaign_step(uuid,text,text,uuid,text)'),
  ('revenue_record_campaign_provider_event','public.revenue_record_campaign_provider_event(uuid,text,text,text,timestamptz,jsonb,uuid)'),
  ('revenue_create_campaign_attribution','public.revenue_create_campaign_attribution(uuid,uuid,text,text,text,numeric,numeric,text,text,uuid)')
) x(routine_name,signature);
