-- ANGELCARE Revenue Command Center — Mega ZIP 8
-- Read-only production truth / compatibility preflight.
-- This file performs no mutation.

with required_base(object_name) as (
  values
    ('public.revenue_partnerships'),
    ('public.revenue_prospects'),
    ('public.revenue_accounts'),
    ('public.revenue_contacts'),
    ('public.revenue_opportunities'),
    ('public.revenue_tasks'),
    ('public.revenue_appointments'),
    ('public.revenue_communication_events'),
    ('public.revenue_proposals'),
    ('public.revenue_negotiations'),
    ('public.revenue_negotiation_rounds'),
    ('public.revenue_contracts'),
    ('public.revenue_contract_obligations'),
    ('public.revenue_finance_handoffs'),
    ('public.revenue_realization_events')
),
base_status as (
  select object_name,
         case when to_regclass(object_name) is not null then 'PASS' else 'MISSING' end status,
         jsonb_build_object('regclass',to_regclass(object_name)) details
  from required_base
),
column_contracts(object_name,table_name,column_name,expected_type,required) as (
  values
    ('public.revenue_prospects.id','revenue_prospects','id','text',true),
    ('public.revenue_partnerships.id','revenue_partnerships','id','uuid',true),
    ('public.revenue_accounts.id','revenue_accounts','id','uuid',true),
    ('public.revenue_contacts.id','revenue_contacts','id','uuid',true),
    ('public.revenue_opportunities.id','revenue_opportunities','id','uuid',true),
    ('public.revenue_tasks.id','revenue_tasks','id','uuid',true),
    ('public.revenue_tasks.partnership_id','revenue_tasks','partnership_id','text',true),
    ('public.revenue_tasks.prospect_id','revenue_tasks','prospect_id','text',true),
    ('public.revenue_appointments.id','revenue_appointments','id','uuid',true),
    ('public.revenue_appointments.partnership_id','revenue_appointments','partnership_id','text',true),
    ('public.revenue_contracts.id','revenue_contracts','id','uuid',true),
    ('public.revenue_contracts.partnership_id','revenue_contracts','partnership_id','text',true),
    ('public.revenue_realization_events.id','revenue_realization_events','id','uuid',true),
    ('public.revenue_partnerships.account_id','revenue_partnerships','account_id','uuid',false),
    ('public.revenue_partnerships.contract_id','revenue_partnerships','contract_id','uuid',false),
    ('public.revenue_partnerships.prospect_text_id','revenue_partnerships','prospect_text_id','text',false)
),
column_status as (
  select c.object_name,
         case
           when col.column_name is null and c.required then 'MISSING'
           when col.column_name is null then 'READY_TO_ADD'
           when col.data_type=c.expected_type then 'PASS'
           else 'BLOCKED'
         end status,
         jsonb_build_object('actual_type',col.data_type,'expected_type',c.expected_type,'required',c.required) details
  from column_contracts c
  left join information_schema.columns col
    on col.table_schema='public' and col.table_name=c.table_name and col.column_name=c.column_name
),
partnership_label as (
  select 'public.revenue_partnerships.display_name'::text object_name,
         case
           when exists(select 1 from information_schema.columns where table_schema='public' and table_name='revenue_partnerships' and column_name in ('partner_name','name','legal_name','commercial_name')) then 'PASS'
           when coalesce((select n_live_tup from pg_stat_user_tables where schemaname='public' and relname='revenue_partnerships'),0)=0 then 'READY_TO_ADD'
           else 'BLOCKED'
         end status,
         jsonb_build_object(
           'available_columns',coalesce((select jsonb_agg(column_name order by ordinal_position) from information_schema.columns where table_schema='public' and table_name='revenue_partnerships' and column_name in ('partner_name','name','legal_name','commercial_name')),'[]'::jsonb),
           'estimated_rows',coalesce((select n_live_tup from pg_stat_user_tables where schemaname='public' and relname='revenue_partnerships'),0)
         ) details
),
account_label as (
  select 'public.revenue_accounts.display_name'::text object_name,
         case when exists(select 1 from information_schema.columns where table_schema='public' and table_name='revenue_accounts' and column_name in ('account_name','name','legal_name')) then 'PASS' else 'OPTIONAL_UNAVAILABLE' end status,
         jsonb_build_object('available_columns',coalesce((select jsonb_agg(column_name order by ordinal_position) from information_schema.columns where table_schema='public' and table_name='revenue_accounts' and column_name in ('account_name','name','legal_name')),'[]'::jsonb)) details
),
prospect_bridge as (
  select 'public.revenue_partnerships.prospect_link'::text object_name,
         case
           when exists(select 1 from information_schema.columns where table_schema='public' and table_name='revenue_partnerships' and column_name='prospect_text_id' and data_type='text') then 'PASS'
           when exists(select 1 from information_schema.columns where table_schema='public' and table_name='revenue_partnerships' and column_name='prospect_id' and data_type='text') then 'PASS_EXISTING_TEXT'
           when exists(select 1 from information_schema.columns where table_schema='public' and table_name='revenue_partnerships' and column_name='prospect_id' and data_type='uuid') then 'READY_FOR_TEXT_BRIDGE'
           else 'READY_TO_ADD'
         end status,
         jsonb_build_object(
           'prospect_id_type',(select data_type from information_schema.columns where table_schema='public' and table_name='revenue_partnerships' and column_name='prospect_id'),
           'prospect_text_id_type',(select data_type from information_schema.columns where table_schema='public' and table_name='revenue_partnerships' and column_name='prospect_text_id'),
           'canonical_prospect_id_type','text'
         ) details
),
required_runtime_columns(object_name,table_name,column_name) as (
  values
    ('public.revenue_tasks.metadata','revenue_tasks','metadata'),
    ('public.revenue_tasks.entity_id','revenue_tasks','entity_id'),
    ('public.revenue_tasks.entity_name','revenue_tasks','entity_name'),
    ('public.revenue_tasks.due_date','revenue_tasks','due_date'),
    ('public.revenue_appointments.scheduled_at','revenue_appointments','scheduled_at'),
    ('public.revenue_appointments.appointment_at','revenue_appointments','appointment_at'),
    ('public.revenue_realization_events.amount','revenue_realization_events','amount'),
    ('public.revenue_realization_events.currency','revenue_realization_events','currency'),
    ('public.revenue_realization_events.status','revenue_realization_events','status')
),
runtime_status as (
  select r.object_name,
         case when exists(select 1 from information_schema.columns where table_schema='public' and table_name=r.table_name and column_name=r.column_name) then 'PASS' else 'MISSING' end status,
         '{}'::jsonb details
  from required_runtime_columns r
),
support_tables(name) as (
  values
    ('revenue_partnership_stakeholders'),('revenue_partnership_qualifications'),
    ('revenue_partner_programs'),('revenue_partner_program_locations'),('revenue_partner_program_service_lines'),
    ('revenue_partner_benefits'),('revenue_partner_benefit_usage'),
    ('revenue_partnership_obligations'),('revenue_partnership_milestones'),
    ('revenue_partner_activation_plans'),('revenue_partner_activation_gates'),
    ('revenue_partner_referrals'),('revenue_partner_referral_status_history'),
    ('revenue_partner_referral_attributions'),('revenue_partner_attribution_conflicts'),
    ('revenue_partner_performance_periods'),('revenue_partner_performance_metrics'),
    ('revenue_partner_scorecards'),('revenue_partner_reviews'),
    ('revenue_partner_recovery_plans'),('revenue_partner_recovery_checkpoints'),
    ('revenue_partner_renewal_readiness'),('revenue_partner_expansions'),
    ('revenue_partnership_status_history'),('revenue_partnership_risks'),('revenue_partnership_closures')
),
support_summary as (
  select count(*)::int expected_count,
         count(*) filter(where to_regclass('public.'||name) is not null)::int present_count
  from support_tables
),
checks as (
  select 'BASE'::text category,object_name,status,details from base_status
  union all select 'IDENTITY',object_name,status,details from column_status
  union all select 'COMPATIBILITY',object_name,status,details from partnership_label
  union all select 'COMPATIBILITY',object_name,status,details from account_label
  union all select 'COMPATIBILITY',object_name,status,details from prospect_bridge
  union all select 'RUNTIME_COLUMN',object_name,status,details from runtime_status
  union all
  select 'INSTALLATION','partnership_support_tables',
         case when present_count=0 then 'READY_TO_INSTALL' when present_count=expected_count then 'ALREADY_COMPLETE' else 'BLOCKED_PARTIAL_INSTALL' end,
         jsonb_build_object('expected_count',expected_count,'present_count',present_count)
  from support_summary
)
select * from checks order by category,object_name;

