-- ANGELCARE BUILD 360 — MEGA ZIP 02
-- Territory OS Core & Global Expansion Layer
-- Additive, data-preserving migration. No existing table or column is dropped.

create extension if not exists pgcrypto;

create table if not exists public.angelcare_marketplace_territory_templates (
  id uuid primary key default gen_random_uuid(),
  template_key text not null unique,
  name text not null,
  description text,
  territory_type text not null check (territory_type in ('country','region','city_cluster','vertical_world')),
  active boolean not null default true,
  version integer not null default 1 check (version > 0),
  created_by uuid,
  created_at timestamptz not null default timezone('utc',now()),
  updated_at timestamptz not null default timezone('utc',now())
);

create table if not exists public.angelcare_marketplace_territories (
  id uuid primary key default gen_random_uuid(),
  public_reference text not null unique default ('TERR-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,10))),
  territory_code text not null unique,
  name text not null,
  country_code text not null check (country_code ~ '^[A-Z]{2}$'),
  territory_type text not null default 'country' check (territory_type in ('country','region','city_cluster','vertical_world')),
  timezone text not null,
  currency_label text not null,
  default_locale text not null default 'fr' check (default_locale in ('fr','en','ar')),
  active_locales text[] not null default array['fr']::text[],
  status text not null default 'draft' check (status in ('draft','configuring','review','soft_launch','live','paused','archived')),
  owner_id uuid,
  executive_sponsor_id uuid,
  source_territory_id uuid references public.angelcare_marketplace_territories(id) on delete restrict,
  source_template_id uuid references public.angelcare_marketplace_territory_templates(id) on delete set null,
  inheritance_version integer not null default 1 check (inheritance_version > 0),
  readiness_score integer not null default 0 check (readiness_score between 0 and 100),
  health_status text not null default 'unknown' check (health_status in ('healthy','attention_required','at_risk','critical','paused','unknown')),
  target_launch_at timestamptz,
  soft_launched_at timestamptz,
  launched_at timestamptz,
  paused_at timestamptz,
  archived_at timestamptz,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default timezone('utc',now()),
  updated_at timestamptz not null default timezone('utc',now()),
  version integer not null default 1 check (version > 0),
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.angelcare_marketplace_territory_template_items (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.angelcare_marketplace_territory_templates(id) on delete cascade,
  item_key text not null,
  category text not null,
  value jsonb not null,
  inheritance_mode text not null default 'inherited_snapshot' check (inheritance_mode in ('inherited_reference','inherited_snapshot','local_default','local_override','locked_global')),
  is_locked boolean not null default false,
  local_override_allowed boolean not null default true,
  sort_order integer not null default 999,
  created_at timestamptz not null default timezone('utc',now()),
  unique(template_id,item_key)
);

create table if not exists public.angelcare_marketplace_territory_settings (
  id uuid primary key default gen_random_uuid(),
  territory_id uuid not null references public.angelcare_marketplace_territories(id) on delete cascade,
  setting_key text not null,
  category text not null,
  label text not null,
  description text,
  source_type text not null default 'local' check (source_type in ('global_master','territory','template','local')),
  source_id uuid,
  source_version integer,
  inheritance_mode text not null default 'local_default' check (inheritance_mode in ('inherited_reference','inherited_snapshot','local_default','local_override','locked_global')),
  is_locked boolean not null default false,
  local_override_allowed boolean not null default true,
  effective_value jsonb,
  override_value jsonb,
  override_status text check (override_status is null or override_status in ('draft','submitted','in_review','approved','rejected','effective','rolled_back','archived')),
  owner_id uuid,
  updated_by uuid,
  created_at timestamptz not null default timezone('utc',now()),
  updated_at timestamptz not null default timezone('utc',now()),
  unique(territory_id,setting_key)
);

create table if not exists public.angelcare_marketplace_territory_city_zones (
  id uuid primary key default gen_random_uuid(),
  territory_id uuid not null references public.angelcare_marketplace_territories(id) on delete cascade,
  city_name text not null,
  zone_name text,
  coverage_status text not null default 'planned' check (coverage_status in ('planned','limited','active','unavailable','paused')),
  service_scope jsonb not null default '{}'::jsonb,
  owner_id uuid,
  created_at timestamptz not null default timezone('utc',now()),
  updated_at timestamptz not null default timezone('utc',now()),
  unique nulls not distinct (territory_id,city_name,zone_name)
);

create table if not exists public.angelcare_marketplace_territory_support_contacts (
  id uuid primary key default gen_random_uuid(),
  territory_id uuid not null references public.angelcare_marketplace_territories(id) on delete cascade,
  contact_type text not null check (contact_type in ('public','operations','escalation','security','finance')),
  name text,
  email text,
  phone text,
  active boolean not null default true,
  created_at timestamptz not null default timezone('utc',now()),
  updated_at timestamptz not null default timezone('utc',now()),
  unique(territory_id,contact_type)
);

create table if not exists public.angelcare_marketplace_territory_assignments (
  id uuid primary key default gen_random_uuid(),
  territory_id uuid not null references public.angelcare_marketplace_territories(id) on delete cascade,
  app_user_id uuid not null,
  assignment_role text not null,
  active boolean not null default true,
  assigned_by uuid,
  assigned_at timestamptz not null default timezone('utc',now()),
  ends_at timestamptz,
  unique(territory_id,app_user_id,assignment_role)
);

create table if not exists public.angelcare_marketplace_territory_overrides (
  id uuid primary key default gen_random_uuid(),
  public_reference text not null unique default ('OVR-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,10))),
  territory_id uuid not null references public.angelcare_marketplace_territories(id) on delete cascade,
  setting_key text not null,
  source_value jsonb,
  proposed_value jsonb,
  effective_value jsonb,
  business_reason text not null,
  risk_level text not null default 'medium' check (risk_level in ('low','medium','high','critical')),
  status text not null default 'draft' check (status in ('draft','submitted','in_review','approved','rejected','effective','rolled_back','archived')),
  requested_by uuid,
  owner_id uuid,
  reviewer_id uuid,
  decision_reason text,
  effective_at timestamptz,
  reviewed_at timestamptz,
  rolled_back_at timestamptz,
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default timezone('utc',now()),
  updated_at timestamptz not null default timezone('utc',now())
);

create table if not exists public.angelcare_marketplace_territory_override_reviews (
  id uuid primary key default gen_random_uuid(),
  override_id uuid not null references public.angelcare_marketplace_territory_overrides(id) on delete cascade,
  reviewer_id uuid not null,
  decision text not null check (decision in ('approved','rejected','correction_requested')),
  comments text not null,
  before_value jsonb,
  after_value jsonb,
  created_at timestamptz not null default timezone('utc',now())
);

create table if not exists public.angelcare_marketplace_territory_launch_checks (
  id uuid primary key default gen_random_uuid(),
  territory_id uuid not null references public.angelcare_marketplace_territories(id) on delete cascade,
  gate_key text not null,
  gate_group text not null,
  title text not null,
  description text,
  requirement_level text not null check (requirement_level in ('mandatory_blocking','mandatory_non_blocking','recommended','informational')),
  status text not null default 'not_started' check (status in ('not_started','in_progress','submitted','passed','failed','waiver_requested','waiver_approved','expired','not_applicable')),
  score_weight integer not null default 1 check (score_weight >= 0),
  score integer not null default 0 check (score between 0 and 100),
  owner_id uuid,
  owner_role text,
  reviewer_id uuid,
  due_at timestamptz,
  evidence_required boolean not null default true,
  evidence_reference text,
  evidence jsonb not null default '{}'::jsonb,
  blocker_reason text,
  warning_reason text,
  next_action text,
  last_validated_at timestamptz,
  validated_by uuid,
  sort_order integer not null default 999,
  created_at timestamptz not null default timezone('utc',now()),
  updated_at timestamptz not null default timezone('utc',now()),
  unique(territory_id,gate_key)
);

create table if not exists public.angelcare_marketplace_territory_launch_approvals (
  id uuid primary key default gen_random_uuid(),
  territory_id uuid not null references public.angelcare_marketplace_territories(id) on delete cascade,
  approval_type text not null check (approval_type in ('soft_launch','live_launch','resume')),
  readiness_score integer not null check (readiness_score between 0 and 100),
  blocking_gate_count integer not null default 0,
  reviewer_id uuid not null,
  decision text not null check (decision in ('approved','rejected','correction_requested')),
  comments text not null,
  evidence_summary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc',now())
);

create table if not exists public.angelcare_marketplace_territory_health_events (
  id uuid primary key default gen_random_uuid(),
  territory_id uuid not null references public.angelcare_marketplace_territories(id) on delete cascade,
  event_key text not null,
  category text not null,
  severity text not null default 'warning' check (severity in ('info','warning','critical')),
  title text not null,
  description text,
  status text not null default 'open' check (status in ('open','acknowledged','resolved','dismissed')),
  source text not null,
  owner_id uuid,
  due_at timestamptz,
  resolved_at timestamptz,
  resolution_note text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default timezone('utc',now()),
  updated_at timestamptz not null default timezone('utc',now())
);

create table if not exists public.angelcare_marketplace_territory_clone_operations (
  id uuid primary key default gen_random_uuid(),
  idempotency_key text not null unique,
  source_territory_id uuid not null references public.angelcare_marketplace_territories(id) on delete restrict,
  target_territory_id uuid references public.angelcare_marketplace_territories(id) on delete restrict,
  inherited_domains text[] not null default '{}'::text[],
  allowed_override_categories text[] not null default '{}'::text[],
  status text not null default 'started' check (status in ('started','completed','failed')),
  result jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default timezone('utc',now()),
  completed_at timestamptz
);

create index if not exists angelcare_marketplace_territories_status_idx on public.angelcare_marketplace_territories(status,health_status,updated_at desc);
create index if not exists angelcare_marketplace_territories_country_idx on public.angelcare_marketplace_territories(country_code,readiness_score desc);
create index if not exists angelcare_marketplace_settings_territory_idx on public.angelcare_marketplace_territory_settings(territory_id,category);
create index if not exists angelcare_marketplace_overrides_territory_idx on public.angelcare_marketplace_territory_overrides(territory_id,status,created_at desc);
create index if not exists angelcare_marketplace_gates_territory_idx on public.angelcare_marketplace_territory_launch_checks(territory_id,requirement_level,status,sort_order);
create index if not exists angelcare_marketplace_health_territory_idx on public.angelcare_marketplace_territory_health_events(territory_id,status,severity,created_at desc);
create index if not exists angelcare_marketplace_assignments_territory_idx on public.angelcare_marketplace_territory_assignments(territory_id,app_user_id,active);

-- Updated-at triggers are reused from Mega ZIP 01.
do $$
declare t text;
begin
  foreach t in array array[
    'angelcare_marketplace_territory_templates','angelcare_marketplace_territories','angelcare_marketplace_territory_settings',
    'angelcare_marketplace_territory_city_zones','angelcare_marketplace_territory_support_contacts',
    'angelcare_marketplace_territory_overrides','angelcare_marketplace_territory_launch_checks','angelcare_marketplace_territory_health_events'
  ] loop
    execute format('drop trigger if exists %I_updated_at on public.%I',t,t);
    execute format('create trigger %I_updated_at before update on public.%I for each row execute function public.angelcare_marketplace_set_updated_at()',t,t);
  end loop;
end $$;

create or replace function public.angelcare_marketplace_seed_territory_gates(p_territory_id uuid, p_actor_id uuid)
returns void language plpgsql security definer set search_path=public as $$
begin
  insert into public.angelcare_marketplace_territory_launch_checks
    (territory_id,gate_key,gate_group,title,description,requirement_level,status,score_weight,owner_role,evidence_required,next_action,sort_order)
  values
    (p_territory_id,'localization.complete','localization','Localisation complète','FR/EN/AR actifs selon le territoire, textes sensibles sans fallback.','mandatory_blocking','not_started',10,'marketplace_localization_manager',true,'Confirmer les langues et les preuves de traduction.',10),
    (p_territory_id,'legal.pages.approved','legal','Pages légales approuvées','Mentions et pages légales locales approuvées.','mandatory_blocking','not_started',10,'marketplace_quality_reviewer',true,'Joindre la validation juridique.',20),
    (p_territory_id,'trust.center.approved','trust','Trust Center approuvé','Preuves, SOP et frontières de service confirmées.','mandatory_blocking','not_started',10,'marketplace_quality_reviewer',true,'Valider les preuves de confiance.',30),
    (p_territory_id,'catalog.ready','catalog','Catalogue prêt','Disponibilités territoriales et exclusions documentées.','mandatory_blocking','not_started',8,'marketplace_catalog_manager',true,'Publier la matrice catalogue.',40),
    (p_territory_id,'price_book.ready','pricing','Price book prêt','Devise, quote mode et règles financières approuvés.','mandatory_blocking','not_started',10,'marketplace_finance_reviewer',true,'Valider le price book local.',50),
    (p_territory_id,'operations.zones.ready','operations','Zones opérationnelles prêtes','Villes, couverture et capacité initiale confirmées.','mandatory_blocking','not_started',12,'marketplace_operations_lead',true,'Confirmer les zones et la capacité.',60),
    (p_territory_id,'support.route.ready','support','Support prêt','Contacts public, opérations et escalade actifs.','mandatory_blocking','not_started',10,'marketplace_territory_director',true,'Tester les routes de support.',70),
    (p_territory_id,'analytics.active','analytics','Analytics actifs','Événements et santé territoire observables.','mandatory_non_blocking','not_started',6,'marketplace_admin',true,'Confirmer la collecte analytique.',80),
    (p_territory_id,'security.reviewed','security','Sécurité revue','Scopes, accès et tests de non-fuite validés.','mandatory_blocking','not_started',12,'marketplace_security',true,'Joindre la revue de sécurité.',90),
    (p_territory_id,'backup.monitoring.prepared','continuity','Backup & monitoring prêts','Surveillance, support et continuité préparés.','mandatory_blocking','not_started',8,'marketplace_security',true,'Documenter monitoring et reprise.',100),
    (p_territory_id,'executive.approval.recorded','governance','Approbation exécutive','Décision finale enregistrée après les gates.','mandatory_blocking','not_started',4,'marketplace_executive',true,'Enregistrer le sign-off exécutif.',110)
  on conflict (territory_id,gate_key) do nothing;
end $$;

create or replace function public.angelcare_marketplace_seed_territory_settings(
  p_territory_id uuid,p_source_type text,p_source_id uuid,p_actor_id uuid,p_locked boolean default false)
returns void language plpgsql security definer set search_path=public as $$
begin
  insert into public.angelcare_marketplace_territory_settings
    (territory_id,setting_key,category,label,description,source_type,source_id,source_version,inheritance_mode,is_locked,local_override_allowed,effective_value,owner_id,updated_by)
  select p_territory_id,v.key,v.category,v.label,v.description,p_source_type,p_source_id,1,
         case when p_locked then 'locked_global' else case when p_source_type='local' then 'local_default' else 'inherited_snapshot' end end,
         p_locked,not p_locked,v.value,p_actor_id,p_actor_id
  from (values
    ('identity.country','identity','Pays','Code pays officiel','null'::jsonb),
    ('localization.default_locale','localization','Langue par défaut','Locale principale du territoire','"fr"'::jsonb),
    ('localization.active_locales','localization','Langues actives','Langues autorisées','["fr"]'::jsonb),
    ('finance.currency_label','finance','Libellé devise','Libellé visible dans le territoire','"Dh"'::jsonb),
    ('operations.timezone','operations','Fuseau horaire','Fuseau canonique','"Africa/Casablanca"'::jsonb),
    ('catalog.availability','catalog','Disponibilité catalogue','État contractuel du catalogue','{"status":"not_installed"}'::jsonb),
    ('pricing.price_book','pricing','Price book','État contractuel du price book','{"status":"not_installed"}'::jsonb),
    ('trust.center','trust','Trust Center','État contractuel du Trust Center','{"status":"not_installed"}'::jsonb),
    ('support.routing','support','Support route','Configuration du support','{"status":"configuration_required"}'::jsonb),
    ('security.scope_policy','security','Politique de scope','Protection inter-territoire','{"mode":"deny_by_default"}'::jsonb)
  ) as v(key,category,label,description,value)
  on conflict (territory_id,setting_key) do nothing;
end $$;

create or replace function public.angelcare_marketplace_create_territory(
  p_territory_code text,p_name text,p_country_code text,p_territory_type text,p_timezone text,p_currency_label text,
  p_default_locale text,p_active_locales text[],p_owner_id uuid,p_executive_sponsor_id uuid,p_source_template_id uuid,
  p_target_launch_at timestamptz,p_city_names text[],p_support jsonb,p_activation_strategy text,p_actor_id uuid,p_request_id text)
returns uuid language plpgsql security definer set search_path=public as $$
declare v_id uuid; v_city text; v_contact text; v_payload jsonb;
begin
  insert into public.angelcare_marketplace_territories
    (territory_code,name,country_code,territory_type,timezone,currency_label,default_locale,active_locales,status,owner_id,executive_sponsor_id,source_template_id,target_launch_at,created_by,updated_by,metadata)
  values (upper(trim(p_territory_code)),trim(p_name),upper(trim(p_country_code)),p_territory_type,p_timezone,p_currency_label,p_default_locale,p_active_locales,'configuring',p_owner_id,p_executive_sponsor_id,p_source_template_id,p_target_launch_at,p_actor_id,p_actor_id,jsonb_build_object('activation_strategy',p_activation_strategy,'request_id',p_request_id))
  returning id into v_id;
  perform public.angelcare_marketplace_seed_territory_settings(v_id,'local',null,p_actor_id,false);
  update public.angelcare_marketplace_territory_settings set effective_value=to_jsonb(upper(trim(p_country_code))) where territory_id=v_id and setting_key='identity.country';
  update public.angelcare_marketplace_territory_settings set effective_value=to_jsonb(p_default_locale) where territory_id=v_id and setting_key='localization.default_locale';
  update public.angelcare_marketplace_territory_settings set effective_value=to_jsonb(p_active_locales) where territory_id=v_id and setting_key='localization.active_locales';
  update public.angelcare_marketplace_territory_settings set effective_value=to_jsonb(p_currency_label) where territory_id=v_id and setting_key='finance.currency_label';
  update public.angelcare_marketplace_territory_settings set effective_value=to_jsonb(p_timezone) where territory_id=v_id and setting_key='operations.timezone';
  foreach v_city in array coalesce(p_city_names,array[]::text[]) loop
    insert into public.angelcare_marketplace_territory_city_zones(territory_id,city_name,coverage_status,owner_id) values(v_id,trim(v_city),'planned',p_owner_id) on conflict do nothing;
  end loop;
  foreach v_contact in array array['public','operations','escalation'] loop
    v_payload:=coalesce(p_support->v_contact,'{}'::jsonb);
    if v_payload <> '{}'::jsonb then
      insert into public.angelcare_marketplace_territory_support_contacts(territory_id,contact_type,name,email,phone)
      values(v_id,v_contact,v_payload->>'name',v_payload->>'email',v_payload->>'phone') on conflict (territory_id,contact_type) do update set name=excluded.name,email=excluded.email,phone=excluded.phone;
    end if;
  end loop;
  if p_owner_id is not null then insert into public.angelcare_marketplace_territory_assignments(territory_id,app_user_id,assignment_role,assigned_by) values(v_id,p_owner_id,'territory_owner',p_actor_id) on conflict do nothing; end if;
  perform public.angelcare_marketplace_seed_territory_gates(v_id,p_actor_id);
  insert into public.angelcare_marketplace_territory_health_events(territory_id,event_key,category,severity,title,description,status,source,owner_id,created_by)
  values(v_id,'territory.created','governance','info','Territoire créé','Configuration et gates générées; aucun lancement n’est simulé.','resolved','territory-os',p_owner_id,p_actor_id);
  return v_id;
end $$;

create or replace function public.angelcare_marketplace_clone_territory(
  p_source_territory_id uuid,p_territory_code text,p_name text,p_country_code text,p_timezone text,p_currency_label text,
  p_default_locale text,p_active_locales text[],p_owner_id uuid,p_executive_sponsor_id uuid,p_inherited_domains text[],
  p_allowed_override_categories text[],p_idempotency_key text,p_actor_id uuid,p_request_id text)
returns uuid language plpgsql security definer set search_path=public as $$
declare v_id uuid; v_existing uuid;
begin
  select target_territory_id into v_existing from public.angelcare_marketplace_territory_clone_operations where idempotency_key=p_idempotency_key and status='completed';
  if v_existing is not null then return v_existing; end if;
  insert into public.angelcare_marketplace_territory_clone_operations(idempotency_key,source_territory_id,inherited_domains,allowed_override_categories,status,created_by)
  values(p_idempotency_key,p_source_territory_id,coalesce(p_inherited_domains,'{}'),coalesce(p_allowed_override_categories,'{}'),'started',p_actor_id)
  on conflict (idempotency_key) do update set status='started' returning target_territory_id into v_existing;
  if v_existing is not null then return v_existing; end if;
  insert into public.angelcare_marketplace_territories
    (territory_code,name,country_code,territory_type,timezone,currency_label,default_locale,active_locales,status,owner_id,executive_sponsor_id,source_territory_id,inheritance_version,created_by,updated_by,metadata)
  select upper(trim(p_territory_code)),trim(p_name),upper(trim(p_country_code)),territory_type,p_timezone,p_currency_label,p_default_locale,p_active_locales,'configuring',p_owner_id,p_executive_sponsor_id,id,inheritance_version+1,p_actor_id,p_actor_id,jsonb_build_object('clone_request_id',p_request_id,'inherited_domains',p_inherited_domains,'allowed_override_categories',p_allowed_override_categories)
  from public.angelcare_marketplace_territories where id=p_source_territory_id returning id into v_id;
  if v_id is null then raise exception 'SOURCE_TERRITORY_NOT_FOUND'; end if;
  insert into public.angelcare_marketplace_territory_settings
    (territory_id,setting_key,category,label,description,source_type,source_id,source_version,inheritance_mode,is_locked,local_override_allowed,effective_value,owner_id,updated_by)
  select v_id,setting_key,category,label,description,'territory',p_source_territory_id,coalesce(source_version,1)+1,
         case when is_locked then 'locked_global' else 'inherited_snapshot' end,is_locked,
         (local_override_allowed and (cardinality(coalesce(p_allowed_override_categories,'{}'))=0 or category=any(p_allowed_override_categories))),effective_value,p_owner_id,p_actor_id
  from public.angelcare_marketplace_territory_settings where territory_id=p_source_territory_id
  on conflict (territory_id,setting_key) do nothing;
  insert into public.angelcare_marketplace_territory_city_zones(territory_id,city_name,zone_name,coverage_status,service_scope,owner_id)
  select v_id,city_name,zone_name,'planned',service_scope,p_owner_id from public.angelcare_marketplace_territory_city_zones where territory_id=p_source_territory_id and ('operations'=any(coalesce(p_inherited_domains,'{}')) or cardinality(coalesce(p_inherited_domains,'{}'))=0) on conflict do nothing;
  insert into public.angelcare_marketplace_territory_support_contacts(territory_id,contact_type,name,email,phone,active)
  select v_id,contact_type,name,email,phone,false from public.angelcare_marketplace_territory_support_contacts where territory_id=p_source_territory_id and ('support'=any(coalesce(p_inherited_domains,'{}')) or cardinality(coalesce(p_inherited_domains,'{}'))=0) on conflict do nothing;
  if p_owner_id is not null then insert into public.angelcare_marketplace_territory_assignments(territory_id,app_user_id,assignment_role,assigned_by) values(v_id,p_owner_id,'territory_owner',p_actor_id) on conflict do nothing; end if;
  perform public.angelcare_marketplace_seed_territory_gates(v_id,p_actor_id);
  update public.angelcare_marketplace_territory_clone_operations set target_territory_id=v_id,status='completed',result=jsonb_build_object('territory_id',v_id,'request_id',p_request_id),completed_at=timezone('utc',now()) where idempotency_key=p_idempotency_key;
  insert into public.angelcare_marketplace_territory_health_events(territory_id,event_key,category,severity,title,description,status,source,owner_id,created_by)
  values(v_id,'territory.cloned','governance','info','Territoire cloné','Standards hérités, overrides locaux et gates générés.','resolved','territory-os',p_owner_id,p_actor_id);
  return v_id;
exception when others then
  update public.angelcare_marketplace_territory_clone_operations set status='failed',result=jsonb_build_object('error',sqlerrm),completed_at=timezone('utc',now()) where idempotency_key=p_idempotency_key;
  raise;
end $$;

-- Roles and permission catalog.
insert into public.angelcare_marketplace_roles(role_key,name,description) values
 ('marketplace_territory_director','Direction territoire','Pilotage des territoires assignés et préparation au lancement.'),
 ('marketplace_localization_manager','Responsable localisation','Gestion des langues et preuves de localisation.'),
 ('marketplace_catalog_manager','Responsable catalogue territoire','Préparation des disponibilités catalogue par territoire.'),
 ('marketplace_finance_reviewer','Revue finance territoire','Validation devise, pricing et readiness financière.'),
 ('marketplace_operations_lead','Responsable opérations territoire','Zones, capacité et préparation opérationnelle.'),
 ('marketplace_quality_reviewer','Revue qualité et conformité','Validation trust, légal et qualité.' )
on conflict (role_key) do update set name=excluded.name,description=excluded.description,active=true;

insert into public.angelcare_marketplace_permissions(permission_key,name,category,sensitive) values
 ('marketplace.territories.view','Consulter les territoires','Territory OS',false),('marketplace.territories.create','Créer un territoire','Territory OS',true),
 ('marketplace.territories.update','Modifier un territoire','Territory OS',true),('marketplace.territories.clone','Cloner un territoire','Territory OS',true),
 ('marketplace.territories.submit_review','Soumettre à la revue','Territory OS',true),('marketplace.territories.approve_soft_launch','Approuver un soft launch','Territory OS',true),
 ('marketplace.territories.approve_live','Approuver une mise en service','Territory OS',true),('marketplace.territories.pause','Suspendre un territoire','Territory OS',true),
 ('marketplace.territories.resume','Réactiver un territoire','Territory OS',true),('marketplace.territories.archive','Archiver un territoire','Territory OS',true),
 ('marketplace.territories.preview','Prévisualiser un territoire','Territory OS',false),('marketplace.territories.export','Exporter les territoires','Territory OS',true),
 ('marketplace.territory_settings.view','Consulter les paramètres territoire','Territory OS',false),('marketplace.territory_settings.manage','Gérer les paramètres territoire','Territory OS',true),
 ('marketplace.territory_overrides.view','Consulter les dérogations','Territory OS',false),('marketplace.territory_overrides.create','Créer une dérogation','Territory OS',true),
 ('marketplace.territory_overrides.review','Réviser une dérogation','Territory OS',true),('marketplace.territory_overrides.approve','Approuver une dérogation','Territory OS',true),
 ('marketplace.territory_overrides.reject','Rejeter une dérogation','Territory OS',true),('marketplace.territory_overrides.rollback','Annuler une dérogation','Territory OS',true),
 ('marketplace.territory_readiness.view','Consulter la préparation territoire','Territory OS',false),('marketplace.territory_readiness.manage','Gérer les gates territoire','Territory OS',true),
 ('marketplace.territory_readiness.review','Réviser les gates territoire','Territory OS',true),('marketplace.territory_readiness.sign_off','Signer la préparation territoire','Territory OS',true),
 ('marketplace.territory_health.view','Consulter la santé territoire','Territory OS',false),('marketplace.territory_health.manage','Gérer la santé territoire','Territory OS',true)
on conflict (permission_key) do update set name=excluded.name,category=excluded.category,sensitive=excluded.sensitive;

insert into public.angelcare_marketplace_role_permissions(role_key,permission_key)
select r.role_key,p.permission_key from public.angelcare_marketplace_roles r cross join public.angelcare_marketplace_permissions p
where r.role_key in ('marketplace_admin','marketplace_executive') and p.permission_key like 'marketplace.territor%'
on conflict do nothing;
insert into public.angelcare_marketplace_role_permissions(role_key,permission_key)
select 'marketplace_territory_director',permission_key from public.angelcare_marketplace_permissions where permission_key in
 ('marketplace.territories.view','marketplace.territories.update','marketplace.territories.submit_review','marketplace.territories.preview','marketplace.territories.export','marketplace.territory_settings.view','marketplace.territory_settings.manage','marketplace.territory_overrides.view','marketplace.territory_overrides.create','marketplace.territory_readiness.view','marketplace.territory_readiness.manage','marketplace.territory_health.view','marketplace.territory_health.manage')
on conflict do nothing;

insert into public.angelcare_marketplace_feature_flags(flag_key,name,description,enabled,scope_type,status,reason)
values('marketplace.territory-os.enabled','Territory OS','Contrôle de disponibilité du moteur d’expansion gouverné.',true,'global','active','Mega ZIP 02 installé; activation gouvernée.')
on conflict (flag_key) do update set enabled=true,status='active',description=excluded.description,version=public.angelcare_marketplace_feature_flags.version+1;

update public.angelcare_marketplace_modules set status='enabled',enabled=true,health_status='healthy',route_prefix='/angelcare-marketplace/admin/territories',required_permissions=array['marketplace.territories.view'],feature_flag_key='marketplace.territory-os.enabled',updated_at=timezone('utc',now()),version=version+1 where module_key='marketplace.territory-os';

insert into public.angelcare_marketplace_readiness_checks(check_key,name,category,description,status,owner_role,next_action,required_for_release,sort_order)
values('mega_zip_02.territory_os','Mega ZIP 02 · Territory OS','Territory OS','Création, clonage, héritage, overrides, gates, isolation, santé et audit.','in_progress','marketplace_territory_director','Appliquer la migration puis exécuter la QA runtime Territory 1 → Territory 2.',true,20)
on conflict (check_key) do update set name=excluded.name,description=excluded.description,status='in_progress',next_action=excluded.next_action,updated_at=timezone('utc',now());

insert into public.angelcare_marketplace_territory_templates(template_key,name,description,territory_type,active)
values('global-country-master','Global Country Master','Constitution de référence pour un territoire pays, sans faux catalogue ni faux lancement.','country',true)
on conflict (template_key) do update set name=excluded.name,description=excluded.description,active=true,version=public.angelcare_marketplace_territory_templates.version+1;

-- Truthful Territory 1 master: configuration required, not live.
do $$ declare v_id uuid; v_template uuid;
begin
 select id into v_template from public.angelcare_marketplace_territory_templates where template_key='global-country-master';
 insert into public.angelcare_marketplace_territories(territory_code,name,country_code,territory_type,timezone,currency_label,default_locale,active_locales,status,source_template_id,readiness_score,health_status,metadata)
 values('MA-MASTER','Territory 1 · Maroc Master','MA','country','Africa/Casablanca','Dh','fr',array['fr','en','ar'],'configuring',v_template,0,'at_risk',jsonb_build_object('master_operational_world',true,'seed_truth','configuration_required'))
 on conflict (territory_code) do update set source_template_id=coalesce(public.angelcare_marketplace_territories.source_template_id,excluded.source_template_id)
 returning id into v_id;
 perform public.angelcare_marketplace_seed_territory_settings(v_id,'global_master',v_id,null,false);
 update public.angelcare_marketplace_territory_settings set is_locked=true,local_override_allowed=false,inheritance_mode='locked_global' where territory_id=v_id and setting_key in ('security.scope_policy');
 perform public.angelcare_marketplace_seed_territory_gates(v_id,null);
end $$;

-- RLS and direct-access protection. Server-side service role remains the only direct data layer.
do $$ declare t text;
begin
 foreach t in array array[
  'angelcare_marketplace_territory_templates','angelcare_marketplace_territory_template_items','angelcare_marketplace_territories','angelcare_marketplace_territory_settings',
  'angelcare_marketplace_territory_city_zones','angelcare_marketplace_territory_support_contacts','angelcare_marketplace_territory_assignments',
  'angelcare_marketplace_territory_overrides','angelcare_marketplace_territory_override_reviews','angelcare_marketplace_territory_launch_checks',
  'angelcare_marketplace_territory_launch_approvals','angelcare_marketplace_territory_health_events','angelcare_marketplace_territory_clone_operations'
 ] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('revoke all on public.%I from anon, authenticated',t);
  execute format('grant all on public.%I to service_role',t);
 end loop;
end $$;

grant execute on function public.angelcare_marketplace_create_territory(text,text,text,text,text,text,text,text[],uuid,uuid,uuid,timestamptz,text[],jsonb,text,uuid,text) to service_role;
grant execute on function public.angelcare_marketplace_clone_territory(uuid,text,text,text,text,text,text,text[],uuid,uuid,text[],text[],text,uuid,text) to service_role;
grant execute on function public.angelcare_marketplace_seed_territory_gates(uuid,uuid) to service_role;
grant execute on function public.angelcare_marketplace_seed_territory_settings(uuid,text,uuid,uuid,boolean) to service_role;
