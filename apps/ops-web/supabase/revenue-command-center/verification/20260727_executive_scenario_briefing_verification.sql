-- Phase 11 scenario and briefing integrity verification
select
  (select count(*) from public.revenue_executive_scenario_versions v
   left join public.revenue_executive_scenarios s on s.id=v.scenario_id where s.id is null) as orphan_scenario_versions,
  (select count(*) from public.revenue_executive_scenario_results r
   left join public.revenue_executive_scenario_versions v on v.id=r.scenario_version_id where v.id is null) as orphan_scenario_results,
  (select count(*) from public.revenue_executive_scenarios
   where status='approved' and (approved_by is null or approved_at is null)) as invalid_approved_scenarios,
  (select count(*) from public.revenue_executive_briefings
   where status in ('approved','distributed') and (approved_by is null or approved_at is null)) as invalid_approved_briefings,
  (select count(*) from public.revenue_executive_briefing_sections s
   left join public.revenue_executive_briefings b on b.id=s.briefing_id where b.id is null) as orphan_briefing_sections;

select id,scenario_key,title,scenario_type,horizon,status,current_version,approved_at
from public.revenue_executive_scenarios order by created_at desc;
select id,briefing_key,title,briefing_type,horizon,status,approved_at
from public.revenue_executive_briefings order by created_at desc;
