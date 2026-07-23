begin;

create extension if not exists pgcrypto;

create table if not exists
  public.market_os_ambassador_lifecycle_states (
    id uuid primary key
      default gen_random_uuid(),

    tenant_id text not null,
    organization_id text not null,

    entity_type text not null
      check (
        entity_type in (
          'ambassador',
          'candidate',
          'lead'
        )
      ),

    entity_id text not null,

    lifecycle_state text not null
      check (
        lifecycle_state in (
          'active',
          'archived',
          'anonymized',
          'deleted'
        )
      ),

    previous_business_status text,
    reason text not null,

    changed_by_app_user_id text not null,
    changed_by_display_name text not null,

    archived_at timestamptz,
    restored_at timestamptz,
    anonymized_at timestamptz,
    deleted_at timestamptz,

    created_at timestamptz
      not null default now(),

    updated_at timestamptz
      not null default now(),

    unique (
      tenant_id,
      organization_id,
      entity_type,
      entity_id
    )
  );

create table if not exists
  public.market_os_ambassador_lifecycle_requests (
    id uuid primary key
      default gen_random_uuid(),

    tenant_id text not null,
    organization_id text not null,

    entity_type text not null
      check (
        entity_type in (
          'ambassador',
          'candidate',
          'lead'
        )
      ),

    entity_id text not null,
    entity_hash text not null,
    display_label text not null,

    requested_action text
      not null default 'permanent_delete'
      check (
        requested_action =
          'permanent_delete'
      ),

    reason_code text not null,
    reason_detail text not null,

    status text
      not null default 'requested'
      check (
        status in (
          'requested',
          'approved',
          'rejected',
          'blocked',
          'executing',
          'completed',
          'cancelled'
        )
      ),

    dependency_snapshot jsonb
      not null default '{}'::jsonb,

    entity_snapshot_hash text not null,
    idempotency_key text not null,

    requested_by_app_user_id text
      not null,

    requested_by_display_name text
      not null,

    approved_by_app_user_id text,
    approved_by_display_name text,
    approval_note text,
    approved_at timestamptz,

    rejected_by_app_user_id text,
    rejected_by_display_name text,
    rejection_note text,
    rejected_at timestamptz,

    executed_by_app_user_id text,
    executed_by_display_name text,
    executed_at timestamptz,

    execution_error text,

    created_at timestamptz
      not null default now(),

    updated_at timestamptz
      not null default now(),

    unique (
      tenant_id,
      organization_id,
      idempotency_key
    )
  );

create table if not exists
  public.market_os_ambassador_lifecycle_events (
    id uuid primary key
      default gen_random_uuid(),

    tenant_id text not null,
    organization_id text not null,

    entity_type text not null,
    entity_id text not null,

    request_id uuid,

    event_type text not null,

    actor_app_user_id text not null,
    actor_display_name text not null,

    details jsonb
      not null default '{}'::jsonb,

    created_at timestamptz
      not null default now()
  );

create table if not exists
  public.market_os_ambassador_purge_ledger (
    id uuid primary key
      default gen_random_uuid(),

    tenant_id text not null,
    organization_id text not null,

    request_id uuid not null unique
      references
        public.market_os_ambassador_lifecycle_requests(id)
      on delete restrict,

    entity_type text not null,
    entity_hash text not null,

    reason_code text not null,

    dependency_summary jsonb
      not null default '{}'::jsonb,

    requested_by_app_user_id text
      not null,

    approved_by_app_user_id text
      not null,

    executed_by_app_user_id text
      not null,

    executed_at timestamptz not null,

    ledger_hash text not null unique,

    created_at timestamptz
      not null default now()
  );

create index if not exists
  market_os_ambassador_lifecycle_states_scope_idx
on public.market_os_ambassador_lifecycle_states (
  tenant_id,
  organization_id,
  entity_type,
  lifecycle_state
);

create index if not exists
  market_os_ambassador_lifecycle_requests_scope_idx
on public.market_os_ambassador_lifecycle_requests (
  tenant_id,
  organization_id,
  status,
  created_at desc
);

create index if not exists
  market_os_ambassador_lifecycle_events_scope_idx
on public.market_os_ambassador_lifecycle_events (
  tenant_id,
  organization_id,
  created_at desc
);

create or replace function
  public.market_os_ambassador_lifecycle_immutable_guard()
returns trigger
language plpgsql
as $$
begin
  raise exception
    'Immutable Ambassador lifecycle evidence cannot be modified or deleted';
end;
$$;

drop trigger if exists
  market_os_ambassador_lifecycle_events_immutable
on public.market_os_ambassador_lifecycle_events;

create trigger
  market_os_ambassador_lifecycle_events_immutable
before update or delete
on public.market_os_ambassador_lifecycle_events
for each row
execute function
  public.market_os_ambassador_lifecycle_immutable_guard();

drop trigger if exists
  market_os_ambassador_purge_ledger_immutable
on public.market_os_ambassador_purge_ledger;

create trigger
  market_os_ambassador_purge_ledger_immutable
before update or delete
on public.market_os_ambassador_purge_ledger
for each row
execute function
  public.market_os_ambassador_lifecycle_immutable_guard();

