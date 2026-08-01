-- AngelCare 360 Operator — Product, Monetization & Tenant Entitlement Kernel
-- Additive, operator-only catalogue and entitlement compiler.

begin;

create extension if not exists pgcrypto;

create table if not exists public.angelcare360_operator_product_modules (
  id uuid primary key default gen_random_uuid(),
  module_key text not null unique,
  name text not null,
  short_name text,
  description text,
  commercial_summary text,
  category text not null default 'core',
  status text not null default 'draft',
  sellability text not null default 'internal_only',
  runtime_maturity text not null default 'unverified',
  version text not null default '1.0.0',
  customer_route_prefix text,
  api_prefix text,
  support_owner_role text,
  default_support_tier text not null default 'standard',
  configuration_schema jsonb not null default '{}'::jsonb,
  evidence jsonb not null default '[]'::jsonb,
  region_availability jsonb not null default '["MA"]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  check (status in ('draft','review','published','suspended','retired','archived')),
  check (sellability in ('internal_only','included','standalone','addon_candidate','customer_sellable')),
  check (runtime_maturity in ('operational','configuration_dependent','backend_ready','frontend_only','integration_dependent','locked','deprecated','unverified'))
);

create table if not exists public.angelcare360_operator_product_features (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.angelcare360_operator_product_modules(id) on delete cascade,
  feature_key text not null unique,
  name text not null,
  description text,
  feature_tier text not null default 'standard',
  status text not null default 'draft',
  sellability text not null default 'included',
  runtime_maturity text not null default 'unverified',
  customer_route text,
  api_route text,
  permission_keys jsonb not null default '[]'::jsonb,
  configuration_required boolean not null default false,
  configuration_schema jsonb not null default '{}'::jsonb,
  evidence jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  check (feature_tier in ('basic','standard','advanced','premium','custom')),
  check (status in ('draft','review','published','suspended','retired','archived')),
  check (sellability in ('internal_only','included','premium','addon','customer_sellable')),
  check (runtime_maturity in ('operational','configuration_dependent','backend_ready','frontend_only','integration_dependent','locked','deprecated','unverified'))
);

create table if not exists public.angelcare360_operator_product_addons (
  id uuid primary key default gen_random_uuid(),
  addon_code text not null unique,
  name text not null,
  description text,
  module_id uuid references public.angelcare360_operator_product_modules(id) on delete set null,
  feature_id uuid references public.angelcare360_operator_product_features(id) on delete set null,
  addon_type text not null default 'capability',
  billing_model text not null default 'recurring',
  status text not null default 'draft',
  currency text not null default 'MAD',
  list_price numeric not null default 0,
  included_quantity numeric,
  unit text,
  configuration_schema jsonb not null default '{}'::jsonb,
  region_availability jsonb not null default '["MA"]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  check (addon_type in ('capability','service','support','implementation','capacity','integration')),
  check (billing_model in ('one_time','recurring','usage','included')),
  check (status in ('draft','review','published','suspended','retired','archived'))
);

create table if not exists public.angelcare360_operator_product_meters (
  id uuid primary key default gen_random_uuid(),
  meter_key text not null unique,
  name text not null,
  description text,
  unit text not null,
  meter_type text not null default 'capacity',
  reset_cycle text,
  hard_limit boolean not null default false,
  warning_threshold_pct integer not null default 80,
  topup_enabled boolean not null default true,
  topup_increment numeric,
  status text not null default 'draft',
  source_table text,
  source_column text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  check (meter_type in ('capacity','usage','seat','storage','transaction','service')),
  check (warning_threshold_pct between 1 and 100),
  check (status in ('draft','review','published','suspended','retired','archived'))
);

create table if not exists public.angelcare360_operator_product_dependencies (
  id uuid primary key default gen_random_uuid(),
  source_type text not null,
  source_id uuid not null,
  target_type text not null,
  target_id uuid not null,
  relation_type text not null,
  required_state text,
  reason text,
  created_at timestamptz not null default now(),
  unique (source_type, source_id, target_type, target_id, relation_type),
  check (source_type in ('module','feature','addon','meter')),
  check (target_type in ('module','feature','addon','meter')),
  check (relation_type in ('requires','conflicts','recommends','meters','extends'))
);

