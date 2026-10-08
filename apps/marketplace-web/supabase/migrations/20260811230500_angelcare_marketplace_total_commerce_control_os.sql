begin;
create extension if not exists pgcrypto;

-- ============================================================================
-- TOTAL COMMERCE CONTROL OS — ADMIN ↔ FRONTEND CANONICAL SURFACES
-- Additive only. No existing customer/catalog/order object is replaced.
-- ============================================================================
create table if not exists public.angelcare_marketplace_frontend_surfaces(
 id uuid primary key default gen_random_uuid(),
 surface_key text not null unique,
 surface_type text not null check(surface_type in('homepage','marketplace','category','vertical','product','transactional','navigation','footer','portal','system')),
 title text not null,
 route_pattern text not null,
 renderer_key text not null,
 admin_studio_key text not null,
 status text not null default 'draft' check(status in('draft','published','paused','archived')),
 business_editable boolean not null default true,
 locale_mode text not null default 'localized' check(locale_mode in('localized','shared')),
 territory_mode text not null default 'optional' check(territory_mode in('none','optional','required')),
 content jsonb not null default '{}',
 settings jsonb not null default '{}',
 published_snapshot jsonb,
 published_at timestamptz,
 published_by uuid,
 created_by uuid,
 updated_by uuid,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);

create table if not exists public.angelcare_marketplace_surface_sections(
 id uuid primary key default gen_random_uuid(),
 surface_id uuid not null references public.angelcare_marketplace_frontend_surfaces(id) on delete cascade,
 section_key text not null,
 section_type text not null,
 locale text not null default 'fr' check(locale in('fr','en','ar')),
 territory_id uuid references public.angelcare_marketplace_territories(id),
 title text,
 eyebrow text,
 body text,
 primary_cta_label text,
 primary_cta_href text,
 secondary_cta_label text,
 secondary_cta_href text,
 media_url text,
 layout_variant text not null default 'default',
 content jsonb not null default '{}',
 settings jsonb not null default '{}',
 sort_order integer not null default 100,
 visible boolean not null default true,
 status text not null default 'draft' check(status in('draft','published','paused','archived')),
 created_by uuid,
 updated_by uuid,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(surface_id,section_key,locale,territory_id)
);

create table if not exists public.angelcare_marketplace_surface_versions(
 id uuid primary key default gen_random_uuid(),
 surface_id uuid not null references public.angelcare_marketplace_frontend_surfaces(id) on delete cascade,
 version integer not null,
 status text not null default 'published',
 snapshot jsonb not null,
 created_by uuid,
 created_at timestamptz not null default now(),
 unique(surface_id,version)
);

create table if not exists public.angelcare_marketplace_search_rules(
 id uuid primary key default gen_random_uuid(),
 rule_key text not null unique,
 rule_type text not null check(rule_type in('synonym','alias','pin','bury','suggestion','empty_result','banner')),
 query_pattern text not null,
 replacement_query text,
 catalog_item_id uuid references public.angelcare_marketplace_catalog_items(id) on delete set null,
 category_key text,
 locale text check(locale is null or locale in('fr','en','ar')),
 priority integer not null default 100,
 content jsonb not null default '{}',
 status text not null default 'active' check(status in('draft','active','paused','archived')),
 created_by uuid,
 updated_by uuid,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);


-- Category Storefront Studio controls. Existing category metadata remains intact.
alter table public.angelcare_marketplace_catalog_categories add column if not exists experience_config jsonb not null default '{}';
alter table public.angelcare_marketplace_catalog_categories add column if not exists hero_content jsonb not null default '{}';
alter table public.angelcare_marketplace_catalog_categories add column if not exists storefront_sections jsonb not null default '[]';
alter table public.angelcare_marketplace_catalog_categories add column if not exists filter_config jsonb not null default '{}';

-- Product Command Studio 2.0 controls. Existing commercial fields remain canonical.
alter table public.angelcare_marketplace_catalog_items add column if not exists experience_config jsonb not null default '{}';
alter table public.angelcare_marketplace_catalog_items add column if not exists territory_config jsonb not null default '{}';
alter table public.angelcare_marketplace_catalog_items add column if not exists fulfillment_config jsonb not null default '{}';
alter table public.angelcare_marketplace_catalog_items add column if not exists trust_config jsonb not null default '{}';
alter table public.angelcare_marketplace_catalog_items add column if not exists relation_config jsonb not null default '{}';

-- Admin-assisted lead conversion can create a guest/prospect customer before portal claim.
alter table public.angelcare_marketplace_customer_accounts alter column auth_user_id drop not null;

-- Assisted order provenance stays on the canonical Journey object.
alter table public.angelcare_marketplace_journeys add column if not exists creation_source text not null default 'customer_checkout';
alter table public.angelcare_marketplace_journeys add column if not exists assisted_order_payload jsonb not null default '{}';
create index if not exists ac_journeys_creation_source_idx on public.angelcare_marketplace_journeys(creation_source,created_at desc);

