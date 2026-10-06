'use client'

import Link from 'next/link'
import { useMemo, useState, type ReactNode } from 'react'
import {
  ArrowRight,
  BadgeCheck,
  BookOpenCheck,
  Building2,
  CalendarDays,
  Check,
  ChevronRight,
  ClipboardCheck,
  GraduationCap,
  Heart,
  Hotel,
  MapPin,
  PackageOpen,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  UsersRound,
} from 'lucide-react'
import { journeyForItem, journeyLabel, journeyPath } from '@/angelcare-marketplace/conversion-universe/content'
import type {
  HomepageCampaign,
  HomepageCategory,
  HomepageCollection,
  HomepageExperience,
  HomepageItem,
  HomepageLocale,
} from '@/angelcare-marketplace/homepage-flagship/types'
import { LIVING_MARKETPLACE_WORLD_ID } from '../world'
import styles from './living-marketplace.module.css'

const copy = {
  fr: {
    heroEyebrow: 'ANGELCARE · FAMILLE · ENFANCE · DÉVELOPPEMENT',
    heroTitle: 'Des enfants épanouis. Des parents sereins. Un univers pour avancer.',
    heroBody: 'Services, produits, développement, Academy et solutions professionnelles réunis dans une seule Marketplace AngelCare.',
    heroNote: 'Grandir ensemble, en toute confiance.',
    heroCommunity: "Plus qu'un service, un écosystème pour la famille.",
    heroCommunityBody: 'Des parcours utiles, des offres publiées et une équipe AngelCare quand vous avez besoin d’être guidé.',
    discover: 'Explorer la Marketplace',
    family: 'Trouver une solution famille',
    trustTitle: 'La Marketplace en direct',
    categories: 'Explorer les univers AngelCare',
    categoriesSub: 'Accédez immédiatement aux catégories réellement publiées.',
    now: 'À découvrir maintenant',
    flash: 'Sélections commerciales du moment',
    flashSub: 'Offres publiées et données commerciales réelles, sans prix ni urgence inventés.',
    services: 'Services disponibles',
    servicesSub: 'Des services publiés, qualifiables et reliés au parcours de réservation.',
    help: 'Besoin d’un coup de main ?',
    helpBody: 'Décrivez votre besoin ou lancez un diagnostic familial avant de réserver.',
    helpCta: 'Démarrer mon besoin',
    packs: 'Produits, kits & développement',
    packsSub: 'Des supports et produits publiés dans le catalogue AngelCare.',
    best: 'Nos sélections populaires',
    academy: 'Academy · Formations & cohortes',
    academySub: 'Parcours de formation reliés à l’inscription réelle.',
    academyCta: 'Voir toute l’Academy',
    academyBanner: 'Développez vos compétences pour un avenir plus serein.',
    academyBannerBody: 'Programmes publiés, formats visibles et inscription reliée au parcours Academy.',
    b2b: 'Solutions pour crèches, écoles, maternités, hôtels et entreprises',
    b2bSub: 'Entrez dans le bon parcours professionnel sans passer par une page générique.',
    quote: 'Demander un devis',
    guides: 'Guides & accompagnement',
    guidesSub: 'Des raccourcis utiles, visuels et directement reliés aux bons parcours.',
    humanHelp: 'Un accompagnement humain quand votre choix mérite d’être clarifié.',
    humanHelpBody: 'AngelCare vous aide à transformer un besoin familial en parcours concret, sans inventer une recommandation automatique.',
    collections: 'Collections & nouveautés',
    collectionsSub: 'Collections actives et dernières publications réellement identifiées comme nouveautés.',
    account: 'Votre espace AngelCare',
    accountBody: 'Retrouvez réservations, commandes, inscriptions, paiements et support.',
    accountCta: 'Ouvrir mon espace',
    support: 'Une équipe à votre écoute',
    supportBody: 'Expliquez votre besoin et entrez dans le parcours famille approprié.',
    supportCta: 'Être accompagné',
    commitments: 'Confiance & preuves',
    commitmentsSub: 'Seules les preuves publiques et actives de votre Marketplace sont affichées.',
    faq: 'Questions fréquentes',
    mission: 'Un écosystème AngelCare, pas une simple vitrine.',
    missionBody: 'La homepage relie directement la découverte aux parcours famille, commerce, Academy et professionnels.',
    all: 'Voir tout',
    available: 'Disponible',
    restricted: 'Selon territoire',
    unavailable: 'Indisponible',
    qualification: 'Qualification requise',
    quotePrice: 'Sur devis',
    from: 'À partir de',
    details: 'Voir le détail',
    saved: 'Ajouter aux favoris',
    unsaved: 'Retirer des favoris',
    published: 'univers publiés',
    offers: 'services publiés',
    academyCount: 'offres Academy',
    collectionsCount: 'collections actives',
  },
  en: {
    heroEyebrow: 'ANGELCARE · FAMILY · CHILDHOOD · DEVELOPMENT',
    heroTitle: 'Thriving children. Reassured parents. One universe to move forward.',
    heroBody: 'Services, products, development, Academy and professional solutions together in one AngelCare Marketplace.',
    heroNote: 'Growing together, with confidence.',
    heroCommunity: 'More than a service: a family ecosystem.',
    heroCommunityBody: 'Useful journeys, published offers and the AngelCare team when you need guidance.',
    discover: 'Explore the Marketplace',
    family: 'Find a family solution',
    trustTitle: 'Marketplace live',
    categories: 'Explore AngelCare universes',
    categoriesSub: 'Open the categories that are actually published.',
    now: 'Discover now',
    flash: 'Current commercial selections',
    flashSub: 'Published offers and real commercial data, with no invented pricing or urgency.',
    services: 'Available services',
    servicesSub: 'Published services connected to the real booking journey.',
    help: 'Need a hand?',
    helpBody: 'Describe your need or start a family diagnostic before booking.',
    helpCta: 'Start my request',
    packs: 'Products, kits & development',
    packsSub: 'Published learning and family products from the AngelCare catalogue.',
    best: 'Popular selections',
    academy: 'Academy · Training & cohorts',
    academySub: 'Training connected to real enrollment journeys.',
    academyCta: 'Open Academy',
    academyBanner: 'Build skills for a more confident future.',
    academyBannerBody: 'Published programs, visible delivery formats and connected Academy enrollment.',
    b2b: 'Solutions for childcare centers, schools, maternity partners, hotels and companies',
    b2bSub: 'Enter the right professional journey directly.',
    quote: 'Request a quote',
    guides: 'Guides & human guidance',
    guidesSub: 'Useful, visual shortcuts directly connected to the right journeys.',
    humanHelp: 'Human guidance when your choice deserves clarification.',
    humanHelpBody: 'AngelCare helps turn a family need into a concrete journey without inventing an automated recommendation.',
    collections: 'Collections & new arrivals',
    collectionsSub: 'Active collections and catalogue entries genuinely identified as new arrivals.',
    account: 'Your AngelCare space',
    accountBody: 'Bookings, orders, enrollments, payments and support in one place.',
    accountCta: 'Open my account',
    support: 'A team ready to help',
    supportBody: 'Describe your need and enter the appropriate family journey.',
    supportCta: 'Get guidance',
    commitments: 'Trust & evidence',
    commitmentsSub: 'Only active public evidence from the Marketplace is displayed.',
    faq: 'Frequently asked questions',
    mission: 'An AngelCare ecosystem, not a simple storefront.',
    missionBody: 'The homepage connects discovery directly to family, commerce, Academy and professional journeys.',
    all: 'View all',
    available: 'Available',
    restricted: 'By territory',
    unavailable: 'Unavailable',
    qualification: 'Qualification required',
    quotePrice: 'Request quote',
    from: 'From',
    details: 'View details',
    saved: 'Save',
    unsaved: 'Remove from saved',
    published: 'published universes',
    offers: 'published services',
    academyCount: 'Academy offers',
    collectionsCount: 'active collections',
  },
  ar: {
    heroEyebrow: 'ANGELCARE · الأسرة · الطفولة · التطور',
    heroTitle: 'أطفال مزدهرون. آباء مطمئنون. عالم واحد للتقدم.',
    heroBody: 'خدمات ومنتجات وتطوير وAcademy وحلول مهنية في Marketplace واحدة من AngelCare.',
    heroNote: 'نكبر معًا، بثقة.',
    heroCommunity: 'أكثر من خدمة: منظومة متكاملة للأسرة.',
    heroCommunityBody: 'مسارات مفيدة وعروض منشورة وفريق AngelCare عندما تحتاج إلى التوجيه.',
    discover: 'استكشف Marketplace',
    family: 'ابحث عن حل للأسرة',
    trustTitle: 'Marketplace مباشرة',
    categories: 'استكشف عوالم AngelCare',
    categoriesSub: 'الوصول مباشرة إلى الفئات المنشورة فعليًا.',
    now: 'اكتشف الآن',
    flash: 'اختيارات تجارية حالية',
    flashSub: 'عروض منشورة وبيانات تجارية حقيقية دون أسعار أو استعجال مخترع.',
    services: 'الخدمات المتاحة',
    servicesSub: 'خدمات منشورة مرتبطة بمسار الحجز الحقيقي.',
    help: 'هل تحتاج إلى مساعدة؟',
    helpBody: 'صف احتياجك أو ابدأ تشخيص الأسرة قبل الحجز.',
    helpCta: 'ابدأ طلبي',
    packs: 'المنتجات والمجموعات والتطوير',
    packsSub: 'منتجات ودعامات منشورة في كتالوج AngelCare.',
    best: 'اختيارات رائجة',
    academy: 'Academy · التكوين والمجموعات',
    academySub: 'تكوينات مرتبطة بمسار التسجيل الحقيقي.',
    academyCta: 'عرض Academy',
    academyBanner: 'طوّر مهاراتك لمستقبل أكثر طمأنينة.',
    academyBannerBody: 'برامج منشورة وصيغ واضحة وتسجيل مرتبط بمسار Academy.',
    b2b: 'حلول للحضانات والمدارس وشركاء الأمومة والفنادق والشركات',
    b2bSub: 'ادخل مباشرة إلى المسار المهني الصحيح.',
    quote: 'طلب عرض',
    guides: 'أدلة ومرافقة',
    guidesSub: 'اختصارات بصرية ومفيدة مرتبطة مباشرة بالمسارات الصحيحة.',
    humanHelp: 'مرافقة بشرية عندما يحتاج اختيارك إلى توضيح.',
    humanHelpBody: 'تساعدك AngelCare على تحويل احتياج الأسرة إلى مسار عملي دون اختراع توصية آلية.',
    collections: 'المجموعات والجديد',
    collectionsSub: 'مجموعات نشطة وإضافات تم تحديدها فعليًا كجديدة.',
    account: 'فضاؤك AngelCare',
    accountBody: 'الحجوزات والطلبات والتسجيلات والمدفوعات والدعم.',
    accountCta: 'فتح حسابي',
    support: 'فريق يستمع إليك',
    supportBody: 'صف احتياجك وادخل إلى مسار الأسرة المناسب.',
    supportCta: 'احصل على المرافقة',
    commitments: 'الثقة والأدلة',
    commitmentsSub: 'لا تظهر إلا الأدلة العامة والنشطة في Marketplace.',
    faq: 'الأسئلة الشائعة',
    mission: 'منظومة AngelCare، وليست مجرد واجهة.',
    missionBody: 'تربط الصفحة الرئيسية الاكتشاف مباشرة بمسارات الأسرة والتجارة وAcademy والمهنيين.',
    all: 'عرض الكل',
    available: 'متاح',
    restricted: 'حسب المنطقة',
    unavailable: 'غير متاح',
    qualification: 'يتطلب التأهيل',
    quotePrice: 'حسب الطلب',
    from: 'ابتداءً من',
    details: 'عرض التفاصيل',
    saved: 'إضافة للمفضلة',
    unsaved: 'إزالة من المفضلة',
    published: 'عوالم منشورة',
    offers: 'خدمات منشورة',
    academyCount: 'عروض Academy',
    collectionsCount: 'مجموعات نشطة',
  },
} as const

