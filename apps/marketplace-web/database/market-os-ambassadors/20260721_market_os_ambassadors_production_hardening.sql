-- ANGELCARE Market OS Ambassadors — production hardening (additive)
-- Generated from the authoritative Ambassador source bundle.
-- Apply after the existing Ambassador module migrations.
-- This migration intentionally does not assign users to roles or guess tenant scope.

begin;

create extension if not exists pgcrypto;

-- Fail early when the required current module is not installed.
do $$
declare
  missing text[] := array[]::text[];
  table_name text;
begin
  foreach table_name in array array[
    'market_os_ambassadors',
    'market_os_ambassador_territories',
    'market_os_ambassador_missions',
    'market_os_ambassador_recruitment',
    'market_os_ambassador_onboarding',
    'market_os_ambassador_training',
    'market_os_ambassador_goals',
    'market_os_ambassador_incentives',
    'market_os_ambassador_reports',
    'market_os_ambassador_settings',
    'market_os_ambassador_audit_logs'
  ] loop
    if to_regclass('public.' || table_name) is null then
      missing := array_append(missing, table_name);
    end if;
  end loop;
  if cardinality(missing) > 0 then
    raise exception 'Ambassador production hardening prerequisites missing: %', array_to_string(missing, ', ');
  end if;
end $$;

