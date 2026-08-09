begin;

create extension if not exists pgcrypto;

-- ================================================================
-- ANGELCARE AMBASSADOR DATA LIFECYCLE COMMAND CENTER
-- Additive bulk-erasure orchestration, adapter registry and evidence.
-- Existing single-record lifecycle functions remain untouched.
-- ================================================================

create table if not exists
  public.market_os_ambassador_lifecycle_authorities (
    actor_app_user_id text primary key,
    actor_display_name text not null,
    authority_code text not null,
    may_self_decide boolean not null default false,
    may_self_execute boolean not null default false,
    active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  );

alter table
  public.market_os_ambassador_lifecycle_authorities
add column if not exists
  may_self_decide boolean not null default false;

alter table
  public.market_os_ambassador_lifecycle_authorities
add column if not exists
  may_self_execute boolean not null default false;

create table if not exists
  public.market_os_ambassador_purge_adapters (
    id uuid primary key default gen_random_uuid(),
    adapter_key text not null unique,
    entity_type text not null
      check (entity_type in ('ambassador', 'candidate', 'lead', '*')),
    system_key text not null default 'primary_database',
    table_name text,
    foreign_key text,
    strategy text not null
      check (strategy in ('delete', 'detach', 'block', 'verify_only')),
    retention_class text not null default 'operational',
    display_label text not null,
    description text not null default '',
    execution_order integer not null default 100,
    active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  );

create table if not exists
  public.market_os_ambassador_bulk_purge_jobs (
    id uuid primary key default gen_random_uuid(),
    tenant_id text not null,
    organization_id text not null,
    title text not null,
    reason_code text not null,
    reason_detail text not null,
    status text not null default 'draft'
      check (
        status in (
          'draft',
          'analysis',
          'review_required',
          'ready',
          'approved',
          'rejected',
          'executing',
          'partial',
          'completed',
          'blocked',
          'failed'
        )
      ),
    total_count integer not null default 0,
    ready_count integer not null default 0,
    blocked_count integer not null default 0,
    completed_count integer not null default 0,
    failed_count integer not null default 0,
    confirmation_code text not null,
    requested_by_app_user_id text not null,
    requested_by_display_name text not null,
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
    started_at timestamptz,
    completed_at timestamptz,
    execution_error text,
    evidence jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  );

create table if not exists
  public.market_os_ambassador_bulk_purge_items (
    id uuid primary key default gen_random_uuid(),
    job_id uuid not null
      references public.market_os_ambassador_bulk_purge_jobs(id)
      on delete cascade,
    tenant_id text not null,
    organization_id text not null,
    entity_type text not null
      check (entity_type in ('ambassador', 'candidate', 'lead')),
    entity_id text not null,
    display_label text not null,
    status text not null default 'pending'
      check (
        status in (
          'pending',
          'analysing',
          'ready',
          'blocked',
          'requested',
          'approved',
          'executing',
          'completed',
          'failed',
          'skipped'
        )
      ),
    blocker_count integer not null default 0,
    dependency_snapshot jsonb not null default '{}'::jsonb,
    adapter_snapshot jsonb not null default '[]'::jsonb,
    entity_snapshot_hash text,
    request_id uuid,
    ledger_hash text,
    execution_error text,
    executed_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (job_id, entity_type, entity_id)
  );

create index if not exists
  market_os_ambassador_bulk_purge_jobs_scope_idx
on public.market_os_ambassador_bulk_purge_jobs (
  tenant_id,
  organization_id,
  status,
  created_at desc
);

create index if not exists
  market_os_ambassador_bulk_purge_items_job_idx
on public.market_os_ambassador_bulk_purge_items (
  job_id,
  status,
  created_at
);

revoke all on table
  public.market_os_ambassador_lifecycle_authorities,
  public.market_os_ambassador_purge_adapters,
  public.market_os_ambassador_bulk_purge_jobs,
  public.market_os_ambassador_bulk_purge_items
from public, anon, authenticated;

