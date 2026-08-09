-- AngelCare B2B Marketplace Admin Real Sync Upgrade
-- Adds Shopify-like front controls: logo sizing, announcement bar, horizontal menu, home sections, templates, quote settings.

create extension if not exists pgcrypto;

alter table public.b2b_marketplace_theme_settings add column if not exists logo_url text default '/b2b-plaquette-partenaires/assets/angelcare-original-logo.png';
alter table public.b2b_marketplace_theme_settings add column if not exists logo_alt text default 'AngelCare';
alter table public.b2b_marketplace_theme_settings add column if not exists logo_width_px integer not null default 52;
alter table public.b2b_marketplace_theme_settings add column if not exists logo_height_px integer not null default 52;
alter table public.b2b_marketplace_theme_settings add column if not exists logo_display_mode text not null default 'symbol-and-wordmark';
alter table public.b2b_marketplace_theme_settings add column if not exists customer_logo_max_width_px integer not null default 180;
alter table public.b2b_marketplace_theme_settings add column if not exists announcement_enabled boolean not null default true;
alter table public.b2b_marketplace_theme_settings add column if not exists announcement_text text default 'Marketplace public sans login • Catalogue réel • Devis wholesale • Prix de gros';
alter table public.b2b_marketplace_theme_settings add column if not exists announcement_cta_label text default 'Demande rapide';
alter table public.b2b_marketplace_theme_settings add column if not exists announcement_cta_href text default '/b2b-marketplace/request-quote';
alter table public.b2b_marketplace_theme_settings add column if not exists announcement_background text default '#092e63';
alter table public.b2b_marketplace_theme_settings add column if not exists announcement_text_color text default '#ffffff';
alter table public.b2b_marketplace_theme_settings add column if not exists header_layout text not null default 'centered';
alter table public.b2b_marketplace_theme_settings add column if not exists menu_style text not null default 'pill';
alter table public.b2b_marketplace_theme_settings add column if not exists sticky_quote_enabled boolean not null default true;

alter table public.b2b_marketplace_categories add column if not exists catalogue_category text;
alter table public.b2b_marketplace_categories add column if not exists source_page integer;
alter table public.b2b_marketplace_categories add column if not exists source_image text;

alter table public.b2b_marketplace_packs add column if not exists included_product_refs text[] not null default '{}';
alter table public.b2b_marketplace_packs add column if not exists included_training_slugs text[] not null default '{}';

alter table public.b2b_marketplace_navigation_items add column if not exists nav_key text;
alter table public.b2b_marketplace_navigation_items add column if not exists location text not null default 'main-horizontal';
alter table public.b2b_marketplace_navigation_items add column if not exists badge text;
alter table public.b2b_marketplace_navigation_items add column if not exists is_primary boolean not null default false;
create unique index if not exists b2b_marketplace_navigation_items_nav_key_idx on public.b2b_marketplace_navigation_items(nav_key) where nav_key is not null;
create index if not exists b2b_marketplace_navigation_items_location_idx on public.b2b_marketplace_navigation_items(location, display_order);

