begin;

-- -------------------------------------------------------------------
-- Published CMS pages required by public navigation.
-- -------------------------------------------------------------------

insert into public.angelcare_marketplace_cms_pages(
  route_key,
  locale,
  territory_id,
  title,
  navigation_label,
  slug,
  description,
  status,
  translation_status,
  sensitive,
  seo_title,
  seo_description,
  canonical_url,
  published_at,
  published_version
)
values
(
  'public.home',
  'en',
  null,
  'ANGELCARE · A trusted universe for children and families',
  'Home',
  'accueil',
  'Structured family journeys, visible evidence and governed coordination.',
  'published',
  'approved',
  false,
  'ANGELCARE · Kids, Family & Partner Universe',
  'Discover ANGELCARE services for families and organizations.',
  '/angelcare-marketplace/en',
  now(),
  1
),
(
  'public.home',
  'ar',
  null,
  'أنجل كير · منظومة موثوقة للأطفال والعائلات',
  'الرئيسية',
  'accueil',
  'مسارات منظمة للعائلات، وأدلة واضحة، وتنسيق محكوم.',
  'published',
  'approved',
  false,
  'أنجل كير · منظومة الأطفال والعائلات والشركاء',
  'اكتشف منظومة أنجل كير للعائلات والمؤسسات.',
  '/angelcare-marketplace/ar',
  now(),
  1
),
(
  'public.families',
  'fr',
  null,
  'Un accompagnement familial clair, rassurant et suivi',
  'Familles',
  'familles',
  'Comprendre le besoin, demander une qualification, suivre les missions et recevoir des rapports validés.',
  'published',
  'source',
  true,
  'ANGELCARE pour les familles',
  'Un parcours familial gouverné, du besoin initial au suivi de mission.',
  '/angelcare-marketplace/fr/familles',
  now(),
  1
),
(
  'public.families',
  'en',
  null,
  'Clear, reassuring and accountable family support',
  'Families',
  'families',
  'Describe the need, request qualification, follow missions and receive validated reports.',
  'published',
  'approved',
  true,
  'ANGELCARE for families',
  'A governed family journey from the initial request to mission follow-up.',
  '/angelcare-marketplace/en/families',
  now(),
  1
),
(
  'public.families',
  'ar',
  null,
  'دعم عائلي واضح ومطمئن وقابل للمتابعة',
  'العائلات',
  'families',
  'تحديد الحاجة وطلب التأهيل ومتابعة المهام واستلام التقارير المعتمدة.',
  'published',
  'approved',
  true,
  'أنجل كير للعائلات',
  'مسار عائلي محكوم من الطلب الأول إلى متابعة المهمة.',
  '/angelcare-marketplace/ar/families',
  now(),
  1
),
(
  'public.contact',
  'fr',
  null,
  'Parler à ANGELCARE',
  'Contact',
  'contact',
  'Présentez votre situation afin que la bonne équipe puisse la qualifier.',
  'published',
  'source',
  false,
  'Contacter ANGELCARE',
  'Contactez ANGELCARE pour une demande famille, établissement ou partenariat.',
  '/angelcare-marketplace/fr/contact',
  now(),
  1
),
(
  'public.contact',
  'en',
  null,
  'Talk to ANGELCARE',
  'Contact',
  'contact',
  'Describe your situation so the appropriate team can qualify it.',
  'published',
  'approved',
  false,
  'Contact ANGELCARE',
  'Contact ANGELCARE regarding a family, organization or partnership request.',
  '/angelcare-marketplace/en/contact',
  now(),
  1
),
(
  'public.contact',
  'ar',
  null,
  'تواصل مع أنجل كير',
  'اتصل بنا',
  'contact',
  'اشرح وضعك حتى يتم توجيه الطلب إلى الفريق المختص.',
  'published',
  'approved',
  false,
  'التواصل مع أنجل كير',
  'تواصل مع أنجل كير بخصوص العائلات أو المؤسسات أو الشراكات.',
  '/angelcare-marketplace/ar/contact',
  now(),
  1
)
on conflict (locale, slug, territory_id)
do update set
  route_key = excluded.route_key,
  title = excluded.title,
  navigation_label = excluded.navigation_label,
  description = excluded.description,
  status = 'published',
  translation_status = excluded.translation_status,
  sensitive = excluded.sensitive,
  seo_title = excluded.seo_title,
  seo_description = excluded.seo_description,
  canonical_url = excluded.canonical_url,
  published_at = coalesce(
    public.angelcare_marketplace_cms_pages.published_at,
    excluded.published_at
  ),
  published_version = coalesce(
    public.angelcare_marketplace_cms_pages.published_version,
    1
  ),
  updated_at = now();

