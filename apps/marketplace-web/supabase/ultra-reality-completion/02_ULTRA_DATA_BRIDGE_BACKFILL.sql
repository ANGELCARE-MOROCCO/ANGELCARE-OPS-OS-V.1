-- SAFE CUMULATIVE BACKFILL.
-- psql example: psql "$DATABASE_URL" -v actor_id='00000000-0000-0000-0000-000000000000' -f 02_ULTRA_DATA_BRIDGE_BACKFILL.sql
-- Run 01 dry-run and review 03 conflicts before this file.
\if :{?actor_id}
\else
  \echo 'ERROR: actor_id psql variable is required'
  \quit 3
\endif

begin;
select pg_advisory_xact_lock(hashtext('angelcare-browser-os-ultra-data-bridge-v1'));

create temporary table ultra_run(id uuid primary key) on commit drop;
with created_run as (
  insert into public.browser_extension_ultra_bridge_runs(mode,status,started_by,source_snapshot)
  values ('backfill','running',:'actor_id'::uuid,public.browser_extension_ultra_bridge_dry_run(:'actor_id'::uuid))
  returning id
)
insert into ultra_run(id)
select id from created_run;

-- 1. Record ambiguity before any creation.
with candidates as (
  select ra.id source_id, bp.id target_id,
    array_remove(array[
      case when nullif(public.browser_extension_ultra_normalize(ra.website),'') is not null and public.browser_extension_ultra_normalize(ra.website)=public.browser_extension_ultra_normalize(bp.website) then 'website' end,
      case when nullif(regexp_replace(coalesce(ra.phone,''),'\D','','g'),'') is not null and right(regexp_replace(coalesce(ra.phone,''),'\D','','g'),9)=right(regexp_replace(coalesce(bp.phone,''),'\D','','g'),9) then 'phone' end,
      case when public.browser_extension_ultra_normalize(ra.account_name)=public.browser_extension_ultra_normalize(bp.name) then 'name' end,
      case when public.browser_extension_ultra_normalize(ra.city)=public.browser_extension_ultra_normalize(bp.city) then 'city' end
    ],null) signals
  from public.revenue_accounts ra join public.b2b_prospects bp on bp.archived_at is null and (
    (nullif(public.browser_extension_ultra_normalize(ra.website),'') is not null and public.browser_extension_ultra_normalize(ra.website)=public.browser_extension_ultra_normalize(bp.website))
    or (nullif(regexp_replace(coalesce(ra.phone,''),'\D','','g'),'') is not null and right(regexp_replace(coalesce(ra.phone,''),'\D','','g'),9)=right(regexp_replace(coalesce(bp.phone,''),'\D','','g'),9))
    or (public.browser_extension_ultra_normalize(ra.account_name)=public.browser_extension_ultra_normalize(bp.name) and public.browser_extension_ultra_normalize(ra.city)=public.browser_extension_ultra_normalize(bp.city))
  )
), ambiguous as (
  select source_id,jsonb_agg(jsonb_build_object('targetProspectId',target_id,'signals',signals)) candidates,count(*) candidate_count
  from candidates group by source_id having count(*)>1
)
insert into public.browser_extension_ultra_bridge_conflicts(bridge_run_id,conflict_key,conflict_type,severity,source_records,candidate_targets,matching_signals,recommended_resolution)
select r.id,'revenue_accounts:'||a.source_id,'ambiguous_account_match','critical',jsonb_build_array(jsonb_build_object('table','revenue_accounts','id',a.source_id)),a.candidates,'["multi_signal_identity"]'::jsonb,'Review legal identity, domain, phone and branch/parent relationship; select exactly one canonical prospect or classify as branch.'
from ambiguous a cross join ultra_run r
on conflict (bridge_run_id,conflict_key) do nothing;