create or replace function
  public.market_os_ambassador_lifecycle_entity_table(
    p_entity_type text
  )
returns regclass
language plpgsql
stable
as $$
declare
  v_relation text;
begin
  v_relation :=
    case lower(trim(p_entity_type))
      when 'ambassador'
        then 'public.market_os_ambassadors'

      when 'candidate'
        then 'public.market_os_ambassador_recruitment'

      when 'lead'
        then 'public.market_os_ambassador_leads'

      else null
    end;

  if v_relation is null then
    raise exception
      'Unsupported lifecycle entity type: %',
      p_entity_type;
  end if;

  return to_regclass(v_relation);
end;
$$;

create or replace function
  public.market_os_ambassador_lifecycle_dependency(
    p_table_name text,
    p_foreign_key text,
    p_dependency_key text,
    p_dependency_label text,
    p_entity_id text,
    p_tenant_id text,
    p_organization_id text
  )
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_table regclass;
  v_count bigint := 0;

  v_has_foreign_key boolean;
  v_has_tenant boolean;
  v_has_organization boolean;

  v_scope_sql text := '';
begin
  v_table :=
    to_regclass(
      'public.' || p_table_name
    );

  if v_table is null then
    return jsonb_build_object(
      'key', p_dependency_key,
      'label', p_dependency_label,
      'table', p_table_name,
      'available', false,
      'count', 0,
      'blocking', false
    );
  end if;

  select exists (
    select 1
    from pg_attribute
    where attrelid = v_table
      and attname = p_foreign_key
      and attnum > 0
      and not attisdropped
  )
  into v_has_foreign_key;

  if not v_has_foreign_key then
    return jsonb_build_object(
      'key', p_dependency_key,
      'label', p_dependency_label,
      'table', p_table_name,
      'available', false,
      'count', 0,
      'blocking', false
    );
  end if;

  select exists (
    select 1
    from pg_attribute
    where attrelid = v_table
      and attname = 'tenant_id'
      and attnum > 0
      and not attisdropped
  )
  into v_has_tenant;

  select exists (
    select 1
    from pg_attribute
    where attrelid = v_table
      and attname = 'organization_id'
      and attnum > 0
      and not attisdropped
  )
  into v_has_organization;

  if v_has_tenant then
    v_scope_sql :=
      v_scope_sql ||
      ' and d.tenant_id::text = $2';
  end if;

  if v_has_organization then
    v_scope_sql :=
      v_scope_sql ||
      ' and d.organization_id::text = $3';
  end if;

  execute format(
    'select count(*)
       from %s d
      where d.%I::text = $1%s',
    v_table,
    p_foreign_key,
    v_scope_sql
  )
  into v_count
  using
    p_entity_id,
    p_tenant_id,
    p_organization_id;

  return jsonb_build_object(
    'key', p_dependency_key,
    'label', p_dependency_label,
    'table', p_table_name,
    'available', true,
    'count', v_count,
    'blocking', v_count > 0
  );
end;
$$;

create or replace function
  public.market_os_ambassador_lifecycle_inventory(
    p_entity_type text,
    p_tenant_id text,
    p_organization_id text
  )
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_table regclass;
  v_inventory jsonb;
begin
  v_table :=
    public.market_os_ambassador_lifecycle_entity_table(
      p_entity_type
    );

  if v_table is null then
    return '[]'::jsonb;
  end if;

  execute format(
    $query$
      select coalesce(
        jsonb_agg(
          jsonb_build_object(
            'id',
              t.id::text,

            'label',
              coalesce(
                nullif(
                  to_jsonb(t)->>'full_name',
                  ''
                ),
                nullif(
                  to_jsonb(t)->>'display_name',
                  ''
                ),
                nullif(
                  to_jsonb(t)->>'candidate_name',
                  ''
                ),
                nullif(
                  to_jsonb(t)->>'lead_name',
                  ''
                ),
                nullif(
                  to_jsonb(t)->>'contact_name',
                  ''
                ),
                nullif(
                  to_jsonb(t)->>'name',
                  ''
                ),
                'Record ' ||
                  right(t.id::text, 8)
              ),

            'businessStatus',
              coalesce(
                nullif(
                  to_jsonb(t)->>'status',
                  ''
                ),
                nullif(
                  to_jsonb(t)->>'stage',
                  ''
                ),
                'active'
              ),

            'lifecycleState',
              coalesce(
                s.lifecycle_state,
                'active'
              ),

            'email',
              coalesce(
                to_jsonb(t)->>'email',
                ''
              ),

            'phone',
              coalesce(
                to_jsonb(t)->>'phone',
                to_jsonb(t)->>'whatsapp',
                ''
              ),

            'city',
              coalesce(
                to_jsonb(t)->>'city',
                to_jsonb(t)->>'main_city',
                ''
              ),

            'reference',
              coalesce(
                to_jsonb(t)->>'reference',
                to_jsonb(t)->>'code',
                ''
              ),

            'createdAt',
              coalesce(
                to_jsonb(t)->>'created_at',
                ''
              )
          )
          order by coalesce(
            to_jsonb(t)->>'updated_at',
            to_jsonb(t)->>'created_at',
            ''
          ) desc
        ),
        '[]'::jsonb
      )
      from %s t

      left join
        public.market_os_ambassador_lifecycle_states s
        on s.tenant_id = $1
       and s.organization_id = $2
       and s.entity_type = $3
       and s.entity_id = t.id::text

      where t.tenant_id::text = $1
        and t.organization_id::text = $2
    $query$,
    v_table
  )
  into v_inventory
  using
    p_tenant_id,
    p_organization_id,
    lower(trim(p_entity_type));

  return coalesce(
    v_inventory,
    '[]'::jsonb
  );
