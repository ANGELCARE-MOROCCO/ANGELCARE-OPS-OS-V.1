-- ANGELCARE Flashcards OS — Ultra Mega ZIP 5
-- Dual CRM, Commercial Operations and Unified Revenue Kernel.
-- One additive, manual-safe consolidated migration. Requires UMZ1–UMZ4.
begin;
select pg_advisory_xact_lock(84745005);
set local lock_timeout = '5min';
set local statement_timeout = '0';
create extension if not exists pgcrypto;
create schema if not exists flashcards_os;
do $$ begin
 if to_regclass('flashcards_os.b2c_sellables') is null or to_regclass('flashcards_os.ready_learning_plans') is null then
   raise exception 'UMZ4 baseline missing: published sellables and ready plans are required.';
 end if;
 if to_regclass('flashcards_os.audit_events') is null or to_regclass('flashcards_os.outbox_events') is null then
   raise exception 'Flashcards OS audit/outbox baseline missing.';
 end if;
end $$;

create or replace function flashcards_os.touch_updated_at() returns trigger language plpgsql as $$ begin new.updated_at=now(); return new; end $$;
create table if not exists flashcards_os.b2c_households (
 id uuid primary key default gen_random_uuid(),
 tenant_key text not null default 'angelcare-internal',
 code text not null, display_name text not null, primary_guardian_name text not null default '', email text not null default '', phone text not null default '', city text not null default '', preferred_language text not null default 'Français', preferred_channel text not null default 'Email', acquisition_source text not null default '', consent_status text not null default 'pending', marketing_preference text not null default 'none', customer_tier text not null default 'Standard', relationship_owner text not null default '', relationship_health numeric(6,2) not null default 50 check(relationship_health between 0 and 100), active_opportunity_ids uuid[] not null default '{}', outstanding_balance_dh numeric(14,2) not null default 0, lifetime_value_dh numeric(14,2) not null default 0, last_interaction_at timestamptz null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(tenant_key,code)
);

