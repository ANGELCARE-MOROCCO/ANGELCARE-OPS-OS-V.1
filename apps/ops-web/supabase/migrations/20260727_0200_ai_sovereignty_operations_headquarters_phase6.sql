-- ANGELCARE SANILA AI Sovereignty Operations Headquarters · Phase 6
-- Additive administrative depth, action governance, permanent lifecycle control,
-- troubleshooting, extensibility registry and Operator Academy.

begin;

create extension if not exists pgcrypto with schema extensions;
create extension if not exists supabase_vault with schema vault;

create table if not exists public.ai_ops_incident_cases (
  id uuid primary key default gen_random_uuid(),
  incident_code text not null unique,
  title text not null,
  severity text not null default 'medium' check (severity in ('low','medium','high','critical')),
  category text not null default 'operations',
  status text not null default 'open' check (status in ('open','acknowledged','investigating','contained','resolved','archived','reopened')),
  provider_dossier_id uuid references public.ai_provider_dossiers(id) on delete set null,
  affected_modules text[] not null default '{}'::text[],
  summary text,
  impact text,
  root_cause text,
  resolution text,
  prevention text,
  evidence jsonb not null default '{}'::jsonb,
  timeline jsonb not null default '[]'::jsonb,
  owner_id text,
  opened_by text,
  resolved_by text,
  resolved_at timestamptz,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_ops_change_requests (
  id uuid primary key default gen_random_uuid(),
  change_code text not null unique,
  title text not null,
  reason text not null,
  status text not null default 'draft' check (status in ('draft','in_review','approved','scheduled','published','observing','accepted','rolled_back','rejected','cancelled')),
  risk_level text not null default 'medium' check (risk_level in ('low','medium','high','critical')),
  affected_modules text[] not null default '{}'::text[],
  current_configuration jsonb not null default '{}'::jsonb,
  proposed_configuration jsonb not null default '{}'::jsonb,
  impact_analysis jsonb not null default '{}'::jsonb,
  testing_evidence jsonb not null default '{}'::jsonb,
  rollback_plan text,
  activation_mode text not null default 'manual',
  scheduled_for timestamptz,
  requested_by text,
  approved_by text,
  approved_at timestamptz,
  published_at timestamptz,
  observed_until timestamptz,
  config_version_id uuid references public.ai_provider_config_versions(id) on delete set null,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_ops_destruction_requests (
  id uuid primary key default gen_random_uuid(),
  request_code text not null unique,
  entity_type text not null check (entity_type in ('credential','dossier')),
  entity_id text not null,
  entity_code text not null,
  reason text not null,
  status text not null default 'requested' check (status in ('requested','approved','blocked','executed','cancelled','rejected')),
  dependency_snapshot jsonb not null default '{}'::jsonb,
  confirmation_text text not null,
  requested_by text not null,
  requested_at timestamptz not null default now(),
  approved_by text,
  approved_at timestamptz,
  executed_by text,
  executed_at timestamptz,
  execution_result jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_ops_provider_adapters (
  id uuid primary key default gen_random_uuid(),
  registry_key text not null unique,
  display_name text not null,
  status text not null default 'active' check (status in ('draft','testing','active','suspended','retired')),
  description text,
  contract jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_by text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_ops_capability_registry (
  id uuid primary key default gen_random_uuid(),
  registry_key text not null unique,
  display_name text not null,
  status text not null default 'active' check (status in ('draft','testing','active','suspended','retired')),
  description text,
  contract jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_by text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_ops_module_registry (
  id uuid primary key default gen_random_uuid(),
  registry_key text not null unique,
  display_name text not null,
  status text not null default 'active' check (status in ('draft','testing','active','suspended','retired')),
  description text,
  contract jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_by text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_ops_sop_articles (
  id uuid primary key default gen_random_uuid(),
  article_key text not null unique,
  version text not null default '1.0.0',
  sort_order integer not null default 100,
  category text not null,
  title text not null,
  summary text,
  roles text[] not null default '{}'::text[],
  objective text,
  prerequisites jsonb not null default '[]'::jsonb,
  steps jsonb not null default '[]'::jsonb,
  evidence jsonb not null default '[]'::jsonb,
  errors jsonb not null default '[]'::jsonb,
  recovery jsonb not null default '[]'::jsonb,
  checklist jsonb not null default '[]'::jsonb,
  authority_required text,
  status text not null default 'published' check (status in ('draft','published','retired')),
  metadata jsonb not null default '{}'::jsonb,
  created_by text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_ops_sop_progress (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  article_key text not null references public.ai_ops_sop_articles(article_key) on update cascade on delete cascade,
  role_key text not null default 'operator',
  status text not null default 'not_started' check (status in ('not_started','in_progress','completed','expired')),
  completion_percent integer not null default 0 check (completion_percent between 0 and 100),
  checklist_state jsonb not null default '{}'::jsonb,
  workbook_notes text,
  assessment_score numeric(5,2),
  supervisor_validation jsonb not null default '{}'::jsonb,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique(user_id, article_key)
);

create table if not exists public.ai_ops_operator_notes (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  entity_type text not null default 'general',
  entity_id text,
  title text not null,
  note text not null,
  visibility text not null default 'private' check (visibility in ('private','team','audit')),
  tags text[] not null default '{}'::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_ops_action_jobs (
  id uuid primary key default gen_random_uuid(),
  job_code text not null unique,
  job_type text not null,
  entity_type text,
  entity_id text,
  status text not null default 'queued' check (status in ('queued','running','completed','failed','cancelled')),
  priority integer not null default 100,
  input_payload jsonb not null default '{}'::jsonb,
  result_payload jsonb not null default '{}'::jsonb,
  error_code text,
  requested_by text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_ops_entity_tombstones (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_code text not null,
  entity_id text,
  fingerprint text,
  destroyed_by text,
  destruction_reason text,
  dependency_snapshot jsonb not null default '{}'::jsonb,
  destruction_request_id uuid references public.ai_ops_destruction_requests(id) on delete set null,
  destroyed_at timestamptz not null default now()
);

create index if not exists ai_ops_incident_status_idx on public.ai_ops_incident_cases(status, severity, created_at desc);
create index if not exists ai_ops_change_status_idx on public.ai_ops_change_requests(status, created_at desc);
create index if not exists ai_ops_destruction_status_idx on public.ai_ops_destruction_requests(status, created_at desc);
create index if not exists ai_ops_jobs_status_idx on public.ai_ops_action_jobs(status, priority, created_at);
create index if not exists ai_ops_sop_progress_user_idx on public.ai_ops_sop_progress(user_id, updated_at desc);

create or replace function public.ai_ops_dependency_snapshot(p_entity_type text, p_entity_id text)
returns jsonb
language plpgsql
security definer
set search_path = public, vault
as $$
declare
  v_id uuid;
  v_dossier_id uuid;
  v_result jsonb;
begin
  begin v_id := p_entity_id::uuid; exception when others then raise exception 'INVALID_ENTITY_ID'; end;
  if p_entity_type = 'credential' then
    select dossier_id into v_dossier_id from public.ai_provider_credentials where id=v_id;
    if v_dossier_id is null then raise exception 'CREDENTIAL_NOT_FOUND'; end if;
    select jsonb_build_object(
      'entityType','credential',
      'credentialStatus',(select status from public.ai_provider_credentials where id=v_id),
      'dossierId',v_dossier_id,
      'activeCredentialsInDossier',(select count(*) from public.ai_provider_credentials where dossier_id=v_dossier_id and status='active'),
      'enabledAssignments',(select count(*) from public.ai_provider_module_assignments where dossier_id=v_dossier_id and enabled),
      'enabledRoutes',(select count(*) from public.ai_provider_routing_rules r join public.ai_provider_module_assignments a on a.id=r.primary_assignment_id where a.dossier_id=v_dossier_id and r.enabled),
      'usageRows',(select count(*) from public.ai_provider_usage_ledger where credential_id=v_id)
    ) into v_result;
  elsif p_entity_type = 'dossier' then
    if not exists(select 1 from public.ai_provider_dossiers where id=v_id) then raise exception 'DOSSIER_NOT_FOUND'; end if;
    select jsonb_build_object(
      'entityType','dossier',
      'dossierStatus',(select status from public.ai_provider_dossiers where id=v_id),
      'enabled',(select is_enabled from public.ai_provider_dossiers where id=v_id),
      'capacityPools',(select count(*) from public.ai_provider_capacity_pools where dossier_id=v_id),
      'credentials',(select count(*) from public.ai_provider_credentials where dossier_id=v_id),
      'activeCredentials',(select count(*) from public.ai_provider_credentials where dossier_id=v_id and status='active'),
      'models',(select count(*) from public.ai_provider_models where dossier_id=v_id),
      'enabledAssignments',(select count(*) from public.ai_provider_module_assignments where dossier_id=v_id and enabled),
      'enabledRoutes',(select count(*) from public.ai_provider_routing_rules r join public.ai_provider_module_assignments a on a.id=r.primary_assignment_id where a.dossier_id=v_id and r.enabled),
      'usageRows',(select count(*) from public.ai_provider_usage_ledger where dossier_id=v_id)
    ) into v_result;
  else
    raise exception 'UNSUPPORTED_DESTRUCTION_ENTITY';
  end if;
  return coalesce(v_result,'{}'::jsonb);
end;
$$;

create or replace function public.ai_ops_execute_destruction(p_request_id uuid, p_actor_id text)
returns jsonb
language plpgsql
security definer
set search_path = public, vault
as $$
declare
  v_request public.ai_ops_destruction_requests%rowtype;
  v_entity_id uuid;
  v_secret_id uuid;
  v_fingerprint text;
  v_dependency jsonb;
  v_credential_status text;
  v_dossier_status text;
  v_dossier_enabled boolean;
  v_enabled_assignments integer;
  v_active_credentials integer;
begin
  select * into v_request from public.ai_ops_destruction_requests where id=p_request_id for update;
  if v_request.id is null then raise exception 'DESTRUCTION_REQUEST_NOT_FOUND'; end if;
  if v_request.status <> 'approved' then raise exception 'DESTRUCTION_REQUEST_NOT_APPROVED'; end if;
  begin v_entity_id := v_request.entity_id::uuid; exception when others then raise exception 'INVALID_ENTITY_ID'; end;
  v_dependency := public.ai_ops_dependency_snapshot(v_request.entity_type,v_request.entity_id);

  if v_request.entity_type='credential' then
    select status,vault_secret_id,fingerprint into v_credential_status,v_secret_id,v_fingerprint
    from public.ai_provider_credentials where id=v_entity_id for update;
    if v_credential_status is null then raise exception 'CREDENTIAL_NOT_FOUND'; end if;
    if v_credential_status='active' then raise exception 'ACTIVE_CREDENTIAL_CANNOT_BE_DESTROYED'; end if;
    delete from public.ai_provider_credentials where id=v_entity_id;
    delete from vault.secrets where id=v_secret_id;
    insert into public.ai_ops_entity_tombstones(entity_type,entity_code,entity_id,fingerprint,destroyed_by,destruction_reason,dependency_snapshot,destruction_request_id)
    values('credential',v_request.entity_code,v_request.entity_id,v_fingerprint,p_actor_id,v_request.reason,v_dependency,v_request.id);
  elsif v_request.entity_type='dossier' then
    select status,is_enabled into v_dossier_status,v_dossier_enabled from public.ai_provider_dossiers where id=v_entity_id for update;
    if v_dossier_status is null then raise exception 'DOSSIER_NOT_FOUND'; end if;
    select count(*) into v_enabled_assignments from public.ai_provider_module_assignments where dossier_id=v_entity_id and enabled;
    select count(*) into v_active_credentials from public.ai_provider_credentials where dossier_id=v_entity_id and status='active';
    if v_dossier_status<>'archived' or v_dossier_enabled then raise exception 'DOSSIER_MUST_BE_ARCHIVED_AND_DISABLED'; end if;
    if v_enabled_assignments>0 or v_active_credentials>0 then raise exception 'DOSSIER_HAS_ACTIVE_DEPENDENCIES'; end if;
    delete from vault.secrets where id in (select vault_secret_id from public.ai_provider_credentials where dossier_id=v_entity_id);
    insert into public.ai_ops_entity_tombstones(entity_type,entity_code,entity_id,destroyed_by,destruction_reason,dependency_snapshot,destruction_request_id)
    values('dossier',v_request.entity_code,v_request.entity_id,p_actor_id,v_request.reason,v_dependency,v_request.id);
    delete from public.ai_provider_dossiers where id=v_entity_id;
  else
    raise exception 'UNSUPPORTED_DESTRUCTION_ENTITY';
  end if;

  update public.ai_ops_destruction_requests set status='executed',executed_by=p_actor_id,executed_at=now(),execution_result=jsonb_build_object('destroyed',true,'entityType',v_request.entity_type,'entityCode',v_request.entity_code),updated_at=now() where id=p_request_id;
  insert into public.ai_provider_audit(action_key,entity_type,entity_id,actor_id,actor_name,payload)
  values('permanent_destruction_executed',v_request.entity_type,v_request.entity_id,p_actor_id,p_actor_id,jsonb_build_object('requestId',p_request_id,'entityCode',v_request.entity_code,'dependencySnapshot',v_dependency));
  return jsonb_build_object('destroyed',true,'entityType',v_request.entity_type,'entityCode',v_request.entity_code,'requestId',p_request_id);
end;
$$;

revoke all on function public.ai_ops_dependency_snapshot(text,text) from public,anon,authenticated;
revoke all on function public.ai_ops_execute_destruction(uuid,text) from public,anon,authenticated;
grant execute on function public.ai_ops_dependency_snapshot(text,text) to service_role;
grant execute on function public.ai_ops_execute_destruction(uuid,text) to service_role;

insert into public.ai_ops_provider_adapters(registry_key,display_name,status,description,contract,metadata,created_by,updated_by)
values
('gemini','Google Gemini','active','Adaptateur production existant.',jsonb_build_object('authenticate',true,'generate',true,'ground',true,'image',true,'usage',true,'normalizeErrors',true),'{}','phase6_seed','phase6_seed'),
('openai','OpenAI','draft','Adaptateur futur; activation source requise.',jsonb_build_object('authenticate',true,'generate',true,'structured',true,'image',true,'usage',true),'{}','phase6_seed','phase6_seed'),
('anthropic','Anthropic','draft','Adaptateur futur; activation source requise.',jsonb_build_object('authenticate',true,'generate',true,'structured',true,'usage',true),'{}','phase6_seed','phase6_seed'),
('local_gateway','ANGELCARE Local Model Gateway','draft','Passerelle future pour modèles internes.',jsonb_build_object('authenticate',true,'generate',true,'health',true),'{}','phase6_seed','phase6_seed')
on conflict(registry_key) do nothing;

insert into public.ai_ops_capability_registry(registry_key,display_name,status,description,contract,created_by,updated_by)
values
('text_generation','Text Generation','active','Génération textuelle générale','{}','phase6_seed','phase6_seed'),
('structured_strategy','Structured Strategy','active','Stratégies structurées et validables','{}','phase6_seed','phase6_seed'),
('grounded_research','Grounded Research','active','Recherche avec sources approuvées','{}','phase6_seed','phase6_seed'),
('image_generation','Image Generation','active','Concepts visuels gouvernés','{}','phase6_seed','phase6_seed'),
('vision_review','Vision Review','active','Analyse de visuels et conformité','{}','phase6_seed','phase6_seed'),
('document_analysis','Document Analysis','active','Lecture et classification de documents','{}','phase6_seed','phase6_seed'),
('embedding','Embedding','draft','Recherche sémantique future','{}','phase6_seed','phase6_seed'),
('agent_execution','Agent Execution','draft','Exécution interne approval-gated future','{}','phase6_seed','phase6_seed')
on conflict(registry_key) do nothing;

insert into public.ai_ops_module_registry(registry_key,display_name,status,description,contract,created_by,updated_by)
values
('revenue_os','Revenue Command OS','active','Autorité commerciale et revenu','{}','phase6_seed','phase6_seed'),
('marketing_ai','Marketing Director AI','active','Direction contenu et marketing','{}','phase6_seed','phase6_seed'),
('marketing_autopilot','Marketing Operations Autopilot','active','Orchestration interne marketing','{}','phase6_seed','phase6_seed'),
('finance_ai','Finance AI','draft','Future autorité financière','{}','phase6_seed','phase6_seed'),
('operations_ai','Operations AI','draft','Future autorité opérations','{}','phase6_seed','phase6_seed'),
('hr_ai','HR AI','draft','Future autorité RH','{}','phase6_seed','phase6_seed')
on conflict(registry_key) do nothing;

-- Concise database SOP catalogue. The UI also includes an offline fallback manual.
insert into public.ai_ops_sop_articles(article_key,sort_order,category,title,summary,roles,objective,prerequisites,steps,evidence,errors,recovery,checklist,authority_required,created_by,updated_by)
values
('provider-dossier-create',10,'Provider Management Foundation','Créer un dossier fournisseur','Passeport, capacity pool et limites externes.',array['provider_admin','governance_admin','new_operator'],'Créer sans perturber les routes actives.','["Project ID confirmé","Plafonds connus"]','["Créer le dossier","Créer le capacity pool","Conserver Draft"]','["Passeport","Audit create_dossier"]','["Project ID inventé"]','["Corriger sans activer"]','["Nom","Code","Project ID","Tier"]','manage','phase6_seed','phase6_seed'),
('credential-activate',20,'Credential Security','Ajouter, valider et activer une credential','Vault, test et activation gouvernée.',array['provider_admin','governance_admin','new_operator'],'Mettre une credential en production avec preuve.','["Dossier créé","Modèle actif"]','["Chiffrer","Tester","Valider","Activer"]','["Fingerprint","Last success"]','["Vault unavailable","No model"]','["Incident Laboratory"]','["Secret chiffré","Test réussi","Activation"]','credentials','phase6_seed','phase6_seed'),
('credential-rotate',30,'Credential Security','Rotation sans interruption','V2 avant révocation de V1.',array['provider_admin','governance_admin'],'Changer de secret sans panne.','["V1 active","Nouvelle clé"]','["Créer V2","Tester","Activer","Observer","Révoquer V1"]','["V2 last success"]','["Révocation prématurée"]','["Réactiver version saine"]','["V2 validée","Observation","V1 révoquée"]','credentials','phase6_seed','phase6_seed'),
('revenue-assign',40,'Revenue AI Operations','Alimenter Revenue Command OS','Assignment, modèle et route.',array['revenue_manager','governance_admin','new_operator'],'Connecter Revenue OS à une ressource gouvernée.','["Credential active","Modèle actif"]','["Affecter","Router","Simuler","Publier"]','["Assignment","Route","Version"]','["Module non alimenté"]','["Recréer affectation"]','["Assignment enabled","Route enabled"]','routing','phase6_seed','phase6_seed'),
('quota-change',50,'Quota & Cost Governance','Modifier un quota en sécurité','Impact avant changement.',array['governance_admin','executive','revenue_manager'],'Contrôler usage sans bloquer les priorités.','["Usage connu","Schedules recensés"]','["Lire","Simuler","Change request","Modifier","Observer"]','["Impact","Version"]','["Confondre limites"]','["Rollback"]','["Provider ceiling","Reserve","Rollback"]','quota','phase6_seed','phase6_seed'),
('resolve-429',60,'Incident Response','Résoudre un 429 RESOURCE_EXHAUSTED','Quota, cadence, cooldown et fallback.',array['incident_manager','provider_admin','governance_admin','new_operator'],'Rétablir sans retry loop.','["Erreur disponible"]','["Identifier pool","Comparer quotas","Cooldown","Failover indépendant","Clore"]','["Incident","Root cause"]','["Faux fallback même projet"]','["Pause schedule"]','["Pool","Retries","Fallback","Prévention"]','manage','phase6_seed','phase6_seed'),
('model-replace',70,'Model Lifecycle','Remplacer un modèle indisponible','Tester le remplacement et publier.',array['provider_admin','governance_admin','revenue_manager'],'Éliminer un 404 modèle.','["Nouveau code confirmé"]','["Suspendre","Enregistrer","Tester","Analyser impact","Publier"]','["Health checks","Change request"]','["Alias non supporté"]','["Rollback"]','["Code exact","Capabilities","Version"]','manage','phase6_seed','phase6_seed'),
('route-failover',80,'Advanced Routing','Créer un failover réellement indépendant','Éviter les fallbacks partageant le quota.',array['governance_admin','provider_admin'],'Assurer une reprise réelle.','["Deux projects indépendants"]','["Créer pool","Credential","Assignment","Route","Simulation"]','["Project IDs","Simulation"]','["Deux clés même projet"]','["Créer pool indépendant"]','["Indépendance","Model","Simulation"]','routing','phase6_seed','phase6_seed'),
('config-publish',90,'Change Governance','Publier et rollback une configuration','Preuve complète et retour.',array['executive','governance_admin','auditor'],'Déployer un changement contrôlé.','["Change approved","Testing evidence"]','["Comparer","Publier","Observer","Accepter ou rollback"]','["Version","Checksum"]','["Sans rollback plan"]','["Restore version"]','["Reason","Impact","Approval","Rollback"]','manage','phase6_seed','phase6_seed'),
('credential-destroy',100,'Credential Security','Détruire définitivement une credential','Dual-control et tombstone.',array['provider_admin','governance_admin','executive','auditor'],'Supprimer sans interruption.','["Credential non active"]','["Dépendances","Request","Approval","Execute","Tombstone"]','["Snapshot","Approval","Tombstone"]','["Détruire active"]','["Nouvelle credential"]','["Non active","Zéro dépendance","Approval"]','manage','phase6_seed','phase6_seed'),
('incident-workbook',110,'Incident Response','Conduire un incident de bout en bout','Détection à prévention.',array['incident_manager','auditor','new_operator'],'Créer apprentissage institutionnel.','["Évidence"]','["Ouvrir","Qualifier","Diagnostiquer","Corriger","Observer","Clore"]','["Timeline","Root cause"]','["Clore sans preuve"]','["Rouvrir"]','["Severity","Impact","Evidence","Prevention"]','manage','phase6_seed','phase6_seed'),
('audit-export',120,'Audit & Compliance','Préparer un dossier de preuve AI','Configuration, usage et incidents.',array['auditor','executive','governance_admin'],'Fournir preuve sans secrets.','["Période définie"]','["Exporter usage","Versions","Incidents","Vérifier no secrets"]','["CSV","Checksums"]','["Exposer secret"]','["Recréer export"]','["Période","Scope","No secrets","Checksums"]','view','phase6_seed','phase6_seed')
on conflict(article_key) do update set version=excluded.version,sort_order=excluded.sort_order,category=excluded.category,title=excluded.title,summary=excluded.summary,roles=excluded.roles,objective=excluded.objective,prerequisites=excluded.prerequisites,steps=excluded.steps,evidence=excluded.evidence,errors=excluded.errors,recovery=excluded.recovery,checklist=excluded.checklist,authority_required=excluded.authority_required,updated_by='phase6_seed',updated_at=now();

alter table public.ai_ops_incident_cases enable row level security;
alter table public.ai_ops_change_requests enable row level security;
alter table public.ai_ops_destruction_requests enable row level security;
alter table public.ai_ops_provider_adapters enable row level security;
alter table public.ai_ops_capability_registry enable row level security;
alter table public.ai_ops_module_registry enable row level security;
alter table public.ai_ops_sop_articles enable row level security;
alter table public.ai_ops_sop_progress enable row level security;
alter table public.ai_ops_operator_notes enable row level security;
alter table public.ai_ops_action_jobs enable row level security;
alter table public.ai_ops_entity_tombstones enable row level security;

revoke all on public.ai_ops_incident_cases,public.ai_ops_change_requests,public.ai_ops_destruction_requests,public.ai_ops_provider_adapters,public.ai_ops_capability_registry,public.ai_ops_module_registry,public.ai_ops_sop_articles,public.ai_ops_sop_progress,public.ai_ops_operator_notes,public.ai_ops_action_jobs,public.ai_ops_entity_tombstones from anon,authenticated;
grant all on public.ai_ops_incident_cases,public.ai_ops_change_requests,public.ai_ops_destruction_requests,public.ai_ops_provider_adapters,public.ai_ops_capability_registry,public.ai_ops_module_registry,public.ai_ops_sop_articles,public.ai_ops_sop_progress,public.ai_ops_operator_notes,public.ai_ops_action_jobs,public.ai_ops_entity_tombstones to service_role;

comment on table public.ai_ops_destruction_requests is 'Dual-control irreversible deletion queue. Active credentials and active provider dependencies are blocked.';
comment on table public.ai_ops_sop_articles is 'Versioned operator manual and workbook procedures embedded in SANILA AI Sovereignty Headquarters.';
comment on function public.ai_ops_execute_destruction(uuid,text) is 'Irreversibly deletes approved non-active credentials or fully archived provider dossiers and preserves metadata-only tombstone evidence.';

commit;