end;
$$;

create or replace function
  public.market_os_ambassador_lifecycle_preview(
    p_entity_type text,
    p_entity_id text,
    p_tenant_id text,
    p_organization_id text
  )
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_table regclass;
  v_entity jsonb;
  v_dependencies jsonb := '[]'::jsonb;
  v_dependency jsonb;
  v_blocker_count bigint := 0;
  v_state text;
begin
  v_table :=
    public.market_os_ambassador_lifecycle_entity_table(
      p_entity_type
    );

  if v_table is null then
    raise exception
      'The primary table for % does not exist',
      p_entity_type;
  end if;

  execute format(
    'select to_jsonb(t)
       from %s t
      where t.id::text = $1
        and t.tenant_id::text = $2
        and t.organization_id::text = $3
      limit 1',
    v_table
  )
  into v_entity
  using
    p_entity_id,
    p_tenant_id,
    p_organization_id;

  if v_entity is null then
    raise exception
      'Scoped % record % was not found',
      p_entity_type,
      p_entity_id;
  end if;

  select lifecycle_state
  into v_state
  from public.market_os_ambassador_lifecycle_states
  where tenant_id = p_tenant_id
    and organization_id =
      p_organization_id
    and entity_type =
      lower(trim(p_entity_type))
    and entity_id = p_entity_id;

  if lower(trim(p_entity_type)) =
     'ambassador' then

    foreach v_dependency in array array[
      public.market_os_ambassador_lifecycle_dependency(
        'market_os_ambassador_mission_assignments',
        'ambassador_id',
        'missions',
        'Mission assignments',
        p_entity_id,
        p_tenant_id,
        p_organization_id
      ),

      public.market_os_ambassador_lifecycle_dependency(
        'market_os_ambassador_territory_assignment_history',
        'ambassador_id',
        'territories',
        'Territory history',
        p_entity_id,
        p_tenant_id,
        p_organization_id
      ),

      public.market_os_ambassador_lifecycle_dependency(
        'market_os_ambassador_leads',
        'ambassador_id',
        'leads',
        'Attributed leads',
        p_entity_id,
        p_tenant_id,
        p_organization_id
      ),

      public.market_os_ambassador_lifecycle_dependency(
        'market_os_ambassador_conversions',
        'ambassador_id',
        'conversions',
        'Validated conversions',
        p_entity_id,
        p_tenant_id,
        p_organization_id
      ),

      public.market_os_ambassador_lifecycle_dependency(
        'market_os_ambassador_proofs',
        'ambassador_id',
        'proofs',
        'Operational proofs',
        p_entity_id,
        p_tenant_id,
        p_organization_id
      ),

      public.market_os_ambassador_lifecycle_dependency(
        'market_os_ambassador_incentives',
        'ambassador_id',
        'rewards',
        'Rewards and incentives',
        p_entity_id,
        p_tenant_id,
        p_organization_id
      ),

      public.market_os_ambassador_lifecycle_dependency(
        'market_os_ambassador_payouts',
        'ambassador_id',
        'payouts',
        'Payout records',
        p_entity_id,
        p_tenant_id,
        p_organization_id
      ),

      public.market_os_ambassador_lifecycle_dependency(
        'market_os_ambassador_onboarding',
        'ambassador_id',
        'onboarding',
        'Onboarding records',
        p_entity_id,
        p_tenant_id,
        p_organization_id
      )
    ]
    loop
      v_dependencies :=
        v_dependencies ||
        jsonb_build_array(
          v_dependency
        );

      if coalesce(
        (v_dependency->>'blocking')::boolean,
        false
      ) then
        v_blocker_count :=
          v_blocker_count +
          coalesce(
            (v_dependency->>'count')::bigint,
            0
          );
      end if;
    end loop;
  end if;

  if lower(trim(p_entity_type)) =
     'candidate' then

    foreach v_dependency in array array[
      public.market_os_ambassador_lifecycle_dependency(
        'market_os_ambassadors',
        'candidate_id',
        'converted_ambassadors',
        'Converted Ambassador profile',
        p_entity_id,
        p_tenant_id,
        p_organization_id
      ),

      public.market_os_ambassador_lifecycle_dependency(
        'market_os_ambassador_onboarding',
        'candidate_id',
        'onboarding',
        'Onboarding records',
        p_entity_id,
        p_tenant_id,
        p_organization_id
      ),

      public.market_os_ambassador_lifecycle_dependency(
        'market_os_ambassador_training_records',
        'candidate_id',
        'training',
        'Training and certification records',
        p_entity_id,
        p_tenant_id,
        p_organization_id
      )
    ]
    loop
      v_dependencies :=
        v_dependencies ||
        jsonb_build_array(
          v_dependency
        );

      if coalesce(
        (v_dependency->>'blocking')::boolean,
        false
      ) then
        v_blocker_count :=
          v_blocker_count +
          coalesce(
            (v_dependency->>'count')::bigint,
            0
          );
      end if;
    end loop;
  end if;

  if lower(trim(p_entity_type)) =
     'lead' then

    foreach v_dependency in array array[
      public.market_os_ambassador_lifecycle_dependency(
        'market_os_ambassador_conversions',
        'lead_id',
        'conversions',
        'Validated conversions',
        p_entity_id,
        p_tenant_id,
        p_organization_id
      ),

      public.market_os_ambassador_lifecycle_dependency(
        'market_os_ambassador_proofs',
        'lead_id',
        'proofs',
        'Conversion proofs',
        p_entity_id,
        p_tenant_id,
        p_organization_id
      ),

      public.market_os_ambassador_lifecycle_dependency(
        'market_os_ambassador_incentives',
        'lead_id',
        'rewards',
        'Reward records',
        p_entity_id,
        p_tenant_id,
        p_organization_id
      ),

      public.market_os_ambassador_lifecycle_dependency(
        'market_os_ambassador_payouts',
        'lead_id',
        'payouts',
        'Payout records',
        p_entity_id,
        p_tenant_id,
        p_organization_id
      )
    ]
    loop
      v_dependencies :=
        v_dependencies ||
        jsonb_build_array(
          v_dependency
        );

      if coalesce(
        (v_dependency->>'blocking')::boolean,
        false
      ) then
        v_blocker_count :=
          v_blocker_count +
          coalesce(
            (v_dependency->>'count')::bigint,
            0
          );
      end if;
    end loop;
  end if;

  return jsonb_build_object(
    'entityType',
      lower(trim(p_entity_type)),

    'entityId',
      p_entity_id,

    'entity',
      v_entity,

    'lifecycleState',
      coalesce(v_state, 'active'),

    'dependencies',
      v_dependencies,

    'blockerCount',
      v_blocker_count,

    'canPermanentDelete',
      v_blocker_count = 0,

    'recommendedAction',
      case
        when v_blocker_count = 0
          then 'permanent_delete'
        else 'anonymize_or_archive'
      end,

    'snapshotHash',
      encode(
        extensions.digest(
          v_entity::text,
          'sha256'
        ),
        'hex'
      ),

    'generatedAt',
      now()
  );
