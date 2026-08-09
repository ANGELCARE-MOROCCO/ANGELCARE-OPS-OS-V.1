drop function if exists public.revenue_apply_meeting_outcome(uuid,jsonb,uuid);
-- CONTROLLED rollback for Mega ZIP 5 support objects.
-- WARNING: this removes Mega ZIP 5 engagement data. Backup first.
-- Core revenue_appointments records and additive columns are intentionally preserved.

begin;
drop view if exists public.revenue_appointment_workload_view;
drop view if exists public.revenue_communication_thread_view;
drop view if exists public.revenue_engagement_appointment_view;
drop trigger if exists trg_revenue_appointment_status_history on public.revenue_appointments;
drop function if exists public.revenue_capture_appointment_status_history();

drop table if exists public.revenue_communication_delivery_events cascade;
drop table if exists public.revenue_communication_events cascade;
drop table if exists public.revenue_communication_threads cascade;
drop table if exists public.revenue_appointment_recovery_attempts cascade;
drop table if exists public.revenue_appointment_no_shows cascade;
drop table if exists public.revenue_meeting_follow_ups cascade;
drop table if exists public.revenue_meeting_outcomes cascade;
drop table if exists public.revenue_meeting_commitments cascade;
drop table if exists public.revenue_meeting_decisions cascade;
drop table if exists public.revenue_meeting_objections cascade;
drop table if exists public.revenue_meeting_notes cascade;
drop table if exists public.revenue_meeting_attendance cascade;
drop table if exists public.revenue_meeting_preparation_items cascade;
drop table if exists public.revenue_meeting_agenda_items cascade;
drop table if exists public.revenue_appointment_status_history cascade;
drop table if exists public.revenue_appointment_participants cascade;
drop function if exists public.revenue_engagement_touch_updated_at();
notify pgrst,'reload schema';
commit;
