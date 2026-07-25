-- ANGELCARE Mega ZIP 14 R2
-- WhatsApp Admin Governance Control Plane
-- Idempotent, phased and deadlock-resistant.
-- No Desktop runtime, WhatsApp cookie, session secret or message content is stored.

set statement_timeout = '10min';
set lock_timeout = '8s';

-- ---------------------------------------------------------------------------
-- PHASE 1 — Existing-table extensions. Each statement autocommits in Supabase
-- SQL Editor, preventing one long transaction from holding unrelated locks.
-- ---------------------------------------------------------------------------

alter table public.desktop_station_policies
  add column if not exists maximum_ac_plus_tabs integer not null default 6 check (maximum_ac_plus_tabs between 1 and 48),
  add column if not exists ac_plus_enabled boolean not null default true,
  add column if not exists ac_plus_allowed_modes text[] not null default array['standard','focus'],
  add column if not exists split_enabled boolean not null default true,
  add column if not exists split_allowed_modes text[] not null default array['standard','focus'],
  add column if not exists split_modes integer[] not null default array[2,3,4];

alter table public.whatsapp_desktop_devices
  add column if not exists reported_state jsonb not null default '{}'::jsonb,
  add column if not exists synchronization_status text not null default 'unknown'
    check (synchronization_status in ('synchronized','pending','drift','offline','blocked','unknown','error')),
  add column if not exists governance_contract_version text,
  add column if not exists desktop_build_number integer,
  add column if not exists last_configuration_pull_at timestamptz,
  add column if not exists last_command_poll_at timestamptz,
  add column if not exists last_authorization_refresh_at timestamptz,
  add column if not exists last_whatsapp_lease_renewal_at timestamptz,
  add column if not exists last_diagnostics_at timestamptz,
  add column if not exists client_clock_at timestamptz,
  add column if not exists clock_drift_seconds integer;

alter table public.whatsapp_desktop_commands
  add column if not exists correlation_id uuid,
  add column if not exists priority text not null default 'normal' check (priority in ('low','normal','high','critical')),
  add column if not exists retry_count integer not null default 0 check (retry_count >= 0),
  add column if not exists max_retries integer not null default 3 check (max_retries between 0 and 20),
  add column if not exists last_retry_at timestamptz,
  add column if not exists acknowledgement_deadline timestamptz,
  add column if not exists cancelled_by uuid,
  add column if not exists cancelled_at timestamptz,
  add column if not exists cancellation_reason text;

alter table public.desktop_station_commands
  add column if not exists correlation_id uuid,
  add column if not exists priority text not null default 'normal' check (priority in ('low','normal','high','critical')),
  add column if not exists retry_count integer not null default 0 check (retry_count >= 0),
  add column if not exists max_retries integer not null default 3 check (max_retries between 0 and 20),
  add column if not exists last_retry_at timestamptz,
  add column if not exists acknowledgement_deadline timestamptz,
  add column if not exists cancelled_by uuid,
  add column if not exists cancelled_at timestamptz,
  add column if not exists cancellation_reason text;

-- ---------------------------------------------------------------------------
-- PHASE 2 — New governance evidence tables.
-- ---------------------------------------------------------------------------

