-- AngelCare B2B Crèche Marketplace + Admin Studio
-- Public read marketplace, public quote intake, protected admin mutations.

create extension if not exists pgcrypto;

create table if not exists public.b2b_marketplace_theme_settings (
  id uuid primary key default gen_random_uuid(),
  theme_key text unique not null,
  name text not null,
  primary_color text not null default '#0f2f5f',
  accent_color text not null default '#d6a84f',
  background_style text not null default 'white-corporate-showroom',
  card_radius text not null default '24px',
  button_style text not null default 'filled-primary-outline-secondary',
  hero_style text not null default 'editorial-marketplace',
  product_card_style text not null default 'premium-b2b-card',
  grid_density text not null default 'comfortable',
  marketplace_mode text not null default 'premium',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.b2b_marketplace_home_sections (
  id uuid primary key default gen_random_uuid(),
  section_key text unique not null,
  section_type text not null,
  title text not null,
  subtitle text,
  cta_label text,
  cta_href text,
  layout_style text not null default 'premium',
  display_order integer not null default 100,
  is_visible boolean not null default true,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.b2b_marketplace_gateway_cards (
  id uuid primary key default gen_random_uuid(),
  gateway_key text unique not null,
  title text not null,
  slug text unique not null,
  subtitle text,
  icon text,
  tags text[] not null default '{}',
  cta_label text,
  secondary_cta_label text,
  href text,
  featured_badge text,
  accent text not null default 'navy',
  display_order integer not null default 100,
  status text not null default 'published',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.b2b_marketplace_categories (
  id uuid primary key default gen_random_uuid(),
  category_key text unique not null,
  title text not null,
  slug text unique not null,
  gateway_slug text,
  short_description text,
  promise text,
  use_cases text[] not null default '{}',
  tags text[] not null default '{}',
  hero_note text,
  layout_template text not null default 'premium-editorial',
  status text not null default 'published',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.b2b_marketplace_sets (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.b2b_marketplace_categories(id) on delete set null,
  set_key text unique not null,
  name text not null,
  slug text unique not null,
  description text,
  display_order integer not null default 100,
  status text not null default 'published',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.b2b_marketplace_products (
  id uuid primary key default gen_random_uuid(),
  reference_code text unique not null,
  title text not null,
  slug text unique not null,
  category_slug text not null,
  set_name text,
  short_description text,
  long_description text,
  starting_price_mad numeric(12,2) not null default 0,
  price_note text,
  tags text[] not null default '{}',
  best_for text[] not null default '{}',
  school_area text,
  event_type text,
  format text,
  lead_time text,
  catalogue_category text,
  source_page integer,
  source_image text,
  is_personalizable boolean not null default false,
  is_wholesale_available boolean not null default true,
  min_quantity integer not null default 1,
  related_training_slugs text[] not null default '{}',
  related_pack_slugs text[] not null default '{}',
  status text not null default 'published',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.b2b_marketplace_product_media (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.b2b_marketplace_products(id) on delete cascade,
  media_url text not null,
  media_type text not null default 'image',
  alt_text text,
  display_order integer not null default 100,
  created_at timestamptz not null default now()
);

create table if not exists public.b2b_marketplace_product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.b2b_marketplace_products(id) on delete cascade,
  variant_name text not null,
  variant_sku text,
  price_delta_mad numeric(12,2) not null default 0,
  settings jsonb not null default '{}'::jsonb,
  status text not null default 'published',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.b2b_marketplace_product_tags (
  id uuid primary key default gen_random_uuid(),
  tag_key text unique not null,
  label text not null,
  color text,
  created_at timestamptz not null default now()
);

create table if not exists public.b2b_marketplace_product_price_tiers (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.b2b_marketplace_products(id) on delete cascade,
  min_quantity integer not null,
  unit_price_mad numeric(12,2) not null,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.b2b_marketplace_product_personalization (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.b2b_marketplace_products(id) on delete cascade,
  option_key text not null,
  label text not null,
  option_type text not null default 'text',
  is_required boolean not null default false,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.b2b_marketplace_academy_categories (
  id uuid primary key default gen_random_uuid(),
  category_key text unique not null,
  title text not null,
  slug text unique not null,
  description text,
  display_order integer not null default 100,
  status text not null default 'published',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.b2b_marketplace_academy_modules (
  id uuid primary key default gen_random_uuid(),
  reference_code text unique not null,
  title text not null,
  slug text unique not null,
  category text not null,
  category_slug text not null,
  short_description text,
  objectives text[] not null default '{}',
  duration text,
  participants text,
  format text,
  starting_price_mad numeric(12,2) not null default 0,
  includes_certificate boolean not null default true,
  includes_elearning boolean not null default false,
  related_product_refs text[] not null default '{}',
  related_pack_slugs text[] not null default '{}',
  source_page integer,
  source_image text,
  status text not null default 'published',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.b2b_marketplace_packs (
  id uuid primary key default gen_random_uuid(),
  pack_key text unique not null,
  title text not null,
  slug text unique not null,
  objective text,
  short_description text,
  starting_price_mad numeric(12,2) not null default 0,
  best_for text[] not null default '{}',
  variants jsonb not null default '[]'::jsonb,
  is_customizable boolean not null default true,
  status text not null default 'published',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.b2b_marketplace_pack_lines (
  id uuid primary key default gen_random_uuid(),
  pack_id uuid references public.b2b_marketplace_packs(id) on delete cascade,
  line_type text not null check (line_type in ('product','training')),
  reference_code text not null,
  quantity integer not null default 1,
  is_optional boolean not null default false,
  display_order integer not null default 100,
  created_at timestamptz not null default now()
);

create table if not exists public.b2b_marketplace_navigation_menus (
  id uuid primary key default gen_random_uuid(),
  menu_key text unique not null,
  title text not null,
  location text not null,
  status text not null default 'published',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.b2b_marketplace_navigation_items (
  id uuid primary key default gen_random_uuid(),
  menu_id uuid references public.b2b_marketplace_navigation_menus(id) on delete cascade,
  label text not null,
  href text not null,
  display_order integer not null default 100,
  parent_item_id uuid references public.b2b_marketplace_navigation_items(id) on delete cascade,
  status text not null default 'published',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.b2b_marketplace_page_templates (
  id uuid primary key default gen_random_uuid(),
  template_key text unique not null,
  name text not null,
  template_type text not null,
  settings jsonb not null default '{}'::jsonb,
  status text not null default 'published',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.b2b_marketplace_quote_requests (
  id uuid primary key default gen_random_uuid(),
  quote_reference text unique not null,
  school_name text not null,
  contact_name text not null,
  phone text not null,
  email text not null,
  city text not null,
  message text,
  status text not null default 'new_request',
  estimated_total_mad numeric(12,2) not null default 0,
  source text not null default 'public_marketplace',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.b2b_marketplace_quote_lines (
  id uuid primary key default gen_random_uuid(),
  quote_request_id uuid references public.b2b_marketplace_quote_requests(id) on delete cascade,
  item_type text not null check (item_type in ('product','training','pack')),
  reference_code text not null,
  title text not null,
  quantity integer not null default 1,
  estimated_unit_price_mad numeric(12,2) not null default 0,
  personalization_notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.b2b_marketplace_publish_history (
  id uuid primary key default gen_random_uuid(),
  publish_reference text unique not null,
  published_by uuid,
  summary text,
  snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.b2b_marketplace_admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid,
  action text not null,
  resource_type text not null,
  resource_id text,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now()
);

create index if not exists b2b_marketplace_products_category_idx on public.b2b_marketplace_products(category_slug);
create index if not exists b2b_marketplace_products_status_idx on public.b2b_marketplace_products(status);
create index if not exists b2b_marketplace_categories_slug_idx on public.b2b_marketplace_categories(slug);
create index if not exists b2b_marketplace_academy_slug_idx on public.b2b_marketplace_academy_modules(slug);
create index if not exists b2b_marketplace_packs_slug_idx on public.b2b_marketplace_packs(slug);
create index if not exists b2b_marketplace_quote_requests_status_idx on public.b2b_marketplace_quote_requests(status);

alter table public.b2b_marketplace_theme_settings enable row level security;
alter table public.b2b_marketplace_home_sections enable row level security;
alter table public.b2b_marketplace_gateway_cards enable row level security;
alter table public.b2b_marketplace_categories enable row level security;
alter table public.b2b_marketplace_sets enable row level security;
alter table public.b2b_marketplace_products enable row level security;
alter table public.b2b_marketplace_product_media enable row level security;
alter table public.b2b_marketplace_product_variants enable row level security;
alter table public.b2b_marketplace_product_tags enable row level security;
alter table public.b2b_marketplace_product_price_tiers enable row level security;
alter table public.b2b_marketplace_product_personalization enable row level security;
alter table public.b2b_marketplace_academy_categories enable row level security;
alter table public.b2b_marketplace_academy_modules enable row level security;
alter table public.b2b_marketplace_packs enable row level security;
alter table public.b2b_marketplace_pack_lines enable row level security;
alter table public.b2b_marketplace_navigation_menus enable row level security;
alter table public.b2b_marketplace_navigation_items enable row level security;
alter table public.b2b_marketplace_page_templates enable row level security;
alter table public.b2b_marketplace_quote_requests enable row level security;
alter table public.b2b_marketplace_quote_lines enable row level security;
alter table public.b2b_marketplace_publish_history enable row level security;
alter table public.b2b_marketplace_admin_audit_logs enable row level security;

-- Public read access for published catalogue/showroom data.
do $$
begin
  create policy "Public read active marketplace theme" on public.b2b_marketplace_theme_settings for select using (is_active = true);
exception when duplicate_object then null; end $$;

do $$
begin
  create policy "Public read visible home sections" on public.b2b_marketplace_home_sections for select using (is_visible = true);
exception when duplicate_object then null; end $$;

do $$
begin
  create policy "Public read published gateway cards" on public.b2b_marketplace_gateway_cards for select using (status = 'published');
exception when duplicate_object then null; end $$;

do $$
begin
  create policy "Public read published categories" on public.b2b_marketplace_categories for select using (status = 'published');
exception when duplicate_object then null; end $$;

do $$
begin
  create policy "Public read published products" on public.b2b_marketplace_products for select using (status = 'published');
exception when duplicate_object then null; end $$;

do $$
begin
  create policy "Public read published academy" on public.b2b_marketplace_academy_modules for select using (status = 'published');
exception when duplicate_object then null; end $$;

do $$
begin
  create policy "Public read published packs" on public.b2b_marketplace_packs for select using (status = 'published');
exception when duplicate_object then null; end $$;

do $$
begin
  create policy "Public insert quote requests" on public.b2b_marketplace_quote_requests for insert with check (true);
exception when duplicate_object then null; end $$;

do $$
begin
  create policy "Public insert quote lines" on public.b2b_marketplace_quote_lines for insert with check (true);
exception when duplicate_object then null; end $$;

insert into public.b2b_marketplace_theme_settings (theme_key, name)
values ('angelcare-premium-white', 'AngelCare Premium White')
on conflict (theme_key) do nothing;

insert into public.b2b_marketplace_home_sections (section_key, section_type, title, subtitle, cta_label, cta_href, display_order)
values
('hero', 'hero', 'Catalogue B2B AngelCare pour Crèches', 'Produits, équipements, supports pédagogiques, formations et packs B2B prêts à déployer.', 'Explorer le catalogue', '/b2b-marketplace/categories', 1),
('search', 'search', 'Recherche intelligente', 'Rechercher par besoin, référence, catégorie, événement, formation ou pack.', null, null, 2),
('gateways', 'gateways', 'Espaces Catalogue B2B', 'Choisissez un objectif commercial, un espace de crèche ou un moment scolaire.', null, null, 3),
('featured-packs', 'featured-packs', 'Packs prêts à déployer', 'Des sélections B2B pour accélérer la rentrée, les admissions, la sécurité et les événements.', 'Voir les packs', '/b2b-marketplace/packs', 4)
on conflict (section_key) do nothing;