create table if not exists public.angelcare360_operator_package_versions (
  id uuid primary key default gen_random_uuid(),
  package_id uuid references public.angelcare360_operator_packages(id) on delete set null,
  version_code text not null unique,
  version_number integer not null default 1,
  name text not null,
  description text,
  target_segment text,
  status text not null default 'draft',
  currency text not null default 'MAD',
  monthly_price numeric not null default 0,
  annual_price numeric not null default 0,
  setup_fee numeric not null default 0,
  support_tier text not null default 'standard',
  implementation_tier text not null default 'standard',
  effective_from date,
  effective_to date,
  region_availability jsonb not null default '["MA"]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  published_at timestamptz,
  published_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status in ('draft','scanned','commercial_review','operational_review','approved','published','retired','archived'))
);

create table if not exists public.angelcare360_operator_package_version_items (
  id uuid primary key default gen_random_uuid(),
  package_version_id uuid not null references public.angelcare360_operator_package_versions(id) on delete cascade,
  item_type text not null,
  item_id uuid not null,
  inclusion_type text not null default 'included',
  quantity numeric,
  configuration jsonb not null default '{}'::jsonb,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (package_version_id, item_type, item_id),
  check (item_type in ('module','feature','addon','meter')),
  check (inclusion_type in ('included','required','optional','excluded'))
);

create table if not exists public.angelcare360_operator_price_books (
  id uuid primary key default gen_random_uuid(),
  price_book_code text not null unique,
  name text not null,
  currency text not null default 'MAD',
  region_code text not null default 'MA',
  status text not null default 'draft',
  effective_from date,
  effective_to date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status in ('draft','active','retired','archived'))
);

create table if not exists public.angelcare360_operator_price_book_entries (
  id uuid primary key default gen_random_uuid(),
  price_book_id uuid not null references public.angelcare360_operator_price_books(id) on delete cascade,
  item_type text not null,
  item_id uuid not null,
  billing_cycle text not null default 'monthly',
  unit_price numeric not null default 0,
  setup_fee numeric not null default 0,
  minimum_quantity numeric,
  maximum_quantity numeric,
  volume_rules jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (price_book_id, item_type, item_id, billing_cycle),
  check (item_type in ('package_version','module','feature','addon','meter')),
  check (billing_cycle in ('one_time','monthly','quarterly','annual','usage'))
);

alter table public.angelcare360_operator_subscriptions
  add column if not exists package_version_id uuid references public.angelcare360_operator_package_versions(id) on delete set null;

create table if not exists public.angelcare360_operator_subscription_addons (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.angelcare360_operator_subscriptions(id) on delete cascade,
  addon_id uuid not null references public.angelcare360_operator_product_addons(id) on delete restrict,
  status text not null default 'active',
  quantity numeric not null default 1,
  unit_price numeric not null default 0,
  start_date date not null default current_date,
  end_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (subscription_id, addon_id, start_date),
  check (status in ('scheduled','active','suspended','cancelled','expired'))
);

create table if not exists public.angelcare360_operator_capacity_topups (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.angelcare360_operator_subscriptions(id) on delete cascade,
  tenant_id uuid references public.angelcare360_operator_tenants(id) on delete cascade,
  meter_id uuid not null references public.angelcare360_operator_product_meters(id) on delete restrict,
  quantity numeric not null,
  amount numeric not null default 0,
  currency text not null default 'MAD',
  status text not null default 'active',
  starts_at timestamptz not null default now(),
  expires_at timestamptz,
  reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status in ('scheduled','active','suspended','cancelled','expired'))
);

create table if not exists public.angelcare360_operator_tenant_entitlement_snapshots (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.angelcare360_operator_clients(id) on delete cascade,
  tenant_id uuid not null references public.angelcare360_operator_tenants(id) on delete cascade,
  subscription_id uuid references public.angelcare360_operator_subscriptions(id) on delete set null,
  package_version_id uuid references public.angelcare360_operator_package_versions(id) on delete set null,
  status text not null default 'draft',
  source_signature text,
  compiled_payload jsonb not null default '{}'::jsonb,
  compiled_at timestamptz,
  activated_at timestamptz,
  superseded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status in ('draft','compiled','active','superseded','failed','archived'))
);