create table if not exists public.whatsapp_desktop_device_governance_state (
  id uuid primary key default gen_random_uuid(),
  device_id uuid not null unique references public.whatsapp_desktop_devices(id) on delete cascade,
  desired_state jsonb not null default '{}'::jsonb,
  desired_revision bigint not null default 1 check (desired_revision > 0),
  desired_policy_id uuid references public.desktop_station_policies(id) on delete set null,
  desired_policy_version bigint not null default 0,
  desired_mode text not null default 'standard' check (desired_mode in ('standard','focus','locked')),
  desired_whatsapp_enabled boolean not null default true,
  desired_ac_plus_enabled boolean not null default true,
  desired_split_enabled boolean not null default true,
  desired_maximum_tabs integer not null default 8 check (desired_maximum_tabs between 2 and 50),
  last_command_correlation_id uuid,
  reason text,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.whatsapp_desktop_sync_runs (
  id uuid primary key default gen_random_uuid(),
  correlation_id uuid not null default gen_random_uuid(),
  device_id uuid not null references public.whatsapp_desktop_devices(id) on delete cascade,
  actor_user_id uuid,
  trigger_type text not null default 'manual' check (trigger_type in ('manual','policy_change','authorization','diagnostic','automatic')),
  desired_snapshot jsonb not null default '{}'::jsonb,
  reported_snapshot jsonb not null default '{}'::jsonb,
  assessment_snapshot jsonb not null default '{}'::jsonb,
  whatsapp_command_ids jsonb not null default '[]'::jsonb,
  station_command_ids jsonb not null default '[]'::jsonb,
  status text not null default 'queued' check (status in ('queued','delivered','acknowledged','completed','partial','failed','cancelled')),
  reason text,
  request_ip inet,
  user_agent text,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.whatsapp_desktop_governance_alerts (
  id uuid primary key default gen_random_uuid(),
  device_id uuid references public.whatsapp_desktop_devices(id) on delete cascade,
  workspace_id uuid references public.whatsapp_desktop_workspaces(id) on delete set null,
  alert_type text not null,
  severity text not null default 'attention' check (severity in ('informational','attention','high','critical')),
  status text not null default 'open' check (status in ('open','acknowledged','resolved','dismissed')),
  title text not null,
  description text,
  evidence jsonb not null default '{}'::jsonb,
  dedup_key text not null,
  occurrences integer not null default 1 check (occurrences > 0),
  assigned_to uuid,
  acknowledged_by uuid,
  acknowledged_at timestamptz,
  resolved_by uuid,
  resolved_at timestamptz,
  resolution_note text,
  first_detected_at timestamptz not null default now(),
  last_detected_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (dedup_key)
);

-- ---------------------------------------------------------------------------
-- PHASE 3 — Indexes and update triggers.
-- ---------------------------------------------------------------------------

create index if not exists whatsapp_desktop_governance_state_device_idx
  on public.whatsapp_desktop_device_governance_state(device_id, updated_at desc);
create index if not exists whatsapp_desktop_sync_runs_device_idx
  on public.whatsapp_desktop_sync_runs(device_id, started_at desc);
create index if not exists whatsapp_desktop_alerts_queue_idx
  on public.whatsapp_desktop_governance_alerts(status, severity, last_detected_at desc);
create index if not exists whatsapp_desktop_alerts_device_idx
  on public.whatsapp_desktop_governance_alerts(device_id, status, last_detected_at desc);
create index if not exists whatsapp_desktop_commands_correlation_idx
  on public.whatsapp_desktop_commands(correlation_id, issued_at desc);
create index if not exists desktop_station_commands_correlation_idx
  on public.desktop_station_commands(correlation_id, issued_at desc);

create or replace trigger whatsapp_desktop_governance_state_touch
before update on public.whatsapp_desktop_device_governance_state
for each row execute function public.whatsapp_desktop_touch_updated_at();

create or replace trigger whatsapp_desktop_governance_alerts_touch
before update on public.whatsapp_desktop_governance_alerts
for each row execute function public.whatsapp_desktop_touch_updated_at();

-- ---------------------------------------------------------------------------
-- PHASE 4 — RLS and service-role policies.
-- Each table is handled in its own retrying subtransaction. A transient lock or
-- deadlock is released before retry, rather than aborting the whole migration.
-- ---------------------------------------------------------------------------

do $mz14$
declare
  attempt integer;
begin
  for attempt in 1..6 loop
    begin
      execute 'alter table public.whatsapp_desktop_device_governance_state enable row level security';
      if not exists (
        select 1 from pg_policies
        where schemaname = 'public'
          and tablename = 'whatsapp_desktop_device_governance_state'
          and policyname = 'whatsapp_desktop_governance_state_service_role_all'
      ) then
        execute 'create policy whatsapp_desktop_governance_state_service_role_all on public.whatsapp_desktop_device_governance_state for all to service_role using (true) with check (true)';
      end if;
      exit;
    exception
      when deadlock_detected or lock_not_available or serialization_failure then
        if attempt = 6 then raise; end if;
        perform pg_sleep(attempt * 0.75);
    end;
  end loop;
end
$mz14$;

do $mz14$
declare
  attempt integer;
begin
  for attempt in 1..6 loop
    begin
      execute 'alter table public.whatsapp_desktop_sync_runs enable row level security';
      if not exists (
        select 1 from pg_policies
        where schemaname = 'public'
          and tablename = 'whatsapp_desktop_sync_runs'
          and policyname = 'whatsapp_desktop_sync_runs_service_role_all'
      ) then
        execute 'create policy whatsapp_desktop_sync_runs_service_role_all on public.whatsapp_desktop_sync_runs for all to service_role using (true) with check (true)';
      end if;
      exit;
    exception
      when deadlock_detected or lock_not_available or serialization_failure then
        if attempt = 6 then raise; end if;
        perform pg_sleep(attempt * 0.75);
    end;
  end loop;
end
$mz14$;

do $mz14$
declare
  attempt integer;
begin
  for attempt in 1..6 loop
    begin
      execute 'alter table public.whatsapp_desktop_governance_alerts enable row level security';
      if not exists (
        select 1 from pg_policies
        where schemaname = 'public'
          and tablename = 'whatsapp_desktop_governance_alerts'
          and policyname = 'whatsapp_desktop_governance_alerts_service_role_all'
      ) then
        execute 'create policy whatsapp_desktop_governance_alerts_service_role_all on public.whatsapp_desktop_governance_alerts for all to service_role using (true) with check (true)';
      end if;
      exit;
    exception
      when deadlock_detected or lock_not_available or serialization_failure then
        if attempt = 6 then raise; end if;
        perform pg_sleep(attempt * 0.75);
    end;
  end loop;
end
$mz14$;

-- ---------------------------------------------------------------------------
-- PHASE 5 — Documentation and deterministic readiness proof.
-- ---------------------------------------------------------------------------

comment on table public.whatsapp_desktop_device_governance_state is
  'Desired governance state for ANGELCARE Desktop endpoints. Contains no WhatsApp cookies or message content.';
comment on table public.whatsapp_desktop_sync_runs is
  'Administrative synchronization evidence linking desired state, reported state and remote command execution.';
comment on table public.whatsapp_desktop_governance_alerts is
  'Actionable fleet intervention queue for lifecycle, policy, command, version and connectivity conditions.';

select
  to_regclass('public.whatsapp_desktop_device_governance_state') is not null as governance_state_ready,
  to_regclass('public.whatsapp_desktop_sync_runs') is not null as sync_runs_ready,
  to_regclass('public.whatsapp_desktop_governance_alerts') is not null as governance_alerts_ready,
  exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'whatsapp_desktop_devices'
      and column_name = 'reported_state'
  ) as reported_state_ready,
  exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'whatsapp_desktop_device_governance_state'
      and policyname = 'whatsapp_desktop_governance_state_service_role_all'
  ) as governance_policy_ready,
  'MZ14_R2_SUPABASE_MIGRATION_APPLIED'::text as release_marker;
