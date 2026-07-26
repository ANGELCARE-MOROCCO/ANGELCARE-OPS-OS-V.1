-- MEGA ZIP 10 — READ-ONLY LIVE SCHEMA PREFLIGHT
-- No mutation. Run before 20260726_0800_revenue_campaign_sdr_attribution_completion.sql.

with requirements(object_type,object_name,requirement,passed,detail) as (
  select 'table','public.revenue_campaigns','Canonical Revenue campaign table exists',to_regclass('public.revenue_campaigns') is not null,
    coalesce(to_regclass('public.revenue_campaigns')::text,'missing')
  union all select 'column','public.revenue_campaigns.id','UUID identity',exists(select 1 from information_schema.columns where table_schema='public' and table_name='revenue_campaigns' and column_name='id' and data_type='uuid'),'Must remain uuid'
  union all select 'column','public.revenue_campaigns.name','Campaign name',exists(select 1 from information_schema.columns where table_schema='public' and table_name='revenue_campaigns' and column_name='name'),'Required base column'
  union all select 'column','public.revenue_campaigns.audience','Audience base',exists(select 1 from information_schema.columns where table_schema='public' and table_name='revenue_campaigns' and column_name='audience'),'Required base column'
  union all select 'column','public.revenue_campaigns.objective','Objective base',exists(select 1 from information_schema.columns where table_schema='public' and table_name='revenue_campaigns' and column_name='objective'),'Required base column'
  union all select 'column','public.revenue_campaigns.channel','Channel base',exists(select 1 from information_schema.columns where table_schema='public' and table_name='revenue_campaigns' and column_name='channel'),'Required base column'
  union all select 'column','public.revenue_campaigns.budget_mad','Dh budget base',exists(select 1 from information_schema.columns where table_schema='public' and table_name='revenue_campaigns' and column_name='budget_mad'),'Required base column'
  union all select 'column','public.revenue_campaigns.status','Lifecycle base',exists(select 1 from information_schema.columns where table_schema='public' and table_name='revenue_campaigns' and column_name='status'),'Required base column'
  union all select 'column','public.revenue_campaigns.owner','Ownership base',exists(select 1 from information_schema.columns where table_schema='public' and table_name='revenue_campaigns' and column_name='owner'),'Required base column'
  union all select 'column','public.revenue_campaigns.metadata','JSONB compatibility',exists(select 1 from information_schema.columns where table_schema='public' and table_name='revenue_campaigns' and column_name='metadata' and data_type='jsonb'),'Required base column'
  union all select 'table','public.revenue_prospects','Canonical prospects exist',to_regclass('public.revenue_prospects') is not null,coalesce(to_regclass('public.revenue_prospects')::text,'missing')
  union all select 'table','public.revenue_accounts','Canonical accounts exist',to_regclass('public.revenue_accounts') is not null,coalesce(to_regclass('public.revenue_accounts')::text,'missing')
  union all select 'table','public.revenue_contacts','Canonical contacts exist',to_regclass('public.revenue_contacts') is not null,coalesce(to_regclass('public.revenue_contacts')::text,'missing')
  union all select 'table','public.revenue_tasks','Phase 4 task accountability exists',to_regclass('public.revenue_tasks') is not null,coalesce(to_regclass('public.revenue_tasks')::text,'missing')
  union all select 'table','public.revenue_appointments','Phase 5 appointments exist',to_regclass('public.revenue_appointments') is not null,coalesce(to_regclass('public.revenue_appointments')::text,'missing')
  union all select 'table','public.revenue_payment_confirmations','Phase 7 payment confirmations exist',to_regclass('public.revenue_payment_confirmations') is not null,coalesce(to_regclass('public.revenue_payment_confirmations')::text,'missing')
  union all select 'column','public.revenue_prospects.id','TEXT identity preserved',exists(select 1 from information_schema.columns where table_schema='public' and table_name='revenue_prospects' and column_name='id' and data_type='text'),'Mega ZIP 2 production identity contract'
  union all select 'column','public.revenue_prospects.account_id','Canonical account relation',exists(select 1 from information_schema.columns where table_schema='public' and table_name='revenue_prospects' and column_name='account_id' and data_type='uuid'),'Required for campaign lineage'
  union all select 'column','public.revenue_prospects.contact_id','Canonical contact relation',exists(select 1 from information_schema.columns where table_schema='public' and table_name='revenue_prospects' and column_name='contact_id' and data_type='uuid'),'Required for campaign lineage'
  union all select 'column','public.revenue_communication_events.thread_id','Communication thread identity',exists(select 1 from information_schema.columns where table_schema='public' and table_name='revenue_communication_events' and column_name='thread_id' and data_type='uuid'),'Every campaign communication must belong to a canonical thread'
  union all select 'table','public.revenue_communication_threads','Phase 5 communication threads',to_regclass('public.revenue_communication_threads') is not null,coalesce(to_regclass('public.revenue_communication_threads')::text,'missing')
  union all select 'table','public.revenue_communication_events','Phase 5 communication ledger',to_regclass('public.revenue_communication_events') is not null,coalesce(to_regclass('public.revenue_communication_events')::text,'missing')
  union all select 'table','public.revenue_communication_delivery_events','Phase 5 delivery ledger',to_regclass('public.revenue_communication_delivery_events') is not null,coalesce(to_regclass('public.revenue_communication_delivery_events')::text,'missing')
  union all select 'table','public.revenue_opportunities','Canonical opportunity engine',to_regclass('public.revenue_opportunities') is not null,coalesce(to_regclass('public.revenue_opportunities')::text,'missing')
  union all select 'table','public.revenue_proposals','Phase 6 proposals',to_regclass('public.revenue_proposals') is not null,coalesce(to_regclass('public.revenue_proposals')::text,'missing')
  union all select 'table','public.revenue_contracts','Phase 7 contracts',to_regclass('public.revenue_contracts') is not null,coalesce(to_regclass('public.revenue_contracts')::text,'missing')
  union all select 'table','public.revenue_realization_events','Phase 7 realized revenue',to_regclass('public.revenue_realization_events') is not null,coalesce(to_regclass('public.revenue_realization_events')::text,'missing')
), support_state as (
  select count(*)::integer as present
  from information_schema.tables
  where table_schema='public' and table_name in (
    'revenue_campaign_segments','revenue_campaign_segment_versions','revenue_campaign_audience_snapshots','revenue_campaign_audience_members',
    'revenue_campaign_recipient_eligibility','revenue_campaign_recipients','revenue_campaign_suppressions','revenue_campaign_frequency_decisions',
    'revenue_campaign_sequences','revenue_campaign_sequence_versions','revenue_campaign_sequence_steps','revenue_campaign_sequence_branches',
    'revenue_campaign_templates','revenue_campaign_template_versions','revenue_campaign_enrollments','revenue_campaign_step_executions',
    'revenue_campaign_dispatch_attempts','revenue_campaign_replies','revenue_campaign_sdr_assignments','revenue_campaign_provider_readiness',
    'revenue_campaign_sender_readiness','revenue_campaign_approvals','revenue_campaign_risks','revenue_campaign_evidence',
    'revenue_campaign_status_history','revenue_campaign_conversion_events','revenue_campaign_attributions','revenue_campaign_attribution_conflicts',
    'revenue_campaign_costs','revenue_campaign_performance_periods','revenue_campaign_experiments','revenue_campaign_experiment_variants',
    'revenue_campaign_recovery_plans','revenue_campaign_recovery_checkpoints'
  )
), gated_requirements as (
  select * from requirements
  union all
  select 'schema','public.revenue_campaign_phase10_support','No partial Phase 10 cutover',present in (0,34),present||'/34 support tables present' from support_state
), compatibility as (
  select 'AUTHORITATIVE'::text as classification,'public.revenue_campaigns'::text as object_name,'Extend additively; never replace.'::text as doctrine
  union all select 'BRIDGE','public.revenue_communication_events','Reuse as the only campaign communication event ledger.'
  union all select 'BRIDGE','public.revenue_communication_delivery_events','Reuse provider-supplied delivery evidence.'
  union all select 'BRIDGE','public.email_os_sender_identities','Optional sender-authority bridge; absence does not block schema cutover.'
  union all select 'PRESERVE','public.revenue_os_campaigns','Revenue OS strategy compiler output; do not merge with operational revenue_campaigns.'
  union all select 'PRESERVE','public.market_os_campaigns','Market OS-owned lifecycle; no ownership transfer.'
  union all select 'LEGACY_BRIDGE_ONLY','public.b2b_campaigns','Legacy B2B data may be bridged later; not the Mega ZIP 10 source of truth.'
  union all select 'LEGACY_BRIDGE_ONLY','public.b2b_sequences','Legacy sequence data remains untouched.'
  union all select 'PRESERVE','public.browser_extension_b2b_sequences','Browser extension-owned structures remain isolated.'
  union all select 'PRESERVE','public.ac360_school_message_campaigns','AngelCare 360 school communications remain isolated.'
)
select 'REQUIREMENT' as result_group,object_type,object_name,requirement,
       case when passed then 'PASS' else 'BLOCKED' end as status,detail