create table if not exists public.angelcare360_operator_tenant_entitlement_items (
  id uuid primary key default gen_random_uuid(),
  snapshot_id uuid not null references public.angelcare360_operator_tenant_entitlement_snapshots(id) on delete cascade,
  item_type text not null,
  item_id uuid,
  item_key text not null,
  item_label text not null,
  module_key text,
  effective_state text not null default 'enabled',
  origin text not null,
  quantity numeric,
  configuration jsonb not null default '{}'::jsonb,
  reason text,
  created_at timestamptz not null default now(),
  unique (snapshot_id, item_type, item_key),
  check (item_type in ('module','feature','addon','meter')),
  check (effective_state in ('enabled','disabled','suspended','locked','requires_configuration')),
  check (origin in ('package','module_inheritance','addon','topup','override','payment_gate','manual'))
);

create table if not exists public.angelcare360_operator_tenant_overrides (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.angelcare360_operator_clients(id) on delete cascade,
  tenant_id uuid not null references public.angelcare360_operator_tenants(id) on delete cascade,
  item_type text not null,
  item_id uuid,
  item_key text not null,
  override_state text not null,
  quantity_override numeric,
  reason text not null,
  approval_status text not null default 'approved',
  starts_at timestamptz not null default now(),
  expires_at timestamptz,
  status text not null default 'active',
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (item_type in ('module','feature','addon','meter')),
  check (override_state in ('enabled','disabled','suspended','locked','requires_configuration')),
  check (approval_status in ('draft','requested','approved','rejected')),
  check (status in ('scheduled','active','revoked','expired','archived'))
);

create table if not exists public.angelcare360_operator_entitlement_change_schedule (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.angelcare360_operator_clients(id) on delete cascade,
  tenant_id uuid not null references public.angelcare360_operator_tenants(id) on delete cascade,
  subscription_id uuid references public.angelcare360_operator_subscriptions(id) on delete set null,
  change_type text not null,
  payload jsonb not null,
  scheduled_for timestamptz not null,
  status text not null default 'scheduled',
  reason text,
  executed_at timestamptz,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (change_type in ('package_change','addon_change','capacity_change','override_change','restore_baseline')),
  check (status in ('scheduled','ready','executed','failed','cancelled'))
);

create table if not exists public.angelcare360_operator_product_scanner_runs (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'running',
  repository_signature text,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  summary jsonb not null default '{}'::jsonb,
  initiated_by uuid,
  error_message text,
  check (status in ('running','completed','failed','cancelled'))
);

create table if not exists public.angelcare360_operator_product_scanner_findings (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.angelcare360_operator_product_scanner_runs(id) on delete cascade,
  finding_type text not null,
  finding_key text not null,
  title text not null,
  description text,
  classification text not null,
  confidence integer not null default 0,
  evidence jsonb not null default '[]'::jsonb,
  suggestion jsonb not null default '{}'::jsonb,
  status text not null default 'open',
  adopted_entity_type text,
  adopted_entity_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (run_id, finding_type, finding_key),
  check (finding_type in ('module','feature','addon','meter','dependency','drift','orphan','duplicate','compatibility')),
  check (classification in ('operational','configuration_dependent','backend_ready','frontend_only','internal_only','customer_sellable','addon_candidate','capacity_controlled','integration_dependent','locked','deprecated','orphaned')),
  check (confidence between 0 and 100),
  check (status in ('open','accepted','rejected','resolved','superseded'))
);

create table if not exists public.angelcare360_operator_product_publications (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid not null,
  action text not null,
  version_label text,
  impact_summary jsonb not null default '{}'::jsonb,
  published_by uuid,
  published_at timestamptz not null default now(),
  check (entity_type in ('module','feature','addon','meter','package_version','price_book')),
  check (action in ('submitted','approved','published','suspended','retired','restored'))
);


-- Conservative canonical seed from the already-engineered AngelCare 360 customer domains.
insert into public.angelcare360_operator_product_modules
  (module_key,name,short_name,description,commercial_summary,category,status,sellability,runtime_maturity,version,customer_route_prefix,api_prefix,default_support_tier,evidence)
