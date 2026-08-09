begin;
create extension if not exists pgcrypto;

-- Governed post-MZ20 module sequence; no approval workflow is introduced.
alter table public.angelcare_marketplace_modules
  drop constraint if exists angelcare_marketplace_modules_introduced_by_mega_zip_check;
alter table public.angelcare_marketplace_modules
  add constraint angelcare_marketplace_modules_introduced_by_mega_zip_check
  check (introduced_by_mega_zip >= 1);

insert into public.angelcare_marketplace_modules(
  module_key,name,description,route_prefix,module_type,audience,navigation_group,navigation_order,
  status,enabled,required_permissions,required_dependencies,territory_aware,tenant_aware,locale_aware,
  health_status,owner_role,introduced_by_mega_zip
) values (
  'complete-commerce-administration-universe',
  'Complete Merchandising, Catalog, Media, Homepage & Navigation Administration',
  'No-code immediate commercial administration for the complete ANGELCARE Marketplace.',
  '/angelcare-marketplace/admin/commerce-studio','commerce_administration',
  array['admin','executive']::text[],'Commerce Studio',40,'enabled',true,
  array['marketplace.commerce.view','marketplace.media.manage','marketplace.homepage.manage','marketplace.navigation.manage','marketplace.catalog.manage','marketplace.categories.manage','marketplace.merchandising.manage','marketplace.publication.manage']::text[],
  array['homepage-flagship-storefront','catalog-discovery-experience-universe','final-launch-authority-universe']::text[],
  true,true,true,'healthy','marketplace_commerce_administrator',26
) on conflict(module_key) do update set
  name=excluded.name,description=excluded.description,route_prefix=excluded.route_prefix,
  module_type=excluded.module_type,audience=excluded.audience,navigation_group=excluded.navigation_group,
  navigation_order=excluded.navigation_order,status='enabled',enabled=true,
  required_permissions=excluded.required_permissions,required_dependencies=excluded.required_dependencies,
  territory_aware=true,tenant_aware=true,locale_aware=true,health_status='healthy',
  owner_role=excluded.owner_role,introduced_by_mega_zip=excluded.introduced_by_mega_zip,updated_at=now();

insert into public.angelcare_marketplace_permissions(permission_key,name,category,sensitive,description) values
 ('marketplace.commerce.view','Voir Commerce Studio','Commerce Studio',false,'Accéder au commandement commercial no-code.'),
 ('marketplace.media.view','Voir Media Library','Commerce Studio',false,'Consulter les médias commerciaux.'),
 ('marketplace.media.manage','Gérer les médias','Commerce Studio',true,'Uploader, modifier, archiver et réutiliser les médias.'),
 ('marketplace.homepage.view','Voir Homepage Composer','Commerce Studio',false,'Consulter la composition de la homepage.'),
 ('marketplace.homepage.manage','Gérer la homepage','Commerce Studio',true,'Créer, ordonner, publier et restaurer les sections et campagnes.'),
 ('marketplace.navigation.view','Voir Navigation Studio','Commerce Studio',false,'Consulter menus et mega-menus.'),
 ('marketplace.navigation.manage','Gérer la navigation','Commerce Studio',true,'Créer, ordonner et publier les menus sans approbation.'),
 ('marketplace.categories.manage','Gérer les catégories','Commerce Studio',true,'Créer les catégories, hiérarchies et assignations.'),
 ('marketplace.merchandising.view','Voir Merchandising Studio','Commerce Studio',false,'Consulter les rails et placements commerciaux.'),
 ('marketplace.merchandising.manage','Gérer le merchandising','Commerce Studio',true,'Contrôler Featured, Popular, Best Picks, collections et règles.'),
 ('marketplace.publication.manage','Publier immédiatement','Commerce Studio',true,'Publier, dépublier, rafraîchir et restaurer immédiatement.'),
 ('marketplace.seo.manage','Gérer le SEO commercial','Commerce Studio',true,'Gérer le SEO et les métadonnées structurées.'),
 ('marketplace.commerce.export','Exporter le commerce','Commerce Studio',true,'Exporter les registres commerciaux.'),
 ('marketplace.commerce.import','Importer le commerce','Commerce Studio',true,'Importer avec validation et traçabilité.')
