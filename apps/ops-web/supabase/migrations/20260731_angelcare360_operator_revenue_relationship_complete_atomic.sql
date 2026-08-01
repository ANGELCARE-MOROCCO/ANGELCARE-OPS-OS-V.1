begin;

-- ================================================================
-- PHASE 1 — REQUIRED COMMERCIAL GROWTH FOUNDATION
-- ================================================================

create extension if not exists pgcrypto;

create table if not exists public.angelcare360_operator_growth_prospects (
  id uuid primary key default gen_random_uuid(),
  prospect_code text not null unique,
  organization_name text not null,
  organization_type text not null default 'school',
  status text not null default 'new',
  qualification_stage text not null default 'target',
  source text,
  city text,
  region text,
  country text not null default 'Maroc',
  potential_mrr_mad numeric(14,2) not null default 0,
  estimated_students integer,
  institution_count integer,
  current_solution text,
  pain_points text[] not null default '{}',
  product_fit jsonb not null default '{}'::jsonb,
  owner_id uuid,
  next_action text,
  next_action_at timestamptz,
  converted_client_id uuid references public.angelcare360_operator_clients(id) on delete set null,
  notes text,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint angelcare360_growth_prospect_status_check check (status in ('new','researching','contacted','qualified','disqualified','converted','archived')),
  constraint angelcare360_growth_qualification_check check (qualification_stage in ('target','identified','contacted','discovery','qualified','nurturing'))
);

create table if not exists public.angelcare360_operator_growth_contacts (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.angelcare360_operator_clients(id) on delete cascade,
  prospect_id uuid references public.angelcare360_operator_growth_prospects(id) on delete cascade,
  full_name text not null,
  email text,
  phone text,
  role_type text not null default 'influencer',
  job_title text,
  institution_name text,
  influence_level text not null default 'medium',
  decision_authority text not null default 'influencer',
  relationship_strength text not null default 'developing',
  position text not null default 'neutral',
  is_primary boolean not null default false,
  communication_preferences jsonb not null default '{}'::jsonb,
  last_interaction_at timestamptz,
  next_engagement_at timestamptz,
  status text not null default 'active',
  notes text,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint angelcare360_growth_contact_account_check check (client_id is not null or prospect_id is not null),
  constraint angelcare360_growth_contact_influence_check check (influence_level in ('low','medium','high','critical')),
  constraint angelcare360_growth_contact_authority_check check (decision_authority in ('none','influencer','recommender','co_decider','final_authority')),
  constraint angelcare360_growth_contact_strength_check check (relationship_strength in ('unknown','weak','developing','strong','trusted')),
  constraint angelcare360_growth_contact_position_check check (position in ('supporter','neutral','undecided','skeptical','opposed'))
);

create table if not exists public.angelcare360_operator_growth_opportunities (
  id uuid primary key default gen_random_uuid(),
  opportunity_code text not null unique,
  client_id uuid references public.angelcare360_operator_clients(id) on delete cascade,
  prospect_id uuid references public.angelcare360_operator_growth_prospects(id) on delete cascade,
  name text not null,
  objective text,
  stage text not null default 'identified',
  status text not null default 'active',
  owner_id uuid,
  sponsor_id uuid,
  expected_mrr_mad numeric(14,2) not null default 0,
  expected_arr_mad numeric(14,2) not null default 0,
  probability integer not null default 20,
  expected_close_date date,
  package_version_id uuid references public.angelcare360_operator_package_versions(id) on delete set null,
  product_configuration jsonb not null default '{}'::jsonb,
  competition text,
  risks text[] not null default '{}',
  next_event text,
  next_event_at timestamptz,
  loss_reason text,
  won_at timestamptz,
  lost_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint angelcare360_growth_opportunity_account_check check (client_id is not null or prospect_id is not null),
  constraint angelcare360_growth_opportunity_probability_check check (probability between 0 and 100),
  constraint angelcare360_growth_opportunity_stage_check check (stage in ('identified','qualified','discovery','solution_design','offer_preparation','proposal_submitted','negotiation','decision','contracting','won','lost')),
  constraint angelcare360_growth_opportunity_status_check check (status in ('active','at_risk','blocked','won','lost','archived'))
);

