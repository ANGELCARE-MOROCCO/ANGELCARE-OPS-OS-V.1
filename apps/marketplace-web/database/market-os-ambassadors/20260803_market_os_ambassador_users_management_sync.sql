-- AngelCare Market OS Ambassadors — Users Management authorization synchronization
-- Additive only. The RPC is the transaction boundary for global + native access.
begin;

alter table public.app_users
  add column if not exists tenant_id text,
  add column if not exists organization_id text,
  add column if not exists permissions jsonb not null default '[]'::jsonb;

create table if not exists public.market_os_ambassador_module_memberships (
  id uuid primary key default gen_random_uuid(),
  app_user_id uuid not null references public.app_users(id) on delete cascade,
  tenant_id text not null,
  organization_id text not null,
  module_key text not null default 'market_os_ambassadors',
  access_mode text not null default 'full' check (access_mode in ('full','view_only','custom','none')),
  active boolean not null default true,
  grant_permissions jsonb not null default '[]'::jsonb,
  grant_version bigint not null default 1,
  assigned_by uuid references public.app_users(id) on delete set null,
  assigned_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (app_user_id, tenant_id, organization_id, module_key)
);

create index if not exists idx_mos_ambassador_membership_scope
  on public.market_os_ambassador_module_memberships(tenant_id, organization_id, module_key, active);
create index if not exists idx_mos_ambassador_membership_user
  on public.market_os_ambassador_module_memberships(app_user_id, active);

alter table public.market_os_ambassador_actor_roles
  add column if not exists module_membership_id uuid references public.market_os_ambassador_module_memberships(id) on delete set null,
  add column if not exists grant_version bigint not null default 1;

insert into public.market_os_ambassador_role_permissions(role_key, permission_key, enabled)
select 'AMBASSADOR_MODULE_ADMINISTRATOR', '*', true
where to_regclass('public.market_os_ambassador_role_permissions') is not null
on conflict (role_key, permission_key) do update set enabled = true, updated_at = now();

insert into public.market_os_ambassador_role_permissions(role_key, permission_key, enabled)
select 'AMBASSADOR_MODULE_VIEWER', permission_key, true
from public.market_os_ambassador_role_permissions
where role_key = 'viewer' and permission_key not like '%.write'
  and permission_key not like '%.transition'
  and permission_key not like '%.assign'
  and permission_key not like '%.approve'
  and permission_key not like '%.execute'
  and permission_key not like '%.convert'
  and permission_key not like '%.submit'
  and permission_key not like '%.review'
  and permission_key not like '%.generate'
  and permission_key not like '%.draft'
  and permission_key not like '%.validate'
  and permission_key not like '%.publish'
  and permission_key not like '%.rollback'
on conflict (role_key, permission_key) do update set enabled = true, updated_at = now();

insert into public.market_os_ambassador_role_permissions(role_key, permission_key, enabled)
values
  ('AMBASSADOR_MODULE_VIEWER','ambassadors.read',true),
  ('AMBASSADOR_MODULE_VIEWER','territories.read',true),
  ('AMBASSADOR_MODULE_VIEWER','missions.read',true),
  ('AMBASSADOR_MODULE_VIEWER','recruitment.read',true),
  ('AMBASSADOR_MODULE_VIEWER','leads.read',true),
  ('AMBASSADOR_MODULE_VIEWER','conversions.read',true),
  ('AMBASSADOR_MODULE_VIEWER','onboarding.read',true),
  ('AMBASSADOR_MODULE_VIEWER','training.read',true),
  ('AMBASSADOR_MODULE_VIEWER','goals.read',true),
  ('AMBASSADOR_MODULE_VIEWER','proofs.read',true),
  ('AMBASSADOR_MODULE_VIEWER','rewards.read',true),
  ('AMBASSADOR_MODULE_VIEWER','payouts.read',true),
  ('AMBASSADOR_MODULE_VIEWER','reports.read',true),
  ('AMBASSADOR_MODULE_VIEWER','settings.read',true),
  ('AMBASSADOR_MODULE_VIEWER','audit.read',true)
on conflict (role_key, permission_key) do update set enabled = true, updated_at = now();