values
  ('administration','Administration & Structure','Administration','Établissements, années, périodes, classes, sections, matières, rôles et audit.','Le socle institutionnel complet pour structurer et gouverner un établissement.','core','published','customer_sellable','operational','1.0.0','/angelcare-360-command-center/administration','/api/angelcare360/administration','standard','[{"source":"signed-domain","phase":"3"}]'),
  ('people','Personnes & Dossiers','People','Élèves, parents, enseignants, personnel, relations et documents.','Dossiers humains 360 connectés aux opérations, finances et services.','core','published','customer_sellable','operational','1.0.0','/angelcare-360-command-center/personnes','/api/angelcare360/people','standard','[{"source":"signed-domain","phase":"5"}]'),
  ('admissions','Admissions','Admissions','Candidatures, entretiens, pièces, décisions et conversion en élève.','Un pipeline admission complet de la demande famille à l’inscription active.','growth','published','customer_sellable','operational','1.0.0','/angelcare-360-command-center/admissions','/api/angelcare360/admissions','standard','[{"source":"signed-domain"}]'),
  ('attendance','Présences','Présences','Présence quotidienne, absences, retards, justifications et clôture.','Contrôle quotidien de la présence et des exceptions élèves.','operations','published','customer_sellable','operational','1.0.0','/angelcare-360-command-center/presences','/api/angelcare360/attendance','standard','[{"source":"signed-domain"}]'),
  ('academics','Académique','Académique','Emplois du temps, cours, devoirs, examens, notes et bulletins.','Pilotage pédagogique complet des programmes aux résultats.','core','published','customer_sellable','operational','1.0.0','/angelcare-360-command-center/academique','/api/angelcare360/academics','priority','[{"source":"signed-domain"}]'),
  ('finance','Finance École','Finance','Frais, affectations, factures, paiements, reçus, remises, relances et dépenses.','Contrôle financier complet de la relation école–famille.','finance','published','customer_sellable','operational','1.0.0','/angelcare-360-command-center/finance','/api/angelcare360/finance','priority','[{"source":"signed-domain","phase":"8"}]'),
  ('payroll','Paie & Honoraires','Paie','Périodes, éléments, primes, retenues, avances, validation et paiement.','Gestion structurée de la paie et des honoraires du personnel.','finance','published','customer_sellable','configuration_dependent','1.0.0','/angelcare-360-command-center/paie','/api/angelcare360/payroll','priority','[{"source":"signed-domain","phase":"9"}]'),
  ('transport','Transport & Sécurité','Transport','Circuits, arrêts, véhicules, affectations, pickup, drop-off et sécurité.','Orchestration sécurisée du transport scolaire et des mouvements quotidiens.','operations','published','customer_sellable','operational','1.0.0','/angelcare-360-command-center/transport','/api/angelcare360/transport','priority','[{"source":"signed-domain","phase":"10"}]'),
  ('library','Bibliothèque','Bibliothèque','Ouvrages, exemplaires, emprunts, retours et retards.','Gestion complète de la bibliothèque et des prêts.','operations','published','customer_sellable','operational','1.0.0','/angelcare-360-command-center/bibliotheque','/api/angelcare360/library','standard','[{"source":"signed-domain","phase":"11"}]'),
  ('inventory','Inventaire','Inventaire','Articles, quantités, mouvements, seuils et responsabilités.','Visibilité et contrôle des biens, consommables et mouvements.','operations','published','customer_sellable','operational','1.0.0','/angelcare-360-command-center/inventaire','/api/angelcare360/inventory','standard','[{"source":"signed-domain","phase":"11"}]'),
  ('communications','Communication & Expérience','Communication','Messagerie, notifications, réclamations et échanges opérationnels.','Une relation école–famille structurée, traçable et réactive.','engagement','published','customer_sellable','configuration_dependent','1.0.0','/angelcare-360-command-center/messagerie','/api/angelcare360/communications','priority','[{"source":"signed-domain","phase":"12"}]'),
  ('reports','Rapports & Pilotage','Rapports','Rapports, exports, indicateurs et preuves de gouvernance.','Transformer les opérations en reporting de direction et preuves exploitables.','intelligence','published','customer_sellable','configuration_dependent','1.0.0','/angelcare-360-command-center/rapports','/api/angelcare360/reports','standard','[{"source":"signed-domain"}]')
on conflict (module_key) do update set
  name=excluded.name, description=excluded.description, commercial_summary=excluded.commercial_summary,
  customer_route_prefix=excluded.customer_route_prefix, api_prefix=excluded.api_prefix, updated_at=now();

with module_ids as (select id,module_key from public.angelcare360_operator_product_modules)
insert into public.angelcare360_operator_product_features
  (module_id,feature_key,name,description,feature_tier,status,sellability,runtime_maturity,customer_route,api_route,configuration_required,evidence)
