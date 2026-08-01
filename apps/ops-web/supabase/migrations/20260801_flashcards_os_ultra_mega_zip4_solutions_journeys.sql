-- ANGELCARE Flashcards OS — Ultra Mega ZIP 4
-- Solution Engineering, Deterministic Pricing Intelligence and Learning Journey Command.
-- One additive consolidated migration. Requires UMZ1 + UMZ2 + UMZ3.
begin;
create extension if not exists pgcrypto;
create schema if not exists flashcards_os;

do $$ begin
 if to_regclass('flashcards_os.product_releases') is null then
   raise exception 'UMZ3 baseline missing: flashcards_os.product_releases does not exist.';
 end if;
end $$;

alter table flashcards_os.product_releases add column if not exists commercial_status text not null default 'conditional';
alter table flashcards_os.product_releases add column if not exists commercial_metadata jsonb not null default '{}'::jsonb;
alter table flashcards_os.product_releases add column if not exists effective_from date null;
alter table flashcards_os.product_releases add column if not exists effective_until date null;
do $$ begin
 if not exists(select 1 from pg_constraint where conname='product_releases_commercial_status_check') then
  alter table flashcards_os.product_releases add constraint product_releases_commercial_status_check check(commercial_status in('eligible','conditional','ineligible'));
 end if;
end $$;

create table if not exists flashcards_os.solution_requests (
 id uuid primary key default gen_random_uuid(),
 tenant_key text not null default 'angelcare-internal',
 code text not null, title text not null, universe text not null check(universe in('b2c','b2b')), status text not null default 'draft', customer_segment text not null default '', learner_count integer not null default 1 check(learner_count>0), profile_snapshot jsonb not null default '{}'::jsonb, constraints_snapshot jsonb not null default '{}'::jsonb, requested_scenario_count integer not null default 1 check(requested_scenario_count between 1 and 10), priorities text[] not null default '{}', scenario_roles text[] not null default '{}', eligibility_run_id uuid null, generated_scenario_ids uuid[] not null default '{}', created_by text null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(tenant_key,code)
);

create table if not exists flashcards_os.solution_request_profiles (
 id uuid primary key default gen_random_uuid(),
 tenant_key text not null default 'angelcare-internal',
 request_id uuid not null references flashcards_os.solution_requests(id) on delete restrict, customer_segment text not null default '', learner_ages_months integer[] not null default '{}', learner_count integer not null default 1, languages text[] not null default '{}', individual_or_group text not null default 'individual' check(individual_or_group in('individual','group')), support_profiles text[] not null default '{}', created_at timestamptz not null default now()
);

create table if not exists flashcards_os.solution_constraints (
 id uuid primary key default gen_random_uuid(),
 tenant_key text not null default 'angelcare-internal',
 request_id uuid not null references flashcards_os.solution_requests(id) on delete restrict, constraints jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(),
 unique(tenant_key,request_id)
);

create table if not exists flashcards_os.solution_required_products (
 id uuid primary key default gen_random_uuid(),
 tenant_key text not null default 'angelcare-internal',
 request_id uuid not null references flashcards_os.solution_requests(id) on delete restrict, release_id uuid not null references flashcards_os.product_releases(id) on delete restrict, created_at timestamptz not null default now(),
 unique(tenant_key,request_id,release_id)
);

create table if not exists flashcards_os.solution_excluded_products (
 id uuid primary key default gen_random_uuid(),
 tenant_key text not null default 'angelcare-internal',
 request_id uuid not null references flashcards_os.solution_requests(id) on delete restrict, release_id uuid not null references flashcards_os.product_releases(id) on delete restrict, created_at timestamptz not null default now(),
 unique(tenant_key,request_id,release_id)
);

create table if not exists flashcards_os.solution_generation_runs (
 id uuid primary key default gen_random_uuid(),
 tenant_key text not null default 'angelcare-internal',
 request_id uuid not null references flashcards_os.solution_requests(id) on delete restrict, requested_count integer not null check(requested_count between 1 and 10), generated_count integer not null default 0 check(generated_count between 0 and 10), status text not null, model_requested text null, model_used text null, fallback_used boolean not null default false, prompt_tokens integer not null default 0, completion_tokens integer not null default 0, total_tokens integer not null default 0, cost_usd numeric(14,6) not null default 0, latency_ms integer not null default 0, created_at timestamptz not null default now()
);

create table if not exists flashcards_os.product_eligibility_rules (
 id uuid primary key default gen_random_uuid(),
 tenant_key text not null default 'angelcare-internal',
 rule_key text not null, label text not null, rule_group text not null, evaluation_order integer not null default 100, blocking boolean not null default true, configuration jsonb not null default '{}'::jsonb, status text not null default 'active', created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(tenant_key,rule_key)
);

create table if not exists flashcards_os.product_eligibility_results (
 id uuid primary key default gen_random_uuid(),
 tenant_key text not null default 'angelcare-internal',
 request_id uuid not null references flashcards_os.solution_requests(id) on delete restrict, run_id uuid not null, release_id uuid not null references flashcards_os.product_releases(id) on delete restrict, eligible boolean not null, score numeric(8,3) not null default 0, reasons text[] not null default '{}', warnings text[] not null default '{}', evaluated_at timestamptz not null default now(),
 unique(tenant_key,run_id,release_id)
);

create table if not exists flashcards_os.coverage_dimensions (
 id uuid primary key default gen_random_uuid(),
 tenant_key text not null default 'angelcare-internal',
 dimension_key text not null, label text not null, dimension_group text not null, weight numeric(8,4) not null default 1, status text not null default 'active', created_at timestamptz not null default now(),
 unique(tenant_key,dimension_key)
);

create table if not exists flashcards_os.coverage_mappings (
 id uuid primary key default gen_random_uuid(),
 tenant_key text not null default 'angelcare-internal',
 release_id uuid not null references flashcards_os.product_releases(id) on delete restrict, dimension_key text not null, coverage_key text not null, strength numeric(8,4) not null default 1, evidence jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(),
 unique(tenant_key,release_id,dimension_key,coverage_key)
);

create table if not exists flashcards_os.cost_books (
 id uuid primary key default gen_random_uuid(),
 tenant_key text not null default 'angelcare-internal',
 code text not null, label text not null, currency text not null default 'Dh', status text not null default 'draft', effective_from date not null, effective_until date null, created_by text null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(tenant_key,code)
);

create table if not exists flashcards_os.cost_book_entries (
 id uuid primary key default gen_random_uuid(),
 tenant_key text not null default 'angelcare-internal',
 cost_book_id uuid not null references flashcards_os.cost_books(id) on delete restrict, release_id uuid not null references flashcards_os.product_releases(id) on delete restrict, unit_cost_dh numeric(14,2) null check(unit_cost_dh is null or unit_cost_dh>=0), cost_components jsonb not null default '{}'::jsonb, status text not null default 'draft', effective_from date not null, effective_until date null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(tenant_key,cost_book_id,release_id,effective_from)
);

create table if not exists flashcards_os.price_books (
 id uuid primary key default gen_random_uuid(),
 tenant_key text not null default 'angelcare-internal',
 code text not null, label text not null, universe text not null check(universe in('b2c','b2b')), currency text not null default 'Dh', status text not null default 'draft', effective_from date not null, effective_until date null, created_by text null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(tenant_key,code)
);

create table if not exists flashcards_os.price_book_entries (
 id uuid primary key default gen_random_uuid(),
 tenant_key text not null default 'angelcare-internal',
 price_book_id uuid not null references flashcards_os.price_books(id) on delete restrict, release_id uuid not null references flashcards_os.product_releases(id) on delete restrict, unit_price_dh numeric(14,2) null check(unit_price_dh is null or unit_price_dh>=0), quantity_min integer not null default 1, quantity_max integer null, status text not null default 'active', effective_from date not null, effective_until date null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(tenant_key,price_book_id,release_id,quantity_min,effective_from)
);

create table if not exists flashcards_os.discount_rules (
 id uuid primary key default gen_random_uuid(),
 tenant_key text not null default 'angelcare-internal',
 rule_key text not null, universe text not null check(universe in('b2c','b2b','both')), label text not null, maximum_percent numeric(8,3) not null default 0 check(maximum_percent between 0 and 100), conditions jsonb not null default '{}'::jsonb, requires_approval boolean not null default true, status text not null default 'active', created_at timestamptz not null default now(),
 unique(tenant_key,rule_key)
);