insert into public.market_os_ambassador_purge_adapters (
  adapter_key,
  entity_type,
  system_key,
  table_name,
  foreign_key,
  strategy,
  retention_class,
  display_label,
  description,
  execution_order,
  active
)
values
  ('ambassador.mission_assignments', 'ambassador', 'primary_database', 'market_os_ambassador_mission_assignments', 'ambassador_id', 'delete', 'operational', 'Affectations de missions', 'Supprime les affectations opérationnelles rattachées au dossier.', 10, true),
  ('ambassador.territory_history', 'ambassador', 'primary_database', 'market_os_ambassador_territory_assignment_history', 'ambassador_id', 'delete', 'operational', 'Historique territorial', 'Supprime les affectations territoriales nominatives.', 20, true),
  ('ambassador.proofs', 'ambassador', 'primary_database', 'market_os_ambassador_proofs', 'ambassador_id', 'delete', 'personal_data', 'Preuves opérationnelles', 'Supprime les preuves directement rattachées au dossier.', 30, true),
  ('ambassador.onboarding', 'ambassador', 'primary_database', 'market_os_ambassador_onboarding', 'ambassador_id', 'delete', 'personal_data', 'Données d’activation', 'Supprime les données d’activation et de préparation.', 40, true),
  ('ambassador.leads', 'ambassador', 'primary_database', 'market_os_ambassador_leads', 'ambassador_id', 'detach', 'commercial', 'Leads attribués', 'Détache l’identité ambassadeur des leads conservés.', 50, true),
  ('ambassador.conversions', 'ambassador', 'primary_database', 'market_os_ambassador_conversions', 'ambassador_id', 'detach', 'commercial', 'Conversions attribuées', 'Détache l’identité ambassadeur des conversions conservées.', 60, true),
  ('ambassador.incentives', 'ambassador', 'primary_database', 'market_os_ambassador_incentives', 'ambassador_id', 'detach', 'financial', 'Incentives', 'Détache l’identité opérationnelle des écritures financières conservées.', 70, true),
  ('ambassador.payouts', 'ambassador', 'primary_database', 'market_os_ambassador_payouts', 'ambassador_id', 'detach', 'financial', 'Paiements', 'Détache l’identité opérationnelle des paiements soumis à rétention.', 80, true),
  ('candidate.converted_ambassador', 'candidate', 'primary_database', 'market_os_ambassadors', 'candidate_id', 'block', 'business_integrity', 'Profil ambassadeur converti', 'Bloque la suppression tant qu’un profil ambassadeur actif dépend du candidat.', 10, true),
  ('candidate.onboarding', 'candidate', 'primary_database', 'market_os_ambassador_onboarding', 'candidate_id', 'delete', 'personal_data', 'Activation candidat', 'Supprime les données d’activation du candidat.', 20, true),
  ('candidate.training', 'candidate', 'primary_database', 'market_os_ambassador_training_records', 'candidate_id', 'delete', 'personal_data', 'Formation candidat', 'Supprime les traces de formation nominatives.', 30, true),
  ('lead.conversions', 'lead', 'primary_database', 'market_os_ambassador_conversions', 'lead_id', 'detach', 'commercial', 'Conversions', 'Détache le lead des conversions conservées.', 10, true),
  ('lead.proofs', 'lead', 'primary_database', 'market_os_ambassador_proofs', 'lead_id', 'delete', 'personal_data', 'Preuves de conversion', 'Supprime les preuves rattachées au lead.', 20, true),
  ('lead.incentives', 'lead', 'primary_database', 'market_os_ambassador_incentives', 'lead_id', 'detach', 'financial', 'Incentives du lead', 'Détache le lead des écritures financières conservées.', 30, true),
  ('lead.payouts', 'lead', 'primary_database', 'market_os_ambassador_payouts', 'lead_id', 'detach', 'financial', 'Paiements du lead', 'Détache le lead des paiements conservés.', 40, true),
  ('external.storage', '*', 'object_storage', null, null, 'verify_only', 'external', 'Stockage documentaire', 'Point d’extension pour la vérification et la suppression des objets externes.', 900, true),
  ('external.search', '*', 'search_index', null, null, 'verify_only', 'external', 'Index de recherche', 'Point d’extension pour la révocation des index et caches externes.', 910, true),
  ('external.ai', '*', 'ai_knowledge', null, null, 'verify_only', 'external', 'Mémoire et index IA', 'Point d’extension pour la révocation des vecteurs et connaissances dérivées.', 920, true)