end;
$$;

create or replace function
  public.market_os_ambassador_lifecycle_set_state(
    p_entity_type text,
    p_entity_id text,
    p_tenant_id text,
    p_organization_id text,
    p_action text,
    p_reason text,
    p_actor_app_user_id text,
    p_actor_display_name text
  )
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_table regclass;
  v_preview jsonb;

  v_previous_status text;
  v_target_state text;

  v_assignments text[] :=
    array[]::text[];

  v_column record;

  v_anonymous_reference text;
begin
  if p_action not in (
    'archive',
    'restore',
    'anonymize'
  ) then
    raise exception
      'Unsupported lifecycle state action: %',
      p_action;
  end if;

  v_preview :=
    public.market_os_ambassador_lifecycle_preview(
      p_entity_type,
      p_entity_id,
      p_tenant_id,
      p_organization_id
    );

  v_table :=
    public.market_os_ambassador_lifecycle_entity_table(
      p_entity_type
    );

  v_previous_status :=
    coalesce(
      v_preview->'entity'->>'status',
      v_preview->'entity'->>'stage',
      'active'
    );

  v_target_state :=
    case p_action
      when 'archive'
        then 'archived'

      when 'restore'
        then 'active'

      else 'anonymized'
    end;

  if p_action = 'anonymize' then
    v_anonymous_reference :=
      'ANON-' ||
      upper(
        right(
          encode(
            extensions.digest(
              p_entity_id,
              'sha256'
            ),
            'hex'
          ),
          10
        )
      );

    for v_column in
      select
        attname as column_name,
        format_type(
          atttypid,
          atttypmod
        ) as column_type

      from pg_attribute

      where attrelid = v_table
        and attnum > 0
        and not attisdropped

        and attname in (
          'full_name',
          'display_name',
          'candidate_name',
          'lead_name',
          'contact_name',
          'name',
          'email',
          'phone',
          'telephone',
          'mobile',
          'whatsapp',
          'address',
          'approx_address',
          'notes',
          'profile_notes'
        )

        and format_type(
          atttypid,
          atttypmod
        ) in (
          'text',
          'character varying',
          'character'
        )
    loop
      v_assignments :=
        array_append(
          v_assignments,
          format(
            '%I = %L',
            v_column.column_name,
            case
              when v_column.column_name =
                   'email'
                then lower(
                  v_anonymous_reference
                ) ||
                '@invalid.angelcare'

              when v_column.column_name in (
                'phone',
                'telephone',
                'mobile',
                'whatsapp'
              )
                then 'ANONYMIZED'

              when v_column.column_name in (
                'address',
                'approx_address'
              )
                then 'ANONYMIZED'

              when v_column.column_name in (
                'notes',
                'profile_notes'
              )
                then
                  '[ANONYMIZED BY CONTROLLED DATA LIFECYCLE]'

              else v_anonymous_reference
            end
          )
        );
    end loop;

    if exists (
      select 1
      from pg_attribute
      where attrelid = v_table
        and attname = 'updated_at'
        and attnum > 0
        and not attisdropped
    ) then
      v_assignments :=
        array_append(
          v_assignments,
          'updated_at = clock_timestamp()'
        );
    end if;

    if cardinality(v_assignments) > 0 then
      execute format(
        'update %s
            set %s
          where id::text = $1
            and tenant_id::text = $2
            and organization_id::text = $3',
        v_table,
        array_to_string(
          v_assignments,
          ', '
        )
      )
      using
        p_entity_id,
        p_tenant_id,
        p_organization_id;
    end if;
  end if;

  insert into
    public.market_os_ambassador_lifecycle_states (
      tenant_id,
      organization_id,
      entity_type,
      entity_id,
      lifecycle_state,
      previous_business_status,
      reason,
      changed_by_app_user_id,
      changed_by_display_name,
      archived_at,
      restored_at,
      anonymized_at,
      updated_at
    )
  values (
    p_tenant_id,
    p_organization_id,
    lower(trim(p_entity_type)),
    p_entity_id,
    v_target_state,
    case
      when p_action = 'archive'
        then v_previous_status
      else null
    end,
    p_reason,
    p_actor_app_user_id,
    p_actor_display_name,
    case
      when p_action = 'archive'
        then now()
    end,
    case
      when p_action = 'restore'
        then now()
    end,
    case
      when p_action = 'anonymize'
        then now()
    end,
    now()
  )
  on conflict (
    tenant_id,
    organization_id,
    entity_type,
    entity_id
  )
  do update set
    lifecycle_state =
      excluded.lifecycle_state,

    previous_business_status =
      coalesce(
        excluded.previous_business_status,
        public.market_os_ambassador_lifecycle_states.previous_business_status
      ),

    reason = excluded.reason,

    changed_by_app_user_id =
      excluded.changed_by_app_user_id,

    changed_by_display_name =
      excluded.changed_by_display_name,

    archived_at =
      excluded.archived_at,

    restored_at =
      excluded.restored_at,

    anonymized_at =
      excluded.anonymized_at,

    updated_at = now();

  insert into
    public.market_os_ambassador_lifecycle_events (
      tenant_id,
      organization_id,
      entity_type,
      entity_id,
      event_type,
      actor_app_user_id,
      actor_display_name,
      details
    )
  values (
    p_tenant_id,
    p_organization_id,
    lower(trim(p_entity_type)),
    p_entity_id,
    p_action,
    p_actor_app_user_id,
    p_actor_display_name,
    jsonb_build_object(
      'reason',
        p_reason,

      'previousBusinessStatus',
        v_previous_status,

      'newLifecycleState',
        v_target_state
    )
  );

  return jsonb_build_object(
    'entityType',
      lower(trim(p_entity_type)),

    'entityId',
      p_entity_id,

    'action',
      p_action,

    'lifecycleState',
      v_target_state,

    'completedAt',
      now()
  );
