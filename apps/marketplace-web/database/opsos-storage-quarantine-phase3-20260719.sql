begin;

create table if not exists public.opsos_storage_quarantine_cases (
  id uuid primary key,
  case_number text not null unique,
  source_id text not null,
  object_type text not null,
  object_reference text not null,
  file_id text null,
  mailbox_id text null,
  entity_type text null,
  entity_id text null,
  original_name text not null,
  original_size_bytes bigint not null default 0 check (original_size_bytes >= 0),
  original_sha256 text null,
  original_relative_path text not null,
  original_location_token text not null,
  quarantine_mode text not null check (quarantine_mode in ('logical','physical')),
  quarantine_location_token text null,
  risk_level text not null check (risk_level in ('low','controlled','high','blocked')),
  status text not null check (status in (
    'draft','impact_pending','awaiting_approval','approved','executing','verifying','quarantined',
    'restore_requested','restoring','restored','failed','cancelled','expired','eligible_for_future_purge'
  )),
  reason text not null,
  impact_snapshot jsonb not null default '{}'::jsonb,
  references_snapshot jsonb not null default '[]'::jsonb,
  estimated_recoverable_bytes bigint not null default 0 check (estimated_recoverable_bytes >= 0),
  actual_recovered_bytes bigint not null default 0 check (actual_recovered_bytes >= 0),
  requested_by text not null,
  approved_by text null,
  second_approved_by text null,
  approval_count integer not null default 0 check (approval_count between 0 and 2),
  approvals_required integer not null default 1 check (approvals_required between 1 and 2),
  executed_by text null,
  retention_until timestamptz not null,
  restore_readiness text not null default 'partial' check (restore_readiness in ('complete','partial','blocked')),
  restored_at timestamptz null,
  last_error text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.opsos_storage_quarantine_cases add column if not exists second_approved_by text null;
alter table public.opsos_storage_quarantine_cases add column if not exists approval_count integer not null default 0;
alter table public.opsos_storage_quarantine_cases add column if not exists approvals_required integer not null default 1;

create index if not exists opsos_storage_quarantine_cases_status_idx on public.opsos_storage_quarantine_cases(status, created_at desc);
create index if not exists opsos_storage_quarantine_cases_file_idx on public.opsos_storage_quarantine_cases(file_id) where file_id is not null;
create index if not exists opsos_storage_quarantine_cases_mailbox_idx on public.opsos_storage_quarantine_cases(mailbox_id) where mailbox_id is not null;
create index if not exists opsos_storage_quarantine_cases_retention_idx on public.opsos_storage_quarantine_cases(retention_until) where status = 'quarantined';

create table if not exists public.opsos_storage_quarantine_items (
  id uuid primary key,
  case_id uuid not null references public.opsos_storage_quarantine_cases(id) on delete restrict,
  source_id text not null,
  object_reference text not null,
  file_id text null,
  original_name text not null,
  original_size_bytes bigint not null default 0,
  original_sha256 text null,
  original_relative_path text not null,
  status text not null default 'registered',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists opsos_storage_quarantine_items_case_object_idx on public.opsos_storage_quarantine_items(case_id, object_reference);

create table if not exists public.opsos_storage_quarantine_references (
  id uuid primary key,
  case_id uuid not null references public.opsos_storage_quarantine_cases(id) on delete restrict,
  reference_type text not null,
  reference_id text not null,
  label text not null,
  detail text null,
  mailbox_id text null,
  active boolean not null default false,
  snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists opsos_storage_quarantine_references_case_idx on public.opsos_storage_quarantine_references(case_id, created_at asc);

create table if not exists public.opsos_storage_restore_jobs (
  id uuid primary key,
  case_id uuid not null references public.opsos_storage_quarantine_cases(id) on delete restrict,
  status text not null check (status in ('requested','restoring','verifying','completed','failed','cancelled')),
  requested_by text not null,
  reason text not null,
  original_sha256 text null,
  restored_sha256 text null,
  result jsonb not null default '{}'::jsonb,
  last_error text null,
  requested_at timestamptz not null default now(),
  started_at timestamptz null,
  completed_at timestamptz null,
  updated_at timestamptz not null default now()
);

create index if not exists opsos_storage_restore_jobs_case_idx on public.opsos_storage_restore_jobs(case_id, requested_at desc);

create table if not exists public.opsos_storage_quarantine_events (
  id uuid primary key,
  case_id uuid not null references public.opsos_storage_quarantine_cases(id) on delete restrict,
  event_type text not null,
  status text not null,
  actor text not null,
  reason text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists opsos_storage_quarantine_events_case_idx on public.opsos_storage_quarantine_events(case_id, created_at asc);

create table if not exists public.opsos_storage_quarantine_policies (
  id uuid primary key,
  default_retention_days integer not null default 30 check (default_retention_days between 1 and 3650),
  maximum_retention_days integer not null default 180 check (maximum_retention_days between 1 and 3650),
  require_approval_for_referenced boolean not null default true,
  require_second_approval_above_bytes bigint not null default 524288000 check (require_second_approval_above_bytes >= 0),
  allow_same_volume_quarantine boolean not null default true,
  allow_external_vault_quarantine boolean not null default true,
  allow_message_quarantine boolean not null default true,
  allow_active_send_attachment_quarantine boolean not null default false,
  allow_legal_hold_quarantine boolean not null default false,
  active boolean not null default true,
  updated_at timestamptz not null default now(),
  updated_by text null
);

create unique index if not exists opsos_storage_quarantine_single_active_policy_idx on public.opsos_storage_quarantine_policies((active)) where active = true;

insert into public.opsos_storage_quarantine_policies (
  id, default_retention_days, maximum_retention_days, require_approval_for_referenced,
  require_second_approval_above_bytes, allow_same_volume_quarantine, allow_external_vault_quarantine,
  allow_message_quarantine, allow_active_send_attachment_quarantine, allow_legal_hold_quarantine,
  active, updated_by
)
select gen_random_uuid(), 30, 180, true, 524288000, true, true, true, false, false, true, 'phase3_migration'
where not exists (select 1 from public.opsos_storage_quarantine_policies where active = true);

create table if not exists public.opsos_storage_legal_holds (
  id uuid primary key,
  source_id text not null,
  object_reference text not null,
  file_id text null,
  mailbox_id text null,
  reason text not null,
  status text not null default 'active' check (status in ('active','released')),
  placed_by text not null,
  placed_at timestamptz not null default now(),
  released_by text null,
  released_at timestamptz null,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists opsos_storage_legal_holds_object_idx on public.opsos_storage_legal_holds(source_id, object_reference) where status = 'active';
create index if not exists opsos_storage_legal_holds_file_idx on public.opsos_storage_legal_holds(file_id) where status = 'active' and file_id is not null;

alter table public.opsos_storage_quarantine_cases enable row level security;
alter table public.opsos_storage_quarantine_items enable row level security;
alter table public.opsos_storage_quarantine_references enable row level security;
alter table public.opsos_storage_restore_jobs enable row level security;
alter table public.opsos_storage_quarantine_events enable row level security;
alter table public.opsos_storage_quarantine_policies enable row level security;
alter table public.opsos_storage_legal_holds enable row level security;

revoke all on public.opsos_storage_quarantine_cases from anon, authenticated;
revoke all on public.opsos_storage_quarantine_items from anon, authenticated;
revoke all on public.opsos_storage_quarantine_references from anon, authenticated;
revoke all on public.opsos_storage_restore_jobs from anon, authenticated;
revoke all on public.opsos_storage_quarantine_events from anon, authenticated;
revoke all on public.opsos_storage_quarantine_policies from anon, authenticated;
revoke all on public.opsos_storage_legal_holds from anon, authenticated;

grant all on public.opsos_storage_quarantine_cases to service_role;
grant all on public.opsos_storage_quarantine_items to service_role;
grant all on public.opsos_storage_quarantine_references to service_role;
grant all on public.opsos_storage_restore_jobs to service_role;
grant all on public.opsos_storage_quarantine_events to service_role;
grant all on public.opsos_storage_quarantine_policies to service_role;
grant all on public.opsos_storage_legal_holds to service_role;

comment on table public.opsos_storage_quarantine_cases is 'Phase 3 reversible storage quarantine cases. Permanent deletion is deliberately unsupported.';
comment on table public.opsos_storage_quarantine_items is 'Normalized storage objects governed by a reversible quarantine case.';
comment on table public.opsos_storage_quarantine_references is 'Preserved business and Email OS references for every quarantined object.';
comment on table public.opsos_storage_restore_jobs is 'Audited restoration jobs with integrity verification results.';
comment on table public.opsos_storage_quarantine_events is 'Immutable operational event history for storage quarantine and restoration.';
comment on table public.opsos_storage_quarantine_policies is 'Governed reversible quarantine policy configuration.';
comment on table public.opsos_storage_legal_holds is 'Storage objects explicitly blocked from quarantine and purge.';

commit;
