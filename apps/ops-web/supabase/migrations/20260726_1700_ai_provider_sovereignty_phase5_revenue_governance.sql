-- ANGELCARE / SANILA AI Provider Sovereign Control Plane — Phase 5
-- Revenue Command OS governance, weekly budgets, schedules, deduplication and reuse.
-- ADDITIVE / IDEMPOTENT. This migration is intentionally NOT auto-applied by the package.

begin;

create extension if not exists pgcrypto;

-- -----------------------------------------------------------------------------
-- 1. Extend the authoritative quota and reservation contracts.
-- -----------------------------------------------------------------------------

alter table if exists public.ai_provider_quota_policies
  add column if not exists max_requests_per_week integer,
  add column if not exists max_input_tokens_per_week bigint,
  add column if not exists max_output_tokens_per_week bigint,
  add column if not exists max_total_tokens_per_week bigint,
  add column if not exists max_estimated_cost_usd_per_day numeric(14,6),
  add column if not exists max_estimated_cost_usd_per_week numeric(14,6),
  add column if not exists max_estimated_cost_usd_per_month numeric(14,6);

alter table if exists public.ai_provider_budget_reservations
  add column if not exists reserved_cost_usd numeric(14,6) not null default 0,
  add column if not exists workspace_key text,
  add column if not exists trigger_type text,
  add column if not exists request_fingerprint text,
  add column if not exists governed_request_id uuid;

-- -----------------------------------------------------------------------------
-- 2. Per-command operating envelopes and centrally governed schedules.
-- -----------------------------------------------------------------------------

create table if not exists public.ai_provider_command_policies (
  id uuid primary key default gen_random_uuid(),
  module_key text not null,
  workspace_key text not null default '*',
  command_code text not null,
  ai_mode text not null default 'ai_required'
    check (ai_mode in ('deterministic','ai_optional','ai_recommended','ai_required','ai_prohibited')),
  manual_allowed boolean not null default true,
  scheduled_allowed boolean not null default false,
  minimum_interval_seconds integer not null default 0 check (minimum_interval_seconds >= 0),
  max_runs_per_day integer,
  max_runs_per_week integer,
  max_runs_per_month integer,
  max_input_tokens_per_run bigint,
  max_output_tokens_per_run bigint,
  max_cost_usd_per_run numeric(14,6),
  max_cost_usd_per_day numeric(14,6),
  max_cost_usd_per_week numeric(14,6),
  max_retries integer not null default 0 check (max_retries >= 0),
  cache_mode text not null default 'until_source_changes'
    check (cache_mode in ('no_cache','short','daily','weekly','until_source_changes','manual_invalidation')),
  cache_ttl_seconds integer not null default 21600 check (cache_ttl_seconds >= 0),
  duplicate_window_seconds integer not null default 900 check (duplicate_window_seconds >= 0),
  force_refresh_allowed boolean not null default false,
  approval_class text not null default 'none',
  allowed_provider_types text[] not null default '{}'::text[],
  allowed_models text[] not null default '{}'::text[],
  allowed_trigger_types text[] not null default array['manual']::text[],
  execution_window jsonb not null default '{}'::jsonb,
  cooldown_after_failure_seconds integer not null default 300 check (cooldown_after_failure_seconds >= 0),
  consecutive_failure_suspend_threshold integer not null default 3 check (consecutive_failure_suspend_threshold >= 0),
  enabled boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_by text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(module_key, workspace_key, command_code)
);

