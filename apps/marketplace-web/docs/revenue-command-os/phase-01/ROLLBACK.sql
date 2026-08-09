-- ANGELCARE Revenue Command OS Phase 1 rollback
-- WARNING: destroys Phase 1 Revenue OS data only. Legacy revenue-command-center data is not touched.

drop trigger if exists revenue_os_audit_events_append_only on public.revenue_os_audit_events;
drop table if exists public.revenue_os_event_outbox cascade;
drop table if exists public.revenue_os_business_events cascade;
drop table if exists public.revenue_os_audit_events cascade;
drop table if exists public.revenue_os_objectives cascade;
drop table if exists public.revenue_os_system_checks cascade;
drop table if exists public.revenue_os_status_dictionary cascade;
drop table if exists public.revenue_os_feature_flags cascade;
drop table if exists public.revenue_os_workspaces cascade;
drop table if exists public.revenue_os_permission_registry cascade;
drop table if exists public.revenue_os_installations cascade;
drop function if exists public.revenue_os_prevent_audit_mutation();
drop function if exists public.revenue_os_touch_updated_at();