end;
$$;

create or replace function
  public.market_os_ambassador_lifecycle_request_delete(
    p_entity_type text,
    p_entity_id text,
    p_tenant_id text,
    p_organization_id text,
    p_reason_code text,
    p_reason_detail text,
    p_idempotency_key text,
    p_actor_app_user_id text,
    p_actor_display_name text
  )
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_preview jsonb;

  v_request
    public.market_os_ambassador_lifecycle_requests%rowtype;

  v_label text;
begin
  v_preview :=
    public.market_os_ambassador_lifecycle_preview(
      p_entity_type,
      p_entity_id,
      p_tenant_id,
      p_organization_id
    );

  if not coalesce(
    (
      v_preview->
        'canPermanentDelete'
    )::boolean,
    false
  ) then
    raise exception
      'Permanent deletion is blocked by % linked record(s). Archive or anonymize instead.',
      coalesce(
        (
          v_preview->
            'blockerCount'
        )::bigint,
        0
      );
  end if;

  v_label :=
    coalesce(
      nullif(
        v_preview->'entity'->>'full_name',
        ''
      ),
      nullif(
        v_preview->'entity'->>'display_name',
        ''
      ),
      nullif(
        v_preview->'entity'->>'candidate_name',
        ''
      ),
      nullif(
        v_preview->'entity'->>'lead_name',
        ''
      ),
      nullif(
        v_preview->'entity'->>'contact_name',
        ''
      ),
      nullif(
        v_preview->'entity'->>'name',
        ''
      ),
      'Record ' ||
        right(p_entity_id, 8)
    );

  insert into
    public.market_os_ambassador_lifecycle_requests (
      tenant_id,
      organization_id,
      entity_type,
      entity_id,
      entity_hash,
      display_label,
      reason_code,
      reason_detail,
      dependency_snapshot,
      entity_snapshot_hash,
      idempotency_key,
      requested_by_app_user_id,
      requested_by_display_name
    )
  values (
    p_tenant_id,
    p_organization_id,
    lower(trim(p_entity_type)),
    p_entity_id,

    encode(
      extensions.digest(
        concat_ws(
          ':',
          p_tenant_id,
          p_organization_id,
          lower(trim(p_entity_type)),
          p_entity_id
        ),
        'sha256'
      ),
      'hex'
    ),

    v_label,
    p_reason_code,
    p_reason_detail,
    v_preview,
    v_preview->>'snapshotHash',
    p_idempotency_key,
    p_actor_app_user_id,
    p_actor_display_name
  )
  on conflict (
    tenant_id,
    organization_id,
    idempotency_key
  )
  do update set
    updated_at = now()
  returning *
  into v_request;

  insert into
    public.market_os_ambassador_lifecycle_events (
      tenant_id,
      organization_id,
      entity_type,
      entity_id,
      request_id,
      event_type,
      actor_app_user_id,
      actor_display_name,
      details
    )
  values (
    p_tenant_id,
    p_organization_id,
    lower(trim(p_entity_type)),
    p_entity_id,
    v_request.id,
    'deletion_requested',
    p_actor_app_user_id,
    p_actor_display_name,
    jsonb_build_object(
      'reasonCode',
        p_reason_code,

      'reasonDetail',
        p_reason_detail,

      'snapshotHash',
        v_request.entity_snapshot_hash
    )
  );

  return to_jsonb(v_request);