function uniqueItems(...groups: HomepageItem[][]): HomepageItem[] {
  const seen = new Set<string>()
  const result: HomepageItem[] = []
  for (const item of groups.flat()) {
    if (item?.id && !seen.has(item.id)) {
      seen.add(item.id)
      result.push(item)
    }
  }
  return result
}

function itemDetailHref(locale: HomepageLocale, item: HomepageItem) {
  return `/angelcare-marketplace/${locale}/marketplace/item/${item.slug}`
}

function categoryHref(locale: HomepageLocale, category: HomepageCategory) {
  return `/angelcare-marketplace/${locale}/marketplace/category/${category.slug}`
}

function campaignHref(campaign: HomepageCampaign | null | undefined, locale: HomepageLocale) {
  const raw = campaign?.primary_cta_href?.trim() || ''
  if (raw.startsWith('/') || raw.startsWith('https://') || raw.startsWith('http://')) return raw
  return `/angelcare-marketplace/${locale}/marketplace`
}

function collectionHref(collection: HomepageCollection, locale: HomepageLocale) {
  const first = collection.items[0]
  if (!first) return `/angelcare-marketplace/${locale}/marketplace`
  return `/angelcare-marketplace/${locale}/marketplace/${encodeURIComponent(first.slug)}?collection=${encodeURIComponent(collection.id)}`
}

