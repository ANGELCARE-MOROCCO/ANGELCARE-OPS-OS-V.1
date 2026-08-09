-- Read-only performance and scorecard verification.

select 'INVALID_PERIOD_RANGE' as check_name,count(*) as issue_count
from public.revenue_partner_performance_periods where period_end<period_start
union all
select 'CLOSED_PERIOD_WITHOUT_SCORECARD',count(*)
from public.revenue_partner_performance_periods p
left join public.revenue_partner_scorecards s on s.performance_period_id=p.id
where p.status='closed' and s.id is null
union all
select 'SCORE_OUT_OF_RANGE',count(*)
from public.revenue_partner_scorecards
where overall_score<0 or overall_score>100
   or referral_quality_score<0 or referral_quality_score>100
   or conversion_score<0 or conversion_score>100
   or realized_revenue_score<0 or realized_revenue_score>100
   or obligation_compliance_score<0 or obligation_compliance_score>100
   or engagement_score<0 or engagement_score>100
   or relationship_health_score<0 or relationship_health_score>100
union all
select 'DUPLICATE_SCORECARD_PERIOD',coalesce(sum(record_count-1),0)::bigint
from (
  select performance_period_id,count(*) record_count
  from public.revenue_partner_scorecards
  group by performance_period_id
  having count(*)>1
) duplicate_periods;

select
  p.id as period_id,
  p.partnership_id,
  p.period_start,
  p.period_end,
  p.status,
  p.target_referrals,
  s.referral_count,
  p.target_realized_mad,
  s.realized_revenue_mad,
  s.overall_score,
  s.performance_status,
  r.recommendation
from public.revenue_partner_performance_periods p
left join public.revenue_partner_scorecards s on s.performance_period_id=p.id
left join public.revenue_partner_reviews r on r.performance_period_id=p.id
order by p.period_end desc,p.created_at desc;

-- Approved renewals must either remain explicitly prepared or point to the canonical
-- Proposal / Negotiation systems after launch. This is read-only and should return 0.
select 'APPROVED_RENEWAL_WITHOUT_CANONICAL_WORKFLOW' as check_name,count(*) as issue_count
from public.revenue_partner_renewal_readiness
where status in ('proposal_launched','negotiation_launched')
  and proposal_id is null
  and negotiation_id is null;
