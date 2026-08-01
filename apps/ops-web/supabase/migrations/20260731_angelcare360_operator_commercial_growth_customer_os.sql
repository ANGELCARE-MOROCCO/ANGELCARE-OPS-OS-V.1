begin;

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

commit;