-- 2. Map unambiguous existing account matches.
with candidates as (
  select ra.id source_id,bp.id target_id,ra.owner_id,ra.territory,
    array_remove(array[
      case when nullif(public.browser_extension_ultra_normalize(ra.website),'') is not null and public.browser_extension_ultra_normalize(ra.website)=public.browser_extension_ultra_normalize(bp.website) then 'website' end,
      case when nullif(regexp_replace(coalesce(ra.phone,''),'\D','','g'),'') is not null and right(regexp_replace(coalesce(ra.phone,''),'\D','','g'),9)=right(regexp_replace(coalesce(bp.phone,''),'\D','','g'),9) then 'phone' end,
      case when public.browser_extension_ultra_normalize(ra.account_name)=public.browser_extension_ultra_normalize(bp.name) then 'name' end,
      case when public.browser_extension_ultra_normalize(ra.city)=public.browser_extension_ultra_normalize(bp.city) then 'city' end
    ],null) signals
  from public.revenue_accounts ra join public.b2b_prospects bp on bp.archived_at is null and (
    (nullif(public.browser_extension_ultra_normalize(ra.website),'') is not null and public.browser_extension_ultra_normalize(ra.website)=public.browser_extension_ultra_normalize(bp.website))
    or (nullif(regexp_replace(coalesce(ra.phone,''),'\D','','g'),'') is not null and right(regexp_replace(coalesce(ra.phone,''),'\D','','g'),9)=right(regexp_replace(coalesce(bp.phone,''),'\D','','g'),9))
    or (public.browser_extension_ultra_normalize(ra.account_name)=public.browser_extension_ultra_normalize(bp.name) and public.browser_extension_ultra_normalize(ra.city)=public.browser_extension_ultra_normalize(bp.city))
  )
), unique_candidates as (
 select *,count(*) over(partition by source_id) candidate_count from candidates
)
insert into public.browser_extension_ultra_commercial_id_map(bridge_run_id,source_system,source_table,source_id,entity_type,target_prospect_id,match_method,match_confidence,match_signals,owner_id,territory,historical_ids,status)
select r.id,'revenue_command_center','revenue_accounts',c.source_id,'account',c.target_id,'existing_multi_signal',case when 'website'=any(c.signals) then 1 when 'phone'=any(c.signals) and 'name'=any(c.signals) then .95 else .85 end,to_jsonb(c.signals),c.owner_id,c.territory,jsonb_build_object('revenueAccountId',c.source_id),'active'
from unique_candidates c cross join ultra_run r where c.candidate_count=1
on conflict (source_system,source_table,source_id,entity_type) do update set target_prospect_id=excluded.target_prospect_id,bridge_run_id=excluded.bridge_run_id,match_method=excluded.match_method,match_confidence=excluded.match_confidence,match_signals=excluded.match_signals,owner_id=coalesce(excluded.owner_id,public.browser_extension_ultra_commercial_id_map.owner_id),territory=coalesce(excluded.territory,public.browser_extension_ultra_commercial_id_map.territory),status='active',updated_at=now();

-- 2.1 Reconcile parent/group and branch identities without duplicating the canonical account.
-- Branch and parent mappings point at the already mapped canonical prospect and preserve the historical relationship.
insert into public.browser_extension_ultra_commercial_id_map(
  bridge_run_id,source_system,source_table,source_id,entity_type,target_prospect_id,
  match_method,match_confidence,match_signals,owner_id,territory,historical_ids,status
)
select
  r.id,'revenue_command_center','revenue_accounts',ra.id,
  case
    when lower(coalesce(ra.account_type,'')) in ('branch','site') or ra.metadata ? 'parent_account_id' or ra.metadata ? 'branch_of' then 'branch'
    else 'parent'
  end,
  account_map.target_prospect_id,
  'reconciled_from_revenue_account_metadata',1,
  jsonb_build_array('canonical_account_mapping','account_type','parent_branch_metadata'),
  ra.owner_id,ra.territory,
  jsonb_strip_nulls(jsonb_build_object(
    'revenueAccountId',ra.id,
    'parentRevenueAccountId',coalesce(nullif(ra.metadata->>'parent_account_id',''),nullif(ra.metadata->>'branch_of','')),
    'parentName',coalesce(nullif(ra.metadata->>'parent_name',''),nullif(ra.metadata->>'parent_group','')),
    'branchCode',coalesce(nullif(ra.metadata->>'branch_code',''),nullif(ra.metadata->>'site_code',''))
  )),
  'active'
from public.revenue_accounts ra
join public.browser_extension_ultra_commercial_id_map account_map
  on account_map.source_table='revenue_accounts' and account_map.source_id=ra.id and account_map.entity_type='account' and account_map.status='active'
cross join ultra_run r
where lower(coalesce(ra.account_type,'')) in ('branch','site','group','parent','holding')
   or ra.metadata ?| array['parent_account_id','branch_of','parent_name','parent_group','branch_code','site_code','is_parent']
