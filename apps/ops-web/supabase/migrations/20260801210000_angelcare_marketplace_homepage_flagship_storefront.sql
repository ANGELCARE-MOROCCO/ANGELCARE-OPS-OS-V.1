-- ANGELCARE GLOBAL MARKETPLACE — HOMEPAGE FLAGSHIP STOREFRONT
-- Additive, data-preserving, governed homepage merchandising and commerce orchestration.
begin;
create extension if not exists pgcrypto;

do $$ declare v_territory uuid; begin
  select id into v_territory from public.angelcare_marketplace_territories where territory_code='MA-MASTER';
  if v_territory is null then raise exception 'MA-MASTER territory is required before Homepage Flagship migration'; end if;

  alter table public.angelcare_marketplace_catalog_items add column if not exists name_en text;
  alter table public.angelcare_marketplace_catalog_items add column if not exists name_ar text;
  alter table public.angelcare_marketplace_catalog_items add column if not exists short_description_en text;
  alter table public.angelcare_marketplace_catalog_items add column if not exists short_description_ar text;
  alter table public.angelcare_marketplace_catalog_items add column if not exists commercial_metadata jsonb not null default '{}'::jsonb;
  alter table public.angelcare_marketplace_partner_plans add column if not exists name_en text;
  alter table public.angelcare_marketplace_partner_plans add column if not exists name_ar text;
  alter table public.angelcare_marketplace_partner_plans add column if not exists description_en text;
  alter table public.angelcare_marketplace_partner_plans add column if not exists description_ar text;
end $$;

create table if not exists public.angelcare_marketplace_catalog_categories(
 id uuid primary key default gen_random_uuid(), category_key text not null, locale text not null check(locale in('fr','en','ar')), title text not null, short_description text,
 slug text not null, cover_asset_url text, icon_key text, visual_theme text not null default 'navy', allowed_sellable_types text[] not null default '{}', available_filters jsonb not null default '{}',
 territory_id uuid references public.angelcare_marketplace_territories(id), sort_order int not null default 100, status text not null default 'draft' check(status in('draft','review','approved','published','paused','archived')),
 created_by uuid, updated_by uuid, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique nulls not distinct(category_key,locale,territory_id));
create table if not exists public.angelcare_marketplace_catalog_item_categories(
 catalog_item_id uuid not null references public.angelcare_marketplace_catalog_items(id) on delete cascade, category_id uuid not null references public.angelcare_marketplace_catalog_categories(id) on delete cascade,
 is_primary boolean not null default true, sort_order int not null default 100, created_at timestamptz not null default now(), primary key(catalog_item_id,category_id));
