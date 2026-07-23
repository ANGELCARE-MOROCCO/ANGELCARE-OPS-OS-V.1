select
  to_regclass('public.app_sessions') as app_sessions,
  to_regclass('public.app_users') as app_users,
  to_regclass('public.market_os_ambassador_actor_roles') as actor_roles,
  exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'market_os_ambassador_actor_roles'
      and column_name = 'app_user_id'
  ) as app_user_bridge_column_exists;

select
  ar.id as ambassador_actor_id,
  ar.app_user_id,
  coalesce(u.full_name, u.email, u.username, u.id::text) as app_user,
  u.role as opsos_role,
  u.status as opsos_status,
  ar.role_key as ambassador_role,
  ar.tenant_id,
  ar.organization_id,
  ar.status as ambassador_actor_status
from public.market_os_ambassador_actor_roles ar
join public.app_users u on u.id = ar.app_user_id
where ar.app_user_id is not null
order by ar.updated_at desc;

select role_key, permission_key, enabled
from public.market_os_ambassador_role_permissions
where role_key = 'ambassador_admin'
order by permission_key;
