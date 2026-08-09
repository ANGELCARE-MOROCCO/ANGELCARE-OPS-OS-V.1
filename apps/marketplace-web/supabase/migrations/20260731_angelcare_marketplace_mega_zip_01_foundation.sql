-- ANGELCARE BUILD 360 — MEGA ZIP 01
-- Additive foundation for apps/ops-web/angelcare-marketplace.
-- No existing table, column or policy is dropped or renamed.

create extension if not exists pgcrypto;

create or replace function public.angelcare_marketplace_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.angelcare_marketplace_roles (
  role_key text primary key,
  name text not null,
  description text,
  system_role boolean not null default true,
  active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.angelcare_marketplace_permissions (
  permission_key text primary key,
  name text not null,
  category text not null,
  sensitive boolean not null default false,
  description text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.angelcare_marketplace_role_permissions (
  role_key text not null references public.angelcare_marketplace_roles(role_key) on update cascade on delete cascade,
  permission_key text not null references public.angelcare_marketplace_permissions(permission_key) on update cascade on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (role_key, permission_key)
);

create table if not exists public.angelcare_marketplace_user_role_assignments (
  id uuid primary key default gen_random_uuid(),
  app_user_id uuid not null,
  role_key text not null references public.angelcare_marketplace_roles(role_key) on update cascade,
  scope_type text not null default 'global'
    check (scope_type in ('global', 'territory', 'tenant', 'self', 'assigned', 'read_only')),
  territory_id uuid,
  tenant_id uuid,
  active boolean not null default true,
  assigned_by uuid,
  reason text,
  starts_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique nulls not distinct (app_user_id, role_key, territory_id, tenant_id)
);

create table if not exists public.angelcare_marketplace_modules (
  id uuid primary key default gen_random_uuid(),
  module_key text not null unique,
  name text not null,
  description text,
  route_prefix text not null,
  module_type text not null default 'workspace',
  audience text[] not null default '{}'::text[],
  icon_key text,
  navigation_group text,
  navigation_order integer not null default 999,
  status text not null default 'registered'
    check (status in ('registered', 'not_installed', 'disabled', 'enabled', 'blocked', 'degraded', 'deprecated', 'archived')),
  enabled boolean not null default false,
  required_permissions text[] not null default '{}'::text[],
  required_dependencies text[] not null default '{}'::text[],
  territory_aware boolean not null default false,
  tenant_aware boolean not null default false,
  locale_aware boolean not null default true,
  feature_flag_key text,
  health_status text not null default 'unknown'
    check (health_status in ('healthy', 'degraded', 'blocked', 'unknown')),
  owner_role text,
  introduced_by_mega_zip integer not null check (introduced_by_mega_zip between 1 and 20),
  version integer not null default 1 check (version > 0),
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  archived_at timestamptz
);

create table if not exists public.angelcare_marketplace_module_dependencies (
  module_key text not null references public.angelcare_marketplace_modules(module_key) on update cascade on delete cascade,
  depends_on_module_key text not null references public.angelcare_marketplace_modules(module_key) on update cascade on delete restrict,
  required boolean not null default true,
  reason text,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (module_key, depends_on_module_key),
  check (module_key <> depends_on_module_key)
);

create table if not exists public.angelcare_marketplace_feature_flags (
  id uuid primary key default gen_random_uuid(),
  flag_key text not null unique,
  name text not null,
  description text,
  enabled boolean not null default false,
  scope_type text not null default 'global'
    check (scope_type in ('global', 'territory', 'tenant')),
  scope_id uuid,
  rollout_rule jsonb not null default '{}'::jsonb,
  starts_at timestamptz,
  expires_at timestamptz,
  owner_id uuid,
  reason text,
  status text not null default 'draft'
    check (status in ('draft', 'active', 'inactive', 'expired', 'archived')),
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.angelcare_marketplace_configurations (
  id uuid primary key default gen_random_uuid(),
  config_key text not null,
  label text not null,
  description text,
  value jsonb not null,
  value_type text not null default 'string'
    check (value_type in ('string', 'number', 'boolean', 'json')),
  category text not null,
  editable boolean not null default false,
  sensitive boolean not null default false,
  territory_id uuid,
  tenant_id uuid,
  locale text check (locale is null or locale in ('fr', 'en', 'ar')),
  version integer not null default 1 check (version > 0),
  updated_by uuid,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique nulls not distinct (config_key, territory_id, tenant_id, locale)
);

create table if not exists public.angelcare_marketplace_audit_events (
  id uuid primary key default gen_random_uuid(),
  request_id text not null,
  actor_id uuid,
  actor_role text,
  action text not null,
  object_type text not null,
  object_id text,
  territory_id uuid,
  tenant_id uuid,
  before_value jsonb,
  after_value jsonb,
  reason text,
  result text not null default 'success'
    check (result in ('success', 'denied', 'failed')),
  severity text not null default 'info'
    check (severity in ('info', 'warning', 'critical')),
  source text not null default 'angelcare-marketplace',
  ip_address text,
  device_context jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.angelcare_marketplace_readiness_checks (
  id uuid primary key default gen_random_uuid(),
  check_key text not null unique,
  name text not null,
  category text not null,
  description text,
  status text not null default 'not_started'
    check (status in ('not_started', 'in_progress', 'ready', 'blocked', 'not_applicable')),
  owner_role text,
  evidence jsonb not null default '{}'::jsonb,
  blocker text,
  notes text,
  next_action text,
  last_verified_at timestamptz,
  verified_by uuid,
  required_for_release boolean not null default true,
  sort_order integer not null default 999,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.angelcare_marketplace_release_records (
  id uuid primary key default gen_random_uuid(),
  mega_zip integer not null check (mega_zip between 1 and 20),
  release_key text not null unique,
  version text not null,
  status text not null
    check (status in ('draft', 'conditionally_accepted', 'accepted', 'rejected', 'superseded')),
  signed_by uuid,
  signed_at timestamptz,
  notes text,
  evidence_summary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists angelcare_marketplace_modules_status_idx
  on public.angelcare_marketplace_modules(status, navigation_order);
create index if not exists angelcare_marketplace_modules_audience_idx
  on public.angelcare_marketplace_modules using gin(audience);
create index if not exists angelcare_marketplace_assignments_user_idx
  on public.angelcare_marketplace_user_role_assignments(app_user_id, active);
create index if not exists angelcare_marketplace_flags_scope_idx
  on public.angelcare_marketplace_feature_flags(scope_type, scope_id, enabled);
create index if not exists angelcare_marketplace_audit_created_idx
  on public.angelcare_marketplace_audit_events(created_at desc);
create index if not exists angelcare_marketplace_audit_actor_idx
  on public.angelcare_marketplace_audit_events(actor_id, created_at desc);
create index if not exists angelcare_marketplace_audit_object_idx
  on public.angelcare_marketplace_audit_events(object_type, object_id, created_at desc);
create index if not exists angelcare_marketplace_readiness_status_idx
  on public.angelcare_marketplace_readiness_checks(status, required_for_release, sort_order);

drop trigger if exists angelcare_marketplace_roles_updated_at on public.angelcare_marketplace_roles;
create trigger angelcare_marketplace_roles_updated_at
before update on public.angelcare_marketplace_roles
for each row execute function public.angelcare_marketplace_set_updated_at();

drop trigger if exists angelcare_marketplace_assignments_updated_at on public.angelcare_marketplace_user_role_assignments;
create trigger angelcare_marketplace_assignments_updated_at
before update on public.angelcare_marketplace_user_role_assignments
for each row execute function public.angelcare_marketplace_set_updated_at();

drop trigger if exists angelcare_marketplace_modules_updated_at on public.angelcare_marketplace_modules;
create trigger angelcare_marketplace_modules_updated_at
before update on public.angelcare_marketplace_modules
for each row execute function public.angelcare_marketplace_set_updated_at();

drop trigger if exists angelcare_marketplace_flags_updated_at on public.angelcare_marketplace_feature_flags;
create trigger angelcare_marketplace_flags_updated_at
before update on public.angelcare_marketplace_feature_flags
for each row execute function public.angelcare_marketplace_set_updated_at();

drop trigger if exists angelcare_marketplace_configurations_updated_at on public.angelcare_marketplace_configurations;
create trigger angelcare_marketplace_configurations_updated_at
before update on public.angelcare_marketplace_configurations
for each row execute function public.angelcare_marketplace_set_updated_at();

drop trigger if exists angelcare_marketplace_readiness_updated_at on public.angelcare_marketplace_readiness_checks;
create trigger angelcare_marketplace_readiness_updated_at
before update on public.angelcare_marketplace_readiness_checks
for each row execute function public.angelcare_marketplace_set_updated_at();

insert into public.angelcare_marketplace_roles (role_key, name, description)
values
  ('marketplace_executive', 'Direction Marketplace', 'Revue stratégique, sign-off et contrôle global.'),
  ('marketplace_admin', 'Administration Marketplace', 'Administration complète de la fondation Marketplace.'),
  ('marketplace_security', 'Sécurité Marketplace', 'Contrôle des permissions, preuves et événements sensibles.'),
  ('marketplace_manager', 'Manager Marketplace', 'Pilotage opérationnel des objets autorisés.'),
  ('marketplace_parent', 'Parent / famille', 'Accès aux espaces famille autorisés.'),
  ('marketplace_tenant', 'Utilisateur tenant', 'Accès au périmètre organisationnel autorisé.'),
  ('marketplace_provider', 'Prestataire / caregiver', 'Accès aux capacités provider autorisées.'),
  ('marketplace_supplier', 'Fournisseur', 'Accès aux capacités fournisseur autorisées.'),
  ('marketplace_viewer', 'Lecteur Marketplace', 'Consultation minimale de la fondation.')
on conflict (role_key) do update
set name = excluded.name,
    description = excluded.description,
    active = true,
    updated_at = timezone('utc', now());

insert into public.angelcare_marketplace_permissions
  (permission_key, name, category, sensitive, description)
values
  ('marketplace.foundation.view', 'Consulter la fondation', 'Fondation', false, 'Voir les surfaces de fondation autorisées.'),
  ('marketplace.workspace.access', 'Accéder à l’espace sécurisé', 'Fondation', false, 'Ouvrir l’espace Marketplace authentifié.'),
  ('marketplace.admin.access', 'Accéder au Master Backoffice', 'Administration', true, 'Ouvrir les surfaces de contrôle Marketplace.'),
  ('marketplace.modules.view', 'Consulter les modules', 'Modules', false, 'Voir le registre et les détails des modules.'),
  ('marketplace.modules.create', 'Enregistrer un module', 'Modules', true, 'Créer une définition de module durable.'),
  ('marketplace.modules.update', 'Modifier un module', 'Modules', true, 'Modifier une définition et ses dépendances.'),
  ('marketplace.modules.enable', 'Activer un module', 'Modules', true, 'Activer un module après contrôle des dépendances.'),
  ('marketplace.modules.disable', 'Désactiver un module', 'Modules', true, 'Désactiver un module de manière gouvernée.'),
  ('marketplace.modules.archive', 'Archiver un module', 'Modules', true, 'Archiver une définition obsolète.'),
  ('marketplace.feature_flags.view', 'Consulter les feature flags', 'Activation', false, 'Voir les contrôles d’activation.'),
  ('marketplace.feature_flags.manage', 'Gérer les feature flags', 'Activation', true, 'Créer et modifier les contrôles d’activation.'),
  ('marketplace.configuration.view', 'Consulter la configuration', 'Configuration', false, 'Voir les paramètres non secrets.'),
  ('marketplace.configuration.manage', 'Gérer la configuration', 'Configuration', true, 'Modifier les paramètres métier autorisés.'),
  ('marketplace.audit.view', 'Consulter l’audit', 'Sécurité', true, 'Voir les preuves d’actions sensibles.'),
  ('marketplace.audit.export', 'Exporter l’audit', 'Sécurité', true, 'Exporter les preuves autorisées.'),
  ('marketplace.security.view', 'Consulter la sécurité', 'Sécurité', true, 'Voir le contexte de sécurité et les contrôles.'),
  ('marketplace.security.manage', 'Gérer la sécurité', 'Sécurité', true, 'Administrer les contrôles de sécurité autorisés.'),
  ('marketplace.readiness.view', 'Consulter la préparation', 'Gouvernance', false, 'Voir les contrôles et preuves de préparation.'),
  ('marketplace.readiness.update', 'Mettre à jour la préparation', 'Gouvernance', true, 'Modifier un contrôle avec preuve et raison.'),
  ('marketplace.readiness.review', 'Réviser la préparation', 'Gouvernance', true, 'Effectuer une revue spécialisée.'),
  ('marketplace.readiness.sign_off', 'Signer la préparation', 'Gouvernance', true, 'Enregistrer le sign-off réel de la release.')
on conflict (permission_key) do update
set name = excluded.name,
    category = excluded.category,
    sensitive = excluded.sensitive,
    description = excluded.description;

with seed_grants(role_key, permission_key) as (
  select 'marketplace_executive', permission_key
  from public.angelcare_marketplace_permissions
  union all
  select 'marketplace_admin', permission_key
  from public.angelcare_marketplace_permissions
  union all
  values
    ('marketplace_security', 'marketplace.foundation.view'),
    ('marketplace_security', 'marketplace.workspace.access'),
    ('marketplace_security', 'marketplace.admin.access'),
    ('marketplace_security', 'marketplace.modules.view'),
    ('marketplace_security', 'marketplace.feature_flags.view'),
    ('marketplace_security', 'marketplace.configuration.view'),
    ('marketplace_security', 'marketplace.audit.view'),
    ('marketplace_security', 'marketplace.audit.export'),
    ('marketplace_security', 'marketplace.security.view'),
    ('marketplace_security', 'marketplace.security.manage'),
    ('marketplace_security', 'marketplace.readiness.view'),
    ('marketplace_security', 'marketplace.readiness.review'),
    ('marketplace_manager', 'marketplace.foundation.view'),
    ('marketplace_manager', 'marketplace.workspace.access'),
    ('marketplace_manager', 'marketplace.admin.access'),
    ('marketplace_manager', 'marketplace.modules.view'),
    ('marketplace_manager', 'marketplace.modules.update'),
    ('marketplace_manager', 'marketplace.feature_flags.view'),
    ('marketplace_manager', 'marketplace.configuration.view'),
    ('marketplace_manager', 'marketplace.readiness.view'),
    ('marketplace_manager', 'marketplace.readiness.update'),
    ('marketplace_parent', 'marketplace.foundation.view'),
    ('marketplace_parent', 'marketplace.workspace.access'),
    ('marketplace_tenant', 'marketplace.foundation.view'),
    ('marketplace_tenant', 'marketplace.workspace.access'),
    ('marketplace_provider', 'marketplace.foundation.view'),
    ('marketplace_provider', 'marketplace.workspace.access'),
    ('marketplace_supplier', 'marketplace.foundation.view'),
    ('marketplace_supplier', 'marketplace.workspace.access'),
    ('marketplace_viewer', 'marketplace.foundation.view')
)
insert into public.angelcare_marketplace_role_permissions (role_key, permission_key)
select role_key, permission_key from seed_grants
on conflict do nothing;

insert into public.angelcare_marketplace_modules
  (module_key, name, description, route_prefix, module_type, audience, navigation_group,
   navigation_order, status, enabled, required_permissions, required_dependencies,
   territory_aware, tenant_aware, locale_aware, feature_flag_key, health_status,
   owner_role, introduced_by_mega_zip)
values
  ('marketplace.foundation', 'Build Kernel, Design System & App Foundation',
   'Constitution technique, visuelle, permissionnelle et de gouvernance du Marketplace.',
   '/angelcare-marketplace', 'foundation',
   array['public','parent','tenant','provider','supplier','admin','executive','territory_manager'],
   'Fondation', 10, 'enabled', true,
   array['marketplace.foundation.view'], '{}'::text[],
   true, true, true, 'marketplace.foundation.enabled', 'healthy',
   'marketplace_admin', 1),
  ('marketplace.territory-os', 'Territory OS Core & Global Expansion Layer',
   'Registre territorial, clonage, héritage, overrides, launch gates et santé.',
   '/angelcare-marketplace/admin/territories', 'control_plane',
   array['admin','executive','territory_manager'], 'Expansion', 20, 'not_installed', false,
   '{}'::text[], array['marketplace.foundation'], true, false, true, null, 'unknown',
   'territory_manager', 2),
  ('marketplace.localization', 'Localization, EN/FR/AR, Arabic RTL & SEO Foundation',
   'Centre de localisation, glossaire, traductions sensibles et SEO.',
   '/angelcare-marketplace/admin/localization', 'control_plane',
   array['admin','territory_manager'], 'Expérience', 30, 'not_installed', false,
   '{}'::text[], array['marketplace.foundation'], true, true, true, null, 'unknown',
   'marketplace_admin', 3),
  ('marketplace.master-backoffice', 'Master Backoffice Control Plane',
   'Cockpit exécutif, recherche, approbations, audit et détails d’objets.',
   '/angelcare-marketplace/admin/command', 'control_plane',
   array['admin','executive'], 'Commandement', 40, 'not_installed', false,
   '{}'::text[], array['marketplace.foundation','marketplace.territory-os'], true, true, true, null, 'unknown',
   'marketplace_admin', 4),
  ('marketplace.experience-builder', 'Experience Builder & Public CMS Engine',
   'Pages, blocs, menus, CTA, versioning, publication et rollback.',
   '/angelcare-marketplace/admin/experience-builder', 'control_plane',
   array['admin','territory_manager'], 'Expérience', 50, 'not_installed', false,
   '{}'::text[], array['marketplace.foundation','marketplace.localization'], true, true, true, null, 'unknown',
   'marketplace_admin', 5),
  ('marketplace.public-universe', 'Global Public Front-End Universe',
   'Accueil, routeur d’audiences, Trust Center et entrées Marketplace, Partner OS et Academy.',
   '/angelcare-marketplace/universe', 'public',
   array['public'], 'Public', 60, 'not_installed', false,
   '{}'::text[], array['marketplace.foundation','marketplace.experience-builder'], true, false, true, null, 'unknown',
   'marketplace_admin', 6),
  ('marketplace.family', 'B2C Family Experience Engine',
   'Profil enfant, diagnostic, devis, dashboard parent, rapports et support.',
   '/angelcare-marketplace/family', 'workspace',
   array['parent'], 'B2C', 70, 'not_installed', false,
   '{}'::text[], array['marketplace.foundation','marketplace.public-universe'], true, false, true, null, 'unknown',
   'marketplace_manager', 7),
  ('marketplace.child-development', 'Child Development, Montessori & Kits Experience',
   'Catégories Montessori, activités cognitives, kits, bundles et guides.',
   '/angelcare-marketplace/development', 'marketplace',
   array['public','parent','tenant','provider','supplier'], 'Marketplace', 80, 'not_installed', false,
   '{}'::text[], array['marketplace.foundation'], true, true, true, null, 'unknown',
   'marketplace_manager', 8),
  ('marketplace.core', 'Marketplace Core Engine',
   'Catalogue unifié, paniers de devis, fournisseurs, filtres et commissions.',
   '/angelcare-marketplace/catalog', 'marketplace',
   array['public','parent','tenant','provider','supplier','admin'], 'Marketplace', 90, 'not_installed', false,
   '{}'::text[], array['marketplace.foundation','marketplace.child-development'], true, true, true, null, 'unknown',
   'marketplace_manager', 9),
  ('marketplace.crm', 'CRM, Sales, Quote & Partnership Pipeline',
   'Leads, comptes, opportunités, devis, tâches, communications et proof packs.',
   '/angelcare-marketplace/admin/crm', 'control_plane',
   array['admin','executive'], 'Commercial', 100, 'not_installed', false,
   '{}'::text[], array['marketplace.foundation'], true, true, true, null, 'unknown',
   'marketplace_manager', 10),
  ('marketplace.partner-os', 'Partner OS Public + Tenant SaaS Foundation',
   'Tenant model, modules, plans, abonnements, utilisateurs et isolation.',
   '/angelcare-marketplace/partner-os', 'saas',
   array['public','tenant','admin'], 'SaaS', 110, 'not_installed', false,
   '{}'::text[], array['marketplace.foundation','marketplace.crm'], true, true, true, null, 'unknown',
   'marketplace_admin', 11),
  ('marketplace.establishments', 'Establishments, Schools & Crèches Experience',
   'Diagnostic B2B, demo SaaS, Academy, Quality Check 360 et conversion tenant.',
   '/angelcare-marketplace/establishments', 'vertical',
   array['public','tenant','admin'], 'Verticaux B2B', 120, 'not_installed', false,
   '{}'::text[], array['marketplace.partner-os'], true, true, true, null, 'unknown',
   'marketplace_manager', 12),
  ('marketplace.hospitality', 'Hotels & Hospitality Experience',
   'Programmes kids-friendly, guest childcare, saisons et rapports.',
   '/angelcare-marketplace/hospitality', 'vertical',
   array['public','tenant','provider','admin'], 'Verticaux B2B', 130, 'not_installed', false,
   '{}'::text[], array['marketplace.partner-os'], true, true, true, null, 'unknown',
   'marketplace_manager', 13),
  ('marketplace.clinics-maternity', 'Clinics, Maternity & Health-Adjacent Support',
   'Référencement, consentement, soutien non médical, ateliers et rapports.',
   '/angelcare-marketplace/clinics-maternity', 'vertical',
   array['public','parent','tenant','admin'], 'Verticaux B2B', 140, 'not_installed', false,
   '{}'::text[], array['marketplace.partner-os'], true, true, true, null, 'unknown',
   'marketplace_manager', 14),
  ('marketplace.corporate', 'Corporate & HR Experience',
   'Avantages familles, family days, urgence, quotas et rapports d’impact.',
   '/angelcare-marketplace/corporate', 'vertical',
   array['public','parent','tenant','admin'], 'Verticaux B2B', 150, 'not_installed', false,
   '{}'::text[], array['marketplace.partner-os'], true, true, true, null, 'unknown',
   'marketplace_manager', 15),
  ('marketplace.academy', 'Academy, Training & Certification Engine',
   'Catalogue, cohortes, présence, évaluations, certificats et renouvellements.',
   '/angelcare-marketplace/academy', 'academy',
   array['public','tenant','provider','admin'], 'Academy', 160, 'not_installed', false,
   '{}'::text[], array['marketplace.foundation'], true, true, true, null, 'unknown',
   'marketplace_manager', 16),
  ('marketplace.provider-portal', 'Caregiver, Trainer & Provider Operations Portal',
   'Onboarding, documents, certification, disponibilité, missions et payabilité.',
   '/angelcare-marketplace/provider', 'workspace',
   array['provider','admin'], 'Opérations', 170, 'not_installed', false,
   '{}'::text[], array['marketplace.academy'], true, true, true, null, 'unknown',
   'marketplace_manager', 17),
  ('marketplace.operations', 'Operations, Dispatch, Incidents & Mission Proof',
   'Cockpit opérations, dispatch, cycle mission, preuves, incidents et validation.',
   '/angelcare-marketplace/admin/operations', 'control_plane',
   array['provider','admin','executive'], 'Opérations', 180, 'not_installed', false,
   '{}'::text[], array['marketplace.provider-portal'], true, true, true, null, 'unknown',
   'marketplace_manager', 18),
  ('marketplace.trust-quality', 'Trust, SOP, Quality Check 360 & Compliance Layer',
   'SOP, badges, preuves, audits, plaintes et actions correctives.',
   '/angelcare-marketplace/admin/trust-quality', 'control_plane',
   array['public','parent','tenant','provider','supplier','admin','executive'], 'Confiance', 190, 'not_installed', false,
   '{}'::text[], array['marketplace.foundation'], true, true, true, null, 'unknown',
   'marketplace_security', 19),
  ('marketplace.final-hardening', 'Finance Config, Analytics, Security, QA & Final Launch Hardening',
   'Price books, revenus, analytics, sécurité, backups et lancement.',
   '/angelcare-marketplace/admin/launch-readiness', 'control_plane',
   array['admin','executive'], 'Assurance', 200, 'not_installed', false,
   '{}'::text[], array['marketplace.foundation','marketplace.trust-quality'], true, true, true, null, 'unknown',
   'marketplace_executive', 20)
on conflict (module_key) do update
set name = excluded.name,
    description = excluded.description,
    route_prefix = excluded.route_prefix,
    module_type = excluded.module_type,
    audience = excluded.audience,
    navigation_group = excluded.navigation_group,
    navigation_order = excluded.navigation_order,
    required_permissions = excluded.required_permissions,
    required_dependencies = excluded.required_dependencies,
    territory_aware = excluded.territory_aware,
    tenant_aware = excluded.tenant_aware,
    locale_aware = excluded.locale_aware,
    owner_role = excluded.owner_role,
    introduced_by_mega_zip = excluded.introduced_by_mega_zip,
    updated_at = timezone('utc', now());

insert into public.angelcare_marketplace_feature_flags
  (flag_key, name, description, enabled, scope_type, rollout_rule, reason, status, version)
values
  ('marketplace.foundation.enabled', 'Fondation Marketplace active',
   'Contrôle serveur de la fondation Mega ZIP 01.', true, 'global', '{}'::jsonb,
   'Fondation Mega ZIP 01 enregistrée.', 'active', 1),
  ('marketplace.public.entry.enabled', 'Entrée publique Marketplace',
   'Rend disponible uniquement l’entrée publique de fondation, sans catalogue futur.', true, 'global', '{}'::jsonb,
   'Entrée constitutionnelle Mega ZIP 01.', 'active', 1),
  ('marketplace.admin.foundation.enabled', 'Master Backoffice de fondation',
   'Rend les contrôles de fondation disponibles aux permissions autorisées.', true, 'global', '{}'::jsonb,
   'Gouvernance Mega ZIP 01.', 'active', 1)
on conflict (flag_key) do update
set name = excluded.name,
    description = excluded.description,
    enabled = excluded.enabled,
    reason = excluded.reason,
    status = excluded.status,
    updated_at = timezone('utc', now());

insert into public.angelcare_marketplace_configurations
  (config_key, label, description, value, value_type, category, editable, sensitive)
values
  ('marketplace.default_locale', 'Locale par défaut',
   'Locale utilisée lorsque le profil et la route ne fournissent pas une préférence.',
   '"fr"'::jsonb, 'string', 'Localisation', true, false),
  ('marketplace.supported_locales', 'Locales supportées',
   'Fondation trilingue préparée pour FR, EN et AR.',
   '["fr","en","ar"]'::jsonb, 'json', 'Localisation', false, false),
  ('marketplace.route_prefix', 'Préfixe de route',
   'Périmètre de montage obligatoire du produit.',
   '"/angelcare-marketplace"'::jsonb, 'string', 'Architecture', false, false),
  ('marketplace.audit_enabled', 'Audit sensible actif',
   'Obligation d’écriture des preuves pour les mutations sensibles.',
   'true'::jsonb, 'boolean', 'Sécurité', false, false),
  ('marketplace.release_version', 'Version contractuelle',
   'Version active de la fondation Mega ZIP 01.',
   '"mega-zip-01"'::jsonb, 'string', 'Release', false, false),
  ('marketplace.operator_support_note', 'Note de support opérateur',
   'Instruction métier affichable aux opérateurs autorisés.',
   '"Utiliser la préparation et les références de requête pour escalader un blocage."'::jsonb,
   'string', 'Support', true, false),
  ('marketplace.server_secret_status', 'Secrets serveur',
   'Indicateur protégé ; aucune valeur de secret n’est stockée dans ce registre.',
   '{"managed":"server-only","redacted":true}'::jsonb, 'json', 'Sécurité', false, true)
on conflict (config_key, territory_id, tenant_id, locale) do update
set label = excluded.label,
    description = excluded.description,
    value_type = excluded.value_type,
    category = excluded.category,
    editable = excluded.editable,
    sensitive = excluded.sensitive,
    updated_at = timezone('utc', now());

insert into public.angelcare_marketplace_readiness_checks
  (check_key, name, category, description, status, owner_role, required_for_release, sort_order, next_action)
values
  ('routes.registered', 'Routes et adaptateurs enregistrés', 'Architecture',
   'Les routes publiques, protégées, administratives et API sont montées sans déplacer OPS Web.',
   'not_started', 'marketplace_admin', true, 10, 'Exécuter le vérificateur statique et inspecter l’inventaire des routes.'),
  ('design-system.ready', 'Design system premium', 'UX',
   'Tokens, primitives, états et comportements responsive/RTL sont présents et isolés.',
   'not_started', 'marketplace_admin', true, 20, 'Effectuer la revue visuelle desktop, mobile et RTL.'),
  ('shells.ready', 'Shells par audience', 'UX',
   'Les shells public, workspace et Master Backoffice sont utilisables et protégés.',
   'not_started', 'marketplace_admin', true, 30, 'Réaliser les parcours de rendu et d’accès.'),
  ('auth.integrated', 'Authentification OPS intégrée', 'Sécurité',
   'La fondation réutilise l’identité OPS existante sans créer un système concurrent.',
   'not_started', 'marketplace_security', true, 40, 'Tester session valide, absente, expirée et révoquée.'),
  ('rbac.enforced', 'RBAC serveur appliqué', 'Sécurité',
   'Les permissions et périmètres sont vérifiés côté serveur sur les actions protégées.',
   'not_started', 'marketplace_security', true, 50, 'Exécuter les tests positifs et négatifs par rôle.'),
  ('audit.writing', 'Preuves d’audit écrites', 'Sécurité',
   'Les mutations sensibles écrivent acteur, action, objet, raison, résultat et référence.',
   'not_started', 'marketplace_security', true, 60, 'Créer puis modifier un objet et inspecter les événements.'),
  ('api.standard', 'Contrat API stable', 'Backend',
   'Les réponses, erreurs, validations et request IDs suivent la constitution.',
   'not_started', 'marketplace_admin', true, 70, 'Tester succès, validation, permission et conflit.'),
  ('database.migrated', 'Migration additive appliquée', 'Données',
   'Les tables de fondation existent sans suppression ni renommage du schéma existant.',
   'not_started', 'marketplace_admin', true, 80, 'Appliquer la migration puis confirmer les tables et seeds.'),
  ('module-registry.operational', 'Registre des modules opérationnel', 'Gouvernance',
   'Créer, lire, filtrer, détailler et transitionner un module selon permissions et dépendances.',
   'not_started', 'marketplace_admin', true, 90, 'Exécuter le parcours complet du registre.'),
  ('feature-flags.operational', 'Feature flags opérationnels', 'Gouvernance',
   'Créer et activer/désactiver avec raison, périmètre et audit.',
   'not_started', 'marketplace_admin', true, 100, 'Exécuter un changement contrôlé et vérifier l’audit.'),
  ('configuration.governed', 'Configuration gouvernée', 'Gouvernance',
   'Les valeurs éditables sont validées ; les valeurs sensibles restent protégées.',
   'not_started', 'marketplace_admin', true, 110, 'Modifier une valeur autorisée et tenter une valeur serveur.'),
  ('localization.ready', 'Fondation FR/EN/AR', 'Localisation',
   'La stratégie locale et RTL est stable pour le socle.',
   'not_started', 'marketplace_admin', true, 120, 'Inspecter texte long FR et prévisualisation AR RTL.'),
  ('responsive.ready', 'Desktop, tablette et mobile', 'UX',
   'Les shells et écrans clés ne se chevauchent pas et restent opérables.',
   'not_started', 'marketplace_admin', true, 130, 'Capturer les vues clés aux largeurs contractuelles.'),
  ('error-states.ready', 'États loading, empty, error et denied', 'UX',
   'Les états critiques sont lisibles et donnent une prochaine action.',
   'not_started', 'marketplace_admin', true, 140, 'Déclencher chaque état sur les routes clés.'),
  ('documentation.complete', 'Documentation et inventaires', 'Handover',
   'Les routes, composants, entités, APIs, permissions, migrations et opérations sont documentés.',
   'not_started', 'marketplace_admin', true, 150, 'Revoir le pack documentaire et le manifeste.'),
  ('typecheck.passed', 'TypeScript ciblé', 'QA',
   'Le périmètre Mega ZIP 01 passe le contrôle TypeScript sans erreur.',
   'not_started', 'marketplace_admin', true, 160, 'Exécuter le tsconfig ciblé.'),
  ('verifier.passed', 'Vérificateur contractuel', 'QA',
   'Les fichiers, frontières, clauses de sécurité et interdictions sont vérifiés statiquement.',
   'not_started', 'marketplace_admin', true, 170, 'Exécuter verify-mega-zip-01.mjs.'),
  ('ops-web.regression', 'OPS Web préservé', 'Régression',
   'Aucun module OPS existant n’est déplacé, renommé ou modifié par le package.',
   'not_started', 'marketplace_admin', true, 180, 'Comparer le manifeste et exécuter les contrôles de non-régression.'),
  ('runtime.acceptance', 'Acceptation runtime', 'QA',
   'Les parcours réels fonctionnent avec session, base, permissions et audit dans l’environnement cible.',
   'not_started', 'marketplace_executive', true, 190, 'Exécuter le smoke test sur l’environnement ANGELCARE connecté.'),
  ('executive.sign-off', 'Sign-off exécutif', 'Sign-off',
   'Le produit, l’ingénierie, l’UX et les opérations ont confirmé la livraison contractuelle.',
   'not_started', 'marketplace_executive', true, 200, 'Enregistrer les quatre validations et le statut réel.')
on conflict (check_key) do update
set name = excluded.name,
    category = excluded.category,
    description = excluded.description,
    owner_role = excluded.owner_role,
    required_for_release = excluded.required_for_release,
    sort_order = excluded.sort_order,
    next_action = case
      when public.angelcare_marketplace_readiness_checks.status = 'ready'
        then public.angelcare_marketplace_readiness_checks.next_action
      else excluded.next_action
    end,
    updated_at = timezone('utc', now());

alter table public.angelcare_marketplace_roles enable row level security;
alter table public.angelcare_marketplace_permissions enable row level security;
alter table public.angelcare_marketplace_role_permissions enable row level security;
alter table public.angelcare_marketplace_user_role_assignments enable row level security;
alter table public.angelcare_marketplace_modules enable row level security;
alter table public.angelcare_marketplace_module_dependencies enable row level security;
alter table public.angelcare_marketplace_feature_flags enable row level security;
alter table public.angelcare_marketplace_configurations enable row level security;
alter table public.angelcare_marketplace_audit_events enable row level security;
alter table public.angelcare_marketplace_readiness_checks enable row level security;
alter table public.angelcare_marketplace_release_records enable row level security;

revoke all on public.angelcare_marketplace_roles from anon, authenticated;
revoke all on public.angelcare_marketplace_permissions from anon, authenticated;
revoke all on public.angelcare_marketplace_role_permissions from anon, authenticated;
revoke all on public.angelcare_marketplace_user_role_assignments from anon, authenticated;
revoke all on public.angelcare_marketplace_modules from anon, authenticated;
revoke all on public.angelcare_marketplace_module_dependencies from anon, authenticated;
revoke all on public.angelcare_marketplace_feature_flags from anon, authenticated;
revoke all on public.angelcare_marketplace_configurations from anon, authenticated;
revoke all on public.angelcare_marketplace_audit_events from anon, authenticated;
revoke all on public.angelcare_marketplace_readiness_checks from anon, authenticated;
revoke all on public.angelcare_marketplace_release_records from anon, authenticated;

grant all on public.angelcare_marketplace_roles to service_role;
grant all on public.angelcare_marketplace_permissions to service_role;
grant all on public.angelcare_marketplace_role_permissions to service_role;
grant all on public.angelcare_marketplace_user_role_assignments to service_role;
grant all on public.angelcare_marketplace_modules to service_role;
grant all on public.angelcare_marketplace_module_dependencies to service_role;
grant all on public.angelcare_marketplace_feature_flags to service_role;
grant all on public.angelcare_marketplace_configurations to service_role;
grant all on public.angelcare_marketplace_audit_events to service_role;
grant all on public.angelcare_marketplace_readiness_checks to service_role;
grant all on public.angelcare_marketplace_release_records to service_role;

comment on table public.angelcare_marketplace_modules is
  'Mega ZIP 01 module registry. Future modules remain not_installed until their signed contract is executed.';
comment on table public.angelcare_marketplace_audit_events is
  'Append-oriented evidence log for sensitive ANGELCARE Marketplace foundation actions.';
comment on table public.angelcare_marketplace_readiness_checks is
  'Evidence-backed readiness controls. A sign-off remains conditional while required checks are not ready.';