on conflict(permission_key) do update set name=excluded.name,category=excluded.category,sensitive=excluded.sensitive,description=excluded.description;

insert into public.angelcare_marketplace_role_permissions(role_key,permission_key)
select r.role_key,p.permission_key
from public.angelcare_marketplace_roles r
cross join public.angelcare_marketplace_permissions p
where r.role_key in('marketplace_super_admin','marketplace_executive','marketplace_admin','marketplace_product_admin','marketplace_content_director')
and p.permission_key in(
 'marketplace.commerce.view','marketplace.media.view','marketplace.media.manage','marketplace.homepage.view','marketplace.homepage.manage',
 'marketplace.navigation.view','marketplace.navigation.manage','marketplace.categories.manage','marketplace.merchandising.view',
 'marketplace.merchandising.manage','marketplace.publication.manage','marketplace.seo.manage','marketplace.commerce.export','marketplace.commerce.import'
) on conflict do nothing;

-- Supabase Storage bucket is created only when the storage extension is available.
do $$ begin
  if to_regclass('storage.buckets') is not null then
    execute $sql$
      insert into storage.buckets(id,name,public)
      values('angelcare-marketplace-media','angelcare-marketplace-media',true)
      on conflict(id) do update set public=true
    $sql$;
  end if;
end $$;