create table if not exists flashcards_os.margin_rules (
 id uuid primary key default gen_random_uuid(),
 tenant_key text not null default 'angelcare-internal',
 rule_key text not null, universe text not null check(universe in('b2c','b2b')), label text not null, minimum_margin_percent numeric(8,3) not null check(minimum_margin_percent between -100 and 100), override_permission text not null default 'flashcards_os.override_margin_controls', status text not null default 'active', created_at timestamptz not null default now(),
 unique(tenant_key,rule_key)
);

create table if not exists flashcards_os.tax_profiles (
 id uuid primary key default gen_random_uuid(),
 tenant_key text not null default 'angelcare-internal',
 profile_key text not null, label text not null, tax_percent numeric(8,3) not null default 0 check(tax_percent between 0 and 100), treatment text not null default 'configuration_required', jurisdiction text not null default 'Morocco', finance_validation_required boolean not null default true, status text not null default 'draft', effective_from date not null, effective_until date null, created_at timestamptz not null default now(),
 unique(tenant_key,profile_key)
);

create table if not exists flashcards_os.commercial_calculations (
 id uuid primary key default gen_random_uuid(),
 tenant_key text not null default 'angelcare-internal',
 entity_type text not null, entity_id uuid not null, calculation jsonb not null, calculation_hash text not null, status text not null, created_at timestamptz not null default now()
);

create table if not exists flashcards_os.solution_scenarios (
 id uuid primary key default gen_random_uuid(),
 tenant_key text not null default 'angelcare-internal',
 code text not null, request_id uuid not null references flashcards_os.solution_requests(id) on delete restrict, version_no integer not null default 1, role text not null, status text not null default 'generated', name text not null, positioning text not null default '', coverage_score numeric(8,3) not null default 0, suitability_score numeric(8,3) not null default 0, diversity_score numeric(8,3) not null default 0, confidence_score numeric(8,3) not null default 0, commercial_calculation jsonb not null default '{}'::jsonb, snapshot jsonb not null default '{}'::jsonb, generation_run_id uuid null references flashcards_os.solution_generation_runs(id) on delete restrict, created_by text null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(tenant_key,code)
);

create table if not exists flashcards_os.solution_scenario_items (
 id uuid primary key default gen_random_uuid(),
 tenant_key text not null default 'angelcare-internal',
 scenario_id uuid not null references flashcards_os.solution_scenarios(id) on delete restrict, release_id uuid not null references flashcards_os.product_releases(id) on delete restrict, quantity integer not null default 1 check(quantity>0), format text not null, rationale text not null, locked boolean not null default false, sort_order integer not null default 1, created_at timestamptz not null default now(),
 unique(tenant_key,scenario_id,release_id)
);

create table if not exists flashcards_os.solution_scenario_scores (
 id uuid primary key default gen_random_uuid(),
 tenant_key text not null default 'angelcare-internal',
 scenario_id uuid not null references flashcards_os.solution_scenarios(id) on delete restrict, coverage_score numeric(8,3) not null default 0, suitability_score numeric(8,3) not null default 0, diversity_score numeric(8,3) not null default 0, confidence_score numeric(8,3) not null default 0, margin_score numeric(8,3) not null default 0, created_at timestamptz not null default now()
);

create table if not exists flashcards_os.solution_scenario_gaps (
 id uuid primary key default gen_random_uuid(),
 tenant_key text not null default 'angelcare-internal',
 scenario_id uuid not null references flashcards_os.solution_scenarios(id) on delete restrict, gap_type text not null, detail text not null, severity text not null default 'warning', created_at timestamptz not null default now()
);

create table if not exists flashcards_os.solution_scenario_decisions (
 id uuid primary key default gen_random_uuid(),
 tenant_key text not null default 'angelcare-internal',
 scenario_id uuid not null references flashcards_os.solution_scenarios(id) on delete restrict, decision text not null check(decision in('selected','rejected','merged','rework')), note text not null default '', actor_id text not null, actor_name text not null, actor_role text null, created_at timestamptz not null default now()
);

create table if not exists flashcards_os.b2c_sellables (
 id uuid primary key default gen_random_uuid(),
 tenant_key text not null default 'angelcare-internal',
 code text not null, scenario_id uuid not null references flashcards_os.solution_scenarios(id) on delete restrict, version_no integer not null default 1, status text not null default 'draft', name text not null, promise text not null default '', target_segment text not null default '', ready_plan_id uuid null, release_ids uuid[] not null default '{}', price_dh numeric(14,2) not null default 0, gross_margin_percent numeric(8,3) not null default 0, minimum_order integer not null default 1, snapshot jsonb not null default '{}'::jsonb, created_by text null, approved_by text null, approved_at timestamptz null, approval_note text null, published_at timestamptz null, suspension_reason text null, effective_from date null, effective_until date null, supersedes_id uuid null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(tenant_key,code), unique(tenant_key,scenario_id,version_no)
);

create table if not exists flashcards_os.b2b_sellables (
 id uuid primary key default gen_random_uuid(),
 tenant_key text not null default 'angelcare-internal',
 code text not null, scenario_id uuid not null references flashcards_os.solution_scenarios(id) on delete restrict, version_no integer not null default 1, status text not null default 'draft', name text not null, promise text not null default '', target_segment text not null default '', ready_plan_id uuid null, release_ids uuid[] not null default '{}', price_dh numeric(14,2) not null default 0, gross_margin_percent numeric(8,3) not null default 0, minimum_order integer not null default 1, snapshot jsonb not null default '{}'::jsonb, created_by text null, approved_by text null, approved_at timestamptz null, approval_note text null, published_at timestamptz null, suspension_reason text null, effective_from date null, effective_until date null, supersedes_id uuid null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(tenant_key,code), unique(tenant_key,scenario_id,version_no)
);

create table if not exists flashcards_os.b2c_sellable_versions (
 id uuid primary key default gen_random_uuid(),
 tenant_key text not null default 'angelcare-internal',
 sellable_id uuid not null references flashcards_os.b2c_sellables(id) on delete restrict, version_no integer not null, snapshot jsonb not null, commercial_calculation jsonb not null default '{}'::jsonb, change_note text null, created_by text null, created_at timestamptz not null default now(),
 unique(tenant_key,sellable_id,version_no)
);

create table if not exists flashcards_os.b2b_sellable_versions (
 id uuid primary key default gen_random_uuid(),
 tenant_key text not null default 'angelcare-internal',
 sellable_id uuid not null references flashcards_os.b2b_sellables(id) on delete restrict, version_no integer not null, snapshot jsonb not null, commercial_calculation jsonb not null default '{}'::jsonb, change_note text null, created_by text null, created_at timestamptz not null default now(),
 unique(tenant_key,sellable_id,version_no)
);

create table if not exists flashcards_os.b2c_sellable_items (
 id uuid primary key default gen_random_uuid(),
 tenant_key text not null default 'angelcare-internal',
 sellable_id uuid not null references flashcards_os.b2c_sellables(id) on delete restrict, release_id uuid not null references flashcards_os.product_releases(id) on delete restrict, quantity integer not null default 1, format text not null, sort_order integer not null default 1, created_at timestamptz not null default now(),
 unique(tenant_key,sellable_id,release_id)
);

create table if not exists flashcards_os.b2b_sellable_items (
 id uuid primary key default gen_random_uuid(),
 tenant_key text not null default 'angelcare-internal',
 sellable_id uuid not null references flashcards_os.b2b_sellables(id) on delete restrict, release_id uuid not null references flashcards_os.product_releases(id) on delete restrict, quantity integer not null default 1, format text not null, sort_order integer not null default 1, created_at timestamptz not null default now(),
 unique(tenant_key,sellable_id,release_id)
);

create table if not exists flashcards_os.sellable_approvals (
 id uuid primary key default gen_random_uuid(),
 tenant_key text not null default 'angelcare-internal',
 universe text not null check(universe in('b2c','b2b')), sellable_id uuid not null, stage text not null, decision text not null, approver_id text not null, approver_name text not null, approver_role text null, note text not null default '', created_at timestamptz not null default now()
);

create table if not exists flashcards_os.sellable_publication_events (
 id uuid primary key default gen_random_uuid(),
 tenant_key text not null default 'angelcare-internal',
 universe text not null check(universe in('b2c','b2b')), sellable_id uuid not null, event_type text not null, actor_id text not null, actor_name text not null, detail text null, created_at timestamptz not null default now()
);

create table if not exists flashcards_os.learner_profile_options (
 id uuid primary key default gen_random_uuid(),
 tenant_key text not null default 'angelcare-internal',
 option_key text not null, label text not null, family text not null default '', description text not null default '', age_min_months integer null, age_max_months integer null, applicable_contexts text[] not null default '{}', status text not null default 'active', sort_order integer not null default 100, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(tenant_key,option_key)
);