create table if not exists public.angelcare360_operator_growth_offers (
  id uuid primary key default gen_random_uuid(),
  offer_code text not null unique,
  opportunity_id uuid references public.angelcare360_operator_growth_opportunities(id) on delete set null,
  client_id uuid references public.angelcare360_operator_clients(id) on delete cascade,
  prospect_id uuid references public.angelcare360_operator_growth_prospects(id) on delete cascade,
  name text not null,
  status text not null default 'draft',
  package_version_id uuid references public.angelcare360_operator_package_versions(id) on delete set null,
  configuration_snapshot jsonb not null default '{}'::jsonb,
  price_book_id uuid references public.angelcare360_operator_price_books(id) on delete set null,
  monthly_price_mad numeric(14,2) not null default 0,
  annual_price_mad numeric(14,2) not null default 0,
  setup_fee_mad numeric(14,2) not null default 0,
  discount_mad numeric(14,2) not null default 0,
  contract_value_mad numeric(14,2) not null default 0,
  contract_duration_months integer not null default 12,
  payment_schedule text,
  validity_date date,
  approval_status text not null default 'pending',
  value_case jsonb not null default '{}'::jsonb,
  submitted_at timestamptz,
  accepted_at timestamptz,
  rejected_at timestamptz,
  converted_contract_id uuid references public.angelcare360_operator_contracts(id) on delete set null,
  notes text,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint angelcare360_growth_offer_account_check check (client_id is not null or prospect_id is not null or opportunity_id is not null),
  constraint angelcare360_growth_offer_status_check check (status in ('draft','internal_review','pricing_review','approved','submitted','revised','accepted','rejected','expired','converted','archived')),
  constraint angelcare360_growth_offer_approval_check check (approval_status in ('pending','under_review','approved','approved_with_conditions','rejected'))
);

create table if not exists public.angelcare360_operator_growth_interactions (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.angelcare360_operator_clients(id) on delete cascade,
  prospect_id uuid references public.angelcare360_operator_growth_prospects(id) on delete cascade,
  opportunity_id uuid references public.angelcare360_operator_growth_opportunities(id) on delete cascade,
  contact_id uuid references public.angelcare360_operator_growth_contacts(id) on delete set null,
  interaction_type text not null default 'meeting',
  subject text not null,
  summary text,
  occurred_at timestamptz not null default now(),
  outcome text,
  next_action text,
  next_action_at timestamptz,
  created_by uuid,
  created_at timestamptz not null default now(),
  constraint angelcare360_growth_interaction_context_check check (client_id is not null or prospect_id is not null or opportunity_id is not null)
);

create table if not exists public.angelcare360_operator_growth_expansion (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.angelcare360_operator_clients(id) on delete cascade,
  tenant_id uuid references public.angelcare360_operator_tenants(id) on delete set null,
  subscription_id uuid references public.angelcare360_operator_subscriptions(id) on delete set null,
  opportunity_type text not null,
  title text not null,
  status text not null default 'identified',
  expected_mrr_mad numeric(14,2) not null default 0,
  evidence jsonb not null default '{}'::jsonb,
  recommended_package_version_id uuid references public.angelcare360_operator_package_versions(id) on delete set null,
  owner_id uuid,
  next_action text,
  next_action_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint angelcare360_growth_expansion_status_check check (status in ('identified','qualified','proposal','negotiation','approved','won','lost','closed','archived'))
);

create table if not exists public.angelcare360_operator_growth_interventions (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.angelcare360_operator_clients(id) on delete cascade,
  intervention_type text not null,
  title text not null,
  status text not null default 'identified',
  priority text not null default 'high',
  diagnosis text,
  business_risk text,
  financial_exposure_mad numeric(14,2) not null default 0,
  service_impact text,
  owner_id uuid,
  sponsor_id uuid,
  action_plan jsonb not null default '[]'::jsonb,
  due_date date,
  expected_outcome text,
  outcome_status text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint angelcare360_growth_intervention_status_check check (status in ('identified','assigned','planned','active','waiting_response','escalated','outcome_verification','resolved','reopened','closed','archived')),
  constraint angelcare360_growth_intervention_priority_check check (priority in ('low','normal','high','urgent'))
);