on conflict (source_system,source_table,source_id,entity_type) do update set
  bridge_run_id=excluded.bridge_run_id,
  target_prospect_id=excluded.target_prospect_id,
  match_method=excluded.match_method,
  match_confidence=excluded.match_confidence,
  match_signals=excluded.match_signals,
  historical_ids=excluded.historical_ids,
  owner_id=coalesce(excluded.owner_id,public.browser_extension_ultra_commercial_id_map.owner_id),
  territory=coalesce(excluded.territory,public.browser_extension_ultra_commercial_id_map.territory),
  status='active',updated_at=now();

-- A branch that references an unmapped parent is a conflict, not an inferred merge.
insert into public.browser_extension_ultra_bridge_conflicts(
  bridge_run_id,conflict_key,conflict_type,severity,source_records,candidate_targets,matching_signals,recommended_resolution
)
select
  r.id,'parent_branch:'||ra.id,'parent_branch_parent_unmapped','high',
  jsonb_build_array(jsonb_build_object('table','revenue_accounts','id',ra.id,'name',ra.account_name)),
  jsonb_build_array(jsonb_build_object('parentRevenueAccountId',coalesce(nullif(ra.metadata->>'parent_account_id',''),nullif(ra.metadata->>'branch_of','')),'parentName',coalesce(nullif(ra.metadata->>'parent_name',''),nullif(ra.metadata->>'parent_group','')))),
  jsonb_build_array('declared_parent_relationship'),
  'Map and validate the declared parent revenue account before confirming the branch relationship.'
from public.revenue_accounts ra cross join ultra_run r
where coalesce(nullif(ra.metadata->>'parent_account_id',''),nullif(ra.metadata->>'branch_of','')) is not null
  and not exists (
    select 1 from public.browser_extension_ultra_commercial_id_map parent_map
    where parent_map.source_table='revenue_accounts'
      and parent_map.source_id::text=coalesce(nullif(ra.metadata->>'parent_account_id',''),nullif(ra.metadata->>'branch_of',''))
      and parent_map.entity_type='account' and parent_map.status='active'
  )
on conflict (bridge_run_id,conflict_key) do nothing;

-- 3. Create canonical B2B prospects only for genuinely unmapped revenue accounts with sufficient identity.
create temporary table ultra_new_accounts(source_id uuid primary key,target_id uuid not null,account_name text,segment text,city text,phone text,email text,website text,priority text,owner_id uuid,territory text) on commit drop;
insert into ultra_new_accounts
select ra.id,gen_random_uuid(),ra.account_name,ra.segment,ra.city,ra.phone,ra.email,ra.website,ra.priority,coalesce(ra.owner_id,:'actor_id'::uuid),ra.territory
from public.revenue_accounts ra
where nullif(trim(ra.account_name),'') is not null
  and (nullif(trim(coalesce(ra.website,'')),'') is not null or nullif(trim(coalesce(ra.phone,'')),'') is not null or nullif(trim(coalesce(ra.email,'')),'') is not null)
  and not exists (select 1 from public.browser_extension_ultra_commercial_id_map m where m.source_table='revenue_accounts' and m.source_id=ra.id and m.status='active')
  and not exists (select 1 from public.browser_extension_ultra_bridge_conflicts c cross join ultra_run r where c.bridge_run_id=r.id and c.conflict_key='revenue_accounts:'||ra.id)
  and not exists (
    select 1 from public.b2b_prospects bp where bp.archived_at is null and (
      (nullif(public.browser_extension_ultra_normalize(ra.website),'') is not null and public.browser_extension_ultra_normalize(ra.website)=public.browser_extension_ultra_normalize(bp.website))
      or (public.browser_extension_ultra_normalize(ra.account_name)=public.browser_extension_ultra_normalize(bp.name) and public.browser_extension_ultra_normalize(ra.city)=public.browser_extension_ultra_normalize(bp.city))
    )
  );

insert into public.b2b_prospects(id,name,sector,city,phone,email,website,status,priority_score,estimated_monthly_value,estimated_annual_value,next_action,assigned_owner_id,created_by,updated_by)
select target_id,account_name,coalesce(nullif(segment,''),'Other'),nullif(city,''),phone,email,website,'New',case lower(coalesce(priority,'medium')) when 'critical' then 'A' when 'high' then 'A' when 'low' then 'C' else 'B' end,0,0,'Review imported Revenue Command history and confirm the first governed action.',owner_id,:'actor_id'::uuid,:'actor_id'::uuid
from ultra_new_accounts;

