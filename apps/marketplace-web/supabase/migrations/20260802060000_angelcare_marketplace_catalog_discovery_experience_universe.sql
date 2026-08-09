-- ANGELCARE GLOBAL MARKETPLACE — CATALOG DISCOVERY & SELLABLE EXPERIENCE UNIVERSE
-- Corrected compatibility edition for the accepted Homepage Flagship schema.
-- Additive and idempotent. No destructive table/data operation.

begin;

create extension if not exists pgcrypto;

create table if not exists public.angelcare_marketplace_category_designs (
  id uuid primary key default gen_random_uuid(),
  category_key text not null unique,
  storefront_template text not null,
  visual_theme text not null default 'navy',
  hero_configuration jsonb not null default '{}'::jsonb,
  filter_configuration jsonb not null default '{}'::jsonb,
  comparison_configuration jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.angelcare_marketplace_search_synonyms (
  id uuid primary key default gen_random_uuid(),
  locale text not null check (locale in ('fr','en','ar')),
  source_term text not null,
  synonyms text[] not null default '{}',
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (locale, source_term)
);

create table if not exists public.angelcare_marketplace_item_commercial_profiles (
  id uuid primary key default gen_random_uuid(),
  catalog_item_id uuid not null references public.angelcare_marketplace_catalog_items(id) on delete cascade,
  category_key text,
  commercial_metadata jsonb not null default '{}'::jsonb,
  comparison_attributes jsonb not null default '{}'::jsonb,
  seo_metadata jsonb not null default '{}'::jsonb,
  publication_score integer not null default 0 check (publication_score between 0 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (catalog_item_id)
);

create table if not exists public.angelcare_marketplace_item_relationships (
  id uuid primary key default gen_random_uuid(),
  source_item_id uuid not null references public.angelcare_marketplace_catalog_items(id) on delete cascade,
  target_item_id uuid not null references public.angelcare_marketplace_catalog_items(id) on delete cascade,
  relationship_type text not null check (relationship_type in ('related','frequently_combined','alternative','pathway','requires')),
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  unique (source_item_id, target_item_id, relationship_type),
  check (source_item_id <> target_item_id)
);

create table if not exists public.angelcare_marketplace_recently_viewed (
  id uuid primary key default gen_random_uuid(),
  visitor_reference text not null,
  catalog_item_id uuid not null references public.angelcare_marketplace_catalog_items(id) on delete cascade,
  locale text not null default 'fr' check (locale in ('fr','en','ar')),
  territory_code text,
  viewed_at timestamptz not null default now(),
  unique (visitor_reference, catalog_item_id)
);

-- Establish the twelve canonical public storefront category identities without
-- replacing or deleting the Homepage Flagship category records.
do $$
declare
  v_territory uuid;
begin
  select id
    into v_territory
    from public.angelcare_marketplace_territories
   where territory_code = 'MA-MASTER'
   limit 1;

  if v_territory is null then
    raise exception 'MA-MASTER territory is required before Catalog Discovery migration';
  end if;

  with definitions (
    category_key,
    slug,
    title_fr,
    title_en,
    title_ar,
    description_fr,
    description_en,
    description_ar,
    cover_asset_url,
    icon_key,
    visual_theme,
    sort_order
  ) as (
    values
      ('families','families','Familles','Families','العائلات','Services, activités et parcours coordonnés pour les familles.','Services, activities and coordinated family pathways.','خدمات وأنشطة ومسارات منسقة للعائلات.','/angelcare-marketplace/homepage/category-family.svg','families','warm',10),
      ('home-services','home-services','Services à domicile','Home services','الخدمات المنزلية','Services à domicile configurés par territoire, date, durée et fréquence.','Home services configured by territory, date, duration and frequency.','خدمات منزلية مهيأة حسب النطاق والتاريخ والمدة والتكرار.','/angelcare-marketplace/homepage/category-family.svg','home-services','home',20),
      ('development','development','Développement & Montessori','Development & Montessori','التنمية ومونتيسوري','Activités guidées par âge, objectif et protocole.','Age, objective and protocol-led activities.','أنشطة موجهة حسب العمر والهدف والبروتوكول.','/angelcare-marketplace/homepage/category-development.svg','development','blue',30),
      ('kits','kits','Kits & matériels','Kits & materials','الحقائب والمواد','Kits, contenus, usages et sécurité.','Kits, contents, uses and safety.','حقائب ومحتويات واستخدامات وسلامة.','/angelcare-marketplace/homepage/category-kits.svg','kits','red',40),
      ('academy','academy','Academy & certifications','Academy & credentials','الأكاديمية والشهادات','Programmes, cohortes, évaluations et certificats.','Programs, cohorts, assessments and credentials.','برامج ودورات وتقييمات وشهادات.','/angelcare-marketplace/homepage/category-academy.svg','academy','navy',50),
      ('establishments','establishments','Écoles & crèches','Schools & childcare centers','المدارس والحضانات','Diagnostic, Academy, Partner OS et Quality Check 360.','Diagnostic, Academy, Partner OS and Quality Check 360.','التشخيص والأكاديمية وPartner OS وQuality Check 360.','/angelcare-marketplace/homepage/category-institutions.svg','establishments','blue',60),
      ('hospitality','hospitality','Hospitality','Hospitality','الضيافة','Kids clubs, garde clients, conciergerie et programmes saisonniers.','Kids clubs, guest childcare, concierge and seasonal programs.','نوادي الأطفال ورعاية الضيوف والكونسيرج والبرامج الموسمية.','/angelcare-marketplace/homepage/category-hospitality.svg','hospitality','gold',70),
      ('health-partners','health-partners','Support santé-adjacent','Health-adjacent support','الدعم المجاور للصحة','Accompagnement familial sûr, encadré et explicitement non médical.','Safe, bounded and explicitly non-medical family support.','دعم عائلي آمن ومحدد وغير طبي بوضوح.','/angelcare-marketplace/homepage/category-health.svg','health-partners','health',80),
      ('corporates','corporates','Entreprises & RH','Corporate & HR','الشركات والموارد البشرية','Programmes, quotas, éligibilité et impact pour les employeurs.','Programs, quotas, eligibility and impact for employers.','برامج وحصص وأهلية وأثر لأصحاب العمل.','/angelcare-marketplace/homepage/category-corporate.svg','corporates','corporate',90),
      ('partner-os','partner-os','Partner OS','Partner OS','Partner OS','Plans, modules, limites d’usage et onboarding SaaS.','Plans, modules, usage limits and SaaS onboarding.','خطط ووحدات وحدود استخدام وتهيئة SaaS.','/angelcare-marketplace/homepage/category-partner-os.svg','partner-os','saas',100),
      ('quality-check','quality-check','Quality Check 360','Quality Check 360','Quality Check 360','Référentiels, preuves, scoring et actions correctives.','Frameworks, evidence, scoring and corrective actions.','أطر وأدلة وتقييم وإجراءات تصحيحية.','/angelcare-marketplace/homepage/category-quality.svg','quality-check','quality',110),
      ('professionals','professionals','Professionnels & partenaires','Professionals & partners','المهنيون والشركاء','Formation, certification, onboarding et opportunités professionnelles.','Training, credentials, onboarding and professional opportunities.','تدريب وشهادات وتهيئة وفرص مهنية.','/angelcare-marketplace/homepage/category-academy.svg','professionals','professional',120)
  ), localized as (
    select
      d.category_key,
      d.slug,
      l.locale,
      case l.locale when 'fr' then d.title_fr when 'en' then d.title_en else d.title_ar end as title,
      case l.locale when 'fr' then d.description_fr when 'en' then d.description_en else d.description_ar end as short_description,
      d.cover_asset_url,
      d.icon_key,
      d.visual_theme,
      d.sort_order
    from definitions d
    cross join (values ('fr'),('en'),('ar')) as l(locale)
  )
  insert into public.angelcare_marketplace_catalog_categories (
    category_key,
    locale,
    title,
    short_description,
    slug,
    cover_asset_url,
    icon_key,
    visual_theme,
    allowed_sellable_types,
    available_filters,
    territory_id,
    sort_order,
    status
  )
  select
    category_key,
    locale,
    title,
    short_description,
    slug,
    cover_asset_url,
    icon_key,
    visual_theme,
    array['service','product','training','audit','saas_module','kit']::text[],
    '{"territory":true,"audience":true,"availability":true,"kind":true}'::jsonb,
    v_territory,
    sort_order,
    'published'
  from localized
  on conflict (category_key, locale, territory_id)
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    slug = excluded.slug,
    cover_asset_url = excluded.cover_asset_url,
    icon_key = excluded.icon_key,
    visual_theme = excluded.visual_theme,
    allowed_sellable_types = excluded.allowed_sellable_types,
    available_filters = excluded.available_filters,
    sort_order = excluded.sort_order,
    status = 'published',
    updated_at = now();
end $$;

insert into public.angelcare_marketplace_category_designs (
  category_key,
  storefront_template,
  visual_theme
)
values
  ('families','family-concierge','family'),
  ('home-services','home-service-booking','home'),
  ('development','developmental-discovery','development'),
  ('kits','product-commerce','kits'),
  ('academy','academy-credential','academy'),
  ('establishments','institutional-transformation','establishments'),
  ('hospitality','hospitality-programme','hospitality'),
  ('health-partners','health-adjacent','health'),
  ('corporates','corporate-benefits','corporate'),
  ('partner-os','saas-commerce','saas'),
  ('quality-check','quality-assessment','quality'),
  ('professionals','professional-marketplace','professional')
on conflict (category_key)
do update set
  storefront_template = excluded.storefront_template,
  visual_theme = excluded.visual_theme,
  updated_at = now();

-- Backfill the commercial profile from the accepted Homepage Flagship item
-- metadata. Existing operator-managed category assignments remain authoritative.
insert into public.angelcare_marketplace_item_commercial_profiles (
  catalog_item_id,
  category_key,
  commercial_metadata,
  publication_score
)
select
  i.id,
  case coalesce(i.commercial_metadata->>'category_key','')
    when 'family-services' then 'families'
    when 'institutions' then 'establishments'
    when 'health' then 'health-partners'
    when 'corporate' then 'corporates'
    when 'quality' then 'quality-check'
    else nullif(i.commercial_metadata->>'category_key','')
  end,
  coalesce(i.commercial_metadata,'{}'::jsonb),
  case when i.status = 'published' then 70 else 0 end
from public.angelcare_marketplace_catalog_items i
where i.commercial_metadata is not null
on conflict (catalog_item_id)
do update set
  category_key = coalesce(public.angelcare_marketplace_item_commercial_profiles.category_key, excluded.category_key),
  commercial_metadata = coalesce(public.angelcare_marketplace_item_commercial_profiles.commercial_metadata,'{}'::jsonb) || excluded.commercial_metadata,
  updated_at = now();

alter table public.angelcare_marketplace_category_designs enable row level security;
alter table public.angelcare_marketplace_search_synonyms enable row level security;
alter table public.angelcare_marketplace_item_commercial_profiles enable row level security;
alter table public.angelcare_marketplace_item_relationships enable row level security;
alter table public.angelcare_marketplace_recently_viewed enable row level security;

revoke all on table
  public.angelcare_marketplace_category_designs,
  public.angelcare_marketplace_search_synonyms,
  public.angelcare_marketplace_item_commercial_profiles,
  public.angelcare_marketplace_item_relationships,
  public.angelcare_marketplace_recently_viewed
from anon, authenticated;

grant all on table
  public.angelcare_marketplace_category_designs,
  public.angelcare_marketplace_search_synonyms,
  public.angelcare_marketplace_item_commercial_profiles,
  public.angelcare_marketplace_item_relationships,
  public.angelcare_marketplace_recently_viewed
to service_role;

create index if not exists ac_catalog_design_category_idx
  on public.angelcare_marketplace_category_designs(category_key);
create index if not exists ac_catalog_profile_category_idx
  on public.angelcare_marketplace_item_commercial_profiles(category_key, catalog_item_id);
create index if not exists ac_catalog_relationship_source_idx
  on public.angelcare_marketplace_item_relationships(source_item_id, relationship_type, sort_order);
create index if not exists ac_catalog_recent_visitor_idx
  on public.angelcare_marketplace_recently_viewed(visitor_reference, viewed_at desc);

-- Correct canonical discovery view. It binds only to relations that exist in
-- the accepted Marketplace and Homepage Flagship migrations.
create or replace view public.angelcare_marketplace_catalog_discovery_v
with (security_invoker = true)
as
select
  i.id,
  i.public_reference,
  i.item_key,
  i.slug,
  i.kind,
  i.name_fr,
  i.name_en,
  i.name_ar,
  i.short_description_fr,
  i.short_description_en,
  i.short_description_ar,
  i.description_fr,
  null::text as description_en,
  null::text as description_ar,
  i.source_locale,
  i.status,
  i.territory_id,
  i.currency_label,
  i.price_mode,
  i.price_amount,
  i.featured,
  i.availability_status,
  i.owner_id,
  i.created_by,
  i.updated_by,
  i.created_at,
  i.updated_at,
  p.category_key,
  cat.category_title_fr,
  cat.category_title_en,
  cat.category_title_ar,
  media.media_url,
  coalesce(trust.trust_labels, '{}'::text[]) as trust_labels,
  territory.territory_code,
  coalesce((p.commercial_metadata->>'merchandising_priority')::integer, 0) as merchandising_priority,
  i.updated_at as published_at,
  coalesce(i.commercial_metadata,'{}'::jsonb) || coalesce(p.commercial_metadata,'{}'::jsonb) as commercial_metadata
from public.angelcare_marketplace_catalog_items i
left join public.angelcare_marketplace_item_commercial_profiles p
  on p.catalog_item_id = i.id
left join public.angelcare_marketplace_territories territory
  on territory.id = i.territory_id
left join lateral (
  select
    max(c.title) filter (where c.locale = 'fr') as category_title_fr,
    max(c.title) filter (where c.locale = 'en') as category_title_en,
    max(c.title) filter (where c.locale = 'ar') as category_title_ar
  from public.angelcare_marketplace_catalog_categories c
  where c.category_key = p.category_key
    and c.status = 'published'
    and (c.territory_id = i.territory_id or c.territory_id is null)
) cat on true
left join lateral (
  select m.asset_url as media_url
  from public.angelcare_marketplace_catalog_item_media m
  where m.catalog_item_id = i.id
    and m.status = 'active'
  order by (m.media_key = 'primary') desc, m.sort_order, m.created_at
  limit 1
) media on true
left join lateral (
  select array_agg(distinct coalesce(d.name_fr, issuance.badge_key)) as trust_labels
  from public.angelcare_marketplace_trust_badge_issuances issuance
  left join public.angelcare_marketplace_trust_badge_definitions d
    on d.id = issuance.badge_definition_id
  where issuance.object_id = i.id
    and issuance.status = 'active'
    and (
      issuance.object_type ilike '%catalog%'
      or issuance.object_type ilike '%item%'
    )
) trust on true;

create or replace view public.angelcare_marketplace_category_discovery_v
with (security_invoker = true)
as
select
  c.id,
  c.category_key,
  c.locale,
  c.title,
  c.short_description,
  c.slug,
  c.cover_asset_url,
  c.icon_key,
  c.visual_theme,
  c.allowed_sellable_types,
  c.available_filters,
  c.territory_id,
  c.sort_order,
  c.status,
  c.created_by,
  c.updated_by,
  c.created_at,
  c.updated_at,
  coalesce(d.storefront_template, 'mixed') as storefront_template,
  coalesce(d.hero_configuration, '{}'::jsonb) as hero_configuration,
  coalesce(
    d.filter_configuration->'allowed_filters',
    (
      select coalesce(jsonb_agg(e.key order by e.key), '[]'::jsonb)
      from jsonb_each(coalesce(c.available_filters,'{}'::jsonb)) e
      where e.value = 'true'::jsonb
    ),
    '[]'::jsonb
  ) as allowed_filters,
  (
    select count(*)
    from public.angelcare_marketplace_item_commercial_profiles p
    join public.angelcare_marketplace_catalog_items i
      on i.id = p.catalog_item_id
    where p.category_key = c.category_key
      and i.status = 'published'
  ) as item_count
from public.angelcare_marketplace_catalog_categories c
left join public.angelcare_marketplace_category_designs d
  on d.category_key = c.category_key
where c.category_key in (
  'families',
  'home-services',
  'development',
  'kits',
  'academy',
  'establishments',
  'hospitality',
  'health-partners',
  'corporates',
  'partner-os',
  'quality-check',
  'professionals'
);

-- Collection compatibility view consumed by the new storefront repository.
create or replace view public.angelcare_marketplace_catalog_collections_v
with (security_invoker = true)
as
select
  collection.id,
  collection.collection_key,
  collection.locale,
  collection.territory_id,
  collection.title,
  collection.subtitle,
  collection.selection_method,
  collection.layout_variant,
  collection.sort_order,
  collection.status,
  coalesce(
    (
      select array_agg(distinct profile.category_key)
      from public.angelcare_marketplace_homepage_collection_items collection_item
      join public.angelcare_marketplace_item_commercial_profiles profile
        on profile.catalog_item_id = collection_item.catalog_item_id
      where collection_item.collection_id = collection.id
        and collection_item.status in ('eligible','scheduled','active')
        and profile.category_key is not null
    ),
    '{}'::text[]
  ) as storefront_keys,
  coalesce(
    (
      select jsonb_agg(to_jsonb(discovery) order by collection_item.sort_order)
      from public.angelcare_marketplace_homepage_collection_items collection_item
      join public.angelcare_marketplace_catalog_discovery_v discovery
        on discovery.id = collection_item.catalog_item_id
      where collection_item.collection_id = collection.id
        and collection_item.status in ('eligible','scheduled','active')
        and discovery.status = 'published'
    ),
    '[]'::jsonb
  ) as items
from public.angelcare_marketplace_homepage_collections collection;

grant select on public.angelcare_marketplace_catalog_discovery_v to service_role;
grant select on public.angelcare_marketplace_category_discovery_v to service_role;
grant select on public.angelcare_marketplace_catalog_collections_v to service_role;

commit;

select 'category_designs' as register, count(*) as records
from public.angelcare_marketplace_category_designs
union all
select 'commercial_profiles', count(*)
from public.angelcare_marketplace_item_commercial_profiles
union all
select 'discovery_items', count(*)
from public.angelcare_marketplace_catalog_discovery_v
union all
select 'discovery_categories', count(*)
from public.angelcare_marketplace_category_discovery_v
union all
select 'discovery_collections', count(*)
from public.angelcare_marketplace_catalog_collections_v;
