begin;
create extension if not exists pgcrypto;

alter table public.browser_extension_devices
  add column if not exists desired_release_channel text,
  add column if not exists health_status text not null default 'unknown',
  add column if not exists last_health_at timestamptz,
  add column if not exists last_error_fingerprint text,
  add column if not exists minimum_compatible_version text;

create table if not exists public.browser_extension_release_versions (
  id uuid primary key default gen_random_uuid(), version text not null unique,
  channel_key text not null, status text not null default 'candidate',
  manifest_version integer not null default 3, extension_identity text,
  source_sha256 text, package_sha256 text, sbom_sha256 text,
  minimum_gateway_version text not null, minimum_schema_version text not null,
  maximum_rollout_percent integer not null default 0 check(maximum_rollout_percent between 0 and 100),
  known_bad boolean not null default false, known_bad_reason text,
  release_notes text, approved_by uuid, approved_at timestamptz,
  promoted_by uuid, promoted_at timestamptz, rolled_back_by uuid, rolled_back_at timestamptz,
  created_by uuid, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists browser_ext_release_versions_channel_idx on public.browser_extension_release_versions(channel_key,status,created_at desc);

create table if not exists public.browser_extension_device_release_assignments (
  id uuid primary key default gen_random_uuid(), device_id uuid not null references public.browser_extension_devices(id) on delete cascade,
  channel_key text not null, assigned_version text, rollout_bucket integer not null default 0 check(rollout_bucket between 0 and 99),
  assignment_reason text, assigned_by uuid, assigned_at timestamptz not null default now(),
  revoked_at timestamptz, revoked_by uuid, unique(device_id)
);
create index if not exists browser_ext_device_release_channel_idx on public.browser_extension_device_release_assignments(channel_key,assigned_version);

create table if not exists public.browser_extension_runtime_health_events (
  id uuid primary key default gen_random_uuid(), device_id uuid references public.browser_extension_devices(id) on delete cascade,
  user_id uuid, extension_version text not null, release_channel text,
  component text not null, status text not null, event_type text not null,
  latency_ms integer, correlation_id text, error_fingerprint text,
  metrics jsonb not null default '{}'::jsonb, metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(), received_at timestamptz not null default now()
);
create index if not exists browser_ext_health_component_idx on public.browser_extension_runtime_health_events(component,status,occurred_at desc);
create index if not exists browser_ext_health_device_idx on public.browser_extension_runtime_health_events(device_id,occurred_at desc);

create table if not exists public.browser_extension_performance_samples (
  id uuid primary key default gen_random_uuid(), device_id uuid references public.browser_extension_devices(id) on delete cascade,
  extension_version text not null, metric_key text not null, duration_ms numeric(12,3) not null,
  sample_context text, cache_state text, success boolean not null default true,
  metadata jsonb not null default '{}'::jsonb, measured_at timestamptz not null default now()
);
create index if not exists browser_ext_performance_metric_idx on public.browser_extension_performance_samples(metric_key,extension_version,measured_at desc);

create table if not exists public.browser_extension_adapter_health (
  id uuid primary key default gen_random_uuid(), device_id uuid references public.browser_extension_devices(id) on delete cascade,
  adapter_key text not null, selector_version text not null default 'v1', status text not null default 'unknown',
  last_success_at timestamptz, last_failure_at timestamptz, consecutive_failures integer not null default 0,
  last_error_fingerprint text, disabled boolean not null default false, disabled_reason text,
  maintenance_notes text, metadata jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(), unique(device_id,adapter_key)
);
create index if not exists browser_ext_adapter_health_status_idx on public.browser_extension_adapter_health(adapter_key,status,updated_at desc);

create table if not exists public.browser_extension_error_fingerprints (
  id uuid primary key default gen_random_uuid(), fingerprint text not null unique,
  component text not null, error_code text, normalized_message text not null,
  severity text not null default 'warning', first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(), occurrence_count bigint not null default 1,
  affected_versions jsonb not null default '[]'::jsonb, affected_devices integer not null default 0,
  status text not null default 'open', resolution text, resolved_by uuid, resolved_at timestamptz,
  metadata jsonb not null default '{}'::jsonb
);
create index if not exists browser_ext_error_fingerprint_status_idx on public.browser_extension_error_fingerprints(status,severity,last_seen_at desc);

create table if not exists public.browser_extension_feature_flags (
  id uuid primary key default gen_random_uuid(), flag_key text not null unique,
  scope_type text not null default 'global', scope_reference text not null default '*',
  enabled boolean not null default false, rollout_percent integer not null default 100 check(rollout_percent between 0 and 100),
  minimum_version text, maximum_version text, conditions jsonb not null default '{}'::jsonb,
  reason text, changed_by uuid, changed_at timestamptz not null default now(),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.browser_extension_production_kill_switches (
  id uuid primary key default gen_random_uuid(), switch_key text not null,
  scope_type text not null, scope_reference text not null, active boolean not null default true,
  severity text not null default 'critical', reason text not null, expires_at timestamptz,
  activated_by uuid not null, activated_at timestamptz not null default now(),
  deactivated_by uuid, deactivated_at timestamptz, deactivation_reason text,
  metadata jsonb not null default '{}'::jsonb, unique(switch_key,scope_type,scope_reference,active)
);
create index if not exists browser_ext_prod_kill_active_idx on public.browser_extension_production_kill_switches(active,scope_type,scope_reference);

create table if not exists public.browser_extension_incidents (
  id uuid primary key default gen_random_uuid(), incident_number bigint generated always as identity unique,
  title text not null, category text not null, severity text not null,
  status text not null default 'detected', impact_summary text not null,
  affected_components jsonb not null default '[]'::jsonb, affected_versions jsonb not null default '[]'::jsonb,
  incident_commander_id uuid, detected_at timestamptz not null default now(), contained_at timestamptz,
  recovered_at timestamptz, closed_at timestamptz, root_cause text, corrective_actions jsonb not null default '[]'::jsonb,
  rollback_version text, evidence jsonb not null default '{}'::jsonb,
  created_by uuid not null, updated_by uuid, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists browser_ext_incident_status_idx on public.browser_extension_incidents(status,severity,detected_at desc);

create table if not exists public.browser_extension_incident_events (
  id uuid primary key default gen_random_uuid(), incident_id uuid not null references public.browser_extension_incidents(id) on delete cascade,
  event_type text not null, message text not null, previous_status text, next_status text,
  actor_id uuid, evidence jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);
create index if not exists browser_ext_incident_event_idx on public.browser_extension_incident_events(incident_id,created_at);

create table if not exists public.browser_extension_deployment_approvals (
  id uuid primary key default gen_random_uuid(), release_version_id uuid references public.browser_extension_release_versions(id) on delete cascade,
  environment text not null, gate_key text not null, status text not null default 'pending',
  evidence jsonb not null default '{}'::jsonb, requested_by uuid not null, requested_at timestamptz not null default now(),
  decided_by uuid, decided_at timestamptz, decision_reason text,
  unique(release_version_id,environment,gate_key)
);

create table if not exists public.browser_extension_compatibility_matrix (
  id uuid primary key default gen_random_uuid(), extension_version text not null,
  chrome_min_major integer not null, chrome_max_tested_major integer,
  gateway_min_version text not null, schema_min_version text not null,
  operating_system text not null, status text not null default 'supported',
  notes text, tested_by uuid, tested_at timestamptz,
  unique(extension_version,operating_system,chrome_min_major)
);

create table if not exists public.browser_extension_migration_registry (
  id uuid primary key default gen_random_uuid(), migration_key text not null unique,
  schema_version text not null, checksum_sha256 text, status text not null default 'registered',
  applied_at timestamptz, applied_by uuid, rollback_verified boolean not null default false,
  preflight_result jsonb not null default '{}'::jsonb, postflight_result jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.browser_extension_privacy_retention_policies (
  id uuid primary key default gen_random_uuid(), data_class text not null unique,
  retention_days integer not null, redact_fields jsonb not null default '[]'::jsonb,
  purpose text not null, deletion_behavior text not null, export_behavior text not null,
  active boolean not null default true, approved_by uuid, approved_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

insert into public.browser_extension_release_channels(channel_key,version,minimum_version,mandatory,release_notes,enabled)
values
 ('development','0.7.0','0.7.0',false,'Mega ZIP 7 development channel',true),
 ('internal','0.7.0','0.7.0',false,'Mega ZIP 7 internal validation channel',true),
 ('pilot','0.7.0','0.6.0',false,'Mega ZIP 7 restricted production pilot',true),
 ('stable','0.6.0','0.6.0',false,'Last accepted stable before Mega ZIP 7 live promotion',true),
 ('rollback','0.6.0','0.6.0',false,'Emergency rollback to last known good release',true)
on conflict(channel_key) do update set version=excluded.version, minimum_version=excluded.minimum_version, mandatory=excluded.mandatory, release_notes=excluded.release_notes, enabled=excluded.enabled, updated_at=now();

insert into public.browser_extension_release_versions(version,channel_key,status,manifest_version,minimum_gateway_version,minimum_schema_version,maximum_rollout_percent,release_notes)
values ('0.7.0','pilot','candidate',3,'0.7.0','mega7',10,'Mega ZIP 7 Production Hardening, Security, Deployment and Final B2B Release')
on conflict(version) do update set channel_key=excluded.channel_key,status=excluded.status,minimum_gateway_version=excluded.minimum_gateway_version,minimum_schema_version=excluded.minimum_schema_version,maximum_rollout_percent=excluded.maximum_rollout_percent,release_notes=excluded.release_notes,updated_at=now();

insert into public.browser_extension_feature_flags(flag_key,scope_type,scope_reference,enabled,rollout_percent,minimum_version,reason)
values
 ('browser_os.production_observability','global','*',true,100,'0.7.0','Mega ZIP 7 production health'),
 ('browser_os.adapter_health','global','*',true,100,'0.7.0','Adapter selector monitoring'),
 ('browser_os.controlled_updates','global','*',true,100,'0.7.0','Private release governance'),
 ('browser_os.offline_recovery','global','*',true,100,'0.7.0','Offline and retry resilience'),
 ('browser_os.stable_promotion','global','*',false,0,'1.0.0','Enabled only after live acceptance')
on conflict(flag_key) do update set enabled=excluded.enabled,rollout_percent=excluded.rollout_percent,minimum_version=excluded.minimum_version,reason=excluded.reason,updated_at=now();

insert into public.browser_extension_compatibility_matrix(extension_version,chrome_min_major,chrome_max_tested_major,gateway_min_version,schema_min_version,operating_system,status,notes)
values
 ('0.7.0',114,150,'0.7.0','mega7','macOS','supported','Test current stable and previous major before stable promotion'),
 ('0.7.0',114,150,'0.7.0','mega7','Windows','supported','Managed Chrome policy supported')
on conflict(extension_version,operating_system,chrome_min_major) do update set chrome_max_tested_major=excluded.chrome_max_tested_major,status=excluded.status,notes=excluded.notes;

insert into public.browser_extension_privacy_retention_policies(data_class,retention_days,redact_fields,purpose,deletion_behavior,export_behavior)
values
 ('technical_health',90,'["authorization","accessToken","refreshToken","selectedText","messageBody"]'::jsonb,'Runtime health and incident investigation','Delete after retention window','Aggregated operational export only'),
 ('error_fingerprint',180,'["rawPayload","pageContent"]'::jsonb,'Reliability and defect remediation','Retain normalized fingerprint only','Internal security export'),
 ('device_activity',365,'["last_ip"]'::jsonb,'Device governance and revocation','Anonymize IP after 30 days','Administrator export')
on conflict(data_class) do update set retention_days=excluded.retention_days,redact_fields=excluded.redact_fields,purpose=excluded.purpose,deletion_behavior=excluded.deletion_behavior,export_behavior=excluded.export_behavior,updated_at=now();

alter table public.browser_extension_release_versions enable row level security;
alter table public.browser_extension_device_release_assignments enable row level security;
alter table public.browser_extension_runtime_health_events enable row level security;
alter table public.browser_extension_performance_samples enable row level security;
alter table public.browser_extension_adapter_health enable row level security;
alter table public.browser_extension_error_fingerprints enable row level security;
alter table public.browser_extension_feature_flags enable row level security;
alter table public.browser_extension_production_kill_switches enable row level security;
alter table public.browser_extension_incidents enable row level security;
alter table public.browser_extension_incident_events enable row level security;
alter table public.browser_extension_deployment_approvals enable row level security;
alter table public.browser_extension_compatibility_matrix enable row level security;
alter table public.browser_extension_migration_registry enable row level security;
alter table public.browser_extension_privacy_retention_policies enable row level security;

commit;
