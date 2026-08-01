-- ANGELCARE Flashcards OS — Ultra Mega ZIP 2
-- Intelligence Sovereignty, Tavily/OpenRouter orchestration and Product Design command.
-- Additive migration. Requires UMZ1 foundation.

begin;

create extension if not exists pgcrypto;
create schema if not exists flashcards_os;

-- -----------------------------------------------------------------------------
-- Research acquisition and evidence governance
-- -----------------------------------------------------------------------------

create table if not exists flashcards_os.research_missions (
  id uuid primary key default gen_random_uuid(),
  tenant_key text not null default 'angelcare-internal',
  code text not null,
  title text not null,
  strategic_question text not null,
  purpose text not null check (purpose in (
    'new_collection_opportunity','product_concept_validation','format_benchmark','methodology_review',
    'age_suitability','institutional_demand','competitor_portfolio','parent_pain_points',
    'specialist_use_case','market_positioning','cultural_adaptation','content_gap'
  )),
  mode text not null check (mode in ('rapid_scan','deep_evidence','known_source','domain_investigation')),
  status text not null default 'draft' check (status in (
    'draft','submitted','approved','queued','acquiring','evidence_review','ready_for_synthesis',
    'synthesising','human_review','completed','cancelled','failed','archived'
  )),
  product_domain text null,
  collection_ids text[] not null default '{}',
  audience_profiles text[] not null default '{}',
  geographic_scope text[] not null default '{}',
  languages text[] not null default array['fr']::text[],
  source_categories text[] not null default '{}',
  include_domains text[] not null default '{}',
  exclude_domains text[] not null default '{}',
  planned_queries text[] not null default '{}',
  search_depth text not null default 'basic' check (search_depth in ('basic','advanced')),
  source_limit integer not null default 8 check (source_limit between 1 and 20),
  budget_credits integer not null default 12 check (budget_credits between 1 and 1000),
  used_credits numeric(12,3) not null default 0 check (used_credits >= 0),
  source_count integer not null default 0 check (source_count >= 0),
  accepted_claim_count integer not null default 0 check (accepted_claim_count >= 0),
  contradiction_count integer not null default 0 check (contradiction_count >= 0),
  owner_name text not null default 'Direction Produit',
  reviewer_name text null,
  deadline timestamptz null,
  approved_by text null,
  approved_at timestamptz null,
  cancelled_by text null,
  cancelled_at timestamptz null,
  cancellation_note text null,
  failure_reason text null,
  metadata jsonb not null default '{}'::jsonb,
  created_by text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_key, code)
);

create table if not exists flashcards_os.research_queries (
  id uuid primary key default gen_random_uuid(),
  tenant_key text not null default 'angelcare-internal',
  mission_id uuid not null references flashcards_os.research_missions(id) on update cascade on delete restrict,
  query_text text not null,
  query_order integer not null check (query_order > 0),
  status text not null default 'draft' check (status in ('draft','queued','running','completed','failed','cancelled')),
  parameters jsonb not null default '{}'::jsonb,
  tavily_request_id text null,
  result_count integer not null default 0 check (result_count >= 0),
  credits_used numeric(12,3) not null default 0 check (credits_used >= 0),
  failure_reason text null,
  started_at timestamptz null,
  completed_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_key, mission_id, query_order)
);

create table if not exists flashcards_os.research_runs (
  id uuid primary key default gen_random_uuid(),
  tenant_key text not null default 'angelcare-internal',
  mission_id uuid not null references flashcards_os.research_missions(id) on update cascade on delete restrict,
  run_type text not null,
  status text not null default 'queued' check (status in ('queued','running','completed','failed','cancelled')),
  provider text not null default 'tavily',
  provider_request_id text null,
  request_payload jsonb not null default '{}'::jsonb,
  response_summary jsonb not null default '{}'::jsonb,
  credits_used numeric(12,3) not null default 0,
  error_message text null,
  started_at timestamptz null,
  completed_at timestamptz null,
  created_at timestamptz not null default now()
);

create table if not exists flashcards_os.research_sources (
  id uuid primary key default gen_random_uuid(),
  tenant_key text not null default 'angelcare-internal',
  mission_id uuid not null references flashcards_os.research_missions(id) on update cascade on delete restrict,
  research_query_id uuid null references flashcards_os.research_queries(id) on update cascade on delete restrict,
  title text not null,
  url text not null,
  canonical_url text not null,
  domain text not null,
  publication_date timestamptz null,
  retrieval_date timestamptz not null default now(),
  author text null,
  source_category text not null default 'web',
  country text null,
  language text null,
  relevance_score integer not null default 0 check (relevance_score between 0 and 100),
  freshness_score integer not null default 0 check (freshness_score between 0 and 100),
  authority_score integer not null default 0 check (authority_score between 0 and 100),
  quality_score integer not null default 0 check (quality_score between 0 and 100),
  duplicate_group text null,
  review_status text not null default 'pending' check (review_status in ('pending','accepted','rejected','needs_verification')),
  reviewed_by text null,
  reviewed_at timestamptz null,
  reviewer_note text null,
  normalized_content text not null default '',
  content_preview text not null default '',
  content_hash text not null,
  tavily_request_id text null,
  favicon_url text null,
  ai_limitations text[] not null default '{}',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_key, mission_id, canonical_url)
);

create table if not exists flashcards_os.source_snapshots (
  id uuid primary key default gen_random_uuid(),
  tenant_key text not null default 'angelcare-internal',
  source_id uuid not null references flashcards_os.research_sources(id) on update cascade on delete restrict,
  content_hash text not null,
  normalized_content text not null,
  retrieved_at timestamptz not null default now(),
  provider_request_id text null,
  metadata jsonb not null default '{}'::jsonb,
  unique (tenant_key, source_id, content_hash)
);

