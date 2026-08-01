begin;

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
