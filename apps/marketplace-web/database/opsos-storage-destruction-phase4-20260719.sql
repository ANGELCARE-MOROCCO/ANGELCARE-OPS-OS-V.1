begin;

create table if not exists public.opsos_storage_destruction_requests (
  id uuid primary key,
  request_number text not null unique,
  quarantine_case_id uuid not null references public.opsos_storage_quarantine_cases(id) on delete restrict,
  quarantine_case_number text not null,
  scope text not null check (scope in ('physical_file','application_message','complete_local_message','technical_cleanup','backup_copy')),
  risk_level text not null check (risk_level in ('low','controlled','high','blocked')),
  status text not null check (status in (
    'not_eligible','retention_active','impact_review_required','awaiting_approval','approved_for_destruction',
    'destruction_scheduled','destroying','verifying','destroyed','partially_destroyed','failed','cancelled','blocked'
  )),
  reason text not null,
  source_id text not null,
  object_reference text not null,
  file_id text null,
  mailbox_id text null,
  entity_type text null,
  entity_id text null,
  original_name text not null,
  original_size_bytes bigint not null default 0 check (original_size_bytes >= 0),
  expected_sha256 text null,
  quarantine_location_token text null,
  impact_snapshot jsonb not null default '{}'::jsonb,
  requested_by text not null,
  approved_by text null,
  second_approved_by text null,
  approval_count integer not null default 0 check (approval_count between 0 and 2),
  approvals_required integer not null default 1 check (approvals_required between 1 and 2),
  scheduled_for timestamptz null,
  cooling_off_seconds integer not null default 0 check (cooling_off_seconds >= 0),
  executed_by text null,
  actual_recovered_bytes bigint not null default 0 check (actual_recovered_bytes >= 0),
  certificate_id uuid null,
  certificate_number text null,
  completed_at timestamptz null,
  last_error text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists opsos_storage_destruction_requests_status_idx on public.opsos_storage_destruction_requests(status, created_at desc);
create index if not exists opsos_storage_destruction_requests_case_idx on public.opsos_storage_destruction_requests(quarantine_case_id, created_at desc);
create index if not exists opsos_storage_destruction_requests_schedule_idx on public.opsos_storage_destruction_requests(scheduled_for) where status = 'destruction_scheduled';

create table if not exists public.opsos_storage_destruction_approvals (
  id uuid primary key,
  request_id uuid not null references public.opsos_storage_destruction_requests(id) on delete restrict,
  actor text not null,
  decision text not null check (decision in ('approved','rejected')),
  reason text not null,
  created_at timestamptz not null default now()
);
create unique index if not exists opsos_storage_destruction_approvals_actor_idx on public.opsos_storage_destruction_approvals(request_id, actor);

create table if not exists public.opsos_storage_destruction_jobs (
  id uuid primary key,
  request_id uuid not null references public.opsos_storage_destruction_requests(id) on delete restrict,
  status text not null check (status in ('scheduled','executing','verifying','completed','partially_completed','failed','cancelled')),
  bridge_job_id text null,
  requested_by text not null,
  started_at timestamptz null,
  completed_at timestamptz null,
  result jsonb not null default '{}'::jsonb,
  last_error text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists opsos_storage_destruction_jobs_request_idx on public.opsos_storage_destruction_jobs(request_id, created_at desc);

create table if not exists public.opsos_storage_destruction_items (
  id uuid primary key,
  request_id uuid not null references public.opsos_storage_destruction_requests(id) on delete restrict,
  source_id text not null,
  object_reference text not null,
  expected_sha256 text null,
  size_bytes bigint not null default 0,
  status text not null default 'registered',
  verification jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists opsos_storage_destruction_items_request_object_idx on public.opsos_storage_destruction_items(request_id, object_reference);

create table if not exists public.opsos_storage_destruction_events (
  id uuid primary key,
  request_id uuid not null references public.opsos_storage_destruction_requests(id) on delete restrict,
  event_type text not null,
  status text not null,
  actor text not null,
  reason text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists opsos_storage_destruction_events_request_idx on public.opsos_storage_destruction_events(request_id, created_at asc);

create table if not exists public.opsos_storage_destruction_certificates (
  id uuid primary key,
  certificate_number text not null unique,
  request_id uuid not null unique references public.opsos_storage_destruction_requests(id) on delete restrict,
  request_number text not null,
  quarantine_case_id uuid not null references public.opsos_storage_quarantine_cases(id) on delete restrict,
  original_name text not null,
  original_size_bytes bigint not null default 0,
  original_sha256 text null,
  source_id text not null,
  mailbox_id text null,
  scope text not null,
  requester text not null,
  approvers jsonb not null default '[]'::jsonb,
  executed_by text not null,
  executed_at timestamptz not null,
  verification_result text not null,
  actual_recovered_bytes bigint not null default 0,
  remaining_copies jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.opsos_storage_destruction_policies (
  id uuid primary key,
  low_risk_cooling_off_seconds integer not null default 300 check (low_risk_cooling_off_seconds >= 0),
  controlled_risk_cooling_off_seconds integer not null default 86400 check (controlled_risk_cooling_off_seconds >= 0),
  high_risk_cooling_off_seconds integer not null default 259200 check (high_risk_cooling_off_seconds >= 0),
  require_independent_approval boolean not null default true,
  require_two_approvals_for_high_risk boolean not null default true,
  require_typed_confirmation_for_high_risk boolean not null default true,
  require_retention_completion boolean not null default true,
  allow_primary_destruction_while_backups_expire boolean not null default true,
  active boolean not null default true,
  updated_at timestamptz not null default now(),
  updated_by text null
);
create unique index if not exists opsos_storage_destruction_single_active_policy_idx on public.opsos_storage_destruction_policies((active)) where active = true;

insert into public.opsos_storage_destruction_policies (
  id, low_risk_cooling_off_seconds, controlled_risk_cooling_off_seconds, high_risk_cooling_off_seconds,
  require_independent_approval, require_two_approvals_for_high_risk, require_typed_confirmation_for_high_risk,
  require_retention_completion, allow_primary_destruction_while_backups_expire, active, updated_by
)
select gen_random_uuid(), 300, 86400, 259200, true, true, true, true, true, true, 'phase4_migration'
where not exists (select 1 from public.opsos_storage_destruction_policies where active = true);

create table if not exists public.opsos_storage_retention_policies (
  id uuid primary key,
  name text not null,
  category text not null,
  minimum_age_days integer not null default 0 check (minimum_age_days >= 0),
  quarantine_days integer not null default 30 check (quarantine_days >= 0),
  action_after_retention text not null default 'review' check (action_after_retention in ('review','quarantine','destruction_review')),
  enabled boolean not null default true,
  dry_run_required boolean not null default true,
  exclusions jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by text null
);

insert into public.opsos_storage_retention_policies (id,name,category,minimum_age_days,quarantine_days,action_after_retention,enabled,dry_run_required,updated_by)
select gen_random_uuid(),'Pièces jointes entrantes','incoming_attachments',730,30,'destruction_review',true,true,'phase4_migration'
where not exists (select 1 from public.opsos_storage_retention_policies where category='incoming_attachments');
insert into public.opsos_storage_retention_policies (id,name,category,minimum_age_days,quarantine_days,action_after_retention,enabled,dry_run_required,updated_by)
select gen_random_uuid(),'Pièces jointes sortantes','outgoing_attachments',1095,30,'destruction_review',true,true,'phase4_migration'
where not exists (select 1 from public.opsos_storage_retention_policies where category='outgoing_attachments');
insert into public.opsos_storage_retention_policies (id,name,category,minimum_age_days,quarantine_days,action_after_retention,enabled,dry_run_required,updated_by)
select gen_random_uuid(),'Fichiers d’envoi échoué','failed_send_files',14,30,'quarantine',true,true,'phase4_migration'
where not exists (select 1 from public.opsos_storage_retention_policies where category='failed_send_files');
insert into public.opsos_storage_retention_policies (id,name,category,minimum_age_days,quarantine_days,action_after_retention,enabled,dry_run_required,updated_by)
select gen_random_uuid(),'Exports générés','generated_exports',30,14,'destruction_review',true,true,'phase4_migration'
where not exists (select 1 from public.opsos_storage_retention_policies where category='generated_exports');
insert into public.opsos_storage_retention_policies (id,name,category,minimum_age_days,quarantine_days,action_after_retention,enabled,dry_run_required,updated_by)
select gen_random_uuid(),'Journaux applicatifs','application_logs',90,14,'destruction_review',true,true,'phase4_migration'
where not exists (select 1 from public.opsos_storage_retention_policies where category='application_logs');

create table if not exists public.opsos_storage_retention_runs (
  id uuid primary key,
  policy_id uuid not null references public.opsos_storage_retention_policies(id) on delete restrict,
  mode text not null check (mode in ('dry_run','execution')),
  status text not null check (status in ('running','completed','completed_with_warnings','failed','cancelled')),
  matched_count integer not null default 0,
  matched_bytes bigint not null default 0,
  result jsonb not null default '{}'::jsonb,
  requested_by text not null,
  created_at timestamptz not null default now(),
  completed_at timestamptz null
);

create table if not exists public.opsos_storage_retention_matches (
  id uuid primary key,
  run_id uuid not null references public.opsos_storage_retention_runs(id) on delete restrict,
  object_reference text not null,
  eligible boolean not null default false,
  blocked_reason text null,
  size_bytes bigint not null default 0,
  snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.opsos_storage_cleanup_profiles (
  id text primary key,
  name text not null,
  description text not null,
  source_ids jsonb not null default '[]'::jsonb,
  extensions jsonb not null default '[]'::jsonb,
  minimum_age_days integer not null default 0,
  maximum_batch_size integer not null default 100,
  risk_level text not null check (risk_level in ('low','controlled')),
  enabled boolean not null default true,
  updated_at timestamptz not null default now(),
  updated_by text null
);

insert into public.opsos_storage_cleanup_profiles (id,name,description,source_ids,extensions,minimum_age_days,maximum_batch_size,risk_level,enabled,updated_by)
values
('expired-temporary-files','Fichiers temporaires expirés','Téléversements et fragments temporaires anciens dans les racines approuvées.','["temporary","uploads"]','[]',14,500,'low',true,'phase4_migration'),
('failed-export-remnants','Résidus d’exports échoués','Exports partiels ou abandonnés après expiration du délai opérationnel.','["exports"]','[".tmp",".partial",".failed"]',30,250,'low',true,'phase4_migration'),
('rotated-compressed-logs','Journaux compressés arrivés à échéance','Journaux déjà rotatés et non actifs dans le périmètre approuvé.','["logs"]','[".gz",".zip",".log.1",".log.2"]',90,250,'low',true,'phase4_migration')
on conflict (id) do nothing;

alter table public.angelcare_storage_files add column if not exists destroyed_at timestamptz null;
alter table public.angelcare_storage_files add column if not exists destruction_request_id uuid null;
alter table public.angelcare_storage_files add column if not exists destruction_certificate_number text null;

alter table public.opsos_storage_destruction_requests enable row level security;
alter table public.opsos_storage_destruction_approvals enable row level security;
alter table public.opsos_storage_destruction_jobs enable row level security;
alter table public.opsos_storage_destruction_items enable row level security;
alter table public.opsos_storage_destruction_events enable row level security;
alter table public.opsos_storage_destruction_certificates enable row level security;
alter table public.opsos_storage_destruction_policies enable row level security;
alter table public.opsos_storage_retention_policies enable row level security;
alter table public.opsos_storage_retention_runs enable row level security;
alter table public.opsos_storage_retention_matches enable row level security;
alter table public.opsos_storage_cleanup_profiles enable row level security;

revoke all on public.opsos_storage_destruction_requests from anon, authenticated;
revoke all on public.opsos_storage_destruction_approvals from anon, authenticated;
revoke all on public.opsos_storage_destruction_jobs from anon, authenticated;
revoke all on public.opsos_storage_destruction_items from anon, authenticated;
revoke all on public.opsos_storage_destruction_events from anon, authenticated;
revoke all on public.opsos_storage_destruction_certificates from anon, authenticated;
revoke all on public.opsos_storage_destruction_policies from anon, authenticated;
revoke all on public.opsos_storage_retention_policies from anon, authenticated;
revoke all on public.opsos_storage_retention_runs from anon, authenticated;
revoke all on public.opsos_storage_retention_matches from anon, authenticated;
revoke all on public.opsos_storage_cleanup_profiles from anon, authenticated;

grant all on public.opsos_storage_destruction_requests to service_role;
grant all on public.opsos_storage_destruction_approvals to service_role;
grant all on public.opsos_storage_destruction_jobs to service_role;
grant all on public.opsos_storage_destruction_items to service_role;
grant all on public.opsos_storage_destruction_events to service_role;
grant all on public.opsos_storage_destruction_certificates to service_role;
grant all on public.opsos_storage_destruction_policies to service_role;
grant all on public.opsos_storage_retention_policies to service_role;
grant all on public.opsos_storage_retention_runs to service_role;
grant all on public.opsos_storage_retention_matches to service_role;
grant all on public.opsos_storage_cleanup_profiles to service_role;

comment on table public.opsos_storage_destruction_requests is 'Phase 4 governed permanent-destruction requests originating from verified quarantine cases.';
comment on table public.opsos_storage_destruction_certificates is 'Immutable non-content destruction evidence. Destroyed binary data is never stored here.';
comment on table public.opsos_storage_retention_policies is 'Governed retention policies requiring dry-run analysis before enforcement.';

commit;
