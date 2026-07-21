-- Run after dry-run or backfill. It is read-only.
select
  c.id,c.bridge_run_id,c.severity,c.conflict_type,c.conflict_key,c.status,
  c.source_records,c.candidate_targets,c.matching_signals,c.recommended_resolution,
  c.created_at,c.resolved_at
from public.browser_extension_ultra_bridge_conflicts c
where c.status in ('open','reviewing')
order by case c.severity when 'critical' then 1 when 'high' then 2 when 'medium' then 3 else 4 end,c.created_at;

select source_table,entity_type,status,count(*) mapping_count,
       count(*) filter(where match_confidence<.9) review_candidates
from public.browser_extension_ultra_commercial_id_map
group by source_table,entity_type,status
order by source_table,entity_type,status;

select * from public.browser_extension_ultra_bridge_runs order by created_at desc limit 20;