select m.id,v.feature_key,v.name,v.description,v.tier,v.status,v.sellability,v.maturity,v.customer_route,v.api_route,v.configuration_required,'[{"source":"canonical-seed"}]'::jsonb
from module_ids m
join (values
 ('administration','administration.schools','Établissements','Sites et établissements scolaires.','basic','published','included','operational','/administration/etablissements','/api/angelcare360/administration',false),
 ('administration','administration.academic_years','Années scolaires','Années, périodes et calendrier institutionnel.','basic','published','included','operational','/administration/annees-scolaires','/api/angelcare360/administration',false),
 ('administration','administration.classes','Classes & Sections','Classes, sections, matières et capacités.','standard','published','included','operational','/administration/classes','/api/angelcare360/administration',false),
 ('administration','administration.rbac','Rôles & Permissions','Autorités, permissions et audit.','advanced','published','premium','operational','/administration/roles-permissions','/api/angelcare360/administration',true),
 ('people','people.students','Dossiers élèves','Identité, scolarité, contacts et documents.','basic','published','included','operational','/personnes/eleves','/api/angelcare360/people',false),
 ('people','people.parents','Parents & Responsables','Relations parent-enfant et contacts.','standard','published','included','operational','/personnes/parents','/api/angelcare360/people',false),
 ('people','people.staff','Personnel & Enseignants','Dossiers personnel et affectations.','standard','published','included','operational','/personnes/personnel','/api/angelcare360/people',false),
 ('admissions','admissions.pipeline','Pipeline admissions','Étapes, entretiens, décisions et conversion.','standard','published','included','operational','/admissions','/api/angelcare360/admissions',false),
 ('admissions','admissions.documents','Pièces & conformité','Documents et complétude du dossier.','advanced','published','included','operational','/admissions/documents','/api/angelcare360/admissions',false),
 ('attendance','attendance.daily','Présence quotidienne','Ouverture, saisie et clôture des présences.','basic','published','included','operational','/presences','/api/angelcare360/attendance',false),
 ('attendance','attendance.justifications','Justifications & exceptions','Absences, retards et justificatifs.','standard','published','included','operational','/presences/justifications','/api/angelcare360/attendance',false),
 ('academics','academics.timetables','Emplois du temps','Planning classes et enseignants.','standard','published','included','operational','/academique/emploi-du-temps','/api/angelcare360/academics',false),
 ('academics','academics.homework','Devoirs & Remises','Devoirs, consignes et soumissions.','standard','published','included','operational','/academique/devoirs','/api/angelcare360/academics',false),
 ('academics','academics.exams','Examens & Notes','Sessions, examens, notes et moyennes.','advanced','published','premium','operational','/academique/examens','/api/angelcare360/academics',false),
 ('academics','academics.report_cards','Bulletins','Bulletins et appréciations.','premium','published','premium','operational','/academique/bulletins','/api/angelcare360/academics',true),
 ('finance','finance.fees','Frais & Affectations','Structures tarifaires et affectations.','basic','published','included','operational','/finance/frais','/api/angelcare360/finance',false),
 ('finance','finance.invoices','Factures Élèves','Facturation et soldes élèves.','standard','published','included','operational','/finance/factures','/api/angelcare360/finance',false),
 ('finance','finance.payments','Paiements & Reçus','Encaissements, allocations et reçus.','standard','published','included','operational','/finance/paiements','/api/angelcare360/finance',false),
 ('finance','finance.collections','Relances & Recouvrement','Relances, états de compte et exposition.','advanced','published','premium','operational','/finance/relances','/api/angelcare360/finance',true),
 ('payroll','payroll.cycles','Cycles de paie','Périodes, dossiers et éléments.','standard','review','included','configuration_dependent','/paie/periodes','/api/angelcare360/payroll',true),
 ('payroll','payroll.validation','Validation & Paiement','Contrôles, approbation et paiement.','advanced','review','premium','configuration_dependent','/paie/validation','/api/angelcare360/payroll',true),
 ('transport','transport.routes','Circuits & Arrêts','Circuits, arrêts et planification.','basic','published','included','operational','/transport/circuits','/api/angelcare360/transport',false),
 ('transport','transport.vehicles','Véhicules','Véhicules, conformité et affectations.','standard','published','included','operational','/transport/vehicules','/api/angelcare360/transport',false),
 ('transport','transport.execution','Pickup & Drop-off','Exécution, sécurité et preuves.','advanced','published','premium','operational','/transport/ramassage','/api/angelcare360/transport',true),
 ('library','library.catalogue','Catalogue bibliothèque','Ouvrages et exemplaires.','basic','published','included','operational','/bibliotheque/catalogue','/api/angelcare360/library',false),
 ('library','library.loans','Prêts & Retours','Emprunts, retours et retards.','standard','published','included','operational','/bibliotheque/emprunts','/api/angelcare360/library',false),
 ('inventory','inventory.stock','Stock & Articles','Articles, quantités et seuils.','basic','published','included','operational','/inventaire/articles','/api/angelcare360/inventory',false),
 ('inventory','inventory.movements','Mouvements','Entrées, sorties et affectations.','standard','published','included','operational','/inventaire/mouvements','/api/angelcare360/inventory',false),
 ('communications','communications.messaging','Messagerie','Conversations et communication contextuelle.','standard','review','included','configuration_dependent','/messagerie','/api/angelcare360/communications',true),
 ('communications','communications.notifications','Notifications','Notifications internes et externes.','advanced','review','premium','integration_dependent','/notifications','/api/angelcare360/communications',true),
 ('communications','communications.claims','Réclamations','Réclamations, SLA et résolution.','standard','published','included','operational','/reclamations','/api/angelcare360/communications',false),
 ('reports','reports.operational','Rapports opérationnels','Reporting par domaine et période.','standard','review','included','configuration_dependent','/rapports','/api/angelcare360/reports',true),
 ('reports','reports.exports','Exports avancés','Exports PDF/XLSX et preuves.','premium','review','premium','integration_dependent','/rapports/exports','/api/angelcare360/reports',true)
) as v(module_key,feature_key,name,description,tier,status,sellability,maturity,customer_route,api_route,configuration_required)
on m.module_key=v.module_key
on conflict (feature_key) do update set name=excluded.name,description=excluded.description,status=excluded.status,runtime_maturity=excluded.runtime_maturity,updated_at=now();

