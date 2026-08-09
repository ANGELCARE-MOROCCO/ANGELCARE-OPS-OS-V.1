begin;

create or replace function
  public.market_os_ambassador_lifecycle_delete_now(
    p_entity_type text,
    p_entity_id text,
    p_tenant_id text,
    p_organization_id text,
    p_confirmation text,
    p_reason text,
    p_actor_app_user_id text,
    p_actor_display_name text
  )
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_entity_type text :=
    lower(trim(p_entity_type));

  v_primary_table regclass;
  v_entity jsonb;
  v_display_label text;

  v_ambassador_ids text[] :=
    array[]::text[];

  v_candidate_ids text[] :=
    array[]::text[];

  v_lead_ids text[] :=
    array[]::text[];

  v_relation record;
  v_column record;

  v_conditions text[];
  v_scope_conditions text[];

  v_sql text;
  v_count integer := 0;
  v_deleted_related integer := 0;
  v_deleted_primary integer := 0;
  v_pass integer;

  v_has_tenant boolean;
  v_has_organization boolean;
begin
  if v_entity_type not in (
    'ambassador',
    'candidate',
    'lead'
  ) then
    raise exception
      'Unsupported lifecycle entity type: %',
      p_entity_type;
  end if;

  v_primary_table :=
    public.market_os_ambassador_lifecycle_entity_table(
      v_entity_type
    );

  if v_primary_table is null then
    raise exception
      'Primary table does not exist for %',
      v_entity_type;
  end if;

  execute format(
    'select to_jsonb(t)
       from %s t
      where t.id::text = $1
        and t.tenant_id::text = $2
        and t.organization_id::text = $3
      limit 1',
    v_primary_table
  )
  into v_entity
  using
    p_entity_id,
    p_tenant_id,
    p_organization_id;

  if v_entity is null then
    raise exception
      'The selected scoped record was not found';
  end if;

  v_display_label :=
    coalesce(
      nullif(v_entity->>'full_name', ''),
      nullif(v_entity->>'display_name', ''),
      nullif(v_entity->>'candidate_name', ''),
      nullif(v_entity->>'lead_name', ''),
      nullif(v_entity->>'contact_name', ''),
      nullif(v_entity->>'name', ''),
      'Record ' || right(p_entity_id, 8)
    );

  if trim(p_confirmation) <>
     trim(v_display_label) then
    raise exception
      'Confirmation refused. Enter the exact record name: %',
      v_display_label;
  end if;

  if length(trim(p_reason)) < 5 then
    raise exception
      'A deletion reason is required';
  end if;

  if v_entity_type = 'ambassador' then
    v_ambassador_ids :=
      array[p_entity_id];

    if exists (
      select 1
      from pg_attribute
      where attrelid =
        'public.market_os_ambassadors'::regclass
        and attname = 'candidate_id'
        and attnum > 0
        and not attisdropped
    ) then
      execute
        'select coalesce(
           array_agg(distinct candidate_id::text)
             filter (where candidate_id is not null),
           array[]::text[]
         )
         from public.market_os_ambassadors
         where id::text = $1
           and tenant_id::text = $2
           and organization_id::text = $3'
      into v_candidate_ids
      using
        p_entity_id,
        p_tenant_id,
        p_organization_id;
    end if;
  end if;

  if v_entity_type = 'candidate' then
    v_candidate_ids :=
      array[p_entity_id];

    if to_regclass(
      'public.market_os_ambassadors'
    ) is not null
    and exists (
      select 1
      from pg_attribute
      where attrelid =
        'public.market_os_ambassadors'::regclass
        and attname = 'candidate_id'
        and attnum > 0
        and not attisdropped
    ) then
      execute
        'select coalesce(
           array_agg(id::text),
           array[]::text[]
         )
         from public.market_os_ambassadors
         where candidate_id::text = $1
           and tenant_id::text = $2
           and organization_id::text = $3'
      into v_ambassador_ids
      using
        p_entity_id,
        p_tenant_id,
        p_organization_id;
    end if;
  end if;

  if v_entity_type = 'lead' then
    v_lead_ids :=
      array[p_entity_id];
  end if;

  if to_regclass(
    'public.market_os_ambassador_leads'
  ) is not null
  and cardinality(v_ambassador_ids) > 0
  and exists (
    select 1
    from pg_attribute
    where attrelid =
      'public.market_os_ambassador_leads'::regclass
      and attname = 'ambassador_id'
      and attnum > 0
      and not attisdropped
  ) then
    execute
      'select coalesce(
         array_agg(id::text),
         array[]::text[]
       )
       from public.market_os_ambassador_leads
       where ambassador_id::text = any($1)
         and tenant_id::text = $2
         and organization_id::text = $3'
    into v_lead_ids
    using
      v_ambassador_ids,
      p_tenant_id,
      p_organization_id;
  end if;

  /*
   * Delete every scoped related row whose column name ends in:
   * ambassador_id, candidate_id or lead_id.
   *
   * Multiple passes allow child records to disappear before
   * parent records when foreign keys are restrictive.
   */
  for v_pass in 1..8 loop
    for v_relation in
      select
        c.oid::regclass as relation_id,
        c.relname
      from pg_class c
      join pg_namespace n
        on n.oid = c.relnamespace
      where n.nspname = 'public'
        and c.relkind in ('r', 'p')
        and c.relname not in (
          'market_os_ambassadors',
          'market_os_ambassador_recruitment',
          'market_os_ambassador_leads',
          'market_os_ambassador_actor_roles',
          'market_os_ambassador_role_permissions',
          'market_os_ambassador_lifecycle_states',
          'market_os_ambassador_lifecycle_requests',
          'market_os_ambassador_lifecycle_events',
          'market_os_ambassador_purge_ledger'
        )
        and c.relname not like
          'market_os_ambassadors_scope_backup_%'
    loop
      v_conditions :=
        array[]::text[];

      for v_column in
        select attname
        from pg_attribute
        where attrelid =
          v_relation.relation_id
          and attnum > 0
          and not attisdropped
          and (
            attname like '%ambassador_id'
            or attname like '%candidate_id'
            or attname like '%lead_id'
          )
      loop
        if v_column.attname like
           '%ambassador_id'
        and cardinality(
          v_ambassador_ids
        ) > 0 then
          v_conditions :=
            array_append(
              v_conditions,
              format(
                'd.%I::text = any($1)',
                v_column.attname
              )
            );
        end if;

        if v_column.attname like
           '%candidate_id'
        and cardinality(
          v_candidate_ids
        ) > 0 then
          v_conditions :=
            array_append(
              v_conditions,
              format(
                'd.%I::text = any($2)',
                v_column.attname
              )
            );
        end if;

        if v_column.attname like
           '%lead_id'
        and cardinality(
          v_lead_ids
        ) > 0 then
          v_conditions :=
            array_append(
              v_conditions,
              format(
                'd.%I::text = any($3)',
                v_column.attname
              )
            );
        end if;
      end loop;

      if cardinality(v_conditions) = 0 then
        continue;
      end if;

      select exists (
        select 1
        from pg_attribute
        where attrelid =
          v_relation.relation_id
          and attname = 'tenant_id'
          and attnum > 0
          and not attisdropped
      )
      into v_has_tenant;

      select exists (
        select 1
        from pg_attribute
        where attrelid =
          v_relation.relation_id
          and attname = 'organization_id'
          and attnum > 0
          and not attisdropped
      )
      into v_has_organization;

      v_scope_conditions :=
        array[]::text[];

      if v_has_tenant then
        v_scope_conditions :=
          array_append(
            v_scope_conditions,
            'd.tenant_id::text = $4'
          );
      end if;

      if v_has_organization then
        v_scope_conditions :=
          array_append(
            v_scope_conditions,
            'd.organization_id::text = $5'
          );
      end if;

      v_sql :=
        format(
          'delete from %s d
            where (%s)%s',
          v_relation.relation_id,
          array_to_string(
            v_conditions,
            ' or '
          ),
          case
            when cardinality(
              v_scope_conditions
            ) > 0
            then
              ' and ' ||
              array_to_string(
                v_scope_conditions,
                ' and '
              )
            else ''
          end
        );

      begin
        execute v_sql
        using
          v_ambassador_ids,
          v_candidate_ids,
          v_lead_ids,
          p_tenant_id,
          p_organization_id;

        get diagnostics
          v_count = row_count;

        v_deleted_related :=
          v_deleted_related +
          v_count;

      exception
        when foreign_key_violation then
          null;
      end;
    end loop;
  end loop;

  /*
   * Remove every lifecycle trace for the selected person.
   * Immutable triggers are disabled only inside this
   * transaction and restored before completion.
   */
  if exists (
    select 1
    from pg_trigger
    where tgrelid =
      'public.market_os_ambassador_lifecycle_events'::regclass
      and tgname =
        'market_os_ambassador_lifecycle_events_immutable'
      and not tgisinternal
  ) then
    alter table
      public.market_os_ambassador_lifecycle_events
    disable trigger
      market_os_ambassador_lifecycle_events_immutable;
  end if;

  if exists (
    select 1
    from pg_trigger
    where tgrelid =
      'public.market_os_ambassador_purge_ledger'::regclass
      and tgname =
        'market_os_ambassador_purge_ledger_immutable'
      and not tgisinternal
  ) then
    alter table
      public.market_os_ambassador_purge_ledger
    disable trigger
      market_os_ambassador_purge_ledger_immutable;
  end if;

  delete from
    public.market_os_ambassador_purge_ledger
  where request_id in (
    select id
    from
      public.market_os_ambassador_lifecycle_requests
    where tenant_id = p_tenant_id
      and organization_id =
        p_organization_id
      and (
        (
          entity_type = 'ambassador'
          and entity_id =
            any(v_ambassador_ids)
        )
        or (
          entity_type = 'candidate'
          and entity_id =
            any(v_candidate_ids)
        )
        or (
          entity_type = 'lead'
          and entity_id =
            any(v_lead_ids)
        )
      )
  );

  delete from
    public.market_os_ambassador_lifecycle_events
  where tenant_id = p_tenant_id
    and organization_id =
      p_organization_id
    and (
      (
        entity_type = 'ambassador'
        and entity_id =
          any(v_ambassador_ids)
      )
      or (
        entity_type = 'candidate'
        and entity_id =
          any(v_candidate_ids)
      )
      or (
        entity_type = 'lead'
        and entity_id =
          any(v_lead_ids)
      )
    );

  delete from
    public.market_os_ambassador_lifecycle_requests
  where tenant_id = p_tenant_id
    and organization_id =
      p_organization_id
    and (
      (
        entity_type = 'ambassador'
        and entity_id =
          any(v_ambassador_ids)
      )
      or (
        entity_type = 'candidate'
        and entity_id =
          any(v_candidate_ids)
      )
      or (
        entity_type = 'lead'
        and entity_id =
          any(v_lead_ids)
      )
    );

  delete from
    public.market_os_ambassador_lifecycle_states
  where tenant_id = p_tenant_id
    and organization_id =
      p_organization_id
    and (
      (
        entity_type = 'ambassador'
        and entity_id =
          any(v_ambassador_ids)
      )
      or (
        entity_type = 'candidate'
        and entity_id =
          any(v_candidate_ids)
      )
      or (
        entity_type = 'lead'
        and entity_id =
          any(v_lead_ids)
      )
    );

  alter table
    public.market_os_ambassador_lifecycle_events
  enable trigger
    market_os_ambassador_lifecycle_events_immutable;

  alter table
    public.market_os_ambassador_purge_ledger
  enable trigger
    market_os_ambassador_purge_ledger_immutable;

  /*
   * Delete the core records last.
   */
  if cardinality(v_lead_ids) > 0
  and to_regclass(
    'public.market_os_ambassador_leads'
  ) is not null then
    execute
      'delete from public.market_os_ambassador_leads
        where id::text = any($1)
          and tenant_id::text = $2
          and organization_id::text = $3'
    using
      v_lead_ids,
      p_tenant_id,
      p_organization_id;

    get diagnostics v_count = row_count;

    v_deleted_primary :=
      v_deleted_primary + v_count;
  end if;

  if cardinality(v_ambassador_ids) > 0
  and to_regclass(
    'public.market_os_ambassadors'
  ) is not null then
    execute
      'delete from public.market_os_ambassadors
        where id::text = any($1)
          and tenant_id::text = $2
          and organization_id::text = $3'
    using
      v_ambassador_ids,
      p_tenant_id,
      p_organization_id;

    get diagnostics v_count = row_count;

    v_deleted_primary :=
      v_deleted_primary + v_count;
  end if;

  if cardinality(v_candidate_ids) > 0
  and to_regclass(
    'public.market_os_ambassador_recruitment'
  ) is not null then
    execute
      'delete from public.market_os_ambassador_recruitment
        where id::text = any($1)
          and tenant_id::text = $2
          and organization_id::text = $3'
    using
      v_candidate_ids,
      p_tenant_id,
      p_organization_id;

    get diagnostics v_count = row_count;

    v_deleted_primary :=
      v_deleted_primary + v_count;
  end if;

  if v_deleted_primary = 0 then
    raise exception
      'No primary record was deleted';
  end if;

  return jsonb_build_object(
    'status',
      'deleted_permanently',

    'entityType',
      v_entity_type,

    'displayLabel',
      v_display_label,

    'deletedPrimaryRecords',
      v_deleted_primary,

    'deletedRelatedRecords',
      v_deleted_related,

    'deletedAt',
      now()
  );
end;
$$;

revoke all on function
  public.market_os_ambassador_lifecycle_delete_now(
    text,
    text,
    text,
    text,
    text,
    text,
    text,
    text
  )
from public, anon, authenticated;

grant execute on function
  public.market_os_ambassador_lifecycle_delete_now(
    text,
    text,
    text,
    text,
    text,
    text,
    text,
    text
  )
to service_role;

commit;
