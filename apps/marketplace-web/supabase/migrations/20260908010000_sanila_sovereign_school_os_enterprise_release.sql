-- SANILA SOVEREIGN SCHOOL OS — ENTERPRISE RELEASE FOUNDATION
-- Additive, transaction-wrapped, no demo seed/reset. Apply only through the guarded release installer.

begin;
create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Enterprise command / workflow / audit / job kernel
-- ---------------------------------------------------------------------------
create table if not exists public.angelcare360_enterprise_commands (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  actor_app_user_id uuid references public.app_users(id) on delete set null,
  command_key text not null,
  idempotency_key text not null,
  resource_type text,
  resource_id uuid,
  request_json jsonb not null default '{}'::jsonb,
  result_json jsonb not null default '{}'::jsonb,
  state text not null default 'received' check (state in ('received','validated','executing','succeeded','failed','rejected')),
  failure_code text,
  failure_message text,
  correlation_id uuid not null default gen_random_uuid(),
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (school_id,idempotency_key)
);

create table if not exists public.angelcare360_workflow_definitions (
  id uuid primary key default gen_random_uuid(),
  school_id uuid references public.angelcare360_schools(id) on delete cascade,
  workflow_key text not null,
  version integer not null default 1,
  label text not null,
  description text,
  state_schema jsonb not null default '{}'::jsonb,
  transition_schema jsonb not null default '[]'::jsonb,
  status text not null default 'active' check (status in ('draft','active','retired')),
  created_by uuid references public.app_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (school_id,workflow_key,version)
);