end;
$$;

create or replace function
  public.market_os_ambassador_lifecycle_decide_request(
    p_request_id text,
    p_tenant_id text,
    p_organization_id text,
    p_decision text,
    p_note text,
    p_actor_app_user_id text,
    p_actor_display_name text
  )
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request
    public.market_os_ambassador_lifecycle_requests%rowtype;
begin
  if p_decision not in (
    'approved',
    'rejected'
  ) then
    raise exception
      'Unsupported deletion decision';
  end if;

  select *
  into v_request

  from public.market_os_ambassador_lifecycle_requests

  where id::text = p_request_id
    and tenant_id = p_tenant_id
    and organization_id =
      p_organization_id

  for update;

  if not found then
    raise exception
      'Deletion request was not found';
  end if;

  if v_request.status <>
     'requested' then
    raise exception
      'Only requested deletions may be decided. Current status: %',
      v_request.status;
  end if;

  if v_request.requested_by_app_user_id =
     p_actor_app_user_id then
    raise exception
      'Separation of duties: the requester cannot approve or reject their own deletion request';
  end if;

  if p_decision = 'approved' then
    update
      public.market_os_ambassador_lifecycle_requests

    set
      status = 'approved',
      approved_by_app_user_id =
        p_actor_app_user_id,
      approved_by_display_name =
        p_actor_display_name,
      approval_note = p_note,
      approved_at = now(),
      updated_at = now()

    where id = v_request.id

    returning *
    into v_request;
  else
    update
      public.market_os_ambassador_lifecycle_requests

    set
      status = 'rejected',
      rejected_by_app_user_id =
        p_actor_app_user_id,
      rejected_by_display_name =
        p_actor_display_name,
      rejection_note = p_note,
      rejected_at = now(),
      updated_at = now()

    where id = v_request.id

    returning *
    into v_request;
  end if;

  insert into
    public.market_os_ambassador_lifecycle_events (
      tenant_id,
      organization_id,
      entity_type,
      entity_id,
      request_id,
      event_type,
      actor_app_user_id,
      actor_display_name,
      details
    )
  values (
    v_request.tenant_id,
    v_request.organization_id,
    v_request.entity_type,
    v_request.entity_id,
    v_request.id,
    'deletion_' || p_decision,
    p_actor_app_user_id,
    p_actor_display_name,
    jsonb_build_object(
      'note',
      p_note
    )
  );

  return to_jsonb(v_request);
end;
$$;

create or replace function
  public.market_os_ambassador_lifecycle_execute_delete(
    p_request_id text,
    p_tenant_id text,
    p_organization_id text,
    p_confirmation text,
    p_actor_app_user_id text,
    p_actor_display_name text
  )
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request
    public.market_os_ambassador_lifecycle_requests%rowtype;

  v_preview jsonb;
  v_table regclass;

  v_deleted integer;
  v_ledger_hash text;