insert into public.angelcare360_operator_product_meters
  (meter_key,name,description,unit,meter_type,hard_limit,warning_threshold_pct,topup_enabled,topup_increment,status,source_table)
values
 ('students','Élèves actifs','Nombre d’élèves actifs autorisés par tenant.','élèves','seat',true,85,true,50,'published','angelcare360_students'),
 ('staff','Personnel actif','Nombre de membres du personnel actifs.','personnes','seat',false,85,true,10,'published','angelcare360_staff'),
 ('users','Utilisateurs','Comptes utilisateurs actifs du tenant.','utilisateurs','seat',true,85,true,10,'published',null),
 ('institutions','Institutions / Sites','Nombre d’établissements ou sites rattachés.','sites','capacity',true,90,true,1,'published','angelcare360_schools'),
 ('storage_gb','Stockage documents','Volume de stockage documentaire.','Go','storage',true,80,true,10,'published',null),
 ('messages_monthly','Messages mensuels','Volume mensuel de messages et notifications.','messages','usage',false,80,true,1000,'review',null),
 ('vehicles','Véhicules transport','Nombre de véhicules actifs.','véhicules','capacity',true,85,true,1,'published',null),
 ('support_hours','Heures support premium','Crédit d’assistance premium.','heures','service',false,80,true,5,'published',null)
on conflict (meter_key) do update set name=excluded.name,description=excluded.description,topup_increment=excluded.topup_increment,status=excluded.status,updated_at=now();

insert into public.angelcare360_operator_product_addons
  (addon_code,name,description,addon_type,billing_model,status,currency,list_price,included_quantity,unit)
values
 ('ADDITIONAL_SITE','Site supplémentaire','Ajout d’un établissement ou site au tenant.','capacity','recurring','published','MAD',750,1,'site'),
 ('EXTRA_100_STUDENTS','Top-up 100 élèves','Extension de capacité de 100 élèves actifs.','capacity','recurring','published','MAD',450,100,'élèves'),
 ('PREMIUM_SUPPORT','Support prioritaire','File prioritaire, SLA renforcé et revue mensuelle.','support','recurring','published','MAD',1200,1,'tenant'),
 ('DATA_MIGRATION','Migration de données','Préparation, mapping, import et validation des données.','implementation','one_time','published','MAD',6500,1,'mission'),
 ('DEDICATED_ONBOARDING','Onboarding dédié','Chef de mission, formation et go-live assisté.','implementation','one_time','published','MAD',8500,1,'mission'),
 ('ADVANCED_REPORTING','Reporting avancé','Exports avancés, tableaux consolidés et gouvernance.','capability','recurring','review','MAD',900,1,'tenant')