create table if not exists flashcards_os.b2c_guardians (
 id uuid primary key default gen_random_uuid(),
 tenant_key text not null default 'angelcare-internal',
 household_id uuid not null references flashcards_os.b2c_households(id) on delete restrict, full_name text not null, relationship text not null default '', email text not null default '', phone text not null default '', preferred_channel text not null default 'Email', primary_decision_maker boolean not null default false, billing_contact boolean not null default false, delivery_contact boolean not null default false, consent_status text not null default 'pending', notes text not null default '', created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists flashcards_os.b2c_household_addresses (
 id uuid primary key default gen_random_uuid(),
 tenant_key text not null default 'angelcare-internal',
 household_id uuid not null references flashcards_os.b2c_households(id) on delete restrict, label text not null default 'Adresse', line1 text not null default '', line2 text not null default '', city text not null default '', region text not null default '', postal_code text not null default '', country text not null default 'Maroc', delivery_zone text not null default '', is_billing boolean not null default false, is_delivery boolean not null default false, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists flashcards_os.b2c_learners (
 id uuid primary key default gen_random_uuid(),
 tenant_key text not null default 'angelcare-internal',
 household_id uuid not null references flashcards_os.b2c_households(id) on delete restrict, code text not null, display_name text not null, date_of_birth date null, age_band text not null default '', preferred_languages text[] not null default '{}', development_stage text not null default '', attention_profile text not null default '', privacy_class text not null default 'sensitive' check(privacy_class in('standard','sensitive','restricted')), need_profile jsonb not null default '{}'::jsonb, active_programme_ids uuid[] not null default '{}', recommended_sellable_ids uuid[] not null default '{}', recommended_plan_ids uuid[] not null default '{}', consent_status text not null default 'pending', created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(tenant_key,code)
);

create table if not exists flashcards_os.b2c_needs_assessments (
 id uuid primary key default gen_random_uuid(),
 tenant_key text not null default 'angelcare-internal',
 customer_id uuid not null references flashcards_os.b2c_households(id) on delete restrict, learner_id uuid null references flashcards_os.b2c_learners(id) on delete restrict, title text not null, status text not null default 'draft', dimensions_snapshot jsonb not null default '{}'::jsonb, summary text not null default '', completed_by text null, completed_at timestamptz null, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists flashcards_os.b2c_need_dimensions (
 id uuid primary key default gen_random_uuid(),
 tenant_key text not null default 'angelcare-internal',
 assessment_id uuid not null references flashcards_os.b2c_needs_assessments(id) on delete restrict, dimension_kind text not null, option_key text not null, source text not null default 'umz4_ontology', created_at timestamptz not null default now(), unique(tenant_key,assessment_id,dimension_kind,option_key)
);

create table if not exists flashcards_os.b2b_accounts (
 id uuid primary key default gen_random_uuid(),
 tenant_key text not null default 'angelcare-internal',
 code text not null, legal_name text not null, commercial_name text not null default '', legal_form text not null default '', ice text not null default '', tax_identifier text not null default '', sector text not null default '', segment text not null default '', website text not null default '', main_phone text not null default '', headquarters_city text not null default '', account_owner text not null default '', account_status text not null default 'prospect', strategic_tier text not null default 'C', credit_conditions text not null default 'Comptant', contract_status text not null default 'prospect', relationship_health numeric(6,2) not null default 50 check(relationship_health between 0 and 100), active_opportunity_ids uuid[] not null default '{}', pipeline_value_dh numeric(14,2) not null default 0, outstanding_balance_dh numeric(14,2) not null default 0, renewal_date date null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(tenant_key,code)
);

create table if not exists flashcards_os.b2b_account_sites (
 id uuid primary key default gen_random_uuid(),
 tenant_key text not null default 'angelcare-internal',
 account_id uuid not null references flashcards_os.b2b_accounts(id) on delete restrict, code text not null, name text not null, site_type text not null default 'Site', address jsonb not null default '{}'::jsonb, classroom_count integer not null default 0 check(classroom_count>=0), learner_capacity integer not null default 0 check(learner_capacity>=0), active_learners integer not null default 0 check(active_learners>=0), age_distribution text[] not null default '{}', languages text[] not null default '{}', delivery_constraints text[] not null default '{}', operational_contact text not null default '', pedagogical_contact text not null default '', active_deployment_ids uuid[] not null default '{}', created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(tenant_key,code)
);

create table if not exists flashcards_os.b2b_site_departments (
 id uuid primary key default gen_random_uuid(),
 tenant_key text not null default 'angelcare-internal',
 site_id uuid not null references flashcards_os.b2b_account_sites(id) on delete restrict, name text not null, department_type text not null default '', classroom_count integer not null default 0, learner_capacity integer not null default 0, metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists flashcards_os.b2b_learner_populations (
 id uuid primary key default gen_random_uuid(),
 tenant_key text not null default 'angelcare-internal',
 account_id uuid not null references flashcards_os.b2b_accounts(id) on delete restrict, site_id uuid null references flashcards_os.b2b_account_sites(id) on delete restrict, label text not null, learner_count integer not null default 0, age_groups text[] not null default '{}', languages text[] not null default '{}', needs_snapshot jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists flashcards_os.b2b_contacts (
 id uuid primary key default gen_random_uuid(),
 tenant_key text not null default 'angelcare-internal',
 account_id uuid not null references flashcards_os.b2b_accounts(id) on delete restrict, site_id uuid null references flashcards_os.b2b_account_sites(id) on delete restrict, full_name text not null, title text not null default '', department text not null default '', email text not null default '', phone text not null default '', preferred_channel text not null default 'Email', is_primary boolean not null default false, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists flashcards_os.b2b_stakeholders (
 id uuid primary key default gen_random_uuid(),
 tenant_key text not null default 'angelcare-internal',
 account_id uuid not null references flashcards_os.b2b_accounts(id) on delete restrict, site_id uuid null references flashcards_os.b2b_account_sites(id) on delete restrict, full_name text not null, title text not null default '', department text not null default '', email text not null default '', phone text not null default '', role text not null default 'influencer', decision_authority numeric(6,2) not null default 0 check(decision_authority between 0 and 100), influence numeric(6,2) not null default 0 check(influence between 0 and 100), interest numeric(6,2) not null default 0 check(interest between 0 and 100), position text not null default 'neutral' check(position in('champion','supportive','neutral','resistant','blocker')), relationship_strength numeric(6,2) not null default 0 check(relationship_strength between 0 and 100), preferred_channel text not null default 'Email', required_action text not null default '', last_engagement_at timestamptz null, next_engagement_at timestamptz null, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists flashcards_os.b2b_stakeholder_roles (
 id uuid primary key default gen_random_uuid(),
 tenant_key text not null default 'angelcare-internal',
 stakeholder_id uuid not null references flashcards_os.b2b_stakeholders(id) on delete restrict, opportunity_id uuid null, role_key text not null, authority_weight numeric(8,3) not null default 1, created_at timestamptz not null default now(), unique(tenant_key,stakeholder_id,opportunity_id,role_key)
);

create table if not exists flashcards_os.b2b_needs_assessments (
 id uuid primary key default gen_random_uuid(),
 tenant_key text not null default 'angelcare-internal',
 customer_id uuid not null references flashcards_os.b2b_accounts(id) on delete restrict, learner_id uuid null, title text not null, status text not null default 'draft', dimensions_snapshot jsonb not null default '{}'::jsonb, summary text not null default '', completed_by text null, completed_at timestamptz null, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists flashcards_os.b2b_account_plans (
 id uuid primary key default gen_random_uuid(),
 tenant_key text not null default 'angelcare-internal',
 account_id uuid not null references flashcards_os.b2b_accounts(id) on delete restrict, title text not null, strategic_objectives text[] not null default '{}', opportunity_ids uuid[] not null default '{}', risks text[] not null default '{}', actions jsonb not null default '[]'::jsonb, status text not null default 'active', owner text not null default '', created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists flashcards_os.b2b_renewal_profiles (
 id uuid primary key default gen_random_uuid(),
 tenant_key text not null default 'angelcare-internal',
 account_id uuid not null references flashcards_os.b2b_accounts(id) on delete restrict, renewal_date date null, renewal_value_dh numeric(14,2) not null default 0, renewal_probability numeric(6,2) not null default 0, risks text[] not null default '{}', next_action text not null default '', owner text not null default '', updated_at timestamptz not null default now(), unique(tenant_key,account_id)
);

create table if not exists flashcards_os.crm_recommendations (
 id uuid primary key default gen_random_uuid(),
 tenant_key text not null default 'angelcare-internal',
 universe text not null check(universe in('b2c','b2b')), customer_id uuid not null, learner_id uuid null, assessment_id uuid not null, title text not null, status text not null default 'review_required', sellable_ids uuid[] not null default '{}', ready_plan_ids uuid[] not null default '{}', release_ids uuid[] not null default '{}', rationale text not null default '', alternative text not null default '', next_action text not null default '', intelligence_run_id uuid null, approved_by text null, approved_at timestamptz null, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists flashcards_os.opportunities (
 id uuid primary key default gen_random_uuid(),
 tenant_key text not null default 'angelcare-internal',
 code text not null, universe text not null check(universe in('b2c','b2b')), customer_id uuid not null, customer_name text not null, learner_id uuid null, site_ids uuid[] not null default '{}', title text not null, stage text not null, probability numeric(6,2) not null default 0 check(probability between 0 and 100), value_dh numeric(14,2) not null default 0 check(value_dh>=0), weighted_value_dh numeric(14,2) not null default 0 check(weighted_value_dh>=0), expected_close_date date null, owner text not null default '', next_action text not null default '', next_action_due_at timestamptz null, recommendation_id uuid null, sellable_ids uuid[] not null default '{}', ready_plan_ids uuid[] not null default '{}', release_ids uuid[] not null default '{}', stakeholder_ids uuid[] not null default '{}', risks text[] not null default '{}', competitor text not null default '', loss_reason text not null default '', renewal_potential_dh numeric(14,2) not null default 0, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(tenant_key,code)
);

create table if not exists flashcards_os.opportunity_stage_events (
 id uuid primary key default gen_random_uuid(),
 tenant_key text not null default 'angelcare-internal',
 opportunity_id uuid not null references flashcards_os.opportunities(id) on delete restrict, from_stage text null, to_stage text not null, probability numeric(6,2) not null default 0, changed_by text not null, reason text not null default '', created_at timestamptz not null default now()
);

create table if not exists flashcards_os.crm_activities (
 id uuid primary key default gen_random_uuid(),
 tenant_key text not null default 'angelcare-internal',
 universe text not null check(universe in('b2c','b2b')), customer_id uuid not null, opportunity_id uuid null references flashcards_os.opportunities(id) on delete restrict, contact_id uuid null, activity_type text not null, title text not null, outcome text not null default '', next_action text not null default '', due_at timestamptz null, occurred_at timestamptz not null default now(), owner text not null default '', visibility text not null default 'team' check(visibility in('team','restricted','executive')), evidence_urls text[] not null default '{}', created_at timestamptz not null default now()
);

create table if not exists flashcards_os.crm_tasks (
 id uuid primary key default gen_random_uuid(),
 tenant_key text not null default 'angelcare-internal',
 universe text not null check(universe in('b2c','b2b')), customer_id uuid not null, opportunity_id uuid null references flashcards_os.opportunities(id) on delete restrict, title text not null, status text not null default 'open', priority text not null default 'medium', owner text not null default '', due_at timestamptz null, completed_at timestamptz null, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists flashcards_os.crm_notes (
 id uuid primary key default gen_random_uuid(),
 tenant_key text not null default 'angelcare-internal',
 universe text not null check(universe in('b2c','b2b')), customer_id uuid not null, opportunity_id uuid null references flashcards_os.opportunities(id) on delete restrict, note text not null, visibility text not null default 'team', author text not null, created_at timestamptz not null default now()
);

create table if not exists flashcards_os.crm_attachments (
 id uuid primary key default gen_random_uuid(),
 tenant_key text not null default 'angelcare-internal',
 universe text not null check(universe in('b2c','b2b')), customer_id uuid not null, opportunity_id uuid null references flashcards_os.opportunities(id) on delete restrict, storage_object_id uuid null, filename text not null, mime_type text not null default '', file_size bigint not null default 0, uploaded_by text not null, created_at timestamptz not null default now()
);

create table if not exists flashcards_os.crm_assignments (
 id uuid primary key default gen_random_uuid(),
 tenant_key text not null default 'angelcare-internal',
 universe text not null check(universe in('b2c','b2b')), entity_type text not null, entity_id uuid not null, assignee_id text not null, assignee_name text not null, role_key text not null default 'owner', assigned_at timestamptz not null default now(), unique(tenant_key,entity_type,entity_id,assignee_id,role_key)
);

create table if not exists flashcards_os.crm_timeline_events (
 id uuid primary key default gen_random_uuid(),
 tenant_key text not null default 'angelcare-internal',
 universe text not null check(universe in('b2c','b2b')), customer_id uuid not null, entity_type text not null, entity_id uuid not null, event_type text not null, title text not null, summary text not null default '', payload jsonb not null default '{}'::jsonb, occurred_at timestamptz not null default now(), actor_name text not null default '' 
);

create table if not exists flashcards_os.crm_duplicate_candidates (
 id uuid primary key default gen_random_uuid(),
 tenant_key text not null default 'angelcare-internal',
 universe text not null check(universe in('b2c','b2b')), left_entity_id uuid not null, right_entity_id uuid not null, match_score numeric(8,4) not null default 0, reasons text[] not null default '{}', status text not null default 'open', decided_by text null, decided_at timestamptz null, created_at timestamptz not null default now(), unique(tenant_key,universe,left_entity_id,right_entity_id)
);

create table if not exists flashcards_os.commercial_proposals (
 id uuid primary key default gen_random_uuid(),
 tenant_key text not null default 'angelcare-internal',
 opportunity_id uuid null references flashcards_os.opportunities(id) on delete restrict, universe text not null check(universe in('b2c','b2b')), customer_id uuid not null, title text not null, status text not null default 'draft', narrative text not null default '', calculation_snapshot jsonb not null default '{}'::jsonb, created_by text not null default '', created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists flashcards_os.commercial_proposal_items (
 id uuid primary key default gen_random_uuid(),
 tenant_key text not null default 'angelcare-internal',
 proposal_id uuid not null references flashcards_os.commercial_proposals(id) on delete restrict, source_snapshot jsonb not null default '{}'::jsonb, description text not null, quantity numeric(14,3) not null check(quantity>0), unit_price_dh numeric(14,2) not null default 0, unit_cost_dh numeric(14,2) not null default 0, created_at timestamptz not null default now()
);

create table if not exists flashcards_os.quotations (
 id uuid primary key default gen_random_uuid(),
 tenant_key text not null default 'angelcare-internal',
 number text not null, version_no integer not null default 1 check(version_no>0), status text not null default 'draft', universe text not null check(universe in('b2c','b2b')), customer_id uuid not null, customer_name text not null, billing_contact text not null default '', delivery_contact text not null default '', opportunity_id uuid null references flashcards_os.opportunities(id) on delete restrict, currency text not null default 'Dh', price_book_id uuid null, tax_profile_id uuid null, issue_date date null, expiry_date date not null, payment_terms text not null default '', delivery_assumptions text not null default '', commercial_owner text not null default '', customer_decision text not null default 'pending' check(customer_decision in('pending','accepted','rejected')), customer_decision_at timestamptz null, supersedes_id uuid null references flashcards_os.quotations(id) on delete restrict, issued_at timestamptz null, issued_template_version text null,  calculation_snapshot jsonb not null default '{}'::jsonb, subtotal_dh numeric(14,2) not null default 0, discount_dh numeric(14,2) not null default 0, tax_dh numeric(14,2) not null default 0, total_dh numeric(14,2) not null default 0, cost_dh numeric(14,2) not null default 0, gross_margin_dh numeric(14,2) not null default 0, gross_margin_percent numeric(8,3) not null default 0, paid_dh numeric(14,2) not null default 0, outstanding_dh numeric(14,2) not null default 0, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(tenant_key,number,version_no)
);

create table if not exists flashcards_os.quotation_versions (
 id uuid primary key default gen_random_uuid(),
 tenant_key text not null default 'angelcare-internal',
 quotation_id uuid not null references flashcards_os.quotations(id) on delete restrict, version_no integer not null, snapshot jsonb not null, reason text not null default '', created_by text not null, created_at timestamptz not null default now(), unique(tenant_key,quotation_id,version_no)
);

create table if not exists flashcards_os.quotation_items (
 id uuid primary key default gen_random_uuid(),
 tenant_key text not null default 'angelcare-internal',
 quotation_id uuid not null references flashcards_os.quotations(id) on delete restrict,  source_snapshot jsonb not null default '{}'::jsonb, description text not null, quantity numeric(14,3) not null check(quantity>0), unit text not null default 'unit', unit_price_dh numeric(14,2) not null default 0 check(unit_price_dh>=0), unit_cost_dh numeric(14,2) not null default 0 check(unit_cost_dh>=0), discount_percent numeric(8,3) not null default 0 check(discount_percent between 0 and 100), tax_percent numeric(8,3) not null default 0 check(tax_percent between 0 and 100), delivery_required boolean not null default false, digital_entitlement_required boolean not null default false, net_unit_price_dh numeric(14,2) not null default 0, subtotal_before_tax_dh numeric(14,2) not null default 0, discount_dh numeric(14,2) not null default 0, tax_dh numeric(14,2) not null default 0, total_dh numeric(14,2) not null default 0, cost_total_dh numeric(14,2) not null default 0, gross_margin_dh numeric(14,2) not null default 0, gross_margin_percent numeric(8,3) not null default 0, delivered_quantity numeric(14,3) not null default 0, invoiced_quantity numeric(14,3) not null default 0, credited_quantity numeric(14,3) not null default 0, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists flashcards_os.quotation_approvals (
 id uuid primary key default gen_random_uuid(),
 tenant_key text not null default 'angelcare-internal',
 quotation_id uuid not null references flashcards_os.quotations(id) on delete restrict, approval_id uuid not null, created_at timestamptz not null default now(), unique(tenant_key,quotation_id,approval_id)
);

create table if not exists flashcards_os.quotation_events (
 id uuid primary key default gen_random_uuid(),
 tenant_key text not null default 'angelcare-internal',
 quotation_id uuid not null references flashcards_os.quotations(id) on delete restrict, event_type text not null, payload jsonb not null default '{}'::jsonb, actor_name text not null default '', created_at timestamptz not null default now()
);

create table if not exists flashcards_os.sales_orders (
 id uuid primary key default gen_random_uuid(),
 tenant_key text not null default 'angelcare-internal',
 number text not null, status text not null default 'confirmed', quotation_id uuid not null references flashcards_os.quotations(id) on delete restrict, quotation_number text not null, universe text not null check(universe in('b2c','b2b')), customer_id uuid not null, customer_name text not null, confirmed_at timestamptz not null,  calculation_snapshot jsonb not null default '{}'::jsonb, subtotal_dh numeric(14,2) not null default 0, discount_dh numeric(14,2) not null default 0, tax_dh numeric(14,2) not null default 0, total_dh numeric(14,2) not null default 0, cost_dh numeric(14,2) not null default 0, gross_margin_dh numeric(14,2) not null default 0, gross_margin_percent numeric(8,3) not null default 0, paid_dh numeric(14,2) not null default 0, outstanding_dh numeric(14,2) not null default 0, delivered_value_dh numeric(14,2) not null default 0, invoiced_value_dh numeric(14,2) not null default 0, remaining_delivery_value_dh numeric(14,2) not null default 0, remaining_invoice_value_dh numeric(14,2) not null default 0, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(tenant_key,number)
);

create table if not exists flashcards_os.sales_order_items (
 id uuid primary key default gen_random_uuid(),
 tenant_key text not null default 'angelcare-internal',
 sales_order_id uuid not null references flashcards_os.sales_orders(id) on delete restrict,  source_snapshot jsonb not null default '{}'::jsonb, description text not null, quantity numeric(14,3) not null check(quantity>0), unit text not null default 'unit', unit_price_dh numeric(14,2) not null default 0 check(unit_price_dh>=0), unit_cost_dh numeric(14,2) not null default 0 check(unit_cost_dh>=0), discount_percent numeric(8,3) not null default 0 check(discount_percent between 0 and 100), tax_percent numeric(8,3) not null default 0 check(tax_percent between 0 and 100), delivery_required boolean not null default false, digital_entitlement_required boolean not null default false, net_unit_price_dh numeric(14,2) not null default 0, subtotal_before_tax_dh numeric(14,2) not null default 0, discount_dh numeric(14,2) not null default 0, tax_dh numeric(14,2) not null default 0, total_dh numeric(14,2) not null default 0, cost_total_dh numeric(14,2) not null default 0, gross_margin_dh numeric(14,2) not null default 0, gross_margin_percent numeric(8,3) not null default 0, delivered_quantity numeric(14,3) not null default 0, invoiced_quantity numeric(14,3) not null default 0, credited_quantity numeric(14,3) not null default 0, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists flashcards_os.sales_order_events (
 id uuid primary key default gen_random_uuid(),
 tenant_key text not null default 'angelcare-internal',
 sales_order_id uuid not null references flashcards_os.sales_orders(id) on delete restrict, event_type text not null, payload jsonb not null default '{}'::jsonb, actor_name text not null default '', created_at timestamptz not null default now()
);

create table if not exists flashcards_os.delivery_notes (
 id uuid primary key default gen_random_uuid(),
 tenant_key text not null default 'angelcare-internal',
 number text not null, status text not null default 'draft', order_id uuid not null references flashcards_os.sales_orders(id) on delete restrict, order_number text not null, universe text not null check(universe in('b2c','b2b')), customer_id uuid not null, customer_name text not null, site_id uuid null, delivery_address text not null default '', delivery_contact text not null default '', planned_date date null, delivered_at timestamptz null, carrier_or_agent text not null default '', notes text not null default '', invoicing_eligible boolean not null default false, issued_at timestamptz null, issued_template_version text null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(tenant_key,number)
);

create table if not exists flashcards_os.delivery_note_items (
 id uuid primary key default gen_random_uuid(),
 tenant_key text not null default 'angelcare-internal',
 delivery_note_id uuid not null references flashcards_os.delivery_notes(id) on delete restrict,  source_snapshot jsonb not null default '{}'::jsonb, description text not null, quantity numeric(14,3) not null check(quantity>0), unit text not null default 'unit', unit_price_dh numeric(14,2) not null default 0 check(unit_price_dh>=0), unit_cost_dh numeric(14,2) not null default 0 check(unit_cost_dh>=0), discount_percent numeric(8,3) not null default 0 check(discount_percent between 0 and 100), tax_percent numeric(8,3) not null default 0 check(tax_percent between 0 and 100), delivery_required boolean not null default false, digital_entitlement_required boolean not null default false, net_unit_price_dh numeric(14,2) not null default 0, subtotal_before_tax_dh numeric(14,2) not null default 0, discount_dh numeric(14,2) not null default 0, tax_dh numeric(14,2) not null default 0, total_dh numeric(14,2) not null default 0, cost_total_dh numeric(14,2) not null default 0, gross_margin_dh numeric(14,2) not null default 0, gross_margin_percent numeric(8,3) not null default 0, delivered_quantity numeric(14,3) not null default 0, invoiced_quantity numeric(14,3) not null default 0, credited_quantity numeric(14,3) not null default 0, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists flashcards_os.delivery_evidence (
 id uuid primary key default gen_random_uuid(),
 tenant_key text not null default 'angelcare-internal',
 delivery_note_id uuid not null references flashcards_os.delivery_notes(id) on delete restrict, evidence_type text not null, label text not null, reference text not null default '', storage_object_id uuid null, recorded_at timestamptz not null default now(), recorded_by text not null default '', created_at timestamptz not null default now()
);

create table if not exists flashcards_os.delivery_events (
 id uuid primary key default gen_random_uuid(),
 tenant_key text not null default 'angelcare-internal',
 delivery_note_id uuid not null references flashcards_os.delivery_notes(id) on delete restrict, event_type text not null, payload jsonb not null default '{}'::jsonb, actor_name text not null default '', created_at timestamptz not null default now()
);

create table if not exists flashcards_os.invoices (
 id uuid primary key default gen_random_uuid(),
 tenant_key text not null default 'angelcare-internal',
 number text not null, status text not null default 'draft', payment_status text not null default 'unpaid', universe text not null check(universe in('b2c','b2b')), customer_id uuid not null, customer_name text not null, billing_identity text not null default '', tax_identity text not null default '', order_id uuid not null references flashcards_os.sales_orders(id) on delete restrict, issue_date date null, due_date date not null, currency text not null default 'Dh', tax_profile_id uuid null, payment_terms text not null default '', issued_at timestamptz null, issued_template_version text null, dispute_reason text not null default '',  calculation_snapshot jsonb not null default '{}'::jsonb, subtotal_dh numeric(14,2) not null default 0, discount_dh numeric(14,2) not null default 0, tax_dh numeric(14,2) not null default 0, total_dh numeric(14,2) not null default 0, cost_dh numeric(14,2) not null default 0, gross_margin_dh numeric(14,2) not null default 0, gross_margin_percent numeric(8,3) not null default 0, paid_dh numeric(14,2) not null default 0, outstanding_dh numeric(14,2) not null default 0, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(tenant_key,number)
);

create table if not exists flashcards_os.invoice_items (
 id uuid primary key default gen_random_uuid(),
 tenant_key text not null default 'angelcare-internal',
 invoice_id uuid not null references flashcards_os.invoices(id) on delete restrict,  source_snapshot jsonb not null default '{}'::jsonb, description text not null, quantity numeric(14,3) not null check(quantity>0), unit text not null default 'unit', unit_price_dh numeric(14,2) not null default 0 check(unit_price_dh>=0), unit_cost_dh numeric(14,2) not null default 0 check(unit_cost_dh>=0), discount_percent numeric(8,3) not null default 0 check(discount_percent between 0 and 100), tax_percent numeric(8,3) not null default 0 check(tax_percent between 0 and 100), delivery_required boolean not null default false, digital_entitlement_required boolean not null default false, net_unit_price_dh numeric(14,2) not null default 0, subtotal_before_tax_dh numeric(14,2) not null default 0, discount_dh numeric(14,2) not null default 0, tax_dh numeric(14,2) not null default 0, total_dh numeric(14,2) not null default 0, cost_total_dh numeric(14,2) not null default 0, gross_margin_dh numeric(14,2) not null default 0, gross_margin_percent numeric(8,3) not null default 0, delivered_quantity numeric(14,3) not null default 0, invoiced_quantity numeric(14,3) not null default 0, credited_quantity numeric(14,3) not null default 0, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists flashcards_os.invoice_source_links (
 id uuid primary key default gen_random_uuid(),
 tenant_key text not null default 'angelcare-internal',
 invoice_id uuid not null references flashcards_os.invoices(id) on delete restrict, delivery_note_id uuid null references flashcards_os.delivery_notes(id) on delete restrict, delivery_note_number text null, sales_order_id uuid not null references flashcards_os.sales_orders(id) on delete restrict, line_id uuid not null, quantity numeric(14,3) not null check(quantity>0), created_at timestamptz not null default now()
);

create table if not exists flashcards_os.invoice_approvals (
 id uuid primary key default gen_random_uuid(),
 tenant_key text not null default 'angelcare-internal',
 invoice_id uuid not null references flashcards_os.invoices(id) on delete restrict, approval_id uuid not null, created_at timestamptz not null default now(), unique(tenant_key,invoice_id,approval_id)
);

create table if not exists flashcards_os.invoice_events (
 id uuid primary key default gen_random_uuid(),
 tenant_key text not null default 'angelcare-internal',
 invoice_id uuid not null references flashcards_os.invoices(id) on delete restrict, event_type text not null, payload jsonb not null default '{}'::jsonb, actor_name text not null default '', created_at timestamptz not null default now()
);

create table if not exists flashcards_os.credit_notes (
 id uuid primary key default gen_random_uuid(),
 tenant_key text not null default 'angelcare-internal',
 number text not null, status text not null default 'approval_required', invoice_id uuid not null references flashcards_os.invoices(id) on delete restrict, invoice_number text not null, customer_id uuid not null, customer_name text not null, reason text not null, calculation_snapshot jsonb not null default '{}'::jsonb, subtotal_dh numeric(14,2) not null default 0, discount_dh numeric(14,2) not null default 0, tax_dh numeric(14,2) not null default 0, total_dh numeric(14,2) not null default 0, issued_at timestamptz null, issued_template_version text null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(tenant_key,number)
);

create table if not exists flashcards_os.credit_note_items (
 id uuid primary key default gen_random_uuid(),
 tenant_key text not null default 'angelcare-internal',
 credit_note_id uuid not null references flashcards_os.credit_notes(id) on delete restrict,  source_snapshot jsonb not null default '{}'::jsonb, description text not null, quantity numeric(14,3) not null check(quantity>0), unit text not null default 'unit', unit_price_dh numeric(14,2) not null default 0 check(unit_price_dh>=0), unit_cost_dh numeric(14,2) not null default 0 check(unit_cost_dh>=0), discount_percent numeric(8,3) not null default 0 check(discount_percent between 0 and 100), tax_percent numeric(8,3) not null default 0 check(tax_percent between 0 and 100), delivery_required boolean not null default false, digital_entitlement_required boolean not null default false, net_unit_price_dh numeric(14,2) not null default 0, subtotal_before_tax_dh numeric(14,2) not null default 0, discount_dh numeric(14,2) not null default 0, tax_dh numeric(14,2) not null default 0, total_dh numeric(14,2) not null default 0, cost_total_dh numeric(14,2) not null default 0, gross_margin_dh numeric(14,2) not null default 0, gross_margin_percent numeric(8,3) not null default 0, delivered_quantity numeric(14,3) not null default 0, invoiced_quantity numeric(14,3) not null default 0, credited_quantity numeric(14,3) not null default 0, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists flashcards_os.credit_note_approvals (
 id uuid primary key default gen_random_uuid(),
 tenant_key text not null default 'angelcare-internal',
 credit_note_id uuid not null references flashcards_os.credit_notes(id) on delete restrict, approval_id uuid not null, created_at timestamptz not null default now(), unique(tenant_key,credit_note_id,approval_id)
);

create table if not exists flashcards_os.payments (
 id uuid primary key default gen_random_uuid(),
 tenant_key text not null default 'angelcare-internal',
 number text not null, customer_id uuid not null, customer_name text not null, universe text not null check(universe in('b2c','b2b')), method text not null, amount_dh numeric(14,2) not null check(amount_dh>0), currency text not null default 'Dh', transaction_reference text not null default '', value_date date not null, received_at timestamptz not null default now(), status text not null default 'recorded', evidence_urls text[] not null default '{}', unapplied_amount_dh numeric(14,2) not null default 0 check(unapplied_amount_dh>=0), recorded_by text not null default '', created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(tenant_key,number)
);

create table if not exists flashcards_os.payment_allocations (
 id uuid primary key default gen_random_uuid(),
 tenant_key text not null default 'angelcare-internal',
 payment_id uuid not null references flashcards_os.payments(id) on delete restrict, invoice_id uuid not null references flashcards_os.invoices(id) on delete restrict, invoice_number text not null, amount_dh numeric(14,2) not null check(amount_dh>0), allocated_at timestamptz not null default now(), reversed_at timestamptz null, reversed_by text null
);

create table if not exists flashcards_os.payment_evidence (
 id uuid primary key default gen_random_uuid(),
 tenant_key text not null default 'angelcare-internal',
 payment_id uuid not null references flashcards_os.payments(id) on delete restrict, evidence_type text not null, reference text not null default '', storage_object_id uuid null, recorded_by text not null default '', created_at timestamptz not null default now()
);

create table if not exists flashcards_os.payment_events (
 id uuid primary key default gen_random_uuid(),
 tenant_key text not null default 'angelcare-internal',
 payment_id uuid not null references flashcards_os.payments(id) on delete restrict, event_type text not null, payload jsonb not null default '{}'::jsonb, actor_name text not null default '', created_at timestamptz not null default now()
);

create table if not exists flashcards_os.commercial_document_numbers (
 id uuid primary key default gen_random_uuid(),
 tenant_key text not null default 'angelcare-internal',
 document_type text not null, year_no integer not null, next_value bigint not null default 1 check(next_value>0), prefix text not null, padding integer not null default 4 check(padding between 3 and 10), updated_at timestamptz not null default now(), unique(tenant_key,document_type,year_no)
);

create table if not exists flashcards_os.commercial_document_templates (
 id uuid primary key default gen_random_uuid(),
 tenant_key text not null default 'angelcare-internal',
 document_type text not null, version_key text not null, label text not null, status text not null default 'active', layout_contract jsonb not null default '{}'::jsonb, effective_from date not null default current_date, effective_until date null, created_by text not null default '', created_at timestamptz not null default now(), unique(tenant_key,document_type,version_key)
);

create table if not exists flashcards_os.commercial_calculation_snapshots (
 id uuid primary key default gen_random_uuid(),
 tenant_key text not null default 'angelcare-internal',
 document_type text not null, document_id uuid not null, snapshot jsonb not null, snapshot_hash text not null, created_at timestamptz not null default now(), unique(tenant_key,document_type,document_id,snapshot_hash)
);

create table if not exists flashcards_os.commercial_approval_rules (
 id uuid primary key default gen_random_uuid(),
 tenant_key text not null default 'angelcare-internal',
 rule_key text not null, document_type text not null, label text not null, conditions jsonb not null default '{}'::jsonb, assigned_role text not null, priority integer not null default 100, status text not null default 'active', created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(tenant_key,rule_key)
);

create table if not exists flashcards_os.commercial_approvals (
 id uuid primary key default gen_random_uuid(),
 tenant_key text not null default 'angelcare-internal',
 document_type text not null, document_id uuid not null, rule_key text not null, reason text not null, threshold numeric(14,2) not null default 0, requested_by text not null, requested_at timestamptz not null default now(), assigned_role text not null, status text not null default 'pending' check(status in('pending','approved','rejected','cancelled')), decided_by text null, decided_at timestamptz null, decision_note text not null default '', created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists flashcards_os.customer_balances (
 id uuid primary key default gen_random_uuid(),
 tenant_key text not null default 'angelcare-internal',
 customer_id uuid not null, customer_name text not null, universe text not null check(universe in('b2c','b2b')), invoiced_dh numeric(14,2) not null default 0, credited_dh numeric(14,2) not null default 0, paid_dh numeric(14,2) not null default 0, outstanding_dh numeric(14,2) not null default 0, overdue_dh numeric(14,2) not null default 0, unapplied_dh numeric(14,2) not null default 0, ageing_current numeric(14,2) not null default 0, ageing_1_30 numeric(14,2) not null default 0, ageing_31_60 numeric(14,2) not null default 0, ageing_61_90 numeric(14,2) not null default 0, ageing_over_90 numeric(14,2) not null default 0, promised_payment_date date null, collection_owner text not null default '', last_followup_at timestamptz null, updated_at timestamptz not null default now(), unique(tenant_key,customer_id,universe)
);

create table if not exists flashcards_os.receivable_snapshots (
 id uuid primary key default gen_random_uuid(),
 tenant_key text not null default 'angelcare-internal',
 snapshot_date date not null, universe text not null check(universe in('b2c','b2b','all')), invoiced_dh numeric(14,2) not null default 0, paid_dh numeric(14,2) not null default 0, outstanding_dh numeric(14,2) not null default 0, overdue_dh numeric(14,2) not null default 0, ageing jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), unique(tenant_key,snapshot_date,universe)
);

create table if not exists flashcards_os.commercial_intelligence_runs (
 id uuid primary key default gen_random_uuid(),
 tenant_key text not null default 'angelcare-internal',
 task text not null, actor_id text not null, actor_name text not null, model_requested text not null, model_used text not null, fallback_used boolean not null default false, prompt_tokens integer not null default 0, completion_tokens integer not null default 0, total_tokens integer not null default 0, cost_usd numeric(14,6) not null default 0, latency_ms integer not null default 0, result_payload jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);

create table if not exists flashcards_os.commercial_settings (
 id uuid primary key default gen_random_uuid(),
 tenant_key text not null default 'angelcare-internal',
 setting_key text not null, setting_value jsonb not null default '{}'::jsonb, description text not null default '', updated_by text null, updated_at timestamptz not null default now(), unique(tenant_key,setting_key)
);

-- Operational indexes
create index if not exists idx_fc_b2c_guardians_tenant on flashcards_os.b2c_guardians(tenant_key);
create index if not exists idx_fc_b2c_learners_tenant on flashcards_os.b2c_learners(tenant_key);
create index if not exists idx_fc_b2c_needs_assessments_tenant on flashcards_os.b2c_needs_assessments(tenant_key);
create index if not exists idx_fc_b2b_account_sites_tenant on flashcards_os.b2b_account_sites(tenant_key);
create index if not exists idx_fc_b2b_stakeholders_tenant on flashcards_os.b2b_stakeholders(tenant_key);
create index if not exists idx_fc_b2b_needs_assessments_tenant on flashcards_os.b2b_needs_assessments(tenant_key);
create index if not exists idx_fc_opportunities_tenant on flashcards_os.opportunities(tenant_key);
create index if not exists idx_fc_crm_activities_tenant on flashcards_os.crm_activities(tenant_key);
create index if not exists idx_fc_quotations_tenant on flashcards_os.quotations(tenant_key);
create index if not exists idx_fc_sales_orders_tenant on flashcards_os.sales_orders(tenant_key);
create index if not exists idx_fc_delivery_notes_tenant on flashcards_os.delivery_notes(tenant_key);
create index if not exists idx_fc_invoices_tenant on flashcards_os.invoices(tenant_key);
create index if not exists idx_fc_payments_tenant on flashcards_os.payments(tenant_key);
create index if not exists idx_fc_commercial_approvals_tenant on flashcards_os.commercial_approvals(tenant_key);

create index if not exists idx_fc_opportunities_customer on flashcards_os.opportunities(tenant_key,universe,customer_id,stage);
create index if not exists idx_fc_quotations_customer on flashcards_os.quotations(tenant_key,customer_id,status);
create index if not exists idx_fc_orders_customer on flashcards_os.sales_orders(tenant_key,customer_id,status);
create index if not exists idx_fc_invoices_due on flashcards_os.invoices(tenant_key,payment_status,due_date);
create index if not exists idx_fc_payments_customer on flashcards_os.payments(tenant_key,customer_id,value_date);

-- Idempotent updated-at triggers without destructive DROP TRIGGER locks.
do $$ declare r record; begin
 for r in select unnest(array[
 'b2c_households','b2c_guardians','b2c_household_addresses','b2c_learners','b2c_needs_assessments','b2b_accounts','b2b_account_sites','b2b_site_departments','b2b_learner_populations','b2b_contacts','b2b_stakeholders','b2b_needs_assessments','b2b_account_plans','b2b_renewal_profiles','crm_recommendations','opportunities','crm_tasks','commercial_proposals','quotations','quotation_items','sales_orders','sales_order_items','delivery_notes','delivery_note_items','invoices','invoice_items','credit_notes','credit_note_items','payments','commercial_document_numbers','commercial_approval_rules','commercial_approvals','commercial_settings']) as table_name
 loop
  if not exists(select 1 from pg_trigger where tgname='trg_fc_'||r.table_name||'_updated_at' and not tgisinternal) then
   execute format('create trigger %I before update on flashcards_os.%I for each row execute function flashcards_os.touch_updated_at()', 'trg_fc_'||r.table_name||'_updated_at', r.table_name);
  end if;
 end loop;
end $$;

create or replace function flashcards_os.protect_issued_commercial_document() returns trigger language plpgsql as $$
declare old_core jsonb; new_core jsonb;
begin
 if old.status not in ('issued','sent','accepted','partially_delivered','fully_delivered','partially_invoiced','fully_invoiced','partially_paid','paid','overdue','disputed','completed') then return new; end if;
 if tg_table_name='quotations' then
   old_core=to_jsonb(old)-array['status','customer_decision','customer_decision_at','updated_at']; new_core=to_jsonb(new)-array['status','customer_decision','customer_decision_at','updated_at'];
 elsif tg_table_name='delivery_notes' then
   old_core=to_jsonb(old)-array['status','delivered_at','invoicing_eligible','updated_at']; new_core=to_jsonb(new)-array['status','delivered_at','invoicing_eligible','updated_at'];
 elsif tg_table_name='invoices' then
   old_core=to_jsonb(old)-array['status','payment_status','paid_dh','outstanding_dh','dispute_reason','updated_at']; new_core=to_jsonb(new)-array['status','payment_status','paid_dh','outstanding_dh','dispute_reason','updated_at'];
 else
   old_core=to_jsonb(old)-array['status','updated_at']; new_core=to_jsonb(new)-array['status','updated_at'];
 end if;
 if old_core<>new_core then raise exception 'Issued commercial document is immutable; create a revision, replacement or credit note.'; end if;
 return new;
end $$;
do $$ declare n text; begin for n in select unnest(array['quotations','delivery_notes','invoices','credit_notes']) loop if not exists(select 1 from pg_trigger where tgname='trg_fc_'||n||'_immutable' and not tgisinternal) then execute format('create trigger %I before update on flashcards_os.%I for each row execute function flashcards_os.protect_issued_commercial_document()', 'trg_fc_'||n||'_immutable',n); end if; end loop; end $$;

create or replace function public.flashcards_os_next_revenue_document_number(p_tenant_key text,p_document_type text) returns text language plpgsql security definer set search_path=public,flashcards_os as $$
declare y integer:=extract(year from current_date)::integer; current_value bigint; current_prefix text; current_padding integer;
begin
 perform pg_advisory_xact_lock(hashtext(p_tenant_key||':'||p_document_type||':'||y::text));
 insert into flashcards_os.commercial_document_numbers(tenant_key,document_type,year_no,next_value,prefix,padding)
 values(p_tenant_key,p_document_type,y,1,case p_document_type when 'quotation' then 'DEV-FC' when 'sales_order' then 'CMD-FC' when 'delivery_note' then 'BL-FC' when 'invoice' then 'FAC-FC' when 'credit_note' then 'AV-FC' when 'payment' then 'PAY-FC' else upper(left(p_document_type,3))||'-FC' end,4)
 on conflict(tenant_key,document_type,year_no) do nothing;
 select next_value,prefix,padding into current_value,current_prefix,current_padding from flashcards_os.commercial_document_numbers where tenant_key=p_tenant_key and document_type=p_document_type and year_no=y for update;
 update flashcards_os.commercial_document_numbers set next_value=current_value+1,updated_at=now() where tenant_key=p_tenant_key and document_type=p_document_type and year_no=y;
 return current_prefix||'-'||y::text||'-'||lpad(current_value::text,current_padding,'0');
end $$;
revoke all on function public.flashcards_os_next_revenue_document_number(text,text) from public;
grant execute on function public.flashcards_os_next_revenue_document_number(text,text) to authenticated,service_role;

-- Server-facing views. Application commands still enforce RBAC and tenant checks.
create or replace view public.fc_os_b2c_households as select * from flashcards_os.b2c_households;
create or replace view public.fc_os_b2c_guardians as select * from flashcards_os.b2c_guardians;
create or replace view public.fc_os_b2c_household_addresses as select * from flashcards_os.b2c_household_addresses;
create or replace view public.fc_os_b2c_learners as select * from flashcards_os.b2c_learners;
create or replace view public.fc_os_b2c_needs_assessments as select * from flashcards_os.b2c_needs_assessments;
create or replace view public.fc_os_b2c_need_dimensions as select * from flashcards_os.b2c_need_dimensions;
create or replace view public.fc_os_b2b_accounts as select * from flashcards_os.b2b_accounts;
create or replace view public.fc_os_b2b_account_sites as select * from flashcards_os.b2b_account_sites;
create or replace view public.fc_os_b2b_site_departments as select * from flashcards_os.b2b_site_departments;
create or replace view public.fc_os_b2b_learner_populations as select * from flashcards_os.b2b_learner_populations;
create or replace view public.fc_os_b2b_contacts as select * from flashcards_os.b2b_contacts;
create or replace view public.fc_os_b2b_stakeholders as select * from flashcards_os.b2b_stakeholders;
create or replace view public.fc_os_b2b_stakeholder_roles as select * from flashcards_os.b2b_stakeholder_roles;
create or replace view public.fc_os_b2b_needs_assessments as select * from flashcards_os.b2b_needs_assessments;
create or replace view public.fc_os_b2b_account_plans as select * from flashcards_os.b2b_account_plans;
create or replace view public.fc_os_b2b_renewal_profiles as select * from flashcards_os.b2b_renewal_profiles;
create or replace view public.fc_os_crm_recommendations as select * from flashcards_os.crm_recommendations;
create or replace view public.fc_os_opportunities as select * from flashcards_os.opportunities;
create or replace view public.fc_os_opportunity_stage_events as select * from flashcards_os.opportunity_stage_events;
create or replace view public.fc_os_crm_activities as select * from flashcards_os.crm_activities;
create or replace view public.fc_os_crm_tasks as select * from flashcards_os.crm_tasks;
create or replace view public.fc_os_crm_notes as select * from flashcards_os.crm_notes;
create or replace view public.fc_os_crm_attachments as select * from flashcards_os.crm_attachments;
create or replace view public.fc_os_crm_assignments as select * from flashcards_os.crm_assignments;
create or replace view public.fc_os_crm_timeline_events as select * from flashcards_os.crm_timeline_events;
create or replace view public.fc_os_crm_duplicate_candidates as select * from flashcards_os.crm_duplicate_candidates;
create or replace view public.fc_os_commercial_proposals as select * from flashcards_os.commercial_proposals;
create or replace view public.fc_os_commercial_proposal_items as select * from flashcards_os.commercial_proposal_items;
create or replace view public.fc_os_quotations as select * from flashcards_os.quotations;
create or replace view public.fc_os_quotation_versions as select * from flashcards_os.quotation_versions;
create or replace view public.fc_os_quotation_items as select * from flashcards_os.quotation_items;
create or replace view public.fc_os_quotation_approvals as select * from flashcards_os.quotation_approvals;
create or replace view public.fc_os_quotation_events as select * from flashcards_os.quotation_events;
create or replace view public.fc_os_sales_orders as select * from flashcards_os.sales_orders;
create or replace view public.fc_os_sales_order_items as select * from flashcards_os.sales_order_items;
create or replace view public.fc_os_sales_order_events as select * from flashcards_os.sales_order_events;
create or replace view public.fc_os_delivery_notes as select * from flashcards_os.delivery_notes;
create or replace view public.fc_os_delivery_note_items as select * from flashcards_os.delivery_note_items;
create or replace view public.fc_os_delivery_evidence as select * from flashcards_os.delivery_evidence;
create or replace view public.fc_os_delivery_events as select * from flashcards_os.delivery_events;
create or replace view public.fc_os_invoices as select * from flashcards_os.invoices;
create or replace view public.fc_os_invoice_items as select * from flashcards_os.invoice_items;
create or replace view public.fc_os_invoice_source_links as select * from flashcards_os.invoice_source_links;
create or replace view public.fc_os_invoice_approvals as select * from flashcards_os.invoice_approvals;
create or replace view public.fc_os_invoice_events as select * from flashcards_os.invoice_events;
create or replace view public.fc_os_credit_notes as select * from flashcards_os.credit_notes;
create or replace view public.fc_os_credit_note_items as select * from flashcards_os.credit_note_items;
create or replace view public.fc_os_credit_note_approvals as select * from flashcards_os.credit_note_approvals;
create or replace view public.fc_os_payments as select * from flashcards_os.payments;
create or replace view public.fc_os_payment_allocations as select * from flashcards_os.payment_allocations;
create or replace view public.fc_os_payment_evidence as select * from flashcards_os.payment_evidence;
create or replace view public.fc_os_payment_events as select * from flashcards_os.payment_events;
create or replace view public.fc_os_commercial_document_numbers as select * from flashcards_os.commercial_document_numbers;
create or replace view public.fc_os_commercial_document_templates as select * from flashcards_os.commercial_document_templates;
create or replace view public.fc_os_commercial_calculation_snapshots as select * from flashcards_os.commercial_calculation_snapshots;
create or replace view public.fc_os_commercial_approval_rules as select * from flashcards_os.commercial_approval_rules;
create or replace view public.fc_os_commercial_approvals as select * from flashcards_os.commercial_approvals;
create or replace view public.fc_os_customer_balances as select * from flashcards_os.customer_balances;
create or replace view public.fc_os_receivable_snapshots as select * from flashcards_os.receivable_snapshots;
create or replace view public.fc_os_commercial_intelligence_runs as select * from flashcards_os.commercial_intelligence_runs;
create or replace view public.fc_os_commercial_settings as select * from flashcards_os.commercial_settings;


-- Tenant containment and RLS.
do $$ declare r record; begin
 for r in select tablename from pg_tables where schemaname='flashcards_os' and tablename in ('b2c_households','b2c_guardians','b2c_household_addresses','b2c_learners','b2c_needs_assessments','b2c_need_dimensions','b2b_accounts','b2b_account_sites','b2b_site_departments','b2b_learner_populations','b2b_contacts','b2b_stakeholders','b2b_stakeholder_roles','b2b_needs_assessments','b2b_account_plans','b2b_renewal_profiles','crm_recommendations','opportunities','opportunity_stage_events','crm_activities','crm_tasks','crm_notes','crm_attachments','crm_assignments','crm_timeline_events','crm_duplicate_candidates','commercial_proposals','commercial_proposal_items','quotations','quotation_versions','quotation_items','quotation_approvals','quotation_events','sales_orders','sales_order_items','sales_order_events','delivery_notes','delivery_note_items','delivery_evidence','delivery_events','invoices','invoice_items','invoice_source_links','invoice_approvals','invoice_events','credit_notes','credit_note_items','credit_note_approvals','payments','payment_allocations','payment_evidence','payment_events','commercial_document_numbers','commercial_document_templates','commercial_calculation_snapshots','commercial_approval_rules','commercial_approvals','customer_balances','receivable_snapshots','commercial_intelligence_runs','commercial_settings')
 loop
  execute format('alter table flashcards_os.%I enable row level security',r.tablename);
  if not exists(select 1 from pg_policies where schemaname='flashcards_os' and tablename=r.tablename and policyname='fc_internal_read') then
    execute format('create policy fc_internal_read on flashcards_os.%I for select to authenticated using (tenant_key=''angelcare-internal'')',r.tablename);
  end if;
  if not exists(select 1 from pg_policies where schemaname='flashcards_os' and tablename=r.tablename and policyname='fc_service_all') then
    execute format('create policy fc_service_all on flashcards_os.%I for all to service_role using (true) with check (true)',r.tablename);
  end if;
 end loop;
end $$;

-- Controlled configuration only; no invented customers, costs or financial transactions.
insert into flashcards_os.commercial_document_templates(tenant_key,document_type,version_key,label,status,layout_contract,effective_from,created_by) values
('angelcare-internal','quotation','FC-QUOTATION-A4-v1','Devis ANGELCARE Flashcards OS A4','active','{"theme":"white_enterprise","immutable_after_issue":true}'::jsonb,current_date,'UMZ5'),
('angelcare-internal','delivery_note','FC-DELIVERY-A4-v1','Bon de livraison ANGELCARE Flashcards OS A4','active','{"theme":"white_enterprise","evidence_required":true}'::jsonb,current_date,'UMZ5'),
('angelcare-internal','invoice','FC-INVOICE-A4-v1','Facture ANGELCARE Flashcards OS A4','active','{"theme":"white_enterprise","immutable_after_issue":true}'::jsonb,current_date,'UMZ5'),
('angelcare-internal','credit_note','FC-CREDIT-A4-v1','Avoir ANGELCARE Flashcards OS A4','active','{"theme":"white_enterprise","invoice_reference_required":true}'::jsonb,current_date,'UMZ5'),
('angelcare-internal','payment_receipt','FC-RECEIPT-A4-v1','Reçu de paiement ANGELCARE Flashcards OS A4','active','{"theme":"white_enterprise"}'::jsonb,current_date,'UMZ5')
on conflict(tenant_key,document_type,version_key) do update set label=excluded.label,status=excluded.status,layout_contract=excluded.layout_contract;

insert into flashcards_os.commercial_approval_rules(tenant_key,rule_key,document_type,label,conditions,assigned_role,priority,status) values
('angelcare-internal','discount_above_20_percent','quotation','Remise supérieure à 20%','{"discount_percent":{"gt":20}}'::jsonb,'commercial_director',10,'active'),
('angelcare-internal','margin_below_25_percent','quotation','Marge inférieure à 25%','{"gross_margin_percent":{"lt":25}}'::jsonb,'finance_controller',20,'active'),
('angelcare-internal','high_value_transaction','quotation','Transaction à valeur élevée','{"total_dh":{"gte":50000}}'::jsonb,'managing_director',30,'active'),
('angelcare-internal','manual_commercial_line','quotation','Ligne commerciale manuelle','{"source_type":"custom_authorised"}'::jsonb,'commercial_director',40,'active'),
('angelcare-internal','credit_note_approval','credit_note','Avoir commercial ou financier','{}'::jsonb,'finance_controller',10,'active')
on conflict(tenant_key,rule_key) do update set label=excluded.label,conditions=excluded.conditions,assigned_role=excluded.assigned_role,status=excluded.status;

insert into flashcards_os.commercial_settings(tenant_key,setting_key,setting_value,description) values
('angelcare-internal','revenue.currency','{"code":"Dh","decimals":2}'::jsonb,'Currency display contract.'),
('angelcare-internal','revenue.customer_fulfilment_boundary','{"delivery_execution":"UMZ6","returns":"UMZ6","complaints":"UMZ6","refund_workflow":"UMZ6"}'::jsonb,'UMZ5 creates obligations and document truth; UMZ6 executes customer fulfilment and CX.'),
('angelcare-internal','revenue.ai_authority','{"advisory_only":true,"may_issue":false,"may_record_payment":false,"may_contact_customer":false}'::jsonb,'OpenRouter has no irreversible commercial authority.'),
('angelcare-internal','revenue.ai_task_profiles','{"profiles":["b2c_needs_summary","b2c_solution_recommendation","b2c_next_best_action","b2b_account_summary","b2b_stakeholder_analysis","b2b_opportunity_strategy","commercial_proposal_narrative","objection_preparation","negotiation_brief","lost_opportunity_analysis","renewal_risk_analysis","receivable_followup_brief"]}'::jsonb,'Approved OpenRouter commercial intelligence task registry.'),
('angelcare-internal','revenue.external_research_boundary','{"tavily_allowed":false,"research_mission_required":true,"owner":"UMZ2"}'::jsonb,'Tavily is never called silently by ordinary CRM or Revenue operations.'),
('angelcare-internal','revenue.document_immutability','{"quotation":true,"delivery_note":true,"invoice":true,"credit_note":true}'::jsonb,'Issued documents are never destructively edited.')
on conflict(tenant_key,setting_key) do update set setting_value=excluded.setting_value,description=excluded.description,updated_at=now();

insert into flashcards_os.permission_catalogue(tenant_key,permission_key,label,domain,risk_level,description) values
('angelcare-internal','flashcards_os.view_revenue','Voir Revenue','revenue','medium','Accès au command bridge Revenue.'),
('angelcare-internal','flashcards_os.view_b2c_crm','Voir CRM B2C','revenue','medium','Accès foyers, guardians et learners.'),
('angelcare-internal','flashcards_os.manage_b2c_households','Gérer foyers B2C','revenue','high','Créer et mettre à jour les foyers.'),
('angelcare-internal','flashcards_os.manage_learners','Gérer learners','revenue','high','Créer et structurer les learners.'),
('angelcare-internal','flashcards_os.view_sensitive_learner_data','Voir données learner sensibles','revenue','critical','Accès restreint au Learner Needs Studio.'),
('angelcare-internal','flashcards_os.manage_b2c_opportunities','Gérer opportunités B2C','revenue','high','Pipeline familial.'),
('angelcare-internal','flashcards_os.view_b2b_crm','Voir CRM B2B','revenue','medium','Accès comptes institutionnels.'),
('angelcare-internal','flashcards_os.manage_b2b_accounts','Gérer comptes B2B','revenue','high','Créer et modifier les comptes.'),
('angelcare-internal','flashcards_os.manage_b2b_sites','Gérer sites B2B','revenue','high','Sites, capacités et contraintes.'),
('angelcare-internal','flashcards_os.manage_b2b_stakeholders','Gérer stakeholders B2B','revenue','high','Influence et décision.'),
('angelcare-internal','flashcards_os.manage_b2b_opportunities','Gérer opportunités B2B','revenue','high','Pipeline institutionnel.'),
('angelcare-internal','flashcards_os.manage_crm_activities','Gérer activités CRM','revenue','medium','Activités, tâches et timeline.'),
('angelcare-internal','flashcards_os.run_commercial_intelligence','Exécuter intelligence commerciale','revenue','high','OpenRouter advisory only.'),
('angelcare-internal','flashcards_os.create_quotations','Créer devis','revenue','high','Créer et recalculer les devis.'),
('angelcare-internal','flashcards_os.approve_quotations','Approuver devis','revenue','critical','Autorité remises, marges et exceptions.'),
('angelcare-internal','flashcards_os.issue_quotations','Émettre devis','revenue','critical','Émission et verrouillage du devis.'),
('angelcare-internal','flashcards_os.confirm_quotations','Confirmer décision devis','revenue','critical','Acceptation client et commande interne.'),
('angelcare-internal','flashcards_os.manage_sales_orders','Gérer commandes','revenue','high','Obligations et quantités.'),
('angelcare-internal','flashcards_os.create_delivery_notes','Créer bons de livraison','revenue','high','Sélection de lignes et quantités.'),
('angelcare-internal','flashcards_os.issue_delivery_notes','Émettre bons de livraison','revenue','critical','Verrouillage et éligibilité facture.'),
('angelcare-internal','flashcards_os.create_invoices','Créer factures','revenue','high','Facturation depuis sources livrées.'),
('angelcare-internal','flashcards_os.approve_invoices','Approuver factures','revenue','critical','Contrôle avant émission.'),
('angelcare-internal','flashcards_os.issue_invoices','Émettre factures','revenue','critical','Émission immutable.'),
('angelcare-internal','flashcards_os.create_credit_notes','Créer avoirs','revenue','critical','Corrections liées aux factures.'),
('angelcare-internal','flashcards_os.approve_credit_notes','Approuver avoirs','revenue','critical','Autorité Finance.'),
('angelcare-internal','flashcards_os.record_payments','Enregistrer paiements','revenue','critical','Écriture de paiement.'),
('angelcare-internal','flashcards_os.allocate_payments','Allouer paiements','revenue','critical','Allocation aux factures.'),
('angelcare-internal','flashcards_os.view_receivables','Voir encours','revenue','high','Soldes et ageing.'),
('angelcare-internal','flashcards_os.override_discount','Override remise','revenue','critical','Exception avec justification.'),
('angelcare-internal','flashcards_os.override_margin','Override marge','revenue','critical','Exception avec justification.'),
('angelcare-internal','flashcards_os.manage_document_settings','Gérer paramètres documents','revenue','critical','Numérotation, templates et règles.'),
('angelcare-internal','flashcards_os.audit_revenue','Auditer Revenue','revenue','high','Lignée CRM et financière.'),
('angelcare-internal','flashcards_os.admin_revenue','Administrer Revenue','revenue','critical','Autorité UMZ5 complète.')
on conflict(permission_key) do update set label=excluded.label,domain=excluded.domain,risk_level=excluded.risk_level,description=excluded.description;


-- Verification result for manual SQL Editor execution.
select
 to_regclass('flashcards_os.b2c_households') as b2c_households,
 to_regclass('flashcards_os.b2b_accounts') as b2b_accounts,
 to_regclass('flashcards_os.opportunities') as opportunities,
 to_regclass('flashcards_os.quotations') as quotations,
 to_regclass('flashcards_os.sales_orders') as sales_orders,
 to_regclass('flashcards_os.delivery_notes') as delivery_notes,
 to_regclass('flashcards_os.invoices') as invoices,
 to_regclass('flashcards_os.payments') as payments;
commit;
