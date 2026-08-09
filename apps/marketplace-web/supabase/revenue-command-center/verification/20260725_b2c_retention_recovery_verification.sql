-- Read-only retention, satisfaction and recovery verification
select
  c.id,c.family_name,c.stage,c.satisfaction_score,c.retention_status,c.risk_status,
  coalesce((select sum(r.value_at_risk_mad) from public.revenue_b2c_retention_risks r where r.b2c_case_id=c.id and r.status='open'),0) as value_at_risk_mad,
  (select count(*) from public.revenue_b2c_complaints q where q.b2c_case_id=c.id and q.status<>'closed') as open_complaints,
  (select count(*) from public.revenue_b2c_recovery_plans p where p.b2c_case_id=c.id and p.status='active') as active_recovery_plans
from public.revenue_b2c_cases c
where c.stage in ('active','retention','recovery') or c.retention_status in ('at_risk','recovery')
order by c.updated_at desc;

select 'CLOSED_COMPLAINT_WITHOUT_EVIDENCE' as check_name,count(*) as issue_count
from public.revenue_b2c_complaints where status='closed' and coalesce(closure_evidence,'')=''
union all
select 'ACTIVE_CASE_LOW_SATISFACTION_WITHOUT_RISK',count(*)
from public.revenue_b2c_cases c
where c.stage='active' and c.satisfaction_score>0 and c.satisfaction_score<60
  and not exists(select 1 from public.revenue_b2c_retention_risks r where r.b2c_case_id=c.id and r.status='open')
union all
select 'RECOVERY_WITHOUT_PLAN',count(*)
from public.revenue_b2c_cases c
where c.stage='recovery'
  and not exists(select 1 from public.revenue_b2c_recovery_plans p where p.b2c_case_id=c.id and p.status='active');
