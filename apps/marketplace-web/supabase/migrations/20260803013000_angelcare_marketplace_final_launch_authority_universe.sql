begin;

-- ANGELCARE Global Marketplace final sovereign authority. Additive, evidence-led, no production launch.
-- Compatibility with the canonical Marketplace foundation schema.
alter table public.angelcare_marketplace_modules
  drop constraint if exists angelcare_marketplace_modules_introduced_by_mega_zip_check;

alter table public.angelcare_marketplace_modules
  add constraint angelcare_marketplace_modules_introduced_by_mega_zip_check
  check (introduced_by_mega_zip >= 1);

insert into public.angelcare_marketplace_modules(
  module_key,
  name,
  description,
  route_prefix,
  module_type,
  audience,
  navigation_group,
  navigation_order,
  status,
  enabled,
  required_permissions,
  required_dependencies,
  territory_aware,
  tenant_aware,
  locale_aware,
  health_status,
  owner_role,
  introduced_by_mega_zip
)
values(
  'final-launch-authority-universe',
  'Global Analytics, Growth, Security, QA & Final Launch Authority',
  'Sovereign intelligence, assurance, security, quality and evidence-backed launch control.',
  '/angelcare-marketplace/admin/intelligence',
  'final_authority',
  array['admin','executive']::text[],
  'Intelligence & Launch',
  250,
  'enabled',
  true,
  array[
    'marketplace.intelligence.view',
    'marketplace.security.view',
    'marketplace.qa.view',
    'marketplace.launch.view'
  ]::text[],
  array[
    'analytics-security-assurance',
    'qa-final-launch-authority',
    'operations-reconciliation-universe'
  ]::text[],
  true,
  true,
  true,
  'healthy',
  'marketplace_final_authority_manager',
  25
)
on conflict(module_key) do update set
  name = excluded.name,
  description = excluded.description,
  route_prefix = excluded.route_prefix,
  module_type = excluded.module_type,
  audience = excluded.audience,
  navigation_group = excluded.navigation_group,
  navigation_order = excluded.navigation_order,
  status = 'enabled',
  enabled = true,
  required_permissions = excluded.required_permissions,
  required_dependencies = excluded.required_dependencies,
  territory_aware = excluded.territory_aware,
  tenant_aware = excluded.tenant_aware,
  locale_aware = excluded.locale_aware,
  health_status = 'healthy',
  owner_role = excluded.owner_role,
  introduced_by_mega_zip = excluded.introduced_by_mega_zip,
  updated_at = now();

-- Evolve the existing cumulative launch authority without replacing it.
alter table public.angelcare_marketplace_launch_gates
  add column if not exists evidence_status text not null default 'missing';

alter table public.angelcare_marketplace_launch_evidence
  add column if not exists source_authority text;

alter table public.angelcare_marketplace_launch_evidence
  add column if not exists storage_reference text;

alter table public.angelcare_marketplace_launch_approvals
  add column if not exists release_id uuid;

-- Evolve the original release register so it can represent post-MZ20
-- Marketplace completion deliveries without losing legacy records.
alter table public.angelcare_marketplace_release_records
  add column if not exists public_reference text;

alter table public.angelcare_marketplace_release_records
  add column if not exists version_label text;

alter table public.angelcare_marketplace_release_records
  add column if not exists target_environment text;

alter table public.angelcare_marketplace_release_records
  add column if not exists source_snapshot text;

alter table public.angelcare_marketplace_release_records
  add column if not exists migration_keys text[] not null default '{}'::text[];

alter table public.angelcare_marketplace_release_records
  add column if not exists territory_ids uuid[] not null default '{}'::uuid[];

alter table public.angelcare_marketplace_release_records
  add column if not exists locales text[] not null default '{}'::text[];

alter table public.angelcare_marketplace_release_records
  add column if not exists feature_flags text[] not null default '{}'::text[];

alter table public.angelcare_marketplace_release_records
  add column if not exists planned_at timestamptz;

alter table public.angelcare_marketplace_release_records
  add column if not exists approved_at timestamptz;

alter table public.angelcare_marketplace_release_records
  add column if not exists launched_at timestamptz;

alter table public.angelcare_marketplace_release_records
  add column if not exists owner_id uuid;

alter table public.angelcare_marketplace_release_records
  add column if not exists marketplace_delivery_sequence integer;