create index if not exists angelcare360_growth_prospects_status_idx on public.angelcare360_operator_growth_prospects(status, qualification_stage, updated_at desc);
create index if not exists angelcare360_growth_contacts_client_idx on public.angelcare360_operator_growth_contacts(client_id, status, updated_at desc);
create index if not exists angelcare360_growth_contacts_prospect_idx on public.angelcare360_operator_growth_contacts(prospect_id, status, updated_at desc);
create index if not exists angelcare360_growth_opportunities_stage_idx on public.angelcare360_operator_growth_opportunities(stage, status, expected_close_date);
create index if not exists angelcare360_growth_opportunities_client_idx on public.angelcare360_operator_growth_opportunities(client_id, updated_at desc);
create index if not exists angelcare360_growth_offers_status_idx on public.angelcare360_operator_growth_offers(status, approval_status, updated_at desc);
create index if not exists angelcare360_growth_interactions_context_idx on public.angelcare360_operator_growth_interactions(client_id, prospect_id, opportunity_id, occurred_at desc);
create index if not exists angelcare360_growth_expansion_client_idx on public.angelcare360_operator_growth_expansion(client_id, status, updated_at desc);
create index if not exists angelcare360_growth_interventions_client_idx on public.angelcare360_operator_growth_interventions(client_id, status, priority, updated_at desc);

alter table public.angelcare360_operator_growth_prospects enable row level security;
alter table public.angelcare360_operator_growth_contacts enable row level security;
alter table public.angelcare360_operator_growth_opportunities enable row level security;
alter table public.angelcare360_operator_growth_offers enable row level security;
alter table public.angelcare360_operator_growth_interactions enable row level security;
alter table public.angelcare360_operator_growth_expansion enable row level security;
alter table public.angelcare360_operator_growth_interventions enable row level security;

revoke all on public.angelcare360_operator_growth_prospects from anon, authenticated;
revoke all on public.angelcare360_operator_growth_contacts from anon, authenticated;
revoke all on public.angelcare360_operator_growth_opportunities from anon, authenticated;
revoke all on public.angelcare360_operator_growth_offers from anon, authenticated;
revoke all on public.angelcare360_operator_growth_interactions from anon, authenticated;
revoke all on public.angelcare360_operator_growth_expansion from anon, authenticated;
revoke all on public.angelcare360_operator_growth_interventions from anon, authenticated;

grant all on public.angelcare360_operator_growth_prospects to service_role;
grant all on public.angelcare360_operator_growth_contacts to service_role;
grant all on public.angelcare360_operator_growth_opportunities to service_role;
grant all on public.angelcare360_operator_growth_offers to service_role;
grant all on public.angelcare360_operator_growth_interactions to service_role;
grant all on public.angelcare360_operator_growth_expansion to service_role;
grant all on public.angelcare360_operator_growth_interventions to service_role;

comment on table public.angelcare360_operator_growth_prospects is 'Operator-only acquisition accounts preserving identity through commercial conversion.';
comment on table public.angelcare360_operator_growth_opportunities is 'Operator-only deal control synchronized with Product Studio packages.';
comment on table public.angelcare360_operator_growth_offers is 'Immutable commercial configuration snapshots used to create governed contracts.';

-- ================================================================
-- PREREQUISITE VERIFICATION
-- ================================================================

do $angelcare_preflight$
declare
  missing_relations text[];
begin
  select array_agg(required_relation)
  into missing_relations
  from (
    values
      ('public.angelcare360_operator_growth_prospects'),
      ('public.angelcare360_operator_growth_contacts'),
      ('public.angelcare360_operator_growth_opportunities'),
      ('public.angelcare360_operator_growth_offers'),
      ('public.angelcare360_operator_growth_interactions'),
      ('public.angelcare360_operator_growth_expansion'),
      ('public.angelcare360_operator_growth_interventions')
  ) as required(required_relation)
  where to_regclass(required_relation) is null;

  if missing_relations is not null then
    raise exception
      'Commercial Growth prerequisite creation failed. Missing: %',
      array_to_string(missing_relations, ', ');
  end if;
end
$angelcare_preflight$;

-- ================================================================
-- PHASE 2 — REVENUE RELATIONSHIP & CUSTOMER COMMAND OS
-- ================================================================