-- Public Inquiry Command: keep the existing inquiry object and add commercial links.
alter table public.angelcare_marketplace_public_inquiries add column if not exists linked_customer_account_id uuid references public.angelcare_marketplace_customer_accounts(id) on delete set null;
alter table public.angelcare_marketplace_public_inquiries add column if not exists linked_journey_id uuid references public.angelcare_marketplace_journeys(id) on delete set null;
alter table public.angelcare_marketplace_public_inquiries add column if not exists linked_quote_id uuid;
alter table public.angelcare_marketplace_public_inquiries add column if not exists admin_notes text;
alter table public.angelcare_marketplace_public_inquiries add column if not exists source_metadata jsonb not null default '{}';
alter table public.angelcare_marketplace_public_inquiries add column if not exists updated_at timestamptz not null default now();

create table if not exists public.angelcare_marketplace_public_inquiry_events(
 id uuid primary key default gen_random_uuid(),
 inquiry_id uuid not null references public.angelcare_marketplace_public_inquiries(id) on delete cascade,
 event_type text not null,
 title text not null,
 body text,
 metadata jsonb not null default '{}',
 created_by uuid,
 created_at timestamptz not null default now()
);
create index if not exists ac_public_inquiry_events_idx on public.angelcare_marketplace_public_inquiry_events(inquiry_id,created_at desc);

-- Canonical surfaces. Business content can be changed later from Admin without deploy.
insert into public.angelcare_marketplace_frontend_surfaces(surface_key,surface_type,title,route_pattern,renderer_key,admin_studio_key,status,content,settings)
values
('homepage','homepage','Homepage','/angelcare-marketplace/:locale','homepage_flagship','homepage','published','{}','{}'),
('marketplace-index','marketplace','Marketplace Landing','/angelcare-marketplace/:locale/marketplace','marketplace_index','marketplace','published',
 '{"fr":{"eyebrow":"ANGELCARE GLOBAL MARKETPLACE","title":"Un univers de services, produits et solutions conçu pour agir","lead":"Explorez, comparez et engagez le bon parcours avec une visibilité claire sur le territoire, la disponibilité, la confiance et la valeur."},"en":{"eyebrow":"ANGELCARE GLOBAL MARKETPLACE","title":"A universe of services, products and solutions built for action","lead":"Explore, compare and start the right journey with clear territory, availability, trust and value."},"ar":{"eyebrow":"ANGELCARE GLOBAL MARKETPLACE","title":"عالم من الخدمات والمنتجات والحلول المصممة للتنفيذ","lead":"استكشف وقارن وابدأ المسار المناسب مع رؤية واضحة للتوفر والثقة والقيمة."},"departments":["families","home-services","development","kits","academy","establishments","hospitality","quality-check"]}',
 '{"department_limit":12,"inventory_limit":16}'),
('families','category','Families','/angelcare-marketplace/:locale/families','category_storefront','category','published','{}','{}'),
('home-services','category','Home Services','/angelcare-marketplace/:locale/home-services','category_storefront','category','published','{}','{}'),
('development','vertical','Development','/angelcare-marketplace/:locale/development','development_experience','vertical','published','{}','{}'),
('kits','category','Kits','/angelcare-marketplace/:locale/kits','category_storefront','category','published','{}','{}'),
('academy','vertical','Academy','/angelcare-marketplace/:locale/academy','academy_experience','vertical','published','{}','{}'),
('establishments','vertical','Establishments','/angelcare-marketplace/:locale/establishments','establishments_experience','vertical','published','{}','{}'),
('hospitality','vertical','Hospitality','/angelcare-marketplace/:locale/hospitality','hospitality_experience','vertical','published','{}','{}'),
('corporates','vertical','Corporates','/angelcare-marketplace/:locale/corporates','corporate_experience','vertical','published','{}','{}'),
('health-partners','vertical','Health Partners','/angelcare-marketplace/:locale/health-partners','health_experience','vertical','published','{}','{}'),
('quality-check','vertical','Quality Check 360','/angelcare-marketplace/:locale/quality-check','quality_experience','vertical','published','{}','{}'),
('cart','transactional','Basket','/angelcare-marketplace/:locale/basket','cart','transactional','published','{}','{}'),
('checkout','transactional','Checkout','/angelcare-marketplace/:locale/checkout','checkout','transactional','published','{}','{}'),
('order-success','transactional','Order Success','/angelcare-marketplace/:locale/checkout/confirmation','order_success','transactional','published','{}','{}'),
('header','navigation','Global Header','*','global_header','navigation','published','{}','{}'),
('footer','footer','Global Footer','*','global_footer','footer','published','{}','{}')
on conflict(surface_key) do update set route_pattern=excluded.route_pattern,renderer_key=excluded.renderer_key,admin_studio_key=excluded.admin_studio_key,updated_at=now();

