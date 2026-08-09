-- Controlled rollback for ANGELCARE RCC Excellence v4 / Mega ZIP 4.
-- BACK UP FIRST. This removes Phase 4 support objects; task business rows and additive base-table columns remain.
begin;
drop view if exists public.revenue_execution_portfolio_view;
drop view if exists public.revenue_task_workload_view;
drop trigger if exists revenue_task_status_history_trigger on public.revenue_tasks;
drop function if exists public.revenue_task_capture_status_history();
drop trigger if exists revenue_task_approval_requests_touch on public.revenue_task_approval_requests;
drop function if exists public.revenue_task_control_touch();
drop table if exists public.revenue_task_relations;
drop table if exists public.revenue_task_time_entries;
drop table if exists public.revenue_task_comments;
drop table if exists public.revenue_task_escalations;
drop table if exists public.revenue_task_blockers;
drop table if exists public.revenue_task_approval_steps;
drop table if exists public.revenue_task_approval_requests;
drop table if exists public.revenue_task_evidence;
drop table if exists public.revenue_task_checklist_items;
drop table if exists public.revenue_task_dependencies;
drop table if exists public.revenue_task_status_history;
drop table if exists public.revenue_task_assignments;
-- Additive revenue_tasks columns are intentionally retained to avoid deleting pre-existing production columns.
commit;
