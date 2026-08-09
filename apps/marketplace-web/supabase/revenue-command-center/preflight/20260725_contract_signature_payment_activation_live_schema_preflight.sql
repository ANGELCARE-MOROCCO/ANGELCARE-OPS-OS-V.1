-- READ-ONLY PRELIGHT — Mega ZIP 7
with required(name) as (
  values
    ('revenue_prospects'),('revenue_accounts'),('revenue_contacts'),('revenue_opportunities'),('revenue_tasks'),
    ('revenue_proposals'),('revenue_proposal_versions'),('revenue_commercial_outcomes'),('revenue_contract_handoffs')
), phase7(name) as (
  values
    ('revenue_contracts'),('revenue_contract_versions'),('revenue_contract_sections'),('revenue_contract_reviews'),
    ('revenue_contract_approvals'),('revenue_contract_signatories'),('revenue_signature_events'),('revenue_signature_evidence'),
    ('revenue_contract_conditions'),('revenue_condition_evidence'),('revenue_contract_obligations'),('revenue_obligation_events'),
    ('revenue_contract_milestones'),('revenue_payment_terms'),('revenue_payment_schedules'),('revenue_payment_requirements'),
    ('revenue_payment_promises'),('revenue_payment_promise_events'),('revenue_collection_actions'),('revenue_finance_handoffs'),
    ('revenue_payment_confirmations'),('revenue_activation_gates'),('revenue_activation_decisions'),('revenue_operational_handoffs'),
    ('revenue_realization_events'),('revenue_contract_risks'),('revenue_contract_status_history'),('revenue_contract_closures')
), counts as (
  select
    (select count(*) from required where to_regclass('public.'||name) is not null) required_present,
    (select count(*) from required) required_total,
    (select count(*) from phase7 where to_regclass('public.'||name) is not null) phase7_present,
    (select count(*) from phase7) phase7_total,
    exists(select 1 from information_schema.columns where table_schema='public' and table_name='revenue_prospects' and column_name='id' and udt_name='text') prospect_text_id,
    exists(
      select 1 from information_schema.columns
      where table_schema='public' and table_name='revenue_accounts'
        and column_name in ('account_name','name','legal_name')
    ) account_display_compatible,
    case when to_regclass('public.revenue_contracts') is null then true else exists(select 1 from information_schema.columns where table_schema='public' and table_name='revenue_contracts' and column_name='id' and udt_name='uuid') end contract_uuid_compatible
)
select 'FOUNDATION' as check_type,name as object_name,case when to_regclass('public.'||name) is not null then 'PASS' else 'MISSING' end status from required
union all
select 'PHASE7_OBJECT',name,case when to_regclass('public.'||name) is not null then 'PRESENT' else 'MISSING' end from phase7
union all
select 'IDENTITY','public.revenue_prospects.id',case when prospect_text_id then 'TEXT_PASS' else 'BLOCKED' end from counts
union all
select 'IDENTITY','public.revenue_contracts.id',case when contract_uuid_compatible then 'UUID_COMPATIBLE' else 'BLOCKED' end from counts
union all
select 'COMPATIBILITY','public.revenue_accounts.display_name',case when account_display_compatible then 'PASS' else 'BLOCKED' end from counts
union all
select 'FINANCE_SOURCE','angelcare360_invoices',case when to_regclass('public.angelcare360_invoices') is not null then 'AVAILABLE' else 'NOT_FOUND_OPTIONAL' end
union all
select 'FINANCE_SOURCE','angelcare360_payments',case when to_regclass('public.angelcare360_payments') is not null then 'AVAILABLE' else 'NOT_FOUND_OPTIONAL' end
union all
select 'FINANCE_SOURCE','sales_invoices',case when to_regclass('public.sales_invoices') is not null then 'AVAILABLE' else 'NOT_FOUND_OPTIONAL' end
union all
select 'FINANCE_SOURCE','sales_payment_events',case when to_regclass('public.sales_payment_events') is not null then 'AVAILABLE' else 'NOT_FOUND_OPTIONAL' end
union all
select 'CUTOVER_GATE','MEGA_ZIP_7',case when required_present=required_total and prospect_text_id and account_display_compatible and contract_uuid_compatible and phase7_present in (0,phase7_total) then 'READY' else 'BLOCKED' end from counts
order by check_type,object_name;