create table if not exists public.angelcare360_operator_growth_institutions (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.angelcare360_operator_clients(id) on delete cascade,
  prospect_id uuid references public.angelcare360_operator_growth_prospects(id) on delete cascade,
  institution_code text not null unique,
  name text not null,
  institution_type text not null default 'school',
  status text not null default 'active',
  city text,
  region text,
  country text not null default 'Maroc',
  address text,
  estimated_students integer,
  estimated_staff integer,
  tenant_id uuid references public.angelcare360_operator_tenants(id) on delete set null,
  primary_contact_id uuid references public.angelcare360_operator_growth_contacts(id) on delete set null,
  onboarding_state text,
  service_health text,
  metadata jsonb not null default '{}'::jsonb,
  notes text,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (client_id is not null or prospect_id is not null)
);

create table if not exists public.angelcare360_operator_growth_stakeholders (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references public.angelcare360_operator_growth_opportunities(id) on delete cascade,
  contact_id uuid not null references public.angelcare360_operator_growth_contacts(id) on delete cascade,
  stakeholder_role text not null default 'influencer',
  influence_level text not null default 'medium',
  decision_position text not null default 'neutral',
  engagement_state text not null default 'unknown',
  required_for_close boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (opportunity_id, contact_id)
);

create table if not exists public.angelcare360_operator_growth_offer_versions (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid not null references public.angelcare360_operator_growth_offers(id) on delete cascade,
  version_number integer not null,
  status text not null default 'draft',
  configuration_snapshot jsonb not null default '{}'::jsonb,
  pricing_snapshot jsonb not null default '{}'::jsonb,
  value_case_snapshot jsonb not null default '{}'::jsonb,
  change_summary text,
  created_by uuid,
  created_at timestamptz not null default now(),
  unique (offer_id, version_number)
);

create table if not exists public.angelcare360_operator_growth_negotiations (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid references public.angelcare360_operator_growth_opportunities(id) on delete cascade,
  offer_id uuid references public.angelcare360_operator_growth_offers(id) on delete cascade,
  client_id uuid references public.angelcare360_operator_clients(id) on delete cascade,
  event_type text not null,
  occurred_at timestamptz not null default now(),
  customer_position text,
  angelcare_position text,
  objection text,
  requested_concession text,
  approved_boundary text,
  financial_impact_mad numeric(14,2) not null default 0,
  decision_due_at timestamptz,
  next_meeting_at timestamptz,
  outcome text,
  notes text,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (opportunity_id is not null or offer_id is not null or client_id is not null)
);

create table if not exists public.angelcare360_operator_customer_cases (
  id uuid primary key default gen_random_uuid(),
  case_reference text not null unique,
  case_type text not null,
  source_channel text not null default 'internal',
  client_id uuid not null references public.angelcare360_operator_clients(id) on delete cascade,
  institution_id uuid references public.angelcare360_operator_growth_institutions(id) on delete set null,
  tenant_id uuid references public.angelcare360_operator_tenants(id) on delete set null,
  subscription_id uuid references public.angelcare360_operator_subscriptions(id) on delete set null,
  related_module_key text,
  subject text not null,
  description text,
  status text not null default 'received',
  severity text not null default 'medium',
  priority text not null default 'normal',
  business_impact text,
  customer_sentiment text,
  owner_id uuid,
  team text,
  sla_policy text,
  due_at timestamptz,
  escalated_at timestamptz,
  root_cause text,
  resolution_summary text,
  customer_confirmation text,
  outcome_status text,
  source_ticket_id uuid,
  source_incident_id uuid,
  reopened_count integer not null default 0,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (case_type in ('support_ticket','complaint','service_request','incident','product_problem','billing_complaint','relationship_complaint','implementation_issue')),
  check (status in ('received','triage','qualified','assigned','investigation','waiting_customer','waiting_internal','escalated','resolution_proposed','customer_validation','resolved','closed','reopened','archived')),
  check (severity in ('low','medium','high','critical'))
);

