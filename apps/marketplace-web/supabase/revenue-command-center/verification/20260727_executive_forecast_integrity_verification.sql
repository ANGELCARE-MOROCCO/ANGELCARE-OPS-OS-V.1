-- Phase 11 forecast integrity verification
select
  (select count(*) from public.revenue_executive_forecast_lines l
   left join public.revenue_executive_forecast_snapshots s on s.id=l.snapshot_id
   where s.id is null) as orphan_forecast_lines,
  (select count(*) from (
     select snapshot_id,source_entity_type,source_entity_id,count(*)
     from public.revenue_executive_forecast_lines
     group by snapshot_id,source_entity_type,source_entity_id having count(*)>1
   ) d) as duplicate_forecast_lines,
  (select count(*) from public.revenue_executive_forecast_lines
   where probability not between 0 and 100
      or confidence not between 0 and 100
      or evidence_score not between 0 and 100) as invalid_forecast_percentages,
  (select count(*) from public.revenue_executive_forecast_overrides
   where status='active'
   group by forecast_line_id having count(*)>1) as duplicate_active_overrides,
  (select count(*) from public.revenue_executive_forecast_snapshots
   where raw_pipeline_mad<0 or weighted_pipeline_mad<0 or realized_mad<0 or reversed_mad<0) as negative_snapshot_values;

select
  s.id,s.snapshot_key,s.status,count(l.id) as line_count,
  s.raw_pipeline_mad,s.weighted_pipeline_mad,s.commit_mad,s.contracted_mad,
  s.payment_confirmed_mad,s.realized_mad,s.reversed_mad
from public.revenue_executive_forecast_snapshots s
left join public.revenue_executive_forecast_lines l on l.snapshot_id=s.id
group by s.id
order by s.created_at desc;
