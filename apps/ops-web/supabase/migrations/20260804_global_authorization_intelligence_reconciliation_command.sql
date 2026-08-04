begin;

create extension if not exists pgcrypto;

create table if not exists public.access_scanner_capabilities (
  capability_key text primary key,
  capability_label text not null,
  status text not null default 'ready' check (status in ('ready','degraded','blocked')),
  detail text not null default '',
  scanner_version text not null,
  metadata jsonb not null default '{}'::jsonb,
  checked_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.access_scanner_jobs (
  id uuid primary key default gen_random_uuid(),
  status text not null check (status in ('queued','inventorying','running','paused','cancelled','finalizing','completed','failed')),
  stage text not null check (stage in ('repository_inventory','application_discovery','source_analysis','sql_analysis','database_introspection','topology_construction','authority_inference','reconciliation','snapshot_publication','completed')),
  mode text not null default 'full' check (mode in ('full','scoped','verification')),
  source_root text not null,
  scope jsonb not null default '{}'::jsonb,
  repository_commit text,
  scanner_version text not null,
  total_work_items integer not null default 0 check (total_work_items >= 0),
  completed_work_items integer not null default 0 check (completed_work_items >= 0),
  failed_work_items integer not null default 0 check (failed_work_items >= 0),
  current_item text,
  warnings text[] not null default '{}'::text[],
  error text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid,
  actor_email text,
  started_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  paused_at timestamptz,
  last_heartbeat_at timestamptz,
  elapsed_ms bigint not null default 0 check (elapsed_ms >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists access_scanner_jobs_status_idx on public.access_scanner_jobs(status, created_at desc);
create index if not exists access_scanner_jobs_stage_idx on public.access_scanner_jobs(stage, created_at desc);

create table if not exists public.access_scan_inventory_items (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.access_scanner_jobs(id) on delete cascade,
  relative_directory text not null default '',
  status text not null default 'pending' check (status in ('pending','claimed','completed','failed','cancelled')),
  worker_token text,
  claimed_at timestamptz,
  completed_at timestamptz,
  attempt_count integer not null default 0,
  error text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(job_id, relative_directory)
);

create index if not exists access_scan_inventory_items_claim_idx
  on public.access_scan_inventory_items(job_id, status, relative_directory);

create table if not exists public.access_scan_work_items (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.access_scanner_jobs(id) on delete cascade,
  sequence_number integer not null,
  status text not null default 'pending' check (status in ('pending','claimed','completed','failed','cancelled')),
  relative_path text not null,
  absolute_path text not null,
  file_kind text not null,
  extension text not null,
  size_bytes bigint not null default 0,
  checksum text not null,
  modified_at timestamptz,
  worker_token text,
  claimed_at timestamptz,
  completed_at timestamptz,
  attempt_count integer not null default 0,
  error text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(job_id, relative_path)
);

create index if not exists access_scan_work_items_claim_idx on public.access_scan_work_items(job_id, status, sequence_number);

create table if not exists public.access_authorization_evidence (
  id uuid primary key default gen_random_uuid(),
  scan_id uuid not null references public.access_scanner_jobs(id) on delete cascade,
  evidence_key text not null,
  evidence_kind text not null,
  subject_key text not null,
  object_key text,
  file_path text,
  line_start integer,
  line_end integer,
  database_object text,
  summary text not null,
  excerpt text,
  confidence text not null check (confidence in ('confirmed','high','probable','ambiguous','unresolved','contradictory')),
  confidence_score numeric(5,4) not null check (confidence_score >= 0 and confidence_score <= 1),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(scan_id, evidence_key)
);

create index if not exists access_authorization_evidence_subject_idx on public.access_authorization_evidence(scan_id, subject_key);
create index if not exists access_authorization_evidence_file_idx on public.access_authorization_evidence(scan_id, file_path, line_start);
create index if not exists access_authorization_evidence_kind_idx on public.access_authorization_evidence(scan_id, evidence_kind);

create table if not exists public.access_topology_nodes (
  id uuid primary key default gen_random_uuid(),
  scan_id uuid not null references public.access_scanner_jobs(id) on delete cascade,
  node_key text not null,
  node_type text not null,
  canonical_key text not null,
  display_name text not null,
  application_key text,
  module_key text,
  workspace_key text,
  authority_model text,
  risk_level text not null default 'controlled' check (risk_level in ('low','controlled','high','critical')),
  confidence text not null check (confidence in ('confirmed','high','probable','ambiguous','unresolved','contradictory')),
  confidence_score numeric(5,4) not null check (confidence_score >= 0 and confidence_score <= 1),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(scan_id, node_key)
);

create index if not exists access_topology_nodes_type_idx on public.access_topology_nodes(scan_id, node_type);
create index if not exists access_topology_nodes_application_idx on public.access_topology_nodes(scan_id, application_key, module_key, workspace_key);
create index if not exists access_topology_nodes_authority_idx on public.access_topology_nodes(scan_id, authority_model);

create table if not exists public.access_topology_edges (
  id uuid primary key default gen_random_uuid(),
  scan_id uuid not null references public.access_scanner_jobs(id) on delete cascade,
  edge_key text not null,
  source_node_key text not null,
  target_node_key text not null,
  edge_type text not null,
  confidence text not null check (confidence in ('confirmed','high','probable','ambiguous','unresolved','contradictory')),
  confidence_score numeric(5,4) not null check (confidence_score >= 0 and confidence_score <= 1),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(scan_id, edge_key)
);

create index if not exists access_topology_edges_source_idx on public.access_topology_edges(scan_id, source_node_key, edge_type);
create index if not exists access_topology_edges_target_idx on public.access_topology_edges(scan_id, target_node_key, edge_type);

create table if not exists public.access_authority_manifests (
  id uuid primary key default gen_random_uuid(),
  scan_id uuid not null references public.access_scanner_jobs(id) on delete cascade,
  manifest_key text not null,
  application_key text not null,
  module_key text,
  display_name text not null,
  authority_models text[] not null default '{}'::text[],
  identity_authority jsonb not null default '{}'::jsonb,
  global_authority jsonb not null default '{}'::jsonb,
  membership_authority jsonb not null default '{}'::jsonb,
  role_authority jsonb not null default '{}'::jsonb,
  permission_authority jsonb not null default '{}'::jsonb,
  tenant_authority jsonb not null default '{}'::jsonb,
  organization_authority jsonb not null default '{}'::jsonb,
  workspace_authority jsonb not null default '{}'::jsonb,
  entitlement_authority jsonb not null default '{}'::jsonb,
  rls_authority jsonb not null default '{}'::jsonb,
  revocation_authority jsonb not null default '{}'::jsonb,
  audit_authority jsonb not null default '{}'::jsonb,
  cache_authority jsonb not null default '{}'::jsonb,
  mutation_authority jsonb not null default '{}'::jsonb,
  evidence_keys text[] not null default '{}'::text[],
  confidence text not null check (confidence in ('confirmed','high','probable','ambiguous','unresolved','contradictory')),
  confidence_score numeric(5,4) not null check (confidence_score >= 0 and confidence_score <= 1),
  validation_status text not null default 'generated' check (validation_status in ('generated','review_required','confirmed','invalidated','retired')),
  executable boolean not null default false,
  unresolved text[] not null default '{}'::text[],
  metadata jsonb not null default '{}'::jsonb,
  confirmed_by uuid,
  confirmed_at timestamptz,
  invalidated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(scan_id, manifest_key)
);

create index if not exists access_authority_manifests_application_idx on public.access_authority_manifests(scan_id, application_key, validation_status);

create table if not exists public.access_manual_mappings (
  id uuid primary key default gen_random_uuid(),
  mapping_key text not null unique,
  application_key text not null,
  mapping_type text not null,
  mapping jsonb not null,
  justification text not null,
  evidence_keys text[] not null default '{}'::text[],
  status text not null default 'active' check (status in ('draft','active','invalidated','retired')),
  source_commit text,
  source_schema_fingerprint text,
  approved_by uuid,
  approved_at timestamptz,
  invalidated_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.access_reconciliation_findings (
  id uuid primary key default gen_random_uuid(),
  scan_id uuid not null references public.access_scanner_jobs(id) on delete cascade,
  finding_key text not null,
  reconciliation_state text not null,
  severity text not null check (severity in ('info','review','high','critical')),
  application_key text,
  module_key text,
  workspace_key text,
  operation_key text,
  user_id uuid,
  tenant_id text,
  organization_id text,
  title text not null,
  explanation text not null,
  expected_state jsonb not null default '{}'::jsonb,
  effective_state jsonb not null default '{}'::jsonb,
  evidence_keys text[] not null default '{}'::text[],
  confidence text not null check (confidence in ('confirmed','high','probable','ambiguous','unresolved','contradictory')),
  confidence_score numeric(5,4) not null check (confidence_score >= 0 and confidence_score <= 1),
  execution_eligible boolean not null default false,
  blocked_reasons text[] not null default '{}'::text[],
  proposed_operations text[] not null default '{}'::text[],
  status text not null default 'open' check (status in ('open','accepted','planned','resolved','dismissed')),
  metadata jsonb not null default '{}'::jsonb,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(scan_id, finding_key)
);

create index if not exists access_reconciliation_findings_state_idx on public.access_reconciliation_findings(scan_id, reconciliation_state, severity);
create index if not exists access_reconciliation_findings_user_idx on public.access_reconciliation_findings(scan_id, user_id, module_key);

create table if not exists public.access_reconciliation_plans (
  id uuid primary key default gen_random_uuid(),
  plan_key text not null unique,
  title text not null,
  description text not null default '',
  status text not null check (status in ('draft','review_required','approved','executing','completed','failed','rolled_back','expired')),
  risk_level text not null check (risk_level in ('low','controlled','high','critical')),
  source_scan_id uuid not null references public.access_scanner_jobs(id),
  finding_keys text[] not null default '{}'::text[],
  simulation jsonb not null default '{}'::jsonb,
  execution_eligible boolean not null default false,
  blocked_reasons text[] not null default '{}'::text[],
  expires_at timestamptz,
  approved_at timestamptz,
  approved_by uuid,
  created_by uuid,
  actor_email text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists access_reconciliation_plans_status_idx on public.access_reconciliation_plans(status, created_at desc);

create table if not exists public.access_plan_operations (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.access_reconciliation_plans(id) on delete cascade,
  operation_key text not null,
  operation_type text not null,
  sequence_number integer not null,
  title text not null,
  explanation text not null,
  risk_level text not null check (risk_level in ('low','controlled','high','critical')),
  before_state jsonb not null default '{}'::jsonb,
  proposed_state jsonb not null default '{}'::jsonb,
  target jsonb not null default '{}'::jsonb,
  authority_manifest_key text,
  mutation_rpc text,
  mutation_arguments jsonb not null default '{}'::jsonb,
  verification_rpc text,
  verification_arguments jsonb not null default '{}'::jsonb,
  rollback_rpc text,
  rollback_arguments jsonb not null default '{}'::jsonb,
  evidence_keys text[] not null default '{}'::text[],
  execution_eligible boolean not null default false,
  blocked_reasons text[] not null default '{}'::text[],
  status text not null default 'pending' check (status in ('pending','running','completed','failed','rolled_back','skipped')),
  result jsonb,
  error text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(plan_id, operation_key),
  unique(plan_id, sequence_number)
);

create index if not exists access_plan_operations_plan_idx on public.access_plan_operations(plan_id, sequence_number);

create table if not exists public.access_plan_approvals (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.access_reconciliation_plans(id) on delete cascade,
  decision text not null check (decision in ('approved','rejected','revoked')),
  actor_user_id uuid,
  actor_email text,
  comment text,
  plan_fingerprint text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.access_execution_runs (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.access_reconciliation_plans(id),
  status text not null check (status in ('preflight','running','verifying','completed','failed','rolling_back','rolled_back')),
  correlation_id text not null unique,
  actor_user_id uuid,
  actor_email text,
  repository_commit text,
  schema_fingerprint text,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  failure_stage text,
  error text,
  result jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists access_execution_runs_plan_idx on public.access_execution_runs(plan_id, started_at desc);

create table if not exists public.access_execution_checkpoints (
  id uuid primary key default gen_random_uuid(),
  execution_id uuid not null references public.access_execution_runs(id) on delete cascade,
  operation_id uuid references public.access_plan_operations(id),
  checkpoint_key text not null,
  sequence_number integer not null,
  status text not null check (status in ('pending','running','passed','failed','rolled_back','skipped')),
  detail text,
  payload jsonb not null default '{}'::jsonb,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  unique(execution_id, checkpoint_key)
);

create table if not exists public.access_verification_results (
  id uuid primary key default gen_random_uuid(),
  execution_id uuid not null references public.access_execution_runs(id) on delete cascade,
  operation_id uuid references public.access_plan_operations(id),
  verification_type text not null,
  status text not null check (status in ('passed','failed','blocked','not_applicable')),
  expected_state jsonb not null default '{}'::jsonb,
  observed_state jsonb not null default '{}'::jsonb,
  evidence jsonb not null default '{}'::jsonb,
  error text,
  verified_at timestamptz not null default now()
);

create table if not exists public.access_rollback_packages (
  id uuid primary key default gen_random_uuid(),
  execution_id uuid not null references public.access_execution_runs(id),
  status text not null default 'available' check (status in ('available','expired','running','completed','failed','not_available')),
  before_topology jsonb not null default '{}'::jsonb,
  after_topology jsonb not null default '{}'::jsonb,
  rollback_operations jsonb not null default '[]'::jsonb,
  evidence jsonb not null default '{}'::jsonb,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.access_authorization_cache_epoch (
  cache_scope text primary key,
  epoch bigint not null default 1,
  updated_at timestamptz not null default now(),
  updated_by uuid
);

insert into public.access_authorization_cache_epoch(cache_scope, epoch)
values ('global', 1)
on conflict (cache_scope) do nothing;

create table if not exists public.access_command_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  actor_user_id uuid,
  actor_email text,
  correlation_id text,
  scan_id uuid,
  plan_id uuid,
  execution_id uuid,
  summary text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists access_command_events_created_idx on public.access_command_events(created_at desc);

alter table public.access_scanner_capabilities enable row level security;
alter table public.access_scanner_jobs enable row level security;
alter table public.access_scan_inventory_items enable row level security;
alter table public.access_scan_work_items enable row level security;
alter table public.access_authorization_evidence enable row level security;
alter table public.access_topology_nodes enable row level security;
alter table public.access_topology_edges enable row level security;
alter table public.access_authority_manifests enable row level security;
alter table public.access_manual_mappings enable row level security;
alter table public.access_reconciliation_findings enable row level security;
alter table public.access_reconciliation_plans enable row level security;
alter table public.access_plan_operations enable row level security;
alter table public.access_plan_approvals enable row level security;
alter table public.access_execution_runs enable row level security;
alter table public.access_execution_checkpoints enable row level security;
alter table public.access_verification_results enable row level security;
alter table public.access_rollback_packages enable row level security;
alter table public.access_authorization_cache_epoch enable row level security;
alter table public.access_command_events enable row level security;

create or replace function public.access_governance_claim_inventory_items(
  p_job_id uuid,
  p_worker_token text,
  p_limit integer default 20
)
returns table (
  id uuid,
  job_id uuid,
  relative_directory text
)
language plpgsql
security definer
set search_path = public
as $function$
begin
  if p_job_id is null or coalesce(p_worker_token, '') = '' then
    raise exception 'Job id and worker token are required';
  end if;

  return query
  with candidates as (
    select work.id
    from public.access_scan_inventory_items work
    join public.access_scanner_jobs job on job.id = work.job_id
    where work.job_id = p_job_id
      and work.status = 'pending'
      and job.status = 'inventorying'
    order by work.relative_directory
    for update of work skip locked
    limit greatest(1, least(coalesce(p_limit, 20), 100))
  ), claimed as (
    update public.access_scan_inventory_items work
    set status = 'claimed',
        worker_token = p_worker_token,
        claimed_at = now(),
        attempt_count = work.attempt_count + 1,
        updated_at = now()
    from candidates
    where work.id = candidates.id
    returning work.*
  )
  select claimed.id, claimed.job_id, claimed.relative_directory
  from claimed
  order by claimed.relative_directory;
end;
$function$;

create or replace function public.access_governance_claim_scan_work_items(
  p_job_id uuid,
  p_worker_token text,
  p_limit integer default 20
)
returns table (
  id uuid,
  job_id uuid,
  relative_path text,
  absolute_path text,
  file_kind text,
  extension text,
  size_bytes bigint,
  checksum text,
  modified_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $function$
begin
  if p_job_id is null or coalesce(p_worker_token, '') = '' then
    raise exception 'Job id and worker token are required';
  end if;

  return query
  with candidates as (
    select work.id
    from public.access_scan_work_items work
    join public.access_scanner_jobs job on job.id = work.job_id
    where work.job_id = p_job_id
      and work.status = 'pending'
      and job.status = 'running'
    order by work.sequence_number
    for update of work skip locked
    limit greatest(1, least(coalesce(p_limit, 20), 100))
  ), claimed as (
    update public.access_scan_work_items work
    set status = 'claimed',
        worker_token = p_worker_token,
        claimed_at = now(),
        attempt_count = work.attempt_count + 1,
        updated_at = now()
    from candidates
    where work.id = candidates.id
    returning work.*
  )
  select claimed.id, claimed.job_id, claimed.relative_path, claimed.absolute_path,
         claimed.file_kind, claimed.extension, claimed.size_bytes, claimed.checksum, claimed.modified_at
  from claimed
  order by claimed.sequence_number;
end;
$function$;

create or replace function public.access_governance_introspect_authority()
returns jsonb
language sql
security definer
set search_path = public, pg_catalog
stable
as $function$
with public_tables as (
  select n.nspname as schema_name,
         c.relname as table_name,
         c.oid as table_oid,
         c.relrowsecurity as rls_enabled
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relkind in ('r','p')
), table_columns as (
  select t.table_oid,
         jsonb_agg(jsonb_build_object(
           'name', a.attname,
           'dataType', format_type(a.atttypid, a.atttypmod),
           'nullable', not a.attnotnull,
           'defaultValue', pg_get_expr(d.adbin, d.adrelid)
         ) order by a.attnum) as columns
  from public_tables t
  join pg_attribute a on a.attrelid = t.table_oid and a.attnum > 0 and not a.attisdropped
  left join pg_attrdef d on d.adrelid = a.attrelid and d.adnum = a.attnum
  group by t.table_oid
), primary_keys as (
  select con.conrelid as table_oid,
         jsonb_agg(att.attname order by key_position.ordinality) as columns
  from pg_constraint con
  cross join lateral unnest(con.conkey) with ordinality as key_position(attnum, ordinality)
  join pg_attribute att on att.attrelid = con.conrelid and att.attnum = key_position.attnum
  where con.contype = 'p'
  group by con.conrelid
), unique_constraints as (
  select grouped.table_oid, jsonb_agg(grouped.columns) as constraints
  from (
    select con.conrelid as table_oid,
           jsonb_agg(att.attname order by key_position.ordinality) as columns
    from pg_constraint con
    cross join lateral unnest(con.conkey) with ordinality as key_position(attnum, ordinality)
    join pg_attribute att on att.attrelid = con.conrelid and att.attnum = key_position.attnum
    where con.contype = 'u'
    group by con.oid, con.conrelid
  ) grouped
  group by grouped.table_oid
), foreign_keys as (
  select con.conrelid as table_oid,
         jsonb_agg(jsonb_build_object(
           'column', local_att.attname,
           'foreignSchema', foreign_ns.nspname,
           'foreignTable', foreign_table.relname,
           'foreignColumn', foreign_att.attname
         )) as foreign_keys
  from pg_constraint con
  join pg_class foreign_table on foreign_table.oid = con.confrelid
  join pg_namespace foreign_ns on foreign_ns.oid = foreign_table.relnamespace
  cross join lateral unnest(con.conkey, con.confkey) as keys(local_attnum, foreign_attnum)
  join pg_attribute local_att on local_att.attrelid = con.conrelid and local_att.attnum = keys.local_attnum
  join pg_attribute foreign_att on foreign_att.attrelid = con.confrelid and foreign_att.attnum = keys.foreign_attnum
  where con.contype = 'f'
  group by con.conrelid
), tables_payload as (
  select jsonb_agg(jsonb_build_object(
    'schema', t.schema_name,
    'name', t.table_name,
    'rlsEnabled', t.rls_enabled,
    'columns', coalesce(tc.columns, '[]'::jsonb),
    'primaryKey', coalesce(pk.columns, '[]'::jsonb),
    'uniqueConstraints', coalesce(uc.constraints, '[]'::jsonb),
    'foreignKeys', coalesce(fk.foreign_keys, '[]'::jsonb)
  ) order by t.table_name) as tables
  from public_tables t
  left join table_columns tc on tc.table_oid = t.table_oid
  left join primary_keys pk on pk.table_oid = t.table_oid
  left join unique_constraints uc on uc.table_oid = t.table_oid
  left join foreign_keys fk on fk.table_oid = t.table_oid
), policies_payload as (
  select jsonb_agg(jsonb_build_object(
    'schema', schemaname,
    'table', tablename,
    'name', policyname,
    'command', cmd,
    'roles', roles,
    'usingExpression', qual,
    'checkExpression', with_check
  ) order by tablename, policyname) as policies
  from pg_policies
  where schemaname = 'public'
), functions_payload as (
  select jsonb_agg(jsonb_build_object(
    'schema', n.nspname,
    'name', p.proname,
    'identityArguments', pg_get_function_identity_arguments(p.oid),
    'securityDefiner', p.prosecdef,
    'volatility', p.provolatile
  ) order by p.proname) as functions
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
)
select jsonb_build_object(
  'generatedAt', now(),
  'tables', coalesce((select tables from tables_payload), '[]'::jsonb),
  'policies', coalesce((select policies from policies_payload), '[]'::jsonb),
  'functions', coalesce((select functions from functions_payload), '[]'::jsonb)
);
$function$;

create or replace function public.access_governance_bump_cache_epoch(
  p_scope text default 'global',
  p_actor_id uuid default null
)
returns bigint
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_epoch bigint;
begin
  insert into public.access_authorization_cache_epoch(cache_scope, epoch, updated_at, updated_by)
  values (coalesce(nullif(p_scope, ''), 'global'), 2, now(), p_actor_id)
  on conflict (cache_scope)
  do update set epoch = public.access_authorization_cache_epoch.epoch + 1,
                updated_at = now(),
                updated_by = excluded.updated_by
  returning epoch into v_epoch;
  return v_epoch;
end;
$function$;

create or replace function public.access_governance_command_overview()
returns jsonb
language sql
security definer
set search_path = public
stable
as $function$
with latest_job as (
  select to_jsonb(job.*) as payload
  from public.access_scanner_jobs job
  order by job.created_at desc
  limit 1
), latest_scan as (
  select id from public.access_scanner_jobs where status = 'completed' order by completed_at desc nulls last limit 1
), node_counts as (
  select
    count(*) filter (where node_type = 'application') as applications,
    count(*) filter (where node_type = 'module') as modules,
    count(*) filter (where node_type = 'workspace') as workspaces,
    count(*) filter (where node_type = 'page') as pages,
    count(*) filter (where node_type = 'api_operation') as api_operations,
    count(*) filter (where node_type = 'server_action') as server_actions,
    count(*) filter (where node_type in ('authorization_guard','authentication_guard')) as protected_operations,
    count(*) filter (where node_type = 'permission') as permissions,
    count(*) filter (where node_type in ('membership_authority','database_function','database_table','entitlement')) as native_authorities,
    count(*) filter (where node_type = 'rls_policy') as rls_policies,
    count(*) filter (where node_type = 'unknown_authority' or authority_model = 'UNKNOWN') as unknown_authorities
  from public.access_topology_nodes
  where scan_id = (select id from latest_scan)
), finding_counts as (
  select count(*) as findings,
         count(*) filter (where severity = 'critical' and status = 'open') as critical_findings
  from public.access_reconciliation_findings
  where scan_id = (select id from latest_scan)
), plan_counts as (
  select count(*) filter (where status in ('draft','review_required','approved')) as open_plans
  from public.access_reconciliation_plans
), execution_counts as (
  select count(*) filter (where status in ('preflight','running','verifying','rolling_back')) as running_executions
  from public.access_execution_runs
), drift as (
  select coalesce(jsonb_object_agg(reconciliation_state, quantity), '{}'::jsonb) as payload
  from (select reconciliation_state, count(*) as quantity from public.access_reconciliation_findings where scan_id = (select id from latest_scan) group by reconciliation_state) grouped
), risks as (
  select coalesce(jsonb_object_agg(severity, quantity), '{}'::jsonb) as payload
  from (select severity, count(*) as quantity from public.access_reconciliation_findings where scan_id = (select id from latest_scan) group by severity) grouped
), models as (
  select coalesce(jsonb_object_agg(authority_model, quantity), '{}'::jsonb) as payload
  from (select coalesce(authority_model, 'UNCLASSIFIED') as authority_model, count(*) as quantity from public.access_topology_nodes where scan_id = (select id from latest_scan) group by coalesce(authority_model, 'UNCLASSIFIED')) grouped
), capability_payload as (
  select coalesce(jsonb_agg(jsonb_build_object('key', capability_key, 'label', capability_label, 'status', status, 'detail', detail) order by capability_key), '[]'::jsonb) as payload
  from public.access_scanner_capabilities
)
select jsonb_build_object(
  'generatedAt', now(),
  'scannerVersion', coalesce((select scanner_version from public.access_scanner_jobs order by created_at desc limit 1), '4.0.0'),
  'repositoryCommit', (select repository_commit from public.access_scanner_jobs order by created_at desc limit 1),
  'capabilityStatus', case when exists(select 1 from public.access_scanner_capabilities where status = 'blocked') then 'blocked' when exists(select 1 from public.access_scanner_capabilities where status = 'degraded') then 'degraded' else 'ready' end,
  'latestJob', coalesce((select payload from latest_job), 'null'::jsonb),
  'counts', jsonb_build_object(
    'applications', coalesce((select applications from node_counts),0),
    'modules', coalesce((select modules from node_counts),0),
    'workspaces', coalesce((select workspaces from node_counts),0),
    'pages', coalesce((select pages from node_counts),0),
    'apiOperations', coalesce((select api_operations from node_counts),0),
    'serverActions', coalesce((select server_actions from node_counts),0),
    'protectedOperations', coalesce((select protected_operations from node_counts),0),
    'unprotectedOperations', coalesce((select findings from finding_counts),0),
    'permissionNamespaces', coalesce((select permissions from node_counts),0),
    'nativeAuthorities', coalesce((select native_authorities from node_counts),0),
    'rlsPolicies', coalesce((select rls_policies from node_counts),0),
    'unknownAuthorities', coalesce((select unknown_authorities from node_counts),0),
    'findings', coalesce((select findings from finding_counts),0),
    'criticalFindings', coalesce((select critical_findings from finding_counts),0),
    'openPlans', coalesce((select open_plans from plan_counts),0),
    'runningExecutions', coalesce((select running_executions from execution_counts),0)
  ),
  'health', jsonb_build_object(
    'repositoryDiscovery', case when (select id from latest_scan) is null then 0 else 100 end,
    'authorizationIntelligence', greatest(0, 100 - least(100, coalesce((select unknown_authorities from node_counts),0))),
    'scopeIntegrity', greatest(0, 100 - least(100, coalesce((select count(*) from public.access_reconciliation_findings where scan_id = (select id from latest_scan) and reconciliation_state = 'SCOPE_MISMATCH'),0) * 10)),
    'reconciliationReadiness', greatest(0, 100 - least(100, coalesce((select findings from finding_counts),0))),
    'executionReadiness', case when exists(select 1 from public.access_authority_manifests where scan_id = (select id from latest_scan) and executable = true and validation_status = 'confirmed') then 100 else 25 end
  ),
  'riskDistribution', coalesce((select payload from risks), '{}'::jsonb),
  'driftDistribution', coalesce((select payload from drift), '{}'::jsonb),
  'authorityModels', coalesce((select payload from models), '{}'::jsonb),
  'capabilities', coalesce((select payload from capability_payload), '[]'::jsonb)
);
$function$;

create or replace function public.access_governance_execute_plan(
  p_plan_id uuid,
  p_actor_id uuid,
  p_actor_email text,
  p_correlation_id text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_plan public.access_reconciliation_plans%rowtype;
  v_operation public.access_plan_operations%rowtype;
  v_manifest public.access_authority_manifests%rowtype;
  v_execution_id uuid := gen_random_uuid();
  v_result jsonb;
  v_verification_result jsonb;
  v_cache_epoch bigint;
  v_operation_count integer := 0;
  v_verification_count integer := 0;
  v_rollback_operations jsonb := '[]'::jsonb;
begin
  select * into v_plan from public.access_reconciliation_plans where id = p_plan_id for update;
  if not found then raise exception 'Reconciliation plan was not found'; end if;
  if v_plan.status <> 'approved' then raise exception 'Plan must be approved before execution'; end if;
  if not v_plan.execution_eligible then raise exception 'Plan is not execution eligible: %', array_to_string(v_plan.blocked_reasons, '; '); end if;
  if v_plan.expires_at is not null and v_plan.expires_at <= now() then raise exception 'Plan has expired'; end if;
  if coalesce(p_correlation_id, '') = '' then raise exception 'Correlation id is required'; end if;

  if exists (
    select 1 from public.access_plan_operations
    where plan_id = p_plan_id
      and (not execution_eligible or cardinality(blocked_reasons) > 0)
  ) then
    raise exception 'Plan contains blocked or ineligible operations';
  end if;

  insert into public.access_execution_runs(id, plan_id, status, correlation_id, actor_user_id, actor_email, started_at)
  values (v_execution_id, p_plan_id, 'preflight', p_correlation_id, p_actor_id, p_actor_email, now());
  update public.access_execution_runs set status = 'running', updated_at = now() where id = v_execution_id;
  update public.access_reconciliation_plans set status = 'executing', updated_at = now() where id = p_plan_id;

  begin
  for v_operation in
    select * from public.access_plan_operations where plan_id = p_plan_id order by sequence_number for update
  loop
    update public.access_plan_operations set status = 'running', started_at = now(), updated_at = now() where id = v_operation.id;
    insert into public.access_execution_checkpoints(execution_id, operation_id, checkpoint_key, sequence_number, status, detail, started_at)
    values (v_execution_id, v_operation.id, v_operation.operation_key, v_operation.sequence_number, 'running', v_operation.title, now());

    if v_operation.operation_type = 'WRITE_AUDIT_EVENT' then
      insert into public.access_command_events(event_type, actor_user_id, actor_email, correlation_id, scan_id, plan_id, execution_id, summary, payload)
      values ('authorization_plan_operation', p_actor_id, p_actor_email, p_correlation_id, v_plan.source_scan_id, p_plan_id, v_execution_id, v_operation.title, v_operation.mutation_arguments);
      v_result := jsonb_build_object('ok', true, 'auditEvent', true);

    elsif v_operation.operation_type = 'INVALIDATE_AUTHORIZATION_CACHE' then
      v_cache_epoch := public.access_governance_bump_cache_epoch(coalesce(v_operation.target->>'moduleKey', 'global'), p_actor_id);
      v_result := jsonb_build_object('ok', true, 'cacheEpoch', v_cache_epoch);

    else
      select * into v_manifest
      from public.access_authority_manifests
      where manifest_key = v_operation.authority_manifest_key
        and validation_status = 'confirmed'
        and executable = true
      order by updated_at desc
      limit 1;
      if not found then raise exception 'Confirmed executable authority manifest is missing for operation %', v_operation.operation_key; end if;

      if v_operation.operation_type = 'VERIFY_EFFECTIVE_ACCESS' then
        if coalesce(v_operation.verification_rpc, '') = '' then
          raise exception 'Verification operation % has no verification RPC', v_operation.operation_key;
        end if;
        if v_operation.verification_rpc !~ '^[a-z_][a-z0-9_]{0,62}$' then
          raise exception 'Verification operation % contains an unsafe RPC identifier', v_operation.operation_key;
        end if;
        if v_manifest.mutation_authority->>'verificationRpc' <> v_operation.verification_rpc then
          raise exception 'Verification RPC % is not registered by the confirmed manifest', v_operation.verification_rpc;
        end if;
        execute format('select public.%I($1::jsonb)', v_operation.verification_rpc)
        using v_operation.verification_arguments
        into v_result;
        insert into public.access_verification_results(
          execution_id, operation_id, verification_type, status,
          expected_state, observed_state, evidence, error
        ) values (
          v_execution_id, v_operation.id, 'effective_access',
          case when coalesce((v_result->>'ok')::boolean, false) then 'passed' else 'failed' end,
          v_operation.proposed_state, coalesce(v_result, '{}'::jsonb),
          jsonb_build_object('rpc', v_operation.verification_rpc, 'evidenceKeys', to_jsonb(v_operation.evidence_keys)),
          case when coalesce((v_result->>'ok')::boolean, false) then null else 'Verification RPC returned an unsuccessful result' end
        );
        if coalesce((v_result->>'ok')::boolean, false) is not true then
          raise exception 'Verification RPC % did not return a verified ok result', v_operation.verification_rpc;
        end if;
        v_verification_count := v_verification_count + 1;

      else
        if coalesce(v_operation.mutation_rpc, '') = '' then
          raise exception 'Operation % has no mutation RPC', v_operation.operation_key;
        end if;
        if v_operation.mutation_rpc !~ '^[a-z_][a-z0-9_]{0,62}$' then
          raise exception 'Operation % contains an unsafe RPC identifier', v_operation.operation_key;
        end if;
        if v_manifest.mutation_authority->>'rpc' <> v_operation.mutation_rpc then
          raise exception 'Mutation RPC % is not registered by the confirmed manifest', v_operation.mutation_rpc;
        end if;
        execute format('select public.%I($1::jsonb)', v_operation.mutation_rpc)
        using v_operation.mutation_arguments
        into v_result;
        if coalesce((v_result->>'ok')::boolean, false) is not true then
          raise exception 'Mutation RPC % did not return a verified ok result', v_operation.mutation_rpc;
        end if;

        if coalesce(v_operation.verification_rpc, '') <> '' then
          if v_operation.verification_rpc !~ '^[a-z_][a-z0-9_]{0,62}$' then
            raise exception 'Operation % contains an unsafe verification RPC identifier', v_operation.operation_key;
          end if;
          if v_manifest.mutation_authority->>'verificationRpc' <> v_operation.verification_rpc then
            raise exception 'Verification RPC % is not registered by the confirmed manifest', v_operation.verification_rpc;
          end if;
          update public.access_execution_runs set status = 'verifying', updated_at = now() where id = v_execution_id;
          execute format('select public.%I($1::jsonb)', v_operation.verification_rpc)
          using v_operation.verification_arguments
          into v_verification_result;
          insert into public.access_verification_results(
            execution_id, operation_id, verification_type, status,
            expected_state, observed_state, evidence, error
          ) values (
            v_execution_id, v_operation.id, 'post_mutation',
            case when coalesce((v_verification_result->>'ok')::boolean, false) then 'passed' else 'failed' end,
            v_operation.proposed_state, coalesce(v_verification_result, '{}'::jsonb),
            jsonb_build_object('rpc', v_operation.verification_rpc, 'evidenceKeys', to_jsonb(v_operation.evidence_keys)),
            case when coalesce((v_verification_result->>'ok')::boolean, false) then null else 'Post-mutation verification returned an unsuccessful result' end
          );
          if coalesce((v_verification_result->>'ok')::boolean, false) is not true then
            raise exception 'Post-mutation verification RPC % did not return a verified ok result', v_operation.verification_rpc;
          end if;
          v_verification_count := v_verification_count + 1;
          update public.access_execution_runs set status = 'running', updated_at = now() where id = v_execution_id;
        end if;

        if coalesce(v_operation.rollback_rpc, '') <> '' then
          if v_operation.rollback_rpc !~ '^[a-z_][a-z0-9_]{0,62}$' then
            raise exception 'Operation % contains an unsafe rollback RPC identifier', v_operation.operation_key;
          end if;
          if v_manifest.mutation_authority->>'rollbackRpc' <> v_operation.rollback_rpc then
            raise exception 'Rollback RPC % is not registered by the confirmed manifest', v_operation.rollback_rpc;
          end if;
          v_rollback_operations := jsonb_insert(
            v_rollback_operations,
            '{0}',
            jsonb_build_object(
              'operationId', v_operation.id,
              'operationKey', v_operation.operation_key,
              'sequence', v_operation.sequence_number,
              'manifestKey', v_operation.authority_manifest_key,
              'rpc', v_operation.rollback_rpc,
              'arguments', v_operation.rollback_arguments
            ),
            true
          );
        end if;
      end if;
    end if;

    update public.access_plan_operations set status = 'completed', result = v_result, completed_at = now(), updated_at = now() where id = v_operation.id;
    update public.access_execution_checkpoints set status = 'passed', payload = coalesce(v_result, '{}'::jsonb), completed_at = now() where execution_id = v_execution_id and checkpoint_key = v_operation.operation_key;
    v_operation_count := v_operation_count + 1;
  end loop;

  insert into public.access_rollback_packages(
    execution_id, status, before_topology, after_topology,
    rollback_operations, evidence, expires_at
  ) values (
    v_execution_id,
    case when jsonb_array_length(v_rollback_operations) > 0 then 'available' else 'not_available' end,
    jsonb_build_object('planId', p_plan_id, 'findingKeys', to_jsonb(v_plan.finding_keys)),
    v_plan.simulation,
    v_rollback_operations,
    jsonb_build_object('scanId', v_plan.source_scan_id, 'correlationId', p_correlation_id),
    now() + interval '7 days'
  );

  update public.access_execution_runs set status = 'completed', completed_at = now(), result = jsonb_build_object('operations', v_operation_count, 'verifications', v_verification_count), updated_at = now() where id = v_execution_id;
  update public.access_reconciliation_plans set status = 'completed', updated_at = now() where id = p_plan_id;
  insert into public.access_command_events(event_type, actor_user_id, actor_email, correlation_id, scan_id, plan_id, execution_id, summary, payload)
  values ('authorization_plan_completed', p_actor_id, p_actor_email, p_correlation_id, v_plan.source_scan_id, p_plan_id, v_execution_id, 'Authorization reconciliation plan completed transactionally and passed verification.', jsonb_build_object('operations', v_operation_count, 'verifications', v_verification_count));

  return jsonb_build_object('ok', true, 'executionId', v_execution_id, 'operations', v_operation_count, 'verifications', v_verification_count);
  exception
    when others then
      update public.access_execution_runs
      set status = 'failed', failure_stage = coalesce(v_operation.operation_key, 'transaction'), error = sqlerrm, completed_at = now(), updated_at = now()
      where id = v_execution_id;
      update public.access_reconciliation_plans set status = 'failed', updated_at = now() where id = p_plan_id;
      insert into public.access_command_events(event_type, actor_user_id, actor_email, correlation_id, scan_id, plan_id, execution_id, summary, payload)
      values ('authorization_plan_failed', p_actor_id, p_actor_email, p_correlation_id, v_plan.source_scan_id, p_plan_id, v_execution_id, 'Authorization reconciliation transaction failed and was rolled back.', jsonb_build_object('error', sqlerrm, 'operationKey', v_operation.operation_key));
      return jsonb_build_object('ok', false, 'executionId', v_execution_id, 'error', sqlerrm, 'failureStage', coalesce(v_operation.operation_key, 'transaction'));
  end;
end;
$function$;

create or replace function public.access_governance_execute_rollback(
  p_package_id uuid,
  p_actor_id uuid,
  p_actor_email text,
  p_correlation_id text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_package public.access_rollback_packages%rowtype;
  v_execution public.access_execution_runs%rowtype;
  v_item jsonb;
  v_result jsonb;
  v_count integer := 0;
begin
  if coalesce(p_correlation_id, '') = '' then raise exception 'Correlation id is required'; end if;
  select * into v_package from public.access_rollback_packages where id = p_package_id for update;
  if not found then raise exception 'Rollback package was not found'; end if;
  if v_package.status <> 'available' then raise exception 'Rollback package is not available'; end if;
  if v_package.expires_at is not null and v_package.expires_at <= now() then
    update public.access_rollback_packages set status = 'expired', updated_at = now() where id = p_package_id;
    raise exception 'Rollback package has expired';
  end if;
  select * into v_execution from public.access_execution_runs where id = v_package.execution_id for update;
  if not found or v_execution.status <> 'completed' then raise exception 'Only a completed execution can be rolled back'; end if;

  update public.access_rollback_packages set status = 'running', updated_at = now() where id = p_package_id;
  update public.access_execution_runs set status = 'rolling_back', updated_at = now() where id = v_execution.id;

  begin
  for v_item in select value from jsonb_array_elements(v_package.rollback_operations)
  loop
    if coalesce(v_item->>'rpc', '') !~ '^[a-z_][a-z0-9_]{0,62}$' then raise exception 'Rollback package contains an unsafe RPC identifier'; end if;
    if not exists (
      select 1 from public.access_authority_manifests manifest
      where manifest.manifest_key = v_item->>'manifestKey'
        and manifest.validation_status = 'confirmed'
        and manifest.executable = true
        and manifest.mutation_authority->>'rollbackRpc' = v_item->>'rpc'
    ) then raise exception 'Rollback RPC % is not registered by a confirmed manifest', v_item->>'rpc'; end if;
    execute format('select public.%I($1::jsonb)', v_item->>'rpc') using coalesce(v_item->'arguments', '{}'::jsonb) into v_result;
    if coalesce((v_result->>'ok')::boolean, false) is not true then raise exception 'Rollback RPC % did not return a verified ok result', v_item->>'rpc'; end if;
    update public.access_plan_operations set status = 'rolled_back', updated_at = now() where id = nullif(v_item->>'operationId', '')::uuid;
    v_count := v_count + 1;
  end loop;

  update public.access_rollback_packages set status = 'completed', updated_at = now() where id = p_package_id;
  update public.access_execution_runs set status = 'rolled_back', completed_at = now(), updated_at = now() where id = v_execution.id;
  update public.access_reconciliation_plans set status = 'rolled_back', updated_at = now() where id = v_execution.plan_id;
  insert into public.access_command_events(event_type, actor_user_id, actor_email, correlation_id, plan_id, execution_id, summary, payload)
  values ('authorization_rollback_completed', p_actor_id, p_actor_email, p_correlation_id, v_execution.plan_id, v_execution.id, 'Authorization rollback package completed transactionally.', jsonb_build_object('rollbackPackageId', p_package_id, 'operations', v_count));
  return jsonb_build_object('ok', true, 'rollbackPackageId', p_package_id, 'operations', v_count);
  exception
    when others then
      update public.access_rollback_packages set status = 'failed', updated_at = now() where id = p_package_id;
      update public.access_execution_runs set status = 'failed', failure_stage = 'rollback', error = sqlerrm, updated_at = now() where id = v_execution.id;
      insert into public.access_command_events(event_type, actor_user_id, actor_email, correlation_id, plan_id, execution_id, summary, payload)
      values ('authorization_rollback_failed', p_actor_id, p_actor_email, p_correlation_id, v_execution.plan_id, v_execution.id, 'Authorization rollback failed. Transactional rollback operations were reverted.', jsonb_build_object('error', sqlerrm, 'rollbackPackageId', p_package_id));
      return jsonb_build_object('ok', false, 'rollbackPackageId', p_package_id, 'error', sqlerrm);
  end;
end;
$function$;

revoke all on function public.access_governance_claim_inventory_items(uuid,text,integer) from public;
revoke all on function public.access_governance_claim_scan_work_items(uuid,text,integer) from public;
revoke all on function public.access_governance_introspect_authority() from public;
revoke all on function public.access_governance_bump_cache_epoch(text,uuid) from public;
revoke all on function public.access_governance_command_overview() from public;
revoke all on function public.access_governance_execute_plan(uuid,uuid,text,text) from public;
revoke all on function public.access_governance_execute_rollback(uuid,uuid,text,text) from public;

grant execute on function public.access_governance_claim_inventory_items(uuid,text,integer) to service_role;
grant execute on function public.access_governance_claim_scan_work_items(uuid,text,integer) to service_role;
grant execute on function public.access_governance_introspect_authority() to service_role;
grant execute on function public.access_governance_bump_cache_epoch(text,uuid) to service_role;
grant execute on function public.access_governance_command_overview() to service_role;
grant execute on function public.access_governance_execute_plan(uuid,uuid,text,text) to service_role;
grant execute on function public.access_governance_execute_rollback(uuid,uuid,text,text) to service_role;

insert into public.access_scanner_capabilities(capability_key, capability_label, status, detail, scanner_version)
values
  ('source_ast', 'TypeScript and JavaScript syntax intelligence', 'ready', 'Compiler-API analysis of routes, guards, imports, literals, and authorization chains.', '4.0.0'),
  ('sql_intelligence', 'SQL migration authority intelligence', 'ready', 'Tables, policies, functions, constraints, and authority candidates are reconstructed from SQL evidence.', '4.0.0'),
  ('database_introspection', 'Live database metadata introspection', 'ready', 'Service-role-only pg_catalog snapshot with secret-value redaction.', '4.0.0'),
  ('topology', 'Authorization topology graph', 'ready', 'Versioned evidence-backed nodes and edges across global and native authority.', '4.0.0'),
  ('reconciliation', 'Global-to-native reconciliation', 'ready', 'Fail-closed drift classification and dry-run correction planning.', '4.0.0'),
  ('execution', 'Transactional plan execution', 'ready', 'Only confirmed manifests and registered jsonb RPCs may execute.', '4.0.0'),
  ('unknown_models', 'Unknown authority quarantine', 'ready', 'Unresolved or contradictory models are preserved and blocked from execution.', '4.0.0')
on conflict (capability_key)
do update set capability_label = excluded.capability_label,
              status = excluded.status,
              detail = excluded.detail,
              scanner_version = excluded.scanner_version,
              checked_at = now(),
              updated_at = now();

commit;