create table if not exists public.b2b_marketplace_quote_settings (
  id uuid primary key default gen_random_uuid(),
  setting_key text unique not null,
  title text not null default 'Demande de devis wholesale',
  subtitle text default 'Configurez votre sélection et envoyez votre demande à AngelCare.',
  sales_email text default 'partenaires@angelcarehub.ma',
  quote_cart_enabled boolean not null default true,
  allow_anonymous_quote_request boolean not null default true,
  require_school_name boolean not null default true,
  require_phone boolean not null default true,
  require_city boolean not null default true,
  enable_logo_upload_placeholder boolean not null default true,
  settings jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.b2b_marketplace_quote_settings enable row level security;

do $$ begin
  create policy "Public read active quote settings" on public.b2b_marketplace_quote_settings for select using (is_active = true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Public read published navigation items" on public.b2b_marketplace_navigation_items for select using (status = 'published');
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Public read published page templates" on public.b2b_marketplace_page_templates for select using (status = 'published');
exception when duplicate_object then null; end $$;

insert into public.b2b_marketplace_theme_settings (
  theme_key, name, primary_color, accent_color, logo_url, logo_alt, logo_width_px, logo_height_px,
  logo_display_mode, announcement_enabled, announcement_text, announcement_cta_label, announcement_cta_href,
  announcement_background, announcement_text_color, header_layout, menu_style, sticky_quote_enabled, is_active
)
values (
  'angelcare-premium-white', 'AngelCare Premium White — MAX UIX Confirmed', '#092e63', '#d8a84a',
  '/b2b-plaquette-partenaires/assets/angelcare-original-logo.png', 'AngelCare', 52, 52,
  'symbol-and-wordmark', true, 'Marketplace public sans login • Catalogue réel • Devis wholesale • Prix de gros',
  'Demande rapide', '/b2b-marketplace/request-quote', '#092e63', '#ffffff', 'centered', 'pill', true, true
)
on conflict (theme_key) do update set
  name = excluded.name,
  logo_url = coalesce(public.b2b_marketplace_theme_settings.logo_url, excluded.logo_url),
  updated_at = now();

insert into public.b2b_marketplace_quote_settings (setting_key, title, subtitle, sales_email, quote_cart_enabled, allow_anonymous_quote_request, require_school_name, require_phone, require_city, enable_logo_upload_placeholder, is_active)
values ('default', 'Demande de devis professionnelle', 'Configurez votre sélection, transmettez vos besoins, et recevez une proposition AngelCare adaptée aux quantités, formats, personnalisation et délais.', 'partenaires@angelcarehub.ma', true, true, true, true, true, true, true)
on conflict (setting_key) do nothing;

insert into public.b2b_marketplace_home_sections (section_key, section_type, title, subtitle, cta_label, cta_href, layout_style, display_order, is_visible, settings)
values
('featured-products', 'featured-products', 'Références catalogue prêtes pour le devis B2B', 'Chaque référence peut être ajoutée au panier B2B avec quantité, personnalisation et demande de prix de gros.', 'Voir produits', '/b2b-marketplace/products', 'premium-grid', 4, true, '{}'::jsonb),
('academy-highlight', 'academy-highlight', 'Formations commercialisées comme modules B2B', 'Les formations peuvent être achetées seules, ajoutées à un pack ou connectées à des produits terrain.', 'Voir Academy', '/b2b-marketplace/academy', 'premium-academy', 5, true, '{}'::jsonb),
('wholesale-cta', 'wholesale-cta', 'Pack Builder avec références réelles uniquement', 'Aucun pack officiel inventé: les sélections se composent uniquement depuis les références produits et formations réelles du catalogue, puis passent en devis B2B.', 'Créer un pack', '/b2b-marketplace/custom-pack-builder', 'wide-wholesale', 6, true, '{}'::jsonb)
on conflict (section_key) do update set
  title = excluded.title,
  subtitle = excluded.subtitle,
  cta_label = excluded.cta_label,
  cta_href = excluded.cta_href,
  layout_style = excluded.layout_style,
  display_order = excluded.display_order,
  updated_at = now();

insert into public.b2b_marketplace_navigation_items (nav_key, label, href, location, display_order, status, badge, is_primary)
values
('nav-catalogue', 'Catalogue', '/b2b-marketplace/categories', 'main-horizontal', 1, 'published', null, false),
('nav-products', 'Produits', '/b2b-marketplace/products', 'main-horizontal', 2, 'published', null, false),
('nav-academy', 'Academy', '/b2b-marketplace/academy', 'main-horizontal', 3, 'published', null, false),
('nav-packs', 'Packs', '/b2b-marketplace/packs', 'main-horizontal', 4, 'published', null, false),
('nav-custom', 'Sur-mesure', '/b2b-marketplace/custom-pack-builder', 'main-horizontal', 5, 'published', null, false),
('nav-quote', 'Devis B2B', '/b2b-marketplace/quote-cart', 'main-horizontal', 6, 'published', null, true),
('footer-packs', 'Packs prêts à déployer', '/b2b-marketplace/packs', 'footer-quick', 1, 'published', null, false),
('footer-academy', 'Catalogue Academy', '/b2b-marketplace/academy', 'footer-quick', 2, 'published', null, false),
('footer-custom', 'Pack sur-mesure', '/b2b-marketplace/custom-pack-builder', 'footer-quick', 3, 'published', null, false),
('footer-cart', 'Panier B2B', '/b2b-marketplace/quote-cart', 'footer-commercial', 1, 'published', null, false),
('footer-request', 'Demande de devis', '/b2b-marketplace/request-quote', 'footer-commercial', 2, 'published', null, true),
('footer-search', 'Recherche catalogue', '/b2b-marketplace/search', 'footer-commercial', 3, 'published', null, false)
on conflict (nav_key) do update set
  label = excluded.label,
  href = excluded.href,
  location = excluded.location,
  display_order = excluded.display_order,
  status = excluded.status,
  badge = excluded.badge,
  is_primary = excluded.is_primary,
  updated_at = now();

insert into public.b2b_marketplace_page_templates (template_key, name, template_type, settings, status)
values
('tpl-homepage-max-uix', 'Homepage MAX Premium UIX', 'homepage', '{"sectionsEditable":true,"heroEditable":true,"gatewayGridEditable":true}'::jsonb, 'published'),
('tpl-product-page-max-uix', 'Product Page MAX Premium UIX', 'product-page', '{"showGallery":true,"showPricePanel":true,"showMetaCards":true,"showRelatedTrainings":true}'::jsonb, 'published'),
('tpl-academy-course-max-uix', 'Academy Course MAX Premium UIX', 'academy-course', '{"showObjectives":true,"showSourceImage":true,"showQuoteCTA":true}'::jsonb, 'published'),
('tpl-quote-page-max-uix', 'Quote Page MAX Procurement UIX', 'quote-page', '{"showSteps":true,"showTrustBlocks":true,"requireContact":true}'::jsonb, 'published')
on conflict (template_key) do update set
  name = excluded.name,
  template_type = excluded.template_type,
  settings = excluded.settings,
  status = excluded.status,
  updated_at = now();
