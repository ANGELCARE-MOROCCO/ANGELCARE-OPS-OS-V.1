begin;

-- ---------------------------------------------------------------------------
-- AREA 8 R3 — ADAPTIVE AUTHENTICATED SCHOOL-ACCESS AUTHORITY
--
-- This helper does not assume one fixed historical app_users identity shape.
-- It resolves the current authenticated person through the identity columns
-- actually present, then verifies an active school role dynamically.
-- ---------------------------------------------------------------------------

create or replace function
public.angelcare360_area8_current_actor_ids()
returns text[]
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $area8_actor_ids$
declare
  resolved_ids text[] := array[]::text[];
  authenticated_id text := nullif(auth.uid()::text, '');
  authenticated_email text :=
    nullif(coalesce(auth.jwt() ->> 'email', ''), '');

  identity_column text;
  mapped_app_user_id text;
  app_users_has_id boolean := false;
begin
  if authenticated_id is not null then
    resolved_ids := array_append(
      resolved_ids,
      authenticated_id
    );
  end if;

  if to_regclass('public.app_users') is not null then
    select exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'app_users'
        and column_name = 'id'
    )
    into app_users_has_id;

    if app_users_has_id then
      for identity_column in
        select column_name
        from information_schema.columns
        where table_schema = 'public'
          and table_name = 'app_users'
          and column_name in (
            'id',
            'auth_user_id',
            'supabase_user_id'
          )
        order by case column_name
          when 'auth_user_id' then 1
          when 'supabase_user_id' then 2
          when 'id' then 3
          else 10
        end
      loop
        mapped_app_user_id := null;

        execute format(
          'select id::text
             from public.app_users
            where %I::text = $1
            limit 1',
          identity_column
        )
        into mapped_app_user_id
        using authenticated_id;

        if mapped_app_user_id is not null then
          resolved_ids := array_append(
            resolved_ids,
            mapped_app_user_id
          );
        end if;
      end loop;

      if authenticated_email is not null then
        for identity_column in
          select column_name
          from information_schema.columns
          where table_schema = 'public'
            and table_name = 'app_users'
            and column_name in (
              'email',
              'username'
            )
          order by case column_name
            when 'email' then 1
            when 'username' then 2
            else 10
          end
        loop
          mapped_app_user_id := null;

          execute format(
            'select id::text
               from public.app_users
              where lower(%I::text) = lower($1)
              limit 1',
            identity_column
          )
          into mapped_app_user_id
          using authenticated_email;

          if mapped_app_user_id is not null then
            resolved_ids := array_append(
              resolved_ids,
              mapped_app_user_id
            );
          end if;
        end loop;
      end if;
    end if;
  end if;

  return coalesce(
    (
      select array_agg(distinct value)
      from unnest(resolved_ids) as value
      where value is not null
        and value <> ''
    ),
    array[]::text[]
  );
end;
$area8_actor_ids$;


create or replace function
public.angelcare360_area8_has_school_access(
  target_school_id uuid
)
returns boolean
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $area8_school_access$
declare
  actor_ids text[];
  role_user_column text;
  school_column text;
  status_column text;
  starts_column text;
  ends_column text;
  predicate_sql text;
  access_granted boolean := false;
