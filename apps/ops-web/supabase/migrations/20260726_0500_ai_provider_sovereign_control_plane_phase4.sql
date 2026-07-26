-- ANGELCARE SANILA AI Provider Sovereign Control Plane — Phase 4
-- Additive platform-level provider dossiers, encrypted credential versions,
-- module routing, quotas, usage ledger, runtime governor and audit.

begin;

create extension if not exists pgcrypto with schema extensions;
create extension if not exists supabase_vault with schema vault;

create table if not exists public.ai_provider_dossiers (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  provider_type text not null default 'gemini',
  status text not null default 'draft' check (status in ('draft','testing','ready','operating','limited','cooldown','suspended','draining','revoked','archived')),
  environment text not null default 'production',
  account_label text,
  external_account_id text,
  billing_tier text not null default 'free',
  reconciliation_state text not null default 'not_reconciled',
  is_enabled boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_by text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_provider_capacity_pools (
  id uuid primary key default gen_random_uuid(),
  dossier_id uuid not null references public.ai_provider_dossiers(id) on delete cascade,
  pool_key text not null,
  project_name text not null,
  external_project_id text,
  quota_scope text not null default 'project',
  provider_rpm integer,
  provider_tpm bigint,
  provider_rpd integer,
  provider_grounded_rpd integer,
  billing_tier text not null default 'free',
  status text not null default 'draft',
  metadata jsonb not null default '{}'::jsonb,
  created_by text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(dossier_id, pool_key)
);

create table if not exists public.ai_provider_credentials (
  id uuid primary key default gen_random_uuid(),
  dossier_id uuid not null references public.ai_provider_dossiers(id) on delete cascade,
  capacity_pool_id uuid references public.ai_provider_capacity_pools(id) on delete set null,
  vault_secret_id uuid not null,
  fingerprint text not null,
  secret_suffix text not null,
  version_number integer not null,
  key_type text not null default 'auth_key',
  status text not null default 'testing' check (status in ('testing','validated','active','standby','failed','revoked','archived')),
  validated_at timestamptz,
  activated_at timestamptz,
  revoked_at timestamptz,
  last_success_at timestamptz,
  last_failure_at timestamptz,
  failure_code text,
  metadata jsonb not null default '{}'::jsonb,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(dossier_id, version_number)
);

create table if not exists public.ai_provider_models (
  id uuid primary key default gen_random_uuid(),
  dossier_id uuid not null references public.ai_provider_dossiers(id) on delete cascade,
  model_code text not null,
  display_name text not null,
  capability text not null default 'general',
  enabled boolean not null default true,
  primary_for_capability boolean not null default false,
  grounding_allowed boolean not null default false,
  max_output_tokens integer,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(dossier_id, model_code, capability)
);

create table if not exists public.ai_provider_module_assignments (
  id uuid primary key default gen_random_uuid(),
  module_key text not null,
  dossier_id uuid not null references public.ai_provider_dossiers(id) on delete cascade,
  capacity_pool_id uuid references public.ai_provider_capacity_pools(id) on delete set null,
  assignment_mode text not null default 'primary' check (assignment_mode in ('primary','secondary','failover','emergency_reserve','sandbox','manual','disabled')),
  priority integer not null default 100,
  enabled boolean not null default true,
  capability_allowlist text[] not null default '{}'::text[],
  primary_model text,
  fallback_model text,
  metadata jsonb not null default '{}'::jsonb,
  created_by text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(module_key, dossier_id, assignment_mode)
);

create table if not exists public.ai_provider_routing_rules (
  id uuid primary key default gen_random_uuid(),
  module_key text not null,
  capability text not null default '*',
  routing_mode text not null default 'primary_fallback',
  primary_assignment_id uuid references public.ai_provider_module_assignments(id) on delete set null,
  fallback_assignment_ids uuid[] not null default '{}'::uuid[],
  sticky_mission boolean not null default true,
  enabled boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_by text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(module_key, capability)
);

create table if not exists public.ai_provider_quota_policies (
  id uuid primary key default gen_random_uuid(),
  scope_type text not null check (scope_type in ('global','module','dossier','capacity_pool','model','command','user')),
  scope_key text not null,
  max_requests_per_minute integer,
  max_requests_per_hour integer,
  max_requests_per_day integer,
  max_requests_per_month integer,
  max_input_tokens_per_day bigint,
  max_output_tokens_per_day bigint,
  max_grounded_requests_per_day integer,
  max_concurrent_requests integer,
  emergency_reserve_requests integer not null default 0,
  soft_threshold_percent integer not null default 80 check (soft_threshold_percent between 1 and 100),
  hard_limit boolean not null default true,
  reset_timezone text not null default 'Africa/Casablanca',
  enabled boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_by text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(scope_type, scope_key)
);

create table if not exists public.ai_provider_budget_reservations (
  id uuid primary key default gen_random_uuid(),
  module_key text not null,
  capability text not null,
  dossier_id uuid references public.ai_provider_dossiers(id) on delete set null,
  capacity_pool_id uuid references public.ai_provider_capacity_pools(id) on delete set null,
  credential_id uuid references public.ai_provider_credentials(id) on delete set null,
  model_code text,
  reserved_requests integer not null default 1,
  reserved_input_tokens bigint not null default 0,
  reserved_output_tokens bigint not null default 0,
  grounded boolean not null default false,
  status text not null default 'reserved' check (status in ('reserved','running','consumed','released','failed','expired')),
  actor_id text,
  mission_id text,
  command_code text,
  expires_at timestamptz not null default (now() + interval '10 minutes'),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_provider_runtime_leases (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null references public.ai_provider_budget_reservations(id) on delete cascade,
  module_key text not null,
  capacity_pool_id uuid references public.ai_provider_capacity_pools(id) on delete set null,
  credential_id uuid references public.ai_provider_credentials(id) on delete set null,
  status text not null default 'active' check (status in ('active','released','expired','failed')),
  acquired_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '5 minutes'),
  released_at timestamptz,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.ai_provider_usage_ledger (
  id uuid primary key default gen_random_uuid(),
  occurred_at timestamptz not null default now(),
  module_key text not null,
  capability text not null,
  dossier_id uuid references public.ai_provider_dossiers(id) on delete set null,
  capacity_pool_id uuid references public.ai_provider_capacity_pools(id) on delete set null,
  credential_id uuid references public.ai_provider_credentials(id) on delete set null,
  reservation_id uuid references public.ai_provider_budget_reservations(id) on delete set null,
  model_code text,
  request_count integer not null default 1,
  grounded_request_count integer not null default 0,
  input_tokens bigint not null default 0,
  output_tokens bigint not null default 0,
  total_tokens bigint generated always as (input_tokens + output_tokens) stored,
  latency_ms integer,
  http_status integer,
  outcome text not null default 'completed',
  error_code text,
  estimated_cost_usd numeric(14,6) not null default 0,
  actor_id text,
  mission_id text,
  command_code text,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.ai_provider_health_checks (
  id uuid primary key default gen_random_uuid(),
  dossier_id uuid references public.ai_provider_dossiers(id) on delete set null,
  capacity_pool_id uuid references public.ai_provider_capacity_pools(id) on delete set null,
  credential_id uuid references public.ai_provider_credentials(id) on delete set null,
  model_code text,
  status text not null,
  latency_ms integer,
  checked_by text,
  details jsonb not null default '{}'::jsonb,
  checked_at timestamptz not null default now()
);

create table if not exists public.ai_provider_cooldowns (
  id uuid primary key default gen_random_uuid(),
  capacity_pool_id uuid references public.ai_provider_capacity_pools(id) on delete cascade,
  credential_id uuid references public.ai_provider_credentials(id) on delete cascade,
  reason text not null,
  error_code text,
  status text not null default 'active',
  starts_at timestamptz not null default now(),
  ends_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists public.ai_provider_incidents (
  id uuid primary key default gen_random_uuid(),
  dossier_id uuid references public.ai_provider_dossiers(id) on delete set null,
  capacity_pool_id uuid references public.ai_provider_capacity_pools(id) on delete set null,
  credential_id uuid references public.ai_provider_credentials(id) on delete set null,
  severity text not null default 'medium',
  category text not null,
  title text not null,
  description text,
  status text not null default 'open',
  opened_by text,
  resolved_by text,
  resolved_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_provider_config_versions (
  id uuid primary key default gen_random_uuid(),
  version_number integer not null unique,
  version_code text not null unique,
  status text not null default 'draft',
  reason text,
  snapshot jsonb not null,
  checksum text not null,
  published_at timestamptz,
  created_by text,
  created_at timestamptz not null default now()
);

create table if not exists public.ai_provider_alerts (
  id uuid primary key default gen_random_uuid(),
  alert_type text not null,
  severity text not null default 'info',
  title text not null,
  message text,
  scope_type text,
  scope_key text,
  status text not null default 'open',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  acknowledged_at timestamptz,
  acknowledged_by text
);

create table if not exists public.ai_provider_emergency_state (
  id uuid primary key default gen_random_uuid(),
  scope_key text not null unique,
  mode text not null default 'normal' check (mode in ('normal','paused','manual_only','grounding_disabled','draining','reserve_only')),
  reason text,
  updated_by text,
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_provider_audit (
  id uuid primary key default gen_random_uuid(),
  action_key text not null,
  entity_type text not null,
  entity_id text,
  actor_id text,
  actor_name text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists ai_provider_usage_time_idx on public.ai_provider_usage_ledger(occurred_at desc);
create index if not exists ai_provider_usage_module_time_idx on public.ai_provider_usage_ledger(module_key, occurred_at desc);
create index if not exists ai_provider_usage_pool_time_idx on public.ai_provider_usage_ledger(capacity_pool_id, occurred_at desc);
create index if not exists ai_provider_reservation_active_idx on public.ai_provider_budget_reservations(module_key, status, created_at desc);
create index if not exists ai_provider_lease_active_idx on public.ai_provider_runtime_leases(capacity_pool_id, status, expires_at);
create index if not exists ai_provider_assignment_runtime_idx on public.ai_provider_module_assignments(module_key, enabled, priority);
create index if not exists ai_provider_credential_runtime_idx on public.ai_provider_credentials(dossier_id, status, version_number desc);

insert into public.ai_provider_emergency_state(scope_key, mode)
values ('*', 'normal')
on conflict(scope_key) do nothing;

insert into public.ai_provider_quota_policies(
  scope_type, scope_key, max_requests_per_minute, max_requests_per_hour,
  max_requests_per_day, max_requests_per_month, max_grounded_requests_per_day,
  max_concurrent_requests, emergency_reserve_requests, soft_threshold_percent,
  hard_limit, reset_timezone, enabled, metadata
)
values ('global','*',1,2,5,50,1,1,0,80,true,'Africa/Casablanca',true,
  jsonb_build_object('preset','ultra_conservative','source','phase4_default'))
on conflict(scope_type, scope_key) do nothing;

create or replace function public.ai_provider_store_credential(
  p_dossier_id uuid,
  p_capacity_pool_id uuid,
  p_secret text,
  p_key_type text,
  p_actor_id text
)
returns table(credential_id uuid, version_number integer, fingerprint text, secret_suffix text)
language plpgsql
security definer
set search_path = public, vault, extensions
as $$
declare
  v_version integer;
  v_vault_id uuid;
  v_credential_id uuid;
  v_fingerprint text;
  v_suffix text;
  v_name text;
begin
  if p_secret is null or length(trim(p_secret)) < 12 then
    raise exception 'INVALID_PROVIDER_SECRET';
  end if;
  if not exists(select 1 from public.ai_provider_dossiers where id = p_dossier_id) then
    raise exception 'DOSSIER_NOT_FOUND';
  end if;
  select coalesce(max(c.version_number),0)+1 into v_version
  from public.ai_provider_credentials c where c.dossier_id = p_dossier_id;
  v_fingerprint := encode(digest(p_secret, 'sha256'), 'hex');
  v_suffix := right(p_secret, 4);
  v_name := 'sanila_ai_provider_' || p_dossier_id::text || '_v' || v_version::text;
  select vault.create_secret(p_secret, v_name, 'SANILA AI Provider credential version') into v_vault_id;
  insert into public.ai_provider_credentials(
    dossier_id, capacity_pool_id, vault_secret_id, fingerprint, secret_suffix,
    version_number, key_type, status, created_by
  ) values (
    p_dossier_id, p_capacity_pool_id, v_vault_id, v_fingerprint, v_suffix,
    v_version, coalesce(nullif(p_key_type,''),'auth_key'), 'testing', p_actor_id
  ) returning id into v_credential_id;
  return query select v_credential_id, v_version, v_fingerprint, v_suffix;
end;
$$;

create or replace function public.ai_provider_resolve_secret(p_credential_id uuid)
returns table(decrypted_secret text)
language sql
security definer
set search_path = public, vault
as $$
  select ds.decrypted_secret
  from public.ai_provider_credentials c
  join vault.decrypted_secrets ds on ds.id = c.vault_secret_id
  where c.id = p_credential_id
    and c.status in ('testing','validated','active','standby')
  limit 1;
$$;

create or replace function public.ai_provider_resolve_runtime_provider(
  p_module_key text,
  p_capability text,
  p_requested_model text default null
)
returns table(
  assignment_id uuid,
  assignment_mode text,
  dossier_id uuid,
  provider_type text,
  capacity_pool_id uuid,
  credential_id uuid,
  model_code text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_global_mode text;
  v_module_mode text;
  v_rule_id uuid;
  v_routing_mode text;
  v_primary_assignment_id uuid;
  v_fallback_assignment_ids uuid[] := '{}'::uuid[];
begin
  select mode into v_global_mode from public.ai_provider_emergency_state where scope_key='*';
  select mode into v_module_mode from public.ai_provider_emergency_state where scope_key=p_module_key;
  if coalesce(v_global_mode,'normal') in ('paused','draining')
     or coalesce(v_module_mode,'normal') in ('paused','draining') then
    raise exception 'AI_PROVIDER_GLOBAL_PAUSED';
  end if;

  select r.id, r.routing_mode, r.primary_assignment_id, r.fallback_assignment_ids
    into v_rule_id, v_routing_mode, v_primary_assignment_id, v_fallback_assignment_ids
  from public.ai_provider_routing_rules r
  where r.module_key=p_module_key
    and r.enabled=true
    and r.capability in (p_capability,'*')
  order by (r.capability=p_capability) desc, r.updated_at desc
  limit 1;

  return query
  select
    a.id,
    a.assignment_mode,
    d.id,
    d.provider_type,
    coalesce(a.capacity_pool_id, cp.id),
    c.id,
    coalesce(
      nullif(a.primary_model,''),
      nullif(p_requested_model,''),
      (select m.model_code from public.ai_provider_models m
       where m.dossier_id=d.id and m.enabled=true
         and (m.capability=p_capability or m.capability='general')
       order by (m.capability=p_capability) desc, m.primary_for_capability desc, m.created_at
       limit 1),
      'gemini-2.5-flash'
    )
  from public.ai_provider_module_assignments a
  join public.ai_provider_dossiers d on d.id=a.dossier_id
  join lateral (
    select p.* from public.ai_provider_capacity_pools p
    where p.dossier_id=d.id
      and (a.capacity_pool_id is null or p.id=a.capacity_pool_id)
      and p.status in ('ready','operating','limited','draft')
    order by (p.id=a.capacity_pool_id) desc, p.created_at
    limit 1
  ) cp on true
  join lateral (
    select cred.* from public.ai_provider_credentials cred
    where cred.dossier_id=d.id
      and (cred.capacity_pool_id is null or cp.id is null or cred.capacity_pool_id=cp.id)
      and cred.status='active'
    order by cred.version_number desc
    limit 1
  ) c on true
  where a.module_key=p_module_key
    and a.enabled=true
    and a.assignment_mode <> 'disabled'
    and d.is_enabled=true
    and d.status in ('ready','operating','limited')
    and (cardinality(a.capability_allowlist)=0 or p_capability=any(a.capability_allowlist) or '*'=any(a.capability_allowlist))
    and (
      v_rule_id is null
      or (v_routing_mode='exclusive' and a.id=v_primary_assignment_id)
      or (v_routing_mode='primary_fallback' and (a.id=v_primary_assignment_id or a.id=any(coalesce(v_fallback_assignment_ids,'{}'::uuid[]))))
      or (v_routing_mode='manual' and a.assignment_mode='manual')
      or v_routing_mode in ('capacity_aware','cost_aware','weighted')
    )
    and not exists(
      select 1 from public.ai_provider_cooldowns cd
      where cd.status='active' and cd.ends_at>now()
        and ((cd.capacity_pool_id is not null and cd.capacity_pool_id=cp.id)
          or (cd.credential_id is not null and cd.credential_id=c.id))
    )
  order by
    case
      when v_primary_assignment_id=a.id then 0
      when a.id=any(coalesce(v_fallback_assignment_ids,'{}'::uuid[])) then 1+coalesce(array_position(v_fallback_assignment_ids,a.id),99)
      else 100
    end,
    case a.assignment_mode when 'primary' then 1 when 'secondary' then 2 when 'failover' then 3 when 'emergency_reserve' then 4 when 'manual' then 5 else 9 end,
    a.priority,
    a.created_at
  limit 1;
end;
$$;

create or replace function public.ai_provider_acquire_runtime_budget(
  p_module_key text,
  p_capability text,
  p_requested_model text,
  p_estimated_requests integer default 1,
  p_estimated_input_tokens bigint default 0,
  p_estimated_output_tokens bigint default 0,
  p_grounded boolean default false,
  p_actor_id text default null,
  p_mission_id text default null,
  p_command_code text default null
)
returns table(
  reservation_id uuid,
  lease_id uuid,
  assignment_id uuid,
  assignment_mode text,
  dossier_id uuid,
  provider_type text,
  capacity_pool_id uuid,
  credential_id uuid,
  model_code text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_route record;
  v_policy record;
  v_reservation uuid;
  v_lease uuid;
  v_global_mode text;
  v_module_mode text;
  v_provider_rpm integer;
  v_provider_tpm bigint;
  v_provider_rpd integer;
  v_provider_grounded_rpd integer;
  v_pool_requests_minute bigint := 0;
  v_pool_requests_day bigint := 0;
  v_pool_input_minute bigint := 0;
  v_pool_grounded_day bigint := 0;
  v_used_minute bigint := 0;
  v_used_hour bigint := 0;
  v_used_day bigint := 0;
  v_used_month bigint := 0;
  v_grounded_day bigint := 0;
  v_input_day bigint := 0;
  v_output_day bigint := 0;
  v_reserved_minute bigint := 0;
  v_reserved_hour bigint := 0;
  v_reserved_day bigint := 0;
  v_reserved_month bigint := 0;
  v_reserved_grounded_day bigint := 0;
  v_reserved_input_day bigint := 0;
  v_reserved_output_day bigint := 0;
  v_active_leases bigint := 0;
  v_day_start timestamptz;
  v_month_start timestamptz;
  v_effective_day_limit bigint;
  v_soft_boundary numeric;
  v_scope_title text;
begin
  p_estimated_requests := greatest(1,coalesce(p_estimated_requests,1));
  p_estimated_input_tokens := greatest(0,coalesce(p_estimated_input_tokens,0));
  p_estimated_output_tokens := greatest(0,coalesce(p_estimated_output_tokens,0));

  select mode into v_global_mode from public.ai_provider_emergency_state where scope_key='*';
  select mode into v_module_mode from public.ai_provider_emergency_state where scope_key=p_module_key;
  if coalesce(v_global_mode,'normal') in ('paused','draining')
     or coalesce(v_module_mode,'normal') in ('paused','draining') then
    raise exception 'AI_PROVIDER_GLOBAL_PAUSED';
  end if;
  if (coalesce(v_global_mode,'normal')='manual_only' or coalesce(v_module_mode,'normal')='manual_only') and p_actor_id is null then
    raise exception 'AI_PROVIDER_MANUAL_ONLY';
  end if;
  if p_grounded and (coalesce(v_global_mode,'normal')='grounding_disabled' or coalesce(v_module_mode,'normal')='grounding_disabled') then
    raise exception 'AI_PROVIDER_GROUNDING_DISABLED';
  end if;

  select * into v_route
  from public.ai_provider_resolve_runtime_provider(p_module_key,p_capability,p_requested_model)
  limit 1;
  if not found then raise exception 'AI_PROVIDER_ROUTE_NOT_FOUND'; end if;
  if (coalesce(v_global_mode,'normal')='reserve_only' or coalesce(v_module_mode,'normal')='reserve_only')
     and v_route.assignment_mode <> 'emergency_reserve' then
    raise exception 'AI_PROVIDER_RESERVE_ONLY';
  end if;
  if not exists(
    select 1 from public.ai_provider_models m
    where m.dossier_id=v_route.dossier_id and m.model_code=v_route.model_code and m.enabled=true
      and (m.capability=p_capability or m.capability='general')
  ) then
    raise exception 'AI_PROVIDER_MODEL_NOT_ALLOWED:%',v_route.model_code;
  end if;
  if p_grounded and not exists(
    select 1 from public.ai_provider_models m
    where m.dossier_id=v_route.dossier_id and m.model_code=v_route.model_code and m.enabled=true
      and m.grounding_allowed=true
      and (m.capability=p_capability or m.capability='general')
  ) then
    raise exception 'AI_PROVIDER_GROUNDING_NOT_ALLOWED:%',v_route.model_code;
  end if;

  -- Lock in a consistent hierarchy so concurrent Vercel instances cannot spend
  -- the same global, module or provider-pool capacity.
  perform pg_advisory_xact_lock(hashtextextended('ai_provider:global',0));
  perform pg_advisory_xact_lock(hashtextextended('ai_provider:module:'||p_module_key,0));
  perform pg_advisory_xact_lock(hashtextextended('ai_provider:pool:'||v_route.capacity_pool_id::text,0));

  update public.ai_provider_budget_reservations set status='expired', updated_at=now()
  where status in ('reserved','running') and expires_at<=now();
  update public.ai_provider_runtime_leases set status='expired', released_at=now()
  where status='active' and expires_at<=now();
  update public.ai_provider_cooldowns set status='expired'
  where status='active' and ends_at<=now();

  select cp.provider_rpm,cp.provider_tpm,cp.provider_rpd,cp.provider_grounded_rpd
    into v_provider_rpm,v_provider_tpm,v_provider_rpd,v_provider_grounded_rpd
  from public.ai_provider_capacity_pools cp
  where cp.id=v_route.capacity_pool_id;

  -- Provider ceilings are informational values entered from the provider portal,
  -- but once configured SANILA never intentionally exceeds them.
  select
    coalesce(sum(u.request_count) filter(where u.occurred_at>=now()-interval '1 minute'),0),
    coalesce(sum(u.request_count) filter(where u.occurred_at>=date_trunc('day',now())),0),
    coalesce(sum(u.input_tokens) filter(where u.occurred_at>=now()-interval '1 minute'),0),
    coalesce(sum(u.grounded_request_count) filter(where u.occurred_at>=date_trunc('day',now())),0)
  into v_pool_requests_minute,v_pool_requests_day,v_pool_input_minute,v_pool_grounded_day
  from public.ai_provider_usage_ledger u
  where u.capacity_pool_id=v_route.capacity_pool_id;

  select
    v_pool_requests_minute + coalesce(sum(r.reserved_requests) filter(where r.created_at>=now()-interval '1 minute'),0),
    v_pool_requests_day + coalesce(sum(r.reserved_requests) filter(where r.created_at>=date_trunc('day',now())),0),
    v_pool_input_minute + coalesce(sum(r.reserved_input_tokens) filter(where r.created_at>=now()-interval '1 minute'),0),
    v_pool_grounded_day + coalesce(sum(case when r.grounded then r.reserved_requests else 0 end) filter(where r.created_at>=date_trunc('day',now())),0)
  into v_pool_requests_minute,v_pool_requests_day,v_pool_input_minute,v_pool_grounded_day
  from public.ai_provider_budget_reservations r
  where r.capacity_pool_id=v_route.capacity_pool_id and r.status in ('reserved','running');

  if v_provider_rpm is not null and v_provider_rpm>0 and v_pool_requests_minute+p_estimated_requests>v_provider_rpm then
    raise exception 'AI_PROVIDER_CEILING_EXHAUSTED:RPM';
  end if;
  if v_provider_tpm is not null and v_provider_tpm>0 and v_pool_input_minute+p_estimated_input_tokens>v_provider_tpm then
    raise exception 'AI_PROVIDER_CEILING_EXHAUSTED:TPM';
  end if;
  if v_provider_rpd is not null and v_provider_rpd>0 and v_pool_requests_day+p_estimated_requests>v_provider_rpd then
    raise exception 'AI_PROVIDER_CEILING_EXHAUSTED:RPD';
  end if;
  if p_grounded and v_provider_grounded_rpd is not null and v_provider_grounded_rpd>0
     and v_pool_grounded_day+p_estimated_requests>v_provider_grounded_rpd then
    raise exception 'AI_PROVIDER_CEILING_EXHAUSTED:GROUNDED_RPD';
  end if;

  for v_policy in
    select q.* from public.ai_provider_quota_policies q
    where q.enabled=true and (
      (q.scope_type='global' and q.scope_key='*')
      or (q.scope_type='module' and q.scope_key=p_module_key)
      or (q.scope_type='dossier' and q.scope_key=v_route.dossier_id::text)
      or (q.scope_type='capacity_pool' and q.scope_key=v_route.capacity_pool_id::text)
      or (q.scope_type='model' and q.scope_key=v_route.model_code)
      or (q.scope_type='command' and p_command_code is not null and q.scope_key=p_command_code)
      or (q.scope_type='user' and p_actor_id is not null and q.scope_key=p_actor_id)
    )
    order by case q.scope_type when 'global' then 1 when 'module' then 2 when 'dossier' then 3 when 'capacity_pool' then 4 when 'model' then 5 when 'command' then 6 else 7 end
  loop
    v_day_start := date_trunc('day',now() at time zone coalesce(nullif(v_policy.reset_timezone,''),'UTC')) at time zone coalesce(nullif(v_policy.reset_timezone,''),'UTC');
    v_month_start := date_trunc('month',now() at time zone coalesce(nullif(v_policy.reset_timezone,''),'UTC')) at time zone coalesce(nullif(v_policy.reset_timezone,''),'UTC');

    select
      coalesce(sum(u.request_count) filter(where u.occurred_at>=now()-interval '1 minute'),0),
      coalesce(sum(u.request_count) filter(where u.occurred_at>=date_trunc('hour',now())),0),
      coalesce(sum(u.request_count) filter(where u.occurred_at>=v_day_start),0),
      coalesce(sum(u.request_count) filter(where u.occurred_at>=v_month_start),0),
      coalesce(sum(u.grounded_request_count) filter(where u.occurred_at>=v_day_start),0),
      coalesce(sum(u.input_tokens) filter(where u.occurred_at>=v_day_start),0),
      coalesce(sum(u.output_tokens) filter(where u.occurred_at>=v_day_start),0)
    into v_used_minute,v_used_hour,v_used_day,v_used_month,v_grounded_day,v_input_day,v_output_day
    from public.ai_provider_usage_ledger u
    where case v_policy.scope_type
      when 'global' then true
      when 'module' then u.module_key=v_policy.scope_key
      when 'dossier' then u.dossier_id::text=v_policy.scope_key
      when 'capacity_pool' then u.capacity_pool_id::text=v_policy.scope_key
      when 'model' then u.model_code=v_policy.scope_key
      when 'command' then u.command_code=v_policy.scope_key
      when 'user' then u.actor_id=v_policy.scope_key
      else false end;

    select
      coalesce(sum(r.reserved_requests) filter(where r.created_at>=now()-interval '1 minute'),0),
      coalesce(sum(r.reserved_requests) filter(where r.created_at>=date_trunc('hour',now())),0),
      coalesce(sum(r.reserved_requests) filter(where r.created_at>=v_day_start),0),
      coalesce(sum(r.reserved_requests) filter(where r.created_at>=v_month_start),0),
      coalesce(sum(case when r.grounded then r.reserved_requests else 0 end) filter(where r.created_at>=v_day_start),0),
      coalesce(sum(r.reserved_input_tokens) filter(where r.created_at>=v_day_start),0),
      coalesce(sum(r.reserved_output_tokens) filter(where r.created_at>=v_day_start),0)
    into v_reserved_minute,v_reserved_hour,v_reserved_day,v_reserved_month,v_reserved_grounded_day,v_reserved_input_day,v_reserved_output_day
    from public.ai_provider_budget_reservations r
    where r.status in ('reserved','running')
      and case v_policy.scope_type
        when 'global' then true
        when 'module' then r.module_key=v_policy.scope_key
        when 'dossier' then r.dossier_id::text=v_policy.scope_key
        when 'capacity_pool' then r.capacity_pool_id::text=v_policy.scope_key
        when 'model' then r.model_code=v_policy.scope_key
        when 'command' then r.command_code=v_policy.scope_key
        when 'user' then r.actor_id=v_policy.scope_key
        else false end;

    v_used_minute := v_used_minute+v_reserved_minute;
    v_used_hour := v_used_hour+v_reserved_hour;
    v_used_day := v_used_day+v_reserved_day;
    v_used_month := v_used_month+v_reserved_month;
    v_grounded_day := v_grounded_day+v_reserved_grounded_day;
    v_input_day := v_input_day+v_reserved_input_day;
    v_output_day := v_output_day+v_reserved_output_day;

    select count(*) into v_active_leases
    from public.ai_provider_runtime_leases l
    join public.ai_provider_budget_reservations r on r.id=l.reservation_id
    where l.status='active' and l.expires_at>now()
      and case v_policy.scope_type
        when 'global' then true
        when 'module' then r.module_key=v_policy.scope_key
        when 'dossier' then r.dossier_id::text=v_policy.scope_key
        when 'capacity_pool' then r.capacity_pool_id::text=v_policy.scope_key
        when 'model' then r.model_code=v_policy.scope_key
        when 'command' then r.command_code=v_policy.scope_key
        when 'user' then r.actor_id=v_policy.scope_key
        else false end;

    v_effective_day_limit := v_policy.max_requests_per_day;
    if v_route.assignment_mode='emergency_reserve' then
      v_effective_day_limit := coalesce(v_effective_day_limit,0)+greatest(0,coalesce(v_policy.emergency_reserve_requests,0));
    end if;
    v_scope_title := upper(v_policy.scope_type)||':'||v_policy.scope_key;

    if v_policy.hard_limit then
      if v_policy.max_requests_per_minute is not null and v_policy.max_requests_per_minute>0 and v_used_minute+p_estimated_requests>v_policy.max_requests_per_minute then raise exception 'AI_PROVIDER_BUDGET_EXHAUSTED:%:MINUTE',v_scope_title; end if;
      if v_policy.max_requests_per_hour is not null and v_policy.max_requests_per_hour>0 and v_used_hour+p_estimated_requests>v_policy.max_requests_per_hour then raise exception 'AI_PROVIDER_BUDGET_EXHAUSTED:%:HOUR',v_scope_title; end if;
      if v_effective_day_limit is not null and v_effective_day_limit>0 and v_used_day+p_estimated_requests>v_effective_day_limit then raise exception 'AI_PROVIDER_BUDGET_EXHAUSTED:%:DAY',v_scope_title; end if;
      if v_policy.max_requests_per_month is not null and v_policy.max_requests_per_month>0 and v_used_month+p_estimated_requests>v_policy.max_requests_per_month then raise exception 'AI_PROVIDER_BUDGET_EXHAUSTED:%:MONTH',v_scope_title; end if;
      if p_grounded and v_policy.max_grounded_requests_per_day is not null and v_policy.max_grounded_requests_per_day>0 and v_grounded_day+p_estimated_requests>v_policy.max_grounded_requests_per_day then raise exception 'AI_PROVIDER_GROUNDING_BUDGET_EXHAUSTED:%',v_scope_title; end if;
      if v_policy.max_concurrent_requests is not null and v_policy.max_concurrent_requests>0 and v_active_leases>=v_policy.max_concurrent_requests then raise exception 'AI_PROVIDER_CONCURRENCY_EXHAUSTED:%',v_scope_title; end if;
      if v_policy.max_input_tokens_per_day is not null and v_policy.max_input_tokens_per_day>0 and v_input_day+p_estimated_input_tokens>v_policy.max_input_tokens_per_day then raise exception 'AI_PROVIDER_INPUT_TOKEN_BUDGET_EXHAUSTED:%',v_scope_title; end if;
      if v_policy.max_output_tokens_per_day is not null and v_policy.max_output_tokens_per_day>0 and v_output_day+p_estimated_output_tokens>v_policy.max_output_tokens_per_day then raise exception 'AI_PROVIDER_OUTPUT_TOKEN_BUDGET_EXHAUSTED:%',v_scope_title; end if;
    end if;

    if v_policy.max_requests_per_day is not null and v_policy.max_requests_per_day>0 then
      v_soft_boundary := v_policy.max_requests_per_day*(v_policy.soft_threshold_percent::numeric/100);
      if v_used_day+p_estimated_requests>=v_soft_boundary then
        insert into public.ai_provider_alerts(alert_type,severity,title,message,scope_type,scope_key,metadata)
        select 'quota_threshold',case when v_used_day+p_estimated_requests>=v_policy.max_requests_per_day then 'critical' else 'warning' end,
          'Seuil de capacité IA atteint',
          format('%s requêtes utilisées ou réservées sur %s autorisées.',v_used_day+p_estimated_requests,v_policy.max_requests_per_day),
          v_policy.scope_type,v_policy.scope_key,
          jsonb_build_object('policyId',v_policy.id,'used',v_used_day,'estimated',p_estimated_requests,'limit',v_policy.max_requests_per_day)
        where not exists(
          select 1 from public.ai_provider_alerts a
          where a.alert_type='quota_threshold' and a.scope_type=v_policy.scope_type and a.scope_key=v_policy.scope_key
            and a.status='open' and a.created_at>=v_day_start
        );
      end if;
    end if;
  end loop;

  insert into public.ai_provider_budget_reservations(
    module_key,capability,dossier_id,capacity_pool_id,credential_id,model_code,
    reserved_requests,reserved_input_tokens,reserved_output_tokens,grounded,status,
    actor_id,mission_id,command_code
  ) values (
    p_module_key,p_capability,v_route.dossier_id,v_route.capacity_pool_id,v_route.credential_id,v_route.model_code,
    p_estimated_requests,p_estimated_input_tokens,p_estimated_output_tokens,p_grounded,'running',
    p_actor_id,p_mission_id,p_command_code
  ) returning id into v_reservation;

  insert into public.ai_provider_runtime_leases(reservation_id,module_key,capacity_pool_id,credential_id,status)
  values(v_reservation,p_module_key,v_route.capacity_pool_id,v_route.credential_id,'active') returning id into v_lease;

  return query select v_reservation,v_lease,v_route.assignment_id,v_route.assignment_mode,v_route.dossier_id,v_route.provider_type,v_route.capacity_pool_id,v_route.credential_id,v_route.model_code;
end;
$$;

create or replace function public.ai_provider_reconcile_runtime_budget(
  p_reservation_id uuid,
  p_lease_id uuid,
  p_request_count integer,
  p_grounded_request_count integer,
  p_input_tokens bigint,
  p_output_tokens bigint,
  p_latency_ms integer,
  p_http_status integer,
  p_outcome text,
  p_error_code text,
  p_estimated_cost_usd numeric,
  p_metadata jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare v record;
begin
  select * into v from public.ai_provider_budget_reservations where id=p_reservation_id for update;
  if not found then raise exception 'RESERVATION_NOT_FOUND'; end if;
  insert into public.ai_provider_usage_ledger(
    module_key,capability,dossier_id,capacity_pool_id,credential_id,reservation_id,model_code,
    request_count,grounded_request_count,input_tokens,output_tokens,latency_ms,http_status,
    outcome,error_code,estimated_cost_usd,actor_id,mission_id,command_code,metadata
  ) values (
    v.module_key,v.capability,v.dossier_id,v.capacity_pool_id,v.credential_id,v.id,v.model_code,
    greatest(1,coalesce(p_request_count,1)),greatest(0,coalesce(p_grounded_request_count,0)),
    greatest(0,coalesce(p_input_tokens,0)),greatest(0,coalesce(p_output_tokens,0)),p_latency_ms,p_http_status,
    coalesce(nullif(p_outcome,''),'completed'),p_error_code,coalesce(p_estimated_cost_usd,0),
    v.actor_id,v.mission_id,v.command_code,coalesce(p_metadata,'{}'::jsonb)
  );
  update public.ai_provider_budget_reservations set status='consumed',updated_at=now() where id=v.id;
  update public.ai_provider_runtime_leases set status='released',released_at=now() where id=p_lease_id;
  update public.ai_provider_credentials set last_success_at=now(),failure_code=null,updated_at=now() where id=v.credential_id and coalesce(p_http_status,200)<400;
end;
$$;

create or replace function public.ai_provider_fail_runtime_budget(
  p_reservation_id uuid,
  p_lease_id uuid,
  p_http_status integer,
  p_error_code text,
  p_latency_ms integer,
  p_metadata jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare v record; v_cooldown_minutes integer:=0;
begin
  select * into v from public.ai_provider_budget_reservations where id=p_reservation_id for update;
  if not found then return; end if;
  insert into public.ai_provider_usage_ledger(
    module_key,capability,dossier_id,capacity_pool_id,credential_id,reservation_id,model_code,
    request_count,grounded_request_count,input_tokens,output_tokens,latency_ms,http_status,
    outcome,error_code,actor_id,mission_id,command_code,metadata
  ) values (
    v.module_key,v.capability,v.dossier_id,v.capacity_pool_id,v.credential_id,v.id,v.model_code,
    1,case when v.grounded then 1 else 0 end,0,0,p_latency_ms,p_http_status,
    'failed',p_error_code,v.actor_id,v.mission_id,v.command_code,coalesce(p_metadata,'{}'::jsonb)
  );
  update public.ai_provider_budget_reservations set status='failed',updated_at=now() where id=v.id;
  update public.ai_provider_runtime_leases set status='failed',released_at=now() where id=p_lease_id;
  update public.ai_provider_credentials set last_failure_at=now(),failure_code=p_error_code,updated_at=now() where id=v.credential_id;
  if p_http_status=429 then v_cooldown_minutes:=30;
  elsif p_http_status in (401,403) then v_cooldown_minutes:=120;
  elsif p_http_status>=500 then v_cooldown_minutes:=5;
  end if;
  if v_cooldown_minutes>0 then
    insert into public.ai_provider_cooldowns(capacity_pool_id,credential_id,reason,error_code,ends_at)
    values(v.capacity_pool_id,v.credential_id,'Automatic provider cooldown',p_error_code,now()+make_interval(mins=>v_cooldown_minutes));
  end if;
end;
$$;

create or replace function public.ai_provider_simulate_runtime_route(
  p_module_key text,
  p_capability text,
  p_requested_model text,
  p_estimated_requests integer,
  p_grounded boolean
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare v_route record; v_day_used bigint; v_policy record;
begin
  select * into v_route from public.ai_provider_resolve_runtime_provider(p_module_key,p_capability,p_requested_model) limit 1;
  if not found then
    return jsonb_build_object('eligible',false,'reason','AI_PROVIDER_ROUTE_NOT_FOUND');
  end if;
  select coalesce(sum(request_count),0) into v_day_used from public.ai_provider_usage_ledger
  where capacity_pool_id=v_route.capacity_pool_id and occurred_at>=date_trunc('day',now());
  select * into v_policy from public.ai_provider_quota_policies
  where enabled=true and ((scope_type='module' and scope_key=p_module_key) or (scope_type='global' and scope_key='*'))
  order by (scope_type='module') desc limit 1;
  if not found then
    return jsonb_build_object(
      'eligible',true,'moduleKey',p_module_key,'capability',p_capability,
      'dossierId',v_route.dossier_id,'capacityPoolId',v_route.capacity_pool_id,
      'credentialId',v_route.credential_id,'model',v_route.model_code,
      'assignmentMode',v_route.assignment_mode,'estimatedRequests',greatest(1,p_estimated_requests),
      'grounded',p_grounded,'requestsUsedToday',v_day_used,
      'internalDailyLimit',null,'wouldFit',true
    );
  end if;
  return jsonb_build_object(
    'eligible',true,
    'moduleKey',p_module_key,
    'capability',p_capability,
    'dossierId',v_route.dossier_id,
    'capacityPoolId',v_route.capacity_pool_id,
    'credentialId',v_route.credential_id,
    'model',v_route.model_code,
    'assignmentMode',v_route.assignment_mode,
    'estimatedRequests',greatest(1,p_estimated_requests),
    'grounded',p_grounded,
    'requestsUsedToday',v_day_used,
    'internalDailyLimit',v_policy.max_requests_per_day,
    'wouldFit',v_policy.max_requests_per_day is null or v_day_used+greatest(1,p_estimated_requests)<=v_policy.max_requests_per_day
  );
end;
$$;

create or replace function public.ai_provider_restore_configuration(
  p_version_id uuid,
  p_actor_id text
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_snapshot jsonb;
  v_item jsonb;
  v_latest integer;
  v_code text;
  v_checksum text;
begin
  perform pg_advisory_xact_lock(hashtextextended('ai_provider:configuration',0));
  select snapshot into v_snapshot
  from public.ai_provider_config_versions
  where id=p_version_id;
  if not found then raise exception 'CONFIG_VERSION_NOT_FOUND'; end if;

  -- Safe deactivation first: objects created after the selected version remain
  -- preserved but cannot route new production requests until explicitly reviewed.
  update public.ai_provider_module_assignments set enabled=false,updated_at=now(),updated_by=p_actor_id;
  update public.ai_provider_routing_rules set enabled=false,updated_at=now(),updated_by=p_actor_id;
  update public.ai_provider_quota_policies set enabled=false,updated_at=now(),updated_by=p_actor_id;
  update public.ai_provider_models set enabled=false,updated_at=now();
  update public.ai_provider_dossiers set is_enabled=false,status=case when status='archived' then status else 'suspended' end,updated_at=now(),updated_by=p_actor_id;
  update public.ai_provider_credentials set status='standby',updated_at=now() where status='active';

  for v_item in select value from jsonb_array_elements(coalesce(v_snapshot->'dossiers','[]'::jsonb)) loop
    update public.ai_provider_dossiers set
      name=coalesce(v_item->>'name',name),
      provider_type=coalesce(v_item->>'provider_type',provider_type),
      status=coalesce(v_item->>'status',status),
      environment=coalesce(v_item->>'environment',environment),
      account_label=v_item->>'account_label',
      external_account_id=v_item->>'external_account_id',
      billing_tier=coalesce(v_item->>'billing_tier',billing_tier),
      reconciliation_state=coalesce(v_item->>'reconciliation_state',reconciliation_state),
      is_enabled=coalesce((v_item->>'is_enabled')::boolean,false),
      metadata=coalesce(v_item->'metadata',metadata),
      updated_by=p_actor_id,updated_at=now()
    where id=(v_item->>'id')::uuid;
  end loop;

  for v_item in select value from jsonb_array_elements(coalesce(v_snapshot->'pools','[]'::jsonb)) loop
    update public.ai_provider_capacity_pools set
      project_name=coalesce(v_item->>'project_name',project_name),
      external_project_id=v_item->>'external_project_id',
      quota_scope=coalesce(v_item->>'quota_scope',quota_scope),
      provider_rpm=nullif(v_item->>'provider_rpm','')::integer,
      provider_tpm=nullif(v_item->>'provider_tpm','')::bigint,
      provider_rpd=nullif(v_item->>'provider_rpd','')::integer,
      provider_grounded_rpd=nullif(v_item->>'provider_grounded_rpd','')::integer,
      billing_tier=coalesce(v_item->>'billing_tier',billing_tier),
      status=coalesce(v_item->>'status',status),
      metadata=coalesce(v_item->'metadata',metadata),
      updated_by=p_actor_id,updated_at=now()
    where id=(v_item->>'id')::uuid;
  end loop;

  for v_item in select value from jsonb_array_elements(coalesce(v_snapshot->'credentials','[]'::jsonb)) loop
    update public.ai_provider_credentials set
      status=coalesce(v_item->>'status',status),updated_at=now()
    where id=(v_item->>'id')::uuid;
  end loop;

  for v_item in select value from jsonb_array_elements(coalesce(v_snapshot->'models','[]'::jsonb)) loop
    insert into public.ai_provider_models(
      dossier_id,model_code,display_name,capability,enabled,primary_for_capability,
      grounding_allowed,max_output_tokens,metadata,updated_at
    ) values (
      (v_item->>'dossier_id')::uuid,v_item->>'model_code',v_item->>'display_name',
      coalesce(v_item->>'capability','general'),coalesce((v_item->>'enabled')::boolean,false),
      coalesce((v_item->>'primary_for_capability')::boolean,false),
      coalesce((v_item->>'grounding_allowed')::boolean,false),
      nullif(v_item->>'max_output_tokens','')::integer,coalesce(v_item->'metadata','{}'::jsonb),now()
    )
    on conflict(dossier_id,model_code,capability) do update set
      display_name=excluded.display_name,enabled=excluded.enabled,
      primary_for_capability=excluded.primary_for_capability,
      grounding_allowed=excluded.grounding_allowed,max_output_tokens=excluded.max_output_tokens,
      metadata=excluded.metadata,updated_at=now();
  end loop;

  for v_item in select value from jsonb_array_elements(coalesce(v_snapshot->'assignments','[]'::jsonb)) loop
    insert into public.ai_provider_module_assignments(
      module_key,dossier_id,capacity_pool_id,assignment_mode,priority,enabled,
      capability_allowlist,primary_model,fallback_model,metadata,updated_by,updated_at
    ) values (
      v_item->>'module_key',(v_item->>'dossier_id')::uuid,nullif(v_item->>'capacity_pool_id','')::uuid,
      v_item->>'assignment_mode',coalesce((v_item->>'priority')::integer,100),
      coalesce((v_item->>'enabled')::boolean,false),
      array(select jsonb_array_elements_text(coalesce(v_item->'capability_allowlist','[]'::jsonb))),
      v_item->>'primary_model',v_item->>'fallback_model',coalesce(v_item->'metadata','{}'::jsonb),p_actor_id,now()
    )
    on conflict(module_key,dossier_id,assignment_mode) do update set
      capacity_pool_id=excluded.capacity_pool_id,priority=excluded.priority,enabled=excluded.enabled,
      capability_allowlist=excluded.capability_allowlist,primary_model=excluded.primary_model,
      fallback_model=excluded.fallback_model,metadata=excluded.metadata,updated_by=p_actor_id,updated_at=now();
  end loop;

  for v_item in select value from jsonb_array_elements(coalesce(v_snapshot->'routingRules','[]'::jsonb)) loop
    insert into public.ai_provider_routing_rules(
      module_key,capability,routing_mode,primary_assignment_id,fallback_assignment_ids,
      sticky_mission,enabled,metadata,updated_by,updated_at
    ) values (
      v_item->>'module_key',coalesce(v_item->>'capability','*'),
      coalesce(v_item->>'routing_mode','primary_fallback'),
      nullif(v_item->>'primary_assignment_id','')::uuid,
      array(select jsonb_array_elements_text(coalesce(v_item->'fallback_assignment_ids','[]'::jsonb)))::uuid[],
      coalesce((v_item->>'sticky_mission')::boolean,true),coalesce((v_item->>'enabled')::boolean,false),
      coalesce(v_item->'metadata','{}'::jsonb),p_actor_id,now()
    )
    on conflict(module_key,capability) do update set
      routing_mode=excluded.routing_mode,primary_assignment_id=excluded.primary_assignment_id,
      fallback_assignment_ids=excluded.fallback_assignment_ids,sticky_mission=excluded.sticky_mission,
      enabled=excluded.enabled,metadata=excluded.metadata,updated_by=p_actor_id,updated_at=now();
  end loop;

  for v_item in select value from jsonb_array_elements(coalesce(v_snapshot->'quotas','[]'::jsonb)) loop
    insert into public.ai_provider_quota_policies(
      scope_type,scope_key,max_requests_per_minute,max_requests_per_hour,max_requests_per_day,
      max_requests_per_month,max_input_tokens_per_day,max_output_tokens_per_day,
      max_grounded_requests_per_day,max_concurrent_requests,emergency_reserve_requests,
      soft_threshold_percent,hard_limit,reset_timezone,enabled,metadata,updated_by,updated_at
    ) values (
      v_item->>'scope_type',v_item->>'scope_key',nullif(v_item->>'max_requests_per_minute','')::integer,
      nullif(v_item->>'max_requests_per_hour','')::integer,nullif(v_item->>'max_requests_per_day','')::integer,
      nullif(v_item->>'max_requests_per_month','')::integer,nullif(v_item->>'max_input_tokens_per_day','')::bigint,
      nullif(v_item->>'max_output_tokens_per_day','')::bigint,nullif(v_item->>'max_grounded_requests_per_day','')::integer,
      nullif(v_item->>'max_concurrent_requests','')::integer,coalesce((v_item->>'emergency_reserve_requests')::integer,0),
      coalesce((v_item->>'soft_threshold_percent')::integer,80),coalesce((v_item->>'hard_limit')::boolean,true),
      coalesce(v_item->>'reset_timezone','Africa/Casablanca'),coalesce((v_item->>'enabled')::boolean,false),
      coalesce(v_item->'metadata','{}'::jsonb),p_actor_id,now()
    )
    on conflict(scope_type,scope_key) do update set
      max_requests_per_minute=excluded.max_requests_per_minute,max_requests_per_hour=excluded.max_requests_per_hour,
      max_requests_per_day=excluded.max_requests_per_day,max_requests_per_month=excluded.max_requests_per_month,
      max_input_tokens_per_day=excluded.max_input_tokens_per_day,max_output_tokens_per_day=excluded.max_output_tokens_per_day,
      max_grounded_requests_per_day=excluded.max_grounded_requests_per_day,max_concurrent_requests=excluded.max_concurrent_requests,
      emergency_reserve_requests=excluded.emergency_reserve_requests,soft_threshold_percent=excluded.soft_threshold_percent,
      hard_limit=excluded.hard_limit,reset_timezone=excluded.reset_timezone,enabled=excluded.enabled,
      metadata=excluded.metadata,updated_by=p_actor_id,updated_at=now();
  end loop;

  if v_snapshot->'emergency' is not null and jsonb_typeof(v_snapshot->'emergency')='object' then
    insert into public.ai_provider_emergency_state(scope_key,mode,reason,updated_by,updated_at)
    values(
      coalesce(v_snapshot#>>'{emergency,scope_key}','*'),
      coalesce(v_snapshot#>>'{emergency,mode}','normal'),
      v_snapshot#>>'{emergency,reason}',p_actor_id,now()
    )
    on conflict(scope_key) do update set mode=excluded.mode,reason=excluded.reason,updated_by=p_actor_id,updated_at=now();
  end if;

  select coalesce(max(version_number),0)+1 into v_latest from public.ai_provider_config_versions;
  v_code := 'AI-PROVIDER-V'||lpad(v_latest::text,4,'0');
  v_checksum := encode(digest(v_snapshot::text,'sha256'),'hex');
  insert into public.ai_provider_config_versions(
    version_number,version_code,status,reason,snapshot,checksum,published_at,created_by
  ) values (
    v_latest,v_code,'rollback','Rollback vers '||(select version_code from public.ai_provider_config_versions where id=p_version_id),
    v_snapshot,v_checksum,now(),p_actor_id
  );
  insert into public.ai_provider_audit(action_key,entity_type,entity_id,actor_id,actor_name,payload)
  values('rollback_configuration','config_version',p_version_id::text,p_actor_id,p_actor_id,
    jsonb_build_object('restoredVersionId',p_version_id,'newVersionCode',v_code));

  return jsonb_build_object('restored',true,'sourceVersionId',p_version_id,'publishedVersionCode',v_code);
end;
$$;

revoke all on function public.ai_provider_store_credential(uuid,uuid,text,text,text) from public, anon, authenticated;
revoke all on function public.ai_provider_resolve_secret(uuid) from public, anon, authenticated;
revoke all on function public.ai_provider_resolve_runtime_provider(text,text,text) from public, anon, authenticated;
revoke all on function public.ai_provider_acquire_runtime_budget(text,text,text,integer,bigint,bigint,boolean,text,text,text) from public, anon, authenticated;
revoke all on function public.ai_provider_reconcile_runtime_budget(uuid,uuid,integer,integer,bigint,bigint,integer,integer,text,text,numeric,jsonb) from public, anon, authenticated;
revoke all on function public.ai_provider_fail_runtime_budget(uuid,uuid,integer,text,integer,jsonb) from public, anon, authenticated;
revoke all on function public.ai_provider_simulate_runtime_route(text,text,text,integer,boolean) from public, anon, authenticated;
revoke all on function public.ai_provider_restore_configuration(uuid,text) from public, anon, authenticated;

grant execute on function public.ai_provider_store_credential(uuid,uuid,text,text,text) to service_role;
grant execute on function public.ai_provider_resolve_secret(uuid) to service_role;
grant execute on function public.ai_provider_resolve_runtime_provider(text,text,text) to service_role;
grant execute on function public.ai_provider_acquire_runtime_budget(text,text,text,integer,bigint,bigint,boolean,text,text,text) to service_role;
grant execute on function public.ai_provider_reconcile_runtime_budget(uuid,uuid,integer,integer,bigint,bigint,integer,integer,text,text,numeric,jsonb) to service_role;
grant execute on function public.ai_provider_fail_runtime_budget(uuid,uuid,integer,text,integer,jsonb) to service_role;
grant execute on function public.ai_provider_simulate_runtime_route(text,text,text,integer,boolean) to service_role;
grant execute on function public.ai_provider_restore_configuration(uuid,text) to service_role;

alter table public.ai_provider_dossiers enable row level security;
alter table public.ai_provider_capacity_pools enable row level security;
alter table public.ai_provider_credentials enable row level security;
alter table public.ai_provider_models enable row level security;
alter table public.ai_provider_module_assignments enable row level security;
alter table public.ai_provider_routing_rules enable row level security;
alter table public.ai_provider_quota_policies enable row level security;
alter table public.ai_provider_budget_reservations enable row level security;
alter table public.ai_provider_runtime_leases enable row level security;
alter table public.ai_provider_usage_ledger enable row level security;
alter table public.ai_provider_health_checks enable row level security;
alter table public.ai_provider_cooldowns enable row level security;
alter table public.ai_provider_incidents enable row level security;
alter table public.ai_provider_config_versions enable row level security;
alter table public.ai_provider_alerts enable row level security;
alter table public.ai_provider_emergency_state enable row level security;
alter table public.ai_provider_audit enable row level security;

revoke all on public.ai_provider_dossiers, public.ai_provider_capacity_pools, public.ai_provider_credentials,
  public.ai_provider_models, public.ai_provider_module_assignments, public.ai_provider_routing_rules,
  public.ai_provider_quota_policies, public.ai_provider_budget_reservations, public.ai_provider_runtime_leases,
  public.ai_provider_usage_ledger, public.ai_provider_health_checks, public.ai_provider_cooldowns,
  public.ai_provider_incidents, public.ai_provider_config_versions, public.ai_provider_alerts,
  public.ai_provider_emergency_state, public.ai_provider_audit from anon, authenticated;

grant select,insert,update,delete on public.ai_provider_dossiers, public.ai_provider_capacity_pools, public.ai_provider_credentials,
  public.ai_provider_models, public.ai_provider_module_assignments, public.ai_provider_routing_rules,
  public.ai_provider_quota_policies, public.ai_provider_budget_reservations, public.ai_provider_runtime_leases,
  public.ai_provider_usage_ledger, public.ai_provider_health_checks, public.ai_provider_cooldowns,
  public.ai_provider_incidents, public.ai_provider_config_versions, public.ai_provider_alerts,
  public.ai_provider_emergency_state, public.ai_provider_audit to service_role;

comment on table public.ai_provider_dossiers is 'Independent SANILA AI provider dossiers and account governance.';
comment on table public.ai_provider_credentials is 'Credential metadata only. Secret material is stored encrypted in Supabase Vault.';
comment on function public.ai_provider_acquire_runtime_budget is 'Atomic provider routing, quota reservation and concurrency lease acquisition for all SANILA AI modules.';

commit;