-- -------------------------------------------------------------------
-- EN and AR home heroes.
-- -------------------------------------------------------------------

insert into public.angelcare_marketplace_cms_blocks(
  page_id,
  block_key,
  block_type,
  sort_order,
  status,
  content,
  settings,
  audience,
  locale
)
select
  p.id,
  'home-hero',
  'hero',
  0,
  'active',
  case p.locale
    when 'en' then jsonb_build_object(
      'eyebrow', 'ANGELCARE BUILD 360',
      'title', 'A trusted universe for children, families and their partners.',
      'lead', 'Structured journeys, visible evidence and governed ANGELCARE coordination.',
      'primaryCtaKey', 'family_start',
      'primaryCtaLabel', 'Start as a family',
      'secondaryCtaKey', 'contact',
      'secondaryCtaLabel', 'Talk to ANGELCARE'
    )
    else jsonb_build_object(
      'eyebrow', 'ANGELCARE BUILD 360',
      'title', 'منظومة موثوقة للأطفال والعائلات وشركائهم.',
      'lead', 'مسارات منظمة وأدلة واضحة وتنسيق محكوم من أنجل كير.',
      'primaryCtaKey', 'family_start',
      'primaryCtaLabel', 'ابدأ كعائلة',
      'secondaryCtaKey', 'contact',
      'secondaryCtaLabel', 'تواصل مع أنجل كير'
    )
  end,
  '{}'::jsonb,
  array['public']::text[],
  p.locale
from public.angelcare_marketplace_cms_pages p
where p.route_key = 'public.home'
  and p.locale in ('en', 'ar')
  and p.territory_id is null
on conflict (page_id, block_key)
do update set
  content = excluded.content,
  status = 'active',
  locale = excluded.locale,
  updated_at = now();

-- -------------------------------------------------------------------
-- Complete family public experience.
-- -------------------------------------------------------------------

insert into public.angelcare_marketplace_cms_blocks(
  page_id,
  block_key,
  block_type,
  sort_order,
  status,
  content,
  settings,
  audience,
  locale
)
select
  p.id,
  'family-hero',
  'hero',
  0,
  'active',
  case p.locale
    when 'fr' then jsonb_build_object(
      'eyebrow', 'PARCOURS FAMILLE ANGELCARE',
      'title', 'Un besoin familial devient un parcours clair et gouverné.',
      'lead', 'Qualification, coordination, mission, preuve et rapport sont réunis dans un même parcours.',
      'primaryCtaKey', 'family_request',
      'primaryCtaLabel', 'Présenter mon besoin',
      'secondaryCtaKey', 'contact',
      'secondaryCtaLabel', 'Parler à une coordinatrice'
    )
    when 'en' then jsonb_build_object(
      'eyebrow', 'ANGELCARE FAMILY JOURNEY',
      'title', 'Turn a family need into a clear, governed journey.',
      'lead', 'Qualification, coordination, mission evidence and validated reporting remain connected.',
      'primaryCtaKey', 'family_request',
      'primaryCtaLabel', 'Describe my need',
      'secondaryCtaKey', 'contact',
      'secondaryCtaLabel', 'Talk to a coordinator'
    )
    else jsonb_build_object(
      'eyebrow', 'مسار العائلة مع أنجل كير',
      'title', 'تتحول حاجة العائلة إلى مسار واضح ومحكوم.',
      'lead', 'التأهيل والتنسيق والمهمة والأدلة والتقرير المعتمد ضمن مسار واحد.',
      'primaryCtaKey', 'family_request',
      'primaryCtaLabel', 'اشرح حاجتي',
      'secondaryCtaKey', 'contact',
      'secondaryCtaLabel', 'تحدث مع منسقة'
    )
  end,
  '{}'::jsonb,
  array['public', 'family']::text[],
  p.locale