on conflict (adapter_key)
do update set
  entity_type = excluded.entity_type,
  system_key = excluded.system_key,
  table_name = excluded.table_name,
  foreign_key = excluded.foreign_key,
  strategy = excluded.strategy,
  retention_class = excluded.retention_class,
  display_label = excluded.display_label,
  description = excluded.description,
  execution_order = excluded.execution_order,
  active = excluded.active,
  updated_at = now();

create or replace function
  public.market_os_ambassador_bulk_adapter_preview(
    p_entity_type text,
    p_entity_id text,
    p_tenant_id text,
    p_organization_id text
  )
returns jsonb
language plpgsql
stable
security definer
set search_path to 'public'
as $function$
declare
  v_adapter record;
  v_relation regclass;
  v_count bigint;
  v_nullable boolean;
  v_has_tenant boolean;
  v_has_organization boolean;
  v_scope text;
  v_results jsonb := '[]'::jsonb;
  v_blockers integer := 0;
begin
  for v_adapter in
    select *
    from public.market_os_ambassador_purge_adapters
    where active = true
      and entity_type in (lower(trim(p_entity_type)), '*')
    order by execution_order, adapter_key
  loop
    v_count := 0;
    v_nullable := true;
    v_relation := null;
    v_has_tenant := false;
    v_has_organization := false;
    v_scope := '';

    if v_adapter.table_name is not null then
      v_relation := to_regclass('public.' || v_adapter.table_name);

      if v_relation is not null and v_adapter.foreign_key is not null then
        select exists (
          select 1 from pg_attribute
          where attrelid = v_relation
            and attname = 'tenant_id'
            and attnum > 0
            and not attisdropped
        ) into v_has_tenant;

        select exists (
          select 1 from pg_attribute
          where attrelid = v_relation
            and attname = 'organization_id'
            and attnum > 0
            and not attisdropped
        ) into v_has_organization;

        if v_has_tenant then
          v_scope := v_scope || ' and t.tenant_id::text = $2';
        end if;

        if v_has_organization then
          v_scope := v_scope || ' and t.organization_id::text = $3';
        end if;

        execute format(
          'select count(*) from %s t where t.%I::text = $1%s',
          v_relation,
          v_adapter.foreign_key,
          v_scope
        )
        into v_count
        using p_entity_id, p_tenant_id, p_organization_id;

        select not a.attnotnull
        into v_nullable
        from pg_attribute a
        where a.attrelid = v_relation
          and a.attname = v_adapter.foreign_key
          and a.attnum > 0
          and not a.attisdropped;

        v_nullable := coalesce(v_nullable, false);
      end if;
    end if;

    if v_count > 0 and (
      v_adapter.strategy = 'block'
      or (v_adapter.strategy = 'detach' and not v_nullable)
    ) then
      v_blockers := v_blockers + v_count::integer;
    end if;

    v_results := v_results || jsonb_build_array(
      jsonb_build_object(
        'adapterKey', v_adapter.adapter_key,
        'systemKey', v_adapter.system_key,
        'label', v_adapter.display_label,
        'description', v_adapter.description,
        'strategy', v_adapter.strategy,
        'retentionClass', v_adapter.retention_class,
        'table', v_adapter.table_name,
        'foreignKey', v_adapter.foreign_key,
        'available', v_adapter.table_name is null or v_relation is not null,
        'count', v_count,
        'nullable', v_nullable,
        'blocking', v_count > 0 and (
          v_adapter.strategy = 'block'
          or (v_adapter.strategy = 'detach' and not v_nullable)
        )
      )
    );
  end loop;

  return jsonb_build_object(
    'adapters', v_results,
    'blockerCount', v_blockers,
    'canExecute', v_blockers = 0,
    'generatedAt', now()
  );
end;
$function$;

create or replace function
  public.market_os_ambassador_bulk_cleanup_adapters(
    p_entity_type text,
    p_entity_id text,
    p_tenant_id text,
    p_organization_id text
  )
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_adapter record;
  v_relation regclass;
  v_has_tenant boolean;
  v_has_organization boolean;
  v_scope text;
  v_affected integer;
  v_results jsonb := '[]'::jsonb;
