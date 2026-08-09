-- MEGA ZIP 10 — ATTRIBUTION LINEAGE, OVERALLOCATION AND REALIZATION VERIFICATION
with campaign_share as (
  select event_type,event_id,sum(attribution_share) as share
  from public.revenue_campaign_attributions where status in ('active','confirmed','attributed')
  group by event_type,event_id
), partner_share as (
  select event_type,event_id,sum(attribution_share) as share
  from public.revenue_partner_referral_attributions where status in ('active','confirmed','attributed')
  group by event_type,event_id
), combined as (
  select coalesce(c.event_type,p.event_type) event_type,coalesce(c.event_id,p.event_id) event_id,
    coalesce(c.share,0) campaign_share,coalesce(p.share,0) partner_share,coalesce(c.share,0)+coalesce(p.share,0) total_share
  from campaign_share c full join partner_share p on p.event_type=c.event_type and p.event_id=c.event_id
)
select * from combined where total_share>100 order by total_share desc;

select 'overallocation_events' as issue,count(*) as issue_count from (
  select event_type,event_id,sum(attribution_share) share
  from public.revenue_campaign_attributions where status in ('active','confirmed','attributed')
  group by event_type,event_id having sum(attribution_share)>100
) x
union all
select 'realization_attribution_without_realization',count(*)
from public.revenue_campaign_attributions a left join public.revenue_realization_events r on r.id::text=a.event_id
where a.event_type='revenue_realized' and a.status in ('active','confirmed','attributed') and r.id is null
union all
select 'active_attribution_to_reversed_realization',count(*)
from public.revenue_campaign_attributions a join public.revenue_realization_events r on r.id::text=a.event_id
where a.event_type='revenue_realized' and a.status in ('active','confirmed','attributed') and r.status='reversed'
union all
select 'attribution_without_evidence',count(*) from public.revenue_campaign_attributions where nullif(evidence_reference,'') is null
union all
select 'unresolved_conflicts',count(*) from public.revenue_campaign_attribution_conflicts where status='open';

select campaign_id,event_type,count(*) attributions,sum(attribution_share) total_share,sum(attributed_value) attributed_value_mad
from public.revenue_campaign_attributions where status in ('active','confirmed','attributed')
group by campaign_id,event_type order by campaign_id,event_type;