update public.angelcare_marketplace_release_records
set
  public_reference = coalesce(public_reference, release_key),
  version_label = coalesce(version_label, version),
  target_environment = coalesce(target_environment, 'legacy'),
  source_snapshot = coalesce(source_snapshot, notes, 'legacy-foundation-record'),
  planned_at = coalesce(planned_at, created_at)
where
  public_reference is null
  or version_label is null
  or target_environment is null
  or source_snapshot is null
  or planned_at is null;

alter table public.angelcare_marketplace_release_records
  alter column mega_zip drop not null;

alter table public.angelcare_marketplace_release_records
  alter column release_key drop not null;

alter table public.angelcare_marketplace_release_records
  alter column version drop not null;

alter table public.angelcare_marketplace_release_records
  drop constraint if exists angelcare_marketplace_release_records_mega_zip_check;

alter table public.angelcare_marketplace_release_records
  add constraint angelcare_marketplace_release_records_mega_zip_check
  check (mega_zip is null or mega_zip between 1 and 20);

alter table public.angelcare_marketplace_release_records
  drop constraint if exists angelcare_marketplace_release_records_status_check;

alter table public.angelcare_marketplace_release_records
  add constraint angelcare_marketplace_release_records_status_check
  check (
    status in (
      'draft',
      'conditionally_accepted',
      'accepted',
      'rejected',
      'superseded',
      'evidence_collection',
      'gate_review',
      'conditional_approval',
      'approved_for_limited_release',
      'approved_for_phased_release',
      'approved_for_production',
      'released',
      'monitoring',
      'paused',
      'rolled_back',
      'blocked',
      'closed'
    )
  );

create unique index if not exists
  angelcare_marketplace_release_records_public_reference_uidx
  on public.angelcare_marketplace_release_records(public_reference)
  where public_reference is not null;