with support as (
  select count(*) filter(where to_regclass('public.'||name) is not null)::int present_count,count(*)::int expected_count
  from (values
    ('revenue_partnership_stakeholders'),('revenue_partnership_qualifications'),('revenue_partner_programs'),
    ('revenue_partner_program_locations'),('revenue_partner_program_service_lines'),('revenue_partner_benefits'),
    ('revenue_partner_benefit_usage'),('revenue_partnership_obligations'),('revenue_partnership_milestones'),
    ('revenue_partner_activation_plans'),('revenue_partner_activation_gates'),('revenue_partner_referrals'),
    ('revenue_partner_referral_status_history'),('revenue_partner_referral_attributions'),('revenue_partner_attribution_conflicts'),
    ('revenue_partner_performance_periods'),('revenue_partner_performance_metrics'),('revenue_partner_scorecards'),
    ('revenue_partner_reviews'),('revenue_partner_recovery_plans'),('revenue_partner_recovery_checkpoints'),
    ('revenue_partner_renewal_readiness'),('revenue_partner_expansions'),('revenue_partnership_status_history'),
    ('revenue_partnership_risks'),('revenue_partnership_closures')
  ) t(name)
),
base_ok as (
  select bool_and(to_regclass(name) is not null) ok from (values
    ('public.revenue_partnerships'),('public.revenue_prospects'),('public.revenue_accounts'),
    ('public.revenue_contacts'),('public.revenue_opportunities'),('public.revenue_tasks'),
    ('public.revenue_appointments'),('public.revenue_communication_events'),('public.revenue_proposals'),
    ('public.revenue_negotiations'),('public.revenue_negotiation_rounds'),('public.revenue_contracts'),
    ('public.revenue_contract_obligations'),('public.revenue_finance_handoffs'),('public.revenue_realization_events')
  ) x(name)
),
identity_ok as (
  select
    (select data_type='text' from information_schema.columns where table_schema='public' and table_name='revenue_prospects' and column_name='id') and
    (select data_type='uuid' from information_schema.columns where table_schema='public' and table_name='revenue_partnerships' and column_name='id') and
    (select data_type='uuid' from information_schema.columns where table_schema='public' and table_name='revenue_accounts' and column_name='id') and
    (select data_type='uuid' from information_schema.columns where table_schema='public' and table_name='revenue_tasks' and column_name='id') and
    (select data_type='text' from information_schema.columns where table_schema='public' and table_name='revenue_tasks' and column_name='partnership_id') and
    (select data_type='text' from information_schema.columns where table_schema='public' and table_name='revenue_appointments' and column_name='partnership_id') and
    (select data_type='text' from information_schema.columns where table_schema='public' and table_name='revenue_contracts' and column_name='partnership_id') ok
),
relationship_ok as (
  select
    not exists(select 1 from information_schema.columns where table_schema='public' and table_name='revenue_partnerships' and column_name='account_id' and data_type<>'uuid') and
    not exists(select 1 from information_schema.columns where table_schema='public' and table_name='revenue_partnerships' and column_name='contract_id' and data_type<>'uuid') and
    not exists(select 1 from information_schema.columns where table_schema='public' and table_name='revenue_partnerships' and column_name='prospect_text_id' and data_type<>'text') ok
),
runtime_ok as (
  select
    exists(select 1 from information_schema.columns where table_schema='public' and table_name='revenue_tasks' and column_name='metadata') and
    exists(select 1 from information_schema.columns where table_schema='public' and table_name='revenue_tasks' and column_name='entity_id') and
    exists(select 1 from information_schema.columns where table_schema='public' and table_name='revenue_appointments' and column_name='partnership_id') and
    exists(select 1 from information_schema.columns where table_schema='public' and table_name='revenue_appointments' and column_name in ('scheduled_at','appointment_at')) and
    exists(select 1 from information_schema.columns where table_schema='public' and table_name='revenue_realization_events' and column_name='amount') ok
),
labels_ok as (
  select exists(select 1 from information_schema.columns where table_schema='public' and table_name='revenue_partnerships' and column_name in ('partner_name','name','legal_name','commercial_name'))
    or coalesce((select n_live_tup from pg_stat_user_tables where schemaname='public' and relname='revenue_partnerships'),0)=0 ok
)
select
  'CUTOVER_GATE' category,
  'MEGA_ZIP_8' object_name,
  case
    when not coalesce((select ok from base_ok),false) then 'BLOCKED'
    when not coalesce((select ok from identity_ok),false) then 'BLOCKED'
    when not coalesce((select ok from relationship_ok),false) then 'BLOCKED'
    when not coalesce((select ok from runtime_ok),false) then 'BLOCKED'
    when not coalesce((select ok from labels_ok),false) then 'BLOCKED'
    when (select present_count from support) not in (0,(select expected_count from support)) then 'BLOCKED'
    else 'READY'
  end status,
  jsonb_build_object(
    'base_ok',coalesce((select ok from base_ok),false),
    'identity_ok',coalesce((select ok from identity_ok),false),
    'relationship_compatibility',coalesce((select ok from relationship_ok),false),
    'runtime_columns',coalesce((select ok from runtime_ok),false),
    'partner_label_compatibility',coalesce((select ok from labels_ok),false),
    'support_present',(select present_count from support),
    'support_expected',(select expected_count from support),
    'prospect_id_contract','text',
    'partnership_id_contract','uuid',
    'cross_module_partnership_links','text UUID strings',
    'migration_mode','additive_text_bridge'
  ) details;