insert into public.browser_extension_ultra_commercial_id_map(bridge_run_id,source_system,source_table,source_id,entity_type,target_prospect_id,match_method,match_confidence,match_signals,owner_id,territory,historical_ids,status)
select r.id,'revenue_command_center','revenue_accounts',n.source_id,'account',n.target_id,'created_from_revenue_account',1,'["source_preserved","controlled_creation"]'::jsonb,n.owner_id,n.territory,jsonb_build_object('revenueAccountId',n.source_id),'active'
from ultra_new_accounts n cross join ultra_run r
on conflict (source_system,source_table,source_id,entity_type) do nothing;

-- 4. Map Revenue prospects to canonical B2B account using account relation first, then exact identity.
insert into public.browser_extension_ultra_commercial_id_map(bridge_run_id,source_system,source_table,source_id,entity_type,target_prospect_id,match_method,match_confidence,match_signals,owner_id,territory,historical_ids,status)
select r.id,'revenue_command_center','revenue_prospects',rp.id,'prospect',coalesce(am.target_prospect_id,bp.id),case when am.target_prospect_id is not null then 'revenue_account_relation' else 'exact_name_city' end,case when am.target_prospect_id is not null then 1 else .85 end,case when am.target_prospect_id is not null then '["account_id"]'::jsonb else '["name","city"]'::jsonb end,rp.owner_id,rp.city,jsonb_build_object('revenueProspectId',rp.id,'revenueAccountId',rp.account_id),'active'
from public.revenue_prospects rp cross join ultra_run r
left join public.browser_extension_ultra_commercial_id_map am on am.source_table='revenue_accounts' and am.source_id=rp.account_id and am.status='active'
left join lateral (select id from public.b2b_prospects b where b.archived_at is null and public.browser_extension_ultra_normalize(b.name)=public.browser_extension_ultra_normalize(coalesce(rp.company,rp.name)) and public.browser_extension_ultra_normalize(b.city)=public.browser_extension_ultra_normalize(rp.city) order by b.updated_at desc limit 1) bp on true
where coalesce(am.target_prospect_id,bp.id) is not null
on conflict (source_system,source_table,source_id,entity_type) do update set target_prospect_id=excluded.target_prospect_id,bridge_run_id=excluded.bridge_run_id,match_method=excluded.match_method,match_confidence=excluded.match_confidence,match_signals=excluded.match_signals,status='active',updated_at=now();

-- 5. Create Browser OS opportunities from real Revenue opportunities only when no target mapping exists.
create temporary table ultra_new_opportunities(source_id uuid primary key,target_id uuid not null,target_prospect_id uuid not null,title text,stage text,status text,value_mad numeric,probability numeric,expected_close_date date,owner_id uuid) on commit drop;
insert into ultra_new_opportunities
select ro.id,gen_random_uuid(),pm.target_prospect_id,ro.title,ro.stage,ro.status,ro.value_mad,ro.probability,ro.expected_close_date,coalesce(ro.owner_id,:'actor_id'::uuid)
from public.revenue_opportunities ro
join public.browser_extension_ultra_commercial_id_map pm on pm.source_table='revenue_prospects' and pm.source_id=ro.prospect_id and pm.status='active'
where not exists (select 1 from public.browser_extension_ultra_commercial_id_map m where m.source_table='revenue_opportunities' and m.source_id=ro.id and m.status='active');

insert into public.browser_extension_b2b_opportunities(id,prospect_id,title,opportunity_type,stage,stage_order,status,estimated_annual_value,probability,expected_close_at,owner_id,next_action,risk_level,created_by,updated_by)
select target_id,target_prospect_id,title,'bridged_revenue_opportunity',case lower(stage) when 'won' then 'closing' when 'proposal' then 'proposal' when 'negotiation' then 'negotiation' when 'qualified' then 'qualified' else 'new_target' end,case lower(stage) when 'won' then 90 when 'negotiation' then 70 when 'proposal' then 60 when 'qualified' then 30 else 10 end,case when lower(status) in ('lost','archived') then 'lost' when lower(status)='won' then 'active' else 'active' end,coalesce(value_mad,0),greatest(0,least(coalesce(probability,10),100)),expected_close_date::timestamptz,owner_id,'Validate bridged opportunity stage, evidence and next action before progression.',case when lower(status)='won' then 'high' else 'medium' end,:'actor_id'::uuid,:'actor_id'::uuid
from ultra_new_opportunities;

