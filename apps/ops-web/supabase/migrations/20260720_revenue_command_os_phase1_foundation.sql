-- ANGELCARE REVENUE COMMAND OS
-- Ultra Mega ZIP 01 / Phase 1 — Foundation
-- Canonical contract: AC-REVENUE-OS-CANONICAL-2026.07
-- Safe characteristics: idempotent DDL, isolated revenue_os_* namespace, service-role-only runtime access.

create extension if not exists pgcrypto;

create or replace function public.revenue_os_touch_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.revenue_os_installations (
  id uuid primary key default gen_random_uuid(),
  installation_key text not null unique,
  contract_version text not null,
  release_code text not null,
  module_version text not null,
  environment text not null default 'development' check (environment in ('development','staging','production')),
  execution_mode text not null default 'shadow' check (execution_mode in ('shadow','recommend','approval-gated','limited-autonomy')),
  contract_locked boolean not null default true,
  external_actions_enabled boolean not null default false,
  installed_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.revenue_os_permission_registry (
  permission_key text primary key,
  label text not null,
  description text not null,
  risk_class text not null default 'controlled' check (risk_class in ('low','controlled','restricted')),
  phase_introduced integer not null default 1,
  active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.revenue_os_workspaces (
  workspace_key text primary key,
  label text not null,
  short_label text not null,
  description text not null,
  href text not null unique,
  icon text not null,
  display_order integer not null,
  permission_key text not null references public.revenue_os_permission_registry(permission_key),
  maturity_status text not null default 'planned' check (maturity_status in ('locked','ready','foundation','planned')),
  accent text not null default 'navy' check (accent in ('navy','blue','cyan','green','amber','rose','violet')),
  contract_scope jsonb not null default '[]'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.revenue_os_feature_flags (
  flag_key text primary key,
  label text not null,
  description text not null,
  enabled boolean not null default false,
  locked boolean not null default false,
  environment text not null default 'all' check (environment in ('all','development','staging','production')),
  risk_class text not null default 'controlled' check (risk_class in ('low','controlled','restricted')),
  phase_introduced integer not null default 1,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.revenue_os_status_dictionary (
  id uuid primary key default gen_random_uuid(),
  domain text not null,
  status_key text not null,
  label text not null,
  severity integer not null default 0 check (severity between 0 and 5),
  terminal boolean not null default false,
  display_order integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique(domain, status_key)
);

create table if not exists public.revenue_os_system_checks (
  check_key text primary key,
  label text not null,
  status text not null check (status in ('operational','degraded','attention','offline')),
  detail text not null,
  recommended_action text,
  checked_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.revenue_os_objectives (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  title text not null check (char_length(title) >= 8),
  mandate text not null check (char_length(mandate) >= 20),
  business_unit text not null,
  target_market text not null,
  horizon text not null,
  priority text not null default 'high' check (priority in ('critical','high','medium','low')),
  status text not null default 'draft' check (status in ('draft','submitted','validated','active','paused','completed','cancelled')),
  execution_mode text not null default 'shadow' check (execution_mode in ('shadow','recommend','approval-gated','limited-autonomy')),
  owner_id text,
  owner_label text,
  source text not null default 'manual' check (source in ('manual','foundation-seed','system','import')),
  correlation_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.revenue_os_business_events (
  id uuid primary key default gen_random_uuid(),
  event_id text not null unique,
  event_type text not null,
  aggregate_type text not null,
  aggregate_id text not null,
  actor_id text,
  actor_type text not null default 'system' check (actor_type in ('user','system','migration','api')),
  schema_version text not null default '1.0',
  correlation_id text,
  causation_id text,
  occurred_at timestamptz not null default timezone('utc', now()),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.revenue_os_event_outbox (
  id uuid primary key default gen_random_uuid(),
  event_id text not null unique references public.revenue_os_business_events(event_id) on delete restrict,
  status text not null default 'pending' check (status in ('pending','processing','completed','failed','dead_letter')),
  available_at timestamptz not null default timezone('utc', now()),
  locked_at timestamptz,
  locked_by text,
  attempts integer not null default 0 check (attempts >= 0),
  max_attempts integer not null default 8 check (max_attempts between 1 and 50),
  last_error text,
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.revenue_os_audit_events (
  id uuid primary key default gen_random_uuid(),
  event_id text not null unique,
  action text not null,
  actor_id text,
  actor_label text not null,
  actor_type text not null default 'system' check (actor_type in ('user','system','migration','api')),
  resource_type text not null,
  resource_id text,
  outcome text not null default 'success' check (outcome in ('success','blocked','failure','pending')),
  summary text not null,
  correlation_id text,
  request_id text,
  ip_hash text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists revenue_os_objectives_status_priority_idx on public.revenue_os_objectives(status, priority, updated_at desc);
create index if not exists revenue_os_objectives_business_unit_idx on public.revenue_os_objectives(business_unit, updated_at desc);
create index if not exists revenue_os_business_events_type_time_idx on public.revenue_os_business_events(event_type, occurred_at desc);
create index if not exists revenue_os_business_events_aggregate_idx on public.revenue_os_business_events(aggregate_type, aggregate_id, occurred_at desc);
create index if not exists revenue_os_event_outbox_ready_idx on public.revenue_os_event_outbox(status, available_at) where status in ('pending','failed');
create index if not exists revenue_os_audit_events_action_time_idx on public.revenue_os_audit_events(action, created_at desc);
create index if not exists revenue_os_audit_events_resource_idx on public.revenue_os_audit_events(resource_type, resource_id, created_at desc);
create index if not exists revenue_os_audit_events_correlation_idx on public.revenue_os_audit_events(correlation_id) where correlation_id is not null;

-- Updated-at triggers
DO $$
DECLARE table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'revenue_os_installations',
    'revenue_os_permission_registry',
    'revenue_os_workspaces',
    'revenue_os_feature_flags',
    'revenue_os_status_dictionary',
    'revenue_os_system_checks',
    'revenue_os_objectives',
    'revenue_os_event_outbox'
  ] LOOP
    EXECUTE format('drop trigger if exists %I on public.%I', table_name || '_touch_updated_at', table_name);
    EXECUTE format('create trigger %I before update on public.%I for each row execute function public.revenue_os_touch_updated_at()', table_name || '_touch_updated_at', table_name);
  END LOOP;
END $$;

-- Audit events are append-only at database level.
create or replace function public.revenue_os_prevent_audit_mutation()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  raise exception 'revenue_os_audit_events is append-only';
end;
$$;

drop trigger if exists revenue_os_audit_events_append_only on public.revenue_os_audit_events;
create trigger revenue_os_audit_events_append_only
before update or delete on public.revenue_os_audit_events
for each row execute function public.revenue_os_prevent_audit_mutation();

-- RLS: application access happens through server-side service-role tools only in Phase 1.
DO $$
DECLARE table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'revenue_os_installations',
    'revenue_os_permission_registry',
    'revenue_os_workspaces',
    'revenue_os_feature_flags',
    'revenue_os_status_dictionary',
    'revenue_os_system_checks',
    'revenue_os_objectives',
    'revenue_os_business_events',
    'revenue_os_event_outbox',
    'revenue_os_audit_events'
  ] LOOP
    EXECUTE format('alter table public.%I enable row level security', table_name);
    EXECUTE format('revoke all on table public.%I from anon, authenticated', table_name);
    EXECUTE format('grant all on table public.%I to service_role', table_name);
  END LOOP;
END $$;

-- Canonical installation lock.
insert into public.revenue_os_installations (
  installation_key, contract_version, release_code, module_version, environment, execution_mode, contract_locked, external_actions_enabled, metadata
) values (
  'angelcare-revenue-command-os',
  'AC-REVENUE-OS-CANONICAL-2026.07',
  'AC-REVENUE-OS-MZ01-FOUNDATION',
  '1.0.0-phase1',
  'development',
  'shadow',
  true,
  false,
  '{"phase":1,"cumulative":true,"architecture":"strategy-to-execution-revenue-os"}'::jsonb
) on conflict (installation_key) do update set
  contract_version = excluded.contract_version,
  release_code = excluded.release_code,
  module_version = excluded.module_version,
  contract_locked = true,
  external_actions_enabled = false,
  metadata = public.revenue_os_installations.metadata || excluded.metadata;

insert into public.revenue_os_permission_registry(permission_key, label, description, risk_class, phase_introduced) values
  ('revenue_os.view','Revenue OS — Consulter','Accès au cockpit et aux workspaces Revenue Command OS.','low',1),
  ('revenue_os.manage','Revenue OS — Administrer','Administration générale du module.','restricted',1),
  ('revenue_os.objectives.manage','Revenue OS — Objectifs','Créer et gouverner les mandats stratégiques.','controlled',1),
  ('revenue_os.strategy.manage','Revenue OS — Stratégies','Gouverner les futures stratégies et versions.','restricted',1),
  ('revenue_os.commands.manage','Revenue OS — Commandes','Gouverner la future bibliothèque des commandes intelligentes.','restricted',1),
  ('revenue_os.approvals.manage','Revenue OS — Validations','Prendre les décisions humaines obligatoires.','restricted',1),
  ('revenue_os.audit.view','Revenue OS — Audit','Consulter la traçabilité Revenue OS.','controlled',1),
  ('revenue_os.settings.manage','Revenue OS — Paramètres','Modifier les paramètres autorisés et feature flags non verrouillés.','restricted',1)
on conflict (permission_key) do update set
  label = excluded.label,
  description = excluded.description,
  risk_class = excluded.risk_class,
  active = true;

insert into public.revenue_os_workspaces(workspace_key,label,short_label,description,href,icon,display_order,permission_key,maturity_status,accent,contract_scope) values
  ('strategic-view','Vue stratégique','Vue stratégique','Centre de contrôle de la stratégie à l’exécution.','/revenue-command-os','Command',10,'revenue_os.view','ready','navy','["Cockpit central","État système","Recherche globale","Posture autonomie"]'),
  ('revenue-objectives','Objectifs revenus','Objectifs','Registre des mandats stratégiques soumis au moteur.','/revenue-command-os/revenue-objectives','Target',20,'revenue_os.objectives.manage','foundation','blue','["Objectif","Périmètre","Horizon","Priorité","Mode exécution"]'),
  ('signals','Signaux','Signaux','Registre des signaux commerciaux et opérationnels.','/revenue-command-os/signals','RadioTower',30,'revenue_os.view','foundation','cyan','["Event IDs","Normalisation","Sévérité","Confiance","Déduplication"]'),
  ('strategies','Stratégies','Stratégies','Stratégies concurrentes, hypothèses et versions optimisées.','/revenue-command-os/strategies','Workflow',40,'revenue_os.strategy.manage','planned','violet','["Alternatives","Scénarios","Hypothèses","Optimisation","Versioning"]'),
  ('intelligent-commands','Commandes intelligentes','Commandes','Objets de commande versionnés du futur noyau 3000.','/revenue-command-os/intelligent-commands','Sparkles',50,'revenue_os.commands.manage','foundation','violet','["Identité","Trigger","Contexte","Outils","Validateurs","Sortie structurée"]'),
  ('active-programs','Programmes actifs','Programmes','Programmes revenus et chaînes d’exécution approuvées.','/revenue-command-os/active-programs','Layers3',60,'revenue_os.view','planned','green','["Plays","Campagnes","Vagues","Comptes cibles","Progression"]'),
  ('compiled-missions','Missions compilées','Missions','Sortie du compilateur stratégie vers tâches et preuves.','/revenue-command-os/compiled-missions','ListChecks',70,'revenue_os.view','planned','blue','["Dépendances","Responsables","Échéances","Preuves","Escalades"]'),
  ('approvals','Validations','Validations','Centre humain des actions sensibles et externes.','/revenue-command-os/approvals','BadgeCheck',80,'revenue_os.approvals.manage','foundation','amber','["Autorité","Décision","Motif","Modification","Rejet","Traçabilité"]'),
  ('exceptions','Exceptions','Exceptions','Blocages, contradictions et circuits de récupération.','/revenue-command-os/exceptions','ShieldAlert',90,'revenue_os.view','foundation','rose','["Erreur normalisée","Retry","Dead letter","Récupération","Kill switch"]'),
  ('memory-learning','Mémoire & apprentissage','Mémoire','Doctrine, décisions, résultats et apprentissages mesurés.','/revenue-command-os/memory-learning','BrainCircuit',100,'revenue_os.view','foundation','green','["Doctrine approuvée","Versions","Résultats","Leçons","Retrait"]'),
  ('audit','Audit','Audit','Journal append-only de toute décision et action.','/revenue-command-os/audit','ScrollText',110,'revenue_os.audit.view','ready','navy','["Event ID","Acteur","Ressource","Résultat","Horodatage","Métadonnées"]'),
  ('settings','Paramètres','Paramètres','Feature flags, autonomie, sécurité et environnements.','/revenue-command-os/settings','Settings2',120,'revenue_os.settings.manage','ready','navy','["Flags","Environnements","Autonomie","Sécurité","Version contractuelle"]')
on conflict (workspace_key) do update set
  label = excluded.label,
  short_label = excluded.short_label,
  description = excluded.description,
  href = excluded.href,
  icon = excluded.icon,
  display_order = excluded.display_order,
  permission_key = excluded.permission_key,
  maturity_status = excluded.maturity_status,
  accent = excluded.accent,
  contract_scope = excluded.contract_scope,
  active = true;

insert into public.revenue_os_feature_flags(flag_key,label,description,enabled,locked,environment,risk_class,phase_introduced) values
  ('revenue_os.enabled','Revenue Command OS','Active le module isolé et ses routes protégées.',true,true,'all','low',1),
  ('revenue_os.shadow_mode','Mode Shadow','Observation et simulation sans action externe.',true,true,'all','low',1),
  ('revenue_os.strategy_execution','Exécution stratégique','Propagation d’une stratégie approuvée. Verrouillée en Phase 1.',false,true,'all','restricted',1),
  ('revenue_os.external_actions','Actions externes','Envoi via outils contrôlés. Désactivé en Phase 1.',false,true,'all','restricted',1),
  ('revenue_os.command_simulation','Simulation commandes','Prépare le futur mode simulation sans écriture opérationnelle.',true,false,'development','controlled',1),
  ('revenue_os.audit_immutable','Audit immuable','Empêche la mutation applicative des événements d’audit.',true,true,'all','low',1)
on conflict (flag_key) do update set
  label = excluded.label,
  description = excluded.description,
  enabled = case when public.revenue_os_feature_flags.locked then public.revenue_os_feature_flags.enabled else excluded.enabled end,
  locked = excluded.locked,
  environment = excluded.environment,
  risk_class = excluded.risk_class;

insert into public.revenue_os_status_dictionary(domain,status_key,label,severity,terminal,display_order) values
  ('system_health','operational','Opérationnel',0,false,10),
  ('system_health','degraded','Dégradé',2,false,20),
  ('system_health','attention','Attention requise',3,false,30),
  ('system_health','offline','Hors ligne',4,true,40),
  ('objective','draft','Brouillon',0,false,10),
  ('objective','submitted','Soumis',1,false,20),
  ('objective','validated','Validé',1,false,30),
  ('objective','active','Actif',1,false,40),
  ('objective','paused','En pause',2,false,50),
  ('objective','completed','Terminé',0,true,60),
  ('objective','cancelled','Annulé',2,true,70),
  ('audit_outcome','success','Succès',0,true,10),
  ('audit_outcome','blocked','Bloqué',3,true,20),
  ('audit_outcome','failure','Échec',4,true,30),
  ('audit_outcome','pending','En attente',1,false,40)
on conflict (domain,status_key) do update set
  label = excluded.label,
  severity = excluded.severity,
  terminal = excluded.terminal,
  display_order = excluded.display_order;

insert into public.revenue_os_system_checks(check_key,label,status,detail,recommended_action,metadata) values
  ('contract-lock','Contrat canonique Revenue OS','operational','AC-REVENUE-OS-CANONICAL-2026.07 verrouillé comme source de vérité.',null,'{"phase":1}'),
  ('route-containment','Containment des routes','operational','Module isolé sous /revenue-command-os, sans remplacement des routes historiques.',null,'{"legacy_preserved":true}'),
  ('execution-safety','Sécurité exécution','operational','Mode Shadow imposé; actions externes désactivées.',null,'{"external_actions":false}'),
  ('database-foundation','Persistance Supabase','operational','Migration Revenue OS Phase 1 appliquée.',null,'{"tables":10}'),
  ('audit-foundation','Traçabilité & Event IDs','operational','Contrat événementiel v1 et journal append-only initialisés.',null,'{"schema_version":"1.0"}'),
  ('openai-boundary','Frontière OpenAI','operational','Aucun secret ou accès direct DB ne sera transmis aux futurs agents.',null,'{"tool_boundary":"server-side"}')
on conflict (check_key) do update set
  label = excluded.label,
  status = excluded.status,
  detail = excluded.detail,
  recommended_action = excluded.recommended_action,
  checked_at = timezone('utc', now()),
  metadata = excluded.metadata;

insert into public.revenue_os_objectives(code,title,mandate,business_unit,target_market,horizon,priority,status,execution_mode,owner_label,source,metadata) values
  ('REV-OBJ-FOUNDATION-001','Installer la capacité de pilotage stratégique Revenue OS','Verrouiller la fondation technique, la gouvernance, la navigation et la traçabilité nécessaires avant toute intelligence autonome.','Revenue Command OS','Fondation interne AngelCare','Phase 1 — immédiat','critical','active','shadow','Direction Générale','foundation-seed','{"phase":1,"contract_locked":true}'),
  ('REV-OBJ-PILOT-ACADEMY-001','Préparer le futur pilote Academy & B2B Partner Activation','Préserver le cas d’usage de capture de partenaires Academy comme premier vertical complet des phases intelligence et exécution.','AngelCare Academy × B2B Partnerships','Crèches, maternelles et préscolaires — Maroc','Après validation des fondations','high','draft','shadow','Direction Revenue','foundation-seed','{"pilot":true,"execution_locked":true}')
on conflict (code) do update set
  title = excluded.title,
  mandate = excluded.mandate,
  business_unit = excluded.business_unit,
  target_market = excluded.target_market,
  horizon = excluded.horizon,
  priority = excluded.priority,
  execution_mode = 'shadow',
  metadata = public.revenue_os_objectives.metadata || excluded.metadata;

insert into public.revenue_os_business_events(event_id,event_type,aggregate_type,aggregate_id,actor_type,schema_version,payload) values
  ('ACREV-FOUNDATION_INSTALLED-20260720022750-PHASE001','foundation.installed','revenue_os_installation','angelcare-revenue-command-os','migration','1.0','{"release_code":"AC-REVENUE-OS-MZ01-FOUNDATION","contract_version":"AC-REVENUE-OS-CANONICAL-2026.07"}')
on conflict (event_id) do nothing;

insert into public.revenue_os_event_outbox(event_id,status,attempts,max_attempts,completed_at) values
  ('ACREV-FOUNDATION_INSTALLED-20260720022750-PHASE001','completed',1,8,timezone('utc', now()))
on conflict (event_id) do nothing;

insert into public.revenue_os_audit_events(event_id,action,actor_label,actor_type,resource_type,resource_id,outcome,summary,metadata) values
  ('ACREV-MIGRATION-20260720022750-PHASE001','foundation.migration_applied','Revenue OS Phase 1 Migration','migration','revenue_os_installation','angelcare-revenue-command-os','success','Fondation Revenue Command OS installée et contrat canonique verrouillé.','{"release_code":"AC-REVENUE-OS-MZ01-FOUNDATION","tables":10,"external_actions":false}')
on conflict (event_id) do nothing;

comment on table public.revenue_os_installations is 'Canonical installation and execution posture lock for ANGELCARE Revenue Command OS.';
comment on table public.revenue_os_audit_events is 'Append-only audit stream for Revenue Command OS decisions and actions.';
comment on table public.revenue_os_event_outbox is 'Durable event outbox foundation; processing workers are introduced in later phases.';
