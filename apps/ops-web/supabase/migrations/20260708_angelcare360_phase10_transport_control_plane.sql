-- AngelCare 360 Phase 10
-- Transport & Sécurité control-plane additive adjustments.
-- This migration only widens transport readiness fields and status contracts.

alter table public.angelcare360_transport_routes
  add column if not exists vehicle_id uuid references public.angelcare360_transport_vehicles(id) on delete set null,
  add column if not exists accompagnateur_staff_id uuid references public.angelcare360_staff(id) on delete set null,
  add column if not exists capacity_seats integer;

alter table public.angelcare360_transport_routes
  drop constraint if exists angelcare360_transport_routes_status_check;

alter table public.angelcare360_transport_routes
  add constraint angelcare360_transport_routes_status_check
  check (status in ('draft', 'active', 'inactive', 'suspended', 'archived'));

alter table public.angelcare360_transport_stops
  drop constraint if exists angelcare360_transport_stops_status_check;

alter table public.angelcare360_transport_stops
  add constraint angelcare360_transport_stops_status_check
  check (status in ('active', 'inactive', 'suspended', 'archived'));

alter table public.angelcare360_transport_vehicles
  drop constraint if exists angelcare360_transport_vehicles_status_check;

alter table public.angelcare360_transport_vehicles
  add constraint angelcare360_transport_vehicles_status_check
  check (status in ('active', 'inactive', 'maintenance', 'unavailable', 'archived'));

alter table public.angelcare360_transport_assignments
  drop constraint if exists angelcare360_transport_assignments_status_check;

alter table public.angelcare360_transport_assignments
  add constraint angelcare360_transport_assignments_status_check
  check (status in ('active', 'inactive', 'pending', 'suspended', 'cancelled', 'archived'));

insert into public.angelcare360_permissions (
  permission_key,
  domain_key,
  action_key,
  label,
  description,
  risk_level,
  status,
  metadata_json
)
select
  domain_key || '.' || action_key,
  domain_key,
  action_key,
  public.angelcare360_permission_label(domain_key, action_key),
  'Permission AngelCare 360 pour ' || public.angelcare360_permission_label(domain_key, action_key),
  case
    when domain_key in ('finance', 'paie', 'audit', 'securite', 'transport') or action_key in ('delete', 'configure') then 'high'
    when action_key in ('approve', 'export', 'audit', 'assign', 'notify') then 'medium'
    else 'low'
  end,
  'active',
  '{"phase":"10","module":"transport"}'::jsonb
from unnest(array['transport', 'notifications', 'audit']::text[]) as domain_key
cross join unnest(array['view', 'create', 'update', 'assign', 'notify', 'approve', 'export', 'audit']::text[]) as action_key
on conflict (permission_key) do update set
  domain_key = excluded.domain_key,
  action_key = excluded.action_key,
  label = excluded.label,
  description = excluded.description,
  risk_level = excluded.risk_level,
  status = excluded.status,
  metadata_json = excluded.metadata_json;

insert into public.angelcare360_access_scopes (
  school_id,
  scope_key,
  scope_type,
  module_key,
  route_path,
  action_key,
  entity_type,
  label,
  status,
  metadata_json
)
select
  s.id,
  'module:transport',
  'module',
  'transport',
  '/angelcare-360-command-center/transport',
  'view',
  'module',
  public.angelcare360_domain_label('transport'),
  'active',
  '{"phase":"10","module":"transport"}'::jsonb
from public.angelcare360_schools s
on conflict (school_id, scope_key) do update set
  scope_type = excluded.scope_type,
  module_key = excluded.module_key,
  route_path = excluded.route_path,
  action_key = excluded.action_key,
  entity_type = excluded.entity_type,
  label = excluded.label,
  status = excluded.status,
  metadata_json = excluded.metadata_json;

insert into public.angelcare360_role_permissions (role_id, permission_key, effect, metadata_json)
select r.id, p.permission_key, 'allow', '{"phase":"10","module":"transport"}'::jsonb
from public.angelcare360_roles r
join public.angelcare360_permissions p
  on public.angelcare360_role_permission_allowed(r.role_key, p.domain_key, p.action_key)
where p.domain_key in ('transport', 'notifications', 'audit')
on conflict (role_id, permission_key) do update set
  effect = excluded.effect,
  metadata_json = excluded.metadata_json;

