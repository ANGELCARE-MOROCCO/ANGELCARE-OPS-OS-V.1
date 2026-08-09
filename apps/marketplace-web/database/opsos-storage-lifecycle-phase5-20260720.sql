begin;

create table if not exists public.opsos_storage_lifecycle_policies (
  id uuid primary key,
  name text not null,
  enabled boolean not null default true,
  cadence_minutes integer not null default 60 check (cadence_minutes between 15 and 10080),
  actions jsonb not null default '["inventory","forecast","provider_reconcile","dedup_scan","retention_dry_run","cleanup_dry_run"]'::jsonb,
  provider_sync_enabled boolean not null default false,
  provider_sync_limit_per_mailbox integer not null default 25 check (provider_sync_limit_per_mailbox between 1 and 100),
  dedup_scan_enabled boolean not null default true,
  auto_create_quarantine_requests boolean not null default false,
  auto_create_destruction_reviews boolean not null default false,
  auto_approve_low_risk boolean not null default false,
  maximum_candidates_per_run integer not null default 250 check (maximum_candidates_per_run between 10 and 5000),
  growth_alert_bytes_per_day bigint not null default 2147483648 check (growth_alert_bytes_per_day >= 0),
  warning_free_bytes bigint not null default 26843545600 check (warning_free_bytes >= 0),
  critical_free_bytes bigint not null default 10737418240 check (critical_free_bytes >= 0),
  stale_provider_minutes integer not null default 360 check (stale_provider_minutes >= 15),
  require_dry_run boolean not null default true,
  updated_at timestamptz not null default now(),
  updated_by text null
);
create unique index if not exists opsos_storage_lifecycle_single_enabled_policy_idx on public.opsos_storage_lifecycle_policies((enabled)) where enabled = true;

insert into public.opsos_storage_lifecycle_policies (
  id,name,enabled,cadence_minutes,actions,provider_sync_enabled,provider_sync_limit_per_mailbox,
  dedup_scan_enabled,auto_create_quarantine_requests,auto_create_destruction_reviews,auto_approve_low_risk,
  maximum_candidates_per_run,growth_alert_bytes_per_day,warning_free_bytes,critical_free_bytes,
  stale_provider_minutes,require_dry_run,updated_by
)
select gen_random_uuid(),'Cycle de vie OPSOS par défaut',true,60,
  '["inventory","forecast","provider_reconcile","dedup_scan","retention_dry_run","cleanup_dry_run"]'::jsonb,
  false,25,true,false,false,false,250,2147483648,26843545600,10737418240,360,true,'phase5_migration'
where not exists (select 1 from public.opsos_storage_lifecycle_policies where enabled = true);

create table if not exists public.opsos_storage_lifecycle_snapshots (
  id uuid primary key,
  total_bytes bigint not null default 0 check (total_bytes >= 0),
  used_bytes bigint not null default 0 check (used_bytes >= 0),
  free_bytes bigint not null default 0 check (free_bytes >= 0),
  attachment_bytes bigint not null default 0 check (attachment_bytes >= 0),
  duplicate_bytes bigint not null default 0 check (duplicate_bytes >= 0),
  quarantine_bytes bigint not null default 0 check (quarantine_bytes >= 0),
  recoverable_bytes bigint not null default 0 check (recoverable_bytes >= 0),
  mailbox_count integer not null default 0 check (mailbox_count >= 0),
  storage_file_count integer not null default 0 check (storage_file_count >= 0),
  provider_message_count integer not null default 0 check (provider_message_count >= 0),
  captured_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);
create index if not exists opsos_storage_lifecycle_snapshots_captured_idx on public.opsos_storage_lifecycle_snapshots(captured_at desc);

create table if not exists public.opsos_storage_lifecycle_alerts (
  id uuid primary key,
  alert_type text not null,
  severity text not null check (severity in ('info','low','medium','high','critical')),
  title text not null,
  message text not null,
  status text not null default 'open' check (status in ('open','acknowledged','resolved')),
  source text not null,
  evidence jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  acknowledged_at timestamptz null,
  acknowledged_by text null,
  resolved_at timestamptz null
);
create index if not exists opsos_storage_lifecycle_alerts_status_idx on public.opsos_storage_lifecycle_alerts(status,severity,created_at desc);
create unique index if not exists opsos_storage_lifecycle_alerts_open_type_idx on public.opsos_storage_lifecycle_alerts(alert_type) where status = 'open';

