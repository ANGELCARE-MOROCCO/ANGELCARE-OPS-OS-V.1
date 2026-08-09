-- READ-ONLY discovery. Apply the Ultra schema migration first.
begin transaction read only;

select public.browser_extension_ultra_bridge_dry_run(null) as ultra_bridge_dry_run;

-- Exact and ambiguous account candidates without mutation.
with candidates as (
  select
    ra.id as source_id,
    ra.account_name as source_name,
    ra.city as source_city,
    ra.website as source_website,
    bp.id as target_prospect_id,
    bp.name as target_name,
    bp.city as target_city,
    bp.website as target_website,
    array_remove(array[
      case when nullif(public.browser_extension_ultra_normalize(ra.website),'') is not null
        and public.browser_extension_ultra_normalize(ra.website)=public.browser_extension_ultra_normalize(bp.website) then 'website' end,
      case when nullif(regexp_replace(coalesce(ra.phone,''),'\D','','g'),'') is not null
        and right(regexp_replace(coalesce(ra.phone,''),'\D','','g'),9)=right(regexp_replace(coalesce(bp.phone,''),'\D','','g'),9) then 'phone' end,
      case when public.browser_extension_ultra_normalize(ra.account_name)=public.browser_extension_ultra_normalize(bp.name) then 'name' end,
      case when public.browser_extension_ultra_normalize(ra.city)=public.browser_extension_ultra_normalize(bp.city) then 'city' end
    ],null) as signals
  from public.revenue_accounts ra
  join public.b2b_prospects bp on bp.archived_at is null and (
    (nullif(public.browser_extension_ultra_normalize(ra.website),'') is not null and public.browser_extension_ultra_normalize(ra.website)=public.browser_extension_ultra_normalize(bp.website))
    or (nullif(regexp_replace(coalesce(ra.phone,''),'\D','','g'),'') is not null and right(regexp_replace(coalesce(ra.phone,''),'\D','','g'),9)=right(regexp_replace(coalesce(bp.phone,''),'\D','','g'),9))
    or (public.browser_extension_ultra_normalize(ra.account_name)=public.browser_extension_ultra_normalize(bp.name) and public.browser_extension_ultra_normalize(ra.city)=public.browser_extension_ultra_normalize(bp.city))
  )
), ranked as (
  select *, count(*) over(partition by source_id) as candidate_count,
    case when 'website'=any(signals) then 1.0 when 'phone'=any(signals) and 'name'=any(signals) then .95 when 'name'=any(signals) and 'city'=any(signals) then .85 else .6 end as confidence
  from candidates
)
select * from ranked order by candidate_count desc, source_name, confidence desc;

-- Parent/group and branch reconciliation candidates. These are reviewable identities, never silent merges.
select
  ra.id as source_account_id,
  ra.account_name,
  ra.account_type,
  nullif(ra.metadata->>'parent_account_id','') as parent_account_id,
  coalesce(nullif(ra.metadata->>'parent_name',''),nullif(ra.metadata->>'parent_group','')) as parent_name,
  coalesce(nullif(ra.metadata->>'branch_code',''),nullif(ra.metadata->>'site_code','')) as branch_code,
  case
    when lower(coalesce(ra.account_type,'')) in ('branch','site') or ra.metadata ? 'parent_account_id' or ra.metadata ? 'branch_of' then 'branch'
    when lower(coalesce(ra.account_type,'')) in ('group','parent','holding') or lower(coalesce(ra.metadata->>'is_parent','false'))='true' then 'parent'
    else 'review'
  end as proposed_entity_type
from public.revenue_accounts ra
where lower(coalesce(ra.account_type,'')) in ('branch','site','group','parent','holding')
   or ra.metadata ?| array['parent_account_id','branch_of','parent_name','parent_group','branch_code','site_code','is_parent']
order by ra.account_name;

-- Records that would require controlled creation rather than an existing match.
select ra.id,ra.account_name,ra.city,ra.website,ra.phone,ra.email,ra.owner_id,ra.territory
from public.revenue_accounts ra
where not exists (select 1 from public.browser_extension_ultra_commercial_id_map m where m.source_table='revenue_accounts' and m.source_id=ra.id and m.status='active')
  and not exists (
    select 1 from public.b2b_prospects bp where bp.archived_at is null and (
      (nullif(public.browser_extension_ultra_normalize(ra.website),'') is not null and public.browser_extension_ultra_normalize(ra.website)=public.browser_extension_ultra_normalize(bp.website))
      or (public.browser_extension_ultra_normalize(ra.account_name)=public.browser_extension_ultra_normalize(bp.name) and public.browser_extension_ultra_normalize(ra.city)=public.browser_extension_ultra_normalize(bp.city))
    )
  )
order by ra.updated_at desc;

rollback;