from public.angelcare_marketplace_cms_pages p
where p.route_key = 'public.families'
  and p.territory_id is null
on conflict (page_id, block_key)
do update set
  content = excluded.content,
  status = 'active',
  locale = excluded.locale,
  updated_at = now();

insert into public.angelcare_marketplace_cms_blocks(
  page_id,
  block_key,
  block_type,
  sort_order,
  status,
  content,
  settings,
  audience,
  locale
)
select
  p.id,
  'family-services',
  'service_grid',
  20,
  'active',
  case p.locale
    when 'fr' then jsonb_build_object(
      'title', 'Un accompagnement relié de bout en bout',
      'lead', 'Chaque étape conserve son propriétaire, son statut et sa prochaine action.',
      'items', jsonb_build_array(
        jsonb_build_object(
          'label', '01',
          'title', 'Qualification du besoin',
          'description', 'Contexte, enfant, horaires, contraintes, attentes et niveau d’urgence.'
        ),
        jsonb_build_object(
          'label', '02',
          'title', 'Préparation gouvernée',
          'description', 'Éligibilité, intervenant, brief, checklist et preuves attendues.'
        ),
        jsonb_build_object(
          'label', '03',
          'title', 'Suivi et rapport',
          'description', 'Mission, événements, corrections et rapport validé.'
        )
      )
    )
    when 'en' then jsonb_build_object(
      'title', 'Connected support from start to finish',
      'lead', 'Every stage retains an owner, status and next action.',
      'items', jsonb_build_array(
        jsonb_build_object(
          'label', '01',
          'title', 'Need qualification',
          'description', 'Context, child, schedule, constraints, expectations and urgency.'
        ),
        jsonb_build_object(
          'label', '02',
          'title', 'Governed preparation',
          'description', 'Eligibility, provider, brief, checklist and expected evidence.'
        ),
        jsonb_build_object(
          'label', '03',
          'title', 'Follow-up and reporting',
          'description', 'Mission events, corrections and validated reporting.'
        )
      )
    )
    else jsonb_build_object(
      'title', 'دعم مترابط من البداية إلى النهاية',
      'lead', 'لكل مرحلة مسؤول وحالة وإجراء تالٍ واضح.',
      'items', jsonb_build_array(
        jsonb_build_object(
          'label', '01',
          'title', 'تأهيل الحاجة',
          'description', 'السياق والطفل والجدول والقيود والتوقعات ودرجة الاستعجال.'
        ),
        jsonb_build_object(
          'label', '02',
          'title', 'تحضير محكوم',
          'description', 'الأهلية والمتدخل والملخص وقائمة التحقق والأدلة المطلوبة.'
        ),
        jsonb_build_object(
          'label', '03',
          'title', 'المتابعة والتقرير',
          'description', 'المهمة والأحداث والتصحيحات والتقرير المعتمد.'
        )
      )
    )
  end,
  '{}'::jsonb,
  array['public', 'family']::text[],
  p.locale
from public.angelcare_marketplace_cms_pages p
where p.route_key = 'public.families'
  and p.territory_id is null
on conflict (page_id, block_key)
do update set
  content = excluded.content,
  status = 'active',
  locale = excluded.locale,
  updated_at = now();