create table if not exists public.opsos_storage_lifecycle_runs (
  id uuid primary key,
  run_number text not null unique,
  policy_id uuid null references public.opsos_storage_lifecycle_policies(id) on delete set null,
  trigger text not null check (trigger in ('manual','scheduled','threshold','recovery')),
  status text not null check (status in ('queued','running','paused','completed','completed_with_warnings','failed','cancelled')),
  actions jsonb not null default '[]'::jsonb,
  requested_by text not null,
  started_at timestamptz null,
  completed_at timestamptz null,
  paused_at timestamptz null,
  cancelled_at timestamptz null,
  scanned_count integer not null default 0 check (scanned_count >= 0),
  candidate_count integer not null default 0 check (candidate_count >= 0),
  recommended_recovery_bytes bigint not null default 0 check (recommended_recovery_bytes >= 0),
  actual_recovered_bytes bigint not null default 0 check (actual_recovered_bytes >= 0),
  provider_mailbox_count integer not null default 0 check (provider_mailbox_count >= 0),
  provider_message_count integer not null default 0 check (provider_message_count >= 0),
  warning_count integer not null default 0 check (warning_count >= 0),
  error_count integer not null default 0 check (error_count >= 0),
  summary jsonb not null default '{}'::jsonb,
  last_error text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists opsos_storage_lifecycle_runs_status_idx on public.opsos_storage_lifecycle_runs(status,created_at desc);

create table if not exists public.opsos_storage_lifecycle_run_items (
  id uuid primary key,
  run_id uuid not null references public.opsos_storage_lifecycle_runs(id) on delete restrict,
  action text not null,
  status text not null,
  object_reference text null,
  source_id text null,
  mailbox_id text null,
  size_bytes bigint not null default 0 check (size_bytes >= 0),
  recommended_action text null,
  risk_level text null check (risk_level is null or risk_level in ('low','controlled','high','blocked')),
  result jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists opsos_storage_lifecycle_run_items_run_idx on public.opsos_storage_lifecycle_run_items(run_id,created_at asc);

create table if not exists public.opsos_storage_dedup_plans (
  id uuid primary key,
  plan_number text not null unique,
  status text not null check (status in ('draft','analyzed','awaiting_approval','approved','executing','completed','completed_with_warnings','failed','cancelled','blocked')),
  sha256_hash text not null,
  canonical_file_id text null,
  canonical_source_id text not null,
  canonical_relative_path text not null,
  size_bytes bigint not null default 0 check (size_bytes >= 0),
  physical_copies integer not null default 0 check (physical_copies >= 0),
  reference_count integer not null default 0 check (reference_count >= 0),
  potential_recoverable_bytes bigint not null default 0 check (potential_recoverable_bytes >= 0),
  actual_recovered_bytes bigint not null default 0 check (actual_recovered_bytes >= 0),
  risk_level text not null check (risk_level in ('low','controlled','high','blocked')),
  reason text not null,
  requested_by text not null,
  approved_by text null,
  executed_by text null,
  bridge_plan_token text null,
  preflight jsonb not null default '{}'::jsonb,
  result jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz null
);
create index if not exists opsos_storage_dedup_plans_status_idx on public.opsos_storage_dedup_plans(status,created_at desc);
create index if not exists opsos_storage_dedup_plans_hash_idx on public.opsos_storage_dedup_plans(sha256_hash,created_at desc);

create table if not exists public.opsos_storage_dedup_plan_items (
  id uuid primary key,
  plan_id uuid not null references public.opsos_storage_dedup_plans(id) on delete restrict,
  file_id text null,
  source_id text not null,
  relative_path text not null,
  filename text not null,
  mailbox_id text null,
  entity_type text null,
  entity_id text null,
  size_bytes bigint not null default 0 check (size_bytes >= 0),
  sha256 text not null,
  canonical boolean not null default false,
  active_reference_count integer not null default 0 check (active_reference_count >= 0),
  legal_hold boolean not null default false,
  status text not null,
  snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists opsos_storage_dedup_plan_items_plan_path_idx on public.opsos_storage_dedup_plan_items(plan_id,source_id,relative_path);

create table if not exists public.opsos_storage_dedup_references (
  id uuid primary key,
  plan_id uuid not null references public.opsos_storage_dedup_plans(id) on delete restrict,
  file_id text not null,
  sha256_hash text not null,
  canonical_file_id text null,
  canonical boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists opsos_storage_dedup_references_file_idx on public.opsos_storage_dedup_references(file_id);

create table if not exists public.opsos_storage_provider_sync_runs (
  id uuid primary key,
  run_number text not null unique,
  mailbox_id text null,
  status text not null check (status in ('queued','running','completed','completed_with_warnings','failed','cancelled')),
  requested_by text not null,
  mailbox_count integer not null default 0 check (mailbox_count >= 0),
  fetched_count integer not null default 0 check (fetched_count >= 0),
  inserted_count integer not null default 0 check (inserted_count >= 0),
  updated_count integer not null default 0 check (updated_count >= 0),
  skipped_count integer not null default 0 check (skipped_count >= 0),
  failed_count integer not null default 0 check (failed_count >= 0),
  result jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  started_at timestamptz null,
  completed_at timestamptz null,
  last_error text null
);
create index if not exists opsos_storage_provider_sync_runs_created_idx on public.opsos_storage_provider_sync_runs(created_at desc);

create table if not exists public.opsos_storage_provider_reconciliation (
  id uuid primary key,
  mailbox_id text not null,
  email text not null,
  provider_message_count integer not null default 0 check (provider_message_count >= 0),
  local_message_count integer not null default 0 check (local_message_count >= 0),
  provider_only_count integer not null default 0 check (provider_only_count >= 0),
  local_only_count integer not null default 0 check (local_only_count >= 0),
  matched_count integer not null default 0 check (matched_count >= 0),
  provider_only_uids jsonb not null default '[]'::jsonb,
  local_only_uids jsonb not null default '[]'::jsonb,
  status text not null check (status in ('matched','drift','partial','failed')),
  detail text not null,
  reconciled_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);
create index if not exists opsos_storage_provider_reconciliation_mailbox_idx on public.opsos_storage_provider_reconciliation(mailbox_id,reconciled_at desc);

alter table public.opsos_storage_lifecycle_policies enable row level security;
alter table public.opsos_storage_lifecycle_snapshots enable row level security;
alter table public.opsos_storage_lifecycle_alerts enable row level security;
alter table public.opsos_storage_lifecycle_runs enable row level security;
alter table public.opsos_storage_lifecycle_run_items enable row level security;
alter table public.opsos_storage_dedup_plans enable row level security;
alter table public.opsos_storage_dedup_plan_items enable row level security;
alter table public.opsos_storage_dedup_references enable row level security;
alter table public.opsos_storage_provider_sync_runs enable row level security;
alter table public.opsos_storage_provider_reconciliation enable row level security;

revoke all on public.opsos_storage_lifecycle_policies from anon, authenticated;
revoke all on public.opsos_storage_lifecycle_snapshots from anon, authenticated;
revoke all on public.opsos_storage_lifecycle_alerts from anon, authenticated;
revoke all on public.opsos_storage_lifecycle_runs from anon, authenticated;
revoke all on public.opsos_storage_lifecycle_run_items from anon, authenticated;
revoke all on public.opsos_storage_dedup_plans from anon, authenticated;
revoke all on public.opsos_storage_dedup_plan_items from anon, authenticated;
revoke all on public.opsos_storage_dedup_references from anon, authenticated;
revoke all on public.opsos_storage_provider_sync_runs from anon, authenticated;
revoke all on public.opsos_storage_provider_reconciliation from anon, authenticated;

grant all on public.opsos_storage_lifecycle_policies to service_role;
grant all on public.opsos_storage_lifecycle_snapshots to service_role;
grant all on public.opsos_storage_lifecycle_alerts to service_role;
grant all on public.opsos_storage_lifecycle_runs to service_role;
grant all on public.opsos_storage_lifecycle_run_items to service_role;
grant all on public.opsos_storage_dedup_plans to service_role;
grant all on public.opsos_storage_dedup_plan_items to service_role;
grant all on public.opsos_storage_dedup_references to service_role;
grant all on public.opsos_storage_provider_sync_runs to service_role;
grant all on public.opsos_storage_provider_reconciliation to service_role;

comment on table public.opsos_storage_lifecycle_policies is 'Phase 5 safe lifecycle orchestration policies. Destructive actions remain governed by Phase 3 and Phase 4.';
comment on table public.opsos_storage_dedup_plans is 'Exact-hash, independently approved consolidation plans preserving every application reference.';
comment on table public.opsos_storage_provider_reconciliation is 'POP3 provider versus local Email OS UID reconciliation evidence. Remote provider deletion remains disabled by default.';

commit;