from gated_requirements
union all
select 'COMPATIBILITY','classification',object_name,doctrine,'INFO',classification
from compatibility
union all
select 'CUTOVER_GATE','phase','MEGA_ZIP_10','All mandatory canonical requirements must pass.',
       case when bool_and(passed) then 'READY' else 'BLOCKED' end,
       case when bool_and(passed) then 'Apply the additive Phase 10 migration.' else 'Reconcile the blocked canonical object before migration.' end
from gated_requirements
order by result_group,object_name;

-- Optional inventory count. Zero before migration is normal.
select count(*) as phase10_support_tables_present
from information_schema.tables
where table_schema='public'
  and table_name in (
    'revenue_campaign_segments','revenue_campaign_segment_versions','revenue_campaign_audience_snapshots','revenue_campaign_audience_members',
    'revenue_campaign_recipient_eligibility','revenue_campaign_recipients','revenue_campaign_suppressions','revenue_campaign_frequency_decisions',
    'revenue_campaign_sequences','revenue_campaign_sequence_versions','revenue_campaign_sequence_steps','revenue_campaign_sequence_branches',
    'revenue_campaign_templates','revenue_campaign_template_versions','revenue_campaign_enrollments','revenue_campaign_step_executions',
    'revenue_campaign_dispatch_attempts','revenue_campaign_replies','revenue_campaign_sdr_assignments','revenue_campaign_provider_readiness',
    'revenue_campaign_sender_readiness','revenue_campaign_approvals','revenue_campaign_risks','revenue_campaign_evidence',
    'revenue_campaign_status_history','revenue_campaign_conversion_events','revenue_campaign_attributions','revenue_campaign_attribution_conflicts',
    'revenue_campaign_costs','revenue_campaign_performance_periods','revenue_campaign_experiments','revenue_campaign_experiment_variants',
    'revenue_campaign_recovery_plans','revenue_campaign_recovery_checkpoints'
  );