create table if not exists flashcards_os.source_duplicates (
  id uuid primary key default gen_random_uuid(),
  tenant_key text not null default 'angelcare-internal',
  source_id uuid not null references flashcards_os.research_sources(id) on update cascade on delete restrict,
  duplicate_of_source_id uuid not null references flashcards_os.research_sources(id) on update cascade on delete restrict,
  similarity_score numeric(6,2) not null default 100 check (similarity_score between 0 and 100),
  detection_method text not null,
  status text not null default 'detected' check (status in ('detected','confirmed','rejected','merged')),
  reviewed_by text null,
  reviewed_at timestamptz null,
  created_at timestamptz not null default now(),
  unique (tenant_key, source_id, duplicate_of_source_id),
  check (source_id <> duplicate_of_source_id)
);

create table if not exists flashcards_os.evidence_claims (
  id uuid primary key default gen_random_uuid(),
  tenant_key text not null default 'angelcare-internal',
  mission_id uuid not null references flashcards_os.research_missions(id) on update cascade on delete restrict,
  statement text not null,
  claim_kind text not null check (claim_kind in ('fact','market_signal','methodology','risk','requirement','benchmark','inference')),
  supporting_extract text not null,
  confidence numeric(6,2) not null default 0 check (confidence between 0 and 100),
  directness text not null check (directness in ('direct','inferred')),
  contradiction_ids uuid[] not null default '{}',
  contradiction_signals text[] not null default '{}',
  geographic_applicability text[] not null default '{}',
  age_applicability text[] not null default '{}',
  product_applicability text[] not null default '{}',
  review_status text not null default 'pending' check (review_status in ('pending','accepted','rejected','needs_verification')),
  reviewer_note text null,
  reviewed_by text null,
  reviewed_at timestamptz null,
  extraction_run_id uuid null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists flashcards_os.claim_source_links (
  id uuid primary key default gen_random_uuid(),
  tenant_key text not null default 'angelcare-internal',
  claim_id uuid not null references flashcards_os.evidence_claims(id) on update cascade on delete restrict,
  source_id uuid not null references flashcards_os.research_sources(id) on update cascade on delete restrict,
  relationship text not null default 'supports' check (relationship in ('supports','contradicts','contextualises','limits')),
  created_at timestamptz not null default now(),
  unique (tenant_key, claim_id, source_id, relationship)
);

create table if not exists flashcards_os.evidence_reviews (
  id uuid primary key default gen_random_uuid(),
  tenant_key text not null default 'angelcare-internal',
  entity_type text not null check (entity_type in ('source','claim','synthesis')),
  entity_id uuid not null,
  decision text not null check (decision in ('accepted','rejected','needs_verification','approved','rework')),
  note text not null,
  reviewer_id text null,
  reviewer_name text null,
  created_at timestamptz not null default now()
);

create table if not exists flashcards_os.research_syntheses (
  id uuid primary key default gen_random_uuid(),
  tenant_key text not null default 'angelcare-internal',
  mission_id uuid not null references flashcards_os.research_missions(id) on update cascade on delete restrict,
  version_no integer not null default 1 check (version_no > 0),
  status text not null default 'draft' check (status in ('draft','review','approved','rejected')),
  executive_answer text not null default '',
  findings jsonb not null default '[]'::jsonb,
  contradictions jsonb not null default '[]'::jsonb,
  limitations text[] not null default '{}',
  product_implications text[] not null default '{}',
  risks text[] not null default '{}',
  assumptions text[] not null default '{}',
  remaining_gaps text[] not null default '{}',
  recommended_next_action text not null default '',
  intelligence_run_id uuid null,
  model_used text null,
  created_by text null,
  approved_by text null,
  approved_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_key, mission_id, version_no)
);

-- -----------------------------------------------------------------------------
-- Product signals, opportunities and Product Design governance
-- -----------------------------------------------------------------------------

create table if not exists flashcards_os.intelligence_signals (
  id uuid primary key default gen_random_uuid(),
  tenant_key text not null default 'angelcare-internal',
  signal_type text not null,
  title text not null,
  detail text not null default '',
  strength integer not null default 0 check (strength between 0 and 100),
  source_type text not null check (source_type in ('internal','external','manual')),
  source_entity_id text null,
  status text not null default 'new' check (status in ('new','reviewed','converted','dismissed')),
  metadata jsonb not null default '{}'::jsonb,
  created_by text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists flashcards_os.product_opportunities (
  id uuid primary key default gen_random_uuid(),
  tenant_key text not null default 'angelcare-internal',
  code text not null,
  title text not null,
  thesis text not null default '',
  problem_statement text not null default '',
  target_audience text[] not null default '{}',
  related_collection_ids text[] not null default '{}',
  related_mission_ids uuid[] not null default '{}',
  evidence_claim_ids uuid[] not null default '{}',
  status text not null default 'candidate' check (status in (
    'candidate','evidence_requested','qualified','shortlisted','design_authorised','design_active','approved','rejected','deferred','archived'
  )),
  recommendation text not null default '',
  missing_evidence text[] not null default '{}',
  owner_name text not null default 'Direction Produit',
  created_by text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_key, code)
);

create table if not exists flashcards_os.opportunity_scores (
  id uuid primary key default gen_random_uuid(),
  tenant_key text not null default 'angelcare-internal',
  opportunity_id uuid not null references flashcards_os.product_opportunities(id) on update cascade on delete restrict,
  evidence_strength integer not null default 0 check (evidence_strength between 0 and 100),
  strategic_fit integer not null default 0 check (strategic_fit between 0 and 100),
  portfolio_gap integer not null default 0 check (portfolio_gap between 0 and 100),
  audience_value integer not null default 0 check (audience_value between 0 and 100),
  learning_value integer not null default 0 check (learning_value between 0 and 100),
  language_relevance integer not null default 0 check (language_relevance between 0 and 100),
  age_coverage integer not null default 0 check (age_coverage between 0 and 100),
  context_coverage integer not null default 0 check (context_coverage between 0 and 100),
  differentiation integer not null default 0 check (differentiation between 0 and 100),
  format_reuse integer not null default 0 check (format_reuse between 0 and 100),
  bundle_potential integer not null default 0 check (bundle_potential between 0 and 100),
  journey_potential integer not null default 0 check (journey_potential between 0 and 100),
  commercial_potential integer not null default 0 check (commercial_potential between 0 and 100),
  production_complexity integer not null default 0 check (production_complexity between 0 and 100),
  content_risk integer not null default 0 check (content_risk between 0 and 100),
  cultural_risk integer not null default 0 check (cultural_risk between 0 and 100),
  rights_risk integer not null default 0 check (rights_risk between 0 and 100),
  overlap_risk integer not null default 0 check (overlap_risk between 0 and 100),
  readiness_to_design integer not null default 0 check (readiness_to_design between 0 and 100),
  weighted_total integer not null default 0 check (weighted_total between 0 and 100),
  score_version text not null default 'UMZ2-1.0',
  score_explanation jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (tenant_key, opportunity_id, score_version)
);