on conflict (addon_code) do update set name=excluded.name,description=excluded.description,list_price=excluded.list_price,status=excluded.status,updated_at=now();


insert into public.angelcare360_operator_package_versions
  (version_code,version_number,name,description,target_segment,status,currency,monthly_price,annual_price,setup_fee,support_tier,implementation_tier,region_availability,published_at)
values
 ('ESSENTIAL-MA-V1',1,'AngelCare 360 Essential','Socle administration, personnes, admissions et présences pour un établissement en démarrage.','starter','published','MAD',2900,31320,3500,'standard','standard','["MA"]',now()),
 ('PROFESSIONAL-MA-V1',1,'AngelCare 360 Professional','Exploitation complète incluant académique, finance, communication, bibliothèque et inventaire.','growth','published','MAD',5900,63720,7500,'priority','assisted','["MA"]',now()),
 ('ENTERPRISE-MA-V1',1,'AngelCare 360 Enterprise','Plateforme multi-sites avec transport, paie, reporting avancé, support prioritaire et capacités élevées.','enterprise','published','MAD',11900,128520,18000,'dedicated','managed','["MA"]',now())
on conflict (version_code) do update set name=excluded.name,description=excluded.description,monthly_price=excluded.monthly_price,annual_price=excluded.annual_price,updated_at=now();

with pv as (select id,version_code from public.angelcare360_operator_package_versions),
     modules as (select id,module_key from public.angelcare360_operator_product_modules),
     features as (select id,feature_key from public.angelcare360_operator_product_features),
     meters as (select id,meter_key from public.angelcare360_operator_product_meters)
insert into public.angelcare360_operator_package_version_items(package_version_id,item_type,item_id,inclusion_type,quantity,sort_order)
select pv.id,x.item_type,x.item_id,x.inclusion_type,x.quantity,x.sort_order
from pv
join lateral (
  select 'module'::text item_type,m.id item_id,'included'::text inclusion_type,null::numeric quantity,row_number() over()::int sort_order
  from modules m
  where (pv.version_code='ESSENTIAL-MA-V1' and m.module_key in ('administration','people','admissions','attendance'))
     or (pv.version_code='PROFESSIONAL-MA-V1' and m.module_key in ('administration','people','admissions','attendance','academics','finance','library','inventory','communications'))
     or (pv.version_code='ENTERPRISE-MA-V1' and m.module_key in ('administration','people','admissions','attendance','academics','finance','payroll','transport','library','inventory','communications','reports'))
  union all
  select 'meter',mt.id,'included',
    case when mt.meter_key='students' then case pv.version_code when 'ESSENTIAL-MA-V1' then 250 when 'PROFESSIONAL-MA-V1' then 750 else 2500 end
         when mt.meter_key='users' then case pv.version_code when 'ESSENTIAL-MA-V1' then 15 when 'PROFESSIONAL-MA-V1' then 50 else 200 end
         when mt.meter_key='institutions' then case pv.version_code when 'ESSENTIAL-MA-V1' then 1 when 'PROFESSIONAL-MA-V1' then 3 else 10 end
         when mt.meter_key='storage_gb' then case pv.version_code when 'ESSENTIAL-MA-V1' then 10 when 'PROFESSIONAL-MA-V1' then 50 else 250 end end,
    100+row_number() over()::int
  from meters mt where mt.meter_key in ('students','users','institutions','storage_gb')
) x on true
on conflict (package_version_id,item_type,item_id) do update set inclusion_type=excluded.inclusion_type,quantity=excluded.quantity,updated_at=now();