create table if not exists flashcards_os.usage_context_options (
 id uuid primary key default gen_random_uuid(),
 tenant_key text not null default 'angelcare-internal',
 option_key text not null, label text not null, family text not null default '', description text not null default '', age_min_months integer null, age_max_months integer null, applicable_contexts text[] not null default '{}', status text not null default 'active', sort_order integer not null default 100, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(tenant_key,option_key)
);

create table if not exists flashcards_os.pain_point_options (
 id uuid primary key default gen_random_uuid(),
 tenant_key text not null default 'angelcare-internal',
 option_key text not null, label text not null, family text not null default '', description text not null default '', age_min_months integer null, age_max_months integer null, applicable_contexts text[] not null default '{}', status text not null default 'active', sort_order integer not null default 100, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(tenant_key,option_key)
);

create table if not exists flashcards_os.capability_objectives (
 id uuid primary key default gen_random_uuid(),
 tenant_key text not null default 'angelcare-internal',
 objective_key text not null, label text not null, family text not null default '', description text not null default '', age_min_months integer null, age_max_months integer null, applicable_contexts text[] not null default '{}', status text not null default 'active', sort_order integer not null default 100, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(tenant_key,objective_key)
);

create table if not exists flashcards_os.desired_outcome_options (
 id uuid primary key default gen_random_uuid(),
 tenant_key text not null default 'angelcare-internal',
 outcome_key text not null, label text not null, family text not null default '', description text not null default '', age_min_months integer null, age_max_months integer null, applicable_contexts text[] not null default '{}', measurable_template text null, status text not null default 'active', sort_order integer not null default 100, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(tenant_key,outcome_key)
);

create table if not exists flashcards_os.objective_relationships (
 id uuid primary key default gen_random_uuid(),
 tenant_key text not null default 'angelcare-internal',
 source_kind text not null, source_key text not null, target_kind text not null, target_key text not null, relationship text not null, strength numeric(8,4) not null default 1, created_at timestamptz not null default now(),
 unique(tenant_key,source_kind,source_key,target_kind,target_key,relationship)
);

create table if not exists flashcards_os.journey_requests (
 id uuid primary key default gen_random_uuid(),
 tenant_key text not null default 'angelcare-internal',
 code text not null, title text not null, universe text not null check(universe in('b2c','b2b')), status text not null default 'draft', learner_profile_keys text[] not null default '{}', usage_context_keys text[] not null default '{}', pain_point_keys text[] not null default '{}', capability_objective_keys text[] not null default '{}', desired_outcome_keys text[] not null default '{}', primary_objective_key text not null, secondary_objective_keys text[] not null default '{}', duration_days integer not null check(duration_days between 1 and 90), sessions_per_day integer not null check(sessions_per_day between 1 and 5), minutes_per_session integer not null check(minutes_per_session between 5 and 120), intensity text not null check(intensity in('light','medium','intensive')), individual_or_group text not null check(individual_or_group in('individual','group')), facilitator_type text not null default '', parent_involvement text not null default '', teacher_involvement text not null default '', delivery_mode text not null check(delivery_mode in('physical','digital','hybrid')), available_release_ids uuid[] not null default '{}', required_release_ids uuid[] not null default '{}', excluded_release_ids uuid[] not null default '{}', maximum_collections integer not null default 4 check(maximum_collections between 1 and 12), budget_max_dh numeric(14,2) not null default 0, repetition_rhythm text not null default '', assessment_rhythm text not null default '', adaptation_keys text[] not null default '{}', requested_plan_count integer not null default 1 check(requested_plan_count between 1 and 10), created_by text null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(tenant_key,code)
);

create table if not exists flashcards_os.journey_request_dimensions (
 id uuid primary key default gen_random_uuid(),
 tenant_key text not null default 'angelcare-internal',
 request_id uuid not null references flashcards_os.journey_requests(id) on delete restrict, dimension_kind text not null, selected_keys text[] not null default '{}', created_at timestamptz not null default now(),
 unique(tenant_key,request_id,dimension_kind)
);

create table if not exists flashcards_os.journey_generation_runs (
 id uuid primary key default gen_random_uuid(),
 tenant_key text not null default 'angelcare-internal',
 request_id uuid not null references flashcards_os.journey_requests(id) on delete restrict, requested_count integer not null check(requested_count between 1 and 10), generated_count integer not null default 0 check(generated_count between 0 and 10), status text not null, model_requested text null, model_used text null, fallback_used boolean not null default false, prompt_tokens integer not null default 0, completion_tokens integer not null default 0, total_tokens integer not null default 0, cost_usd numeric(14,6) not null default 0, latency_ms integer not null default 0, created_at timestamptz not null default now()
);

create table if not exists flashcards_os.journey_scenarios (
 id uuid primary key default gen_random_uuid(),
 tenant_key text not null default 'angelcare-internal',
 code text not null, request_id uuid not null references flashcards_os.journey_requests(id) on delete restrict, version_no integer not null default 1, status text not null default 'generated', name text not null, commercial_calculation jsonb not null default '{}'::jsonb, snapshot jsonb not null default '{}'::jsonb, generation_run_id uuid null references flashcards_os.journey_generation_runs(id) on delete restrict, created_by text null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(tenant_key,code)
);

create table if not exists flashcards_os.journey_days (
 id uuid primary key default gen_random_uuid(),
 tenant_key text not null default 'angelcare-internal',
 scenario_id uuid not null references flashcards_os.journey_scenarios(id) on delete restrict, day_number integer not null check(day_number>0), title text not null, objective_keys text[] not null default '{}', target_concepts text[] not null default '{}', observation text not null default '', home_continuation text not null default '', created_at timestamptz not null default now(),
 unique(tenant_key,scenario_id,day_number)
);

create table if not exists flashcards_os.journey_sessions (
 id uuid primary key default gen_random_uuid(),
 tenant_key text not null default 'angelcare-internal',
 scenario_id uuid not null references flashcards_os.journey_scenarios(id) on delete restrict, day_id uuid not null references flashcards_os.journey_days(id) on delete restrict, day_number integer not null, session_number integer not null, title text not null, duration_minutes integer not null check(duration_minutes between 5 and 120), objective_keys text[] not null default '{}', facilitator_script text not null default '', learner_response_expected text not null default '', adjustment_rule text not null default '', created_at timestamptz not null default now(),
 unique(tenant_key,scenario_id,day_number,session_number)
);

create table if not exists flashcards_os.journey_activities (
 id uuid primary key default gen_random_uuid(),
 tenant_key text not null default 'angelcare-internal',
 scenario_id uuid not null references flashcards_os.journey_scenarios(id) on delete restrict, session_id uuid not null references flashcards_os.journey_sessions(id) on delete restrict, order_no integer not null, activity_kind text not null, title text not null, instruction text not null, duration_minutes integer not null check(duration_minutes>=0), release_id uuid null references flashcards_os.product_releases(id) on delete restrict, card_group_reference text null, objective_keys text[] not null default '{}', success_indicator text not null default '', created_at timestamptz not null default now()
);

create table if not exists flashcards_os.journey_collection_links (
 id uuid primary key default gen_random_uuid(),
 tenant_key text not null default 'angelcare-internal',
 scenario_id uuid not null references flashcards_os.journey_scenarios(id) on delete restrict, release_id uuid not null references flashcards_os.product_releases(id) on delete restrict, created_at timestamptz not null default now(),
 unique(tenant_key,scenario_id,release_id)
);

create table if not exists flashcards_os.journey_card_group_links (
 id uuid primary key default gen_random_uuid(),
 tenant_key text not null default 'angelcare-internal',
 scenario_id uuid not null references flashcards_os.journey_scenarios(id) on delete restrict, session_id uuid null references flashcards_os.journey_sessions(id) on delete restrict, release_id uuid not null references flashcards_os.product_releases(id) on delete restrict, card_group_reference text not null, objective_keys text[] not null default '{}', repetition_count integer not null default 1, created_at timestamptz not null default now()
);

create table if not exists flashcards_os.journey_assessments (
 id uuid primary key default gen_random_uuid(),
 tenant_key text not null default 'angelcare-internal',
 scenario_id uuid not null references flashcards_os.journey_scenarios(id) on delete restrict, assessment_type text not null, instruction text not null, mastery_criteria text null, created_at timestamptz not null default now()
);

