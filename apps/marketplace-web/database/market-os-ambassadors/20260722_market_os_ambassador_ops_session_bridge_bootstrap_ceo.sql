-- ANGELCARE Market OS Ambassadors — guarded one-CEO / one-scope bootstrap
-- Run only after reviewing the selected rows printed by the preflight queries below.
-- This script deliberately fails when the production identity or scope is ambiguous.
begin;

do $$
declare
  v_user_count integer;
  v_user_id uuid;
  v_display_name text;
  v_scope_count integer;
  v_tenant_id text;
  v_organization_id text;
begin
  select count(*),
         (array_agg(id order by id))[1],
         (array_agg(coalesce(nullif(full_name, ''), nullif(email, ''), nullif(username, ''), id::text) order by id))[1]
    into v_user_count, v_user_id, v_display_name
  from public.app_users
  where lower(coalesce(status, '')) = 'active'
    and lower(coalesce(role, '')) in ('ceo', 'owner', 'super_admin');

  if v_user_count <> 1 then
    raise exception 'Guarded bootstrap requires exactly one active CEO/owner/super_admin app user; found %', v_user_count;
  end if;

  with scopes as (
    select distinct
      tenant_id::text as tenant_id,
      organization_id::text as organization_id
    from public.market_os_ambassador_actor_roles
    where status = 'active'
      and tenant_id is not null
      and organization_id is not null
    union
    select distinct
      tenant_id::text as tenant_id,
      organization_id::text as organization_id
    from public.market_os_ambassador_settings
    where tenant_id is not null
      and organization_id is not null
  )
  select count(*), min(tenant_id), min(organization_id)
    into v_scope_count, v_tenant_id, v_organization_id
  from scopes;

  if v_scope_count <> 1 then
    raise exception 'Guarded bootstrap requires exactly one Ambassador tenant/organization scope; found %', v_scope_count;
  end if;

  update public.market_os_ambassador_actor_roles
     set display_name = v_display_name,
         role_key = 'ambassador_admin',
         status = 'active',
         updated_at = now()
   where app_user_id = v_user_id
     and tenant_id = v_tenant_id
     and organization_id = v_organization_id;

  if not found then
    insert into public.market_os_ambassador_actor_roles (
      auth_user_id,
      app_user_id,
      tenant_id,
      organization_id,
      role_key,
      display_name,
      status
    ) values (
      null,
      v_user_id,
      v_tenant_id,
      v_organization_id,
      'ambassador_admin',
      v_display_name,
      'active'
    );
  end if;

  raise notice 'Mapped OpsOS app user % (%) to Ambassador scope % / % as ambassador_admin',
    v_display_name, v_user_id, v_tenant_id, v_organization_id;
end $$;

commit;