function priceLabel(item: HomepageItem, locale: HomepageLocale) {
  const c = copy[locale]
  if (item.price_mode === 'quote_only' || item.price_amount === null) return c.quotePrice
  const value = new Intl.NumberFormat(locale === 'ar' ? 'ar-MA' : locale === 'en' ? 'en-MA' : 'fr-MA', { maximumFractionDigits: 2 }).format(item.price_amount)
  const prefix = item.price_mode === 'starting_from' ? `${c.from} ` : ''
  return `${prefix}${value} ${item.currency_label || 'MAD'}`
}

function availabilityLabel(item: HomepageItem, locale: HomepageLocale) {
  const c = copy[locale]
  if (item.availability_status === 'available') return c.available
  if (item.availability_status === 'out_of_stock') return c.unavailable
  if (item.availability_status === 'territory_restricted') return c.restricted
  return c.qualification
}

function firstMedia(items: HomepageItem[]) {
  return items.find((item) => Boolean(item.media_url))?.media_url || null
}

function track(payload: Record<string, unknown>) {
  void fetch('/api/angelcare-marketplace/homepage/engagement', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  }).catch(() => undefined)
}

function SectionHead({ eyebrow, title, body, href, locale }: { eyebrow: string; title: string; body?: string; href?: string; locale: HomepageLocale }) {
  return (
    <header className={styles.sectionHead}>
      <div>
        <span>{eyebrow}</span>
        <h2>{title}</h2>
        {body ? <p>{body}</p> : null}
      </div>
      {href ? <Link href={href}>{copy[locale].all}<ArrowRight size={15}/></Link> : null}
    </header>
  )
}

function ItemCard({ item, locale, saved, onSave, signal }: { item: HomepageItem; locale: HomepageLocale; saved: boolean; onSave: (item: HomepageItem) => void; signal?: string | null }) {
  const detail = itemDetailHref(locale, item)
  const journey = journeyForItem(item)
  const action = journeyPath(locale, item)
  return (
    <article className={styles.itemCard} data-kind={item.kind}>
      <Link className={styles.itemMedia} href={detail} onClick={() => track({ event_name: 'living_home.item_opened', locale, catalog_item_id: item.id, route: detail })}>
        {item.media_url ? <img src={item.media_url} alt={item.name} loading="lazy"/> : <div className={styles.mediaFallback}><Sparkles/><span>ANGELCARE</span></div>}
        <span className={styles.kindPill}>{item.category_title || item.kind.replaceAll('_', ' ')}</span>
        {signal ? <span className={styles.signalPill}>{signal}</span> : null}
      </Link>
      <button type="button" className={styles.saveButton} data-active={saved || undefined} aria-label={saved ? copy[locale].unsaved : copy[locale].saved} onClick={() => onSave(item)}>
        <Heart size={18} fill={saved ? 'currentColor' : 'none'}/>
      </button>
      <div className={styles.itemBody}>
        <div className={styles.itemStatus}>
          <span data-status={item.availability_status}>{availabilityLabel(item, locale)}</span>
          {item.trust_labels[0] ? <span><BadgeCheck size={13}/>{item.trust_labels[0]}</span> : null}
        </div>
        <Link href={detail}><h3>{item.name}</h3></Link>
        {item.short_description ? <p>{item.short_description}</p> : <div className={styles.itemDescriptionSpacer}/>} 
        <div className={styles.itemFoot}>
          <strong>{priceLabel(item, locale)}</strong>
          <Link className={styles.itemCta} href={action} onClick={() => track({ event_name: 'living_home.conversion_started', locale, catalog_item_id: item.id, route: action, event_data: { journey } })}>
            {journeyLabel(journey, locale)}<ArrowRight size={14}/>
          </Link>
        </div>
      </div>
    </article>
  )
}

function DenseRail({ items, locale, saved, onSave, popular, newest }: { items: HomepageItem[]; locale: HomepageLocale; saved: Set<string>; onSave: (item: HomepageItem) => void; popular?: Set<string>; newest?: Set<string> }) {
  return (
    <div className={styles.denseRail}>
      {items.map((item) => (
        <ItemCard
          key={item.id}
          item={item}
          locale={locale}
          saved={saved.has(item.id)}
          onSave={onSave}
          signal={newest?.has(item.id)
            ? (locale === 'fr' ? 'Nouveau' : locale === 'en' ? 'New' : 'جديد')
            : popular?.has(item.id)
              ? (locale === 'fr' ? 'Populaire' : locale === 'en' ? 'Popular' : 'رائج')
              : item.featured
                ? (locale === 'fr' ? 'Sélection' : locale === 'en' ? 'Featured' : 'مختار')
                : null}
        />
      ))}
    </div>
  )
}

