begin;

create extension if not exists pgcrypto;

do $preflight$
declare
  prospect_id_type text;
  partnership_id_type text;
  task_partnership_type text;
  appointment_partnership_type text;
  contract_partnership_type text;
  account_id_type text;
  orphan_count bigint;
begin
  if to_regclass('public.revenue_partnerships') is null then
    raise exception 'MEGA ZIP 8 BLOCKED: public.revenue_partnerships is missing.';
  end if;
  if to_regclass('public.revenue_prospects') is null then
    raise exception 'MEGA ZIP 8 BLOCKED: public.revenue_prospects is missing.';
  end if;
  if to_regclass('public.revenue_accounts') is null or to_regclass('public.revenue_contacts') is null or to_regclass('public.revenue_opportunities') is null then
    raise exception 'MEGA ZIP 8 BLOCKED: account, contact and opportunity foundations are required.';
  end if;
  if to_regclass('public.revenue_tasks') is null or to_regclass('public.revenue_appointments') is null then
    raise exception 'MEGA ZIP 8 BLOCKED: execution and engagement foundations are required.';
  end if;
  if to_regclass('public.revenue_contracts') is null or to_regclass('public.revenue_realization_events') is null
     or to_regclass('public.revenue_finance_handoffs') is null or to_regclass('public.revenue_contract_obligations') is null then
    raise exception 'MEGA ZIP 8 BLOCKED: Mega ZIP 7 contract, finance-handoff, obligation and realization foundations are required.';
  end if;
  if to_regclass('public.revenue_proposals') is null or to_regclass('public.revenue_negotiations') is null
     or to_regclass('public.revenue_negotiation_rounds') is null then
    raise exception 'MEGA ZIP 8 BLOCKED: Mega ZIP 6 proposal and negotiation foundations are required.';
  end if;
  select data_type into prospect_id_type
  from information_schema.columns
  where table_schema='public' and table_name='revenue_prospects' and column_name='id';
  if prospect_id_type is distinct from 'text' then
    raise exception 'MEGA ZIP 8 BLOCKED: public.revenue_prospects.id must remain TEXT, found %.',prospect_id_type;
  end if;
  select data_type into partnership_id_type
  from information_schema.columns
  where table_schema='public' and table_name='revenue_partnerships' and column_name='id';
  if partnership_id_type is distinct from 'uuid' then
    raise exception 'MEGA ZIP 8 BLOCKED: public.revenue_partnerships.id must be UUID, found %.',partnership_id_type;
  end if;
  select data_type into account_id_type from information_schema.columns
  where table_schema='public' and table_name='revenue_accounts' and column_name='id';
  if account_id_type is distinct from 'uuid' then
    raise exception 'MEGA ZIP 8 BLOCKED: public.revenue_accounts.id must be UUID, found %.',account_id_type;
  end if;
  select data_type into task_partnership_type from information_schema.columns
  where table_schema='public' and table_name='revenue_tasks' and column_name='partnership_id';
  if task_partnership_type is distinct from 'text' then
    raise exception 'MEGA ZIP 8 BLOCKED: public.revenue_tasks.partnership_id must be TEXT, found %.',task_partnership_type;
  end if;
  select data_type into appointment_partnership_type from information_schema.columns
  where table_schema='public' and table_name='revenue_appointments' and column_name='partnership_id';
  if appointment_partnership_type is distinct from 'text' then
    raise exception 'MEGA ZIP 8 BLOCKED: public.revenue_appointments.partnership_id must be TEXT, found %.',appointment_partnership_type;
  end if;
  select data_type into contract_partnership_type from information_schema.columns
  where table_schema='public' and table_name='revenue_contracts' and column_name='partnership_id';
  if contract_partnership_type is distinct from 'text' then
    raise exception 'MEGA ZIP 8 BLOCKED: public.revenue_contracts.partnership_id must be TEXT, found %.',contract_partnership_type;
  end if;
  if not exists(select 1 from information_schema.columns where table_schema='public' and table_name='revenue_tasks' and column_name='metadata') then
    raise exception 'MEGA ZIP 8 BLOCKED: public.revenue_tasks.metadata is required.';
  end if;
  if not exists(select 1 from information_schema.columns where table_schema='public' and table_name='revenue_appointments' and column_name in ('scheduled_at','appointment_at')) then
    raise exception 'MEGA ZIP 8 BLOCKED: revenue_appointments requires scheduled_at or appointment_at.';
  end if;
  if exists(select 1 from information_schema.columns where table_schema='public' and table_name='revenue_partnerships' and column_name='account_id' and data_type<>'uuid') then
    raise exception 'MEGA ZIP 8 BLOCKED: revenue_partnerships.account_id exists with a non-UUID type.';
  end if;
  if exists(select 1 from information_schema.columns where table_schema='public' and table_name='revenue_partnerships' and column_name='contract_id' and data_type<>'uuid') then
    raise exception 'MEGA ZIP 8 BLOCKED: revenue_partnerships.contract_id exists with a non-UUID type.';
  end if;
  if exists(select 1 from information_schema.columns where table_schema='public' and table_name='revenue_partnerships' and column_name='prospect_text_id' and data_type<>'text') then
    raise exception 'MEGA ZIP 8 BLOCKED: revenue_partnerships.prospect_text_id exists with a non-TEXT type.';
  end if;
  if exists(select 1 from information_schema.columns where table_schema='public' and table_name='revenue_partnerships' and column_name='account_id') then
    select count(*) into orphan_count from public.revenue_partnerships p left join public.revenue_accounts a on a.id=p.account_id where p.account_id is not null and a.id is null;
    if orphan_count>0 then raise exception 'MEGA ZIP 8 BLOCKED: % partnership account_id value(s) are orphaned.',orphan_count; end if;
  end if;
  if exists(select 1 from information_schema.columns where table_schema='public' and table_name='revenue_partnerships' and column_name='contract_id') then
    select count(*) into orphan_count from public.revenue_partnerships p left join public.revenue_contracts c on c.id=p.contract_id where p.contract_id is not null and c.id is null;
    if orphan_count>0 then raise exception 'MEGA ZIP 8 BLOCKED: % partnership contract_id value(s) are orphaned.',orphan_count; end if;
  end if;
  if exists(select 1 from information_schema.columns where table_schema='public' and table_name='revenue_partnerships' and column_name='prospect_text_id') then
    select count(*) into orphan_count from public.revenue_partnerships p left join public.revenue_prospects pr on pr.id=p.prospect_text_id where p.prospect_text_id is not null and pr.id is null;
    if orphan_count>0 then raise exception 'MEGA ZIP 8 BLOCKED: % partnership prospect_text_id value(s) are orphaned.',orphan_count; end if;
  end if;
end
$preflight$;

-- Normalize the partnership table without changing any existing identifier.
alter table public.revenue_partnerships add column if not exists account_id uuid;
alter table public.revenue_partnerships add column if not exists prospect_text_id text;
alter table public.revenue_partnerships add column if not exists partner_name text;
alter table public.revenue_partnerships add column if not exists partner_type text not null default 'institutional';
alter table public.revenue_partnerships add column if not exists city text default 'Unassigned';
alter table public.revenue_partnerships add column if not exists stage text not null default 'identified';
alter table public.revenue_partnerships add column if not exists priority text not null default 'medium';
alter table public.revenue_partnerships add column if not exists estimated_value_mad numeric(18,2) not null default 0;
alter table public.revenue_partnerships add column if not exists owner_id uuid;
alter table public.revenue_partnerships add column if not exists owner text default 'Partnership Manager';
alter table public.revenue_partnerships add column if not exists contact_name text;
alter table public.revenue_partnerships add column if not exists phone text;
alter table public.revenue_partnerships add column if not exists email text;
alter table public.revenue_partnerships add column if not exists status text not null default 'active';
alter table public.revenue_partnerships add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.revenue_partnerships add column if not exists created_at timestamptz not null default now();
alter table public.revenue_partnerships add column if not exists updated_at timestamptz not null default now();
alter table public.revenue_partnerships add column if not exists sector text;
alter table public.revenue_partnerships add column if not exists territory text;
alter table public.revenue_partnerships add column if not exists strategic_tier text not null default 'tier_2';
alter table public.revenue_partnerships add column if not exists qualification_status text not null default 'not_started';
alter table public.revenue_partnerships add column if not exists activation_status text not null default 'not_ready';
alter table public.revenue_partnerships add column if not exists health_status text not null default 'unknown';
alter table public.revenue_partnerships add column if not exists health_score numeric(7,2) not null default 0;
alter table public.revenue_partnerships add column if not exists contract_id uuid;
alter table public.revenue_partnerships add column if not exists renewal_date date;
alter table public.revenue_partnerships add column if not exists next_action text;
alter table public.revenue_partnerships add column if not exists last_activity_at timestamptz;
alter table public.revenue_partnerships add column if not exists attributed_pipeline_mad numeric(18,2) not null default 0;
alter table public.revenue_partnerships add column if not exists attributed_realized_mad numeric(18,2) not null default 0;
alter table public.revenue_partnerships add column if not exists created_by uuid;
alter table public.revenue_partnerships add column if not exists updated_by uuid;