create table if not exists public.angelcare_marketplace_catalog_item_media(
 id uuid primary key default gen_random_uuid(), catalog_item_id uuid not null references public.angelcare_marketplace_catalog_items(id) on delete cascade, media_key text not null, media_type text not null default 'image',
 asset_url text not null, alt_text_fr text not null, alt_text_en text, alt_text_ar text, sort_order int not null default 100, status text not null default 'active' check(status in('draft','active','paused','archived')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(catalog_item_id,media_key));

create table if not exists public.angelcare_marketplace_homepage_versions(
 id uuid primary key default gen_random_uuid(), locale text not null check(locale in('fr','en','ar')), territory_id uuid references public.angelcare_marketplace_territories(id), version int not null,
 status text not null default 'draft' check(status in('draft','in_design','content_review','commercial_review','localization_review','approval_pending','approved','scheduled','published','paused','superseded','archived')),
 snapshot jsonb not null default '{}', owner_id uuid, approved_by uuid, approved_at timestamptz, published_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique nulls not distinct(locale,territory_id,version));
create table if not exists public.angelcare_marketplace_homepage_campaigns(
 id uuid primary key default gen_random_uuid(), campaign_key text not null, locale text not null check(locale in('fr','en','ar')), territory_id uuid references public.angelcare_marketplace_territories(id), eyebrow text,
 title text not null, subtitle text, primary_cta_label text not null, primary_cta_href text not null, secondary_cta_label text, secondary_cta_href text,
 desktop_asset_url text not null, tablet_asset_url text, mobile_asset_url text, audience text not null default 'all' check(audience in('all','family','organization','professional')),
 priority int not null default 100, starts_at timestamptz not null default now(), ends_at timestamptz, status text not null default 'draft' check(status in('draft','asset_required','configured','review_pending','approved','scheduled','active','paused','expired','archived')),
 created_by uuid, updated_by uuid, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique nulls not distinct(campaign_key,locale,territory_id));
create table if not exists public.angelcare_marketplace_homepage_campaign_assets(
 id uuid primary key default gen_random_uuid(), campaign_id uuid references public.angelcare_marketplace_homepage_campaigns(id) on delete cascade, asset_key text not null unique, asset_type text not null default 'image',
 desktop_url text not null, tablet_url text, mobile_url text, arabic_url text, alt_text_fr text not null, alt_text_en text, alt_text_ar text, focal_point jsonb not null default '{}', rights_status text not null default 'owned',
 status text not null default 'draft' check(status in('draft','review_pending','approved','active','paused','archived')), created_by uuid, updated_by uuid, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table if not exists public.angelcare_marketplace_homepage_sections(
 id uuid primary key default gen_random_uuid(), section_key text not null, locale text not null check(locale in('fr','en','ar')), territory_id uuid references public.angelcare_marketplace_territories(id), section_type text not null,
 title text not null, subtitle text, layout_variant text not null default 'rail', sort_order int not null default 100, settings jsonb not null default '{}', status text not null default 'draft' check(status in('draft','review_pending','approved','scheduled','active','paused','archived')),
 created_by uuid, updated_by uuid, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique nulls not distinct(section_key,locale,territory_id));
create table if not exists public.angelcare_marketplace_homepage_collections(
 id uuid primary key default gen_random_uuid(), collection_key text not null, locale text not null check(locale in('fr','en','ar')), territory_id uuid references public.angelcare_marketplace_territories(id), title text not null, subtitle text,
 selection_method text not null default 'editorial', layout_variant text not null default 'service_cards', sort_order int not null default 100, status text not null default 'draft' check(status in('draft','review_pending','approved','scheduled','active','paused','archived')),
 created_by uuid, updated_by uuid, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique nulls not distinct(collection_key,locale,territory_id));
create table if not exists public.angelcare_marketplace_homepage_collection_items(
 id uuid primary key default gen_random_uuid(), collection_id uuid not null references public.angelcare_marketplace_homepage_collections(id) on delete cascade, catalog_item_id uuid not null references public.angelcare_marketplace_catalog_items(id) on delete cascade,
 sort_order int not null default 100, merchandising_reason text, starts_at timestamptz not null default now(), ends_at timestamptz, status text not null default 'active' check(status in('configured','eligible','scheduled','active','suppressed','expired','archived')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(collection_id,catalog_item_id));
create table if not exists public.angelcare_marketplace_homepage_placements(
 id uuid primary key default gen_random_uuid(), placement_key text not null, section_id uuid references public.angelcare_marketplace_homepage_sections(id) on delete cascade, collection_id uuid references public.angelcare_marketplace_homepage_collections(id) on delete cascade,
 catalog_item_id uuid references public.angelcare_marketplace_catalog_items(id) on delete cascade, locale text not null check(locale in('fr','en','ar')), territory_id uuid references public.angelcare_marketplace_territories(id), audience text not null default 'all',
 priority int not null default 100, sort_order int not null default 100, starts_at timestamptz not null default now(), ends_at timestamptz, status text not null default 'configured' check(status in('configured','eligible','scheduled','active','suppressed','expired','archived')),
 created_by uuid, updated_by uuid, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique nulls not distinct(placement_key,locale,territory_id));
create table if not exists public.angelcare_marketplace_homepage_audience_rules(
 id uuid primary key default gen_random_uuid(), rule_key text not null, audience text not null, locale text not null check(locale in('fr','en','ar')), conditions jsonb not null default '{}', outcome jsonb not null default '{}', priority int not null default 100,
 status text not null default 'draft' check(status in('draft','review_pending','approved','active','paused','archived')), created_by uuid, updated_by uuid, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(rule_key,audience,locale));
create table if not exists public.angelcare_marketplace_homepage_territory_rules(
 id uuid primary key default gen_random_uuid(), rule_key text not null, territory_id uuid references public.angelcare_marketplace_territories(id), conditions jsonb not null default '{}', outcome jsonb not null default '{}', priority int not null default 100,
 status text not null default 'draft' check(status in('draft','review_pending','approved','active','paused','archived')), created_by uuid, updated_by uuid, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique nulls not distinct(rule_key,territory_id));
create table if not exists public.angelcare_marketplace_homepage_interactions(
 id uuid primary key default gen_random_uuid(), visitor_reference text, event_name text not null, locale text not null, territory_id uuid references public.angelcare_marketplace_territories(id), campaign_id uuid references public.angelcare_marketplace_homepage_campaigns(id),
 collection_id uuid references public.angelcare_marketplace_homepage_collections(id), catalog_item_id uuid references public.angelcare_marketplace_catalog_items(id), category_key text, route text, event_data jsonb not null default '{}', created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table if not exists public.angelcare_marketplace_homepage_visitor_selections(
 id uuid primary key default gen_random_uuid(), visitor_reference text not null, selection_type text not null check(selection_type in('saved','compare')), catalog_item_id uuid not null references public.angelcare_marketplace_catalog_items(id) on delete cascade,
 locale text not null default 'fr', territory_id uuid references public.angelcare_marketplace_territories(id), active boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(visitor_reference,selection_type,catalog_item_id));

-- Seed canonical category authority.
do $$ declare v_territory uuid; begin select id into v_territory from public.angelcare_marketplace_territories where territory_code='MA-MASTER';
insert into public.angelcare_marketplace_catalog_categories(category_key,locale,title,short_description,slug,cover_asset_url,icon_key,visual_theme,allowed_sellable_types,available_filters,territory_id,sort_order,status) values
('family-services','fr','Familles & garde','Services à domicile, accompagnement récurrent et parcours famille.','family-services','/angelcare-marketplace/homepage/category-family.svg','family-services','warm',array['service','product','training','audit','saas_module','kit']::text[],'{"territory":true,"audience":true,"availability":true}'::jsonb,v_territory,100,'published'),
('family-services','en','Families & childcare','Home services, recurring support and family journeys.','family-services','/angelcare-marketplace/homepage/category-family.svg','family-services','warm',array['service','product','training','audit','saas_module','kit']::text[],'{"territory":true,"audience":true,"availability":true}'::jsonb,v_territory,100,'published'),
('family-services','ar','العائلات ورعاية الأطفال','خدمات منزلية ودعم متكرر ومسارات عائلية.','family-services','/angelcare-marketplace/homepage/category-family.svg','family-services','warm',array['service','product','training','audit','saas_module','kit']::text[],'{"territory":true,"audience":true,"availability":true}'::jsonb,v_territory,100,'published'),
('development','fr','Développement & Montessori','Activités guidées par âge, objectif et protocole.','development','/angelcare-marketplace/homepage/category-development.svg','development','blue',array['service','product','training','audit','saas_module','kit']::text[],'{"territory":true,"audience":true,"availability":true}'::jsonb,v_territory,100,'published'),
('development','en','Development & Montessori','Age, objective and protocol-led activities.','development','/angelcare-marketplace/homepage/category-development.svg','development','blue',array['service','product','training','audit','saas_module','kit']::text[],'{"territory":true,"audience":true,"availability":true}'::jsonb,v_territory,100,'published'),
('development','ar','التنمية ومونتيسوري','أنشطة موجهة حسب العمر والهدف والبروتوكول.','development','/angelcare-marketplace/homepage/category-development.svg','development','blue',array['service','product','training','audit','saas_module','kit']::text[],'{"territory":true,"audience":true,"availability":true}'::jsonb,v_territory,100,'published'),
('kits','fr','Kits & matériels','Kits, contenus, usages et sécurité.','kits','/angelcare-marketplace/homepage/category-kits.svg','kits','red',array['service','product','training','audit','saas_module','kit']::text[],'{"territory":true,"audience":true,"availability":true}'::jsonb,v_territory,100,'published'),
('kits','en','Kits & materials','Kits, contents, use and safety.','kits','/angelcare-marketplace/homepage/category-kits.svg','kits','red',array['service','product','training','audit','saas_module','kit']::text[],'{"territory":true,"audience":true,"availability":true}'::jsonb,v_territory,100,'published'),
('kits','ar','الحقائب والمواد','حقائب ومحتويات واستخدامات وسلامة.','kits','/angelcare-marketplace/homepage/category-kits.svg','kits','red',array['service','product','training','audit','saas_module','kit']::text[],'{"territory":true,"audience":true,"availability":true}'::jsonb,v_territory,100,'published'),
('academy','fr','Academy & certifications','Programmes, cohortes, évaluations et certificats.','academy','/angelcare-marketplace/homepage/category-academy.svg','academy','navy',array['service','product','training','audit','saas_module','kit']::text[],'{"territory":true,"audience":true,"availability":true}'::jsonb,v_territory,100,'published'),
('academy','en','Academy & credentials','Programs, cohorts, assessments and credentials.','academy','/angelcare-marketplace/homepage/category-academy.svg','academy','navy',array['service','product','training','audit','saas_module','kit']::text[],'{"territory":true,"audience":true,"availability":true}'::jsonb,v_territory,100,'published'),
('academy','ar','الأكاديمية والشهادات','برامج ودورات وتقييمات وشهادات.','academy','/angelcare-marketplace/homepage/category-academy.svg','academy','navy',array['service','product','training','audit','saas_module','kit']::text[],'{"territory":true,"audience":true,"availability":true}'::jsonb,v_territory,100,'published'),
('institutions','fr','Écoles & crèches','Diagnostic, Academy, Partner OS et Quality Check 360.','institutions','/angelcare-marketplace/homepage/category-institutions.svg','institutions','blue',array['service','product','training','audit','saas_module','kit']::text[],'{"territory":true,"audience":true,"availability":true}'::jsonb,v_territory,100,'published'),
('institutions','en','Schools & childcare centers','Diagnostic, Academy, Partner OS and Quality Check 360.','institutions','/angelcare-marketplace/homepage/category-institutions.svg','institutions','blue',array['service','product','training','audit','saas_module','kit']::text[],'{"territory":true,"audience":true,"availability":true}'::jsonb,v_territory,100,'published'),
('institutions','ar','المدارس والحضانات','تشخيص وأكاديمية ونظام الشركاء وفحص الجودة.','institutions','/angelcare-marketplace/homepage/category-institutions.svg','institutions','blue',array['service','product','training','audit','saas_module','kit']::text[],'{"territory":true,"audience":true,"availability":true}'::jsonb,v_territory,100,'published'),
('hospitality','fr','Hospitality kids friendly','Kids clubs, guest childcare et programmes saisonniers.','hospitality','/angelcare-marketplace/homepage/category-hospitality.svg','hospitality','warm',array['service','product','training','audit','saas_module','kit']::text[],'{"territory":true,"audience":true,"availability":true}'::jsonb,v_territory,100,'published'),
('hospitality','en','Family hospitality','Kids clubs, guest childcare and seasonal programs.','hospitality','/angelcare-marketplace/homepage/category-hospitality.svg','hospitality','warm',array['service','product','training','audit','saas_module','kit']::text[],'{"territory":true,"audience":true,"availability":true}'::jsonb,v_territory,100,'published'),
('hospitality','ar','ضيافة صديقة للعائلة','نوادي أطفال ورعاية ضيوف وبرامج موسمية.','hospitality','/angelcare-marketplace/homepage/category-hospitality.svg','hospitality','warm',array['service','product','training','audit','saas_module','kit']::text[],'{"territory":true,"audience":true,"availability":true}'::jsonb,v_territory,100,'published'),
('health-adjacent','fr','Maternité & soutien non médical','Accompagnement strictement non médical, consentement et orientation.','health-adjacent','/angelcare-marketplace/homepage/category-health.svg','health-adjacent','green',array['service','product','training','audit','saas_module','kit']::text[],'{"territory":true,"audience":true,"availability":true}'::jsonb,v_territory,100,'published'),
('health-adjacent','en','Non-medical family support','Strictly non-medical support, consent and referrals.','health-adjacent','/angelcare-marketplace/homepage/category-health.svg','health-adjacent','green',array['service','product','training','audit','saas_module','kit']::text[],'{"territory":true,"audience":true,"availability":true}'::jsonb,v_territory,100,'published'),
('health-adjacent','ar','دعم عائلي غير طبي','دعم غير طبي وموافقة وتوجيه.','health-adjacent','/angelcare-marketplace/homepage/category-health.svg','health-adjacent','green',array['service','product','training','audit','saas_module','kit']::text[],'{"territory":true,"audience":true,"availability":true}'::jsonb,v_territory,100,'published'),
('corporate','fr','Corporate & RH','Avantages familles, quotas, programmes et impact.','corporate','/angelcare-marketplace/homepage/category-corporate.svg','corporate','slate',array['service','product','training','audit','saas_module','kit']::text[],'{"territory":true,"audience":true,"availability":true}'::jsonb,v_territory,100,'published'),
('corporate','en','Corporate & HR','Family benefits, quotas, programs and impact.','corporate','/angelcare-marketplace/homepage/category-corporate.svg','corporate','slate',array['service','product','training','audit','saas_module','kit']::text[],'{"territory":true,"audience":true,"availability":true}'::jsonb,v_territory,100,'published'),
('corporate','ar','الشركات والموارد البشرية','مزايا عائلية وحصص وبرامج وأثر.','corporate','/angelcare-marketplace/homepage/category-corporate.svg','corporate','slate',array['service','product','training','audit','saas_module','kit']::text[],'{"territory":true,"audience":true,"availability":true}'::jsonb,v_territory,100,'published'),
('partner-os','fr','Partner OS','SaaS multi-tenant, modules, plans et onboarding.','partner-os','/angelcare-marketplace/homepage/category-partner-os.svg','partner-os','navy',array['service','product','training','audit','saas_module','kit']::text[],'{"territory":true,"audience":true,"availability":true}'::jsonb,v_territory,100,'published'),
('partner-os','en','Partner OS','Multi-tenant SaaS, modules, plans and onboarding.','partner-os','/angelcare-marketplace/homepage/category-partner-os.svg','partner-os','navy',array['service','product','training','audit','saas_module','kit']::text[],'{"territory":true,"audience":true,"availability":true}'::jsonb,v_territory,100,'published'),
('partner-os','ar','نظام الشركاء','برمجيات متعددة المستأجرين ووحدات وخطط وتهيئة.','partner-os','/angelcare-marketplace/homepage/category-partner-os.svg','partner-os','navy',array['service','product','training','audit','saas_module','kit']::text[],'{"territory":true,"audience":true,"availability":true}'::jsonb,v_territory,100,'published'),
('quality','fr','Trust & Quality Check 360','Évidence, évaluation, corrective actions et vérification.','quality','/angelcare-marketplace/homepage/category-quality.svg','quality','green',array['service','product','training','audit','saas_module','kit']::text[],'{"territory":true,"audience":true,"availability":true}'::jsonb,v_territory,100,'published'),
('quality','en','Trust & Quality Check 360','Evidence, assessment, corrective action and verification.','quality','/angelcare-marketplace/homepage/category-quality.svg','quality','green',array['service','product','training','audit','saas_module','kit']::text[],'{"territory":true,"audience":true,"availability":true}'::jsonb,v_territory,100,'published'),
('quality','ar','الثقة وفحص الجودة 360','أدلة وتقييم وإجراءات تصحيحية وتحقق.','quality','/angelcare-marketplace/homepage/category-quality.svg','quality','green',array['service','product','training','audit','saas_module','kit']::text[],'{"territory":true,"audience":true,"availability":true}'::jsonb,v_territory,100,'published')
on conflict(category_key,locale,territory_id) do update set title=excluded.title,short_description=excluded.short_description,cover_asset_url=excluded.cover_asset_url,visual_theme=excluded.visual_theme,allowed_sellable_types=excluded.allowed_sellable_types,available_filters=excluded.available_filters,status='published',updated_at=now(); end $$;

-- Seed canonical sellable objects as database-managed catalogue records, never JSX constants.
do $$ declare v_territory uuid; begin select id into v_territory from public.angelcare_marketplace_territories where territory_code='MA-MASTER';
insert into public.angelcare_marketplace_catalog_items(item_key,slug,kind,name_fr,name_en,name_ar,short_description_fr,short_description_en,short_description_ar,status,territory_id,currency_label,price_mode,price_amount,featured,availability_status,commercial_metadata) values
('family-home-care','family-home-care','service','Garde à domicile gouvernée','Governed home childcare','رعاية منزلية محكومة','Une demande qualifiée, un intervenant éligible, un brief et une preuve de mission.','A qualified request, eligible provider, brief and mission evidence.','طلب مؤهل ومقدم خدمة مؤهل وملخص وأدلة مهمة.','published',v_territory,'Dh','quote_only',null,true,'configuration_required','{"audience":"family","category_key":"family-services","merchandising_source":"homepage_flagship_initial_catalog","selection_explainable":true}'::jsonb),
('family-recurring-care','family-recurring-care','service','Accompagnement familial récurrent','Recurring family support','دعم عائلي متكرر','Un dispositif récurrent configuré selon horaires, territoire et besoins.','Recurring support configured around schedule, territory and needs.','دعم متكرر مهيأ حسب الجدول والنطاق والحاجات.','published',v_territory,'Dh','quote_only',null,true,'configuration_required','{"audience":"family","category_key":"family-services","merchandising_source":"homepage_flagship_initial_catalog","selection_explainable":true}'::jsonb),
('family-after-school','family-after-school','service','Accompagnement après-école','After-school support','دعم ما بعد المدرسة','Routine, sécurité, activités et compte rendu dans un parcours continu.','Routine, safety, activities and reporting in one continuous journey.','روتين وسلامة وأنشطة وتقارير ضمن مسار واحد.','published',v_territory,'Dh','quote_only',null,false,'configuration_required','{"audience":"family","category_key":"family-services","merchandising_source":"homepage_flagship_initial_catalog","selection_explainable":true}'::jsonb),
('montessori-sensory-path','montessori-sensory-path','service','Parcours sensoriel Montessori','Montessori sensory pathway','مسار مونتيسوري الحسي','Activités adaptées à l’âge avec objectifs, matériel et protocole.','Age-appropriate activities with objectives, materials and protocol.','أنشطة مناسبة للعمر مع أهداف ومواد وبروتوكول.','published',v_territory,'Dh','quote_only',null,true,'configuration_required','{"audience":"family","category_key":"development","merchandising_source":"homepage_flagship_initial_catalog","selection_explainable":true}'::jsonb),
('autonomy-discovery-kit','autonomy-discovery-kit','kit','Kit découverte autonomie','Autonomy discovery kit','حقيبة اكتشاف الاستقلالية','Contenus, activités associées, sécurité et alternatives gouvernées.','Governed contents, related activities, safety and alternatives.','محتويات وأنشطة مرتبطة وسلامة وبدائل محكومة.','published',v_territory,'Dh','quote_only',null,true,'configuration_required','{"audience":"family","category_key":"kits","merchandising_source":"homepage_flagship_initial_catalog","selection_explainable":true}'::jsonb),
('academy-safeguarding-core','academy-safeguarding-core','training','Safeguarding & sécurité enfant','Child safeguarding & safety','حماية الطفل وسلامته','Programme Academy avec prérequis, évaluation et certification gouvernée.','Academy program with prerequisites, assessment and governed credential.','برنامج أكاديمي مع متطلبات وتقييم وشهادة محكومة.','published',v_territory,'Dh','quote_only',null,true,'configuration_required','{"audience":"professional","category_key":"academy","merchandising_source":"homepage_flagship_initial_catalog","selection_explainable":true}'::jsonb),
('academy-montessori-practice','academy-montessori-practice','training','Pratique Montessori appliquée','Applied Montessori practice','ممارسة مونتيسوري التطبيقية','Compétences pratiques, observation et preuve d’évaluation.','Practical competencies, observation and assessment evidence.','كفاءات عملية وملاحظة وأدلة تقييم.','published',v_territory,'Dh','quote_only',null,false,'configuration_required','{"audience":"professional","category_key":"academy","merchandising_source":"homepage_flagship_initial_catalog","selection_explainable":true}'::jsonb),
('school-transformation-diagnostic','school-transformation-diagnostic','service','Diagnostic transformation établissement','Institution transformation diagnostic','تشخيص تحول المؤسسة','Capacité, sécurité, Academy, ParentTrust, Partner OS et plan de progression.','Capacity, safety, Academy, ParentTrust, Partner OS and progress plan.','الطاقة والسلامة والأكاديمية وثقة الوالدين ونظام الشركاء وخطة التطور.','published',v_territory,'Dh','quote_only',null,true,'configuration_required','{"audience":"organization","category_key":"institutions","merchandising_source":"homepage_flagship_initial_catalog","selection_explainable":true}'::jsonb),
('hospitality-kids-club-program','hospitality-kids-club-program','service','Programme Kids Club gouverné','Governed Kids Club program','برنامج نادي أطفال محكوم','Saison, capacité, langues, staffing, activités et readiness par propriété.','Season, capacity, languages, staffing, activities and property readiness.','موسم وطاقة ولغات وطاقم وأنشطة وجاهزية حسب المنشأة.','published',v_territory,'Dh','quote_only',null,true,'configuration_required','{"audience":"organization","category_key":"hospitality","merchandising_source":"homepage_flagship_initial_catalog","selection_explainable":true}'::jsonb),
('mother-baby-non-medical-support','mother-baby-non-medical-support','service','Mother & Baby Care non médical','Non-medical Mother & Baby Care','دعم الأم والطفل غير الطبي','Accompagnement borné par consentement, interdictions et orientation qualifiée.','Support bounded by consent, prohibitions and qualified referral.','دعم محكوم بالموافقة والمحظورات والتوجيه المؤهل.','published',v_territory,'Dh','quote_only',null,false,'configuration_required','{"audience":"organization","category_key":"health-adjacent","merchandising_source":"homepage_flagship_initial_catalog","selection_explainable":true}'::jsonb),
('corporate-family-benefits','corporate-family-benefits','service','Programme avantages familles Corporate','Corporate family benefits program','برنامج مزايا العائلات للشركات','Éligibilité, quotas, contribution, usages et mesure d’impact RH.','Eligibility, quotas, contribution, usage and HR impact.','أهلية وحصص ومساهمة واستخدام وقياس أثر الموارد البشرية.','published',v_territory,'Dh','quote_only',null,true,'configuration_required','{"audience":"organization","category_key":"corporate","merchandising_source":"homepage_flagship_initial_catalog","selection_explainable":true}'::jsonb),
('partner-os-pilot','partner-os-pilot','saas_module','Partner OS · Pilotage institutionnel','Partner OS · Institution control','نظام الشركاء · قيادة المؤسسة','Modules, tenant, onboarding, usage limits et gouvernance multi-site.','Modules, tenant, onboarding, usage limits and multi-site governance.','وحدات ومستأجر وتهيئة وحدود استخدام وحوكمة متعددة المواقع.','published',v_territory,'Dh','quote_only',null,true,'configuration_required','{"audience":"organization","category_key":"partner-os","merchandising_source":"homepage_flagship_initial_catalog","selection_explainable":true}'::jsonb),
('quality-check-360','quality-check-360','audit','Quality Check 360','Quality Check 360','فحص الجودة 360','Référentiel, évaluation pondérée, évidence, findings et corrective actions.','Framework, weighted assessment, evidence, findings and corrective action.','إطار وتقييم موزون وأدلة ونتائج وإجراءات تصحيحية.','published',v_territory,'Dh','quote_only',null,true,'configuration_required','{"audience":"organization","category_key":"quality","merchandising_source":"homepage_flagship_initial_catalog","selection_explainable":true}'::jsonb)
on conflict(item_key) do update set slug=excluded.slug,kind=excluded.kind,name_fr=excluded.name_fr,name_en=excluded.name_en,name_ar=excluded.name_ar,short_description_fr=excluded.short_description_fr,short_description_en=excluded.short_description_en,short_description_ar=excluded.short_description_ar,status='published',territory_id=excluded.territory_id,currency_label=excluded.currency_label,price_mode=excluded.price_mode,price_amount=excluded.price_amount,featured=excluded.featured,availability_status=excluded.availability_status,commercial_metadata=excluded.commercial_metadata,updated_at=now(); end $$;

-- These three objects are immediately requestable; this does not claim provider, stock or cohort capacity.
update public.angelcare_marketplace_catalog_items set availability_status='available',updated_at=now()
where item_key in('school-transformation-diagnostic','partner-os-pilot','quality-check-360');

-- Link every item to all localized variants of its canonical category.
with mapping(item_key,category_key) as (values
('family-home-care','family-services'),
('family-recurring-care','family-services'),
('family-after-school','family-services'),
('montessori-sensory-path','development'),
('autonomy-discovery-kit','kits'),
('academy-safeguarding-core','academy'),
('academy-montessori-practice','academy'),
('school-transformation-diagnostic','institutions'),
('hospitality-kids-club-program','hospitality'),
('mother-baby-non-medical-support','health-adjacent'),
('corporate-family-benefits','corporate'),
('partner-os-pilot','partner-os'),
('quality-check-360','quality')
)
insert into public.angelcare_marketplace_catalog_item_categories(catalog_item_id,category_id,is_primary,sort_order)
select i.id,c.id,true,100 from mapping m join public.angelcare_marketplace_catalog_items i on i.item_key=m.item_key join public.angelcare_marketplace_catalog_categories c on c.category_key=m.category_key
on conflict(catalog_item_id,category_id) do update set is_primary=true;

with media(item_key,asset,alt) as (values
('family-home-care','/angelcare-marketplace/homepage/item-home-care.svg','Garde à domicile gouvernée'),
('family-recurring-care','/angelcare-marketplace/homepage/item-recurring-care.svg','Accompagnement familial récurrent'),
('family-after-school','/angelcare-marketplace/homepage/item-after-school.svg','Accompagnement après-école'),
('montessori-sensory-path','/angelcare-marketplace/homepage/item-montessori.svg','Parcours sensoriel Montessori'),
('autonomy-discovery-kit','/angelcare-marketplace/homepage/item-autonomy-kit.svg','Kit découverte autonomie'),
('academy-safeguarding-core','/angelcare-marketplace/homepage/item-academy-safety.svg','Safeguarding & sécurité enfant'),
('academy-montessori-practice','/angelcare-marketplace/homepage/item-academy-montessori.svg','Pratique Montessori appliquée'),
('school-transformation-diagnostic','/angelcare-marketplace/homepage/item-school-diagnostic.svg','Diagnostic transformation établissement'),
('hospitality-kids-club-program','/angelcare-marketplace/homepage/item-hospitality.svg','Programme Kids Club gouverné'),
('mother-baby-non-medical-support','/angelcare-marketplace/homepage/item-mother-baby.svg','Mother & Baby Care non médical'),
('corporate-family-benefits','/angelcare-marketplace/homepage/item-corporate.svg','Programme avantages familles Corporate'),
('partner-os-pilot','/angelcare-marketplace/homepage/item-partner-os.svg','Partner OS · Pilotage institutionnel'),
('quality-check-360','/angelcare-marketplace/homepage/item-quality-check.svg','Quality Check 360')
)
insert into public.angelcare_marketplace_catalog_item_media(catalog_item_id,media_key,asset_url,alt_text_fr,alt_text_en,alt_text_ar,status)
select i.id,'primary',m.asset,m.alt,m.alt,m.alt,'active' from media m join public.angelcare_marketplace_catalog_items i on i.item_key=m.item_key
on conflict(catalog_item_id,media_key) do update set asset_url=excluded.asset_url,alt_text_fr=excluded.alt_text_fr,status='active',updated_at=now();

-- Homepage campaigns, responsive assets and orchestration.
do $$ declare v_territory uuid; begin select id into v_territory from public.angelcare_marketplace_territories where territory_code='MA-MASTER';
insert into public.angelcare_marketplace_homepage_campaigns(campaign_key,locale,territory_id,eyebrow,title,subtitle,primary_cta_label,primary_cta_href,secondary_cta_label,secondary_cta_href,desktop_asset_url,tablet_asset_url,mobile_asset_url,audience,priority,starts_at,ends_at,status) values
('flagship-family','fr',v_territory,'ANGELCARE GLOBAL MARKETPLACE','Le Marketplace qui transforme un besoin familial en parcours maîtrisé.','Services, activités, kits et accompagnement reliés à la qualification, aux missions et aux rapports.','Explorer maintenant','/angelcare-marketplace/fr/marketplace?audience=family','Parler à ANGELCARE','/angelcare-marketplace/fr/contact','/angelcare-marketplace/homepage/hero-family-marketplace.svg','/angelcare-marketplace/homepage/hero-family-marketplace.svg','/angelcare-marketplace/homepage/hero-family-marketplace.svg','family',10,now(),null,'active'),
('flagship-family','en',v_territory,'ANGELCARE GLOBAL MARKETPLACE','A marketplace that turns a family need into a controlled journey.','Services, activities, kits and support connected to qualification, missions and reporting.','Explore now','/angelcare-marketplace/en/marketplace?audience=family','Talk to ANGELCARE','/angelcare-marketplace/en/contact','/angelcare-marketplace/homepage/hero-family-marketplace.svg','/angelcare-marketplace/homepage/hero-family-marketplace.svg','/angelcare-marketplace/homepage/hero-family-marketplace.svg','family',10,now(),null,'active'),
('flagship-family','ar',v_territory,'ANGELCARE GLOBAL MARKETPLACE','سوق يحول حاجة العائلة إلى مسار محكوم.','خدمات وأنشطة وحقائب ودعم مرتبط بالتأهيل والمهام والتقارير.','استكشف الآن','/angelcare-marketplace/ar/marketplace?audience=family','تواصل مع أنجل كير','/angelcare-marketplace/ar/contact','/angelcare-marketplace/homepage/hero-family-marketplace.svg','/angelcare-marketplace/homepage/hero-family-marketplace.svg','/angelcare-marketplace/homepage/hero-family-marketplace.svg','family',10,now(),null,'active'),
('flagship-academy','fr',v_territory,'ANGELCARE GLOBAL MARKETPLACE','Academy : apprendre, prouver, certifier, devenir éligible.','Programmes, cohortes et certifications connectés aux exigences opérationnelles ANGELCARE.','Explorer maintenant','/angelcare-marketplace/fr/academy','Parler à ANGELCARE','/angelcare-marketplace/fr/contact','/angelcare-marketplace/homepage/hero-academy-marketplace.svg','/angelcare-marketplace/homepage/hero-academy-marketplace.svg','/angelcare-marketplace/homepage/hero-academy-marketplace.svg','professional',20,now(),null,'active'),
('flagship-academy','en',v_territory,'ANGELCARE GLOBAL MARKETPLACE','Academy: learn, prove, certify and become eligible.','Programs, cohorts and credentials connected to ANGELCARE operational requirements.','Explore now','/angelcare-marketplace/en/academy','Talk to ANGELCARE','/angelcare-marketplace/en/contact','/angelcare-marketplace/homepage/hero-academy-marketplace.svg','/angelcare-marketplace/homepage/hero-academy-marketplace.svg','/angelcare-marketplace/homepage/hero-academy-marketplace.svg','professional',20,now(),null,'active'),
('flagship-academy','ar',v_territory,'ANGELCARE GLOBAL MARKETPLACE','الأكاديمية: تعلم وأثبت واحصل على شهادة وأصبح مؤهلا.','برامج ودورات وشهادات مرتبطة بالمتطلبات التشغيلية لأنجل كير.','استكشف الآن','/angelcare-marketplace/ar/academy','تواصل مع أنجل كير','/angelcare-marketplace/ar/contact','/angelcare-marketplace/homepage/hero-academy-marketplace.svg','/angelcare-marketplace/homepage/hero-academy-marketplace.svg','/angelcare-marketplace/homepage/hero-academy-marketplace.svg','professional',20,now(),null,'active'),
('flagship-partner-os','fr',v_territory,'ANGELCARE GLOBAL MARKETPLACE','Partner OS : la couche SaaS des établissements ambitieux.','Modules, multi-sites, usage, onboarding et pilotage dans un tenant gouverné.','Explorer maintenant','/angelcare-marketplace/fr/partner-os','Parler à ANGELCARE','/angelcare-marketplace/fr/contact','/angelcare-marketplace/homepage/hero-partner-os.svg','/angelcare-marketplace/homepage/hero-partner-os.svg','/angelcare-marketplace/homepage/hero-partner-os.svg','organization',30,now(),null,'active'),
('flagship-partner-os','en',v_territory,'ANGELCARE GLOBAL MARKETPLACE','Partner OS: the SaaS layer for ambitious organizations.','Modules, multi-site, usage, onboarding and control in a governed tenant.','Explore now','/angelcare-marketplace/en/partner-os','Talk to ANGELCARE','/angelcare-marketplace/en/contact','/angelcare-marketplace/homepage/hero-partner-os.svg','/angelcare-marketplace/homepage/hero-partner-os.svg','/angelcare-marketplace/homepage/hero-partner-os.svg','organization',30,now(),null,'active'),
('flagship-partner-os','ar',v_territory,'ANGELCARE GLOBAL MARKETPLACE','نظام الشركاء: طبقة البرمجيات للمؤسسات الطموحة.','وحدات ومواقع متعددة واستخدام وتهيئة وقيادة ضمن مستأجر محكوم.','استكشف الآن','/angelcare-marketplace/ar/partner-os','تواصل مع أنجل كير','/angelcare-marketplace/ar/contact','/angelcare-marketplace/homepage/hero-partner-os.svg','/angelcare-marketplace/homepage/hero-partner-os.svg','/angelcare-marketplace/homepage/hero-partner-os.svg','organization',30,now(),null,'active')
on conflict(campaign_key,locale,territory_id) do update set eyebrow=excluded.eyebrow,title=excluded.title,subtitle=excluded.subtitle,primary_cta_label=excluded.primary_cta_label,primary_cta_href=excluded.primary_cta_href,secondary_cta_label=excluded.secondary_cta_label,secondary_cta_href=excluded.secondary_cta_href,desktop_asset_url=excluded.desktop_asset_url,tablet_asset_url=excluded.tablet_asset_url,mobile_asset_url=excluded.mobile_asset_url,audience=excluded.audience,priority=excluded.priority,status='active',updated_at=now(); end $$;

insert into public.angelcare_marketplace_homepage_campaign_assets(campaign_id,asset_key,desktop_url,tablet_url,mobile_url,arabic_url,alt_text_fr,alt_text_en,alt_text_ar,focal_point,rights_status,status)
select c.id,c.campaign_key||'-'||c.locale,c.desktop_asset_url,c.tablet_asset_url,c.mobile_asset_url,case when c.locale='ar' then c.desktop_asset_url end,c.title,c.title,c.title,'{"x":50,"y":50}'::jsonb,'owned','active'
from public.angelcare_marketplace_homepage_campaigns c
on conflict(asset_key) do update set desktop_url=excluded.desktop_url,tablet_url=excluded.tablet_url,mobile_url=excluded.mobile_url,arabic_url=excluded.arabic_url,alt_text_fr=excluded.alt_text_fr,alt_text_en=excluded.alt_text_en,alt_text_ar=excluded.alt_text_ar,status='active',updated_at=now();

-- Sections and collections in all locales.
do $$ declare v_territory uuid; begin select id into v_territory from public.angelcare_marketplace_territories where territory_code='MA-MASTER';
insert into public.angelcare_marketplace_homepage_sections(section_key,locale,territory_id,section_type,title,subtitle,layout_variant,sort_order,status) values
('category-exchange','fr',v_territory,'category_exchange','Explorer toutes les catégories','Univers et inventaire gouvernés.','mosaic',10,'active'),
('category-exchange','en',v_territory,'category_exchange','Explore all categories','Governed universes and inventory.','mosaic',10,'active'),
('category-exchange','ar',v_territory,'category_exchange','استكشف جميع الفئات','عوالم ومخزون محكوم.','mosaic',10,'active'),
('featured','fr',v_territory,'collection_rail','À la une maintenant','Placements commerciaux audités.','rail',20,'active'),
('featured','en',v_territory,'collection_rail','Featured now','Audited commercial placements.','rail',20,'active'),
('featured','ar',v_territory,'collection_rail','مختارات مميزة','مواضع تجارية مدققة.','rail',20,'active'),
('family-showcase','fr',v_territory,'family_showcase','Boutique familles','Parcours guidé.','showcase',40,'active'),
('family-showcase','en',v_territory,'family_showcase','Family storefront','Guided journey.','showcase',40,'active'),
('family-showcase','ar',v_territory,'family_showcase','واجهة العائلات','مسار موجه.','showcase',40,'active'),
('academy-live','fr',v_territory,'academy_live','Academy en direct','Programmes et cohortes.','command',60,'active'),
('academy-live','en',v_territory,'academy_live','Academy live','Programs and cohorts.','command',60,'active'),
('academy-live','ar',v_territory,'academy_live','الأكاديمية الآن','برامج ودورات.','command',60,'active'),
('territory-atlas','fr',v_territory,'territory_atlas','Atlas opérationnel','Couverture publiée par Territory OS.','atlas',100,'active'),
('territory-atlas','en',v_territory,'territory_atlas','Operational atlas','Coverage published by Territory OS.','atlas',100,'active'),
('territory-atlas','ar',v_territory,'territory_atlas','الأطلس التشغيلي','تغطية منشورة من نظام الأقاليم.','atlas',100,'active')
on conflict(section_key,locale,territory_id) do update set title=excluded.title,subtitle=excluded.subtitle,layout_variant=excluded.layout_variant,sort_order=excluded.sort_order,status='active',updated_at=now();

insert into public.angelcare_marketplace_homepage_collections(collection_key,locale,territory_id,title,subtitle,selection_method,layout_variant,sort_order,status) values
('top-picks-fr','fr',v_territory,'Les choix ANGELCARE','Sélection éditoriale gouvernée.','editorial','service_cards',10,'active'),
('top-picks-en','en',v_territory,'ANGELCARE picks','Governed editorial selection.','editorial','service_cards',10,'active'),
('top-picks-ar','ar',v_territory,'اختيارات أنجل كير','اختيار تحريري محكوم.','editorial','service_cards',10,'active'),
('territory-fr','fr',v_territory,'Recommandé pour votre territoire','Objets publiés pour MA-MASTER.','territory','service_cards',20,'active'),
('territory-en','en',v_territory,'Recommended for your territory','Published objects for MA-MASTER.','territory','service_cards',20,'active'),
('territory-ar','ar',v_territory,'موصى به لنطاقك','عروض منشورة لنطاق MA-MASTER.','territory','service_cards',20,'active')
on conflict(collection_key,locale,territory_id) do update set title=excluded.title,subtitle=excluded.subtitle,selection_method=excluded.selection_method,layout_variant=excluded.layout_variant,status='active',updated_at=now(); end $$;

with desired(collection_key,item_key,sort_order) as (values
('top-picks-fr','family-home-care',10),('top-picks-fr','montessori-sensory-path',20),('top-picks-fr','autonomy-discovery-kit',30),('top-picks-fr','academy-safeguarding-core',40),('top-picks-fr','quality-check-360',50),('top-picks-fr','partner-os-pilot',60),
('top-picks-en','family-home-care',10),('top-picks-en','montessori-sensory-path',20),('top-picks-en','autonomy-discovery-kit',30),('top-picks-en','academy-safeguarding-core',40),('top-picks-en','quality-check-360',50),('top-picks-en','partner-os-pilot',60),
('top-picks-ar','family-home-care',10),('top-picks-ar','montessori-sensory-path',20),('top-picks-ar','autonomy-discovery-kit',30),('top-picks-ar','academy-safeguarding-core',40),('top-picks-ar','quality-check-360',50),('top-picks-ar','partner-os-pilot',60),
('territory-fr','school-transformation-diagnostic',10),('territory-fr','hospitality-kids-club-program',20),('territory-fr','corporate-family-benefits',30),('territory-fr','mother-baby-non-medical-support',40),
('territory-en','school-transformation-diagnostic',10),('territory-en','hospitality-kids-club-program',20),('territory-en','corporate-family-benefits',30),('territory-en','mother-baby-non-medical-support',40),
('territory-ar','school-transformation-diagnostic',10),('territory-ar','hospitality-kids-club-program',20),('territory-ar','corporate-family-benefits',30),('territory-ar','mother-baby-non-medical-support',40)
)
insert into public.angelcare_marketplace_homepage_collection_items(collection_id,catalog_item_id,sort_order,merchandising_reason,status)
select c.id,i.id,d.sort_order,'Approved initial Homepage Flagship merchandising','active' from desired d join public.angelcare_marketplace_homepage_collections c on c.collection_key=d.collection_key join public.angelcare_marketplace_catalog_items i on i.item_key=d.item_key
on conflict(collection_id,catalog_item_id) do update set sort_order=excluded.sort_order,merchandising_reason=excluded.merchandising_reason,status='active',updated_at=now();

-- Partner OS public plan merchandising without invented price.
insert into public.angelcare_marketplace_partner_plans(plan_key,name_fr,name_en,name_ar,description_fr,description_en,description_ar,billing_period,base_price,currency_label,status,sort_order) values
('partner-essential','Essentiel','Essential','الأساسي','Fondation tenant, utilisateurs, modules prioritaires et onboarding.','Tenant foundation, users, priority modules and onboarding.','أساس المستأجر والمستخدمون والوحدات ذات الأولوية والتهيئة.','custom',null,'Dh','published',10),
('partner-command','Command','Command','القيادة','Pilotage multi-site, analytics, qualité, opérations et Academy.','Multi-site control, analytics, quality, operations and Academy.','قيادة متعددة المواقع وتحليلات وجودة وعمليات وأكاديمية.','custom',null,'Dh','published',20),
('partner-network','Réseau','Network','الشبكة','Gouvernance réseau, territoires, usage avancé et expansion.','Network governance, territories, advanced usage and expansion.','حوكمة الشبكة والأقاليم والاستخدام المتقدم والتوسع.','custom',null,'Dh','published',30)
on conflict(plan_key) do update set name_fr=excluded.name_fr,name_en=excluded.name_en,name_ar=excluded.name_ar,description_fr=excluded.description_fr,description_en=excluded.description_en,description_ar=excluded.description_ar,status='published',sort_order=excluded.sort_order,updated_at=now();
with desired(plan_key,module_key,sort_order) as (values
('partner-essential','family_core',10),('partner-essential','attendance',20),('partner-essential','communication',30),
('partner-command','family_core',10),('partner-command','operations',20),('partner-command','academy',30),('partner-command','quality_360',40),('partner-command','analytics',50),
('partner-network','multi_site',10),('partner-network','territory_os',20),('partner-network','finance',30),('partner-network','security',40),('partner-network','executive_analytics',50)
)
insert into public.angelcare_marketplace_partner_plan_modules(plan_id,module_key,included,sort_order)
select p.id,d.module_key,true,d.sort_order from desired d join public.angelcare_marketplace_partner_plans p on p.plan_key=d.plan_key
on conflict(plan_id,module_key) do update set included=true,sort_order=excluded.sort_order;

-- Homepage-specific permission catalogue; execution reuses existing CMS manage permission for compatibility.
insert into public.angelcare_marketplace_permissions(permission_key,name,category,sensitive) values
('marketplace.homepage.view','Voir Homepage Flagship','Expérience',false),
('marketplace.homepage.manage','Gérer Homepage Flagship','Expérience',true),
('marketplace.homepage.publish','Publier Homepage Flagship','Publication',true),
('marketplace.homepage.analytics','Voir analytics Homepage','Analytics',false)
on conflict(permission_key) do update set name=excluded.name,category=excluded.category,sensitive=excluded.sensitive;

-- Security posture.
alter table public.angelcare_marketplace_catalog_categories enable row level security;
alter table public.angelcare_marketplace_catalog_item_categories enable row level security;
alter table public.angelcare_marketplace_catalog_item_media enable row level security;
alter table public.angelcare_marketplace_homepage_versions enable row level security;
alter table public.angelcare_marketplace_homepage_campaigns enable row level security;
alter table public.angelcare_marketplace_homepage_campaign_assets enable row level security;
alter table public.angelcare_marketplace_homepage_sections enable row level security;
alter table public.angelcare_marketplace_homepage_collections enable row level security;
alter table public.angelcare_marketplace_homepage_collection_items enable row level security;
alter table public.angelcare_marketplace_homepage_placements enable row level security;
alter table public.angelcare_marketplace_homepage_audience_rules enable row level security;
alter table public.angelcare_marketplace_homepage_territory_rules enable row level security;
alter table public.angelcare_marketplace_homepage_interactions enable row level security;
alter table public.angelcare_marketplace_homepage_visitor_selections enable row level security;
revoke all on table public.angelcare_marketplace_catalog_categories,public.angelcare_marketplace_catalog_item_categories,public.angelcare_marketplace_catalog_item_media,public.angelcare_marketplace_homepage_versions,public.angelcare_marketplace_homepage_campaigns,public.angelcare_marketplace_homepage_campaign_assets,public.angelcare_marketplace_homepage_sections,public.angelcare_marketplace_homepage_collections,public.angelcare_marketplace_homepage_collection_items,public.angelcare_marketplace_homepage_placements,public.angelcare_marketplace_homepage_audience_rules,public.angelcare_marketplace_homepage_territory_rules,public.angelcare_marketplace_homepage_interactions,public.angelcare_marketplace_homepage_visitor_selections from anon,authenticated;
grant all on table public.angelcare_marketplace_catalog_categories,public.angelcare_marketplace_catalog_item_categories,public.angelcare_marketplace_catalog_item_media,public.angelcare_marketplace_homepage_versions,public.angelcare_marketplace_homepage_campaigns,public.angelcare_marketplace_homepage_campaign_assets,public.angelcare_marketplace_homepage_sections,public.angelcare_marketplace_homepage_collections,public.angelcare_marketplace_homepage_collection_items,public.angelcare_marketplace_homepage_placements,public.angelcare_marketplace_homepage_audience_rules,public.angelcare_marketplace_homepage_territory_rules,public.angelcare_marketplace_homepage_interactions,public.angelcare_marketplace_homepage_visitor_selections to service_role;
create index if not exists ac_home_campaign_public_idx on public.angelcare_marketplace_homepage_campaigns(locale,territory_id,status,priority,starts_at,ends_at);
create index if not exists ac_home_collection_public_idx on public.angelcare_marketplace_homepage_collections(locale,territory_id,status,sort_order);
create index if not exists ac_home_interactions_event_idx on public.angelcare_marketplace_homepage_interactions(event_name,created_at desc);
create index if not exists ac_home_selection_visitor_idx on public.angelcare_marketplace_homepage_visitor_selections(visitor_reference,selection_type,active);

commit;

select 'homepage_campaigns' as register,count(*) as records from public.angelcare_marketplace_homepage_campaigns
union all select 'homepage_sections',count(*) from public.angelcare_marketplace_homepage_sections
union all select 'homepage_collections',count(*) from public.angelcare_marketplace_homepage_collections
union all select 'catalog_categories',count(*) from public.angelcare_marketplace_catalog_categories
union all select 'catalog_items',count(*) from public.angelcare_marketplace_catalog_items where commercial_metadata->>'merchandising_source'='homepage_flagship_initial_catalog';