begin
  select *
  into v_request

  from public.market_os_ambassador_lifecycle_requests

  where id::text = p_request_id
    and tenant_id = p_tenant_id
    and organization_id =
      p_organization_id

  for update;

  if not found then
    raise exception
      'Deletion request was not found';
  end if;

  if v_request.status <>
     'approved' then
    raise exception
      'Deletion request must be approved before execution. Current status: %',
      v_request.status;
  end if;

  if v_request.requested_by_app_user_id =
     p_actor_app_user_id then
    raise exception
      'Separation of duties: the requester cannot execute the purge';
  end if;

  if v_request.approved_by_app_user_id =
     p_actor_app_user_id then
    raise exception
      'Separation of duties: the approver cannot execute the purge';
  end if;

  if p_confirmation <>
     (
       'DELETE-' ||
       upper(
         right(
           v_request.entity_id,
           8
         )
       )
     ) then
    raise exception
      'The permanent deletion confirmation code is invalid';
  end if;

  v_preview :=
    public.market_os_ambassador_lifecycle_preview(
      v_request.entity_type,
      v_request.entity_id,
      v_request.tenant_id,
      v_request.organization_id
    );

  if not coalesce(
    (
      v_preview->
        'canPermanentDelete'
    )::boolean,
    false
  ) then
    raise exception
      'Dependencies changed after approval. Permanent deletion is blocked.';
  end if;

  if v_preview->>'snapshotHash' <>
     v_request.entity_snapshot_hash then
    raise exception
      'The target record changed after approval. A new deletion request is required.';
  end if;

  v_table :=
    public.market_os_ambassador_lifecycle_entity_table(
      v_request.entity_type
    );

  update
    public.market_os_ambassador_lifecycle_requests

  set
    status = 'executing',
    updated_at = now()

  where id = v_request.id;

  execute format(
    'delete from %s
      where id::text = $1
        and tenant_id::text = $2
        and organization_id::text = $3',
    v_table
  )
  using
    v_request.entity_id,
    v_request.tenant_id,
    v_request.organization_id;

  get diagnostics
    v_deleted = row_count;

  if v_deleted <> 1 then
    raise exception
      'Expected to delete exactly one primary record; deleted %',
      v_deleted;
  end if;

  update
    public.market_os_ambassador_lifecycle_requests

  set
    status = 'completed',
    executed_by_app_user_id =
      p_actor_app_user_id,
    executed_by_display_name =
      p_actor_display_name,
    executed_at = now(),
    execution_error = null,
    updated_at = now()

  where id = v_request.id

  returning *
  into v_request;

  insert into
    public.market_os_ambassador_lifecycle_states (
      tenant_id,
      organization_id,
      entity_type,
      entity_id,
      lifecycle_state,
      previous_business_status,
      reason,
      changed_by_app_user_id,
      changed_by_display_name,
      deleted_at,
      updated_at
    )
  values (
    v_request.tenant_id,
    v_request.organization_id,
    v_request.entity_type,
    v_request.entity_id,
    'deleted',
    null,
    v_request.reason_detail,
    p_actor_app_user_id,
    p_actor_display_name,
    now(),
    now()
  )
  on conflict (
    tenant_id,
    organization_id,
    entity_type,
    entity_id
  )
  do update set
    lifecycle_state = 'deleted',
    reason = excluded.reason,

    changed_by_app_user_id =
      excluded.changed_by_app_user_id,

    changed_by_display_name =
      excluded.changed_by_display_name,

    deleted_at = now(),
    updated_at = now();

  v_ledger_hash :=
    encode(
      extensions.digest(
        concat_ws(
          ':',
          v_request.id::text,
          v_request.entity_hash,
          v_request.requested_by_app_user_id,
          v_request.approved_by_app_user_id,
          p_actor_app_user_id,
          now()::text
        ),
        'sha256'
      ),
      'hex'
    );

  insert into
    public.market_os_ambassador_purge_ledger (
      tenant_id,
      organization_id,
      request_id,
      entity_type,
      entity_hash,
      reason_code,
      dependency_summary,
      requested_by_app_user_id,
      approved_by_app_user_id,
      executed_by_app_user_id,
      executed_at,
      ledger_hash
    )
  values (
    v_request.tenant_id,
    v_request.organization_id,
    v_request.id,
    v_request.entity_type,
    v_request.entity_hash,
    v_request.reason_code,
    v_preview,
    v_request.requested_by_app_user_id,
    v_request.approved_by_app_user_id,
    p_actor_app_user_id,
    v_request.executed_at,
    v_ledger_hash
  );

  insert into
    public.market_os_ambassador_lifecycle_events (
      tenant_id,
      organization_id,
      entity_type,
      entity_id,
      request_id,
      event_type,
      actor_app_user_id,
      actor_display_name,
      details
    )
  values (
    v_request.tenant_id,
    v_request.organization_id,
    v_request.entity_type,
    v_request.entity_id,
    v_request.id,
    'permanent_deletion_completed',
    p_actor_app_user_id,
    p_actor_display_name,
    jsonb_build_object(
      'ledgerHash',
        v_ledger_hash,

      'reasonCode',
        v_request.reason_code
    )
  );

  return jsonb_build_object(
    'requestId',
      v_request.id,

    'entityType',
      v_request.entity_type,

    'entityHash',
      v_request.entity_hash,

    'status',
      'completed',

    'ledgerHash',
      v_ledger_hash,

    'executedAt',
      v_request.executed_at
  );
end;
$$;

insert into
  public.market_os_ambassador_role_permissions (
    role_key,
    permission_key,
    enabled
  )
values
  (
    'ambassador_admin',
    'ambassadors.lifecycle.read',
    true
  ),
  (
    'ambassador_admin',
    'ambassadors.archive',
    true
  ),
  (
    'ambassador_admin',
    'ambassadors.restore',
    true
  ),
  (
    'ambassador_admin',
    'ambassadors.anonymize',
    true
  ),
  (
    'ambassador_admin',
    'ambassadors.delete.request',
    true
  ),
  (
    'ambassador_admin',
    'ambassadors.delete.approve',
    true
  ),
  (
    'ambassador_admin',
    'ambassadors.delete.execute',
    true
  )
