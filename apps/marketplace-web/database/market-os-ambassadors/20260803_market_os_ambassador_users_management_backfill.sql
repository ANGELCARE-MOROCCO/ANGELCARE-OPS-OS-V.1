-- AngelCare Market OS Ambassadors — idempotent existing-user backfill
-- Requires 20260803_market_os_ambassador_users_management_sync.sql first.
begin;

do $$
declare
  user_row record;
  scope_row record;
  normalized_permissions jsonb;
begin
  for user_row in
    select u.id, u.permissions, u.tenant_id, u.organization_id
    from public.app_users u
    where u.status = 'active'
      and (
        coalesce(u.permissions, '[]'::jsonb) ? 'market_os.ambassadors.view'
        or coalesce(u.permissions, '[]'::jsonb) ? 'market_os_ambassadors.view'
      )
      and not exists (
        select 1
        from public.market_os_ambassador_module_memberships m
        where m.app_user_id = u.id
          and m.module_key = 'market_os_ambassadors'
          and m.active = true
          and m.access_mode = 'full'
      )
  loop
    select coalesce(user_row.tenant_id, r.tenant_id, a.tenant_id::text) as tenant_id,
           coalesce(user_row.organization_id, r.organization_id, a.organization_id::text, a.school_id::text) as organization_id
      into scope_row
      from public.app_users u
      left join lateral (
        select actor.tenant_id, actor.organization_id
        from public.market_os_ambassador_actor_roles actor
        where actor.app_user_id = u.id and actor.status = 'active'
        order by actor.updated_at desc limit 1
      ) r on true
      left join lateral (
        select account.tenant_id, account.organization_id, account.school_id
        from public.angelcare360_operator_tenant_access_accounts account
        where account.app_user_id = u.id and account.status = 'active'
        order by account.updated_at desc limit 1
      ) a on true
     where u.id = user_row.id;

    if coalesce(user_row.tenant_id, scope_row.tenant_id) is null
       or coalesce(user_row.organization_id, scope_row.organization_id) is null then
      raise notice 'Ambassador backfill skipped user %: tenant/organization scope is unresolved', user_row.id;
      continue;
    end if;

    normalized_permissions := (
      select coalesce(jsonb_agg(distinct permission), '[]'::jsonb)
      from jsonb_array_elements_text(coalesce(user_row.permissions, '[]'::jsonb)) as item(permission)
      where permission <> 'market_os_ambassadors.view'
    ) || '["market_os.ambassadors.view"]'::jsonb;

    perform public.sync_market_os_ambassador_user_access(
      user_row.id,
      null,
      'full',
      '[]'::jsonb,
      coalesce(user_row.tenant_id, scope_row.tenant_id),
      coalesce(user_row.organization_id, scope_row.organization_id),
      normalized_permissions
    );

    insert into public.market_os_ambassador_audit_logs
      (tenant_id, organization_id, entity_type, entity_id, action, summary, actor_name, payload, metadata)
    values (
      coalesce(user_row.tenant_id, scope_row.tenant_id),
      coalesce(user_row.organization_id, scope_row.organization_id),
      'module_membership', user_row.id::text, 'users_management_ambassadors_backfilled',
      'Existing Users Management Ambassador assignment backfilled to full native access',
      'system backfill', jsonb_build_object('access_mode', 'full', 'module', 'market_os_ambassadors'),
      jsonb_build_object('source', '20260803_market_os_ambassador_users_management_backfill')
    );
  end loop;
end;
$$;

commit;