create table if not exists flashcards_os.journey_adaptations (
 id uuid primary key default gen_random_uuid(),
 tenant_key text not null default 'angelcare-internal',
 scenario_id uuid not null references flashcards_os.journey_scenarios(id) on delete restrict, adaptation_key text not null, title text not null, instruction text not null, created_at timestamptz not null default now(),
 unique(tenant_key,scenario_id,adaptation_key)
);

create table if not exists flashcards_os.journey_approvals (
 id uuid primary key default gen_random_uuid(),
 tenant_key text not null default 'angelcare-internal',
 scenario_id uuid not null references flashcards_os.journey_scenarios(id) on delete restrict, stage text not null, decision text not null, approver_id text not null, approver_name text not null, approver_role text null, note text not null default '', created_at timestamptz not null default now()
);

create table if not exists flashcards_os.ready_learning_plans (
 id uuid primary key default gen_random_uuid(),
 tenant_key text not null default 'angelcare-internal',
 code text not null, universe text not null check(universe in('b2c','b2b')), version_no integer not null default 1, status text not null default 'draft', name text not null, scenario_id uuid not null references flashcards_os.journey_scenarios(id) on delete restrict, learner_profile text not null default '', objectives text[] not null default '{}', release_ids uuid[] not null default '{}', duration_days integer not null default 1, total_sessions integer not null default 1, total_minutes integer not null default 0, price_dh numeric(14,2) not null default 0, gross_margin_percent numeric(8,3) not null default 0, created_by text null, approved_by text null, approved_at timestamptz null, approval_note text null, published_at timestamptz null, supersedes_id uuid null references flashcards_os.ready_learning_plans(id) on delete restrict, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(tenant_key,code)
);

create table if not exists flashcards_os.ready_learning_plan_versions (
 id uuid primary key default gen_random_uuid(),
 tenant_key text not null default 'angelcare-internal',
 plan_id uuid not null references flashcards_os.ready_learning_plans(id) on delete restrict, version_no integer not null, snapshot jsonb not null, commercial_calculation jsonb not null default '{}'::jsonb, change_note text null, created_by text null, created_at timestamptz not null default now(),
 unique(tenant_key,plan_id,version_no)
);

create table if not exists flashcards_os.ready_learning_plan_items (
 id uuid primary key default gen_random_uuid(),
 tenant_key text not null default 'angelcare-internal',
 plan_id uuid not null references flashcards_os.ready_learning_plans(id) on delete restrict, release_id uuid not null references flashcards_os.product_releases(id) on delete restrict, quantity integer not null default 1, format text not null default 'physical', sort_order integer not null default 1, created_at timestamptz not null default now(),
 unique(tenant_key,plan_id,release_id)
);

create table if not exists flashcards_os.ontology_change_events (
 id uuid primary key default gen_random_uuid(),
 tenant_key text not null default 'angelcare-internal',
 ontology_kind text not null, option_id uuid not null, event_type text not null, actor_id text not null, actor_name text not null, previous_value jsonb null, new_value jsonb null, created_at timestamptz not null default now()
);

do $$ declare t text; begin foreach t in array array['solution_requests','product_eligibility_rules','cost_books','cost_book_entries','price_books','price_book_entries','solution_scenarios','b2c_sellables','b2b_sellables','learner_profile_options','usage_context_options','pain_point_options','capability_objectives','desired_outcome_options','journey_requests','journey_scenarios','ready_learning_plans'] loop execute format('drop trigger if exists trg_fc_%I_updated_at on flashcards_os.%I',t,t); execute format('create trigger trg_fc_%I_updated_at before update on flashcards_os.%I for each row execute function flashcards_os.touch_updated_at()',t,t); end loop; end $$;

create or replace function flashcards_os.guard_published_solution_mutation() returns trigger language plpgsql as $$
begin
 if old.status='published' and (new.scenario_id<>old.scenario_id or new.release_ids<>old.release_ids or new.price_dh<>old.price_dh or new.snapshot<>old.snapshot) then
  raise exception 'Published sellables are immutable; create a new version.';
 end if;
 return new;
end $$;
drop trigger if exists trg_fc_b2c_sellable_immutable on flashcards_os.b2c_sellables;
create trigger trg_fc_b2c_sellable_immutable before update on flashcards_os.b2c_sellables for each row execute function flashcards_os.guard_published_solution_mutation();
drop trigger if exists trg_fc_b2b_sellable_immutable on flashcards_os.b2b_sellables;
create trigger trg_fc_b2b_sellable_immutable before update on flashcards_os.b2b_sellables for each row execute function flashcards_os.guard_published_solution_mutation();

create or replace function flashcards_os.guard_published_plan_mutation() returns trigger language plpgsql as $$
begin
 if old.status='published' and (new.scenario_id<>old.scenario_id or new.release_ids<>old.release_ids or new.price_dh<>old.price_dh or new.objectives<>old.objectives) then
  raise exception 'Published learning plans are immutable; create a new version.';
 end if;
 return new;
end $$;
drop trigger if exists trg_fc_ready_plan_immutable on flashcards_os.ready_learning_plans;
create trigger trg_fc_ready_plan_immutable before update on flashcards_os.ready_learning_plans for each row execute function flashcards_os.guard_published_plan_mutation();