do $compatibility$
declare
  source_label text;
begin
  if exists(select 1 from information_schema.columns where table_schema='public' and table_name='revenue_partnerships' and column_name='name') then
    source_label := 'name';
  elsif exists(select 1 from information_schema.columns where table_schema='public' and table_name='revenue_partnerships' and column_name='legal_name') then
    source_label := 'legal_name';
  elsif exists(select 1 from information_schema.columns where table_schema='public' and table_name='revenue_partnerships' and column_name='commercial_name') then
    source_label := 'commercial_name';
  end if;
  if source_label is not null then
    execute format($sql$
      update public.revenue_partnerships
      set partner_name=coalesce(nullif(partner_name,''),nullif(%I,''))
      where partner_name is null or btrim(partner_name)=''
    $sql$,source_label);
  end if;
  update public.revenue_partnerships set partner_name='Partenaire ANGELCARE' where partner_name is null or btrim(partner_name)='';
  if exists(select 1 from information_schema.columns where table_schema='public' and table_name='revenue_partnerships' and column_name='prospect_id') then
    execute 'update public.revenue_partnerships p set prospect_text_id=p.prospect_id::text where p.prospect_text_id is null and p.prospect_id is not null and exists(select 1 from public.revenue_prospects pr where pr.id=p.prospect_id::text)';
  end if;
end
$compatibility$;

do $constraint$
begin
  if not exists(
    select 1 from pg_constraint c join pg_attribute a on a.attrelid=c.conrelid and a.attnum=any(c.conkey)
    where c.contype='f' and c.conrelid='public.revenue_partnerships'::regclass and c.confrelid='public.revenue_accounts'::regclass and a.attname='account_id'
  ) then
    alter table public.revenue_partnerships add constraint revenue_partnerships_account_phase8_fk foreign key(account_id) references public.revenue_accounts(id) on delete set null;
  end if;
  if not exists(
    select 1 from pg_constraint c join pg_attribute a on a.attrelid=c.conrelid and a.attnum=any(c.conkey)
    where c.contype='f' and c.conrelid='public.revenue_partnerships'::regclass and c.confrelid='public.revenue_prospects'::regclass and a.attname='prospect_text_id'
  ) then
    alter table public.revenue_partnerships add constraint revenue_partnerships_prospect_text_fk foreign key(prospect_text_id) references public.revenue_prospects(id) on delete set null;
  end if;
  if not exists(
    select 1 from pg_constraint c join pg_attribute a on a.attrelid=c.conrelid and a.attnum=any(c.conkey)
    where c.contype='f' and c.conrelid='public.revenue_partnerships'::regclass and c.confrelid='public.revenue_contracts'::regclass and a.attname='contract_id'
  ) then
    alter table public.revenue_partnerships
      add constraint revenue_partnerships_contract_fk
      foreign key(contract_id) references public.revenue_contracts(id) on delete set null;
  end if;
end
$constraint$;