function JourneyPromo({ title, body, href, media, tone, icon }: { title: string; body: string; href: string; media?: string | null; tone: 'pink' | 'blue' | 'green'; icon: ReactNode }) {
  return (
    <Link className={styles.journeyPromo} data-tone={tone} href={href}>
      {media ? <img src={media} alt="" loading="lazy"/> : <div className={styles.promoFallback}/>} 
      <div className={styles.promoVeil}/>
      <div className={styles.promoCopy}>
        <span>{icon}</span>
        <strong>{title}</strong>
        <p>{body}</p>
        <em><ArrowRight size={15}/></em>
      </div>
    </Link>
  )
}

function CollectionCard({ collection, locale }: { collection: HomepageCollection; locale: HomepageLocale }) {
  const media = firstMedia(collection.items)
  return (
    <Link className={styles.collectionCard} href={collectionHref(collection, locale)}>
      {media ? <img src={media} alt={collection.title} loading="lazy"/> : <div className={styles.mediaFallback}><PackageOpen/><span>ANGELCARE</span></div>}
      <div>
        <span>{collection.items.length} {locale === 'fr' ? 'offre(s)' : locale === 'en' ? 'offer(s)' : 'عرض'}</span>
        <strong>{collection.title}</strong>
        {collection.subtitle ? <p>{collection.subtitle}</p> : null}
      </div>
    </Link>
  )
}

function GuideCard({ href, media, icon, title, body, locale }: { href: string; media: string | null; icon: ReactNode; title: string; body: string; locale: HomepageLocale }) {
  return (
    <Link className={styles.guideCard} href={href}>
      <div className={styles.guideMedia}>
        {media ? <img src={media} alt="" loading="lazy"/> : <div className={styles.guideFallback}>{icon}</div>}
        <span>{icon}</span>
      </div>
      <div className={styles.guideBody}>
        <strong>{title}</strong>
        <p>{body}</p>
        <em>{copy[locale].details}<ArrowRight size={14}/></em>
      </div>
    </Link>
  )
}

function EngagementCard({ href, media, tone, icon, eyebrow, title, body, cta }: { href: string; media: string | null; tone: 'blue' | 'pink' | 'green'; icon: ReactNode; eyebrow: string; title: string; body: string; cta: string }) {
  return (
    <Link href={href} className={styles.engagementCard} data-tone={tone}>
      <div className={styles.engagementMedia}>
        {media ? <img src={media} alt="" loading="lazy"/> : <div className={styles.engagementFallback}>{icon}</div>}
        <span>{icon}</span>
      </div>
      <div className={styles.engagementBody}>
        <small>{eyebrow}</small>
        <strong>{title}</strong>
        <p>{body}</p>
        <em>{cta}<ArrowRight size={15}/></em>
      </div>
    </Link>
  )
}