insert into public.angelcare_marketplace_cms_blocks(
  page_id,
  block_key,
  block_type,
  sort_order,
  status,
  content,
  settings,
  audience,
  locale
)
select
  p.id,
  'family-timeline',
  'timeline',
  30,
  'active',
  case p.locale
    when 'fr' then jsonb_build_object(
      'title', 'Votre parcours',
      'steps', jsonb_build_array(
        jsonb_build_object(
          'title', 'Présenter la situation',
          'description', 'Votre demande est enregistrée et orientée.'
        ),
        jsonb_build_object(
          'title', 'Qualifier et préparer',
          'description', 'Une coordinatrice confirme le périmètre et les prochaines étapes.'
        ),
        jsonb_build_object(
          'title', 'Suivre l’exécution',
          'description', 'Vous accédez aux missions et aux rapports autorisés.'
        )
      )
    )
    when 'en' then jsonb_build_object(
      'title', 'Your journey',
      'steps', jsonb_build_array(
        jsonb_build_object(
          'title', 'Describe the situation',
          'description', 'Your request is recorded and routed.'
        ),
        jsonb_build_object(
          'title', 'Qualify and prepare',
          'description', 'A coordinator confirms scope and next steps.'
        ),
        jsonb_build_object(
          'title', 'Follow execution',
          'description', 'Access authorized missions and validated reports.'
        )
      )
    )
    else jsonb_build_object(
      'title', 'مسارك',
      'steps', jsonb_build_array(
        jsonb_build_object(
          'title', 'اشرح الوضع',
          'description', 'يتم تسجيل الطلب وتوجيهه.'
        ),
        jsonb_build_object(
          'title', 'التأهيل والتحضير',
          'description', 'تؤكد المنسقة النطاق والخطوات التالية.'
        ),
        jsonb_build_object(
          'title', 'متابعة التنفيذ',
          'description', 'الوصول إلى المهام والتقارير المصرح بها.'
        )
      )
    )
  end,
  '{}'::jsonb,
  array['public', 'family']::text[],
  p.locale
from public.angelcare_marketplace_cms_pages p
where p.route_key = 'public.families'
  and p.territory_id is null
on conflict (page_id, block_key)
do update set
  content = excluded.content,
  status = 'active',
  locale = excluded.locale,
  updated_at = now();

insert into public.angelcare_marketplace_cms_blocks(
  page_id,
  block_key,
  block_type,
  sort_order,
  status,
  content,
  settings,
  audience,
  locale
)
select
  p.id,
  'family-inquiry',
  'inquiry_form',
  80,
  'active',
  case p.locale
    when 'fr' then jsonb_build_object(
      'title', 'Présentez votre besoin familial',
      'lead', 'Votre demande sera enregistrée et qualifiée par la bonne équipe.',
      'audience', 'family'
    )
    when 'en' then jsonb_build_object(
      'title', 'Describe your family need',
      'lead', 'Your request will be recorded and qualified by the appropriate team.',
      'audience', 'family'
    )
    else jsonb_build_object(
      'title', 'اشرح حاجة عائلتك',
      'lead', 'سيتم تسجيل طلبك وتأهيله من طرف الفريق المختص.',
      'audience', 'family'
    )
  end,
  '{}'::jsonb,
  array['public', 'family']::text[],
  p.locale
from public.angelcare_marketplace_cms_pages p
where p.route_key = 'public.families'
  and p.territory_id is null
on conflict (page_id, block_key)
do update set
  content = excluded.content,
  status = 'active',
  locale = excluded.locale,
  updated_at = now();

-- -------------------------------------------------------------------
-- Contact pages.
-- -------------------------------------------------------------------