begin
  for v_adapter in
    select *
    from public.market_os_ambassador_purge_adapters
    where active = true
      and entity_type in (lower(trim(p_entity_type)), '*')
      and strategy in ('delete', 'detach')
      and table_name is not null
      and foreign_key is not null
    order by execution_order, adapter_key
  loop
    v_relation := to_regclass('public.' || v_adapter.table_name);
    v_affected := 0;

    if v_relation is null then
      v_results := v_results || jsonb_build_array(
        jsonb_build_object(
          'adapterKey', v_adapter.adapter_key,
          'strategy', v_adapter.strategy,
          'affected', 0,
          'available', false
        )
      );
      continue;
    end if;

    select exists (
      select 1 from pg_attribute
      where attrelid = v_relation
        and attname = 'tenant_id'
        and attnum > 0
        and not attisdropped
    ) into v_has_tenant;

    select exists (
      select 1 from pg_attribute
      where attrelid = v_relation
        and attname = 'organization_id'
        and attnum > 0
        and not attisdropped
    ) into v_has_organization;

    v_scope := '';
    if v_has_tenant then
      v_scope := v_scope || ' and tenant_id::text = $2';
    end if;
    if v_has_organization then
      v_scope := v_scope || ' and organization_id::text = $3';
    end if;

    if v_adapter.strategy = 'delete' then
      execute format(
        'delete from %s where %I::text = $1%s',
        v_relation,
        v_adapter.foreign_key,
        v_scope
      ) using p_entity_id, p_tenant_id, p_organization_id;
    else
      execute format(
        'update %s set %I = null where %I::text = $1%s',
        v_relation,
        v_adapter.foreign_key,
        v_adapter.foreign_key,
        v_scope
      ) using p_entity_id, p_tenant_id, p_organization_id;
    end if;

    get diagnostics v_affected = row_count;

    v_results := v_results || jsonb_build_array(
      jsonb_build_object(
        'adapterKey', v_adapter.adapter_key,
        'strategy', v_adapter.strategy,
        'affected', v_affected,
        'available', true
      )
    );
  end loop;

  return v_results;
end;
$function$;

create or replace function
  public.market_os_ambassador_bulk_purge_create(
    p_tenant_id text,
    p_organization_id text,
    p_title text,
    p_reason_code text,
    p_reason_detail text,
    p_selection jsonb,
    p_actor_app_user_id text,
    p_actor_display_name text
  )
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_job public.market_os_ambassador_bulk_purge_jobs%rowtype;
  v_item jsonb;
  v_count integer;
begin
  if jsonb_typeof(p_selection) <> 'array' then
    raise exception 'Bulk purge selection must be a JSON array';
  end if;

  v_count := jsonb_array_length(p_selection);
  if v_count < 1 or v_count > 200 then
    raise exception 'Bulk purge selection must contain between 1 and 200 entities';
  end if;

  insert into public.market_os_ambassador_bulk_purge_jobs (
    tenant_id,
    organization_id,
    title,
    reason_code,
    reason_detail,
    total_count,
    confirmation_code,
    requested_by_app_user_id,
    requested_by_display_name
  )
  values (
    p_tenant_id,
    p_organization_id,
    coalesce(nullif(trim(p_title), ''), 'Suppression groupée'),
    coalesce(nullif(trim(p_reason_code), ''), 'administrative_request'),
    p_reason_detail,
    v_count,
    'PENDING',
    p_actor_app_user_id,
    p_actor_display_name
  )
  returning * into v_job;

  update public.market_os_ambassador_bulk_purge_jobs
  set confirmation_code = 'PURGE-BULK-' || upper(right(replace(v_job.id::text, '-', ''), 8))
  where id = v_job.id
  returning * into v_job;

  for v_item in select value from jsonb_array_elements(p_selection)
  loop
    if lower(trim(v_item->>'entityType')) not in ('ambassador', 'candidate', 'lead') then
      raise exception 'Unsupported bulk entity type: %', v_item->>'entityType';
    end if;

    insert into public.market_os_ambassador_bulk_purge_items (
      job_id,
      tenant_id,
      organization_id,
      entity_type,
      entity_id,
      display_label
    )
    values (
      v_job.id,
      p_tenant_id,
      p_organization_id,
      lower(trim(v_item->>'entityType')),
      trim(v_item->>'entityId'),
      coalesce(nullif(trim(v_item->>'displayLabel'), ''), 'Dossier ' || right(trim(v_item->>'entityId'), 8))
    )
    on conflict (job_id, entity_type, entity_id) do nothing;
  end loop;

  insert into public.market_os_ambassador_lifecycle_events (
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
    'bulk_job',
    v_job.id::text,
    null,
    'bulk_purge_created',
    p_actor_app_user_id,
    p_actor_display_name,
    jsonb_build_object('title', v_job.title, 'totalCount', v_count, 'confirmationCode', v_job.confirmation_code)
  );

  return to_jsonb(v_job);