-- Seed meaningful vertical business content without replacing specialized renderers.
update public.angelcare_marketplace_frontend_surfaces set content='{
 "fr":{"eyebrow":"FAMILY HOSPITALITY OPERATING SYSTEM","title":"Faites de l’accueil des familles une signature de votre établissement.","lead":"Kids club, garde des enfants des clients, concierge famille et programmes saisonniers sont configurés par propriété, capacité, langue, sécurité et expérience attendue.","primary_cta_label":"Configurer une étude Hospitality","primary_cta_href":"/hospitality/request","secondary_cta_label":"Programmes saisonniers","secondary_cta_href":"/hospitality/seasonal-programs"},
 "en":{"eyebrow":"FAMILY HOSPITALITY OPERATING SYSTEM","title":"Make family hospitality a signature of your property.","lead":"Kids clubs, guest childcare, family concierge and seasonal programs are configured by property, capacity, language, safety and expected experience.","primary_cta_label":"Request a hospitality study","primary_cta_href":"/hospitality/request"},
 "ar":{"eyebrow":"نظام تشغيل ضيافة العائلات","title":"اجعل ضيافة العائلات بصمة مميزة لمنشأتك.","lead":"يتم إعداد نوادي الأطفال ورعاية الضيوف والكونسيرج العائلي والبرامج الموسمية حسب المنشأة والسعة واللغة والسلامة.","primary_cta_label":"اطلب دراسة للضيافة","primary_cta_href":"/hospitality/request"},
 "cards":[{"title":"Kids club","body":"Espaces, capacité, âges, horaires, activités, staffing et équipement."},{"title":"Guest childcare","body":"Booking, consentement, handover sécurité, langues et compte rendu invité."},{"title":"Family concierge","body":"Orientation familles, programmes saisonniers, workshops et feedback."}]}'::jsonb,updated_at=now() where surface_key='hospitality' and content='{}'::jsonb;

update public.angelcare_marketplace_frontend_surfaces set content='{
 "fr":{"eyebrow":"EMPLOYEE FAMILY BENEFITS OS","title":"Des avantages familles qui créent une valeur RH démontrable.","lead":"Programmes, éligibilité, quotas, contribution employeur et mesure d’impact relient le soutien familial à l’engagement et à l’expérience employé.","primary_cta_label":"Concevoir un programme Corporate","primary_cta_href":"/corporates/request"},
 "cards":[{"title":"Éligibilité","body":"Population autorisée, ancienneté, site, statut et exceptions."},{"title":"Quota & contribution","body":"Allocation, réservation, consommation, solde, employeur et salarié."},{"title":"Impact RH","body":"Usage, engagement, satisfaction et valeur employeur."}]}'::jsonb,updated_at=now() where surface_key='corporates' and content='{}'::jsonb;

update public.angelcare_marketplace_frontend_surfaces set content='{
 "fr":{"eyebrow":"ÉTABLISSEMENTS · ÉCOLES · CRÈCHES","title":"Piloter la qualité, la confiance parent et la performance dans un même système.","lead":"ANGELCARE relie diagnostic institutionnel, Academy, Quality Check 360 et Partner OS pour produire une transformation exploitable, pas une simple recommandation.","primary_cta_label":"Démarrer le diagnostic","primary_cta_href":"/establishments/diagnostic","secondary_cta_label":"Découvrir Partner OS","secondary_cta_href":"/establishments/partner-os"},
 "cards":[{"title":"Diagnostic institutionnel","body":"Capacité, équipe, sécurité, routines, parent communication, digitalisation, transport et finance."},{"title":"Academy & compétences","body":"Besoins de formation, cohortes, certification et plan de montée en qualité."},{"title":"Quality Check 360","body":"Évidence, score, constats critiques, corrective actions et suivi de progression."}]}'::jsonb,updated_at=now() where surface_key='establishments' and content='{}'::jsonb;

update public.angelcare_marketplace_frontend_surfaces set content='{
 "fr":{"eyebrow":"SUPPORT FAMILIAL STRICTEMENT NON MÉDICAL","title":"Un accompagnement familial strictement non médical, clair et sécurisé.","lead":"Soutien parent, Mother & Baby Care non médical, ateliers et orientation avec consentement, limites explicites et referral vers les professionnels autorisés.","primary_cta_label":"Étudier un programme non médical","primary_cta_href":"/health-partners/request"},
 "cards":[{"title":"Consentement","body":"Texte approuvé, preuve, conservation, confidentialité et décision éclairée."},{"title":"Limites de service","body":"Activités autorisées, interdictions, profils compétents et règles d’arrêt."},{"title":"Referral","body":"Déclencheurs, contacts licenciés, délai, transfert et traçabilité."}]}'::jsonb,updated_at=now() where surface_key='health-partners' and content='{}'::jsonb;