insert into public.angelcare_marketplace_cms_blocks(
  page_id,
  block_key,
  block_type,
  sort_order,
  status,
  content,
  settings,
  audience,
  locale
)
select
  p.id,
  'contact-hero',
  'hero',
  0,
  'active',
  case p.locale
    when 'fr' then jsonb_build_object(
      'eyebrow', 'CONTACT ANGELCARE',
      'title', 'La bonne conversation commence par un besoin clairement enregistré.',
      'lead', 'Famille, établissement, entreprise ou partenaire : votre demande sera orientée avec un propriétaire et une prochaine action.',
      'primaryCtaKey', 'contact',
      'primaryCtaLabel', 'Décrire ma demande'
    )
    when 'en' then jsonb_build_object(
      'eyebrow', 'CONTACT ANGELCARE',
      'title', 'The right conversation starts with a clearly recorded need.',
      'lead', 'Family, organization, company or partner: your request will be routed with an owner and next action.',
      'primaryCtaKey', 'contact',
      'primaryCtaLabel', 'Describe my request'
    )
    else jsonb_build_object(
      'eyebrow', 'التواصل مع أنجل كير',
      'title', 'تبدأ المحادثة الصحيحة بطلب مسجل بوضوح.',
      'lead', 'عائلة أو مؤسسة أو شركة أو شريك: يتم توجيه الطلب مع تحديد المسؤول والخطوة التالية.',
      'primaryCtaKey', 'contact',
      'primaryCtaLabel', 'اشرح طلبي'
    )
  end,
  '{}'::jsonb,
  array['public']::text[],
  p.locale
from public.angelcare_marketplace_cms_pages p
where p.route_key = 'public.contact'
  and p.territory_id is null
on conflict (page_id, block_key)
do update set
  content = excluded.content,
  status = 'active',
  locale = excluded.locale,
  updated_at = now();

insert into public.angelcare_marketplace_cms_blocks(
  page_id,
  block_key,
  block_type,
  sort_order,
  status,
  content,
  settings,
  audience,
  locale
)
select
  p.id,
  'contact-inquiry',
  'inquiry_form',
  20,
  'active',
  case p.locale
    when 'fr' then jsonb_build_object(
      'title', 'Parlons de votre situation',
      'lead', 'Une coordinatrice orientera votre demande.',
      'audience', 'other'
    )
    when 'en' then jsonb_build_object(
      'title', 'Tell us about your situation',
      'lead', 'A coordinator will route your request.',
      'audience', 'other'
    )
    else jsonb_build_object(
      'title', 'حدثنا عن وضعك',
      'lead', 'ستقوم منسقة بتوجيه طلبك.',
      'audience', 'other'
    )
  end,
  '{}'::jsonb,
  array['public']::text[],
  p.locale
from public.angelcare_marketplace_cms_pages p
where p.route_key = 'public.contact'
  and p.territory_id is null
on conflict (page_id, block_key)
do update set
  content = excluded.content,
  status = 'active',
  locale = excluded.locale,
  updated_at = now();

-- -------------------------------------------------------------------
-- Canonical public menus.
-- -------------------------------------------------------------------

insert into public.angelcare_marketplace_cms_menus(
  menu_key,
  name,
  locale,
  status
)
values
  ('public-main-fr', 'Navigation publique FR', 'fr', 'published'),
  ('public-main-en', 'Public navigation EN', 'en', 'published'),
  ('public-main-ar', 'التنقل العام', 'ar', 'published')
on conflict (menu_key)
do update set
  name = excluded.name,
  locale = excluded.locale,
  status = 'published',
  updated_at = now();

update public.angelcare_marketplace_cms_menu_items
set href = '/angelcare-marketplace/fr/establishments'
where href = '/angelcare-marketplace/fr/etablissements';

update public.angelcare_marketplace_cms_menu_items
set href = '/angelcare-marketplace/fr/corporates'
where href = '/angelcare-marketplace/fr/entreprises';

update public.angelcare_marketplace_cms_menu_items
set href = '/angelcare-marketplace/fr/trust'
where href = '/angelcare-marketplace/fr/confiance';

