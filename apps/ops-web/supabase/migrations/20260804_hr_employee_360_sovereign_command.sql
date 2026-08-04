-- ANGELCARE HR Employee 360 Sovereign Command
-- P0 integrity + P1 lifecycle/domain completion + P2 product support.
-- Additive, idempotent and non-destructive.

begin;

create extension if not exists pgcrypto;

-- ------------------------------------------------------------------
-- Canonical employee authority hardening.
-- ------------------------------------------------------------------

create table if not exists public.hr_staff_profiles (
  id uuid primary key default gen_random_uuid(),
  full_name text not null default '',
  employment_status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.hr_staff_profiles
  add column if not exists full_name text not null default '',
  add column if not exists employment_status text not null default 'active',
  add column if not exists app_user_id uuid,
  add column if not exists status text not null default 'active',
  add column if not exists tenant_id text,
  add column if not exists organization_id text,
  add column if not exists first_name text,
  add column if not exists last_name text,
  add column if not exists preferred_name text,
  add column if not exists email text,
  add column if not exists phone text,
  add column if not exists national_id text,
  add column if not exists date_of_birth date,
  add column if not exists place_of_birth text,
  add column if not exists nationality text,
  add column if not exists gender text,
  add column if not exists marital_status text,
  add column if not exists children_count integer not null default 0,
  add column if not exists address text,
  add column if not exists city text,
  add column if not exists postal_code text,
  add column if not exists country text,
  add column if not exists branch_office text,
  add column if not exists work_city text,
  add column if not exists remote_option text,
  add column if not exists position text,
  add column if not exists department text,
  add column if not exists manager text,
  add column if not exists manager_user_id uuid,
  add column if not exists employment_type text,
  add column if not exists start_date date,
  add column if not exists hire_date date,
  add column if not exists probation_end_date date,
  add column if not exists contract_type text,
  add column if not exists salary numeric,
  add column if not exists currency text default 'MAD',
  add column if not exists payment_method text,
  add column if not exists cnss_number text,
  add column if not exists amo_number text,
  add column if not exists emergency_contact_name text,
  add column if not exists emergency_contact_phone text,
  add column if not exists emergency_contact_relation text,
  add column if not exists lifecycle_state text not null default 'active',
  add column if not exists confidentiality_level text not null default 'internal',
  add column if not exists archived_at timestamptz,
  add column if not exists archived_by uuid,
  add column if not exists archive_reason text,
  add column if not exists terminated_at timestamptz,
  add column if not exists termination_reason text,
  add column if not exists rehire_eligible boolean not null default true,
  add column if not exists version bigint not null default 1,
  add column if not exists source text,
  add column if not exists created_by uuid,
  add column if not exists updated_by uuid,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

update public.hr_staff_profiles
set
  lifecycle_state = case
    when lower(coalesce(employment_status, '')) in ('archived', 'inactive') then 'archived'
    when lower(coalesce(employment_status, '')) in ('terminated', 'ended') then 'terminated'
    when lower(coalesce(employment_status, '')) in ('probation', 'trial') then 'probation'
    when lower(coalesce(employment_status, '')) in ('draft') then 'draft'
    else coalesce(nullif(lifecycle_state, ''), 'active')
  end,
  full_name = coalesce(nullif(full_name, ''), trim(concat_ws(' ', first_name, last_name)), email, 'Collaborateur'),
  version = greatest(coalesce(version, 1), 1)
where lifecycle_state is null
   or lifecycle_state = ''
   or full_name is null
   or full_name = ''
   or version is null;

-- ------------------------------------------------------------------
-- Canonical lifecycle and audit evidence.
-- ------------------------------------------------------------------

create table if not exists public.hr_employee_lifecycle_events (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.hr_staff_profiles(id) on delete restrict,
  tenant_id text,
  organization_id text,
  from_state text,
  to_state text not null,
  effective_at timestamptz not null default now(),
  reason text not null,
  actor_id uuid,
  actor_name text,
  employee_version bigint not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.hr_employee_360_audit_events (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.hr_staff_profiles(id) on delete restrict,
  tenant_id text,
  organization_id text,
  event_type text not null,
  domain text not null default 'employee',
  action text not null,
  title text not null,
  summary text,
  actor_id uuid,
  actor_name text,
  risk_level text not null default 'normal',
  before_state jsonb not null default '{}'::jsonb,
  after_state jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  correlation_id uuid not null default gen_random_uuid(),
  created_at timestamptz not null default now()
);

create table if not exists public.hr_employee_cases (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.hr_staff_profiles(id) on delete restrict,
  tenant_id text,
  organization_id text,
  case_type text not null default 'internal_note',
  domain text not null default 'employee',
  title text not null,
  description text,
  status text not null default 'open',
  priority text not null default 'medium',
  owner_id uuid,
  owner_name text,
  due_at timestamptz,
  source_entity_type text,
  source_entity_id uuid,
  resolution text,
  resolved_at timestamptz,
  archived_at timestamptz,
  archived_by uuid,
  version bigint not null default 1,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hr_employee_360_idempotency (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  employee_id uuid not null references public.hr_staff_profiles(id) on delete cascade,
  idempotency_key text not null,
  request_hash text,
  response_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '24 hours'),
  unique (employee_id, idempotency_key)
);

-- ------------------------------------------------------------------
-- Native domain authorities. Existing tables are reused and extended.
-- ------------------------------------------------------------------

create table if not exists public.hr_leave_requests (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid,
  employee_name text,
  leave_type text,
  start_date date,
  end_date date,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hr_payroll_inputs (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid,
  period_start date,
  period_end date,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hr_roster_assignments (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid,
  title text,
  work_date date,
  status text not null default 'planned',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hr_documents (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid,
  employee_name text,
  title text not null default '',
  document_type text,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hr_contracts (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid,
  employee_name text,
  contract_type text,
  status text not null default 'draft',
  start_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hr_performance_reviews (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid,
  employee_name text,
  review_cycle text,
  status text not null default 'draft',
  score numeric,
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hr_training_records (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid,
  employee_name text,
  title text not null default '',
  status text not null default 'assigned',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hr_tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hr_approval_requests (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hr_incidents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hr_attendance_records (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid,
  employee_id uuid,
  work_date date,
  status text not null default 'recorded',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hr_attendance_corrections (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid,
  correction_type text not null default 'manual_correction',
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hr_onboarding_journeys (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid,
  title text not null default '',
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Consistent columns used by the Employee 360 orchestrator.
do $employee360$
declare
  table_name text;
begin
  foreach table_name in array array[
    'hr_leave_requests',
    'hr_payroll_inputs',
    'hr_roster_assignments',
    'hr_documents',
    'hr_contracts',
    'hr_performance_reviews',
    'hr_training_records',
    'hr_attendance_records',
    'hr_attendance_corrections',
    'hr_onboarding_journeys'
  ] loop
    execute format('alter table public.%I add column if not exists tenant_id text', table_name);
    execute format('alter table public.%I add column if not exists organization_id text', table_name);
    execute format('alter table public.%I add column if not exists employee_id uuid', table_name);
    execute format('alter table public.%I add column if not exists archived_at timestamptz', table_name);
    execute format('alter table public.%I add column if not exists archived_by uuid', table_name);
    execute format('alter table public.%I add column if not exists version bigint not null default 1', table_name);
    execute format('alter table public.%I add column if not exists metadata jsonb not null default ''{}''::jsonb', table_name);
    execute format('alter table public.%I add column if not exists created_by uuid', table_name);
    execute format('alter table public.%I add column if not exists updated_by uuid', table_name);
    execute format('alter table public.%I add column if not exists created_at timestamptz not null default now()', table_name);
    execute format('alter table public.%I add column if not exists updated_at timestamptz not null default now()', table_name);
  end loop;
end;
$employee360$;

alter table public.hr_leave_requests
  add column if not exists reason text,
  add column if not exists notes text,
  add column if not exists priority text default 'medium',
  add column if not exists approved_by text,
  add column if not exists decision_at timestamptz;

alter table public.hr_payroll_inputs
  add column if not exists title text,
  add column if not exists input_type text default 'adjustment',
  add column if not exists amount numeric,
  add column if not exists currency text default 'MAD',
  add column if not exists reason text,
  add column if not exists notes text,
  add column if not exists approved_by uuid,
  add column if not exists approved_at timestamptz;

alter table public.hr_roster_assignments
  add column if not exists staff_name text,
  add column if not exists department text,
  add column if not exists location text,
  add column if not exists start_time time,
  add column if not exists end_time time,
  add column if not exists shift_type text default 'standard',
  add column if not exists priority text default 'medium',
  add column if not exists notes text;

alter table public.hr_documents
  add column if not exists file_url text,
  add column if not exists storage_bucket text,
  add column if not exists storage_path text,
  add column if not exists content_hash text,
  add column if not exists uploaded_by uuid,
  add column if not exists uploaded_at timestamptz,
  add column if not exists validated_by uuid,
  add column if not exists validated_at timestamptz,
  add column if not exists rejected_reason text,
  add column if not exists file_name text,
  add column if not exists file_size bigint,
  add column if not exists mime_type text,
  add column if not exists expiry_date date,
  add column if not exists owner text,
  add column if not exists signature_status text,
  add column if not exists compliance_status text,
  add column if not exists notes text;

alter table public.hr_contracts
  add column if not exists title text,
  add column if not exists type text,
  add column if not exists end_date date,
  add column if not exists probation_end_date date,
  add column if not exists salary numeric,
  add column if not exists currency text default 'MAD',
  add column if not exists signed_at timestamptz,
  add column if not exists document_id uuid,
  add column if not exists notes text;

alter table public.hr_performance_reviews
  add column if not exists title text,
  add column if not exists reviewer_id uuid,
  add column if not exists stage text default 'draft',
  add column if not exists due_at timestamptz,
  add column if not exists strengths text,
  add column if not exists improvements text,
  add column if not exists action_plan text,
  add column if not exists notes text;

alter table public.hr_training_records
  add column if not exists training_id uuid,
  add column if not exists training_title text,
  add column if not exists category text,
  add column if not exists progress_percent integer default 0,
  add column if not exists assigned_at timestamptz,
  add column if not exists due_at timestamptz,
  add column if not exists completed_at timestamptz,
  add column if not exists priority text default 'medium',
  add column if not exists notes text;

alter table public.hr_attendance_records
  add column if not exists tenant_id text,
  add column if not exists organization_id text,
  add column if not exists profile_id uuid,
  add column if not exists attendance_date date,
  add column if not exists check_in timestamptz,
  add column if not exists check_out timestamptz,
  add column if not exists anomaly_type text,
  add column if not exists notes text,
  add column if not exists archived_at timestamptz,
  add column if not exists archived_by uuid,
  add column if not exists version bigint not null default 1,
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists created_by uuid,
  add column if not exists updated_by uuid;

alter table public.hr_attendance_corrections
  add column if not exists attendance_id uuid,
  add column if not exists requested_by uuid,
  add column if not exists approved_by uuid,
  add column if not exists original_value jsonb not null default '{}'::jsonb,
  add column if not exists requested_value jsonb not null default '{}'::jsonb,
  add column if not exists reason text,
  add column if not exists stage text not null default 'requested',
  add column if not exists approved_at timestamptz,
  add column if not exists rejected_at timestamptz,
  add column if not exists notes text;

alter table public.hr_onboarding_journeys
  add column if not exists position text,
  add column if not exists department text,
  add column if not exists start_date date,
  add column if not exists progress numeric not null default 0,
  add column if not exists owner text,
  add column if not exists notes text;

alter table public.hr_tasks
  add column if not exists tenant_id text,
  add column if not exists organization_id text,
  add column if not exists employee_id uuid,
  add column if not exists staff_id uuid,
  add column if not exists task_type text default 'employee_action',
  add column if not exists priority text default 'medium',
  add column if not exists due_date date,
  add column if not exists due_at timestamptz,
  add column if not exists owner text,
  add column if not exists assigned_to uuid,
  add column if not exists related_module text default 'employee360',
  add column if not exists related_record_id text,
  add column if not exists description text,
  add column if not exists outcome text,
  add column if not exists archived_at timestamptz,
  add column if not exists version bigint not null default 1,
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists created_by uuid,
  add column if not exists updated_by uuid;

alter table public.hr_approval_requests
  add column if not exists tenant_id text,
  add column if not exists organization_id text,
  add column if not exists employee_id uuid,
  add column if not exists staff_id uuid,
  add column if not exists request_type text,
  add column if not exists entity_type text,
  add column if not exists entity_id uuid,
  add column if not exists requester_name text,
  add column if not exists approver_name text,
  add column if not exists priority text default 'medium',
  add column if not exists decision_notes text,
  add column if not exists decided_at timestamptz,
  add column if not exists archived_at timestamptz,
  add column if not exists version bigint not null default 1,
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists created_by uuid,
  add column if not exists updated_by uuid;

alter table public.hr_incidents
  add column if not exists tenant_id text,
  add column if not exists organization_id text,
  add column if not exists employee_id uuid,
  add column if not exists staff_id uuid,
  add column if not exists incident_type text,
  add column if not exists severity text default 'medium',
  add column if not exists priority text default 'medium',
  add column if not exists occurred_at timestamptz,
  add column if not exists due_at timestamptz,
  add column if not exists description text,
  add column if not exists resolution text,
  add column if not exists owner text,
  add column if not exists archived_at timestamptz,
  add column if not exists version bigint not null default 1,
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists created_by uuid,
  add column if not exists updated_by uuid;

-- Validation columns used by controlled domain validation.
do $validation_columns$
declare
  table_name text;
begin
  foreach table_name in array array[
    'hr_leave_requests',
    'hr_payroll_inputs',
    'hr_roster_assignments',
    'hr_documents',
    'hr_contracts',
    'hr_performance_reviews',
    'hr_training_records',
    'hr_attendance_corrections',
    'hr_onboarding_journeys',
    'hr_tasks',
    'hr_approval_requests',
    'hr_incidents'
  ] loop
    execute format('alter table public.%I add column if not exists approved_by uuid', table_name);
    execute format('alter table public.%I add column if not exists approved_at timestamptz', table_name);
    execute format('alter table public.%I add column if not exists decided_at timestamptz', table_name);
  end loop;
end;
$validation_columns$;

-- Private storage authority for Employee 360 documents.
insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'hr-employee-documents',
  'hr-employee-documents',
  false,
  15728640,
  array[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- ------------------------------------------------------------------
-- Version and timestamp triggers.
-- ------------------------------------------------------------------

create or replace function public.hr_employee360_touch_row()
returns trigger
language plpgsql
as $function$
begin
  new.updated_at = now();
  if to_jsonb(new) ? 'version' then
    new.version = greatest(coalesce(old.version, 0) + 1, 1);
  end if;
  return new;
end;
$function$;

create or replace function public.hr_employee360_touch_profile()
returns trigger
language plpgsql
as $function$
begin
  new.updated_at = now();
  new.version = greatest(coalesce(old.version, 0) + 1, 1);
  return new;
end;
$function$;

drop trigger if exists hr_employee360_touch_profile on public.hr_staff_profiles;
create trigger hr_employee360_touch_profile
before update on public.hr_staff_profiles
for each row execute function public.hr_employee360_touch_profile();

do $triggers$
declare
  table_name text;
begin
  foreach table_name in array array[
    'hr_leave_requests',
    'hr_payroll_inputs',
    'hr_roster_assignments',
    'hr_documents',
    'hr_contracts',
    'hr_performance_reviews',
    'hr_training_records',
    'hr_attendance_records',
    'hr_attendance_corrections',
    'hr_onboarding_journeys',
    'hr_tasks',
    'hr_approval_requests',
    'hr_incidents',
    'hr_employee_cases'
  ] loop
    execute format('drop trigger if exists hr_employee360_touch on public.%I', table_name);
    execute format('create trigger hr_employee360_touch before update on public.%I for each row execute function public.hr_employee360_touch_row()', table_name);
  end loop;
end;
$triggers$;

-- ------------------------------------------------------------------
-- Legacy Employee 360 workspace backfill when structured JSON exists.
-- Suggested/template rows are not backfilled as completed domain facts.
-- ------------------------------------------------------------------

do $backfill$
declare
  has_metadata boolean;
  has_data boolean;
  has_top_workspace boolean;
begin
  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'hr_staff_profiles' and column_name = 'metadata'
  ) into has_metadata;
  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'hr_staff_profiles' and column_name = 'data'
  ) into has_data;
  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'hr_staff_profiles' and column_name = 'hr_management_workspace'
  ) into has_top_workspace;

  if has_metadata then
    execute $sql$
      insert into public.hr_employee_cases (
        employee_id, tenant_id, organization_id, case_type, domain, title,
        description, status, priority, due_at, metadata, created_at, updated_at
      )
      select
        staff.id,
        staff.tenant_id,
        staff.organization_id,
        'legacy_employee360_case',
        coalesce(nullif(item->>'category', ''), 'employee'),
        coalesce(nullif(item->>'title', ''), 'Cas RH migré'),
        coalesce(item->>'notes', item->>'description'),
        coalesce(nullif(item->>'status', ''), 'open'),
        coalesce(nullif(item->>'priority', ''), 'medium'),
        nullif(item->>'due_date', '')::timestamptz,
        jsonb_build_object('legacy', true, 'source', 'metadata.hr_management_workspace', 'payload', item),
        coalesce(nullif(item->>'created_at', '')::timestamptz, now()),
        coalesce(nullif(item->>'updated_at', '')::timestamptz, now())
      from public.hr_staff_profiles staff
      cross join lateral jsonb_array_elements(coalesce(staff.metadata->'hr_management_workspace', '[]'::jsonb)) item
      where jsonb_typeof(coalesce(staff.metadata->'hr_management_workspace', '[]'::jsonb)) = 'array'
        and not exists (
          select 1 from public.hr_employee_cases existing
          where existing.employee_id = staff.id
            and existing.metadata->>'source' = 'metadata.hr_management_workspace'
            and existing.metadata->'payload'->>'id' = item->>'id'
        )
    $sql$;
  end if;

  if has_data then
    execute $sql$
      insert into public.hr_employee_cases (
        employee_id, tenant_id, organization_id, case_type, domain, title,
        description, status, priority, due_at, metadata, created_at, updated_at
      )
      select
        staff.id,
        staff.tenant_id,
        staff.organization_id,
        'legacy_employee360_case',
        coalesce(nullif(item->>'category', ''), 'employee'),
        coalesce(nullif(item->>'title', ''), 'Cas RH migré'),
        coalesce(item->>'notes', item->>'description'),
        coalesce(nullif(item->>'status', ''), 'open'),
        coalesce(nullif(item->>'priority', ''), 'medium'),
        nullif(item->>'due_date', '')::timestamptz,
        jsonb_build_object('legacy', true, 'source', 'data.hr_management_workspace', 'payload', item),
        coalesce(nullif(item->>'created_at', '')::timestamptz, now()),
        coalesce(nullif(item->>'updated_at', '')::timestamptz, now())
      from public.hr_staff_profiles staff
      cross join lateral jsonb_array_elements(coalesce(staff.data->'hr_management_workspace', '[]'::jsonb)) item
      where jsonb_typeof(coalesce(staff.data->'hr_management_workspace', '[]'::jsonb)) = 'array'
        and not exists (
          select 1 from public.hr_employee_cases existing
          where existing.employee_id = staff.id
            and existing.metadata->>'source' = 'data.hr_management_workspace'
            and existing.metadata->'payload'->>'id' = item->>'id'
        )
    $sql$;
  end if;

  if has_top_workspace then
    execute $sql$
      insert into public.hr_employee_cases (
        employee_id, tenant_id, organization_id, case_type, domain, title,
        description, status, priority, due_at, metadata, created_at, updated_at
      )
      select
        staff.id,
        staff.tenant_id,
        staff.organization_id,
        'legacy_employee360_case',
        coalesce(nullif(item->>'category', ''), 'employee'),
        coalesce(nullif(item->>'title', ''), 'Cas RH migré'),
        coalesce(item->>'notes', item->>'description'),
        coalesce(nullif(item->>'status', ''), 'open'),
        coalesce(nullif(item->>'priority', ''), 'medium'),
        nullif(item->>'due_date', '')::timestamptz,
        jsonb_build_object('legacy', true, 'source', 'hr_management_workspace', 'payload', item),
        coalesce(nullif(item->>'created_at', '')::timestamptz, now()),
        coalesce(nullif(item->>'updated_at', '')::timestamptz, now())
      from public.hr_staff_profiles staff
      cross join lateral jsonb_array_elements(coalesce(staff.hr_management_workspace, '[]'::jsonb)) item
      where jsonb_typeof(coalesce(staff.hr_management_workspace, '[]'::jsonb)) = 'array'
        and not exists (
          select 1 from public.hr_employee_cases existing
          where existing.employee_id = staff.id
            and existing.metadata->>'source' = 'hr_management_workspace'
            and existing.metadata->'payload'->>'id' = item->>'id'
        )
    $sql$;
  end if;
end;
$backfill$;

-- ------------------------------------------------------------------
-- Indexes and server-only security posture.
-- ------------------------------------------------------------------

create index if not exists hr_staff_profiles_scope_idx
  on public.hr_staff_profiles (tenant_id, organization_id, employment_status);
create index if not exists hr_staff_profiles_lifecycle_idx
  on public.hr_staff_profiles (lifecycle_state, archived_at);
create index if not exists hr_employee_lifecycle_employee_idx
  on public.hr_employee_lifecycle_events (employee_id, created_at desc);
create index if not exists hr_employee_360_audit_employee_idx
  on public.hr_employee_360_audit_events (employee_id, created_at desc);
create index if not exists hr_employee_360_audit_domain_idx
  on public.hr_employee_360_audit_events (domain, action, created_at desc);
create index if not exists hr_employee_cases_employee_idx
  on public.hr_employee_cases (employee_id, status, archived_at, updated_at desc);
create index if not exists hr_employee_360_idempotency_expiry_idx
  on public.hr_employee_360_idempotency (expires_at);

create index if not exists hr_leave_requests_employee360_idx
  on public.hr_leave_requests (staff_id, employee_id, status, archived_at);
create index if not exists hr_payroll_inputs_employee360_idx
  on public.hr_payroll_inputs (staff_id, employee_id, status, archived_at);
create index if not exists hr_roster_assignments_employee360_idx
  on public.hr_roster_assignments (staff_id, employee_id, work_date, archived_at);
create index if not exists hr_documents_employee360_idx
  on public.hr_documents (staff_id, employee_id, status, archived_at);
create index if not exists hr_contracts_employee360_idx
  on public.hr_contracts (staff_id, employee_id, status, archived_at);
create index if not exists hr_performance_reviews_employee360_idx
  on public.hr_performance_reviews (staff_id, employee_id, status, archived_at);
create index if not exists hr_training_records_employee360_idx
  on public.hr_training_records (staff_id, employee_id, status, archived_at);
create index if not exists hr_attendance_records_employee360_idx
  on public.hr_attendance_records (staff_id, employee_id, work_date, archived_at);
create index if not exists hr_attendance_corrections_employee360_idx
  on public.hr_attendance_corrections (staff_id, employee_id, status, archived_at);
create index if not exists hr_tasks_employee360_idx
  on public.hr_tasks (staff_id, employee_id, status, archived_at);
create index if not exists hr_approval_requests_employee360_idx
  on public.hr_approval_requests (staff_id, employee_id, status, archived_at);
create index if not exists hr_incidents_employee360_idx
  on public.hr_incidents (staff_id, employee_id, status, archived_at);

alter table public.hr_employee_lifecycle_events enable row level security;
alter table public.hr_employee_360_audit_events enable row level security;
alter table public.hr_employee_cases enable row level security;
alter table public.hr_employee_360_idempotency enable row level security;

comment on table public.hr_employee_360_audit_events is
  'Immutable server-written Employee 360 evidence. Service-role access only after explicit application authorization.';
comment on table public.hr_employee_cases is
  'Canonical employee-level notes, escalations and cases. Native HR domain facts remain in their own authority tables.';
comment on column public.hr_staff_profiles.version is
  'Optimistic concurrency version used by the Employee 360 command.';

commit;