create table if not exists public.angelcare360_operator_customer_case_events (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.angelcare360_operator_customer_cases(id) on delete cascade,
  event_type text not null,
  summary text not null,
  visibility text not null default 'internal',
  actor_id uuid,
  occurred_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.angelcare360_operator_customer_case_evidence (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.angelcare360_operator_customer_cases(id) on delete cascade,
  evidence_type text not null,
  label text not null,
  url text,
  content jsonb not null default '{}'::jsonb,
  visibility text not null default 'internal',
  uploaded_by uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.angelcare360_operator_commercial_findings (
  id uuid primary key default gen_random_uuid(),
  finding_type text not null,
  severity text not null default 'medium',
  entity_type text not null,
  entity_id uuid,
  client_id uuid references public.angelcare360_operator_clients(id) on delete cascade,
  title text not null,
  explanation text not null,
  evidence jsonb not null default '{}'::jsonb,
  recommended_action text,
  status text not null default 'open',
  detected_at timestamptz not null default now(),
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_growth_institutions_client on public.angelcare360_operator_growth_institutions(client_id, status);
create index if not exists idx_growth_stakeholders_opportunity on public.angelcare360_operator_growth_stakeholders(opportunity_id);
create index if not exists idx_growth_offer_versions_offer on public.angelcare360_operator_growth_offer_versions(offer_id, version_number desc);
create index if not exists idx_growth_negotiations_offer on public.angelcare360_operator_growth_negotiations(offer_id, occurred_at desc);
create index if not exists idx_customer_cases_client on public.angelcare360_operator_customer_cases(client_id, status, severity);
create index if not exists idx_customer_cases_due on public.angelcare360_operator_customer_cases(due_at) where archived_at is null;
create index if not exists idx_customer_case_events_case on public.angelcare360_operator_customer_case_events(case_id, occurred_at desc);
create index if not exists idx_commercial_findings_entity on public.angelcare360_operator_commercial_findings(entity_type, entity_id, status);

alter table public.angelcare360_operator_growth_institutions enable row level security;
alter table public.angelcare360_operator_growth_stakeholders enable row level security;
alter table public.angelcare360_operator_growth_offer_versions enable row level security;
alter table public.angelcare360_operator_growth_negotiations enable row level security;
alter table public.angelcare360_operator_customer_cases enable row level security;
alter table public.angelcare360_operator_customer_case_events enable row level security;
alter table public.angelcare360_operator_customer_case_evidence enable row level security;
alter table public.angelcare360_operator_commercial_findings enable row level security;

revoke all on table public.angelcare360_operator_growth_institutions from anon, authenticated;
revoke all on table public.angelcare360_operator_growth_stakeholders from anon, authenticated;
revoke all on table public.angelcare360_operator_growth_offer_versions from anon, authenticated;
revoke all on table public.angelcare360_operator_growth_negotiations from anon, authenticated;
revoke all on table public.angelcare360_operator_customer_cases from anon, authenticated;
revoke all on table public.angelcare360_operator_customer_case_events from anon, authenticated;
revoke all on table public.angelcare360_operator_customer_case_evidence from anon, authenticated;
revoke all on table public.angelcare360_operator_commercial_findings from anon, authenticated;

grant all on table public.angelcare360_operator_growth_institutions to service_role;
grant all on table public.angelcare360_operator_growth_stakeholders to service_role;
grant all on table public.angelcare360_operator_growth_offer_versions to service_role;
grant all on table public.angelcare360_operator_growth_negotiations to service_role;
grant all on table public.angelcare360_operator_customer_cases to service_role;
grant all on table public.angelcare360_operator_customer_case_events to service_role;
grant all on table public.angelcare360_operator_customer_case_evidence to service_role;
grant all on table public.angelcare360_operator_commercial_findings to service_role;

commit;

-- ================================================================
-- FINAL DATABASE VERIFICATION
-- ================================================================

select
  table_name,
  'READY' as migration_status
from information_schema.tables
where table_schema = 'public'
  and table_name in (
    'angelcare360_operator_growth_prospects',
    'angelcare360_operator_growth_contacts',
    'angelcare360_operator_growth_opportunities',
    'angelcare360_operator_growth_offers',
    'angelcare360_operator_growth_interactions',
    'angelcare360_operator_growth_expansion',
    'angelcare360_operator_growth_interventions',
    'angelcare360_operator_growth_institutions',
    'angelcare360_operator_growth_stakeholders',
    'angelcare360_operator_growth_offer_versions',
    'angelcare360_operator_growth_negotiations',
    'angelcare360_operator_customer_cases',
    'angelcare360_operator_customer_case_events',
    'angelcare360_operator_customer_case_evidence',
    'angelcare360_operator_commercial_findings'
  )
order by table_name;
