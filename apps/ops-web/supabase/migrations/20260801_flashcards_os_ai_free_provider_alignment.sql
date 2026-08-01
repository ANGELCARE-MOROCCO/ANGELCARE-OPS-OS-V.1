begin;

select pg_advisory_xact_lock(84745007);
set local lock_timeout = '5min';
set local statement_timeout = '0';

-- Strict baseline: the intelligence model profile registry must already exist.
do $$
begin
  if to_regclass('flashcards_os.model_profiles') is null then
    raise exception 'Flashcards OS intelligence baseline is missing: flashcards_os.model_profiles';
  end if;
end $$;

-- Runtime doctrine: Tavily has no model. Every reasoning task uses the single
-- OpenRouter free router. The actual model selected by OpenRouter is recorded
-- in intelligence_runs.model_used and is never hidden behind an application
-- fallback list.
insert into flashcards_os.model_profiles (
  tenant_key,profile_key,label,purpose,primary_model,fallback_models,temperature,
  max_output_tokens,timeout_ms,retry_limit,cost_ceiling_usd,
  require_structured_output,require_zdr,deny_data_collection,allowed_data_classes,status
) values
('angelcare-internal','external_research_synthesis','External Research Synthesis','Synthèse structurée des preuves Tavily après arbitrage.','openrouter/free','{}',0.15,7000,90000,2,0,true,false,false,array['public_evidence','portfolio_aggregate'],'active'),
('angelcare-internal','evidence_claim_extraction','Evidence Claim Extraction','Extraction de claims, limites et contradictions depuis les preuves.','openrouter/free','{}',0,4200,75000,2,0,true,false,false,array['public_evidence'],'active'),
('angelcare-internal','portfolio_gap_analysis','Portfolio Gap Analysis','Analyse interne des trous de couverture et duplications.','openrouter/free','{}',0.1,5000,90000,2,0,true,false,false,array['portfolio_aggregate','collection_metadata'],'active'),
('angelcare-internal','product_opportunity_architect','Product Opportunity Architect','Transformation des signaux en opportunités produit explicables.','openrouter/free','{}',0.2,6000,100000,2,0,true,false,false,array['public_evidence','portfolio_aggregate','collection_metadata'],'active'),
('angelcare-internal','product_concept_designer','Product Concept Designer','Architecture du Product Design avant production externe.','openrouter/free','{}',0.25,12000,120000,2,0,true,false,false,array['public_evidence','portfolio_aggregate','collection_metadata','approved_product_decisions'],'active'),
('angelcare-internal','product_design_critic','Product Design Critic','Revue des contradictions, risques et arbitrages produit.','openrouter/free','{}',0.1,6500,100000,2,0,true,false,false,array['public_evidence','portfolio_aggregate','approved_product_decisions'],'active'),
('angelcare-internal','production_command_compiler','Production Command Compiler','Compilation des commandes de production externe sans génération d’actif.','openrouter/free','{}',0.15,14000,120000,2,0,true,false,false,array['approved_product_decisions','collection_metadata','public_evidence'],'active'),
('angelcare-internal','flashcards_solution_composer','Sellable Solution Composer','Composition de solutions B2C/B2B à partir de releases approuvées.','openrouter/free','{}',0.25,18000,150000,2,0,true,false,false,array['approved_product_decisions','collection_metadata','commercial_rules'],'active'),
('angelcare-internal','flashcards_learning_journey_architect','Learning Journey Architect','Architecture détaillée des programmes jour/session.','openrouter/free','{}',0.25,18000,150000,2,0,true,false,false,array['approved_product_decisions','collection_metadata','learning_objectives'],'active'),
('angelcare-internal','commercial_intelligence','Commercial Intelligence','Analyse commerciale interne strictement consultative.','openrouter/free','{}',0.2,6000,120000,2,0,true,false,false,array['commercial_context','approved_product_decisions'],'active'),
('angelcare-internal','experience_advisory','Customer Experience Advisory','Synthèse et recommandations CX strictement consultatives.','openrouter/free','{}',0.15,6000,120000,2,0,true,false,false,array['customer_experience_context','approved_product_decisions'],'active')
on conflict (tenant_key,profile_key) do update set
  label=excluded.label,
  purpose=excluded.purpose,
  primary_model='openrouter/free',
  fallback_models='{}',
  temperature=excluded.temperature,
  max_output_tokens=excluded.max_output_tokens,
  timeout_ms=excluded.timeout_ms,
  retry_limit=excluded.retry_limit,
  cost_ceiling_usd=0,
  require_structured_output=excluded.require_structured_output,
  require_zdr=false,
  deny_data_collection=false,
  allowed_data_classes=excluded.allowed_data_classes,
  status=excluded.status,
  updated_at=now();

-- Correct any additional historical task profile without deleting it.
update flashcards_os.model_profiles
set primary_model='openrouter/free',
    fallback_models='{}',
    cost_ceiling_usd=0,
    require_zdr=false,
    deny_data_collection=false,
    updated_at=now()
;

alter table flashcards_os.model_profiles
  drop constraint if exists model_profiles_free_only_route_check;
alter table flashcards_os.model_profiles
  add constraint model_profiles_free_only_route_check
  check (primary_model = 'openrouter/free');

alter table flashcards_os.model_profiles
  drop constraint if exists model_profiles_no_named_fallback_check;
alter table flashcards_os.model_profiles
  add constraint model_profiles_no_named_fallback_check
  check (coalesce(cardinality(fallback_models),0) = 0);

insert into flashcards_os.configuration (
  config_key,config_group,label,value,description,status,updated_at
) values (
  'ai.free_provider_contract',
  'intelligence',
  'Free-only AI provider contract',
  jsonb_build_object(
    'freeOnly',true,
    'tavily',jsonb_build_object('role','public_web_evidence','modelApplicable',false),
    'openrouter',jsonb_build_object('role','all_reasoning','route','openrouter/free','namedModels',jsonb_build_array(),'applicationFallbacks',jsonb_build_array()),
    'syntheticFallback',false,
    'showActualModel',true,
    'secretsEditableInBrowser',false
  ),
  'Tavily Free for public evidence and OpenRouter Free for every reasoning task. Provider errors and actual selected models remain visible.',
  'active',
  now()
)
on conflict (config_key) do update set
  config_group=excluded.config_group,
  label=excluded.label,
  value=excluded.value,
  description=excluded.description,
  status='active',
  updated_at=now();

update flashcards_os.permission_catalogue
set label='Gérer les providers IA gratuits',
    description='Tester Tavily Free et OpenRouter Free, consulter leur état et configurer les politiques d’exécution sans choisir de modèle nommé.'
where permission_key='flashcards_os.manage_model_profiles';

commit;

-- Visible verification result.
select
  count(*) filter (where primary_model='openrouter/free') as free_route_profiles,
  count(*) filter (where coalesce(cardinality(fallback_models),0)=0) as profiles_without_named_fallback,
  count(*) as total_profiles
from flashcards_os.model_profiles
where tenant_key='angelcare-internal';
