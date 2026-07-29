-- ANGELCARE MARKET OS · Content Command Center
-- AI Research Runtime Control — Tavily → AC Capital sources → OpenRouter → internal Content Command materialization.
-- Additive only. No external communication or submission is authorized by this migration.
begin;

create extension if not exists pgcrypto;

create table if not exists public.market_content_research_provider_policies (
  id uuid primary key default gen_random_uuid(),
  provider_key text not null unique check (provider_key in ('tavily','openrouter','searxng')),
  display_name text not null,
  provider_role text not null check (provider_role in ('search_primary','search_fallback','analysis')),
  status text not null default 'not_configured' check (status in ('active','paused','not_configured','degraded')),
  enabled boolean not null default false,
  configuration jsonb not null default '{}'::jsonb,
  limits jsonb not null default '{}'::jsonb,
  health jsonb not null default '{}'::jsonb,
  version_number integer not null default 1,
  updated_by uuid,
  updated_by_name text,
  last_tested_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.market_content_research_agents (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  agent_type text not null,
  purpose text not null,
  owner_name text,
  status text not null default 'draft' check (status in ('draft','active','paused','retired')),
  priority text not null default 'normal' check (priority in ('critical','executive','high','normal','low','background')),
  workspace_scopes text[] not null default '{}',
  content_families text[] not null default '{}',
  services text[] not null default '{}',
  audiences text[] not null default '{}',
  cities text[] not null default '{}',
  languages text[] not null default '{fr}',
  topics text[] not null default '{}',
  excluded_topics text[] not null default '{}',
  provider_policy jsonb not null default '{}'::jsonb,
  schedule_policy jsonb not null default '{}'::jsonb,
  quota_policy jsonb not null default '{}'::jsonb,
  research_policy jsonb not null default '{}'::jsonb,
  analysis_policy jsonb not null default '{}'::jsonb,
  materialization_policy jsonb not null default '{}'::jsonb,
  approval_boundary text not null default 'external_only' check (approval_boundary = 'external_only'),
  policy_version integer not null default 1,
  last_run_at timestamptz,
  next_run_at timestamptz,
  created_by uuid,
  created_by_name text,
  updated_by uuid,
  updated_by_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists market_content_research_agents_status_idx on public.market_content_research_agents(status,priority,updated_at desc);
create index if not exists market_content_research_agents_due_idx on public.market_content_research_agents(status,next_run_at) where next_run_at is not null;

create table if not exists public.market_content_research_agent_versions (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.market_content_research_agents(id) on delete cascade,
  version_number integer not null,
  policy_snapshot jsonb not null,
  change_reason text not null,
  created_by uuid,
  created_by_name text,
  created_at timestamptz not null default now(),
  unique(agent_id,version_number)
);

create table if not exists public.market_content_research_runs (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid references public.market_content_research_agents(id) on delete set null,
  agent_code text not null,
  research_command text not null,
  objective text not null,
  query text not null,
  status text not null default 'queued' check (status in (
    'queued','searching_tavily','searching_searxng_fallback','sources_normalized','sources_persisted',
    'analyzing_openrouter','validating_findings','materializing_internal','completed',
    'completed_without_opportunities','partially_completed','blocked_no_search_provider',
    'failed_source_persistence','failed_analysis_provider','failed_schema_validation','failed','cancelled'
  )),
  priority text not null default 'normal',
  trigger_type text not null default 'manual',
  provider_stage text not null default 'queued',
  requested_by uuid,
  requested_by_name text,
  override_policy jsonb not null default '{}'::jsonb,
  search_provider text,
  analysis_provider text,
  requested_model text,
  resolved_model text,
  search_request_id text,
  search_credits numeric(12,4) not null default 0,
  search_result_count integer not null default 0,
  accepted_source_count integer not null default 0,
  finding_count integer not null default 0,
  signal_count integer not null default 0,
  internal_action_count integer not null default 0,
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  latency_ms integer not null default 0,
  result_summary text,
  materialization_result jsonb not null default '{}'::jsonb,
  error_code text,
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists market_content_research_runs_state_idx on public.market_content_research_runs(status,created_at desc);
create index if not exists market_content_research_runs_agent_idx on public.market_content_research_runs(agent_id,created_at desc);

create table if not exists public.market_content_research_run_events (
  id bigserial primary key,
  run_id uuid not null references public.market_content_research_runs(id) on delete cascade,
  event_type text not null,
  stage text not null,
  message text not null,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists market_content_research_run_events_run_idx on public.market_content_research_run_events(run_id,created_at);

create table if not exists public.market_content_research_usage_ledger (
  id bigserial primary key,
  provider_key text not null,
  agent_id uuid references public.market_content_research_agents(id) on delete set null,
  run_id uuid references public.market_content_research_runs(id) on delete set null,
  metric_type text not null,
  quantity numeric(18,4) not null default 0,
  unit text not null,
  period_key text not null,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists market_content_research_usage_period_idx on public.market_content_research_usage_ledger(provider_key,period_key,metric_type);
create index if not exists market_content_research_usage_agent_idx on public.market_content_research_usage_ledger(agent_id,created_at desc);

create table if not exists public.market_content_research_overrides (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.market_content_research_agents(id) on delete cascade,
  name text not null,
  override_policy jsonb not null,
  status text not null default 'scheduled' check (status in ('draft','scheduled','active','expired','cancelled')),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  reason text not null,
  created_by uuid,
  created_by_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create table if not exists public.market_content_research_alerts (
  id uuid primary key default gen_random_uuid(),
  provider_key text,
  agent_id uuid references public.market_content_research_agents(id) on delete set null,
  run_id uuid references public.market_content_research_runs(id) on delete set null,
  alert_type text not null,
  severity text not null default 'warning' check (severity in ('info','warning','high','critical')),
  title text not null,
  message text not null,
  status text not null default 'open' check (status in ('open','acknowledged','resolved','dismissed')),
  detail jsonb not null default '{}'::jsonb,
  acknowledged_by uuid,
  acknowledged_by_name text,
  acknowledged_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists market_content_research_alerts_state_idx on public.market_content_research_alerts(status,severity,created_at desc);

create table if not exists public.ac_capital_public_source_registry (
  id uuid primary key default gen_random_uuid(),
  canonical_url text not null,
  normalized_url text not null,
  title text not null,
  publisher text,
  published_at timestamptz,
  retrieved_at timestamptz not null default now(),
  research_query text not null default '',
  snippet text not null default '',
  content_excerpt text not null default '',
  source_provider text not null,
  provider_rank integer,
  origin_module text not null default 'market_os_content_command',
  origin_workspace text not null default 'ai_director_research_control',
  research_run_id uuid references public.market_content_research_runs(id) on delete set null,
  url_hash text not null unique,
  content_hash text not null,
  language text,
  country text,
  source_type text not null default 'public_web',
  credibility_state text not null default 'unreviewed',
  freshness_state text not null default 'current_at_retrieval',
  rights_state text not null default 'reference_only',
  raw_metadata jsonb not null default '{}'::jsonb,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);
create index if not exists ac_capital_public_source_registry_origin_idx on public.ac_capital_public_source_registry(origin_module,origin_workspace,last_seen_at desc);
create index if not exists ac_capital_public_source_registry_content_hash_idx on public.ac_capital_public_source_registry(content_hash);

create table if not exists public.market_content_research_findings (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.market_content_research_runs(id) on delete cascade,
  agent_id uuid references public.market_content_research_agents(id) on delete set null,
  finding_type text not null check (finding_type in (
    'signal','content_opportunity','communication_risk','editorial_window','content_gap',
    'claim_verification','source_integrity','creative_reference','evidence_gap','publication_readiness'
  )),
  title text not null,
  description text not null,
  evidence_summary text not null,
  source_ids uuid[] not null default '{}',
  services text[] not null default '{}',
  audiences text[] not null default '{}',
  cities text[] not null default '{}',
  channels text[] not null default '{}',
  relevance_score integer not null default 0 check (relevance_score between 0 and 100),
  business_fit_score integer not null default 0 check (business_fit_score between 0 and 100),
  urgency_score integer not null default 0 check (urgency_score between 0 and 100),
  evidence_confidence integer not null default 0 check (evidence_confidence between 0 and 100),
  combined_score integer not null default 0 check (combined_score between 0 and 100),
  recommended_internal_action text not null default '',
  limitations text[] not null default '{}',
  unknowns text[] not null default '{}',
  status text not null default 'detected' check (status in ('detected','evidence_backed','qualified','materialized','rejected','superseded')),
  materialized_signal_id uuid references public.market_content_signals(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists market_content_research_findings_run_idx on public.market_content_research_findings(run_id,combined_score desc);
create index if not exists market_content_research_findings_type_idx on public.market_content_research_findings(finding_type,status,created_at desc);

create table if not exists public.market_content_research_audit (
  id bigserial primary key,
  actor_id uuid,
  actor_name text not null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  before_state jsonb,
  after_state jsonb,
  reason text,
  created_at timestamptz not null default now()
);

insert into public.market_content_research_provider_policies(provider_key,display_name,provider_role,status,enabled,configuration,limits,health)
values
  ('tavily','Tavily Search','search_primary','active',true,
    '{"searchDepth":"basic","maxResults":10,"includeAnswer":false,"includeRawContent":false,"country":"morocco","timeRange":"month"}'::jsonb,
    '{"maxResultsPerCall":10,"maxRequestsPerDay":40,"maxRequestsPerMonth":800,"warningThresholdPercent":80,"hardStopPercent":100}'::jsonb,
    '{"credentialState":"server_env","lastOutcome":"not_tested"}'::jsonb),
  ('searxng','SearXNG','search_fallback','not_configured',false,
    '{"routing":"disabled","reason":"Docker/server installation deferred"}'::jsonb,
    '{"maxRequestsPerDay":0,"maxRequestsPerMonth":0}'::jsonb,
    '{"credentialState":"not_required","lastOutcome":"not_configured"}'::jsonb),
  ('openrouter','OpenRouter Free Router','analysis','active',true,
    '{"model":"openrouter/free","strictJson":true,"evidenceCitationRequired":true,"recordResolvedModel":true}'::jsonb,
    '{"maxRequestsPerDay":35,"maxRequestsPerMonth":700,"maxOutputTokens":5000,"warningThresholdPercent":80,"hardStopPercent":100}'::jsonb,
    '{"credentialState":"server_env","lastOutcome":"not_tested"}'::jsonb)
on conflict(provider_key) do update set
  display_name=excluded.display_name,
  provider_role=excluded.provider_role,
  updated_at=now();

insert into public.market_content_research_agents(
  code,name,agent_type,purpose,status,priority,workspace_scopes,content_families,services,audiences,cities,languages,topics,excluded_topics,
  provider_policy,schedule_policy,quota_policy,research_policy,analysis_policy,materialization_policy,approval_boundary
)
values
  ('OBSERVATORY_INTELLIGENCE','Agent Intelligence Observatoire','observatory_intelligence',
   'Détecter des signaux publics, tendances, fenêtres éditoriales, risques de communication et opportunités de contenu utiles à ANGELCARE.',
   'active','executive','{signals,strategies,calendar}','{editorial,intelligence}','{home_service,kindergarten_preschool,academy,hospitality,corporates}','{families,parents,schools,hotels,corporates,partners}','{Rabat,Casablanca,Kénitra,Témara,Salé,Tanger,Fès,Marrakech,Agadir}','{fr}',
   '{tendances enfance,confiance parentale,communication de services,actualités sectorielles}','{prospection commerciale,lead generation,investor targeting}',
   '{"searchPrimary":"tavily","searchFallback":"disabled","analysisProvider":"openrouter","sourceAuthority":"ac_capital"}',
   '{"frequency":"daily","timezone":"Africa/Casablanca","hour":8,"minute":30,"skipWhenNoMeaningfulChange":true,"quietHoursStart":"21:00","quietHoursEnd":"07:00"}',
   '{"maxSearchCallsPerDay":6,"maxSearchCallsPerMonth":120,"maxAnalysesPerDay":4,"maxAnalysesPerMonth":80}',
   '{"defaultQuery":"actualités tendances enfance familles crèches garde à domicile formation hôtellerie entreprises Maroc","searchDepth":"basic","maxResults":10,"timeRange":"month","country":"morocco"}',
   '{"model":"openrouter/free","maxSources":10,"maxSourceCharacters":6000,"maxOutputTokens":5000,"schemaRepairAttempts":1,"minimumEvidenceConfidence":65,"minimumRelevance":70,"minimumBusinessFit":70,"minimumOpportunityScore":72}',
   '{"createCanonicalSources":true,"createSignals":true,"createContentOpportunities":true,"createStrategicCandidates":true,"createEditorialSuggestions":true,"createInternalTasks":true,"alertCommandement":true}',
   'external_only'),
  ('STRATEGIC_RESEARCH','Agent Recherche Stratégique','strategic_research',
   'Enrichir les scénarios de Fabrique stratégique, tester les hypothèses et produire des constats publics traçables.',
   'active','high','{strategies}','{strategy,intelligence}','{}','{}','{Morocco}','{fr,en}','{stratégie de contenu,positionnement,contexte public}','{sales pipeline,capital opportunity}',
   '{"searchPrimary":"tavily","analysisProvider":"openrouter","sourceAuthority":"ac_capital"}',
   '{"frequency":"weekly","timezone":"Africa/Casablanca","hour":9,"minute":0,"skipWhenNoMeaningfulChange":true}',
   '{"maxSearchCallsPerDay":3,"maxSearchCallsPerMonth":40,"maxAnalysesPerDay":2,"maxAnalysesPerMonth":30}',
   '{"searchDepth":"basic","maxResults":10,"timeRange":"month","country":"morocco"}',
   '{"model":"openrouter/free","maxSources":10,"maxSourceCharacters":7000,"maxOutputTokens":5000,"schemaRepairAttempts":1,"minimumEvidenceConfidence":70,"minimumRelevance":72,"minimumBusinessFit":72,"minimumOpportunityScore":75}',
   '{"createCanonicalSources":true,"createSignals":true,"createContentOpportunities":true,"createStrategicCandidates":true,"createInternalTasks":true,"alertCommandement":true}',
   'external_only'),
  ('BRIEF_ENRICHMENT','Agent Enrichissement Brief','brief_enrichment',
   'Compléter le contexte public d’un brief, identifier les informations manquantes et préparer des suggestions sourcées sans modifier ni approuver le brief.',
   'active','normal','{briefs}','{briefing}','{}','{}','{Morocco}','{fr,en,ar}','{audience,contexte,besoin de communication}','{prospect list,outreach list}',
   '{"searchPrimary":"tavily","analysisProvider":"openrouter","sourceAuthority":"ac_capital"}',
   '{"frequency":"manual","timezone":"Africa/Casablanca"}',
   '{"maxSearchCallsPerDay":5,"maxSearchCallsPerMonth":80,"maxAnalysesPerDay":4,"maxAnalysesPerMonth":60}',
   '{"searchDepth":"basic","maxResults":8,"timeRange":"month","country":"morocco"}',
   '{"model":"openrouter/free","maxSources":8,"maxSourceCharacters":6000,"maxOutputTokens":4000,"schemaRepairAttempts":1,"minimumEvidenceConfidence":65,"minimumRelevance":65,"minimumBusinessFit":65,"minimumOpportunityScore":72}',
   '{"createCanonicalSources":true,"createSignals":false,"createContentOpportunities":false,"createBriefEnrichment":true,"createInternalTasks":true,"alertCommandement":false}',
   'external_only'),
  ('EDITORIAL_INTELLIGENCE','Agent Intelligence Éditoriale','editorial_intelligence',
   'Détecter thèmes, lacunes, fenêtres de publication et besoins de rafraîchissement pour le Planning éditorial.',
   'active','high','{calendar,strategies}','{editorial,planning}','{}','{}','{Morocco}','{fr}','{saisonnalité,calendrier éditorial,sujets émergents}','{commercial prospecting}',
   '{"searchPrimary":"tavily","analysisProvider":"openrouter","sourceAuthority":"ac_capital"}',
   '{"frequency":"weekdays","timezone":"Africa/Casablanca","hour":8,"minute":0,"skipWhenNoMeaningfulChange":true}',
   '{"maxSearchCallsPerDay":4,"maxSearchCallsPerMonth":90,"maxAnalysesPerDay":3,"maxAnalysesPerMonth":60}',
   '{"searchDepth":"basic","maxResults":10,"timeRange":"week","country":"morocco"}',
   '{"model":"openrouter/free","maxSources":10,"maxSourceCharacters":5500,"maxOutputTokens":4500,"schemaRepairAttempts":1,"minimumEvidenceConfidence":65,"minimumRelevance":70,"minimumBusinessFit":65,"minimumOpportunityScore":70}',
   '{"createCanonicalSources":true,"createSignals":true,"createContentOpportunities":true,"createEditorialSuggestions":true,"createInternalTasks":true,"alertCommandement":true}',
   'external_only'),
  ('BRAND_CLAIMS_RESEARCH','Agent Recherche Marque & Claims','brand_claims_research',
   'Vérifier les faits publics, statistiques, claims et risques de source avant production ou validation.',
   'active','executive','{brand-governance,review,validation}','{brand,claims}','{}','{}','{Morocco}','{fr,en,ar}','{vérification de faits,claims,statistiques,droits}','{automatic brand approval}',
   '{"searchPrimary":"tavily","analysisProvider":"openrouter","sourceAuthority":"ac_capital"}',
   '{"frequency":"manual","timezone":"Africa/Casablanca"}',
   '{"maxSearchCallsPerDay":6,"maxSearchCallsPerMonth":90,"maxAnalysesPerDay":5,"maxAnalysesPerMonth":75}',
   '{"searchDepth":"advanced","maxResults":10,"timeRange":"year","country":"morocco"}',
   '{"model":"openrouter/free","maxSources":10,"maxSourceCharacters":8000,"maxOutputTokens":5000,"schemaRepairAttempts":1,"minimumEvidenceConfidence":75,"minimumRelevance":70,"minimumBusinessFit":60,"minimumOpportunityScore":78}',
   '{"createCanonicalSources":true,"createSignals":true,"createContentOpportunities":false,"createInternalTasks":true,"createReviewObservations":true,"alertCommandement":true}',
   'external_only'),
  ('CREATIVE_RESEARCH','Agent Recherche Créative','creative_research',
   'Préparer des références contextuelles sourcées pour les studios Digital, Print & Terrain et Documentation Corporate.',
   'active','normal','{studio,assets}','{creative,digital,print,corporate_document}','{}','{}','{Morocco}','{fr,en,ar}','{références créatives,contexte culturel,formats}','{copyright copying,rights assumption}',
   '{"searchPrimary":"tavily","analysisProvider":"openrouter","sourceAuthority":"ac_capital"}',
   '{"frequency":"manual","timezone":"Africa/Casablanca"}',
   '{"maxSearchCallsPerDay":5,"maxSearchCallsPerMonth":70,"maxAnalysesPerDay":4,"maxAnalysesPerMonth":50}',
   '{"searchDepth":"basic","maxResults":10,"timeRange":"month","country":"morocco"}',
   '{"model":"openrouter/free","maxSources":10,"maxSourceCharacters":5000,"maxOutputTokens":4000,"schemaRepairAttempts":1,"minimumEvidenceConfidence":60,"minimumRelevance":65,"minimumBusinessFit":65,"minimumOpportunityScore":70}',
   '{"createCanonicalSources":true,"createSignals":false,"createContentOpportunities":false,"createInternalTasks":true,"alertCommandement":false}',
   'external_only'),
  ('SOURCE_INTEGRITY','Agent Intégrité des Sources','source_integrity',
   'Normaliser les URLs, détecter les doublons et sources périmées, et maintenir la provenance canonique AC Capital.',
   'active','high','{source-vault,evidence}','{source_integrity}','{}','{}','{}','{fr,en,ar}','{intégrité,fraîcheur,provenance,déduplication}','{source fabrication}',
   '{"searchPrimary":"tavily","analysisProvider":"openrouter","sourceAuthority":"ac_capital"}',
   '{"frequency":"weekly","timezone":"Africa/Casablanca","hour":7,"minute":30}',
   '{"maxSearchCallsPerDay":2,"maxSearchCallsPerMonth":20,"maxAnalysesPerDay":2,"maxAnalysesPerMonth":20}',
   '{"searchDepth":"basic","maxResults":6,"timeRange":"year"}',
   '{"model":"openrouter/free","maxSources":8,"maxSourceCharacters":5000,"maxOutputTokens":3500,"schemaRepairAttempts":1,"minimumEvidenceConfidence":70,"minimumRelevance":65,"minimumBusinessFit":50,"minimumOpportunityScore":75}',
   '{"createCanonicalSources":true,"createSignals":true,"createContentOpportunities":false,"createInternalTasks":true,"alertCommandement":true}',
   'external_only'),
  ('EVIDENCE_RESEARCH','Agent Recherche de Preuves','evidence_research',
   'Identifier des preuves publiques manquantes ou contradictoires pour Evidence Lab sans accepter les preuves.',
   'active','high','{evidence,review}','{evidence}','{}','{}','{}','{fr,en,ar}','{preuve publique,contradiction,source primaire}','{automatic evidence acceptance}',
   '{"searchPrimary":"tavily","analysisProvider":"openrouter","sourceAuthority":"ac_capital"}',
   '{"frequency":"manual","timezone":"Africa/Casablanca"}',
   '{"maxSearchCallsPerDay":6,"maxSearchCallsPerMonth":80,"maxAnalysesPerDay":5,"maxAnalysesPerMonth":70}',
   '{"searchDepth":"advanced","maxResults":10,"timeRange":"year"}',
   '{"model":"openrouter/free","maxSources":10,"maxSourceCharacters":8000,"maxOutputTokens":5000,"schemaRepairAttempts":1,"minimumEvidenceConfidence":75,"minimumRelevance":70,"minimumBusinessFit":55,"minimumOpportunityScore":78}',
   '{"createCanonicalSources":true,"createSignals":false,"createContentOpportunities":false,"createInternalTasks":true,"createEvidenceRequests":true,"alertCommandement":true}',
   'external_only'),
  ('REVIEW_ASSISTANCE','Agent Assistance Révision','review_assistance',
   'Comparer un contenu à ses sources et produire des observations consultatives pour le réviseur humain.',
   'active','normal','{review}','{review}','{}','{}','{}','{fr,en,ar}','{cohérence source,version,discrepancy}','{automatic review approval,finding closure}',
   '{"searchPrimary":"tavily","analysisProvider":"openrouter","sourceAuthority":"ac_capital"}',
   '{"frequency":"manual","timezone":"Africa/Casablanca"}',
   '{"maxSearchCallsPerDay":5,"maxSearchCallsPerMonth":60,"maxAnalysesPerDay":5,"maxAnalysesPerMonth":60}',
   '{"searchDepth":"basic","maxResults":8,"timeRange":"year"}',
   '{"model":"openrouter/free","maxSources":10,"maxSourceCharacters":7000,"maxOutputTokens":4500,"schemaRepairAttempts":1,"minimumEvidenceConfidence":70,"minimumRelevance":65,"minimumBusinessFit":55,"minimumOpportunityScore":75}',
   '{"createCanonicalSources":true,"createSignals":false,"createContentOpportunities":false,"createInternalTasks":true,"createReviewObservations":true,"alertCommandement":false}',
   'external_only'),
  ('PUBLICATION_READINESS','Agent Readiness Publication','publication_readiness',
   'Vérifier fraîcheur, contexte public, claims et timing avant la libération vers Distribution et Publishing.',
   'active','executive','{validation,distribution,publishing}','{publication_readiness}','{}','{}','{Morocco}','{fr,en,ar}','{fraîcheur,actualité,publication timing,context risk}','{automatic publication,external sending}',
   '{"searchPrimary":"tavily","analysisProvider":"openrouter","sourceAuthority":"ac_capital"}',
   '{"frequency":"manual","timezone":"Africa/Casablanca"}',
   '{"maxSearchCallsPerDay":5,"maxSearchCallsPerMonth":70,"maxAnalysesPerDay":5,"maxAnalysesPerMonth":70}',
   '{"searchDepth":"basic","maxResults":10,"timeRange":"week","country":"morocco"}',
   '{"model":"openrouter/free","maxSources":10,"maxSourceCharacters":6500,"maxOutputTokens":4500,"schemaRepairAttempts":1,"minimumEvidenceConfidence":70,"minimumRelevance":70,"minimumBusinessFit":65,"minimumOpportunityScore":75}',
   '{"createCanonicalSources":true,"createSignals":true,"createContentOpportunities":false,"createInternalTasks":true,"alertCommandement":true}',
   'external_only')
on conflict(code) do update set
  name=excluded.name,
  purpose=excluded.purpose,
  updated_at=now();

-- Activate the first scheduler checkpoint for persisted non-manual agent policies.
-- The runtime calculates all subsequent dates using the configured timezone, hour and cadence.
update public.market_content_research_agents
set next_run_at = now() + interval '15 minutes', updated_at = now()
where status = 'active'
  and coalesce(schedule_policy->>'frequency','manual') <> 'manual'
  and next_run_at is null;

insert into public.market_content_research_agent_versions(agent_id,version_number,policy_snapshot,change_reason)
select id,policy_version,to_jsonb(a),'Constitution initiale Content Command AI Research Runtime Control.'
from public.market_content_research_agents a
on conflict(agent_id,version_number) do nothing;

-- Server-only persistence through protected Next.js APIs. Browser roles do not receive direct table grants.
do $$
declare table_name text;
begin
  foreach table_name in array array[
    'market_content_research_provider_policies','market_content_research_agents','market_content_research_agent_versions',
    'market_content_research_runs','market_content_research_run_events','market_content_research_usage_ledger',
    'market_content_research_overrides','market_content_research_alerts','ac_capital_public_source_registry',
    'market_content_research_findings','market_content_research_audit'
  ] loop
    execute format('alter table public.%I enable row level security',table_name);
    execute format('revoke all on table public.%I from anon, authenticated',table_name);
    execute format('grant all on table public.%I to service_role',table_name);
  end loop;
end$$;

grant usage,select on sequence public.market_content_research_run_events_id_seq,public.market_content_research_usage_ledger_id_seq,public.market_content_research_audit_id_seq to service_role;

comment on table public.ac_capital_public_source_registry is 'Canonical public-source authority shared from AC Capital for Market OS Content Command research. Not a capital-opportunity pipeline.';
comment on table public.market_content_research_agents is 'Content-specific research agents only: Observatoire, strategy, briefs, editorial, claims, creative, sources, evidence, review and publication readiness.';
comment on table public.market_content_research_runs is 'Auditable Tavily → AC Capital source registry → OpenRouter → internal Content Command materialization lifecycle.';
comment on column public.market_content_research_agents.approval_boundary is 'External communication, publication and submission only. Internal research and materialization remain automatic.';

commit;
