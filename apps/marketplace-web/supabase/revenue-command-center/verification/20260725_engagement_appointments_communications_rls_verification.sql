-- ANGELCARE Revenue Command Excellence v5 / Mega ZIP 5
-- Post-migration read-only verification.

with required(name) as (
  values
    ('revenue_appointment_participants'),('revenue_appointment_status_history'),('revenue_meeting_agenda_items'),
    ('revenue_meeting_preparation_items'),('revenue_meeting_attendance'),('revenue_meeting_notes'),
    ('revenue_meeting_objections'),('revenue_meeting_decisions'),('revenue_meeting_commitments'),
    ('revenue_meeting_outcomes'),('revenue_meeting_follow_ups'),('revenue_appointment_no_shows'),
    ('revenue_appointment_recovery_attempts'),('revenue_communication_threads'),('revenue_communication_events'),
    ('revenue_communication_delivery_events')
)
select name as object_name,
       case when to_regclass('public.'||name) is not null then 'PASS' else 'FAIL' end as status
from required order by name;

select 'VIEW' as object_type, object_name,
       case when to_regclass('public.'||object_name) is not null then 'PASS' else 'FAIL' end as status
from (values('revenue_engagement_appointment_view'),('revenue_communication_thread_view'),('revenue_appointment_workload_view')) v(object_name);

select table_name, relrowsecurity as rls_enabled,
       case when relrowsecurity then 'PASS' else 'FAIL' end as status
from information_schema.tables t
join pg_class c on c.oid=to_regclass('public.'||t.table_name)
where t.table_schema='public'
  and t.table_name in (
    'revenue_appointment_participants','revenue_appointment_status_history','revenue_meeting_agenda_items','revenue_meeting_preparation_items',
    'revenue_meeting_attendance','revenue_meeting_notes','revenue_meeting_objections','revenue_meeting_decisions','revenue_meeting_commitments',
    'revenue_meeting_outcomes','revenue_meeting_follow_ups','revenue_appointment_no_shows','revenue_appointment_recovery_attempts',
    'revenue_communication_threads','revenue_communication_events','revenue_communication_delivery_events'
  )
order by table_name;

select schemaname,tablename,policyname,cmd,roles
from pg_policies
where schemaname='public' and policyname='revenue_engagement_authenticated_read'
order by tablename;

select
  (select udt_name from information_schema.columns where table_schema='public' and table_name='revenue_prospects' and column_name='id') as prospect_id_contract,
  (select udt_name from information_schema.columns where table_schema='public' and table_name='revenue_appointments' and column_name='id') as appointment_id_contract,
  (select udt_name from information_schema.columns where table_schema='public' and table_name='revenue_tasks' and column_name='id') as task_id_contract,
  case when (select udt_name from information_schema.columns where table_schema='public' and table_name='revenue_prospects' and column_name='id')='text' then 'PASS' else 'FAIL' end as legacy_prospect_contract_status;

select
  (select count(*) from public.revenue_appointment_participants p left join public.revenue_appointments a on a.id=p.appointment_id where a.id is null) as orphan_participants,
  (select count(*) from public.revenue_meeting_outcomes o left join public.revenue_appointments a on a.id=o.appointment_id where a.id is null) as orphan_outcomes,
  (select count(*) from public.revenue_communication_events e left join public.revenue_communication_threads t on t.id=e.thread_id where t.id is null) as orphan_communication_events,
  (select count(*) from public.revenue_meeting_commitments c left join public.revenue_appointments a on a.id=c.appointment_id where a.id is null) as orphan_commitments;

select
  (select count(*) from public.revenue_appointments) as appointment_count,
  (select count(*) from public.revenue_appointment_status_history) as status_history_count,
  (select count(*) from public.revenue_appointment_participants) as participant_count,
  (select count(*) from public.revenue_meeting_preparation_items) as preparation_count,
  (select count(*) from public.revenue_meeting_outcomes) as outcome_count,
  (select count(*) from public.revenue_meeting_commitments) as commitment_count,
  (select count(*) from public.revenue_communication_threads) as communication_thread_count,
  (select count(*) from public.revenue_communication_events) as communication_event_count,
  (select count(*) from public.revenue_appointment_no_shows) as no_show_count,
  (select count(*) from public.revenue_appointment_recovery_attempts) as recovery_attempt_count;
