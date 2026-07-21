begin;
update public.browser_extension_release_channels set version='0.6.0',minimum_version='0.6.0',mandatory=false,release_notes='Rolled back Mega ZIP 7 to accepted Mega ZIP 6',updated_at=now() where channel_key in ('pilot','stable','rollback');
delete from public.browser_extension_release_channels where channel_key in ('development','internal');
drop table if exists public.browser_extension_privacy_retention_policies;
drop table if exists public.browser_extension_migration_registry;
drop table if exists public.browser_extension_compatibility_matrix;
drop table if exists public.browser_extension_deployment_approvals;
drop table if exists public.browser_extension_incident_events;
drop table if exists public.browser_extension_incidents;
drop table if exists public.browser_extension_production_kill_switches;
drop table if exists public.browser_extension_feature_flags;
drop table if exists public.browser_extension_error_fingerprints;
drop table if exists public.browser_extension_adapter_health;
drop table if exists public.browser_extension_performance_samples;
drop table if exists public.browser_extension_runtime_health_events;
drop table if exists public.browser_extension_device_release_assignments;
drop table if exists public.browser_extension_release_versions;
alter table public.browser_extension_devices
  drop column if exists desired_release_channel,
  drop column if exists health_status,
  drop column if exists last_health_at,
  drop column if exists last_error_fingerprint,
  drop column if exists minimum_compatible_version;
commit;