create table if not exists public.angelcare_marketplace_media_folders(
 id uuid primary key default gen_random_uuid(), parent_id uuid references public.angelcare_marketplace_media_folders(id) on delete set null,
 name text not null, slug text not null, status text not null default 'active' check(status in('active','archived')),
 created_by uuid, updated_by uuid, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique nulls not distinct(parent_id,slug)
);
create table if not exists public.angelcare_marketplace_media_assets(
 id uuid primary key default gen_random_uuid(), asset_key text unique not null, folder_id uuid references public.angelcare_marketplace_media_folders(id) on delete set null,
 file_name text not null, media_type text not null check(media_type in('image','video','document','illustration')),
 mime_type text not null, size_bytes bigint not null default 0, width int, height int, duration_seconds numeric(12,3),
 storage_bucket text not null default 'angelcare-marketplace-media', storage_path text not null, public_url text not null,
 desktop_url text not null, tablet_url text, mobile_url text, square_url text, portrait_url text, banner_url text,
 alt_text_fr text not null, alt_text_en text, alt_text_ar text, title_fr text, title_en text, title_ar text,
 caption_fr text, caption_en text, caption_ar text, focal_point jsonb not null default '{"x":50,"y":50}'::jsonb,
 source_name text, photographer text, license_type text, rights_status text not null default 'owned', rights_expires_at timestamptz,
 optimization_status text not null default 'ready', usage_count int not null default 0,
 metadata jsonb not null default '{}'::jsonb, status text not null default 'active' check(status in('processing','active','paused','archived','failed')),
 created_by uuid, updated_by uuid, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.angelcare_marketplace_media_usage(
 id uuid primary key default gen_random_uuid(), media_asset_id uuid not null references public.angelcare_marketplace_media_assets(id) on delete restrict,
 object_type text not null, object_id uuid not null, slot_key text not null, locale text, territory_id uuid,
 created_at timestamptz not null default now(), unique(media_asset_id,object_type,object_id,slot_key,locale)
);
create table if not exists public.angelcare_marketplace_catalog_attribute_definitions(
 id uuid primary key default gen_random_uuid(), attribute_key text unique not null, group_key text not null, name_fr text not null,
 name_en text, name_ar text, value_type text not null default 'text', options jsonb not null default '[]'::jsonb,
 applicable_kinds text[] not null default '{}'::text[], sort_order int not null default 100,
 status text not null default 'active' check(status in('active','archived')), created_by uuid, updated_by uuid,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.angelcare_marketplace_merchandising_rules(
 id uuid primary key default gen_random_uuid(), rule_key text not null, name text not null, rule_type text not null,
 conditions jsonb not null default '{}'::jsonb, sort jsonb not null default '{}'::jsonb, item_limit int not null default 12,
 locale text not null default 'fr' check(locale in('fr','en','ar')), territory_id uuid, audience text not null default 'all',
 starts_at timestamptz, ends_at timestamptz, status text not null default 'active' check(status in('active','paused','archived')),
 created_by uuid, updated_by uuid, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique nulls not distinct(rule_key,locale,territory_id)
);
create table if not exists public.angelcare_marketplace_commerce_versions(
 id uuid primary key default gen_random_uuid(), object_type text not null, object_id uuid not null,
 version_number int not null, action text not null, snapshot jsonb not null, change_summary text,
 created_by uuid, created_at timestamptz not null default now(), unique(object_type,object_id,version_number)
);
create table if not exists public.angelcare_marketplace_commerce_publication_events(
 id uuid primary key default gen_random_uuid(), public_reference text unique not null default ('CPUB-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,12))),
 object_type text not null, object_id text not null, action text not null, locale text, territory_id uuid,
 status text not null default 'completed' check(status in('validating','completed','failed','rolled_back')),
 affected_paths text[] not null default '{}'::text[], error_message text, executed_by uuid,
 created_at timestamptz not null default now(), completed_at timestamptz
);
create table if not exists public.angelcare_marketplace_cache_refresh_events(
 id uuid primary key default gen_random_uuid(), publication_event_id uuid references public.angelcare_marketplace_commerce_publication_events(id) on delete set null,
 cache_tag text, route_path text, status text not null default 'completed', error_message text,
 executed_at timestamptz not null default now()
);
create table if not exists public.angelcare_marketplace_admin_saved_views(
 id uuid primary key default gen_random_uuid(), user_id uuid not null, workspace_key text not null, name text not null,
 filters jsonb not null default '{}'::jsonb, columns jsonb not null default '[]'::jsonb, sort jsonb not null default '{}'::jsonb,
 is_default boolean not null default false, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(user_id,workspace_key,name)
);

-- Evolve canonical Homepage structures for true no-code composition.
alter table public.angelcare_marketplace_homepage_sections add column if not exists visible boolean not null default true;
alter table public.angelcare_marketplace_homepage_sections add column if not exists audience text not null default 'all';
alter table public.angelcare_marketplace_homepage_sections add column if not exists starts_at timestamptz;
alter table public.angelcare_marketplace_homepage_sections add column if not exists ends_at timestamptz;
alter table public.angelcare_marketplace_homepage_sections add column if not exists background_variant text not null default 'white';
alter table public.angelcare_marketplace_homepage_sections add column if not exists accent text not null default 'navy';
alter table public.angelcare_marketplace_homepage_sections add column if not exists version int not null default 1;
update public.angelcare_marketplace_homepage_sections set starts_at=coalesce(starts_at,created_at) where starts_at is null;

alter table public.angelcare_marketplace_homepage_collections add column if not exists description text;
alter table public.angelcare_marketplace_homepage_collections add column if not exists cover_media_asset_id uuid references public.angelcare_marketplace_media_assets(id) on delete set null;
alter table public.angelcare_marketplace_homepage_collections add column if not exists item_limit int not null default 12;
alter table public.angelcare_marketplace_homepage_collections add column if not exists audience text not null default 'all';
alter table public.angelcare_marketplace_homepage_collections add column if not exists starts_at timestamptz;
alter table public.angelcare_marketplace_homepage_collections add column if not exists ends_at timestamptz;
alter table public.angelcare_marketplace_homepage_collections add column if not exists settings jsonb not null default '{}'::jsonb;

alter table public.angelcare_marketplace_homepage_placements add column if not exists merchandising_badge text;
alter table public.angelcare_marketplace_homepage_placements add column if not exists custom_title text;
alter table public.angelcare_marketplace_homepage_placements add column if not exists custom_subtitle text;
alter table public.angelcare_marketplace_homepage_placements add column if not exists media_asset_id uuid references public.angelcare_marketplace_media_assets(id) on delete set null;
alter table public.angelcare_marketplace_homepage_placements add column if not exists cta_label text;
alter table public.angelcare_marketplace_homepage_placements add column if not exists cta_href text;

-- Evolve canonical navigation without replacing public navigation authority.
alter table public.angelcare_marketplace_cms_menus add column if not exists updated_by uuid;
alter table public.angelcare_marketplace_cms_menu_items add column if not exists label_fr text;
alter table public.angelcare_marketplace_cms_menu_items add column if not exists label_en text;
alter table public.angelcare_marketplace_cms_menu_items add column if not exists label_ar text;
alter table public.angelcare_marketplace_cms_menu_items add column if not exists icon_key text;
alter table public.angelcare_marketplace_cms_menu_items add column if not exists image_asset_id uuid references public.angelcare_marketplace_media_assets(id) on delete set null;
alter table public.angelcare_marketplace_cms_menu_items add column if not exists desktop_visible boolean not null default true;
alter table public.angelcare_marketplace_cms_menu_items add column if not exists mobile_visible boolean not null default true;
alter table public.angelcare_marketplace_cms_menu_items add column if not exists territory_id uuid;
alter table public.angelcare_marketplace_cms_menu_items add column if not exists updated_by uuid;
alter table public.angelcare_marketplace_cms_menu_items add column if not exists updated_at timestamptz not null default now();
update public.angelcare_marketplace_cms_menu_items set label_fr=coalesce(label_fr,label) where label_fr is null;


alter table public.angelcare_marketplace_catalog_item_media add column if not exists updated_by uuid;
alter table public.angelcare_marketplace_homepage_collection_items add column if not exists updated_by uuid;
alter table public.angelcare_marketplace_catalog_item_categories add column if not exists id uuid default gen_random_uuid();
update public.angelcare_marketplace_catalog_item_categories set id=gen_random_uuid() where id is null;
alter table public.angelcare_marketplace_catalog_item_categories alter column id set not null;
create unique index if not exists angelcare_marketplace_catalog_item_categories_id_uidx on public.angelcare_marketplace_catalog_item_categories(id);
alter table public.angelcare_marketplace_catalog_item_categories add column if not exists updated_by uuid;
alter table public.angelcare_marketplace_catalog_item_categories add column if not exists updated_at timestamptz not null default now();

-- Evolve canonical catalogue and variant structures.
alter table public.angelcare_marketplace_catalog_items add column if not exists sku text;
alter table public.angelcare_marketplace_catalog_items add column if not exists sellable_type text;
alter table public.angelcare_marketplace_catalog_items add column if not exists description_en text;
alter table public.angelcare_marketplace_catalog_items add column if not exists description_ar text;
alter table public.angelcare_marketplace_catalog_items add column if not exists seo_metadata jsonb not null default '{}'::jsonb;
alter table public.angelcare_marketplace_catalog_items add column if not exists attributes jsonb not null default '{}'::jsonb;
alter table public.angelcare_marketplace_catalog_items add column if not exists publish_at timestamptz;
alter table public.angelcare_marketplace_catalog_items add column if not exists unpublish_at timestamptz;
alter table public.angelcare_marketplace_catalog_items add column if not exists deleted_at timestamptz;
update public.angelcare_marketplace_catalog_items set sellable_type=coalesce(sellable_type,kind) where sellable_type is null;
create unique index if not exists angelcare_marketplace_catalog_items_sku_uidx on public.angelcare_marketplace_catalog_items(sku) where sku is not null;

alter table public.angelcare_marketplace_catalog_variants add column if not exists sku text;
alter table public.angelcare_marketplace_catalog_variants add column if not exists name_en text;
alter table public.angelcare_marketplace_catalog_variants add column if not exists name_ar text;
alter table public.angelcare_marketplace_catalog_variants add column if not exists option_values jsonb not null default '{}'::jsonb;
alter table public.angelcare_marketplace_catalog_variants add column if not exists price_override numeric(14,2);
alter table public.angelcare_marketplace_catalog_variants add column if not exists media_asset_id uuid references public.angelcare_marketplace_media_assets(id) on delete set null;
alter table public.angelcare_marketplace_catalog_variants add column if not exists inventory_reference text;
alter table public.angelcare_marketplace_catalog_variants add column if not exists territory_id uuid;
alter table public.angelcare_marketplace_catalog_variants add column if not exists available boolean not null default true;
alter table public.angelcare_marketplace_catalog_variants add column if not exists updated_by uuid;
create unique index if not exists angelcare_marketplace_catalog_variants_sku_uidx on public.angelcare_marketplace_catalog_variants(sku) where sku is not null;

alter table public.angelcare_marketplace_catalog_categories add column if not exists parent_category_id uuid references public.angelcare_marketplace_catalog_categories(id) on delete set null;
alter table public.angelcare_marketplace_catalog_categories add column if not exists mobile_cover_asset_url text;
alter table public.angelcare_marketplace_catalog_categories add column if not exists storefront_template text not null default 'mixed';
alter table public.angelcare_marketplace_catalog_categories add column if not exists seo_metadata jsonb not null default '{}'::jsonb;
alter table public.angelcare_marketplace_catalog_categories add column if not exists visible boolean not null default true;
alter table public.angelcare_marketplace_catalog_categories add column if not exists published_at timestamptz;

-- Existing canonical direct status models remain authoritative. No review or approval queue is added.
create or replace view public.angelcare_marketplace_commerce_item_admin_v
with (security_invoker=true) as
select
 i.*,
 coalesce((select jsonb_agg(to_jsonb(v) order by v.sort_order) from public.angelcare_marketplace_catalog_variants v where v.catalog_item_id=i.id),'[]'::jsonb) as variants,
 coalesce((select jsonb_agg(to_jsonb(m) order by m.sort_order) from public.angelcare_marketplace_catalog_item_media m where m.catalog_item_id=i.id and m.status<>'archived'),'[]'::jsonb) as media,
 coalesce((select jsonb_agg(to_jsonb(a) order by a.updated_at desc) from public.angelcare_marketplace_catalog_availability a where a.catalog_item_id=i.id),'[]'::jsonb) as availability,
 coalesce((select jsonb_agg(to_jsonb(c) order by c.sort_order) from public.angelcare_marketplace_catalog_item_categories c where c.catalog_item_id=i.id),'[]'::jsonb) as categories,
 coalesce((select jsonb_agg(to_jsonb(p) order by p.updated_at desc) from public.angelcare_marketplace_finance_price_rules p where p.catalog_item_id=i.id),'[]'::jsonb) as "priceRules",
 not exists(select 1 from public.angelcare_marketplace_catalog_item_media m where m.catalog_item_id=i.id and m.status='active') as missing_media,
 (i.price_mode<>'quote_only' and i.price_amount is null and not exists(select 1 from public.angelcare_marketplace_finance_price_rules p where p.catalog_item_id=i.id and p.status='active')) as missing_price,
 not exists(select 1 from public.angelcare_marketplace_catalog_item_categories c where c.catalog_item_id=i.id) as missing_category,
 (i.name_en is null or i.name_ar is null or i.short_description_en is null or i.short_description_ar is null) as missing_translation
from public.angelcare_marketplace_catalog_items i;

create or replace view public.angelcare_marketplace_category_admin_v
with (security_invoker=true) as
select c.*,
 coalesce((select count(*) from public.angelcare_marketplace_catalog_item_categories x where x.category_id=c.id),0)::int as item_count
from public.angelcare_marketplace_catalog_categories c;

create or replace view public.angelcare_marketplace_public_navigation_v as
select
 i.id,i.menu_id,
 case m.locale when 'en' then coalesce(i.label_en,i.label_fr,i.label) when 'ar' then coalesce(i.label_ar,i.label_fr,i.label) else coalesce(i.label_fr,i.label) end as label,
 i.href,i.page_id,i.parent_id,i.sort_order,i.visibility,i.status,m.locale,coalesce(i.territory_id,m.territory_id) as territory_id,
 i.icon_key,i.image_asset_id,i.desktop_visible,i.mobile_visible
from public.angelcare_marketplace_cms_menu_items i
join public.angelcare_marketplace_cms_menus m on m.id=i.menu_id
where i.status='active' and m.status='published';

create index if not exists ac_media_assets_folder_idx on public.angelcare_marketplace_media_assets(folder_id,status,updated_at desc);
create index if not exists ac_media_usage_object_idx on public.angelcare_marketplace_media_usage(object_type,object_id);
create index if not exists ac_merch_rules_scope_idx on public.angelcare_marketplace_merchandising_rules(locale,territory_id,audience,status);
create index if not exists ac_commerce_versions_object_idx on public.angelcare_marketplace_commerce_versions(object_type,object_id,version_number desc);
create index if not exists ac_publication_events_created_idx on public.angelcare_marketplace_commerce_publication_events(created_at desc,status);
create index if not exists ac_homepage_placements_badge_idx on public.angelcare_marketplace_homepage_placements(merchandising_badge,locale,status,sort_order);
create index if not exists ac_categories_parent_idx on public.angelcare_marketplace_catalog_categories(parent_category_id,locale,sort_order);

-- Seed the accepted Homepage Flagship composition as live persistent sections.
do $$ declare v_territory uuid; begin
 select id into v_territory from public.angelcare_marketplace_territories where territory_code='MA-MASTER';
 insert into public.angelcare_marketplace_homepage_sections(
  section_key,locale,territory_id,section_type,title,subtitle,layout_variant,sort_order,settings,status,
  visible,audience,starts_at,background_variant,accent
 ) values
 ('audience-gateway','fr',v_territory,'audience_gateway','Choisissez votre univers','Familles, organisations ou professionnels.','grid',10,'{"item_limit":3}'::jsonb,'active',true,'all',now(),'white','navy'),
 ('category-mosaic','fr',v_territory,'category_mosaic','Explorez les catégories','La distribution complète du Marketplace.','mosaic',20,'{"item_limit":9}'::jsonb,'active',true,'all',now(),'white','blue'),
 ('featured-products','fr',v_territory,'featured_products','Sélection Featured','Offres mises en avant par l’administrateur.','rail',30,'{"item_limit":12}'::jsonb,'active',true,'all',now(),'white','red'),
 ('best-picks','fr',v_territory,'best_picks','Best Picks','Sélection éditoriale à fort potentiel.','rail',40,'{"item_limit":12}'::jsonb,'active',true,'all',now(),'soft','gold'),
 ('territory-picks','fr',v_territory,'territory_selector','Disponible dans votre territoire','Offres liées au territoire actif.','rail',50,'{"item_limit":12}'::jsonb,'active',true,'all',now(),'white','blue'),
 ('available-now','fr',v_territory,'available_now','Disponible maintenant','Offres avec disponibilité publiée.','rail',60,'{"item_limit":12}'::jsonb,'active',true,'all',now(),'white','green'),
 ('family-services','fr',v_territory,'family_services','ANGELCARE Familles','Services et continuité familiale.','split',70,'{"item_limit":3}'::jsonb,'active',true,'family',now(),'warm','red'),
 ('development-montessori','fr',v_territory,'development_montessori','Développement & Montessori',null,'rail',80,'{"item_limit":10}'::jsonb,'active',true,'family',now(),'white','blue'),
 ('academy','fr',v_territory,'academy','ANGELCARE Academy',null,'split',90,'{"item_limit":8}'::jsonb,'active',true,'professional',now(),'navy','blue'),
 ('b2b-verticals','fr',v_territory,'b2b_verticals','Univers B2B',null,'grid',100,'{"item_limit":4}'::jsonb,'active',true,'organization',now(),'white','navy'),
 ('partner-os','fr',v_territory,'partner_os','Partner OS',null,'split',110,'{"item_limit":3}'::jsonb,'active',true,'organization',now(),'soft','blue'),
 ('trust-evidence','fr',v_territory,'trust_evidence','Trust & Quality Authority',null,'grid',120,'{"item_limit":6}'::jsonb,'active',true,'all',now(),'white','green'),
 ('territory-atlas','fr',v_territory,'territory_selector','Territory Atlas',null,'split',130,'{}'::jsonb,'active',true,'all',now(),'navy','blue'),
 ('final-commerce-band','fr',v_territory,'custom_banner','Continuez votre parcours',null,'full-width',140,'{}'::jsonb,'active',true,'all',now(),'red','red')
 on conflict(section_key,locale,territory_id) do update set
  section_type=excluded.section_type,title=excluded.title,subtitle=excluded.subtitle,layout_variant=excluded.layout_variant,
  sort_order=excluded.sort_order,visible=true,audience=excluded.audience,starts_at=coalesce(public.angelcare_marketplace_homepage_sections.starts_at,now()),
  background_variant=excluded.background_variant,accent=excluded.accent,status='active',updated_at=now();
end $$;

insert into public.angelcare_marketplace_catalog_attribute_definitions(attribute_key,group_key,name_fr,name_en,name_ar,value_type,applicable_kinds,sort_order) values
 ('material','product-specs','Matériau','Material','المادة','text',array['product','kit'],10),
 ('dimensions','product-specs','Dimensions','Dimensions','الأبعاد','text',array['product','kit'],20),
 ('recommended-age','audience','Âge recommandé','Recommended age','العمر الموصى به','text',array['product','kit','service','training'],30),
 ('duration','delivery','Durée','Duration','المدة','text',array['service','training','audit'],40),
 ('capacity','delivery','Capacité','Capacity','السعة','number',array['service','training','audit'],50),
 ('delivery-format','delivery','Format de livraison','Delivery format','صيغة التسليم','select',array['service','training','audit','saas_module'],60),
 ('included-modules','saas','Modules inclus','Included modules','الوحدات المضمنة','multiselect',array['saas_module'],70),
 ('usage-limits','saas','Limites d’usage','Usage limits','حدود الاستخدام','json',array['saas_module'],80)
on conflict(attribute_key) do update set name_fr=excluded.name_fr,name_en=excluded.name_en,name_ar=excluded.name_ar,
 value_type=excluded.value_type,applicable_kinds=excluded.applicable_kinds,sort_order=excluded.sort_order,updated_at=now();

alter table public.angelcare_marketplace_media_folders enable row level security;
alter table public.angelcare_marketplace_media_assets enable row level security;
alter table public.angelcare_marketplace_media_usage enable row level security;
alter table public.angelcare_marketplace_catalog_attribute_definitions enable row level security;
alter table public.angelcare_marketplace_merchandising_rules enable row level security;
alter table public.angelcare_marketplace_commerce_versions enable row level security;
alter table public.angelcare_marketplace_commerce_publication_events enable row level security;
alter table public.angelcare_marketplace_cache_refresh_events enable row level security;
alter table public.angelcare_marketplace_admin_saved_views enable row level security;

revoke all on table
 public.angelcare_marketplace_media_folders,public.angelcare_marketplace_media_assets,public.angelcare_marketplace_media_usage,
 public.angelcare_marketplace_catalog_attribute_definitions,public.angelcare_marketplace_merchandising_rules,
 public.angelcare_marketplace_commerce_versions,public.angelcare_marketplace_commerce_publication_events,
 public.angelcare_marketplace_cache_refresh_events,public.angelcare_marketplace_admin_saved_views
from anon,authenticated;

grant all on table
 public.angelcare_marketplace_media_folders,public.angelcare_marketplace_media_assets,public.angelcare_marketplace_media_usage,
 public.angelcare_marketplace_catalog_attribute_definitions,public.angelcare_marketplace_merchandising_rules,
 public.angelcare_marketplace_commerce_versions,public.angelcare_marketplace_commerce_publication_events,
 public.angelcare_marketplace_cache_refresh_events,public.angelcare_marketplace_admin_saved_views
 to service_role;

grant select on public.angelcare_marketplace_commerce_item_admin_v,public.angelcare_marketplace_category_admin_v to service_role;

grant usage, select on all sequences in schema public to service_role;


insert into public.angelcare_marketplace_feature_flags(flag_key,name,description,enabled,status,reason) values
 ('marketplace.complete-commerce-administration.enabled','Complete Commerce Administration','Media, homepage, navigation, catalogue, categories, merchandising et publication immédiate.',true,'active','Final one-shot enterprise completion')
on conflict(flag_key) do update set name=excluded.name,description=excluded.description,enabled=true,status='active',reason=excluded.reason,updated_at=now();

commit;

select 'complete_commerce_administration_applied' as result;
select count(*) as persistent_homepage_sections from public.angelcare_marketplace_homepage_sections where status='active';
select count(*) as commerce_permissions from public.angelcare_marketplace_permissions where category='Commerce Studio';
select count(*) as media_assets from public.angelcare_marketplace_media_assets;
