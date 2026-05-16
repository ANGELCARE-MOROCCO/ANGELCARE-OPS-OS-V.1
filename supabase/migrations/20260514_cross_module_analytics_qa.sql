-- ANGELCARE RCC MEGA HARDENING PACK 03
-- CROSS-MODULE ANALYTICS + QA
-- Run after prospects, tasks, appointments, events migrations.

create or replace view public.revenue_command_analytics_view as
select
  (select count(*) from public.revenue_prospects)::integer as total_prospects,
  (select count(*) from public.revenue_prospects where stage not in ('closed_won','closed_lost'))::integer as active_prospects,
  (select coalesce(sum(value_mad),0) from public.revenue_prospects)::numeric as pipeline_value_mad,
  (select count(*) from public.revenue_tasks)::integer as total_tasks,
  (select count(*) from public.revenue_tasks where status = 'open')::integer as open_tasks,
  (select count(*) from public.revenue_tasks where status = 'done')::integer as completed_tasks,
  (select count(*) from public.revenue_tasks where status = 'open' and due_date < current_date)::integer as overdue_tasks,
  (select count(*) from public.revenue_appointments)::integer as total_appointments,
  (select count(*) from public.revenue_appointments where status = 'scheduled')::integer as scheduled_appointments,
  (select count(*) from public.revenue_appointments where status = 'completed')::integer as completed_appointments,
  (select count(*) from public.revenue_appointments where status = 'scheduled' and appointment_at < now())::integer as missed_appointments,
  (select count(*) from public.revenue_notifications where status = 'unread')::integer as unread_notifications,
  (select count(*) from public.revenue_events)::integer as total_events;

create or replace function public.revenue_command_smoke_test()
returns jsonb
language plpgsql
security definer
as $$
declare result jsonb;
begin
  select jsonb_build_object(
    'revenue_prospects_exists', to_regclass('public.revenue_prospects') is not null,
    'revenue_tasks_exists', to_regclass('public.revenue_tasks') is not null,
    'revenue_appointments_exists', to_regclass('public.revenue_appointments') is not null,
    'revenue_events_exists', to_regclass('public.revenue_events') is not null,
    'revenue_notifications_exists', to_regclass('public.revenue_notifications') is not null,
    'analytics_view_exists', to_regclass('public.revenue_command_analytics_view') is not null,
    'checked_at', now()
  ) into result;
  return result;
end $$;