create table if not exists public.angelcare360_workflow_instances (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  definition_id uuid references public.angelcare360_workflow_definitions(id) on delete restrict,
  workflow_key text not null,
  resource_type text not null,
  resource_id uuid,
  current_state text not null,
  context_json jsonb not null default '{}'::jsonb,
  owner_app_user_id uuid references public.app_users(id) on delete set null,
  correlation_id uuid not null default gen_random_uuid(),
  status text not null default 'active' check (status in ('active','completed','cancelled','failed','archived')),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.angelcare360_workflow_transitions (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  workflow_instance_id uuid not null references public.angelcare360_workflow_instances(id) on delete cascade,
  from_state text,
  to_state text not null,
  transition_key text not null,
  reason text,
  actor_app_user_id uuid references public.app_users(id) on delete set null,
  metadata_json jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create table if not exists public.angelcare360_enterprise_audit_ledger (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  actor_app_user_id uuid references public.app_users(id) on delete set null,
  actor_role text,
  action_key text not null,
  resource_type text not null,
  resource_id uuid,
  before_json jsonb not null default '{}'::jsonb,
  after_json jsonb not null default '{}'::jsonb,
  reason text,
  source text not null default 'sanila',
  session_id uuid,
  delegation_id uuid,
  correlation_id uuid,
  request_id text,
  ip_hash text,
  user_agent_hash text,
  metadata_json jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create or replace function public.angelcare360_reject_audit_ledger_mutation()
returns trigger language plpgsql as $$
begin
  raise exception 'ANGELCARE360_AUDIT_LEDGER_IMMUTABLE';
end;
$$;
drop trigger if exists angelcare360_enterprise_audit_ledger_immutable on public.angelcare360_enterprise_audit_ledger;
create trigger angelcare360_enterprise_audit_ledger_immutable
before update or delete on public.angelcare360_enterprise_audit_ledger
for each row execute function public.angelcare360_reject_audit_ledger_mutation();

create table if not exists public.angelcare360_background_jobs (
  id uuid primary key default gen_random_uuid(),
  school_id uuid references public.angelcare360_schools(id) on delete cascade,
  job_type text not null,
  idempotency_key text,
  payload_json jsonb not null default '{}'::jsonb,
  result_json jsonb not null default '{}'::jsonb,
  state text not null default 'queued' check (state in ('queued','running','succeeded','failed','retrying','cancelled','dead_letter')),
  priority integer not null default 50 check (priority between 0 and 100),
  attempt_count integer not null default 0,
  max_attempts integer not null default 5 check (max_attempts between 1 and 50),
  run_after timestamptz not null default now(),
  locked_at timestamptz,
  locked_by text,
  last_error text,
  correlation_id uuid not null default gen_random_uuid(),
  created_by uuid references public.app_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (school_id,job_type,idempotency_key)
);

create table if not exists public.angelcare360_notification_outbox (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  event_key text not null,
  recipient_type text not null,
  recipient_id uuid,
  recipient_app_user_id uuid references public.app_users(id) on delete set null,
  channel text not null check (channel in ('internal','email','sms','whatsapp','push')),
  template_key text,
  subject text,
  body text not null,
  payload_json jsonb not null default '{}'::jsonb,
  state text not null default 'queued' check (state in ('queued','processing','smtp_accepted','sent','delivered','failed','cancelled','simulated')),
  provider_reference text,
  failure_message text,
  correlation_id uuid not null default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  delivered_at timestamptz
);

-- ---------------------------------------------------------------------------
-- Identity / portal invitations. Token plaintext never persists.
-- school_user covers non-persona school administrators and staff accounts.
-- ---------------------------------------------------------------------------
create table if not exists public.angelcare360_portal_invitations (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  portal_kind text not null check (portal_kind in ('teacher','parent','staff','student','school_user')),
  person_id uuid,
  role_id uuid,
  app_user_id uuid references public.app_users(id) on delete set null,
  email text not null,
  token_digest text not null unique,
  state text not null default 'prepared' check (state in ('prepared','smtp_accepted','opened','accepted','revoked','expired','failed')),
  starts_at timestamptz not null default now(),
  expires_at timestamptz not null,
  delivery_reference text,
  failure_message text,
  invited_by uuid references public.app_users(id) on delete set null,
  accepted_at timestamptz,
  revoked_at timestamptz,
  last_sent_at timestamptz,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Governed document object ledger + data governance
-- ---------------------------------------------------------------------------
create table if not exists public.angelcare360_document_objects (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  document_id uuid not null references public.angelcare360_documents(id) on delete cascade,
  subject_type text not null,
  subject_id uuid not null,
  bucket_id text not null,
  object_path text not null,
  original_file_name text not null,
  safe_file_name text not null,
  mime_type text not null,
  size_bytes bigint not null check (size_bytes between 0 and 15728640),
  sha256 text not null check (sha256 ~ '^[a-f0-9]{64}$'),
  object_version text,
  state text not null default 'active' check (state in ('active','archived','deleted','orphaned','quarantined')),
  retention_until timestamptz,
  uploaded_by uuid references public.app_users(id) on delete set null,
  deleted_by uuid references public.app_users(id) on delete set null,
  deleted_at timestamptz,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (bucket_id,object_path),
  unique (document_id)
);

create table if not exists public.angelcare360_data_quality_findings (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  invariant_key text not null,
  resource_type text not null,
  resource_id uuid,
  severity text not null check (severity in ('info','warning','error','critical')),
  state text not null default 'open' check (state in ('open','acknowledged','resolved','ignored')),
  summary text not null,
  detail text,
  evidence_json jsonb not null default '{}'::jsonb,
  detected_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references public.app_users(id) on delete set null
);

create table if not exists public.angelcare360_data_retention_policies (
  id uuid primary key default gen_random_uuid(),
  school_id uuid references public.angelcare360_schools(id) on delete cascade,
  resource_type text not null,
  retention_days integer check (retention_days is null or retention_days >= 0),
  archive_after_days integer check (archive_after_days is null or archive_after_days >= 0),
  legal_hold_allowed boolean not null default false,
  policy_json jsonb not null default '{}'::jsonb,
  status text not null default 'active' check (status in ('draft','active','retired')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(school_id,resource_type)
);

-- ---------------------------------------------------------------------------
-- Integrations / lifecycle / QA / health
-- ---------------------------------------------------------------------------
create table if not exists public.angelcare360_integration_endpoints (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  endpoint_key text not null,
  endpoint_type text not null,
  label text not null,
  target_url text,
  signing_secret_ref text,
  allowed_events text[] not null default '{}',
  state text not null default 'active' check (state in ('active','paused','disabled','revoked')),
  metadata_json jsonb not null default '{}'::jsonb,
  created_by uuid references public.app_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(school_id,endpoint_key)
);

create table if not exists public.angelcare360_integration_deliveries (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  endpoint_id uuid references public.angelcare360_integration_endpoints(id) on delete set null,
  event_key text not null,
  payload_digest text not null,
  state text not null default 'queued' check (state in ('queued','sending','succeeded','failed','retrying','dead_letter','cancelled')),
  attempt_count integer not null default 0,
  response_status integer,
  response_digest text,
  last_error text,
  correlation_id uuid not null default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.angelcare360_tenant_lifecycle_events (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  from_state text,
  to_state text not null,
  event_key text not null,
  reason text,
  actor_app_user_id uuid references public.app_users(id) on delete set null,
  metadata_json jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create table if not exists public.angelcare360_qa_tenant_registry (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null unique references public.angelcare360_schools(id) on delete cascade,
  qa_key text not null unique,
  purpose text not null,
  synthetic_only boolean not null default true check (synthetic_only=true),
  destructive_tests_allowed boolean not null default false,
  expires_at timestamptz,
  state text not null default 'active' check (state in ('active','paused','expired','retired')),
  created_by uuid references public.app_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.angelcare360_service_health_observations (
  id uuid primary key default gen_random_uuid(),
  service_key text not null,
  school_id uuid references public.angelcare360_schools(id) on delete cascade,
  state text not null check (state in ('healthy','degraded','unhealthy','unknown')),
  latency_ms integer,
  detail_json jsonb not null default '{}'::jsonb,
  observed_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Private student document bucket. There is intentionally no public read policy.
-- ---------------------------------------------------------------------------
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('angelcare360-student-documents','angelcare360-student-documents',false,15728640,array['application/pdf','image/jpeg','image/png']::text[])
on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

-- ---------------------------------------------------------------------------
-- Indexes aligned to tenant-first / due-work patterns.
-- ---------------------------------------------------------------------------
create index if not exists angelcare360_enterprise_commands_school_state_idx on public.angelcare360_enterprise_commands(school_id,state,created_at desc);
create index if not exists angelcare360_workflow_instances_school_state_idx on public.angelcare360_workflow_instances(school_id,status,updated_at desc);
create index if not exists angelcare360_workflow_transitions_instance_idx on public.angelcare360_workflow_transitions(workflow_instance_id,occurred_at);
create index if not exists angelcare360_enterprise_audit_school_time_idx on public.angelcare360_enterprise_audit_ledger(school_id,occurred_at desc);
create index if not exists angelcare360_jobs_due_idx on public.angelcare360_background_jobs(state,run_after,priority desc,created_at);
create index if not exists angelcare360_notification_outbox_school_state_idx on public.angelcare360_notification_outbox(school_id,state,created_at);
create index if not exists angelcare360_portal_invitations_school_person_idx on public.angelcare360_portal_invitations(school_id,portal_kind,person_id,created_at desc);
create index if not exists angelcare360_document_objects_subject_idx on public.angelcare360_document_objects(school_id,subject_type,subject_id,state);
create index if not exists angelcare360_quality_findings_school_state_idx on public.angelcare360_data_quality_findings(school_id,state,severity,detected_at desc);
create index if not exists angelcare360_integration_deliveries_school_state_idx on public.angelcare360_integration_deliveries(school_id,state,created_at);
create index if not exists angelcare360_lifecycle_school_time_idx on public.angelcare360_tenant_lifecycle_events(school_id,occurred_at desc);

-- New enterprise tables are RLS + FORCE RLS. The current server authority is service-role
-- with explicit tenant predicates; no permissive anon/authenticated policy is created.
do $$
declare t text;
begin
  foreach t in array array[
    'angelcare360_enterprise_commands','angelcare360_workflow_definitions','angelcare360_workflow_instances','angelcare360_workflow_transitions',
    'angelcare360_enterprise_audit_ledger','angelcare360_background_jobs','angelcare360_notification_outbox','angelcare360_portal_invitations',
    'angelcare360_document_objects','angelcare360_data_quality_findings','angelcare360_data_retention_policies','angelcare360_integration_endpoints',
    'angelcare360_integration_deliveries','angelcare360_tenant_lifecycle_events','angelcare360_qa_tenant_registry','angelcare360_service_health_observations'
  ] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('alter table public.%I force row level security',t);
  end loop;
end $$;

-- Close the 27 legacy SANILA tables identified by the purchaser audit when they exist.
-- FORCE RLS is intentional because privileged table owners must not silently bypass a future
-- user-scoped policy layer. Service-role server commands continue to use explicit school filters.
do $$
declare t text;
begin
  foreach t in array array[
    'angelcare360_access_invitations','angelcare360_access_delegations','angelcare360_access_review_campaigns','angelcare360_access_review_decisions',
    'angelcare360_access_issues','angelcare360_access_tasks','angelcare360_access_notes','angelcare360_access_evidence_requests','angelcare360_access_topup_requests',
    'angelcare360_access_role_versions','angelcare360_sensitive_access_grants','angelcare360_temporary_access_grants','angelcare360_emergency_access_events',
    'angelcare360_area11_families','angelcare360_area11_family_memberships','angelcare360_area11_relationships','angelcare360_area11_portal_access',
    'angelcare360_area11_guardian_authorities','angelcare360_area11_pickup_authorities','angelcare360_area11_billing_responsibilities',
    'angelcare360_area11_households','angelcare360_area11_household_memberships','angelcare360_area11_verification_records',
    'angelcare360_area11_restrictions','angelcare360_area11_tasks','angelcare360_area11_notes','angelcare360_area11_emergency_contacts'
  ] loop
    if to_regclass('public.'||t) is not null then
      execute format('alter table public.%I enable row level security',t);
      execute format('alter table public.%I force row level security',t);
    end if;
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Atomic background-job claim.
-- ---------------------------------------------------------------------------
create or replace function public.angelcare360_claim_background_jobs(p_worker text,p_limit integer default 10)
returns setof public.angelcare360_background_jobs
language plpgsql security definer set search_path=public as $$
begin
  return query
  with claimed as (
    select id from public.angelcare360_background_jobs
    where state in ('queued','retrying') and run_after<=now()
    order by priority desc,created_at
    for update skip locked
    limit greatest(1,least(coalesce(p_limit,10),50))
  )
  update public.angelcare360_background_jobs j
     set state='running',locked_at=now(),locked_by=p_worker,attempt_count=j.attempt_count+1,updated_at=now()
    from claimed where j.id=claimed.id
  returning j.*;
end;$$;
revoke all on function public.angelcare360_claim_background_jobs(text,integer) from public,anon,authenticated;
grant execute on function public.angelcare360_claim_background_jobs(text,integer) to service_role;

-- ---------------------------------------------------------------------------
-- Atomic school role assignment. This replaces multi-step UI mutations for the critical path.
-- ---------------------------------------------------------------------------
create or replace function public.angelcare360_atomic_assign_role_v1(
  p_school_id uuid,p_actor_user_id uuid,p_target_user_id uuid,p_role_id uuid,p_scope_id uuid,
  p_starts_at timestamptz,p_ends_at timestamptz,p_reason text,p_idempotency_key text
) returns uuid
language plpgsql security definer set search_path=public as $$
declare v_id uuid; v_existing uuid;
begin
  if p_idempotency_key is null or length(trim(p_idempotency_key))<8 then raise exception 'IDEMPOTENCY_KEY_REQUIRED'; end if;
  select id into v_existing from public.angelcare360_enterprise_commands where school_id=p_school_id and idempotency_key=p_idempotency_key;
  if v_existing is not null then return v_existing; end if;
  if not exists(select 1 from public.angelcare360_schools where id=p_school_id and status='active') then raise exception 'SCHOOL_NOT_ACTIVE'; end if;
  if not exists(select 1 from public.angelcare360_roles where id=p_role_id and school_id=p_school_id and status='active') then raise exception 'ROLE_OUTSIDE_SCHOOL'; end if;
  if not exists(select 1 from public.app_users where id=p_target_user_id and status in ('active','invited','pending')) then raise exception 'TARGET_USER_NOT_ELIGIBLE'; end if;
  insert into public.angelcare360_enterprise_commands(school_id,actor_app_user_id,command_key,idempotency_key,resource_type,resource_id,state,started_at,request_json)
  values(p_school_id,p_actor_user_id,'access.role.assign',p_idempotency_key,'app_user',p_target_user_id,'executing',now(),jsonb_build_object('role_id',p_role_id,'scope_id',p_scope_id,'reason',p_reason)) returning id into v_id;
  insert into public.angelcare360_user_roles(school_id,app_user_id,role_id,access_scope_id,starts_at,ends_at,status,created_by,updated_by,metadata_json)
  values(p_school_id,p_target_user_id,p_role_id,p_scope_id,coalesce(p_starts_at,now()),p_ends_at,'active',p_actor_user_id,p_actor_user_id,jsonb_build_object('reason',p_reason,'command_id',v_id))
  on conflict(school_id,app_user_id,role_id) do update set access_scope_id=excluded.access_scope_id,starts_at=excluded.starts_at,ends_at=excluded.ends_at,status='active',updated_by=p_actor_user_id,updated_at=now(),metadata_json=excluded.metadata_json;
  insert into public.angelcare360_enterprise_audit_ledger(school_id,actor_app_user_id,action_key,resource_type,resource_id,after_json,reason,correlation_id)
  select p_school_id,p_actor_user_id,'access.role.assign','app_user',p_target_user_id,jsonb_build_object('role_id',p_role_id,'scope_id',p_scope_id),p_reason,correlation_id from public.angelcare360_enterprise_commands where id=v_id;
  update public.angelcare360_enterprise_commands set state='succeeded',completed_at=now(),updated_at=now(),result_json=jsonb_build_object('target_user_id',p_target_user_id,'role_id',p_role_id) where id=v_id;
  return v_id;
exception when others then
  if v_id is not null then update public.angelcare360_enterprise_commands set state='failed',failure_message=sqlerrm,completed_at=now(),updated_at=now() where id=v_id; end if;
  raise;
end;$$;
revoke all on function public.angelcare360_atomic_assign_role_v1(uuid,uuid,uuid,uuid,uuid,timestamptz,timestamptz,text,text) from public,anon,authenticated;
grant execute on function public.angelcare360_atomic_assign_role_v1(uuid,uuid,uuid,uuid,uuid,timestamptz,timestamptz,text,text) to service_role;

create or replace function public.angelcare360_atomic_end_user_access_v1(
  p_school_id uuid,p_actor_user_id uuid,p_target_user_id uuid,p_reason text,p_idempotency_key text
) returns uuid
language plpgsql security definer set search_path=public as $$
declare v_id uuid; v_existing uuid;
begin
  select id into v_existing from public.angelcare360_enterprise_commands where school_id=p_school_id and idempotency_key=p_idempotency_key;
  if v_existing is not null then return v_existing; end if;
  if not exists(select 1 from public.angelcare360_user_roles where school_id=p_school_id and app_user_id=p_target_user_id) then raise exception 'TARGET_OUTSIDE_SCHOOL'; end if;
  insert into public.angelcare360_enterprise_commands(school_id,actor_app_user_id,command_key,idempotency_key,resource_type,resource_id,state,started_at,request_json)
  values(p_school_id,p_actor_user_id,'access.user.end',p_idempotency_key,'app_user',p_target_user_id,'executing',now(),jsonb_build_object('reason',p_reason)) returning id into v_id;
  update public.app_users set status='inactive',updated_at=now() where id=p_target_user_id;
  update public.angelcare360_user_roles set status='revoked',ends_at=coalesce(ends_at,now()),updated_by=p_actor_user_id,updated_at=now() where school_id=p_school_id and app_user_id=p_target_user_id and status='active';
  delete from public.app_sessions where user_id=p_target_user_id;
  insert into public.angelcare360_enterprise_audit_ledger(school_id,actor_app_user_id,action_key,resource_type,resource_id,after_json,reason,correlation_id)
  select p_school_id,p_actor_user_id,'access.user.end','app_user',p_target_user_id,jsonb_build_object('status','inactive','sessions_revoked',true),p_reason,correlation_id from public.angelcare360_enterprise_commands where id=v_id;
  update public.angelcare360_enterprise_commands set state='succeeded',completed_at=now(),updated_at=now() where id=v_id;
  return v_id;
end;$$;
revoke all on function public.angelcare360_atomic_end_user_access_v1(uuid,uuid,uuid,text,text) from public,anon,authenticated;
grant execute on function public.angelcare360_atomic_end_user_access_v1(uuid,uuid,uuid,text,text) to service_role;

-- Atomic portal invitation acceptance. Password hashing happens application-side; only the hash crosses the RPC boundary.
create or replace function public.angelcare360_accept_portal_invitation_v1(
  p_token_digest text,p_password_hash text,p_username text,p_full_name text
) returns jsonb
language plpgsql security definer set search_path=public as $$
declare inv public.angelcare360_portal_invitations%rowtype; v_user_id uuid; v_role_id uuid; v_table text;
begin
  select * into inv from public.angelcare360_portal_invitations where token_digest=p_token_digest for update;
  if inv.id is null then raise exception 'INVITATION_NOT_FOUND'; end if;
  if inv.state not in ('prepared','smtp_accepted','opened') then raise exception 'INVITATION_NOT_ACCEPTABLE'; end if;
  if inv.expires_at<=now() then update public.angelcare360_portal_invitations set state='expired',updated_at=now() where id=inv.id; raise exception 'INVITATION_EXPIRED'; end if;
  if p_password_hash is null or length(p_password_hash)<20 then raise exception 'PASSWORD_HASH_REQUIRED'; end if;
  if exists(select 1 from public.app_users where lower(username)=lower(p_username)) then raise exception 'USERNAME_ALREADY_EXISTS'; end if;

  insert into public.app_users(full_name,username,password_hash,role,status,email,must_change_password,created_by)
  values(p_full_name,p_username,p_password_hash,case when inv.portal_kind='school_user' then 'staff' else inv.portal_kind end,'active',inv.email,false,inv.invited_by)
  returning id into v_user_id;

  if inv.role_id is not null then v_role_id:=inv.role_id;
  else
    select id into v_role_id from public.angelcare360_roles
    where school_id=inv.school_id and status='active' and lower(role_key)=lower(case when inv.portal_kind='school_user' then 'staff' else inv.portal_kind end)
    order by created_at limit 1;
  end if;
  if v_role_id is not null then
    insert into public.angelcare360_user_roles(school_id,app_user_id,role_id,starts_at,status,created_by,updated_by,metadata_json)
    values(inv.school_id,v_user_id,v_role_id,inv.starts_at,'active',inv.invited_by,inv.invited_by,jsonb_build_object('source','portal_invitation','invitation_id',inv.id))
    on conflict(school_id,app_user_id,role_id) do update set status='active',updated_at=now();
  end if;

  if inv.person_id is not null and inv.portal_kind<>'school_user' then
    v_table:=case inv.portal_kind when 'parent' then 'angelcare360_parents' when 'student' then 'angelcare360_students' else 'angelcare360_staff' end;
    execute format('update public.%I set portal_app_user_id=$1,updated_at=now() where id=$2 and school_id=$3 and status=''active''',v_table) using v_user_id,inv.person_id,inv.school_id;
    if not found then raise exception 'PORTAL_PROFILE_NOT_FOUND'; end if;
  end if;

  update public.angelcare360_portal_invitations set state='accepted',app_user_id=v_user_id,accepted_at=now(),updated_at=now() where id=inv.id;
  insert into public.angelcare360_enterprise_audit_ledger(school_id,actor_app_user_id,action_key,resource_type,resource_id,after_json,reason,metadata_json)
  values(inv.school_id,v_user_id,'portal.invitation.accept','app_user',v_user_id,jsonb_build_object('portal_kind',inv.portal_kind,'person_id',inv.person_id),'Activation par invitation',jsonb_build_object('invitation_id',inv.id));
  return jsonb_build_object('app_user_id',v_user_id,'school_id',inv.school_id,'portal_kind',inv.portal_kind);
end;$$;
revoke all on function public.angelcare360_accept_portal_invitation_v1(text,text,text,text) from public,anon,authenticated;
grant execute on function public.angelcare360_accept_portal_invitation_v1(text,text,text,text) to service_role;

commit;
