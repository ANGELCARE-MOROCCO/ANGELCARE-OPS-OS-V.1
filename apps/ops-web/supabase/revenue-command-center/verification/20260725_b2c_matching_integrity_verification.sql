-- Read-only matching integrity verification
select
  m.id as matching_cycle_id,m.b2c_case_id,m.status,m.selected_candidate_id,
  count(c.id) as candidate_count,
  count(c.id) filter(where c.availability_status='verified') as verified_candidates,
  max(c.overall_fit_score) as best_fit_score
from public.revenue_b2c_matching_cycles m
left join public.revenue_b2c_matching_candidates c on c.matching_cycle_id=m.id
group by m.id,m.b2c_case_id,m.status,m.selected_candidate_id
order by m.updated_at desc;

select 'ORPHAN_CANDIDATE' as check_name,count(*) as issue_count
from public.revenue_b2c_matching_candidates c
left join public.revenue_b2c_matching_cycles m on m.id=c.matching_cycle_id
where m.id is null
union all
select 'ACCEPTED_WITHOUT_SELECTED_CANDIDATE',count(*)
from public.revenue_b2c_matching_cycles m
where m.status='accepted' and m.selected_candidate_id is null
union all
select 'ACCEPTED_WITHOUT_VERIFIED_AVAILABILITY',count(*)
from public.revenue_b2c_matching_cycles m
join public.revenue_b2c_matching_candidates c on c.id=m.selected_candidate_id
where m.status='accepted' and c.availability_status<>'verified'
union all
select 'MULTIPLE_OPEN_CYCLES_PER_CASE',count(*)
from (
  select b2c_case_id from public.revenue_b2c_matching_cycles
  where status in ('open','presenting','decision_pending')
  group by b2c_case_id having count(*)>1
) x;