-- Canonical dependency graph: the package validator and scanner use these rules.
with modules as (select id,module_key from public.angelcare360_operator_product_modules)
insert into public.angelcare360_operator_product_dependencies(source_type,source_id,target_type,target_id,relation_type,reason)
select 'module',source.id,'module',target.id,'requires',v.reason
from (values
  ('people','administration','Personnes et dossiers nécessitent la structure établissement.'),
  ('admissions','people','Les admissions nécessitent les dossiers personnes.'),
  ('admissions','administration','Les admissions nécessitent les établissements et classes.'),
  ('attendance','people','Les présences nécessitent les élèves et le personnel.'),
  ('attendance','administration','Les présences nécessitent la structure classes/sections.'),
  ('academics','people','L’académique nécessite enseignants et élèves.'),
  ('academics','administration','L’académique nécessite classes, sections et matières.'),
  ('finance','people','La finance école nécessite les dossiers élèves et responsables.'),
  ('finance','administration','La finance école nécessite la structure établissement.'),
  ('payroll','people','La paie nécessite les dossiers personnel.'),
  ('transport','people','Le transport nécessite les élèves et responsables.'),
  ('transport','administration','Le transport nécessite les établissements.'),
  ('library','people','Les prêts nécessitent les emprunteurs.'),
  ('inventory','administration','L’inventaire est rattaché aux établissements.'),
  ('communications','people','La communication nécessite les personnes et relations.'),
  ('reports','administration','Le reporting nécessite la structure institutionnelle.')
) as v(source_key,target_key,reason)
join modules source on source.module_key=v.source_key
join modules target on target.module_key=v.target_key
on conflict (source_type,source_id,target_type,target_id,relation_type) do update set reason=excluded.reason;

-- Morocco price book: composition remains independent from regional pricing.
insert into public.angelcare360_operator_price_books(price_book_code,name,currency,region_code,status,effective_from)
values ('MA-STANDARD-2026','Maroc · Catalogue standard 2026','MAD','MA','active',current_date)
on conflict (price_book_code) do update set name=excluded.name,status=excluded.status,updated_at=now();

with book as (select id from public.angelcare360_operator_price_books where price_book_code='MA-STANDARD-2026'),
     packages as (select id,monthly_price,setup_fee from public.angelcare360_operator_package_versions where status='published'),
     addons as (select id,list_price,billing_model from public.angelcare360_operator_product_addons where status='published')
insert into public.angelcare360_operator_price_book_entries(price_book_id,item_type,item_id,billing_cycle,unit_price,setup_fee)
select book.id,'package_version',packages.id,'monthly',packages.monthly_price,packages.setup_fee from book cross join packages
union all
select book.id,'addon',addons.id,case when addons.billing_model='one_time' then 'one_time' else 'monthly' end,addons.list_price,0 from book cross join addons
on conflict (price_book_id,item_type,item_id,billing_cycle) do update set unit_price=excluded.unit_price,setup_fee=excluded.setup_fee,updated_at=now();

create index if not exists ac360_product_features_module_idx on public.angelcare360_operator_product_features(module_id, status);
create index if not exists ac360_package_items_version_idx on public.angelcare360_operator_package_version_items(package_version_id, item_type);
create index if not exists ac360_entitlement_snapshots_tenant_idx on public.angelcare360_operator_tenant_entitlement_snapshots(tenant_id, status, created_at desc);
create index if not exists ac360_entitlement_items_snapshot_idx on public.angelcare360_operator_tenant_entitlement_items(snapshot_id, item_type);
create index if not exists ac360_tenant_overrides_tenant_idx on public.angelcare360_operator_tenant_overrides(tenant_id, status, expires_at);
create index if not exists ac360_scanner_findings_run_idx on public.angelcare360_operator_product_scanner_findings(run_id, status, classification);
create index if not exists ac360_subscription_addons_subscription_idx on public.angelcare360_operator_subscription_addons(subscription_id, status);
create index if not exists ac360_capacity_topups_tenant_idx on public.angelcare360_operator_capacity_topups(tenant_id, status);

-- Operator-only security boundary: no direct customer/anon access. Server service role remains authoritative.
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'angelcare360_operator_product_modules','angelcare360_operator_product_features','angelcare360_operator_product_addons',
    'angelcare360_operator_product_meters','angelcare360_operator_product_dependencies','angelcare360_operator_package_versions',
    'angelcare360_operator_package_version_items','angelcare360_operator_price_books','angelcare360_operator_price_book_entries',
    'angelcare360_operator_subscription_addons','angelcare360_operator_capacity_topups','angelcare360_operator_tenant_entitlement_snapshots',
    'angelcare360_operator_tenant_entitlement_items','angelcare360_operator_tenant_overrides','angelcare360_operator_entitlement_change_schedule',
    'angelcare360_operator_product_scanner_runs','angelcare360_operator_product_scanner_findings','angelcare360_operator_product_publications'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('revoke all on table public.%I from anon, authenticated', table_name);
    execute format('grant all on table public.%I to service_role', table_name);
  end loop;
end $$;

commit;