create table if not exists public.angelcare_marketplace_metric_definitions(id uuid primary key default gen_random_uuid(),metric_key text not null unique,domain text not null,name_fr text not null,description_fr text not null,formula_text text not null,source_authorities text[] not null default '{}',grain text not null,exclusions text[] not null default '{}',owner_role text not null,definition_version integer not null default 1 check(definition_version>=1),status text not null default 'draft',created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create table if not exists public.angelcare_marketplace_metric_observations(id uuid primary key default gen_random_uuid(),metric_key text not null references public.angelcare_marketplace_metric_definitions(metric_key),definition_version integer not null,domain text not null,period_start timestamptz not null,period_end timestamptz not null,tenant_id uuid null,territory_id uuid null,locale text null,value_numeric numeric null,value_text text null,numerator numeric null,denominator numeric null,source_count integer not null default 0,excluded_count integer not null default 0,data_quality_status text not null default 'missing',freshness_status text not null default 'unknown',confidence numeric not null default 0 check(confidence between 0 and 100),calculated_at timestamptz not null default now(),evidence jsonb not null default '{}'::jsonb,check(period_end>=period_start));
create index if not exists idx_acm_metric_observation_domain on public.angelcare_marketplace_metric_observations(domain,calculated_at desc);
create index if not exists idx_acm_metric_observation_scope on public.angelcare_marketplace_metric_observations(tenant_id,territory_id,calculated_at desc);
create table if not exists public.angelcare_marketplace_growth_opportunities(id uuid primary key default gen_random_uuid(),public_reference text not null unique default('GROW-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,10))),opportunity_type text not null,title text not null,summary text not null,domain text not null,tenant_id uuid null,territory_id uuid null,audience_key text null,evidence jsonb not null default '{}'::jsonb,commercial_relevance numeric not null default 0,confidence numeric not null default 0 check(confidence between 0 and 100),status text not null default 'detected',owner_id uuid null,recommended_action text not null,approved_action text null,outcome jsonb not null default '{}'::jsonb,created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create table if not exists public.angelcare_marketplace_experiments(id uuid primary key default gen_random_uuid(),public_reference text not null unique default('EXP-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,10))),name text not null,experiment_type text not null,hypothesis text not null,status text not null default 'draft',route_patterns text[] not null default '{}',territory_ids uuid[] not null default '{}',locales text[] not null default '{}',audience_rules jsonb not null default '{}'::jsonb,primary_metric_key text not null,guardrail_metric_keys text[] not null default '{}',starts_at timestamptz null,ends_at timestamptz null,owner_id uuid null,approved_by uuid null,result_summary text null,decision text null,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),check(ends_at is null or starts_at is null or ends_at>=starts_at));
create table if not exists public.angelcare_marketplace_experiment_variants(id uuid primary key default gen_random_uuid(),experiment_id uuid not null references public.angelcare_marketplace_experiments(id) on delete cascade,variant_key text not null,name text not null,allocation_percent numeric not null check(allocation_percent between 0 and 100),configuration jsonb not null default '{}'::jsonb,unique(experiment_id,variant_key));
create table if not exists public.angelcare_marketplace_experiment_results(id uuid primary key default gen_random_uuid(),experiment_id uuid not null references public.angelcare_marketplace_experiments(id) on delete cascade,variant_key text not null,metric_key text not null,value_numeric numeric null,sample_size integer not null default 0,confidence numeric not null default 0,evidence jsonb not null default '{}'::jsonb,calculated_at timestamptz not null default now());
create table if not exists public.angelcare_marketplace_performance_observations(id uuid primary key default gen_random_uuid(),route_key text not null,surface text not null,metric_key text not null,value_numeric numeric not null,unit text not null,budget_numeric numeric null,status text not null,environment text not null,tenant_id uuid null,territory_id uuid null,observed_at timestamptz not null default now(),evidence jsonb not null default '{}'::jsonb);
create table if not exists public.angelcare_marketplace_security_controls(id uuid primary key default gen_random_uuid(),control_key text not null unique,control_family text not null,name_fr text not null,description_fr text not null,enforcement_layer text not null,owner_role text not null,status text not null default 'not_assessed',evidence_status text not null default 'missing',last_assessed_at timestamptz null,next_assessment_at timestamptz null,risk_level text not null default 'medium',created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create table if not exists public.angelcare_marketplace_security_assessments(id uuid primary key default gen_random_uuid(),control_id uuid not null references public.angelcare_marketplace_security_controls(id),assessment_type text not null,status text not null,observed_result text not null,evidence jsonb not null default '{}'::jsonb,assessor_id uuid null,assessed_at timestamptz not null default now(),expires_at timestamptz null);
create table if not exists public.angelcare_marketplace_security_exceptions(id uuid primary key default gen_random_uuid(),control_id uuid not null references public.angelcare_marketplace_security_controls(id),reason text not null,risk_acceptance text not null,status text not null default 'requested',requested_by uuid null,approved_by uuid null,expires_at timestamptz not null,created_at timestamptz not null default now());
create table if not exists public.angelcare_marketplace_qa_runs(id uuid primary key default gen_random_uuid(),public_reference text not null unique default('QA-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,10))),run_type text not null,scope text[] not null,status text not null default 'planned',started_at timestamptz not null default now(),completed_at timestamptz null,total_checks integer not null default 0,passed_checks integer not null default 0,failed_checks integer not null default 0,blocked_checks integer not null default 0,environment text not null,evidence jsonb not null default '{}'::jsonb);
create table if not exists public.angelcare_marketplace_qa_checks(id uuid primary key default gen_random_uuid(),run_id uuid not null references public.angelcare_marketplace_qa_runs(id) on delete cascade,check_key text not null,domain text not null,route_key text null,status text not null default 'not_run',severity text not null default 'medium',expected_result text not null,observed_result text not null default '',evidence_status text not null default 'missing',owner_id uuid null,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(run_id,check_key));
create table if not exists public.angelcare_marketplace_qa_evidence(id uuid primary key default gen_random_uuid(),check_id uuid not null references public.angelcare_marketplace_qa_checks(id) on delete cascade,evidence_type text not null,storage_reference text null,checksum text null,metadata jsonb not null default '{}'::jsonb,accepted_by uuid null,accepted_at timestamptz null,created_at timestamptz not null default now());
create table if not exists public.angelcare_marketplace_defects(id uuid primary key default gen_random_uuid(),public_reference text not null unique default('DEF-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,10))),title text not null,description text not null,severity text not null,status text not null default 'detected',domain text not null,route_key text null,reproduction_steps text[] not null default '{}',owner_id uuid null,critical_flag boolean not null default false,open_flag boolean not null default true,created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create table if not exists public.angelcare_marketplace_launch_gates(id uuid primary key default gen_random_uuid(),gate_key text not null unique,gate_family text not null,name_fr text not null,description_fr text not null,requirement_level text not null default 'mandatory',status text not null default 'not_assessed',score numeric not null default 0 check(score between 0 and 100),owner_role text not null,evidence_status text not null default 'missing',blocker_reason text null,expires_at timestamptz null,updated_at timestamptz not null default now());
create table if not exists public.angelcare_marketplace_launch_evidence(id uuid primary key default gen_random_uuid(),gate_id uuid not null references public.angelcare_marketplace_launch_gates(id) on delete cascade,evidence_type text not null,source_authority text not null,source_object_id text null,storage_reference text null,checksum text null,status text not null default 'submitted',reviewed_by uuid null,reviewed_at timestamptz null,created_at timestamptz not null default now());
create table if not exists public.angelcare_marketplace_launch_approvals(id uuid primary key default gen_random_uuid(),gate_id uuid null references public.angelcare_marketplace_launch_gates(id),release_id uuid null,decision text not null,conditions text[] not null default '{}',residual_risk text null,approver_id uuid not null,approver_role text not null,expires_at timestamptz null,created_at timestamptz not null default now());
create table if not exists public.angelcare_marketplace_release_records(id uuid primary key default gen_random_uuid(),public_reference text not null unique default('REL-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,10))),version_label text not null,status text not null default 'draft',target_environment text not null,source_snapshot text not null,migration_keys text[] not null default '{}',territory_ids uuid[] not null default '{}',locales text[] not null default '{}',feature_flags text[] not null default '{}',planned_at timestamptz null,approved_at timestamptz null,launched_at timestamptz null,owner_id uuid null,created_at timestamptz not null default now());
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'angelcare_marketplace_launch_approvals_release_id_fkey'
      and conrelid = 'public.angelcare_marketplace_launch_approvals'::regclass
  ) then
    alter table public.angelcare_marketplace_launch_approvals
      add constraint angelcare_marketplace_launch_approvals_release_id_fkey
      foreign key(release_id)
      references public.angelcare_marketplace_release_records(id);
  end if;
end
$$;
create table if not exists public.angelcare_marketplace_rollback_records(id uuid primary key default gen_random_uuid(),release_id uuid not null references public.angelcare_marketplace_release_records(id),trigger_reason text not null,status text not null default 'prepared',transaction_history_preserved boolean not null default true,runbook jsonb not null default '{}'::jsonb,evidence jsonb not null default '{}'::jsonb,authorized_by uuid null,started_at timestamptz null,completed_at timestamptz null,created_at timestamptz not null default now());
create table if not exists public.angelcare_marketplace_monitoring_events(id uuid primary key default gen_random_uuid(),event_key text not null,surface text not null,severity text not null,status text not null default 'open',summary text not null,metric_value numeric null,metric_unit text null,tenant_id uuid null,territory_id uuid null,locale text null,detected_at timestamptz not null default now(),resolved_at timestamptz null,owner_id uuid null,evidence jsonb not null default '{}'::jsonb);

-- Server-side scope and authorization rely on existing Marketplace context/RLS authority.
do $$ declare t text; begin foreach t in array array['angelcare_marketplace_metric_definitions','angelcare_marketplace_metric_observations','angelcare_marketplace_growth_opportunities','angelcare_marketplace_experiments','angelcare_marketplace_experiment_variants','angelcare_marketplace_experiment_results','angelcare_marketplace_performance_observations','angelcare_marketplace_security_controls','angelcare_marketplace_security_assessments','angelcare_marketplace_security_exceptions','angelcare_marketplace_qa_runs','angelcare_marketplace_qa_checks','angelcare_marketplace_qa_evidence','angelcare_marketplace_defects','angelcare_marketplace_launch_gates','angelcare_marketplace_launch_evidence','angelcare_marketplace_launch_approvals','angelcare_marketplace_release_records','angelcare_marketplace_rollback_records','angelcare_marketplace_monitoring_events'] loop execute format('alter table public.%I enable row level security',t); execute format('revoke all on table public.%I from anon, authenticated',t); end loop; end $$;

insert into public.angelcare_marketplace_permissions(
  permission_key,
  name,
  category,
  sensitive,
  description
)
values
  ('marketplace.intelligence.view','Voir Executive Intelligence','Intelligence',false,'Consulter les métriques et observations gouvernées.'),
  ('marketplace.intelligence.metrics.manage','Gérer les métriques','Intelligence',true,'Administrer définitions, versions et qualité des métriques.'),
  ('marketplace.growth.view','Voir Growth Command','Growth',false,'Consulter les opportunités de croissance fondées sur des preuves.'),
  ('marketplace.growth.experiments.manage','Gérer les expériences','Growth',true,'Créer, approuver et piloter les expériences gouvernées.'),
  ('marketplace.performance.view','Voir Performance Command','Performance',false,'Consulter les observations de performance et budgets.'),
  ('marketplace.security.view','Voir Security Command','Security',false,'Consulter la posture et les contrôles de sécurité.'),
  ('marketplace.security.assess','Évaluer les contrôles sécurité','Security',true,'Enregistrer les évaluations et preuves de contrôle.'),
  ('marketplace.qa.view','Voir QA Authority','QA',false,'Consulter les runs, checks, preuves et défauts.'),
  ('marketplace.qa.defects.manage','Gérer les défauts','QA',true,'Faire évoluer les défauts selon leur cycle gouverné.'),
  ('marketplace.launch.view','Voir Final Launch Authority','Launch',false,'Consulter les gates, releases et monitoring.'),
  ('marketplace.launch.approve','Approuver une release','Launch',true,'Enregistrer une décision exécutive de release.'),
  ('marketplace.launch.monitoring','Voir le monitoring post-launch','Launch',false,'Consulter les événements de monitoring post-lancement.')
on conflict(permission_key) do update set
  name = excluded.name,
  category = excluded.category,
  sensitive = excluded.sensitive,
  description = excluded.description;

insert into public.angelcare_marketplace_role_permissions(role_key, permission_key)
select
  r.role_key,
  p.permission_key
from public.angelcare_marketplace_roles r
cross join public.angelcare_marketplace_permissions p
where r.role_key in (
  'marketplace_super_admin',
  'marketplace_executive',
  'marketplace_admin'
)
and (
  p.permission_key like 'marketplace.intelligence.%'
  or p.permission_key like 'marketplace.growth.%'
  or p.permission_key like 'marketplace.performance.%'
  or p.permission_key like 'marketplace.security.%'
  or p.permission_key like 'marketplace.qa.%'
  or p.permission_key like 'marketplace.launch.%'
)
on conflict do nothing;


insert into public.angelcare_marketplace_metric_definitions(metric_key,domain,name_fr,description_fr,formula_text,source_authorities,grain,exclusions,owner_role,status) values
('marketplace.demand.qualified','demand','Demande qualifiée','Intentions ayant atteint une action qualifiante.','count(distinct qualified_intent_id)',array['homepage','catalog','conversion'],'day/territory/audience',array['bots','internal_traffic','duplicates'],'marketplace_intelligence_manager','active'),
('marketplace.conversion.canonical_outcome_rate','conversion','Taux outcome canonique','Outcomes canoniques divisés par sessions éligibles.','canonical_outcomes / eligible_sessions',array['conversion-universe'],'day/territory/item_type',array['duplicate_submissions','test_sessions'],'marketplace_intelligence_manager','active'),
('marketplace.fulfillment.on_time_rate','operations','Fulfillment à l’heure','Fulfillments clôturés à l’heure divisés par fulfillments clôturés.','on_time_closed / closed',array['operations-reconciliation'],'week/territory/kind',array['cancelled'],'marketplace_operations_manager','active'),
('marketplace.launch.readiness','launch','Readiness launch','Gates obligatoires passés avec evidence acceptée.','mandatory_passed_with_evidence / mandatory_gates',array['final-launch-authority'],'release',array[]::text[],'marketplace_final_authority_manager','active') on conflict(metric_key) do nothing;

insert into public.angelcare_marketplace_security_controls(control_key,control_family,name_fr,description_fr,enforcement_layer,owner_role,risk_level) values
('rbac.admin_mutations','RBAC','Mutations admin autorisées','Chaque mutation admin exige une permission canonique.','server+database','marketplace_security_manager','critical'),
('isolation.tenant','Isolation','Isolation tenant','Aucun accès cross-tenant sans scope global autorisé.','server+database','marketplace_security_manager','critical'),
('isolation.territory','Isolation','Isolation territoire','Les enregistrements territoriaux respectent le scope actif.','server+database','marketplace_security_manager','critical'),
('privacy.child_sensitive','Privacy','Données enfant sensibles','Les payloads analytics excluent les données enfant non nécessaires.','server+database','marketplace_privacy_manager','critical'),
('sod.refund_approval','Separation of duties','Demande et approbation refund séparées','Le requester ne peut pas être final approver.','server','marketplace_finance_manager','high') on conflict(control_key) do nothing;

insert into public.angelcare_marketplace_launch_gates(
  gate_key,
  name_fr,
  gate_family,
  description_fr,
  requirement_level,
  status,
  score,
  owner_role,
  reviewer_role,
  evidence_required,
  evidence_status,
  sort_order
)
values
  ('product.complete','Produit complet','Product completeness','Homepage, catalog, conversion, journeys et opérations couverts.','mandatory','not_started',0,'marketplace_product_owner','marketplace_executive',true,'missing',210),
  ('commercial.complete','Commerce complet','Commercial completeness','Pricing, quote, checkout et handovers validés.','mandatory','not_started',0,'marketplace_commercial_manager','marketplace_executive',true,'missing',220),
  ('operations.ready','Opérations prêtes','Operational readiness','Fulfillment, provider, vendor, recovery et réconciliation prêts.','mandatory','not_started',0,'marketplace_operations_manager','marketplace_executive',true,'missing',230),
  ('security.effective','Sécurité effective','Security','RBAC, SoD, isolation et contrôles sensibles prouvés.','mandatory','not_started',0,'marketplace_security_manager','marketplace_executive',true,'missing',240),
  ('localization.ready','Localisation prête','Localization','FR, EN, AR et RTL revus.','mandatory','not_started',0,'marketplace_localization_manager','marketplace_executive',true,'missing',250),
  ('performance.accepted','Performance acceptée','Performance','Budgets et preuves production-like acceptés.','mandatory','not_started',0,'marketplace_platform_manager','marketplace_executive',true,'missing',260),
  ('rollback.ready','Rollback prêt','Rollback','Runbook data-preserving et triggers prouvés.','mandatory','not_started',0,'marketplace_release_manager','marketplace_executive',true,'missing',270),
  ('monitoring.ready','Monitoring prêt','Monitoring','Fenêtres 15m, 1h, 1j, 72h, semaine et mois assignées.','mandatory','not_started',0,'marketplace_operations_manager','marketplace_executive',true,'missing',280)
on conflict(gate_key) do update set
  name_fr = excluded.name_fr,
  gate_family = excluded.gate_family,
  description_fr = excluded.description_fr,
  requirement_level = excluded.requirement_level,
  owner_role = excluded.owner_role,
  reviewer_role = excluded.reviewer_role,
  evidence_required = excluded.evidence_required,
  sort_order = excluded.sort_order,
  updated_at = now();


grant all on table
  public.angelcare_marketplace_metric_definitions,
  public.angelcare_marketplace_metric_observations,
  public.angelcare_marketplace_growth_opportunities,
  public.angelcare_marketplace_experiments,
  public.angelcare_marketplace_experiment_variants,
  public.angelcare_marketplace_experiment_results,
  public.angelcare_marketplace_performance_observations,
  public.angelcare_marketplace_security_controls,
  public.angelcare_marketplace_security_assessments,
  public.angelcare_marketplace_security_exceptions,
  public.angelcare_marketplace_qa_runs,
  public.angelcare_marketplace_qa_checks,
  public.angelcare_marketplace_qa_evidence,
  public.angelcare_marketplace_defects,
  public.angelcare_marketplace_launch_gates,
  public.angelcare_marketplace_launch_evidence,
  public.angelcare_marketplace_launch_approvals,
  public.angelcare_marketplace_release_records,
  public.angelcare_marketplace_rollback_records,
  public.angelcare_marketplace_monitoring_events
to service_role;

commit;
select 'final_marketplace_authority_applied' as status,
 (select count(*) from public.angelcare_marketplace_metric_definitions) as metric_definitions,
 (select count(*) from public.angelcare_marketplace_security_controls) as security_controls,
 (select count(*) from public.angelcare_marketplace_launch_gates) as launch_gates;
