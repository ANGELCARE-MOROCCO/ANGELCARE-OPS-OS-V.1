-- MEGA ZIP 10 — COST, PERFORMANCE, EXPERIMENT AND RECOVERY VERIFICATION
select 'invalid_cost_state' as issue,count(*) issue_count from public.revenue_campaign_costs where cost_state not in ('estimated','approved','committed','confirmed')
union all
select 'negative_cost',count(*) from public.revenue_campaign_costs where amount_mad<0
union all
select 'closed_period_without_metrics',count(*) from public.revenue_campaign_performance_periods where status='closed' and (metrics='{}'::jsonb or closed_at is null)
union all
select 'closed_period_without_economics',count(*) from public.revenue_campaign_performance_periods where status='closed' and economics='{}'::jsonb
union all
select 'experiment_overallocation',count(*) from (
  select experiment_id,sum(allocation_percent) allocation from public.revenue_campaign_experiment_variants where status='active' group by experiment_id having sum(allocation_percent)>100
) x
union all
select 'completed_recovery_without_checkpoint',count(*) from public.revenue_campaign_recovery_plans p where p.status='completed' and not exists(select 1 from public.revenue_campaign_recovery_checkpoints c where c.recovery_plan_id=p.id and c.status='completed');

select campaign_id,
  sum(amount_mad) filter(where cost_state='estimated') estimated_mad,
  sum(amount_mad) filter(where cost_state='approved') approved_mad,
  sum(amount_mad) filter(where cost_state='committed') committed_mad,
  sum(amount_mad) filter(where cost_state='confirmed') confirmed_mad
from public.revenue_campaign_costs group by campaign_id order by campaign_id;

select id,campaign_id,label,status,metrics,economics,scorecard,closed_at
from public.revenue_campaign_performance_periods order by created_at desc;
