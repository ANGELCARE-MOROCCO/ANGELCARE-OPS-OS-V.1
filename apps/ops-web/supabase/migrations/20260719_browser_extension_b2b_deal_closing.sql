begin;
create extension if not exists pgcrypto;

create table if not exists public.browser_extension_b2b_offer_configurations (
 id uuid primary key default gen_random_uuid(), prospect_id uuid not null, opportunity_id uuid not null references public.browser_extension_b2b_opportunities(id) on delete cascade,
 user_id uuid not null, service_line text not null, partner_program text, locations jsonb not null default '[]'::jsonb, population_volume numeric(14,2) not null default 0,
 frequency text, service_hours text, staffing_requirements jsonb not null default '{}'::jsonb, materials_requirements jsonb not null default '{}'::jsonb,
 client_responsibilities jsonb not null default '[]'::jsonb, angelcare_responsibilities jsonb not null default '[]'::jsonb, optional_services jsonb not null default '[]'::jsonb,
 exclusions jsonb not null default '[]'::jsonb, deployment_mode text not null default 'pilot', contract_months integer not null default 12, launch_at timestamptz,
 billing_frequency text not null default 'monthly', status text not null default 'configured', created_by uuid not null, updated_by uuid, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists browser_ext_b2b_offer_opportunity_idx on public.browser_extension_b2b_offer_configurations(opportunity_id,created_at desc);

create table if not exists public.browser_extension_b2b_margin_policies (
 id uuid primary key default gen_random_uuid(), name text not null, healthy_margin numeric(6,2) not null default 35, manager_approval_margin numeric(6,2) not null default 25,
 executive_approval_margin numeric(6,2) not null default 15, blocked_below_margin numeric(6,2) not null default 15, active boolean not null default true,
 created_by uuid, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
insert into public.browser_extension_b2b_margin_policies(name,healthy_margin,manager_approval_margin,executive_approval_margin,blocked_below_margin,active)
select 'ANGELCARE B2B Default Margin Guardrails',35,25,15,15,true
where not exists(select 1 from public.browser_extension_b2b_margin_policies where active=true);

create table if not exists public.browser_extension_b2b_pricing_calculations (
 id uuid primary key default gen_random_uuid(), prospect_id uuid not null, opportunity_id uuid not null references public.browser_extension_b2b_opportunities(id) on delete cascade,
 user_id uuid not null, pricing_model text not null, currency text not null default 'Dh', quoted_revenue numeric(14,2) not null default 0, discount_percent numeric(7,3) not null default 0,
 discount_amount numeric(14,2) not null default 0, net_revenue numeric(14,2) not null default 0, direct_staffing_cost numeric(14,2) not null default 0,
 transport_cost numeric(14,2) not null default 0, materials_cost numeric(14,2) not null default 0, training_cost numeric(14,2) not null default 0,
 overhead_cost numeric(14,2) not null default 0, commissions_cost numeric(14,2) not null default 0, contingency_cost numeric(14,2) not null default 0,
 delivery_cost numeric(14,2) not null default 0, gross_contribution numeric(14,2) not null default 0, gross_margin_percent numeric(7,3) not null default 0,
 margin_status text not null default 'review', approval_role text, assumptions jsonb not null default '{}'::jsonb, line_items jsonb not null default '[]'::jsonb,
 created_by uuid not null, created_at timestamptz not null default now()
);
create index if not exists browser_ext_b2b_pricing_opportunity_idx on public.browser_extension_b2b_pricing_calculations(opportunity_id,created_at desc);

create table if not exists public.browser_extension_b2b_margin_snapshots (
 id uuid primary key default gen_random_uuid(), prospect_id uuid not null, opportunity_id uuid not null references public.browser_extension_b2b_opportunities(id) on delete cascade,
 pricing_calculation_id uuid references public.browser_extension_b2b_pricing_calculations(id) on delete set null, user_id uuid not null, margin_percent numeric(7,3) not null,
 status text not null, approval_role text, blocked boolean not null default false, policy_snapshot jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);

create table if not exists public.browser_extension_b2b_proposal_versions (
 id uuid primary key default gen_random_uuid(), prospect_id uuid not null, opportunity_id uuid not null references public.browser_extension_b2b_opportunities(id) on delete cascade,
 parent_proposal_id uuid references public.browser_extension_b2b_proposal_versions(id) on delete set null, superseded_by uuid, offer_configuration_id uuid references public.browser_extension_b2b_offer_configurations(id) on delete set null,
 pricing_calculation_id uuid references public.browser_extension_b2b_pricing_calculations(id) on delete set null, version_number integer not null, title text not null, proposal_type text not null default 'partnership',
 client_context text, confirmed_need text, solution_summary text, scope jsonb not null default '{}'::jsonb, operating_model jsonb not null default '{}'::jsonb,
 responsibilities jsonb not null default '{}'::jsonb, implementation_timeline jsonb not null default '{}'::jsonb, kpis jsonb not null default '[]'::jsonb,
 risk_controls jsonb not null default '[]'::jsonb, exclusions jsonb not null default '[]'::jsonb, commercial_value numeric(14,2) not null default 0,
 gross_margin_percent numeric(7,3) not null default 0, status text not null default 'draft', change_summary text, valid_until timestamptz,
 approved_by uuid, approved_at timestamptz, delivered_at timestamptz, client_acceptance_at timestamptz, created_by uuid not null, updated_by uuid,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(opportunity_id,version_number)
);
create index if not exists browser_ext_b2b_proposal_opportunity_idx on public.browser_extension_b2b_proposal_versions(opportunity_id,version_number desc);

create table if not exists public.browser_extension_b2b_proposal_line_items (
 id uuid primary key default gen_random_uuid(), proposal_id uuid not null references public.browser_extension_b2b_proposal_versions(id) on delete cascade,
 line_order integer not null default 1, label text not null, description text, quantity numeric(14,3) not null default 1, unit_price numeric(14,2) not null default 0,
 total numeric(14,2) not null default 0, metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);

create table if not exists public.browser_extension_b2b_approval_requests (
 id uuid primary key default gen_random_uuid(), prospect_id uuid not null, opportunity_id uuid not null references public.browser_extension_b2b_opportunities(id) on delete cascade,
 proposal_id uuid references public.browser_extension_b2b_proposal_versions(id) on delete cascade, discount_request_id uuid, request_type text not null,
 requested_by uuid not null, requested_approver_role text, reason text, status text not null default 'submitted', decided_at timestamptz,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists browser_ext_b2b_approval_queue_idx on public.browser_extension_b2b_approval_requests(status,requested_approver_role,created_at);

create table if not exists public.browser_extension_b2b_approval_decisions (
 id uuid primary key default gen_random_uuid(), approval_request_id uuid not null references public.browser_extension_b2b_approval_requests(id) on delete cascade,
 decision text not null check(decision in ('approved','rejected','changes_requested')), decided_by uuid not null, notes text, evidence jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now()
);

create table if not exists public.browser_extension_b2b_proposal_deliveries (
 id uuid primary key default gen_random_uuid(), proposal_id uuid not null references public.browser_extension_b2b_proposal_versions(id) on delete cascade,
 prospect_id uuid not null, opportunity_id uuid not null references public.browser_extension_b2b_opportunities(id) on delete cascade, delivered_by uuid not null,
 channel text not null, recipient text, delivery_reference text, follow_up_due_at timestamptz, status text not null default 'delivered', created_at timestamptz not null default now()
);

create table if not exists public.browser_extension_b2b_discount_requests (
 id uuid primary key default gen_random_uuid(), prospect_id uuid not null, opportunity_id uuid not null references public.browser_extension_b2b_opportunities(id) on delete cascade,
 proposal_id uuid references public.browser_extension_b2b_proposal_versions(id) on delete set null, pricing_calculation_id uuid references public.browser_extension_b2b_pricing_calculations(id) on delete set null,
 requested_by uuid not null, requested_discount_percent numeric(7,3) not null, reason text, objection_context text, expected_benefit text, contract_months integer,
 payment_structure text, original_margin numeric(7,3), revised_margin numeric(7,3), status text not null default 'submitted', required_approver_role text,
 alternatives jsonb not null default '[]'::jsonb, decided_by uuid, decision_notes text, decided_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists browser_ext_b2b_discount_queue_idx on public.browser_extension_b2b_discount_requests(status,required_approver_role,created_at);

create table if not exists public.browser_extension_b2b_negotiation_rooms (
 id uuid primary key default gen_random_uuid(), prospect_id uuid not null, opportunity_id uuid not null references public.browser_extension_b2b_opportunities(id) on delete cascade,
 proposal_id uuid references public.browser_extension_b2b_proposal_versions(id) on delete set null, owner_id uuid not null, status text not null default 'active',
 commercial_value numeric(14,2) not null default 0, margin_percent numeric(7,3), decision_date timestamptz, stakeholders jsonb not null default '[]'::jsonb,
 competitive_threat text, next_action text, closed_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.browser_extension_b2b_negotiation_events (
 id uuid primary key default gen_random_uuid(), negotiation_room_id uuid not null references public.browser_extension_b2b_negotiation_rooms(id) on delete cascade,
 prospect_id uuid not null, opportunity_id uuid not null references public.browser_extension_b2b_opportunities(id) on delete cascade, event_type text not null,
 requested_by text, requested_change text, commercial_impact numeric(14,2) not null default 0, margin_impact numeric(7,3) not null default 0,
 payment_impact text, operational_impact text, recommended_response text, approval_required boolean not null default false, created_by uuid not null,
 created_at timestamptz not null default now()
);

create table if not exists public.browser_extension_b2b_counteroffers (
 id uuid primary key default gen_random_uuid(), negotiation_room_id uuid not null references public.browser_extension_b2b_negotiation_rooms(id) on delete cascade,
 prospect_id uuid not null, opportunity_id uuid not null references public.browser_extension_b2b_opportunities(id) on delete cascade, prepared_by uuid not null,
 strategy text not null, summary text, scope_changes jsonb not null default '{}'::jsonb, payment_changes jsonb not null default '{}'::jsonb,
 contract_changes jsonb not null default '{}'::jsonb, commercial_value numeric(14,2) not null default 0, margin_percent numeric(7,3) not null default 0,
 approval_required boolean not null default false, required_approver_role text, status text not null default 'prepared', created_at timestamptz not null default now()
);

create table if not exists public.browser_extension_b2b_objections (
 id uuid primary key default gen_random_uuid(), prospect_id uuid not null, opportunity_id uuid not null references public.browser_extension_b2b_opportunities(id) on delete cascade,
 negotiation_room_id uuid references public.browser_extension_b2b_negotiation_rooms(id) on delete set null, recorded_by uuid not null, category text not null,
 statement text, meaning text, recommended_response text, action_to_avoid text, evidence jsonb not null default '{}'::jsonb, status text not null default 'open',
 resolution text, resolution_evidence jsonb not null default '{}'::jsonb, resolved_by uuid, resolved_at timestamptz, created_at timestamptz not null default now()
);
create index if not exists browser_ext_b2b_objection_pattern_idx on public.browser_extension_b2b_objections(category,status,created_at desc);

create table if not exists public.browser_extension_b2b_closing_readiness_snapshots (
 id uuid primary key default gen_random_uuid(), prospect_id uuid not null, opportunity_id uuid not null references public.browser_extension_b2b_opportunities(id) on delete cascade,
 user_id uuid not null, score integer not null default 0, checks jsonb not null default '{}'::jsonb, missing jsonb not null default '[]'::jsonb,
 status text not null default 'not_ready', created_at timestamptz not null default now()
);

create table if not exists public.browser_extension_b2b_closing_gates (
 id uuid primary key default gen_random_uuid(), prospect_id uuid not null, opportunity_id uuid not null references public.browser_extension_b2b_opportunities(id) on delete cascade,
 user_id uuid not null, requested_state text not null, readiness_score integer not null default 0, blocked boolean not null default true,
 missing_requirements jsonb not null default '[]'::jsonb, evidence jsonb not null default '{}'::jsonb, status text not null default 'blocked', created_at timestamptz not null default now()
);

create table if not exists public.browser_extension_b2b_contract_requirements (
 id uuid primary key default gen_random_uuid(), prospect_id uuid not null, opportunity_id uuid not null references public.browser_extension_b2b_opportunities(id) on delete cascade,
 requirement_key text not null, label text not null, required boolean not null default true, status text not null default 'pending', owner_id uuid,
 evidence jsonb not null default '{}'::jsonb, created_by uuid not null, completed_by uuid, completed_at timestamptz,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(opportunity_id,requirement_key)
);

create table if not exists public.browser_extension_b2b_payment_gates (
 id uuid primary key default gen_random_uuid(), prospect_id uuid not null, opportunity_id uuid not null references public.browser_extension_b2b_opportunities(id) on delete cascade,
 amount_due numeric(14,2) not null default 0, deposit_percent numeric(7,3) not null default 0, due_at timestamptz, payment_method text, payer text,
 status text not null default 'pending', verification_required boolean not null default true, verified_by uuid, verified_at timestamptz,
 evidence jsonb not null default '{}'::jsonb, created_by uuid not null, created_at timestamptz not null default now()
);

create table if not exists public.browser_extension_b2b_payment_promises (
 id uuid primary key default gen_random_uuid(), prospect_id uuid not null, opportunity_id uuid not null references public.browser_extension_b2b_opportunities(id) on delete cascade,
 created_by uuid not null, amount numeric(14,2) not null default 0, promised_at timestamptz not null, payment_method text, payer text, internal_owner_id uuid not null,
 verification_due_at timestamptz, escalation_rule text, status text not null default 'promised', evidence jsonb not null default '{}'::jsonb,
 proof jsonb not null default '{}'::jsonb, verification_requested_by uuid, verification_requested_at timestamptz,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists browser_ext_b2b_payment_promise_due_idx on public.browser_extension_b2b_payment_promises(status,verification_due_at);

create table if not exists public.browser_extension_b2b_revenue_rescue_cases (
 id uuid primary key default gen_random_uuid(), prospect_id uuid not null, opportunity_id uuid not null references public.browser_extension_b2b_opportunities(id) on delete cascade,
 created_by uuid not null, rescue_type text not null, risk_value numeric(14,2) not null default 0, reason text, signals jsonb not null default '[]'::jsonb,
 recommended_actions jsonb not null default '[]'::jsonb, owner_id uuid not null, due_at timestamptz, status text not null default 'open', priority text not null default 'high',
 outcome text, closed_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.browser_extension_b2b_executive_interventions (
 id uuid primary key default gen_random_uuid(), prospect_id uuid not null, opportunity_id uuid not null references public.browser_extension_b2b_opportunities(id) on delete cascade,
 prepared_by uuid not null, executive_role text not null, account_summary text, opportunity_value numeric(14,2), strategic_value text, current_stage text,
 stakeholders jsonb not null default '[]'::jsonb, latest_proposal jsonb not null default '{}'::jsonb, margin_percent numeric(7,3), main_blocker text,
 client_request text, approved_position text, recommended_intervention text, prohibited_commitments jsonb not null default '[]'::jsonb,
 required_outcome text, follow_up_owner_id uuid, status text not null default 'prepared', outcome text, completed_at timestamptz,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

alter table public.browser_extension_b2b_offer_configurations enable row level security;
alter table public.browser_extension_b2b_margin_policies enable row level security;
alter table public.browser_extension_b2b_pricing_calculations enable row level security;
alter table public.browser_extension_b2b_margin_snapshots enable row level security;
alter table public.browser_extension_b2b_proposal_versions enable row level security;
alter table public.browser_extension_b2b_proposal_line_items enable row level security;
alter table public.browser_extension_b2b_approval_requests enable row level security;
alter table public.browser_extension_b2b_approval_decisions enable row level security;
alter table public.browser_extension_b2b_proposal_deliveries enable row level security;
alter table public.browser_extension_b2b_discount_requests enable row level security;
alter table public.browser_extension_b2b_negotiation_rooms enable row level security;
alter table public.browser_extension_b2b_negotiation_events enable row level security;
alter table public.browser_extension_b2b_counteroffers enable row level security;
alter table public.browser_extension_b2b_objections enable row level security;
alter table public.browser_extension_b2b_closing_readiness_snapshots enable row level security;
alter table public.browser_extension_b2b_closing_gates enable row level security;
alter table public.browser_extension_b2b_contract_requirements enable row level security;
alter table public.browser_extension_b2b_payment_gates enable row level security;
alter table public.browser_extension_b2b_payment_promises enable row level security;
alter table public.browser_extension_b2b_revenue_rescue_cases enable row level security;
alter table public.browser_extension_b2b_executive_interventions enable row level security;

update public.browser_extension_release_channels
set version='0.4.0', minimum_version='0.1.0', release_notes='Mega ZIP 4 B2B Proposal, Pricing, Negotiation, Closing and Revenue Protection', updated_at=now()
where channel_key='pilot';

commit;
