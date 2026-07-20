begin;
create extension if not exists pgcrypto;

create table if not exists public.browser_extension_b2b_partners (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid not null unique,
  source_opportunity_id uuid references public.browser_extension_b2b_opportunities(id) on delete set null,
  parent_partner_id uuid references public.browser_extension_b2b_partners(id) on delete set null,
  legal_name text not null,
  commercial_name text,
  status text not null default 'pending_handoff' check (status in ('pending_handoff','handoff_review','onboarding','activation_ready','active','paused','at_risk','renewal_due','expired','terminated')),
  partner_type text not null default 'b2b_partner',
  vertical text,
  city text,
  territory text,
  contract_reference text,
  contract_id uuid,
  contract_start_at timestamptz,
  contract_end_at timestamptz,
  billing_status text not null default 'pending',
  payment_status text not null default 'pending',
  sales_owner_id uuid,
  operational_owner_id uuid,
  partner_owner_contact_id uuid,
  activation_status text not null default 'not_started',
  health_status text not null default 'unknown',
  health_score integer,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid not null,
  updated_by uuid,
  activated_by uuid,
  activated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists browser_ext_b2b_partner_status_idx on public.browser_extension_b2b_partners(status,updated_at desc);
create index if not exists browser_ext_b2b_partner_owner_idx on public.browser_extension_b2b_partners(operational_owner_id,status);

create table if not exists public.browser_extension_b2b_partner_sites (
  id uuid primary key default gen_random_uuid(), partner_id uuid not null references public.browser_extension_b2b_partners(id) on delete cascade,
  parent_site_id uuid references public.browser_extension_b2b_partner_sites(id) on delete set null, site_code text, name text not null,
  site_type text not null default 'operating_site', city text, address text, territory text, latitude numeric(10,7), longitude numeric(10,7),
  operational_contact jsonb not null default '{}'::jsonb, schedule jsonb not null default '{}'::jsonb, capacity jsonb not null default '{}'::jsonb,
  status text not null default 'planned', launch_at timestamptz, created_by uuid not null, updated_by uuid,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(partner_id,site_code)
);
create index if not exists browser_ext_b2b_partner_site_idx on public.browser_extension_b2b_partner_sites(partner_id,status);

create table if not exists public.browser_extension_b2b_partner_services (
  id uuid primary key default gen_random_uuid(), partner_id uuid not null references public.browser_extension_b2b_partners(id) on delete cascade,
  site_id uuid references public.browser_extension_b2b_partner_sites(id) on delete cascade, service_line text not null, program text,
  configuration jsonb not null default '{}'::jsonb, volume numeric(14,2) not null default 0, frequency text, schedule jsonb not null default '{}'::jsonb,
  commercial_value numeric(14,2) not null default 0, billing_model text, status text not null default 'configured', start_at timestamptz, end_at timestamptz,
  created_by uuid not null, updated_by uuid, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists browser_ext_b2b_partner_service_idx on public.browser_extension_b2b_partner_services(partner_id,site_id,status);

create table if not exists public.browser_extension_b2b_partner_contacts (
  id uuid primary key default gen_random_uuid(), partner_id uuid not null references public.browser_extension_b2b_partners(id) on delete cascade,
  source_contact_id uuid, site_id uuid references public.browser_extension_b2b_partner_sites(id) on delete set null, full_name text not null,
  role text, department text, email text, phone text, contact_type text not null default 'operational', decision_role text,
  escalation_level text, is_primary boolean not null default false, status text not null default 'active', evidence jsonb not null default '{}'::jsonb,
  created_by uuid not null, updated_by uuid, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists browser_ext_b2b_partner_contact_idx on public.browser_extension_b2b_partner_contacts(partner_id,contact_type,status);

create table if not exists public.browser_extension_b2b_handoffs (
  id uuid primary key default gen_random_uuid(), partner_id uuid references public.browser_extension_b2b_partners(id) on delete set null,
  prospect_id uuid not null, opportunity_id uuid not null references public.browser_extension_b2b_opportunities(id) on delete cascade,
  status text not null default 'draft' check (status in ('draft','submitted','under_review','correction_requested','accepted_with_conditions','accepted','rejected','superseded')),
  current_version integer not null default 1, readiness_score integer not null default 0, blocked boolean not null default true,
  blockers jsonb not null default '[]'::jsonb, conditions jsonb not null default '[]'::jsonb, sales_owner_id uuid, operational_owner_id uuid,
  requested_launch_at timestamptz, submitted_by uuid, submitted_at timestamptz, accepted_by uuid, accepted_at timestamptz,
  created_by uuid not null, updated_by uuid, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(opportunity_id)
);
create index if not exists browser_ext_b2b_handoff_queue_idx on public.browser_extension_b2b_handoffs(status,updated_at desc);

create table if not exists public.browser_extension_b2b_handoff_versions (
  id uuid primary key default gen_random_uuid(), handoff_id uuid not null references public.browser_extension_b2b_handoffs(id) on delete cascade,
  version_number integer not null, source_snapshot jsonb not null default '{}'::jsonb, legal_entity jsonb not null default '{}'::jsonb,
  scope jsonb not null default '{}'::jsonb, pricing jsonb not null default '{}'::jsonb, billing jsonb not null default '{}'::jsonb,
  payment_terms jsonb not null default '{}'::jsonb, sites jsonb not null default '[]'::jsonb, services jsonb not null default '[]'::jsonb,
  contacts jsonb not null default '[]'::jsonb, obligations jsonb not null default '{}'::jsonb, exclusions jsonb not null default '[]'::jsonb,
  reporting_requirements jsonb not null default '[]'::jsonb, service_levels jsonb not null default '[]'::jsonb, launch_requirements jsonb not null default '{}'::jsonb,
  risks jsonb not null default '[]'::jsonb, documents jsonb not null default '[]'::jsonb, change_summary text,
  created_by uuid not null, created_at timestamptz not null default now(), unique(handoff_id,version_number)
);

create table if not exists public.browser_extension_b2b_handoff_commitments (
  id uuid primary key default gen_random_uuid(), handoff_id uuid not null references public.browser_extension_b2b_handoffs(id) on delete cascade,
  handoff_version_id uuid references public.browser_extension_b2b_handoff_versions(id) on delete cascade, source_type text not null,
  source_reference text, statement text not null, classification text not null check (classification in ('contractual_obligation','commercial_commitment','operational_expectation','unapproved_promise','informal_statement','excluded_commitment')),
  impact text not null default 'medium', resolved boolean not null default false, resolution text, owner_id uuid, due_at timestamptz,
  evidence jsonb not null default '{}'::jsonb, created_by uuid not null, resolved_by uuid, resolved_at timestamptz, created_at timestamptz not null default now()
);
create index if not exists browser_ext_b2b_handoff_commitment_idx on public.browser_extension_b2b_handoff_commitments(handoff_id,resolved,impact);

create table if not exists public.browser_extension_b2b_handoff_validations (
  id uuid primary key default gen_random_uuid(), handoff_id uuid not null references public.browser_extension_b2b_handoffs(id) on delete cascade,
  handoff_version_id uuid references public.browser_extension_b2b_handoff_versions(id) on delete cascade, decision text not null,
  readiness jsonb not null default '{}'::jsonb, missing jsonb not null default '[]'::jsonb, conditions jsonb not null default '[]'::jsonb,
  notes text, evidence jsonb not null default '{}'::jsonb, decided_by uuid not null, created_at timestamptz not null default now()
);

create table if not exists public.browser_extension_b2b_onboarding_plans (
  id uuid primary key default gen_random_uuid(), partner_id uuid not null references public.browser_extension_b2b_partners(id) on delete cascade,
  handoff_id uuid references public.browser_extension_b2b_handoffs(id) on delete set null, status text not null default 'not_started',
  stage text not null default 'not_started', owner_id uuid not null, target_launch_at timestamptz, completion_percent integer not null default 0,
  information_collection jsonb not null default '{}'::jsonb, operational_configuration jsonb not null default '{}'::jsonb, training_briefing jsonb not null default '{}'::jsonb,
  partner_materials jsonb not null default '{}'::jsonb, technical_configuration jsonb not null default '{}'::jsonb, created_by uuid not null, updated_by uuid,
  completed_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.browser_extension_b2b_onboarding_tasks (
  id uuid primary key default gen_random_uuid(), onboarding_plan_id uuid not null references public.browser_extension_b2b_onboarding_plans(id) on delete cascade,
  partner_id uuid not null references public.browser_extension_b2b_partners(id) on delete cascade, category text not null, title text not null,
  description text, required boolean not null default true, owner_id uuid not null, due_at timestamptz, status text not null default 'open',
  blocker_reason text, evidence jsonb not null default '{}'::jsonb, completed_by uuid, completed_at timestamptz, created_by uuid not null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists browser_ext_b2b_onboarding_task_idx on public.browser_extension_b2b_onboarding_tasks(partner_id,status,due_at);

create table if not exists public.browser_extension_b2b_activation_plans (
  id uuid primary key default gen_random_uuid(), partner_id uuid not null references public.browser_extension_b2b_partners(id) on delete cascade,
  onboarding_plan_id uuid references public.browser_extension_b2b_onboarding_plans(id) on delete set null, status text not null default 'planning',
  owner_id uuid not null, launch_at timestamptz, readiness_score integer not null default 0, readiness_status text not null default 'not_ready',
  blocked boolean not null default true, blockers jsonb not null default '[]'::jsonb, staffing jsonb not null default '{}'::jsonb, availability jsonb not null default '{}'::jsonb,
  training jsonb not null default '{}'::jsonb, materials jsonb not null default '{}'::jsonb, transport jsonb not null default '{}'::jsonb, communication jsonb not null default '{}'::jsonb,
  support jsonb not null default '{}'::jsonb, safety jsonb not null default '{}'::jsonb, quality jsonb not null default '{}'::jsonb, escalation jsonb not null default '{}'::jsonb,
  approved_by uuid, approved_at timestamptz, created_by uuid not null, updated_by uuid, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.browser_extension_b2b_activation_gates (
  id uuid primary key default gen_random_uuid(), activation_plan_id uuid not null references public.browser_extension_b2b_activation_plans(id) on delete cascade,
  partner_id uuid not null references public.browser_extension_b2b_partners(id) on delete cascade, gate_key text not null, label text not null,
  required boolean not null default true, status text not null default 'pending', owner_id uuid, evidence jsonb not null default '{}'::jsonb,
  approved_by uuid, approved_at timestamptz, created_by uuid not null, updated_at timestamptz not null default now(), unique(activation_plan_id,gate_key)
);

create table if not exists public.browser_extension_b2b_first_services (
  id uuid primary key default gen_random_uuid(), partner_id uuid not null references public.browser_extension_b2b_partners(id) on delete cascade,
  activation_plan_id uuid references public.browser_extension_b2b_activation_plans(id) on delete set null, site_id uuid references public.browser_extension_b2b_partner_sites(id) on delete set null,
  service_id uuid references public.browser_extension_b2b_partner_services(id) on delete set null, scheduled_at timestamptz, status text not null default 'prepared',
  brief jsonb not null default '{}'::jsonb, staff jsonb not null default '[]'::jsonb, partner_contact jsonb not null default '{}'::jsonb, instructions jsonb not null default '[]'::jsonb,
  materials jsonb not null default '[]'::jsonb, transport jsonb not null default '{}'::jsonb, safety jsonb not null default '{}'::jsonb, escalation jsonb not null default '{}'::jsonb,
  report jsonb not null default '{}'::jsonb, outcome text, partner_feedback jsonb not null default '{}'::jsonb, staff_feedback jsonb not null default '{}'::jsonb,
  deviations jsonb not null default '[]'::jsonb, corrective_actions jsonb not null default '[]'::jsonb, billing_consequence jsonb not null default '{}'::jsonb,
  continued_service_ready boolean, partner_confirmed_by text, partner_confirmed_at timestamptz, created_by uuid not null, updated_by uuid,
  completed_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.browser_extension_b2b_hypercare_checkpoints (
  id uuid primary key default gen_random_uuid(), partner_id uuid not null references public.browser_extension_b2b_partners(id) on delete cascade,
  first_service_id uuid references public.browser_extension_b2b_first_services(id) on delete cascade, checkpoint_day integer not null check(checkpoint_day in (1,3,7,14,30)),
  due_at timestamptz not null, status text not null default 'scheduled', owner_id uuid not null, partner_feedback jsonb not null default '{}'::jsonb,
  staff_feedback jsonb not null default '{}'::jsonb, issues jsonb not null default '[]'::jsonb, actions jsonb not null default '[]'::jsonb, evidence jsonb not null default '{}'::jsonb,
  completed_by uuid, completed_at timestamptz, created_by uuid not null, created_at timestamptz not null default now(), unique(first_service_id,checkpoint_day)
);

create table if not exists public.browser_extension_b2b_partner_performance_snapshots (
  id uuid primary key default gen_random_uuid(), partner_id uuid not null references public.browser_extension_b2b_partners(id) on delete cascade,
  period_start date not null, period_end date not null, contracted_revenue numeric(14,2), invoiced_revenue numeric(14,2), collected_revenue numeric(14,2),
  usage numeric(14,2), volume numeric(14,2), utilization numeric(7,3), site_count integer, service_success numeric(7,3), incidents integer,
  complaints integer, response_time_hours numeric(10,2), satisfaction numeric(7,3), payment_discipline numeric(7,3), growth_potential numeric(7,3),
  renewal_readiness numeric(7,3), missing_fields jsonb not null default '[]'::jsonb, source_evidence jsonb not null default '{}'::jsonb, created_by uuid not null,
  created_at timestamptz not null default now(), unique(partner_id,period_start,period_end)
);

create table if not exists public.browser_extension_b2b_partner_health_snapshots (
  id uuid primary key default gen_random_uuid(), partner_id uuid not null references public.browser_extension_b2b_partners(id) on delete cascade,
  performance_snapshot_id uuid references public.browser_extension_b2b_partner_performance_snapshots(id) on delete set null, score integer not null,
  level text not null, dimensions jsonb not null default '{}'::jsonb, reasons jsonb not null default '[]'::jsonb, missing_data jsonb not null default '[]'::jsonb,
  expansion_ready boolean not null default false, renewal_risk text not null default 'unknown', calculated_by uuid not null, created_at timestamptz not null default now()
);
create index if not exists browser_ext_b2b_partner_health_idx on public.browser_extension_b2b_partner_health_snapshots(partner_id,created_at desc);

create table if not exists public.browser_extension_b2b_partner_issues (
  id uuid primary key default gen_random_uuid(), partner_id uuid not null references public.browser_extension_b2b_partners(id) on delete cascade,
  site_id uuid references public.browser_extension_b2b_partner_sites(id) on delete set null, service_id uuid references public.browser_extension_b2b_partner_services(id) on delete set null,
  category text not null, severity text not null default 'medium', title text not null, description text, partner_impact text, revenue_impact numeric(14,2) not null default 0,
  status text not null default 'open', owner_id uuid not null, escalation_level text, partner_communication jsonb not null default '{}'::jsonb, evidence jsonb not null default '{}'::jsonb,
  escalated_by uuid, escalated_at timestamptz, closed_by uuid, closed_at timestamptz, created_by uuid not null, updated_by uuid,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists browser_ext_b2b_partner_issue_idx on public.browser_extension_b2b_partner_issues(partner_id,status,severity,created_at desc);

create table if not exists public.browser_extension_b2b_corrective_actions (
  id uuid primary key default gen_random_uuid(), issue_id uuid not null references public.browser_extension_b2b_partner_issues(id) on delete cascade,
  partner_id uuid not null references public.browser_extension_b2b_partners(id) on delete cascade, problem text not null, root_cause text,
  containment text, corrective_action text not null, preventive_action text, owner_id uuid not null, due_at timestamptz, status text not null default 'open',
  evidence jsonb not null default '{}'::jsonb, partner_communication jsonb not null default '{}'::jsonb, validation jsonb not null default '{}'::jsonb, closure_notes text,
  created_by uuid not null, closed_by uuid, closed_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.browser_extension_b2b_partner_reviews (
  id uuid primary key default gen_random_uuid(), partner_id uuid not null references public.browser_extension_b2b_partners(id) on delete cascade,
  review_type text not null, period_start date, period_end date, scheduled_at timestamptz, status text not null default 'prepared', prepared_by uuid not null,
  attendees jsonb not null default '[]'::jsonb, contract_performance jsonb not null default '{}'::jsonb, services jsonb not null default '{}'::jsonb, revenue jsonb not null default '{}'::jsonb,
  satisfaction jsonb not null default '{}'::jsonb, issues jsonb not null default '[]'::jsonb, growth_opportunities jsonb not null default '[]'::jsonb, renewal_risk jsonb not null default '{}'::jsonb,
  decisions jsonb not null default '[]'::jsonb, follow_up_actions jsonb not null default '[]'::jsonb, evidence jsonb not null default '{}'::jsonb, completed_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.browser_extension_b2b_growth_signals (
  id uuid primary key default gen_random_uuid(), partner_id uuid not null references public.browser_extension_b2b_partners(id) on delete cascade,
  signal_type text not null, source_type text, source_reference text, description text not null, confidence numeric(5,4) not null default 0.5,
  estimated_value numeric(14,2) not null default 0, readiness jsonb not null default '{}'::jsonb, evidence jsonb not null default '{}'::jsonb, status text not null default 'detected',
  detected_by uuid not null, created_at timestamptz not null default now()
);

create table if not exists public.browser_extension_b2b_growth_opportunities (
  id uuid primary key default gen_random_uuid(), partner_id uuid not null references public.browser_extension_b2b_partners(id) on delete cascade,
  source_signal_id uuid references public.browser_extension_b2b_growth_signals(id) on delete set null, opportunity_type text not null, title text not null,
  description text, estimated_value numeric(14,2) not null default 0, probability numeric(7,3) not null default 0, target_sites jsonb not null default '[]'::jsonb,
  readiness_score integer not null default 0, blockers jsonb not null default '[]'::jsonb, owner_id uuid not null, next_action text, next_action_due_at timestamptz,
  status text not null default 'identified', created_by uuid not null, updated_by uuid, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.browser_extension_b2b_expansion_plans (
  id uuid primary key default gen_random_uuid(), partner_id uuid not null references public.browser_extension_b2b_partners(id) on delete cascade,
  growth_opportunity_id uuid references public.browser_extension_b2b_growth_opportunities(id) on delete set null, expansion_type text not null,
  scope jsonb not null default '{}'::jsonb, target_sites jsonb not null default '[]'::jsonb, commercial_model jsonb not null default '{}'::jsonb, operational_capacity jsonb not null default '{}'::jsonb,
  payment_health jsonb not null default '{}'::jsonb, phases jsonb not null default '[]'::jsonb, risks jsonb not null default '[]'::jsonb, status text not null default 'draft',
  owner_id uuid not null, approved_by uuid, approved_at timestamptz, created_by uuid not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.browser_extension_b2b_renewals (
  id uuid primary key default gen_random_uuid(), partner_id uuid not null references public.browser_extension_b2b_partners(id) on delete cascade,
  contract_reference text, contract_end_at timestamptz not null, status text not null default 'intelligence', strategy text,
  readiness_score integer not null default 0, renewal_risk text not null default 'unknown', performance_summary jsonb not null default '{}'::jsonb,
  stakeholder_review jsonb not null default '{}'::jsonb, commercial_strategy jsonb not null default '{}'::jsonb, proposal_reference jsonb not null default '{}'::jsonb,
  decision_status text, owner_id uuid not null, approver_id uuid, renewed_until timestamptz, outcome text, created_by uuid not null, updated_by uuid,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(partner_id,contract_end_at)
);
create index if not exists browser_ext_b2b_renewal_due_idx on public.browser_extension_b2b_renewals(status,contract_end_at);

create table if not exists public.browser_extension_b2b_renewal_milestones (
  id uuid primary key default gen_random_uuid(), renewal_id uuid not null references public.browser_extension_b2b_renewals(id) on delete cascade,
  partner_id uuid not null references public.browser_extension_b2b_partners(id) on delete cascade, days_before integer not null,
  milestone_type text not null, due_at timestamptz not null, status text not null default 'scheduled', owner_id uuid not null,
  payload jsonb not null default '{}'::jsonb, completed_by uuid, completed_at timestamptz, created_at timestamptz not null default now(), unique(renewal_id,days_before)
);

create table if not exists public.browser_extension_b2b_churn_risks (
  id uuid primary key default gen_random_uuid(), partner_id uuid not null references public.browser_extension_b2b_partners(id) on delete cascade,
  renewal_id uuid references public.browser_extension_b2b_renewals(id) on delete set null, risk_level text not null, score integer not null,
  signals jsonb not null default '[]'::jsonb, reasons jsonb not null default '[]'::jsonb, revenue_at_risk numeric(14,2) not null default 0,
  recommended_actions jsonb not null default '[]'::jsonb, owner_id uuid not null, status text not null default 'open', detected_by uuid not null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.browser_extension_b2b_partner_rescue_cases (
  id uuid primary key default gen_random_uuid(), partner_id uuid not null references public.browser_extension_b2b_partners(id) on delete cascade,
  renewal_id uuid references public.browser_extension_b2b_renewals(id) on delete set null, issue_id uuid references public.browser_extension_b2b_partner_issues(id) on delete set null,
  rescue_type text not null, reason text not null, revenue_at_risk numeric(14,2) not null default 0, recommended_intervention text,
  prohibited_commitments jsonb not null default '[]'::jsonb, owner_id uuid not null, executive_owner_id uuid, due_at timestamptz,
  status text not null default 'open', outcome text, created_by uuid not null, closed_by uuid, closed_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.browser_extension_b2b_tenders (
  id uuid primary key default gen_random_uuid(), partner_id uuid references public.browser_extension_b2b_partners(id) on delete set null,
  prospect_id uuid, opportunity_id uuid references public.browser_extension_b2b_opportunities(id) on delete set null, title text not null,
  issuer text, reference text, source_url text, detected_at timestamptz, submission_deadline timestamptz, estimated_value numeric(14,2) not null default 0,
  status text not null default 'detected', eligibility jsonb not null default '{}'::jsonb, bid_decision text, bid_rationale text, strategic_fit numeric(7,3),
  delivery_feasibility numeric(7,3), expected_margin numeric(7,3), payment_risk text, competition jsonb not null default '[]'::jsonb, documentation_readiness numeric(7,3),
  solution jsonb not null default '{}'::jsonb, pricing jsonb not null default '{}'::jsonb, approval jsonb not null default '{}'::jsonb, submission_evidence jsonb not null default '{}'::jsonb,
  outcome text, owner_id uuid not null, created_by uuid not null, updated_by uuid, submitted_by uuid, submitted_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists browser_ext_b2b_tender_deadline_idx on public.browser_extension_b2b_tenders(status,submission_deadline);

create table if not exists public.browser_extension_b2b_tender_requirements (
  id uuid primary key default gen_random_uuid(), tender_id uuid not null references public.browser_extension_b2b_tenders(id) on delete cascade,
  requirement_code text, category text, requirement_text text not null, mandatory boolean not null default true, response text,
  owner_id uuid, due_at timestamptz, status text not null default 'open', evidence jsonb not null default '{}'::jsonb, created_by uuid not null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.browser_extension_b2b_tender_compliance (
  id uuid primary key default gen_random_uuid(), tender_id uuid not null references public.browser_extension_b2b_tenders(id) on delete cascade,
  requirement_id uuid not null references public.browser_extension_b2b_tender_requirements(id) on delete cascade, compliance_status text not null default 'not_assessed',
  response text, document_references jsonb not null default '[]'::jsonb, owner_id uuid, validated_by uuid, validated_at timestamptz,
  updated_by uuid not null, updated_at timestamptz not null default now(), unique(tender_id,requirement_id)
);

create table if not exists public.browser_extension_b2b_partner_documents (
  id uuid primary key default gen_random_uuid(), partner_id uuid not null references public.browser_extension_b2b_partners(id) on delete cascade,
  document_type text not null, title text not null, storage_reference text, version text, status text not null default 'active',
  valid_from timestamptz, valid_until timestamptz, evidence jsonb not null default '{}'::jsonb, created_by uuid not null, created_at timestamptz not null default now()
);

-- Partner lifecycle tables are server-gateway only. RLS prevents direct browser access.
alter table public.browser_extension_b2b_partners enable row level security;
alter table public.browser_extension_b2b_partner_sites enable row level security;
alter table public.browser_extension_b2b_partner_services enable row level security;
alter table public.browser_extension_b2b_partner_contacts enable row level security;
alter table public.browser_extension_b2b_handoffs enable row level security;
alter table public.browser_extension_b2b_handoff_versions enable row level security;
alter table public.browser_extension_b2b_handoff_commitments enable row level security;
alter table public.browser_extension_b2b_handoff_validations enable row level security;
alter table public.browser_extension_b2b_onboarding_plans enable row level security;
alter table public.browser_extension_b2b_onboarding_tasks enable row level security;
alter table public.browser_extension_b2b_activation_plans enable row level security;
alter table public.browser_extension_b2b_activation_gates enable row level security;
alter table public.browser_extension_b2b_first_services enable row level security;
alter table public.browser_extension_b2b_hypercare_checkpoints enable row level security;
alter table public.browser_extension_b2b_partner_performance_snapshots enable row level security;
alter table public.browser_extension_b2b_partner_health_snapshots enable row level security;
alter table public.browser_extension_b2b_partner_issues enable row level security;
alter table public.browser_extension_b2b_corrective_actions enable row level security;
alter table public.browser_extension_b2b_partner_reviews enable row level security;
alter table public.browser_extension_b2b_growth_signals enable row level security;
alter table public.browser_extension_b2b_growth_opportunities enable row level security;
alter table public.browser_extension_b2b_expansion_plans enable row level security;
alter table public.browser_extension_b2b_renewals enable row level security;
alter table public.browser_extension_b2b_renewal_milestones enable row level security;
alter table public.browser_extension_b2b_churn_risks enable row level security;
alter table public.browser_extension_b2b_partner_rescue_cases enable row level security;
alter table public.browser_extension_b2b_tenders enable row level security;
alter table public.browser_extension_b2b_tender_requirements enable row level security;
alter table public.browser_extension_b2b_tender_compliance enable row level security;
alter table public.browser_extension_b2b_partner_documents enable row level security;

update public.browser_extension_release_channels
set version='0.5.0', minimum_version='0.1.0', release_notes='Mega ZIP 5 Partner Lifecycle, Activation, Performance, Expansion and Renewal', updated_at=now()
where channel_key='pilot';

commit;