do $$ declare t text; begin foreach t in array array['solution_requests','solution_request_profiles','solution_constraints','solution_required_products','solution_excluded_products','solution_generation_runs','product_eligibility_rules','product_eligibility_results','coverage_dimensions','coverage_mappings','cost_books','cost_book_entries','price_books','price_book_entries','discount_rules','margin_rules','tax_profiles','commercial_calculations','solution_scenarios','solution_scenario_items','solution_scenario_scores','solution_scenario_gaps','solution_scenario_decisions','b2c_sellables','b2c_sellable_versions','b2c_sellable_items','b2b_sellables','b2b_sellable_versions','b2b_sellable_items','sellable_approvals','sellable_publication_events','learner_profile_options','usage_context_options','pain_point_options','capability_objectives','desired_outcome_options','objective_relationships','journey_requests','journey_request_dimensions','journey_generation_runs','journey_scenarios','journey_days','journey_sessions','journey_activities','journey_collection_links','journey_card_group_links','journey_assessments','journey_adaptations','journey_approvals','ready_learning_plans','ready_learning_plan_versions','ready_learning_plan_items','ontology_change_events'] loop execute format('alter table flashcards_os.%I enable row level security',t); execute format('drop policy if exists tenant_read on flashcards_os.%I',t); execute format('create policy tenant_read on flashcards_os.%I for select to authenticated using (tenant_key=coalesce(auth.jwt()->>''tenant_key'',''''))',t); end loop; end $$;
create or replace view public.fc_os_solution_requests as select * from flashcards_os.solution_requests;
create or replace view public.fc_os_solution_request_profiles as select * from flashcards_os.solution_request_profiles;
create or replace view public.fc_os_solution_constraints as select * from flashcards_os.solution_constraints;
create or replace view public.fc_os_solution_required_products as select * from flashcards_os.solution_required_products;
create or replace view public.fc_os_solution_excluded_products as select * from flashcards_os.solution_excluded_products;
create or replace view public.fc_os_solution_generation_runs as select * from flashcards_os.solution_generation_runs;
create or replace view public.fc_os_product_eligibility_rules as select * from flashcards_os.product_eligibility_rules;
create or replace view public.fc_os_product_eligibility_results as select * from flashcards_os.product_eligibility_results;
create or replace view public.fc_os_coverage_dimensions as select * from flashcards_os.coverage_dimensions;
create or replace view public.fc_os_coverage_mappings as select * from flashcards_os.coverage_mappings;
create or replace view public.fc_os_cost_books as select * from flashcards_os.cost_books;
create or replace view public.fc_os_cost_book_entries as select * from flashcards_os.cost_book_entries;
create or replace view public.fc_os_price_books as select * from flashcards_os.price_books;
create or replace view public.fc_os_price_book_entries as select * from flashcards_os.price_book_entries;
create or replace view public.fc_os_discount_rules as select * from flashcards_os.discount_rules;
create or replace view public.fc_os_margin_rules as select * from flashcards_os.margin_rules;
create or replace view public.fc_os_tax_profiles as select * from flashcards_os.tax_profiles;
create or replace view public.fc_os_commercial_calculations as select * from flashcards_os.commercial_calculations;
create or replace view public.fc_os_solution_scenarios as select * from flashcards_os.solution_scenarios;
create or replace view public.fc_os_solution_scenario_items as select * from flashcards_os.solution_scenario_items;
create or replace view public.fc_os_solution_scenario_scores as select * from flashcards_os.solution_scenario_scores;
create or replace view public.fc_os_solution_scenario_gaps as select * from flashcards_os.solution_scenario_gaps;
create or replace view public.fc_os_solution_scenario_decisions as select * from flashcards_os.solution_scenario_decisions;
create or replace view public.fc_os_b2c_sellables as select * from flashcards_os.b2c_sellables;
create or replace view public.fc_os_b2c_sellable_versions as select * from flashcards_os.b2c_sellable_versions;
create or replace view public.fc_os_b2c_sellable_items as select * from flashcards_os.b2c_sellable_items;
create or replace view public.fc_os_b2b_sellables as select * from flashcards_os.b2b_sellables;
create or replace view public.fc_os_b2b_sellable_versions as select * from flashcards_os.b2b_sellable_versions;
create or replace view public.fc_os_b2b_sellable_items as select * from flashcards_os.b2b_sellable_items;
create or replace view public.fc_os_sellable_approvals as select * from flashcards_os.sellable_approvals;
create or replace view public.fc_os_sellable_publication_events as select * from flashcards_os.sellable_publication_events;
create or replace view public.fc_os_learner_profile_options as select * from flashcards_os.learner_profile_options;
create or replace view public.fc_os_usage_context_options as select * from flashcards_os.usage_context_options;
create or replace view public.fc_os_pain_point_options as select * from flashcards_os.pain_point_options;
create or replace view public.fc_os_capability_objectives as select * from flashcards_os.capability_objectives;
create or replace view public.fc_os_desired_outcome_options as select * from flashcards_os.desired_outcome_options;
create or replace view public.fc_os_objective_relationships as select * from flashcards_os.objective_relationships;
create or replace view public.fc_os_journey_requests as select * from flashcards_os.journey_requests;
create or replace view public.fc_os_journey_request_dimensions as select * from flashcards_os.journey_request_dimensions;
create or replace view public.fc_os_journey_generation_runs as select * from flashcards_os.journey_generation_runs;
create or replace view public.fc_os_journey_scenarios as select * from flashcards_os.journey_scenarios;
create or replace view public.fc_os_journey_days as select * from flashcards_os.journey_days;
create or replace view public.fc_os_journey_sessions as select * from flashcards_os.journey_sessions;
create or replace view public.fc_os_journey_activities as select * from flashcards_os.journey_activities;
create or replace view public.fc_os_journey_collection_links as select * from flashcards_os.journey_collection_links;
create or replace view public.fc_os_journey_card_group_links as select * from flashcards_os.journey_card_group_links;
create or replace view public.fc_os_journey_assessments as select * from flashcards_os.journey_assessments;
create or replace view public.fc_os_journey_adaptations as select * from flashcards_os.journey_adaptations;
create or replace view public.fc_os_journey_approvals as select * from flashcards_os.journey_approvals;
create or replace view public.fc_os_ready_learning_plans as select * from flashcards_os.ready_learning_plans;
create or replace view public.fc_os_ready_learning_plan_versions as select * from flashcards_os.ready_learning_plan_versions;
create or replace view public.fc_os_ready_learning_plan_items as select * from flashcards_os.ready_learning_plan_items;
create or replace view public.fc_os_ontology_change_events as select * from flashcards_os.ontology_change_events;
drop view if exists public.fc_os_product_releases;
create or replace view public.fc_os_product_releases as select r.*, coalesce(c.code,'') collection_code, coalesce(c.name,'Collection') collection_name from flashcards_os.product_releases r left join flashcards_os.collections c on c.id=r.collection_id;
do $$ declare v text; begin foreach v in array array['solution_requests','solution_request_profiles','solution_constraints','solution_required_products','solution_excluded_products','solution_generation_runs','product_eligibility_rules','product_eligibility_results','coverage_dimensions','coverage_mappings','cost_books','cost_book_entries','price_books','price_book_entries','discount_rules','margin_rules','tax_profiles','commercial_calculations','solution_scenarios','solution_scenario_items','solution_scenario_scores','solution_scenario_gaps','solution_scenario_decisions','b2c_sellables','b2c_sellable_versions','b2c_sellable_items','b2b_sellables','b2b_sellable_versions','b2b_sellable_items','sellable_approvals','sellable_publication_events','learner_profile_options','usage_context_options','pain_point_options','capability_objectives','desired_outcome_options','objective_relationships','journey_requests','journey_request_dimensions','journey_generation_runs','journey_scenarios','journey_days','journey_sessions','journey_activities','journey_collection_links','journey_card_group_links','journey_assessments','journey_adaptations','journey_approvals','ready_learning_plans','ready_learning_plan_versions','ready_learning_plan_items','ontology_change_events'] loop execute format('revoke all on public.fc_os_%I from authenticated, anon',v); execute format('grant all on public.fc_os_%I to service_role',v); end loop; revoke all on public.fc_os_product_releases from authenticated, anon; grant all on public.fc_os_product_releases to service_role; end $$;

create index if not exists idx_fc_solution_requests_status on flashcards_os.solution_requests(tenant_key,status,universe);
create index if not exists idx_fc_solution_scenarios_request on flashcards_os.solution_scenarios(tenant_key,request_id,status);
create index if not exists idx_fc_eligibility_request on flashcards_os.product_eligibility_results(tenant_key,request_id,eligible);
create index if not exists idx_fc_price_entries_release on flashcards_os.price_book_entries(tenant_key,release_id,status);
create index if not exists idx_fc_cost_entries_release on flashcards_os.cost_book_entries(tenant_key,release_id,status);
create index if not exists idx_fc_journey_requests_status on flashcards_os.journey_requests(tenant_key,status,universe);
create index if not exists idx_fc_journey_scenarios_request on flashcards_os.journey_scenarios(tenant_key,request_id,status);
create index if not exists idx_fc_ready_plans_status on flashcards_os.ready_learning_plans(tenant_key,universe,status);

insert into flashcards_os.product_eligibility_rules(tenant_key,rule_key,label,rule_group,evaluation_order,blocking,configuration,status) values
('angelcare-internal','approved-release','Release approuvée et publiable','release',10,true,'{"allowedStatuses":["released","commercially_active"]}'::jsonb,'active'),
('angelcare-internal','commercial-status','Statut commercial éligible','release',20,true,'{"allowed":["eligible","conditional"]}'::jsonb,'active'),
('angelcare-internal','market-fit','Marché B2C/B2B autorisé','market',30,true,'{}'::jsonb,'active'),
('angelcare-internal','age-fit','Compatibilité âge','audience',40,true,'{}'::jsonb,'active'),
('angelcare-internal','language-fit','Compatibilité langue','audience',50,true,'{}'::jsonb,'active'),
('angelcare-internal','format-fit','Format livré et disponible','format',60,true,'{}'::jsonb,'active'),
('angelcare-internal','price-required','Prix applicable requis','commercial',70,true,'{}'::jsonb,'active'),
('angelcare-internal','cost-required-for-publication','Coût requis pour validation marge','commercial',80,true,'{}'::jsonb,'active'),
('angelcare-internal','quality-clear','Aucun blocker qualité','quality',90,true,'{}'::jsonb,'active'),
('angelcare-internal','lead-time-fit','Délai compatible','fulfilment',100,true,'{}'::jsonb,'active')
on conflict(tenant_key,rule_key) do update set label=excluded.label,configuration=excluded.configuration,status='active',updated_at=now();

insert into flashcards_os.coverage_dimensions(tenant_key,dimension_key,label,dimension_group,weight,status) values
('angelcare-internal','age','Âge et développement','learner',1,'active'),('angelcare-internal','language','Langue','learner',1,'active'),('angelcare-internal','context','Contexte d’usage','use_case',1,'active'),('angelcare-internal','pain_point','Pain points','need',1.2,'active'),('angelcare-internal','objective','Objectifs','learning',1.4,'active'),('angelcare-internal','outcome','Résultats mesurables','learning',1.4,'active'),('angelcare-internal','format','Format','delivery',0.8,'active')
on conflict(tenant_key,dimension_key) do update set weight=excluded.weight,status='active';

insert into flashcards_os.cost_books(tenant_key,code,label,currency,status,effective_from,created_by) values('angelcare-internal','COST-BASELINE','Référentiel coûts — validation finance requise','Dh','draft',current_date,'UMZ4 migration') on conflict(tenant_key,code) do nothing;
insert into flashcards_os.price_books(tenant_key,code,label,universe,currency,status,effective_from,created_by) values
('angelcare-internal','PRICE-B2C-BASELINE','Tarifs B2C — héritage catalogue à valider','b2c','Dh','draft',current_date,'UMZ4 migration'),
('angelcare-internal','PRICE-B2B-BASELINE','Tarifs B2B — construction commerciale','b2b','Dh','draft',current_date,'UMZ4 migration') on conflict(tenant_key,code) do nothing;
insert into flashcards_os.margin_rules(tenant_key,rule_key,universe,label,minimum_margin_percent,status) values
('angelcare-internal','margin-b2c-standard','b2c','Marge minimale B2C',40,'active'),('angelcare-internal','margin-b2b-standard','b2b','Marge minimale B2B',30,'active') on conflict(tenant_key,rule_key) do update set minimum_margin_percent=excluded.minimum_margin_percent,status='active';
insert into flashcards_os.discount_rules(tenant_key,rule_key,universe,label,maximum_percent,conditions,requires_approval,status) values
('angelcare-internal','discount-b2c-controlled','b2c','Remise B2C contrôlée',15,'{}'::jsonb,true,'active'),('angelcare-internal','discount-b2b-controlled','b2b','Remise B2B contrôlée',25,'{}'::jsonb,true,'active') on conflict(tenant_key,rule_key) do update set maximum_percent=excluded.maximum_percent,status='active';
insert into flashcards_os.tax_profiles(tenant_key,profile_key,label,tax_percent,treatment,jurisdiction,finance_validation_required,status,effective_from) values('angelcare-internal','tax-configurable-ma','Fiscalité configurable — validation Finance',0,'configuration_required','Morocco',true,'draft',current_date) on conflict(tenant_key,profile_key) do update set finance_validation_required=true,status='draft';

-- Source-backed historic catalogue prices are seeded as draft B2C entries only; no cost is invented.
insert into flashcards_os.price_book_entries(tenant_key,price_book_id,release_id,unit_price_dh,status,effective_from)
select 'angelcare-internal',pb.id,r.id,c.historical_price_dh,'draft',current_date
from flashcards_os.product_releases r join flashcards_os.collections c on c.id=r.collection_id
join flashcards_os.price_books pb on pb.tenant_key='angelcare-internal' and pb.code='PRICE-B2C-BASELINE'
where c.historical_price_dh is not null
on conflict(tenant_key,price_book_id,release_id,quantity_min,effective_from) do nothing;

insert into flashcards_os.learner_profile_options(tenant_key,option_key,label,family,description,age_min_months,age_max_months,applicable_contexts,status,sort_order) values
('angelcare-internal','age-6-12m','6–12 mois','age','Profil gouverné Flashcards OS',6,12,'{}','active',10),
('angelcare-internal','age-12-24m','12–24 mois','age','Profil gouverné Flashcards OS',12,24,'{}','active',20),
('angelcare-internal','age-2-3y','2–3 ans','age','Profil gouverné Flashcards OS',24,36,'{}','active',30),
('angelcare-internal','age-3-4y','3–4 ans','age','Profil gouverné Flashcards OS',36,48,'{}','active',40),
('angelcare-internal','age-4-5y','4–5 ans','age','Profil gouverné Flashcards OS',48,60,'{}','active',50),
('angelcare-internal','age-5-6y','5–6 ans','age','Profil gouverné Flashcards OS',60,72,'{}','active',60),
('angelcare-internal','age-6-8y','6–8 ans','age','Profil gouverné Flashcards OS',72,96,'{}','active',70),
('angelcare-internal','age-8-10y','8–10 ans','age','Profil gouverné Flashcards OS',96,120,'{}','active',80),
('angelcare-internal','age-10-12y','10–12 ans','age','Profil gouverné Flashcards OS',120,144,'{}','active',90),
('angelcare-internal','adolescent','Adolescent','stage','Profil gouverné Flashcards OS',144,216,'{}','active',100),
('angelcare-internal','adult','Adulte','stage','Profil gouverné Flashcards OS',216,null,'{}','active',110),
('angelcare-internal','senior','Senior — stimulation cognitive','stage','Profil gouverné Flashcards OS',600,null,'{}','active',120),
('angelcare-internal','preverbal','Profil préverbal','communication','Profil gouverné Flashcards OS',null,null,'{}','active',130),
('angelcare-internal','emerging-speech','Langage émergent','communication','Profil gouverné Flashcards OS',null,null,'{}','active',140),
('angelcare-internal','early-reader','Lecteur débutant','literacy','Profil gouverné Flashcards OS',null,null,'{}','active',150),
('angelcare-internal','bilingual','Apprenant bilingue','language','Profil gouverné Flashcards OS',null,null,'{}','active',160),
('angelcare-internal','visual-support','Besoin de support visuel','support','Profil gouverné Flashcards OS',null,null,'{}','active',170) on conflict(tenant_key,option_key) do update set label=excluded.label,status='active',updated_at=now();
insert into flashcards_os.usage_context_options(tenant_key,option_key,label,family,description,status,sort_order) values
('angelcare-internal','parent-home','Parent Home','usage','Contexte gouverné Flashcards OS','active',10),
('angelcare-internal','independent-home','Independent Home','usage','Contexte gouverné Flashcards OS','active',20),
('angelcare-internal','sibling-learning','Sibling Learning','usage','Contexte gouverné Flashcards OS','active',30),
('angelcare-internal','kindergarten','Kindergarten','usage','Contexte gouverné Flashcards OS','active',40),
('angelcare-internal','preschool','Preschool','usage','Contexte gouverné Flashcards OS','active',50),
('angelcare-internal','primary-classroom','Primary Classroom','usage','Contexte gouverné Flashcards OS','active',60),
('angelcare-internal','learning-centre','Learning Centre','usage','Contexte gouverné Flashcards OS','active',70),
('angelcare-internal','speech-therapy','Speech Therapy','usage','Contexte gouverné Flashcards OS','active',80),
('angelcare-internal','special-education','Special Education','usage','Contexte gouverné Flashcards OS','active',90),
('angelcare-internal','clinic','Clinic','usage','Contexte gouverné Flashcards OS','active',100),
('angelcare-internal','hospital','Hospital','usage','Contexte gouverné Flashcards OS','active',110),
('angelcare-internal','rehabilitation','Rehabilitation','usage','Contexte gouverné Flashcards OS','active',120),
('angelcare-internal','hotel-kids-club','Hotel Kids Club','usage','Contexte gouverné Flashcards OS','active',130),
('angelcare-internal','corporate-family','Corporate Family','usage','Contexte gouverné Flashcards OS','active',140),
('angelcare-internal','group-workshop','Group Workshop','usage','Contexte gouverné Flashcards OS','active',150),
('angelcare-internal','remote-lesson','Remote Lesson','usage','Contexte gouverné Flashcards OS','active',160),
('angelcare-internal','after-school','After School','usage','Contexte gouverné Flashcards OS','active',170),
('angelcare-internal','travel-activity','Travel Activity','usage','Contexte gouverné Flashcards OS','active',180),
('angelcare-internal','daily-routine','Daily Routine','usage','Contexte gouverné Flashcards OS','active',190) on conflict(tenant_key,option_key) do update set label=excluded.label,status='active',updated_at=now();
insert into flashcards_os.pain_point_options(tenant_key,option_key,label,family,description,status,sort_order) values
('angelcare-internal','limited-vocabulary','Limited Vocabulary','need','Pain point gouverné et sélectionnable','active',10),
('angelcare-internal','delayed-naming','Delayed Naming','need','Pain point gouverné et sélectionnable','active',20),
('angelcare-internal','sentence-difficulty','Sentence Difficulty','need','Pain point gouverné et sélectionnable','active',30),
('angelcare-internal','instruction-difficulty','Instruction Difficulty','need','Pain point gouverné et sélectionnable','active',40),
('angelcare-internal','pronunciation-challenge','Pronunciation Challenge','need','Pain point gouverné et sélectionnable','active',50),
('angelcare-internal','bilingual-confusion','Bilingual Confusion','need','Pain point gouverné et sélectionnable','active',60),
('angelcare-internal','weak-expressive-language','Weak Expressive Language','need','Pain point gouverné et sélectionnable','active',70),
('angelcare-internal','weak-receptive-language','Weak Receptive Language','need','Pain point gouverné et sélectionnable','active',80),
('angelcare-internal','short-attention','Short Attention','need','Pain point gouverné et sélectionnable','active',90),
('angelcare-internal','poor-recall','Poor Recall','need','Pain point gouverné et sélectionnable','active',100),
('angelcare-internal','sequencing-difficulty','Sequencing Difficulty','need','Pain point gouverné et sélectionnable','active',110),
('angelcare-internal','categorisation-difficulty','Categorisation Difficulty','need','Pain point gouverné et sélectionnable','active',120),
('angelcare-internal','visual-discrimination','Visual Discrimination','need','Pain point gouverné et sélectionnable','active',130),
('angelcare-internal','generalisation-difficulty','Generalisation Difficulty','need','Pain point gouverné et sélectionnable','active',140),
('angelcare-internal','morning-routine-resistance','Morning Routine Resistance','need','Pain point gouverné et sélectionnable','active',150),
('angelcare-internal','evening-routine-resistance','Evening Routine Resistance','need','Pain point gouverné et sélectionnable','active',160),
('angelcare-internal','dressing-difficulty','Dressing Difficulty','need','Pain point gouverné et sélectionnable','active',170),
('angelcare-internal','hygiene-difficulty','Hygiene Difficulty','need','Pain point gouverné et sélectionnable','active',180),
('angelcare-internal','school-preparation-difficulty','School Preparation Difficulty','need','Pain point gouverné et sélectionnable','active',190),
('angelcare-internal','multi-step-difficulty','Multi Step Difficulty','need','Pain point gouverné et sélectionnable','active',200),
('angelcare-internal','emotion-identification','Emotion Identification','need','Pain point gouverné et sélectionnable','active',210),
('angelcare-internal','needs-expression','Needs Expression','need','Pain point gouverné et sélectionnable','active',220),
('angelcare-internal','turn-taking','Turn Taking','need','Pain point gouverné et sélectionnable','active',230),
('angelcare-internal','low-social-participation','Low Social Participation','need','Pain point gouverné et sélectionnable','active',240),
('angelcare-internal','transition-anxiety','Transition Anxiety','need','Pain point gouverné et sélectionnable','active',250),
('angelcare-internal','low-learning-confidence','Low Learning Confidence','need','Pain point gouverné et sélectionnable','active',260),
('angelcare-internal','school-readiness-gap','School Readiness Gap','need','Pain point gouverné et sélectionnable','active',270),
('angelcare-internal','numeracy-difficulty','Numeracy Difficulty','need','Pain point gouverné et sélectionnable','active',280),
('angelcare-internal','weak-general-knowledge','Weak General Knowledge','need','Pain point gouverné et sélectionnable','active',290),
('angelcare-internal','classroom-adaptation','Classroom Adaptation','need','Pain point gouverné et sélectionnable','active',300),
('angelcare-internal','parent-needs-structure','Parent Needs Structure','need','Pain point gouverné et sélectionnable','active',310),
('angelcare-internal','educator-needs-progression','Educator Needs Progression','need','Pain point gouverné et sélectionnable','active',320) on conflict(tenant_key,option_key) do update set label=excluded.label,status='active',updated_at=now();
insert into flashcards_os.capability_objectives(tenant_key,objective_key,label,family,description,status,sort_order) values
('angelcare-internal','receptive-language','Receptive Language','capability','Objectif de capacité gouverné','active',10),
('angelcare-internal','expressive-language','Expressive Language','capability','Objectif de capacité gouverné','active',20),
('angelcare-internal','vocabulary','Vocabulary','capability','Objectif de capacité gouverné','active',30),
('angelcare-internal','pronunciation','Pronunciation','capability','Objectif de capacité gouverné','active',40),
('angelcare-internal','sentence-construction','Sentence Construction','capability','Objectif de capacité gouverné','active',50),
('angelcare-internal','story-sequencing','Story Sequencing','capability','Objectif de capacité gouverné','active',60),
('angelcare-internal','bilingual-competence','Bilingual Competence','capability','Objectif de capacité gouverné','active',70),
('angelcare-internal','memory','Memory','capability','Objectif de capacité gouverné','active',80),
('angelcare-internal','classification','Classification','capability','Objectif de capacité gouverné','active',90),
('angelcare-internal','logical-thinking','Logical Thinking','capability','Objectif de capacité gouverné','active',100),
('angelcare-internal','numeracy','Numeracy','capability','Objectif de capacité gouverné','active',110),
('angelcare-internal','geography','Geography','capability','Objectif de capacité gouverné','active',120),
('angelcare-internal','general-knowledge','General Knowledge','capability','Objectif de capacité gouverné','active',130),
('angelcare-internal','emotion-identification','Emotion Identification','capability','Objectif de capacité gouverné','active',140),
('angelcare-internal','emotion-regulation','Emotion Regulation','capability','Objectif de capacité gouverné','active',150),
('angelcare-internal','social-skills','Social Skills','capability','Objectif de capacité gouverné','active',160),
('angelcare-internal','autonomy','Autonomy','capability','Objectif de capacité gouverné','active',170),
('angelcare-internal','routine-completion','Routine Completion','capability','Objectif de capacité gouverné','active',180),
('angelcare-internal','school-readiness','School Readiness','capability','Objectif de capacité gouverné','active',190),
('angelcare-internal','observation','Observation','capability','Objectif de capacité gouverné','active',200),
('angelcare-internal','visual-discrimination','Visual Discrimination','capability','Objectif de capacité gouverné','active',210),
('angelcare-internal','communication-needs','Communication Needs','capability','Objectif de capacité gouverné','active',220),
('angelcare-internal','therapeutic-reinforcement','Therapeutic Reinforcement','capability','Objectif de capacité gouverné','active',230),
('angelcare-internal','attention-development','Attention Development','capability','Objectif de capacité gouverné','active',240) on conflict(tenant_key,objective_key) do update set label=excluded.label,status='active',updated_at=now();
insert into flashcards_os.desired_outcome_options(tenant_key,outcome_key,label,family,description,measurable_template,status,sort_order) values
('angelcare-internal','recognise-20-words','Recognise 20 Words','measurable','Résultat mesurable gouverné','Mesurer baseline, progression et seuil de maîtrise.','active',10),
('angelcare-internal','name-30-objects','Name 30 Objects','measurable','Résultat mesurable gouverné','Mesurer baseline, progression et seuil de maîtrise.','active',20),
('angelcare-internal','form-two-word-phrases','Form Two Word Phrases','measurable','Résultat mesurable gouverné','Mesurer baseline, progression et seuil de maîtrise.','active',30),
('angelcare-internal','form-simple-sentences','Form Simple Sentences','measurable','Résultat mesurable gouverné','Mesurer baseline, progression et seuil de maîtrise.','active',40),
('angelcare-internal','follow-two-step-instructions','Follow Two Step Instructions','measurable','Résultat mesurable gouverné','Mesurer baseline, progression et seuil de maîtrise.','active',50),
('angelcare-internal','complete-five-step-routine','Complete Five Step Routine','measurable','Résultat mesurable gouverné','Mesurer baseline, progression et seuil de maîtrise.','active',60),
('angelcare-internal','identify-six-emotions','Identify Six Emotions','measurable','Résultat mesurable gouverné','Mesurer baseline, progression et seuil de maîtrise.','active',70),
('angelcare-internal','categorise-80-percent','Categorise 80 Percent','measurable','Résultat mesurable gouverné','Mesurer baseline, progression et seuil de maîtrise.','active',80),
('angelcare-internal','count-1-to-20','Count 1 To 20','measurable','Résultat mesurable gouverné','Mesurer baseline, progression et seuil de maîtrise.','active',90),
('angelcare-internal','match-number-quantity','Match Number Quantity','measurable','Résultat mesurable gouverné','Mesurer baseline, progression et seuil de maîtrise.','active',100),
('angelcare-internal','retell-three-stage-sequence','Retell Three Stage Sequence','measurable','Résultat mesurable gouverné','Mesurer baseline, progression et seuil de maîtrise.','active',110),
('angelcare-internal','communicate-five-needs','Communicate Five Needs','measurable','Résultat mesurable gouverné','Mesurer baseline, progression et seuil de maîtrise.','active',120),
('angelcare-internal','participate-ten-minutes','Participate Ten Minutes','measurable','Résultat mesurable gouverné','Mesurer baseline, progression et seuil de maîtrise.','active',130),
('angelcare-internal','use-vocabulary-daily','Use Vocabulary Daily','measurable','Résultat mesurable gouverné','Mesurer baseline, progression et seuil de maîtrise.','active',140),
('angelcare-internal','increase-independent-duration','Increase Independent Duration','measurable','Résultat mesurable gouverné','Mesurer baseline, progression et seuil de maîtrise.','active',150),
('angelcare-internal','master-final-assessment','Master Final Assessment','measurable','Résultat mesurable gouverné','Mesurer baseline, progression et seuil de maîtrise.','active',160),
('angelcare-internal','improve-naming-speed','Improve Naming Speed','measurable','Résultat mesurable gouverné','Mesurer baseline, progression et seuil de maîtrise.','active',170),
('angelcare-internal','complete-session-without-resistance','Complete Session Without Resistance','measurable','Résultat mesurable gouverné','Mesurer baseline, progression et seuil de maîtrise.','active',180),
('angelcare-internal','generalise-across-contexts','Generalise Across Contexts','measurable','Résultat mesurable gouverné','Mesurer baseline, progression et seuil de maîtrise.','active',190),
('angelcare-internal','teach-back-concepts','Teach Back Concepts','measurable','Résultat mesurable gouverné','Mesurer baseline, progression et seuil de maîtrise.','active',200) on conflict(tenant_key,outcome_key) do update set label=excluded.label,status='active',updated_at=now();

insert into flashcards_os.model_profiles(tenant_key,profile_key,label,purpose,primary_model,fallback_models,temperature,max_output_tokens,timeout_ms,retry_limit,cost_ceiling_usd,require_structured_output,require_zdr,deny_data_collection,allowed_data_classes,status) values
('angelcare-internal','solution_composer','Sellable Solution Composer','Compose jusqu’à dix scénarios explicables à partir du pool éligible et des calculs déterministes.','openai/gpt-5-mini',array['anthropic/claude-sonnet-4.5','google/gemini-2.5-pro'],0.2,12000,120000,2,8,true,true,true,array['approved_release_metadata','deterministic_commercial_facts','approved_internal_evidence'],'active'),
('angelcare-internal','learning_journey_architect','Learning Journey Architect','Compose jusqu’à dix parcours détaillés sans altérer prix, charge ou éligibilité déterministes.','openai/gpt-5-mini',array['anthropic/claude-sonnet-4.5','google/gemini-2.5-pro'],0.2,16000,120000,2,10,true,true,true,array['approved_release_metadata','objective_ontology','deterministic_commercial_facts'],'active')
on conflict(tenant_key,profile_key) do update set purpose=excluded.purpose,primary_model=excluded.primary_model,fallback_models=excluded.fallback_models,require_zdr=true,deny_data_collection=true,status='active',updated_at=now();

insert into flashcards_os.intelligence_recipes(tenant_key,recipe_key,version_no,label,task_profile,system_instruction,input_contract,output_schema,forbidden_actions,status,created_by,approved_by,approved_at) values
('angelcare-internal','sellable-solution-composition',1,'Sellable Solutions Intelligence','solution_composer','Composer uniquement depuis le pool de releases éligibles fourni. Les prix, coûts, taxes, remises, marges, stock et délais sont des faits déterministes immuables. Ne jamais appeler Tavily. Maximum dix scénarios.','{"requires":["request","eligibleReleases","deterministicCommercialFacts"],"maxScenarios":10}'::jsonb,'{"contract":"ANGELCARE_SOLUTION_SCENARIO_V1"}'::jsonb,array['call_tavily','invent_price','invent_cost','change_tax','exceed_ten','publish_without_human'],'approved','UMZ4 migration','UMZ4 contract',now()),
('angelcare-internal','learning-journey-composition',1,'Learning Journey Intelligence','learning_journey_architect','Composer un parcours jours/sessions depuis les cinq dimensions obligatoires et les releases éligibles. Ne jamais appeler Tavily. Ne jamais dépasser dix plans ni la charge déterministe.','{"requires":["fiveDimensions","workloadEnvelope","eligibleReleases"],"maxPlans":10}'::jsonb,'{"contract":"ANGELCARE_LEARNING_JOURNEY_V1"}'::jsonb,array['call_tavily','exceed_ten','use_unapproved_release','invent_price','publish_without_human'],'approved','UMZ4 migration','UMZ4 contract',now())
on conflict(tenant_key,recipe_key,version_no) do nothing;

insert into flashcards_os.configuration(tenant_key,config_key,config_group,label,value,description,status) values
('angelcare-internal','solutions.scenario_limits','solutions','Limites scénarios','{"minimum":1,"maximum":10,"maximumCollections":12,"controlledDiversification":true}'::jsonb,'Maximum dix scénarios et douze collections, contrôlé serveur.','active'),
('angelcare-internal','solutions.deterministic_commercial_truth','solutions','Vérité commerciale déterministe','{"pricing":true,"tax":true,"discount":true,"margin":true,"aiAuthority":false}'::jsonb,'OpenRouter explique et compose sans calculer les vérités financières.','active'),
('angelcare-internal','journeys.five_dimensions','journeys','Cinq dimensions obligatoires','{"learner":true,"context":true,"painPoint":true,"capability":true,"outcome":true}'::jsonb,'Aucun parcours sans les cinq dimensions.','active'),
('angelcare-internal','journeys.workload_limits','journeys','Limites charge parcours','{"maxDays":90,"maxSessionsPerDay":5,"maxMinutesPerSession":120,"maxPlans":10}'::jsonb,'Charge contrôlée avant et après composition.','active'),
('angelcare-internal','solutions.crm_boundary','solutions','Frontière CRM UMZ5','{"crm":false,"quotes":false,"invoices":false,"customerFulfilment":false}'::jsonb,'UMZ4 produit des sellables prêts; UMZ5 les vend.','active')
on conflict(config_key) do update set value=excluded.value,description=excluded.description,status='active',updated_at=now();
insert into flashcards_os.permission_catalogue(tenant_key,permission_key,label,domain,risk_level,description) values
('angelcare-internal','flashcards_os.view_solutions','Voir Solutions','solutions','normal','Autorité UMZ4 gouvernée.'),
('angelcare-internal','flashcards_os.create_solution_requests','Créer demandes solutions','solutions','medium','Autorité UMZ4 gouvernée.'),
('angelcare-internal','flashcards_os.generate_solution_scenarios','Générer scénarios solutions','solutions','high','Autorité UMZ4 gouvernée.'),
('angelcare-internal','flashcards_os.edit_solution_scenarios','Éditer scénarios','solutions','high','Autorité UMZ4 gouvernée.'),
('angelcare-internal','flashcards_os.approve_solution_scenarios','Approuver scénarios','solutions','critical','Autorité UMZ4 gouvernée.'),
('angelcare-internal','flashcards_os.manage_price_books','Gérer price books','solutions','critical','Autorité UMZ4 gouvernée.'),
('angelcare-internal','flashcards_os.manage_cost_books','Gérer cost books','solutions','critical','Autorité UMZ4 gouvernée.'),
('angelcare-internal','flashcards_os.manage_discount_rules','Gérer remises','solutions','critical','Autorité UMZ4 gouvernée.'),
('angelcare-internal','flashcards_os.override_margin_controls','Déroger marge','solutions','critical','Autorité UMZ4 gouvernée.'),
('angelcare-internal','flashcards_os.publish_b2c_sellables','Publier B2C','solutions','critical','Autorité UMZ4 gouvernée.'),
('angelcare-internal','flashcards_os.publish_b2b_sellables','Publier B2B','solutions','critical','Autorité UMZ4 gouvernée.'),
('angelcare-internal','flashcards_os.retire_sellables','Retirer sellables','solutions','critical','Autorité UMZ4 gouvernée.'),
('angelcare-internal','flashcards_os.manage_objective_ontology','Gérer ontologie','solutions','high','Autorité UMZ4 gouvernée.'),
('angelcare-internal','flashcards_os.create_journey_requests','Créer demandes parcours','solutions','medium','Autorité UMZ4 gouvernée.'),
('angelcare-internal','flashcards_os.generate_journey_scenarios','Générer parcours','solutions','high','Autorité UMZ4 gouvernée.'),
('angelcare-internal','flashcards_os.edit_journey_scenarios','Éditer parcours','solutions','high','Autorité UMZ4 gouvernée.'),
('angelcare-internal','flashcards_os.approve_learning_plans','Approuver plans','solutions','critical','Autorité UMZ4 gouvernée.'),
('angelcare-internal','flashcards_os.publish_b2c_plans','Publier plans B2C','solutions','critical','Autorité UMZ4 gouvernée.'),
('angelcare-internal','flashcards_os.publish_b2b_programmes','Publier programmes B2B','solutions','critical','Autorité UMZ4 gouvernée.'),
('angelcare-internal','flashcards_os.audit_solutions','Auditer Solutions','solutions','high','Autorité UMZ4 gouvernée.'),
('angelcare-internal','flashcards_os.admin_solutions','Administrer Solutions','solutions','critical','Autorité UMZ4 gouvernée.') on conflict(permission_key) do update set label=excluded.label,domain=excluded.domain,risk_level=excluded.risk_level,description=excluded.description;

commit;