begin
  if auth.uid() is null
     or target_school_id is null then
    return false;
  end if;

  if to_regclass(
    'public.angelcare360_user_roles'
  ) is null then
    return false;
  end if;

  actor_ids :=
    public.angelcare360_area8_current_actor_ids();

  if coalesce(array_length(actor_ids, 1), 0) = 0 then
    return false;
  end if;

  select column_name
  into role_user_column
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'angelcare360_user_roles'
    and column_name in (
      'app_user_id',
      'user_id',
      'account_user_id',
      'auth_user_id',
      'supabase_user_id'
    )
  order by case column_name
    when 'app_user_id' then 1
    when 'user_id' then 2
    when 'account_user_id' then 3
    when 'auth_user_id' then 4
    when 'supabase_user_id' then 5
    else 10
  end
  limit 1;

  select column_name
  into school_column
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'angelcare360_user_roles'
    and column_name = 'school_id'
  limit 1;

  if role_user_column is null
     or school_column is null then
    return false;
  end if;

  select column_name
  into status_column
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'angelcare360_user_roles'
    and column_name in (
      'status',
      'assignment_state',
      'state'
    )
  order by case column_name
    when 'status' then 1
    when 'assignment_state' then 2
    when 'state' then 3
    else 10
  end
  limit 1;

  select column_name
  into starts_column
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'angelcare360_user_roles'
    and column_name in (
      'starts_at',
      'effective_from',
      'valid_from'
    )
  order by case column_name
    when 'starts_at' then 1
    when 'effective_from' then 2
    when 'valid_from' then 3
    else 10
  end
  limit 1;

  select column_name
  into ends_column
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'angelcare360_user_roles'
    and column_name in (
      'ends_at',
      'effective_until',
      'valid_until',
      'expires_at'
    )
  order by case column_name
    when 'ends_at' then 1
    when 'effective_until' then 2
    when 'valid_until' then 3
    when 'expires_at' then 4
    else 10
  end
  limit 1;

  predicate_sql := format(
    '%I::text = any($1)
     and %I::text = $2',
    role_user_column,
    school_column
  );

  if status_column is not null then
    predicate_sql :=
      predicate_sql
      || format(
        ' and (
            %I is null
            or lower(%I::text) not in (
              ''inactive'',
              ''disabled'',
              ''revoked'',
              ''ended'',
              ''expired'',
              ''cancelled'',
              ''archived''
            )
          )',
        status_column,
        status_column
      );
  end if;

  if starts_column is not null then
    predicate_sql :=
      predicate_sql
      || format(
        ' and (
            %I is null
            or %I::timestamptz <= now()
          )',
        starts_column,
        starts_column
      );
  end if;

  if ends_column is not null then
    predicate_sql :=
      predicate_sql
      || format(
        ' and (
            %I is null
            or %I::timestamptz > now()
          )',
        ends_column,
        ends_column
      );
  end if;

  execute format(
    'select exists (
       select 1
       from public.angelcare360_user_roles
       where %s
     )',
    predicate_sql
  )
  into access_granted
  using actor_ids, target_school_id::text;

  return coalesce(access_granted, false);
end;
$area8_school_access$;


revoke all
on function
public.angelcare360_area8_current_actor_ids()
from public;

revoke all
on function
public.angelcare360_area8_has_school_access(uuid)
from public;

grant execute
on function
public.angelcare360_area8_current_actor_ids()
to authenticated, service_role;

grant execute
on function
public.angelcare360_area8_has_school_access(uuid)
to authenticated, service_role;



do $$ begin if to_regclass('storage.buckets') is not null then insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('angelcare360-audit-governance','angelcare360-audit-governance',false,20971520,array['application/pdf','image/jpeg','image/png','text/csv','text/plain','application/json']) on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types; end if; end $$;

