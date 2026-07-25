-- ANGELCARE Revenue Command Center
-- Production compatibility migration for the observed legacy Revenue schema.
-- Tailored from Phase 2 after read-only diagnostic on 2026-07-25.
--
-- IMPORTANT:
-- * Keeps public.revenue_prospects.id as TEXT.
-- * Preserves all 247 existing prospect IDs, including 172 non-UUID values.
-- * Creates UUID accounts/opportunities while linking prospects through TEXT.
-- * New prospect IDs are UUID-formatted strings stored as TEXT.
-- * Replaces the original 20260725_0100 Phase 2 migration for this database.
-- * Additive / compatibility-first. No legacy ID conversion and no row deletion.

begin;

create extension if not exists pgcrypto;

do $$
declare
  required_table text;
  prospect_id_type text;
  task_id_type text;
begin
  foreach required_table in array array[
    'revenue_contacts',
    'revenue_prospects',
    'revenue_tasks',
    'revenue_appointments',
    'revenue_activities',
    'revenue_command_action_logs'
  ] loop
    if to_regclass('public.' || required_table) is null then
      raise exception 'BLOCKED: required legacy table public.% is missing.', required_table;
    end if;
  end loop;

  select data_type into prospect_id_type
  from information_schema.columns
  where table_schema='public' and table_name='revenue_prospects' and column_name='id';

  if prospect_id_type is distinct from 'text' then
    raise exception 'BLOCKED: this compatibility migration expects public.revenue_prospects.id TEXT, found %.', coalesce(prospect_id_type,'missing');
  end if;

  select udt_name into task_id_type
  from information_schema.columns
  where table_schema='public' and table_name='revenue_tasks' and column_name='id';

  if task_id_type is distinct from 'uuid' then
    raise exception 'BLOCKED: public.revenue_tasks.id must remain UUID, found %.', coalesce(task_id_type,'missing');
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='revenue_prospects' and column_name='last_activity_at'
  ) then
    raise exception 'BLOCKED: last_activity_at repair is missing. Run the emergency repair first.';
  end if;
end $$;