on conflict (
  role_key,
  permission_key
)
do update set
  enabled = true,
  updated_at = now();

alter table
  public.market_os_ambassador_lifecycle_states
enable row level security;

alter table
  public.market_os_ambassador_lifecycle_requests
enable row level security;

alter table
  public.market_os_ambassador_lifecycle_events
enable row level security;

alter table
  public.market_os_ambassador_purge_ledger
enable row level security;

revoke all on
  public.market_os_ambassador_lifecycle_states,
  public.market_os_ambassador_lifecycle_requests,
  public.market_os_ambassador_lifecycle_events,
  public.market_os_ambassador_purge_ledger
from anon;

revoke insert, update, delete on
  public.market_os_ambassador_lifecycle_states,
  public.market_os_ambassador_lifecycle_requests,
  public.market_os_ambassador_lifecycle_events,
  public.market_os_ambassador_purge_ledger
from authenticated;

grant select on
  public.market_os_ambassador_lifecycle_states,
  public.market_os_ambassador_lifecycle_requests,
  public.market_os_ambassador_lifecycle_events,
  public.market_os_ambassador_purge_ledger
to authenticated;

drop policy if exists
  market_os_ambassador_lifecycle_states_read
on public.market_os_ambassador_lifecycle_states;

create policy
  market_os_ambassador_lifecycle_states_read
on public.market_os_ambassador_lifecycle_states
for select
to authenticated
using (
  exists (
    select 1

    from public.market_os_ambassador_actor_roles ar

    where ar.auth_user_id = auth.uid()
      and ar.status = 'active'

      and ar.tenant_id::text =
        market_os_ambassador_lifecycle_states.tenant_id

      and ar.organization_id::text =
        market_os_ambassador_lifecycle_states.organization_id
  )
);

drop policy if exists
  market_os_ambassador_lifecycle_requests_read
on public.market_os_ambassador_lifecycle_requests;

create policy
  market_os_ambassador_lifecycle_requests_read
on public.market_os_ambassador_lifecycle_requests
for select
to authenticated
using (
  exists (
    select 1

    from public.market_os_ambassador_actor_roles ar

    where ar.auth_user_id = auth.uid()
      and ar.status = 'active'

      and ar.tenant_id::text =
        market_os_ambassador_lifecycle_requests.tenant_id

      and ar.organization_id::text =
        market_os_ambassador_lifecycle_requests.organization_id
  )
);

drop policy if exists
  market_os_ambassador_lifecycle_events_read
on public.market_os_ambassador_lifecycle_events;

create policy
  market_os_ambassador_lifecycle_events_read
on public.market_os_ambassador_lifecycle_events
for select
to authenticated
using (
  exists (
    select 1

    from public.market_os_ambassador_actor_roles ar

    where ar.auth_user_id = auth.uid()
      and ar.status = 'active'

      and ar.tenant_id::text =
        market_os_ambassador_lifecycle_events.tenant_id

      and ar.organization_id::text =
        market_os_ambassador_lifecycle_events.organization_id
  )
);

drop policy if exists
  market_os_ambassador_purge_ledger_read
on public.market_os_ambassador_purge_ledger;

create policy
  market_os_ambassador_purge_ledger_read
on public.market_os_ambassador_purge_ledger
for select
to authenticated
using (
  exists (
    select 1

    from public.market_os_ambassador_actor_roles ar

    where ar.auth_user_id = auth.uid()
      and ar.status = 'active'

      and ar.tenant_id::text =
        market_os_ambassador_purge_ledger.tenant_id

      and ar.organization_id::text =
        market_os_ambassador_purge_ledger.organization_id
  )
);

revoke all on function
  public.market_os_ambassador_lifecycle_inventory(
    text,
    text,
    text
  )
from public, anon, authenticated;

revoke all on function
  public.market_os_ambassador_lifecycle_preview(
    text,
    text,
    text,
    text
  )
from public, anon, authenticated;

revoke all on function
  public.market_os_ambassador_lifecycle_set_state(
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

revoke all on function
  public.market_os_ambassador_lifecycle_request_delete(
    text,
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

revoke all on function
  public.market_os_ambassador_lifecycle_decide_request(
    text,
    text,
    text,
    text,
    text,
    text,
    text
  )
from public, anon, authenticated;

do $revoke_execute_delete$
declare
  v_function record;
  v_found integer := 0;
begin
  for v_function in
    select p.oid::regprocedure as identity
    from pg_proc p
    join pg_namespace n
      on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname =
        'market_os_ambassador_lifecycle_execute_delete'
  loop
    execute format(
      'revoke all on function %s from public, anon, authenticated',
      v_function.identity
    );

    v_found := v_found + 1;
  end loop;

  if v_found <> 1 then
    raise exception
      'Expected exactly one execute-delete function during permission hardening; found %',
      v_found;
  end if;
end
$revoke_execute_delete$;

commit;
