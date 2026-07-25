-- READ-ONLY verification after applying 20260725_0200 migration.
select tablename, rowsecurity
from pg_tables
where schemaname='public' and tablename in (
  'revenue_task_assignments','revenue_task_status_history','revenue_task_dependencies','revenue_task_checklist_items',
  'revenue_task_evidence','revenue_task_approval_requests','revenue_task_approval_steps','revenue_task_blockers',
  'revenue_task_escalations','revenue_task_comments','revenue_task_time_entries','revenue_task_relations'
)
order by tablename;

select tablename,policyname,cmd,roles,qual,with_check
from pg_policies
where schemaname='public' and tablename like 'revenue_task%'
order by tablename,policyname;

select table_name,privilege_type,grantee
from information_schema.role_table_grants
where table_schema='public'
  and table_name in (
    'revenue_task_assignments','revenue_task_status_history','revenue_task_dependencies','revenue_task_checklist_items',
    'revenue_task_evidence','revenue_task_approval_requests','revenue_task_approval_steps','revenue_task_blockers',
    'revenue_task_escalations','revenue_task_comments','revenue_task_time_entries','revenue_task_relations'
  )
order by table_name,grantee,privilege_type;

select
  to_regclass('public.revenue_execution_portfolio_view') as portfolio_view,
  to_regclass('public.revenue_task_workload_view') as workload_view,
  to_regprocedure('public.revenue_task_capture_status_history()') as status_history_trigger_function;

select
  (select count(*) from public.revenue_tasks) as task_count,
  (select count(*) from public.revenue_task_status_history) as status_history_count,
  (select count(*) from public.revenue_task_assignments) as assignment_count,
  (select count(*) from public.revenue_task_approval_requests) as approval_count,
  (select count(*) from public.revenue_task_evidence) as evidence_count,
  (select count(*) from public.revenue_task_blockers where resolved_at is null) as open_blocker_count;
