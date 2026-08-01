-- ANGELCARE FLASHCARDS OS — ULTRA MEGA ZIP 1
-- Sovereign foundation, taxonomy, portfolio, collection dossiers, card registry,
-- legacy catalogue intake, RLS, audit, outbox and access-registry containment.
-- Additive and idempotent. No unrelated AngelCare table is changed.

begin;

create extension if not exists pgcrypto;
create schema if not exists flashcards_os;
comment on schema flashcards_os is 'Protected ANGELCARE Flashcards OS product and portfolio domain.';

grant usage on schema flashcards_os to authenticated, service_role;

create or replace function flashcards_os.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists flashcards_os.portfolios (
  id text primary key,
  code text not null unique,
  name text not null,
  description text null,
  status text not null default 'active' check (status in ('draft','active','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists flashcards_os.product_families (
  id text primary key,
  portfolio_id text not null references flashcards_os.portfolios(id) on update cascade on delete restrict,
  code text not null unique,
  name text not null,
  description text null,
  status text not null default 'active' check (status in ('draft','active','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists flashcards_os.categories (
  id text primary key,
  family_id text not null references flashcards_os.product_families(id) on update cascade on delete restrict default 'family-learning-cards',
  parent_id text null references flashcards_os.categories(id) on update cascade on delete restrict,
  code text not null unique,
  name text not null,
  short_name text not null,
  description text null,
  accent_key text not null default 'slate',
  sort_order integer not null default 0,
  status text not null default 'active' check (status in ('needs_structuring','needs_review','ready_for_growth','active','approved','archived')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists flashcards_os.collections (
  id text primary key,
  family_id text not null references flashcards_os.product_families(id) on update cascade on delete restrict default 'family-learning-cards',
  category_id text not null references flashcards_os.categories(id) on update cascade on delete restrict,
  code text not null unique,
  name text not null,
  slug text not null,
  legacy_domain text null,
  legacy_number text null,
  expected_card_count integer null check (expected_card_count is null or expected_card_count > 0),
  structured_card_count integer not null default 0 check (structured_card_count >= 0),
  historical_price_dh numeric(12,2) null check (historical_price_dh is null or historical_price_dh >= 0),
  primary_format text not null default 'flashcards',
  status text not null default 'needs_structuring' check (status in ('needs_structuring','needs_review','ready_for_growth','active','approved','archived')),
  lifecycle text not null default 'structuring' check (lifecycle in ('legacy_intake','idea','structuring','content_draft','review','approved','published','revision_required','archived')),
  readiness_score integer not null default 0 check (readiness_score between 0 and 100),
  age_min_months integer null check (age_min_months is null or age_min_months >= 0),
  age_max_months integer null check (age_max_months is null or age_max_months >= 0),
  languages text[] not null default '{}',
  methodologies text[] not null default '{}',
  primary_objective text null,
  audiences text[] not null default '{}',
  usage_contexts text[] not null default '{}',
  owner_name text null,
  source_page integer null,
  source_label text null,
  legacy_issues jsonb not null default '[]'::jsonb,
  notes text null,
  current_version text not null default '0.1-draft',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint collections_age_window_check check (age_min_months is null or age_max_months is null or age_max_months >= age_min_months)
);

create table if not exists flashcards_os.collection_versions (
  id uuid primary key default gen_random_uuid(),
  collection_id text not null references flashcards_os.collections(id) on update cascade on delete restrict,
  version_label text not null,
  status text not null default 'draft' check (status in ('draft','review','approved','superseded','archived')),
  change_summary text null,
  content_snapshot jsonb not null default '{}'::jsonb,
  created_by text null,
  approved_by text null,
  approved_at timestamptz null,
  created_at timestamptz not null default now(),
  unique (collection_id, version_label)
);

create table if not exists flashcards_os.editions (
  id uuid primary key default gen_random_uuid(),
  collection_id text not null references flashcards_os.collections(id) on update cascade on delete restrict,
  language_code text not null,
  edition_key text not null default 'standard',
  version_label text not null default '0.1-legacy-import',
  status text not null default 'legacy_intake' check (status in ('legacy_intake','draft','review','approved','archived')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (collection_id, language_code, edition_key)
);

create table if not exists flashcards_os.formats (
  id uuid primary key default gen_random_uuid(),
  collection_id text not null references flashcards_os.collections(id) on update cascade on delete restrict,
  format_key text not null,
  status text not null default 'legacy_intake' check (status in ('legacy_intake','draft','review','approved','archived')),
  specification jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (collection_id, format_key)
);

create table if not exists flashcards_os.variants (
  id uuid primary key default gen_random_uuid(),
  collection_id text not null references flashcards_os.collections(id) on update cascade on delete restrict,
  edition_id uuid null references flashcards_os.editions(id) on update cascade on delete restrict,
  format_id uuid null references flashcards_os.formats(id) on update cascade on delete restrict,
  sku text not null unique,
  variant_name text not null,
  status text not null default 'draft' check (status in ('draft','review','approved','published','archived')),
  commercial_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists flashcards_os.cards (
  id uuid primary key default gen_random_uuid(),
  collection_id text not null references flashcards_os.collections(id) on update cascade on delete restrict,
  version_id uuid null references flashcards_os.collection_versions(id) on update cascade on delete restrict,
  sequence_no integer not null check (sequence_no > 0),
  concept text null,
  front_text text null,
  back_guidance text null,
  language text not null default 'fr',
  translation text null,
  pronunciation text null,
  example_text text null,
  activity_instruction text null,
  difficulty text not null default 'foundation' check (difficulty in ('foundation','developing','advanced')),
  image_brief text null,
  rights_status text not null default 'unverified' check (rights_status in ('unverified','cleared','restricted')),
  approval_status text not null default 'draft' check (approval_status in ('draft','review','approved','rejected')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (collection_id, sequence_no, language)
);

create table if not exists flashcards_os.collection_relationships (
  id uuid primary key default gen_random_uuid(),
  source_collection_id text not null references flashcards_os.collections(id) on update cascade on delete restrict,
  target_collection_id text not null references flashcards_os.collections(id) on update cascade on delete restrict,
  relationship_type text not null check (relationship_type in ('prerequisite','companion','replacement','overlap','translation_source','derived_from')),
  rationale text null,
  created_at timestamptz not null default now(),
  unique (source_collection_id, target_collection_id, relationship_type),
  check (source_collection_id <> target_collection_id)
);

create table if not exists flashcards_os.collection_dossier_sections (
  id uuid primary key default gen_random_uuid(),
  collection_id text not null references flashcards_os.collections(id) on update cascade on delete restrict,
  section_key text not null,
  status text not null default 'partial' check (status in ('ready','partial','future_engine','blocked')),
  completeness integer not null default 0 check (completeness between 0 and 100),
  payload jsonb not null default '{}'::jsonb,
  reviewed_by text null,
  reviewed_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (collection_id, section_key)
);

create table if not exists flashcards_os.import_batches (
  id uuid primary key default gen_random_uuid(),
  batch_key text not null unique,
  source_label text not null,
  source_file_name text null,
  source_pages text null,
  status text not null default 'completed' check (status in ('draft','running','completed','failed','superseded')),
  records_created integer not null default 0,
  issues_created integer not null default 0,
  source_metadata jsonb not null default '{}'::jsonb,
  created_by text null,
  created_at timestamptz not null default now(),
  completed_at timestamptz null
);

create table if not exists flashcards_os.import_issues (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references flashcards_os.import_batches(id) on update cascade on delete restrict,
  collection_id text null references flashcards_os.collections(id) on update cascade on delete restrict,
  source_page integer null,
  issue_type text not null,
  severity text not null default 'medium' check (severity in ('low','medium','high','critical')),
  status text not null default 'open' check (status in ('open','resolved','accepted','rejected')),
  explanation text null,
  resolution text null,
  resolved_by text null,
  resolved_at timestamptz null,
  created_at timestamptz not null default now()
);

create table if not exists flashcards_os.workflow_approvals (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id text not null,
  approval_type text not null,
  status text not null default 'pending' check (status in ('pending','approved','rejected','cancelled')),
  requested_by text null,
  assigned_to text null,
  decision_by text null,
  decision_note text null,
  requested_at timestamptz not null default now(),
  decided_at timestamptz null
);

create table if not exists flashcards_os.comments (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id text not null,
  author_id text null,
  author_name text null,
  body text not null,
  status text not null default 'active' check (status in ('active','resolved','hidden')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists flashcards_os.assignments (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id text not null,
  assignment_type text not null default 'owner',
  assignee_id text null,
  assignee_name text null,
  status text not null default 'active' check (status in ('active','completed','cancelled')),
  due_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists flashcards_os.audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_id text null,
  actor_name text null,
  action_key text not null,
  action_label text not null,
  entity_type text not null,
  entity_id text not null,
  summary text null,
  before_payload jsonb null,
  after_payload jsonb null,
  risk_level text not null default 'normal' check (risk_level in ('normal','medium','high','critical')),
  request_id text null,
  created_at timestamptz not null default now()
);

create table if not exists flashcards_os.outbox_events (
  id uuid primary key default gen_random_uuid(),
  event_key text not null,
  aggregate_type text not null,
  aggregate_id text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending','processing','published','failed','dead_letter')),
  attempts integer not null default 0,
  available_at timestamptz not null default now(),
  published_at timestamptz null,
  last_error text null,
  created_at timestamptz not null default now()
);

create table if not exists flashcards_os.configuration (
  id uuid primary key default gen_random_uuid(),
  config_key text not null unique,
  config_group text not null,
  label text not null,
  value jsonb not null,
  description text null,
  status text not null default 'active' check (status in ('active','disabled','archived')),
  updated_by text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists flashcards_os.permission_catalogue (
  permission_key text primary key,
  label text not null,
  domain text not null,
  risk_level text not null default 'normal' check (risk_level in ('normal','medium','high','critical')),
  description text null,
  created_at timestamptz not null default now()
);


-- Internal tenant containment. The current installation is seeded for the canonical
-- ANGELCARE internal tenant; future tenant keys can coexist without schema forks.
do $$
declare table_name text;
begin
  foreach table_name in array array[
    'portfolios','product_families','categories','collections','collection_versions','editions','formats','variants','cards',
    'collection_relationships','collection_dossier_sections','import_batches','import_issues','workflow_approvals','comments',
    'assignments','audit_events','outbox_events','configuration','permission_catalogue'
  ]
  loop
    execute format('alter table flashcards_os.%I add column if not exists tenant_key text not null default %L', table_name, 'angelcare-internal');
  end loop;
end $$;

create index if not exists idx_fc_categories_parent on flashcards_os.categories(parent_id);
create index if not exists idx_fc_categories_family on flashcards_os.categories(family_id);
create index if not exists idx_fc_collections_category on flashcards_os.collections(category_id);
create index if not exists idx_fc_collections_status on flashcards_os.collections(status);
create index if not exists idx_fc_collections_lifecycle on flashcards_os.collections(lifecycle);
create index if not exists idx_fc_collections_name on flashcards_os.collections(name);
create index if not exists idx_fc_cards_collection_sequence on flashcards_os.cards(collection_id, sequence_no);
create index if not exists idx_fc_cards_approval on flashcards_os.cards(approval_status);
create index if not exists idx_fc_import_issues_status on flashcards_os.import_issues(status, severity);
create index if not exists idx_fc_audit_entity on flashcards_os.audit_events(entity_type, entity_id, created_at desc);
create index if not exists idx_fc_outbox_status on flashcards_os.outbox_events(status, available_at);
create index if not exists idx_fc_collections_tenant on flashcards_os.collections(tenant_key, category_id, status);
create index if not exists idx_fc_cards_tenant on flashcards_os.cards(tenant_key, collection_id, sequence_no);
create index if not exists idx_fc_import_issues_tenant on flashcards_os.import_issues(tenant_key, status, severity);
create index if not exists idx_fc_audit_tenant on flashcards_os.audit_events(tenant_key, entity_type, entity_id, created_at desc);

create or replace function flashcards_os.refresh_collection_structured_card_count(target_collection_id text)
returns integer language plpgsql security definer set search_path = flashcards_os, public as $$
declare result_count integer;
begin
  select count(*)::integer into result_count
  from flashcards_os.cards
  where collection_id = target_collection_id
    and tenant_key = 'angelcare-internal';

  update flashcards_os.collections
  set structured_card_count = result_count, updated_at = now()
  where id = target_collection_id
    and tenant_key = 'angelcare-internal';
  return result_count;
end;
$$;

grant execute on function flashcards_os.refresh_collection_structured_card_count(text) to service_role;

create or replace function flashcards_os.prevent_released_version_delete()
returns trigger language plpgsql as $$
begin
  if old.status in ('approved','superseded') then
    raise exception 'Approved or superseded collection versions are immutable';
  end if;
  return old;
end;
$$;

drop trigger if exists trg_fc_collection_versions_immutable on flashcards_os.collection_versions;
create trigger trg_fc_collection_versions_immutable before delete on flashcards_os.collection_versions for each row execute function flashcards_os.prevent_released_version_delete();

-- Updated-at triggers.
do $$
declare table_name text;
begin
  foreach table_name in array array['portfolios','product_families','categories','collections','editions','formats','variants','cards','collection_dossier_sections','comments','assignments','configuration']
  loop
    execute format('drop trigger if exists trg_fc_%I_updated_at on flashcards_os.%I', table_name, table_name);
    execute format('create trigger trg_fc_%I_updated_at before update on flashcards_os.%I for each row execute function flashcards_os.touch_updated_at()', table_name, table_name);
  end loop;
end $$;

-- RLS: authenticated users can read; all writes are server-side after custom AngelCare RBAC validation.
do $$
declare table_name text;
begin
  foreach table_name in array array[
    'portfolios','product_families','categories','collections','collection_versions','editions','formats','variants','cards',
    'collection_relationships','collection_dossier_sections','import_batches','import_issues','workflow_approvals','comments',
    'assignments','audit_events','outbox_events','configuration','permission_catalogue'
  ]
  loop
    execute format('alter table flashcards_os.%I enable row level security', table_name);
    execute format('drop policy if exists authenticated_read on flashcards_os.%I', table_name);
    execute format('drop policy if exists tenant_read on flashcards_os.%I', table_name);
    execute format('create policy tenant_read on flashcards_os.%I for select to authenticated using (tenant_key = coalesce(auth.jwt()->>''tenant_key'', ''''))', table_name);
    execute format('grant select on flashcards_os.%I to authenticated', table_name);
    execute format('grant all on flashcards_os.%I to service_role', table_name);
  end loop;
end $$;


-- Public compatibility views keep the canonical data in the isolated schema while
-- allowing trusted server-side application commands to access it without replacing
-- the project's exposed-schema list. The views are not granted to authenticated users;
-- browser access remains impossible and all mutations pass through AngelCare RBAC APIs.
create or replace view public.fc_os_categories as select * from flashcards_os.categories;
create or replace view public.fc_os_collections as select * from flashcards_os.collections;
create or replace view public.fc_os_cards as select * from flashcards_os.cards;
create or replace view public.fc_os_editions as select * from flashcards_os.editions;
create or replace view public.fc_os_formats as select * from flashcards_os.formats;
create or replace view public.fc_os_import_batches as select * from flashcards_os.import_batches;
create or replace view public.fc_os_import_issues as select * from flashcards_os.import_issues;
create or replace view public.fc_os_audit_events as select * from flashcards_os.audit_events;
create or replace view public.fc_os_outbox_events as select * from flashcards_os.outbox_events;

revoke all on public.fc_os_categories, public.fc_os_collections, public.fc_os_cards, public.fc_os_editions,
  public.fc_os_formats, public.fc_os_import_batches, public.fc_os_import_issues, public.fc_os_audit_events,
  public.fc_os_outbox_events from authenticated, anon;
grant all on public.fc_os_categories, public.fc_os_collections, public.fc_os_cards, public.fc_os_editions,
  public.fc_os_formats, public.fc_os_import_batches, public.fc_os_import_issues, public.fc_os_audit_events,
  public.fc_os_outbox_events to service_role;

create or replace function public.fc_os_refresh_collection_structured_card_count(target_collection_id text)
returns integer
language sql
security definer
set search_path = flashcards_os, public
as $$ select flashcards_os.refresh_collection_structured_card_count(target_collection_id); $$;
grant execute on function public.fc_os_refresh_collection_structured_card_count(text) to service_role;

insert into flashcards_os.portfolios (id,code,name,description,status)
values ('portfolio-flashcards','FC-PORTFOLIO','ANGELCARE Flashcards & Nomenclatures','Portefeuille canonique ANGELCARE des produits Flashcards et Nomenclatures.','active')
on conflict (id) do update set code=excluded.code,name=excluded.name,description=excluded.description,status=excluded.status,updated_at=now();

insert into flashcards_os.product_families (id,portfolio_id,code,name,description,status)
values ('family-learning-cards','portfolio-flashcards','FC','Collections pédagogiques Flashcards','Famille gouvernant collections, éditions, formats, variantes et releases.','active')
on conflict (id) do update set portfolio_id=excluded.portfolio_id,code=excluded.code,name=excluded.name,description=excluded.description,status=excluded.status,updated_at=now();
insert into flashcards_os.categories (id,family_id,parent_id,code,name,short_name,description,accent_key,sort_order,status,metadata)
values ('cat-language','family-learning-cards',null,'LANG','Langage, parole & communication','Langage','Acquisition linguistique, vocabulaire, expression, compréhension, phonologie et communication.','indigo',10,'active','{"seed":"catalogue-2022-u1"}'::jsonb)
on conflict (id) do update set parent_id=excluded.parent_id,code=excluded.code,name=excluded.name,short_name=excluded.short_name,description=excluded.description,accent_key=excluded.accent_key,sort_order=excluded.sort_order,status=excluded.status,metadata=excluded.metadata,updated_at=now();
insert into flashcards_os.categories (id,family_id,parent_id,code,name,short_name,description,accent_key,sort_order,status,metadata)
values ('cat-mathematics','family-learning-cards',null,'MATH','Mathématiques & pensée logique','Mathématiques','Nombres, quantités, formes, logique, séquençage, mesure et raisonnement.','blue',20,'active','{"seed":"catalogue-2022-u1"}'::jsonb)
on conflict (id) do update set parent_id=excluded.parent_id,code=excluded.code,name=excluded.name,short_name=excluded.short_name,description=excluded.description,accent_key=excluded.accent_key,sort_order=excluded.sort_order,status=excluded.status,metadata=excluded.metadata,updated_at=now();
insert into flashcards_os.categories (id,family_id,parent_id,code,name,short_name,description,accent_key,sort_order,status,metadata)
values ('cat-geography','family-learning-cards',null,'GEO','Géographie, monde & cultures','Géographie','Continents, pays, capitales, cultures, repères territoriaux et ouverture internationale.','emerald',30,'active','{"seed":"catalogue-2022-u1"}'::jsonb)
on conflict (id) do update set parent_id=excluded.parent_id,code=excluded.code,name=excluded.name,short_name=excluded.short_name,description=excluded.description,accent_key=excluded.accent_key,sort_order=excluded.sort_order,status=excluded.status,metadata=excluded.metadata,updated_at=now();
insert into flashcards_os.categories (id,family_id,parent_id,code,name,short_name,description,accent_key,sort_order,status,metadata)
values ('cat-nature','family-learning-cards',null,'NATURE','Animaux, nature & environnement','Nature','Zoologie, habitats, biodiversité, végétaux, saisons et environnement.','green',40,'active','{"seed":"catalogue-2022-u1"}'::jsonb)
on conflict (id) do update set parent_id=excluded.parent_id,code=excluded.code,name=excluded.name,short_name=excluded.short_name,description=excluded.description,accent_key=excluded.accent_key,sort_order=excluded.sort_order,status=excluded.status,metadata=excluded.metadata,updated_at=now();
insert into flashcards_os.categories (id,family_id,parent_id,code,name,short_name,description,accent_key,sort_order,status,metadata)
values ('cat-general','family-learning-cards',null,'CULT','Société, culture & connaissances générales','Culture générale','Culture, métiers, sports, arts, découvertes, société et connaissances transversales.','amber',50,'active','{"seed":"catalogue-2022-u1"}'::jsonb)
on conflict (id) do update set parent_id=excluded.parent_id,code=excluded.code,name=excluded.name,short_name=excluded.short_name,description=excluded.description,accent_key=excluded.accent_key,sort_order=excluded.sort_order,status=excluded.status,metadata=excluded.metadata,updated_at=now();
insert into flashcards_os.categories (id,family_id,parent_id,code,name,short_name,description,accent_key,sort_order,status,metadata)
values ('cat-science','family-learning-cards',null,'SCI','Sciences & découverte','Sciences','Corps humain, espace, matière, énergie, technologie et expérimentation.','cyan',60,'ready_for_growth','{"seed":"catalogue-2022-u1"}'::jsonb)
on conflict (id) do update set parent_id=excluded.parent_id,code=excluded.code,name=excluded.name,short_name=excluded.short_name,description=excluded.description,accent_key=excluded.accent_key,sort_order=excluded.sort_order,status=excluded.status,metadata=excluded.metadata,updated_at=now();
insert into flashcards_os.categories (id,family_id,parent_id,code,name,short_name,description,accent_key,sort_order,status,metadata)
values ('cat-autonomy','family-learning-cards',null,'AUTO','Vie quotidienne & autonomie','Autonomie','Routines, sécurité, hygiène, responsabilités et indépendance progressive.','rose',70,'ready_for_growth','{"seed":"catalogue-2022-u1"}'::jsonb)
on conflict (id) do update set parent_id=excluded.parent_id,code=excluded.code,name=excluded.name,short_name=excluded.short_name,description=excluded.description,accent_key=excluded.accent_key,sort_order=excluded.sort_order,status=excluded.status,metadata=excluded.metadata,updated_at=now();
insert into flashcards_os.categories (id,family_id,parent_id,code,name,short_name,description,accent_key,sort_order,status,metadata)
values ('cat-social-emotional','family-learning-cards',null,'SEL','Développement émotionnel, social & comportemental','Socio-émotionnel','Émotions, relations, régulation, confiance, coopération et situations sociales.','violet',80,'ready_for_growth','{"seed":"catalogue-2022-u1"}'::jsonb)
on conflict (id) do update set parent_id=excluded.parent_id,code=excluded.code,name=excluded.name,short_name=excluded.short_name,description=excluded.description,accent_key=excluded.accent_key,sort_order=excluded.sort_order,status=excluded.status,metadata=excluded.metadata,updated_at=now();
insert into flashcards_os.categories (id,family_id,parent_id,code,name,short_name,description,accent_key,sort_order,status,metadata)
values ('cat-montessori','family-learning-cards',null,'MONT','Petite enfance & développement Montessori','Montessori','Nomenclatures, vie pratique, sensoriel, classification et progression Montessori.','orange',90,'ready_for_growth','{"seed":"catalogue-2022-u1"}'::jsonb)
on conflict (id) do update set parent_id=excluded.parent_id,code=excluded.code,name=excluded.name,short_name=excluded.short_name,description=excluded.description,accent_key=excluded.accent_key,sort_order=excluded.sort_order,status=excluded.status,metadata=excluded.metadata,updated_at=now();
insert into flashcards_os.categories (id,family_id,parent_id,code,name,short_name,description,accent_key,sort_order,status,metadata)
values ('cat-inclusive','family-learning-cards',null,'INCL','Apprentissages inclusifs & thérapeutiques','Inclusion','Orthophonie, autisme, besoins spécifiques, réhabilitation et supports visuels.','teal',100,'ready_for_growth','{"seed":"catalogue-2022-u1"}'::jsonb)
on conflict (id) do update set parent_id=excluded.parent_id,code=excluded.code,name=excluded.name,short_name=excluded.short_name,description=excluded.description,accent_key=excluded.accent_key,sort_order=excluded.sort_order,status=excluded.status,metadata=excluded.metadata,updated_at=now();
insert into flashcards_os.categories (id,family_id,parent_id,code,name,short_name,description,accent_key,sort_order,status,metadata)
values ('sub-lang-foundations','family-learning-cards','cat-language','LANG-FOND','Fondamentaux linguistiques','Fondamentaux linguistiques','Sous-domaine opérationnel de la nomenclature importée et future.','slate',10,'active','{"seed":"catalogue-2022-u1"}'::jsonb)
on conflict (id) do update set parent_id=excluded.parent_id,code=excluded.code,name=excluded.name,short_name=excluded.short_name,description=excluded.description,accent_key=excluded.accent_key,sort_order=excluded.sort_order,status=excluded.status,metadata=excluded.metadata,updated_at=now();
insert into flashcards_os.categories (id,family_id,parent_id,code,name,short_name,description,accent_key,sort_order,status,metadata)
values ('sub-math-foundations','family-learning-cards','cat-mathematics','MATH-FOND','Nombres, formes & premiers raisonnements','Nombres, formes & premiers raisonnements','Sous-domaine opérationnel de la nomenclature importée et future.','slate',10,'active','{"seed":"catalogue-2022-u1"}'::jsonb)
on conflict (id) do update set parent_id=excluded.parent_id,code=excluded.code,name=excluded.name,short_name=excluded.short_name,description=excluded.description,accent_key=excluded.accent_key,sort_order=excluded.sort_order,status=excluded.status,metadata=excluded.metadata,updated_at=now();
insert into flashcards_os.categories (id,family_id,parent_id,code,name,short_name,description,accent_key,sort_order,status,metadata)
values ('sub-geo-world','family-learning-cards','cat-geography','GEO-WORLD','Monde, continents & pays','Monde, continents & pays','Sous-domaine opérationnel de la nomenclature importée et future.','slate',10,'active','{"seed":"catalogue-2022-u1"}'::jsonb)
on conflict (id) do update set parent_id=excluded.parent_id,code=excluded.code,name=excluded.name,short_name=excluded.short_name,description=excluded.description,accent_key=excluded.accent_key,sort_order=excluded.sort_order,status=excluded.status,metadata=excluded.metadata,updated_at=now();
insert into flashcards_os.categories (id,family_id,parent_id,code,name,short_name,description,accent_key,sort_order,status,metadata)
values ('sub-nature-regions','family-learning-cards','cat-nature','NATURE-REG','Animaux par région','Animaux par région','Sous-domaine opérationnel de la nomenclature importée et future.','slate',10,'active','{"seed":"catalogue-2022-u1"}'::jsonb)
on conflict (id) do update set parent_id=excluded.parent_id,code=excluded.code,name=excluded.name,short_name=excluded.short_name,description=excluded.description,accent_key=excluded.accent_key,sort_order=excluded.sort_order,status=excluded.status,metadata=excluded.metadata,updated_at=now();
insert into flashcards_os.categories (id,family_id,parent_id,code,name,short_name,description,accent_key,sort_order,status,metadata)
values ('sub-culture-world','family-learning-cards','cat-general','CULT-WORLD','Monde, peuples & cultures','Monde, peuples & cultures','Sous-domaine opérationnel de la nomenclature importée et future.','slate',10,'active','{"seed":"catalogue-2022-u1"}'::jsonb)
on conflict (id) do update set parent_id=excluded.parent_id,code=excluded.code,name=excluded.name,short_name=excluded.short_name,description=excluded.description,accent_key=excluded.accent_key,sort_order=excluded.sort_order,status=excluded.status,metadata=excluded.metadata,updated_at=now();
insert into flashcards_os.categories (id,family_id,parent_id,code,name,short_name,description,accent_key,sort_order,status,metadata)
values ('sub-lang-daily','family-learning-cards','cat-language','LANG-DAILY','Vocabulaire du quotidien','Vocabulaire du quotidien','Sous-domaine opérationnel de la nomenclature importée et future.','slate',20,'active','{"seed":"catalogue-2022-u1"}'::jsonb)
on conflict (id) do update set parent_id=excluded.parent_id,code=excluded.code,name=excluded.name,short_name=excluded.short_name,description=excluded.description,accent_key=excluded.accent_key,sort_order=excluded.sort_order,status=excluded.status,metadata=excluded.metadata,updated_at=now();
insert into flashcards_os.categories (id,family_id,parent_id,code,name,short_name,description,accent_key,sort_order,status,metadata)
values ('sub-math-materials','family-learning-cards','cat-mathematics','MATH-MAT','Matériels, tracés & manipulations','Matériels, tracés & manipulations','Sous-domaine opérationnel de la nomenclature importée et future.','slate',20,'active','{"seed":"catalogue-2022-u1"}'::jsonb)
on conflict (id) do update set parent_id=excluded.parent_id,code=excluded.code,name=excluded.name,short_name=excluded.short_name,description=excluded.description,accent_key=excluded.accent_key,sort_order=excluded.sort_order,status=excluded.status,metadata=excluded.metadata,updated_at=now();
insert into flashcards_os.categories (id,family_id,parent_id,code,name,short_name,description,accent_key,sort_order,status,metadata)
values ('sub-geo-capitals','family-learning-cards','cat-geography','GEO-CAP','Capitales & repères','Capitales & repères','Sous-domaine opérationnel de la nomenclature importée et future.','slate',20,'active','{"seed":"catalogue-2022-u1"}'::jsonb)
on conflict (id) do update set parent_id=excluded.parent_id,code=excluded.code,name=excluded.name,short_name=excluded.short_name,description=excluded.description,accent_key=excluded.accent_key,sort_order=excluded.sort_order,status=excluded.status,metadata=excluded.metadata,updated_at=now();
insert into flashcards_os.categories (id,family_id,parent_id,code,name,short_name,description,accent_key,sort_order,status,metadata)
values ('sub-nature-features','family-learning-cards','cat-nature','NATURE-FEAT','Familles & caractéristiques animales','Familles & caractéristiques animales','Sous-domaine opérationnel de la nomenclature importée et future.','slate',20,'active','{"seed":"catalogue-2022-u1"}'::jsonb)
on conflict (id) do update set parent_id=excluded.parent_id,code=excluded.code,name=excluded.name,short_name=excluded.short_name,description=excluded.description,accent_key=excluded.accent_key,sort_order=excluded.sort_order,status=excluded.status,metadata=excluded.metadata,updated_at=now();
insert into flashcards_os.categories (id,family_id,parent_id,code,name,short_name,description,accent_key,sort_order,status,metadata)
values ('sub-culture-discovery','family-learning-cards','cat-general','CULT-DISC','Arts, sciences & société','Arts, sciences & société','Sous-domaine opérationnel de la nomenclature importée et future.','slate',20,'active','{"seed":"catalogue-2022-u1"}'::jsonb)
on conflict (id) do update set parent_id=excluded.parent_id,code=excluded.code,name=excluded.name,short_name=excluded.short_name,description=excluded.description,accent_key=excluded.accent_key,sort_order=excluded.sort_order,status=excluded.status,metadata=excluded.metadata,updated_at=now();
insert into flashcards_os.categories (id,family_id,parent_id,code,name,short_name,description,accent_key,sort_order,status,metadata)
values ('sub-lang-expression','family-learning-cards','cat-language','LANG-EXPR','Expression & communication','Expression & communication','Sous-domaine opérationnel de la nomenclature importée et future.','slate',30,'active','{"seed":"catalogue-2022-u1"}'::jsonb)
on conflict (id) do update set parent_id=excluded.parent_id,code=excluded.code,name=excluded.name,short_name=excluded.short_name,description=excluded.description,accent_key=excluded.accent_key,sort_order=excluded.sort_order,status=excluded.status,metadata=excluded.metadata,updated_at=now();
insert into flashcards_os.categories (id,family_id,parent_id,code,name,short_name,description,accent_key,sort_order,status,metadata)
values ('sub-geo-biodiversity','family-learning-cards','cat-geography','GEO-BIO','Biodiversité par continent','Biodiversité par continent','Sous-domaine opérationnel de la nomenclature importée et future.','slate',30,'active','{"seed":"catalogue-2022-u1"}'::jsonb)
on conflict (id) do update set parent_id=excluded.parent_id,code=excluded.code,name=excluded.name,short_name=excluded.short_name,description=excluded.description,accent_key=excluded.accent_key,sort_order=excluded.sort_order,status=excluded.status,metadata=excluded.metadata,updated_at=now();
insert into flashcards_os.collections (
  id,family_id,category_id,code,name,slug,legacy_domain,legacy_number,expected_card_count,structured_card_count,
  historical_price_dh,primary_format,status,lifecycle,readiness_score,age_min_months,age_max_months,languages,
  methodologies,primary_objective,audiences,usage_contexts,owner_name,source_page,source_label,legacy_issues,notes,current_version,metadata
) values (
  'fc-lang-001','family-learning-cards','sub-lang-foundations','FC-LANG-001','Les alphabets (ARA)','les-alphabets-ara','LANG','1',
  28,0,52,'flashcards','needs_structuring','legacy_intake',36,
  6,144,array['fr']::text[],array['Montessori','Freinet','Steiner-Waldorf']::text[],'À structurer depuis le contenu source complet; le catalogue 2022 fournit le titre, la quantité et le prix historique, mais pas le registre carte par carte.',array['B2C Familles','B2B Écoles & crèches']::text[],
  array['Maison','Classe','Atelier éducatif']::text[],'Direction Produit',3,'NEW VERSION OF CATALOGUE FC 2022','[]'::jsonb,'','0.1-legacy-import',
  '{"seed": "catalogue-2022-u1", "sourcePage": 3}'::jsonb
) on conflict (id) do update set
  category_id=excluded.category_id,code=excluded.code,name=excluded.name,slug=excluded.slug,legacy_domain=excluded.legacy_domain,
  legacy_number=excluded.legacy_number,expected_card_count=excluded.expected_card_count,historical_price_dh=excluded.historical_price_dh,
  primary_format=excluded.primary_format,status=excluded.status,lifecycle=excluded.lifecycle,readiness_score=excluded.readiness_score,
  age_min_months=excluded.age_min_months,age_max_months=excluded.age_max_months,languages=excluded.languages,methodologies=excluded.methodologies,
  primary_objective=excluded.primary_objective,audiences=excluded.audiences,usage_contexts=excluded.usage_contexts,owner_name=excluded.owner_name,
  source_page=excluded.source_page,source_label=excluded.source_label,legacy_issues=excluded.legacy_issues,notes=excluded.notes,current_version=excluded.current_version,
  metadata=excluded.metadata,updated_at=now();

insert into flashcards_os.editions (collection_id,language_code,edition_key,version_label,status,metadata)
values ('fc-lang-001','fr','standard','0.1-legacy-import','legacy_intake','{"seed":"catalogue-2022-u1"}'::jsonb)
on conflict (collection_id,language_code,edition_key) do nothing;

insert into flashcards_os.formats (collection_id,format_key,status,specification)
values ('fc-lang-001','flashcards','legacy_intake','{"source":"catalogue-2022","specificationStatus":"not-supplied"}'::jsonb)
on conflict (collection_id,format_key) do nothing;

insert into flashcards_os.collection_versions (collection_id,version_label,status,change_summary,content_snapshot,created_by)
values ('fc-lang-001','0.1-legacy-import','draft','Entrée canonique créée depuis le catalogue 2022',jsonb_build_object('sourcePage',3,'expectedCardCount',28,'historicalPriceDh',52),'UMZ1 migration')
on conflict (collection_id,version_label) do nothing;
insert into flashcards_os.collections (
  id,family_id,category_id,code,name,slug,legacy_domain,legacy_number,expected_card_count,structured_card_count,
  historical_price_dh,primary_format,status,lifecycle,readiness_score,age_min_months,age_max_months,languages,
  methodologies,primary_objective,audiences,usage_contexts,owner_name,source_page,source_label,legacy_issues,notes,current_version,metadata
) values (
  'fc-lang-002','family-learning-cards','sub-lang-foundations','FC-LANG-002','Les alphabets (FRA)','les-alphabets-fra','LANG','2',
  26,0,52,'flashcards','needs_structuring','legacy_intake',36,
  6,144,array['fr']::text[],array['Montessori','Freinet','Steiner-Waldorf']::text[],'À structurer depuis le contenu source complet; le catalogue 2022 fournit le titre, la quantité et le prix historique, mais pas le registre carte par carte.',array['B2C Familles','B2B Écoles & crèches']::text[],
  array['Maison','Classe','Atelier éducatif']::text[],'Direction Produit',3,'NEW VERSION OF CATALOGUE FC 2022','[]'::jsonb,'','0.1-legacy-import',
  '{"seed": "catalogue-2022-u1", "sourcePage": 3}'::jsonb
) on conflict (id) do update set
  category_id=excluded.category_id,code=excluded.code,name=excluded.name,slug=excluded.slug,legacy_domain=excluded.legacy_domain,
  legacy_number=excluded.legacy_number,expected_card_count=excluded.expected_card_count,historical_price_dh=excluded.historical_price_dh,
  primary_format=excluded.primary_format,status=excluded.status,lifecycle=excluded.lifecycle,readiness_score=excluded.readiness_score,
  age_min_months=excluded.age_min_months,age_max_months=excluded.age_max_months,languages=excluded.languages,methodologies=excluded.methodologies,
  primary_objective=excluded.primary_objective,audiences=excluded.audiences,usage_contexts=excluded.usage_contexts,owner_name=excluded.owner_name,
  source_page=excluded.source_page,source_label=excluded.source_label,legacy_issues=excluded.legacy_issues,notes=excluded.notes,current_version=excluded.current_version,
  metadata=excluded.metadata,updated_at=now();

insert into flashcards_os.editions (collection_id,language_code,edition_key,version_label,status,metadata)
values ('fc-lang-002','fr','standard','0.1-legacy-import','legacy_intake','{"seed":"catalogue-2022-u1"}'::jsonb)
on conflict (collection_id,language_code,edition_key) do nothing;

insert into flashcards_os.formats (collection_id,format_key,status,specification)
values ('fc-lang-002','flashcards','legacy_intake','{"source":"catalogue-2022","specificationStatus":"not-supplied"}'::jsonb)
on conflict (collection_id,format_key) do nothing;

insert into flashcards_os.collection_versions (collection_id,version_label,status,change_summary,content_snapshot,created_by)
values ('fc-lang-002','0.1-legacy-import','draft','Entrée canonique créée depuis le catalogue 2022',jsonb_build_object('sourcePage',3,'expectedCardCount',26,'historicalPriceDh',52),'UMZ1 migration')
on conflict (collection_id,version_label) do nothing;
insert into flashcards_os.collections (
  id,family_id,category_id,code,name,slug,legacy_domain,legacy_number,expected_card_count,structured_card_count,
  historical_price_dh,primary_format,status,lifecycle,readiness_score,age_min_months,age_max_months,languages,
  methodologies,primary_objective,audiences,usage_contexts,owner_name,source_page,source_label,legacy_issues,notes,current_version,metadata
) values (
  'fc-lang-003','family-learning-cards','sub-lang-foundations','FC-LANG-003','Les alphabets (ENG)','les-alphabets-eng','LANG','3',
  26,0,52,'flashcards','needs_structuring','legacy_intake',36,
  6,144,array['fr']::text[],array['Montessori','Freinet','Steiner-Waldorf']::text[],'À structurer depuis le contenu source complet; le catalogue 2022 fournit le titre, la quantité et le prix historique, mais pas le registre carte par carte.',array['B2C Familles','B2B Écoles & crèches']::text[],
  array['Maison','Classe','Atelier éducatif']::text[],'Direction Produit',3,'NEW VERSION OF CATALOGUE FC 2022','[]'::jsonb,'','0.1-legacy-import',
  '{"seed": "catalogue-2022-u1", "sourcePage": 3}'::jsonb
) on conflict (id) do update set
  category_id=excluded.category_id,code=excluded.code,name=excluded.name,slug=excluded.slug,legacy_domain=excluded.legacy_domain,
  legacy_number=excluded.legacy_number,expected_card_count=excluded.expected_card_count,historical_price_dh=excluded.historical_price_dh,
  primary_format=excluded.primary_format,status=excluded.status,lifecycle=excluded.lifecycle,readiness_score=excluded.readiness_score,
  age_min_months=excluded.age_min_months,age_max_months=excluded.age_max_months,languages=excluded.languages,methodologies=excluded.methodologies,
  primary_objective=excluded.primary_objective,audiences=excluded.audiences,usage_contexts=excluded.usage_contexts,owner_name=excluded.owner_name,
  source_page=excluded.source_page,source_label=excluded.source_label,legacy_issues=excluded.legacy_issues,notes=excluded.notes,current_version=excluded.current_version,
  metadata=excluded.metadata,updated_at=now();

insert into flashcards_os.editions (collection_id,language_code,edition_key,version_label,status,metadata)
values ('fc-lang-003','fr','standard','0.1-legacy-import','legacy_intake','{"seed":"catalogue-2022-u1"}'::jsonb)
on conflict (collection_id,language_code,edition_key) do nothing;

insert into flashcards_os.formats (collection_id,format_key,status,specification)
values ('fc-lang-003','flashcards','legacy_intake','{"source":"catalogue-2022","specificationStatus":"not-supplied"}'::jsonb)
on conflict (collection_id,format_key) do nothing;

insert into flashcards_os.collection_versions (collection_id,version_label,status,change_summary,content_snapshot,created_by)
values ('fc-lang-003','0.1-legacy-import','draft','Entrée canonique créée depuis le catalogue 2022',jsonb_build_object('sourcePage',3,'expectedCardCount',26,'historicalPriceDh',52),'UMZ1 migration')
on conflict (collection_id,version_label) do nothing;
insert into flashcards_os.collections (
  id,family_id,category_id,code,name,slug,legacy_domain,legacy_number,expected_card_count,structured_card_count,
  historical_price_dh,primary_format,status,lifecycle,readiness_score,age_min_months,age_max_months,languages,
  methodologies,primary_objective,audiences,usage_contexts,owner_name,source_page,source_label,legacy_issues,notes,current_version,metadata
) values (
  'fc-lang-004','family-learning-cards','sub-lang-foundations','FC-LANG-004','Les couleurs basiques','les-couleurs-basiques','LANG','4',
  10,0,20,'flashcards','needs_structuring','legacy_intake',36,
  6,144,array['fr']::text[],array['Montessori','Freinet','Steiner-Waldorf']::text[],'À structurer depuis le contenu source complet; le catalogue 2022 fournit le titre, la quantité et le prix historique, mais pas le registre carte par carte.',array['B2C Familles','B2B Écoles & crèches']::text[],
  array['Maison','Classe','Atelier éducatif']::text[],'Direction Produit',3,'NEW VERSION OF CATALOGUE FC 2022','[]'::jsonb,'','0.1-legacy-import',
  '{"seed": "catalogue-2022-u1", "sourcePage": 3}'::jsonb
) on conflict (id) do update set
  category_id=excluded.category_id,code=excluded.code,name=excluded.name,slug=excluded.slug,legacy_domain=excluded.legacy_domain,
  legacy_number=excluded.legacy_number,expected_card_count=excluded.expected_card_count,historical_price_dh=excluded.historical_price_dh,
  primary_format=excluded.primary_format,status=excluded.status,lifecycle=excluded.lifecycle,readiness_score=excluded.readiness_score,
  age_min_months=excluded.age_min_months,age_max_months=excluded.age_max_months,languages=excluded.languages,methodologies=excluded.methodologies,
  primary_objective=excluded.primary_objective,audiences=excluded.audiences,usage_contexts=excluded.usage_contexts,owner_name=excluded.owner_name,
  source_page=excluded.source_page,source_label=excluded.source_label,legacy_issues=excluded.legacy_issues,notes=excluded.notes,current_version=excluded.current_version,
  metadata=excluded.metadata,updated_at=now();

insert into flashcards_os.editions (collection_id,language_code,edition_key,version_label,status,metadata)
values ('fc-lang-004','fr','standard','0.1-legacy-import','legacy_intake','{"seed":"catalogue-2022-u1"}'::jsonb)
on conflict (collection_id,language_code,edition_key) do nothing;

insert into flashcards_os.formats (collection_id,format_key,status,specification)
values ('fc-lang-004','flashcards','legacy_intake','{"source":"catalogue-2022","specificationStatus":"not-supplied"}'::jsonb)
on conflict (collection_id,format_key) do nothing;

insert into flashcards_os.collection_versions (collection_id,version_label,status,change_summary,content_snapshot,created_by)
values ('fc-lang-004','0.1-legacy-import','draft','Entrée canonique créée depuis le catalogue 2022',jsonb_build_object('sourcePage',3,'expectedCardCount',10,'historicalPriceDh',20),'UMZ1 migration')
on conflict (collection_id,version_label) do nothing;
insert into flashcards_os.collections (
  id,family_id,category_id,code,name,slug,legacy_domain,legacy_number,expected_card_count,structured_card_count,
  historical_price_dh,primary_format,status,lifecycle,readiness_score,age_min_months,age_max_months,languages,
  methodologies,primary_objective,audiences,usage_contexts,owner_name,source_page,source_label,legacy_issues,notes,current_version,metadata
) values (
  'fc-lang-005','family-learning-cards','sub-lang-daily','FC-LANG-005','Fournitures scolaires','fournitures-scolaires','LANG','5',
  20,0,40,'flashcards','needs_structuring','legacy_intake',36,
  6,144,array['fr']::text[],array['Montessori','Freinet','Steiner-Waldorf']::text[],'À structurer depuis le contenu source complet; le catalogue 2022 fournit le titre, la quantité et le prix historique, mais pas le registre carte par carte.',array['B2C Familles','B2B Écoles & crèches']::text[],
  array['Maison','Classe','Atelier éducatif']::text[],'Direction Produit',3,'NEW VERSION OF CATALOGUE FC 2022','[]'::jsonb,'','0.1-legacy-import',
  '{"seed": "catalogue-2022-u1", "sourcePage": 3}'::jsonb
) on conflict (id) do update set
  category_id=excluded.category_id,code=excluded.code,name=excluded.name,slug=excluded.slug,legacy_domain=excluded.legacy_domain,
  legacy_number=excluded.legacy_number,expected_card_count=excluded.expected_card_count,historical_price_dh=excluded.historical_price_dh,
  primary_format=excluded.primary_format,status=excluded.status,lifecycle=excluded.lifecycle,readiness_score=excluded.readiness_score,
  age_min_months=excluded.age_min_months,age_max_months=excluded.age_max_months,languages=excluded.languages,methodologies=excluded.methodologies,
  primary_objective=excluded.primary_objective,audiences=excluded.audiences,usage_contexts=excluded.usage_contexts,owner_name=excluded.owner_name,
  source_page=excluded.source_page,source_label=excluded.source_label,legacy_issues=excluded.legacy_issues,notes=excluded.notes,current_version=excluded.current_version,
  metadata=excluded.metadata,updated_at=now();

insert into flashcards_os.editions (collection_id,language_code,edition_key,version_label,status,metadata)
values ('fc-lang-005','fr','standard','0.1-legacy-import','legacy_intake','{"seed":"catalogue-2022-u1"}'::jsonb)
on conflict (collection_id,language_code,edition_key) do nothing;

insert into flashcards_os.formats (collection_id,format_key,status,specification)
values ('fc-lang-005','flashcards','legacy_intake','{"source":"catalogue-2022","specificationStatus":"not-supplied"}'::jsonb)
on conflict (collection_id,format_key) do nothing;

insert into flashcards_os.collection_versions (collection_id,version_label,status,change_summary,content_snapshot,created_by)
values ('fc-lang-005','0.1-legacy-import','draft','Entrée canonique créée depuis le catalogue 2022',jsonb_build_object('sourcePage',3,'expectedCardCount',20,'historicalPriceDh',40),'UMZ1 migration')
on conflict (collection_id,version_label) do nothing;
insert into flashcards_os.collections (
  id,family_id,category_id,code,name,slug,legacy_domain,legacy_number,expected_card_count,structured_card_count,
  historical_price_dh,primary_format,status,lifecycle,readiness_score,age_min_months,age_max_months,languages,
  methodologies,primary_objective,audiences,usage_contexts,owner_name,source_page,source_label,legacy_issues,notes,current_version,metadata
) values (
  'fc-lang-006','family-learning-cards','sub-lang-daily','FC-LANG-006','Les parties de la journée','les-parties-de-la-journee','LANG','6',
  4,0,8,'flashcards','needs_structuring','legacy_intake',36,
  6,144,array['fr']::text[],array['Montessori','Freinet','Steiner-Waldorf']::text[],'À structurer depuis le contenu source complet; le catalogue 2022 fournit le titre, la quantité et le prix historique, mais pas le registre carte par carte.',array['B2C Familles','B2B Écoles & crèches']::text[],
  array['Maison','Classe','Atelier éducatif']::text[],'Direction Produit',3,'NEW VERSION OF CATALOGUE FC 2022','[]'::jsonb,'','0.1-legacy-import',
  '{"seed": "catalogue-2022-u1", "sourcePage": 3}'::jsonb
) on conflict (id) do update set
  category_id=excluded.category_id,code=excluded.code,name=excluded.name,slug=excluded.slug,legacy_domain=excluded.legacy_domain,
  legacy_number=excluded.legacy_number,expected_card_count=excluded.expected_card_count,historical_price_dh=excluded.historical_price_dh,
  primary_format=excluded.primary_format,status=excluded.status,lifecycle=excluded.lifecycle,readiness_score=excluded.readiness_score,
  age_min_months=excluded.age_min_months,age_max_months=excluded.age_max_months,languages=excluded.languages,methodologies=excluded.methodologies,
  primary_objective=excluded.primary_objective,audiences=excluded.audiences,usage_contexts=excluded.usage_contexts,owner_name=excluded.owner_name,
  source_page=excluded.source_page,source_label=excluded.source_label,legacy_issues=excluded.legacy_issues,notes=excluded.notes,current_version=excluded.current_version,
  metadata=excluded.metadata,updated_at=now();

insert into flashcards_os.editions (collection_id,language_code,edition_key,version_label,status,metadata)
values ('fc-lang-006','fr','standard','0.1-legacy-import','legacy_intake','{"seed":"catalogue-2022-u1"}'::jsonb)
on conflict (collection_id,language_code,edition_key) do nothing;

insert into flashcards_os.formats (collection_id,format_key,status,specification)
values ('fc-lang-006','flashcards','legacy_intake','{"source":"catalogue-2022","specificationStatus":"not-supplied"}'::jsonb)
on conflict (collection_id,format_key) do nothing;

insert into flashcards_os.collection_versions (collection_id,version_label,status,change_summary,content_snapshot,created_by)
values ('fc-lang-006','0.1-legacy-import','draft','Entrée canonique créée depuis le catalogue 2022',jsonb_build_object('sourcePage',3,'expectedCardCount',4,'historicalPriceDh',8),'UMZ1 migration')
on conflict (collection_id,version_label) do nothing;
insert into flashcards_os.collections (
  id,family_id,category_id,code,name,slug,legacy_domain,legacy_number,expected_card_count,structured_card_count,
  historical_price_dh,primary_format,status,lifecycle,readiness_score,age_min_months,age_max_months,languages,
  methodologies,primary_objective,audiences,usage_contexts,owner_name,source_page,source_label,legacy_issues,notes,current_version,metadata
) values (
  'fc-lang-007','family-learning-cards','sub-lang-foundations','FC-LANG-007','Les chiffres','les-chiffres','LANG','7',
  10,0,20,'flashcards','needs_structuring','legacy_intake',36,
  6,144,array['fr']::text[],array['Montessori','Freinet','Steiner-Waldorf']::text[],'À structurer depuis le contenu source complet; le catalogue 2022 fournit le titre, la quantité et le prix historique, mais pas le registre carte par carte.',array['B2C Familles','B2B Écoles & crèches']::text[],
  array['Maison','Classe','Atelier éducatif']::text[],'Direction Produit',3,'NEW VERSION OF CATALOGUE FC 2022','[]'::jsonb,'','0.1-legacy-import',
  '{"seed": "catalogue-2022-u1", "sourcePage": 3}'::jsonb
) on conflict (id) do update set
  category_id=excluded.category_id,code=excluded.code,name=excluded.name,slug=excluded.slug,legacy_domain=excluded.legacy_domain,
  legacy_number=excluded.legacy_number,expected_card_count=excluded.expected_card_count,historical_price_dh=excluded.historical_price_dh,
  primary_format=excluded.primary_format,status=excluded.status,lifecycle=excluded.lifecycle,readiness_score=excluded.readiness_score,
  age_min_months=excluded.age_min_months,age_max_months=excluded.age_max_months,languages=excluded.languages,methodologies=excluded.methodologies,
  primary_objective=excluded.primary_objective,audiences=excluded.audiences,usage_contexts=excluded.usage_contexts,owner_name=excluded.owner_name,
  source_page=excluded.source_page,source_label=excluded.source_label,legacy_issues=excluded.legacy_issues,notes=excluded.notes,current_version=excluded.current_version,
  metadata=excluded.metadata,updated_at=now();

insert into flashcards_os.editions (collection_id,language_code,edition_key,version_label,status,metadata)
values ('fc-lang-007','fr','standard','0.1-legacy-import','legacy_intake','{"seed":"catalogue-2022-u1"}'::jsonb)
on conflict (collection_id,language_code,edition_key) do nothing;

insert into flashcards_os.formats (collection_id,format_key,status,specification)
values ('fc-lang-007','flashcards','legacy_intake','{"source":"catalogue-2022","specificationStatus":"not-supplied"}'::jsonb)
on conflict (collection_id,format_key) do nothing;

insert into flashcards_os.collection_versions (collection_id,version_label,status,change_summary,content_snapshot,created_by)
values ('fc-lang-007','0.1-legacy-import','draft','Entrée canonique créée depuis le catalogue 2022',jsonb_build_object('sourcePage',3,'expectedCardCount',10,'historicalPriceDh',20),'UMZ1 migration')
on conflict (collection_id,version_label) do nothing;
insert into flashcards_os.collections (
  id,family_id,category_id,code,name,slug,legacy_domain,legacy_number,expected_card_count,structured_card_count,
  historical_price_dh,primary_format,status,lifecycle,readiness_score,age_min_months,age_max_months,languages,
  methodologies,primary_objective,audiences,usage_contexts,owner_name,source_page,source_label,legacy_issues,notes,current_version,metadata
) values (
  'fc-lang-008','family-learning-cards','sub-lang-foundations','FC-LANG-008','Les jours de la semaine','les-jours-de-la-semaine','LANG','8',
  7,0,14,'flashcards','needs_structuring','legacy_intake',36,
  6,144,array['fr']::text[],array['Montessori','Freinet','Steiner-Waldorf']::text[],'À structurer depuis le contenu source complet; le catalogue 2022 fournit le titre, la quantité et le prix historique, mais pas le registre carte par carte.',array['B2C Familles','B2B Écoles & crèches']::text[],
  array['Maison','Classe','Atelier éducatif']::text[],'Direction Produit',3,'NEW VERSION OF CATALOGUE FC 2022','[]'::jsonb,'','0.1-legacy-import',
  '{"seed": "catalogue-2022-u1", "sourcePage": 3}'::jsonb
) on conflict (id) do update set
  category_id=excluded.category_id,code=excluded.code,name=excluded.name,slug=excluded.slug,legacy_domain=excluded.legacy_domain,
  legacy_number=excluded.legacy_number,expected_card_count=excluded.expected_card_count,historical_price_dh=excluded.historical_price_dh,
  primary_format=excluded.primary_format,status=excluded.status,lifecycle=excluded.lifecycle,readiness_score=excluded.readiness_score,
  age_min_months=excluded.age_min_months,age_max_months=excluded.age_max_months,languages=excluded.languages,methodologies=excluded.methodologies,
  primary_objective=excluded.primary_objective,audiences=excluded.audiences,usage_contexts=excluded.usage_contexts,owner_name=excluded.owner_name,
  source_page=excluded.source_page,source_label=excluded.source_label,legacy_issues=excluded.legacy_issues,notes=excluded.notes,current_version=excluded.current_version,
  metadata=excluded.metadata,updated_at=now();

insert into flashcards_os.editions (collection_id,language_code,edition_key,version_label,status,metadata)
values ('fc-lang-008','fr','standard','0.1-legacy-import','legacy_intake','{"seed":"catalogue-2022-u1"}'::jsonb)
on conflict (collection_id,language_code,edition_key) do nothing;

insert into flashcards_os.formats (collection_id,format_key,status,specification)
values ('fc-lang-008','flashcards','legacy_intake','{"source":"catalogue-2022","specificationStatus":"not-supplied"}'::jsonb)
on conflict (collection_id,format_key) do nothing;

insert into flashcards_os.collection_versions (collection_id,version_label,status,change_summary,content_snapshot,created_by)
values ('fc-lang-008','0.1-legacy-import','draft','Entrée canonique créée depuis le catalogue 2022',jsonb_build_object('sourcePage',3,'expectedCardCount',7,'historicalPriceDh',14),'UMZ1 migration')
on conflict (collection_id,version_label) do nothing;
insert into flashcards_os.collections (
  id,family_id,category_id,code,name,slug,legacy_domain,legacy_number,expected_card_count,structured_card_count,
  historical_price_dh,primary_format,status,lifecycle,readiness_score,age_min_months,age_max_months,languages,
  methodologies,primary_objective,audiences,usage_contexts,owner_name,source_page,source_label,legacy_issues,notes,current_version,metadata
) values (
  'fc-lang-009','family-learning-cards','sub-lang-foundations','FC-LANG-009','Les mois de l''année','les-mois-de-l-annee','LANG','9',
  12,0,24,'flashcards','needs_structuring','legacy_intake',36,
  6,144,array['fr']::text[],array['Montessori','Freinet','Steiner-Waldorf']::text[],'À structurer depuis le contenu source complet; le catalogue 2022 fournit le titre, la quantité et le prix historique, mais pas le registre carte par carte.',array['B2C Familles','B2B Écoles & crèches']::text[],
  array['Maison','Classe','Atelier éducatif']::text[],'Direction Produit',3,'NEW VERSION OF CATALOGUE FC 2022','[]'::jsonb,'','0.1-legacy-import',
  '{"seed": "catalogue-2022-u1", "sourcePage": 3}'::jsonb
) on conflict (id) do update set
  category_id=excluded.category_id,code=excluded.code,name=excluded.name,slug=excluded.slug,legacy_domain=excluded.legacy_domain,
  legacy_number=excluded.legacy_number,expected_card_count=excluded.expected_card_count,historical_price_dh=excluded.historical_price_dh,
  primary_format=excluded.primary_format,status=excluded.status,lifecycle=excluded.lifecycle,readiness_score=excluded.readiness_score,
  age_min_months=excluded.age_min_months,age_max_months=excluded.age_max_months,languages=excluded.languages,methodologies=excluded.methodologies,
  primary_objective=excluded.primary_objective,audiences=excluded.audiences,usage_contexts=excluded.usage_contexts,owner_name=excluded.owner_name,
  source_page=excluded.source_page,source_label=excluded.source_label,legacy_issues=excluded.legacy_issues,notes=excluded.notes,current_version=excluded.current_version,
  metadata=excluded.metadata,updated_at=now();

insert into flashcards_os.editions (collection_id,language_code,edition_key,version_label,status,metadata)
values ('fc-lang-009','fr','standard','0.1-legacy-import','legacy_intake','{"seed":"catalogue-2022-u1"}'::jsonb)
on conflict (collection_id,language_code,edition_key) do nothing;

insert into flashcards_os.formats (collection_id,format_key,status,specification)
values ('fc-lang-009','flashcards','legacy_intake','{"source":"catalogue-2022","specificationStatus":"not-supplied"}'::jsonb)
on conflict (collection_id,format_key) do nothing;

insert into flashcards_os.collection_versions (collection_id,version_label,status,change_summary,content_snapshot,created_by)
values ('fc-lang-009','0.1-legacy-import','draft','Entrée canonique créée depuis le catalogue 2022',jsonb_build_object('sourcePage',3,'expectedCardCount',12,'historicalPriceDh',24),'UMZ1 migration')
on conflict (collection_id,version_label) do nothing;
insert into flashcards_os.collections (
  id,family_id,category_id,code,name,slug,legacy_domain,legacy_number,expected_card_count,structured_card_count,
  historical_price_dh,primary_format,status,lifecycle,readiness_score,age_min_months,age_max_months,languages,
  methodologies,primary_objective,audiences,usage_contexts,owner_name,source_page,source_label,legacy_issues,notes,current_version,metadata
) values (
  'fc-lang-010','family-learning-cards','sub-lang-daily','FC-LANG-010','Les parties du corps','les-parties-du-corps','LANG','10',
  12,0,24,'flashcards','needs_structuring','legacy_intake',36,
  6,144,array['fr']::text[],array['Montessori','Freinet','Steiner-Waldorf']::text[],'À structurer depuis le contenu source complet; le catalogue 2022 fournit le titre, la quantité et le prix historique, mais pas le registre carte par carte.',array['B2C Familles','B2B Écoles & crèches']::text[],
  array['Maison','Classe','Atelier éducatif']::text[],'Direction Produit',3,'NEW VERSION OF CATALOGUE FC 2022','[]'::jsonb,'','0.1-legacy-import',
  '{"seed": "catalogue-2022-u1", "sourcePage": 3}'::jsonb
) on conflict (id) do update set
  category_id=excluded.category_id,code=excluded.code,name=excluded.name,slug=excluded.slug,legacy_domain=excluded.legacy_domain,
  legacy_number=excluded.legacy_number,expected_card_count=excluded.expected_card_count,historical_price_dh=excluded.historical_price_dh,
  primary_format=excluded.primary_format,status=excluded.status,lifecycle=excluded.lifecycle,readiness_score=excluded.readiness_score,
  age_min_months=excluded.age_min_months,age_max_months=excluded.age_max_months,languages=excluded.languages,methodologies=excluded.methodologies,
  primary_objective=excluded.primary_objective,audiences=excluded.audiences,usage_contexts=excluded.usage_contexts,owner_name=excluded.owner_name,
  source_page=excluded.source_page,source_label=excluded.source_label,legacy_issues=excluded.legacy_issues,notes=excluded.notes,current_version=excluded.current_version,
  metadata=excluded.metadata,updated_at=now();

insert into flashcards_os.editions (collection_id,language_code,edition_key,version_label,status,metadata)
values ('fc-lang-010','fr','standard','0.1-legacy-import','legacy_intake','{"seed":"catalogue-2022-u1"}'::jsonb)
on conflict (collection_id,language_code,edition_key) do nothing;

insert into flashcards_os.formats (collection_id,format_key,status,specification)
values ('fc-lang-010','flashcards','legacy_intake','{"source":"catalogue-2022","specificationStatus":"not-supplied"}'::jsonb)
on conflict (collection_id,format_key) do nothing;

insert into flashcards_os.collection_versions (collection_id,version_label,status,change_summary,content_snapshot,created_by)
values ('fc-lang-010','0.1-legacy-import','draft','Entrée canonique créée depuis le catalogue 2022',jsonb_build_object('sourcePage',3,'expectedCardCount',12,'historicalPriceDh',24),'UMZ1 migration')
on conflict (collection_id,version_label) do nothing;
insert into flashcards_os.collections (
  id,family_id,category_id,code,name,slug,legacy_domain,legacy_number,expected_card_count,structured_card_count,
  historical_price_dh,primary_format,status,lifecycle,readiness_score,age_min_months,age_max_months,languages,
  methodologies,primary_objective,audiences,usage_contexts,owner_name,source_page,source_label,legacy_issues,notes,current_version,metadata
) values (
  'fc-lang-011','family-learning-cards','sub-lang-daily','FC-LANG-011','Les métiers du monde','les-metiers-du-monde','LANG','11',
  30,0,60,'flashcards','needs_structuring','legacy_intake',36,
  6,144,array['fr']::text[],array['Montessori','Freinet','Steiner-Waldorf']::text[],'À structurer depuis le contenu source complet; le catalogue 2022 fournit le titre, la quantité et le prix historique, mais pas le registre carte par carte.',array['B2C Familles','B2B Écoles & crèches']::text[],
  array['Maison','Classe','Atelier éducatif']::text[],'Direction Produit',3,'NEW VERSION OF CATALOGUE FC 2022','[]'::jsonb,'','0.1-legacy-import',
  '{"seed": "catalogue-2022-u1", "sourcePage": 3}'::jsonb
) on conflict (id) do update set
  category_id=excluded.category_id,code=excluded.code,name=excluded.name,slug=excluded.slug,legacy_domain=excluded.legacy_domain,
  legacy_number=excluded.legacy_number,expected_card_count=excluded.expected_card_count,historical_price_dh=excluded.historical_price_dh,
  primary_format=excluded.primary_format,status=excluded.status,lifecycle=excluded.lifecycle,readiness_score=excluded.readiness_score,
  age_min_months=excluded.age_min_months,age_max_months=excluded.age_max_months,languages=excluded.languages,methodologies=excluded.methodologies,
  primary_objective=excluded.primary_objective,audiences=excluded.audiences,usage_contexts=excluded.usage_contexts,owner_name=excluded.owner_name,
  source_page=excluded.source_page,source_label=excluded.source_label,legacy_issues=excluded.legacy_issues,notes=excluded.notes,current_version=excluded.current_version,
  metadata=excluded.metadata,updated_at=now();

insert into flashcards_os.editions (collection_id,language_code,edition_key,version_label,status,metadata)
values ('fc-lang-011','fr','standard','0.1-legacy-import','legacy_intake','{"seed":"catalogue-2022-u1"}'::jsonb)
on conflict (collection_id,language_code,edition_key) do nothing;

insert into flashcards_os.formats (collection_id,format_key,status,specification)
values ('fc-lang-011','flashcards','legacy_intake','{"source":"catalogue-2022","specificationStatus":"not-supplied"}'::jsonb)
on conflict (collection_id,format_key) do nothing;

insert into flashcards_os.collection_versions (collection_id,version_label,status,change_summary,content_snapshot,created_by)
values ('fc-lang-011','0.1-legacy-import','draft','Entrée canonique créée depuis le catalogue 2022',jsonb_build_object('sourcePage',3,'expectedCardCount',30,'historicalPriceDh',60),'UMZ1 migration')
on conflict (collection_id,version_label) do nothing;
insert into flashcards_os.collections (
  id,family_id,category_id,code,name,slug,legacy_domain,legacy_number,expected_card_count,structured_card_count,
  historical_price_dh,primary_format,status,lifecycle,readiness_score,age_min_months,age_max_months,languages,
  methodologies,primary_objective,audiences,usage_contexts,owner_name,source_page,source_label,legacy_issues,notes,current_version,metadata
) values (
  'fc-lang-012','family-learning-cards','sub-lang-expression','FC-LANG-012','Les émotions','les-emotions','LANG','12',
  17,0,34,'flashcards','needs_structuring','legacy_intake',36,
  6,144,array['fr']::text[],array['Montessori','Freinet','Steiner-Waldorf']::text[],'À structurer depuis le contenu source complet; le catalogue 2022 fournit le titre, la quantité et le prix historique, mais pas le registre carte par carte.',array['B2C Familles','B2B Écoles & crèches']::text[],
  array['Maison','Classe','Atelier éducatif']::text[],'Direction Produit',3,'NEW VERSION OF CATALOGUE FC 2022','[]'::jsonb,'','0.1-legacy-import',
  '{"seed": "catalogue-2022-u1", "sourcePage": 3}'::jsonb
) on conflict (id) do update set
  category_id=excluded.category_id,code=excluded.code,name=excluded.name,slug=excluded.slug,legacy_domain=excluded.legacy_domain,
  legacy_number=excluded.legacy_number,expected_card_count=excluded.expected_card_count,historical_price_dh=excluded.historical_price_dh,
  primary_format=excluded.primary_format,status=excluded.status,lifecycle=excluded.lifecycle,readiness_score=excluded.readiness_score,
  age_min_months=excluded.age_min_months,age_max_months=excluded.age_max_months,languages=excluded.languages,methodologies=excluded.methodologies,
  primary_objective=excluded.primary_objective,audiences=excluded.audiences,usage_contexts=excluded.usage_contexts,owner_name=excluded.owner_name,
  source_page=excluded.source_page,source_label=excluded.source_label,legacy_issues=excluded.legacy_issues,notes=excluded.notes,current_version=excluded.current_version,
  metadata=excluded.metadata,updated_at=now();

insert into flashcards_os.editions (collection_id,language_code,edition_key,version_label,status,metadata)
values ('fc-lang-012','fr','standard','0.1-legacy-import','legacy_intake','{"seed":"catalogue-2022-u1"}'::jsonb)
on conflict (collection_id,language_code,edition_key) do nothing;

insert into flashcards_os.formats (collection_id,format_key,status,specification)
values ('fc-lang-012','flashcards','legacy_intake','{"source":"catalogue-2022","specificationStatus":"not-supplied"}'::jsonb)
on conflict (collection_id,format_key) do nothing;

insert into flashcards_os.collection_versions (collection_id,version_label,status,change_summary,content_snapshot,created_by)
values ('fc-lang-012','0.1-legacy-import','draft','Entrée canonique créée depuis le catalogue 2022',jsonb_build_object('sourcePage',3,'expectedCardCount',17,'historicalPriceDh',34),'UMZ1 migration')
on conflict (collection_id,version_label) do nothing;
insert into flashcards_os.collections (
  id,family_id,category_id,code,name,slug,legacy_domain,legacy_number,expected_card_count,structured_card_count,
  historical_price_dh,primary_format,status,lifecycle,readiness_score,age_min_months,age_max_months,languages,
  methodologies,primary_objective,audiences,usage_contexts,owner_name,source_page,source_label,legacy_issues,notes,current_version,metadata
) values (
  'fc-lang-013','family-learning-cards','sub-lang-foundations','FC-LANG-013','Les types de lignes','les-types-de-lignes','LANG','13',
  17,0,34,'flashcards','needs_review','legacy_intake',28,
  6,144,array['fr']::text[],array['Montessori','Freinet','Steiner-Waldorf']::text[],'À structurer depuis le contenu source complet; le catalogue 2022 fournit le titre, la quantité et le prix historique, mais pas le registre carte par carte.',array['B2C Familles','B2B Écoles & crèches']::text[],
  array['Maison','Classe','Atelier éducatif']::text[],'Direction Produit',3,'NEW VERSION OF CATALOGUE FC 2022','["taxonomy_review"]'::jsonb,'','0.1-legacy-import',
  '{"seed": "catalogue-2022-u1", "sourcePage": 3}'::jsonb
) on conflict (id) do update set
  category_id=excluded.category_id,code=excluded.code,name=excluded.name,slug=excluded.slug,legacy_domain=excluded.legacy_domain,
  legacy_number=excluded.legacy_number,expected_card_count=excluded.expected_card_count,historical_price_dh=excluded.historical_price_dh,
  primary_format=excluded.primary_format,status=excluded.status,lifecycle=excluded.lifecycle,readiness_score=excluded.readiness_score,
  age_min_months=excluded.age_min_months,age_max_months=excluded.age_max_months,languages=excluded.languages,methodologies=excluded.methodologies,
  primary_objective=excluded.primary_objective,audiences=excluded.audiences,usage_contexts=excluded.usage_contexts,owner_name=excluded.owner_name,
  source_page=excluded.source_page,source_label=excluded.source_label,legacy_issues=excluded.legacy_issues,notes=excluded.notes,current_version=excluded.current_version,
  metadata=excluded.metadata,updated_at=now();

insert into flashcards_os.editions (collection_id,language_code,edition_key,version_label,status,metadata)
values ('fc-lang-013','fr','standard','0.1-legacy-import','legacy_intake','{"seed":"catalogue-2022-u1"}'::jsonb)
on conflict (collection_id,language_code,edition_key) do nothing;

insert into flashcards_os.formats (collection_id,format_key,status,specification)
values ('fc-lang-013','flashcards','legacy_intake','{"source":"catalogue-2022","specificationStatus":"not-supplied"}'::jsonb)
on conflict (collection_id,format_key) do nothing;

insert into flashcards_os.collection_versions (collection_id,version_label,status,change_summary,content_snapshot,created_by)
values ('fc-lang-013','0.1-legacy-import','draft','Entrée canonique créée depuis le catalogue 2022',jsonb_build_object('sourcePage',3,'expectedCardCount',17,'historicalPriceDh',34),'UMZ1 migration')
on conflict (collection_id,version_label) do nothing;
insert into flashcards_os.collections (
  id,family_id,category_id,code,name,slug,legacy_domain,legacy_number,expected_card_count,structured_card_count,
  historical_price_dh,primary_format,status,lifecycle,readiness_score,age_min_months,age_max_months,languages,
  methodologies,primary_objective,audiences,usage_contexts,owner_name,source_page,source_label,legacy_issues,notes,current_version,metadata
) values (
  'fc-lang-014','family-learning-cards','sub-lang-daily','FC-LANG-014','Les 4 saisons','les-4-saisons','LANG','14',
  4,0,8,'flashcards','needs_structuring','legacy_intake',36,
  6,144,array['fr']::text[],array['Montessori','Freinet','Steiner-Waldorf']::text[],'À structurer depuis le contenu source complet; le catalogue 2022 fournit le titre, la quantité et le prix historique, mais pas le registre carte par carte.',array['B2C Familles','B2B Écoles & crèches']::text[],
  array['Maison','Classe','Atelier éducatif']::text[],'Direction Produit',3,'NEW VERSION OF CATALOGUE FC 2022','[]'::jsonb,'','0.1-legacy-import',
  '{"seed": "catalogue-2022-u1", "sourcePage": 3}'::jsonb
) on conflict (id) do update set
  category_id=excluded.category_id,code=excluded.code,name=excluded.name,slug=excluded.slug,legacy_domain=excluded.legacy_domain,
  legacy_number=excluded.legacy_number,expected_card_count=excluded.expected_card_count,historical_price_dh=excluded.historical_price_dh,
  primary_format=excluded.primary_format,status=excluded.status,lifecycle=excluded.lifecycle,readiness_score=excluded.readiness_score,
  age_min_months=excluded.age_min_months,age_max_months=excluded.age_max_months,languages=excluded.languages,methodologies=excluded.methodologies,
  primary_objective=excluded.primary_objective,audiences=excluded.audiences,usage_contexts=excluded.usage_contexts,owner_name=excluded.owner_name,
  source_page=excluded.source_page,source_label=excluded.source_label,legacy_issues=excluded.legacy_issues,notes=excluded.notes,current_version=excluded.current_version,
  metadata=excluded.metadata,updated_at=now();

insert into flashcards_os.editions (collection_id,language_code,edition_key,version_label,status,metadata)
values ('fc-lang-014','fr','standard','0.1-legacy-import','legacy_intake','{"seed":"catalogue-2022-u1"}'::jsonb)
on conflict (collection_id,language_code,edition_key) do nothing;

insert into flashcards_os.formats (collection_id,format_key,status,specification)
values ('fc-lang-014','flashcards','legacy_intake','{"source":"catalogue-2022","specificationStatus":"not-supplied"}'::jsonb)
on conflict (collection_id,format_key) do nothing;

insert into flashcards_os.collection_versions (collection_id,version_label,status,change_summary,content_snapshot,created_by)
values ('fc-lang-014','0.1-legacy-import','draft','Entrée canonique créée depuis le catalogue 2022',jsonb_build_object('sourcePage',3,'expectedCardCount',4,'historicalPriceDh',8),'UMZ1 migration')
on conflict (collection_id,version_label) do nothing;
insert into flashcards_os.collections (
  id,family_id,category_id,code,name,slug,legacy_domain,legacy_number,expected_card_count,structured_card_count,
  historical_price_dh,primary_format,status,lifecycle,readiness_score,age_min_months,age_max_months,languages,
  methodologies,primary_objective,audiences,usage_contexts,owner_name,source_page,source_label,legacy_issues,notes,current_version,metadata
) values (
  'fc-lang-015','family-learning-cards','sub-lang-daily','FC-LANG-015','La météo','la-meteo','LANG','15',
  10,0,20,'flashcards','needs_structuring','legacy_intake',36,
  6,144,array['fr']::text[],array['Montessori','Freinet','Steiner-Waldorf']::text[],'À structurer depuis le contenu source complet; le catalogue 2022 fournit le titre, la quantité et le prix historique, mais pas le registre carte par carte.',array['B2C Familles','B2B Écoles & crèches']::text[],
  array['Maison','Classe','Atelier éducatif']::text[],'Direction Produit',3,'NEW VERSION OF CATALOGUE FC 2022','[]'::jsonb,'','0.1-legacy-import',
  '{"seed": "catalogue-2022-u1", "sourcePage": 3}'::jsonb
) on conflict (id) do update set
  category_id=excluded.category_id,code=excluded.code,name=excluded.name,slug=excluded.slug,legacy_domain=excluded.legacy_domain,
  legacy_number=excluded.legacy_number,expected_card_count=excluded.expected_card_count,historical_price_dh=excluded.historical_price_dh,
  primary_format=excluded.primary_format,status=excluded.status,lifecycle=excluded.lifecycle,readiness_score=excluded.readiness_score,
  age_min_months=excluded.age_min_months,age_max_months=excluded.age_max_months,languages=excluded.languages,methodologies=excluded.methodologies,
  primary_objective=excluded.primary_objective,audiences=excluded.audiences,usage_contexts=excluded.usage_contexts,owner_name=excluded.owner_name,
  source_page=excluded.source_page,source_label=excluded.source_label,legacy_issues=excluded.legacy_issues,notes=excluded.notes,current_version=excluded.current_version,
  metadata=excluded.metadata,updated_at=now();

insert into flashcards_os.editions (collection_id,language_code,edition_key,version_label,status,metadata)
values ('fc-lang-015','fr','standard','0.1-legacy-import','legacy_intake','{"seed":"catalogue-2022-u1"}'::jsonb)
on conflict (collection_id,language_code,edition_key) do nothing;

insert into flashcards_os.formats (collection_id,format_key,status,specification)
values ('fc-lang-015','flashcards','legacy_intake','{"source":"catalogue-2022","specificationStatus":"not-supplied"}'::jsonb)
on conflict (collection_id,format_key) do nothing;

insert into flashcards_os.collection_versions (collection_id,version_label,status,change_summary,content_snapshot,created_by)
values ('fc-lang-015','0.1-legacy-import','draft','Entrée canonique créée depuis le catalogue 2022',jsonb_build_object('sourcePage',3,'expectedCardCount',10,'historicalPriceDh',20),'UMZ1 migration')
on conflict (collection_id,version_label) do nothing;
insert into flashcards_os.collections (
  id,family_id,category_id,code,name,slug,legacy_domain,legacy_number,expected_card_count,structured_card_count,
  historical_price_dh,primary_format,status,lifecycle,readiness_score,age_min_months,age_max_months,languages,
  methodologies,primary_objective,audiences,usage_contexts,owner_name,source_page,source_label,legacy_issues,notes,current_version,metadata
) values (
  'fc-lang-016','family-learning-cards','sub-lang-daily','FC-LANG-016','Les vêtements','les-vetements','LANG','16',
  20,0,40,'flashcards','needs_structuring','legacy_intake',36,
  6,144,array['fr']::text[],array['Montessori','Freinet','Steiner-Waldorf']::text[],'À structurer depuis le contenu source complet; le catalogue 2022 fournit le titre, la quantité et le prix historique, mais pas le registre carte par carte.',array['B2C Familles','B2B Écoles & crèches']::text[],
  array['Maison','Classe','Atelier éducatif']::text[],'Direction Produit',3,'NEW VERSION OF CATALOGUE FC 2022','[]'::jsonb,'','0.1-legacy-import',
  '{"seed": "catalogue-2022-u1", "sourcePage": 3}'::jsonb
) on conflict (id) do update set
  category_id=excluded.category_id,code=excluded.code,name=excluded.name,slug=excluded.slug,legacy_domain=excluded.legacy_domain,
  legacy_number=excluded.legacy_number,expected_card_count=excluded.expected_card_count,historical_price_dh=excluded.historical_price_dh,
  primary_format=excluded.primary_format,status=excluded.status,lifecycle=excluded.lifecycle,readiness_score=excluded.readiness_score,
  age_min_months=excluded.age_min_months,age_max_months=excluded.age_max_months,languages=excluded.languages,methodologies=excluded.methodologies,
  primary_objective=excluded.primary_objective,audiences=excluded.audiences,usage_contexts=excluded.usage_contexts,owner_name=excluded.owner_name,
  source_page=excluded.source_page,source_label=excluded.source_label,legacy_issues=excluded.legacy_issues,notes=excluded.notes,current_version=excluded.current_version,
  metadata=excluded.metadata,updated_at=now();

insert into flashcards_os.editions (collection_id,language_code,edition_key,version_label,status,metadata)
values ('fc-lang-016','fr','standard','0.1-legacy-import','legacy_intake','{"seed":"catalogue-2022-u1"}'::jsonb)
on conflict (collection_id,language_code,edition_key) do nothing;

insert into flashcards_os.formats (collection_id,format_key,status,specification)
values ('fc-lang-016','flashcards','legacy_intake','{"source":"catalogue-2022","specificationStatus":"not-supplied"}'::jsonb)
on conflict (collection_id,format_key) do nothing;

insert into flashcards_os.collection_versions (collection_id,version_label,status,change_summary,content_snapshot,created_by)
values ('fc-lang-016','0.1-legacy-import','draft','Entrée canonique créée depuis le catalogue 2022',jsonb_build_object('sourcePage',3,'expectedCardCount',20,'historicalPriceDh',40),'UMZ1 migration')
on conflict (collection_id,version_label) do nothing;
insert into flashcards_os.collections (
  id,family_id,category_id,code,name,slug,legacy_domain,legacy_number,expected_card_count,structured_card_count,
  historical_price_dh,primary_format,status,lifecycle,readiness_score,age_min_months,age_max_months,languages,
  methodologies,primary_objective,audiences,usage_contexts,owner_name,source_page,source_label,legacy_issues,notes,current_version,metadata
) values (
  'fc-lang-017','family-learning-cards','sub-lang-daily','FC-LANG-017','Mélange Fruits','melange-fruits','LANG','17',
  15,0,30,'flashcards','needs_structuring','legacy_intake',36,
  6,144,array['fr']::text[],array['Montessori','Freinet','Steiner-Waldorf']::text[],'À structurer depuis le contenu source complet; le catalogue 2022 fournit le titre, la quantité et le prix historique, mais pas le registre carte par carte.',array['B2C Familles','B2B Écoles & crèches']::text[],
  array['Maison','Classe','Atelier éducatif']::text[],'Direction Produit',3,'NEW VERSION OF CATALOGUE FC 2022','[]'::jsonb,'','0.1-legacy-import',
  '{"seed": "catalogue-2022-u1", "sourcePage": 3}'::jsonb
) on conflict (id) do update set
  category_id=excluded.category_id,code=excluded.code,name=excluded.name,slug=excluded.slug,legacy_domain=excluded.legacy_domain,
  legacy_number=excluded.legacy_number,expected_card_count=excluded.expected_card_count,historical_price_dh=excluded.historical_price_dh,
  primary_format=excluded.primary_format,status=excluded.status,lifecycle=excluded.lifecycle,readiness_score=excluded.readiness_score,
  age_min_months=excluded.age_min_months,age_max_months=excluded.age_max_months,languages=excluded.languages,methodologies=excluded.methodologies,
  primary_objective=excluded.primary_objective,audiences=excluded.audiences,usage_contexts=excluded.usage_contexts,owner_name=excluded.owner_name,
  source_page=excluded.source_page,source_label=excluded.source_label,legacy_issues=excluded.legacy_issues,notes=excluded.notes,current_version=excluded.current_version,
  metadata=excluded.metadata,updated_at=now();

insert into flashcards_os.editions (collection_id,language_code,edition_key,version_label,status,metadata)
values ('fc-lang-017','fr','standard','0.1-legacy-import','legacy_intake','{"seed":"catalogue-2022-u1"}'::jsonb)
on conflict (collection_id,language_code,edition_key) do nothing;

insert into flashcards_os.formats (collection_id,format_key,status,specification)
values ('fc-lang-017','flashcards','legacy_intake','{"source":"catalogue-2022","specificationStatus":"not-supplied"}'::jsonb)
on conflict (collection_id,format_key) do nothing;

insert into flashcards_os.collection_versions (collection_id,version_label,status,change_summary,content_snapshot,created_by)
values ('fc-lang-017','0.1-legacy-import','draft','Entrée canonique créée depuis le catalogue 2022',jsonb_build_object('sourcePage',3,'expectedCardCount',15,'historicalPriceDh',30),'UMZ1 migration')
on conflict (collection_id,version_label) do nothing;
insert into flashcards_os.collections (
  id,family_id,category_id,code,name,slug,legacy_domain,legacy_number,expected_card_count,structured_card_count,
  historical_price_dh,primary_format,status,lifecycle,readiness_score,age_min_months,age_max_months,languages,
  methodologies,primary_objective,audiences,usage_contexts,owner_name,source_page,source_label,legacy_issues,notes,current_version,metadata
) values (
  'fc-lang-018','family-learning-cards','sub-lang-daily','FC-LANG-018','Mélange légumes','melange-legumes','LANG','18',
  15,0,30,'flashcards','needs_structuring','legacy_intake',36,
  6,144,array['fr']::text[],array['Montessori','Freinet','Steiner-Waldorf']::text[],'À structurer depuis le contenu source complet; le catalogue 2022 fournit le titre, la quantité et le prix historique, mais pas le registre carte par carte.',array['B2C Familles','B2B Écoles & crèches']::text[],
  array['Maison','Classe','Atelier éducatif']::text[],'Direction Produit',3,'NEW VERSION OF CATALOGUE FC 2022','[]'::jsonb,'','0.1-legacy-import',
  '{"seed": "catalogue-2022-u1", "sourcePage": 3}'::jsonb
) on conflict (id) do update set
  category_id=excluded.category_id,code=excluded.code,name=excluded.name,slug=excluded.slug,legacy_domain=excluded.legacy_domain,
  legacy_number=excluded.legacy_number,expected_card_count=excluded.expected_card_count,historical_price_dh=excluded.historical_price_dh,
  primary_format=excluded.primary_format,status=excluded.status,lifecycle=excluded.lifecycle,readiness_score=excluded.readiness_score,
  age_min_months=excluded.age_min_months,age_max_months=excluded.age_max_months,languages=excluded.languages,methodologies=excluded.methodologies,
  primary_objective=excluded.primary_objective,audiences=excluded.audiences,usage_contexts=excluded.usage_contexts,owner_name=excluded.owner_name,
  source_page=excluded.source_page,source_label=excluded.source_label,legacy_issues=excluded.legacy_issues,notes=excluded.notes,current_version=excluded.current_version,
  metadata=excluded.metadata,updated_at=now();

insert into flashcards_os.editions (collection_id,language_code,edition_key,version_label,status,metadata)
values ('fc-lang-018','fr','standard','0.1-legacy-import','legacy_intake','{"seed":"catalogue-2022-u1"}'::jsonb)
on conflict (collection_id,language_code,edition_key) do nothing;

insert into flashcards_os.formats (collection_id,format_key,status,specification)
values ('fc-lang-018','flashcards','legacy_intake','{"source":"catalogue-2022","specificationStatus":"not-supplied"}'::jsonb)
on conflict (collection_id,format_key) do nothing;

insert into flashcards_os.collection_versions (collection_id,version_label,status,change_summary,content_snapshot,created_by)
values ('fc-lang-018','0.1-legacy-import','draft','Entrée canonique créée depuis le catalogue 2022',jsonb_build_object('sourcePage',3,'expectedCardCount',15,'historicalPriceDh',30),'UMZ1 migration')
on conflict (collection_id,version_label) do nothing;
insert into flashcards_os.collections (
  id,family_id,category_id,code,name,slug,legacy_domain,legacy_number,expected_card_count,structured_card_count,
  historical_price_dh,primary_format,status,lifecycle,readiness_score,age_min_months,age_max_months,languages,
  methodologies,primary_objective,audiences,usage_contexts,owner_name,source_page,source_label,legacy_issues,notes,current_version,metadata
) values (
  'fc-lang-019','family-learning-cards','sub-lang-daily','FC-LANG-019','Les vêtements','les-vetements','LANG','17',
  20,0,40,'flashcards','needs_review','legacy_intake',28,
  6,144,array['fr']::text[],array['Montessori','Freinet','Steiner-Waldorf']::text[],'À structurer depuis le contenu source complet; le catalogue 2022 fournit le titre, la quantité et le prix historique, mais pas le registre carte par carte.',array['B2C Familles','B2B Écoles & crèches']::text[],
  array['Maison','Classe','Atelier éducatif']::text[],'Direction Produit',3,'NEW VERSION OF CATALOGUE FC 2022','["duplicate_name", "duplicate_legacy_concept"]'::jsonb,'','0.1-legacy-import',
  '{"seed": "catalogue-2022-u1", "sourcePage": 3}'::jsonb
) on conflict (id) do update set
  category_id=excluded.category_id,code=excluded.code,name=excluded.name,slug=excluded.slug,legacy_domain=excluded.legacy_domain,
  legacy_number=excluded.legacy_number,expected_card_count=excluded.expected_card_count,historical_price_dh=excluded.historical_price_dh,
  primary_format=excluded.primary_format,status=excluded.status,lifecycle=excluded.lifecycle,readiness_score=excluded.readiness_score,
  age_min_months=excluded.age_min_months,age_max_months=excluded.age_max_months,languages=excluded.languages,methodologies=excluded.methodologies,
  primary_objective=excluded.primary_objective,audiences=excluded.audiences,usage_contexts=excluded.usage_contexts,owner_name=excluded.owner_name,
  source_page=excluded.source_page,source_label=excluded.source_label,legacy_issues=excluded.legacy_issues,notes=excluded.notes,current_version=excluded.current_version,
  metadata=excluded.metadata,updated_at=now();

insert into flashcards_os.editions (collection_id,language_code,edition_key,version_label,status,metadata)
values ('fc-lang-019','fr','standard','0.1-legacy-import','legacy_intake','{"seed":"catalogue-2022-u1"}'::jsonb)
on conflict (collection_id,language_code,edition_key) do nothing;

insert into flashcards_os.formats (collection_id,format_key,status,specification)
values ('fc-lang-019','flashcards','legacy_intake','{"source":"catalogue-2022","specificationStatus":"not-supplied"}'::jsonb)
on conflict (collection_id,format_key) do nothing;

insert into flashcards_os.collection_versions (collection_id,version_label,status,change_summary,content_snapshot,created_by)
values ('fc-lang-019','0.1-legacy-import','draft','Entrée canonique créée depuis le catalogue 2022',jsonb_build_object('sourcePage',3,'expectedCardCount',20,'historicalPriceDh',40),'UMZ1 migration')
on conflict (collection_id,version_label) do nothing;
insert into flashcards_os.collections (
  id,family_id,category_id,code,name,slug,legacy_domain,legacy_number,expected_card_count,structured_card_count,
  historical_price_dh,primary_format,status,lifecycle,readiness_score,age_min_months,age_max_months,languages,
  methodologies,primary_objective,audiences,usage_contexts,owner_name,source_page,source_label,legacy_issues,notes,current_version,metadata
) values (
  'fc-lang-020','family-learning-cards','sub-lang-daily','FC-LANG-020','Les pièces de la maison','les-pieces-de-la-maison','LANG','18',
  20,0,40,'flashcards','needs_structuring','legacy_intake',36,
  6,144,array['fr']::text[],array['Montessori','Freinet','Steiner-Waldorf']::text[],'À structurer depuis le contenu source complet; le catalogue 2022 fournit le titre, la quantité et le prix historique, mais pas le registre carte par carte.',array['B2C Familles','B2B Écoles & crèches']::text[],
  array['Maison','Classe','Atelier éducatif']::text[],'Direction Produit',3,'NEW VERSION OF CATALOGUE FC 2022','[]'::jsonb,'','0.1-legacy-import',
  '{"seed": "catalogue-2022-u1", "sourcePage": 3}'::jsonb
) on conflict (id) do update set
  category_id=excluded.category_id,code=excluded.code,name=excluded.name,slug=excluded.slug,legacy_domain=excluded.legacy_domain,
  legacy_number=excluded.legacy_number,expected_card_count=excluded.expected_card_count,historical_price_dh=excluded.historical_price_dh,
  primary_format=excluded.primary_format,status=excluded.status,lifecycle=excluded.lifecycle,readiness_score=excluded.readiness_score,
  age_min_months=excluded.age_min_months,age_max_months=excluded.age_max_months,languages=excluded.languages,methodologies=excluded.methodologies,
  primary_objective=excluded.primary_objective,audiences=excluded.audiences,usage_contexts=excluded.usage_contexts,owner_name=excluded.owner_name,
  source_page=excluded.source_page,source_label=excluded.source_label,legacy_issues=excluded.legacy_issues,notes=excluded.notes,current_version=excluded.current_version,
  metadata=excluded.metadata,updated_at=now();

insert into flashcards_os.editions (collection_id,language_code,edition_key,version_label,status,metadata)
values ('fc-lang-020','fr','standard','0.1-legacy-import','legacy_intake','{"seed":"catalogue-2022-u1"}'::jsonb)
on conflict (collection_id,language_code,edition_key) do nothing;

insert into flashcards_os.formats (collection_id,format_key,status,specification)
values ('fc-lang-020','flashcards','legacy_intake','{"source":"catalogue-2022","specificationStatus":"not-supplied"}'::jsonb)
on conflict (collection_id,format_key) do nothing;

insert into flashcards_os.collection_versions (collection_id,version_label,status,change_summary,content_snapshot,created_by)
values ('fc-lang-020','0.1-legacy-import','draft','Entrée canonique créée depuis le catalogue 2022',jsonb_build_object('sourcePage',3,'expectedCardCount',20,'historicalPriceDh',40),'UMZ1 migration')
on conflict (collection_id,version_label) do nothing;
insert into flashcards_os.collections (
  id,family_id,category_id,code,name,slug,legacy_domain,legacy_number,expected_card_count,structured_card_count,
  historical_price_dh,primary_format,status,lifecycle,readiness_score,age_min_months,age_max_months,languages,
  methodologies,primary_objective,audiences,usage_contexts,owner_name,source_page,source_label,legacy_issues,notes,current_version,metadata
) values (
  'fc-lang-021','family-learning-cards','sub-lang-daily','FC-LANG-021','Les véhicules','les-vehicules','LANG','19',
  20,0,40,'flashcards','needs_structuring','legacy_intake',36,
  6,144,array['fr']::text[],array['Montessori','Freinet','Steiner-Waldorf']::text[],'À structurer depuis le contenu source complet; le catalogue 2022 fournit le titre, la quantité et le prix historique, mais pas le registre carte par carte.',array['B2C Familles','B2B Écoles & crèches']::text[],
  array['Maison','Classe','Atelier éducatif']::text[],'Direction Produit',3,'NEW VERSION OF CATALOGUE FC 2022','[]'::jsonb,'','0.1-legacy-import',
  '{"seed": "catalogue-2022-u1", "sourcePage": 3}'::jsonb
) on conflict (id) do update set
  category_id=excluded.category_id,code=excluded.code,name=excluded.name,slug=excluded.slug,legacy_domain=excluded.legacy_domain,
  legacy_number=excluded.legacy_number,expected_card_count=excluded.expected_card_count,historical_price_dh=excluded.historical_price_dh,
  primary_format=excluded.primary_format,status=excluded.status,lifecycle=excluded.lifecycle,readiness_score=excluded.readiness_score,
  age_min_months=excluded.age_min_months,age_max_months=excluded.age_max_months,languages=excluded.languages,methodologies=excluded.methodologies,
  primary_objective=excluded.primary_objective,audiences=excluded.audiences,usage_contexts=excluded.usage_contexts,owner_name=excluded.owner_name,
  source_page=excluded.source_page,source_label=excluded.source_label,legacy_issues=excluded.legacy_issues,notes=excluded.notes,current_version=excluded.current_version,
  metadata=excluded.metadata,updated_at=now();

insert into flashcards_os.editions (collection_id,language_code,edition_key,version_label,status,metadata)
values ('fc-lang-021','fr','standard','0.1-legacy-import','legacy_intake','{"seed":"catalogue-2022-u1"}'::jsonb)
on conflict (collection_id,language_code,edition_key) do nothing;

insert into flashcards_os.formats (collection_id,format_key,status,specification)
values ('fc-lang-021','flashcards','legacy_intake','{"source":"catalogue-2022","specificationStatus":"not-supplied"}'::jsonb)
on conflict (collection_id,format_key) do nothing;

insert into flashcards_os.collection_versions (collection_id,version_label,status,change_summary,content_snapshot,created_by)
values ('fc-lang-021','0.1-legacy-import','draft','Entrée canonique créée depuis le catalogue 2022',jsonb_build_object('sourcePage',3,'expectedCardCount',20,'historicalPriceDh',40),'UMZ1 migration')
on conflict (collection_id,version_label) do nothing;
insert into flashcards_os.collections (
  id,family_id,category_id,code,name,slug,legacy_domain,legacy_number,expected_card_count,structured_card_count,
  historical_price_dh,primary_format,status,lifecycle,readiness_score,age_min_months,age_max_months,languages,
  methodologies,primary_objective,audiences,usage_contexts,owner_name,source_page,source_label,legacy_issues,notes,current_version,metadata
) values (
  'fc-lang-022','family-learning-cards','sub-lang-daily','FC-LANG-022','Les membres de la famille','les-membres-de-la-famille','LANG','20',
  9,0,18,'flashcards','needs_structuring','legacy_intake',36,
  6,144,array['fr']::text[],array['Montessori','Freinet','Steiner-Waldorf']::text[],'À structurer depuis le contenu source complet; le catalogue 2022 fournit le titre, la quantité et le prix historique, mais pas le registre carte par carte.',array['B2C Familles','B2B Écoles & crèches']::text[],
  array['Maison','Classe','Atelier éducatif']::text[],'Direction Produit',3,'NEW VERSION OF CATALOGUE FC 2022','[]'::jsonb,'','0.1-legacy-import',
  '{"seed": "catalogue-2022-u1", "sourcePage": 3}'::jsonb
) on conflict (id) do update set
  category_id=excluded.category_id,code=excluded.code,name=excluded.name,slug=excluded.slug,legacy_domain=excluded.legacy_domain,
  legacy_number=excluded.legacy_number,expected_card_count=excluded.expected_card_count,historical_price_dh=excluded.historical_price_dh,
  primary_format=excluded.primary_format,status=excluded.status,lifecycle=excluded.lifecycle,readiness_score=excluded.readiness_score,
  age_min_months=excluded.age_min_months,age_max_months=excluded.age_max_months,languages=excluded.languages,methodologies=excluded.methodologies,
  primary_objective=excluded.primary_objective,audiences=excluded.audiences,usage_contexts=excluded.usage_contexts,owner_name=excluded.owner_name,
  source_page=excluded.source_page,source_label=excluded.source_label,legacy_issues=excluded.legacy_issues,notes=excluded.notes,current_version=excluded.current_version,
  metadata=excluded.metadata,updated_at=now();

insert into flashcards_os.editions (collection_id,language_code,edition_key,version_label,status,metadata)
values ('fc-lang-022','fr','standard','0.1-legacy-import','legacy_intake','{"seed":"catalogue-2022-u1"}'::jsonb)
on conflict (collection_id,language_code,edition_key) do nothing;

insert into flashcards_os.formats (collection_id,format_key,status,specification)
values ('fc-lang-022','flashcards','legacy_intake','{"source":"catalogue-2022","specificationStatus":"not-supplied"}'::jsonb)
on conflict (collection_id,format_key) do nothing;

insert into flashcards_os.collection_versions (collection_id,version_label,status,change_summary,content_snapshot,created_by)
values ('fc-lang-022','0.1-legacy-import','draft','Entrée canonique créée depuis le catalogue 2022',jsonb_build_object('sourcePage',3,'expectedCardCount',9,'historicalPriceDh',18),'UMZ1 migration')
on conflict (collection_id,version_label) do nothing;
insert into flashcards_os.collections (
  id,family_id,category_id,code,name,slug,legacy_domain,legacy_number,expected_card_count,structured_card_count,
  historical_price_dh,primary_format,status,lifecycle,readiness_score,age_min_months,age_max_months,languages,
  methodologies,primary_objective,audiences,usage_contexts,owner_name,source_page,source_label,legacy_issues,notes,current_version,metadata
) values (
  'fc-geo-001','family-learning-cards','sub-geo-world','FC-GEO-001','Continents du monde','continents-du-monde','GEO','1',
  7,0,14,'flashcards','needs_structuring','legacy_intake',36,
  36,144,array['fr']::text[],array['Montessori','Freinet','Steiner-Waldorf']::text[],'À structurer depuis le contenu source complet; le catalogue 2022 fournit le titre, la quantité et le prix historique, mais pas le registre carte par carte.',array['B2C Familles','B2B Écoles & crèches']::text[],
  array['Maison','Classe','Atelier éducatif']::text[],'Direction Produit',4,'NEW VERSION OF CATALOGUE FC 2022','[]'::jsonb,'','0.1-legacy-import',
  '{"seed": "catalogue-2022-u1", "sourcePage": 4}'::jsonb
) on conflict (id) do update set
  category_id=excluded.category_id,code=excluded.code,name=excluded.name,slug=excluded.slug,legacy_domain=excluded.legacy_domain,
  legacy_number=excluded.legacy_number,expected_card_count=excluded.expected_card_count,historical_price_dh=excluded.historical_price_dh,
  primary_format=excluded.primary_format,status=excluded.status,lifecycle=excluded.lifecycle,readiness_score=excluded.readiness_score,
  age_min_months=excluded.age_min_months,age_max_months=excluded.age_max_months,languages=excluded.languages,methodologies=excluded.methodologies,
  primary_objective=excluded.primary_objective,audiences=excluded.audiences,usage_contexts=excluded.usage_contexts,owner_name=excluded.owner_name,
  source_page=excluded.source_page,source_label=excluded.source_label,legacy_issues=excluded.legacy_issues,notes=excluded.notes,current_version=excluded.current_version,
  metadata=excluded.metadata,updated_at=now();

insert into flashcards_os.editions (collection_id,language_code,edition_key,version_label,status,metadata)
values ('fc-geo-001','fr','standard','0.1-legacy-import','legacy_intake','{"seed":"catalogue-2022-u1"}'::jsonb)
on conflict (collection_id,language_code,edition_key) do nothing;

insert into flashcards_os.formats (collection_id,format_key,status,specification)
values ('fc-geo-001','flashcards','legacy_intake','{"source":"catalogue-2022","specificationStatus":"not-supplied"}'::jsonb)
on conflict (collection_id,format_key) do nothing;

insert into flashcards_os.collection_versions (collection_id,version_label,status,change_summary,content_snapshot,created_by)
values ('fc-geo-001','0.1-legacy-import','draft','Entrée canonique créée depuis le catalogue 2022',jsonb_build_object('sourcePage',4,'expectedCardCount',7,'historicalPriceDh',14),'UMZ1 migration')
on conflict (collection_id,version_label) do nothing;
insert into flashcards_os.collections (
  id,family_id,category_id,code,name,slug,legacy_domain,legacy_number,expected_card_count,structured_card_count,
  historical_price_dh,primary_format,status,lifecycle,readiness_score,age_min_months,age_max_months,languages,
  methodologies,primary_objective,audiences,usage_contexts,owner_name,source_page,source_label,legacy_issues,notes,current_version,metadata
) values (
  'fc-geo-002','family-learning-cards','sub-geo-world','FC-GEO-002','Les pays d’Afrique','les-pays-dafrique','GEO','2',
  20,0,40,'flashcards','needs_structuring','legacy_intake',36,
  36,144,array['fr']::text[],array['Montessori','Freinet','Steiner-Waldorf']::text[],'À structurer depuis le contenu source complet; le catalogue 2022 fournit le titre, la quantité et le prix historique, mais pas le registre carte par carte.',array['B2C Familles','B2B Écoles & crèches']::text[],
  array['Maison','Classe','Atelier éducatif']::text[],'Direction Produit',4,'NEW VERSION OF CATALOGUE FC 2022','[]'::jsonb,'','0.1-legacy-import',
  '{"seed": "catalogue-2022-u1", "sourcePage": 4}'::jsonb
) on conflict (id) do update set
  category_id=excluded.category_id,code=excluded.code,name=excluded.name,slug=excluded.slug,legacy_domain=excluded.legacy_domain,
  legacy_number=excluded.legacy_number,expected_card_count=excluded.expected_card_count,historical_price_dh=excluded.historical_price_dh,
  primary_format=excluded.primary_format,status=excluded.status,lifecycle=excluded.lifecycle,readiness_score=excluded.readiness_score,
  age_min_months=excluded.age_min_months,age_max_months=excluded.age_max_months,languages=excluded.languages,methodologies=excluded.methodologies,
  primary_objective=excluded.primary_objective,audiences=excluded.audiences,usage_contexts=excluded.usage_contexts,owner_name=excluded.owner_name,
  source_page=excluded.source_page,source_label=excluded.source_label,legacy_issues=excluded.legacy_issues,notes=excluded.notes,current_version=excluded.current_version,
  metadata=excluded.metadata,updated_at=now();

insert into flashcards_os.editions (collection_id,language_code,edition_key,version_label,status,metadata)
values ('fc-geo-002','fr','standard','0.1-legacy-import','legacy_intake','{"seed":"catalogue-2022-u1"}'::jsonb)
on conflict (collection_id,language_code,edition_key) do nothing;

insert into flashcards_os.formats (collection_id,format_key,status,specification)
values ('fc-geo-002','flashcards','legacy_intake','{"source":"catalogue-2022","specificationStatus":"not-supplied"}'::jsonb)
on conflict (collection_id,format_key) do nothing;

insert into flashcards_os.collection_versions (collection_id,version_label,status,change_summary,content_snapshot,created_by)
values ('fc-geo-002','0.1-legacy-import','draft','Entrée canonique créée depuis le catalogue 2022',jsonb_build_object('sourcePage',4,'expectedCardCount',20,'historicalPriceDh',40),'UMZ1 migration')
on conflict (collection_id,version_label) do nothing;
insert into flashcards_os.collections (
  id,family_id,category_id,code,name,slug,legacy_domain,legacy_number,expected_card_count,structured_card_count,
  historical_price_dh,primary_format,status,lifecycle,readiness_score,age_min_months,age_max_months,languages,
  methodologies,primary_objective,audiences,usage_contexts,owner_name,source_page,source_label,legacy_issues,notes,current_version,metadata
) values (
  'fc-geo-003','family-learning-cards','sub-geo-world','FC-GEO-003','Les pays d’Europe','les-pays-deurope','GEO','3',
  20,0,40,'flashcards','needs_structuring','legacy_intake',36,
  36,144,array['fr']::text[],array['Montessori','Freinet','Steiner-Waldorf']::text[],'À structurer depuis le contenu source complet; le catalogue 2022 fournit le titre, la quantité et le prix historique, mais pas le registre carte par carte.',array['B2C Familles','B2B Écoles & crèches']::text[],
  array['Maison','Classe','Atelier éducatif']::text[],'Direction Produit',4,'NEW VERSION OF CATALOGUE FC 2022','[]'::jsonb,'','0.1-legacy-import',
  '{"seed": "catalogue-2022-u1", "sourcePage": 4}'::jsonb
) on conflict (id) do update set
  category_id=excluded.category_id,code=excluded.code,name=excluded.name,slug=excluded.slug,legacy_domain=excluded.legacy_domain,
  legacy_number=excluded.legacy_number,expected_card_count=excluded.expected_card_count,historical_price_dh=excluded.historical_price_dh,
  primary_format=excluded.primary_format,status=excluded.status,lifecycle=excluded.lifecycle,readiness_score=excluded.readiness_score,
  age_min_months=excluded.age_min_months,age_max_months=excluded.age_max_months,languages=excluded.languages,methodologies=excluded.methodologies,
  primary_objective=excluded.primary_objective,audiences=excluded.audiences,usage_contexts=excluded.usage_contexts,owner_name=excluded.owner_name,
  source_page=excluded.source_page,source_label=excluded.source_label,legacy_issues=excluded.legacy_issues,notes=excluded.notes,current_version=excluded.current_version,
  metadata=excluded.metadata,updated_at=now();

insert into flashcards_os.editions (collection_id,language_code,edition_key,version_label,status,metadata)
values ('fc-geo-003','fr','standard','0.1-legacy-import','legacy_intake','{"seed":"catalogue-2022-u1"}'::jsonb)
on conflict (collection_id,language_code,edition_key) do nothing;

insert into flashcards_os.formats (collection_id,format_key,status,specification)
values ('fc-geo-003','flashcards','legacy_intake','{"source":"catalogue-2022","specificationStatus":"not-supplied"}'::jsonb)
on conflict (collection_id,format_key) do nothing;

insert into flashcards_os.collection_versions (collection_id,version_label,status,change_summary,content_snapshot,created_by)
values ('fc-geo-003','0.1-legacy-import','draft','Entrée canonique créée depuis le catalogue 2022',jsonb_build_object('sourcePage',4,'expectedCardCount',20,'historicalPriceDh',40),'UMZ1 migration')
on conflict (collection_id,version_label) do nothing;
insert into flashcards_os.collections (
  id,family_id,category_id,code,name,slug,legacy_domain,legacy_number,expected_card_count,structured_card_count,
  historical_price_dh,primary_format,status,lifecycle,readiness_score,age_min_months,age_max_months,languages,
  methodologies,primary_objective,audiences,usage_contexts,owner_name,source_page,source_label,legacy_issues,notes,current_version,metadata
) values (
  'fc-geo-004','family-learning-cards','sub-geo-world','FC-GEO-004','Les pays d’Asie','les-pays-dasie','GEO','4',
  20,0,40,'flashcards','needs_structuring','legacy_intake',36,
  36,144,array['fr']::text[],array['Montessori','Freinet','Steiner-Waldorf']::text[],'À structurer depuis le contenu source complet; le catalogue 2022 fournit le titre, la quantité et le prix historique, mais pas le registre carte par carte.',array['B2C Familles','B2B Écoles & crèches']::text[],
  array['Maison','Classe','Atelier éducatif']::text[],'Direction Produit',4,'NEW VERSION OF CATALOGUE FC 2022','[]'::jsonb,'','0.1-legacy-import',
  '{"seed": "catalogue-2022-u1", "sourcePage": 4}'::jsonb
) on conflict (id) do update set
  category_id=excluded.category_id,code=excluded.code,name=excluded.name,slug=excluded.slug,legacy_domain=excluded.legacy_domain,
  legacy_number=excluded.legacy_number,expected_card_count=excluded.expected_card_count,historical_price_dh=excluded.historical_price_dh,
  primary_format=excluded.primary_format,status=excluded.status,lifecycle=excluded.lifecycle,readiness_score=excluded.readiness_score,
  age_min_months=excluded.age_min_months,age_max_months=excluded.age_max_months,languages=excluded.languages,methodologies=excluded.methodologies,
  primary_objective=excluded.primary_objective,audiences=excluded.audiences,usage_contexts=excluded.usage_contexts,owner_name=excluded.owner_name,
  source_page=excluded.source_page,source_label=excluded.source_label,legacy_issues=excluded.legacy_issues,notes=excluded.notes,current_version=excluded.current_version,
  metadata=excluded.metadata,updated_at=now();

insert into flashcards_os.editions (collection_id,language_code,edition_key,version_label,status,metadata)
values ('fc-geo-004','fr','standard','0.1-legacy-import','legacy_intake','{"seed":"catalogue-2022-u1"}'::jsonb)
on conflict (collection_id,language_code,edition_key) do nothing;

insert into flashcards_os.formats (collection_id,format_key,status,specification)
values ('fc-geo-004','flashcards','legacy_intake','{"source":"catalogue-2022","specificationStatus":"not-supplied"}'::jsonb)
on conflict (collection_id,format_key) do nothing;

insert into flashcards_os.collection_versions (collection_id,version_label,status,change_summary,content_snapshot,created_by)
values ('fc-geo-004','0.1-legacy-import','draft','Entrée canonique créée depuis le catalogue 2022',jsonb_build_object('sourcePage',4,'expectedCardCount',20,'historicalPriceDh',40),'UMZ1 migration')
on conflict (collection_id,version_label) do nothing;
insert into flashcards_os.collections (
  id,family_id,category_id,code,name,slug,legacy_domain,legacy_number,expected_card_count,structured_card_count,
  historical_price_dh,primary_format,status,lifecycle,readiness_score,age_min_months,age_max_months,languages,
  methodologies,primary_objective,audiences,usage_contexts,owner_name,source_page,source_label,legacy_issues,notes,current_version,metadata
) values (
  'fc-geo-005','family-learning-cards','sub-geo-world','FC-GEO-005','Les pays d’Océanie','les-pays-doceanie','GEO','5',
  10,0,20,'flashcards','needs_structuring','legacy_intake',36,
  36,144,array['fr']::text[],array['Montessori','Freinet','Steiner-Waldorf']::text[],'À structurer depuis le contenu source complet; le catalogue 2022 fournit le titre, la quantité et le prix historique, mais pas le registre carte par carte.',array['B2C Familles','B2B Écoles & crèches']::text[],
  array['Maison','Classe','Atelier éducatif']::text[],'Direction Produit',4,'NEW VERSION OF CATALOGUE FC 2022','[]'::jsonb,'','0.1-legacy-import',
  '{"seed": "catalogue-2022-u1", "sourcePage": 4}'::jsonb
) on conflict (id) do update set
  category_id=excluded.category_id,code=excluded.code,name=excluded.name,slug=excluded.slug,legacy_domain=excluded.legacy_domain,
  legacy_number=excluded.legacy_number,expected_card_count=excluded.expected_card_count,historical_price_dh=excluded.historical_price_dh,
  primary_format=excluded.primary_format,status=excluded.status,lifecycle=excluded.lifecycle,readiness_score=excluded.readiness_score,
  age_min_months=excluded.age_min_months,age_max_months=excluded.age_max_months,languages=excluded.languages,methodologies=excluded.methodologies,
  primary_objective=excluded.primary_objective,audiences=excluded.audiences,usage_contexts=excluded.usage_contexts,owner_name=excluded.owner_name,
  source_page=excluded.source_page,source_label=excluded.source_label,legacy_issues=excluded.legacy_issues,notes=excluded.notes,current_version=excluded.current_version,
  metadata=excluded.metadata,updated_at=now();

insert into flashcards_os.editions (collection_id,language_code,edition_key,version_label,status,metadata)
values ('fc-geo-005','fr','standard','0.1-legacy-import','legacy_intake','{"seed":"catalogue-2022-u1"}'::jsonb)
on conflict (collection_id,language_code,edition_key) do nothing;

insert into flashcards_os.formats (collection_id,format_key,status,specification)
values ('fc-geo-005','flashcards','legacy_intake','{"source":"catalogue-2022","specificationStatus":"not-supplied"}'::jsonb)
on conflict (collection_id,format_key) do nothing;

insert into flashcards_os.collection_versions (collection_id,version_label,status,change_summary,content_snapshot,created_by)
values ('fc-geo-005','0.1-legacy-import','draft','Entrée canonique créée depuis le catalogue 2022',jsonb_build_object('sourcePage',4,'expectedCardCount',10,'historicalPriceDh',20),'UMZ1 migration')
on conflict (collection_id,version_label) do nothing;
insert into flashcards_os.collections (
  id,family_id,category_id,code,name,slug,legacy_domain,legacy_number,expected_card_count,structured_card_count,
  historical_price_dh,primary_format,status,lifecycle,readiness_score,age_min_months,age_max_months,languages,
  methodologies,primary_objective,audiences,usage_contexts,owner_name,source_page,source_label,legacy_issues,notes,current_version,metadata
) values (
  'fc-geo-006','family-learning-cards','sub-geo-world','FC-GEO-006','Les pays d’Amérique du Sud','les-pays-damerique-du-sud','GEO','6',
  13,0,26,'flashcards','needs_structuring','legacy_intake',36,
  36,144,array['fr']::text[],array['Montessori','Freinet','Steiner-Waldorf']::text[],'À structurer depuis le contenu source complet; le catalogue 2022 fournit le titre, la quantité et le prix historique, mais pas le registre carte par carte.',array['B2C Familles','B2B Écoles & crèches']::text[],
  array['Maison','Classe','Atelier éducatif']::text[],'Direction Produit',4,'NEW VERSION OF CATALOGUE FC 2022','[]'::jsonb,'','0.1-legacy-import',
  '{"seed": "catalogue-2022-u1", "sourcePage": 4}'::jsonb
) on conflict (id) do update set
  category_id=excluded.category_id,code=excluded.code,name=excluded.name,slug=excluded.slug,legacy_domain=excluded.legacy_domain,
  legacy_number=excluded.legacy_number,expected_card_count=excluded.expected_card_count,historical_price_dh=excluded.historical_price_dh,
  primary_format=excluded.primary_format,status=excluded.status,lifecycle=excluded.lifecycle,readiness_score=excluded.readiness_score,
  age_min_months=excluded.age_min_months,age_max_months=excluded.age_max_months,languages=excluded.languages,methodologies=excluded.methodologies,
  primary_objective=excluded.primary_objective,audiences=excluded.audiences,usage_contexts=excluded.usage_contexts,owner_name=excluded.owner_name,
  source_page=excluded.source_page,source_label=excluded.source_label,legacy_issues=excluded.legacy_issues,notes=excluded.notes,current_version=excluded.current_version,
  metadata=excluded.metadata,updated_at=now();

insert into flashcards_os.editions (collection_id,language_code,edition_key,version_label,status,metadata)
values ('fc-geo-006','fr','standard','0.1-legacy-import','legacy_intake','{"seed":"catalogue-2022-u1"}'::jsonb)
on conflict (collection_id,language_code,edition_key) do nothing;

insert into flashcards_os.formats (collection_id,format_key,status,specification)
values ('fc-geo-006','flashcards','legacy_intake','{"source":"catalogue-2022","specificationStatus":"not-supplied"}'::jsonb)
on conflict (collection_id,format_key) do nothing;

insert into flashcards_os.collection_versions (collection_id,version_label,status,change_summary,content_snapshot,created_by)
values ('fc-geo-006','0.1-legacy-import','draft','Entrée canonique créée depuis le catalogue 2022',jsonb_build_object('sourcePage',4,'expectedCardCount',13,'historicalPriceDh',26),'UMZ1 migration')
on conflict (collection_id,version_label) do nothing;
insert into flashcards_os.collections (
  id,family_id,category_id,code,name,slug,legacy_domain,legacy_number,expected_card_count,structured_card_count,
  historical_price_dh,primary_format,status,lifecycle,readiness_score,age_min_months,age_max_months,languages,
  methodologies,primary_objective,audiences,usage_contexts,owner_name,source_page,source_label,legacy_issues,notes,current_version,metadata
) values (
  'fc-geo-007','family-learning-cards','sub-geo-world','FC-GEO-007','Les pays d’Amérique du Nord','les-pays-damerique-du-nord','GEO','7',
  15,0,30,'flashcards','needs_structuring','legacy_intake',36,
  36,144,array['fr']::text[],array['Montessori','Freinet','Steiner-Waldorf']::text[],'À structurer depuis le contenu source complet; le catalogue 2022 fournit le titre, la quantité et le prix historique, mais pas le registre carte par carte.',array['B2C Familles','B2B Écoles & crèches']::text[],
  array['Maison','Classe','Atelier éducatif']::text[],'Direction Produit',4,'NEW VERSION OF CATALOGUE FC 2022','[]'::jsonb,'','0.1-legacy-import',
  '{"seed": "catalogue-2022-u1", "sourcePage": 4}'::jsonb
) on conflict (id) do update set
  category_id=excluded.category_id,code=excluded.code,name=excluded.name,slug=excluded.slug,legacy_domain=excluded.legacy_domain,
  legacy_number=excluded.legacy_number,expected_card_count=excluded.expected_card_count,historical_price_dh=excluded.historical_price_dh,
  primary_format=excluded.primary_format,status=excluded.status,lifecycle=excluded.lifecycle,readiness_score=excluded.readiness_score,
  age_min_months=excluded.age_min_months,age_max_months=excluded.age_max_months,languages=excluded.languages,methodologies=excluded.methodologies,
  primary_objective=excluded.primary_objective,audiences=excluded.audiences,usage_contexts=excluded.usage_contexts,owner_name=excluded.owner_name,
  source_page=excluded.source_page,source_label=excluded.source_label,legacy_issues=excluded.legacy_issues,notes=excluded.notes,current_version=excluded.current_version,
  metadata=excluded.metadata,updated_at=now();

insert into flashcards_os.editions (collection_id,language_code,edition_key,version_label,status,metadata)
values ('fc-geo-007','fr','standard','0.1-legacy-import','legacy_intake','{"seed":"catalogue-2022-u1"}'::jsonb)
on conflict (collection_id,language_code,edition_key) do nothing;

insert into flashcards_os.formats (collection_id,format_key,status,specification)
values ('fc-geo-007','flashcards','legacy_intake','{"source":"catalogue-2022","specificationStatus":"not-supplied"}'::jsonb)
on conflict (collection_id,format_key) do nothing;

insert into flashcards_os.collection_versions (collection_id,version_label,status,change_summary,content_snapshot,created_by)
values ('fc-geo-007','0.1-legacy-import','draft','Entrée canonique créée depuis le catalogue 2022',jsonb_build_object('sourcePage',4,'expectedCardCount',15,'historicalPriceDh',30),'UMZ1 migration')
on conflict (collection_id,version_label) do nothing;
insert into flashcards_os.collections (
  id,family_id,category_id,code,name,slug,legacy_domain,legacy_number,expected_card_count,structured_card_count,
  historical_price_dh,primary_format,status,lifecycle,readiness_score,age_min_months,age_max_months,languages,
  methodologies,primary_objective,audiences,usage_contexts,owner_name,source_page,source_label,legacy_issues,notes,current_version,metadata
) values (
  'fc-geo-008','family-learning-cards','sub-geo-capitals','FC-GEO-008','Capitales du monde','capitales-du-monde','GEO','8',
  27,0,54,'flashcards','needs_structuring','legacy_intake',36,
  36,144,array['fr']::text[],array['Montessori','Freinet','Steiner-Waldorf']::text[],'À structurer depuis le contenu source complet; le catalogue 2022 fournit le titre, la quantité et le prix historique, mais pas le registre carte par carte.',array['B2C Familles','B2B Écoles & crèches']::text[],
  array['Maison','Classe','Atelier éducatif']::text[],'Direction Produit',4,'NEW VERSION OF CATALOGUE FC 2022','[]'::jsonb,'','0.1-legacy-import',
  '{"seed": "catalogue-2022-u1", "sourcePage": 4}'::jsonb
) on conflict (id) do update set
  category_id=excluded.category_id,code=excluded.code,name=excluded.name,slug=excluded.slug,legacy_domain=excluded.legacy_domain,
  legacy_number=excluded.legacy_number,expected_card_count=excluded.expected_card_count,historical_price_dh=excluded.historical_price_dh,
  primary_format=excluded.primary_format,status=excluded.status,lifecycle=excluded.lifecycle,readiness_score=excluded.readiness_score,
  age_min_months=excluded.age_min_months,age_max_months=excluded.age_max_months,languages=excluded.languages,methodologies=excluded.methodologies,
  primary_objective=excluded.primary_objective,audiences=excluded.audiences,usage_contexts=excluded.usage_contexts,owner_name=excluded.owner_name,
  source_page=excluded.source_page,source_label=excluded.source_label,legacy_issues=excluded.legacy_issues,notes=excluded.notes,current_version=excluded.current_version,
  metadata=excluded.metadata,updated_at=now();

insert into flashcards_os.editions (collection_id,language_code,edition_key,version_label,status,metadata)
values ('fc-geo-008','fr','standard','0.1-legacy-import','legacy_intake','{"seed":"catalogue-2022-u1"}'::jsonb)
on conflict (collection_id,language_code,edition_key) do nothing;

insert into flashcards_os.formats (collection_id,format_key,status,specification)
values ('fc-geo-008','flashcards','legacy_intake','{"source":"catalogue-2022","specificationStatus":"not-supplied"}'::jsonb)
on conflict (collection_id,format_key) do nothing;

insert into flashcards_os.collection_versions (collection_id,version_label,status,change_summary,content_snapshot,created_by)
values ('fc-geo-008','0.1-legacy-import','draft','Entrée canonique créée depuis le catalogue 2022',jsonb_build_object('sourcePage',4,'expectedCardCount',27,'historicalPriceDh',54),'UMZ1 migration')
on conflict (collection_id,version_label) do nothing;
insert into flashcards_os.collections (
  id,family_id,category_id,code,name,slug,legacy_domain,legacy_number,expected_card_count,structured_card_count,
  historical_price_dh,primary_format,status,lifecycle,readiness_score,age_min_months,age_max_months,languages,
  methodologies,primary_objective,audiences,usage_contexts,owner_name,source_page,source_label,legacy_issues,notes,current_version,metadata
) values (
  'fc-geo-009','family-learning-cards','sub-geo-capitals','FC-GEO-009','Capitales d’Afrique','capitales-dafrique','GEO','9',
  20,0,40,'flashcards','needs_structuring','legacy_intake',36,
  36,144,array['fr']::text[],array['Montessori','Freinet','Steiner-Waldorf']::text[],'À structurer depuis le contenu source complet; le catalogue 2022 fournit le titre, la quantité et le prix historique, mais pas le registre carte par carte.',array['B2C Familles','B2B Écoles & crèches']::text[],
  array['Maison','Classe','Atelier éducatif']::text[],'Direction Produit',4,'NEW VERSION OF CATALOGUE FC 2022','[]'::jsonb,'','0.1-legacy-import',
  '{"seed": "catalogue-2022-u1", "sourcePage": 4}'::jsonb
) on conflict (id) do update set
  category_id=excluded.category_id,code=excluded.code,name=excluded.name,slug=excluded.slug,legacy_domain=excluded.legacy_domain,
  legacy_number=excluded.legacy_number,expected_card_count=excluded.expected_card_count,historical_price_dh=excluded.historical_price_dh,
  primary_format=excluded.primary_format,status=excluded.status,lifecycle=excluded.lifecycle,readiness_score=excluded.readiness_score,
  age_min_months=excluded.age_min_months,age_max_months=excluded.age_max_months,languages=excluded.languages,methodologies=excluded.methodologies,
  primary_objective=excluded.primary_objective,audiences=excluded.audiences,usage_contexts=excluded.usage_contexts,owner_name=excluded.owner_name,
  source_page=excluded.source_page,source_label=excluded.source_label,legacy_issues=excluded.legacy_issues,notes=excluded.notes,current_version=excluded.current_version,
  metadata=excluded.metadata,updated_at=now();

insert into flashcards_os.editions (collection_id,language_code,edition_key,version_label,status,metadata)
values ('fc-geo-009','fr','standard','0.1-legacy-import','legacy_intake','{"seed":"catalogue-2022-u1"}'::jsonb)
on conflict (collection_id,language_code,edition_key) do nothing;

insert into flashcards_os.formats (collection_id,format_key,status,specification)
values ('fc-geo-009','flashcards','legacy_intake','{"source":"catalogue-2022","specificationStatus":"not-supplied"}'::jsonb)
on conflict (collection_id,format_key) do nothing;

insert into flashcards_os.collection_versions (collection_id,version_label,status,change_summary,content_snapshot,created_by)
values ('fc-geo-009','0.1-legacy-import','draft','Entrée canonique créée depuis le catalogue 2022',jsonb_build_object('sourcePage',4,'expectedCardCount',20,'historicalPriceDh',40),'UMZ1 migration')
on conflict (collection_id,version_label) do nothing;
insert into flashcards_os.collections (
  id,family_id,category_id,code,name,slug,legacy_domain,legacy_number,expected_card_count,structured_card_count,
  historical_price_dh,primary_format,status,lifecycle,readiness_score,age_min_months,age_max_months,languages,
  methodologies,primary_objective,audiences,usage_contexts,owner_name,source_page,source_label,legacy_issues,notes,current_version,metadata
) values (
  'fc-geo-010','family-learning-cards','sub-geo-capitals','FC-GEO-010','Capitales d’Europe','capitales-deurope','GEO','10',
  20,0,40,'flashcards','needs_structuring','legacy_intake',36,
  36,144,array['fr']::text[],array['Montessori','Freinet','Steiner-Waldorf']::text[],'À structurer depuis le contenu source complet; le catalogue 2022 fournit le titre, la quantité et le prix historique, mais pas le registre carte par carte.',array['B2C Familles','B2B Écoles & crèches']::text[],
  array['Maison','Classe','Atelier éducatif']::text[],'Direction Produit',4,'NEW VERSION OF CATALOGUE FC 2022','[]'::jsonb,'','0.1-legacy-import',
  '{"seed": "catalogue-2022-u1", "sourcePage": 4}'::jsonb
) on conflict (id) do update set
  category_id=excluded.category_id,code=excluded.code,name=excluded.name,slug=excluded.slug,legacy_domain=excluded.legacy_domain,
  legacy_number=excluded.legacy_number,expected_card_count=excluded.expected_card_count,historical_price_dh=excluded.historical_price_dh,
  primary_format=excluded.primary_format,status=excluded.status,lifecycle=excluded.lifecycle,readiness_score=excluded.readiness_score,
  age_min_months=excluded.age_min_months,age_max_months=excluded.age_max_months,languages=excluded.languages,methodologies=excluded.methodologies,
  primary_objective=excluded.primary_objective,audiences=excluded.audiences,usage_contexts=excluded.usage_contexts,owner_name=excluded.owner_name,
  source_page=excluded.source_page,source_label=excluded.source_label,legacy_issues=excluded.legacy_issues,notes=excluded.notes,current_version=excluded.current_version,
  metadata=excluded.metadata,updated_at=now();

insert into flashcards_os.editions (collection_id,language_code,edition_key,version_label,status,metadata)
values ('fc-geo-010','fr','standard','0.1-legacy-import','legacy_intake','{"seed":"catalogue-2022-u1"}'::jsonb)
on conflict (collection_id,language_code,edition_key) do nothing;

insert into flashcards_os.formats (collection_id,format_key,status,specification)
values ('fc-geo-010','flashcards','legacy_intake','{"source":"catalogue-2022","specificationStatus":"not-supplied"}'::jsonb)
on conflict (collection_id,format_key) do nothing;

insert into flashcards_os.collection_versions (collection_id,version_label,status,change_summary,content_snapshot,created_by)
values ('fc-geo-010','0.1-legacy-import','draft','Entrée canonique créée depuis le catalogue 2022',jsonb_build_object('sourcePage',4,'expectedCardCount',20,'historicalPriceDh',40),'UMZ1 migration')
on conflict (collection_id,version_label) do nothing;
insert into flashcards_os.collections (
  id,family_id,category_id,code,name,slug,legacy_domain,legacy_number,expected_card_count,structured_card_count,
  historical_price_dh,primary_format,status,lifecycle,readiness_score,age_min_months,age_max_months,languages,
  methodologies,primary_objective,audiences,usage_contexts,owner_name,source_page,source_label,legacy_issues,notes,current_version,metadata
) values (
  'fc-geo-011','family-learning-cards','sub-geo-capitals','FC-GEO-011','Capitales d’Asie','capitales-dasie','GEO','11',
  20,0,40,'flashcards','needs_structuring','legacy_intake',36,
  36,144,array['fr']::text[],array['Montessori','Freinet','Steiner-Waldorf']::text[],'À structurer depuis le contenu source complet; le catalogue 2022 fournit le titre, la quantité et le prix historique, mais pas le registre carte par carte.',array['B2C Familles','B2B Écoles & crèches']::text[],
  array['Maison','Classe','Atelier éducatif']::text[],'Direction Produit',4,'NEW VERSION OF CATALOGUE FC 2022','[]'::jsonb,'','0.1-legacy-import',
  '{"seed": "catalogue-2022-u1", "sourcePage": 4}'::jsonb
) on conflict (id) do update set
  category_id=excluded.category_id,code=excluded.code,name=excluded.name,slug=excluded.slug,legacy_domain=excluded.legacy_domain,
  legacy_number=excluded.legacy_number,expected_card_count=excluded.expected_card_count,historical_price_dh=excluded.historical_price_dh,
  primary_format=excluded.primary_format,status=excluded.status,lifecycle=excluded.lifecycle,readiness_score=excluded.readiness_score,
  age_min_months=excluded.age_min_months,age_max_months=excluded.age_max_months,languages=excluded.languages,methodologies=excluded.methodologies,
  primary_objective=excluded.primary_objective,audiences=excluded.audiences,usage_contexts=excluded.usage_contexts,owner_name=excluded.owner_name,
  source_page=excluded.source_page,source_label=excluded.source_label,legacy_issues=excluded.legacy_issues,notes=excluded.notes,current_version=excluded.current_version,
  metadata=excluded.metadata,updated_at=now();

insert into flashcards_os.editions (collection_id,language_code,edition_key,version_label,status,metadata)
values ('fc-geo-011','fr','standard','0.1-legacy-import','legacy_intake','{"seed":"catalogue-2022-u1"}'::jsonb)
on conflict (collection_id,language_code,edition_key) do nothing;

insert into flashcards_os.formats (collection_id,format_key,status,specification)
values ('fc-geo-011','flashcards','legacy_intake','{"source":"catalogue-2022","specificationStatus":"not-supplied"}'::jsonb)
on conflict (collection_id,format_key) do nothing;

insert into flashcards_os.collection_versions (collection_id,version_label,status,change_summary,content_snapshot,created_by)
values ('fc-geo-011','0.1-legacy-import','draft','Entrée canonique créée depuis le catalogue 2022',jsonb_build_object('sourcePage',4,'expectedCardCount',20,'historicalPriceDh',40),'UMZ1 migration')
on conflict (collection_id,version_label) do nothing;
insert into flashcards_os.collections (
  id,family_id,category_id,code,name,slug,legacy_domain,legacy_number,expected_card_count,structured_card_count,
  historical_price_dh,primary_format,status,lifecycle,readiness_score,age_min_months,age_max_months,languages,
  methodologies,primary_objective,audiences,usage_contexts,owner_name,source_page,source_label,legacy_issues,notes,current_version,metadata
) values (
  'fc-geo-012','family-learning-cards','sub-geo-capitals','FC-GEO-012','Capitales d’Océanie','capitales-doceanie','GEO','12',
  10,0,20,'flashcards','needs_structuring','legacy_intake',36,
  36,144,array['fr']::text[],array['Montessori','Freinet','Steiner-Waldorf']::text[],'À structurer depuis le contenu source complet; le catalogue 2022 fournit le titre, la quantité et le prix historique, mais pas le registre carte par carte.',array['B2C Familles','B2B Écoles & crèches']::text[],
  array['Maison','Classe','Atelier éducatif']::text[],'Direction Produit',4,'NEW VERSION OF CATALOGUE FC 2022','[]'::jsonb,'','0.1-legacy-import',
  '{"seed": "catalogue-2022-u1", "sourcePage": 4}'::jsonb
) on conflict (id) do update set
  category_id=excluded.category_id,code=excluded.code,name=excluded.name,slug=excluded.slug,legacy_domain=excluded.legacy_domain,
  legacy_number=excluded.legacy_number,expected_card_count=excluded.expected_card_count,historical_price_dh=excluded.historical_price_dh,
  primary_format=excluded.primary_format,status=excluded.status,lifecycle=excluded.lifecycle,readiness_score=excluded.readiness_score,
  age_min_months=excluded.age_min_months,age_max_months=excluded.age_max_months,languages=excluded.languages,methodologies=excluded.methodologies,
  primary_objective=excluded.primary_objective,audiences=excluded.audiences,usage_contexts=excluded.usage_contexts,owner_name=excluded.owner_name,
  source_page=excluded.source_page,source_label=excluded.source_label,legacy_issues=excluded.legacy_issues,notes=excluded.notes,current_version=excluded.current_version,
  metadata=excluded.metadata,updated_at=now();

insert into flashcards_os.editions (collection_id,language_code,edition_key,version_label,status,metadata)
values ('fc-geo-012','fr','standard','0.1-legacy-import','legacy_intake','{"seed":"catalogue-2022-u1"}'::jsonb)
on conflict (collection_id,language_code,edition_key) do nothing;

insert into flashcards_os.formats (collection_id,format_key,status,specification)
values ('fc-geo-012','flashcards','legacy_intake','{"source":"catalogue-2022","specificationStatus":"not-supplied"}'::jsonb)
on conflict (collection_id,format_key) do nothing;

insert into flashcards_os.collection_versions (collection_id,version_label,status,change_summary,content_snapshot,created_by)
values ('fc-geo-012','0.1-legacy-import','draft','Entrée canonique créée depuis le catalogue 2022',jsonb_build_object('sourcePage',4,'expectedCardCount',10,'historicalPriceDh',20),'UMZ1 migration')
on conflict (collection_id,version_label) do nothing;
insert into flashcards_os.collections (
  id,family_id,category_id,code,name,slug,legacy_domain,legacy_number,expected_card_count,structured_card_count,
  historical_price_dh,primary_format,status,lifecycle,readiness_score,age_min_months,age_max_months,languages,
  methodologies,primary_objective,audiences,usage_contexts,owner_name,source_page,source_label,legacy_issues,notes,current_version,metadata
) values (
  'fc-geo-013','family-learning-cards','sub-geo-biodiversity','FC-GEO-013','Animaux d’Afrique','animaux-dafrique','GEO','13',
  15,0,30,'flashcards','needs_structuring','legacy_intake',36,
  36,144,array['fr']::text[],array['Montessori','Freinet','Steiner-Waldorf']::text[],'À structurer depuis le contenu source complet; le catalogue 2022 fournit le titre, la quantité et le prix historique, mais pas le registre carte par carte.',array['B2C Familles','B2B Écoles & crèches']::text[],
  array['Maison','Classe','Atelier éducatif']::text[],'Direction Produit',4,'NEW VERSION OF CATALOGUE FC 2022','[]'::jsonb,'','0.1-legacy-import',
  '{"seed": "catalogue-2022-u1", "sourcePage": 4}'::jsonb
) on conflict (id) do update set
  category_id=excluded.category_id,code=excluded.code,name=excluded.name,slug=excluded.slug,legacy_domain=excluded.legacy_domain,
  legacy_number=excluded.legacy_number,expected_card_count=excluded.expected_card_count,historical_price_dh=excluded.historical_price_dh,
  primary_format=excluded.primary_format,status=excluded.status,lifecycle=excluded.lifecycle,readiness_score=excluded.readiness_score,
  age_min_months=excluded.age_min_months,age_max_months=excluded.age_max_months,languages=excluded.languages,methodologies=excluded.methodologies,
  primary_objective=excluded.primary_objective,audiences=excluded.audiences,usage_contexts=excluded.usage_contexts,owner_name=excluded.owner_name,
  source_page=excluded.source_page,source_label=excluded.source_label,legacy_issues=excluded.legacy_issues,notes=excluded.notes,current_version=excluded.current_version,
  metadata=excluded.metadata,updated_at=now();

insert into flashcards_os.editions (collection_id,language_code,edition_key,version_label,status,metadata)
values ('fc-geo-013','fr','standard','0.1-legacy-import','legacy_intake','{"seed":"catalogue-2022-u1"}'::jsonb)
on conflict (collection_id,language_code,edition_key) do nothing;

insert into flashcards_os.formats (collection_id,format_key,status,specification)
values ('fc-geo-013','flashcards','legacy_intake','{"source":"catalogue-2022","specificationStatus":"not-supplied"}'::jsonb)
on conflict (collection_id,format_key) do nothing;

insert into flashcards_os.collection_versions (collection_id,version_label,status,change_summary,content_snapshot,created_by)
values ('fc-geo-013','0.1-legacy-import','draft','Entrée canonique créée depuis le catalogue 2022',jsonb_build_object('sourcePage',4,'expectedCardCount',15,'historicalPriceDh',30),'UMZ1 migration')
on conflict (collection_id,version_label) do nothing;
insert into flashcards_os.collections (
  id,family_id,category_id,code,name,slug,legacy_domain,legacy_number,expected_card_count,structured_card_count,
  historical_price_dh,primary_format,status,lifecycle,readiness_score,age_min_months,age_max_months,languages,
  methodologies,primary_objective,audiences,usage_contexts,owner_name,source_page,source_label,legacy_issues,notes,current_version,metadata
) values (
  'fc-geo-014','family-learning-cards','sub-geo-biodiversity','FC-GEO-014','Animaux d’Europe','animaux-deurope','GEO','14',
  15,0,30,'flashcards','needs_structuring','legacy_intake',36,
  36,144,array['fr']::text[],array['Montessori','Freinet','Steiner-Waldorf']::text[],'À structurer depuis le contenu source complet; le catalogue 2022 fournit le titre, la quantité et le prix historique, mais pas le registre carte par carte.',array['B2C Familles','B2B Écoles & crèches']::text[],
  array['Maison','Classe','Atelier éducatif']::text[],'Direction Produit',4,'NEW VERSION OF CATALOGUE FC 2022','[]'::jsonb,'','0.1-legacy-import',
  '{"seed": "catalogue-2022-u1", "sourcePage": 4}'::jsonb
) on conflict (id) do update set
  category_id=excluded.category_id,code=excluded.code,name=excluded.name,slug=excluded.slug,legacy_domain=excluded.legacy_domain,
  legacy_number=excluded.legacy_number,expected_card_count=excluded.expected_card_count,historical_price_dh=excluded.historical_price_dh,
  primary_format=excluded.primary_format,status=excluded.status,lifecycle=excluded.lifecycle,readiness_score=excluded.readiness_score,
  age_min_months=excluded.age_min_months,age_max_months=excluded.age_max_months,languages=excluded.languages,methodologies=excluded.methodologies,
  primary_objective=excluded.primary_objective,audiences=excluded.audiences,usage_contexts=excluded.usage_contexts,owner_name=excluded.owner_name,
  source_page=excluded.source_page,source_label=excluded.source_label,legacy_issues=excluded.legacy_issues,notes=excluded.notes,current_version=excluded.current_version,
  metadata=excluded.metadata,updated_at=now();

insert into flashcards_os.editions (collection_id,language_code,edition_key,version_label,status,metadata)
values ('fc-geo-014','fr','standard','0.1-legacy-import','legacy_intake','{"seed":"catalogue-2022-u1"}'::jsonb)
on conflict (collection_id,language_code,edition_key) do nothing;

insert into flashcards_os.formats (collection_id,format_key,status,specification)
values ('fc-geo-014','flashcards','legacy_intake','{"source":"catalogue-2022","specificationStatus":"not-supplied"}'::jsonb)
on conflict (collection_id,format_key) do nothing;

insert into flashcards_os.collection_versions (collection_id,version_label,status,change_summary,content_snapshot,created_by)
values ('fc-geo-014','0.1-legacy-import','draft','Entrée canonique créée depuis le catalogue 2022',jsonb_build_object('sourcePage',4,'expectedCardCount',15,'historicalPriceDh',30),'UMZ1 migration')
on conflict (collection_id,version_label) do nothing;
insert into flashcards_os.collections (
  id,family_id,category_id,code,name,slug,legacy_domain,legacy_number,expected_card_count,structured_card_count,
  historical_price_dh,primary_format,status,lifecycle,readiness_score,age_min_months,age_max_months,languages,
  methodologies,primary_objective,audiences,usage_contexts,owner_name,source_page,source_label,legacy_issues,notes,current_version,metadata
) values (
  'fc-geo-015','family-learning-cards','sub-geo-biodiversity','FC-GEO-015','Animaux d’Asie','animaux-dasie','GEO','15',
  15,0,30,'flashcards','needs_structuring','legacy_intake',36,
  36,144,array['fr']::text[],array['Montessori','Freinet','Steiner-Waldorf']::text[],'À structurer depuis le contenu source complet; le catalogue 2022 fournit le titre, la quantité et le prix historique, mais pas le registre carte par carte.',array['B2C Familles','B2B Écoles & crèches']::text[],
  array['Maison','Classe','Atelier éducatif']::text[],'Direction Produit',4,'NEW VERSION OF CATALOGUE FC 2022','[]'::jsonb,'','0.1-legacy-import',
  '{"seed": "catalogue-2022-u1", "sourcePage": 4}'::jsonb
) on conflict (id) do update set
  category_id=excluded.category_id,code=excluded.code,name=excluded.name,slug=excluded.slug,legacy_domain=excluded.legacy_domain,
  legacy_number=excluded.legacy_number,expected_card_count=excluded.expected_card_count,historical_price_dh=excluded.historical_price_dh,
  primary_format=excluded.primary_format,status=excluded.status,lifecycle=excluded.lifecycle,readiness_score=excluded.readiness_score,
  age_min_months=excluded.age_min_months,age_max_months=excluded.age_max_months,languages=excluded.languages,methodologies=excluded.methodologies,
  primary_objective=excluded.primary_objective,audiences=excluded.audiences,usage_contexts=excluded.usage_contexts,owner_name=excluded.owner_name,
  source_page=excluded.source_page,source_label=excluded.source_label,legacy_issues=excluded.legacy_issues,notes=excluded.notes,current_version=excluded.current_version,
  metadata=excluded.metadata,updated_at=now();

insert into flashcards_os.editions (collection_id,language_code,edition_key,version_label,status,metadata)
values ('fc-geo-015','fr','standard','0.1-legacy-import','legacy_intake','{"seed":"catalogue-2022-u1"}'::jsonb)
on conflict (collection_id,language_code,edition_key) do nothing;

insert into flashcards_os.formats (collection_id,format_key,status,specification)
values ('fc-geo-015','flashcards','legacy_intake','{"source":"catalogue-2022","specificationStatus":"not-supplied"}'::jsonb)
on conflict (collection_id,format_key) do nothing;

insert into flashcards_os.collection_versions (collection_id,version_label,status,change_summary,content_snapshot,created_by)
values ('fc-geo-015','0.1-legacy-import','draft','Entrée canonique créée depuis le catalogue 2022',jsonb_build_object('sourcePage',4,'expectedCardCount',15,'historicalPriceDh',30),'UMZ1 migration')
on conflict (collection_id,version_label) do nothing;
insert into flashcards_os.collections (
  id,family_id,category_id,code,name,slug,legacy_domain,legacy_number,expected_card_count,structured_card_count,
  historical_price_dh,primary_format,status,lifecycle,readiness_score,age_min_months,age_max_months,languages,
  methodologies,primary_objective,audiences,usage_contexts,owner_name,source_page,source_label,legacy_issues,notes,current_version,metadata
) values (
  'fc-geo-016','family-learning-cards','sub-geo-biodiversity','FC-GEO-016','Animaux d’Australie','animaux-daustralie','GEO','16',
  15,0,30,'flashcards','needs_structuring','legacy_intake',36,
  36,144,array['fr']::text[],array['Montessori','Freinet','Steiner-Waldorf']::text[],'À structurer depuis le contenu source complet; le catalogue 2022 fournit le titre, la quantité et le prix historique, mais pas le registre carte par carte.',array['B2C Familles','B2B Écoles & crèches']::text[],
  array['Maison','Classe','Atelier éducatif']::text[],'Direction Produit',4,'NEW VERSION OF CATALOGUE FC 2022','[]'::jsonb,'','0.1-legacy-import',
  '{"seed": "catalogue-2022-u1", "sourcePage": 4}'::jsonb
) on conflict (id) do update set
  category_id=excluded.category_id,code=excluded.code,name=excluded.name,slug=excluded.slug,legacy_domain=excluded.legacy_domain,
  legacy_number=excluded.legacy_number,expected_card_count=excluded.expected_card_count,historical_price_dh=excluded.historical_price_dh,
  primary_format=excluded.primary_format,status=excluded.status,lifecycle=excluded.lifecycle,readiness_score=excluded.readiness_score,
  age_min_months=excluded.age_min_months,age_max_months=excluded.age_max_months,languages=excluded.languages,methodologies=excluded.methodologies,
  primary_objective=excluded.primary_objective,audiences=excluded.audiences,usage_contexts=excluded.usage_contexts,owner_name=excluded.owner_name,
  source_page=excluded.source_page,source_label=excluded.source_label,legacy_issues=excluded.legacy_issues,notes=excluded.notes,current_version=excluded.current_version,
  metadata=excluded.metadata,updated_at=now();

insert into flashcards_os.editions (collection_id,language_code,edition_key,version_label,status,metadata)
values ('fc-geo-016','fr','standard','0.1-legacy-import','legacy_intake','{"seed":"catalogue-2022-u1"}'::jsonb)
on conflict (collection_id,language_code,edition_key) do nothing;

insert into flashcards_os.formats (collection_id,format_key,status,specification)
values ('fc-geo-016','flashcards','legacy_intake','{"source":"catalogue-2022","specificationStatus":"not-supplied"}'::jsonb)
on conflict (collection_id,format_key) do nothing;

insert into flashcards_os.collection_versions (collection_id,version_label,status,change_summary,content_snapshot,created_by)
values ('fc-geo-016','0.1-legacy-import','draft','Entrée canonique créée depuis le catalogue 2022',jsonb_build_object('sourcePage',4,'expectedCardCount',15,'historicalPriceDh',30),'UMZ1 migration')
on conflict (collection_id,version_label) do nothing;
insert into flashcards_os.collections (
  id,family_id,category_id,code,name,slug,legacy_domain,legacy_number,expected_card_count,structured_card_count,
  historical_price_dh,primary_format,status,lifecycle,readiness_score,age_min_months,age_max_months,languages,
  methodologies,primary_objective,audiences,usage_contexts,owner_name,source_page,source_label,legacy_issues,notes,current_version,metadata
) values (
  'fc-geo-017','family-learning-cards','sub-geo-biodiversity','FC-GEO-017','Animaux d’Amérique du Sud','animaux-damerique-du-sud','GEO','17',
  15,0,30,'flashcards','needs_structuring','legacy_intake',36,
  36,144,array['fr']::text[],array['Montessori','Freinet','Steiner-Waldorf']::text[],'À structurer depuis le contenu source complet; le catalogue 2022 fournit le titre, la quantité et le prix historique, mais pas le registre carte par carte.',array['B2C Familles','B2B Écoles & crèches']::text[],
  array['Maison','Classe','Atelier éducatif']::text[],'Direction Produit',4,'NEW VERSION OF CATALOGUE FC 2022','[]'::jsonb,'','0.1-legacy-import',
  '{"seed": "catalogue-2022-u1", "sourcePage": 4}'::jsonb
) on conflict (id) do update set
  category_id=excluded.category_id,code=excluded.code,name=excluded.name,slug=excluded.slug,legacy_domain=excluded.legacy_domain,
  legacy_number=excluded.legacy_number,expected_card_count=excluded.expected_card_count,historical_price_dh=excluded.historical_price_dh,
  primary_format=excluded.primary_format,status=excluded.status,lifecycle=excluded.lifecycle,readiness_score=excluded.readiness_score,
  age_min_months=excluded.age_min_months,age_max_months=excluded.age_max_months,languages=excluded.languages,methodologies=excluded.methodologies,
  primary_objective=excluded.primary_objective,audiences=excluded.audiences,usage_contexts=excluded.usage_contexts,owner_name=excluded.owner_name,
  source_page=excluded.source_page,source_label=excluded.source_label,legacy_issues=excluded.legacy_issues,notes=excluded.notes,current_version=excluded.current_version,
  metadata=excluded.metadata,updated_at=now();

insert into flashcards_os.editions (collection_id,language_code,edition_key,version_label,status,metadata)
values ('fc-geo-017','fr','standard','0.1-legacy-import','legacy_intake','{"seed":"catalogue-2022-u1"}'::jsonb)
on conflict (collection_id,language_code,edition_key) do nothing;

insert into flashcards_os.formats (collection_id,format_key,status,specification)
values ('fc-geo-017','flashcards','legacy_intake','{"source":"catalogue-2022","specificationStatus":"not-supplied"}'::jsonb)
on conflict (collection_id,format_key) do nothing;

insert into flashcards_os.collection_versions (collection_id,version_label,status,change_summary,content_snapshot,created_by)
values ('fc-geo-017','0.1-legacy-import','draft','Entrée canonique créée depuis le catalogue 2022',jsonb_build_object('sourcePage',4,'expectedCardCount',15,'historicalPriceDh',30),'UMZ1 migration')
on conflict (collection_id,version_label) do nothing;
insert into flashcards_os.collections (
  id,family_id,category_id,code,name,slug,legacy_domain,legacy_number,expected_card_count,structured_card_count,
  historical_price_dh,primary_format,status,lifecycle,readiness_score,age_min_months,age_max_months,languages,
  methodologies,primary_objective,audiences,usage_contexts,owner_name,source_page,source_label,legacy_issues,notes,current_version,metadata
) values (
  'fc-geo-018','family-learning-cards','sub-geo-biodiversity','FC-GEO-018','Animaux d’Amérique du Nord','animaux-damerique-du-nord','GEO','18',
  15,0,30,'flashcards','needs_structuring','legacy_intake',36,
  36,144,array['fr']::text[],array['Montessori','Freinet','Steiner-Waldorf']::text[],'À structurer depuis le contenu source complet; le catalogue 2022 fournit le titre, la quantité et le prix historique, mais pas le registre carte par carte.',array['B2C Familles','B2B Écoles & crèches']::text[],
  array['Maison','Classe','Atelier éducatif']::text[],'Direction Produit',4,'NEW VERSION OF CATALOGUE FC 2022','[]'::jsonb,'','0.1-legacy-import',
  '{"seed": "catalogue-2022-u1", "sourcePage": 4}'::jsonb
) on conflict (id) do update set
  category_id=excluded.category_id,code=excluded.code,name=excluded.name,slug=excluded.slug,legacy_domain=excluded.legacy_domain,
  legacy_number=excluded.legacy_number,expected_card_count=excluded.expected_card_count,historical_price_dh=excluded.historical_price_dh,
  primary_format=excluded.primary_format,status=excluded.status,lifecycle=excluded.lifecycle,readiness_score=excluded.readiness_score,
  age_min_months=excluded.age_min_months,age_max_months=excluded.age_max_months,languages=excluded.languages,methodologies=excluded.methodologies,
  primary_objective=excluded.primary_objective,audiences=excluded.audiences,usage_contexts=excluded.usage_contexts,owner_name=excluded.owner_name,
  source_page=excluded.source_page,source_label=excluded.source_label,legacy_issues=excluded.legacy_issues,notes=excluded.notes,current_version=excluded.current_version,
  metadata=excluded.metadata,updated_at=now();

insert into flashcards_os.editions (collection_id,language_code,edition_key,version_label,status,metadata)
values ('fc-geo-018','fr','standard','0.1-legacy-import','legacy_intake','{"seed":"catalogue-2022-u1"}'::jsonb)
on conflict (collection_id,language_code,edition_key) do nothing;

insert into flashcards_os.formats (collection_id,format_key,status,specification)
values ('fc-geo-018','flashcards','legacy_intake','{"source":"catalogue-2022","specificationStatus":"not-supplied"}'::jsonb)
on conflict (collection_id,format_key) do nothing;

insert into flashcards_os.collection_versions (collection_id,version_label,status,change_summary,content_snapshot,created_by)
values ('fc-geo-018','0.1-legacy-import','draft','Entrée canonique créée depuis le catalogue 2022',jsonb_build_object('sourcePage',4,'expectedCardCount',15,'historicalPriceDh',30),'UMZ1 migration')
on conflict (collection_id,version_label) do nothing;
insert into flashcards_os.collections (
  id,family_id,category_id,code,name,slug,legacy_domain,legacy_number,expected_card_count,structured_card_count,
  historical_price_dh,primary_format,status,lifecycle,readiness_score,age_min_months,age_max_months,languages,
  methodologies,primary_objective,audiences,usage_contexts,owner_name,source_page,source_label,legacy_issues,notes,current_version,metadata
) values (
  'fc-geo-019','family-learning-cards','sub-geo-biodiversity','FC-GEO-019','Animaux de l’Antarctique','animaux-de-lantarctique','GEO','19',
  15,0,30,'flashcards','needs_structuring','legacy_intake',36,
  36,144,array['fr']::text[],array['Montessori','Freinet','Steiner-Waldorf']::text[],'À structurer depuis le contenu source complet; le catalogue 2022 fournit le titre, la quantité et le prix historique, mais pas le registre carte par carte.',array['B2C Familles','B2B Écoles & crèches']::text[],
  array['Maison','Classe','Atelier éducatif']::text[],'Direction Produit',4,'NEW VERSION OF CATALOGUE FC 2022','[]'::jsonb,'','0.1-legacy-import',
  '{"seed": "catalogue-2022-u1", "sourcePage": 4}'::jsonb
) on conflict (id) do update set
  category_id=excluded.category_id,code=excluded.code,name=excluded.name,slug=excluded.slug,legacy_domain=excluded.legacy_domain,
  legacy_number=excluded.legacy_number,expected_card_count=excluded.expected_card_count,historical_price_dh=excluded.historical_price_dh,
  primary_format=excluded.primary_format,status=excluded.status,lifecycle=excluded.lifecycle,readiness_score=excluded.readiness_score,
  age_min_months=excluded.age_min_months,age_max_months=excluded.age_max_months,languages=excluded.languages,methodologies=excluded.methodologies,
  primary_objective=excluded.primary_objective,audiences=excluded.audiences,usage_contexts=excluded.usage_contexts,owner_name=excluded.owner_name,
  source_page=excluded.source_page,source_label=excluded.source_label,legacy_issues=excluded.legacy_issues,notes=excluded.notes,current_version=excluded.current_version,
  metadata=excluded.metadata,updated_at=now();

insert into flashcards_os.editions (collection_id,language_code,edition_key,version_label,status,metadata)
values ('fc-geo-019','fr','standard','0.1-legacy-import','legacy_intake','{"seed":"catalogue-2022-u1"}'::jsonb)
on conflict (collection_id,language_code,edition_key) do nothing;

insert into flashcards_os.formats (collection_id,format_key,status,specification)
values ('fc-geo-019','flashcards','legacy_intake','{"source":"catalogue-2022","specificationStatus":"not-supplied"}'::jsonb)
on conflict (collection_id,format_key) do nothing;

insert into flashcards_os.collection_versions (collection_id,version_label,status,change_summary,content_snapshot,created_by)
values ('fc-geo-019','0.1-legacy-import','draft','Entrée canonique créée depuis le catalogue 2022',jsonb_build_object('sourcePage',4,'expectedCardCount',15,'historicalPriceDh',30),'UMZ1 migration')
on conflict (collection_id,version_label) do nothing;
insert into flashcards_os.collections (
  id,family_id,category_id,code,name,slug,legacy_domain,legacy_number,expected_card_count,structured_card_count,
  historical_price_dh,primary_format,status,lifecycle,readiness_score,age_min_months,age_max_months,languages,
  methodologies,primary_objective,audiences,usage_contexts,owner_name,source_page,source_label,legacy_issues,notes,current_version,metadata
) values (
  'fc-geo-020','family-learning-cards','sub-geo-biodiversity','FC-GEO-020','Légumes d’Afrique','legumes-dafrique','GEO','20',
  10,0,20,'flashcards','needs_structuring','legacy_intake',36,
  36,144,array['fr']::text[],array['Montessori','Freinet','Steiner-Waldorf']::text[],'À structurer depuis le contenu source complet; le catalogue 2022 fournit le titre, la quantité et le prix historique, mais pas le registre carte par carte.',array['B2C Familles','B2B Écoles & crèches']::text[],
  array['Maison','Classe','Atelier éducatif']::text[],'Direction Produit',4,'NEW VERSION OF CATALOGUE FC 2022','[]'::jsonb,'','0.1-legacy-import',
  '{"seed": "catalogue-2022-u1", "sourcePage": 4}'::jsonb
) on conflict (id) do update set
  category_id=excluded.category_id,code=excluded.code,name=excluded.name,slug=excluded.slug,legacy_domain=excluded.legacy_domain,
  legacy_number=excluded.legacy_number,expected_card_count=excluded.expected_card_count,historical_price_dh=excluded.historical_price_dh,
  primary_format=excluded.primary_format,status=excluded.status,lifecycle=excluded.lifecycle,readiness_score=excluded.readiness_score,
  age_min_months=excluded.age_min_months,age_max_months=excluded.age_max_months,languages=excluded.languages,methodologies=excluded.methodologies,
  primary_objective=excluded.primary_objective,audiences=excluded.audiences,usage_contexts=excluded.usage_contexts,owner_name=excluded.owner_name,
  source_page=excluded.source_page,source_label=excluded.source_label,legacy_issues=excluded.legacy_issues,notes=excluded.notes,current_version=excluded.current_version,
  metadata=excluded.metadata,updated_at=now();

insert into flashcards_os.editions (collection_id,language_code,edition_key,version_label,status,metadata)
values ('fc-geo-020','fr','standard','0.1-legacy-import','legacy_intake','{"seed":"catalogue-2022-u1"}'::jsonb)
on conflict (collection_id,language_code,edition_key) do nothing;

insert into flashcards_os.formats (collection_id,format_key,status,specification)
values ('fc-geo-020','flashcards','legacy_intake','{"source":"catalogue-2022","specificationStatus":"not-supplied"}'::jsonb)
on conflict (collection_id,format_key) do nothing;

insert into flashcards_os.collection_versions (collection_id,version_label,status,change_summary,content_snapshot,created_by)
values ('fc-geo-020','0.1-legacy-import','draft','Entrée canonique créée depuis le catalogue 2022',jsonb_build_object('sourcePage',4,'expectedCardCount',10,'historicalPriceDh',20),'UMZ1 migration')
on conflict (collection_id,version_label) do nothing;
insert into flashcards_os.collections (
  id,family_id,category_id,code,name,slug,legacy_domain,legacy_number,expected_card_count,structured_card_count,
  historical_price_dh,primary_format,status,lifecycle,readiness_score,age_min_months,age_max_months,languages,
  methodologies,primary_objective,audiences,usage_contexts,owner_name,source_page,source_label,legacy_issues,notes,current_version,metadata
) values (
  'fc-geo-021','family-learning-cards','sub-geo-biodiversity','FC-GEO-021','Légumes d’Europe','legumes-deurope','GEO','21',
  10,0,20,'flashcards','needs_structuring','legacy_intake',36,
  36,144,array['fr']::text[],array['Montessori','Freinet','Steiner-Waldorf']::text[],'À structurer depuis le contenu source complet; le catalogue 2022 fournit le titre, la quantité et le prix historique, mais pas le registre carte par carte.',array['B2C Familles','B2B Écoles & crèches']::text[],
  array['Maison','Classe','Atelier éducatif']::text[],'Direction Produit',4,'NEW VERSION OF CATALOGUE FC 2022','[]'::jsonb,'','0.1-legacy-import',
  '{"seed": "catalogue-2022-u1", "sourcePage": 4}'::jsonb
) on conflict (id) do update set
  category_id=excluded.category_id,code=excluded.code,name=excluded.name,slug=excluded.slug,legacy_domain=excluded.legacy_domain,
  legacy_number=excluded.legacy_number,expected_card_count=excluded.expected_card_count,historical_price_dh=excluded.historical_price_dh,
  primary_format=excluded.primary_format,status=excluded.status,lifecycle=excluded.lifecycle,readiness_score=excluded.readiness_score,
  age_min_months=excluded.age_min_months,age_max_months=excluded.age_max_months,languages=excluded.languages,methodologies=excluded.methodologies,
  primary_objective=excluded.primary_objective,audiences=excluded.audiences,usage_contexts=excluded.usage_contexts,owner_name=excluded.owner_name,
  source_page=excluded.source_page,source_label=excluded.source_label,legacy_issues=excluded.legacy_issues,notes=excluded.notes,current_version=excluded.current_version,
  metadata=excluded.metadata,updated_at=now();

insert into flashcards_os.editions (collection_id,language_code,edition_key,version_label,status,metadata)
values ('fc-geo-021','fr','standard','0.1-legacy-import','legacy_intake','{"seed":"catalogue-2022-u1"}'::jsonb)
on conflict (collection_id,language_code,edition_key) do nothing;

insert into flashcards_os.formats (collection_id,format_key,status,specification)
values ('fc-geo-021','flashcards','legacy_intake','{"source":"catalogue-2022","specificationStatus":"not-supplied"}'::jsonb)
on conflict (collection_id,format_key) do nothing;

insert into flashcards_os.collection_versions (collection_id,version_label,status,change_summary,content_snapshot,created_by)
values ('fc-geo-021','0.1-legacy-import','draft','Entrée canonique créée depuis le catalogue 2022',jsonb_build_object('sourcePage',4,'expectedCardCount',10,'historicalPriceDh',20),'UMZ1 migration')
on conflict (collection_id,version_label) do nothing;
insert into flashcards_os.collections (
  id,family_id,category_id,code,name,slug,legacy_domain,legacy_number,expected_card_count,structured_card_count,
  historical_price_dh,primary_format,status,lifecycle,readiness_score,age_min_months,age_max_months,languages,
  methodologies,primary_objective,audiences,usage_contexts,owner_name,source_page,source_label,legacy_issues,notes,current_version,metadata
) values (
  'fc-geo-022','family-learning-cards','sub-geo-biodiversity','FC-GEO-022','Légumes d’Amérique du Sud','legumes-damerique-du-sud','GEO','22',
  10,0,20,'flashcards','needs_structuring','legacy_intake',36,
  36,144,array['fr']::text[],array['Montessori','Freinet','Steiner-Waldorf']::text[],'À structurer depuis le contenu source complet; le catalogue 2022 fournit le titre, la quantité et le prix historique, mais pas le registre carte par carte.',array['B2C Familles','B2B Écoles & crèches']::text[],
  array['Maison','Classe','Atelier éducatif']::text[],'Direction Produit',4,'NEW VERSION OF CATALOGUE FC 2022','[]'::jsonb,'','0.1-legacy-import',
  '{"seed": "catalogue-2022-u1", "sourcePage": 4}'::jsonb
) on conflict (id) do update set
  category_id=excluded.category_id,code=excluded.code,name=excluded.name,slug=excluded.slug,legacy_domain=excluded.legacy_domain,
  legacy_number=excluded.legacy_number,expected_card_count=excluded.expected_card_count,historical_price_dh=excluded.historical_price_dh,
  primary_format=excluded.primary_format,status=excluded.status,lifecycle=excluded.lifecycle,readiness_score=excluded.readiness_score,
  age_min_months=excluded.age_min_months,age_max_months=excluded.age_max_months,languages=excluded.languages,methodologies=excluded.methodologies,
  primary_objective=excluded.primary_objective,audiences=excluded.audiences,usage_contexts=excluded.usage_contexts,owner_name=excluded.owner_name,
  source_page=excluded.source_page,source_label=excluded.source_label,legacy_issues=excluded.legacy_issues,notes=excluded.notes,current_version=excluded.current_version,
  metadata=excluded.metadata,updated_at=now();

insert into flashcards_os.editions (collection_id,language_code,edition_key,version_label,status,metadata)
values ('fc-geo-022','fr','standard','0.1-legacy-import','legacy_intake','{"seed":"catalogue-2022-u1"}'::jsonb)
on conflict (collection_id,language_code,edition_key) do nothing;

insert into flashcards_os.formats (collection_id,format_key,status,specification)
values ('fc-geo-022','flashcards','legacy_intake','{"source":"catalogue-2022","specificationStatus":"not-supplied"}'::jsonb)
on conflict (collection_id,format_key) do nothing;

insert into flashcards_os.collection_versions (collection_id,version_label,status,change_summary,content_snapshot,created_by)
values ('fc-geo-022','0.1-legacy-import','draft','Entrée canonique créée depuis le catalogue 2022',jsonb_build_object('sourcePage',4,'expectedCardCount',10,'historicalPriceDh',20),'UMZ1 migration')
on conflict (collection_id,version_label) do nothing;
insert into flashcards_os.collections (
  id,family_id,category_id,code,name,slug,legacy_domain,legacy_number,expected_card_count,structured_card_count,
  historical_price_dh,primary_format,status,lifecycle,readiness_score,age_min_months,age_max_months,languages,
  methodologies,primary_objective,audiences,usage_contexts,owner_name,source_page,source_label,legacy_issues,notes,current_version,metadata
) values (
  'fc-geo-023','family-learning-cards','sub-geo-biodiversity','FC-GEO-023','Légumes d’Amérique du Nord','legumes-damerique-du-nord','GEO','23',
  10,0,20,'flashcards','needs_structuring','legacy_intake',36,
  36,144,array['fr']::text[],array['Montessori','Freinet','Steiner-Waldorf']::text[],'À structurer depuis le contenu source complet; le catalogue 2022 fournit le titre, la quantité et le prix historique, mais pas le registre carte par carte.',array['B2C Familles','B2B Écoles & crèches']::text[],
  array['Maison','Classe','Atelier éducatif']::text[],'Direction Produit',4,'NEW VERSION OF CATALOGUE FC 2022','[]'::jsonb,'','0.1-legacy-import',
  '{"seed": "catalogue-2022-u1", "sourcePage": 4}'::jsonb
) on conflict (id) do update set
  category_id=excluded.category_id,code=excluded.code,name=excluded.name,slug=excluded.slug,legacy_domain=excluded.legacy_domain,
  legacy_number=excluded.legacy_number,expected_card_count=excluded.expected_card_count,historical_price_dh=excluded.historical_price_dh,
  primary_format=excluded.primary_format,status=excluded.status,lifecycle=excluded.lifecycle,readiness_score=excluded.readiness_score,
  age_min_months=excluded.age_min_months,age_max_months=excluded.age_max_months,languages=excluded.languages,methodologies=excluded.methodologies,
  primary_objective=excluded.primary_objective,audiences=excluded.audiences,usage_contexts=excluded.usage_contexts,owner_name=excluded.owner_name,
  source_page=excluded.source_page,source_label=excluded.source_label,legacy_issues=excluded.legacy_issues,notes=excluded.notes,current_version=excluded.current_version,
  metadata=excluded.metadata,updated_at=now();

insert into flashcards_os.editions (collection_id,language_code,edition_key,version_label,status,metadata)
values ('fc-geo-023','fr','standard','0.1-legacy-import','legacy_intake','{"seed":"catalogue-2022-u1"}'::jsonb)
on conflict (collection_id,language_code,edition_key) do nothing;

insert into flashcards_os.formats (collection_id,format_key,status,specification)
values ('fc-geo-023','flashcards','legacy_intake','{"source":"catalogue-2022","specificationStatus":"not-supplied"}'::jsonb)
on conflict (collection_id,format_key) do nothing;

insert into flashcards_os.collection_versions (collection_id,version_label,status,change_summary,content_snapshot,created_by)
values ('fc-geo-023','0.1-legacy-import','draft','Entrée canonique créée depuis le catalogue 2022',jsonb_build_object('sourcePage',4,'expectedCardCount',10,'historicalPriceDh',20),'UMZ1 migration')
on conflict (collection_id,version_label) do nothing;
insert into flashcards_os.collections (
  id,family_id,category_id,code,name,slug,legacy_domain,legacy_number,expected_card_count,structured_card_count,
  historical_price_dh,primary_format,status,lifecycle,readiness_score,age_min_months,age_max_months,languages,
  methodologies,primary_objective,audiences,usage_contexts,owner_name,source_page,source_label,legacy_issues,notes,current_version,metadata
) values (
  'fc-geo-024','family-learning-cards','sub-geo-biodiversity','FC-GEO-024','Légumes d’Asie','legumes-dasie','GEO','24',
  10,0,20,'flashcards','needs_structuring','legacy_intake',36,
  36,144,array['fr']::text[],array['Montessori','Freinet','Steiner-Waldorf']::text[],'À structurer depuis le contenu source complet; le catalogue 2022 fournit le titre, la quantité et le prix historique, mais pas le registre carte par carte.',array['B2C Familles','B2B Écoles & crèches']::text[],
  array['Maison','Classe','Atelier éducatif']::text[],'Direction Produit',4,'NEW VERSION OF CATALOGUE FC 2022','[]'::jsonb,'','0.1-legacy-import',
  '{"seed": "catalogue-2022-u1", "sourcePage": 4}'::jsonb
) on conflict (id) do update set
  category_id=excluded.category_id,code=excluded.code,name=excluded.name,slug=excluded.slug,legacy_domain=excluded.legacy_domain,
  legacy_number=excluded.legacy_number,expected_card_count=excluded.expected_card_count,historical_price_dh=excluded.historical_price_dh,
  primary_format=excluded.primary_format,status=excluded.status,lifecycle=excluded.lifecycle,readiness_score=excluded.readiness_score,
  age_min_months=excluded.age_min_months,age_max_months=excluded.age_max_months,languages=excluded.languages,methodologies=excluded.methodologies,
  primary_objective=excluded.primary_objective,audiences=excluded.audiences,usage_contexts=excluded.usage_contexts,owner_name=excluded.owner_name,
  source_page=excluded.source_page,source_label=excluded.source_label,legacy_issues=excluded.legacy_issues,notes=excluded.notes,current_version=excluded.current_version,
  metadata=excluded.metadata,updated_at=now();

insert into flashcards_os.editions (collection_id,language_code,edition_key,version_label,status,metadata)
values ('fc-geo-024','fr','standard','0.1-legacy-import','legacy_intake','{"seed":"catalogue-2022-u1"}'::jsonb)
on conflict (collection_id,language_code,edition_key) do nothing;

insert into flashcards_os.formats (collection_id,format_key,status,specification)
values ('fc-geo-024','flashcards','legacy_intake','{"source":"catalogue-2022","specificationStatus":"not-supplied"}'::jsonb)
on conflict (collection_id,format_key) do nothing;

insert into flashcards_os.collection_versions (collection_id,version_label,status,change_summary,content_snapshot,created_by)
values ('fc-geo-024','0.1-legacy-import','draft','Entrée canonique créée depuis le catalogue 2022',jsonb_build_object('sourcePage',4,'expectedCardCount',10,'historicalPriceDh',20),'UMZ1 migration')
on conflict (collection_id,version_label) do nothing;
insert into flashcards_os.collections (
  id,family_id,category_id,code,name,slug,legacy_domain,legacy_number,expected_card_count,structured_card_count,
  historical_price_dh,primary_format,status,lifecycle,readiness_score,age_min_months,age_max_months,languages,
  methodologies,primary_objective,audiences,usage_contexts,owner_name,source_page,source_label,legacy_issues,notes,current_version,metadata
) values (
  'fc-geo-025','family-learning-cards','sub-geo-biodiversity','FC-GEO-025','Légumes d’Australie','legumes-daustralie','GEO','25',
  10,0,20,'flashcards','needs_structuring','legacy_intake',36,
  36,144,array['fr']::text[],array['Montessori','Freinet','Steiner-Waldorf']::text[],'À structurer depuis le contenu source complet; le catalogue 2022 fournit le titre, la quantité et le prix historique, mais pas le registre carte par carte.',array['B2C Familles','B2B Écoles & crèches']::text[],
  array['Maison','Classe','Atelier éducatif']::text[],'Direction Produit',4,'NEW VERSION OF CATALOGUE FC 2022','[]'::jsonb,'','0.1-legacy-import',
  '{"seed": "catalogue-2022-u1", "sourcePage": 4}'::jsonb
) on conflict (id) do update set
  category_id=excluded.category_id,code=excluded.code,name=excluded.name,slug=excluded.slug,legacy_domain=excluded.legacy_domain,
  legacy_number=excluded.legacy_number,expected_card_count=excluded.expected_card_count,historical_price_dh=excluded.historical_price_dh,
  primary_format=excluded.primary_format,status=excluded.status,lifecycle=excluded.lifecycle,readiness_score=excluded.readiness_score,
  age_min_months=excluded.age_min_months,age_max_months=excluded.age_max_months,languages=excluded.languages,methodologies=excluded.methodologies,
  primary_objective=excluded.primary_objective,audiences=excluded.audiences,usage_contexts=excluded.usage_contexts,owner_name=excluded.owner_name,
  source_page=excluded.source_page,source_label=excluded.source_label,legacy_issues=excluded.legacy_issues,notes=excluded.notes,current_version=excluded.current_version,
  metadata=excluded.metadata,updated_at=now();

insert into flashcards_os.editions (collection_id,language_code,edition_key,version_label,status,metadata)
values ('fc-geo-025','fr','standard','0.1-legacy-import','legacy_intake','{"seed":"catalogue-2022-u1"}'::jsonb)
on conflict (collection_id,language_code,edition_key) do nothing;

insert into flashcards_os.formats (collection_id,format_key,status,specification)
values ('fc-geo-025','flashcards','legacy_intake','{"source":"catalogue-2022","specificationStatus":"not-supplied"}'::jsonb)
on conflict (collection_id,format_key) do nothing;

insert into flashcards_os.collection_versions (collection_id,version_label,status,change_summary,content_snapshot,created_by)
values ('fc-geo-025','0.1-legacy-import','draft','Entrée canonique créée depuis le catalogue 2022',jsonb_build_object('sourcePage',4,'expectedCardCount',10,'historicalPriceDh',20),'UMZ1 migration')
on conflict (collection_id,version_label) do nothing;
insert into flashcards_os.collections (
  id,family_id,category_id,code,name,slug,legacy_domain,legacy_number,expected_card_count,structured_card_count,
  historical_price_dh,primary_format,status,lifecycle,readiness_score,age_min_months,age_max_months,languages,
  methodologies,primary_objective,audiences,usage_contexts,owner_name,source_page,source_label,legacy_issues,notes,current_version,metadata
) values (
  'fc-geo-026','family-learning-cards','sub-geo-biodiversity','FC-GEO-026','Fruits d’Afrique','fruits-dafrique','GEO','26',
  10,0,20,'flashcards','needs_structuring','legacy_intake',36,
  36,144,array['fr']::text[],array['Montessori','Freinet','Steiner-Waldorf']::text[],'À structurer depuis le contenu source complet; le catalogue 2022 fournit le titre, la quantité et le prix historique, mais pas le registre carte par carte.',array['B2C Familles','B2B Écoles & crèches']::text[],
  array['Maison','Classe','Atelier éducatif']::text[],'Direction Produit',4,'NEW VERSION OF CATALOGUE FC 2022','[]'::jsonb,'','0.1-legacy-import',
  '{"seed": "catalogue-2022-u1", "sourcePage": 4}'::jsonb
) on conflict (id) do update set
  category_id=excluded.category_id,code=excluded.code,name=excluded.name,slug=excluded.slug,legacy_domain=excluded.legacy_domain,
  legacy_number=excluded.legacy_number,expected_card_count=excluded.expected_card_count,historical_price_dh=excluded.historical_price_dh,
  primary_format=excluded.primary_format,status=excluded.status,lifecycle=excluded.lifecycle,readiness_score=excluded.readiness_score,
  age_min_months=excluded.age_min_months,age_max_months=excluded.age_max_months,languages=excluded.languages,methodologies=excluded.methodologies,
  primary_objective=excluded.primary_objective,audiences=excluded.audiences,usage_contexts=excluded.usage_contexts,owner_name=excluded.owner_name,
  source_page=excluded.source_page,source_label=excluded.source_label,legacy_issues=excluded.legacy_issues,notes=excluded.notes,current_version=excluded.current_version,
  metadata=excluded.metadata,updated_at=now();

insert into flashcards_os.editions (collection_id,language_code,edition_key,version_label,status,metadata)
values ('fc-geo-026','fr','standard','0.1-legacy-import','legacy_intake','{"seed":"catalogue-2022-u1"}'::jsonb)
on conflict (collection_id,language_code,edition_key) do nothing;

insert into flashcards_os.formats (collection_id,format_key,status,specification)
values ('fc-geo-026','flashcards','legacy_intake','{"source":"catalogue-2022","specificationStatus":"not-supplied"}'::jsonb)
on conflict (collection_id,format_key) do nothing;

insert into flashcards_os.collection_versions (collection_id,version_label,status,change_summary,content_snapshot,created_by)
values ('fc-geo-026','0.1-legacy-import','draft','Entrée canonique créée depuis le catalogue 2022',jsonb_build_object('sourcePage',4,'expectedCardCount',10,'historicalPriceDh',20),'UMZ1 migration')
on conflict (collection_id,version_label) do nothing;
insert into flashcards_os.collections (
  id,family_id,category_id,code,name,slug,legacy_domain,legacy_number,expected_card_count,structured_card_count,
  historical_price_dh,primary_format,status,lifecycle,readiness_score,age_min_months,age_max_months,languages,
  methodologies,primary_objective,audiences,usage_contexts,owner_name,source_page,source_label,legacy_issues,notes,current_version,metadata
) values (
  'fc-geo-027','family-learning-cards','sub-geo-biodiversity','FC-GEO-027','Fruits d’Europe','fruits-deurope','GEO','27',
  10,0,20,'flashcards','needs_structuring','legacy_intake',36,
  36,144,array['fr']::text[],array['Montessori','Freinet','Steiner-Waldorf']::text[],'À structurer depuis le contenu source complet; le catalogue 2022 fournit le titre, la quantité et le prix historique, mais pas le registre carte par carte.',array['B2C Familles','B2B Écoles & crèches']::text[],
  array['Maison','Classe','Atelier éducatif']::text[],'Direction Produit',4,'NEW VERSION OF CATALOGUE FC 2022','[]'::jsonb,'','0.1-legacy-import',
  '{"seed": "catalogue-2022-u1", "sourcePage": 4}'::jsonb
) on conflict (id) do update set
  category_id=excluded.category_id,code=excluded.code,name=excluded.name,slug=excluded.slug,legacy_domain=excluded.legacy_domain,
  legacy_number=excluded.legacy_number,expected_card_count=excluded.expected_card_count,historical_price_dh=excluded.historical_price_dh,
  primary_format=excluded.primary_format,status=excluded.status,lifecycle=excluded.lifecycle,readiness_score=excluded.readiness_score,
  age_min_months=excluded.age_min_months,age_max_months=excluded.age_max_months,languages=excluded.languages,methodologies=excluded.methodologies,
  primary_objective=excluded.primary_objective,audiences=excluded.audiences,usage_contexts=excluded.usage_contexts,owner_name=excluded.owner_name,
  source_page=excluded.source_page,source_label=excluded.source_label,legacy_issues=excluded.legacy_issues,notes=excluded.notes,current_version=excluded.current_version,
  metadata=excluded.metadata,updated_at=now();

insert into flashcards_os.editions (collection_id,language_code,edition_key,version_label,status,metadata)
values ('fc-geo-027','fr','standard','0.1-legacy-import','legacy_intake','{"seed":"catalogue-2022-u1"}'::jsonb)
on conflict (collection_id,language_code,edition_key) do nothing;

insert into flashcards_os.formats (collection_id,format_key,status,specification)
values ('fc-geo-027','flashcards','legacy_intake','{"source":"catalogue-2022","specificationStatus":"not-supplied"}'::jsonb)
on conflict (collection_id,format_key) do nothing;

insert into flashcards_os.collection_versions (collection_id,version_label,status,change_summary,content_snapshot,created_by)
values ('fc-geo-027','0.1-legacy-import','draft','Entrée canonique créée depuis le catalogue 2022',jsonb_build_object('sourcePage',4,'expectedCardCount',10,'historicalPriceDh',20),'UMZ1 migration')
on conflict (collection_id,version_label) do nothing;
insert into flashcards_os.collections (
  id,family_id,category_id,code,name,slug,legacy_domain,legacy_number,expected_card_count,structured_card_count,
  historical_price_dh,primary_format,status,lifecycle,readiness_score,age_min_months,age_max_months,languages,
  methodologies,primary_objective,audiences,usage_contexts,owner_name,source_page,source_label,legacy_issues,notes,current_version,metadata
) values (
  'fc-geo-028','family-learning-cards','sub-geo-biodiversity','FC-GEO-028','Fruits d’Asie','fruits-dasie','GEO','28',
  10,0,20,'flashcards','needs_structuring','legacy_intake',36,
  36,144,array['fr']::text[],array['Montessori','Freinet','Steiner-Waldorf']::text[],'À structurer depuis le contenu source complet; le catalogue 2022 fournit le titre, la quantité et le prix historique, mais pas le registre carte par carte.',array['B2C Familles','B2B Écoles & crèches']::text[],
  array['Maison','Classe','Atelier éducatif']::text[],'Direction Produit',4,'NEW VERSION OF CATALOGUE FC 2022','[]'::jsonb,'','0.1-legacy-import',
  '{"seed": "catalogue-2022-u1", "sourcePage": 4}'::jsonb
) on conflict (id) do update set
  category_id=excluded.category_id,code=excluded.code,name=excluded.name,slug=excluded.slug,legacy_domain=excluded.legacy_domain,
  legacy_number=excluded.legacy_number,expected_card_count=excluded.expected_card_count,historical_price_dh=excluded.historical_price_dh,
  primary_format=excluded.primary_format,status=excluded.status,lifecycle=excluded.lifecycle,readiness_score=excluded.readiness_score,
  age_min_months=excluded.age_min_months,age_max_months=excluded.age_max_months,languages=excluded.languages,methodologies=excluded.methodologies,
  primary_objective=excluded.primary_objective,audiences=excluded.audiences,usage_contexts=excluded.usage_contexts,owner_name=excluded.owner_name,
  source_page=excluded.source_page,source_label=excluded.source_label,legacy_issues=excluded.legacy_issues,notes=excluded.notes,current_version=excluded.current_version,
  metadata=excluded.metadata,updated_at=now();

insert into flashcards_os.editions (collection_id,language_code,edition_key,version_label,status,metadata)
values ('fc-geo-028','fr','standard','0.1-legacy-import','legacy_intake','{"seed":"catalogue-2022-u1"}'::jsonb)
on conflict (collection_id,language_code,edition_key) do nothing;

insert into flashcards_os.formats (collection_id,format_key,status,specification)
values ('fc-geo-028','flashcards','legacy_intake','{"source":"catalogue-2022","specificationStatus":"not-supplied"}'::jsonb)
on conflict (collection_id,format_key) do nothing;

insert into flashcards_os.collection_versions (collection_id,version_label,status,change_summary,content_snapshot,created_by)
values ('fc-geo-028','0.1-legacy-import','draft','Entrée canonique créée depuis le catalogue 2022',jsonb_build_object('sourcePage',4,'expectedCardCount',10,'historicalPriceDh',20),'UMZ1 migration')
on conflict (collection_id,version_label) do nothing;
insert into flashcards_os.collections (
  id,family_id,category_id,code,name,slug,legacy_domain,legacy_number,expected_card_count,structured_card_count,
  historical_price_dh,primary_format,status,lifecycle,readiness_score,age_min_months,age_max_months,languages,
  methodologies,primary_objective,audiences,usage_contexts,owner_name,source_page,source_label,legacy_issues,notes,current_version,metadata
) values (
  'fc-geo-029','family-learning-cards','sub-geo-biodiversity','FC-GEO-029','Fruits d’Afrique','fruits-dafrique','GEO','29',
  10,0,20,'flashcards','needs_review','legacy_intake',28,
  36,144,array['fr']::text[],array['Montessori','Freinet','Steiner-Waldorf']::text[],'À structurer depuis le contenu source complet; le catalogue 2022 fournit le titre, la quantité et le prix historique, mais pas le registre carte par carte.',array['B2C Familles','B2B Écoles & crèches']::text[],
  array['Maison','Classe','Atelier éducatif']::text[],'Direction Produit',4,'NEW VERSION OF CATALOGUE FC 2022','["duplicate_name", "probable_source_label_error"]'::jsonb,'','0.1-legacy-import',
  '{"seed": "catalogue-2022-u1", "sourcePage": 4}'::jsonb
) on conflict (id) do update set
  category_id=excluded.category_id,code=excluded.code,name=excluded.name,slug=excluded.slug,legacy_domain=excluded.legacy_domain,
  legacy_number=excluded.legacy_number,expected_card_count=excluded.expected_card_count,historical_price_dh=excluded.historical_price_dh,
  primary_format=excluded.primary_format,status=excluded.status,lifecycle=excluded.lifecycle,readiness_score=excluded.readiness_score,
  age_min_months=excluded.age_min_months,age_max_months=excluded.age_max_months,languages=excluded.languages,methodologies=excluded.methodologies,
  primary_objective=excluded.primary_objective,audiences=excluded.audiences,usage_contexts=excluded.usage_contexts,owner_name=excluded.owner_name,
  source_page=excluded.source_page,source_label=excluded.source_label,legacy_issues=excluded.legacy_issues,notes=excluded.notes,current_version=excluded.current_version,
  metadata=excluded.metadata,updated_at=now();

insert into flashcards_os.editions (collection_id,language_code,edition_key,version_label,status,metadata)
values ('fc-geo-029','fr','standard','0.1-legacy-import','legacy_intake','{"seed":"catalogue-2022-u1"}'::jsonb)
on conflict (collection_id,language_code,edition_key) do nothing;

insert into flashcards_os.formats (collection_id,format_key,status,specification)
values ('fc-geo-029','flashcards','legacy_intake','{"source":"catalogue-2022","specificationStatus":"not-supplied"}'::jsonb)
on conflict (collection_id,format_key) do nothing;

insert into flashcards_os.collection_versions (collection_id,version_label,status,change_summary,content_snapshot,created_by)
values ('fc-geo-029','0.1-legacy-import','draft','Entrée canonique créée depuis le catalogue 2022',jsonb_build_object('sourcePage',4,'expectedCardCount',10,'historicalPriceDh',20),'UMZ1 migration')
on conflict (collection_id,version_label) do nothing;
insert into flashcards_os.collections (
  id,family_id,category_id,code,name,slug,legacy_domain,legacy_number,expected_card_count,structured_card_count,
  historical_price_dh,primary_format,status,lifecycle,readiness_score,age_min_months,age_max_months,languages,
  methodologies,primary_objective,audiences,usage_contexts,owner_name,source_page,source_label,legacy_issues,notes,current_version,metadata
) values (
  'fc-geo-030','family-learning-cards','sub-geo-biodiversity','FC-GEO-030','Fruits d’Amérique','fruits-damerique','GEO','30',
  10,0,20,'flashcards','needs_structuring','legacy_intake',36,
  36,144,array['fr']::text[],array['Montessori','Freinet','Steiner-Waldorf']::text[],'À structurer depuis le contenu source complet; le catalogue 2022 fournit le titre, la quantité et le prix historique, mais pas le registre carte par carte.',array['B2C Familles','B2B Écoles & crèches']::text[],
  array['Maison','Classe','Atelier éducatif']::text[],'Direction Produit',4,'NEW VERSION OF CATALOGUE FC 2022','[]'::jsonb,'','0.1-legacy-import',
  '{"seed": "catalogue-2022-u1", "sourcePage": 4}'::jsonb
) on conflict (id) do update set
  category_id=excluded.category_id,code=excluded.code,name=excluded.name,slug=excluded.slug,legacy_domain=excluded.legacy_domain,
  legacy_number=excluded.legacy_number,expected_card_count=excluded.expected_card_count,historical_price_dh=excluded.historical_price_dh,
  primary_format=excluded.primary_format,status=excluded.status,lifecycle=excluded.lifecycle,readiness_score=excluded.readiness_score,
  age_min_months=excluded.age_min_months,age_max_months=excluded.age_max_months,languages=excluded.languages,methodologies=excluded.methodologies,
  primary_objective=excluded.primary_objective,audiences=excluded.audiences,usage_contexts=excluded.usage_contexts,owner_name=excluded.owner_name,
  source_page=excluded.source_page,source_label=excluded.source_label,legacy_issues=excluded.legacy_issues,notes=excluded.notes,current_version=excluded.current_version,
  metadata=excluded.metadata,updated_at=now();

insert into flashcards_os.editions (collection_id,language_code,edition_key,version_label,status,metadata)
values ('fc-geo-030','fr','standard','0.1-legacy-import','legacy_intake','{"seed":"catalogue-2022-u1"}'::jsonb)
on conflict (collection_id,language_code,edition_key) do nothing;

insert into flashcards_os.formats (collection_id,format_key,status,specification)
values ('fc-geo-030','flashcards','legacy_intake','{"source":"catalogue-2022","specificationStatus":"not-supplied"}'::jsonb)
on conflict (collection_id,format_key) do nothing;

insert into flashcards_os.collection_versions (collection_id,version_label,status,change_summary,content_snapshot,created_by)
values ('fc-geo-030','0.1-legacy-import','draft','Entrée canonique créée depuis le catalogue 2022',jsonb_build_object('sourcePage',4,'expectedCardCount',10,'historicalPriceDh',20),'UMZ1 migration')
on conflict (collection_id,version_label) do nothing;
insert into flashcards_os.collections (
  id,family_id,category_id,code,name,slug,legacy_domain,legacy_number,expected_card_count,structured_card_count,
  historical_price_dh,primary_format,status,lifecycle,readiness_score,age_min_months,age_max_months,languages,
  methodologies,primary_objective,audiences,usage_contexts,owner_name,source_page,source_label,legacy_issues,notes,current_version,metadata
) values (
  'fc-math-001','family-learning-cards','sub-math-foundations','FC-MATH-001','Les formes géométriques basiques','les-formes-geometriques-basiques','MATH','1',
  11,0,22,'flashcards','needs_structuring','legacy_intake',36,
  36,144,array['fr']::text[],array['Montessori','Freinet','Steiner-Waldorf']::text[],'À structurer depuis le contenu source complet; le catalogue 2022 fournit le titre, la quantité et le prix historique, mais pas le registre carte par carte.',array['B2C Familles','B2B Écoles & crèches']::text[],
  array['Maison','Classe','Atelier éducatif']::text[],'Direction Produit',5,'NEW VERSION OF CATALOGUE FC 2022','[]'::jsonb,'','0.1-legacy-import',
  '{"seed": "catalogue-2022-u1", "sourcePage": 5}'::jsonb
) on conflict (id) do update set
  category_id=excluded.category_id,code=excluded.code,name=excluded.name,slug=excluded.slug,legacy_domain=excluded.legacy_domain,
  legacy_number=excluded.legacy_number,expected_card_count=excluded.expected_card_count,historical_price_dh=excluded.historical_price_dh,
  primary_format=excluded.primary_format,status=excluded.status,lifecycle=excluded.lifecycle,readiness_score=excluded.readiness_score,
  age_min_months=excluded.age_min_months,age_max_months=excluded.age_max_months,languages=excluded.languages,methodologies=excluded.methodologies,
  primary_objective=excluded.primary_objective,audiences=excluded.audiences,usage_contexts=excluded.usage_contexts,owner_name=excluded.owner_name,
  source_page=excluded.source_page,source_label=excluded.source_label,legacy_issues=excluded.legacy_issues,notes=excluded.notes,current_version=excluded.current_version,
  metadata=excluded.metadata,updated_at=now();

insert into flashcards_os.editions (collection_id,language_code,edition_key,version_label,status,metadata)
values ('fc-math-001','fr','standard','0.1-legacy-import','legacy_intake','{"seed":"catalogue-2022-u1"}'::jsonb)
on conflict (collection_id,language_code,edition_key) do nothing;

insert into flashcards_os.formats (collection_id,format_key,status,specification)
values ('fc-math-001','flashcards','legacy_intake','{"source":"catalogue-2022","specificationStatus":"not-supplied"}'::jsonb)
on conflict (collection_id,format_key) do nothing;

insert into flashcards_os.collection_versions (collection_id,version_label,status,change_summary,content_snapshot,created_by)
values ('fc-math-001','0.1-legacy-import','draft','Entrée canonique créée depuis le catalogue 2022',jsonb_build_object('sourcePage',5,'expectedCardCount',11,'historicalPriceDh',22),'UMZ1 migration')
on conflict (collection_id,version_label) do nothing;
insert into flashcards_os.collections (
  id,family_id,category_id,code,name,slug,legacy_domain,legacy_number,expected_card_count,structured_card_count,
  historical_price_dh,primary_format,status,lifecycle,readiness_score,age_min_months,age_max_months,languages,
  methodologies,primary_objective,audiences,usage_contexts,owner_name,source_page,source_label,legacy_issues,notes,current_version,metadata
) values (
  'fc-math-002','family-learning-cards','sub-math-foundations','FC-MATH-002','Les formes solides','les-formes-solides','MATH','2',
  9,0,18,'flashcards','needs_structuring','legacy_intake',36,
  36,144,array['fr']::text[],array['Montessori','Freinet','Steiner-Waldorf']::text[],'À structurer depuis le contenu source complet; le catalogue 2022 fournit le titre, la quantité et le prix historique, mais pas le registre carte par carte.',array['B2C Familles','B2B Écoles & crèches']::text[],
  array['Maison','Classe','Atelier éducatif']::text[],'Direction Produit',5,'NEW VERSION OF CATALOGUE FC 2022','[]'::jsonb,'','0.1-legacy-import',
  '{"seed": "catalogue-2022-u1", "sourcePage": 5}'::jsonb
) on conflict (id) do update set
  category_id=excluded.category_id,code=excluded.code,name=excluded.name,slug=excluded.slug,legacy_domain=excluded.legacy_domain,
  legacy_number=excluded.legacy_number,expected_card_count=excluded.expected_card_count,historical_price_dh=excluded.historical_price_dh,
  primary_format=excluded.primary_format,status=excluded.status,lifecycle=excluded.lifecycle,readiness_score=excluded.readiness_score,
  age_min_months=excluded.age_min_months,age_max_months=excluded.age_max_months,languages=excluded.languages,methodologies=excluded.methodologies,
  primary_objective=excluded.primary_objective,audiences=excluded.audiences,usage_contexts=excluded.usage_contexts,owner_name=excluded.owner_name,
  source_page=excluded.source_page,source_label=excluded.source_label,legacy_issues=excluded.legacy_issues,notes=excluded.notes,current_version=excluded.current_version,
  metadata=excluded.metadata,updated_at=now();

insert into flashcards_os.editions (collection_id,language_code,edition_key,version_label,status,metadata)
values ('fc-math-002','fr','standard','0.1-legacy-import','legacy_intake','{"seed":"catalogue-2022-u1"}'::jsonb)
on conflict (collection_id,language_code,edition_key) do nothing;

insert into flashcards_os.formats (collection_id,format_key,status,specification)
values ('fc-math-002','flashcards','legacy_intake','{"source":"catalogue-2022","specificationStatus":"not-supplied"}'::jsonb)
on conflict (collection_id,format_key) do nothing;

insert into flashcards_os.collection_versions (collection_id,version_label,status,change_summary,content_snapshot,created_by)
values ('fc-math-002','0.1-legacy-import','draft','Entrée canonique créée depuis le catalogue 2022',jsonb_build_object('sourcePage',5,'expectedCardCount',9,'historicalPriceDh',18),'UMZ1 migration')
on conflict (collection_id,version_label) do nothing;
insert into flashcards_os.collections (
  id,family_id,category_id,code,name,slug,legacy_domain,legacy_number,expected_card_count,structured_card_count,
  historical_price_dh,primary_format,status,lifecycle,readiness_score,age_min_months,age_max_months,languages,
  methodologies,primary_objective,audiences,usage_contexts,owner_name,source_page,source_label,legacy_issues,notes,current_version,metadata
) values (
  'fc-math-003','family-learning-cards','sub-math-foundations','FC-MATH-003','Types de lignes','types-de-lignes','MATH','3',
  17,0,34,'flashcards','needs_structuring','legacy_intake',36,
  36,144,array['fr']::text[],array['Montessori','Freinet','Steiner-Waldorf']::text[],'À structurer depuis le contenu source complet; le catalogue 2022 fournit le titre, la quantité et le prix historique, mais pas le registre carte par carte.',array['B2C Familles','B2B Écoles & crèches']::text[],
  array['Maison','Classe','Atelier éducatif']::text[],'Direction Produit',5,'NEW VERSION OF CATALOGUE FC 2022','[]'::jsonb,'','0.1-legacy-import',
  '{"seed": "catalogue-2022-u1", "sourcePage": 5}'::jsonb
) on conflict (id) do update set
  category_id=excluded.category_id,code=excluded.code,name=excluded.name,slug=excluded.slug,legacy_domain=excluded.legacy_domain,
  legacy_number=excluded.legacy_number,expected_card_count=excluded.expected_card_count,historical_price_dh=excluded.historical_price_dh,
  primary_format=excluded.primary_format,status=excluded.status,lifecycle=excluded.lifecycle,readiness_score=excluded.readiness_score,
  age_min_months=excluded.age_min_months,age_max_months=excluded.age_max_months,languages=excluded.languages,methodologies=excluded.methodologies,
  primary_objective=excluded.primary_objective,audiences=excluded.audiences,usage_contexts=excluded.usage_contexts,owner_name=excluded.owner_name,
  source_page=excluded.source_page,source_label=excluded.source_label,legacy_issues=excluded.legacy_issues,notes=excluded.notes,current_version=excluded.current_version,
  metadata=excluded.metadata,updated_at=now();

insert into flashcards_os.editions (collection_id,language_code,edition_key,version_label,status,metadata)
values ('fc-math-003','fr','standard','0.1-legacy-import','legacy_intake','{"seed":"catalogue-2022-u1"}'::jsonb)
on conflict (collection_id,language_code,edition_key) do nothing;

insert into flashcards_os.formats (collection_id,format_key,status,specification)
values ('fc-math-003','flashcards','legacy_intake','{"source":"catalogue-2022","specificationStatus":"not-supplied"}'::jsonb)
on conflict (collection_id,format_key) do nothing;

insert into flashcards_os.collection_versions (collection_id,version_label,status,change_summary,content_snapshot,created_by)
values ('fc-math-003','0.1-legacy-import','draft','Entrée canonique créée depuis le catalogue 2022',jsonb_build_object('sourcePage',5,'expectedCardCount',17,'historicalPriceDh',34),'UMZ1 migration')
on conflict (collection_id,version_label) do nothing;
insert into flashcards_os.collections (
  id,family_id,category_id,code,name,slug,legacy_domain,legacy_number,expected_card_count,structured_card_count,
  historical_price_dh,primary_format,status,lifecycle,readiness_score,age_min_months,age_max_months,languages,
  methodologies,primary_objective,audiences,usage_contexts,owner_name,source_page,source_label,legacy_issues,notes,current_version,metadata
) values (
  'fc-math-004','family-learning-cards','sub-math-materials','FC-MATH-004','Planche des chiffres 1 à 100 (A3)','planche-des-chiffres-1-a-100-a3','MATH','4',
  5,0,48,'a3_board','needs_structuring','legacy_intake',36,
  36,144,array['fr']::text[],array['Montessori','Freinet','Steiner-Waldorf']::text[],'À structurer depuis le contenu source complet; le catalogue 2022 fournit le titre, la quantité et le prix historique, mais pas le registre carte par carte.',array['B2C Familles','B2B Écoles & crèches']::text[],
  array['Maison','Classe','Atelier éducatif']::text[],'Direction Produit',5,'NEW VERSION OF CATALOGUE FC 2022','[]'::jsonb,'','0.1-legacy-import',
  '{"seed": "catalogue-2022-u1", "sourcePage": 5}'::jsonb
) on conflict (id) do update set
  category_id=excluded.category_id,code=excluded.code,name=excluded.name,slug=excluded.slug,legacy_domain=excluded.legacy_domain,
  legacy_number=excluded.legacy_number,expected_card_count=excluded.expected_card_count,historical_price_dh=excluded.historical_price_dh,
  primary_format=excluded.primary_format,status=excluded.status,lifecycle=excluded.lifecycle,readiness_score=excluded.readiness_score,
  age_min_months=excluded.age_min_months,age_max_months=excluded.age_max_months,languages=excluded.languages,methodologies=excluded.methodologies,
  primary_objective=excluded.primary_objective,audiences=excluded.audiences,usage_contexts=excluded.usage_contexts,owner_name=excluded.owner_name,
  source_page=excluded.source_page,source_label=excluded.source_label,legacy_issues=excluded.legacy_issues,notes=excluded.notes,current_version=excluded.current_version,
  metadata=excluded.metadata,updated_at=now();

insert into flashcards_os.editions (collection_id,language_code,edition_key,version_label,status,metadata)
values ('fc-math-004','fr','standard','0.1-legacy-import','legacy_intake','{"seed":"catalogue-2022-u1"}'::jsonb)
on conflict (collection_id,language_code,edition_key) do nothing;

insert into flashcards_os.formats (collection_id,format_key,status,specification)
values ('fc-math-004','a3_board','legacy_intake','{"source":"catalogue-2022","specificationStatus":"not-supplied"}'::jsonb)
on conflict (collection_id,format_key) do nothing;

insert into flashcards_os.collection_versions (collection_id,version_label,status,change_summary,content_snapshot,created_by)
values ('fc-math-004','0.1-legacy-import','draft','Entrée canonique créée depuis le catalogue 2022',jsonb_build_object('sourcePage',5,'expectedCardCount',5,'historicalPriceDh',48),'UMZ1 migration')
on conflict (collection_id,version_label) do nothing;
insert into flashcards_os.collections (
  id,family_id,category_id,code,name,slug,legacy_domain,legacy_number,expected_card_count,structured_card_count,
  historical_price_dh,primary_format,status,lifecycle,readiness_score,age_min_months,age_max_months,languages,
  methodologies,primary_objective,audiences,usage_contexts,owner_name,source_page,source_label,legacy_issues,notes,current_version,metadata
) values (
  'fc-math-005','family-learning-cards','sub-math-materials','FC-MATH-005','Puzzle des chiffres pairs 2 à 20','puzzle-des-chiffres-pairs-2-a-20','MATH','5',
  null,0,15,'puzzle','needs_review','legacy_intake',28,
  36,144,array['fr']::text[],array['Montessori','Freinet','Steiner-Waldorf']::text[],'À structurer depuis le contenu source complet; le catalogue 2022 fournit le titre, la quantité et le prix historique, mais pas le registre carte par carte.',array['B2C Familles','B2B Écoles & crèches']::text[],
  array['Maison','Classe','Atelier éducatif']::text[],'Direction Produit',5,'NEW VERSION OF CATALOGUE FC 2022','["missing_card_count"]'::jsonb,'','0.1-legacy-import',
  '{"seed": "catalogue-2022-u1", "sourcePage": 5}'::jsonb
) on conflict (id) do update set
  category_id=excluded.category_id,code=excluded.code,name=excluded.name,slug=excluded.slug,legacy_domain=excluded.legacy_domain,
  legacy_number=excluded.legacy_number,expected_card_count=excluded.expected_card_count,historical_price_dh=excluded.historical_price_dh,
  primary_format=excluded.primary_format,status=excluded.status,lifecycle=excluded.lifecycle,readiness_score=excluded.readiness_score,
  age_min_months=excluded.age_min_months,age_max_months=excluded.age_max_months,languages=excluded.languages,methodologies=excluded.methodologies,
  primary_objective=excluded.primary_objective,audiences=excluded.audiences,usage_contexts=excluded.usage_contexts,owner_name=excluded.owner_name,
  source_page=excluded.source_page,source_label=excluded.source_label,legacy_issues=excluded.legacy_issues,notes=excluded.notes,current_version=excluded.current_version,
  metadata=excluded.metadata,updated_at=now();

insert into flashcards_os.editions (collection_id,language_code,edition_key,version_label,status,metadata)
values ('fc-math-005','fr','standard','0.1-legacy-import','legacy_intake','{"seed":"catalogue-2022-u1"}'::jsonb)
on conflict (collection_id,language_code,edition_key) do nothing;

insert into flashcards_os.formats (collection_id,format_key,status,specification)
values ('fc-math-005','puzzle','legacy_intake','{"source":"catalogue-2022","specificationStatus":"not-supplied"}'::jsonb)
on conflict (collection_id,format_key) do nothing;

insert into flashcards_os.collection_versions (collection_id,version_label,status,change_summary,content_snapshot,created_by)
values ('fc-math-005','0.1-legacy-import','draft','Entrée canonique créée depuis le catalogue 2022',jsonb_build_object('sourcePage',5,'expectedCardCount',null,'historicalPriceDh',15),'UMZ1 migration')
on conflict (collection_id,version_label) do nothing;
insert into flashcards_os.collections (
  id,family_id,category_id,code,name,slug,legacy_domain,legacy_number,expected_card_count,structured_card_count,
  historical_price_dh,primary_format,status,lifecycle,readiness_score,age_min_months,age_max_months,languages,
  methodologies,primary_objective,audiences,usage_contexts,owner_name,source_page,source_label,legacy_issues,notes,current_version,metadata
) values (
  'fc-math-006','family-learning-cards','sub-math-materials','FC-MATH-006','Puzzle des chiffres impairs 1 à 19','puzzle-des-chiffres-impairs-1-a-19','MATH','6',
  null,0,15,'puzzle','needs_review','legacy_intake',28,
  36,144,array['fr']::text[],array['Montessori','Freinet','Steiner-Waldorf']::text[],'À structurer depuis le contenu source complet; le catalogue 2022 fournit le titre, la quantité et le prix historique, mais pas le registre carte par carte.',array['B2C Familles','B2B Écoles & crèches']::text[],
  array['Maison','Classe','Atelier éducatif']::text[],'Direction Produit',5,'NEW VERSION OF CATALOGUE FC 2022','["missing_card_count"]'::jsonb,'','0.1-legacy-import',
  '{"seed": "catalogue-2022-u1", "sourcePage": 5}'::jsonb
) on conflict (id) do update set
  category_id=excluded.category_id,code=excluded.code,name=excluded.name,slug=excluded.slug,legacy_domain=excluded.legacy_domain,
  legacy_number=excluded.legacy_number,expected_card_count=excluded.expected_card_count,historical_price_dh=excluded.historical_price_dh,
  primary_format=excluded.primary_format,status=excluded.status,lifecycle=excluded.lifecycle,readiness_score=excluded.readiness_score,
  age_min_months=excluded.age_min_months,age_max_months=excluded.age_max_months,languages=excluded.languages,methodologies=excluded.methodologies,
  primary_objective=excluded.primary_objective,audiences=excluded.audiences,usage_contexts=excluded.usage_contexts,owner_name=excluded.owner_name,
  source_page=excluded.source_page,source_label=excluded.source_label,legacy_issues=excluded.legacy_issues,notes=excluded.notes,current_version=excluded.current_version,
  metadata=excluded.metadata,updated_at=now();

insert into flashcards_os.editions (collection_id,language_code,edition_key,version_label,status,metadata)
values ('fc-math-006','fr','standard','0.1-legacy-import','legacy_intake','{"seed":"catalogue-2022-u1"}'::jsonb)
on conflict (collection_id,language_code,edition_key) do nothing;

insert into flashcards_os.formats (collection_id,format_key,status,specification)
values ('fc-math-006','puzzle','legacy_intake','{"source":"catalogue-2022","specificationStatus":"not-supplied"}'::jsonb)
on conflict (collection_id,format_key) do nothing;

insert into flashcards_os.collection_versions (collection_id,version_label,status,change_summary,content_snapshot,created_by)
values ('fc-math-006','0.1-legacy-import','draft','Entrée canonique créée depuis le catalogue 2022',jsonb_build_object('sourcePage',5,'expectedCardCount',null,'historicalPriceDh',15),'UMZ1 migration')
on conflict (collection_id,version_label) do nothing;
insert into flashcards_os.collections (
  id,family_id,category_id,code,name,slug,legacy_domain,legacy_number,expected_card_count,structured_card_count,
  historical_price_dh,primary_format,status,lifecycle,readiness_score,age_min_months,age_max_months,languages,
  methodologies,primary_objective,audiences,usage_contexts,owner_name,source_page,source_label,legacy_issues,notes,current_version,metadata
) values (
  'fc-math-007','family-learning-cards','sub-math-materials','FC-MATH-007','Puzzle des chiffres ascendants 1 à 10','puzzle-des-chiffres-ascendants-1-a-10','MATH','7',
  null,0,15,'puzzle','needs_review','legacy_intake',28,
  36,144,array['fr']::text[],array['Montessori','Freinet','Steiner-Waldorf']::text[],'À structurer depuis le contenu source complet; le catalogue 2022 fournit le titre, la quantité et le prix historique, mais pas le registre carte par carte.',array['B2C Familles','B2B Écoles & crèches']::text[],
  array['Maison','Classe','Atelier éducatif']::text[],'Direction Produit',5,'NEW VERSION OF CATALOGUE FC 2022','["missing_card_count"]'::jsonb,'','0.1-legacy-import',
  '{"seed": "catalogue-2022-u1", "sourcePage": 5}'::jsonb
) on conflict (id) do update set
  category_id=excluded.category_id,code=excluded.code,name=excluded.name,slug=excluded.slug,legacy_domain=excluded.legacy_domain,
  legacy_number=excluded.legacy_number,expected_card_count=excluded.expected_card_count,historical_price_dh=excluded.historical_price_dh,
  primary_format=excluded.primary_format,status=excluded.status,lifecycle=excluded.lifecycle,readiness_score=excluded.readiness_score,
  age_min_months=excluded.age_min_months,age_max_months=excluded.age_max_months,languages=excluded.languages,methodologies=excluded.methodologies,
  primary_objective=excluded.primary_objective,audiences=excluded.audiences,usage_contexts=excluded.usage_contexts,owner_name=excluded.owner_name,
  source_page=excluded.source_page,source_label=excluded.source_label,legacy_issues=excluded.legacy_issues,notes=excluded.notes,current_version=excluded.current_version,
  metadata=excluded.metadata,updated_at=now();

insert into flashcards_os.editions (collection_id,language_code,edition_key,version_label,status,metadata)
values ('fc-math-007','fr','standard','0.1-legacy-import','legacy_intake','{"seed":"catalogue-2022-u1"}'::jsonb)
on conflict (collection_id,language_code,edition_key) do nothing;

insert into flashcards_os.formats (collection_id,format_key,status,specification)
values ('fc-math-007','puzzle','legacy_intake','{"source":"catalogue-2022","specificationStatus":"not-supplied"}'::jsonb)
on conflict (collection_id,format_key) do nothing;

insert into flashcards_os.collection_versions (collection_id,version_label,status,change_summary,content_snapshot,created_by)
values ('fc-math-007','0.1-legacy-import','draft','Entrée canonique créée depuis le catalogue 2022',jsonb_build_object('sourcePage',5,'expectedCardCount',null,'historicalPriceDh',15),'UMZ1 migration')
on conflict (collection_id,version_label) do nothing;
insert into flashcards_os.collections (
  id,family_id,category_id,code,name,slug,legacy_domain,legacy_number,expected_card_count,structured_card_count,
  historical_price_dh,primary_format,status,lifecycle,readiness_score,age_min_months,age_max_months,languages,
  methodologies,primary_objective,audiences,usage_contexts,owner_name,source_page,source_label,legacy_issues,notes,current_version,metadata
) values (
  'fc-math-008','family-learning-cards','sub-math-materials','FC-MATH-008','Puzzle des chiffres ascendants 11 à 20','puzzle-des-chiffres-ascendants-11-a-20','MATH','8',
  null,0,15,'puzzle','needs_review','legacy_intake',28,
  36,144,array['fr']::text[],array['Montessori','Freinet','Steiner-Waldorf']::text[],'À structurer depuis le contenu source complet; le catalogue 2022 fournit le titre, la quantité et le prix historique, mais pas le registre carte par carte.',array['B2C Familles','B2B Écoles & crèches']::text[],
  array['Maison','Classe','Atelier éducatif']::text[],'Direction Produit',5,'NEW VERSION OF CATALOGUE FC 2022','["missing_card_count"]'::jsonb,'','0.1-legacy-import',
  '{"seed": "catalogue-2022-u1", "sourcePage": 5}'::jsonb
) on conflict (id) do update set
  category_id=excluded.category_id,code=excluded.code,name=excluded.name,slug=excluded.slug,legacy_domain=excluded.legacy_domain,
  legacy_number=excluded.legacy_number,expected_card_count=excluded.expected_card_count,historical_price_dh=excluded.historical_price_dh,
  primary_format=excluded.primary_format,status=excluded.status,lifecycle=excluded.lifecycle,readiness_score=excluded.readiness_score,
  age_min_months=excluded.age_min_months,age_max_months=excluded.age_max_months,languages=excluded.languages,methodologies=excluded.methodologies,
  primary_objective=excluded.primary_objective,audiences=excluded.audiences,usage_contexts=excluded.usage_contexts,owner_name=excluded.owner_name,
  source_page=excluded.source_page,source_label=excluded.source_label,legacy_issues=excluded.legacy_issues,notes=excluded.notes,current_version=excluded.current_version,
  metadata=excluded.metadata,updated_at=now();

insert into flashcards_os.editions (collection_id,language_code,edition_key,version_label,status,metadata)
values ('fc-math-008','fr','standard','0.1-legacy-import','legacy_intake','{"seed":"catalogue-2022-u1"}'::jsonb)
on conflict (collection_id,language_code,edition_key) do nothing;

insert into flashcards_os.formats (collection_id,format_key,status,specification)
values ('fc-math-008','puzzle','legacy_intake','{"source":"catalogue-2022","specificationStatus":"not-supplied"}'::jsonb)
on conflict (collection_id,format_key) do nothing;

insert into flashcards_os.collection_versions (collection_id,version_label,status,change_summary,content_snapshot,created_by)
values ('fc-math-008','0.1-legacy-import','draft','Entrée canonique créée depuis le catalogue 2022',jsonb_build_object('sourcePage',5,'expectedCardCount',null,'historicalPriceDh',15),'UMZ1 migration')
on conflict (collection_id,version_label) do nothing;
insert into flashcards_os.collections (
  id,family_id,category_id,code,name,slug,legacy_domain,legacy_number,expected_card_count,structured_card_count,
  historical_price_dh,primary_format,status,lifecycle,readiness_score,age_min_months,age_max_months,languages,
  methodologies,primary_objective,audiences,usage_contexts,owner_name,source_page,source_label,legacy_issues,notes,current_version,metadata
) values (
  'fc-math-009','family-learning-cards','sub-math-materials','FC-MATH-009','Puzzle des chiffres ascendants 21 à 30','puzzle-des-chiffres-ascendants-21-a-30','MATH','9',
  null,0,15,'puzzle','needs_review','legacy_intake',28,
  36,144,array['fr']::text[],array['Montessori','Freinet','Steiner-Waldorf']::text[],'À structurer depuis le contenu source complet; le catalogue 2022 fournit le titre, la quantité et le prix historique, mais pas le registre carte par carte.',array['B2C Familles','B2B Écoles & crèches']::text[],
  array['Maison','Classe','Atelier éducatif']::text[],'Direction Produit',5,'NEW VERSION OF CATALOGUE FC 2022','["missing_card_count"]'::jsonb,'','0.1-legacy-import',
  '{"seed": "catalogue-2022-u1", "sourcePage": 5}'::jsonb
) on conflict (id) do update set
  category_id=excluded.category_id,code=excluded.code,name=excluded.name,slug=excluded.slug,legacy_domain=excluded.legacy_domain,
  legacy_number=excluded.legacy_number,expected_card_count=excluded.expected_card_count,historical_price_dh=excluded.historical_price_dh,
  primary_format=excluded.primary_format,status=excluded.status,lifecycle=excluded.lifecycle,readiness_score=excluded.readiness_score,
  age_min_months=excluded.age_min_months,age_max_months=excluded.age_max_months,languages=excluded.languages,methodologies=excluded.methodologies,
  primary_objective=excluded.primary_objective,audiences=excluded.audiences,usage_contexts=excluded.usage_contexts,owner_name=excluded.owner_name,
  source_page=excluded.source_page,source_label=excluded.source_label,legacy_issues=excluded.legacy_issues,notes=excluded.notes,current_version=excluded.current_version,
  metadata=excluded.metadata,updated_at=now();

insert into flashcards_os.editions (collection_id,language_code,edition_key,version_label,status,metadata)
values ('fc-math-009','fr','standard','0.1-legacy-import','legacy_intake','{"seed":"catalogue-2022-u1"}'::jsonb)
on conflict (collection_id,language_code,edition_key) do nothing;

insert into flashcards_os.formats (collection_id,format_key,status,specification)
values ('fc-math-009','puzzle','legacy_intake','{"source":"catalogue-2022","specificationStatus":"not-supplied"}'::jsonb)
on conflict (collection_id,format_key) do nothing;

insert into flashcards_os.collection_versions (collection_id,version_label,status,change_summary,content_snapshot,created_by)
values ('fc-math-009','0.1-legacy-import','draft','Entrée canonique créée depuis le catalogue 2022',jsonb_build_object('sourcePage',5,'expectedCardCount',null,'historicalPriceDh',15),'UMZ1 migration')
on conflict (collection_id,version_label) do nothing;
insert into flashcards_os.collections (
  id,family_id,category_id,code,name,slug,legacy_domain,legacy_number,expected_card_count,structured_card_count,
  historical_price_dh,primary_format,status,lifecycle,readiness_score,age_min_months,age_max_months,languages,
  methodologies,primary_objective,audiences,usage_contexts,owner_name,source_page,source_label,legacy_issues,notes,current_version,metadata
) values (
  'fc-math-010','family-learning-cards','sub-math-materials','FC-MATH-010','Puzzle des chiffres ascendants 5 à 50 (+5)','puzzle-des-chiffres-ascendants-5-a-50-5','MATH','10',
  null,0,15,'puzzle','needs_review','legacy_intake',28,
  36,144,array['fr']::text[],array['Montessori','Freinet','Steiner-Waldorf']::text[],'À structurer depuis le contenu source complet; le catalogue 2022 fournit le titre, la quantité et le prix historique, mais pas le registre carte par carte.',array['B2C Familles','B2B Écoles & crèches']::text[],
  array['Maison','Classe','Atelier éducatif']::text[],'Direction Produit',5,'NEW VERSION OF CATALOGUE FC 2022','["missing_card_count"]'::jsonb,'','0.1-legacy-import',
  '{"seed": "catalogue-2022-u1", "sourcePage": 5}'::jsonb
) on conflict (id) do update set
  category_id=excluded.category_id,code=excluded.code,name=excluded.name,slug=excluded.slug,legacy_domain=excluded.legacy_domain,
  legacy_number=excluded.legacy_number,expected_card_count=excluded.expected_card_count,historical_price_dh=excluded.historical_price_dh,
  primary_format=excluded.primary_format,status=excluded.status,lifecycle=excluded.lifecycle,readiness_score=excluded.readiness_score,
  age_min_months=excluded.age_min_months,age_max_months=excluded.age_max_months,languages=excluded.languages,methodologies=excluded.methodologies,
  primary_objective=excluded.primary_objective,audiences=excluded.audiences,usage_contexts=excluded.usage_contexts,owner_name=excluded.owner_name,
  source_page=excluded.source_page,source_label=excluded.source_label,legacy_issues=excluded.legacy_issues,notes=excluded.notes,current_version=excluded.current_version,
  metadata=excluded.metadata,updated_at=now();

insert into flashcards_os.editions (collection_id,language_code,edition_key,version_label,status,metadata)
values ('fc-math-010','fr','standard','0.1-legacy-import','legacy_intake','{"seed":"catalogue-2022-u1"}'::jsonb)
on conflict (collection_id,language_code,edition_key) do nothing;

insert into flashcards_os.formats (collection_id,format_key,status,specification)
values ('fc-math-010','puzzle','legacy_intake','{"source":"catalogue-2022","specificationStatus":"not-supplied"}'::jsonb)
on conflict (collection_id,format_key) do nothing;

insert into flashcards_os.collection_versions (collection_id,version_label,status,change_summary,content_snapshot,created_by)
values ('fc-math-010','0.1-legacy-import','draft','Entrée canonique créée depuis le catalogue 2022',jsonb_build_object('sourcePage',5,'expectedCardCount',null,'historicalPriceDh',15),'UMZ1 migration')
on conflict (collection_id,version_label) do nothing;
insert into flashcards_os.collections (
  id,family_id,category_id,code,name,slug,legacy_domain,legacy_number,expected_card_count,structured_card_count,
  historical_price_dh,primary_format,status,lifecycle,readiness_score,age_min_months,age_max_months,languages,
  methodologies,primary_objective,audiences,usage_contexts,owner_name,source_page,source_label,legacy_issues,notes,current_version,metadata
) values (
  'fc-math-011','family-learning-cards','sub-math-materials','FC-MATH-011','Planche de Seguin 10','planche-de-seguin-10','MATH','11',
  null,0,25,'board','needs_review','legacy_intake',28,
  36,144,array['fr']::text[],array['Montessori','Freinet','Steiner-Waldorf']::text[],'À structurer depuis le contenu source complet; le catalogue 2022 fournit le titre, la quantité et le prix historique, mais pas le registre carte par carte.',array['B2C Familles','B2B Écoles & crèches']::text[],
  array['Maison','Classe','Atelier éducatif']::text[],'Direction Produit',5,'NEW VERSION OF CATALOGUE FC 2022','["missing_card_count"]'::jsonb,'','0.1-legacy-import',
  '{"seed": "catalogue-2022-u1", "sourcePage": 5}'::jsonb
) on conflict (id) do update set
  category_id=excluded.category_id,code=excluded.code,name=excluded.name,slug=excluded.slug,legacy_domain=excluded.legacy_domain,
  legacy_number=excluded.legacy_number,expected_card_count=excluded.expected_card_count,historical_price_dh=excluded.historical_price_dh,
  primary_format=excluded.primary_format,status=excluded.status,lifecycle=excluded.lifecycle,readiness_score=excluded.readiness_score,
  age_min_months=excluded.age_min_months,age_max_months=excluded.age_max_months,languages=excluded.languages,methodologies=excluded.methodologies,
  primary_objective=excluded.primary_objective,audiences=excluded.audiences,usage_contexts=excluded.usage_contexts,owner_name=excluded.owner_name,
  source_page=excluded.source_page,source_label=excluded.source_label,legacy_issues=excluded.legacy_issues,notes=excluded.notes,current_version=excluded.current_version,
  metadata=excluded.metadata,updated_at=now();

insert into flashcards_os.editions (collection_id,language_code,edition_key,version_label,status,metadata)
values ('fc-math-011','fr','standard','0.1-legacy-import','legacy_intake','{"seed":"catalogue-2022-u1"}'::jsonb)
on conflict (collection_id,language_code,edition_key) do nothing;

insert into flashcards_os.formats (collection_id,format_key,status,specification)
values ('fc-math-011','board','legacy_intake','{"source":"catalogue-2022","specificationStatus":"not-supplied"}'::jsonb)
on conflict (collection_id,format_key) do nothing;

insert into flashcards_os.collection_versions (collection_id,version_label,status,change_summary,content_snapshot,created_by)
values ('fc-math-011','0.1-legacy-import','draft','Entrée canonique créée depuis le catalogue 2022',jsonb_build_object('sourcePage',5,'expectedCardCount',null,'historicalPriceDh',25),'UMZ1 migration')
on conflict (collection_id,version_label) do nothing;
insert into flashcards_os.collections (
  id,family_id,category_id,code,name,slug,legacy_domain,legacy_number,expected_card_count,structured_card_count,
  historical_price_dh,primary_format,status,lifecycle,readiness_score,age_min_months,age_max_months,languages,
  methodologies,primary_objective,audiences,usage_contexts,owner_name,source_page,source_label,legacy_issues,notes,current_version,metadata
) values (
  'fc-math-012','family-learning-cards','sub-math-materials','FC-MATH-012','Planche de Seguin 20','planche-de-seguin-20','MATH','12',
  null,0,25,'board','needs_review','legacy_intake',28,
  36,144,array['fr']::text[],array['Montessori','Freinet','Steiner-Waldorf']::text[],'À structurer depuis le contenu source complet; le catalogue 2022 fournit le titre, la quantité et le prix historique, mais pas le registre carte par carte.',array['B2C Familles','B2B Écoles & crèches']::text[],
  array['Maison','Classe','Atelier éducatif']::text[],'Direction Produit',5,'NEW VERSION OF CATALOGUE FC 2022','["missing_card_count"]'::jsonb,'','0.1-legacy-import',
  '{"seed": "catalogue-2022-u1", "sourcePage": 5}'::jsonb
) on conflict (id) do update set
  category_id=excluded.category_id,code=excluded.code,name=excluded.name,slug=excluded.slug,legacy_domain=excluded.legacy_domain,
  legacy_number=excluded.legacy_number,expected_card_count=excluded.expected_card_count,historical_price_dh=excluded.historical_price_dh,
  primary_format=excluded.primary_format,status=excluded.status,lifecycle=excluded.lifecycle,readiness_score=excluded.readiness_score,
  age_min_months=excluded.age_min_months,age_max_months=excluded.age_max_months,languages=excluded.languages,methodologies=excluded.methodologies,
  primary_objective=excluded.primary_objective,audiences=excluded.audiences,usage_contexts=excluded.usage_contexts,owner_name=excluded.owner_name,
  source_page=excluded.source_page,source_label=excluded.source_label,legacy_issues=excluded.legacy_issues,notes=excluded.notes,current_version=excluded.current_version,
  metadata=excluded.metadata,updated_at=now();

insert into flashcards_os.editions (collection_id,language_code,edition_key,version_label,status,metadata)
values ('fc-math-012','fr','standard','0.1-legacy-import','legacy_intake','{"seed":"catalogue-2022-u1"}'::jsonb)
on conflict (collection_id,language_code,edition_key) do nothing;

insert into flashcards_os.formats (collection_id,format_key,status,specification)
values ('fc-math-012','board','legacy_intake','{"source":"catalogue-2022","specificationStatus":"not-supplied"}'::jsonb)
on conflict (collection_id,format_key) do nothing;

insert into flashcards_os.collection_versions (collection_id,version_label,status,change_summary,content_snapshot,created_by)
values ('fc-math-012','0.1-legacy-import','draft','Entrée canonique créée depuis le catalogue 2022',jsonb_build_object('sourcePage',5,'expectedCardCount',null,'historicalPriceDh',25),'UMZ1 migration')
on conflict (collection_id,version_label) do nothing;
insert into flashcards_os.collections (
  id,family_id,category_id,code,name,slug,legacy_domain,legacy_number,expected_card_count,structured_card_count,
  historical_price_dh,primary_format,status,lifecycle,readiness_score,age_min_months,age_max_months,languages,
  methodologies,primary_objective,audiences,usage_contexts,owner_name,source_page,source_label,legacy_issues,notes,current_version,metadata
) values (
  'fc-math-013','family-learning-cards','sub-math-materials','FC-MATH-013','Planche de Seguin 10–100','planche-de-seguin-10100','MATH','13',
  null,0,25,'board','needs_review','legacy_intake',28,
  36,144,array['fr']::text[],array['Montessori','Freinet','Steiner-Waldorf']::text[],'À structurer depuis le contenu source complet; le catalogue 2022 fournit le titre, la quantité et le prix historique, mais pas le registre carte par carte.',array['B2C Familles','B2B Écoles & crèches']::text[],
  array['Maison','Classe','Atelier éducatif']::text[],'Direction Produit',5,'NEW VERSION OF CATALOGUE FC 2022','["missing_card_count"]'::jsonb,'','0.1-legacy-import',
  '{"seed": "catalogue-2022-u1", "sourcePage": 5}'::jsonb
) on conflict (id) do update set
  category_id=excluded.category_id,code=excluded.code,name=excluded.name,slug=excluded.slug,legacy_domain=excluded.legacy_domain,
  legacy_number=excluded.legacy_number,expected_card_count=excluded.expected_card_count,historical_price_dh=excluded.historical_price_dh,
  primary_format=excluded.primary_format,status=excluded.status,lifecycle=excluded.lifecycle,readiness_score=excluded.readiness_score,
  age_min_months=excluded.age_min_months,age_max_months=excluded.age_max_months,languages=excluded.languages,methodologies=excluded.methodologies,
  primary_objective=excluded.primary_objective,audiences=excluded.audiences,usage_contexts=excluded.usage_contexts,owner_name=excluded.owner_name,
  source_page=excluded.source_page,source_label=excluded.source_label,legacy_issues=excluded.legacy_issues,notes=excluded.notes,current_version=excluded.current_version,
  metadata=excluded.metadata,updated_at=now();

insert into flashcards_os.editions (collection_id,language_code,edition_key,version_label,status,metadata)
values ('fc-math-013','fr','standard','0.1-legacy-import','legacy_intake','{"seed":"catalogue-2022-u1"}'::jsonb)
on conflict (collection_id,language_code,edition_key) do nothing;

insert into flashcards_os.formats (collection_id,format_key,status,specification)
values ('fc-math-013','board','legacy_intake','{"source":"catalogue-2022","specificationStatus":"not-supplied"}'::jsonb)
on conflict (collection_id,format_key) do nothing;

insert into flashcards_os.collection_versions (collection_id,version_label,status,change_summary,content_snapshot,created_by)
values ('fc-math-013','0.1-legacy-import','draft','Entrée canonique créée depuis le catalogue 2022',jsonb_build_object('sourcePage',5,'expectedCardCount',null,'historicalPriceDh',25),'UMZ1 migration')
on conflict (collection_id,version_label) do nothing;
insert into flashcards_os.collections (
  id,family_id,category_id,code,name,slug,legacy_domain,legacy_number,expected_card_count,structured_card_count,
  historical_price_dh,primary_format,status,lifecycle,readiness_score,age_min_months,age_max_months,languages,
  methodologies,primary_objective,audiences,usage_contexts,owner_name,source_page,source_label,legacy_issues,notes,current_version,metadata
) values (
  'fc-math-014','family-learning-cards','sub-math-materials','FC-MATH-014','Planche de traçage des chiffres 0 à 9','planche-de-tracage-des-chiffres-0-a-9','MATH','14',
  10,0,35,'tracing_board','needs_structuring','legacy_intake',36,
  36,144,array['fr']::text[],array['Montessori','Freinet','Steiner-Waldorf']::text[],'À structurer depuis le contenu source complet; le catalogue 2022 fournit le titre, la quantité et le prix historique, mais pas le registre carte par carte.',array['B2C Familles','B2B Écoles & crèches']::text[],
  array['Maison','Classe','Atelier éducatif']::text[],'Direction Produit',5,'NEW VERSION OF CATALOGUE FC 2022','[]'::jsonb,'','0.1-legacy-import',
  '{"seed": "catalogue-2022-u1", "sourcePage": 5}'::jsonb
) on conflict (id) do update set
  category_id=excluded.category_id,code=excluded.code,name=excluded.name,slug=excluded.slug,legacy_domain=excluded.legacy_domain,
  legacy_number=excluded.legacy_number,expected_card_count=excluded.expected_card_count,historical_price_dh=excluded.historical_price_dh,
  primary_format=excluded.primary_format,status=excluded.status,lifecycle=excluded.lifecycle,readiness_score=excluded.readiness_score,
  age_min_months=excluded.age_min_months,age_max_months=excluded.age_max_months,languages=excluded.languages,methodologies=excluded.methodologies,
  primary_objective=excluded.primary_objective,audiences=excluded.audiences,usage_contexts=excluded.usage_contexts,owner_name=excluded.owner_name,
  source_page=excluded.source_page,source_label=excluded.source_label,legacy_issues=excluded.legacy_issues,notes=excluded.notes,current_version=excluded.current_version,
  metadata=excluded.metadata,updated_at=now();

insert into flashcards_os.editions (collection_id,language_code,edition_key,version_label,status,metadata)
values ('fc-math-014','fr','standard','0.1-legacy-import','legacy_intake','{"seed":"catalogue-2022-u1"}'::jsonb)
on conflict (collection_id,language_code,edition_key) do nothing;

insert into flashcards_os.formats (collection_id,format_key,status,specification)
values ('fc-math-014','tracing_board','legacy_intake','{"source":"catalogue-2022","specificationStatus":"not-supplied"}'::jsonb)
on conflict (collection_id,format_key) do nothing;

insert into flashcards_os.collection_versions (collection_id,version_label,status,change_summary,content_snapshot,created_by)
values ('fc-math-014','0.1-legacy-import','draft','Entrée canonique créée depuis le catalogue 2022',jsonb_build_object('sourcePage',5,'expectedCardCount',10,'historicalPriceDh',35),'UMZ1 migration')
on conflict (collection_id,version_label) do nothing;
insert into flashcards_os.collections (
  id,family_id,category_id,code,name,slug,legacy_domain,legacy_number,expected_card_count,structured_card_count,
  historical_price_dh,primary_format,status,lifecycle,readiness_score,age_min_months,age_max_months,languages,
  methodologies,primary_objective,audiences,usage_contexts,owner_name,source_page,source_label,legacy_issues,notes,current_version,metadata
) values (
  'fc-math-015','family-learning-cards','sub-math-materials','FC-MATH-015','Planche de traçage — 7 types de lignes','planche-de-tracage-7-types-de-lignes','MATH','15',
  7,0,28,'tracing_board','needs_structuring','legacy_intake',36,
  36,144,array['fr']::text[],array['Montessori','Freinet','Steiner-Waldorf']::text[],'À structurer depuis le contenu source complet; le catalogue 2022 fournit le titre, la quantité et le prix historique, mais pas le registre carte par carte.',array['B2C Familles','B2B Écoles & crèches']::text[],
  array['Maison','Classe','Atelier éducatif']::text[],'Direction Produit',5,'NEW VERSION OF CATALOGUE FC 2022','[]'::jsonb,'','0.1-legacy-import',
  '{"seed": "catalogue-2022-u1", "sourcePage": 5}'::jsonb
) on conflict (id) do update set
  category_id=excluded.category_id,code=excluded.code,name=excluded.name,slug=excluded.slug,legacy_domain=excluded.legacy_domain,
  legacy_number=excluded.legacy_number,expected_card_count=excluded.expected_card_count,historical_price_dh=excluded.historical_price_dh,
  primary_format=excluded.primary_format,status=excluded.status,lifecycle=excluded.lifecycle,readiness_score=excluded.readiness_score,
  age_min_months=excluded.age_min_months,age_max_months=excluded.age_max_months,languages=excluded.languages,methodologies=excluded.methodologies,
  primary_objective=excluded.primary_objective,audiences=excluded.audiences,usage_contexts=excluded.usage_contexts,owner_name=excluded.owner_name,
  source_page=excluded.source_page,source_label=excluded.source_label,legacy_issues=excluded.legacy_issues,notes=excluded.notes,current_version=excluded.current_version,
  metadata=excluded.metadata,updated_at=now();

insert into flashcards_os.editions (collection_id,language_code,edition_key,version_label,status,metadata)
values ('fc-math-015','fr','standard','0.1-legacy-import','legacy_intake','{"seed":"catalogue-2022-u1"}'::jsonb)
on conflict (collection_id,language_code,edition_key) do nothing;

insert into flashcards_os.formats (collection_id,format_key,status,specification)
values ('fc-math-015','tracing_board','legacy_intake','{"source":"catalogue-2022","specificationStatus":"not-supplied"}'::jsonb)
on conflict (collection_id,format_key) do nothing;

insert into flashcards_os.collection_versions (collection_id,version_label,status,change_summary,content_snapshot,created_by)
values ('fc-math-015','0.1-legacy-import','draft','Entrée canonique créée depuis le catalogue 2022',jsonb_build_object('sourcePage',5,'expectedCardCount',7,'historicalPriceDh',28),'UMZ1 migration')
on conflict (collection_id,version_label) do nothing;
insert into flashcards_os.collections (
  id,family_id,category_id,code,name,slug,legacy_domain,legacy_number,expected_card_count,structured_card_count,
  historical_price_dh,primary_format,status,lifecycle,readiness_score,age_min_months,age_max_months,languages,
  methodologies,primary_objective,audiences,usage_contexts,owner_name,source_page,source_label,legacy_issues,notes,current_version,metadata
) values (
  'fc-math-016','family-learning-cards','sub-math-foundations','FC-MATH-016','Apprendre à compter : nombres, symboles et quantités 1 à 20','apprendre-a-compter-nombres-symboles-et-quantites-1-a-20','MATH','16',
  20,0,32,'flashcards','needs_structuring','legacy_intake',36,
  36,144,array['fr']::text[],array['Montessori','Freinet','Steiner-Waldorf']::text[],'À structurer depuis le contenu source complet; le catalogue 2022 fournit le titre, la quantité et le prix historique, mais pas le registre carte par carte.',array['B2C Familles','B2B Écoles & crèches']::text[],
  array['Maison','Classe','Atelier éducatif']::text[],'Direction Produit',5,'NEW VERSION OF CATALOGUE FC 2022','[]'::jsonb,'','0.1-legacy-import',
  '{"seed": "catalogue-2022-u1", "sourcePage": 5}'::jsonb
) on conflict (id) do update set
  category_id=excluded.category_id,code=excluded.code,name=excluded.name,slug=excluded.slug,legacy_domain=excluded.legacy_domain,
  legacy_number=excluded.legacy_number,expected_card_count=excluded.expected_card_count,historical_price_dh=excluded.historical_price_dh,
  primary_format=excluded.primary_format,status=excluded.status,lifecycle=excluded.lifecycle,readiness_score=excluded.readiness_score,
  age_min_months=excluded.age_min_months,age_max_months=excluded.age_max_months,languages=excluded.languages,methodologies=excluded.methodologies,
  primary_objective=excluded.primary_objective,audiences=excluded.audiences,usage_contexts=excluded.usage_contexts,owner_name=excluded.owner_name,
  source_page=excluded.source_page,source_label=excluded.source_label,legacy_issues=excluded.legacy_issues,notes=excluded.notes,current_version=excluded.current_version,
  metadata=excluded.metadata,updated_at=now();

insert into flashcards_os.editions (collection_id,language_code,edition_key,version_label,status,metadata)
values ('fc-math-016','fr','standard','0.1-legacy-import','legacy_intake','{"seed":"catalogue-2022-u1"}'::jsonb)
on conflict (collection_id,language_code,edition_key) do nothing;

insert into flashcards_os.formats (collection_id,format_key,status,specification)
values ('fc-math-016','flashcards','legacy_intake','{"source":"catalogue-2022","specificationStatus":"not-supplied"}'::jsonb)
on conflict (collection_id,format_key) do nothing;

insert into flashcards_os.collection_versions (collection_id,version_label,status,change_summary,content_snapshot,created_by)
values ('fc-math-016','0.1-legacy-import','draft','Entrée canonique créée depuis le catalogue 2022',jsonb_build_object('sourcePage',5,'expectedCardCount',20,'historicalPriceDh',32),'UMZ1 migration')
on conflict (collection_id,version_label) do nothing;
insert into flashcards_os.collections (
  id,family_id,category_id,code,name,slug,legacy_domain,legacy_number,expected_card_count,structured_card_count,
  historical_price_dh,primary_format,status,lifecycle,readiness_score,age_min_months,age_max_months,languages,
  methodologies,primary_objective,audiences,usage_contexts,owner_name,source_page,source_label,legacy_issues,notes,current_version,metadata
) values (
  'fc-math-017','family-learning-cards','sub-math-materials','FC-MATH-017','Planche de traçage — 7 types de lignes','planche-de-tracage-7-types-de-lignes','MATH','17',
  7,0,28,'tracing_board','needs_review','legacy_intake',28,
  36,144,array['fr']::text[],array['Montessori','Freinet','Steiner-Waldorf']::text[],'À structurer depuis le contenu source complet; le catalogue 2022 fournit le titre, la quantité et le prix historique, mais pas le registre carte par carte.',array['B2C Familles','B2B Écoles & crèches']::text[],
  array['Maison','Classe','Atelier éducatif']::text[],'Direction Produit',5,'NEW VERSION OF CATALOGUE FC 2022','["duplicate_name", "duplicate_source_line"]'::jsonb,'','0.1-legacy-import',
  '{"seed": "catalogue-2022-u1", "sourcePage": 5}'::jsonb
) on conflict (id) do update set
  category_id=excluded.category_id,code=excluded.code,name=excluded.name,slug=excluded.slug,legacy_domain=excluded.legacy_domain,
  legacy_number=excluded.legacy_number,expected_card_count=excluded.expected_card_count,historical_price_dh=excluded.historical_price_dh,
  primary_format=excluded.primary_format,status=excluded.status,lifecycle=excluded.lifecycle,readiness_score=excluded.readiness_score,
  age_min_months=excluded.age_min_months,age_max_months=excluded.age_max_months,languages=excluded.languages,methodologies=excluded.methodologies,
  primary_objective=excluded.primary_objective,audiences=excluded.audiences,usage_contexts=excluded.usage_contexts,owner_name=excluded.owner_name,
  source_page=excluded.source_page,source_label=excluded.source_label,legacy_issues=excluded.legacy_issues,notes=excluded.notes,current_version=excluded.current_version,
  metadata=excluded.metadata,updated_at=now();

insert into flashcards_os.editions (collection_id,language_code,edition_key,version_label,status,metadata)
values ('fc-math-017','fr','standard','0.1-legacy-import','legacy_intake','{"seed":"catalogue-2022-u1"}'::jsonb)
on conflict (collection_id,language_code,edition_key) do nothing;

insert into flashcards_os.formats (collection_id,format_key,status,specification)
values ('fc-math-017','tracing_board','legacy_intake','{"source":"catalogue-2022","specificationStatus":"not-supplied"}'::jsonb)
on conflict (collection_id,format_key) do nothing;

insert into flashcards_os.collection_versions (collection_id,version_label,status,change_summary,content_snapshot,created_by)
values ('fc-math-017','0.1-legacy-import','draft','Entrée canonique créée depuis le catalogue 2022',jsonb_build_object('sourcePage',5,'expectedCardCount',7,'historicalPriceDh',28),'UMZ1 migration')
on conflict (collection_id,version_label) do nothing;
insert into flashcards_os.collections (
  id,family_id,category_id,code,name,slug,legacy_domain,legacy_number,expected_card_count,structured_card_count,
  historical_price_dh,primary_format,status,lifecycle,readiness_score,age_min_months,age_max_months,languages,
  methodologies,primary_objective,audiences,usage_contexts,owner_name,source_page,source_label,legacy_issues,notes,current_version,metadata
) values (
  'fc-math-018','family-learning-cards','sub-math-materials','FC-MATH-018','Planche nombres, symboles + quantités à remplir avec jetons (A3)','planche-nombres-symboles-quantites-a-remplir-avec-jetons-a3','MATH','18',
  5,0,48,'a3_board','needs_review','legacy_intake',28,
  36,144,array['fr']::text[],array['Montessori','Freinet','Steiner-Waldorf']::text[],'À structurer depuis le contenu source complet; le catalogue 2022 fournit le titre, la quantité et le prix historique, mais pas le registre carte par carte.',array['B2C Familles','B2B Écoles & crèches']::text[],
  array['Maison','Classe','Atelier éducatif']::text[],'Direction Produit',5,'NEW VERSION OF CATALOGUE FC 2022','["legacy_numbering_gap"]'::jsonb,'','0.1-legacy-import',
  '{"seed": "catalogue-2022-u1", "sourcePage": 5}'::jsonb
) on conflict (id) do update set
  category_id=excluded.category_id,code=excluded.code,name=excluded.name,slug=excluded.slug,legacy_domain=excluded.legacy_domain,
  legacy_number=excluded.legacy_number,expected_card_count=excluded.expected_card_count,historical_price_dh=excluded.historical_price_dh,
  primary_format=excluded.primary_format,status=excluded.status,lifecycle=excluded.lifecycle,readiness_score=excluded.readiness_score,
  age_min_months=excluded.age_min_months,age_max_months=excluded.age_max_months,languages=excluded.languages,methodologies=excluded.methodologies,
  primary_objective=excluded.primary_objective,audiences=excluded.audiences,usage_contexts=excluded.usage_contexts,owner_name=excluded.owner_name,
  source_page=excluded.source_page,source_label=excluded.source_label,legacy_issues=excluded.legacy_issues,notes=excluded.notes,current_version=excluded.current_version,
  metadata=excluded.metadata,updated_at=now();

insert into flashcards_os.editions (collection_id,language_code,edition_key,version_label,status,metadata)
values ('fc-math-018','fr','standard','0.1-legacy-import','legacy_intake','{"seed":"catalogue-2022-u1"}'::jsonb)
on conflict (collection_id,language_code,edition_key) do nothing;

insert into flashcards_os.formats (collection_id,format_key,status,specification)
values ('fc-math-018','a3_board','legacy_intake','{"source":"catalogue-2022","specificationStatus":"not-supplied"}'::jsonb)
on conflict (collection_id,format_key) do nothing;

insert into flashcards_os.collection_versions (collection_id,version_label,status,change_summary,content_snapshot,created_by)
values ('fc-math-018','0.1-legacy-import','draft','Entrée canonique créée depuis le catalogue 2022',jsonb_build_object('sourcePage',5,'expectedCardCount',5,'historicalPriceDh',48),'UMZ1 migration')
on conflict (collection_id,version_label) do nothing;
insert into flashcards_os.collections (
  id,family_id,category_id,code,name,slug,legacy_domain,legacy_number,expected_card_count,structured_card_count,
  historical_price_dh,primary_format,status,lifecycle,readiness_score,age_min_months,age_max_months,languages,
  methodologies,primary_objective,audiences,usage_contexts,owner_name,source_page,source_label,legacy_issues,notes,current_version,metadata
) values (
  'fc-zoo-001','family-learning-cards','sub-nature-regions','FC-ZOO-001','Animaux d’Afrique','animaux-dafrique','ZOO','1',
  15,0,30,'flashcards','needs_structuring','legacy_intake',36,
  36,144,array['fr']::text[],array['Montessori','Freinet','Steiner-Waldorf']::text[],'À structurer depuis le contenu source complet; le catalogue 2022 fournit le titre, la quantité et le prix historique, mais pas le registre carte par carte.',array['B2C Familles','B2B Écoles & crèches']::text[],
  array['Maison','Classe','Atelier éducatif']::text[],'Direction Produit',6,'NEW VERSION OF CATALOGUE FC 2022','[]'::jsonb,'','0.1-legacy-import',
  '{"seed": "catalogue-2022-u1", "sourcePage": 6}'::jsonb
) on conflict (id) do update set
  category_id=excluded.category_id,code=excluded.code,name=excluded.name,slug=excluded.slug,legacy_domain=excluded.legacy_domain,
  legacy_number=excluded.legacy_number,expected_card_count=excluded.expected_card_count,historical_price_dh=excluded.historical_price_dh,
  primary_format=excluded.primary_format,status=excluded.status,lifecycle=excluded.lifecycle,readiness_score=excluded.readiness_score,
  age_min_months=excluded.age_min_months,age_max_months=excluded.age_max_months,languages=excluded.languages,methodologies=excluded.methodologies,
  primary_objective=excluded.primary_objective,audiences=excluded.audiences,usage_contexts=excluded.usage_contexts,owner_name=excluded.owner_name,
  source_page=excluded.source_page,source_label=excluded.source_label,legacy_issues=excluded.legacy_issues,notes=excluded.notes,current_version=excluded.current_version,
  metadata=excluded.metadata,updated_at=now();

insert into flashcards_os.editions (collection_id,language_code,edition_key,version_label,status,metadata)
values ('fc-zoo-001','fr','standard','0.1-legacy-import','legacy_intake','{"seed":"catalogue-2022-u1"}'::jsonb)
on conflict (collection_id,language_code,edition_key) do nothing;

insert into flashcards_os.formats (collection_id,format_key,status,specification)
values ('fc-zoo-001','flashcards','legacy_intake','{"source":"catalogue-2022","specificationStatus":"not-supplied"}'::jsonb)
on conflict (collection_id,format_key) do nothing;

insert into flashcards_os.collection_versions (collection_id,version_label,status,change_summary,content_snapshot,created_by)
values ('fc-zoo-001','0.1-legacy-import','draft','Entrée canonique créée depuis le catalogue 2022',jsonb_build_object('sourcePage',6,'expectedCardCount',15,'historicalPriceDh',30),'UMZ1 migration')
on conflict (collection_id,version_label) do nothing;
insert into flashcards_os.collections (
  id,family_id,category_id,code,name,slug,legacy_domain,legacy_number,expected_card_count,structured_card_count,
  historical_price_dh,primary_format,status,lifecycle,readiness_score,age_min_months,age_max_months,languages,
  methodologies,primary_objective,audiences,usage_contexts,owner_name,source_page,source_label,legacy_issues,notes,current_version,metadata
) values (
  'fc-zoo-002','family-learning-cards','sub-nature-regions','FC-ZOO-002','Animaux d’Europe','animaux-deurope','ZOO','2',
  15,0,30,'flashcards','needs_structuring','legacy_intake',36,
  36,144,array['fr']::text[],array['Montessori','Freinet','Steiner-Waldorf']::text[],'À structurer depuis le contenu source complet; le catalogue 2022 fournit le titre, la quantité et le prix historique, mais pas le registre carte par carte.',array['B2C Familles','B2B Écoles & crèches']::text[],
  array['Maison','Classe','Atelier éducatif']::text[],'Direction Produit',6,'NEW VERSION OF CATALOGUE FC 2022','[]'::jsonb,'','0.1-legacy-import',
  '{"seed": "catalogue-2022-u1", "sourcePage": 6}'::jsonb
) on conflict (id) do update set
  category_id=excluded.category_id,code=excluded.code,name=excluded.name,slug=excluded.slug,legacy_domain=excluded.legacy_domain,
  legacy_number=excluded.legacy_number,expected_card_count=excluded.expected_card_count,historical_price_dh=excluded.historical_price_dh,
  primary_format=excluded.primary_format,status=excluded.status,lifecycle=excluded.lifecycle,readiness_score=excluded.readiness_score,
  age_min_months=excluded.age_min_months,age_max_months=excluded.age_max_months,languages=excluded.languages,methodologies=excluded.methodologies,
  primary_objective=excluded.primary_objective,audiences=excluded.audiences,usage_contexts=excluded.usage_contexts,owner_name=excluded.owner_name,
  source_page=excluded.source_page,source_label=excluded.source_label,legacy_issues=excluded.legacy_issues,notes=excluded.notes,current_version=excluded.current_version,
  metadata=excluded.metadata,updated_at=now();

insert into flashcards_os.editions (collection_id,language_code,edition_key,version_label,status,metadata)
values ('fc-zoo-002','fr','standard','0.1-legacy-import','legacy_intake','{"seed":"catalogue-2022-u1"}'::jsonb)
on conflict (collection_id,language_code,edition_key) do nothing;

insert into flashcards_os.formats (collection_id,format_key,status,specification)
values ('fc-zoo-002','flashcards','legacy_intake','{"source":"catalogue-2022","specificationStatus":"not-supplied"}'::jsonb)
on conflict (collection_id,format_key) do nothing;

insert into flashcards_os.collection_versions (collection_id,version_label,status,change_summary,content_snapshot,created_by)
values ('fc-zoo-002','0.1-legacy-import','draft','Entrée canonique créée depuis le catalogue 2022',jsonb_build_object('sourcePage',6,'expectedCardCount',15,'historicalPriceDh',30),'UMZ1 migration')
on conflict (collection_id,version_label) do nothing;
insert into flashcards_os.collections (
  id,family_id,category_id,code,name,slug,legacy_domain,legacy_number,expected_card_count,structured_card_count,
  historical_price_dh,primary_format,status,lifecycle,readiness_score,age_min_months,age_max_months,languages,
  methodologies,primary_objective,audiences,usage_contexts,owner_name,source_page,source_label,legacy_issues,notes,current_version,metadata
) values (
  'fc-zoo-003','family-learning-cards','sub-nature-regions','FC-ZOO-003','Animaux d’Asie','animaux-dasie','ZOO','3',
  15,0,30,'flashcards','needs_structuring','legacy_intake',36,
  36,144,array['fr']::text[],array['Montessori','Freinet','Steiner-Waldorf']::text[],'À structurer depuis le contenu source complet; le catalogue 2022 fournit le titre, la quantité et le prix historique, mais pas le registre carte par carte.',array['B2C Familles','B2B Écoles & crèches']::text[],
  array['Maison','Classe','Atelier éducatif']::text[],'Direction Produit',6,'NEW VERSION OF CATALOGUE FC 2022','[]'::jsonb,'','0.1-legacy-import',
  '{"seed": "catalogue-2022-u1", "sourcePage": 6}'::jsonb
) on conflict (id) do update set
  category_id=excluded.category_id,code=excluded.code,name=excluded.name,slug=excluded.slug,legacy_domain=excluded.legacy_domain,
  legacy_number=excluded.legacy_number,expected_card_count=excluded.expected_card_count,historical_price_dh=excluded.historical_price_dh,
  primary_format=excluded.primary_format,status=excluded.status,lifecycle=excluded.lifecycle,readiness_score=excluded.readiness_score,
  age_min_months=excluded.age_min_months,age_max_months=excluded.age_max_months,languages=excluded.languages,methodologies=excluded.methodologies,
  primary_objective=excluded.primary_objective,audiences=excluded.audiences,usage_contexts=excluded.usage_contexts,owner_name=excluded.owner_name,
  source_page=excluded.source_page,source_label=excluded.source_label,legacy_issues=excluded.legacy_issues,notes=excluded.notes,current_version=excluded.current_version,
  metadata=excluded.metadata,updated_at=now();

insert into flashcards_os.editions (collection_id,language_code,edition_key,version_label,status,metadata)
values ('fc-zoo-003','fr','standard','0.1-legacy-import','legacy_intake','{"seed":"catalogue-2022-u1"}'::jsonb)
on conflict (collection_id,language_code,edition_key) do nothing;

insert into flashcards_os.formats (collection_id,format_key,status,specification)
values ('fc-zoo-003','flashcards','legacy_intake','{"source":"catalogue-2022","specificationStatus":"not-supplied"}'::jsonb)
on conflict (collection_id,format_key) do nothing;

insert into flashcards_os.collection_versions (collection_id,version_label,status,change_summary,content_snapshot,created_by)
values ('fc-zoo-003','0.1-legacy-import','draft','Entrée canonique créée depuis le catalogue 2022',jsonb_build_object('sourcePage',6,'expectedCardCount',15,'historicalPriceDh',30),'UMZ1 migration')
on conflict (collection_id,version_label) do nothing;
insert into flashcards_os.collections (
  id,family_id,category_id,code,name,slug,legacy_domain,legacy_number,expected_card_count,structured_card_count,
  historical_price_dh,primary_format,status,lifecycle,readiness_score,age_min_months,age_max_months,languages,
  methodologies,primary_objective,audiences,usage_contexts,owner_name,source_page,source_label,legacy_issues,notes,current_version,metadata
) values (
  'fc-zoo-004','family-learning-cards','sub-nature-regions','FC-ZOO-004','Animaux d’Australie','animaux-daustralie','ZOO','4',
  15,0,30,'flashcards','needs_structuring','legacy_intake',36,
  36,144,array['fr']::text[],array['Montessori','Freinet','Steiner-Waldorf']::text[],'À structurer depuis le contenu source complet; le catalogue 2022 fournit le titre, la quantité et le prix historique, mais pas le registre carte par carte.',array['B2C Familles','B2B Écoles & crèches']::text[],
  array['Maison','Classe','Atelier éducatif']::text[],'Direction Produit',6,'NEW VERSION OF CATALOGUE FC 2022','[]'::jsonb,'','0.1-legacy-import',
  '{"seed": "catalogue-2022-u1", "sourcePage": 6}'::jsonb
) on conflict (id) do update set
  category_id=excluded.category_id,code=excluded.code,name=excluded.name,slug=excluded.slug,legacy_domain=excluded.legacy_domain,
  legacy_number=excluded.legacy_number,expected_card_count=excluded.expected_card_count,historical_price_dh=excluded.historical_price_dh,
  primary_format=excluded.primary_format,status=excluded.status,lifecycle=excluded.lifecycle,readiness_score=excluded.readiness_score,
  age_min_months=excluded.age_min_months,age_max_months=excluded.age_max_months,languages=excluded.languages,methodologies=excluded.methodologies,
  primary_objective=excluded.primary_objective,audiences=excluded.audiences,usage_contexts=excluded.usage_contexts,owner_name=excluded.owner_name,
  source_page=excluded.source_page,source_label=excluded.source_label,legacy_issues=excluded.legacy_issues,notes=excluded.notes,current_version=excluded.current_version,
  metadata=excluded.metadata,updated_at=now();

insert into flashcards_os.editions (collection_id,language_code,edition_key,version_label,status,metadata)
values ('fc-zoo-004','fr','standard','0.1-legacy-import','legacy_intake','{"seed":"catalogue-2022-u1"}'::jsonb)
on conflict (collection_id,language_code,edition_key) do nothing;

insert into flashcards_os.formats (collection_id,format_key,status,specification)
values ('fc-zoo-004','flashcards','legacy_intake','{"source":"catalogue-2022","specificationStatus":"not-supplied"}'::jsonb)
on conflict (collection_id,format_key) do nothing;

insert into flashcards_os.collection_versions (collection_id,version_label,status,change_summary,content_snapshot,created_by)
values ('fc-zoo-004','0.1-legacy-import','draft','Entrée canonique créée depuis le catalogue 2022',jsonb_build_object('sourcePage',6,'expectedCardCount',15,'historicalPriceDh',30),'UMZ1 migration')
on conflict (collection_id,version_label) do nothing;
insert into flashcards_os.collections (
  id,family_id,category_id,code,name,slug,legacy_domain,legacy_number,expected_card_count,structured_card_count,
  historical_price_dh,primary_format,status,lifecycle,readiness_score,age_min_months,age_max_months,languages,
  methodologies,primary_objective,audiences,usage_contexts,owner_name,source_page,source_label,legacy_issues,notes,current_version,metadata
) values (
  'fc-zoo-005','family-learning-cards','sub-nature-regions','FC-ZOO-005','Animaux d’Amérique du Sud','animaux-damerique-du-sud','ZOO','5',
  15,0,30,'flashcards','needs_structuring','legacy_intake',36,
  36,144,array['fr']::text[],array['Montessori','Freinet','Steiner-Waldorf']::text[],'À structurer depuis le contenu source complet; le catalogue 2022 fournit le titre, la quantité et le prix historique, mais pas le registre carte par carte.',array['B2C Familles','B2B Écoles & crèches']::text[],
  array['Maison','Classe','Atelier éducatif']::text[],'Direction Produit',6,'NEW VERSION OF CATALOGUE FC 2022','[]'::jsonb,'','0.1-legacy-import',
  '{"seed": "catalogue-2022-u1", "sourcePage": 6}'::jsonb
) on conflict (id) do update set
  category_id=excluded.category_id,code=excluded.code,name=excluded.name,slug=excluded.slug,legacy_domain=excluded.legacy_domain,
  legacy_number=excluded.legacy_number,expected_card_count=excluded.expected_card_count,historical_price_dh=excluded.historical_price_dh,
  primary_format=excluded.primary_format,status=excluded.status,lifecycle=excluded.lifecycle,readiness_score=excluded.readiness_score,
  age_min_months=excluded.age_min_months,age_max_months=excluded.age_max_months,languages=excluded.languages,methodologies=excluded.methodologies,
  primary_objective=excluded.primary_objective,audiences=excluded.audiences,usage_contexts=excluded.usage_contexts,owner_name=excluded.owner_name,
  source_page=excluded.source_page,source_label=excluded.source_label,legacy_issues=excluded.legacy_issues,notes=excluded.notes,current_version=excluded.current_version,
  metadata=excluded.metadata,updated_at=now();

insert into flashcards_os.editions (collection_id,language_code,edition_key,version_label,status,metadata)
values ('fc-zoo-005','fr','standard','0.1-legacy-import','legacy_intake','{"seed":"catalogue-2022-u1"}'::jsonb)
on conflict (collection_id,language_code,edition_key) do nothing;

insert into flashcards_os.formats (collection_id,format_key,status,specification)
values ('fc-zoo-005','flashcards','legacy_intake','{"source":"catalogue-2022","specificationStatus":"not-supplied"}'::jsonb)
on conflict (collection_id,format_key) do nothing;

insert into flashcards_os.collection_versions (collection_id,version_label,status,change_summary,content_snapshot,created_by)
values ('fc-zoo-005','0.1-legacy-import','draft','Entrée canonique créée depuis le catalogue 2022',jsonb_build_object('sourcePage',6,'expectedCardCount',15,'historicalPriceDh',30),'UMZ1 migration')
on conflict (collection_id,version_label) do nothing;
insert into flashcards_os.collections (
  id,family_id,category_id,code,name,slug,legacy_domain,legacy_number,expected_card_count,structured_card_count,
  historical_price_dh,primary_format,status,lifecycle,readiness_score,age_min_months,age_max_months,languages,
  methodologies,primary_objective,audiences,usage_contexts,owner_name,source_page,source_label,legacy_issues,notes,current_version,metadata
) values (
  'fc-zoo-006','family-learning-cards','sub-nature-regions','FC-ZOO-006','Animaux d’Amérique du Nord','animaux-damerique-du-nord','ZOO','6',
  15,0,30,'flashcards','needs_structuring','legacy_intake',36,
  36,144,array['fr']::text[],array['Montessori','Freinet','Steiner-Waldorf']::text[],'À structurer depuis le contenu source complet; le catalogue 2022 fournit le titre, la quantité et le prix historique, mais pas le registre carte par carte.',array['B2C Familles','B2B Écoles & crèches']::text[],
  array['Maison','Classe','Atelier éducatif']::text[],'Direction Produit',6,'NEW VERSION OF CATALOGUE FC 2022','[]'::jsonb,'','0.1-legacy-import',
  '{"seed": "catalogue-2022-u1", "sourcePage": 6}'::jsonb
) on conflict (id) do update set
  category_id=excluded.category_id,code=excluded.code,name=excluded.name,slug=excluded.slug,legacy_domain=excluded.legacy_domain,
  legacy_number=excluded.legacy_number,expected_card_count=excluded.expected_card_count,historical_price_dh=excluded.historical_price_dh,
  primary_format=excluded.primary_format,status=excluded.status,lifecycle=excluded.lifecycle,readiness_score=excluded.readiness_score,
  age_min_months=excluded.age_min_months,age_max_months=excluded.age_max_months,languages=excluded.languages,methodologies=excluded.methodologies,
  primary_objective=excluded.primary_objective,audiences=excluded.audiences,usage_contexts=excluded.usage_contexts,owner_name=excluded.owner_name,
  source_page=excluded.source_page,source_label=excluded.source_label,legacy_issues=excluded.legacy_issues,notes=excluded.notes,current_version=excluded.current_version,
  metadata=excluded.metadata,updated_at=now();

insert into flashcards_os.editions (collection_id,language_code,edition_key,version_label,status,metadata)
values ('fc-zoo-006','fr','standard','0.1-legacy-import','legacy_intake','{"seed":"catalogue-2022-u1"}'::jsonb)
on conflict (collection_id,language_code,edition_key) do nothing;

insert into flashcards_os.formats (collection_id,format_key,status,specification)
values ('fc-zoo-006','flashcards','legacy_intake','{"source":"catalogue-2022","specificationStatus":"not-supplied"}'::jsonb)
on conflict (collection_id,format_key) do nothing;

insert into flashcards_os.collection_versions (collection_id,version_label,status,change_summary,content_snapshot,created_by)
values ('fc-zoo-006','0.1-legacy-import','draft','Entrée canonique créée depuis le catalogue 2022',jsonb_build_object('sourcePage',6,'expectedCardCount',15,'historicalPriceDh',30),'UMZ1 migration')
on conflict (collection_id,version_label) do nothing;
insert into flashcards_os.collections (
  id,family_id,category_id,code,name,slug,legacy_domain,legacy_number,expected_card_count,structured_card_count,
  historical_price_dh,primary_format,status,lifecycle,readiness_score,age_min_months,age_max_months,languages,
  methodologies,primary_objective,audiences,usage_contexts,owner_name,source_page,source_label,legacy_issues,notes,current_version,metadata
) values (
  'fc-zoo-007','family-learning-cards','sub-nature-regions','FC-ZOO-007','Animaux de l’Antarctique','animaux-de-lantarctique','ZOO','7',
  15,0,30,'flashcards','needs_structuring','legacy_intake',36,
  36,144,array['fr']::text[],array['Montessori','Freinet','Steiner-Waldorf']::text[],'À structurer depuis le contenu source complet; le catalogue 2022 fournit le titre, la quantité et le prix historique, mais pas le registre carte par carte.',array['B2C Familles','B2B Écoles & crèches']::text[],
  array['Maison','Classe','Atelier éducatif']::text[],'Direction Produit',6,'NEW VERSION OF CATALOGUE FC 2022','[]'::jsonb,'','0.1-legacy-import',
  '{"seed": "catalogue-2022-u1", "sourcePage": 6}'::jsonb
) on conflict (id) do update set
  category_id=excluded.category_id,code=excluded.code,name=excluded.name,slug=excluded.slug,legacy_domain=excluded.legacy_domain,
  legacy_number=excluded.legacy_number,expected_card_count=excluded.expected_card_count,historical_price_dh=excluded.historical_price_dh,
  primary_format=excluded.primary_format,status=excluded.status,lifecycle=excluded.lifecycle,readiness_score=excluded.readiness_score,
  age_min_months=excluded.age_min_months,age_max_months=excluded.age_max_months,languages=excluded.languages,methodologies=excluded.methodologies,
  primary_objective=excluded.primary_objective,audiences=excluded.audiences,usage_contexts=excluded.usage_contexts,owner_name=excluded.owner_name,
  source_page=excluded.source_page,source_label=excluded.source_label,legacy_issues=excluded.legacy_issues,notes=excluded.notes,current_version=excluded.current_version,
  metadata=excluded.metadata,updated_at=now();

insert into flashcards_os.editions (collection_id,language_code,edition_key,version_label,status,metadata)
values ('fc-zoo-007','fr','standard','0.1-legacy-import','legacy_intake','{"seed":"catalogue-2022-u1"}'::jsonb)
on conflict (collection_id,language_code,edition_key) do nothing;

insert into flashcards_os.formats (collection_id,format_key,status,specification)
values ('fc-zoo-007','flashcards','legacy_intake','{"source":"catalogue-2022","specificationStatus":"not-supplied"}'::jsonb)
on conflict (collection_id,format_key) do nothing;

insert into flashcards_os.collection_versions (collection_id,version_label,status,change_summary,content_snapshot,created_by)
values ('fc-zoo-007','0.1-legacy-import','draft','Entrée canonique créée depuis le catalogue 2022',jsonb_build_object('sourcePage',6,'expectedCardCount',15,'historicalPriceDh',30),'UMZ1 migration')
on conflict (collection_id,version_label) do nothing;
insert into flashcards_os.collections (
  id,family_id,category_id,code,name,slug,legacy_domain,legacy_number,expected_card_count,structured_card_count,
  historical_price_dh,primary_format,status,lifecycle,readiness_score,age_min_months,age_max_months,languages,
  methodologies,primary_objective,audiences,usage_contexts,owner_name,source_page,source_label,legacy_issues,notes,current_version,metadata
) values (
  'fc-zoo-008','family-learning-cards','sub-nature-regions','FC-ZOO-008','Animaux de savane','animaux-de-savane','ZOO','8',
  15,0,30,'flashcards','needs_structuring','legacy_intake',36,
  36,144,array['fr']::text[],array['Montessori','Freinet','Steiner-Waldorf']::text[],'À structurer depuis le contenu source complet; le catalogue 2022 fournit le titre, la quantité et le prix historique, mais pas le registre carte par carte.',array['B2C Familles','B2B Écoles & crèches']::text[],
  array['Maison','Classe','Atelier éducatif']::text[],'Direction Produit',6,'NEW VERSION OF CATALOGUE FC 2022','[]'::jsonb,'','0.1-legacy-import',
  '{"seed": "catalogue-2022-u1", "sourcePage": 6}'::jsonb
) on conflict (id) do update set
  category_id=excluded.category_id,code=excluded.code,name=excluded.name,slug=excluded.slug,legacy_domain=excluded.legacy_domain,
  legacy_number=excluded.legacy_number,expected_card_count=excluded.expected_card_count,historical_price_dh=excluded.historical_price_dh,
  primary_format=excluded.primary_format,status=excluded.status,lifecycle=excluded.lifecycle,readiness_score=excluded.readiness_score,
  age_min_months=excluded.age_min_months,age_max_months=excluded.age_max_months,languages=excluded.languages,methodologies=excluded.methodologies,
  primary_objective=excluded.primary_objective,audiences=excluded.audiences,usage_contexts=excluded.usage_contexts,owner_name=excluded.owner_name,
  source_page=excluded.source_page,source_label=excluded.source_label,legacy_issues=excluded.legacy_issues,notes=excluded.notes,current_version=excluded.current_version,
  metadata=excluded.metadata,updated_at=now();

insert into flashcards_os.editions (collection_id,language_code,edition_key,version_label,status,metadata)
values ('fc-zoo-008','fr','standard','0.1-legacy-import','legacy_intake','{"seed":"catalogue-2022-u1"}'::jsonb)
on conflict (collection_id,language_code,edition_key) do nothing;

insert into flashcards_os.formats (collection_id,format_key,status,specification)
values ('fc-zoo-008','flashcards','legacy_intake','{"source":"catalogue-2022","specificationStatus":"not-supplied"}'::jsonb)
on conflict (collection_id,format_key) do nothing;

insert into flashcards_os.collection_versions (collection_id,version_label,status,change_summary,content_snapshot,created_by)
values ('fc-zoo-008','0.1-legacy-import','draft','Entrée canonique créée depuis le catalogue 2022',jsonb_build_object('sourcePage',6,'expectedCardCount',15,'historicalPriceDh',30),'UMZ1 migration')
on conflict (collection_id,version_label) do nothing;
insert into flashcards_os.collections (
  id,family_id,category_id,code,name,slug,legacy_domain,legacy_number,expected_card_count,structured_card_count,
  historical_price_dh,primary_format,status,lifecycle,readiness_score,age_min_months,age_max_months,languages,
  methodologies,primary_objective,audiences,usage_contexts,owner_name,source_page,source_label,legacy_issues,notes,current_version,metadata
) values (
  'fc-zoo-009','family-learning-cards','sub-nature-features','FC-ZOO-009','Mélange d’animaux','melange-danimaux','ZOO','9',
  23,0,46,'flashcards','needs_structuring','legacy_intake',36,
  36,144,array['fr']::text[],array['Montessori','Freinet','Steiner-Waldorf']::text[],'À structurer depuis le contenu source complet; le catalogue 2022 fournit le titre, la quantité et le prix historique, mais pas le registre carte par carte.',array['B2C Familles','B2B Écoles & crèches']::text[],
  array['Maison','Classe','Atelier éducatif']::text[],'Direction Produit',6,'NEW VERSION OF CATALOGUE FC 2022','[]'::jsonb,'','0.1-legacy-import',
  '{"seed": "catalogue-2022-u1", "sourcePage": 6}'::jsonb
) on conflict (id) do update set
  category_id=excluded.category_id,code=excluded.code,name=excluded.name,slug=excluded.slug,legacy_domain=excluded.legacy_domain,
  legacy_number=excluded.legacy_number,expected_card_count=excluded.expected_card_count,historical_price_dh=excluded.historical_price_dh,
  primary_format=excluded.primary_format,status=excluded.status,lifecycle=excluded.lifecycle,readiness_score=excluded.readiness_score,
  age_min_months=excluded.age_min_months,age_max_months=excluded.age_max_months,languages=excluded.languages,methodologies=excluded.methodologies,
  primary_objective=excluded.primary_objective,audiences=excluded.audiences,usage_contexts=excluded.usage_contexts,owner_name=excluded.owner_name,
  source_page=excluded.source_page,source_label=excluded.source_label,legacy_issues=excluded.legacy_issues,notes=excluded.notes,current_version=excluded.current_version,
  metadata=excluded.metadata,updated_at=now();

insert into flashcards_os.editions (collection_id,language_code,edition_key,version_label,status,metadata)
values ('fc-zoo-009','fr','standard','0.1-legacy-import','legacy_intake','{"seed":"catalogue-2022-u1"}'::jsonb)
on conflict (collection_id,language_code,edition_key) do nothing;

insert into flashcards_os.formats (collection_id,format_key,status,specification)
values ('fc-zoo-009','flashcards','legacy_intake','{"source":"catalogue-2022","specificationStatus":"not-supplied"}'::jsonb)
on conflict (collection_id,format_key) do nothing;

insert into flashcards_os.collection_versions (collection_id,version_label,status,change_summary,content_snapshot,created_by)
values ('fc-zoo-009','0.1-legacy-import','draft','Entrée canonique créée depuis le catalogue 2022',jsonb_build_object('sourcePage',6,'expectedCardCount',23,'historicalPriceDh',46),'UMZ1 migration')
on conflict (collection_id,version_label) do nothing;
insert into flashcards_os.collections (
  id,family_id,category_id,code,name,slug,legacy_domain,legacy_number,expected_card_count,structured_card_count,
  historical_price_dh,primary_format,status,lifecycle,readiness_score,age_min_months,age_max_months,languages,
  methodologies,primary_objective,audiences,usage_contexts,owner_name,source_page,source_label,legacy_issues,notes,current_version,metadata
) values (
  'fc-zoo-010','family-learning-cards','sub-nature-features','FC-ZOO-010','Mélange de poissons','melange-de-poissons','ZOO','10',
  15,0,30,'flashcards','needs_structuring','legacy_intake',36,
  36,144,array['fr']::text[],array['Montessori','Freinet','Steiner-Waldorf']::text[],'À structurer depuis le contenu source complet; le catalogue 2022 fournit le titre, la quantité et le prix historique, mais pas le registre carte par carte.',array['B2C Familles','B2B Écoles & crèches']::text[],
  array['Maison','Classe','Atelier éducatif']::text[],'Direction Produit',6,'NEW VERSION OF CATALOGUE FC 2022','[]'::jsonb,'','0.1-legacy-import',
  '{"seed": "catalogue-2022-u1", "sourcePage": 6}'::jsonb
) on conflict (id) do update set
  category_id=excluded.category_id,code=excluded.code,name=excluded.name,slug=excluded.slug,legacy_domain=excluded.legacy_domain,
  legacy_number=excluded.legacy_number,expected_card_count=excluded.expected_card_count,historical_price_dh=excluded.historical_price_dh,
  primary_format=excluded.primary_format,status=excluded.status,lifecycle=excluded.lifecycle,readiness_score=excluded.readiness_score,
  age_min_months=excluded.age_min_months,age_max_months=excluded.age_max_months,languages=excluded.languages,methodologies=excluded.methodologies,
  primary_objective=excluded.primary_objective,audiences=excluded.audiences,usage_contexts=excluded.usage_contexts,owner_name=excluded.owner_name,
  source_page=excluded.source_page,source_label=excluded.source_label,legacy_issues=excluded.legacy_issues,notes=excluded.notes,current_version=excluded.current_version,
  metadata=excluded.metadata,updated_at=now();

insert into flashcards_os.editions (collection_id,language_code,edition_key,version_label,status,metadata)
values ('fc-zoo-010','fr','standard','0.1-legacy-import','legacy_intake','{"seed":"catalogue-2022-u1"}'::jsonb)
on conflict (collection_id,language_code,edition_key) do nothing;

insert into flashcards_os.formats (collection_id,format_key,status,specification)
values ('fc-zoo-010','flashcards','legacy_intake','{"source":"catalogue-2022","specificationStatus":"not-supplied"}'::jsonb)
on conflict (collection_id,format_key) do nothing;

insert into flashcards_os.collection_versions (collection_id,version_label,status,change_summary,content_snapshot,created_by)
values ('fc-zoo-010','0.1-legacy-import','draft','Entrée canonique créée depuis le catalogue 2022',jsonb_build_object('sourcePage',6,'expectedCardCount',15,'historicalPriceDh',30),'UMZ1 migration')
on conflict (collection_id,version_label) do nothing;
insert into flashcards_os.collections (
  id,family_id,category_id,code,name,slug,legacy_domain,legacy_number,expected_card_count,structured_card_count,
  historical_price_dh,primary_format,status,lifecycle,readiness_score,age_min_months,age_max_months,languages,
  methodologies,primary_objective,audiences,usage_contexts,owner_name,source_page,source_label,legacy_issues,notes,current_version,metadata
) values (
  'fc-zoo-011','family-learning-cards','sub-nature-features','FC-ZOO-011','Mélange d’insectes','melange-dinsectes','ZOO','11',
  20,0,40,'flashcards','needs_structuring','legacy_intake',36,
  36,144,array['fr']::text[],array['Montessori','Freinet','Steiner-Waldorf']::text[],'À structurer depuis le contenu source complet; le catalogue 2022 fournit le titre, la quantité et le prix historique, mais pas le registre carte par carte.',array['B2C Familles','B2B Écoles & crèches']::text[],
  array['Maison','Classe','Atelier éducatif']::text[],'Direction Produit',6,'NEW VERSION OF CATALOGUE FC 2022','[]'::jsonb,'','0.1-legacy-import',
  '{"seed": "catalogue-2022-u1", "sourcePage": 6}'::jsonb
) on conflict (id) do update set
  category_id=excluded.category_id,code=excluded.code,name=excluded.name,slug=excluded.slug,legacy_domain=excluded.legacy_domain,
  legacy_number=excluded.legacy_number,expected_card_count=excluded.expected_card_count,historical_price_dh=excluded.historical_price_dh,
  primary_format=excluded.primary_format,status=excluded.status,lifecycle=excluded.lifecycle,readiness_score=excluded.readiness_score,
  age_min_months=excluded.age_min_months,age_max_months=excluded.age_max_months,languages=excluded.languages,methodologies=excluded.methodologies,
  primary_objective=excluded.primary_objective,audiences=excluded.audiences,usage_contexts=excluded.usage_contexts,owner_name=excluded.owner_name,
  source_page=excluded.source_page,source_label=excluded.source_label,legacy_issues=excluded.legacy_issues,notes=excluded.notes,current_version=excluded.current_version,
  metadata=excluded.metadata,updated_at=now();

insert into flashcards_os.editions (collection_id,language_code,edition_key,version_label,status,metadata)
values ('fc-zoo-011','fr','standard','0.1-legacy-import','legacy_intake','{"seed":"catalogue-2022-u1"}'::jsonb)
on conflict (collection_id,language_code,edition_key) do nothing;

insert into flashcards_os.formats (collection_id,format_key,status,specification)
values ('fc-zoo-011','flashcards','legacy_intake','{"source":"catalogue-2022","specificationStatus":"not-supplied"}'::jsonb)
on conflict (collection_id,format_key) do nothing;

insert into flashcards_os.collection_versions (collection_id,version_label,status,change_summary,content_snapshot,created_by)
values ('fc-zoo-011','0.1-legacy-import','draft','Entrée canonique créée depuis le catalogue 2022',jsonb_build_object('sourcePage',6,'expectedCardCount',20,'historicalPriceDh',40),'UMZ1 migration')
on conflict (collection_id,version_label) do nothing;
insert into flashcards_os.collections (
  id,family_id,category_id,code,name,slug,legacy_domain,legacy_number,expected_card_count,structured_card_count,
  historical_price_dh,primary_format,status,lifecycle,readiness_score,age_min_months,age_max_months,languages,
  methodologies,primary_objective,audiences,usage_contexts,owner_name,source_page,source_label,legacy_issues,notes,current_version,metadata
) values (
  'fc-zoo-012','family-learning-cards','sub-nature-features','FC-ZOO-012','Animaux avec plume','animaux-avec-plume','ZOO','12',
  10,0,20,'flashcards','needs_structuring','legacy_intake',36,
  36,144,array['fr']::text[],array['Montessori','Freinet','Steiner-Waldorf']::text[],'À structurer depuis le contenu source complet; le catalogue 2022 fournit le titre, la quantité et le prix historique, mais pas le registre carte par carte.',array['B2C Familles','B2B Écoles & crèches']::text[],
  array['Maison','Classe','Atelier éducatif']::text[],'Direction Produit',6,'NEW VERSION OF CATALOGUE FC 2022','[]'::jsonb,'','0.1-legacy-import',
  '{"seed": "catalogue-2022-u1", "sourcePage": 6}'::jsonb
) on conflict (id) do update set
  category_id=excluded.category_id,code=excluded.code,name=excluded.name,slug=excluded.slug,legacy_domain=excluded.legacy_domain,
  legacy_number=excluded.legacy_number,expected_card_count=excluded.expected_card_count,historical_price_dh=excluded.historical_price_dh,
  primary_format=excluded.primary_format,status=excluded.status,lifecycle=excluded.lifecycle,readiness_score=excluded.readiness_score,
  age_min_months=excluded.age_min_months,age_max_months=excluded.age_max_months,languages=excluded.languages,methodologies=excluded.methodologies,
  primary_objective=excluded.primary_objective,audiences=excluded.audiences,usage_contexts=excluded.usage_contexts,owner_name=excluded.owner_name,
  source_page=excluded.source_page,source_label=excluded.source_label,legacy_issues=excluded.legacy_issues,notes=excluded.notes,current_version=excluded.current_version,
  metadata=excluded.metadata,updated_at=now();

insert into flashcards_os.editions (collection_id,language_code,edition_key,version_label,status,metadata)
values ('fc-zoo-012','fr','standard','0.1-legacy-import','legacy_intake','{"seed":"catalogue-2022-u1"}'::jsonb)
on conflict (collection_id,language_code,edition_key) do nothing;

insert into flashcards_os.formats (collection_id,format_key,status,specification)
values ('fc-zoo-012','flashcards','legacy_intake','{"source":"catalogue-2022","specificationStatus":"not-supplied"}'::jsonb)
on conflict (collection_id,format_key) do nothing;

insert into flashcards_os.collection_versions (collection_id,version_label,status,change_summary,content_snapshot,created_by)
values ('fc-zoo-012','0.1-legacy-import','draft','Entrée canonique créée depuis le catalogue 2022',jsonb_build_object('sourcePage',6,'expectedCardCount',10,'historicalPriceDh',20),'UMZ1 migration')
on conflict (collection_id,version_label) do nothing;
insert into flashcards_os.collections (
  id,family_id,category_id,code,name,slug,legacy_domain,legacy_number,expected_card_count,structured_card_count,
  historical_price_dh,primary_format,status,lifecycle,readiness_score,age_min_months,age_max_months,languages,
  methodologies,primary_objective,audiences,usage_contexts,owner_name,source_page,source_label,legacy_issues,notes,current_version,metadata
) values (
  'fc-zoo-013','family-learning-cards','sub-nature-features','FC-ZOO-013','Animaux avec écaille','animaux-avec-ecaille','ZOO','13',
  10,0,20,'flashcards','needs_structuring','legacy_intake',36,
  36,144,array['fr']::text[],array['Montessori','Freinet','Steiner-Waldorf']::text[],'À structurer depuis le contenu source complet; le catalogue 2022 fournit le titre, la quantité et le prix historique, mais pas le registre carte par carte.',array['B2C Familles','B2B Écoles & crèches']::text[],
  array['Maison','Classe','Atelier éducatif']::text[],'Direction Produit',6,'NEW VERSION OF CATALOGUE FC 2022','[]'::jsonb,'','0.1-legacy-import',
  '{"seed": "catalogue-2022-u1", "sourcePage": 6}'::jsonb
) on conflict (id) do update set
  category_id=excluded.category_id,code=excluded.code,name=excluded.name,slug=excluded.slug,legacy_domain=excluded.legacy_domain,
  legacy_number=excluded.legacy_number,expected_card_count=excluded.expected_card_count,historical_price_dh=excluded.historical_price_dh,
  primary_format=excluded.primary_format,status=excluded.status,lifecycle=excluded.lifecycle,readiness_score=excluded.readiness_score,
  age_min_months=excluded.age_min_months,age_max_months=excluded.age_max_months,languages=excluded.languages,methodologies=excluded.methodologies,
  primary_objective=excluded.primary_objective,audiences=excluded.audiences,usage_contexts=excluded.usage_contexts,owner_name=excluded.owner_name,
  source_page=excluded.source_page,source_label=excluded.source_label,legacy_issues=excluded.legacy_issues,notes=excluded.notes,current_version=excluded.current_version,
  metadata=excluded.metadata,updated_at=now();

insert into flashcards_os.editions (collection_id,language_code,edition_key,version_label,status,metadata)
values ('fc-zoo-013','fr','standard','0.1-legacy-import','legacy_intake','{"seed":"catalogue-2022-u1"}'::jsonb)
on conflict (collection_id,language_code,edition_key) do nothing;

insert into flashcards_os.formats (collection_id,format_key,status,specification)
values ('fc-zoo-013','flashcards','legacy_intake','{"source":"catalogue-2022","specificationStatus":"not-supplied"}'::jsonb)
on conflict (collection_id,format_key) do nothing;

insert into flashcards_os.collection_versions (collection_id,version_label,status,change_summary,content_snapshot,created_by)
values ('fc-zoo-013','0.1-legacy-import','draft','Entrée canonique créée depuis le catalogue 2022',jsonb_build_object('sourcePage',6,'expectedCardCount',10,'historicalPriceDh',20),'UMZ1 migration')
on conflict (collection_id,version_label) do nothing;
insert into flashcards_os.collections (
  id,family_id,category_id,code,name,slug,legacy_domain,legacy_number,expected_card_count,structured_card_count,
  historical_price_dh,primary_format,status,lifecycle,readiness_score,age_min_months,age_max_months,languages,
  methodologies,primary_objective,audiences,usage_contexts,owner_name,source_page,source_label,legacy_issues,notes,current_version,metadata
) values (
  'fc-zoo-014','family-learning-cards','sub-nature-features','FC-ZOO-014','Animaux à fourrure','animaux-a-fourrure','ZOO','14',
  10,0,20,'flashcards','needs_structuring','legacy_intake',36,
  36,144,array['fr']::text[],array['Montessori','Freinet','Steiner-Waldorf']::text[],'À structurer depuis le contenu source complet; le catalogue 2022 fournit le titre, la quantité et le prix historique, mais pas le registre carte par carte.',array['B2C Familles','B2B Écoles & crèches']::text[],
  array['Maison','Classe','Atelier éducatif']::text[],'Direction Produit',6,'NEW VERSION OF CATALOGUE FC 2022','[]'::jsonb,'','0.1-legacy-import',
  '{"seed": "catalogue-2022-u1", "sourcePage": 6}'::jsonb
) on conflict (id) do update set
  category_id=excluded.category_id,code=excluded.code,name=excluded.name,slug=excluded.slug,legacy_domain=excluded.legacy_domain,
  legacy_number=excluded.legacy_number,expected_card_count=excluded.expected_card_count,historical_price_dh=excluded.historical_price_dh,
  primary_format=excluded.primary_format,status=excluded.status,lifecycle=excluded.lifecycle,readiness_score=excluded.readiness_score,
  age_min_months=excluded.age_min_months,age_max_months=excluded.age_max_months,languages=excluded.languages,methodologies=excluded.methodologies,
  primary_objective=excluded.primary_objective,audiences=excluded.audiences,usage_contexts=excluded.usage_contexts,owner_name=excluded.owner_name,
  source_page=excluded.source_page,source_label=excluded.source_label,legacy_issues=excluded.legacy_issues,notes=excluded.notes,current_version=excluded.current_version,
  metadata=excluded.metadata,updated_at=now();

insert into flashcards_os.editions (collection_id,language_code,edition_key,version_label,status,metadata)
values ('fc-zoo-014','fr','standard','0.1-legacy-import','legacy_intake','{"seed":"catalogue-2022-u1"}'::jsonb)
on conflict (collection_id,language_code,edition_key) do nothing;

insert into flashcards_os.formats (collection_id,format_key,status,specification)
values ('fc-zoo-014','flashcards','legacy_intake','{"source":"catalogue-2022","specificationStatus":"not-supplied"}'::jsonb)
on conflict (collection_id,format_key) do nothing;

insert into flashcards_os.collection_versions (collection_id,version_label,status,change_summary,content_snapshot,created_by)
values ('fc-zoo-014','0.1-legacy-import','draft','Entrée canonique créée depuis le catalogue 2022',jsonb_build_object('sourcePage',6,'expectedCardCount',10,'historicalPriceDh',20),'UMZ1 migration')
on conflict (collection_id,version_label) do nothing;
insert into flashcards_os.collections (
  id,family_id,category_id,code,name,slug,legacy_domain,legacy_number,expected_card_count,structured_card_count,
  historical_price_dh,primary_format,status,lifecycle,readiness_score,age_min_months,age_max_months,languages,
  methodologies,primary_objective,audiences,usage_contexts,owner_name,source_page,source_label,legacy_issues,notes,current_version,metadata
) values (
  'fc-zoo-015','family-learning-cards','sub-nature-features','FC-ZOO-015','Animaux herbivores','animaux-herbivores','ZOO','15',
  10,0,20,'flashcards','needs_structuring','legacy_intake',36,
  36,144,array['fr']::text[],array['Montessori','Freinet','Steiner-Waldorf']::text[],'À structurer depuis le contenu source complet; le catalogue 2022 fournit le titre, la quantité et le prix historique, mais pas le registre carte par carte.',array['B2C Familles','B2B Écoles & crèches']::text[],
  array['Maison','Classe','Atelier éducatif']::text[],'Direction Produit',6,'NEW VERSION OF CATALOGUE FC 2022','[]'::jsonb,'','0.1-legacy-import',
  '{"seed": "catalogue-2022-u1", "sourcePage": 6}'::jsonb
) on conflict (id) do update set
  category_id=excluded.category_id,code=excluded.code,name=excluded.name,slug=excluded.slug,legacy_domain=excluded.legacy_domain,
  legacy_number=excluded.legacy_number,expected_card_count=excluded.expected_card_count,historical_price_dh=excluded.historical_price_dh,
  primary_format=excluded.primary_format,status=excluded.status,lifecycle=excluded.lifecycle,readiness_score=excluded.readiness_score,
  age_min_months=excluded.age_min_months,age_max_months=excluded.age_max_months,languages=excluded.languages,methodologies=excluded.methodologies,
  primary_objective=excluded.primary_objective,audiences=excluded.audiences,usage_contexts=excluded.usage_contexts,owner_name=excluded.owner_name,
  source_page=excluded.source_page,source_label=excluded.source_label,legacy_issues=excluded.legacy_issues,notes=excluded.notes,current_version=excluded.current_version,
  metadata=excluded.metadata,updated_at=now();

insert into flashcards_os.editions (collection_id,language_code,edition_key,version_label,status,metadata)
values ('fc-zoo-015','fr','standard','0.1-legacy-import','legacy_intake','{"seed":"catalogue-2022-u1"}'::jsonb)
on conflict (collection_id,language_code,edition_key) do nothing;

insert into flashcards_os.formats (collection_id,format_key,status,specification)
values ('fc-zoo-015','flashcards','legacy_intake','{"source":"catalogue-2022","specificationStatus":"not-supplied"}'::jsonb)
on conflict (collection_id,format_key) do nothing;

insert into flashcards_os.collection_versions (collection_id,version_label,status,change_summary,content_snapshot,created_by)
values ('fc-zoo-015','0.1-legacy-import','draft','Entrée canonique créée depuis le catalogue 2022',jsonb_build_object('sourcePage',6,'expectedCardCount',10,'historicalPriceDh',20),'UMZ1 migration')
on conflict (collection_id,version_label) do nothing;
insert into flashcards_os.collections (
  id,family_id,category_id,code,name,slug,legacy_domain,legacy_number,expected_card_count,structured_card_count,
  historical_price_dh,primary_format,status,lifecycle,readiness_score,age_min_months,age_max_months,languages,
  methodologies,primary_objective,audiences,usage_contexts,owner_name,source_page,source_label,legacy_issues,notes,current_version,metadata
) values (
  'fc-zoo-016','family-learning-cards','sub-nature-features','FC-ZOO-016','Animaux omnivores','animaux-omnivores','ZOO','16',
  10,0,20,'flashcards','needs_structuring','legacy_intake',36,
  36,144,array['fr']::text[],array['Montessori','Freinet','Steiner-Waldorf']::text[],'À structurer depuis le contenu source complet; le catalogue 2022 fournit le titre, la quantité et le prix historique, mais pas le registre carte par carte.',array['B2C Familles','B2B Écoles & crèches']::text[],
  array['Maison','Classe','Atelier éducatif']::text[],'Direction Produit',6,'NEW VERSION OF CATALOGUE FC 2022','[]'::jsonb,'','0.1-legacy-import',
  '{"seed": "catalogue-2022-u1", "sourcePage": 6}'::jsonb
) on conflict (id) do update set
  category_id=excluded.category_id,code=excluded.code,name=excluded.name,slug=excluded.slug,legacy_domain=excluded.legacy_domain,
  legacy_number=excluded.legacy_number,expected_card_count=excluded.expected_card_count,historical_price_dh=excluded.historical_price_dh,
  primary_format=excluded.primary_format,status=excluded.status,lifecycle=excluded.lifecycle,readiness_score=excluded.readiness_score,
  age_min_months=excluded.age_min_months,age_max_months=excluded.age_max_months,languages=excluded.languages,methodologies=excluded.methodologies,
  primary_objective=excluded.primary_objective,audiences=excluded.audiences,usage_contexts=excluded.usage_contexts,owner_name=excluded.owner_name,
  source_page=excluded.source_page,source_label=excluded.source_label,legacy_issues=excluded.legacy_issues,notes=excluded.notes,current_version=excluded.current_version,
  metadata=excluded.metadata,updated_at=now();

insert into flashcards_os.editions (collection_id,language_code,edition_key,version_label,status,metadata)
values ('fc-zoo-016','fr','standard','0.1-legacy-import','legacy_intake','{"seed":"catalogue-2022-u1"}'::jsonb)
on conflict (collection_id,language_code,edition_key) do nothing;

insert into flashcards_os.formats (collection_id,format_key,status,specification)
values ('fc-zoo-016','flashcards','legacy_intake','{"source":"catalogue-2022","specificationStatus":"not-supplied"}'::jsonb)
on conflict (collection_id,format_key) do nothing;

insert into flashcards_os.collection_versions (collection_id,version_label,status,change_summary,content_snapshot,created_by)
values ('fc-zoo-016','0.1-legacy-import','draft','Entrée canonique créée depuis le catalogue 2022',jsonb_build_object('sourcePage',6,'expectedCardCount',10,'historicalPriceDh',20),'UMZ1 migration')
on conflict (collection_id,version_label) do nothing;
insert into flashcards_os.collections (
  id,family_id,category_id,code,name,slug,legacy_domain,legacy_number,expected_card_count,structured_card_count,
  historical_price_dh,primary_format,status,lifecycle,readiness_score,age_min_months,age_max_months,languages,
  methodologies,primary_objective,audiences,usage_contexts,owner_name,source_page,source_label,legacy_issues,notes,current_version,metadata
) values (
  'fc-zoo-017','family-learning-cards','sub-nature-features','FC-ZOO-017','Animaux carnivores','animaux-carnivores','ZOO','17',
  10,0,20,'flashcards','needs_structuring','legacy_intake',36,
  36,144,array['fr']::text[],array['Montessori','Freinet','Steiner-Waldorf']::text[],'À structurer depuis le contenu source complet; le catalogue 2022 fournit le titre, la quantité et le prix historique, mais pas le registre carte par carte.',array['B2C Familles','B2B Écoles & crèches']::text[],
  array['Maison','Classe','Atelier éducatif']::text[],'Direction Produit',6,'NEW VERSION OF CATALOGUE FC 2022','[]'::jsonb,'','0.1-legacy-import',
  '{"seed": "catalogue-2022-u1", "sourcePage": 6}'::jsonb
) on conflict (id) do update set
  category_id=excluded.category_id,code=excluded.code,name=excluded.name,slug=excluded.slug,legacy_domain=excluded.legacy_domain,
  legacy_number=excluded.legacy_number,expected_card_count=excluded.expected_card_count,historical_price_dh=excluded.historical_price_dh,
  primary_format=excluded.primary_format,status=excluded.status,lifecycle=excluded.lifecycle,readiness_score=excluded.readiness_score,
  age_min_months=excluded.age_min_months,age_max_months=excluded.age_max_months,languages=excluded.languages,methodologies=excluded.methodologies,
  primary_objective=excluded.primary_objective,audiences=excluded.audiences,usage_contexts=excluded.usage_contexts,owner_name=excluded.owner_name,
  source_page=excluded.source_page,source_label=excluded.source_label,legacy_issues=excluded.legacy_issues,notes=excluded.notes,current_version=excluded.current_version,
  metadata=excluded.metadata,updated_at=now();

insert into flashcards_os.editions (collection_id,language_code,edition_key,version_label,status,metadata)
values ('fc-zoo-017','fr','standard','0.1-legacy-import','legacy_intake','{"seed":"catalogue-2022-u1"}'::jsonb)
on conflict (collection_id,language_code,edition_key) do nothing;

insert into flashcards_os.formats (collection_id,format_key,status,specification)
values ('fc-zoo-017','flashcards','legacy_intake','{"source":"catalogue-2022","specificationStatus":"not-supplied"}'::jsonb)
on conflict (collection_id,format_key) do nothing;

insert into flashcards_os.collection_versions (collection_id,version_label,status,change_summary,content_snapshot,created_by)
values ('fc-zoo-017','0.1-legacy-import','draft','Entrée canonique créée depuis le catalogue 2022',jsonb_build_object('sourcePage',6,'expectedCardCount',10,'historicalPriceDh',20),'UMZ1 migration')
on conflict (collection_id,version_label) do nothing;
insert into flashcards_os.collections (
  id,family_id,category_id,code,name,slug,legacy_domain,legacy_number,expected_card_count,structured_card_count,
  historical_price_dh,primary_format,status,lifecycle,readiness_score,age_min_months,age_max_months,languages,
  methodologies,primary_objective,audiences,usage_contexts,owner_name,source_page,source_label,legacy_issues,notes,current_version,metadata
) values (
  'fc-cult-001','family-learning-cards','sub-culture-world','FC-CULT-001','Mélange culture générale','melange-culture-generale','CULT','1',
  20,0,40,'flashcards','needs_structuring','legacy_intake',36,
  36,144,array['fr']::text[],array['Montessori','Freinet','Steiner-Waldorf']::text[],'À structurer depuis le contenu source complet; le catalogue 2022 fournit le titre, la quantité et le prix historique, mais pas le registre carte par carte.',array['B2C Familles','B2B Écoles & crèches']::text[],
  array['Maison','Classe','Atelier éducatif']::text[],'Direction Produit',7,'NEW VERSION OF CATALOGUE FC 2022','[]'::jsonb,'','0.1-legacy-import',
  '{"seed": "catalogue-2022-u1", "sourcePage": 7}'::jsonb
) on conflict (id) do update set
  category_id=excluded.category_id,code=excluded.code,name=excluded.name,slug=excluded.slug,legacy_domain=excluded.legacy_domain,
  legacy_number=excluded.legacy_number,expected_card_count=excluded.expected_card_count,historical_price_dh=excluded.historical_price_dh,
  primary_format=excluded.primary_format,status=excluded.status,lifecycle=excluded.lifecycle,readiness_score=excluded.readiness_score,
  age_min_months=excluded.age_min_months,age_max_months=excluded.age_max_months,languages=excluded.languages,methodologies=excluded.methodologies,
  primary_objective=excluded.primary_objective,audiences=excluded.audiences,usage_contexts=excluded.usage_contexts,owner_name=excluded.owner_name,
  source_page=excluded.source_page,source_label=excluded.source_label,legacy_issues=excluded.legacy_issues,notes=excluded.notes,current_version=excluded.current_version,
  metadata=excluded.metadata,updated_at=now();

insert into flashcards_os.editions (collection_id,language_code,edition_key,version_label,status,metadata)
values ('fc-cult-001','fr','standard','0.1-legacy-import','legacy_intake','{"seed":"catalogue-2022-u1"}'::jsonb)
on conflict (collection_id,language_code,edition_key) do nothing;

insert into flashcards_os.formats (collection_id,format_key,status,specification)
values ('fc-cult-001','flashcards','legacy_intake','{"source":"catalogue-2022","specificationStatus":"not-supplied"}'::jsonb)
on conflict (collection_id,format_key) do nothing;

insert into flashcards_os.collection_versions (collection_id,version_label,status,change_summary,content_snapshot,created_by)
values ('fc-cult-001','0.1-legacy-import','draft','Entrée canonique créée depuis le catalogue 2022',jsonb_build_object('sourcePage',7,'expectedCardCount',20,'historicalPriceDh',40),'UMZ1 migration')
on conflict (collection_id,version_label) do nothing;
insert into flashcards_os.collections (
  id,family_id,category_id,code,name,slug,legacy_domain,legacy_number,expected_card_count,structured_card_count,
  historical_price_dh,primary_format,status,lifecycle,readiness_score,age_min_months,age_max_months,languages,
  methodologies,primary_objective,audiences,usage_contexts,owner_name,source_page,source_label,legacy_issues,notes,current_version,metadata
) values (
  'fc-cult-002','family-learning-cards','sub-culture-world','FC-CULT-002','Les langues du monde','les-langues-du-monde','CULT','2',
  25,0,30,'flashcards','needs_structuring','legacy_intake',36,
  36,144,array['fr']::text[],array['Montessori','Freinet','Steiner-Waldorf']::text[],'À structurer depuis le contenu source complet; le catalogue 2022 fournit le titre, la quantité et le prix historique, mais pas le registre carte par carte.',array['B2C Familles','B2B Écoles & crèches']::text[],
  array['Maison','Classe','Atelier éducatif']::text[],'Direction Produit',7,'NEW VERSION OF CATALOGUE FC 2022','[]'::jsonb,'','0.1-legacy-import',
  '{"seed": "catalogue-2022-u1", "sourcePage": 7}'::jsonb
) on conflict (id) do update set
  category_id=excluded.category_id,code=excluded.code,name=excluded.name,slug=excluded.slug,legacy_domain=excluded.legacy_domain,
  legacy_number=excluded.legacy_number,expected_card_count=excluded.expected_card_count,historical_price_dh=excluded.historical_price_dh,
  primary_format=excluded.primary_format,status=excluded.status,lifecycle=excluded.lifecycle,readiness_score=excluded.readiness_score,
  age_min_months=excluded.age_min_months,age_max_months=excluded.age_max_months,languages=excluded.languages,methodologies=excluded.methodologies,
  primary_objective=excluded.primary_objective,audiences=excluded.audiences,usage_contexts=excluded.usage_contexts,owner_name=excluded.owner_name,
  source_page=excluded.source_page,source_label=excluded.source_label,legacy_issues=excluded.legacy_issues,notes=excluded.notes,current_version=excluded.current_version,
  metadata=excluded.metadata,updated_at=now();

insert into flashcards_os.editions (collection_id,language_code,edition_key,version_label,status,metadata)
values ('fc-cult-002','fr','standard','0.1-legacy-import','legacy_intake','{"seed":"catalogue-2022-u1"}'::jsonb)
on conflict (collection_id,language_code,edition_key) do nothing;

insert into flashcards_os.formats (collection_id,format_key,status,specification)
values ('fc-cult-002','flashcards','legacy_intake','{"source":"catalogue-2022","specificationStatus":"not-supplied"}'::jsonb)
on conflict (collection_id,format_key) do nothing;

insert into flashcards_os.collection_versions (collection_id,version_label,status,change_summary,content_snapshot,created_by)
values ('fc-cult-002','0.1-legacy-import','draft','Entrée canonique créée depuis le catalogue 2022',jsonb_build_object('sourcePage',7,'expectedCardCount',25,'historicalPriceDh',30),'UMZ1 migration')
on conflict (collection_id,version_label) do nothing;
insert into flashcards_os.collections (
  id,family_id,category_id,code,name,slug,legacy_domain,legacy_number,expected_card_count,structured_card_count,
  historical_price_dh,primary_format,status,lifecycle,readiness_score,age_min_months,age_max_months,languages,
  methodologies,primary_objective,audiences,usage_contexts,owner_name,source_page,source_label,legacy_issues,notes,current_version,metadata
) values (
  'fc-cult-003','family-learning-cards','sub-culture-world','FC-CULT-003','Monnaies du monde','monnaies-du-monde','CULT','3',
  27,0,54,'flashcards','needs_structuring','legacy_intake',36,
  36,144,array['fr']::text[],array['Montessori','Freinet','Steiner-Waldorf']::text[],'À structurer depuis le contenu source complet; le catalogue 2022 fournit le titre, la quantité et le prix historique, mais pas le registre carte par carte.',array['B2C Familles','B2B Écoles & crèches']::text[],
  array['Maison','Classe','Atelier éducatif']::text[],'Direction Produit',7,'NEW VERSION OF CATALOGUE FC 2022','[]'::jsonb,'','0.1-legacy-import',
  '{"seed": "catalogue-2022-u1", "sourcePage": 7}'::jsonb
) on conflict (id) do update set
  category_id=excluded.category_id,code=excluded.code,name=excluded.name,slug=excluded.slug,legacy_domain=excluded.legacy_domain,
  legacy_number=excluded.legacy_number,expected_card_count=excluded.expected_card_count,historical_price_dh=excluded.historical_price_dh,
  primary_format=excluded.primary_format,status=excluded.status,lifecycle=excluded.lifecycle,readiness_score=excluded.readiness_score,
  age_min_months=excluded.age_min_months,age_max_months=excluded.age_max_months,languages=excluded.languages,methodologies=excluded.methodologies,
  primary_objective=excluded.primary_objective,audiences=excluded.audiences,usage_contexts=excluded.usage_contexts,owner_name=excluded.owner_name,
  source_page=excluded.source_page,source_label=excluded.source_label,legacy_issues=excluded.legacy_issues,notes=excluded.notes,current_version=excluded.current_version,
  metadata=excluded.metadata,updated_at=now();

insert into flashcards_os.editions (collection_id,language_code,edition_key,version_label,status,metadata)
values ('fc-cult-003','fr','standard','0.1-legacy-import','legacy_intake','{"seed":"catalogue-2022-u1"}'::jsonb)
on conflict (collection_id,language_code,edition_key) do nothing;

insert into flashcards_os.formats (collection_id,format_key,status,specification)
values ('fc-cult-003','flashcards','legacy_intake','{"source":"catalogue-2022","specificationStatus":"not-supplied"}'::jsonb)
on conflict (collection_id,format_key) do nothing;

insert into flashcards_os.collection_versions (collection_id,version_label,status,change_summary,content_snapshot,created_by)
values ('fc-cult-003','0.1-legacy-import','draft','Entrée canonique créée depuis le catalogue 2022',jsonb_build_object('sourcePage',7,'expectedCardCount',27,'historicalPriceDh',54),'UMZ1 migration')
on conflict (collection_id,version_label) do nothing;
insert into flashcards_os.collections (
  id,family_id,category_id,code,name,slug,legacy_domain,legacy_number,expected_card_count,structured_card_count,
  historical_price_dh,primary_format,status,lifecycle,readiness_score,age_min_months,age_max_months,languages,
  methodologies,primary_objective,audiences,usage_contexts,owner_name,source_page,source_label,legacy_issues,notes,current_version,metadata
) values (
  'fc-cult-004','family-learning-cards','sub-culture-world','FC-CULT-004','Instruments de musique','instruments-de-musique','CULT','4',
  20,0,40,'flashcards','needs_structuring','legacy_intake',36,
  36,144,array['fr']::text[],array['Montessori','Freinet','Steiner-Waldorf']::text[],'À structurer depuis le contenu source complet; le catalogue 2022 fournit le titre, la quantité et le prix historique, mais pas le registre carte par carte.',array['B2C Familles','B2B Écoles & crèches']::text[],
  array['Maison','Classe','Atelier éducatif']::text[],'Direction Produit',7,'NEW VERSION OF CATALOGUE FC 2022','[]'::jsonb,'','0.1-legacy-import',
  '{"seed": "catalogue-2022-u1", "sourcePage": 7}'::jsonb
) on conflict (id) do update set
  category_id=excluded.category_id,code=excluded.code,name=excluded.name,slug=excluded.slug,legacy_domain=excluded.legacy_domain,
  legacy_number=excluded.legacy_number,expected_card_count=excluded.expected_card_count,historical_price_dh=excluded.historical_price_dh,
  primary_format=excluded.primary_format,status=excluded.status,lifecycle=excluded.lifecycle,readiness_score=excluded.readiness_score,
  age_min_months=excluded.age_min_months,age_max_months=excluded.age_max_months,languages=excluded.languages,methodologies=excluded.methodologies,
  primary_objective=excluded.primary_objective,audiences=excluded.audiences,usage_contexts=excluded.usage_contexts,owner_name=excluded.owner_name,
  source_page=excluded.source_page,source_label=excluded.source_label,legacy_issues=excluded.legacy_issues,notes=excluded.notes,current_version=excluded.current_version,
  metadata=excluded.metadata,updated_at=now();

insert into flashcards_os.editions (collection_id,language_code,edition_key,version_label,status,metadata)
values ('fc-cult-004','fr','standard','0.1-legacy-import','legacy_intake','{"seed":"catalogue-2022-u1"}'::jsonb)
on conflict (collection_id,language_code,edition_key) do nothing;

insert into flashcards_os.formats (collection_id,format_key,status,specification)
values ('fc-cult-004','flashcards','legacy_intake','{"source":"catalogue-2022","specificationStatus":"not-supplied"}'::jsonb)
on conflict (collection_id,format_key) do nothing;

insert into flashcards_os.collection_versions (collection_id,version_label,status,change_summary,content_snapshot,created_by)
values ('fc-cult-004','0.1-legacy-import','draft','Entrée canonique créée depuis le catalogue 2022',jsonb_build_object('sourcePage',7,'expectedCardCount',20,'historicalPriceDh',40),'UMZ1 migration')
on conflict (collection_id,version_label) do nothing;
insert into flashcards_os.collections (
  id,family_id,category_id,code,name,slug,legacy_domain,legacy_number,expected_card_count,structured_card_count,
  historical_price_dh,primary_format,status,lifecycle,readiness_score,age_min_months,age_max_months,languages,
  methodologies,primary_objective,audiences,usage_contexts,owner_name,source_page,source_label,legacy_issues,notes,current_version,metadata
) values (
  'fc-cult-005','family-learning-cards','sub-culture-world','FC-CULT-005','Mélange de sports','melange-de-sports','CULT','5',
  20,0,40,'flashcards','needs_structuring','legacy_intake',36,
  36,144,array['fr']::text[],array['Montessori','Freinet','Steiner-Waldorf']::text[],'À structurer depuis le contenu source complet; le catalogue 2022 fournit le titre, la quantité et le prix historique, mais pas le registre carte par carte.',array['B2C Familles','B2B Écoles & crèches']::text[],
  array['Maison','Classe','Atelier éducatif']::text[],'Direction Produit',7,'NEW VERSION OF CATALOGUE FC 2022','[]'::jsonb,'','0.1-legacy-import',
  '{"seed": "catalogue-2022-u1", "sourcePage": 7}'::jsonb
) on conflict (id) do update set
  category_id=excluded.category_id,code=excluded.code,name=excluded.name,slug=excluded.slug,legacy_domain=excluded.legacy_domain,
  legacy_number=excluded.legacy_number,expected_card_count=excluded.expected_card_count,historical_price_dh=excluded.historical_price_dh,
  primary_format=excluded.primary_format,status=excluded.status,lifecycle=excluded.lifecycle,readiness_score=excluded.readiness_score,
  age_min_months=excluded.age_min_months,age_max_months=excluded.age_max_months,languages=excluded.languages,methodologies=excluded.methodologies,
  primary_objective=excluded.primary_objective,audiences=excluded.audiences,usage_contexts=excluded.usage_contexts,owner_name=excluded.owner_name,
  source_page=excluded.source_page,source_label=excluded.source_label,legacy_issues=excluded.legacy_issues,notes=excluded.notes,current_version=excluded.current_version,
  metadata=excluded.metadata,updated_at=now();

insert into flashcards_os.editions (collection_id,language_code,edition_key,version_label,status,metadata)
values ('fc-cult-005','fr','standard','0.1-legacy-import','legacy_intake','{"seed":"catalogue-2022-u1"}'::jsonb)
on conflict (collection_id,language_code,edition_key) do nothing;

insert into flashcards_os.formats (collection_id,format_key,status,specification)
values ('fc-cult-005','flashcards','legacy_intake','{"source":"catalogue-2022","specificationStatus":"not-supplied"}'::jsonb)
on conflict (collection_id,format_key) do nothing;

insert into flashcards_os.collection_versions (collection_id,version_label,status,change_summary,content_snapshot,created_by)
values ('fc-cult-005','0.1-legacy-import','draft','Entrée canonique créée depuis le catalogue 2022',jsonb_build_object('sourcePage',7,'expectedCardCount',20,'historicalPriceDh',40),'UMZ1 migration')
on conflict (collection_id,version_label) do nothing;
insert into flashcards_os.collections (
  id,family_id,category_id,code,name,slug,legacy_domain,legacy_number,expected_card_count,structured_card_count,
  historical_price_dh,primary_format,status,lifecycle,readiness_score,age_min_months,age_max_months,languages,
  methodologies,primary_objective,audiences,usage_contexts,owner_name,source_page,source_label,legacy_issues,notes,current_version,metadata
) values (
  'fc-cult-006','family-learning-cards','sub-culture-world','FC-CULT-006','Cuisine du monde','cuisine-du-monde','CULT','6',
  17,0,34,'flashcards','needs_structuring','legacy_intake',36,
  36,144,array['fr']::text[],array['Montessori','Freinet','Steiner-Waldorf']::text[],'À structurer depuis le contenu source complet; le catalogue 2022 fournit le titre, la quantité et le prix historique, mais pas le registre carte par carte.',array['B2C Familles','B2B Écoles & crèches']::text[],
  array['Maison','Classe','Atelier éducatif']::text[],'Direction Produit',7,'NEW VERSION OF CATALOGUE FC 2022','[]'::jsonb,'','0.1-legacy-import',
  '{"seed": "catalogue-2022-u1", "sourcePage": 7}'::jsonb
) on conflict (id) do update set
  category_id=excluded.category_id,code=excluded.code,name=excluded.name,slug=excluded.slug,legacy_domain=excluded.legacy_domain,
  legacy_number=excluded.legacy_number,expected_card_count=excluded.expected_card_count,historical_price_dh=excluded.historical_price_dh,
  primary_format=excluded.primary_format,status=excluded.status,lifecycle=excluded.lifecycle,readiness_score=excluded.readiness_score,
  age_min_months=excluded.age_min_months,age_max_months=excluded.age_max_months,languages=excluded.languages,methodologies=excluded.methodologies,
  primary_objective=excluded.primary_objective,audiences=excluded.audiences,usage_contexts=excluded.usage_contexts,owner_name=excluded.owner_name,
  source_page=excluded.source_page,source_label=excluded.source_label,legacy_issues=excluded.legacy_issues,notes=excluded.notes,current_version=excluded.current_version,
  metadata=excluded.metadata,updated_at=now();

insert into flashcards_os.editions (collection_id,language_code,edition_key,version_label,status,metadata)
values ('fc-cult-006','fr','standard','0.1-legacy-import','legacy_intake','{"seed":"catalogue-2022-u1"}'::jsonb)
on conflict (collection_id,language_code,edition_key) do nothing;

insert into flashcards_os.formats (collection_id,format_key,status,specification)
values ('fc-cult-006','flashcards','legacy_intake','{"source":"catalogue-2022","specificationStatus":"not-supplied"}'::jsonb)
on conflict (collection_id,format_key) do nothing;

insert into flashcards_os.collection_versions (collection_id,version_label,status,change_summary,content_snapshot,created_by)
values ('fc-cult-006','0.1-legacy-import','draft','Entrée canonique créée depuis le catalogue 2022',jsonb_build_object('sourcePage',7,'expectedCardCount',17,'historicalPriceDh',34),'UMZ1 migration')
on conflict (collection_id,version_label) do nothing;
insert into flashcards_os.collections (
  id,family_id,category_id,code,name,slug,legacy_domain,legacy_number,expected_card_count,structured_card_count,
  historical_price_dh,primary_format,status,lifecycle,readiness_score,age_min_months,age_max_months,languages,
  methodologies,primary_objective,audiences,usage_contexts,owner_name,source_page,source_label,legacy_issues,notes,current_version,metadata
) values (
  'fc-cult-007','family-learning-cards','sub-culture-world','FC-CULT-007','Costumes traditionnels','costumes-traditionnels','CULT','7',
  17,0,34,'flashcards','needs_structuring','legacy_intake',36,
  36,144,array['fr']::text[],array['Montessori','Freinet','Steiner-Waldorf']::text[],'À structurer depuis le contenu source complet; le catalogue 2022 fournit le titre, la quantité et le prix historique, mais pas le registre carte par carte.',array['B2C Familles','B2B Écoles & crèches']::text[],
  array['Maison','Classe','Atelier éducatif']::text[],'Direction Produit',7,'NEW VERSION OF CATALOGUE FC 2022','[]'::jsonb,'','0.1-legacy-import',
  '{"seed": "catalogue-2022-u1", "sourcePage": 7}'::jsonb
) on conflict (id) do update set
  category_id=excluded.category_id,code=excluded.code,name=excluded.name,slug=excluded.slug,legacy_domain=excluded.legacy_domain,
  legacy_number=excluded.legacy_number,expected_card_count=excluded.expected_card_count,historical_price_dh=excluded.historical_price_dh,
  primary_format=excluded.primary_format,status=excluded.status,lifecycle=excluded.lifecycle,readiness_score=excluded.readiness_score,
  age_min_months=excluded.age_min_months,age_max_months=excluded.age_max_months,languages=excluded.languages,methodologies=excluded.methodologies,
  primary_objective=excluded.primary_objective,audiences=excluded.audiences,usage_contexts=excluded.usage_contexts,owner_name=excluded.owner_name,
  source_page=excluded.source_page,source_label=excluded.source_label,legacy_issues=excluded.legacy_issues,notes=excluded.notes,current_version=excluded.current_version,
  metadata=excluded.metadata,updated_at=now();

insert into flashcards_os.editions (collection_id,language_code,edition_key,version_label,status,metadata)
values ('fc-cult-007','fr','standard','0.1-legacy-import','legacy_intake','{"seed":"catalogue-2022-u1"}'::jsonb)
on conflict (collection_id,language_code,edition_key) do nothing;

insert into flashcards_os.formats (collection_id,format_key,status,specification)
values ('fc-cult-007','flashcards','legacy_intake','{"source":"catalogue-2022","specificationStatus":"not-supplied"}'::jsonb)
on conflict (collection_id,format_key) do nothing;

insert into flashcards_os.collection_versions (collection_id,version_label,status,change_summary,content_snapshot,created_by)
values ('fc-cult-007','0.1-legacy-import','draft','Entrée canonique créée depuis le catalogue 2022',jsonb_build_object('sourcePage',7,'expectedCardCount',17,'historicalPriceDh',34),'UMZ1 migration')
on conflict (collection_id,version_label) do nothing;
insert into flashcards_os.collections (
  id,family_id,category_id,code,name,slug,legacy_domain,legacy_number,expected_card_count,structured_card_count,
  historical_price_dh,primary_format,status,lifecycle,readiness_score,age_min_months,age_max_months,languages,
  methodologies,primary_objective,audiences,usage_contexts,owner_name,source_page,source_label,legacy_issues,notes,current_version,metadata
) values (
  'fc-cult-008','family-learning-cards','sub-culture-world','FC-CULT-008','Les personnes qui ont marqué le monde','les-personnes-qui-ont-marque-le-monde','CULT','8',
  17,0,34,'flashcards','needs_structuring','legacy_intake',36,
  36,144,array['fr']::text[],array['Montessori','Freinet','Steiner-Waldorf']::text[],'À structurer depuis le contenu source complet; le catalogue 2022 fournit le titre, la quantité et le prix historique, mais pas le registre carte par carte.',array['B2C Familles','B2B Écoles & crèches']::text[],
  array['Maison','Classe','Atelier éducatif']::text[],'Direction Produit',7,'NEW VERSION OF CATALOGUE FC 2022','[]'::jsonb,'','0.1-legacy-import',
  '{"seed": "catalogue-2022-u1", "sourcePage": 7}'::jsonb
) on conflict (id) do update set
  category_id=excluded.category_id,code=excluded.code,name=excluded.name,slug=excluded.slug,legacy_domain=excluded.legacy_domain,
  legacy_number=excluded.legacy_number,expected_card_count=excluded.expected_card_count,historical_price_dh=excluded.historical_price_dh,
  primary_format=excluded.primary_format,status=excluded.status,lifecycle=excluded.lifecycle,readiness_score=excluded.readiness_score,
  age_min_months=excluded.age_min_months,age_max_months=excluded.age_max_months,languages=excluded.languages,methodologies=excluded.methodologies,
  primary_objective=excluded.primary_objective,audiences=excluded.audiences,usage_contexts=excluded.usage_contexts,owner_name=excluded.owner_name,
  source_page=excluded.source_page,source_label=excluded.source_label,legacy_issues=excluded.legacy_issues,notes=excluded.notes,current_version=excluded.current_version,
  metadata=excluded.metadata,updated_at=now();

insert into flashcards_os.editions (collection_id,language_code,edition_key,version_label,status,metadata)
values ('fc-cult-008','fr','standard','0.1-legacy-import','legacy_intake','{"seed":"catalogue-2022-u1"}'::jsonb)
on conflict (collection_id,language_code,edition_key) do nothing;

insert into flashcards_os.formats (collection_id,format_key,status,specification)
values ('fc-cult-008','flashcards','legacy_intake','{"source":"catalogue-2022","specificationStatus":"not-supplied"}'::jsonb)
on conflict (collection_id,format_key) do nothing;

insert into flashcards_os.collection_versions (collection_id,version_label,status,change_summary,content_snapshot,created_by)
values ('fc-cult-008','0.1-legacy-import','draft','Entrée canonique créée depuis le catalogue 2022',jsonb_build_object('sourcePage',7,'expectedCardCount',17,'historicalPriceDh',34),'UMZ1 migration')
on conflict (collection_id,version_label) do nothing;
insert into flashcards_os.collections (
  id,family_id,category_id,code,name,slug,legacy_domain,legacy_number,expected_card_count,structured_card_count,
  historical_price_dh,primary_format,status,lifecycle,readiness_score,age_min_months,age_max_months,languages,
  methodologies,primary_objective,audiences,usage_contexts,owner_name,source_page,source_label,legacy_issues,notes,current_version,metadata
) values (
  'fc-cult-009','family-learning-cards','sub-culture-world','FC-CULT-009','Les merveilles du monde','les-merveilles-du-monde','CULT','9',
  7,0,14,'flashcards','needs_structuring','legacy_intake',36,
  36,144,array['fr']::text[],array['Montessori','Freinet','Steiner-Waldorf']::text[],'À structurer depuis le contenu source complet; le catalogue 2022 fournit le titre, la quantité et le prix historique, mais pas le registre carte par carte.',array['B2C Familles','B2B Écoles & crèches']::text[],
  array['Maison','Classe','Atelier éducatif']::text[],'Direction Produit',7,'NEW VERSION OF CATALOGUE FC 2022','[]'::jsonb,'','0.1-legacy-import',
  '{"seed": "catalogue-2022-u1", "sourcePage": 7}'::jsonb
) on conflict (id) do update set
  category_id=excluded.category_id,code=excluded.code,name=excluded.name,slug=excluded.slug,legacy_domain=excluded.legacy_domain,
  legacy_number=excluded.legacy_number,expected_card_count=excluded.expected_card_count,historical_price_dh=excluded.historical_price_dh,
  primary_format=excluded.primary_format,status=excluded.status,lifecycle=excluded.lifecycle,readiness_score=excluded.readiness_score,
  age_min_months=excluded.age_min_months,age_max_months=excluded.age_max_months,languages=excluded.languages,methodologies=excluded.methodologies,
  primary_objective=excluded.primary_objective,audiences=excluded.audiences,usage_contexts=excluded.usage_contexts,owner_name=excluded.owner_name,
  source_page=excluded.source_page,source_label=excluded.source_label,legacy_issues=excluded.legacy_issues,notes=excluded.notes,current_version=excluded.current_version,
  metadata=excluded.metadata,updated_at=now();

insert into flashcards_os.editions (collection_id,language_code,edition_key,version_label,status,metadata)
values ('fc-cult-009','fr','standard','0.1-legacy-import','legacy_intake','{"seed":"catalogue-2022-u1"}'::jsonb)
on conflict (collection_id,language_code,edition_key) do nothing;

insert into flashcards_os.formats (collection_id,format_key,status,specification)
values ('fc-cult-009','flashcards','legacy_intake','{"source":"catalogue-2022","specificationStatus":"not-supplied"}'::jsonb)
on conflict (collection_id,format_key) do nothing;

insert into flashcards_os.collection_versions (collection_id,version_label,status,change_summary,content_snapshot,created_by)
values ('fc-cult-009','0.1-legacy-import','draft','Entrée canonique créée depuis le catalogue 2022',jsonb_build_object('sourcePage',7,'expectedCardCount',7,'historicalPriceDh',14),'UMZ1 migration')
on conflict (collection_id,version_label) do nothing;
insert into flashcards_os.collections (
  id,family_id,category_id,code,name,slug,legacy_domain,legacy_number,expected_card_count,structured_card_count,
  historical_price_dh,primary_format,status,lifecycle,readiness_score,age_min_months,age_max_months,languages,
  methodologies,primary_objective,audiences,usage_contexts,owner_name,source_page,source_label,legacy_issues,notes,current_version,metadata
) values (
  'fc-cult-010','family-learning-cards','sub-culture-discovery','FC-CULT-010','Les différentes sources d’énergie','les-differentes-sources-denergie','CULT','10',
  10,0,20,'flashcards','needs_structuring','legacy_intake',36,
  36,144,array['fr']::text[],array['Montessori','Freinet','Steiner-Waldorf']::text[],'À structurer depuis le contenu source complet; le catalogue 2022 fournit le titre, la quantité et le prix historique, mais pas le registre carte par carte.',array['B2C Familles','B2B Écoles & crèches']::text[],
  array['Maison','Classe','Atelier éducatif']::text[],'Direction Produit',7,'NEW VERSION OF CATALOGUE FC 2022','[]'::jsonb,'','0.1-legacy-import',
  '{"seed": "catalogue-2022-u1", "sourcePage": 7}'::jsonb
) on conflict (id) do update set
  category_id=excluded.category_id,code=excluded.code,name=excluded.name,slug=excluded.slug,legacy_domain=excluded.legacy_domain,
  legacy_number=excluded.legacy_number,expected_card_count=excluded.expected_card_count,historical_price_dh=excluded.historical_price_dh,
  primary_format=excluded.primary_format,status=excluded.status,lifecycle=excluded.lifecycle,readiness_score=excluded.readiness_score,
  age_min_months=excluded.age_min_months,age_max_months=excluded.age_max_months,languages=excluded.languages,methodologies=excluded.methodologies,
  primary_objective=excluded.primary_objective,audiences=excluded.audiences,usage_contexts=excluded.usage_contexts,owner_name=excluded.owner_name,
  source_page=excluded.source_page,source_label=excluded.source_label,legacy_issues=excluded.legacy_issues,notes=excluded.notes,current_version=excluded.current_version,
  metadata=excluded.metadata,updated_at=now();

insert into flashcards_os.editions (collection_id,language_code,edition_key,version_label,status,metadata)
values ('fc-cult-010','fr','standard','0.1-legacy-import','legacy_intake','{"seed":"catalogue-2022-u1"}'::jsonb)
on conflict (collection_id,language_code,edition_key) do nothing;

insert into flashcards_os.formats (collection_id,format_key,status,specification)
values ('fc-cult-010','flashcards','legacy_intake','{"source":"catalogue-2022","specificationStatus":"not-supplied"}'::jsonb)
on conflict (collection_id,format_key) do nothing;

insert into flashcards_os.collection_versions (collection_id,version_label,status,change_summary,content_snapshot,created_by)
values ('fc-cult-010','0.1-legacy-import','draft','Entrée canonique créée depuis le catalogue 2022',jsonb_build_object('sourcePage',7,'expectedCardCount',10,'historicalPriceDh',20),'UMZ1 migration')
on conflict (collection_id,version_label) do nothing;
insert into flashcards_os.collections (
  id,family_id,category_id,code,name,slug,legacy_domain,legacy_number,expected_card_count,structured_card_count,
  historical_price_dh,primary_format,status,lifecycle,readiness_score,age_min_months,age_max_months,languages,
  methodologies,primary_objective,audiences,usage_contexts,owner_name,source_page,source_label,legacy_issues,notes,current_version,metadata
) values (
  'fc-cult-011','family-learning-cards','sub-culture-discovery','FC-CULT-011','Les types de métaux','les-types-de-metaux','CULT','11',
  15,0,30,'flashcards','needs_structuring','legacy_intake',36,
  36,144,array['fr']::text[],array['Montessori','Freinet','Steiner-Waldorf']::text[],'À structurer depuis le contenu source complet; le catalogue 2022 fournit le titre, la quantité et le prix historique, mais pas le registre carte par carte.',array['B2C Familles','B2B Écoles & crèches']::text[],
  array['Maison','Classe','Atelier éducatif']::text[],'Direction Produit',7,'NEW VERSION OF CATALOGUE FC 2022','[]'::jsonb,'','0.1-legacy-import',
  '{"seed": "catalogue-2022-u1", "sourcePage": 7}'::jsonb
) on conflict (id) do update set
  category_id=excluded.category_id,code=excluded.code,name=excluded.name,slug=excluded.slug,legacy_domain=excluded.legacy_domain,
  legacy_number=excluded.legacy_number,expected_card_count=excluded.expected_card_count,historical_price_dh=excluded.historical_price_dh,
  primary_format=excluded.primary_format,status=excluded.status,lifecycle=excluded.lifecycle,readiness_score=excluded.readiness_score,
  age_min_months=excluded.age_min_months,age_max_months=excluded.age_max_months,languages=excluded.languages,methodologies=excluded.methodologies,
  primary_objective=excluded.primary_objective,audiences=excluded.audiences,usage_contexts=excluded.usage_contexts,owner_name=excluded.owner_name,
  source_page=excluded.source_page,source_label=excluded.source_label,legacy_issues=excluded.legacy_issues,notes=excluded.notes,current_version=excluded.current_version,
  metadata=excluded.metadata,updated_at=now();

insert into flashcards_os.editions (collection_id,language_code,edition_key,version_label,status,metadata)
values ('fc-cult-011','fr','standard','0.1-legacy-import','legacy_intake','{"seed":"catalogue-2022-u1"}'::jsonb)
on conflict (collection_id,language_code,edition_key) do nothing;

insert into flashcards_os.formats (collection_id,format_key,status,specification)
values ('fc-cult-011','flashcards','legacy_intake','{"source":"catalogue-2022","specificationStatus":"not-supplied"}'::jsonb)
on conflict (collection_id,format_key) do nothing;

insert into flashcards_os.collection_versions (collection_id,version_label,status,change_summary,content_snapshot,created_by)
values ('fc-cult-011','0.1-legacy-import','draft','Entrée canonique créée depuis le catalogue 2022',jsonb_build_object('sourcePage',7,'expectedCardCount',15,'historicalPriceDh',30),'UMZ1 migration')
on conflict (collection_id,version_label) do nothing;
insert into flashcards_os.collections (
  id,family_id,category_id,code,name,slug,legacy_domain,legacy_number,expected_card_count,structured_card_count,
  historical_price_dh,primary_format,status,lifecycle,readiness_score,age_min_months,age_max_months,languages,
  methodologies,primary_objective,audiences,usage_contexts,owner_name,source_page,source_label,legacy_issues,notes,current_version,metadata
) values (
  'fc-cult-012','family-learning-cards','sub-culture-discovery','FC-CULT-012','Les pierres précieuses','les-pierres-precieuses','CULT','11',
  15,0,30,'flashcards','needs_review','legacy_intake',28,
  36,144,array['fr']::text[],array['Montessori','Freinet','Steiner-Waldorf']::text[],'À structurer depuis le contenu source complet; le catalogue 2022 fournit le titre, la quantité et le prix historique, mais pas le registre carte par carte.',array['B2C Familles','B2B Écoles & crèches']::text[],
  array['Maison','Classe','Atelier éducatif']::text[],'Direction Produit',7,'NEW VERSION OF CATALOGUE FC 2022','["duplicate_legacy_number"]'::jsonb,'','0.1-legacy-import',
  '{"seed": "catalogue-2022-u1", "sourcePage": 7}'::jsonb
) on conflict (id) do update set
  category_id=excluded.category_id,code=excluded.code,name=excluded.name,slug=excluded.slug,legacy_domain=excluded.legacy_domain,
  legacy_number=excluded.legacy_number,expected_card_count=excluded.expected_card_count,historical_price_dh=excluded.historical_price_dh,
  primary_format=excluded.primary_format,status=excluded.status,lifecycle=excluded.lifecycle,readiness_score=excluded.readiness_score,
  age_min_months=excluded.age_min_months,age_max_months=excluded.age_max_months,languages=excluded.languages,methodologies=excluded.methodologies,
  primary_objective=excluded.primary_objective,audiences=excluded.audiences,usage_contexts=excluded.usage_contexts,owner_name=excluded.owner_name,
  source_page=excluded.source_page,source_label=excluded.source_label,legacy_issues=excluded.legacy_issues,notes=excluded.notes,current_version=excluded.current_version,
  metadata=excluded.metadata,updated_at=now();

insert into flashcards_os.editions (collection_id,language_code,edition_key,version_label,status,metadata)
values ('fc-cult-012','fr','standard','0.1-legacy-import','legacy_intake','{"seed":"catalogue-2022-u1"}'::jsonb)
on conflict (collection_id,language_code,edition_key) do nothing;

insert into flashcards_os.formats (collection_id,format_key,status,specification)
values ('fc-cult-012','flashcards','legacy_intake','{"source":"catalogue-2022","specificationStatus":"not-supplied"}'::jsonb)
on conflict (collection_id,format_key) do nothing;

insert into flashcards_os.collection_versions (collection_id,version_label,status,change_summary,content_snapshot,created_by)
values ('fc-cult-012','0.1-legacy-import','draft','Entrée canonique créée depuis le catalogue 2022',jsonb_build_object('sourcePage',7,'expectedCardCount',15,'historicalPriceDh',30),'UMZ1 migration')
on conflict (collection_id,version_label) do nothing;
insert into flashcards_os.collections (
  id,family_id,category_id,code,name,slug,legacy_domain,legacy_number,expected_card_count,structured_card_count,
  historical_price_dh,primary_format,status,lifecycle,readiness_score,age_min_months,age_max_months,languages,
  methodologies,primary_objective,audiences,usage_contexts,owner_name,source_page,source_label,legacy_issues,notes,current_version,metadata
) values (
  'fc-cult-013','family-learning-cards','sub-culture-discovery','FC-CULT-013','Les types de boissons','les-types-de-boissons','CULT','12',
  9,0,18,'flashcards','needs_structuring','legacy_intake',36,
  36,144,array['fr']::text[],array['Montessori','Freinet','Steiner-Waldorf']::text[],'À structurer depuis le contenu source complet; le catalogue 2022 fournit le titre, la quantité et le prix historique, mais pas le registre carte par carte.',array['B2C Familles','B2B Écoles & crèches']::text[],
  array['Maison','Classe','Atelier éducatif']::text[],'Direction Produit',7,'NEW VERSION OF CATALOGUE FC 2022','[]'::jsonb,'','0.1-legacy-import',
  '{"seed": "catalogue-2022-u1", "sourcePage": 7}'::jsonb
) on conflict (id) do update set
  category_id=excluded.category_id,code=excluded.code,name=excluded.name,slug=excluded.slug,legacy_domain=excluded.legacy_domain,
  legacy_number=excluded.legacy_number,expected_card_count=excluded.expected_card_count,historical_price_dh=excluded.historical_price_dh,
  primary_format=excluded.primary_format,status=excluded.status,lifecycle=excluded.lifecycle,readiness_score=excluded.readiness_score,
  age_min_months=excluded.age_min_months,age_max_months=excluded.age_max_months,languages=excluded.languages,methodologies=excluded.methodologies,
  primary_objective=excluded.primary_objective,audiences=excluded.audiences,usage_contexts=excluded.usage_contexts,owner_name=excluded.owner_name,
  source_page=excluded.source_page,source_label=excluded.source_label,legacy_issues=excluded.legacy_issues,notes=excluded.notes,current_version=excluded.current_version,
  metadata=excluded.metadata,updated_at=now();

insert into flashcards_os.editions (collection_id,language_code,edition_key,version_label,status,metadata)
values ('fc-cult-013','fr','standard','0.1-legacy-import','legacy_intake','{"seed":"catalogue-2022-u1"}'::jsonb)
on conflict (collection_id,language_code,edition_key) do nothing;

insert into flashcards_os.formats (collection_id,format_key,status,specification)
values ('fc-cult-013','flashcards','legacy_intake','{"source":"catalogue-2022","specificationStatus":"not-supplied"}'::jsonb)
on conflict (collection_id,format_key) do nothing;

insert into flashcards_os.collection_versions (collection_id,version_label,status,change_summary,content_snapshot,created_by)
values ('fc-cult-013','0.1-legacy-import','draft','Entrée canonique créée depuis le catalogue 2022',jsonb_build_object('sourcePage',7,'expectedCardCount',9,'historicalPriceDh',18),'UMZ1 migration')
on conflict (collection_id,version_label) do nothing;
insert into flashcards_os.collections (
  id,family_id,category_id,code,name,slug,legacy_domain,legacy_number,expected_card_count,structured_card_count,
  historical_price_dh,primary_format,status,lifecycle,readiness_score,age_min_months,age_max_months,languages,
  methodologies,primary_objective,audiences,usage_contexts,owner_name,source_page,source_label,legacy_issues,notes,current_version,metadata
) values (
  'fc-cult-014','family-learning-cards','sub-culture-discovery','FC-CULT-014','Les moyens de communication','les-moyens-de-communication','CULT','13',
  10,0,20,'flashcards','needs_structuring','legacy_intake',36,
  36,144,array['fr']::text[],array['Montessori','Freinet','Steiner-Waldorf']::text[],'À structurer depuis le contenu source complet; le catalogue 2022 fournit le titre, la quantité et le prix historique, mais pas le registre carte par carte.',array['B2C Familles','B2B Écoles & crèches']::text[],
  array['Maison','Classe','Atelier éducatif']::text[],'Direction Produit',7,'NEW VERSION OF CATALOGUE FC 2022','[]'::jsonb,'','0.1-legacy-import',
  '{"seed": "catalogue-2022-u1", "sourcePage": 7}'::jsonb
) on conflict (id) do update set
  category_id=excluded.category_id,code=excluded.code,name=excluded.name,slug=excluded.slug,legacy_domain=excluded.legacy_domain,
  legacy_number=excluded.legacy_number,expected_card_count=excluded.expected_card_count,historical_price_dh=excluded.historical_price_dh,
  primary_format=excluded.primary_format,status=excluded.status,lifecycle=excluded.lifecycle,readiness_score=excluded.readiness_score,
  age_min_months=excluded.age_min_months,age_max_months=excluded.age_max_months,languages=excluded.languages,methodologies=excluded.methodologies,
  primary_objective=excluded.primary_objective,audiences=excluded.audiences,usage_contexts=excluded.usage_contexts,owner_name=excluded.owner_name,
  source_page=excluded.source_page,source_label=excluded.source_label,legacy_issues=excluded.legacy_issues,notes=excluded.notes,current_version=excluded.current_version,
  metadata=excluded.metadata,updated_at=now();

insert into flashcards_os.editions (collection_id,language_code,edition_key,version_label,status,metadata)
values ('fc-cult-014','fr','standard','0.1-legacy-import','legacy_intake','{"seed":"catalogue-2022-u1"}'::jsonb)
on conflict (collection_id,language_code,edition_key) do nothing;

insert into flashcards_os.formats (collection_id,format_key,status,specification)
values ('fc-cult-014','flashcards','legacy_intake','{"source":"catalogue-2022","specificationStatus":"not-supplied"}'::jsonb)
on conflict (collection_id,format_key) do nothing;

insert into flashcards_os.collection_versions (collection_id,version_label,status,change_summary,content_snapshot,created_by)
values ('fc-cult-014','0.1-legacy-import','draft','Entrée canonique créée depuis le catalogue 2022',jsonb_build_object('sourcePage',7,'expectedCardCount',10,'historicalPriceDh',20),'UMZ1 migration')
on conflict (collection_id,version_label) do nothing;
insert into flashcards_os.collections (
  id,family_id,category_id,code,name,slug,legacy_domain,legacy_number,expected_card_count,structured_card_count,
  historical_price_dh,primary_format,status,lifecycle,readiness_score,age_min_months,age_max_months,languages,
  methodologies,primary_objective,audiences,usage_contexts,owner_name,source_page,source_label,legacy_issues,notes,current_version,metadata
) values (
  'fc-cult-015','family-learning-cards','sub-culture-discovery','FC-CULT-015','Les volcans du monde','les-volcans-du-monde','CULT','14',
  10,0,20,'flashcards','needs_structuring','legacy_intake',36,
  36,144,array['fr']::text[],array['Montessori','Freinet','Steiner-Waldorf']::text[],'À structurer depuis le contenu source complet; le catalogue 2022 fournit le titre, la quantité et le prix historique, mais pas le registre carte par carte.',array['B2C Familles','B2B Écoles & crèches']::text[],
  array['Maison','Classe','Atelier éducatif']::text[],'Direction Produit',7,'NEW VERSION OF CATALOGUE FC 2022','[]'::jsonb,'','0.1-legacy-import',
  '{"seed": "catalogue-2022-u1", "sourcePage": 7}'::jsonb
) on conflict (id) do update set
  category_id=excluded.category_id,code=excluded.code,name=excluded.name,slug=excluded.slug,legacy_domain=excluded.legacy_domain,
  legacy_number=excluded.legacy_number,expected_card_count=excluded.expected_card_count,historical_price_dh=excluded.historical_price_dh,
  primary_format=excluded.primary_format,status=excluded.status,lifecycle=excluded.lifecycle,readiness_score=excluded.readiness_score,
  age_min_months=excluded.age_min_months,age_max_months=excluded.age_max_months,languages=excluded.languages,methodologies=excluded.methodologies,
  primary_objective=excluded.primary_objective,audiences=excluded.audiences,usage_contexts=excluded.usage_contexts,owner_name=excluded.owner_name,
  source_page=excluded.source_page,source_label=excluded.source_label,legacy_issues=excluded.legacy_issues,notes=excluded.notes,current_version=excluded.current_version,
  metadata=excluded.metadata,updated_at=now();

insert into flashcards_os.editions (collection_id,language_code,edition_key,version_label,status,metadata)
values ('fc-cult-015','fr','standard','0.1-legacy-import','legacy_intake','{"seed":"catalogue-2022-u1"}'::jsonb)
on conflict (collection_id,language_code,edition_key) do nothing;

insert into flashcards_os.formats (collection_id,format_key,status,specification)
values ('fc-cult-015','flashcards','legacy_intake','{"source":"catalogue-2022","specificationStatus":"not-supplied"}'::jsonb)
on conflict (collection_id,format_key) do nothing;

insert into flashcards_os.collection_versions (collection_id,version_label,status,change_summary,content_snapshot,created_by)
values ('fc-cult-015','0.1-legacy-import','draft','Entrée canonique créée depuis le catalogue 2022',jsonb_build_object('sourcePage',7,'expectedCardCount',10,'historicalPriceDh',20),'UMZ1 migration')
on conflict (collection_id,version_label) do nothing;
insert into flashcards_os.collections (
  id,family_id,category_id,code,name,slug,legacy_domain,legacy_number,expected_card_count,structured_card_count,
  historical_price_dh,primary_format,status,lifecycle,readiness_score,age_min_months,age_max_months,languages,
  methodologies,primary_objective,audiences,usage_contexts,owner_name,source_page,source_label,legacy_issues,notes,current_version,metadata
) values (
  'fc-cult-016','family-learning-cards','sub-culture-discovery','FC-CULT-016','Ustensiles de cuisine','ustensiles-de-cuisine','CULT','15',
  15,0,30,'flashcards','needs_structuring','legacy_intake',36,
  36,144,array['fr']::text[],array['Montessori','Freinet','Steiner-Waldorf']::text[],'À structurer depuis le contenu source complet; le catalogue 2022 fournit le titre, la quantité et le prix historique, mais pas le registre carte par carte.',array['B2C Familles','B2B Écoles & crèches']::text[],
  array['Maison','Classe','Atelier éducatif']::text[],'Direction Produit',7,'NEW VERSION OF CATALOGUE FC 2022','[]'::jsonb,'','0.1-legacy-import',
  '{"seed": "catalogue-2022-u1", "sourcePage": 7}'::jsonb
) on conflict (id) do update set
  category_id=excluded.category_id,code=excluded.code,name=excluded.name,slug=excluded.slug,legacy_domain=excluded.legacy_domain,
  legacy_number=excluded.legacy_number,expected_card_count=excluded.expected_card_count,historical_price_dh=excluded.historical_price_dh,
  primary_format=excluded.primary_format,status=excluded.status,lifecycle=excluded.lifecycle,readiness_score=excluded.readiness_score,
  age_min_months=excluded.age_min_months,age_max_months=excluded.age_max_months,languages=excluded.languages,methodologies=excluded.methodologies,
  primary_objective=excluded.primary_objective,audiences=excluded.audiences,usage_contexts=excluded.usage_contexts,owner_name=excluded.owner_name,
  source_page=excluded.source_page,source_label=excluded.source_label,legacy_issues=excluded.legacy_issues,notes=excluded.notes,current_version=excluded.current_version,
  metadata=excluded.metadata,updated_at=now();

insert into flashcards_os.editions (collection_id,language_code,edition_key,version_label,status,metadata)
values ('fc-cult-016','fr','standard','0.1-legacy-import','legacy_intake','{"seed":"catalogue-2022-u1"}'::jsonb)
on conflict (collection_id,language_code,edition_key) do nothing;

insert into flashcards_os.formats (collection_id,format_key,status,specification)
values ('fc-cult-016','flashcards','legacy_intake','{"source":"catalogue-2022","specificationStatus":"not-supplied"}'::jsonb)
on conflict (collection_id,format_key) do nothing;

insert into flashcards_os.collection_versions (collection_id,version_label,status,change_summary,content_snapshot,created_by)
values ('fc-cult-016','0.1-legacy-import','draft','Entrée canonique créée depuis le catalogue 2022',jsonb_build_object('sourcePage',7,'expectedCardCount',15,'historicalPriceDh',30),'UMZ1 migration')
on conflict (collection_id,version_label) do nothing;

-- Create the twelve-section dossier contract for every imported collection.
insert into flashcards_os.collection_dossier_sections (collection_id,section_key,status,completeness,payload)
select id,'identity','ready',82,jsonb_build_object('deliveryContract','Ultra Mega ZIP 1')
from flashcards_os.collections
on conflict (collection_id,section_key) do update set status=excluded.status,completeness=excluded.completeness,payload=excluded.payload,updated_at=now();
insert into flashcards_os.collection_dossier_sections (collection_id,section_key,status,completeness,payload)
select id,'doctrine','partial',46,jsonb_build_object('deliveryContract','Ultra Mega ZIP 1')
from flashcards_os.collections
on conflict (collection_id,section_key) do update set status=excluded.status,completeness=excluded.completeness,payload=excluded.payload,updated_at=now();
insert into flashcards_os.collection_dossier_sections (collection_id,section_key,status,completeness,payload)
select id,'audience','partial',52,jsonb_build_object('deliveryContract','Ultra Mega ZIP 1')
from flashcards_os.collections
on conflict (collection_id,section_key) do update set status=excluded.status,completeness=excluded.completeness,payload=excluded.payload,updated_at=now();
insert into flashcards_os.collection_dossier_sections (collection_id,section_key,status,completeness,payload)
select id,'cards','partial',0,jsonb_build_object('deliveryContract','Ultra Mega ZIP 1')
from flashcards_os.collections
on conflict (collection_id,section_key) do update set status=excluded.status,completeness=excluded.completeness,payload=excluded.payload,updated_at=now();
insert into flashcards_os.collection_dossier_sections (collection_id,section_key,status,completeness,payload)
select id,'specification','partial',40,jsonb_build_object('deliveryContract','Ultra Mega ZIP 1')
from flashcards_os.collections
on conflict (collection_id,section_key) do update set status=excluded.status,completeness=excluded.completeness,payload=excluded.payload,updated_at=now();
insert into flashcards_os.collection_dossier_sections (collection_id,section_key,status,completeness,payload)
select id,'research','future_engine',0,jsonb_build_object('deliveryContract','Ultra Mega ZIP 2')
from flashcards_os.collections
on conflict (collection_id,section_key) do update set status=excluded.status,completeness=excluded.completeness,payload=excluded.payload,updated_at=now();
insert into flashcards_os.collection_dossier_sections (collection_id,section_key,status,completeness,payload)
select id,'design','future_engine',0,jsonb_build_object('deliveryContract','Ultra Mega ZIP 2')
from flashcards_os.collections
on conflict (collection_id,section_key) do update set status=excluded.status,completeness=excluded.completeness,payload=excluded.payload,updated_at=now();
insert into flashcards_os.collection_dossier_sections (collection_id,section_key,status,completeness,payload)
select id,'commands','future_engine',0,jsonb_build_object('deliveryContract','Ultra Mega ZIP 3')
from flashcards_os.collections
on conflict (collection_id,section_key) do update set status=excluded.status,completeness=excluded.completeness,payload=excluded.payload,updated_at=now();
insert into flashcards_os.collection_dossier_sections (collection_id,section_key,status,completeness,payload)
select id,'vault','future_engine',0,jsonb_build_object('deliveryContract','Ultra Mega ZIP 3')
from flashcards_os.collections
on conflict (collection_id,section_key) do update set status=excluded.status,completeness=excluded.completeness,payload=excluded.payload,updated_at=now();
insert into flashcards_os.collection_dossier_sections (collection_id,section_key,status,completeness,payload)
select id,'quality','partial',20,jsonb_build_object('deliveryContract','Ultra Mega ZIP 1')
from flashcards_os.collections
on conflict (collection_id,section_key) do update set status=excluded.status,completeness=excluded.completeness,payload=excluded.payload,updated_at=now();
insert into flashcards_os.collection_dossier_sections (collection_id,section_key,status,completeness,payload)
select id,'commercial','partial',34,jsonb_build_object('deliveryContract','Ultra Mega ZIP 1')
from flashcards_os.collections
on conflict (collection_id,section_key) do update set status=excluded.status,completeness=excluded.completeness,payload=excluded.payload,updated_at=now();
insert into flashcards_os.collection_dossier_sections (collection_id,section_key,status,completeness,payload)
select id,'performance','future_engine',0,jsonb_build_object('deliveryContract','Ultra Mega ZIP 6')
from flashcards_os.collections
on conflict (collection_id,section_key) do update set status=excluded.status,completeness=excluded.completeness,payload=excluded.payload,updated_at=now();

insert into flashcards_os.import_batches (batch_key,source_label,source_file_name,source_pages,status,records_created,issues_created,source_metadata,created_by,completed_at)
values ('FC-CATALOGUE-2022-U1','NEW VERSION OF CATALOGUE FC 2022','NEW VERSION OF CATALOGUE FC 2022.pdf','3-7','completed',103,18,'{"cataloguePages":8,"importedPages":[3,4,5,6,7],"doctrine":"no-silent-correction"}'::jsonb,'ANGELCARE Flashcards OS UMZ1',now())
on conflict (batch_key) do update set records_created=excluded.records_created,issues_created=excluded.issues_created,source_metadata=excluded.source_metadata,completed_at=excluded.completed_at;
insert into flashcards_os.import_issues (batch_id,collection_id,source_page,issue_type,severity,status,explanation)
select b.id,'fc-lang-013',3,'taxonomy_review','medium','open','Le produit semble rattaché à une catégorie historique qui ne correspond pas totalement à sa fonction pédagogique.'
from flashcards_os.import_batches b where b.batch_key='FC-CATALOGUE-2022-U1'
and not exists (select 1 from flashcards_os.import_issues i where i.batch_id=b.id and i.collection_id='fc-lang-013' and i.issue_type='taxonomy_review');
insert into flashcards_os.import_issues (batch_id,collection_id,source_page,issue_type,severity,status,explanation)
select b.id,'fc-lang-019',3,'duplicate_name','high','open','Le même intitulé apparaît plusieurs fois dans le catalogue source et exige une décision de fusion, variante ou maintien séparé.'
from flashcards_os.import_batches b where b.batch_key='FC-CATALOGUE-2022-U1'
and not exists (select 1 from flashcards_os.import_issues i where i.batch_id=b.id and i.collection_id='fc-lang-019' and i.issue_type='duplicate_name');
insert into flashcards_os.import_issues (batch_id,collection_id,source_page,issue_type,severity,status,explanation)
select b.id,'fc-lang-019',3,'duplicate_legacy_concept','medium','open','Le concept semble répliqué sans différenciation éditoriale visible.'
from flashcards_os.import_batches b where b.batch_key='FC-CATALOGUE-2022-U1'
and not exists (select 1 from flashcards_os.import_issues i where i.batch_id=b.id and i.collection_id='fc-lang-019' and i.issue_type='duplicate_legacy_concept');
insert into flashcards_os.import_issues (batch_id,collection_id,source_page,issue_type,severity,status,explanation)
select b.id,'fc-geo-029',4,'duplicate_name','high','open','Le même intitulé apparaît plusieurs fois dans le catalogue source et exige une décision de fusion, variante ou maintien séparé.'
from flashcards_os.import_batches b where b.batch_key='FC-CATALOGUE-2022-U1'
and not exists (select 1 from flashcards_os.import_issues i where i.batch_id=b.id and i.collection_id='fc-geo-029' and i.issue_type='duplicate_name');
insert into flashcards_os.import_issues (batch_id,collection_id,source_page,issue_type,severity,status,explanation)
select b.id,'fc-geo-029',4,'probable_source_label_error','high','open','Le libellé source est probablement incorrect ou dupliqué; aucune correction silencieuse n’a été appliquée.'
from flashcards_os.import_batches b where b.batch_key='FC-CATALOGUE-2022-U1'
and not exists (select 1 from flashcards_os.import_issues i where i.batch_id=b.id and i.collection_id='fc-geo-029' and i.issue_type='probable_source_label_error');
insert into flashcards_os.import_issues (batch_id,collection_id,source_page,issue_type,severity,status,explanation)
select b.id,'fc-math-005',5,'missing_card_count','high','open','Le catalogue indique N/A pour le nombre de cartes. Le nombre attendu doit être validé à partir des sources de production.'
from flashcards_os.import_batches b where b.batch_key='FC-CATALOGUE-2022-U1'
and not exists (select 1 from flashcards_os.import_issues i where i.batch_id=b.id and i.collection_id='fc-math-005' and i.issue_type='missing_card_count');
insert into flashcards_os.import_issues (batch_id,collection_id,source_page,issue_type,severity,status,explanation)
select b.id,'fc-math-006',5,'missing_card_count','high','open','Le catalogue indique N/A pour le nombre de cartes. Le nombre attendu doit être validé à partir des sources de production.'
from flashcards_os.import_batches b where b.batch_key='FC-CATALOGUE-2022-U1'
and not exists (select 1 from flashcards_os.import_issues i where i.batch_id=b.id and i.collection_id='fc-math-006' and i.issue_type='missing_card_count');
insert into flashcards_os.import_issues (batch_id,collection_id,source_page,issue_type,severity,status,explanation)
select b.id,'fc-math-007',5,'missing_card_count','high','open','Le catalogue indique N/A pour le nombre de cartes. Le nombre attendu doit être validé à partir des sources de production.'
from flashcards_os.import_batches b where b.batch_key='FC-CATALOGUE-2022-U1'
and not exists (select 1 from flashcards_os.import_issues i where i.batch_id=b.id and i.collection_id='fc-math-007' and i.issue_type='missing_card_count');
insert into flashcards_os.import_issues (batch_id,collection_id,source_page,issue_type,severity,status,explanation)
select b.id,'fc-math-008',5,'missing_card_count','high','open','Le catalogue indique N/A pour le nombre de cartes. Le nombre attendu doit être validé à partir des sources de production.'
from flashcards_os.import_batches b where b.batch_key='FC-CATALOGUE-2022-U1'
and not exists (select 1 from flashcards_os.import_issues i where i.batch_id=b.id and i.collection_id='fc-math-008' and i.issue_type='missing_card_count');
insert into flashcards_os.import_issues (batch_id,collection_id,source_page,issue_type,severity,status,explanation)
select b.id,'fc-math-009',5,'missing_card_count','high','open','Le catalogue indique N/A pour le nombre de cartes. Le nombre attendu doit être validé à partir des sources de production.'
from flashcards_os.import_batches b where b.batch_key='FC-CATALOGUE-2022-U1'
and not exists (select 1 from flashcards_os.import_issues i where i.batch_id=b.id and i.collection_id='fc-math-009' and i.issue_type='missing_card_count');
insert into flashcards_os.import_issues (batch_id,collection_id,source_page,issue_type,severity,status,explanation)
select b.id,'fc-math-010',5,'missing_card_count','high','open','Le catalogue indique N/A pour le nombre de cartes. Le nombre attendu doit être validé à partir des sources de production.'
from flashcards_os.import_batches b where b.batch_key='FC-CATALOGUE-2022-U1'
and not exists (select 1 from flashcards_os.import_issues i where i.batch_id=b.id and i.collection_id='fc-math-010' and i.issue_type='missing_card_count');
insert into flashcards_os.import_issues (batch_id,collection_id,source_page,issue_type,severity,status,explanation)
select b.id,'fc-math-011',5,'missing_card_count','high','open','Le catalogue indique N/A pour le nombre de cartes. Le nombre attendu doit être validé à partir des sources de production.'
from flashcards_os.import_batches b where b.batch_key='FC-CATALOGUE-2022-U1'
and not exists (select 1 from flashcards_os.import_issues i where i.batch_id=b.id and i.collection_id='fc-math-011' and i.issue_type='missing_card_count');
insert into flashcards_os.import_issues (batch_id,collection_id,source_page,issue_type,severity,status,explanation)
select b.id,'fc-math-012',5,'missing_card_count','high','open','Le catalogue indique N/A pour le nombre de cartes. Le nombre attendu doit être validé à partir des sources de production.'
from flashcards_os.import_batches b where b.batch_key='FC-CATALOGUE-2022-U1'
and not exists (select 1 from flashcards_os.import_issues i where i.batch_id=b.id and i.collection_id='fc-math-012' and i.issue_type='missing_card_count');
insert into flashcards_os.import_issues (batch_id,collection_id,source_page,issue_type,severity,status,explanation)
select b.id,'fc-math-013',5,'missing_card_count','high','open','Le catalogue indique N/A pour le nombre de cartes. Le nombre attendu doit être validé à partir des sources de production.'
from flashcards_os.import_batches b where b.batch_key='FC-CATALOGUE-2022-U1'
and not exists (select 1 from flashcards_os.import_issues i where i.batch_id=b.id and i.collection_id='fc-math-013' and i.issue_type='missing_card_count');
insert into flashcards_os.import_issues (batch_id,collection_id,source_page,issue_type,severity,status,explanation)
select b.id,'fc-math-017',5,'duplicate_name','high','open','Le même intitulé apparaît plusieurs fois dans le catalogue source et exige une décision de fusion, variante ou maintien séparé.'
from flashcards_os.import_batches b where b.batch_key='FC-CATALOGUE-2022-U1'
and not exists (select 1 from flashcards_os.import_issues i where i.batch_id=b.id and i.collection_id='fc-math-017' and i.issue_type='duplicate_name');
insert into flashcards_os.import_issues (batch_id,collection_id,source_page,issue_type,severity,status,explanation)
select b.id,'fc-math-017',5,'duplicate_source_line','medium','open','La même ligne produit est reproduite dans le catalogue et nécessite une revue humaine.'
from flashcards_os.import_batches b where b.batch_key='FC-CATALOGUE-2022-U1'
and not exists (select 1 from flashcards_os.import_issues i where i.batch_id=b.id and i.collection_id='fc-math-017' and i.issue_type='duplicate_source_line');
insert into flashcards_os.import_issues (batch_id,collection_id,source_page,issue_type,severity,status,explanation)
select b.id,'fc-math-018',5,'legacy_numbering_gap','medium','open','La numérotation historique contient un saut ou une incohérence.'
from flashcards_os.import_batches b where b.batch_key='FC-CATALOGUE-2022-U1'
and not exists (select 1 from flashcards_os.import_issues i where i.batch_id=b.id and i.collection_id='fc-math-018' and i.issue_type='legacy_numbering_gap');
insert into flashcards_os.import_issues (batch_id,collection_id,source_page,issue_type,severity,status,explanation)
select b.id,'fc-cult-012',7,'duplicate_legacy_number','medium','open','Deux produits portent le même numéro historique dans la même catégorie.'
from flashcards_os.import_batches b where b.batch_key='FC-CATALOGUE-2022-U1'
and not exists (select 1 from flashcards_os.import_issues i where i.batch_id=b.id and i.collection_id='fc-cult-012' and i.issue_type='duplicate_legacy_number');
insert into flashcards_os.permission_catalogue(permission_key,label,domain,risk_level,description) values ('flashcards_os.view','Accéder à Flashcards OS','core','normal','Permission canonique Ultra Mega ZIP 1') on conflict(permission_key) do update set label=excluded.label,domain=excluded.domain,risk_level=excluded.risk_level,description=excluded.description;
insert into flashcards_os.permission_catalogue(permission_key,label,domain,risk_level,description) values ('flashcards_os.manage_portfolio','Gérer le portefeuille','product','high','Permission canonique Ultra Mega ZIP 1') on conflict(permission_key) do update set label=excluded.label,domain=excluded.domain,risk_level=excluded.risk_level,description=excluded.description;
insert into flashcards_os.permission_catalogue(permission_key,label,domain,risk_level,description) values ('flashcards_os.manage_taxonomy','Gérer la taxonomie','product','high','Permission canonique Ultra Mega ZIP 1') on conflict(permission_key) do update set label=excluded.label,domain=excluded.domain,risk_level=excluded.risk_level,description=excluded.description;
insert into flashcards_os.permission_catalogue(permission_key,label,domain,risk_level,description) values ('flashcards_os.manage_collections','Gérer les collections','product','medium','Permission canonique Ultra Mega ZIP 1') on conflict(permission_key) do update set label=excluded.label,domain=excluded.domain,risk_level=excluded.risk_level,description=excluded.description;
insert into flashcards_os.permission_catalogue(permission_key,label,domain,risk_level,description) values ('flashcards_os.manage_content','Gérer le contenu carte par carte','content','medium','Permission canonique Ultra Mega ZIP 1') on conflict(permission_key) do update set label=excluded.label,domain=excluded.domain,risk_level=excluded.risk_level,description=excluded.description;
insert into flashcards_os.permission_catalogue(permission_key,label,domain,risk_level,description) values ('flashcards_os.approve_product','Approuver une version produit','governance','high','Permission canonique Ultra Mega ZIP 1') on conflict(permission_key) do update set label=excluded.label,domain=excluded.domain,risk_level=excluded.risk_level,description=excluded.description;
insert into flashcards_os.permission_catalogue(permission_key,label,domain,risk_level,description) values ('flashcards_os.audit','Consulter les audits Flashcards OS','governance','medium','Permission canonique Ultra Mega ZIP 1') on conflict(permission_key) do update set label=excluded.label,domain=excluded.domain,risk_level=excluded.risk_level,description=excluded.description;
insert into flashcards_os.permission_catalogue(permission_key,label,domain,risk_level,description) values ('flashcards_os.admin','Administrer Flashcards OS','governance','critical','Permission canonique Ultra Mega ZIP 1') on conflict(permission_key) do update set label=excluded.label,domain=excluded.domain,risk_level=excluded.risk_level,description=excluded.description;
insert into flashcards_os.configuration(config_key,config_group,label,value,description,status,updated_by) values ('portfolio.doctrine.no_silent_correction','governance','No silent correction','true'::jsonb,'Preserve source anomalies until a documented human decision.','active','UMZ1 migration') on conflict(config_key) do update set value=excluded.value,description=excluded.description,status=excluded.status,updated_by=excluded.updated_by,updated_at=now();
insert into flashcards_os.configuration(config_key,config_group,label,value,description,status,updated_by) values ('portfolio.taxonomy.dynamic','product','Dynamic taxonomy','true'::jsonb,'Allow category expansion without code deployment.','active','UMZ1 migration') on conflict(config_key) do update set value=excluded.value,description=excluded.description,status=excluded.status,updated_by=excluded.updated_by,updated_at=now();
insert into flashcards_os.configuration(config_key,config_group,label,value,description,status,updated_by) values ('portfolio.card_content.require_real_source','content','Real-source content only','true'::jsonb,'Do not invent card-level content absent from source material.','active','UMZ1 migration') on conflict(config_key) do update set value=excluded.value,description=excluded.description,status=excluded.status,updated_by=excluded.updated_by,updated_at=now();
insert into flashcards_os.configuration(config_key,config_group,label,value,description,status,updated_by) values ('portfolio.historical_price_is_non_binding','commercial','Historical price non-binding','true'::jsonb,'Legacy prices remain evidence and never become active price-book values automatically.','active','UMZ1 migration') on conflict(config_key) do update set value=excluded.value,description=excluded.description,status=excluded.status,updated_by=excluded.updated_by,updated_at=now();
insert into flashcards_os.configuration(config_key,config_group,label,value,description,status,updated_by) values ('portfolio.master_universes','navigation','Six master universes','["command", "product", "intelligence", "solutions", "revenue", "delivery_experience"]'::jsonb,'Canonical six-button Flashcards OS navigation doctrine.','active','UMZ1 migration') on conflict(config_key) do update set value=excluded.value,description=excluded.description,status=excluded.status,updated_by=excluded.updated_by,updated_at=now();

insert into flashcards_os.audit_events(actor_name,action_key,action_label,entity_type,entity_id,summary,after_payload,risk_level)
select 'UMZ1 migration','catalogue.imported','Catalogue 2022 structuré','import_batch',id::text,
       'Création de 103 collections canoniques et conservation de 18 décisions héritées.',
       jsonb_build_object('records',103,'issues',18,'sourcePages','3-7'),'normal'
from flashcards_os.import_batches b
where b.batch_key='FC-CATALOGUE-2022-U1'
and not exists (select 1 from flashcards_os.audit_events a where a.action_key='catalogue.imported' and a.entity_id=b.id::text);

insert into flashcards_os.outbox_events(event_key,aggregate_type,aggregate_id,payload,status)
select 'catalogue.imported','import_batch',id::text,jsonb_build_object('records',103,'issues',18),'pending'
from flashcards_os.import_batches b
where b.batch_key='FC-CATALOGUE-2022-U1'
and not exists (select 1 from flashcards_os.outbox_events o where o.event_key='catalogue.imported' and o.aggregate_id=b.id::text);

-- Publish Flashcards OS to the existing AngelCare access registry when that registry is installed.
do $$
begin
  if to_regclass('public.access_module_registry') is not null then
    insert into public.access_module_registry(module_key,module_label,module_group,description,icon,route_prefixes,permission_key,module_permission_key,status,risk_level,sort_order,detected_source,metadata,last_seen_at)
    values ('flashcards-os','ANGELCARE Flashcards OS','ANGELCARE Product Operating Systems','Enterprise product, portfolio, intelligence, revenue and customer-experience OS.','layers',array['/flashcards-os'],'flashcards_os.view','flashcards_os.view','active','high',35,'UMZ1 migration','{"canonical":true,"delivery":"UMZ1"}'::jsonb,now())
    on conflict(module_key) do update set module_label=excluded.module_label,module_group=excluded.module_group,description=excluded.description,route_prefixes=excluded.route_prefixes,permission_key=excluded.permission_key,module_permission_key=excluded.module_permission_key,status=excluded.status,risk_level=excluded.risk_level,metadata=excluded.metadata,last_seen_at=now(),updated_at=now();
  end if;

  if to_regclass('public.access_route_registry') is not null then
    insert into public.access_route_registry(href,label,short_label,module_key,module_label,permission_key,module_permission_key,route_type,status,is_protected,is_navigation_visible,detected_source,metadata,last_seen_at)
    select v.href,v.label,v.short_label,'flashcards-os','ANGELCARE Flashcards OS','page:'||v.href,'flashcards_os.view','page','active',true,true,'UMZ1 migration','{"canonical":true,"delivery":"UMZ1"}'::jsonb,now()
    from (values ('/flashcards-os','Flashcards OS · Command','Command'),
('/flashcards-os/product','Flashcards OS · Portfolio','Portfolio'),
('/flashcards-os/product/taxonomy','Flashcards OS · Taxonomy Atlas','Taxonomy Atlas'),
('/flashcards-os/product/collections','Flashcards OS · Collection Registry','Collection Registry'),
('/flashcards-os/product/collections/[collectionId]','Flashcards OS · Collection Dossier','Collection Dossier'),
('/flashcards-os/product/collections/[collectionId]/cards','Flashcards OS · Card Content Registry','Card Content Registry'),
('/flashcards-os/governance/import-control','Flashcards OS · Legacy Intake Control','Legacy Intake Control')) as v(href,label,short_label)
    on conflict(href) do update set label=excluded.label,short_label=excluded.short_label,module_key=excluded.module_key,module_label=excluded.module_label,permission_key=excluded.permission_key,module_permission_key=excluded.module_permission_key,status=excluded.status,is_protected=excluded.is_protected,is_navigation_visible=excluded.is_navigation_visible,metadata=excluded.metadata,last_seen_at=now(),updated_at=now();
  end if;

  if to_regclass('public.access_role_templates') is not null then
    update public.access_role_templates
    set permissions = (select array_agg(distinct p order by p) from unnest(permissions || array['flashcards_os.view']) p), updated_at=now()
    where role in ('ceo','direction','admin','super_admin','owner','root','root_admin') or permissions @> array['*'];
  end if;
end $$;

-- Expose the schema through PostgREST after adding it to Supabase exposed schemas.
notify pgrst, 'reload schema';

commit;