export function LivingMarketplaceHomepage({ experience }: { experience: HomepageExperience }) {
  const { locale } = experience
  const c = copy[locale]
  const [saved, setSaved] = useState(() => new Set(experience.selection.saved))
  const all = useMemo(() => uniqueItems(
    experience.featuredItems,
    experience.availableItems,
    experience.popularItems,
    experience.bestPickItems,
    experience.newArrivalItems,
    experience.familyItems,
    experience.developmentItems,
    experience.academyItems,
    experience.organizationItems,
    ...experience.collections.map((collection) => collection.items),
  ), [experience])
  const products = useMemo(() => uniqueItems(experience.developmentItems, experience.popularItems, experience.bestPickItems, experience.featuredItems, experience.newArrivalItems).filter((item) => item.kind === 'product' || item.kind === 'kit'), [experience])
  const services = useMemo(() => uniqueItems(experience.availableItems, experience.familyItems, experience.featuredItems).filter((item) => item.kind === 'service'), [experience])
  const academy = useMemo(() => uniqueItems(experience.academyItems, experience.availableItems).filter((item) => item.kind === 'training'), [experience])
  const organizations = useMemo(() => uniqueItems(experience.organizationItems, experience.featuredItems).filter((item) => item.metadata.audience === 'organization' || item.kind === 'audit' || item.kind === 'saas_module'), [experience])
  const flash = useMemo(() => uniqueItems(experience.bestPickItems, experience.popularItems, experience.featuredItems, experience.availableItems).slice(0, 6), [experience])
  const newItems = useMemo(() => uniqueItems(experience.newArrivalItems).slice(0, 6), [experience.newArrivalItems])
  const popularSet = useMemo(() => new Set(experience.popularItems.map((item) => item.id)), [experience.popularItems])
  const newestSet = useMemo(() => new Set(experience.newArrivalItems.map((item) => item.id)), [experience.newArrivalItems])
  const heroCampaign = experience.campaigns[0] || null
  const heroMedia = heroCampaign?.desktop_asset_url || firstMedia(experience.familyItems) || firstMedia(services) || firstMedia(products) || firstMedia(all)
  const familyMedia = firstMedia(experience.familyItems) || firstMedia(services) || heroMedia
  const academyMedia = firstMedia(academy) || heroMedia
  const orgMedia = firstMedia(organizations)
  const productMedia = firstMedia(products) || heroMedia
  const campaignMedia = heroCampaign?.desktop_asset_url || heroMedia

  const toggleSaved = (item: HomepageItem) => {
    setSaved((current) => {
      const next = new Set(current)
      const active = !next.has(item.id)
      if (active) next.add(item.id)
      else next.delete(item.id)
      track({ event_name: 'living_home.selection_changed', locale, catalog_item_id: item.id, selection_type: 'saved', active, route: itemDetailHref(locale, item) })
      return next
    })
  }

  const liveProofs = experience.trustSignals.slice(0, 6)
  const stats = [
    { value: experience.categories.length, label: c.published, icon: <Search/> },
    { value: services.length, label: c.offers, icon: <CalendarDays/> },
    { value: academy.length, label: c.academyCount, icon: <GraduationCap/> },
    { value: experience.collections.length, label: c.collectionsCount, icon: <PackageOpen/> },
  ]

  const faqs = locale === 'fr' ? [
    ['Comment réserver un service ?', 'Ouvrez une offre de service puis utilisez son parcours de réservation. La disponibilité est revalidée dans le parcours.'],
    ['Comment commander un produit ?', 'Les produits et kits utilisent le panier Marketplace puis le checkout canonique.'],
    ['Comment rejoindre une formation Academy ?', 'Les formations publiées ouvrent leur parcours d’inscription Academy.'],
    ['Je représente une organisation : par où commencer ?', 'Choisissez votre univers professionnel — établissement, santé, hospitality ou corporate — puis ouvrez une demande ou une proposition.'],
  ] : locale === 'en' ? [
    ['How do I book a service?', 'Open a published service and use its booking journey. Availability is revalidated in the journey.'],
    ['How do I order a product?', 'Products and kits use the Marketplace basket and canonical checkout.'],
    ['How do I enroll in Academy?', 'Published training offers open their Academy enrollment journey.'],
    ['I represent an organization. Where do I start?', 'Choose the appropriate professional universe and open its request or quotation journey.'],
  ] : [
    ['كيف أحجز خدمة؟', 'افتح خدمة منشورة ثم استخدم مسار الحجز. تتم إعادة التحقق من التوفر داخل المسار.'],
    ['كيف أطلب منتجًا؟', 'تستخدم المنتجات والمجموعات سلة Marketplace ثم مسار الدفع الرسمي.'],
    ['كيف أسجل في Academy؟', 'تفتح عروض التكوين المنشورة مسار التسجيل في Academy.'],
    ['أمثل مؤسسة، من أين أبدأ؟', 'اختر العالم المهني المناسب ثم افتح مسار الطلب أو عرض السعر.'],
  ]

  const sectorMedia = [
    organizations[0]?.media_url || orgMedia,
    organizations[1]?.media_url || orgMedia,
    organizations[2]?.media_url || orgMedia,
    organizations[3]?.media_url || orgMedia,
  ]

  return (
    <div className={styles.world} data-ac-homepage-world={LIVING_MARKETPLACE_WORLD_ID} dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      {heroCampaign ? (
        <section className={styles.urgencyBar}>
          <div><Sparkles size={15}/><strong>{heroCampaign.eyebrow || heroCampaign.title}</strong><span>{heroCampaign.subtitle}</span></div>
          <Link href={campaignHref(heroCampaign, locale)}>{heroCampaign.primary_cta_label || c.discover}<ArrowRight size={14}/></Link>
        </section>
      ) : null}

      <section className={styles.hero}>
        <div className={styles.heroGrid}>
          <div className={styles.heroCopy}>
            <span>{c.heroEyebrow}</span>
            <h1>{c.heroTitle}</h1>
            <p>{c.heroBody}</p>
            <div className={styles.heroActions}>
              <Link href={`/angelcare-marketplace/${locale}/marketplace`}>{c.discover}<ArrowRight size={16}/></Link>
              <Link href={`/angelcare-marketplace/${locale}/family/request`}>{c.family}</Link>
            </div>
            {heroCampaign ? <Link className={styles.heroCampaignLink} href={campaignHref(heroCampaign, locale)}><Sparkles size={14}/><span>{heroCampaign.title}</span><ArrowRight size={14}/></Link> : null}
          </div>

          <div className={styles.heroMediaPanel}>
            {heroMedia ? <img className={styles.heroImage} src={heroMedia} alt={c.heroTitle} fetchPriority="high"/> : <div className={styles.heroMediaFallback}><Heart/><strong>ANGELCARE</strong></div>}
            <div className={styles.heroMediaShade}/>
            <div className={styles.heroHandwritten}>{c.heroNote}<Heart size={17}/></div>
            <div className={styles.heroMediaBadge}><BadgeCheck/><span>{experience.territory?.name || 'AngelCare Marketplace'}</span></div>
          </div>

          <aside className={styles.heroAside}>
            <span>{c.trustTitle}</span>
            <strong>{c.heroCommunity}</strong>
            <p>{c.heroCommunityBody}</p>
            <ul>
              <li><Check/>{locale === 'fr' ? 'Services, produits & Academy' : locale === 'en' ? 'Services, products & Academy' : 'خدمات ومنتجات وAcademy'}</li>
              <li><Check/>{locale === 'fr' ? 'Parcours famille & professionnels' : locale === 'en' ? 'Family & professional journeys' : 'مسارات الأسرة والمهنيين'}</li>
              <li><Check/>{locale === 'fr' ? 'Données commerciales réelles' : locale === 'en' ? 'Real commercial data' : 'بيانات تجارية حقيقية'}</li>
            </ul>
            <Link href={`/angelcare-marketplace/${locale}/family/request`}><UsersRound size={16}/>{c.supportCta}<ArrowRight size={15}/></Link>
          </aside>
        </div>
      </section>

      <section className={styles.liveStrip} aria-label={c.trustTitle}>
        {stats.map((stat) => <article key={stat.label}>{stat.icon}<div><strong>{stat.value}</strong><span>{stat.label}</span></div></article>)}
        {experience.territory ? <article><MapPin/><div><strong>{experience.territory.name}</strong><span>{experience.territory.territory_code}</span></div></article> : null}
      </section>

      {experience.categories.length ? (
        <section className={styles.section}>
          <SectionHead eyebrow="DISCOVERY" title={c.categories} body={c.categoriesSub} href={`/angelcare-marketplace/${locale}/marketplace`} locale={locale}/>
          <div className={styles.categoryRail}>
            {experience.categories.slice(0, 12).map((category) => (
              <Link key={category.id} className={styles.categoryCard} href={categoryHref(locale, category)}>
                {category.cover_asset_url ? <img src={category.cover_asset_url} alt="" loading="lazy"/> : <span className={styles.categoryFallback}><Sparkles/></span>}
                <strong>{category.title}</strong>
                <small>{category.item_count}</small>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className={styles.section}>
        <SectionHead eyebrow="MERCHANDISING" title={c.now} locale={locale}/>
        <div className={styles.promoGrid}>
          <JourneyPromo title={locale === 'fr' ? 'Familles & services du quotidien' : locale === 'en' ? 'Families & everyday services' : 'الأسرة والخدمات اليومية'} body={locale === 'fr' ? 'Garde, accompagnement, activités et parcours familiaux.' : locale === 'en' ? 'Care, support, activities and family journeys.' : 'رعاية ومرافقة وأنشطة ومسارات أسرية.'} href={`/angelcare-marketplace/${locale}/families`} media={familyMedia} tone="pink" icon={<Heart/>}/>
          <JourneyPromo title="AngelCare Academy" body={locale === 'fr' ? 'Formations publiées et inscriptions reliées.' : locale === 'en' ? 'Published training and connected enrollment.' : 'تكوينات منشورة وتسجيل مرتبط.'} href={`/angelcare-marketplace/${locale}/academy`} media={academyMedia} tone="blue" icon={<GraduationCap/>}/>
          <JourneyPromo title={locale === 'fr' ? 'Solutions professionnelles' : locale === 'en' ? 'Professional solutions' : 'حلول مهنية'} body={locale === 'fr' ? 'Crèches, écoles, santé, hospitality et entreprises.' : locale === 'en' ? 'Childcare, schools, health, hospitality and companies.' : 'حضانات ومدارس وصحة وفنادق وشركات.'} href={`/angelcare-marketplace/${locale}/professionals`} media={orgMedia} tone="green" icon={<Building2/>}/>
        </div>
      </section>

      {flash.length ? (
        <section className={`${styles.section} ${styles.commerceSection}`}>
          <SectionHead eyebrow="LIVE COMMERCE" title={c.flash} body={c.flashSub} href={`/angelcare-marketplace/${locale}/marketplace`} locale={locale}/>
          <DenseRail items={flash} locale={locale} saved={saved} onSave={toggleSaved} popular={popularSet} newest={newestSet}/>
        </section>
      ) : null}

      {services.length ? (
        <section className={styles.section}>
          <SectionHead eyebrow="SERVICES" title={c.services} body={c.servicesSub} href={`/angelcare-marketplace/${locale}/home-services`} locale={locale}/>
          <div className={styles.splitCommerce}>
            <div className={styles.serviceGrid}>{services.slice(0, 6).map((item) => <ItemCard key={item.id} item={item} locale={locale} saved={saved.has(item.id)} onSave={toggleSaved} signal={null}/>)}</div>
            <aside className={styles.helpCard}>
              {familyMedia ? <img className={styles.helpMedia} src={familyMedia} alt="" loading="lazy"/> : null}
              <div className={styles.helpOverlay}/>
              <div className={styles.helpContent}>
                <div className={styles.helpIcon}><UsersRound/></div>
                <span>ANGELCARE FAMILY</span>
                <h3>{c.help}</h3>
                <p>{c.helpBody}</p>
                <div className={styles.helpChecks}>
                  <span><Check/> {locale === 'fr' ? 'Diagnostic de besoin' : locale === 'en' ? 'Needs diagnostic' : 'تشخيص الاحتياج'}</span>
                  <span><Check/> {locale === 'fr' ? 'Parcours de réservation' : locale === 'en' ? 'Booking journey' : 'مسار الحجز'}</span>
                  <span><Check/> {locale === 'fr' ? 'Support AngelCare' : locale === 'en' ? 'AngelCare support' : 'دعم AngelCare'}</span>
                </div>
                <Link href={`/angelcare-marketplace/${locale}/family/request`}>{c.helpCta}<ArrowRight size={15}/></Link>
                <Link className={styles.helpSecondary} href={`/angelcare-marketplace/${locale}/family/diagnostic`}>{locale === 'fr' ? 'Faire un diagnostic' : locale === 'en' ? 'Start a diagnostic' : 'ابدأ التشخيص'}</Link>
              </div>
            </aside>
          </div>
        </section>
      ) : null}

      {products.length ? (
        <section className={`${styles.section} ${styles.dualCommerce}`}>
          <div>
            <SectionHead eyebrow="PRODUCTS & KITS" title={c.packs} body={c.packsSub} href={`/angelcare-marketplace/${locale}/kits`} locale={locale}/>
            <DenseRail items={products.slice(0, 6)} locale={locale} saved={saved} onSave={toggleSaved} popular={popularSet} newest={newestSet}/>
          </div>
          {experience.popularItems.length ? (
            <div>
              <SectionHead eyebrow="POPULAR" title={c.best} href={`/angelcare-marketplace/${locale}/marketplace`} locale={locale}/>
              <DenseRail items={uniqueItems(experience.popularItems, products).slice(0, 6)} locale={locale} saved={saved} onSave={toggleSaved} popular={popularSet}/>
            </div>
          ) : null}
        </section>
      ) : null}

      {(academy.length || experience.academyCohorts.length) ? (
        <section className={`${styles.section} ${styles.academySection}`}>
          <SectionHead eyebrow="ANGELCARE ACADEMY" title={c.academy} body={c.academySub} href={`/angelcare-marketplace/${locale}/academy`} locale={locale}/>
          <div className={styles.academyLayout}>
            <div>{academy.length ? <DenseRail items={academy.slice(0, 4)} locale={locale} saved={saved} onSave={toggleSaved} newest={newestSet}/> : null}</div>
            <aside className={styles.academySide}>
              <Link className={styles.academyVisual} href={`/angelcare-marketplace/${locale}/academy`}>
                {academyMedia ? <img src={academyMedia} alt="" loading="lazy"/> : <div className={styles.academyVisualFallback}><GraduationCap/></div>}
                <div className={styles.academyVisualVeil}/>
                <div className={styles.academyVisualCopy}>
                  <span>ANGELCARE ACADEMY</span>
                  <strong>{c.academyBanner}</strong>
                  <p>{c.academyBannerBody}</p>
                  <em>{c.academyCta}<ArrowRight size={15}/></em>
                </div>
              </Link>
              {experience.academyCohorts.length ? (
                <div className={styles.cohortCard}>
                  <div className={styles.cohortTitle}><GraduationCap/><div><span>ACADEMY LIVE</span><h3>{locale === 'fr' ? 'Cohortes ouvertes ou planifiées' : locale === 'en' ? 'Open or scheduled cohorts' : 'مجموعات مفتوحة أو مبرمجة'}</h3></div></div>
                  {experience.academyCohorts.slice(0, 3).map((cohort) => {
                    const remaining = Math.max(0, cohort.capacity - cohort.enrolled_count)
                    return (
                      <Link href={`/angelcare-marketplace/${locale}/academy/programs/${cohort.course_slug}`} key={cohort.id}>
                        <div>
                          <strong>{cohort.course_title || cohort.name}</strong>
                          <small>{cohort.delivery_mode}{cohort.starts_at ? ` · ${new Date(cohort.starts_at).toLocaleDateString(locale === 'ar' ? 'ar-MA' : locale === 'en' ? 'en-GB' : 'fr-FR')}` : ''}</small>
                        </div>
                        {cohort.capacity > 0 ? <em>{remaining} {locale === 'fr' ? 'place(s)' : locale === 'en' ? 'seat(s)' : 'مقعد'}</em> : <ChevronRight/>}
                      </Link>
                    )
                  })}
                </div>
              ) : null}
            </aside>
          </div>
        </section>
      ) : null}

      <section className={`${styles.section} ${styles.b2bSection}`}>
        <SectionHead eyebrow="B2B / INSTITUTIONAL" title={c.b2b} body={c.b2bSub} locale={locale}/>
        <div className={styles.b2bGrid}>
          {[
            { href: `/angelcare-marketplace/${locale}/establishments`, icon: <Building2/>, title: locale === 'fr' ? 'Crèches & écoles' : locale === 'en' ? 'Childcare & schools' : 'الحضانات والمدارس', label: locale === 'fr' ? 'Établissements' : locale === 'en' ? 'Institutions' : 'المؤسسات', media: sectorMedia[0] },
            { href: `/angelcare-marketplace/${locale}/health-partners`, icon: <ShieldCheck/>, title: locale === 'fr' ? 'Maternités & santé' : locale === 'en' ? 'Maternity & health' : 'الأمومة والصحة', label: locale === 'fr' ? 'Partenaires santé' : locale === 'en' ? 'Health partners' : 'شركاء الصحة', media: sectorMedia[1] },
            { href: `/angelcare-marketplace/${locale}/hospitality`, icon: <Hotel/>, title: locale === 'fr' ? 'Hôtels & tourisme' : locale === 'en' ? 'Hotels & hospitality' : 'الفنادق والسياحة', label: 'Hospitality', media: sectorMedia[2] },
            { href: `/angelcare-marketplace/${locale}/corporates`, icon: <UsersRound/>, title: locale === 'fr' ? 'Entreprises' : locale === 'en' ? 'Companies' : 'الشركات', label: 'Corporate family', media: sectorMedia[3] },
          ].map((sector) => (
            <Link className={styles.sectorCard} href={sector.href} key={sector.href}>
              <div className={styles.sectorMedia}>{sector.media ? <img src={sector.media} alt="" loading="lazy"/> : <div className={styles.sectorFallback}>{sector.icon}</div>}<span>{sector.icon}</span></div>
              <div><small>{sector.label}</small><strong>{sector.title}</strong><em>{c.details}<ArrowRight size={14}/></em></div>
            </Link>
          ))}
          <Link className={styles.quoteTile} href={`/angelcare-marketplace/${locale}/professionals`}>
            <ClipboardCheck/>
            <div><small>ANGELCARE B2B</small><strong>{c.quote}</strong><span>{locale === 'fr' ? 'Choisir le bon univers professionnel puis ouvrir le parcours adapté.' : locale === 'en' ? 'Choose the right professional universe and open the appropriate journey.' : 'اختر العالم المهني المناسب ثم افتح المسار الملائم.'}</span></div>
            <ArrowRight/>
          </Link>
        </div>
        {organizations.length ? <div className={styles.organizationRail}><DenseRail items={organizations.slice(0, 5)} locale={locale} saved={saved} onSave={toggleSaved}/></div> : null}
      </section>

      <section className={`${styles.section} ${styles.guideSection}`}>
        <SectionHead eyebrow="ORIENTATION" title={c.guides} body={c.guidesSub} locale={locale}/>
        <div className={styles.guideExperience}>
          <div className={styles.guideGrid}>
            <GuideCard href={`/angelcare-marketplace/${locale}/home-services`} media={familyMedia} icon={<CalendarDays/>} title={locale === 'fr' ? 'Choisir un service' : locale === 'en' ? 'Choose a service' : 'اختيار خدمة'} body={locale === 'fr' ? 'Passez des univers aux services publiés et disponibles.' : locale === 'en' ? 'Move from universes to published available services.' : 'انتقل من العوالم إلى الخدمات المنشورة والمتاحة.'} locale={locale}/>
            <GuideCard href={`/angelcare-marketplace/${locale}/family/diagnostic`} media={heroMedia} icon={<Search/>} title={locale === 'fr' ? 'Clarifier votre besoin' : locale === 'en' ? 'Clarify your need' : 'حدد احتياجك'} body={locale === 'fr' ? 'Le diagnostic structure votre besoin avant recommandation.' : locale === 'en' ? 'The diagnostic structures your needs before recommendation.' : 'ينظم التشخيص احتياجك قبل التوصية.'} locale={locale}/>
            <GuideCard href={`/angelcare-marketplace/${locale}/trust`} media={productMedia} icon={<BadgeCheck/>} title={locale === 'fr' ? 'Vérifier la confiance' : locale === 'en' ? 'Verify trust' : 'تحقق من الثقة'} body={locale === 'fr' ? 'Accédez aux standards, sécurité et preuves publiques.' : locale === 'en' ? 'Open standards, safety and public evidence.' : 'الوصول إلى المعايير والسلامة والأدلة العامة.'} locale={locale}/>
            <GuideCard href={`/angelcare-marketplace/${locale}/academy`} media={academyMedia} icon={<BookOpenCheck/>} title="AngelCare Academy" body={locale === 'fr' ? 'Explorez les programmes et parcours de formation publiés.' : locale === 'en' ? 'Explore published programs and training journeys.' : 'استكشف البرامج ومسارات التكوين المنشورة.'} locale={locale}/>
          </div>
          <aside className={styles.humanGuidance}>
            {familyMedia ? <img src={familyMedia} alt="" loading="lazy"/> : <div className={styles.humanGuidanceFallback}><UsersRound/></div>}
            <div className={styles.humanGuidanceVeil}/>
            <div className={styles.humanGuidanceCopy}>
              <span>ANGELCARE HUMAN GUIDANCE</span>
              <h3>{c.humanHelp}</h3>
              <p>{c.humanHelpBody}</p>
              <div><span><Check/> {locale === 'fr' ? 'Besoin clarifié' : locale === 'en' ? 'Need clarification' : 'توضيح الاحتياج'}</span><span><Check/> {locale === 'fr' ? 'Parcours approprié' : locale === 'en' ? 'Appropriate journey' : 'المسار المناسب'}</span></div>
              <Link href={`/angelcare-marketplace/${locale}/family/request`}>{c.supportCta}<ArrowRight size={15}/></Link>
            </div>
          </aside>
        </div>
      </section>

      {(experience.collections.length || newItems.length) ? (
        <section className={styles.section}>
          <SectionHead eyebrow="CURATION" title={c.collections} body={c.collectionsSub} href={`/angelcare-marketplace/${locale}/marketplace`} locale={locale}/>
          {experience.collections.length ? <div className={styles.collectionGrid}>{experience.collections.slice(0, 4).map((collection) => <CollectionCard key={collection.id} collection={collection} locale={locale}/>)}</div> : null}
          {newItems.length ? (
            <div className={styles.newArrivalBlock}>
              <SectionHead eyebrow="NEW" title={locale === 'fr' ? 'Dernières nouveautés' : locale === 'en' ? 'Latest arrivals' : 'أحدث الإضافات'} locale={locale}/>
              <DenseRail items={newItems} locale={locale} saved={saved} onSave={toggleSaved} newest={newestSet}/>
            </div>
          ) : null}
        </section>
      ) : null}

      <section className={`${styles.section} ${styles.engagementGrid}`}>
        <EngagementCard href={`/angelcare-marketplace/${locale}/account`} media={productMedia} tone="blue" icon={<UsersRound/>} eyebrow="ACCOUNT" title={c.account} body={c.accountBody} cta={c.accountCta}/>
        <EngagementCard href={`/angelcare-marketplace/${locale}/family/request`} media={familyMedia} tone="pink" icon={<Heart/>} eyebrow="HUMAN SUPPORT" title={c.support} body={c.supportBody} cta={c.supportCta}/>
        {heroCampaign ? (
          <EngagementCard href={campaignHref(heroCampaign, locale)} media={campaignMedia} tone="green" icon={<Star/>} eyebrow="CAMPAIGN" title={heroCampaign.title} body={heroCampaign.subtitle || c.flashSub} cta={heroCampaign.primary_cta_label || c.discover}/>
        ) : (
          <EngagementCard href={`/angelcare-marketplace/${locale}/marketplace`} media={heroMedia} tone="green" icon={<ShoppingBag/>} eyebrow="MARKETPLACE" title={locale === 'fr' ? 'Continuer à explorer' : locale === 'en' ? 'Keep exploring' : 'واصل الاستكشاف'} body={locale === 'fr' ? 'Produits, services, Academy et solutions professionnelles.' : locale === 'en' ? 'Products, services, Academy and professional solutions.' : 'منتجات وخدمات وAcademy وحلول مهنية.'} cta={c.discover}/>
        )}
      </section>

      <section className={`${styles.section} ${styles.trustSection}`}>
        <SectionHead eyebrow="TRUST" title={c.commitments} body={c.commitmentsSub} href={`/angelcare-marketplace/${locale}/trust`} locale={locale}/>
        {liveProofs.length ? (
          <div className={styles.trustGrid}>
            {liveProofs.map((signal) => (
              <article key={signal.id}>
                <BadgeCheck/>
                <div>
                  <strong>{signal.name}</strong>
                  <p>{signal.public_claims[0] || signal.verification_reference}</p>
                  {signal.valid_until ? <small>{locale === 'fr' ? 'Valide jusqu’au' : locale === 'en' ? 'Valid until' : 'صالح حتى'} {new Date(signal.valid_until).toLocaleDateString(locale === 'ar' ? 'ar-MA' : locale === 'en' ? 'en-GB' : 'fr-FR')}</small> : null}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className={styles.truthNotice}>
            <ShieldCheck/>
            <div>
              <strong>{locale === 'fr' ? 'Aucune preuve publique inventée.' : locale === 'en' ? 'No public evidence is invented.' : 'لا يتم اختراع أي دليل عام.'}</strong>
              <p>{locale === 'fr' ? 'Ce bloc s’enrichit automatiquement lorsque des preuves publiques actives sont disponibles.' : locale === 'en' ? 'This block fills automatically when active public evidence is available.' : 'يتم ملء هذا القسم تلقائيًا عند توفر أدلة عامة نشطة.'}</p>
            </div>
          </div>
        )}
      </section>

      <section className={`${styles.section} ${styles.closingGrid}`}>
        <div className={styles.faqCard}>
          <span>HELP CENTER</span>
          <h2>{c.faq}</h2>
          {faqs.map(([q, a]) => <details key={q}><summary>{q}<ChevronRight size={16}/></summary><p>{a}</p></details>)}
        </div>
        <div className={styles.missionCard}>
          {heroMedia ? <img src={heroMedia} alt="" loading="lazy"/> : null}
          <div className={styles.missionVeil}/>
          <div>
            <span>ANGELCARE</span>
            <h2>{c.mission}</h2>
            <p>{c.missionBody}</p>
            <Link href={`/angelcare-marketplace/${locale}/marketplace`}>{c.discover}<ArrowRight size={15}/></Link>
          </div>
        </div>
      </section>

      <nav className={styles.floatingActions} aria-label="Marketplace quick actions">
        <Link href={`/angelcare-marketplace/${locale}/marketplace?saved=1`}><Heart size={19}/>{saved.size ? <span>{saved.size}</span> : null}</Link>
        <Link href={`/angelcare-marketplace/${locale}/quote-basket`}><ShoppingBag size={19}/></Link>
      </nav>
    </div>
  )
}