insert into public.browser_extension_ultra_commercial_id_map(bridge_run_id,source_system,source_table,source_id,entity_type,target_prospect_id,target_opportunity_id,target_entity_id,match_method,match_confidence,match_signals,owner_id,historical_ids,status)
select r.id,'revenue_command_center','revenue_opportunities',n.source_id,'opportunity',n.target_prospect_id,n.target_id,n.target_id,'created_from_revenue_opportunity',1,'["source_prospect_mapping","historical_id"]'::jsonb,n.owner_id,jsonb_build_object('revenueOpportunityId',n.source_id),'active'
from ultra_new_opportunities n cross join ultra_run r
on conflict (source_system,source_table,source_id,entity_type) do nothing;

-- 6. Create pending Partner 360 records from real partnerships, never auto-activate.
create temporary table ultra_new_partners(source_id uuid primary key,target_id uuid not null,target_prospect_id uuid not null,partner_name text,partner_type text,city text,owner_id uuid,email text,phone text) on commit drop;
insert into ultra_new_partners
select rp.id,gen_random_uuid(),coalesce(am.target_prospect_id,pm.target_prospect_id),rp.partner_name,rp.partner_type,rp.city,coalesce(rp.owner_id,:'actor_id'::uuid),rp.email,rp.phone
from public.revenue_partnerships rp
left join public.browser_extension_ultra_commercial_id_map am on am.source_table='revenue_accounts' and am.source_id=rp.account_id and am.status='active'
left join public.browser_extension_ultra_commercial_id_map pm on pm.source_table='revenue_prospects' and pm.source_id=rp.prospect_id and pm.status='active'
where coalesce(am.target_prospect_id,pm.target_prospect_id) is not null
  and not exists (select 1 from public.browser_extension_b2b_partners p where p.prospect_id=coalesce(am.target_prospect_id,pm.target_prospect_id))
  and not exists (select 1 from public.browser_extension_ultra_commercial_id_map m where m.source_table='revenue_partnerships' and m.source_id=rp.id and m.status='active');

insert into public.browser_extension_b2b_partners(id,prospect_id,legal_name,commercial_name,status,partner_type,vertical,city,territory,billing_status,payment_status,sales_owner_id,operational_owner_id,activation_status,health_status,metadata,created_by,updated_by)
select target_id,target_prospect_id,partner_name,partner_name,'pending_handoff',coalesce(nullif(partner_type,''),'b2b_partner'),partner_type,city,city,'pending','pending',owner_id,null,'not_started','unknown',jsonb_build_object('bridgeSource','revenue_partnerships','sourceId',source_id,'sourceEmail',email,'sourcePhone',phone,'requiresHandoffValidation',true),:'actor_id'::uuid,:'actor_id'::uuid
from ultra_new_partners;

insert into public.browser_extension_ultra_commercial_id_map(bridge_run_id,source_system,source_table,source_id,entity_type,target_prospect_id,target_partner_id,target_entity_id,match_method,match_confidence,match_signals,owner_id,historical_ids,status)
select r.id,'revenue_command_center','revenue_partnerships',n.source_id,'partner',n.target_prospect_id,n.target_id,n.target_id,'created_pending_partner_from_revenue_partnership',1,'["canonical_account_mapping","activation_blocked"]'::jsonb,n.owner_id,jsonb_build_object('revenuePartnershipId',n.source_id),'active'
from ultra_new_partners n cross join ultra_run r
on conflict (source_system,source_table,source_id,entity_type) do nothing;

-- 7. Finish the run with explicit counts and conflicts.
update public.browser_extension_ultra_bridge_runs br
set status=case when c.total>0 then 'completed_with_conflicts' else 'completed' end,
    conflict_count=c.total,
    result_summary=jsonb_build_object(
      'newProspects',(select count(*) from ultra_new_accounts),
      'parentBranchMappings',(select count(*) from public.browser_extension_ultra_commercial_id_map m where m.bridge_run_id=br.id and m.entity_type in ('parent','branch') and m.status='active'),
      'newOpportunities',(select count(*) from ultra_new_opportunities),
      'newPendingPartners',(select count(*) from ultra_new_partners),
      'activeMappings',(select count(*) from public.browser_extension_ultra_commercial_id_map m where m.bridge_run_id=br.id and m.status='active'),
      'conflicts',c.total,
      'truthBoundary','No partner was auto-activated and no won/payment claim was created.'
    ), completed_at=now()
from (select count(*)::integer total from public.browser_extension_ultra_bridge_conflicts c cross join ultra_run r where c.bridge_run_id=r.id and c.status in ('open','reviewing')) c
where br.id=(select id from ultra_run);

select * from public.browser_extension_ultra_bridge_runs where id=(select id from ultra_run);
commit;