create table if not exists flashcards_os.opportunity_decisions (
  id uuid primary key default gen_random_uuid(),
  tenant_key text not null default 'angelcare-internal',
  opportunity_id uuid not null references flashcards_os.product_opportunities(id) on update cascade on delete restrict,
  decision text not null,
  note text not null,
  decided_by text null,
  decided_by_name text null,
  created_at timestamptz not null default now()
);

create table if not exists flashcards_os.product_designs (
  id uuid primary key default gen_random_uuid(),
  tenant_key text not null default 'angelcare-internal',
  code text not null,
  opportunity_id uuid not null references flashcards_os.product_opportunities(id) on update cascade on delete restrict,
  title text not null,
  version_no integer not null default 1 check (version_no > 0),
  status text not null default 'draft' check (status in ('draft','researching','structuring','review','approved','rework','rejected','ready_for_umz3','archived')),
  executive_thesis text not null default '',
  problem_definition text not null default '',
  evidence_claim_ids uuid[] not null default '{}',
  target_markets text[] not null default '{}',
  learner_profiles text[] not null default '{}',
  age_ranges text[] not null default '{}',
  usage_contexts text[] not null default '{}',
  pain_points text[] not null default '{}',
  desired_outcomes text[] not null default '{}',
  educational_doctrine text[] not null default '{}',
  primary_objective text not null default '',
  secondary_objectives text[] not null default '{}',
  content_perimeter text[] not null default '{}',
  card_architecture jsonb not null default '[]'::jsonb,
  total_card_count_hypothesis integer not null default 0 check (total_card_count_hypothesis >= 0),
  progression_model text[] not null default '{}',
  language_strategy text[] not null default '{}',
  inclusion_requirements text[] not null default '{}',
  cultural_adaptation text[] not null default '{}',
  format_strategy text[] not null default '{}',
  overlap_analysis text[] not null default '{}',
  differentiation text[] not null default '{}',
  bundle_compatibility text[] not null default '{}',
  journey_compatibility text[] not null default '{}',
  commercial_hypothesis text[] not null default '{}',
  production_complexity text[] not null default '{}',
  rights_and_safety_risks text[] not null default '{}',
  open_questions text[] not null default '{}',
  readiness_score integer not null default 0 check (readiness_score between 0 and 100),
  architecture_run_id uuid null,
  approved_by text null,
  approved_at timestamptz null,
  created_by text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_key, code)
);

create table if not exists flashcards_os.product_design_versions (
  id uuid primary key default gen_random_uuid(),
  tenant_key text not null default 'angelcare-internal',
  design_id uuid not null references flashcards_os.product_designs(id) on update cascade on delete restrict,
  version_no integer not null check (version_no > 0),
  status text not null,
  change_summary text not null,
  design_snapshot jsonb not null,
  intelligence_run_id uuid null,
  created_by text null,
  created_at timestamptz not null default now(),
  unique (tenant_key, design_id, version_no)
);

create table if not exists flashcards_os.design_audiences (
  id uuid primary key default gen_random_uuid(),
  tenant_key text not null default 'angelcare-internal',
  design_id uuid not null references flashcards_os.product_designs(id) on update cascade on delete restrict,
  audience_type text not null,
  label text not null,
  attributes jsonb not null default '{}'::jsonb,
  priority integer not null default 50 check (priority between 0 and 100),
  created_at timestamptz not null default now()
);

create table if not exists flashcards_os.design_requirements (
  id uuid primary key default gen_random_uuid(),
  tenant_key text not null default 'angelcare-internal',
  design_id uuid not null references flashcards_os.product_designs(id) on update cascade on delete restrict,
  requirement_type text not null,
  requirement_text text not null,
  priority text not null default 'should' check (priority in ('must','should','could','excluded')),
  evidence_claim_ids uuid[] not null default '{}',
  status text not null default 'proposed' check (status in ('proposed','accepted','rejected','superseded')),
  created_at timestamptz not null default now()
);

create table if not exists flashcards_os.design_content_groups (
  id uuid primary key default gen_random_uuid(),
  tenant_key text not null default 'angelcare-internal',
  design_id uuid not null references flashcards_os.product_designs(id) on update cascade on delete restrict,
  sort_order integer not null,
  group_name text not null,
  purpose text not null,
  estimated_cards integer not null default 0 check (estimated_cards >= 0),
  progression text not null default '',
  status text not null default 'proposed' check (status in ('proposed','accepted','rejected','superseded')),
  created_at timestamptz not null default now(),
  unique (tenant_key, design_id, sort_order)
);

create table if not exists flashcards_os.design_alternatives (
  id uuid primary key default gen_random_uuid(),
  tenant_key text not null default 'angelcare-internal',
  design_id uuid not null references flashcards_os.product_designs(id) on update cascade on delete restrict,
  sort_order integer not null,
  name text not null,
  thesis text not null default '',
  benefits text[] not null default '{}',
  drawbacks text[] not null default '{}',
  card_count_hypothesis integer not null default 0 check (card_count_hypothesis >= 0),
  formats text[] not null default '{}',
  audience_fit integer not null default 0 check (audience_fit between 0 and 100),
  differentiation integer not null default 0 check (differentiation between 0 and 100),
  complexity integer not null default 0 check (complexity between 0 and 100),
  risk integer not null default 0 check (risk between 0 and 100),
  recommendation text not null default '',
  source_run_id uuid null,
  created_at timestamptz not null default now(),
  unique (tenant_key, design_id, sort_order)
);