end;
$function$;

create or replace function
  public.market_os_ambassador_bulk_purge_preflight(
    p_job_id text,
    p_tenant_id text,
    p_organization_id text,
    p_actor_app_user_id text,
    p_actor_display_name text
  )
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_job public.market_os_ambassador_bulk_purge_jobs%rowtype;
  v_item public.market_os_ambassador_bulk_purge_items%rowtype;
  v_preview jsonb;
  v_adapter_preview jsonb;
  v_blockers integer;
  v_ready integer;
  v_blocked integer;
begin
  select * into v_job
  from public.market_os_ambassador_bulk_purge_jobs
  where id::text = p_job_id
    and tenant_id = p_tenant_id
    and organization_id = p_organization_id
  for update;

  if not found then
    raise exception 'Bulk purge job was not found';
  end if;

  if v_job.status in ('approved', 'executing', 'completed', 'rejected') then
    raise exception 'Bulk purge job cannot be analysed from status %', v_job.status;
  end if;

  update public.market_os_ambassador_bulk_purge_jobs
  set status = 'analysis', updated_at = now(), execution_error = null
  where id = v_job.id;

  for v_item in
    select * from public.market_os_ambassador_bulk_purge_items
    where job_id = v_job.id
    order by created_at, id
  loop
    begin
      update public.market_os_ambassador_bulk_purge_items
      set status = 'analysing', updated_at = now(), execution_error = null
      where id = v_item.id;

      v_preview := public.market_os_ambassador_lifecycle_preview(
        v_item.entity_type,
        v_item.entity_id,
        p_tenant_id,
        p_organization_id
      );

      v_adapter_preview := public.market_os_ambassador_bulk_adapter_preview(
        v_item.entity_type,
        v_item.entity_id,
        p_tenant_id,
        p_organization_id
      );

      v_blockers := coalesce((v_adapter_preview->>'blockerCount')::integer, 0);

      update public.market_os_ambassador_bulk_purge_items
      set
        status = case when v_blockers = 0 then 'ready' else 'blocked' end,
        blocker_count = v_blockers,
        dependency_snapshot = v_preview,
        adapter_snapshot = coalesce(v_adapter_preview->'adapters', '[]'::jsonb),
        entity_snapshot_hash = v_preview->>'snapshotHash',
        execution_error = case when v_blockers = 0 then null else 'Un ou plusieurs adaptateurs imposent une conservation ou un blocage.' end,
        updated_at = now()
      where id = v_item.id;
    exception when others then
      update public.market_os_ambassador_bulk_purge_items
      set status = 'blocked', execution_error = sqlerrm, updated_at = now()
      where id = v_item.id;
    end;
  end loop;

  select
    count(*) filter (where status = 'ready'),
    count(*) filter (where status = 'blocked')
  into v_ready, v_blocked
  from public.market_os_ambassador_bulk_purge_items
  where job_id = v_job.id;

  update public.market_os_ambassador_bulk_purge_jobs
  set
    status = case when v_ready > 0 and v_blocked = 0 then 'ready' when v_ready > 0 then 'review_required' else 'blocked' end,
    ready_count = v_ready,
    blocked_count = v_blocked,
    updated_at = now(),
    evidence = jsonb_set(evidence, '{lastPreflightAt}', to_jsonb(now()), true)
  where id = v_job.id
  returning * into v_job;

  insert into public.market_os_ambassador_lifecycle_events (
    tenant_id, organization_id, entity_type, entity_id, request_id,
    event_type, actor_app_user_id, actor_display_name, details
  )
  values (
    p_tenant_id, p_organization_id, 'bulk_job', v_job.id::text, null,
    'bulk_purge_preflight_completed', p_actor_app_user_id, p_actor_display_name,
    jsonb_build_object('readyCount', v_ready, 'blockedCount', v_blocked, 'status', v_job.status)
  );

  return to_jsonb(v_job);
end;
$function$;