create table if not exists public.ai_provider_command_schedules (
  id uuid primary key default gen_random_uuid(),
  schedule_key text not null unique,
  module_key text not null,
  workspace_key text not null default '*',
  command_code text not null,
  schedule_expression text not null,
  schedule_format text not null default 'cron' check (schedule_format in ('cron','rrule','interval')),
  timezone text not null default 'Africa/Casablanca',
  enabled boolean not null default false,
  status text not null default 'paused' check (status in ('active','paused','suspended','completed','archived')),
  priority integer not null default 100,
  freshness_seconds integer not null default 21600 check (freshness_seconds >= 0),
  duplicate_window_seconds integer not null default 900 check (duplicate_window_seconds >= 0),
  max_runs_per_day integer,
  max_runs_per_week integer,
  estimated_input_tokens bigint not null default 0,
  estimated_output_tokens bigint not null default 0,
  estimated_cost_usd numeric(14,6) not null default 0,
  approval_required boolean not null default false,
  provider_policy jsonb not null default '{}'::jsonb,
  dependency_policy jsonb not null default '{}'::jsonb,
  failure_policy jsonb not null default '{}'::jsonb,
  last_due_at timestamptz,
  last_started_at timestamptz,
  last_completed_at timestamptz,
  next_run_at timestamptz,
  skipped_count integer not null default 0,
  failure_count integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_by text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- 3. Governed request identity, in-flight collapse, structured cache and savings.
-- -----------------------------------------------------------------------------

create table if not exists public.ai_provider_governed_requests (
  id uuid primary key default gen_random_uuid(),
  request_fingerprint text not null,
  module_key text not null,
  workspace_key text not null default '*',
  capability text not null,
  command_code text,
  mandate_id text,
  mission_id text,
  actor_id text,
  trigger_type text not null default 'manual'
    check (trigger_type in ('manual','scheduled','retry','forced_refresh','system','health_test')),
  schedule_id uuid references public.ai_provider_command_schedules(id) on delete set null,
  prompt_version text,
  source_revision text,
  requested_model text,
  provider_type text,
  model_code text,
  decision text not null default 'EXECUTE_NEW'
    check (decision in ('EXECUTE_NEW','REUSE_CACHED','JOIN_IN_FLIGHT','BLOCK_QUOTA','BLOCK_DUPLICATE','BLOCK_POLICY','DEFER_SCHEDULE','REQUIRE_APPROVAL')),
  status text not null default 'queued'
    check (status in ('queued','running','joined','completed','failed','blocked','deferred','cancelled','expired')),
  source_request_id uuid references public.ai_provider_governed_requests(id) on delete set null,
  reservation_id uuid references public.ai_provider_budget_reservations(id) on delete set null,
  lease_id uuid references public.ai_provider_runtime_leases(id) on delete set null,
  estimated_requests integer not null default 1,
  estimated_input_tokens bigint not null default 0,
  estimated_output_tokens bigint not null default 0,
  estimated_cost_usd numeric(14,6) not null default 0,
  actual_input_tokens bigint not null default 0,
  actual_output_tokens bigint not null default 0,
  actual_cost_usd numeric(14,6) not null default 0,
  result_json jsonb,
  result_hash text,
  cache_expires_at timestamptz,
  error_code text,
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists ai_provider_one_active_fingerprint_idx
  on public.ai_provider_governed_requests(request_fingerprint)
  where status in ('queued','running');

create index if not exists ai_provider_governed_requests_module_time_idx
  on public.ai_provider_governed_requests(module_key, created_at desc);
create index if not exists ai_provider_governed_requests_command_time_idx
  on public.ai_provider_governed_requests(command_code, created_at desc);
create index if not exists ai_provider_governed_requests_source_idx
  on public.ai_provider_governed_requests(source_request_id);

create table if not exists public.ai_provider_structured_result_cache (
  id uuid primary key default gen_random_uuid(),
  request_fingerprint text not null unique,
  module_key text not null,
  workspace_key text not null default '*',
  capability text not null,
  command_code text,
  prompt_version text,
  source_revision text,
  provider_type text,
  model_code text,
  result_json jsonb not null,
  result_hash text not null,
  validation_status text not null default 'validated'
    check (validation_status in ('pending','validated','rejected','invalidated')),
  source_request_id uuid references public.ai_provider_governed_requests(id) on delete set null,
  original_input_tokens bigint not null default 0,
  original_output_tokens bigint not null default 0,
  original_cost_usd numeric(14,6) not null default 0,
  reuse_count bigint not null default 0,
  avoided_input_tokens bigint not null default 0,
  avoided_output_tokens bigint not null default 0,
  avoided_cost_usd numeric(14,6) not null default 0,
  expires_at timestamptz,
  invalidated_at timestamptz,
  invalidation_reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ai_provider_structured_cache_expiry_idx
  on public.ai_provider_structured_result_cache(expires_at)
  where invalidated_at is null;

create table if not exists public.ai_provider_reuse_events (
  id uuid primary key default gen_random_uuid(),
  request_id uuid references public.ai_provider_governed_requests(id) on delete cascade,
  source_request_id uuid references public.ai_provider_governed_requests(id) on delete set null,
  cache_id uuid references public.ai_provider_structured_result_cache(id) on delete set null,
  module_key text,
  workspace_key text,
  command_code text,
  event_type text not null check (event_type in ('cache_reuse','joined_in_flight','duplicate_blocked','schedule_deferred')),
  avoided_requests integer not null default 0,
  avoided_input_tokens bigint not null default 0,
  avoided_output_tokens bigint not null default 0,
  avoided_cost_usd numeric(14,6) not null default 0,
  actor_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table if exists public.ai_provider_reuse_events
  add column if not exists module_key text,
  add column if not exists workspace_key text,
  add column if not exists command_code text;

create table if not exists public.ai_provider_policy_overrides (
  id uuid primary key default gen_random_uuid(),
  scope_type text not null,
  scope_key text not null,
  override_type text not null,
  reason text not null,
  approved_by text not null,
  starts_at timestamptz not null default now(),
  expires_at timestamptz not null,
  max_requests integer,
  max_cost_usd numeric(14,6),
  status text not null default 'active' check (status in ('active','expired','revoked','consumed')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Reservation linkage can only be added after the governed request table exists.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'ai_provider_budget_reservations_governed_request_fk'
  ) then
    alter table public.ai_provider_budget_reservations
      add constraint ai_provider_budget_reservations_governed_request_fk
      foreign key (governed_request_id) references public.ai_provider_governed_requests(id) on delete set null;
  end if;
end $$;

-- -----------------------------------------------------------------------------
-- 4. Seed conservative Revenue OS command policies without overriding local edits.
-- -----------------------------------------------------------------------------

insert into public.ai_provider_command_policies(
  module_key,workspace_key,command_code,ai_mode,manual_allowed,scheduled_allowed,
  minimum_interval_seconds,max_runs_per_day,max_runs_per_week,max_runs_per_month,
  max_input_tokens_per_run,max_output_tokens_per_run,max_cost_usd_per_run,
  max_cost_usd_per_day,max_cost_usd_per_week,max_retries,cache_mode,cache_ttl_seconds,
  duplicate_window_seconds,force_refresh_allowed,allowed_trigger_types,metadata
) values
  ('revenue_os','strategy-assembly','REVENUE_STRATEGY_ASSEMBLY','ai_required',true,false,
   900,4,12,40,180000,32000,2.000000,4.000000,12.000000,1,'until_source_changes',86400,1800,false,
   array['manual','retry']::text[],jsonb_build_object('contract','Revenue strategy assembly')),
  ('revenue_os','validation-council','REVENUE_COUNCIL_*','ai_recommended',true,false,
   0,24,80,240,120000,7000,0.500000,8.000000,24.000000,1,'until_source_changes',86400,1800,false,
   array['manual','retry']::text[],jsonb_build_object('contract','Council specialist envelope')),
  ('revenue_os','executive-cockpit','REVENUE_EXECUTIVE_BRIEF','ai_optional',true,true,
   21600,4,20,80,24000,1800,0.100000,0.400000,2.000000,0,'until_source_changes',21600,21600,false,
   array['manual','scheduled','system']::text[],jsonb_build_object('contract','Executive brief refresh only on changed facts')),
  ('revenue_os','provider-health','REVENUE_PROVIDER_HEALTH_ACTIVE','ai_optional',true,true,
   21600,2,4,16,1000,64,0.020000,0.040000,0.080000,0,'daily',3600,3600,false,
   array['manual','scheduled','health_test']::text[],jsonb_build_object('contract','Explicit active health only')),
  ('ai_provider_control','credential-health','AI_PROVIDER_CREDENTIAL_TEST','ai_optional',true,false,
   21600,4,12,48,1000,64,0.020000,0.080000,0.240000,0,'no_cache',0,21600,false,
   array['health_test']::text[],jsonb_build_object('contract','Explicit credential validation under central policy'))
on conflict (module_key,workspace_key,command_code) do nothing;

insert into public.ai_provider_quota_policies(
  scope_type,scope_key,max_requests_per_week,max_input_tokens_per_week,
  max_output_tokens_per_week,max_total_tokens_per_week,
  max_estimated_cost_usd_per_day,max_estimated_cost_usd_per_week,
  max_estimated_cost_usd_per_month,soft_threshold_percent,hard_limit,enabled,metadata
) values (
  'module','revenue_os',120,1000000,240000,1240000,10.000000,40.000000,140.000000,75,true,true,
  jsonb_build_object('phase','AI_SOVEREIGNTY_PHASE5','owner','AI Provider Control')
)
on conflict (scope_type,scope_key) do update set
  max_requests_per_week = coalesce(public.ai_provider_quota_policies.max_requests_per_week, excluded.max_requests_per_week),
  max_input_tokens_per_week = coalesce(public.ai_provider_quota_policies.max_input_tokens_per_week, excluded.max_input_tokens_per_week),
  max_output_tokens_per_week = coalesce(public.ai_provider_quota_policies.max_output_tokens_per_week, excluded.max_output_tokens_per_week),
  max_total_tokens_per_week = coalesce(public.ai_provider_quota_policies.max_total_tokens_per_week, excluded.max_total_tokens_per_week),
  max_estimated_cost_usd_per_day = coalesce(public.ai_provider_quota_policies.max_estimated_cost_usd_per_day, excluded.max_estimated_cost_usd_per_day),
  max_estimated_cost_usd_per_week = coalesce(public.ai_provider_quota_policies.max_estimated_cost_usd_per_week, excluded.max_estimated_cost_usd_per_week),
  max_estimated_cost_usd_per_month = coalesce(public.ai_provider_quota_policies.max_estimated_cost_usd_per_month, excluded.max_estimated_cost_usd_per_month),
  metadata = public.ai_provider_quota_policies.metadata || excluded.metadata,
  updated_at = now();

insert into public.ai_provider_quota_policies(
  scope_type,scope_key,max_requests_per_day,max_requests_per_week,
  max_input_tokens_per_week,max_output_tokens_per_week,max_total_tokens_per_week,
  max_estimated_cost_usd_per_day,max_estimated_cost_usd_per_week,
  max_estimated_cost_usd_per_month,soft_threshold_percent,hard_limit,enabled,metadata
) values (
  'module','ai_provider_control',4,20,20000,4000,24000,0.100000,0.400000,1.500000,75,true,true,
  jsonb_build_object('phase','AI_SOVEREIGNTY_PHASE5','purpose','Govern active provider tests without silent consumption')
)
on conflict (scope_type,scope_key) do update set
  max_requests_per_day = coalesce(public.ai_provider_quota_policies.max_requests_per_day, excluded.max_requests_per_day),
  max_requests_per_week = coalesce(public.ai_provider_quota_policies.max_requests_per_week, excluded.max_requests_per_week),
  max_input_tokens_per_week = coalesce(public.ai_provider_quota_policies.max_input_tokens_per_week, excluded.max_input_tokens_per_week),
  max_output_tokens_per_week = coalesce(public.ai_provider_quota_policies.max_output_tokens_per_week, excluded.max_output_tokens_per_week),
  max_total_tokens_per_week = coalesce(public.ai_provider_quota_policies.max_total_tokens_per_week, excluded.max_total_tokens_per_week),
  max_estimated_cost_usd_per_day = coalesce(public.ai_provider_quota_policies.max_estimated_cost_usd_per_day, excluded.max_estimated_cost_usd_per_day),
  max_estimated_cost_usd_per_week = coalesce(public.ai_provider_quota_policies.max_estimated_cost_usd_per_week, excluded.max_estimated_cost_usd_per_week),
  max_estimated_cost_usd_per_month = coalesce(public.ai_provider_quota_policies.max_estimated_cost_usd_per_month, excluded.max_estimated_cost_usd_per_month),
  metadata = public.ai_provider_quota_policies.metadata || excluded.metadata,
  updated_at = now();

-- -----------------------------------------------------------------------------
-- 5. Read-only preflight. No provider request, reservation or token consumption.
-- -----------------------------------------------------------------------------

create or replace function public.ai_provider_preflight_governed_request(
  p_module_key text,
  p_workspace_key text,
  p_capability text,
  p_command_code text,
  p_requested_model text,
  p_request_fingerprint text,
  p_trigger_type text default 'manual',
  p_schedule_key text default null,
  p_actor_id text default null,
  p_estimated_requests integer default 1,
  p_estimated_input_tokens bigint default 0,
  p_estimated_output_tokens bigint default 0,
  p_estimated_cost_usd numeric default 0,
  p_force_refresh boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_route record;
  v_policy record;
  v_cache record;
  v_inflight record;
  v_schedule record;
  v_schedule_json jsonb := null;
  v_day_start timestamptz := date_trunc('day', now());
  v_week_start timestamptz := date_trunc('week', now());
  v_day_requests bigint := 0;
  v_week_requests bigint := 0;
  v_day_cost numeric := 0;
  v_week_cost numeric := 0;
  v_day_input bigint := 0;
  v_week_input bigint := 0;
  v_day_output bigint := 0;
  v_week_output bigint := 0;
  v_quota record;
  v_command_day_runs bigint := 0;
  v_command_week_runs bigint := 0;
  v_command_day_cost numeric := 0;
  v_command_week_cost numeric := 0;
  v_last_command_completed timestamptz;
  v_decision text := 'EXECUTE_NEW';
  v_reason text;
begin
  select * into v_route
  from public.ai_provider_resolve_runtime_provider(p_module_key,p_capability,p_requested_model)
  limit 1;
  if not found then
    return jsonb_build_object('eligible',false,'decision','BLOCK_POLICY','reason','AI_PROVIDER_ROUTE_NOT_FOUND');
  end if;

  select * into v_policy
  from public.ai_provider_command_policies p
  where p.enabled=true
    and p.module_key in (p_module_key,'*')
    and p.workspace_key in (coalesce(nullif(p_workspace_key,''),'*'),'*')
    and (p.command_code=p_command_code or (right(p.command_code,1)='*' and p_command_code like left(p.command_code,length(p.command_code)-1)||'%') or p.command_code='*')
  order by (p.module_key=p_module_key) desc,(p.workspace_key=p_workspace_key) desc,(p.command_code=p_command_code) desc,length(p.command_code) desc
  limit 1;

  if found then
    if v_policy.ai_mode='ai_prohibited' or not v_policy.enabled then
      v_decision:='BLOCK_POLICY'; v_reason:='AI_COMMAND_PROHIBITED';
    elsif p_trigger_type='scheduled' and not v_policy.scheduled_allowed then
      v_decision:='BLOCK_POLICY'; v_reason:='SCHEDULED_TRIGGER_NOT_ALLOWED';
    elsif p_trigger_type<>'scheduled' and not v_policy.manual_allowed then
      v_decision:='BLOCK_POLICY'; v_reason:='MANUAL_TRIGGER_NOT_ALLOWED';
    elsif cardinality(v_policy.allowed_trigger_types)>0 and not (p_trigger_type=any(v_policy.allowed_trigger_types)) then
      v_decision:='BLOCK_POLICY'; v_reason:='TRIGGER_TYPE_NOT_ALLOWED';
    elsif p_force_refresh and not v_policy.force_refresh_allowed then
      v_decision:='BLOCK_POLICY'; v_reason:='FORCE_REFRESH_NOT_ALLOWED';
    end if;
  end if;

  if p_trigger_type='scheduled' then
    select * into v_schedule from public.ai_provider_command_schedules
    where schedule_key=p_schedule_key and module_key=p_module_key and command_code=p_command_code
    limit 1;
    if not found or not v_schedule.enabled or v_schedule.status<>'active' then
      v_decision:='DEFER_SCHEDULE'; v_reason:='SCHEDULE_NOT_ACTIVE';
    elsif v_schedule.next_run_at is not null and v_schedule.next_run_at>now() then
      v_decision:='DEFER_SCHEDULE'; v_reason:='SCHEDULE_NOT_DUE';
    elsif v_schedule.freshness_seconds>0 and v_schedule.last_completed_at is not null
      and v_schedule.last_completed_at>now()-make_interval(secs=>v_schedule.freshness_seconds) then
      v_decision:='DEFER_SCHEDULE'; v_reason:='SCHEDULE_RESULT_STILL_FRESH';
    else
      v_schedule_json:=to_jsonb(v_schedule);
    end if;
  end if;

  if not p_force_refresh and (v_policy.id is null or v_policy.cache_mode<>'no_cache') then
    select * into v_cache
    from public.ai_provider_structured_result_cache
    where request_fingerprint=p_request_fingerprint
      and validation_status='validated'
      and invalidated_at is null
      and (expires_at is null or expires_at>now())
    limit 1;
    if found then v_decision:='REUSE_CACHED'; v_reason:='VALID_STRUCTURED_RESULT_AVAILABLE'; end if;
  end if;

  if v_decision='EXECUTE_NEW' then
    select * into v_inflight
    from public.ai_provider_governed_requests
    where request_fingerprint=p_request_fingerprint and status in ('queued','running')
    order by created_at desc limit 1;
    if found then v_decision:='JOIN_IN_FLIGHT'; v_reason:='EQUIVALENT_REQUEST_ALREADY_RUNNING'; end if;
  end if;

  select
    coalesce(sum(request_count) filter(where occurred_at>=v_day_start),0),
    coalesce(sum(request_count) filter(where occurred_at>=v_week_start),0),
    coalesce(sum(estimated_cost_usd) filter(where occurred_at>=v_day_start),0),
    coalesce(sum(estimated_cost_usd) filter(where occurred_at>=v_week_start),0),
    coalesce(sum(input_tokens) filter(where occurred_at>=v_day_start),0),
    coalesce(sum(input_tokens) filter(where occurred_at>=v_week_start),0),
    coalesce(sum(output_tokens) filter(where occurred_at>=v_day_start),0),
    coalesce(sum(output_tokens) filter(where occurred_at>=v_week_start),0)
  into v_day_requests,v_week_requests,v_day_cost,v_week_cost,v_day_input,v_week_input,v_day_output,v_week_output
  from public.ai_provider_usage_ledger
  where module_key=p_module_key;

  select
    v_day_requests+coalesce(sum(reserved_requests) filter(where created_at>=v_day_start),0),
    v_week_requests+coalesce(sum(reserved_requests) filter(where created_at>=v_week_start),0),
    v_day_cost+coalesce(sum(reserved_cost_usd) filter(where created_at>=v_day_start),0),
    v_week_cost+coalesce(sum(reserved_cost_usd) filter(where created_at>=v_week_start),0),
    v_day_input+coalesce(sum(reserved_input_tokens) filter(where created_at>=v_day_start),0),
    v_week_input+coalesce(sum(reserved_input_tokens) filter(where created_at>=v_week_start),0),
    v_day_output+coalesce(sum(reserved_output_tokens) filter(where created_at>=v_day_start),0),
    v_week_output+coalesce(sum(reserved_output_tokens) filter(where created_at>=v_week_start),0)
  into v_day_requests,v_week_requests,v_day_cost,v_week_cost,v_day_input,v_week_input,v_day_output,v_week_output
  from public.ai_provider_budget_reservations
  where module_key=p_module_key and status in ('reserved','running');

  if v_decision='EXECUTE_NEW' then
    select * into v_quota from public.ai_provider_quota_policies
    where enabled=true and scope_type='module' and scope_key=p_module_key limit 1;
    if found and v_quota.hard_limit then
      if v_quota.max_requests_per_day is not null and v_day_requests+greatest(1,p_estimated_requests)>v_quota.max_requests_per_day then v_decision:='BLOCK_QUOTA'; v_reason:='MODULE_DAILY_REQUEST_BUDGET'; end if;
      if v_quota.max_requests_per_week is not null and v_week_requests+greatest(1,p_estimated_requests)>v_quota.max_requests_per_week then v_decision:='BLOCK_QUOTA'; v_reason:='MODULE_WEEKLY_REQUEST_BUDGET'; end if;
      if v_quota.max_input_tokens_per_day is not null and v_day_input+greatest(0,p_estimated_input_tokens)>v_quota.max_input_tokens_per_day then v_decision:='BLOCK_QUOTA'; v_reason:='MODULE_DAILY_INPUT_TOKEN_BUDGET'; end if;
      if v_quota.max_input_tokens_per_week is not null and v_week_input+greatest(0,p_estimated_input_tokens)>v_quota.max_input_tokens_per_week then v_decision:='BLOCK_QUOTA'; v_reason:='MODULE_WEEKLY_INPUT_TOKEN_BUDGET'; end if;
      if v_quota.max_output_tokens_per_day is not null and v_day_output+greatest(0,p_estimated_output_tokens)>v_quota.max_output_tokens_per_day then v_decision:='BLOCK_QUOTA'; v_reason:='MODULE_DAILY_OUTPUT_TOKEN_BUDGET'; end if;
      if v_quota.max_output_tokens_per_week is not null and v_week_output+greatest(0,p_estimated_output_tokens)>v_quota.max_output_tokens_per_week then v_decision:='BLOCK_QUOTA'; v_reason:='MODULE_WEEKLY_OUTPUT_TOKEN_BUDGET'; end if;
      if v_quota.max_total_tokens_per_week is not null and v_week_input+v_week_output+greatest(0,p_estimated_input_tokens)+greatest(0,p_estimated_output_tokens)>v_quota.max_total_tokens_per_week then v_decision:='BLOCK_QUOTA'; v_reason:='MODULE_WEEKLY_TOTAL_TOKEN_BUDGET'; end if;
      if v_quota.max_estimated_cost_usd_per_day is not null and v_day_cost+greatest(0,p_estimated_cost_usd)>v_quota.max_estimated_cost_usd_per_day then v_decision:='BLOCK_QUOTA'; v_reason:='MODULE_DAILY_COST_BUDGET'; end if;
      if v_quota.max_estimated_cost_usd_per_week is not null and v_week_cost+greatest(0,p_estimated_cost_usd)>v_quota.max_estimated_cost_usd_per_week then v_decision:='BLOCK_QUOTA'; v_reason:='MODULE_WEEKLY_COST_BUDGET'; end if;
    end if;
  end if;

  if v_decision='EXECUTE_NEW' and v_policy.id is not null then
    select
      count(*) filter(where created_at>=v_day_start),
      count(*) filter(where created_at>=v_week_start),
      coalesce(sum(case when status='running' then estimated_cost_usd else actual_cost_usd end) filter(where created_at>=v_day_start),0),
      coalesce(sum(case when status='running' then estimated_cost_usd else actual_cost_usd end) filter(where created_at>=v_week_start),0),
      max(completed_at) filter(where status='completed')
    into v_command_day_runs,v_command_week_runs,v_command_day_cost,v_command_week_cost,v_last_command_completed
    from public.ai_provider_governed_requests
    where module_key=p_module_key and command_code=p_command_code and decision='EXECUTE_NEW' and status in ('running','completed');
    if v_policy.max_runs_per_day is not null and v_command_day_runs+1>v_policy.max_runs_per_day then v_decision:='BLOCK_QUOTA'; v_reason:='COMMAND_DAILY_RUN_LIMIT'; end if;
    if v_policy.max_runs_per_week is not null and v_command_week_runs+1>v_policy.max_runs_per_week then v_decision:='BLOCK_QUOTA'; v_reason:='COMMAND_WEEKLY_RUN_LIMIT'; end if;
    if v_policy.max_cost_usd_per_day is not null and v_command_day_cost+greatest(0,p_estimated_cost_usd)>v_policy.max_cost_usd_per_day then v_decision:='BLOCK_QUOTA'; v_reason:='COMMAND_DAILY_COST_LIMIT'; end if;
    if v_policy.max_cost_usd_per_week is not null and v_command_week_cost+greatest(0,p_estimated_cost_usd)>v_policy.max_cost_usd_per_week then v_decision:='BLOCK_QUOTA'; v_reason:='COMMAND_WEEKLY_COST_LIMIT'; end if;
    if v_policy.minimum_interval_seconds>0 and v_last_command_completed is not null and v_last_command_completed>now()-make_interval(secs=>v_policy.minimum_interval_seconds) then v_decision:='BLOCK_DUPLICATE'; v_reason:='COMMAND_MINIMUM_INTERVAL'; end if;
    if v_decision='EXECUTE_NEW' and coalesce(nullif(v_policy.approval_class,''),'none')<>'none' then v_decision:='REQUIRE_APPROVAL'; v_reason:='APPROVAL_REQUIRED'; end if;
  end if;

  return jsonb_build_object(
    'eligible',v_decision in ('EXECUTE_NEW','REUSE_CACHED','JOIN_IN_FLIGHT'),
    'decision',v_decision,'reason',v_reason,
    'moduleKey',p_module_key,'workspaceKey',p_workspace_key,'commandCode',p_command_code,
    'providerType',v_route.provider_type,'model',v_route.model_code,'assignmentMode',v_route.assignment_mode,
    'estimatedRequests',greatest(1,p_estimated_requests),
    'estimatedInputTokens',greatest(0,p_estimated_input_tokens),
    'estimatedOutputTokens',greatest(0,p_estimated_output_tokens),
    'estimatedCostUsd',greatest(0,p_estimated_cost_usd),
    'usage',jsonb_build_object(
      'dayRequests',v_day_requests,'weekRequests',v_week_requests,
      'dayInputTokens',v_day_input,'weekInputTokens',v_week_input,
      'dayOutputTokens',v_day_output,'weekOutputTokens',v_week_output,
      'dayCostUsd',v_day_cost,'weekCostUsd',v_week_cost
    ),
    'quota',case when v_quota.id is null then null else to_jsonb(v_quota) end,
    'policy',case when v_policy.id is null then null else to_jsonb(v_policy) end,
    'schedule',v_schedule_json,
    'cache',case when v_cache.id is null then null else jsonb_build_object('id',v_cache.id,'expiresAt',v_cache.expires_at,'reuseCount',v_cache.reuse_count) end,
    'inFlightRequestId',v_inflight.id
  );
exception when others then
  return jsonb_build_object('eligible',false,'decision','BLOCK_POLICY','reason',sqlerrm);
end;
$$;

-- -----------------------------------------------------------------------------
-- 6. Atomic request begin: deduplicate, reuse, enforce schedule/weekly/cost,
--    then acquire the existing Phase 4 provider budget and lease.
-- -----------------------------------------------------------------------------

create or replace function public.ai_provider_begin_governed_request(
  p_module_key text,
  p_workspace_key text,
  p_capability text,
  p_command_code text,
  p_requested_model text,
  p_request_fingerprint text,
  p_prompt_version text default null,
  p_source_revision text default null,
  p_trigger_type text default 'manual',
  p_schedule_key text default null,
  p_actor_id text default null,
  p_mission_id text default null,
  p_mandate_id text default null,
  p_estimated_requests integer default 1,
  p_estimated_input_tokens bigint default 0,
  p_estimated_output_tokens bigint default 0,
  p_estimated_cost_usd numeric default 0,
  p_grounded boolean default false,
  p_force_refresh boolean default false,
  p_approval_granted boolean default false,
  p_cache_ttl_seconds integer default null,
  p_metadata jsonb default '{}'::jsonb
)
returns table(
  decision text,
  request_id uuid,
  source_request_id uuid,
  reservation_id uuid,
  lease_id uuid,
  dossier_id uuid,
  capacity_pool_id uuid,
  credential_id uuid,
  provider_type text,
  model_code text,
  assignment_mode text,
  cached_result jsonb,
  cache_expires_at timestamptz,
  policy_snapshot jsonb,
  quota_snapshot jsonb
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_policy record;
  v_schedule record;
  v_schedule_id uuid := null;
  v_cache record;
  v_inflight record;
  v_route record;
  v_budget record;
  v_stale record;
  v_request_id uuid := gen_random_uuid();
  v_day_start timestamptz := date_trunc('day',now());
  v_week_start timestamptz := date_trunc('week',now());
  v_month_start timestamptz := date_trunc('month',now());
  v_day_runs bigint := 0;
  v_week_runs bigint := 0;
  v_month_runs bigint := 0;
  v_day_cost numeric := 0;
  v_week_cost numeric := 0;
  v_consecutive_failures integer := 0;
  v_last_completed timestamptz;
  v_last_failed timestamptz;
  v_retry_failures integer := 0;
  v_error text;
  v_block_decision text;
  v_block_status text;
  v_schedule_day_runs bigint := 0;
  v_schedule_week_runs bigint := 0;
  v_q record;
  v_q_day_cost numeric;
  v_q_week_cost numeric;
  v_q_month_cost numeric;
  v_q_week_requests bigint;
  v_q_week_input bigint;
  v_q_week_output bigint;
  v_q_reserved_cost_day numeric;
  v_q_reserved_cost_week numeric;
  v_q_reserved_cost_month numeric;
  v_q_reserved_requests_week bigint;
  v_q_reserved_input_week bigint;
  v_q_reserved_output_week bigint;
  v_policy_json jsonb;
  v_quota_json jsonb := '{}'::jsonb;
  v_ttl integer;
begin
  if coalesce(nullif(p_module_key,''),'')='' or coalesce(nullif(p_capability,''),'')='' or coalesce(nullif(p_request_fingerprint,''),'')='' then
    raise exception 'AI_PROVIDER_GOVERNED_REQUEST_IDENTITY_REQUIRED';
  end if;
  p_workspace_key:=coalesce(nullif(p_workspace_key,''),'*');
  p_command_code:=coalesce(nullif(p_command_code,''),p_capability);
  p_trigger_type:=coalesce(nullif(p_trigger_type,''),'manual');
  p_estimated_requests:=greatest(1,coalesce(p_estimated_requests,1));
  p_estimated_input_tokens:=greatest(0,coalesce(p_estimated_input_tokens,0));
  p_estimated_output_tokens:=greatest(0,coalesce(p_estimated_output_tokens,0));
  p_estimated_cost_usd:=greatest(0,coalesce(p_estimated_cost_usd,0));

  perform pg_advisory_xact_lock(hashtextextended('ai_provider:fingerprint:'||p_request_fingerprint,0));

  for v_stale in
    select * from public.ai_provider_governed_requests
    where request_fingerprint=p_request_fingerprint
      and status in ('queued','running')
      and created_at<now()-interval '20 minutes'
    order by created_at asc
    limit 10
    for update skip locked
  loop
    if v_stale.reservation_id is not null then
      perform public.ai_provider_fail_runtime_budget(
        v_stale.reservation_id,v_stale.lease_id,null,'STALE_RUNTIME_REQUEST',null,
        jsonb_build_object('governedRequestId',v_stale.id,'recoveredBy','AI Provider Control Phase 5')
      );
    end if;
    update public.ai_provider_governed_requests
    set status='expired',completed_at=now(),updated_at=now(),error_code='STALE_RUNTIME_REQUEST',
        error_message='Recovered stale governed request and released its reservation.'
    where id=v_stale.id;
  end loop;

  select * into v_policy
  from public.ai_provider_command_policies p
  where p.enabled=true
    and p.module_key in (p_module_key,'*')
    and p.workspace_key in (p_workspace_key,'*')
    and (p.command_code=p_command_code or (right(p.command_code,1)='*' and p_command_code like left(p.command_code,length(p.command_code)-1)||'%') or p.command_code='*')
  order by (p.module_key=p_module_key) desc,(p.workspace_key=p_workspace_key) desc,(p.command_code=p_command_code) desc,length(p.command_code) desc
  limit 1;
  v_policy_json:=case when v_policy.id is null then null else to_jsonb(v_policy) end;

  if v_policy.id is not null then
    if v_policy.ai_mode='ai_prohibited' then raise exception 'AI_PROVIDER_COMMAND_AI_PROHIBITED:%',p_command_code; end if;
    if p_trigger_type='scheduled' and not v_policy.scheduled_allowed then raise exception 'AI_PROVIDER_SCHEDULED_TRIGGER_NOT_ALLOWED:%',p_command_code; end if;
    if p_trigger_type<>'scheduled' and not v_policy.manual_allowed then raise exception 'AI_PROVIDER_MANUAL_TRIGGER_NOT_ALLOWED:%',p_command_code; end if;
    if cardinality(v_policy.allowed_trigger_types)>0 and not (p_trigger_type=any(v_policy.allowed_trigger_types)) then raise exception 'AI_PROVIDER_TRIGGER_TYPE_NOT_ALLOWED:%',p_trigger_type; end if;
    if p_force_refresh and not v_policy.force_refresh_allowed then raise exception 'AI_PROVIDER_FORCE_REFRESH_NOT_ALLOWED'; end if;
    if coalesce(nullif(v_policy.approval_class,''),'none')<>'none' and not p_approval_granted then raise exception 'AI_PROVIDER_APPROVAL_REQUIRED:%',v_policy.approval_class; end if;
  end if;

  if p_trigger_type='scheduled' then
    select * into v_schedule from public.ai_provider_command_schedules
    where schedule_key=p_schedule_key and module_key=p_module_key and command_code=p_command_code
    limit 1 for update;
    if not found or not v_schedule.enabled or v_schedule.status<>'active' then raise exception 'AI_PROVIDER_SCHEDULE_NOT_ACTIVE:%',coalesce(p_schedule_key,''); end if;
    if v_schedule.next_run_at is not null and v_schedule.next_run_at>now() then raise exception 'AI_PROVIDER_SCHEDULE_NOT_DUE:%',coalesce(p_schedule_key,''); end if;
    v_schedule_id:=v_schedule.id;
  end if;

  if not p_force_refresh and (v_policy.id is null or v_policy.cache_mode<>'no_cache') then
    select * into v_cache
    from public.ai_provider_structured_result_cache
    where request_fingerprint=p_request_fingerprint
      and validation_status='validated' and invalidated_at is null
      and (expires_at is null or expires_at>now())
    limit 1 for update;
    if found then
      insert into public.ai_provider_governed_requests(
        id,request_fingerprint,module_key,workspace_key,capability,command_code,mandate_id,mission_id,actor_id,
        trigger_type,prompt_version,source_revision,requested_model,provider_type,model_code,
        decision,status,source_request_id,estimated_requests,estimated_input_tokens,estimated_output_tokens,
        estimated_cost_usd,result_json,result_hash,cache_expires_at,completed_at,metadata
      ) values (
        v_request_id,p_request_fingerprint,p_module_key,p_workspace_key,p_capability,p_command_code,p_mandate_id,p_mission_id,p_actor_id,
        p_trigger_type,p_prompt_version,p_source_revision,p_requested_model,v_cache.provider_type,v_cache.model_code,
        'REUSE_CACHED','completed',v_cache.source_request_id,p_estimated_requests,p_estimated_input_tokens,p_estimated_output_tokens,
        p_estimated_cost_usd,v_cache.result_json,v_cache.result_hash,v_cache.expires_at,now(),coalesce(p_metadata,'{}'::jsonb)
      );
      update public.ai_provider_structured_result_cache set
        reuse_count=reuse_count+1,
        avoided_input_tokens=avoided_input_tokens+p_estimated_input_tokens,
        avoided_output_tokens=avoided_output_tokens+p_estimated_output_tokens,
        avoided_cost_usd=avoided_cost_usd+p_estimated_cost_usd,
        updated_at=now()
      where id=v_cache.id;
      insert into public.ai_provider_reuse_events(request_id,source_request_id,cache_id,module_key,workspace_key,command_code,event_type,avoided_requests,avoided_input_tokens,avoided_output_tokens,avoided_cost_usd,actor_id,metadata)
      values(v_request_id,v_cache.source_request_id,v_cache.id,p_module_key,p_workspace_key,p_command_code,'cache_reuse',p_estimated_requests,p_estimated_input_tokens,p_estimated_output_tokens,p_estimated_cost_usd,p_actor_id,coalesce(p_metadata,'{}'::jsonb));
      return query select 'REUSE_CACHED',v_request_id,v_cache.source_request_id,null::uuid,null::uuid,null::uuid,null::uuid,null::uuid,v_cache.provider_type,v_cache.model_code,null::text,v_cache.result_json,v_cache.expires_at,v_policy_json,jsonb_build_object('providerCallAvoided',true);
      return;
    end if;
  end if;

  select * into v_inflight
  from public.ai_provider_governed_requests
  where request_fingerprint=p_request_fingerprint and status in ('queued','running')
  order by created_at desc limit 1;
  if found then
    insert into public.ai_provider_governed_requests(
      id,request_fingerprint,module_key,workspace_key,capability,command_code,mandate_id,mission_id,actor_id,
      trigger_type,prompt_version,source_revision,requested_model,decision,status,source_request_id,
      estimated_requests,estimated_input_tokens,estimated_output_tokens,estimated_cost_usd,metadata
    ) values (
      v_request_id,p_request_fingerprint,p_module_key,p_workspace_key,p_capability,p_command_code,p_mandate_id,p_mission_id,p_actor_id,
      p_trigger_type,p_prompt_version,p_source_revision,p_requested_model,'JOIN_IN_FLIGHT','joined',v_inflight.id,
      p_estimated_requests,p_estimated_input_tokens,p_estimated_output_tokens,p_estimated_cost_usd,coalesce(p_metadata,'{}'::jsonb)
    );
    insert into public.ai_provider_reuse_events(request_id,source_request_id,module_key,workspace_key,command_code,event_type,avoided_requests,avoided_input_tokens,avoided_output_tokens,avoided_cost_usd,actor_id,metadata)
    values(v_request_id,v_inflight.id,p_module_key,p_workspace_key,p_command_code,'joined_in_flight',p_estimated_requests,p_estimated_input_tokens,p_estimated_output_tokens,p_estimated_cost_usd,p_actor_id,coalesce(p_metadata,'{}'::jsonb));
    return query select 'JOIN_IN_FLIGHT',v_request_id,v_inflight.id,null::uuid,null::uuid,null::uuid,null::uuid,null::uuid,v_inflight.provider_type,v_inflight.model_code,null::text,null::jsonb,null::timestamptz,v_policy_json,jsonb_build_object('providerCallAvoided',true);
    return;
  end if;

  if v_policy.id is not null then
    if v_policy.ai_mode='ai_prohibited' then raise exception 'AI_PROVIDER_COMMAND_AI_PROHIBITED:%',p_command_code; end if;
    if p_trigger_type='scheduled' and not v_policy.scheduled_allowed then raise exception 'AI_PROVIDER_SCHEDULED_TRIGGER_NOT_ALLOWED:%',p_command_code; end if;
    if p_trigger_type<>'scheduled' and not v_policy.manual_allowed then raise exception 'AI_PROVIDER_MANUAL_TRIGGER_NOT_ALLOWED:%',p_command_code; end if;
    if cardinality(v_policy.allowed_trigger_types)>0 and not (p_trigger_type=any(v_policy.allowed_trigger_types)) then raise exception 'AI_PROVIDER_TRIGGER_TYPE_NOT_ALLOWED:%',p_trigger_type; end if;
    if p_force_refresh and not v_policy.force_refresh_allowed then raise exception 'AI_PROVIDER_FORCE_REFRESH_NOT_ALLOWED'; end if;
    if coalesce(nullif(v_policy.approval_class,''),'none')<>'none' and not p_approval_granted then
      insert into public.ai_provider_governed_requests(id,request_fingerprint,module_key,workspace_key,capability,command_code,mandate_id,mission_id,actor_id,trigger_type,prompt_version,source_revision,requested_model,decision,status,estimated_requests,estimated_input_tokens,estimated_output_tokens,estimated_cost_usd,metadata)
      values(v_request_id,p_request_fingerprint,p_module_key,p_workspace_key,p_capability,p_command_code,p_mandate_id,p_mission_id,p_actor_id,p_trigger_type,p_prompt_version,p_source_revision,p_requested_model,'REQUIRE_APPROVAL','blocked',p_estimated_requests,p_estimated_input_tokens,p_estimated_output_tokens,p_estimated_cost_usd,coalesce(p_metadata,'{}'::jsonb));
      return query select 'REQUIRE_APPROVAL',v_request_id,null::uuid,null::uuid,null::uuid,null::uuid,null::uuid,null::uuid,null::text,null::text,null::text,null::jsonb,null::timestamptz,v_policy_json,jsonb_build_object('reason','APPROVAL_REQUIRED');
      return;
    end if;
    if v_policy.max_input_tokens_per_run is not null and p_estimated_input_tokens>v_policy.max_input_tokens_per_run then raise exception 'AI_PROVIDER_COMMAND_INPUT_TOKEN_CEILING:%',p_command_code; end if;
    if v_policy.max_output_tokens_per_run is not null and p_estimated_output_tokens>v_policy.max_output_tokens_per_run then raise exception 'AI_PROVIDER_COMMAND_OUTPUT_TOKEN_CEILING:%',p_command_code; end if;
    if v_policy.max_cost_usd_per_run is not null and p_estimated_cost_usd>v_policy.max_cost_usd_per_run then raise exception 'AI_PROVIDER_COMMAND_COST_CEILING:%',p_command_code; end if;

    select max(completed_at) into v_last_completed from public.ai_provider_governed_requests
    where module_key=p_module_key and command_code=p_command_code and decision='EXECUTE_NEW' and status='completed';
    if v_policy.minimum_interval_seconds>0 and v_last_completed is not null and v_last_completed>now()-make_interval(secs=>v_policy.minimum_interval_seconds) then
      raise exception 'AI_PROVIDER_COMMAND_MINIMUM_INTERVAL:%',p_command_code;
    end if;
    select max(completed_at) into v_last_failed from public.ai_provider_governed_requests
    where module_key=p_module_key and command_code=p_command_code and decision='EXECUTE_NEW' and status='failed';
    if v_policy.cooldown_after_failure_seconds>0 and v_last_failed is not null and v_last_failed>now()-make_interval(secs=>v_policy.cooldown_after_failure_seconds) then
      raise exception 'AI_PROVIDER_COMMAND_FAILURE_COOLDOWN:%',p_command_code;
    end if;
    if p_trigger_type='retry' then
      select count(*) into v_retry_failures from public.ai_provider_governed_requests
      where request_fingerprint=p_request_fingerprint and status='failed';
      if v_retry_failures>v_policy.max_retries then raise exception 'AI_PROVIDER_COMMAND_RETRY_LIMIT:%',p_command_code; end if;
    end if;

    select
      count(*) filter(where created_at>=v_day_start),
      count(*) filter(where created_at>=v_week_start),
      count(*) filter(where created_at>=v_month_start),
      coalesce(sum(case when status='running' then estimated_cost_usd else actual_cost_usd end) filter(where created_at>=v_day_start),0),
      coalesce(sum(case when status='running' then estimated_cost_usd else actual_cost_usd end) filter(where created_at>=v_week_start),0)
    into v_day_runs,v_week_runs,v_month_runs,v_day_cost,v_week_cost
    from public.ai_provider_governed_requests
    where module_key=p_module_key and command_code=p_command_code and decision='EXECUTE_NEW' and status in ('running','completed');

    if v_policy.max_runs_per_day is not null and v_day_runs+1>v_policy.max_runs_per_day then raise exception 'AI_PROVIDER_COMMAND_DAILY_RUN_LIMIT:%',p_command_code; end if;
    if v_policy.max_runs_per_week is not null and v_week_runs+1>v_policy.max_runs_per_week then raise exception 'AI_PROVIDER_COMMAND_WEEKLY_RUN_LIMIT:%',p_command_code; end if;
    if v_policy.max_runs_per_month is not null and v_month_runs+1>v_policy.max_runs_per_month then raise exception 'AI_PROVIDER_COMMAND_MONTHLY_RUN_LIMIT:%',p_command_code; end if;
    if v_policy.max_cost_usd_per_day is not null and v_day_cost+p_estimated_cost_usd>v_policy.max_cost_usd_per_day then raise exception 'AI_PROVIDER_COMMAND_DAILY_COST_LIMIT:%',p_command_code; end if;
    if v_policy.max_cost_usd_per_week is not null and v_week_cost+p_estimated_cost_usd>v_policy.max_cost_usd_per_week then raise exception 'AI_PROVIDER_COMMAND_WEEKLY_COST_LIMIT:%',p_command_code; end if;

    select count(*) into v_consecutive_failures from (
      select status from public.ai_provider_governed_requests
      where module_key=p_module_key and command_code=p_command_code and decision='EXECUTE_NEW'
      order by created_at desc limit greatest(1,v_policy.consecutive_failure_suspend_threshold)
    ) recent where status='failed';
    if v_policy.consecutive_failure_suspend_threshold>0 and v_consecutive_failures>=v_policy.consecutive_failure_suspend_threshold then
      raise exception 'AI_PROVIDER_COMMAND_SUSPENDED_AFTER_FAILURES:%',p_command_code;
    end if;
  end if;

  if p_trigger_type='scheduled' then
    select * into v_schedule from public.ai_provider_command_schedules
    where schedule_key=p_schedule_key and module_key=p_module_key and command_code=p_command_code
    limit 1 for update;
    if not found or not v_schedule.enabled or v_schedule.status<>'active'
      or (v_schedule.next_run_at is not null and v_schedule.next_run_at>now())
      or (v_schedule.freshness_seconds>0 and v_schedule.last_completed_at is not null
          and v_schedule.last_completed_at>now()-make_interval(secs=>v_schedule.freshness_seconds)) then
      insert into public.ai_provider_governed_requests(id,request_fingerprint,module_key,workspace_key,capability,command_code,mandate_id,mission_id,actor_id,trigger_type,prompt_version,source_revision,requested_model,decision,status,estimated_requests,estimated_input_tokens,estimated_output_tokens,estimated_cost_usd,metadata)
      values(v_request_id,p_request_fingerprint,p_module_key,p_workspace_key,p_capability,p_command_code,p_mandate_id,p_mission_id,p_actor_id,p_trigger_type,p_prompt_version,p_source_revision,p_requested_model,'DEFER_SCHEDULE','deferred',p_estimated_requests,p_estimated_input_tokens,p_estimated_output_tokens,p_estimated_cost_usd,coalesce(p_metadata,'{}'::jsonb));
      insert into public.ai_provider_reuse_events(request_id,module_key,workspace_key,command_code,event_type,actor_id,metadata)
      values(v_request_id,p_module_key,p_workspace_key,p_command_code,'schedule_deferred',p_actor_id,
        jsonb_build_object('reason',case
          when v_schedule.id is not null and v_schedule.next_run_at>now() then 'SCHEDULE_NOT_DUE'
          when v_schedule.id is not null and v_schedule.freshness_seconds>0 and v_schedule.last_completed_at is not null
            and v_schedule.last_completed_at>now()-make_interval(secs=>v_schedule.freshness_seconds) then 'SCHEDULE_RESULT_STILL_FRESH'
          else 'SCHEDULE_NOT_ACTIVE' end,'scheduleKey',p_schedule_key));
      return query select 'DEFER_SCHEDULE',v_request_id,null::uuid,null::uuid,null::uuid,null::uuid,null::uuid,null::uuid,null::text,null::text,null::text,null::jsonb,null::timestamptz,v_policy_json,
        jsonb_build_object('reason',case
          when v_schedule.id is not null and v_schedule.next_run_at>now() then 'SCHEDULE_NOT_DUE'
          when v_schedule.id is not null and v_schedule.freshness_seconds>0 and v_schedule.last_completed_at is not null
            and v_schedule.last_completed_at>now()-make_interval(secs=>v_schedule.freshness_seconds) then 'SCHEDULE_RESULT_STILL_FRESH'
          else 'SCHEDULE_NOT_ACTIVE' end);
      return;
    end if;
    v_schedule_id:=v_schedule.id;
    select count(*) filter(where created_at>=v_day_start),count(*) filter(where created_at>=v_week_start)
    into v_schedule_day_runs,v_schedule_week_runs
    from public.ai_provider_governed_requests where schedule_id=v_schedule_id and decision='EXECUTE_NEW' and status in ('running','completed');
    if v_schedule.max_runs_per_day is not null and v_schedule_day_runs+1>v_schedule.max_runs_per_day then raise exception 'AI_PROVIDER_SCHEDULE_DAILY_LIMIT:%',p_schedule_key; end if;
    if v_schedule.max_runs_per_week is not null and v_schedule_week_runs+1>v_schedule.max_runs_per_week then raise exception 'AI_PROVIDER_SCHEDULE_WEEKLY_LIMIT:%',p_schedule_key; end if;
  end if;

  select * into v_route from public.ai_provider_resolve_runtime_provider(p_module_key,p_capability,p_requested_model) limit 1;
  if not found then raise exception 'AI_PROVIDER_ROUTE_NOT_FOUND'; end if;
  if v_policy.id is not null then
    if cardinality(v_policy.allowed_provider_types)>0 and not (v_route.provider_type=any(v_policy.allowed_provider_types)) then raise exception 'AI_PROVIDER_PROVIDER_NOT_ALLOWED:%',v_route.provider_type; end if;
    if cardinality(v_policy.allowed_models)>0 and not (v_route.model_code=any(v_policy.allowed_models)) then raise exception 'AI_PROVIDER_MODEL_NOT_ALLOWED_BY_COMMAND:%',v_route.model_code; end if;
  end if;

  for v_q in
    select q.* from public.ai_provider_quota_policies q
    where q.enabled=true and (
      (q.scope_type='global' and q.scope_key='*') or
      (q.scope_type='module' and q.scope_key=p_module_key) or
      (q.scope_type='dossier' and q.scope_key=v_route.dossier_id::text) or
      (q.scope_type='capacity_pool' and q.scope_key=v_route.capacity_pool_id::text) or
      (q.scope_type='model' and q.scope_key=v_route.model_code) or
      (q.scope_type='command' and q.scope_key=p_command_code) or
      (q.scope_type='user' and p_actor_id is not null and q.scope_key=p_actor_id)
    )
  loop
    select
      coalesce(sum(estimated_cost_usd) filter(where occurred_at>=v_day_start),0),
      coalesce(sum(estimated_cost_usd) filter(where occurred_at>=v_week_start),0),
      coalesce(sum(estimated_cost_usd) filter(where occurred_at>=v_month_start),0),
      coalesce(sum(request_count) filter(where occurred_at>=v_week_start),0),
      coalesce(sum(input_tokens) filter(where occurred_at>=v_week_start),0),
      coalesce(sum(output_tokens) filter(where occurred_at>=v_week_start),0)
    into v_q_day_cost,v_q_week_cost,v_q_month_cost,v_q_week_requests,v_q_week_input,v_q_week_output
    from public.ai_provider_usage_ledger u
    where case v_q.scope_type
      when 'global' then true when 'module' then u.module_key=v_q.scope_key
      when 'dossier' then u.dossier_id::text=v_q.scope_key when 'capacity_pool' then u.capacity_pool_id::text=v_q.scope_key
      when 'model' then u.model_code=v_q.scope_key when 'command' then u.command_code=v_q.scope_key
      when 'user' then u.actor_id=v_q.scope_key else false end;

    select
      coalesce(sum(reserved_cost_usd) filter(where created_at>=v_day_start),0),
      coalesce(sum(reserved_cost_usd) filter(where created_at>=v_week_start),0),
      coalesce(sum(reserved_cost_usd) filter(where created_at>=v_month_start),0),
      coalesce(sum(reserved_requests) filter(where created_at>=v_week_start),0),
      coalesce(sum(reserved_input_tokens) filter(where created_at>=v_week_start),0),
      coalesce(sum(reserved_output_tokens) filter(where created_at>=v_week_start),0)
    into v_q_reserved_cost_day,v_q_reserved_cost_week,v_q_reserved_cost_month,v_q_reserved_requests_week,v_q_reserved_input_week,v_q_reserved_output_week
    from public.ai_provider_budget_reservations r
    where r.status in ('reserved','running') and case v_q.scope_type
      when 'global' then true when 'module' then r.module_key=v_q.scope_key
      when 'dossier' then r.dossier_id::text=v_q.scope_key when 'capacity_pool' then r.capacity_pool_id::text=v_q.scope_key
      when 'model' then r.model_code=v_q.scope_key when 'command' then r.command_code=v_q.scope_key
      when 'user' then r.actor_id=v_q.scope_key else false end;

    v_q_day_cost:=v_q_day_cost+v_q_reserved_cost_day;
    v_q_week_cost:=v_q_week_cost+v_q_reserved_cost_week;
    v_q_month_cost:=v_q_month_cost+v_q_reserved_cost_month;
    v_q_week_requests:=v_q_week_requests+v_q_reserved_requests_week;
    v_q_week_input:=v_q_week_input+v_q_reserved_input_week;
    v_q_week_output:=v_q_week_output+v_q_reserved_output_week;

    if v_q.hard_limit then
      if v_q.max_requests_per_week is not null and v_q_week_requests+p_estimated_requests>v_q.max_requests_per_week then raise exception 'AI_PROVIDER_WEEKLY_REQUEST_BUDGET_EXHAUSTED:%:%',v_q.scope_type,v_q.scope_key; end if;
      if v_q.max_input_tokens_per_week is not null and v_q_week_input+p_estimated_input_tokens>v_q.max_input_tokens_per_week then raise exception 'AI_PROVIDER_WEEKLY_INPUT_TOKEN_BUDGET_EXHAUSTED:%:%',v_q.scope_type,v_q.scope_key; end if;
      if v_q.max_output_tokens_per_week is not null and v_q_week_output+p_estimated_output_tokens>v_q.max_output_tokens_per_week then raise exception 'AI_PROVIDER_WEEKLY_OUTPUT_TOKEN_BUDGET_EXHAUSTED:%:%',v_q.scope_type,v_q.scope_key; end if;
      if v_q.max_total_tokens_per_week is not null and v_q_week_input+v_q_week_output+p_estimated_input_tokens+p_estimated_output_tokens>v_q.max_total_tokens_per_week then raise exception 'AI_PROVIDER_WEEKLY_TOTAL_TOKEN_BUDGET_EXHAUSTED:%:%',v_q.scope_type,v_q.scope_key; end if;
      if v_q.max_estimated_cost_usd_per_day is not null and v_q_day_cost+p_estimated_cost_usd>v_q.max_estimated_cost_usd_per_day then raise exception 'AI_PROVIDER_DAILY_COST_BUDGET_EXHAUSTED:%:%',v_q.scope_type,v_q.scope_key; end if;
      if v_q.max_estimated_cost_usd_per_week is not null and v_q_week_cost+p_estimated_cost_usd>v_q.max_estimated_cost_usd_per_week then raise exception 'AI_PROVIDER_WEEKLY_COST_BUDGET_EXHAUSTED:%:%',v_q.scope_type,v_q.scope_key; end if;
      if v_q.max_estimated_cost_usd_per_month is not null and v_q_month_cost+p_estimated_cost_usd>v_q.max_estimated_cost_usd_per_month then raise exception 'AI_PROVIDER_MONTHLY_COST_BUDGET_EXHAUSTED:%:%',v_q.scope_type,v_q.scope_key; end if;
    end if;
    v_quota_json:=v_quota_json||jsonb_build_object(v_q.scope_type||':'||v_q.scope_key,jsonb_build_object('weekRequests',v_q_week_requests,'weekInputTokens',v_q_week_input,'weekOutputTokens',v_q_week_output,'dayCostUsd',v_q_day_cost,'weekCostUsd',v_q_week_cost,'monthCostUsd',v_q_month_cost));
  end loop;

  select * into v_budget
  from public.ai_provider_acquire_runtime_budget(
    p_module_key,p_capability,v_route.model_code,p_estimated_requests,p_estimated_input_tokens,p_estimated_output_tokens,
    p_grounded,p_actor_id,p_mission_id,p_command_code
  ) limit 1;

  update public.ai_provider_budget_reservations set
    reserved_cost_usd=p_estimated_cost_usd,workspace_key=p_workspace_key,trigger_type=p_trigger_type,
    request_fingerprint=p_request_fingerprint,governed_request_id=v_request_id,
    metadata=metadata||jsonb_build_object('promptVersion',p_prompt_version,'sourceRevision',p_source_revision,'mandateId',p_mandate_id)
  where id=v_budget.reservation_id;

  insert into public.ai_provider_governed_requests(
    id,request_fingerprint,module_key,workspace_key,capability,command_code,mandate_id,mission_id,actor_id,trigger_type,schedule_id,
    prompt_version,source_revision,requested_model,provider_type,model_code,decision,status,reservation_id,lease_id,
    estimated_requests,estimated_input_tokens,estimated_output_tokens,estimated_cost_usd,started_at,metadata
  ) values (
    v_request_id,p_request_fingerprint,p_module_key,p_workspace_key,p_capability,p_command_code,p_mandate_id,p_mission_id,p_actor_id,p_trigger_type,v_schedule_id,
    p_prompt_version,p_source_revision,p_requested_model,v_budget.provider_type,v_budget.model_code,'EXECUTE_NEW','running',v_budget.reservation_id,v_budget.lease_id,
    p_estimated_requests,p_estimated_input_tokens,p_estimated_output_tokens,p_estimated_cost_usd,now(),coalesce(p_metadata,'{}'::jsonb)
  );

  if v_schedule_id is not null then
    update public.ai_provider_command_schedules set last_started_at=now(),updated_at=now() where id=v_schedule_id;
  end if;

  v_ttl:=case
    when v_policy.id is not null and v_policy.cache_mode='no_cache' then 0
    when v_policy.id is not null and p_cache_ttl_seconds is not null then least(greatest(0,p_cache_ttl_seconds),greatest(0,v_policy.cache_ttl_seconds))
    when v_policy.id is not null then greatest(0,v_policy.cache_ttl_seconds)
    else greatest(0,coalesce(p_cache_ttl_seconds,0)) end;
  update public.ai_provider_governed_requests
  set cache_expires_at=case when v_ttl>0 then now()+make_interval(secs=>v_ttl) else null end,
      metadata=metadata||jsonb_build_object('effectiveCacheTtlSeconds',v_ttl),updated_at=now()
  where id=v_request_id;
  return query select 'EXECUTE_NEW',v_request_id,null::uuid,v_budget.reservation_id,v_budget.lease_id,v_budget.dossier_id,v_budget.capacity_pool_id,v_budget.credential_id,v_budget.provider_type,v_budget.model_code,v_budget.assignment_mode,null::jsonb,case when v_ttl>0 then now()+make_interval(secs=>v_ttl) else null end,v_policy_json,v_quota_json;
exception when others then
  v_error:=sqlerrm;
  v_block_decision:=case
    when v_error ilike '%APPROVAL%' then 'REQUIRE_APPROVAL'
    when v_error ilike '%SCHEDULE%' then 'DEFER_SCHEDULE'
    when v_error ilike '%BUDGET%' or v_error ilike '%QUOTA%' or v_error ilike '%LIMIT%' or v_error ilike '%CEILING%' or v_error ilike '%CONCURRENCY%' then 'BLOCK_QUOTA'
    else 'BLOCK_POLICY' end;
  v_block_status:=case when v_block_decision='DEFER_SCHEDULE' then 'deferred' else 'blocked' end;
  insert into public.ai_provider_governed_requests(
    id,request_fingerprint,module_key,workspace_key,capability,command_code,mandate_id,mission_id,actor_id,trigger_type,schedule_id,
    prompt_version,source_revision,requested_model,decision,status,estimated_requests,estimated_input_tokens,estimated_output_tokens,
    estimated_cost_usd,error_code,error_message,completed_at,metadata
  ) values (
    v_request_id,p_request_fingerprint,p_module_key,coalesce(nullif(p_workspace_key,''),'*'),p_capability,coalesce(nullif(p_command_code,''),p_capability),
    p_mandate_id,p_mission_id,p_actor_id,coalesce(nullif(p_trigger_type,''),'manual'),v_schedule_id,p_prompt_version,p_source_revision,p_requested_model,
    v_block_decision,v_block_status,greatest(1,coalesce(p_estimated_requests,1)),greatest(0,coalesce(p_estimated_input_tokens,0)),
    greatest(0,coalesce(p_estimated_output_tokens,0)),greatest(0,coalesce(p_estimated_cost_usd,0)),left(v_error,160),left(v_error,2000),now(),
    coalesce(p_metadata,'{}'::jsonb)||jsonb_build_object('blockedBy','AI Provider Control','reason',v_error)
  );
  return query select v_block_decision,v_request_id,null::uuid,null::uuid,null::uuid,null::uuid,null::uuid,null::uuid,null::text,null::text,null::text,null::jsonb,null::timestamptz,v_policy_json,jsonb_build_object('reason',v_error);
end;
$$;

-- -----------------------------------------------------------------------------
-- 7. Completion/failure reconciliation. Joined requests receive the same result.
-- -----------------------------------------------------------------------------

create or replace function public.ai_provider_complete_governed_request(
  p_request_id uuid,
  p_result_json jsonb,
  p_result_hash text,
  p_input_tokens bigint,
  p_output_tokens bigint,
  p_latency_ms integer,
  p_http_status integer,
  p_estimated_cost_usd numeric,
  p_cache_ttl_seconds integer default 0,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v record;
  v_cache_id uuid;
  v_expires timestamptz;
  v_joined record;
begin
  select * into v from public.ai_provider_governed_requests where id=p_request_id for update;
  if not found then raise exception 'AI_PROVIDER_GOVERNED_REQUEST_NOT_FOUND'; end if;
  if v.status='completed' then return jsonb_build_object('ok',true,'alreadyCompleted',true,'requestId',v.id); end if;
  if v.decision<>'EXECUTE_NEW' then raise exception 'AI_PROVIDER_REQUEST_NOT_EXECUTABLE:%',v.decision; end if;

  perform public.ai_provider_reconcile_runtime_budget(
    v.reservation_id,v.lease_id,
    greatest(1,coalesce(nullif(p_metadata->>'actualRequestCount','')::integer,1)),
    greatest(0,coalesce(nullif(p_metadata->>'actualGroundedRequestCount','')::integer,0)),
    greatest(0,coalesce(p_input_tokens,0)),greatest(0,coalesce(p_output_tokens,0)),p_latency_ms,coalesce(p_http_status,200),
    'completed',null,greatest(0,coalesce(p_estimated_cost_usd,0)),coalesce(p_metadata,'{}'::jsonb)||jsonb_build_object('governedRequestId',v.id,'decision',v.decision)
  );

  -- Cache authority is fixed by ai_provider_begin_governed_request after applying
  -- the command policy. The caller cannot extend the governed TTL during completion.
  v_expires:=case when v.cache_expires_at is not null and v.cache_expires_at>now() then v.cache_expires_at else null end;
  update public.ai_provider_governed_requests set
    status='completed',actual_input_tokens=greatest(0,coalesce(p_input_tokens,0)),actual_output_tokens=greatest(0,coalesce(p_output_tokens,0)),
    actual_cost_usd=greatest(0,coalesce(p_estimated_cost_usd,0)),result_json=p_result_json,result_hash=p_result_hash,
    cache_expires_at=v_expires,completed_at=now(),metadata=metadata||coalesce(p_metadata,'{}'::jsonb),updated_at=now()
  where id=v.id;

  if v_expires is not null and p_result_json is not null then
    insert into public.ai_provider_structured_result_cache(
      request_fingerprint,module_key,workspace_key,capability,command_code,prompt_version,source_revision,provider_type,model_code,
      result_json,result_hash,validation_status,source_request_id,original_input_tokens,original_output_tokens,original_cost_usd,expires_at,metadata
    ) values (
      v.request_fingerprint,v.module_key,v.workspace_key,v.capability,v.command_code,v.prompt_version,v.source_revision,v.provider_type,v.model_code,
      p_result_json,p_result_hash,'validated',v.id,greatest(0,coalesce(p_input_tokens,0)),greatest(0,coalesce(p_output_tokens,0)),greatest(0,coalesce(p_estimated_cost_usd,0)),v_expires,coalesce(p_metadata,'{}'::jsonb)
    )
    on conflict (request_fingerprint) do update set
      result_json=excluded.result_json,result_hash=excluded.result_hash,validation_status='validated',source_request_id=excluded.source_request_id,
      original_input_tokens=excluded.original_input_tokens,original_output_tokens=excluded.original_output_tokens,original_cost_usd=excluded.original_cost_usd,
      expires_at=excluded.expires_at,invalidated_at=null,invalidation_reason=null,metadata=excluded.metadata,updated_at=now()
    returning id into v_cache_id;
  end if;

  for v_joined in select * from public.ai_provider_governed_requests where source_request_id=v.id and decision='JOIN_IN_FLIGHT' and status='joined' for update
  loop
    update public.ai_provider_governed_requests set
      status='completed',provider_type=v.provider_type,model_code=v.model_code,result_json=p_result_json,result_hash=p_result_hash,
      cache_expires_at=v_expires,completed_at=now(),updated_at=now()
    where id=v_joined.id;
  end loop;

  if v.schedule_id is not null then
    update public.ai_provider_command_schedules set last_completed_at=now(),failure_count=0,updated_at=now() where id=v.schedule_id;
  end if;

  return jsonb_build_object('ok',true,'requestId',v.id,'cacheId',v_cache_id,'cacheExpiresAt',v_expires);
end;
$$;

create or replace function public.ai_provider_fail_governed_request(
  p_request_id uuid,
  p_http_status integer,
  p_error_code text,
  p_error_message text,
  p_latency_ms integer,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare v record;
begin
  select * into v from public.ai_provider_governed_requests where id=p_request_id for update;
  if not found then return jsonb_build_object('ok',false,'reason','REQUEST_NOT_FOUND'); end if;
  if v.reservation_id is not null then
    perform public.ai_provider_fail_runtime_budget(v.reservation_id,v.lease_id,p_http_status,p_error_code,p_latency_ms,coalesce(p_metadata,'{}'::jsonb)||jsonb_build_object('governedRequestId',v.id));
  end if;
  update public.ai_provider_governed_requests set status='failed',error_code=p_error_code,error_message=left(coalesce(p_error_message,''),2000),completed_at=now(),metadata=metadata||coalesce(p_metadata,'{}'::jsonb),updated_at=now() where id=v.id;
  update public.ai_provider_governed_requests set status='failed',error_code='SOURCE_REQUEST_FAILED',error_message=left(coalesce(p_error_message,''),2000),completed_at=now(),updated_at=now() where source_request_id=v.id and status='joined';
  if v.schedule_id is not null then
    update public.ai_provider_command_schedules set
      failure_count=failure_count+1,
      status=case when failure_count+1>=greatest(1,coalesce(nullif(failure_policy->>'suspendAfterFailures','')::integer,3)) then 'suspended' else status end,
      updated_at=now()
    where id=v.schedule_id;
  end if;
  return jsonb_build_object('ok',true,'requestId',v.id);
end;
$$;

create or replace function public.ai_provider_invalidate_structured_cache(
  p_request_fingerprint text,
  p_reason text,
  p_actor_id text
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare v_count integer;
begin
  update public.ai_provider_structured_result_cache set validation_status='invalidated',invalidated_at=now(),invalidation_reason=left(coalesce(p_reason,'Manual invalidation'),500),updated_at=now()
  where request_fingerprint=p_request_fingerprint and invalidated_at is null;
  get diagnostics v_count=row_count;
  insert into public.ai_provider_audit(action_key,entity_type,entity_id,actor_id,actor_name,payload)
  values('invalidate_cache','structured_result_cache',null,p_actor_id,p_actor_id,jsonb_build_object('fingerprint',p_request_fingerprint,'reason',p_reason,'rows',v_count));
  return v_count;
end;
$$;


-- -----------------------------------------------------------------------------
-- 8. Version rollback extension: preserve Phase 4 rollback, then restore the
--    command policies and schedules captured by Phase 5 configuration versions.
-- -----------------------------------------------------------------------------

create or replace function public.ai_provider_restore_sovereign_configuration(
  p_version_id uuid,
  p_actor_id text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_snapshot jsonb;
  v_item jsonb;
  v_base jsonb;
begin
  select snapshot into v_snapshot from public.ai_provider_config_versions where id=p_version_id;
  if not found then raise exception 'CONFIG_VERSION_NOT_FOUND'; end if;

  v_base:=public.ai_provider_restore_configuration(p_version_id,p_actor_id);

  update public.ai_provider_command_policies set enabled=false,updated_by=p_actor_id,updated_at=now();
  update public.ai_provider_command_schedules set enabled=false,status='paused',updated_by=p_actor_id,updated_at=now();

  for v_item in select value from jsonb_array_elements(coalesce(v_snapshot->'quotas','[]'::jsonb)) loop
    update public.ai_provider_quota_policies set
      max_requests_per_week=nullif(v_item->>'max_requests_per_week','')::integer,
      max_input_tokens_per_week=nullif(v_item->>'max_input_tokens_per_week','')::bigint,
      max_output_tokens_per_week=nullif(v_item->>'max_output_tokens_per_week','')::bigint,
      max_total_tokens_per_week=nullif(v_item->>'max_total_tokens_per_week','')::bigint,
      max_estimated_cost_usd_per_day=nullif(v_item->>'max_estimated_cost_usd_per_day','')::numeric,
      max_estimated_cost_usd_per_week=nullif(v_item->>'max_estimated_cost_usd_per_week','')::numeric,
      max_estimated_cost_usd_per_month=nullif(v_item->>'max_estimated_cost_usd_per_month','')::numeric,
      updated_by=p_actor_id,updated_at=now()
    where scope_type=v_item->>'scope_type' and scope_key=v_item->>'scope_key';
  end loop;

  for v_item in select value from jsonb_array_elements(coalesce(v_snapshot->'commandPolicies','[]'::jsonb)) loop
    insert into public.ai_provider_command_policies(
      module_key,workspace_key,command_code,ai_mode,manual_allowed,scheduled_allowed,
      minimum_interval_seconds,max_runs_per_day,max_runs_per_week,max_runs_per_month,
      max_input_tokens_per_run,max_output_tokens_per_run,max_cost_usd_per_run,max_cost_usd_per_day,max_cost_usd_per_week,
      max_retries,cache_mode,cache_ttl_seconds,duplicate_window_seconds,force_refresh_allowed,approval_class,
      allowed_provider_types,allowed_models,allowed_trigger_types,execution_window,cooldown_after_failure_seconds,
      consecutive_failure_suspend_threshold,enabled,metadata,updated_by,updated_at
    ) values (
      v_item->>'module_key',coalesce(v_item->>'workspace_key','*'),v_item->>'command_code',coalesce(v_item->>'ai_mode','ai_required'),
      coalesce((v_item->>'manual_allowed')::boolean,true),coalesce((v_item->>'scheduled_allowed')::boolean,false),
      coalesce((v_item->>'minimum_interval_seconds')::integer,0),nullif(v_item->>'max_runs_per_day','')::integer,
      nullif(v_item->>'max_runs_per_week','')::integer,nullif(v_item->>'max_runs_per_month','')::integer,
      nullif(v_item->>'max_input_tokens_per_run','')::bigint,nullif(v_item->>'max_output_tokens_per_run','')::bigint,
      nullif(v_item->>'max_cost_usd_per_run','')::numeric,nullif(v_item->>'max_cost_usd_per_day','')::numeric,
      nullif(v_item->>'max_cost_usd_per_week','')::numeric,coalesce((v_item->>'max_retries')::integer,0),
      coalesce(v_item->>'cache_mode','until_source_changes'),coalesce((v_item->>'cache_ttl_seconds')::integer,21600),
      coalesce((v_item->>'duplicate_window_seconds')::integer,900),coalesce((v_item->>'force_refresh_allowed')::boolean,false),
      coalesce(v_item->>'approval_class','none'),array(select jsonb_array_elements_text(coalesce(v_item->'allowed_provider_types','[]'::jsonb))),
      array(select jsonb_array_elements_text(coalesce(v_item->'allowed_models','[]'::jsonb))),
      array(select jsonb_array_elements_text(coalesce(v_item->'allowed_trigger_types','["manual"]'::jsonb))),
      coalesce(v_item->'execution_window','{}'::jsonb),coalesce((v_item->>'cooldown_after_failure_seconds')::integer,300),
      coalesce((v_item->>'consecutive_failure_suspend_threshold')::integer,3),coalesce((v_item->>'enabled')::boolean,false),
      coalesce(v_item->'metadata','{}'::jsonb),p_actor_id,now()
    )
    on conflict(module_key,workspace_key,command_code) do update set
      ai_mode=excluded.ai_mode,manual_allowed=excluded.manual_allowed,scheduled_allowed=excluded.scheduled_allowed,
      minimum_interval_seconds=excluded.minimum_interval_seconds,max_runs_per_day=excluded.max_runs_per_day,
      max_runs_per_week=excluded.max_runs_per_week,max_runs_per_month=excluded.max_runs_per_month,
      max_input_tokens_per_run=excluded.max_input_tokens_per_run,max_output_tokens_per_run=excluded.max_output_tokens_per_run,
      max_cost_usd_per_run=excluded.max_cost_usd_per_run,max_cost_usd_per_day=excluded.max_cost_usd_per_day,
      max_cost_usd_per_week=excluded.max_cost_usd_per_week,max_retries=excluded.max_retries,cache_mode=excluded.cache_mode,
      cache_ttl_seconds=excluded.cache_ttl_seconds,duplicate_window_seconds=excluded.duplicate_window_seconds,
      force_refresh_allowed=excluded.force_refresh_allowed,approval_class=excluded.approval_class,
      allowed_provider_types=excluded.allowed_provider_types,allowed_models=excluded.allowed_models,
      allowed_trigger_types=excluded.allowed_trigger_types,execution_window=excluded.execution_window,
      cooldown_after_failure_seconds=excluded.cooldown_after_failure_seconds,
      consecutive_failure_suspend_threshold=excluded.consecutive_failure_suspend_threshold,enabled=excluded.enabled,
      metadata=excluded.metadata,updated_by=p_actor_id,updated_at=now();
  end loop;

  for v_item in select value from jsonb_array_elements(coalesce(v_snapshot->'schedules','[]'::jsonb)) loop
    insert into public.ai_provider_command_schedules(
      schedule_key,module_key,workspace_key,command_code,schedule_expression,schedule_format,timezone,enabled,status,priority,
      freshness_seconds,duplicate_window_seconds,max_runs_per_day,max_runs_per_week,estimated_input_tokens,
      estimated_output_tokens,estimated_cost_usd,approval_required,provider_policy,dependency_policy,failure_policy,
      next_run_at,metadata,updated_by,updated_at
    ) values (
      v_item->>'schedule_key',v_item->>'module_key',coalesce(v_item->>'workspace_key','*'),v_item->>'command_code',
      v_item->>'schedule_expression',coalesce(v_item->>'schedule_format','cron'),coalesce(v_item->>'timezone','Africa/Casablanca'),
      coalesce((v_item->>'enabled')::boolean,false),coalesce(v_item->>'status','paused'),coalesce((v_item->>'priority')::integer,100),
      coalesce((v_item->>'freshness_seconds')::integer,21600),coalesce((v_item->>'duplicate_window_seconds')::integer,900),
      nullif(v_item->>'max_runs_per_day','')::integer,nullif(v_item->>'max_runs_per_week','')::integer,
      coalesce((v_item->>'estimated_input_tokens')::bigint,0),coalesce((v_item->>'estimated_output_tokens')::bigint,0),
      coalesce((v_item->>'estimated_cost_usd')::numeric,0),coalesce((v_item->>'approval_required')::boolean,false),
      coalesce(v_item->'provider_policy','{}'::jsonb),coalesce(v_item->'dependency_policy','{}'::jsonb),
      coalesce(v_item->'failure_policy','{}'::jsonb),nullif(v_item->>'next_run_at','')::timestamptz,
      coalesce(v_item->'metadata','{}'::jsonb),p_actor_id,now()
    )
    on conflict(schedule_key) do update set
      module_key=excluded.module_key,workspace_key=excluded.workspace_key,command_code=excluded.command_code,
      schedule_expression=excluded.schedule_expression,schedule_format=excluded.schedule_format,timezone=excluded.timezone,
      enabled=excluded.enabled,status=excluded.status,priority=excluded.priority,freshness_seconds=excluded.freshness_seconds,
      duplicate_window_seconds=excluded.duplicate_window_seconds,max_runs_per_day=excluded.max_runs_per_day,
      max_runs_per_week=excluded.max_runs_per_week,estimated_input_tokens=excluded.estimated_input_tokens,
      estimated_output_tokens=excluded.estimated_output_tokens,estimated_cost_usd=excluded.estimated_cost_usd,
      approval_required=excluded.approval_required,provider_policy=excluded.provider_policy,
      dependency_policy=excluded.dependency_policy,failure_policy=excluded.failure_policy,next_run_at=excluded.next_run_at,
      metadata=excluded.metadata,updated_by=p_actor_id,updated_at=now();
  end loop;

  return coalesce(v_base,'{}'::jsonb)||jsonb_build_object('phase5Restored',true,'sourceVersionId',p_version_id);
end;
$$;

-- -----------------------------------------------------------------------------
-- 9. RLS and service-role-only runtime authority.
-- -----------------------------------------------------------------------------

alter table public.ai_provider_command_policies enable row level security;
alter table public.ai_provider_command_schedules enable row level security;
alter table public.ai_provider_governed_requests enable row level security;
alter table public.ai_provider_structured_result_cache enable row level security;
alter table public.ai_provider_reuse_events enable row level security;
alter table public.ai_provider_policy_overrides enable row level security;

revoke all on table public.ai_provider_command_policies from public,anon,authenticated;
revoke all on table public.ai_provider_command_schedules from public,anon,authenticated;
revoke all on table public.ai_provider_governed_requests from public,anon,authenticated;
revoke all on table public.ai_provider_structured_result_cache from public,anon,authenticated;
revoke all on table public.ai_provider_reuse_events from public,anon,authenticated;
revoke all on table public.ai_provider_policy_overrides from public,anon,authenticated;

grant all on table public.ai_provider_command_policies to service_role;
grant all on table public.ai_provider_command_schedules to service_role;
grant all on table public.ai_provider_governed_requests to service_role;
grant all on table public.ai_provider_structured_result_cache to service_role;
grant all on table public.ai_provider_reuse_events to service_role;
grant all on table public.ai_provider_policy_overrides to service_role;

revoke all on function public.ai_provider_preflight_governed_request(text,text,text,text,text,text,text,text,text,integer,bigint,bigint,numeric,boolean) from public,anon,authenticated;
revoke all on function public.ai_provider_begin_governed_request(text,text,text,text,text,text,text,text,text,text,text,text,text,integer,bigint,bigint,numeric,boolean,boolean,boolean,integer,jsonb) from public,anon,authenticated;
revoke all on function public.ai_provider_complete_governed_request(uuid,jsonb,text,bigint,bigint,integer,integer,numeric,integer,jsonb) from public,anon,authenticated;
revoke all on function public.ai_provider_fail_governed_request(uuid,integer,text,text,integer,jsonb) from public,anon,authenticated;
revoke all on function public.ai_provider_invalidate_structured_cache(text,text,text) from public,anon,authenticated;
revoke all on function public.ai_provider_restore_sovereign_configuration(uuid,text) from public,anon,authenticated;

grant execute on function public.ai_provider_preflight_governed_request(text,text,text,text,text,text,text,text,text,integer,bigint,bigint,numeric,boolean) to service_role;
grant execute on function public.ai_provider_begin_governed_request(text,text,text,text,text,text,text,text,text,text,text,text,text,integer,bigint,bigint,numeric,boolean,boolean,boolean,integer,jsonb) to service_role;
grant execute on function public.ai_provider_complete_governed_request(uuid,jsonb,text,bigint,bigint,integer,integer,numeric,integer,jsonb) to service_role;
grant execute on function public.ai_provider_fail_governed_request(uuid,integer,text,text,integer,jsonb) to service_role;
grant execute on function public.ai_provider_invalidate_structured_cache(text,text,text) to service_role;
grant execute on function public.ai_provider_restore_sovereign_configuration(uuid,text) to service_role;

comment on table public.ai_provider_governed_requests is 'Central identity and lifecycle for every AngelCare AI request; supports deduplication, in-flight joins and cost attribution.';
comment on table public.ai_provider_structured_result_cache is 'Governed structured-result reuse cache with avoided-token and avoided-cost accounting.';
comment on table public.ai_provider_command_policies is 'Per-command AI operating envelope for manual/scheduled execution, budgets, models, retries and cache policy.';
comment on function public.ai_provider_begin_governed_request is 'Sole Phase 5 gateway entry: deduplicate, reuse, enforce frequency/weekly/cost policy, route and reserve.';

commit;
