-- GUARDED ROLLBACK — Global Access Registry & Route-Family Scanner v2
-- Run only after application code has been rolled back.
-- This rollback preserves existing Phase 1 module/route registry tables.

begin;

-- Export these tables before destructive rollback if production data exists:
-- access_resource_registry, access_registry_versions, access_resource_grants.

drop trigger if exists trg_access_resource_registry_updated_at on public.access_resource_registry;
drop trigger if exists trg_access_resource_grants_updated_at on public.access_resource_grants;
drop trigger if exists trg_access_registry_versions_immutable_delete on public.access_registry_versions;

drop table if exists public.access_resource_grants;
drop table if exists public.access_registry_versions;
drop table if exists public.access_resource_registry;

drop function if exists public.touch_global_access_registry_updated_at();
-- Do not drop block_access_registry_history_mutation while the audit-events trigger still uses it.

alter table public.access_route_registry drop column if exists resource_key;
alter table public.access_route_registry drop column if exists family_key;
alter table public.access_scan_runs drop column if exists scan_mode;
alter table public.access_scan_runs drop column if exists resources_detected;
alter table public.access_scan_runs drop column if exists families_detected;
alter table public.access_scan_runs drop column if exists groups_detected;
alter table public.access_scan_runs drop column if exists standalone_routes_detected;
alter table public.access_scan_runs drop column if exists api_routes_detected;
alter table public.access_scan_runs drop column if exists new_resources;
alter table public.access_scan_runs drop column if exists changed_resources;
alter table public.access_scan_runs drop column if exists missing_resources;
alter table public.access_scan_runs drop column if exists checksum;
alter table public.access_scan_runs drop column if exists registry_version_id;
alter table public.access_scan_runs drop column if exists idempotency_key;
alter table public.access_scan_runs drop column if exists published_at;
alter table public.access_registry_events drop column if exists resource_key;

commit;