create or replace function
  public.market_os_ambassador_bulk_purge_decide(
    p_job_id text,
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
set search_path to 'public'
as $function$
declare
  v_job public.market_os_ambassador_bulk_purge_jobs%rowtype;
  v_may_self_decide boolean := false;
begin
  if p_decision not in ('approved', 'rejected') then
    raise exception 'Unsupported bulk purge decision';
  end if;

  select * into v_job
  from public.market_os_ambassador_bulk_purge_jobs
  where id::text = p_job_id
    and tenant_id = p_tenant_id
    and organization_id = p_organization_id
  for update;

  if not found then
    raise exception 'Bulk purge job was not found';
  end if;

  if v_job.status not in ('ready', 'review_required', 'blocked') then
    raise exception 'Bulk purge job cannot be decided from status %', v_job.status;
  end if;

  select coalesce(bool_or(active and may_self_decide), false)
  into v_may_self_decide
  from public.market_os_ambassador_lifecycle_authorities
  where actor_app_user_id = p_actor_app_user_id;

  if v_job.requested_by_app_user_id = p_actor_app_user_id and not v_may_self_decide then
    raise exception 'Separation of duties: the creator cannot approve their own bulk purge job';
  end if;

  if p_decision = 'approved' then
    if v_job.ready_count < 1 then
      raise exception 'No eligible entity is ready for this bulk purge job';
    end if;

    update public.market_os_ambassador_bulk_purge_jobs
    set
      status = 'approved',
      approved_by_app_user_id = p_actor_app_user_id,
      approved_by_display_name = p_actor_display_name,
      approval_note = p_note,
      approved_at = now(),
      updated_at = now()
    where id = v_job.id
    returning * into v_job;
  else
    update public.market_os_ambassador_bulk_purge_jobs
    set
      status = 'rejected',
      rejected_by_app_user_id = p_actor_app_user_id,
      rejected_by_display_name = p_actor_display_name,
      rejection_note = p_note,
      rejected_at = now(),
      updated_at = now()
    where id = v_job.id
    returning * into v_job;
  end if;

  insert into public.market_os_ambassador_lifecycle_events (
    tenant_id, organization_id, entity_type, entity_id, request_id,
    event_type, actor_app_user_id, actor_display_name, details
  )
  values (
    p_tenant_id, p_organization_id, 'bulk_job', v_job.id::text, null,
    'bulk_purge_' || p_decision, p_actor_app_user_id, p_actor_display_name,
    jsonb_build_object('note', p_note, 'readyCount', v_job.ready_count, 'blockedCount', v_job.blocked_count)
  );

  return to_jsonb(v_job);
end;
$function$;

create or replace function
  public.market_os_ambassador_bulk_purge_execute(
    p_job_id text,
    p_tenant_id text,
    p_organization_id text,
    p_confirmation text,
    p_note text,
    p_actor_app_user_id text,
    p_actor_display_name text
  )
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $function$
declare
  v_job public.market_os_ambassador_bulk_purge_jobs%rowtype;
  v_item public.market_os_ambassador_bulk_purge_items%rowtype;
  v_request jsonb;
  v_result jsonb;
  v_cleanup jsonb;
  v_completed integer;
  v_failed integer;
  v_blocked integer;
  v_external_pending integer := 0;
begin
  select * into v_job
  from public.market_os_ambassador_bulk_purge_jobs
  where id::text = p_job_id
    and tenant_id = p_tenant_id
    and organization_id = p_organization_id
  for update;

  if not found then
    raise exception 'Bulk purge job was not found';
  end if;

  if v_job.status not in ('approved', 'partial', 'failed') then
    raise exception 'Bulk purge job must be approved before execution. Current status: %', v_job.status;
  end if;

  if upper(trim(p_confirmation)) <> upper(v_job.confirmation_code) then
    raise exception 'The bulk purge confirmation code is invalid';
  end if;

  update public.market_os_ambassador_bulk_purge_jobs
  set
    status = 'executing',
    executed_by_app_user_id = p_actor_app_user_id,
    executed_by_display_name = p_actor_display_name,
    started_at = coalesce(started_at, now()),
    execution_error = null,
    updated_at = now()
  where id = v_job.id;

  for v_item in
    select * from public.market_os_ambassador_bulk_purge_items
    where job_id = v_job.id
      and status in ('ready', 'failed')
    order by created_at, id
  loop
    begin
      update public.market_os_ambassador_bulk_purge_items
      set status = 'executing', execution_error = null, updated_at = now()
      where id = v_item.id;

      v_cleanup := public.market_os_ambassador_bulk_cleanup_adapters(
        v_item.entity_type,
        v_item.entity_id,
        p_tenant_id,
        p_organization_id
      );

      v_request := public.market_os_ambassador_lifecycle_request_delete(
        v_item.entity_type,
        v_item.entity_id,
        p_tenant_id,
        p_organization_id,
        v_job.reason_code,
        v_job.reason_detail,
        'bulk:' || v_job.id::text || ':' || v_item.id::text,
        v_job.requested_by_app_user_id,
        v_job.requested_by_display_name
      );

      v_request := public.market_os_ambassador_lifecycle_decide_request(
        v_request->>'id',
        p_tenant_id,
        p_organization_id,
        'approved',
        coalesce(v_job.approval_note, 'Approbation groupée'),
        v_job.approved_by_app_user_id,
        v_job.approved_by_display_name
      );

      v_result := public.market_os_ambassador_lifecycle_execute_delete(
        v_request->>'id',
        p_tenant_id,
        p_organization_id,
        'DELETE-' || upper(right(v_item.entity_id, 8)),
        p_actor_app_user_id,
        p_actor_display_name
      );

      update public.market_os_ambassador_bulk_purge_items
      set
        status = 'completed',
        request_id = (v_request->>'id')::uuid,
        ledger_hash = v_result->>'ledgerHash',
        executed_at = now(),
        execution_error = null,
        adapter_snapshot = jsonb_build_object('preflight', adapter_snapshot, 'cleanup', v_cleanup),
        updated_at = now()
      where id = v_item.id;
    exception when others then
      update public.market_os_ambassador_bulk_purge_items
      set status = 'failed', execution_error = sqlerrm, updated_at = now()
      where id = v_item.id;
    end;
  end loop;

  select
    count(*) filter (where status = 'completed'),
    count(*) filter (where status = 'failed'),
    count(*) filter (where status = 'blocked')
  into v_completed, v_failed, v_blocked
  from public.market_os_ambassador_bulk_purge_items
  where job_id = v_job.id;

  select count(*)
  into v_external_pending
  from public.market_os_ambassador_purge_adapters adapter
  where adapter.active = true
    and adapter.strategy = 'verify_only'
    and (
      adapter.entity_type = '*'
      or exists (
        select 1
        from public.market_os_ambassador_bulk_purge_items item
        where item.job_id = v_job.id
          and item.entity_type = adapter.entity_type
      )
    );

  update public.market_os_ambassador_bulk_purge_jobs
  set
    completed_count = v_completed,
    failed_count = v_failed,
    blocked_count = v_blocked,
    status = case
      when v_failed = 0 and v_external_pending = 0 and v_completed = ready_count then 'completed'
      when v_completed > 0 then 'partial'
      else 'failed'
    end,
    completed_at = case when v_failed = 0 and v_external_pending = 0 and v_completed = ready_count then now() else completed_at end,
    execution_error = case
      when v_failed > 0 then v_failed || ' dossier(s) en échec contrôlé'
      when v_external_pending > 0 then v_external_pending || ' vérification(s) externe(s) en attente'
      else null
    end,
    evidence = evidence || jsonb_build_object(
      'executionNote', p_note,
      'executedAt', now(),
      'completedCount', v_completed,
      'failedCount', v_failed,
      'blockedCount', v_blocked,
      'externalVerificationPending', v_external_pending
    ),
    updated_at = now()
  where id = v_job.id
  returning * into v_job;

  insert into public.market_os_ambassador_lifecycle_events (
    tenant_id, organization_id, entity_type, entity_id, request_id,
    event_type, actor_app_user_id, actor_display_name, details
  )
  values (
    p_tenant_id, p_organization_id, 'bulk_job', v_job.id::text, null,
    'bulk_purge_execution_completed', p_actor_app_user_id, p_actor_display_name,
    jsonb_build_object(
      'status', v_job.status,
      'completedCount', v_completed,
      'failedCount', v_failed,
      'blockedCount', v_blocked,
      'externalVerificationPending', v_external_pending,
      'confirmationCode', v_job.confirmation_code
    )
  );

  return to_jsonb(v_job);
end;
$function$;

commit;