update public.angelcare_marketplace_frontend_surfaces set published_snapshot=content,published_at=coalesce(published_at,now()) where status='published' and published_snapshot is null;

-- Customer intent mirror: attach saved/recent discovery activity to the canonical customer once guest commerce is claimed.
alter table public.angelcare_marketplace_homepage_visitor_selections add column if not exists customer_account_id uuid references public.angelcare_marketplace_customer_accounts(id) on delete set null;
alter table public.angelcare_marketplace_recently_viewed add column if not exists customer_account_id uuid references public.angelcare_marketplace_customer_accounts(id) on delete set null;
create index if not exists ac_homepage_selections_customer_idx on public.angelcare_marketplace_homepage_visitor_selections(customer_account_id,updated_at desc) where customer_account_id is not null;
create index if not exists ac_recently_viewed_customer_idx on public.angelcare_marketplace_recently_viewed(customer_account_id,viewed_at desc) where customer_account_id is not null;

create or replace function public.angelcare_marketplace_claim_guest_commerce(p_customer_account_id uuid,p_auth_user_id uuid,p_visitor_reference text,p_email text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_hash text;v_conversions int:=0;v_journeys int:=0;v_saved int:=0;v_recent int:=0;v_family uuid;
begin
 v_hash:=encode(digest(p_visitor_reference,'sha256'),'hex');
 select family_account_id into v_family from public.angelcare_marketplace_customer_accounts where id=p_customer_account_id;
 update public.angelcare_marketplace_conversion_sessions set customer_account_id=p_customer_account_id,family_account_id=coalesce(family_account_id,v_family),updated_at=now() where visitor_reference_hash=v_hash and customer_account_id is null;get diagnostics v_conversions=row_count;
 update public.angelcare_marketplace_journeys j set customer_account_id=p_customer_account_id,family_account_id=coalesce(j.family_account_id,v_family),customer_context=j.customer_context||jsonb_build_object('customer_account_id',p_customer_account_id,'email',p_email),updated_at=now()
 where j.customer_account_id is null and (j.conversion_outcome_id in(select outcome_id from public.angelcare_marketplace_conversion_sessions where customer_account_id=p_customer_account_id and outcome_id is not null) or lower(coalesce(j.customer_context->>'email',''))=lower(coalesce(p_email,'')));get diagnostics v_journeys=row_count;
 update public.angelcare_marketplace_homepage_visitor_selections set customer_account_id=p_customer_account_id,updated_at=now() where visitor_reference=p_visitor_reference and customer_account_id is null;get diagnostics v_saved=row_count;
 update public.angelcare_marketplace_recently_viewed set customer_account_id=p_customer_account_id where visitor_reference=p_visitor_reference and customer_account_id is null;get diagnostics v_recent=row_count;
 return jsonb_build_object('conversions',v_conversions,'journeys',v_journeys,'saved_items',v_saved,'recently_viewed',v_recent);
end$$;

create index if not exists ac_frontend_surfaces_status_idx on public.angelcare_marketplace_frontend_surfaces(status,surface_type,updated_at desc);
create index if not exists ac_surface_sections_idx on public.angelcare_marketplace_surface_sections(surface_id,locale,territory_id,sort_order);
create index if not exists ac_search_rules_query_idx on public.angelcare_marketplace_search_rules(status,rule_type,query_pattern,priority);

alter table public.angelcare_marketplace_frontend_surfaces enable row level security;
alter table public.angelcare_marketplace_surface_sections enable row level security;
alter table public.angelcare_marketplace_surface_versions enable row level security;
alter table public.angelcare_marketplace_search_rules enable row level security;
alter table public.angelcare_marketplace_public_inquiry_events enable row level security;

revoke all on table public.angelcare_marketplace_frontend_surfaces from anon, authenticated;
revoke all on table public.angelcare_marketplace_surface_sections from anon, authenticated;
revoke all on table public.angelcare_marketplace_surface_versions from anon, authenticated;
revoke all on table public.angelcare_marketplace_search_rules from anon, authenticated;
revoke all on table public.angelcare_marketplace_public_inquiry_events from anon, authenticated;

grant select,insert,update,delete on table public.angelcare_marketplace_frontend_surfaces to service_role;
grant select,insert,update,delete on table public.angelcare_marketplace_surface_sections to service_role;
grant select,insert,update,delete on table public.angelcare_marketplace_surface_versions to service_role;
grant select,insert,update,delete on table public.angelcare_marketplace_search_rules to service_role;
grant select,insert,update,delete on table public.angelcare_marketplace_public_inquiry_events to service_role;

commit;