create or replace function public.sync_market_os_ambassador_user_access(
  p_app_user_id uuid,
  p_assigned_by uuid,
  p_access_mode text default 'full',
  p_custom_permissions jsonb default '[]'::jsonb,
  p_tenant_id text default null,
  p_organization_id text default null,
  p_global_permissions jsonb default '[]'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user public.app_users%rowtype;
  v_membership public.market_os_ambassador_module_memberships%rowtype;
  v_tenant text;
  v_organization text;
  v_mode text := coalesce(nullif(p_access_mode, ''), 'full');
  v_permissions jsonb := coalesce(p_custom_permissions, '[]'::jsonb);
  v_next_version bigint;
  v_role_key text;
begin
  if v_mode not in ('full','view_only','custom','none') then
    raise exception 'Invalid Ambassador access mode: %', v_mode using errcode = '22023';
  end if;
  if jsonb_typeof(v_permissions) <> 'array' then
    raise exception 'Custom Ambassador permissions must be an array' using errcode = '22023';
  end if;

  select * into v_user from public.app_users where id = p_app_user_id for update;
  if not found then raise exception 'Company user % was not found', p_app_user_id using errcode = '23503'; end if;

  select coalesce(p_tenant_id, v_user.tenant_id), coalesce(p_organization_id, v_user.organization_id)
    into v_tenant, v_organization;
  if v_tenant is null or v_organization is null then
    select r.tenant_id, r.organization_id into v_tenant, v_organization
    from public.market_os_ambassador_actor_roles r
    where r.app_user_id = p_app_user_id and r.status = 'active'
    order by r.updated_at desc limit 1;
  end if;
  if v_tenant is null or v_organization is null then
    select a.tenant_id::text, coalesce(a.organization_id, a.school_id)::text
      into v_tenant, v_organization
      from public.angelcare360_operator_tenant_access_accounts a
     where a.app_user_id = p_app_user_id and a.status = 'active'
     order by a.updated_at desc limit 1;
  end if;
  if v_tenant is null or v_organization is null then
    raise exception 'Ambassador tenant and organization scope are required for user %', p_app_user_id using errcode = '22023';
  end if;

  select coalesce(max(grant_version), 0) + 1 into v_next_version
  from public.market_os_ambassador_module_memberships
  where app_user_id = p_app_user_id and tenant_id = v_tenant and organization_id = v_organization and module_key = 'market_os_ambassadors';

  update public.app_users
  set permissions = coalesce(p_global_permissions, permissions), tenant_id = v_tenant, organization_id = v_organization, updated_at = now()
  where id = p_app_user_id;

  insert into public.market_os_ambassador_module_memberships
    (app_user_id, tenant_id, organization_id, access_mode, active, grant_permissions, grant_version, assigned_by, assigned_at, updated_at)
  values
    (p_app_user_id, v_tenant, v_organization, v_mode, v_mode <> 'none',
     case when v_mode = 'custom' then v_permissions else '[]'::jsonb end,
     v_next_version, p_assigned_by, now(), now())
  on conflict (app_user_id, tenant_id, organization_id, module_key) do update set
    access_mode = excluded.access_mode, active = excluded.active, grant_permissions = excluded.grant_permissions,
    grant_version = excluded.grant_version, assigned_by = excluded.assigned_by, updated_at = now();

  select * into v_membership from public.market_os_ambassador_module_memberships
  where app_user_id = p_app_user_id and tenant_id = v_tenant and organization_id = v_organization and module_key = 'market_os_ambassadors';

  update public.market_os_ambassador_actor_roles
  set status = 'revoked', updated_at = now()
  where app_user_id = p_app_user_id and tenant_id = v_tenant and organization_id = v_organization
    and status = 'active' and (module_membership_id is distinct from v_membership.id);

  v_role_key := case v_mode when 'full' then 'AMBASSADOR_MODULE_ADMINISTRATOR' when 'view_only' then 'AMBASSADOR_MODULE_VIEWER' when 'custom' then 'AMBASSADOR_MODULE_CUSTOM' else 'AMBASSADOR_MODULE_CUSTOM' end;
  insert into public.market_os_ambassador_actor_roles
    (auth_user_id, app_user_id, tenant_id, organization_id, role_key, display_name, status, module_membership_id, grant_version)
  values (null, p_app_user_id, v_tenant, v_organization, v_role_key, v_user.full_name, case when v_mode = 'none' then 'revoked' else 'active' end, v_membership.id, v_next_version)
  on conflict (app_user_id, tenant_id, organization_id, role_key) do update set
    display_name = excluded.display_name, status = excluded.status, module_membership_id = excluded.module_membership_id,
    grant_version = excluded.grant_version, updated_at = now();

  insert into public.market_os_ambassador_audit_logs
    (tenant_id, organization_id, entity_type, entity_id, action, summary, actor_name, payload, metadata)
  values (v_tenant, v_organization, 'module_membership', p_app_user_id::text,
    case when v_mode = 'none' then 'users_management_ambassadors_revoked' else 'users_management_ambassadors_synchronized' end,
    'Users Management and native Ambassador authorization synchronized', v_user.full_name,
    jsonb_build_object('access_mode', v_mode, 'grant_version', v_next_version, 'module', 'market_os_ambassadors', 'assigned_by', p_assigned_by),
    jsonb_build_object('source', 'users_management'));

  return jsonb_build_object('ok', true, 'app_user_id', p_app_user_id, 'tenant_id', v_tenant, 'organization_id', v_organization, 'access_mode', v_mode, 'grant_version', v_next_version, 'native_role_key', v_role_key);
end;
$$;

grant execute on function public.sync_market_os_ambassador_user_access(uuid, uuid, text, jsonb, text, text, jsonb) to service_role;
commit;