create table if not exists public.revenue_partnership_stakeholders (
  id uuid primary key default gen_random_uuid(),
  partnership_id uuid not null references public.revenue_partnerships(id) on delete cascade,
  contact_id uuid references public.revenue_contacts(id) on delete set null,
  full_name text not null,
  role text,
  department text,
  decision_role text not null default 'influencer',
  influence_level integer not null default 1 check(influence_level between 0 and 5),
  authority_level integer not null default 1 check(authority_level between 0 and 5),
  relationship_strength numeric(7,2) not null default 0 check(relationship_strength between 0 and 100),
  email text,
  phone text,
  current_concern text,
  next_action text,
  status text not null default 'active',
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.revenue_partnership_qualifications (
  id uuid primary key default gen_random_uuid(),
  partnership_id uuid not null references public.revenue_partnerships(id) on delete cascade,
  status text not null default 'under_review',
  strategic_fit numeric(7,2) not null default 0,
  audience_access numeric(7,2) not null default 0,
  commercial_potential numeric(7,2) not null default 0,
  operational_feasibility numeric(7,2) not null default 0,
  reputation_risk numeric(7,2) not null default 0,
  decision_access numeric(7,2) not null default 0,
  overall_score numeric(7,2) not null default 0,
  evidence_summary text,
  disqualification_reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.revenue_partner_programs (
  id uuid primary key default gen_random_uuid(),
  partnership_id uuid not null references public.revenue_partnerships(id) on delete cascade,
  name text not null,
  objective text,
  audience text,
  commercial_model text,
  referral_model text,
  success_criteria text,
  start_date date,
  end_date date,
  review_frequency text not null default 'quarterly',
  status text not null default 'planning',
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.revenue_partner_program_locations (
  id uuid primary key default gen_random_uuid(),
  partnership_id uuid not null references public.revenue_partnerships(id) on delete cascade,
  program_id uuid references public.revenue_partner_programs(id) on delete cascade,
  location_name text not null,
  city text,
  territory text,
  launch_date date,
  status text not null default 'planned',
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.revenue_partner_program_service_lines (
  id uuid primary key default gen_random_uuid(),
  partnership_id uuid not null references public.revenue_partnerships(id) on delete cascade,
  program_id uuid references public.revenue_partner_programs(id) on delete cascade,
  service_line text not null,
  volume_target numeric(18,2) not null default 0,
  commercial_value_mad numeric(18,2) not null default 0,
  status text not null default 'configured',
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.revenue_partner_benefits (
  id uuid primary key default gen_random_uuid(),
  partnership_id uuid not null references public.revenue_partnerships(id) on delete cascade,
  program_id uuid references public.revenue_partner_programs(id) on delete set null,
  direction text not null,
  title text not null,
  benefit_type text not null default 'non_financial',
  value_mad numeric(18,2) not null default 0,
  eligibility_rule text,
  start_date date,
  expiry_date date,
  status text not null default 'draft',
  decision_reason text,
  approved_by uuid,
  approved_at timestamptz,
  finance_handoff_id uuid references public.revenue_finance_handoffs(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.revenue_partner_benefit_usage (
  id uuid primary key default gen_random_uuid(),
  partnership_id uuid not null references public.revenue_partnerships(id) on delete cascade,
  benefit_id uuid not null references public.revenue_partner_benefits(id) on delete cascade,
  quantity numeric(18,2) not null default 1,
  value_mad numeric(18,2) not null default 0,
  evidence_reference text,
  used_at timestamptz not null default now(),
  created_by uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.revenue_partnership_obligations (
  id uuid primary key default gen_random_uuid(),
  partnership_id uuid not null references public.revenue_partnerships(id) on delete cascade,
  program_id uuid references public.revenue_partner_programs(id) on delete set null,
  contract_obligation_id uuid references public.revenue_contract_obligations(id) on delete set null,
  responsible_party text not null,
  title text not null,
  description text,
  due_date date,
  frequency text,
  evidence_required text,
  evidence_reference text,
  owner text,
  status text not null default 'open',
  breach_reason text,
  remediation text,
  completed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.revenue_partnership_milestones (
  id uuid primary key default gen_random_uuid(),
  partnership_id uuid not null references public.revenue_partnerships(id) on delete cascade,
  program_id uuid references public.revenue_partner_programs(id) on delete set null,
  title text not null,
  description text,
  due_date date,
  acceptance_criteria text,
  evidence_reference text,
  status text not null default 'planned',
  completed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.revenue_partner_activation_plans (
  id uuid primary key default gen_random_uuid(),
  partnership_id uuid not null references public.revenue_partnerships(id) on delete cascade,
  program_id uuid references public.revenue_partner_programs(id) on delete set null,
  contract_id uuid references public.revenue_contracts(id) on delete set null,
  name text not null,
  target_launch_date date,
  actual_launch_at timestamptz,
  status text not null default 'draft',
  notes text,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.revenue_partner_activation_gates (
  id uuid primary key default gen_random_uuid(),
  partnership_id uuid not null references public.revenue_partnerships(id) on delete cascade,
  activation_plan_id uuid references public.revenue_partner_activation_plans(id) on delete cascade,
  gate_name text not null,
  gate_type text not null default 'operational',
  mandatory boolean not null default true,
  owner text,
  due_date date,
  status text not null default 'pending',
  evidence_reference text,
  verified_by uuid,
  verified_at timestamptz,
  failure_reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.revenue_partner_referrals (
  id uuid primary key default gen_random_uuid(),
  partnership_id uuid not null references public.revenue_partnerships(id) on delete cascade,
  program_id uuid references public.revenue_partner_programs(id) on delete set null,
  source_contact_id uuid references public.revenue_contacts(id) on delete set null,
  referred_name text not null,
  referred_type text not null default 'prospect',
  email text,
  normalized_email text,
  phone text,
  normalized_phone text,
  service_interest text,
  consent_status text not null default 'pending',
  owner text,
  territory text,
  estimated_value_mad numeric(18,2) not null default 0,
  status text not null default 'received',
  received_at timestamptz not null default now(),
  duplicate_of_referral_id uuid references public.revenue_partner_referrals(id) on delete set null,
  linked_prospect_id text references public.revenue_prospects(id) on delete set null,
  linked_opportunity_id uuid references public.revenue_opportunities(id) on delete set null,
  source_evidence text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.revenue_partner_referral_status_history (
  id uuid primary key default gen_random_uuid(),
  referral_id uuid not null references public.revenue_partner_referrals(id) on delete cascade,
  partnership_id uuid not null references public.revenue_partnerships(id) on delete cascade,
  previous_status text,
  new_status text not null,
  reason text,
  actor_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.revenue_partner_referral_attributions (
  id uuid primary key default gen_random_uuid(),
  partnership_id uuid not null references public.revenue_partnerships(id) on delete cascade,
  referral_id uuid not null references public.revenue_partner_referrals(id) on delete cascade,
  event_type text not null,
  event_id text not null,
  attribution_method text not null default 'rules_based_single_source',
  attribution_share numeric(7,3) not null default 100 check(attribution_share > 0 and attribution_share <= 100),
  attributed_value numeric(18,2) not null default 0,
  currency text not null default 'MAD',
  evidence_reference text not null,
  status text not null default 'confirmed',
  override_reason text,
  reversal_event_id uuid references public.revenue_realization_events(id) on delete set null,
  reversed_at timestamptz,
  created_by uuid,
  created_at timestamptz not null default now(),
  unique(referral_id,event_type,event_id)
);

alter table public.revenue_partner_referral_attributions add column if not exists reversal_event_id uuid references public.revenue_realization_events(id) on delete set null;
alter table public.revenue_partner_referral_attributions add column if not exists reversed_at timestamptz;

create table if not exists public.revenue_partner_attribution_conflicts (
  id uuid primary key default gen_random_uuid(),
  partnership_id uuid references public.revenue_partnerships(id) on delete cascade,
  referral_id uuid not null references public.revenue_partner_referrals(id) on delete cascade,
  conflict_type text not null,
  description text,
  existing_prospect_id text references public.revenue_prospects(id) on delete set null,
  competing_partnership_id uuid references public.revenue_partnerships(id) on delete set null,
  value_at_risk_mad numeric(18,2) not null default 0,
  status text not null default 'open',
  decision text,
  resolution_reason text,
  resolved_by uuid,
  resolved_at timestamptz,
  created_by uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.revenue_partner_performance_periods (
  id uuid primary key default gen_random_uuid(),
  partnership_id uuid not null references public.revenue_partnerships(id) on delete cascade,
  program_id uuid references public.revenue_partner_programs(id) on delete set null,
  period_start date not null,
  period_end date not null,
  status text not null default 'planned',
  target_referrals numeric(18,2) not null default 0,
  target_qualified_referrals numeric(18,2) not null default 0,
  target_meetings numeric(18,2) not null default 0,
  target_contracts numeric(18,2) not null default 0,
  target_realized_mad numeric(18,2) not null default 0,
  closed_at timestamptz,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check(period_end >= period_start),
  unique(partnership_id,program_id,period_start,period_end)
);

create table if not exists public.revenue_partner_performance_metrics (
  id uuid primary key default gen_random_uuid(),
  performance_period_id uuid not null references public.revenue_partner_performance_periods(id) on delete cascade,
  partnership_id uuid references public.revenue_partnerships(id) on delete cascade,
  metric_key text not null,
  metric_value numeric(18,4) not null default 0,
  source_reference text,
  recorded_by uuid,
  recorded_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.revenue_partner_scorecards (
  id uuid primary key default gen_random_uuid(),
  partnership_id uuid not null references public.revenue_partnerships(id) on delete cascade,
  performance_period_id uuid not null references public.revenue_partner_performance_periods(id) on delete cascade,
  referral_quality_score numeric(7,2) not null default 0,
  conversion_score numeric(7,2) not null default 0,
  realized_revenue_score numeric(7,2) not null default 0,
  obligation_compliance_score numeric(7,2) not null default 0,
  engagement_score numeric(7,2) not null default 0,
  relationship_health_score numeric(7,2) not null default 0,
  overall_score numeric(7,2) not null default 0,
  referral_count integer not null default 0,
  qualified_referral_count integer not null default 0,
  attributed_referral_count integer not null default 0,
  meeting_count integer not null default 0,
  contract_count integer not null default 0,
  realized_revenue_mad numeric(18,2) not null default 0,
  performance_status text not null default 'unknown',
  components jsonb not null default '{}'::jsonb,
  source_evidence jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now(),
  unique(performance_period_id)
);

create table if not exists public.revenue_partner_reviews (
  id uuid primary key default gen_random_uuid(),
  partnership_id uuid references public.revenue_partnerships(id) on delete cascade,
  performance_period_id uuid references public.revenue_partner_performance_periods(id) on delete set null,
  summary text,
  recommendation text,
  commitments jsonb not null default '[]'::jsonb,
  decision_summary text,
  status text not null default 'prepared',
  reviewed_at timestamptz,
  created_by uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.revenue_partner_recovery_plans (
  id uuid primary key default gen_random_uuid(),
  partnership_id uuid not null references public.revenue_partnerships(id) on delete cascade,
  performance_period_id uuid references public.revenue_partner_performance_periods(id) on delete set null,
  root_cause text not null,
  objective text not null,
  revenue_at_risk_mad numeric(18,2) not null default 0,
  owner text,
  executive_owner text,
  due_date date,
  success_measure text,
  status text not null default 'open',
  outcome text,
  closed_at timestamptz,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.revenue_partner_recovery_checkpoints (
  id uuid primary key default gen_random_uuid(),
  partnership_id uuid not null references public.revenue_partnerships(id) on delete cascade,
  recovery_plan_id uuid not null references public.revenue_partner_recovery_plans(id) on delete cascade,
  title text not null,
  due_date date,
  success_measure text,
  status text not null default 'planned',
  outcome text,
  evidence_reference text,
  completed_at timestamptz,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.revenue_partner_renewal_readiness (
  id uuid primary key default gen_random_uuid(),
  partnership_id uuid not null references public.revenue_partnerships(id) on delete cascade,
  contract_id uuid references public.revenue_contracts(id) on delete set null,
  performance_period_id uuid references public.revenue_partner_performance_periods(id) on delete set null,
  decision_date date,
  recommendation text not null default 'renew',
  evidence_summary text,
  status text not null default 'prepared',
  decision_reason text,
  proposal_id uuid references public.revenue_proposals(id) on delete set null,
  negotiation_id uuid references public.revenue_negotiations(id) on delete set null,
  proposal_requested_at timestamptz,
  negotiation_requested_at timestamptz,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.revenue_partner_expansions (
  id uuid primary key default gen_random_uuid(),
  partnership_id uuid not null references public.revenue_partnerships(id) on delete cascade,
  title text not null,
  expansion_type text not null,
  expected_value_mad numeric(18,2) not null default 0,
  required_investment_mad numeric(18,2) not null default 0,
  target_launch_date date,
  business_case text,
  status text not null default 'assessment',
  decision_reason text,
  approved_by uuid,
  approved_at timestamptz,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.revenue_partnership_status_history (
  id uuid primary key default gen_random_uuid(),
  partnership_id uuid not null references public.revenue_partnerships(id) on delete cascade,
  event_type text not null,
  previous_state text,
  new_state text,
  reason text,
  actor_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.revenue_partnership_risks (
  id uuid primary key default gen_random_uuid(),
  partnership_id uuid not null references public.revenue_partnerships(id) on delete cascade,
  title text not null,
  category text not null default 'relationship',
  description text,
  severity text not null default 'medium',
  probability numeric(7,2) not null default 50,
  value_affected_mad numeric(18,2) not null default 0,
  owner text,
  mitigation text,
  due_date date,
  status text not null default 'open',
  evidence_reference text,
  resolution text,
  resolved_by uuid,
  resolved_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.revenue_partnership_closures (
  id uuid primary key default gen_random_uuid(),
  partnership_id uuid not null references public.revenue_partnerships(id) on delete cascade,
  closure_type text not null,
  reason text not null,
  effective_date date,
  status text not null default 'confirmed',
  created_by uuid,
  created_at timestamptz not null default now()
);

create or replace function public.revenue_partner_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at=now();
  return new;
end
$$;

do $triggers$
declare table_name text;
begin
  foreach table_name in array array[
    'revenue_partnerships','revenue_partnership_stakeholders','revenue_partnership_qualifications',
    'revenue_partner_programs','revenue_partner_benefits','revenue_partnership_obligations',
    'revenue_partnership_milestones','revenue_partner_activation_plans','revenue_partner_referrals',
    'revenue_partner_performance_periods','revenue_partner_recovery_plans',
    'revenue_partner_recovery_checkpoints','revenue_partner_renewal_readiness',
    'revenue_partner_expansions','revenue_partnership_risks'
  ]
  loop
    execute format('drop trigger if exists %I on public.%I','trg_'||table_name||'_updated_at',table_name);
    execute format('create trigger %I before update on public.%I for each row execute function public.revenue_partner_touch_updated_at()','trg_'||table_name||'_updated_at',table_name);
  end loop;
end
$triggers$;

create or replace function public.revenue_partner_referral_history_trigger()
returns trigger language plpgsql as $$
begin
  if tg_op='INSERT' or old.status is distinct from new.status then
    insert into public.revenue_partner_referral_status_history(referral_id,partnership_id,previous_status,new_status,reason,actor_id,metadata)
    values(new.id,new.partnership_id,case when tg_op='INSERT' then null else old.status end,new.status,null,new.updated_by,'{}'::jsonb);
  end if;
  return new;
end
$$;
drop trigger if exists trg_revenue_partner_referral_history on public.revenue_partner_referrals;
create trigger trg_revenue_partner_referral_history
after insert or update of status on public.revenue_partner_referrals
for each row execute function public.revenue_partner_referral_history_trigger();

create index if not exists revenue_partnership_stakeholders_partner_idx on public.revenue_partnership_stakeholders(partnership_id,decision_role,status);
create index if not exists revenue_partnership_qualifications_partner_idx on public.revenue_partnership_qualifications(partnership_id,created_at desc);
create index if not exists revenue_partner_programs_partner_idx on public.revenue_partner_programs(partnership_id,status);
create index if not exists revenue_partner_benefits_partner_idx on public.revenue_partner_benefits(partnership_id,status,expiry_date);
create index if not exists revenue_partnership_obligations_partner_idx on public.revenue_partnership_obligations(partnership_id,status,due_date);
create index if not exists revenue_partner_activation_gates_partner_idx on public.revenue_partner_activation_gates(partnership_id,status,mandatory);
create index if not exists revenue_partner_referrals_partner_idx on public.revenue_partner_referrals(partnership_id,status,received_at desc);
create index if not exists revenue_partner_referrals_email_idx on public.revenue_partner_referrals(normalized_email) where normalized_email is not null;
create index if not exists revenue_partner_referrals_phone_idx on public.revenue_partner_referrals(normalized_phone) where normalized_phone is not null;
create index if not exists revenue_partner_attributions_event_idx on public.revenue_partner_referral_attributions(event_type,event_id,status);
create index if not exists revenue_partner_conflicts_open_idx on public.revenue_partner_attribution_conflicts(partnership_id,status,created_at desc);
create index if not exists revenue_partner_periods_partner_idx on public.revenue_partner_performance_periods(partnership_id,status,period_end desc);
create index if not exists revenue_partner_scorecards_partner_idx on public.revenue_partner_scorecards(partnership_id,created_at desc);
create index if not exists revenue_partner_recovery_partner_idx on public.revenue_partner_recovery_plans(partnership_id,status,due_date);
create index if not exists revenue_partner_renewal_partner_idx on public.revenue_partner_renewal_readiness(partnership_id,status,decision_date);
create index if not exists revenue_partner_expansion_partner_idx on public.revenue_partner_expansions(partnership_id,status,target_launch_date);
create index if not exists revenue_partnership_risks_partner_idx on public.revenue_partnership_risks(partnership_id,status,severity,due_date);

do $views$
declare
  account_label_expression text := 'null::text';
  partnership_columns text;
begin
  if to_regclass('public.revenue_accounts') is not null then
    if exists(select 1 from information_schema.columns where table_schema='public' and table_name='revenue_accounts' and column_name='account_name') then
      account_label_expression := 'a.account_name';
    elsif exists(select 1 from information_schema.columns where table_schema='public' and table_name='revenue_accounts' and column_name='name') then
      account_label_expression := 'a.name';
    elsif exists(select 1 from information_schema.columns where table_schema='public' and table_name='revenue_accounts' and column_name='legal_name') then
      account_label_expression := 'a.legal_name';
    end if;
  end if;
  select string_agg(format('p.%I',column_name),', ' order by ordinal_position)
    into partnership_columns
  from information_schema.columns
  where table_schema='public' and table_name='revenue_partnerships'
    and column_name not in ('entity_name','referral_count','attributed_referral_count','realized_value_mad','open_risk_count','open_obligation_count','last_activity_effective');
  if partnership_columns is null then raise exception 'MEGA ZIP 8 BLOCKED: aucune colonne exploitable dans revenue_partnerships.'; end if;
  execute format($view$
    create or replace view public.revenue_partnership_command_view as
    select
      %s,
      coalesce(nullif(p.partner_name,''),nullif(%s,''),'Partenaire ANGELCARE') as entity_name,
      coalesce((select count(*) from public.revenue_partner_referrals r where r.partnership_id=p.id),0)::integer as referral_count,
      coalesce((select count(*) from public.revenue_partner_referral_attributions at where at.partnership_id=p.id and at.status in ('confirmed','attributed','active')),0)::integer as attributed_referral_count,
      coalesce((select sum(at.attributed_value) from public.revenue_partner_referral_attributions at where at.partnership_id=p.id and at.event_type='revenue_realized' and at.status in ('confirmed','attributed','active')),0)::numeric(18,2) as realized_value_mad,
      coalesce((select count(*) from public.revenue_partnership_risks rk where rk.partnership_id=p.id and rk.status not in ('resolved','closed','accepted')),0)::integer as open_risk_count,
      coalesce((select count(*) from public.revenue_partnership_obligations ob where ob.partnership_id=p.id and ob.status not in ('completed','cancelled','waived')),0)::integer as open_obligation_count,
      greatest(coalesce(p.last_activity_at,p.updated_at,p.created_at),coalesce((select max(r.received_at) from public.revenue_partner_referrals r where r.partnership_id=p.id),p.created_at)) as last_activity_effective
    from public.revenue_partnerships p
    left join public.revenue_accounts a on a.id=p.account_id
  $view$,partnership_columns,account_label_expression);

  create or replace view public.revenue_partner_referral_command_view as
  select
    r.*,
    p.partner_name,
    o.title as opportunity_title,
    coalesce((select sum(at.attributed_value) from public.revenue_partner_referral_attributions at where at.referral_id=r.id and at.status in ('confirmed','attributed','active')),0)::numeric(18,2) as attributed_value_mad,
    coalesce((select count(*) from public.revenue_partner_attribution_conflicts c where c.referral_id=r.id and c.status='open'),0)::integer as open_conflict_count
  from public.revenue_partner_referrals r
  join public.revenue_partnerships p on p.id=r.partnership_id
  left join public.revenue_opportunities o on o.id=r.linked_opportunity_id;

  create or replace view public.revenue_partner_performance_command_view as
  select
    pp.*,
    p.partner_name,
    sc.overall_score,
    sc.performance_status,
    sc.referral_count,
    sc.qualified_referral_count,
    sc.attributed_referral_count,
    sc.meeting_count,
    sc.contract_count,
    sc.realized_revenue_mad
  from public.revenue_partner_performance_periods pp
  join public.revenue_partnerships p on p.id=pp.partnership_id
  left join public.revenue_partner_scorecards sc on sc.performance_period_id=pp.id;
end
$views$;

create or replace function public.revenue_accept_partner_referral(
  p_referral_id uuid,
  p_actor_id uuid default null,
  p_convert_to_prospect boolean default false,
  p_owner text default null
)
returns table(referral_id uuid,prospect_id text,referral_status text,task_id uuid)
language plpgsql
security definer
set search_path=public
as $$
declare
  referral public.revenue_partner_referrals%rowtype;
  generated_prospect_id text;
  generated_task_id uuid;
  open_conflicts integer;
  existing_prospect_id text;
begin
  select * into referral from public.revenue_partner_referrals where id=p_referral_id for update;
  if not found then raise exception 'Referral introuvable.'; end if;
  if referral.consent_status in ('denied','refused') then raise exception 'La contactabilité a été refusée.'; end if;
  if referral.status in ('converted_to_prospect','converted_to_opportunity','attributed') and referral.linked_prospect_id is not null then
    select id into generated_task_id from public.revenue_tasks where metadata->>'partner_referral_id'=referral.id::text order by created_at desc limit 1;
    return query select referral.id,referral.linked_prospect_id,referral.status,generated_task_id;
    return;
  end if;
  select count(*) into open_conflicts from public.revenue_partner_attribution_conflicts where referral_id=referral.id and status='open';
  if referral.status='duplicate_review' and open_conflicts>0 then raise exception 'Le conflit de doublon doit être résolu avant acceptation.'; end if;
  generated_prospect_id:=referral.linked_prospect_id;
  if p_convert_to_prospect and generated_prospect_id is null then
    select pr.id into existing_prospect_id
    from public.revenue_prospects pr
    where (referral.normalized_email is not null and lower(coalesce(pr.email,''))=referral.normalized_email)
       or (referral.normalized_phone is not null and regexp_replace(coalesce(pr.phone,''),'[^0-9+]','','g')=referral.normalized_phone)
    order by pr.created_at asc limit 1;
    if existing_prospect_id is not null then
      update public.revenue_partner_referrals set status='duplicate_review',linked_prospect_id=existing_prospect_id,updated_by=p_actor_id,updated_at=now() where id=referral.id;
      insert into public.revenue_partner_attribution_conflicts(partnership_id,referral_id,conflict_type,description,existing_prospect_id,value_at_risk_mad,status,created_by)
      values(referral.partnership_id,referral.id,'pre_existing_prospect','Le referral correspond à un prospect existant et nécessite une décision d’attribution.',existing_prospect_id,referral.estimated_value_mad,'open',p_actor_id);
      return query select referral.id,existing_prospect_id,'duplicate_review'::text,null::uuid;
      return;
    end if;
    generated_prospect_id:=gen_random_uuid()::text;
    insert into public.revenue_prospects(
      id,name,contact_name,email,phone,company,city,owner,source,segment,stage,status,value_mad,pipeline_value,priority,next_action,notes,metadata,data,created_at,updated_at
    ) values(
      generated_prospect_id,referral.referred_name,referral.referred_name,referral.email,referral.phone,referral.referred_name,
      coalesce(referral.territory,'Unassigned'),coalesce(p_owner,referral.owner,'Revenue Command'),'partner_referral','b2b','new_lead','active',
      referral.estimated_value_mad,referral.estimated_value_mad,'high','Contacter et qualifier le referral',
      'Créé depuis le referral partenaire '||referral.id::text,
      jsonb_build_object('partner_referral_id',referral.id,'partnership_id',referral.partnership_id),
      jsonb_build_object('partner_referral_id',referral.id,'partnership_id',referral.partnership_id),now(),now()
    );
  end if;
  update public.revenue_partner_referrals
  set status=case when p_convert_to_prospect then 'converted_to_prospect' else 'accepted' end,
      linked_prospect_id=generated_prospect_id,owner=coalesce(p_owner,owner),updated_by=p_actor_id,updated_at=now()
  where id=referral.id;
  select id into generated_task_id from public.revenue_tasks where metadata->>'partner_referral_id'=referral.id::text order by created_at desc limit 1;
  if generated_task_id is null then
    insert into public.revenue_tasks(title,description,entity_type,entity_id,entity_name,partnership_id,prospect_id,owner,priority,status,due_date,task_type,workspace_slug,metadata)
    values(
    'Prendre en charge le referral partenaire',
    'Qualifier, contacter et documenter le referral '||referral.referred_name,
    'partnership',referral.partnership_id::text,referral.referred_name,referral.partnership_id::text,generated_prospect_id,
    coalesce(p_owner,referral.owner,'Revenue Command'),'high','planned',(current_date+2),'partner_referral_follow_up','revenue-command-center',
      jsonb_build_object('partner_referral_id',referral.id,'partnership_id',referral.partnership_id)
    ) returning id into generated_task_id;
  end if;
  return query select referral.id,generated_prospect_id,case when p_convert_to_prospect then 'converted_to_prospect' else 'accepted' end,generated_task_id;
end
$$;

-- Attribution total exceeds 100 percent is prohibited for every commercial event.
create or replace function public.revenue_create_partner_attribution(
  p_referral_id uuid,
  p_event_type text,
  p_event_id text,
  p_attribution_share numeric,
  p_value_mad numeric,
  p_evidence_reference text,
  p_override_reason text default null,
  p_actor_id uuid default null
)
returns table(attribution_id uuid,attributed_value numeric,total_event_share numeric)
language plpgsql
security definer
set search_path=public
as $$
declare
  referral public.revenue_partner_referrals%rowtype;
  existing_share numeric;
  source_value numeric;
  final_value numeric;
  created_id uuid;
  open_conflicts integer;
  event_uuid uuid;
  source_currency text := 'MAD';
  existing_attribution_id uuid;
  existing_attribution_value numeric;
begin
  select * into referral from public.revenue_partner_referrals where id=p_referral_id for update;
  if not found then raise exception 'Referral introuvable.'; end if;
  if referral.status in ('rejected','invalid','duplicate','closed') then raise exception 'Ce referral n’est pas éligible à l’attribution.'; end if;
  if p_event_type not in ('prospect_created','opportunity_created','meeting_completed','proposal_created','contract_signed','payment_confirmed','revenue_realized') then
    raise exception 'Type d’événement d’attribution non autorisé.';
  end if;
  if nullif(btrim(coalesce(p_evidence_reference,'')),'') is null then raise exception 'Une preuve d’attribution est requise.'; end if;
  select id,attributed_value into existing_attribution_id,existing_attribution_value
  from public.revenue_partner_referral_attributions
  where referral_id=referral.id and event_type=p_event_type and event_id=p_event_id
  limit 1;
  if found then
    select coalesce(sum(attribution_share),0) into existing_share from public.revenue_partner_referral_attributions
    where event_type=p_event_type and event_id=p_event_id and status in ('confirmed','attributed','active');
    return query select existing_attribution_id,existing_attribution_value,existing_share;
    return;
  end if;
  select count(*) into open_conflicts from public.revenue_partner_attribution_conflicts where referral_id=referral.id and status='open';
  if open_conflicts>0 and p_override_reason is null then raise exception 'Un conflit d’attribution reste ouvert.'; end if;
  if p_attribution_share<=0 or p_attribution_share>100 then raise exception 'La part d’attribution doit être comprise entre 0 et 100.'; end if;
  select coalesce(sum(attribution_share),0) into existing_share
  from public.revenue_partner_referral_attributions
  where event_type=p_event_type and event_id=p_event_id and status in ('confirmed','attributed','active');
  if existing_share+p_attribution_share>100.0001 then raise exception 'La somme des attributions de cet événement dépasse 100%%.'; end if;
  source_value:=greatest(coalesce(p_value_mad,0),0);
  if p_event_type='prospect_created' then
    perform 1 from public.revenue_prospects pr
    where pr.id=p_event_id and (referral.linked_prospect_id is null or pr.id=referral.linked_prospect_id);
    if not found then raise exception 'Le prospect ne peut pas être relié à ce referral.'; end if;
    source_value:=case when source_value>0 then source_value else referral.estimated_value_mad end;
  elsif p_event_type='opportunity_created' then
    begin event_uuid:=p_event_id::uuid; exception when invalid_text_representation then raise exception 'eventId d’opportunité invalide.'; end;
    select o.value_mad,o.currency into source_value,source_currency
    from public.revenue_opportunities o
    where o.id=event_uuid and o.status not in ('archived','cancelled')
      and (referral.linked_opportunity_id is null or o.id=referral.linked_opportunity_id)
      and (referral.linked_prospect_id is null or o.prospect_id=referral.linked_prospect_id);
    if not found then raise exception 'L’opportunité ne peut pas être reliée à ce referral.'; end if;
  elsif p_event_type='meeting_completed' then
    begin event_uuid:=p_event_id::uuid; exception when invalid_text_representation then raise exception 'eventId de meeting invalide.'; end;
    select greatest(coalesce(a.commercial_value_mad,0),coalesce(p_value_mad,0)),'MAD' into source_value,source_currency
    from public.revenue_appointments a
    where a.id=event_uuid and a.status in ('completed','done')
      and (
        a.partnership_id=referral.partnership_id::text
        or (referral.linked_prospect_id is not null and a.prospect_id::text=referral.linked_prospect_id)
        or (referral.linked_opportunity_id is not null and a.opportunity_id=referral.linked_opportunity_id)
      );
    if not found then raise exception 'Le meeting complété ne peut pas être relié à ce referral.'; end if;
  elsif p_event_type='proposal_created' then
    begin event_uuid:=p_event_id::uuid; exception when invalid_text_representation then raise exception 'eventId de proposition invalide.'; end;
    select greatest(coalesce(p.net_value,0),coalesce(p.gross_value,0)),p.currency into source_value,source_currency
    from public.revenue_proposals p
    where p.id=event_uuid and p.status not in ('withdrawn','archived')
      and (
        p.partnership_id=referral.partnership_id::text
        or (referral.linked_prospect_id is not null and p.prospect_id=referral.linked_prospect_id)
        or (referral.linked_opportunity_id is not null and p.opportunity_id=referral.linked_opportunity_id)
      );
    if not found then raise exception 'La proposition ne peut pas être reliée à ce referral.'; end if;
  elsif p_event_type='contract_signed' then
    begin event_uuid:=p_event_id::uuid; exception when invalid_text_representation then raise exception 'eventId de contrat invalide.'; end;
    select greatest(coalesce(c.signed_value,0),coalesce(c.contract_value,0)),c.currency into source_value,source_currency
    from public.revenue_contracts c
    where c.id=event_uuid and c.status in ('fully_signed','conditions_pending','effective','activation_pending','active','completed')
      and (
        c.partnership_id=referral.partnership_id::text
        or (referral.linked_prospect_id is not null and c.prospect_id=referral.linked_prospect_id)
        or (referral.linked_opportunity_id is not null and c.opportunity_id=referral.linked_opportunity_id)
      );
    if not found then raise exception 'Le contrat signé ne peut pas être relié à ce referral.'; end if;
  elsif p_event_type='payment_confirmed' then
    begin event_uuid:=p_event_id::uuid; exception when invalid_text_representation then raise exception 'eventId de paiement invalide.'; end;
    select pc.confirmed_amount,pc.currency into source_value,source_currency
    from public.revenue_payment_confirmations pc
    join public.revenue_contracts c on c.id=pc.contract_id
    where pc.id=event_uuid and pc.reconciliation_status in ('confirmed','partial')
      and (
        c.partnership_id=referral.partnership_id::text
        or (referral.linked_prospect_id is not null and c.prospect_id=referral.linked_prospect_id)
        or (referral.linked_opportunity_id is not null and c.opportunity_id=referral.linked_opportunity_id)
      );
    if not found then raise exception 'Le paiement confirmé ne peut pas être relié à ce referral.'; end if;
  elsif p_event_type='revenue_realized' then
    begin event_uuid:=p_event_id::uuid; exception when invalid_text_representation then raise exception 'eventId de réalisation invalide.'; end;
    select e.amount,e.currency into source_value,source_currency
    from public.revenue_realization_events e
    join public.revenue_contracts c on c.id=e.contract_id
    where e.id=event_uuid and e.status in ('realized','partially_realized')
      and (
        c.partnership_id=referral.partnership_id::text
        or (referral.linked_prospect_id is not null and c.prospect_id=referral.linked_prospect_id)
        or (referral.linked_opportunity_id is not null and c.opportunity_id=referral.linked_opportunity_id)
      );
    if not found then raise exception 'La réalisation confirmée ne peut pas être reliée à ce referral ou partenariat.'; end if;
    if p_value_mad>0 then source_value:=least(source_value,p_value_mad); end if;
  end if;
  source_value:=greatest(coalesce(source_value,0),0);
  final_value:=round(source_value*(p_attribution_share/100.0),2);
  insert into public.revenue_partner_referral_attributions(
    partnership_id,referral_id,event_type,event_id,attribution_method,attribution_share,attributed_value,currency,evidence_reference,status,override_reason,created_by
  ) values(
    referral.partnership_id,referral.id,p_event_type,p_event_id,
    case when p_override_reason is null then 'rules_based_single_source' else 'executive_override' end,
    p_attribution_share,final_value,source_currency,p_evidence_reference,'confirmed',p_override_reason,p_actor_id
  ) returning id into created_id;
  update public.revenue_partner_referrals
  set status=case when p_event_type='revenue_realized' then 'attributed' else status end,updated_by=p_actor_id,updated_at=now()
  where id=referral.id;
  update public.revenue_partnerships p
  set attributed_realized_mad=coalesce((
      select sum(a.attributed_value) from public.revenue_partner_referral_attributions a
      where a.partnership_id=p.id and a.event_type='revenue_realized' and a.status in ('confirmed','attributed','active')
    ),0),
    last_activity_at=now(),updated_at=now()
  where p.id=referral.partnership_id;
  return query select created_id,final_value,existing_share+p_attribution_share;
end
$$;

create or replace function public.revenue_close_partner_performance_period(
  p_period_id uuid,
  p_actor_id uuid default null,
  p_summary text default null,
  p_recommendation text default null,
  p_commitments text default null
)
returns table(scorecard_id uuid,overall_score numeric,recommendation text)
language plpgsql
security definer
set search_path=public
as $$
declare
  period public.revenue_partner_performance_periods%rowtype;
  referral_count integer:=0;
  qualified_count integer:=0;
  attributed_count integer:=0;
  meeting_count integer:=0;
  contract_count integer:=0;
  realized_value numeric:=0;
  obligation_total integer:=0;
  obligation_completed integer:=0;
  referral_quality numeric:=0;
  conversion_score numeric:=0;
  realized_score numeric:=0;
  obligation_score numeric:=100;
  engagement_score numeric:=0;
  health_score numeric:=0;
  final_score numeric:=0;
  card_id uuid;
  final_recommendation text;
begin
  select * into period from public.revenue_partner_performance_periods where id=p_period_id for update;
  if not found then raise exception 'Période de performance introuvable.'; end if;
  if period.status='closed' then raise exception 'La période est déjà clôturée et immuable.'; end if;
  select count(*),count(*) filter(where status in ('accepted','contact_permission_confirmed','qualification','converted_to_prospect','converted_to_opportunity','meeting','proposal','contract','payment_confirmed','revenue_realized','attributed','closed')),count(*) filter(where status='attributed')
  into referral_count,qualified_count,attributed_count
  from public.revenue_partner_referrals
  where partnership_id=period.partnership_id and received_at::date between period.period_start and period.period_end;
  select count(*) into meeting_count from public.revenue_appointments
  where partnership_id=period.partnership_id::text and coalesce(scheduled_at,appointment_at,created_at)::date between period.period_start and period.period_end and status in ('completed','done');
  select count(*) into contract_count from public.revenue_contracts
  where partnership_id=period.partnership_id::text and created_at::date between period.period_start and period.period_end and status in ('fully_signed','effective','active','completed');
  select coalesce(sum(a.attributed_value),0) into realized_value
  from public.revenue_partner_referral_attributions a
  where a.partnership_id=period.partnership_id and a.event_type='revenue_realized' and a.status in ('confirmed','attributed','active')
    and a.created_at::date between period.period_start and period.period_end;
  select count(*),count(*) filter(where status='completed') into obligation_total,obligation_completed
  from public.revenue_partnership_obligations
  where partnership_id=period.partnership_id and created_at::date<=period.period_end;
  referral_quality:=case when referral_count>0 then least(100,qualified_count::numeric/referral_count*100) else 0 end;
  conversion_score:=case when referral_count>0 then least(100,attributed_count::numeric/referral_count*100) else 0 end;
  realized_score:=case when period.target_realized_mad>0 then least(100,realized_value/period.target_realized_mad*100) else case when realized_value>0 then 100 else 0 end end;
  obligation_score:=case when obligation_total>0 then obligation_completed::numeric/obligation_total*100 else 100 end;
  engagement_score:=case when period.target_meetings>0 then least(100,meeting_count::numeric/period.target_meetings*100) else case when meeting_count>0 then 100 else 0 end end;
  health_score:=greatest(0,least(100,100-(select coalesce(sum(case severity when 'critical' then 25 when 'high' then 15 when 'medium' then 8 else 3 end),0) from public.revenue_partnership_risks where partnership_id=period.partnership_id and status='open')));
  final_score:=round(referral_quality*.20+conversion_score*.20+realized_score*.25+obligation_score*.15+engagement_score*.10+health_score*.10,2);
  final_recommendation:=coalesce(nullif(p_recommendation,''),case when final_score>=82 then 'expand' when final_score>=65 then 'renew' when final_score>=42 then 'recovery' else 'terminate' end);
  insert into public.revenue_partner_scorecards(
    partnership_id,performance_period_id,referral_quality_score,conversion_score,realized_revenue_score,obligation_compliance_score,
    engagement_score,relationship_health_score,overall_score,referral_count,qualified_referral_count,attributed_referral_count,
    meeting_count,contract_count,realized_revenue_mad,performance_status,components,source_evidence,created_by
  ) values(
    period.partnership_id,period.id,referral_quality,conversion_score,realized_score,obligation_score,engagement_score,health_score,final_score,
    referral_count,qualified_count,attributed_count,meeting_count,contract_count,realized_value,
    case when final_score>=82 then 'excellent' when final_score>=65 then 'performing' when final_score>=42 then 'under_review' else 'at_risk' end,
    jsonb_build_object('referral_quality',referral_quality,'conversion',conversion_score,'realized',realized_score,'obligations',obligation_score,'engagement',engagement_score,'health',health_score),
    jsonb_build_object('period_start',period.period_start,'period_end',period.period_end),p_actor_id
  ) returning id into card_id;
  update public.revenue_partner_performance_periods set status='closed',closed_at=now(),updated_by=p_actor_id,updated_at=now() where id=period.id;
  insert into public.revenue_partner_reviews(partnership_id,performance_period_id,summary,recommendation,commitments,status,reviewed_at,created_by)
  values(period.partnership_id,period.id,p_summary,final_recommendation,
    case when nullif(btrim(coalesce(p_commitments,'')),'') is null then '[]'::jsonb else to_jsonb(regexp_split_to_array(btrim(p_commitments),E'\n+')) end,
    'prepared',now(),p_actor_id);
  update public.revenue_partnerships
  set health_score=final_score,health_status=case when final_score>=65 then 'healthy' when final_score>=42 then 'watch' else 'at_risk' end,
      stage=case when final_recommendation='expand' then 'expansion' when final_recommendation='recovery' then 'recovery' when final_recommendation='terminate' then 'at_risk' else 'under_review' end,
      last_activity_at=now(),updated_at=now()
  where id=period.partnership_id;
  return query select card_id,final_score,final_recommendation;
end
$$;

create or replace function public.revenue_evaluate_partner_activation(
  p_partnership_id uuid,
  p_actor_id uuid default null,
  p_decision text default null,
  p_reason text default null
)
returns table(partnership_id uuid,mandatory_total integer,mandatory_passed integer,activation_status text)
language plpgsql
security definer
set search_path=public
as $$
declare
  partner public.revenue_partnerships%rowtype;
  total integer;
  passed integer;
  contract_ready boolean;
  program_ready boolean;
  final_status text;
begin
  select * into partner from public.revenue_partnerships where id=p_partnership_id for update;
  if not found then raise exception 'Partenaire introuvable.'; end if;
  select count(*),count(*) filter(where status in ('passed','completed','verified','approved'))
  into total,passed from public.revenue_partner_activation_gates where partnership_id=partner.id and mandatory=true;
  select exists(select 1 from public.revenue_contracts where id=partner.contract_id and status in ('fully_signed','conditions_pending','effective','activation_pending','active','completed')) into contract_ready;
  select exists(
    select 1 from public.revenue_partner_programs pg
    where pg.partnership_id=partner.id
      and (
        pg.status in ('ready','active')
        or (pg.status='planning' and exists(select 1 from public.revenue_partner_program_service_lines sl where sl.program_id=pg.id and sl.status='configured'))
      )
  ) into program_ready;
  final_status:=case when contract_ready and program_ready and total>0 and total=passed then 'ready' else 'blocked' end;
  if p_decision='approved' then
    if final_status<>'ready' then raise exception 'Les gates obligatoires ne sont pas satisfaits.'; end if;
    final_status:='active';
    update public.revenue_partner_activation_plans set status='active',actual_launch_at=coalesce(actual_launch_at,now()),updated_by=p_actor_id,updated_at=now() where partnership_id=partner.id;
    update public.revenue_partnerships set stage='active',activation_status='active',last_activity_at=now(),updated_at=now(),updated_by=p_actor_id where id=partner.id;
  else
    update public.revenue_partnerships set activation_status=final_status,last_activity_at=now(),updated_at=now(),updated_by=p_actor_id where id=partner.id;
  end if;
  insert into public.revenue_partnership_status_history(partnership_id,event_type,previous_state,new_state,reason,actor_id,metadata)
  values(partner.id,'partner_activation_evaluated',partner.activation_status,final_status,p_reason,p_actor_id,jsonb_build_object('mandatory_total',total,'mandatory_passed',passed,'contract_ready',contract_ready,'program_ready',program_ready));
  return query select partner.id,total,passed,final_status;
end
$$;

create or replace function public.revenue_launch_partner_renewal_workflow(
  p_renewal_id uuid,
  p_action text,
  p_actor_id uuid default null,
  p_notes text default null
)
returns table(renewal_id uuid,proposal_id uuid,negotiation_id uuid,workflow_status text)
language plpgsql
security definer
set search_path=public
as $$
declare
  renewal public.revenue_partner_renewal_readiness%rowtype;
  partner public.revenue_partnerships%rowtype;
  proposal public.revenue_proposals%rowtype;
  created_proposal_id uuid;
  created_negotiation_id uuid;
begin
  select * into renewal from public.revenue_partner_renewal_readiness where id=p_renewal_id for update;
  if not found then raise exception 'Dossier de renouvellement introuvable.'; end if;
  if renewal.status not in ('approved','proposal_launched','negotiation_launched') then
    raise exception 'La recommandation de renouvellement doit être approuvée avant lancement.';
  end if;
  select * into partner from public.revenue_partnerships where id=renewal.partnership_id for update;
  if not found then raise exception 'Partenaire introuvable.'; end if;
  if p_action='launch_proposal' then
    created_proposal_id:=renewal.proposal_id;
    if created_proposal_id is null then
      insert into public.revenue_proposals(
        title,status,proposal_type,context_type,prospect_id,account_id,partnership_id,owner,currency,
        commercial_objective,client_need,next_action,validity_until,metadata,created_by,updated_by
      ) values(
        'Renouvellement — '||coalesce(partner.partner_name,'Partenaire ANGELCARE'),'draft','partnership_renewal','partnership',
        partner.prospect_text_id,partner.account_id,partner.id::text,coalesce(partner.owner,'Partnership Manager'),'MAD',
        coalesce(nullif(p_notes,''),'Préparer le renouvellement sur la base de la performance et des obligations vérifiées.'),
        renewal.evidence_summary,'Finaliser scope, pricing, approvals et conditions de renouvellement.',current_date+30,
        jsonb_build_object('renewal_id',renewal.id,'contract_id',renewal.contract_id,'source','partnership_enterprise'),p_actor_id,p_actor_id
      ) returning id into created_proposal_id;
    end if;
    update public.revenue_partner_renewal_readiness
      set proposal_id=created_proposal_id,proposal_requested_at=coalesce(proposal_requested_at,now()),status='proposal_launched',updated_by=p_actor_id,updated_at=now()
      where id=renewal.id;
    update public.revenue_partnerships set stage='renewal_pending',last_activity_at=now(),updated_at=now(),updated_by=p_actor_id where id=partner.id;
    return query select renewal.id,created_proposal_id,renewal.negotiation_id,'proposal_launched'::text;
    return;
  elsif p_action='launch_negotiation' then
    created_proposal_id:=renewal.proposal_id;
    if created_proposal_id is null then raise exception 'Une proposition de renouvellement doit être créée avant la négociation.'; end if;
    select * into proposal from public.revenue_proposals where id=created_proposal_id for update;
    if not found then raise exception 'Proposition de renouvellement introuvable.'; end if;
    created_negotiation_id:=renewal.negotiation_id;
    if created_negotiation_id is null then
      insert into public.revenue_negotiations(
        proposal_id,proposal_version_id,title,status,current_round,angelcare_position_value,customer_position_value,
        current_margin_percent,opening_position,owner,created_by,updated_by
      ) values(
        proposal.id,proposal.active_version_id,'Négociation renouvellement — '||proposal.title,'open',1,proposal.net_value,0,
        proposal.margin_percent,coalesce(nullif(p_notes,''),'Position ANGELCARE fondée sur performance, obligations et valeur réalisée.'),
        proposal.owner,p_actor_id,p_actor_id
      ) returning id into created_negotiation_id;
      insert into public.revenue_negotiation_rounds(negotiation_id,round_number,status,summary,opened_by)
      values(created_negotiation_id,1,'open',coalesce(nullif(p_notes,''),'Ouverture de la négociation de renouvellement.'),p_actor_id);
    end if;
    update public.revenue_proposals set status='negotiation',negotiation_status='open',updated_by=p_actor_id,updated_at=now() where id=proposal.id;
    update public.revenue_partner_renewal_readiness
      set negotiation_id=created_negotiation_id,negotiation_requested_at=coalesce(negotiation_requested_at,now()),status='negotiation_launched',updated_by=p_actor_id,updated_at=now()
      where id=renewal.id;
    return query select renewal.id,created_proposal_id,created_negotiation_id,'negotiation_launched'::text;
    return;
  end if;
  raise exception 'Action de renouvellement non autorisée.';
end
$$;

create or replace function public.revenue_partner_realization_reversal_trigger()
returns trigger language plpgsql security definer set search_path=public as $$
declare
  affected_partnership uuid;
begin
  if new.status='reversed' and new.reversal_of_id is not null then
    for affected_partnership in
      select distinct partnership_id from public.revenue_partner_referral_attributions
      where event_type='revenue_realized' and event_id=new.reversal_of_id::text and status in ('confirmed','attributed','active')
    loop
      update public.revenue_partner_referral_attributions
      set status='reversed',reversal_event_id=new.id,reversed_at=coalesce(new.realized_at,now())
      where partnership_id=affected_partnership and event_type='revenue_realized' and event_id=new.reversal_of_id::text
        and status in ('confirmed','attributed','active');
      update public.revenue_partnerships p
      set attributed_realized_mad=coalesce((select sum(a.attributed_value) from public.revenue_partner_referral_attributions a where a.partnership_id=p.id and a.event_type='revenue_realized' and a.status in ('confirmed','attributed','active')),0),
          last_activity_at=now(),updated_at=now()
      where p.id=affected_partnership;
    end loop;
  end if;
  return new;
end
$$;
drop trigger if exists trg_revenue_partner_realization_reversal on public.revenue_realization_events;
create trigger trg_revenue_partner_realization_reversal
after insert on public.revenue_realization_events
for each row execute function public.revenue_partner_realization_reversal_trigger();

do $rls$
declare table_name text;
begin
  foreach table_name in array array[
    'revenue_partnership_stakeholders','revenue_partnership_qualifications','revenue_partner_programs',
    'revenue_partner_program_locations','revenue_partner_program_service_lines','revenue_partner_benefits',
    'revenue_partner_benefit_usage','revenue_partnership_obligations','revenue_partnership_milestones',
    'revenue_partner_activation_plans','revenue_partner_activation_gates','revenue_partner_referrals',
    'revenue_partner_referral_status_history','revenue_partner_referral_attributions','revenue_partner_attribution_conflicts',
    'revenue_partner_performance_periods','revenue_partner_performance_metrics','revenue_partner_scorecards',
    'revenue_partner_reviews','revenue_partner_recovery_plans','revenue_partner_recovery_checkpoints',
    'revenue_partner_renewal_readiness','revenue_partner_expansions','revenue_partnership_status_history',
    'revenue_partnership_risks','revenue_partnership_closures'
  ]
  loop
    execute format('alter table public.%I enable row level security',table_name);
    execute format('drop policy if exists %I on public.%I','partnership_enterprise_authenticated_read',table_name);
    execute format('create policy %I on public.%I for select to authenticated using (auth.uid() is not null)','partnership_enterprise_authenticated_read',table_name);
    execute format('revoke insert,update,delete on public.%I from anon,authenticated',table_name);
    execute format('grant select on public.%I to authenticated',table_name);
    execute format('grant all on public.%I to service_role',table_name);
  end loop;
end
$rls$;

revoke all on function public.revenue_partner_realization_reversal_trigger() from public,anon,authenticated;
revoke all on function public.revenue_launch_partner_renewal_workflow(uuid,text,uuid,text) from public,anon,authenticated;
revoke all on function public.revenue_accept_partner_referral(uuid,uuid,boolean,text) from public,anon,authenticated;
revoke all on function public.revenue_create_partner_attribution(uuid,text,text,numeric,numeric,text,text,uuid) from public,anon,authenticated;
revoke all on function public.revenue_close_partner_performance_period(uuid,uuid,text,text,text) from public,anon,authenticated;
revoke all on function public.revenue_evaluate_partner_activation(uuid,uuid,text,text) from public,anon,authenticated;
grant execute on function public.revenue_accept_partner_referral(uuid,uuid,boolean,text) to service_role;
grant execute on function public.revenue_create_partner_attribution(uuid,text,text,numeric,numeric,text,text,uuid) to service_role;
grant execute on function public.revenue_close_partner_performance_period(uuid,uuid,text,text,text) to service_role;
grant execute on function public.revenue_evaluate_partner_activation(uuid,uuid,text,text) to service_role;
grant execute on function public.revenue_launch_partner_renewal_workflow(uuid,text,uuid,text) to service_role;

grant select on public.revenue_partnership_command_view to authenticated,service_role;
grant select on public.revenue_partner_referral_command_view to authenticated,service_role;
grant select on public.revenue_partner_performance_command_view to authenticated,service_role;

commit;