-- Canonical UUID account table, absent from the observed production schema.
create table if not exists public.revenue_accounts (
  id uuid primary key default gen_random_uuid(),
  account_name text not null,
  legal_name text,
  registration_number text,
  account_type text not null default 'organization',
  segment text default 'b2b',
  city text default 'Unassigned',
  territory text,
  status text not null default 'active',
  lifecycle_stage text not null default 'prospect',
  priority text not null default 'medium',
  owner_id uuid,
  owner_name text default 'BD Officer',
  website text,
  domain text,
  phone text,
  email text,
  address text,
  industry text,
  employee_band text,
  annual_revenue_mad numeric not null default 0,
  parent_account_id uuid references public.revenue_accounts(id) on delete set null,
  last_activity_at timestamptz,
  next_action_at timestamptz,
  archived_at timestamptz,
  metadata jsonb not null default '{}',
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Extend the existing polymorphic contact table to the enterprise contract.
alter table public.revenue_contacts
  add column if not exists account_id uuid references public.revenue_accounts(id) on delete set null,
  add column if not exists role_title text,
  add column if not exists department text,
  add column if not exists seniority text,
  add column if not exists whatsapp text,
  add column if not exists decision_role text not null default 'contact',
  add column if not exists preferred_channel text not null default 'phone',
  add column if not exists consent_status text not null default 'unknown',
  add column if not exists status text not null default 'active',
  add column if not exists owner_id uuid,
  add column if not exists last_contact_at timestamptz,
  add column if not exists archived_at timestamptz,
  add column if not exists metadata jsonb not null default '{}';

-- Keep the historical required entity_id contract while making new canonical inserts safe.
create or replace function public.revenue_contact_sync_entity()
returns trigger
language plpgsql
as $$
begin
  if new.entity_id is null or btrim(new.entity_id) = '' then
    if new.account_id is not null then
      new.entity_type := 'account';
      new.entity_id := new.account_id::text;
    else
      new.entity_type := coalesce(nullif(new.entity_type,''), 'contact');
      new.entity_id := new.id::text;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists revenue_contacts_sync_entity on public.revenue_contacts;
create trigger revenue_contacts_sync_entity
before insert or update of account_id, entity_id, entity_type on public.revenue_contacts
for each row execute function public.revenue_contact_sync_entity();

-- Complete the existing prospect row without changing its TEXT primary key.
alter table public.revenue_prospects
  alter column id set default (gen_random_uuid()::text),
  add column if not exists account_id uuid references public.revenue_accounts(id) on delete set null,
  add column if not exists contact_id uuid references public.revenue_contacts(id) on delete set null,
  add column if not exists owner_id uuid,
  add column if not exists created_by uuid,
  add column if not exists updated_by uuid;

-- Canonical UUID opportunities linked to legacy prospects through TEXT.
create table if not exists public.revenue_opportunities (
  id uuid primary key default gen_random_uuid(),
  prospect_id text references public.revenue_prospects(id) on delete cascade,
  account_id uuid references public.revenue_accounts(id) on delete set null,
  contact_id uuid references public.revenue_contacts(id) on delete set null,
  title text not null,
  stage text not null default 'qualification',
  value_mad numeric not null default 0,
  currency text not null default 'MAD',
  probability numeric not null default 0,
  expected_close_date date,
  status text not null default 'open',
  priority text not null default 'medium',
  forecast_category text not null default 'pipeline',
  owner_id uuid,
  owner text default 'BD Officer',
  next_step text,
  next_step_at timestamptz,
  source text not null default 'revenue_command_center',
  loss_reason text,
  close_reason text,
  closed_at timestamptz,
  archived_at timestamptz,
  metadata jsonb not null default '{}',
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.revenue_tasks
  add column if not exists opportunity_id uuid references public.revenue_opportunities(id) on delete set null;

alter table public.revenue_appointments
  add column if not exists opportunity_id uuid references public.revenue_opportunities(id) on delete set null;



create or replace function public.revenue_enterprise_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Complete the prospect base record before building dependent read models.
alter table public.revenue_prospects
  add column if not exists account_id uuid references public.revenue_accounts(id) on delete set null,
  add column if not exists contact_id uuid references public.revenue_contacts(id) on delete set null,
  add column if not exists company text,
  add column if not exists source text default 'manual',
  add column if not exists segment text default 'b2b',
  add column if not exists probability numeric not null default 0,
  add column if not exists owner_id uuid,
  add column if not exists owner text default 'BD Officer',
  add column if not exists contact_name text,
  add column if not exists email text,
  add column if not exists phone text,
  add column if not exists next_action_at timestamptz,
  add column if not exists last_activity_at timestamptz,
  add column if not exists status text not null default 'active',
  add column if not exists metadata jsonb not null default '{}',
  add column if not exists created_by uuid,
  add column if not exists updated_by uuid;

-- Reconcile canonical base tables without replacing existing data.
alter table if exists public.revenue_accounts
  add column if not exists legal_name text,
  add column if not exists registration_number text,
  add column if not exists domain text,
  add column if not exists industry text,
  add column if not exists employee_band text,
  add column if not exists annual_revenue_mad numeric not null default 0,
  add column if not exists parent_account_id uuid references public.revenue_accounts(id) on delete set null,
  add column if not exists lifecycle_stage text not null default 'prospect',
  add column if not exists last_activity_at timestamptz,
  add column if not exists next_action_at timestamptz,
  add column if not exists archived_at timestamptz;

alter table if exists public.revenue_contacts
  add column if not exists department text,
  add column if not exists seniority text,
  add column if not exists consent_status text not null default 'unknown',
  add column if not exists status text not null default 'active',
  add column if not exists owner_id uuid,
  add column if not exists last_contact_at timestamptz,
  add column if not exists archived_at timestamptz;

alter table if exists public.revenue_opportunities
  add column if not exists contact_id uuid references public.revenue_contacts(id) on delete set null,
  add column if not exists currency text not null default 'MAD',
  add column if not exists priority text not null default 'medium',
  add column if not exists forecast_category text not null default 'pipeline',
  add column if not exists next_step text,
  add column if not exists next_step_at timestamptz,
  add column if not exists source text not null default 'revenue_command_center',
  add column if not exists close_reason text,
  add column if not exists closed_at timestamptz,
  add column if not exists created_by uuid,
  add column if not exists updated_by uuid,
  add column if not exists archived_at timestamptz;

-- Earlier deployments may have the minimal task/appointment source-of-truth tables.
-- Add only the canonical linking columns needed by the enterprise read model; keep a legacy
-- text entity_id intact and compare it through an explicit text cast in the view below.
alter table if exists public.revenue_tasks
  add column if not exists prospect_id text references public.revenue_prospects(id) on delete cascade,
  add column if not exists opportunity_id uuid references public.revenue_opportunities(id) on delete set null;

alter table if exists public.revenue_appointments
  add column if not exists prospect_id text references public.revenue_prospects(id) on delete cascade,
  add column if not exists opportunity_id uuid references public.revenue_opportunities(id) on delete set null;

create table if not exists public.revenue_account_aliases (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.revenue_accounts(id) on delete cascade,
  alias_type text not null default 'commercial_name',
  alias_value text not null,
  normalized_value text generated always as (lower(trim(alias_value))) stored,
  is_primary boolean not null default false,
  source text not null default 'manual',
  metadata jsonb not null default '{}',
  created_by uuid,
  created_at timestamptz not null default now(),
  unique(account_id, alias_type, normalized_value)
);

create table if not exists public.revenue_contact_relationships (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.revenue_contacts(id) on delete cascade,
  account_id uuid not null references public.revenue_accounts(id) on delete cascade,
  prospect_id text references public.revenue_prospects(id) on delete cascade,
  opportunity_id uuid references public.revenue_opportunities(id) on delete cascade,
  relationship_type text not null default 'stakeholder',
  decision_role text not null default 'contact',
  influence_level text not null default 'unknown',
  authority_level text not null default 'unknown',
  relationship_strength numeric not null default 0 check (relationship_strength between 0 and 100),
  is_primary boolean not null default false,
  status text not null default 'active',
  notes text,
  metadata jsonb not null default '{}',
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(contact_id, account_id, prospect_id, opportunity_id, relationship_type)
);

create table if not exists public.revenue_decision_map_members (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references public.revenue_accounts(id) on delete cascade,
  prospect_id text references public.revenue_prospects(id) on delete cascade,
  opportunity_id uuid references public.revenue_opportunities(id) on delete cascade,
  contact_id uuid not null references public.revenue_contacts(id) on delete cascade,
  member_role text not null default 'influencer',
  influence_score numeric not null default 0 check (influence_score between 0 and 100),
  support_level text not null default 'neutral',
  access_level text not null default 'unknown',
  relationship_owner text,
  engagement_strategy text,
  risk_notes text,
  next_action text,
  next_action_at timestamptz,
  status text not null default 'active',
  metadata jsonb not null default '{}',
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (account_id is not null or prospect_id is not null or opportunity_id is not null)
);

create table if not exists public.revenue_qualification_assessments (
  id uuid primary key default gen_random_uuid(),
  prospect_id text not null references public.revenue_prospects(id) on delete cascade,
  opportunity_id uuid references public.revenue_opportunities(id) on delete set null,
  framework text not null default 'ANGELCARE_ENTERPRISE',
  need_score numeric not null default 0 check (need_score between 0 and 100),
  authority_score numeric not null default 0 check (authority_score between 0 and 100),
  budget_score numeric not null default 0 check (budget_score between 0 and 100),
  timing_score numeric not null default 0 check (timing_score between 0 and 100),
  fit_score numeric not null default 0 check (fit_score between 0 and 100),
  urgency_score numeric not null default 0 check (urgency_score between 0 and 100),
  evidence_quality numeric not null default 0 check (evidence_quality between 0 and 100),
  overall_score numeric not null default 0 check (overall_score between 0 and 100),
  recommendation text not null default 'continue_discovery',
  disqualification_reason text,
  evidence jsonb not null default '[]',
  notes text,
  assessed_by uuid,
  assessed_by_name text,
  assessed_at timestamptz not null default now(),
  superseded_at timestamptz,
  metadata jsonb not null default '{}'
);

create table if not exists public.revenue_account_status_history (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.revenue_accounts(id) on delete cascade,
  from_status text,
  to_status text not null,
  from_lifecycle_stage text,
  to_lifecycle_stage text,
  reason text,
  changed_by uuid,
  changed_by_name text,
  metadata jsonb not null default '{}',
  changed_at timestamptz not null default now()
);

create table if not exists public.revenue_account_risks (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.revenue_accounts(id) on delete cascade,
  prospect_id text references public.revenue_prospects(id) on delete cascade,
  opportunity_id uuid references public.revenue_opportunities(id) on delete cascade,
  risk_type text not null,
  severity text not null default 'medium',
  probability numeric not null default 50 check (probability between 0 and 100),
  impact_mad numeric not null default 0,
  title text not null,
  description text,
  mitigation_plan text,
  owner text,
  due_at timestamptz,
  status text not null default 'open',
  resolved_at timestamptz,
  metadata jsonb not null default '{}',
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.revenue_account_plans (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.revenue_accounts(id) on delete cascade,
  plan_type text not null default 'account_growth',
  period_start date,
  period_end date,
  executive_summary text,
  strategic_objectives jsonb not null default '[]',
  stakeholder_strategy jsonb not null default '[]',
  opportunity_strategy jsonb not null default '[]',
  action_plan jsonb not null default '[]',
  success_metrics jsonb not null default '[]',
  status text not null default 'draft',
  owner text,
  approved_by uuid,
  approved_at timestamptz,
  metadata jsonb not null default '{}',
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.revenue_opportunity_stage_history (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references public.revenue_opportunities(id) on delete cascade,
  from_stage text,
  to_stage text not null,
  previous_probability numeric,
  new_probability numeric,
  previous_value_mad numeric,
  new_value_mad numeric,
  reason text,
  evidence jsonb not null default '[]',
  changed_by uuid,
  changed_by_name text,
  correlation_id uuid default gen_random_uuid(),
  metadata jsonb not null default '{}',
  changed_at timestamptz not null default now()
);

create table if not exists public.revenue_opportunity_participants (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references public.revenue_opportunities(id) on delete cascade,
  contact_id uuid references public.revenue_contacts(id) on delete set null,
  user_id uuid,
  participant_type text not null default 'external_contact',
  role_name text,
  responsibility text,
  influence_level text not null default 'unknown',
  is_primary boolean not null default false,
  status text not null default 'active',
  metadata jsonb not null default '{}',
  created_by uuid,
  created_at timestamptz not null default now(),
  unique(opportunity_id, contact_id, user_id, participant_type)
);

create table if not exists public.revenue_opportunity_risks (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references public.revenue_opportunities(id) on delete cascade,
  risk_type text not null,
  severity text not null default 'medium',
  probability numeric not null default 50 check (probability between 0 and 100),
  impact_mad numeric not null default 0,
  title text not null,
  description text,
  mitigation_plan text,
  owner text,
  due_at timestamptz,
  status text not null default 'open',
  resolved_at timestamptz,
  metadata jsonb not null default '{}',
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.revenue_opportunity_competitors (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references public.revenue_opportunities(id) on delete cascade,
  competitor_name text not null,
  position text not null default 'unknown',
  strengths text,
  weaknesses text,
  price_position text,
  relationship_strength text,
  response_strategy text,
  status text not null default 'active',
  metadata jsonb not null default '{}',
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(opportunity_id, competitor_name)
);

create index if not exists revenue_accounts_domain_idx on public.revenue_accounts(lower(domain));
create index if not exists revenue_accounts_lifecycle_idx on public.revenue_accounts(lifecycle_stage, status);
create index if not exists revenue_contacts_account_status_idx on public.revenue_contacts(account_id, status);
create index if not exists revenue_opportunities_pipeline_idx on public.revenue_opportunities(stage, status, expected_close_date);
create index if not exists revenue_opportunities_account_idx on public.revenue_opportunities(account_id, updated_at desc);
create index if not exists revenue_contact_relationships_context_idx on public.revenue_contact_relationships(account_id, prospect_id, opportunity_id);
create index if not exists revenue_decision_map_context_idx on public.revenue_decision_map_members(account_id, prospect_id, opportunity_id, status);
create index if not exists revenue_qualification_prospect_idx on public.revenue_qualification_assessments(prospect_id, assessed_at desc);
create index if not exists revenue_account_risks_open_idx on public.revenue_account_risks(account_id, status, severity);
create index if not exists revenue_opportunity_history_idx on public.revenue_opportunity_stage_history(opportunity_id, changed_at desc);
create index if not exists revenue_opportunity_risks_open_idx on public.revenue_opportunity_risks(opportunity_id, status, severity);

-- Avoid duplicate trigger creation while allowing reruns.
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'revenue_contact_relationships',
    'revenue_decision_map_members',
    'revenue_account_risks',
    'revenue_account_plans',
    'revenue_opportunity_risks',
    'revenue_opportunity_competitors'
  ] loop
    execute format('drop trigger if exists %I on public.%I', table_name || '_touch_updated_at', table_name);
    execute format(
      'create trigger %I before update on public.%I for each row execute function public.revenue_enterprise_touch_updated_at()',
      table_name || '_touch_updated_at',
      table_name
    );
  end loop;
end $$;

create or replace function public.revenue_capture_opportunity_stage_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.stage is distinct from new.stage
     or old.probability is distinct from new.probability
     or old.value_mad is distinct from new.value_mad then
    insert into public.revenue_opportunity_stage_history (
      opportunity_id,
      from_stage,
      to_stage,
      previous_probability,
      new_probability,
      previous_value_mad,
      new_value_mad,
      reason,
      metadata
    ) values (
      new.id,
      old.stage,
      new.stage,
      old.probability,
      new.probability,
      old.value_mad,
      new.value_mad,
      coalesce(new.metadata->>'transition_reason', 'Mise à jour Revenue Command'),
      jsonb_build_object('source', 'database_trigger')
    );
  end if;
  return new;
end;
$$;

drop trigger if exists revenue_opportunities_capture_stage_change on public.revenue_opportunities;
create trigger revenue_opportunities_capture_stage_change
after update of stage, probability, value_mad on public.revenue_opportunities
for each row execute function public.revenue_capture_opportunity_stage_change();

-- Atomic dossier creation prevents fragmented account/contact/prospect/opportunity records.
create or replace function public.revenue_create_enterprise_prospect_dossier(
  payload jsonb,
  p_actor_id uuid default null,
  p_actor_name text default 'Revenue Command'
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_account_id uuid;
  v_contact_id uuid;
  v_prospect_id text;
  v_opportunity_id uuid;
  v_account_name text;
  v_prospect_name text;
  v_contact_name text;
  v_value numeric;
  v_probability numeric;
begin
  v_account_name := coalesce(nullif(trim(payload->>'accountName'), ''), nullif(trim(payload->>'company'), ''), nullif(trim(payload->>'name'), ''), 'Compte sans nom');
  v_prospect_name := coalesce(nullif(trim(payload->>'name'), ''), v_account_name);
  v_contact_name := nullif(trim(payload->>'contactName'), '');
  v_value := coalesce(nullif(payload->>'valueMad', '')::numeric, 0);
  v_probability := greatest(0, least(100, coalesce(nullif(payload->>'probability', '')::numeric, 0)));
  v_prospect_id := gen_random_uuid()::text;

  insert into public.revenue_accounts (
    account_name, legal_name, account_type, segment, city, lifecycle_stage, priority,
    owner_name, website, domain, phone, email, industry, metadata, created_by, updated_by
  ) values (
    v_account_name,
    nullif(payload->>'legalName', ''),
    coalesce(nullif(payload->>'accountType', ''), 'organization'),
    coalesce(nullif(payload->>'segment', ''), 'b2b'),
    coalesce(nullif(payload->>'city', ''), 'Non attribuée'),
    'prospect',
    coalesce(nullif(payload->>'priority', ''), 'medium'),
    coalesce(nullif(payload->>'owner', ''), 'BD Officer'),
    nullif(payload->>'website', ''),
    nullif(payload->>'domain', ''),
    nullif(payload->>'phone', ''),
    nullif(payload->>'email', ''),
    nullif(payload->>'industry', ''),
    jsonb_build_object('source', 'enterprise_dossier_studio'),
    p_actor_id,
    p_actor_id
  ) returning id into v_account_id;

  insert into public.revenue_prospects (
    id, account_id, contact_id, name, company, city, source, segment, stage, priority,
    score, value_mad, probability, owner_id, owner, contact_name, email, phone,
    next_action_at, status, data, metadata, created_by, updated_by
  ) values (
    v_prospect_id,
    v_account_id,
    null,
    v_prospect_name,
    v_account_name,
    coalesce(nullif(payload->>'city', ''), 'Unassigned'),
    coalesce(nullif(payload->>'source', ''), 'manual'),
    coalesce(nullif(payload->>'segment', ''), 'b2b'),
    'new_lead',
    coalesce(nullif(payload->>'priority', ''), 'medium'),
    0,
    v_value,
    v_probability,
    p_actor_id,
    coalesce(nullif(payload->>'owner', ''), 'BD Officer'),
    coalesce(v_contact_name, ''),
    nullif(payload->>'email', ''),
    nullif(payload->>'phone', ''),
    nullif(payload->>'nextActionAt', '')::timestamptz,
    'active',
    jsonb_build_object(
      'needSummary', coalesce(payload->>'needSummary', ''),
      'nextAction', coalesce(payload->>'nextAction', ''),
      'website', coalesce(payload->>'website', ''),
      'industry', coalesce(payload->>'industry', '')
    ),
    jsonb_build_object('source', 'enterprise_dossier_studio'),
    p_actor_id,
    p_actor_id
  );

  if v_contact_name is not null then
    insert into public.revenue_contacts (
      account_id, entity_type, entity_id, full_name, role_title, email, phone, whatsapp,
      influence_level, decision_role, preferred_channel, consent_status, status, owner_id, metadata
    ) values (
      v_account_id,
      'prospect',
      v_prospect_id,
      v_contact_name,
      nullif(payload->>'roleTitle', ''),
      nullif(payload->>'email', ''),
      nullif(payload->>'phone', ''),
      nullif(payload->>'whatsapp', ''),
      'unknown',
      'contact',
      coalesce(nullif(payload->>'preferredChannel', ''), 'phone'),
      'unknown',
      'active',
      p_actor_id,
      jsonb_build_object('source', 'enterprise_dossier_studio')
    ) returning id into v_contact_id;

    update public.revenue_prospects
    set contact_id = v_contact_id, updated_at = now()
    where id = v_prospect_id;
  end if;

  if coalesce((payload->>'createOpportunity')::boolean, true) then
    insert into public.revenue_opportunities (
      prospect_id, account_id, contact_id, title, stage, value_mad, currency,
      probability, expected_close_date, status, priority, forecast_category,
      owner_id, owner, next_step, source, metadata, created_by, updated_by
    ) values (
      v_prospect_id,
      v_account_id,
      v_contact_id,
      coalesce(nullif(payload->>'opportunityTitle', ''), 'Développement ' || v_account_name),
      'qualification',
      v_value,
      'MAD',
      v_probability,
      nullif(payload->>'expectedCloseDate', '')::date,
      'open',
      coalesce(nullif(payload->>'priority', ''), 'medium'),
      'pipeline',
      p_actor_id,
      coalesce(nullif(payload->>'owner', ''), 'BD Officer'),
      nullif(payload->>'nextAction', ''),
      'enterprise_dossier_studio',
      jsonb_build_object('source', 'enterprise_dossier_studio'),
      p_actor_id,
      p_actor_id
    ) returning id into v_opportunity_id;

    insert into public.revenue_opportunity_stage_history (
      opportunity_id, from_stage, to_stage, new_probability, new_value_mad,
      reason, changed_by, changed_by_name, metadata
    ) values (
      v_opportunity_id, null, 'qualification', v_probability, v_value,
      'Création atomique du dossier commercial', p_actor_id, p_actor_name,
      jsonb_build_object('source', 'enterprise_dossier_studio')
    );
  end if;

  insert into public.revenue_activities (
    entity_type, entity_id, prospect_id, event_type, title, actor_id, actor, severity, metadata
  ) values (
    'prospect', v_prospect_id, v_prospect_id, 'enterprise_dossier_created',
    'Dossier commercial créé : ' || v_prospect_name,
    p_actor_id, p_actor_name, 'info',
    jsonb_build_object('accountId', v_account_id, 'contactId', v_contact_id, 'opportunityId', v_opportunity_id)
  );

  insert into public.revenue_command_action_logs (
    action_type, entity_type, entity_id, actor_id, actor, payload, result
  ) values (
    'create_enterprise_prospect_dossier', 'prospect', v_prospect_id,
    p_actor_id, p_actor_name, payload,
    jsonb_build_object('accountId', v_account_id, 'contactId', v_contact_id, 'prospectId', v_prospect_id, 'opportunityId', v_opportunity_id)
  );

  return jsonb_build_object(
    'accountId', v_account_id,
    'contactId', v_contact_id,
    'prospectId', v_prospect_id,
    'opportunityId', v_opportunity_id
  );
end;
$$;

create or replace view public.revenue_prospect_enterprise_overview as
select
  p.id as prospect_id,
  p.name as prospect_name,
  p.company,
  p.city,
  p.stage as prospect_stage,
  p.priority,
  p.score,
  p.value_mad as prospect_value_mad,
  p.probability as prospect_probability,
  p.owner,
  p.contact_name,
  p.email,
  p.phone,
  p.next_action_at,
  p.last_activity_at,
  p.status as prospect_status,
  p.account_id,
  a.account_name,
  a.legal_name,
  a.account_type,
  a.segment as account_segment,
  a.lifecycle_stage,
  a.industry,
  a.website,
  a.domain,
  a.status as account_status,
  p.contact_id,
  c.full_name as primary_contact_name,
  c.role_title as primary_contact_role,
  c.decision_role as primary_contact_decision_role,
  c.influence_level as primary_contact_influence,
  coalesce(opp_stats.opportunity_count, 0) as opportunity_count,
  coalesce(opp_stats.open_opportunity_value_mad, 0) as open_opportunity_value_mad,
  coalesce(opp_stats.weighted_pipeline_mad, 0) as weighted_pipeline_mad,
  coalesce(task_stats.open_task_count, 0) as open_task_count,
  coalesce(task_stats.overdue_task_count, 0) as overdue_task_count,
  coalesce(meeting_stats.upcoming_meeting_count, 0) as upcoming_meeting_count,
  coalesce(risk_stats.open_risk_count, 0) as open_risk_count,
  coalesce(decision_stats.decision_member_count, 0) as decision_member_count,
  p.updated_at
from public.revenue_prospects p
left join public.revenue_accounts a on a.id = p.account_id
left join public.revenue_contacts c on c.id = p.contact_id
left join lateral (
  select
    count(*)::int as opportunity_count,
    coalesce(sum(o.value_mad) filter (where o.status = 'open' and o.archived_at is null), 0) as open_opportunity_value_mad,
    coalesce(sum((o.value_mad * o.probability) / 100.0) filter (where o.status = 'open' and o.archived_at is null), 0) as weighted_pipeline_mad
  from public.revenue_opportunities o
  where o.prospect_id = p.id
) opp_stats on true
left join lateral (
  select
    count(*) filter (where t.status in ('open', 'pending', 'todo'))::int as open_task_count,
    count(*) filter (where t.status in ('open', 'pending', 'todo') and t.due_date < now())::int as overdue_task_count
  from public.revenue_tasks t
  where t.prospect_id = p.id or (t.entity_type = 'prospect' and t.entity_id::text = p.id::text)
) task_stats on true
left join lateral (
  select count(*) filter (where ap.status = 'scheduled' and ap.appointment_at >= now())::int as upcoming_meeting_count
  from public.revenue_appointments ap
  where ap.prospect_id = p.id or (ap.entity_type = 'prospect' and ap.entity_id::text = p.id::text)
) meeting_stats on true
left join lateral (
  select count(*) filter (where r.status = 'open')::int as open_risk_count
  from public.revenue_account_risks r
  where r.prospect_id = p.id or (p.account_id is not null and r.account_id = p.account_id)
) risk_stats on true
left join lateral (
  select count(*) filter (where dm.status = 'active')::int as decision_member_count
  from public.revenue_decision_map_members dm
  where dm.prospect_id = p.id or (p.account_id is not null and dm.account_id = p.account_id)
) decision_stats on true
where p.status is distinct from 'archived';

-- These objects are server-command only. The application uses a service-role client only
-- after resolving the ANGELCARE custom session and exact Revenue permissions in the API layer.
-- No anon/authenticated direct-table policy is created for this Phase 2 domain.
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'revenue_account_aliases',
    'revenue_contact_relationships',
    'revenue_decision_map_members',
    'revenue_qualification_assessments',
    'revenue_account_status_history',
    'revenue_account_risks',
    'revenue_account_plans',
    'revenue_opportunity_stage_history',
    'revenue_opportunity_participants',
    'revenue_opportunity_risks',
    'revenue_opportunity_competitors'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_authenticated_all', table_name);
    execute format('revoke all privileges on table public.%I from anon, authenticated', table_name);
    execute format('grant all privileges on table public.%I to service_role', table_name);
  end loop;
end $$;

-- Core enterprise tables are server-command only in this compatibility deployment.
alter table public.revenue_accounts enable row level security;
alter table public.revenue_opportunities enable row level security;
revoke all privileges on table public.revenue_accounts from anon, authenticated;
revoke all privileges on table public.revenue_opportunities from anon, authenticated;
grant all privileges on table public.revenue_accounts to service_role;
grant all privileges on table public.revenue_opportunities to service_role;

revoke all privileges on table public.revenue_prospect_enterprise_overview from anon, authenticated;
grant select on table public.revenue_prospect_enterprise_overview to service_role;

revoke all on function public.revenue_create_enterprise_prospect_dossier(jsonb, uuid, text) from public, anon, authenticated;
grant execute on function public.revenue_create_enterprise_prospect_dossier(jsonb, uuid, text) to service_role;

comment on view public.revenue_prospect_enterprise_overview is
  'Canonical read model for ANGELCARE Revenue Command prospects, accounts, contacts, opportunities, tasks, meetings, risks and decision maps.';

commit;