create table if not exists public.angelcare360_audit_event_links (id uuid primary key default gen_random_uuid(), school_id uuid not null, source_event_id uuid, related_event_id uuid, relationship text not null default 'related', created_by uuid, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create index if not exists angelcare360_audit_event_links_school_created_idx on public.angelcare360_audit_event_links(school_id,created_at desc);
create table if not exists public.angelcare360_audit_snapshot_refs (id uuid primary key default gen_random_uuid(), school_id uuid not null, entity_type text not null, entity_id uuid, event_id uuid, snapshot_kind text not null default 'after', snapshot_json jsonb not null default '{}'::jsonb, effective_at timestamptz, created_by uuid, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create index if not exists angelcare360_audit_snapshot_refs_school_created_idx on public.angelcare360_audit_snapshot_refs(school_id,created_at desc);
create table if not exists public.angelcare360_audit_annotations (id uuid primary key default gen_random_uuid(), school_id uuid not null, event_id uuid, annotation text not null, annotation_kind text not null default 'explanation', created_by uuid, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create index if not exists angelcare360_audit_annotations_school_created_idx on public.angelcare360_audit_annotations(school_id,created_at desc);
create table if not exists public.angelcare360_audit_evidence_items (id uuid primary key default gen_random_uuid(), school_id uuid not null, title text not null, category text not null default 'document', source_label text, linked_entity_type text, linked_entity_id uuid, version_number integer not null default 1, mime_type text, size_bytes bigint, content_fingerprint text, integrity_state text not null default 'pending', verification_state text not null default 'pending', access_class text not null default 'internal', retention_state text not null default 'active', created_by uuid, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create index if not exists angelcare360_audit_evidence_items_school_created_idx on public.angelcare360_audit_evidence_items(school_id,created_at desc);
create table if not exists public.angelcare360_audit_evidence_versions (id uuid primary key default gen_random_uuid(), school_id uuid not null, evidence_id uuid not null, version_number integer not null, file_reference text, content_fingerprint text, size_bytes bigint, mime_type text, replacement_reason text, created_by uuid, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create index if not exists angelcare360_audit_evidence_versions_school_created_idx on public.angelcare360_audit_evidence_versions(school_id,created_at desc);
create table if not exists public.angelcare360_audit_evidence_links (id uuid primary key default gen_random_uuid(), school_id uuid not null, evidence_id uuid not null, entity_type text not null, entity_id uuid, link_kind text not null default 'supports', created_by uuid, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create index if not exists angelcare360_audit_evidence_links_school_created_idx on public.angelcare360_audit_evidence_links(school_id,created_at desc);
create table if not exists public.angelcare360_audit_evidence_requests (id uuid primary key default gen_random_uuid(), school_id uuid not null, title text not null, reason text, responsible_id uuid, responsible_label text, due_at timestamptz, accepted_format text, sensitivity text, state text not null default 'open', created_by uuid, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create index if not exists angelcare360_audit_evidence_requests_school_created_idx on public.angelcare360_audit_evidence_requests(school_id,created_at desc);
create table if not exists public.angelcare360_audit_evidence_verifications (id uuid primary key default gen_random_uuid(), school_id uuid not null, evidence_id uuid not null, state text not null, verification_note text, verified_by uuid, verified_at timestamptz, created_by uuid, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create index if not exists angelcare360_audit_evidence_verifications_school_created_idx on public.angelcare360_audit_evidence_verifications(school_id,created_at desc);
create table if not exists public.angelcare360_audit_findings (id uuid primary key default gen_random_uuid(), school_id uuid not null, fingerprint text not null, title text not null, detail text, consequence text, severity text not null default 'warning', state text not null default 'open', entity_type text, entity_id uuid, entity_label text, owner_id uuid, owner_label text, due_at timestamptz, evidence_count integer not null default 0, resolution_note text, resolved_at timestamptz, created_by uuid, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create index if not exists angelcare360_audit_findings_school_created_idx on public.angelcare360_audit_findings(school_id,created_at desc);
create table if not exists public.angelcare360_audit_finding_sources (id uuid primary key default gen_random_uuid(), school_id uuid not null, finding_id uuid not null, source_kind text not null, source_id uuid, source_reference text, created_by uuid, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create index if not exists angelcare360_audit_finding_sources_school_created_idx on public.angelcare360_audit_finding_sources(school_id,created_at desc);
create table if not exists public.angelcare360_audit_investigations (id uuid primary key default gen_random_uuid(), school_id uuid not null, case_code text not null, title text not null, question text not null, scope_label text, owner_id uuid, owner_label text, started_at timestamptz, state text not null default 'open', event_count integer not null default 0, evidence_count integer not null default 0, open_task_count integer not null default 0, verified_facts integer not null default 0, observations integer not null default 0, conclusion text, created_by uuid, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create index if not exists angelcare360_audit_investigations_school_created_idx on public.angelcare360_audit_investigations(school_id,created_at desc);
create table if not exists public.angelcare360_audit_investigation_events (id uuid primary key default gen_random_uuid(), school_id uuid not null, investigation_id uuid not null, event_id uuid not null, relationship text not null default 'in_scope', created_by uuid, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create index if not exists angelcare360_audit_investigation_events_school_created_idx on public.angelcare360_audit_investigation_events(school_id,created_at desc);
create table if not exists public.angelcare360_audit_investigation_evidence (id uuid primary key default gen_random_uuid(), school_id uuid not null, investigation_id uuid not null, evidence_id uuid not null, relationship text not null default 'supports', created_by uuid, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create index if not exists angelcare360_audit_investigation_evidence_school_created_idx on public.angelcare360_audit_investigation_evidence(school_id,created_at desc);
create table if not exists public.angelcare360_audit_investigation_observations (id uuid primary key default gen_random_uuid(), school_id uuid not null, investigation_id uuid not null, observation_kind text not null default 'working_observation', observation text not null, verified boolean not null default false, created_by uuid, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create index if not exists angelcare360_audit_investigation_observations_school_created_idx on public.angelcare360_audit_investigation_observations(school_id,created_at desc);
create table if not exists public.angelcare360_audit_corrective_actions (id uuid primary key default gen_random_uuid(), school_id uuid not null, investigation_id uuid, finding_id uuid, action_label text not null, source_module text, source_entity_type text, source_entity_id uuid, responsible_id uuid, responsible_label text, due_at timestamptz, success_condition text, evidence_required boolean not null default false, state text not null default 'open', created_by uuid, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create index if not exists angelcare360_audit_corrective_actions_school_created_idx on public.angelcare360_audit_corrective_actions(school_id,created_at desc);
create table if not exists public.angelcare360_audit_review_campaigns (id uuid primary key default gen_random_uuid(), school_id uuid not null, review_code text not null, name text not null, scope_label text, reviewer_id uuid, reviewer_label text, starts_at timestamptz, due_at timestamptz, state text not null default 'draft', item_count integer not null default 0, completed_count integer not null default 0, correction_count integer not null default 0, created_by uuid, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create index if not exists angelcare360_audit_review_campaigns_school_created_idx on public.angelcare360_audit_review_campaigns(school_id,created_at desc);
create table if not exists public.angelcare360_audit_review_decisions (id uuid primary key default gen_random_uuid(), school_id uuid not null, review_id uuid not null, item_kind text not null, item_id uuid, decision text not null, decision_note text, decided_by uuid, decided_at timestamptz, created_by uuid, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create index if not exists angelcare360_audit_review_decisions_school_created_idx on public.angelcare360_audit_review_decisions(school_id,created_at desc);
create table if not exists public.angelcare360_audit_export_requests (id uuid primary key default gen_random_uuid(), school_id uuid not null, export_code text not null, name text not null, purpose text, scope_label text, format text not null default 'PDF', state text not null default 'draft', item_count integer not null default 0, generated_count integer not null default 0, failed_count integer not null default 0, redaction_count integer not null default 0, requested_by uuid, expires_at timestamptz, created_by uuid, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create index if not exists angelcare360_audit_export_requests_school_created_idx on public.angelcare360_audit_export_requests(school_id,created_at desc);
create table if not exists public.angelcare360_audit_export_items (id uuid primary key default gen_random_uuid(), school_id uuid not null, export_id uuid not null, item_kind text not null, item_id uuid, state text not null default 'pending', failure_reason text, redacted boolean not null default false, created_by uuid, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create index if not exists angelcare360_audit_export_items_school_created_idx on public.angelcare360_audit_export_items(school_id,created_at desc);
create table if not exists public.angelcare360_audit_export_manifests (id uuid primary key default gen_random_uuid(), school_id uuid not null, export_id uuid not null, manifest_json jsonb not null default '{}'::jsonb, content_fingerprint text, file_reference text, filename text, mime_type text, size_bytes bigint, generated_at timestamptz, created_by uuid, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create index if not exists angelcare360_audit_export_manifests_school_created_idx on public.angelcare360_audit_export_manifests(school_id,created_at desc);
create table if not exists public.angelcare360_audit_preservation_holds (id uuid primary key default gen_random_uuid(), school_id uuid not null, reason text not null, scope_label text not null, starts_at timestamptz not null default now(), review_at timestamptz, approved_by uuid, state text not null default 'pending', created_by uuid, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create index if not exists angelcare360_audit_preservation_holds_school_created_idx on public.angelcare360_audit_preservation_holds(school_id,created_at desc);
create table if not exists public.angelcare360_audit_redaction_requests (id uuid primary key default gen_random_uuid(), school_id uuid not null, entity_type text not null, entity_id uuid, reason text not null, field_paths text[] not null default '{}', state text not null default 'pending', requested_by uuid, approved_by uuid, applied_at timestamptz, created_by uuid, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create index if not exists angelcare360_audit_redaction_requests_school_created_idx on public.angelcare360_audit_redaction_requests(school_id,created_at desc);
create table if not exists public.angelcare360_audit_integrity_runs (id uuid primary key default gen_random_uuid(), school_id uuid not null, run_code text not null, scope_label text, state text not null default 'completed', started_at timestamptz not null default now(), completed_at timestamptz, checked_count integer not null default 0, finding_count integer not null default 0, created_by uuid, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create index if not exists angelcare360_audit_integrity_runs_school_created_idx on public.angelcare360_audit_integrity_runs(school_id,created_at desc);
create table if not exists public.angelcare360_audit_integrity_findings (id uuid primary key default gen_random_uuid(), school_id uuid not null, run_id uuid not null, finding_key text not null, title text not null, detail text, severity text not null default 'warning', state text not null default 'open', created_by uuid, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create index if not exists angelcare360_audit_integrity_findings_school_created_idx on public.angelcare360_audit_integrity_findings(school_id,created_at desc);
create table if not exists public.angelcare360_audit_tasks (id uuid primary key default gen_random_uuid(), school_id uuid not null, entity_type text not null, entity_id uuid, title text not null, responsible_id uuid, responsible_label text, due_at timestamptz, state text not null default 'open', created_by uuid, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create index if not exists angelcare360_audit_tasks_school_created_idx on public.angelcare360_audit_tasks(school_id,created_at desc);
create table if not exists public.angelcare360_audit_notes (id uuid primary key default gen_random_uuid(), school_id uuid not null, entity_type text not null, entity_id uuid, note text not null, created_by uuid, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create index if not exists angelcare360_audit_notes_school_created_idx on public.angelcare360_audit_notes(school_id,created_at desc);
create table if not exists public.angelcare360_audit_approval_reviews (id uuid primary key default gen_random_uuid(), school_id uuid not null, title text not null default 'Décision institutionnelle', detail text, entity_type text, entity_id uuid, prepared_by uuid, prepared_by_label text, approved_by uuid, approved_by_label text, executed_by uuid, executed_by_label text, verified_by uuid, verified_by_label text, effective_at timestamptz, state text not null default 'open', evidence_count integer not null default 0, finding_count integer not null default 0, created_by uuid, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create index if not exists angelcare360_audit_approval_reviews_school_created_idx on public.angelcare360_audit_approval_reviews(school_id,created_at desc);
create table if not exists public.angelcare360_audit_topup_requests (id uuid primary key default gen_random_uuid(), school_id uuid not null, capability_key text not null, requested_quantity integer not null default 1, reason text, package_version_id uuid, state text not null default 'pending', requested_by uuid, created_by uuid, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create index if not exists angelcare360_audit_topup_requests_school_created_idx on public.angelcare360_audit_topup_requests(school_id,created_at desc);
create table if not exists public.angelcare360_audit_action_receipts (id uuid primary key default gen_random_uuid(), school_id uuid not null, action_key text not null, idempotency_key text not null, message text, entity_type text, entity_id uuid, created_by uuid, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create index if not exists angelcare360_audit_action_receipts_school_created_idx on public.angelcare360_audit_action_receipts(school_id,created_at desc);
create unique index if not exists angelcare360_audit_action_receipts_idempotency_uq on public.angelcare360_audit_action_receipts(school_id,action_key,idempotency_key);
do $$ declare t text; begin foreach t in array array['angelcare360_audit_event_links','angelcare360_audit_snapshot_refs','angelcare360_audit_annotations','angelcare360_audit_evidence_items','angelcare360_audit_evidence_versions','angelcare360_audit_evidence_links','angelcare360_audit_evidence_requests','angelcare360_audit_evidence_verifications','angelcare360_audit_findings','angelcare360_audit_finding_sources','angelcare360_audit_investigations','angelcare360_audit_investigation_events','angelcare360_audit_investigation_evidence','angelcare360_audit_investigation_observations','angelcare360_audit_corrective_actions','angelcare360_audit_review_campaigns','angelcare360_audit_review_decisions','angelcare360_audit_export_requests','angelcare360_audit_export_items','angelcare360_audit_export_manifests','angelcare360_audit_preservation_holds','angelcare360_audit_redaction_requests','angelcare360_audit_integrity_runs','angelcare360_audit_integrity_findings','angelcare360_audit_tasks','angelcare360_audit_notes','angelcare360_audit_approval_reviews','angelcare360_audit_topup_requests','angelcare360_audit_action_receipts'] loop execute format('alter table public.%I enable row level security',t); execute format('drop policy if exists %I on public.%I','tenant_read_' || t,t); execute format('create policy %I on public.%I for select to authenticated using (public.angelcare360_area8_has_school_access(school_id))','tenant_read_' || t,t); execute format('revoke insert,update,delete on public.%I from anon,authenticated',t); end loop; end $$;
-- ---------------------------------------------------------------------------
-- AREA 8 R4 — CANONICAL PRODUCT-CONSTITUTION OPERATION REGISTRATION
--
-- Verified against the canonical table created by:
-- 20260802_angelcare360_customer_mz1_product_constitution_experience_kernel.sql
--
-- Canonical columns:
-- operation_key, route_path, feature_key, operation_name, permission_key,
-- audit_event, mutation_endpoints, source_confidence, status.
-- ---------------------------------------------------------------------------

do $area8_product_operations$
begin
  if to_regclass('public.angelcare360_operator_product_operations') is null then
    raise exception
      'Area 8 requires public.angelcare360_operator_product_operations from the Product Constitution migration.';
  end if;

  insert into public.angelcare360_operator_product_operations (
    operation_key,
    route_path,
    feature_key,
    operation_name,
    permission_key,
    audit_event,
    mutation_endpoints,
    source_confidence,
    status
  )
  select
    registry.operation_key,
    '/angelcare-360-command-center/administration?plane=audit&view=today',
    'administration.audit.workspace',
    registry.operation_name,
    'angelcare360.audit.' || registry.permission_action,
    'customer.' || registry.operation_key,
    '[]'::jsonb,
    'exact_source_static_audit',
    'published'
  from (
    values
    ('audit_event.view', 'view', 'view'),
    ('audit_event.view_sensitive', 'view_sensitive', 'view'),
    ('audit_event.compare_state', 'compare_state', 'view'),
    ('audit_event.link_related', 'link_related', 'update'),
    ('audit_event.annotate', 'annotate', 'update'),
    ('audit_event.request_explanation', 'request_explanation', 'notify'),
    ('audit_decision.view', 'view', 'view'),
    ('audit_decision.verify', 'verify', 'audit'),
    ('audit_decision.request_evidence', 'request_evidence', 'notify'),
    ('audit_decision.mark_for_review', 'mark_for_review', 'audit'),
    ('audit_evidence.create_reference', 'create_reference', 'create'),
    ('audit_evidence.upload', 'upload', 'create'),
    ('audit_evidence.link', 'link', 'create'),
    ('audit_evidence.request', 'request', 'create'),
    ('audit_evidence.remind', 'remind', 'notify'),
    ('audit_evidence.verify', 'verify', 'audit'),
    ('audit_evidence.reject_incomplete', 'reject_incomplete', 'update'),
    ('audit_evidence.replace', 'replace', 'update'),
    ('audit_evidence.restrict', 'restrict', 'update'),
    ('audit_evidence.archive', 'archive', 'update'),
    ('audit_evidence.protect_preservation', 'protect_preservation', 'update'),
    ('audit_finding.create', 'create', 'create'),
    ('audit_finding.assign', 'assign', 'assign'),
    ('audit_finding.acknowledge', 'acknowledge', 'update'),
    ('audit_finding.request_correction', 'request_correction', 'notify'),
    ('audit_finding.request_evidence', 'request_evidence', 'notify'),
    ('audit_finding.verify_resolution', 'verify_resolution', 'audit'),
    ('audit_finding.resolve', 'resolve', 'update'),
    ('audit_finding.accept_exception', 'accept_exception', 'approve'),
    ('audit_finding.reopen', 'reopen', 'update'),
    ('audit_finding.archive', 'archive', 'update'),
    ('audit_investigation.create', 'create', 'create'),
    ('audit_investigation.update_scope', 'update_scope', 'update'),
    ('audit_investigation.add_event', 'add_event', 'update'),
    ('audit_investigation.add_evidence', 'add_evidence', 'update'),
    ('audit_investigation.request_information', 'request_information', 'notify'),
    ('audit_investigation.assign_task', 'assign_task', 'assign'),
    ('audit_investigation.add_observation', 'add_observation', 'update'),
    ('audit_investigation.prepare_conclusion', 'prepare_conclusion', 'update'),
    ('audit_investigation.request_approval', 'request_approval', 'approve'),
    ('audit_investigation.approve_conclusion', 'approve_conclusion', 'approve'),
    ('audit_investigation.close', 'close', 'update'),
    ('audit_investigation.reopen', 'reopen', 'update'),
    ('audit_review.create', 'create', 'create'),
    ('audit_review.define_scope', 'define_scope', 'update'),
    ('audit_review.start', 'start', 'update'),
    ('audit_review.assign', 'assign', 'assign'),
    ('audit_review.confirm_item', 'confirm_item', 'audit'),
    ('audit_review.request_correction', 'request_correction', 'notify'),
    ('audit_review.request_evidence', 'request_evidence', 'notify'),
    ('audit_review.open_investigation', 'open_investigation', 'create'),
    ('audit_review.complete', 'complete', 'update'),
    ('audit_review.reopen', 'reopen', 'update'),
    ('audit_review.cancel', 'cancel', 'update'),
    ('audit_export.preview', 'preview', 'view'),
    ('audit_export.create', 'create', 'create'),
    ('audit_export.request_approval', 'request_approval', 'approve'),
    ('audit_export.approve', 'approve', 'approve'),
    ('audit_export.generate', 'generate', 'export'),
    ('audit_export.retry_item', 'retry_item', 'update'),
    ('audit_export.revoke', 'revoke', 'update'),
    ('audit_export.expire', 'expire', 'update'),
    ('audit_preservation.create', 'create', 'create'),
    ('audit_preservation.request_approval', 'request_approval', 'approve'),
    ('audit_preservation.approve', 'approve', 'approve'),
    ('audit_preservation.review', 'review', 'audit'),
    ('audit_preservation.release', 'release', 'update'),
    ('audit_redaction.request', 'request', 'create'),
    ('audit_redaction.approve', 'approve', 'approve'),
    ('audit_redaction.apply', 'apply', 'update'),
    ('audit_redaction.review', 'review', 'audit'),
    ('audit_integrity.verify', 'verify', 'audit'),
    ('audit_integrity.create_finding', 'create_finding', 'create'),
    ('audit_integrity.retry', 'retry', 'update'),
    ('audit_task.assign', 'assign', 'assign'),
    ('audit_task.complete', 'complete', 'update'),
    ('audit_task.reopen', 'reopen', 'update'),
    ('audit_note.add', 'add', 'create'),
    ('audit_topup.request', 'request', 'create')
  ) as registry(
    operation_key,
    operation_name,
    permission_action
  )
  on conflict (operation_key) do update
  set
    route_path = excluded.route_path,
    feature_key = excluded.feature_key,
    operation_name = excluded.operation_name,
    permission_key = excluded.permission_key,
    audit_event = excluded.audit_event,
    mutation_endpoints = excluded.mutation_endpoints,
    source_confidence = excluded.source_confidence,
    status = excluded.status,
    updated_at = now();
end;
$area8_product_operations$;
commit;