with desired(menu_key, label, href, sort_order) as (
  values
    ('public-main-fr', 'Accueil', '/angelcare-marketplace/fr', 0),
    ('public-main-fr', 'Familles', '/angelcare-marketplace/fr/familles', 10),
    ('public-main-fr', 'Établissements', '/angelcare-marketplace/fr/establishments', 20),
    ('public-main-fr', 'Marketplace', '/angelcare-marketplace/fr/marketplace', 30),
    ('public-main-fr', 'Partner OS', '/angelcare-marketplace/fr/partner-os', 40),
    ('public-main-fr', 'Academy', '/angelcare-marketplace/fr/academy', 50),
    ('public-main-fr', 'Confiance', '/angelcare-marketplace/fr/trust', 60),

    ('public-main-en', 'Home', '/angelcare-marketplace/en', 0),
    ('public-main-en', 'Families', '/angelcare-marketplace/en/families', 10),
    ('public-main-en', 'Organizations', '/angelcare-marketplace/en/establishments', 20),
    ('public-main-en', 'Marketplace', '/angelcare-marketplace/en/marketplace', 30),
    ('public-main-en', 'Partner OS', '/angelcare-marketplace/en/partner-os', 40),
    ('public-main-en', 'Academy', '/angelcare-marketplace/en/academy', 50),
    ('public-main-en', 'Trust', '/angelcare-marketplace/en/trust', 60),

    ('public-main-ar', 'الرئيسية', '/angelcare-marketplace/ar', 0),
    ('public-main-ar', 'العائلات', '/angelcare-marketplace/ar/families', 10),
    ('public-main-ar', 'المؤسسات', '/angelcare-marketplace/ar/establishments', 20),
    ('public-main-ar', 'السوق', '/angelcare-marketplace/ar/marketplace', 30),
    ('public-main-ar', 'نظام الشركاء', '/angelcare-marketplace/ar/partner-os', 40),
    ('public-main-ar', 'الأكاديمية', '/angelcare-marketplace/ar/academy', 50),
    ('public-main-ar', 'الثقة', '/angelcare-marketplace/ar/trust', 60)
)
insert into public.angelcare_marketplace_cms_menu_items(
  menu_id,
  label,
  href,
  sort_order,
  visibility,
  status
)
select
  m.id,
  d.label,
  d.href,
  d.sort_order,
  'public',
  'active'
from desired d
join public.angelcare_marketplace_cms_menus m
  on m.menu_key = d.menu_key
where not exists (
  select 1
  from public.angelcare_marketplace_cms_menu_items i
  where i.menu_id = m.id
    and i.href = d.href
);

-- -------------------------------------------------------------------
-- Persistent route-registry evidence for legacy URLs.
-- -------------------------------------------------------------------

insert into public.angelcare_marketplace_cms_redirects(
  source_path,
  target_path,
  territory_id,
  status
)
values
  (
    '/angelcare-marketplace/fr/etablissements',
    '/angelcare-marketplace/fr/establishments',
    null,
    'active'
  ),
  (
    '/angelcare-marketplace/fr/entreprises',
    '/angelcare-marketplace/fr/corporates',
    null,
    'active'
  ),
  (
    '/angelcare-marketplace/fr/confiance',
    '/angelcare-marketplace/fr/trust',
    null,
    'active'
  ),
  (
    '/angelcare-marketplace/fr/hotels',
    '/angelcare-marketplace/fr/hospitality',
    null,
    'active'
  ),
  (
    '/angelcare-marketplace/fr/cliniques',
    '/angelcare-marketplace/fr/health-partners',
    null,
    'active'
  ),
  (
    '/angelcare-marketplace/fr/cliniques-maternite',
    '/angelcare-marketplace/fr/health-partners',
    null,
    'active'
  )
on conflict (source_path, territory_id)
do update set
  target_path = excluded.target_path,
  status = 'active';

commit;

select
  locale,
  slug,
  status,
  canonical_url
from public.angelcare_marketplace_cms_pages
where route_key in (
  'public.home',
  'public.families',
  'public.contact'
)
order by route_key, locale;