create table if not exists flashcards_os.design_assumptions (
  id uuid primary key default gen_random_uuid(),
  tenant_key text not null default 'angelcare-internal',
  design_id uuid not null references flashcards_os.product_designs(id) on update cascade on delete restrict,
  assumption text not null,
  impact text not null default '',
  verification_status text not null default 'unverified' check (verification_status in ('unverified','supported','rejected','waived')),
  evidence_claim_ids uuid[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists flashcards_os.design_risks (
  id uuid primary key default gen_random_uuid(),
  tenant_key text not null default 'angelcare-internal',
  design_id uuid not null references flashcards_os.product_designs(id) on update cascade on delete restrict,
  risk_type text not null,
  risk_text text not null,
  likelihood integer not null default 0 check (likelihood between 0 and 100),
  impact integer not null default 0 check (impact between 0 and 100),
  mitigation text not null default '',
  owner_name text null,
  status text not null default 'open' check (status in ('open','mitigated','accepted','closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists flashcards_os.design_decisions (
  id uuid primary key default gen_random_uuid(),
  tenant_key text not null default 'angelcare-internal',
  design_id uuid not null references flashcards_os.product_designs(id) on update cascade on delete restrict,
  label text not null,
  decision_text text not null,
  status text not null default 'pending' check (status in ('pending','approved','rejected','deferred','rework')),
  evidence_claim_ids uuid[] not null default '{}',
  decided_by text null,
  decided_by_name text null,
  decided_at timestamptz null,
  created_at timestamptz not null default now()
);

create table if not exists flashcards_os.design_evidence_links (
  id uuid primary key default gen_random_uuid(),
  tenant_key text not null default 'angelcare-internal',
  design_id uuid not null references flashcards_os.product_designs(id) on update cascade on delete restrict,
  claim_id uuid not null references flashcards_os.evidence_claims(id) on update cascade on delete restrict,
  decision_id uuid null references flashcards_os.design_decisions(id) on update cascade on delete restrict,
  relationship text not null default 'supports' check (relationship in ('supports','contradicts','limits','requires_review')),
  created_at timestamptz not null default now(),
  unique (tenant_key, design_id, claim_id, decision_id, relationship)
);

-- -----------------------------------------------------------------------------
-- Provider/model governance, context firewall, telemetry and reliable job queue
-- -----------------------------------------------------------------------------

create table if not exists flashcards_os.model_profiles (
  id uuid primary key default gen_random_uuid(),
  tenant_key text not null default 'angelcare-internal',
  profile_key text not null,
  label text not null,
  purpose text not null default '',
  primary_model text not null,
  fallback_models text[] not null default '{}',
  temperature numeric(4,3) not null default 0.1 check (temperature between 0 and 2),
  max_output_tokens integer not null default 4000 check (max_output_tokens between 256 and 50000),
  timeout_ms integer not null default 90000 check (timeout_ms between 10000 and 180000),
  retry_limit integer not null default 2 check (retry_limit between 0 and 8),
  cost_ceiling_usd numeric(12,4) not null default 2 check (cost_ceiling_usd >= 0),
  require_structured_output boolean not null default true,
  require_zdr boolean not null default true,
  deny_data_collection boolean not null default true,
  allowed_data_classes text[] not null default '{}',
  status text not null default 'draft' check (status in ('draft','active','disabled','archived')),
  effective_from timestamptz not null default now(),
  effective_to timestamptz null,
  updated_by text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_key, profile_key)
);

create table if not exists flashcards_os.intelligence_recipes (
  id uuid primary key default gen_random_uuid(),
  tenant_key text not null default 'angelcare-internal',
  recipe_key text not null,
  version_no integer not null default 1,
  label text not null,
  task_profile text not null,
  system_instruction text not null,
  input_contract jsonb not null default '{}'::jsonb,
  output_schema jsonb not null default '{}'::jsonb,
  forbidden_actions text[] not null default '{}',
  status text not null default 'draft' check (status in ('draft','review','approved','superseded','archived')),
  created_by text null,
  approved_by text null,
  approved_at timestamptz null,
  created_at timestamptz not null default now(),
  unique (tenant_key, recipe_key, version_no)
);

create table if not exists flashcards_os.context_snapshots (
  id uuid primary key default gen_random_uuid(),
  tenant_key text not null default 'angelcare-internal',
  context_type text not null,
  entity_type text not null,
  entity_id text not null,
  data_class text[] not null default '{}',
  source_hash text not null,
  safe_hash text not null,
  redacted_snapshot jsonb not null default '{}'::jsonb,
  blocked boolean not null default false,
  created_by text null,
  created_at timestamptz not null default now()
);

create table if not exists flashcards_os.intelligence_runs (
  id uuid primary key default gen_random_uuid(),
  tenant_key text not null default 'angelcare-internal',
  run_code text not null,
  task_profile text not null,
  status text not null default 'queued' check (status in ('queued','running','succeeded','failed','cancelled','dead_letter','blocked')),
  provider text not null check (provider in ('tavily','openrouter','internal')),
  entity_type text not null,
  entity_id text not null,
  model_requested text null,
  model_used text null,
  fallback_used boolean not null default false,
  provider_route text null,
  provider_response_id text null,
  input_hash text null,
  output_hash text null,
  context_summary text null,
  output_snapshot jsonb not null default '{}'::jsonb,
  prompt_tokens integer not null default 0,
  completion_tokens integer not null default 0,
  total_tokens integer not null default 0,
  cost_usd numeric(14,6) not null default 0,
  latency_ms integer not null default 0,
  retry_count integer not null default 0,
  error_code text null,
  error_message text null,
  created_by text null,
  started_at timestamptz null,
  completed_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_key, run_code)
);

create table if not exists flashcards_os.provider_calls (
  id uuid primary key default gen_random_uuid(),
  tenant_key text not null default 'angelcare-internal',
  intelligence_run_id uuid not null references flashcards_os.intelligence_runs(id) on update cascade on delete restrict,
  provider text not null check (provider in ('tavily','openrouter')),
  operation text not null,
  request_model text null,
  response_model text null,
  provider_route text null,
  provider_response_id text null,
  status text not null check (status in ('succeeded','failed','blocked')),
  latency_ms integer not null default 0,
  request_metadata jsonb not null default '{}'::jsonb,
  response_metadata jsonb not null default '{}'::jsonb,
  usage_payload jsonb not null default '{}'::jsonb,
  error_code text null,
  error_message text null,
  created_at timestamptz not null default now()
);

create table if not exists flashcards_os.usage_ledger (
  id uuid primary key default gen_random_uuid(),
  tenant_key text not null default 'angelcare-internal',
  provider text not null check (provider in ('tavily','openrouter')),
  operation text not null,
  intelligence_run_id uuid null references flashcards_os.intelligence_runs(id) on update cascade on delete restrict,
  mission_id uuid null references flashcards_os.research_missions(id) on update cascade on delete restrict,
  credits numeric(12,3) not null default 0,
  prompt_tokens integer not null default 0,
  completion_tokens integer not null default 0,
  total_tokens integer not null default 0,
  cost_usd numeric(14,6) not null default 0,
  model text null,
  created_at timestamptz not null default now()
);

create table if not exists flashcards_os.redaction_events (
  id uuid primary key default gen_random_uuid(),
  tenant_key text not null default 'angelcare-internal',
  intelligence_run_id uuid null references flashcards_os.intelligence_runs(id) on update cascade on delete restrict,
  context_snapshot_id uuid null references flashcards_os.context_snapshots(id) on update cascade on delete restrict,
  category text not null,
  match_count integer not null default 0 check (match_count >= 0),
  blocked boolean not null default false,
  description text not null,
  created_at timestamptz not null default now()
);

create table if not exists flashcards_os.provider_health_events (
  id uuid primary key default gen_random_uuid(),
  tenant_key text not null default 'angelcare-internal',
  provider text not null check (provider in ('tavily','openrouter')),
  status text not null check (status in ('success','failure')),
  operation text not null,
  latency_ms integer not null default 0,
  error_message text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists flashcards_os.intelligence_jobs (
  id uuid primary key default gen_random_uuid(),
  tenant_key text not null default 'angelcare-internal',
  idempotency_key text not null,
  job_type text not null check (job_type in ('mission_acquisition','source_claim_extraction','research_synthesis','opportunity_architecture','product_design_architecture')),
  entity_type text not null,
  entity_id text not null,
  status text not null default 'queued' check (status in ('queued','running','succeeded','failed','cancelled','dead_letter','blocked')),
  priority integer not null default 50 check (priority between 0 and 100),
  attempts integer not null default 0 check (attempts >= 0),
  max_attempts integer not null default 3 check (max_attempts between 0 and 8),
  payload jsonb not null default '{}'::jsonb,
  result jsonb not null default '{}'::jsonb,
  error_code text null,
  last_error text null,
  available_at timestamptz not null default now(),
  locked_at timestamptz null,
  locked_by text null,
  started_at timestamptz null,
  completed_at timestamptz null,
  created_by text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_key, idempotency_key)
);

-- -----------------------------------------------------------------------------
-- Indexes and updated-at behaviour
-- -----------------------------------------------------------------------------

create index if not exists idx_fc_research_missions_status on flashcards_os.research_missions(tenant_key, status, updated_at desc);
create index if not exists idx_fc_research_queries_mission on flashcards_os.research_queries(tenant_key, mission_id, query_order);
create index if not exists idx_fc_research_sources_mission on flashcards_os.research_sources(tenant_key, mission_id, review_status, quality_score desc);
create index if not exists idx_fc_research_sources_hash on flashcards_os.research_sources(tenant_key, content_hash);
create index if not exists idx_fc_evidence_claims_mission on flashcards_os.evidence_claims(tenant_key, mission_id, review_status);
create index if not exists idx_fc_claim_links_claim on flashcards_os.claim_source_links(tenant_key, claim_id);
create index if not exists idx_fc_claim_links_source on flashcards_os.claim_source_links(tenant_key, source_id);
create index if not exists idx_fc_opportunities_status on flashcards_os.product_opportunities(tenant_key, status, updated_at desc);
create index if not exists idx_fc_designs_status on flashcards_os.product_designs(tenant_key, status, updated_at desc);
create index if not exists idx_fc_intelligence_runs_status on flashcards_os.intelligence_runs(tenant_key, status, created_at desc);
create index if not exists idx_fc_usage_ledger_created on flashcards_os.usage_ledger(tenant_key, created_at desc);
create index if not exists idx_fc_jobs_claim on flashcards_os.intelligence_jobs(tenant_key, status, available_at, priority desc, created_at);
create index if not exists idx_fc_provider_health on flashcards_os.provider_health_events(tenant_key, provider, created_at desc);

-- UMZ1 defines flashcards_os.touch_updated_at().
do $$
declare table_name text;
begin
  foreach table_name in array array[
    'research_missions','research_queries','research_sources','evidence_claims','research_syntheses','intelligence_signals',
    'product_opportunities','product_designs','design_risks','model_profiles','intelligence_runs','intelligence_jobs'
  ]
  loop
    execute format('drop trigger if exists trg_fc_%I_updated_at on flashcards_os.%I', table_name, table_name);
    execute format('create trigger trg_fc_%I_updated_at before update on flashcards_os.%I for each row execute function flashcards_os.touch_updated_at()', table_name, table_name);
  end loop;
end $$;

create or replace function flashcards_os.prevent_approved_intelligence_delete()
returns trigger language plpgsql as $$
begin
  if (tg_table_name = 'research_syntheses' and old.status = 'approved')
     or (tg_table_name = 'product_designs' and old.status in ('approved','ready_for_umz3')) then
    raise exception 'Approved research syntheses and Product Designs are immutable and cannot be deleted';
  end if;
  return old;
end;
$$;

drop trigger if exists trg_fc_research_syntheses_immutable on flashcards_os.research_syntheses;
create trigger trg_fc_research_syntheses_immutable before delete on flashcards_os.research_syntheses for each row execute function flashcards_os.prevent_approved_intelligence_delete();
drop trigger if exists trg_fc_product_designs_immutable on flashcards_os.product_designs;
create trigger trg_fc_product_designs_immutable before delete on flashcards_os.product_designs for each row execute function flashcards_os.prevent_approved_intelligence_delete();

-- Atomic SKIP LOCKED claim. Service-role only.
create or replace function public.fc_os_claim_intelligence_job(worker_id_input text)
returns setof flashcards_os.intelligence_jobs
language plpgsql
security definer
set search_path = flashcards_os, public
as $$
declare claimed_id uuid;
begin
  select id into claimed_id
  from flashcards_os.intelligence_jobs
  where tenant_key = 'angelcare-internal'
    and status = 'queued'
    and available_at <= now()
  order by priority desc, created_at asc
  for update skip locked
  limit 1;

  if claimed_id is null then
    return;
  end if;

  return query
  update flashcards_os.intelligence_jobs
  set status = 'running',
      attempts = attempts + 1,
      locked_at = now(),
      locked_by = worker_id_input,
      started_at = coalesce(started_at, now()),
      updated_at = now()
  where id = claimed_id
  returning *;
end;
$$;
revoke all on function public.fc_os_claim_intelligence_job(text) from public, anon, authenticated;
grant execute on function public.fc_os_claim_intelligence_job(text) to service_role;

-- -----------------------------------------------------------------------------
-- RLS and trusted compatibility views
-- -----------------------------------------------------------------------------

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'research_missions','research_queries','research_runs','research_sources','source_snapshots','source_duplicates',
    'evidence_claims','claim_source_links','evidence_reviews','research_syntheses','intelligence_signals',
    'product_opportunities','opportunity_scores','opportunity_decisions','product_designs','product_design_versions',
    'design_audiences','design_requirements','design_content_groups','design_alternatives','design_assumptions','design_risks',
    'design_decisions','design_evidence_links','model_profiles','intelligence_recipes','context_snapshots',
    'intelligence_runs','provider_calls','usage_ledger','redaction_events','provider_health_events','intelligence_jobs'
  ]
  loop
    execute format('alter table flashcards_os.%I enable row level security', table_name);
    execute format('drop policy if exists tenant_read on flashcards_os.%I', table_name);
    execute format('create policy tenant_read on flashcards_os.%I for select to authenticated using (tenant_key = coalesce(auth.jwt()->>''tenant_key'', ''''))', table_name);
    execute format('grant select on flashcards_os.%I to authenticated', table_name);
    execute format('grant all on flashcards_os.%I to service_role', table_name);
  end loop;
end $$;

create or replace view public.fc_os_research_missions as select * from flashcards_os.research_missions;
create or replace view public.fc_os_research_queries as select * from flashcards_os.research_queries;
create or replace view public.fc_os_research_runs as select * from flashcards_os.research_runs;
create or replace view public.fc_os_research_sources as select * from flashcards_os.research_sources;
create or replace view public.fc_os_source_snapshots as select * from flashcards_os.source_snapshots;
create or replace view public.fc_os_source_duplicates as select * from flashcards_os.source_duplicates;
create or replace view public.fc_os_evidence_claims as select * from flashcards_os.evidence_claims;
create or replace view public.fc_os_claim_source_links as select * from flashcards_os.claim_source_links;
create or replace view public.fc_os_evidence_reviews as select * from flashcards_os.evidence_reviews;
create or replace view public.fc_os_research_syntheses as select * from flashcards_os.research_syntheses;
create or replace view public.fc_os_intelligence_signals as select * from flashcards_os.intelligence_signals;
create or replace view public.fc_os_product_opportunities as select * from flashcards_os.product_opportunities;
create or replace view public.fc_os_opportunity_scores as select * from flashcards_os.opportunity_scores;
create or replace view public.fc_os_opportunity_decisions as select * from flashcards_os.opportunity_decisions;
create or replace view public.fc_os_product_designs as select * from flashcards_os.product_designs;
create or replace view public.fc_os_product_design_versions as select * from flashcards_os.product_design_versions;
create or replace view public.fc_os_design_audiences as select * from flashcards_os.design_audiences;
create or replace view public.fc_os_design_requirements as select * from flashcards_os.design_requirements;
create or replace view public.fc_os_design_content_groups as select * from flashcards_os.design_content_groups;
create or replace view public.fc_os_design_alternatives as select * from flashcards_os.design_alternatives;
create or replace view public.fc_os_design_assumptions as select * from flashcards_os.design_assumptions;
create or replace view public.fc_os_design_risks as select * from flashcards_os.design_risks;
create or replace view public.fc_os_design_decisions as select * from flashcards_os.design_decisions;
create or replace view public.fc_os_design_evidence_links as select * from flashcards_os.design_evidence_links;
create or replace view public.fc_os_model_profiles as select * from flashcards_os.model_profiles;
create or replace view public.fc_os_intelligence_recipes as select * from flashcards_os.intelligence_recipes;
create or replace view public.fc_os_context_snapshots as select * from flashcards_os.context_snapshots;
create or replace view public.fc_os_intelligence_runs as select * from flashcards_os.intelligence_runs;
create or replace view public.fc_os_provider_calls as select * from flashcards_os.provider_calls;
create or replace view public.fc_os_usage_ledger as select * from flashcards_os.usage_ledger;
create or replace view public.fc_os_redaction_events as select * from flashcards_os.redaction_events;
create or replace view public.fc_os_provider_health_events as select * from flashcards_os.provider_health_events;
create or replace view public.fc_os_intelligence_jobs as select * from flashcards_os.intelligence_jobs;

do $$
declare view_name text;
begin
  foreach view_name in array array[
    'research_missions','research_queries','research_runs','research_sources','source_snapshots','source_duplicates',
    'evidence_claims','claim_source_links','evidence_reviews','research_syntheses','intelligence_signals',
    'product_opportunities','opportunity_scores','opportunity_decisions','product_designs','product_design_versions',
    'design_audiences','design_requirements','design_content_groups','design_alternatives','design_assumptions','design_risks',
    'design_decisions','design_evidence_links','model_profiles','intelligence_recipes','context_snapshots',
    'intelligence_runs','provider_calls','usage_ledger','redaction_events','provider_health_events','intelligence_jobs'
  ]
  loop
    execute format('revoke all on public.fc_os_%I from authenticated, anon', view_name);
    execute format('grant all on public.fc_os_%I to service_role', view_name);
  end loop;
end $$;

-- -----------------------------------------------------------------------------
-- Model profiles, recipes, doctrine and permission catalogue
-- -----------------------------------------------------------------------------

insert into flashcards_os.model_profiles (
  tenant_key,profile_key,label,purpose,primary_model,fallback_models,temperature,max_output_tokens,timeout_ms,retry_limit,cost_ceiling_usd,
  require_structured_output,require_zdr,deny_data_collection,allowed_data_classes,status
) values
('angelcare-internal','external_research_synthesis','External Research Synthesis','Synthèse structurée des preuves Tavily après arbitrage.','openai/gpt-5-mini',array['anthropic/claude-sonnet-4.5','google/gemini-2.5-pro'],0.15,7000,90000,2,3,true,true,true,array['public_evidence','portfolio_aggregate'],'active'),
('angelcare-internal','evidence_claim_extraction','Evidence Claim Extraction','Extraction de claims, limites et signaux de contradiction.','openai/gpt-5-mini',array['google/gemini-2.5-flash'],0,4200,75000,2,1.5,true,true,true,array['public_evidence'],'active'),
('angelcare-internal','portfolio_gap_analysis','Portfolio Gap Analysis','Analyse interne des trous de couverture et duplications.','openai/gpt-5-mini',array['anthropic/claude-sonnet-4.5'],0.1,5000,90000,2,2.5,true,true,true,array['portfolio_aggregate','collection_metadata'],'active'),
('angelcare-internal','product_opportunity_architect','Product Opportunity Architect','Transformation de signaux et preuves en opportunité produit.','anthropic/claude-sonnet-4.5',array['openai/gpt-5-mini','google/gemini-2.5-pro'],0.2,6000,100000,2,4,true,true,true,array['public_evidence','portfolio_aggregate','collection_metadata'],'active'),
('angelcare-internal','product_concept_designer','Product Concept Designer','Architecture complète du Product Design avant UMZ3.','anthropic/claude-sonnet-4.5',array['openai/gpt-5-mini','google/gemini-2.5-pro'],0.25,12000,120000,2,8,true,true,true,array['public_evidence','portfolio_aggregate','collection_metadata','approved_product_decisions'],'active'),
('angelcare-internal','product_design_critic','Product Design Critic','Revue des contradictions, risques et trade-offs.','openai/gpt-5-mini',array['anthropic/claude-sonnet-4.5'],0.1,6500,100000,2,4,true,true,true,array['public_evidence','portfolio_aggregate','approved_product_decisions'],'active')
on conflict (tenant_key,profile_key) do update set
  label=excluded.label,purpose=excluded.purpose,primary_model=excluded.primary_model,fallback_models=excluded.fallback_models,
  temperature=excluded.temperature,max_output_tokens=excluded.max_output_tokens,timeout_ms=excluded.timeout_ms,
  retry_limit=excluded.retry_limit,cost_ceiling_usd=excluded.cost_ceiling_usd,require_structured_output=excluded.require_structured_output,
  require_zdr=excluded.require_zdr,deny_data_collection=excluded.deny_data_collection,allowed_data_classes=excluded.allowed_data_classes,
  status=excluded.status,updated_at=now();

insert into flashcards_os.intelligence_recipes (
  tenant_key,recipe_key,version_no,label,task_profile,system_instruction,input_contract,output_schema,forbidden_actions,status,created_by,approved_by,approved_at
) values
('angelcare-internal','evidence-claim-extraction',1,'Extraction gouvernée des claims','evidence_claim_extraction',
 'Extraire seulement les claims soutenus par la source et distinguer direct/inféré.',
 '{"requires":["mission","source"]}'::jsonb,'{"contract":"EVIDENCE_EXTRACTION_SCHEMA"}'::jsonb,
 array['generate_product_asset','generate_pdf','generate_video','issue_financial_document','contact_customer'],'approved','UMZ2 migration','UMZ2 contract',now()),
('angelcare-internal','research-synthesis',1,'Synthèse gouvernée de recherche','external_research_synthesis',
 'Synthétiser uniquement les sources acceptées et lier chaque conclusion aux claims.',
 '{"requires":["mission","approvedSources","claims"]}'::jsonb,'{"contract":"RESEARCH_SYNTHESIS_SCHEMA"}'::jsonb,
 array['invent_source','hide_contradiction','generate_product_asset','generate_production_command'],'approved','UMZ2 migration','UMZ2 contract',now()),
('angelcare-internal','product-opportunity',1,'Architecture d’opportunité produit','product_opportunity_architect',
 'Transformer une synthèse gouvernée en hypothèse d’opportunité explicable.',
 '{"requires":["mission","synthesis","claims"]}'::jsonb,'{"contract":"OPPORTUNITY_ARCHITECTURE_SCHEMA"}'::jsonb,
 array['publish_sellable','set_authoritative_price','generate_product_asset'],'approved','UMZ2 migration','UMZ2 contract',now()),
('angelcare-internal','product-concept-design',1,'Architecture Product Design','product_concept_designer',
 'Constituer le dossier de design produit complet sans produire de livrable créatif ni la commande finale UMZ3.',
 '{"requires":["opportunity","designSeed","evidenceClaims","doctrine"]}'::jsonb,'{"contract":"PRODUCT_DESIGN_SCHEMA"}'::jsonb,
 array['generate_pdf','generate_video','generate_image','generate_artwork','generate_final_production_command','publish_product'],'approved','UMZ2 migration','UMZ2 contract',now())
on conflict (tenant_key,recipe_key,version_no) do nothing;

insert into flashcards_os.configuration (tenant_key,config_key,config_group,label,value,description,status)
values
('angelcare-internal','intelligence.external_pathway','intelligence','External intelligence pathway','{"sequence":["Tavily acquisition","Evidence governance","OpenRouter synthesis","Human decision"]}'::jsonb,'Tavily acquires public evidence; OpenRouter reasons only after evidence governance.','active'),
('angelcare-internal','intelligence.internal_pathway','intelligence','Internal intelligence pathway','{"sequence":["Minimum internal context","Redaction firewall","OpenRouter reasoning","Human decision"]}'::jsonb,'Purely internal tasks must not invoke Tavily.','active'),
('angelcare-internal','intelligence.creative_boundary','intelligence','UMZ2 creative boundary','{"assetGeneration":false,"finalProductionCommand":false,"handoff":"UMZ3"}'::jsonb,'UMZ2 designs products only. It cannot create final product assets or the final external production command.','active'),
('angelcare-internal','intelligence.maximum_retries','intelligence','Maximum bounded retries','3'::jsonb,'Provider and worker retries are bounded and auditable.','active')
on conflict (config_key) do update set value=excluded.value,description=excluded.description,status=excluded.status,updated_at=now();

insert into flashcards_os.permission_catalogue (tenant_key,permission_key,label,domain,risk_level,description)
values
('angelcare-internal','flashcards_os.view_intelligence','Voir Intelligence','intelligence','normal','Accès aux surfaces Intelligence Flashcards OS.'),
('angelcare-internal','flashcards_os.create_research','Créer une mission recherche','intelligence','medium','Créer et modifier une mission avant approbation.'),
('angelcare-internal','flashcards_os.approve_research','Approuver une mission recherche','intelligence','high','Autoriser la dépense et l’acquisition externe.'),
('angelcare-internal','flashcards_os.execute_research','Exécuter une mission recherche','intelligence','high','Placer une mission approuvée dans la file Tavily.'),
('angelcare-internal','flashcards_os.review_evidence','Arbitrer les preuves','intelligence','high','Accepter, rejeter ou demander vérification d’une source.'),
('angelcare-internal','flashcards_os.run_synthesis','Lancer une synthèse','intelligence','high','Envoyer uniquement les preuves acceptées à OpenRouter.'),
('angelcare-internal','flashcards_os.manage_opportunities','Gérer les opportunités produit','product_design','medium','Créer, qualifier et décider les opportunités.'),
('angelcare-internal','flashcards_os.manage_product_design','Gérer Product Design','product_design','high','Créer et structurer les dossiers Product Design.'),
('angelcare-internal','flashcards_os.approve_product_design','Approuver Product Design','product_design','critical','Approuver un dossier pour handoff UMZ3.'),
('angelcare-internal','flashcards_os.manage_model_profiles','Gérer les profils modèles','intelligence_control','critical','Changer modèles, fallbacks, confidentialité et coûts.'),
('angelcare-internal','flashcards_os.view_intelligence_costs','Voir les coûts intelligence','intelligence_control','medium','Consulter Tavily, tokens, coûts et budgets.'),
('angelcare-internal','flashcards_os.process_intelligence_jobs','Traiter la file intelligence','intelligence_control','critical','Exécuter le worker gouverné.'),
('angelcare-internal','flashcards_os.audit_intelligence','Auditer Intelligence','audit','high','Lire la lignée des runs, providers, redactions et décisions.'),
('angelcare-internal','flashcards_os.admin_intelligence','Administrer Intelligence','intelligence_control','critical','Autorité administrative complète UMZ2.')
on conflict (permission_key) do update set label=excluded.label,domain=excluded.domain,risk_level=excluded.risk_level,description=excluded.description;

-- Controlled internal signals are facts derived from UMZ1 metadata, never fabricated market claims.
insert into flashcards_os.intelligence_signals (tenant_key,id,signal_type,title,detail,strength,source_type,source_entity_id,status,metadata)
values
('angelcare-internal','00000000-0000-4000-8000-000000000201','portfolio_content_gap','Registres carte par carte encore non structurés','Le catalogue historique fournit titres, quantités et prix mais pas le contenu carte canonique. Prioriser la structuration sans inventer les cartes.',96,'internal','portfolio-flashcards','new','{"origin":"UMZ1 canonical metadata"}'::jsonb),
('angelcare-internal','00000000-0000-4000-8000-000000000202','legacy_integrity_gap','Quantités historiques à confirmer','Certaines lignes héritées portent N/A ou des incohérences; elles doivent rester dans l’arbitrage avant exploitation intelligence.',82,'internal','legacy-catalogue-2022','new','{"origin":"UMZ1 import issues"}'::jsonb),
('angelcare-internal','00000000-0000-4000-8000-000000000203','quality_signal','Anomalies catalogue affectant la confiance produit','Les doublons, numérotations et taxonomies historiques restent visibles et ne sont pas corrigés silencieusement.',88,'internal','legacy-intake-control','reviewed','{"origin":"UMZ1 integrity ledger"}'::jsonb)
on conflict (id) do update set title=excluded.title,detail=excluded.detail,strength=excluded.strength,status=excluded.status,updated_at=now();

commit;