-- Complete operational tables that existed in partial historical migrations.
create table if not exists public.market_os_ambassador_leads (
  id uuid primary key default gen_random_uuid(),
  ambassador_id uuid,
  lead_name text,
  parent_name text,
  email text,
  phone text,
  city text,
  region text,
  zone text,
  source text,
  lead_type text,
  segment text,
  status text not null default 'new',
  score numeric not null default 0,
  value_mad numeric not null default 0,
  territory_id uuid,
  next_followup_at timestamptz,
  qualified_at timestamptz,
  converted_at timestamptz,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  payload jsonb not null default '{}'::jsonb,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.market_os_ambassador_conversions (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid,
  lead_name text,
  parent_name text,
  ambassador_id uuid,
  ambassador_name text,
  territory_id uuid,
  city text,
  region text,
  offer_name text,
  value numeric not null default 0,
  currency text not null default 'MAD',
  status text not null default 'pending',
  validation_decision text,
  validation_note text,
  proof_id uuid,
  proof_url text,
  validated_by text,
  validated_at timestamptz,
  rejected_at timestamptz,
  paid_at timestamptz,
  score numeric not null default 0,
  idempotency_key text,
  metadata jsonb not null default '{}'::jsonb,
  payload jsonb not null default '{}'::jsonb,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.market_os_ambassador_proofs (
  id uuid primary key default gen_random_uuid(),
  ambassador_id uuid,
  mission_id uuid,
  title text not null,
  proof_url text,
  proof_type text,
  status text not null default 'submitted',
  review_note text,
  reviewed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  payload jsonb not null default '{}'::jsonb,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.market_os_ambassador_payouts (
  id uuid primary key default gen_random_uuid(),
  ambassador_id uuid,
  incentive_id uuid,
  amount_mad numeric not null default 0,
  currency text not null default 'MAD',
  status text not null default 'draft',
  period text,
  approval_note text,
  approved_at timestamptz,
  executed_at timestamptz,
  payment_reference text,
  paid_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  payload jsonb not null default '{}'::jsonb,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Authenticated actor scope and fail-closed RBAC.
create table if not exists public.market_os_ambassador_actor_roles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null references auth.users(id) on delete cascade,
  tenant_id text not null,
  organization_id text not null,
  role_key text not null,
  display_name text,
  status text not null default 'active' check (status in ('active','suspended','revoked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (auth_user_id, tenant_id, organization_id, role_key)
);

create table if not exists public.market_os_ambassador_role_permissions (
  role_key text not null,
  permission_key text not null,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (role_key, permission_key)
);

create table if not exists public.market_os_ambassador_idempotency (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null,
  organization_id text not null,
  operation text not null,
  idempotency_key text not null,
  actor_id uuid,
  request_hash text,
  result jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  expires_at timestamptz,
  unique (tenant_id, organization_id, operation, idempotency_key)
);

-- Normalized many-to-many mission assignments.
create table if not exists public.market_os_ambassador_mission_assignments (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null,
  organization_id text not null,
  mission_id uuid not null,
  ambassador_id uuid not null,
  assignment_role text not null default 'support' check (assignment_role in ('primary','support','observer')),
  status text not null default 'assigned' check (status in ('assigned','accepted','declined','completed','revoked')),
  assigned_by_actor_id uuid not null,
  assigned_at timestamptz not null default now(),
  accepted_at timestamptz,
  completed_at timestamptz,
  revoked_at timestamptz,
  idempotency_key text,
  metadata jsonb not null default '{}'::jsonb,
  created_by_actor_id uuid,
  updated_by_actor_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  unique (tenant_id, organization_id, mission_id, ambassador_id)
);

-- Normalized territory assignment history; rows are retained when superseded/revoked.
create table if not exists public.market_os_ambassador_territory_assignments (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null,
  organization_id text not null,
  ambassador_id uuid not null,
  territory_id uuid not null,
  assignment_type text not null default 'primary' check (assignment_type in ('primary','backup','temporary')),
  coverage_mode text,
  radius_km numeric,
  status text not null default 'pending' check (status in ('pending','approved','rejected','revoked')),
  external_assignment_key text,
  idempotency_key text not null,
  requested_by_actor_id uuid not null,
  decided_by_actor_id uuid,
  decision_note text,
  requested_at timestamptz not null default now(),
  decided_at timestamptz,
  valid_from timestamptz,
  valid_to timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_by_actor_id uuid,
  updated_by_actor_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  unique (tenant_id, organization_id, idempotency_key)
);

-- Add scope, actor and JSON extension columns without deleting or renaming legacy fields.
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'market_os_ambassadors', 'market_os_ambassador_territories',
    'market_os_ambassador_missions', 'market_os_ambassador_recruitment',
    'market_os_ambassador_leads', 'market_os_ambassador_conversions',
    'market_os_ambassador_onboarding', 'market_os_ambassador_training',
    'market_os_ambassador_goals', 'market_os_ambassador_incentives',
    'market_os_ambassador_proofs', 'market_os_ambassador_payouts',
    'market_os_ambassador_reports', 'market_os_ambassador_settings'
  ] loop
    execute format('alter table public.%I add column if not exists tenant_id text', table_name);
    execute format('alter table public.%I add column if not exists organization_id text', table_name);
    execute format('alter table public.%I add column if not exists created_by_actor_id uuid', table_name);
    execute format('alter table public.%I add column if not exists updated_by_actor_id uuid', table_name);
    execute format('alter table public.%I add column if not exists metadata jsonb not null default ''{}''::jsonb', table_name);
    execute format('alter table public.%I add column if not exists archived_at timestamptz', table_name);
    execute format('alter table public.%I add column if not exists created_at timestamptz not null default now()', table_name);
    execute format('alter table public.%I add column if not exists updated_at timestamptz not null default now()', table_name);
  end loop;
end $$;

alter table public.market_os_ambassadors add column if not exists normalized_email text;
alter table public.market_os_ambassadors add column if not exists normalized_phone text;
alter table public.market_os_ambassadors add column if not exists identity_hash text;
alter table public.market_os_ambassadors add column if not exists lifecycle_stage text;
alter table public.market_os_ambassadors add column if not exists payload jsonb not null default '{}'::jsonb;
alter table public.market_os_ambassadors add column if not exists name text;
alter table public.market_os_ambassadors add column if not exists display_name text;
alter table public.market_os_ambassadors add column if not exists title text;
alter table public.market_os_ambassadors add column if not exists profile_type text;
alter table public.market_os_ambassadors add column if not exists manager_id uuid;
alter table public.market_os_ambassadors add column if not exists manager_name text;

alter table public.market_os_ambassador_recruitment add column if not exists normalized_email text;
alter table public.market_os_ambassador_recruitment add column if not exists normalized_phone text;
alter table public.market_os_ambassador_recruitment add column if not exists identity_hash text;
alter table public.market_os_ambassador_recruitment add column if not exists ambassador_id uuid;
alter table public.market_os_ambassador_recruitment add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table public.market_os_ambassador_territories add column if not exists title text;
alter table public.market_os_ambassador_territories add column if not exists zone text;
alter table public.market_os_ambassador_territories add column if not exists assigned_owner text;
alter table public.market_os_ambassador_territories add column if not exists restrictions jsonb not null default '{}'::jsonb;

alter table public.market_os_ambassador_missions add column if not exists proof_required boolean not null default true;
alter table public.market_os_ambassador_missions add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.market_os_ambassador_missions add column if not exists payload jsonb not null default '{}'::jsonb;
alter table public.market_os_ambassador_missions add column if not exists assigned_ambassador_id uuid;
alter table public.market_os_ambassador_missions add column if not exists name text;
alter table public.market_os_ambassador_missions add column if not exists region text;
alter table public.market_os_ambassador_missions add column if not exists due_at timestamptz;
alter table public.market_os_ambassador_missions add column if not exists assigned_by text;

alter table public.market_os_ambassador_leads add column if not exists parent_name text;
alter table public.market_os_ambassador_leads add column if not exists email text;
alter table public.market_os_ambassador_leads add column if not exists phone text;
alter table public.market_os_ambassador_leads add column if not exists city text;
alter table public.market_os_ambassador_leads add column if not exists region text;
alter table public.market_os_ambassador_leads add column if not exists zone text;
alter table public.market_os_ambassador_leads add column if not exists lead_type text;
alter table public.market_os_ambassador_leads add column if not exists score numeric not null default 0;
alter table public.market_os_ambassador_leads add column if not exists territory_id uuid;
alter table public.market_os_ambassador_leads add column if not exists next_followup_at timestamptz;
alter table public.market_os_ambassador_leads add column if not exists qualified_at timestamptz;
alter table public.market_os_ambassador_leads add column if not exists converted_at timestamptz;
alter table public.market_os_ambassador_leads add column if not exists notes text;
alter table public.market_os_ambassador_leads add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.market_os_ambassador_leads add column if not exists payload jsonb not null default '{}'::jsonb;

alter table public.market_os_ambassador_conversions add column if not exists lead_id uuid;
alter table public.market_os_ambassador_conversions add column if not exists parent_name text;
alter table public.market_os_ambassador_conversions add column if not exists ambassador_name text;
alter table public.market_os_ambassador_conversions add column if not exists territory_id uuid;
alter table public.market_os_ambassador_conversions add column if not exists region text;
alter table public.market_os_ambassador_conversions add column if not exists proof_id uuid;
alter table public.market_os_ambassador_conversions add column if not exists proof_url text;
alter table public.market_os_ambassador_conversions add column if not exists validation_decision text;
alter table public.market_os_ambassador_conversions add column if not exists validation_note text;
alter table public.market_os_ambassador_conversions add column if not exists validated_by text;
alter table public.market_os_ambassador_conversions add column if not exists validated_by_actor_id uuid;
alter table public.market_os_ambassador_conversions add column if not exists validated_at timestamptz;
alter table public.market_os_ambassador_conversions add column if not exists rejected_at timestamptz;
alter table public.market_os_ambassador_conversions add column if not exists paid_at timestamptz;
alter table public.market_os_ambassador_conversions add column if not exists score numeric not null default 0;
alter table public.market_os_ambassador_conversions add column if not exists idempotency_key text;
alter table public.market_os_ambassador_conversions add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.market_os_ambassador_conversions add column if not exists payload jsonb not null default '{}'::jsonb;

alter table public.market_os_ambassador_training add column if not exists module_title text;
alter table public.market_os_ambassador_training add column if not exists completed_at timestamptz;
alter table public.market_os_ambassador_training add column if not exists payload jsonb not null default '{}'::jsonb;

alter table public.market_os_ambassador_incentives add column if not exists amount_mad numeric;
alter table public.market_os_ambassador_incentives add column if not exists proof_id uuid;
alter table public.market_os_ambassador_incentives add column if not exists conversion_id uuid;
alter table public.market_os_ambassador_incentives add column if not exists approved_by_actor_id uuid;
alter table public.market_os_ambassador_incentives add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.market_os_ambassador_incentives add column if not exists payload jsonb not null default '{}'::jsonb;

alter table public.market_os_ambassador_proofs add column if not exists proof_type text;
alter table public.market_os_ambassador_proofs add column if not exists review_note text;
alter table public.market_os_ambassador_proofs add column if not exists reviewed_by_actor_id uuid;
alter table public.market_os_ambassador_proofs add column if not exists reviewed_at timestamptz;
alter table public.market_os_ambassador_proofs add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.market_os_ambassador_proofs add column if not exists payload jsonb not null default '{}'::jsonb;

alter table public.market_os_ambassador_payouts add column if not exists incentive_id uuid;
alter table public.market_os_ambassador_payouts add column if not exists currency text not null default 'MAD';
alter table public.market_os_ambassador_payouts add column if not exists approval_note text;
alter table public.market_os_ambassador_payouts add column if not exists approved_by_actor_id uuid;
alter table public.market_os_ambassador_payouts add column if not exists approved_at timestamptz;
alter table public.market_os_ambassador_payouts add column if not exists executed_by_actor_id uuid;
alter table public.market_os_ambassador_payouts add column if not exists executed_at timestamptz;
alter table public.market_os_ambassador_payouts add column if not exists payment_reference text;
alter table public.market_os_ambassador_payouts add column if not exists paid_at timestamptz;
alter table public.market_os_ambassador_payouts add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.market_os_ambassador_payouts add column if not exists payload jsonb not null default '{}'::jsonb;

alter table public.market_os_ambassador_reports add column if not exists generated_by_actor_id uuid;
alter table public.market_os_ambassador_reports add column if not exists export_url text;
alter table public.market_os_ambassador_reports add column if not exists export_payload jsonb not null default '{}'::jsonb;

alter table public.market_os_ambassador_audit_logs add column if not exists tenant_id text;
alter table public.market_os_ambassador_audit_logs add column if not exists organization_id text;
alter table public.market_os_ambassador_audit_logs add column if not exists actor_id uuid;
alter table public.market_os_ambassador_audit_logs add column if not exists actor_role text;
alter table public.market_os_ambassador_audit_logs add column if not exists request_id text;
alter table public.market_os_ambassador_audit_logs add column if not exists ip_hash text;
alter table public.market_os_ambassador_audit_logs add column if not exists user_agent text;
alter table public.market_os_ambassador_audit_logs add column if not exists before_snapshot jsonb;
alter table public.market_os_ambassador_audit_logs add column if not exists after_snapshot jsonb;
alter table public.market_os_ambassador_audit_logs add column if not exists metadata jsonb not null default '{}'::jsonb;

-- Canonical normalization used by both database constraints and the TypeScript domain layer.
create or replace function public.market_os_ambassador_normalize_phone(raw_phone text)
returns text
language plpgsql
immutable
as $$
declare digits text;
begin
  digits := regexp_replace(coalesce(raw_phone, ''), '[^0-9]', '', 'g');
  if digits = '' then return null; end if;
  if digits like '212%' then return '+' || digits; end if;
  if digits like '0%' then return '+212' || substr(digits, 2); end if;
  return '+' || digits;
end $$;

create or replace function public.market_os_ambassador_identity_hash(raw_email text, raw_phone text)
returns text
language sql
immutable
as $$
  select case
    when nullif(lower(btrim(coalesce(raw_email, ''))), '') is not null
      then encode(digest('email:' || lower(btrim(raw_email)), 'sha256'), 'hex')
    when public.market_os_ambassador_normalize_phone(raw_phone) is not null
      then encode(digest('phone:' || public.market_os_ambassador_normalize_phone(raw_phone), 'sha256'), 'hex')
    else null
  end
$$;

create or replace function public.market_os_ambassador_set_identity()
returns trigger
language plpgsql
as $$
begin
  new.normalized_email := nullif(lower(btrim(coalesce(new.email, ''))), '');
  new.normalized_phone := public.market_os_ambassador_normalize_phone(new.phone);
  if tg_op = 'INSERT' or new.email is distinct from old.email or new.phone is distinct from old.phone
     or new.identity_hash is null then
    new.identity_hash := public.market_os_ambassador_identity_hash(new.email, new.phone);
  end if;
  return new;
end $$;

-- Preserve legacy duplicates deterministically while making all future writes unique by canonical identity.
do $$
declare table_name text;
begin
  foreach table_name in array array['market_os_ambassadors','market_os_ambassador_recruitment'] loop
    execute format($sql$
      with ranked as (
        select id,
               public.market_os_ambassador_identity_hash(email, phone) as base_hash,
               row_number() over (
                 partition by tenant_id, organization_id, public.market_os_ambassador_identity_hash(email, phone)
                 order by created_at nulls last, id
               ) as duplicate_rank
        from public.%I
        where public.market_os_ambassador_identity_hash(email, phone) is not null
      )
      update public.%I target
      set normalized_email = nullif(lower(btrim(coalesce(target.email, ''))), ''),
          normalized_phone = public.market_os_ambassador_normalize_phone(target.phone),
          identity_hash = case when ranked.duplicate_rank = 1 then ranked.base_hash else ranked.base_hash || ':legacy:' || target.id::text end
      from ranked
      where target.id = ranked.id
    $sql$, table_name, table_name);
  end loop;
end $$;

drop trigger if exists trg_market_os_ambassadors_identity on public.market_os_ambassadors;
create trigger trg_market_os_ambassadors_identity
before insert or update of email, phone, tenant_id, organization_id
on public.market_os_ambassadors
for each row execute function public.market_os_ambassador_set_identity();

drop trigger if exists trg_market_os_ambassador_recruitment_identity on public.market_os_ambassador_recruitment;
create trigger trg_market_os_ambassador_recruitment_identity
before insert or update of email, phone, tenant_id, organization_id
on public.market_os_ambassador_recruitment
for each row execute function public.market_os_ambassador_set_identity();

create unique index if not exists uq_market_os_ambassadors_scoped_identity
  on public.market_os_ambassadors(tenant_id, organization_id, identity_hash)
  where identity_hash is not null and archived_at is null;
create unique index if not exists uq_market_os_ambassador_recruitment_scoped_identity
  on public.market_os_ambassador_recruitment(tenant_id, organization_id, identity_hash)
  where identity_hash is not null and archived_at is null;
create unique index if not exists uq_market_os_ambassador_conversions_idempotency
  on public.market_os_ambassador_conversions(tenant_id, organization_id, idempotency_key)
  where idempotency_key is not null;
create unique index if not exists uq_market_os_ambassador_settings_scope
  on public.market_os_ambassador_settings(tenant_id, organization_id);
create unique index if not exists uq_market_os_ambassador_actor_active_scope
  on public.market_os_ambassador_actor_roles(auth_user_id, tenant_id, organization_id)
  where status = 'active';
create index if not exists idx_market_os_ambassador_mission_assignments_scope
  on public.market_os_ambassador_mission_assignments(tenant_id, organization_id, mission_id, status);
create index if not exists idx_market_os_ambassador_territory_assignments_scope
  on public.market_os_ambassador_territory_assignments(tenant_id, organization_id, ambassador_id, territory_id, status);
create unique index if not exists uq_market_os_ambassador_primary_territory_active
  on public.market_os_ambassador_territory_assignments(tenant_id, organization_id, ambassador_id)
  where assignment_type = 'primary' and status = 'approved' and valid_to is null and archived_at is null;

-- Controlled lifecycle transition guard. Same-state updates remain allowed.
create or replace function public.market_os_ambassador_guard_lifecycle()
returns trigger
language plpgsql
as $$
declare
  from_value text;
  to_value text;
  allowed text[];
begin
  if tg_table_name = 'market_os_ambassadors' then
    from_value := lower(replace(coalesce(old.lifecycle_stage, old.status, 'candidate'), '-', '_'));
    to_value := lower(replace(coalesce(new.lifecycle_stage, new.status, from_value), '-', '_'));
    new.lifecycle_stage := to_value;
  elsif tg_table_name = 'market_os_ambassador_recruitment' then
    from_value := lower(replace(coalesce(old.stage, 'sourced'), '-', '_'));
    to_value := lower(replace(coalesce(new.stage, from_value), '-', '_'));
    new.stage := to_value;
  else
    from_value := lower(replace(coalesce(old.status, ''), '-', '_'));
    to_value := lower(replace(coalesce(new.status, from_value), '-', '_'));
    new.status := to_value;
  end if;

  if from_value = to_value then return new; end if;

  if tg_table_name = 'market_os_ambassadors' then
    allowed := case from_value
      when 'candidate' then array['onboarding','rejected','archived']
      when 'onboarding' then array['active','suspended','archived']
      when 'active' then array['suspended','inactive','archived']
      when 'suspended' then array['active','inactive','archived']
      when 'inactive' then array['active','archived']
      when 'rejected' then array['archived'] else array['archived'] end;
  elsif tg_table_name = 'market_os_ambassador_recruitment' then
    allowed := case from_value
      when 'sourced' then array['screened','rejected','archived']
      when 'screened' then array['interview','rejected','archived']
      when 'interview' then array['approved','rejected','archived']
      when 'approved' then array['converted','rejected','archived']
      when 'rejected' then array['screened','archived'] else array['archived'] end;
  elsif tg_table_name = 'market_os_ambassador_missions' then
    allowed := case from_value
      when 'draft' then array['assigned','archived']
      when 'assigned' then array['accepted','in_progress','cancelled','archived']
      when 'accepted' then array['in_progress','cancelled','archived']
      when 'in_progress' then array['submitted','blocked','cancelled','archived']
      when 'blocked' then array['in_progress','cancelled','archived']
      when 'submitted' then array['approved','rejected','archived']
      when 'rejected' then array['in_progress','submitted','archived']
      when 'approved' then array['completed','archived'] else array['archived'] end;
  elsif tg_table_name = 'market_os_ambassador_leads' then
    allowed := case from_value
      when 'new' then array['contacted','qualified','lost','archived']
      when 'contacted' then array['follow_up','qualified','lost','archived']
      when 'follow_up' then array['contacted','qualified','lost','archived']
      when 'qualified' then array['converted','lost','archived']
      when 'lost' then array['follow_up','archived'] else array['archived'] end;
  elsif tg_table_name = 'market_os_ambassador_conversions' then
    allowed := case from_value
      when 'pending' then array['under_review','proof_requested','escalated','validated','rejected','archived']
      when 'under_review' then array['proof_requested','escalated','validated','rejected','archived']
      when 'proof_requested' then array['under_review','validated','rejected','archived']
      when 'escalated' then array['under_review','validated','rejected','archived']
      when 'validated' then array['paid','archived'] else array['archived'] end;
  elsif tg_table_name = 'market_os_ambassador_incentives' then
    allowed := case from_value when 'pending' then array['approved','rejected','archived'] when 'approved' then array['paid','rejected','archived'] else array['archived'] end;
  elsif tg_table_name = 'market_os_ambassador_proofs' then
    allowed := case from_value
      when 'submitted' then array['under_review','approved','rejected','revision_requested','archived']
      when 'under_review' then array['approved','rejected','revision_requested','archived']
      when 'revision_requested' then array['submitted','under_review','archived'] else array['archived'] end;
  elsif tg_table_name = 'market_os_ambassador_payouts' then
    allowed := case from_value
      when 'draft' then array['pending_approval','cancelled','archived']
      when 'pending_approval' then array['approved','rejected','cancelled','archived']
      when 'approved' then array['processing','paid','cancelled','archived']
      when 'processing' then array['paid','cancelled','archived'] else array['archived'] end;
  end if;

  if not (to_value = any(coalesce(allowed, array[]::text[]))) then
    raise exception 'Illegal Ambassador lifecycle transition on %: % -> %', tg_table_name, from_value, to_value using errcode = '23514';
  end if;
  return new;
end $$;

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'market_os_ambassadors','market_os_ambassador_recruitment','market_os_ambassador_missions',
    'market_os_ambassador_leads','market_os_ambassador_conversions','market_os_ambassador_incentives',
    'market_os_ambassador_proofs','market_os_ambassador_payouts'
  ] loop
    execute format('drop trigger if exists trg_%I_lifecycle on public.%I', table_name, table_name);
    execute format('create trigger trg_%I_lifecycle before update on public.%I for each row execute function public.market_os_ambassador_guard_lifecycle()', table_name, table_name);
  end loop;
end $$;

-- Actor permission helpers used by RLS and transactional RPCs.
create or replace function public.market_os_ambassador_actor_has_permission(
  p_actor_id uuid,
  p_permission text,
  p_tenant_id text,
  p_organization_id text
) returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.market_os_ambassador_actor_roles ar
    join public.market_os_ambassador_role_permissions rp on rp.role_key = ar.role_key and rp.enabled
    where ar.id = p_actor_id
      and ar.status = 'active'
      and ar.tenant_id = p_tenant_id
      and ar.organization_id = p_organization_id
      and (rp.permission_key = p_permission or rp.permission_key = '*')
  )
$$;

create or replace function public.market_os_ambassador_has_permission(
  p_permission text,
  p_tenant_id text,
  p_organization_id text
) returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.market_os_ambassador_actor_roles ar
    join public.market_os_ambassador_role_permissions rp on rp.role_key = ar.role_key and rp.enabled
    where ar.auth_user_id = auth.uid()
      and ar.status = 'active'
      and ar.tenant_id = p_tenant_id
      and ar.organization_id = p_organization_id
      and (rp.permission_key = p_permission or rp.permission_key = '*')
  )
$$;

revoke all on function public.market_os_ambassador_actor_has_permission(uuid,text,text,text) from public, anon, authenticated;
revoke all on function public.market_os_ambassador_has_permission(text,text,text) from public, anon;
grant execute on function public.market_os_ambassador_has_permission(text,text,text) to authenticated;

-- Transactional, idempotent candidate conversion.
create or replace function public.market_os_ambassador_convert_candidate(
  p_candidate_id text,
  p_actor_id uuid,
  p_tenant_id text,
  p_organization_id text,
  p_idempotency_key text
) returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  candidate_record public.market_os_ambassador_recruitment%rowtype;
  ambassador_record public.market_os_ambassadors%rowtype;
  existing_result jsonb;
  actor_name text;
begin
  if not public.market_os_ambassador_actor_has_permission(p_actor_id, 'recruitment.convert', p_tenant_id, p_organization_id) then
    raise exception 'Permission denied: recruitment.convert' using errcode = '42501';
  end if;
  if nullif(btrim(p_idempotency_key), '') is null then raise exception 'idempotency key is required'; end if;

  select result into existing_result
  from public.market_os_ambassador_idempotency
  where tenant_id = p_tenant_id and organization_id = p_organization_id
    and operation = 'candidate_conversion' and idempotency_key = p_idempotency_key;
  if existing_result is not null then return existing_result || jsonb_build_object('idempotent', true); end if;

  select * into candidate_record
  from public.market_os_ambassador_recruitment
  where id::text = p_candidate_id and tenant_id::text = p_tenant_id and organization_id::text = p_organization_id
    and archived_at is null
  for update;
  if not found then raise exception 'Candidate not found'; end if;
  if candidate_record.identity_hash is null then raise exception 'Candidate identity is required before conversion'; end if;
  if candidate_record.stage not in ('approved','converted') then raise exception 'Candidate must be approved before conversion'; end if;

  if candidate_record.ambassador_id is not null then
    select * into ambassador_record from public.market_os_ambassadors where id = candidate_record.ambassador_id;
  end if;
  if ambassador_record.id is null then
    select * into ambassador_record
    from public.market_os_ambassadors
    where tenant_id::text = p_tenant_id and organization_id::text = p_organization_id
      and identity_hash = candidate_record.identity_hash and archived_at is null
    order by created_at asc limit 1 for update;
  end if;

  if ambassador_record.id is null then
    insert into public.market_os_ambassadors (
      tenant_id, organization_id, full_name, email, phone, normalized_email, normalized_phone,
      identity_hash, city, region, source, status, lifecycle_stage, created_by_actor_id, updated_by_actor_id
    ) values (
      p_tenant_id, p_organization_id, candidate_record.candidate_name, candidate_record.email, candidate_record.phone,
      candidate_record.normalized_email, candidate_record.normalized_phone, candidate_record.identity_hash,
      candidate_record.city, candidate_record.region, candidate_record.source, 'onboarding', 'onboarding', p_actor_id, p_actor_id
    ) returning * into ambassador_record;
  end if;

  update public.market_os_ambassador_recruitment
  set stage = 'converted', ambassador_id = ambassador_record.id, updated_by_actor_id = p_actor_id, updated_at = now()
  where id = candidate_record.id
  returning * into candidate_record;

  select coalesce(display_name, auth_user_id::text) into actor_name
  from public.market_os_ambassador_actor_roles where id = p_actor_id;

  insert into public.market_os_ambassador_audit_logs (
    tenant_id, organization_id, entity_type, entity_id, action, summary, actor_id, actor_name,
    actor_role, request_id, payload, before_snapshot, after_snapshot, created_at
  ) select p_tenant_id, p_organization_id, 'recruitment', candidate_record.id::text,
    'candidate_converted', 'Converted approved candidate to Ambassador', p_actor_id, actor_name,
    role_key, p_idempotency_key,
    jsonb_build_object('ambassador_id', ambassador_record.id), to_jsonb(candidate_record), to_jsonb(ambassador_record), now()
  from public.market_os_ambassador_actor_roles where id = p_actor_id;

  existing_result := jsonb_build_object('candidate', to_jsonb(candidate_record), 'ambassador', to_jsonb(ambassador_record), 'idempotent', false);
  insert into public.market_os_ambassador_idempotency (tenant_id, organization_id, operation, idempotency_key, actor_id, result)
  values (p_tenant_id, p_organization_id, 'candidate_conversion', p_idempotency_key, p_actor_id, existing_result)
  on conflict (tenant_id, organization_id, operation, idempotency_key) do nothing;
  return existing_result;
end $$;

-- Transactional proof/reward/approval/payout gate.
create or replace function public.market_os_ambassador_decide_incentive(
  p_incentive_id text,
  p_decision text,
  p_actor_id uuid,
  p_tenant_id text,
  p_organization_id text,
  p_reason text,
  p_payment_reference text,
  p_idempotency_key text
) returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  incentive_record public.market_os_ambassador_incentives%rowtype;
  payout_record public.market_os_ambassador_payouts%rowtype;
  existing_result jsonb;
  required_permission text;
  gate_ok boolean;
begin
  if p_decision not in ('approved','rejected','paid') then raise exception 'Unsupported incentive decision'; end if;
  required_permission := case when p_decision = 'paid' then 'payouts.execute' else 'rewards.approve' end;
  if not public.market_os_ambassador_actor_has_permission(p_actor_id, required_permission, p_tenant_id, p_organization_id) then
    raise exception 'Permission denied: %', required_permission using errcode = '42501';
  end if;

  select result into existing_result from public.market_os_ambassador_idempotency
  where tenant_id = p_tenant_id and organization_id = p_organization_id
    and operation = 'incentive_decision' and idempotency_key = p_idempotency_key;
  if existing_result is not null then return existing_result || jsonb_build_object('idempotent', true); end if;

  select * into incentive_record from public.market_os_ambassador_incentives
  where id::text = p_incentive_id and tenant_id::text = p_tenant_id and organization_id::text = p_organization_id
    and archived_at is null
  for update;
  if not found then raise exception 'Incentive not found'; end if;

  if p_decision = 'approved' then
    select (
      (incentive_record.proof_id is not null and exists (
        select 1 from public.market_os_ambassador_proofs p
        where p.id = incentive_record.proof_id and p.status = 'approved'
          and p.tenant_id::text = p_tenant_id and p.organization_id::text = p_organization_id
      )) or
      (incentive_record.conversion_id is not null and exists (
        select 1 from public.market_os_ambassador_conversions c
        where c.id = incentive_record.conversion_id and c.status in ('validated','paid')
          and c.tenant_id::text = p_tenant_id and c.organization_id::text = p_organization_id
      ))
    ) into gate_ok;
    if not coalesce(gate_ok, false) then raise exception 'Reward approval requires an approved proof or validated conversion'; end if;
  end if;

  if p_decision = 'paid' and incentive_record.status <> 'approved' then
    raise exception 'Only an approved reward can be paid';
  end if;
  if p_decision in ('rejected','paid') and nullif(btrim(coalesce(p_reason, '')), '') is null and p_decision = 'rejected' then
    raise exception 'A rejection reason is required';
  end if;
  if p_decision = 'paid' and nullif(btrim(coalesce(p_payment_reference, '')), '') is null then
    raise exception 'A payment reference is required';
  end if;

  update public.market_os_ambassador_incentives
  set status = p_decision,
      approved_by = case when p_decision = 'approved' then coalesce(approved_by, p_actor_id::text) else approved_by end,
      approved_by_actor_id = case when p_decision = 'approved' then p_actor_id else approved_by_actor_id end,
      approved_at = case when p_decision = 'approved' then now() else approved_at end,
      paid_at = case when p_decision = 'paid' then now() else paid_at end,
      updated_by_actor_id = p_actor_id,
      updated_at = now()
  where id = incentive_record.id returning * into incentive_record;

  if p_decision = 'paid' then
    insert into public.market_os_ambassador_payouts (
      tenant_id, organization_id, ambassador_id, incentive_id, amount_mad, currency, status,
      approval_note, approved_by_actor_id, approved_at, executed_by_actor_id, executed_at,
      payment_reference, paid_at, created_by_actor_id, updated_by_actor_id
    ) values (
      p_tenant_id, p_organization_id, incentive_record.ambassador_id, incentive_record.id,
      coalesce(incentive_record.amount_mad, incentive_record.amount, 0), coalesce(incentive_record.currency, 'MAD'), 'paid',
      p_reason, coalesce(incentive_record.approved_by_actor_id, p_actor_id), coalesce(incentive_record.approved_at, now()),
      p_actor_id, now(), p_payment_reference, now(), p_actor_id, p_actor_id
    ) returning * into payout_record;
  end if;

  insert into public.market_os_ambassador_audit_logs (
    tenant_id, organization_id, entity_type, entity_id, action, summary, actor_id, actor_name,
    actor_role, request_id, payload, before_snapshot, after_snapshot, created_at
  ) select p_tenant_id, p_organization_id, 'incentives', incentive_record.id::text,
    'incentive_' || p_decision, 'Incentive decision: ' || p_decision, p_actor_id,
    coalesce(display_name, auth_user_id::text), role_key, p_idempotency_key,
    jsonb_build_object('reason', p_reason, 'payment_reference', p_payment_reference, 'payout_id', payout_record.id),
    null, to_jsonb(incentive_record), now()
  from public.market_os_ambassador_actor_roles where id = p_actor_id;

  existing_result := jsonb_build_object('incentive', to_jsonb(incentive_record), 'payout', case when payout_record.id is null then null else to_jsonb(payout_record) end, 'idempotent', false);
  insert into public.market_os_ambassador_idempotency (tenant_id, organization_id, operation, idempotency_key, actor_id, result)
  values (p_tenant_id, p_organization_id, 'incentive_decision', p_idempotency_key, p_actor_id, existing_result)
  on conflict (tenant_id, organization_id, operation, idempotency_key) do nothing;
  return existing_result;
end $$;

revoke all on function public.market_os_ambassador_convert_candidate(text,uuid,text,text,text) from public, anon, authenticated;
revoke all on function public.market_os_ambassador_decide_incentive(text,text,uuid,text,text,text,text,text) from public, anon, authenticated;
grant execute on function public.market_os_ambassador_convert_candidate(text,uuid,text,text,text) to service_role;
grant execute on function public.market_os_ambassador_decide_incentive(text,text,uuid,text,text,text,text,text) to service_role;

-- Seed canonical role-to-permission contracts. User membership remains an explicit deployment action.
insert into public.market_os_ambassador_role_permissions(role_key, permission_key, enabled)
select role_key, permission_key, true
from (values
  ('ambassador_admin','*'),
  ('market_manager','ambassadors.read'),('market_manager','ambassadors.write'),('market_manager','ambassadors.archive'),
  ('market_manager','territories.read'),('market_manager','territories.write'),('market_manager','territories.assign'),('market_manager','territories.approve'),
  ('market_manager','missions.read'),('market_manager','missions.write'),('market_manager','missions.assign'),('market_manager','missions.transition'),
  ('market_manager','recruitment.read'),('market_manager','recruitment.write'),('market_manager','recruitment.transition'),('market_manager','recruitment.convert'),
  ('market_manager','leads.read'),('market_manager','leads.write'),('market_manager','leads.transition'),
  ('market_manager','conversions.read'),('market_manager','conversions.write'),('market_manager','conversions.review'),
  ('market_manager','onboarding.read'),('market_manager','onboarding.write'),('market_manager','training.read'),('market_manager','training.write'),
  ('market_manager','goals.read'),('market_manager','goals.write'),('market_manager','proofs.read'),('market_manager','proofs.submit'),
  ('market_manager','rewards.read'),('market_manager','rewards.write'),('market_manager','reports.read'),('market_manager','reports.generate'),
  ('market_manager','settings.read'),('market_manager','audit.read'),
  ('recruiter','ambassadors.read'),('recruiter','recruitment.read'),('recruiter','recruitment.write'),('recruiter','recruitment.transition'),('recruiter','recruitment.convert'),
  ('field_manager','ambassadors.read'),('field_manager','territories.read'),('field_manager','territories.assign'),('field_manager','territories.approve'),
  ('field_manager','missions.read'),('field_manager','missions.write'),('field_manager','missions.assign'),('field_manager','missions.transition'),
  ('field_manager','leads.read'),('field_manager','leads.write'),('field_manager','leads.transition'),('field_manager','proofs.read'),('field_manager','proofs.submit'),
  ('compliance','ambassadors.read'),('compliance','missions.read'),('compliance','leads.read'),('compliance','conversions.read'),('compliance','conversions.review'),
  ('compliance','proofs.read'),('compliance','proofs.review'),('compliance','rewards.read'),('compliance','audit.read'),
  ('finance','ambassadors.read'),('finance','conversions.read'),('finance','proofs.read'),('finance','rewards.read'),('finance','rewards.approve'),
  ('finance','payouts.read'),('finance','payouts.approve'),('finance','payouts.execute'),('finance','reports.read'),('finance','reports.generate'),('finance','audit.read'),
  ('viewer','ambassadors.read'),('viewer','territories.read'),('viewer','missions.read'),('viewer','recruitment.read'),('viewer','leads.read'),
  ('viewer','conversions.read'),('viewer','onboarding.read'),('viewer','training.read'),('viewer','goals.read'),('viewer','proofs.read'),
  ('viewer','rewards.read'),('viewer','payouts.read'),('viewer','reports.read')
) as permissions(role_key, permission_key)
on conflict (role_key, permission_key) do update set enabled = excluded.enabled, updated_at = now();

-- Immutable audit rows.
create or replace function public.market_os_ambassador_block_audit_mutation()
returns trigger language plpgsql as $$
begin
  raise exception 'Ambassador audit records are immutable' using errcode = '42501';
end $$;

drop trigger if exists trg_market_os_ambassador_audit_immutable on public.market_os_ambassador_audit_logs;
create trigger trg_market_os_ambassador_audit_immutable
before update or delete on public.market_os_ambassador_audit_logs
for each row execute function public.market_os_ambassador_block_audit_mutation();

-- Scoped, fail-closed RLS. Service-role server operations still bypass RLS.
alter table public.market_os_ambassador_actor_roles enable row level security;
alter table public.market_os_ambassador_role_permissions enable row level security;
alter table public.market_os_ambassador_idempotency enable row level security;

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'market_os_ambassadors','market_os_ambassador_territories','market_os_ambassador_missions',
    'market_os_ambassador_recruitment','market_os_ambassador_leads','market_os_ambassador_conversions',
    'market_os_ambassador_onboarding','market_os_ambassador_training','market_os_ambassador_goals',
    'market_os_ambassador_incentives','market_os_ambassador_proofs','market_os_ambassador_payouts',
    'market_os_ambassador_reports','market_os_ambassador_settings','market_os_ambassador_audit_logs',
    'market_os_ambassador_mission_assignments','market_os_ambassador_territory_assignments'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_authenticated_all', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_authenticated_select', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_authenticated_insert', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_authenticated_update', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_authenticated_delete', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_scoped_select', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_scoped_insert', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_scoped_update', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_scoped_delete', table_name);
  end loop;
end $$;

-- Dedicated policies are explicit so every table has a bounded permission surface.
do $$
declare
  item record;
begin
  for item in select * from (values
    ('market_os_ambassadors','ambassadors.read','ambassadors.write','ambassadors.archive'),
    ('market_os_ambassador_territories','territories.read','territories.write','territories.write'),
    ('market_os_ambassador_missions','missions.read','missions.write','missions.write'),
    ('market_os_ambassador_recruitment','recruitment.read','recruitment.write','recruitment.write'),
    ('market_os_ambassador_leads','leads.read','leads.write','leads.write'),
    ('market_os_ambassador_conversions','conversions.read','conversions.write','conversions.write'),
    ('market_os_ambassador_onboarding','onboarding.read','onboarding.write','onboarding.write'),
    ('market_os_ambassador_training','training.read','training.write','training.write'),
    ('market_os_ambassador_goals','goals.read','goals.write','goals.write'),
    ('market_os_ambassador_incentives','rewards.read','rewards.write','rewards.write'),
    ('market_os_ambassador_proofs','proofs.read','proofs.submit','proofs.submit'),
    ('market_os_ambassador_payouts','payouts.read','payouts.approve','payouts.approve'),
    ('market_os_ambassador_reports','reports.read','reports.generate','reports.generate'),
    ('market_os_ambassador_settings','settings.read','settings.write','settings.write'),
    ('market_os_ambassador_mission_assignments','missions.read','missions.assign','missions.assign'),
    ('market_os_ambassador_territory_assignments','territories.read','territories.assign','territories.assign')
  ) as v(table_name, read_permission, write_permission, delete_permission)
  loop
    execute format('create policy %I on public.%I for select to authenticated using (public.market_os_ambassador_has_permission(%L, tenant_id::text, organization_id::text))', item.table_name || '_scoped_select', item.table_name, item.read_permission);
    execute format('create policy %I on public.%I for insert to authenticated with check (public.market_os_ambassador_has_permission(%L, tenant_id::text, organization_id::text))', item.table_name || '_scoped_insert', item.table_name, item.write_permission);
    execute format('create policy %I on public.%I for update to authenticated using (public.market_os_ambassador_has_permission(%L, tenant_id::text, organization_id::text)) with check (public.market_os_ambassador_has_permission(%L, tenant_id::text, organization_id::text))', item.table_name || '_scoped_update', item.table_name, item.write_permission, item.write_permission);
    execute format('create policy %I on public.%I for delete to authenticated using (public.market_os_ambassador_has_permission(%L, tenant_id::text, organization_id::text))', item.table_name || '_scoped_delete', item.table_name, item.delete_permission);
  end loop;
end $$;

-- Audit is selectable only; no authenticated insert/update/delete policy exists.
drop policy if exists market_os_ambassador_audit_logs_scoped_select on public.market_os_ambassador_audit_logs;
create policy market_os_ambassador_audit_logs_scoped_select
on public.market_os_ambassador_audit_logs for select to authenticated
using (public.market_os_ambassador_has_permission('audit.read', tenant_id::text, organization_id::text));

-- Idempotency records are intentionally server-only (no authenticated policy).
drop policy if exists market_os_ambassador_actor_roles_self_select on public.market_os_ambassador_actor_roles;
create policy market_os_ambassador_actor_roles_self_select
on public.market_os_ambassador_actor_roles for select to authenticated
using (auth_user_id = auth.uid() and status = 'active');

drop policy if exists market_os_ambassador_role_permissions_self_select on public.market_os_ambassador_role_permissions;
create policy market_os_ambassador_role_permissions_self_select
on public.market_os_ambassador_role_permissions for select to authenticated
using (exists (
  select 1 from public.market_os_ambassador_actor_roles ar
  where ar.auth_user_id = auth.uid() and ar.status = 'active' and ar.role_key = market_os_ambassador_role_permissions.role_key
));

-- No direct table grants are widened. Existing grants remain subject to the new policies.
comment on table public.market_os_ambassador_actor_roles is 'Explicit authenticated actor membership and scope for Market OS Ambassadors.';
comment on table public.market_os_ambassador_mission_assignments is 'Normalized many-to-many mission assignments; legacy mission ambassador fields remain compatibility projections.';
comment on table public.market_os_ambassador_territory_assignments is 'Normalized append-preserving territory assignment history.';
comment on table public.market_os_ambassador_audit_logs is 'Immutable actor-backed Ambassador audit ledger.';

commit;
