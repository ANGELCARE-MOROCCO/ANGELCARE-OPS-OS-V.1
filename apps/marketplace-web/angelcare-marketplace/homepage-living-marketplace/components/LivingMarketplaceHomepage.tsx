'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  ArrowRight,
  BadgeCheck,
  BookOpenCheck,
  Building2,
  CalendarDays,
  Check,
  ChevronRight,
  ChevronLeft,
  ClipboardCheck,
  GraduationCap,
  Heart,
  Hotel,
  PackageOpen,
  Pause,
  Play,
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
import { CommerceRail } from './CommerceRail'
import { LIVING_EDITORIAL_MEDIA as media, photographicMedia } from '../media'
import { editorialJourneys, editorialWords, type EditorialShelfKind } from '../discovery'
import { getPublicStorefrontNavigation } from '@/angelcare-marketplace/public-experience-authority/storefront-navigation'

const copy = {
  fr: {
    heroEyebrow: 'ANGELCARE · FAMILLE · ENFANCE · DÉVELOPPEMENT',
    heroTitle: 'Des enfants épanouis. Des parents sereins. Un univers pour avancer.',
    heroBody: 'Services, produits, développement, Academy et solutions professionnelles réunis dans une seule Marketplace AngelCare.',
    heroNote: 'Grandir ensemble, en toute confiance.',
    heroCommunity: "Plus qu'un service, un écosystème pour la famille.",
    heroCommunityBody: 'Des découvertes pour les enfants. Du soutien pour les parents. Une équipe pour vous guider.',
    discover: 'Explorer la Marketplace',
    family: 'Trouver une solution famille',
    trustTitle: 'Votre univers AngelCare',
    categories: 'Explorer les univers AngelCare',
    categoriesSub: 'Des services, des idées et des solutions pour toute la vie de famille.',
    now: 'À découvrir maintenant',
    flash: 'Sélections commerciales du moment',
    flashSub: 'Des idées utiles pour la famille, choisies dans le catalogue AngelCare.',
    services: 'Services pour votre quotidien',
    servicesSub: 'Garde, accompagnement et activités : trouvez le service adapté à votre quotidien.',
    help: 'Besoin d’un coup de main ?',
    helpBody: 'Décrivez votre besoin ou lancez un diagnostic familial avant de réserver.',
    helpCta: 'Démarrer mon besoin',
    packs: 'Produits, kits & développement',
    packsSub: 'Apprendre, jouer, explorer : des ressources pour chaque nouvelle découverte.',
    best: 'Nos coups de cœur',
    academy: 'Academy · Formations & cohortes',
    academySub: 'Apprenez, pratiquez et préparez votre prochaine étape.',
    academyCta: 'Voir toute l’Academy',
    academyBanner: 'Développez vos compétences pour un avenir plus serein.',
    academyBannerBody: 'Explorez les programmes, choisissez votre format et préparez votre inscription.',
    b2b: 'Solutions pour crèches, écoles, maternités, hôtels et entreprises',
    b2bSub: 'Des projets adaptés à votre établissement et aux familles que vous accompagnez.',
    quote: 'Demander un devis',
    guides: 'Guides & accompagnement',
    guidesSub: 'Des repères pour choisir, apprendre et avancer avec confiance.',
    humanHelp: 'Un accompagnement humain quand votre choix mérite d’être clarifié.',
    humanHelpBody: 'Prenez le temps de préciser votre besoin. Trouvez le bon point de départ avec AngelCare.',
    collections: 'Collections & nouveautés',
    collectionsSub: 'Parcourez les collections et découvrez les dernières sélections.',
    account: 'Votre espace AngelCare',
    accountBody: 'Retrouvez réservations, commandes, inscriptions, paiements et support.',
    accountCta: 'Ouvrir mon espace',
    support: 'Une équipe à votre écoute',
    supportBody: 'Expliquez votre besoin et entrez dans le parcours famille approprié.',
    supportCta: 'Être accompagné',
    commitments: 'Confiance & preuves',
    commitmentsSub: 'Découvrez les engagements et les informations de vérification AngelCare.',
    faq: 'Questions fréquentes',
    mission: 'Grandir ensemble. À chaque étape.',
    missionBody: 'Des découvertes aux grands projets, trouvez votre prochaine étape avec AngelCare.',
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
    heroCommunityBody: 'Discoveries for children. Support for parents. A team to guide you.',
    discover: 'Explore the Marketplace',
    family: 'Find a family solution',
    trustTitle: 'Your AngelCare universe',
    categories: 'Explore AngelCare universes',
    categoriesSub: 'Services, ideas and solutions for every stage of family life.',
    now: 'Discover now',
    flash: 'Current commercial selections',
    flashSub: 'Useful ideas for family life, selected from the AngelCare catalogue.',
    services: 'Services for everyday life',
    servicesSub: 'Care, support and activities for your everyday family needs.',
    help: 'Need a hand?',
    helpBody: 'Describe your need or start a family diagnostic before booking.',
    helpCta: 'Start my request',
    packs: 'Products, kits & development',
    packsSub: 'Learn, play and explore with resources for each new discovery.',
    best: 'Our picks',
    academy: 'Academy · Training & cohorts',
    academySub: 'Learn, practise and prepare your next step.',
    academyCta: 'Open Academy',
    academyBanner: 'Build skills for a more confident future.',
    academyBannerBody: 'Explore programmes, find your learning format and plan your next step.',
    b2b: 'Solutions for childcare centers, schools, maternity partners, hotels and companies',
    b2bSub: 'Enter the right professional journey directly.',
    quote: 'Request a quote',
    guides: 'Guides & human guidance',
    guidesSub: 'Useful, visual shortcuts directly connected to the right journeys.',
    humanHelp: 'Human guidance when your choice deserves clarification.',
    humanHelpBody: 'Take time to clarify your needs and find the right starting point with AngelCare.',
    collections: 'Collections & new arrivals',
    collectionsSub: 'Browse collections and discover the latest selections.',
    account: 'Your AngelCare space',
    accountBody: 'Bookings, orders, enrollments, payments and support in one place.',
    accountCta: 'Open my account',
    support: 'A team ready to help',
    supportBody: 'Describe your need and enter the appropriate family journey.',
    supportCta: 'Get guidance',
    commitments: 'Trust & evidence',
    commitmentsSub: 'Explore AngelCare commitments and verification information.',
    faq: 'Frequently asked questions',
    mission: 'Growing together. At every stage.',
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
    flashSub: 'أفكار مفيدة لحياة الأسرة من كتالوج أنجل كير.',
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
    commitmentsSub: 'اكتشف التزامات أنجل كير ومعلومات التحقق.',
    faq: 'الأسئلة الشائعة',
    mission: 'نكبر معًا في كل مرحلة.',
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
  return `/angelcare-marketplace/${locale}/marketplace/item/${encodeURIComponent(first.slug)}?collection=${encodeURIComponent(collection.id)}`
}

function priceLabel(item: HomepageItem, locale: HomepageLocale) {
  const c = copy[locale]
  if (item.price_mode === 'quote_only') return c.quotePrice
  if (item.price_amount === null) return locale === 'fr' ? 'Prix à confirmer' : locale === 'en' ? 'Price to confirm' : 'السعر قيد التأكيد'
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
  return fetch('/api/angelcare-marketplace/homepage/engagement', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  })
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

function ItemCard({ item, locale, saved, onSave, signal, pending }: { item: HomepageItem; locale: HomepageLocale; saved: boolean; onSave: (item: HomepageItem) => void; signal?: string | null; pending?: boolean }) {
  const detail = itemDetailHref(locale, item)
  const journey = journeyForItem(item)
  const unavailable = ['out_of_stock', 'unavailable', 'paused'].includes(item.availability_status)
  const action = unavailable ? detail : journeyPath(locale, item)
  const [imageFailed, setImageFailed] = useState(false)
  return (
    <article className={styles.itemCard} data-kind={item.kind}>
      <Link className={styles.itemMedia} href={detail} onClick={() => void track({ event_name: 'living_home.item_opened', locale, catalog_item_id: item.id, route: detail }).catch(() => undefined)}>
        {item.media_url && !imageFailed ? <img src={item.media_url} alt={item.name} loading="lazy" onError={() => setImageFailed(true)}/> : <div className={styles.mediaFallback}><PackageOpen/><span>{locale === 'fr' ? 'Visuel à venir' : locale === 'en' ? 'Image coming soon' : 'الصورة قريباً'}</span></div>}
        <span className={styles.kindPill}>{item.category_title || item.kind.replaceAll('_', ' ')}</span>
        {signal ? <span className={styles.signalPill}>{signal}</span> : null}
      </Link>
      <button type="button" className={styles.saveButton} disabled={pending} aria-pressed={saved} data-active={saved || undefined} aria-label={saved ? copy[locale].unsaved : copy[locale].saved} onClick={() => onSave(item)}>
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
          <Link className={styles.itemCta} href={action} onClick={() => void track({ event_name: 'living_home.conversion_started', locale, catalog_item_id: item.id, route: action, event_data: { journey } }).catch(() => undefined)}>
            {unavailable ? copy[locale].details : journeyLabel(journey, locale)}<ArrowRight size={14}/>
          </Link>
        </div>
      </div>
    </article>
  )
}

function DenseRail({ items, locale, saved, onSave, popular, newest, pending, label }: { items: HomepageItem[]; locale: HomepageLocale; saved: Set<string>; onSave: (item: HomepageItem) => void; popular?: Set<string>; newest?: Set<string>; pending?: boolean; label?: string }) {
  return <CommerceRail label={label || copy[locale].discover} locale={locale}>
    {items.map(item => <ItemCard key={item.id} item={item} locale={locale} saved={saved.has(item.id)} onSave={onSave} pending={pending}
      signal={newest?.has(item.id) ? (locale === 'fr' ? 'Nouveau' : locale === 'en' ? 'New' : 'جديد')
        : popular?.has(item.id) ? (locale === 'fr' ? 'Populaire' : locale === 'en' ? 'Popular' : 'رائج')
        : item.featured ? (locale === 'fr' ? 'Sélection' : locale === 'en' ? 'Featured' : 'مختار') : null}/>) }
  </CommerceRail>
}

function DiscoveryShelf({ locale, title, href, kind }: { locale: HomepageLocale; title: string; href: string; kind: EditorialShelfKind }) {
  const entries = editorialJourneys(kind)
  return <div className={styles.discoveryShelf} data-ac-editorial-shelf={kind}>
    <div className={styles.discoveryStatus}><span><Sparkles size={13}/>{locale === 'fr' ? 'Sélection en préparation' : locale === 'en' ? 'Selection in preparation' : 'اختيارات قيد الإعداد'}</span><small>{locale === 'fr' ? 'En attendant, explorez ces parcours' : locale === 'en' ? 'Meanwhile, explore these journeys' : 'استكشف هذه المسارات في انتظار العروض'}</small></div>
    <CommerceRail label={title} locale={locale} compact className={styles.discoveryRail}>
      {entries.map((entry) => <Link className={styles.discoveryCard} href={`/angelcare-marketplace/${locale}/${entry.path}`} key={entry.key} data-tone={entry.tone} data-ac-editorial-journey={entry.key}>
        <div className={styles.discoveryCardPhoto}><img src={entry.image} alt="" loading="lazy"/><span>{locale === 'fr' ? 'À explorer' : locale === 'en' ? 'Explore' : 'اكتشف'}</span></div>
        <div className={styles.discoveryCardBody}><small>{editorialWords(entry.detail, locale)}</small><strong>{editorialWords(entry.title, locale)}</strong><em>{locale === 'fr' ? 'Découvrir le parcours' : locale === 'en' ? 'Discover the journey' : 'اكتشف المسار'}<ArrowRight size={13}/></em></div>
      </Link>)}
    </CommerceRail>
    <Link className={styles.discoveryAll} href={href}>{locale === 'fr' ? 'Explorer cet univers' : locale === 'en' ? 'Explore this universe' : 'استكشف هذا العالم'}<ArrowRight size={13}/></Link>
  </div>
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
  const [savePending, setSavePending] = useState(false)
  const [saveError, setSaveError] = useState('')
  const saving = useRef(false)
  const selectionChanged = useRef(false)
  const [heroIndex, setHeroIndex] = useState(0)
  const [heroAuto, setHeroAuto] = useState(true)
  const [reducedMotion, setReducedMotion] = useState(false)
  const heroInteraction = useRef(false)
  useEffect(() => {
    const controller = new AbortController()
    void fetch('/api/angelcare-marketplace/homepage/engagement', { signal: controller.signal })
      .then(response => response.ok ? response.json() : null)
      .then(result => {
        if (selectionChanged.current || !Array.isArray(result?.data)) return
        setSaved(new Set(result.data.filter((row: { selection_type: string }) => row.selection_type === 'saved').map((row: { catalog_item_id: string }) => row.catalog_item_id)))
      }).catch(() => undefined)
    return () => controller.abort()
  }, [])
  const all = useMemo(() => uniqueItems(
    experience.catalogItems || [],
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
  const products = useMemo(() => uniqueItems(experience.developmentItems, experience.popularItems, experience.bestPickItems, experience.featuredItems, experience.newArrivalItems, all).filter((item) => item.kind === 'product' || item.kind === 'kit'), [experience, all])
  const services = useMemo(() => uniqueItems(experience.availableItems, experience.familyItems, experience.featuredItems, all).filter((item) => item.kind === 'service' && item.metadata.audience !== 'organization'), [experience, all])
  const academy = useMemo(() => uniqueItems(experience.academyItems, experience.availableItems, all).filter((item) => item.kind === 'training'), [experience, all])
  const organizations = useMemo(() => uniqueItems(experience.organizationItems, experience.featuredItems, all).filter((item) => item.metadata.audience === 'organization' || item.kind === 'audit' || item.kind === 'saas_module'), [experience, all])
  const flash = useMemo(() => uniqueItems(experience.bestPickItems, experience.popularItems, experience.featuredItems, experience.availableItems, all).slice(0, 18), [experience, all])
  const newItems = useMemo(() => uniqueItems(experience.newArrivalItems).slice(0, 12), [experience.newArrivalItems])
  const popularSet = useMemo(() => new Set(experience.popularItems.map((item) => item.id)), [experience.popularItems])
  const newestSet = useMemo(() => new Set(experience.newArrivalItems.map((item) => item.id)), [experience.newArrivalItems])
  const heroCampaign = experience.campaigns[0] || null
  const heroSlides = [
    ...experience.campaigns.filter(campaign => photographicMedia(campaign.desktop_asset_url)).slice(0, 4).map(campaign => ({ image: campaign.desktop_asset_url, mobile: campaign.mobile_asset_url, title: campaign.title, href: campaignHref(campaign, locale) })),
    { image: media.family, mobile: null, title: c.heroNote, href: `/angelcare-marketplace/${locale}/families` },
    { image: media.care, mobile: null, title: c.services, href: `/angelcare-marketplace/${locale}/home-services` },
    { image: media.development, mobile: null, title: c.packs, href: `/angelcare-marketplace/${locale}/development` },
  ]
  const slideCount = heroSlides.length
  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReducedMotion(preference.matches)
    update(); preference.addEventListener('change', update)
    return () => preference.removeEventListener('change', update)
  }, [])
  useEffect(() => {
    if (!heroAuto || reducedMotion || slideCount < 2) return
    const interval = window.setInterval(() => { if (!heroInteraction.current) setHeroIndex(index => (index + 1) % slideCount) }, 6500)
    return () => window.clearInterval(interval)
  }, [heroAuto, reducedMotion, slideCount])
  const chooseSlide = (index: number) => { setHeroIndex((index + slideCount) % slideCount); setHeroAuto(false) }
  const slide = heroSlides[heroIndex % heroSlides.length]
  const heroMedia = slide.image
  const familyMedia = media.care
  const academyMedia = media.academy
  const orgMedia = media.professional
  const campaignMedia = photographicMedia(heroCampaign?.desktop_asset_url) || media.family
  const storefronts = getPublicStorefrontNavigation(locale)
  const storefrontImages = [media.family, media.care, media.development, media.flashcards, media.academy, media.preschool, media.hospitality, media.health, media.corporate, media.desk, media.professional, media.support]

  const toggleSaved = async (item: HomepageItem) => {
    if (saving.current) return
    saving.current = true
    selectionChanged.current = true
    setSavePending(true)
    setSaveError('')
    const active = !saved.has(item.id)
    try {
      const response = await track({ event_name: 'living_home.selection_changed', locale, catalog_item_id: item.id, selection_type: 'saved', active, territory_code: experience.territory?.territory_code, route: itemDetailHref(locale, item) })
      if (!response.ok) throw new Error('selection_save_failed')
      setSaved(current => {
        const next = new Set(current)
        if (active) next.add(item.id)
        else next.delete(item.id)
        return next
      })
    } catch {
      setSaveError(locale === 'fr' ? 'Votre favori n’a pas pu être enregistré. Réessayez.' : locale === 'en' ? 'Your saved item could not be updated. Please retry.' : 'تعذر حفظ اختيارك. حاول مرة أخرى.')
    } finally {
      saving.current = false
      setSavePending(false)
    }
  }

  const liveProofs = experience.trustSignals.slice(0, 6)
  const shortcutCopy = locale === 'fr' ? ['Services à domicile', 'Produits & kits', 'Formation Academy', 'Solutions professionnelles', 'Votre espace', 'Une équipe à votre écoute'] : locale === 'en' ? ['Home services', 'Products & kits', 'Academy training', 'Professional solutions', 'Your account', 'Human guidance'] : ['خدمات منزلية', 'منتجات ومجموعات', 'تكوين الأكاديمية', 'حلول مهنية', 'حسابك', 'مرافقة بشرية']
  const shortcuts = [
    { icon: <CalendarDays/>, label: shortcutCopy[0], path: 'home-services' },
    { icon: <ShoppingBag/>, label: shortcutCopy[1], path: 'kits' },
    { icon: <GraduationCap/>, label: shortcutCopy[2], path: 'academy' },
    { icon: <Building2/>, label: shortcutCopy[3], path: 'professionals' },
    { icon: <UsersRound/>, label: shortcutCopy[4], path: 'account' },
    { icon: <Heart/>, label: shortcutCopy[5], path: 'family/request' },
  ]

  const faqs = locale === 'fr' ? [
    ['Comment réserver un service ?', 'Ouvrez une offre de service puis utilisez son parcours de réservation. Les créneaux et les conditions sont confirmés avant votre engagement.'],
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
    media.preschool, media.health, media.hospitality, media.corporate,
  ]

  return (
    <div className={styles.world} data-ac-homepage-world={LIVING_MARKETPLACE_WORLD_ID} data-ac-homepage-visual="immersive-r4" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
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

          <div className={styles.heroMediaPanel} onMouseEnter={() => { heroInteraction.current = true }} onMouseLeave={() => { heroInteraction.current = false }} onFocusCapture={() => { heroInteraction.current = true }} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) heroInteraction.current = false }}>
            {heroMedia ? <picture>{slide.mobile ? <source media="(max-width: 600px)" srcSet={slide.mobile}/> : null}<img className={styles.heroImage} src={heroMedia} alt={slide.title} fetchPriority="high"/></picture> : <div className={styles.heroMediaFallback}><Heart/><strong>ANGELCARE</strong></div>}
            <div className={styles.heroMediaShade}/>
            <Link className={styles.heroHandwritten} href={slide.href}>{slide.title}<ArrowRight size={17}/></Link>
            <div className={styles.heroSlideControls} role="group" aria-label={c.discover}>
              <button className={styles.heroTransport} type="button" onClick={() => chooseSlide(heroIndex - 1)} aria-label={locale === 'fr' ? 'Image précédente' : locale === 'en' ? 'Previous image' : 'الصورة السابقة'}>{locale === 'ar' ? <ChevronRight/> : <ChevronLeft/>}</button>
              {heroSlides.map((entry, index) => <button type="button" key={`${entry.image}-${index}`} data-ac-hero-slide={index} aria-label={entry.title} aria-pressed={index === heroIndex % slideCount} onClick={() => chooseSlide(index)}/>)}
              <button className={styles.heroTransport} type="button" onClick={() => chooseSlide(heroIndex + 1)} aria-label={locale === 'fr' ? 'Image suivante' : locale === 'en' ? 'Next image' : 'الصورة التالية'}>{locale === 'ar' ? <ChevronLeft/> : <ChevronRight/>}</button>
              {!reducedMotion ? <button className={styles.heroTransport} type="button" data-ac-hero-autoplay={heroAuto} onClick={() => setHeroAuto(active => !active)} aria-label={heroAuto ? (locale === 'fr' ? 'Mettre le diaporama en pause' : locale === 'en' ? 'Pause slideshow' : 'إيقاف العرض') : (locale === 'fr' ? 'Reprendre le diaporama' : locale === 'en' ? 'Resume slideshow' : 'استئناف العرض')}>{heroAuto ? <Pause/> : <Play/>}</button> : null}
              <span className={styles.heroSlideCount}>{String(heroIndex % slideCount + 1).padStart(2, '0')} / {String(slideCount).padStart(2, '0')}</span>
            </div>
            <div className={styles.heroMediaBadge}><BadgeCheck/><span>{experience.territory?.name || 'AngelCare Marketplace'}</span></div>
          </div>

          <aside className={styles.heroAside}>
            <span>{c.trustTitle}</span>
            <strong>{c.heroCommunity}</strong>
            <p>{c.heroCommunityBody}</p>
            <ul>
              <li><Check/>{locale === 'fr' ? 'Services, produits & Academy' : locale === 'en' ? 'Services, products & Academy' : 'خدمات ومنتجات وAcademy'}</li>
              <li><Check/>{locale === 'fr' ? 'Parcours famille & professionnels' : locale === 'en' ? 'Family & professional journeys' : 'مسارات الأسرة والمهنيين'}</li>
              <li><Check/>{locale === 'fr' ? 'Un choix pour chaque besoin' : locale === 'en' ? 'A choice for every need' : 'اختيارات لكل احتياج'}</li>
            </ul>
            <Link href={`/angelcare-marketplace/${locale}/family/request`}><UsersRound size={16}/>{c.supportCta}<ArrowRight size={15}/></Link>
          </aside>
        </div>
      </section>

      <section className={styles.liveStrip} aria-label={c.trustTitle}>
        {shortcuts.map(shortcut => <Link href={`/angelcare-marketplace/${locale}/${shortcut.path}`} key={shortcut.path}>{shortcut.icon}<strong>{shortcut.label}</strong><ArrowRight size={12}/></Link>)}
      </section>

      <nav className={styles.jumpNav} aria-label={c.discover}>
        {[['selections', c.now], ['services', c.services], ['products', c.packs], ['academy', c.academy], ['professional', locale === 'fr' ? 'Professionnels' : locale === 'en' ? 'Professionals' : 'المهنيون'], ['discovery', c.collections]].map(([anchor, label]) => <a key={anchor} href={`#living-${anchor}`}>{label}</a>)}
      </nav>
      {saveError ? <p className={styles.selectionError} role="alert">{saveError}</p> : null}
      <section className={styles.section} id="living-universes">
        <SectionHead eyebrow={locale === 'fr' ? 'VOS UNIVERS' : locale === 'en' ? 'YOUR UNIVERSES' : 'عوالمك'} title={c.categories} href={`/angelcare-marketplace/${locale}/marketplace`} locale={locale}/>
        <CommerceRail label={c.categories} locale={locale} compact className={styles.universeRail}>
          {storefronts.map((storefront, index) => <Link className={styles.universeCard} href={storefront.href} key={storefront.key} data-ac-world-universe={storefront.key} data-accent={storefront.accent}>
            <span><img src={storefrontImages[index]} alt="" loading="lazy"/></span><strong>{storefront.label}</strong>
          </Link>)}
        </CommerceRail>
        {experience.categories.length ? <div className={styles.categoryChips}>{experience.categories.map(category => <Link key={category.id} href={categoryHref(locale, category)}>{category.title}<ChevronRight size={12}/></Link>)}</div> : null}
      </section>

      <section className={styles.section}>
        <SectionHead eyebrow="MERCHANDISING" title={c.now} locale={locale}/>
        <div className={styles.promoGrid}>
          <JourneyPromo title={locale === 'fr' ? 'Familles & services du quotidien' : locale === 'en' ? 'Families & everyday services' : 'الأسرة والخدمات اليومية'} body={locale === 'fr' ? 'Garde, accompagnement, activités et parcours familiaux.' : locale === 'en' ? 'Care, support, activities and family journeys.' : 'رعاية ومرافقة وأنشطة ومسارات أسرية.'} href={`/angelcare-marketplace/${locale}/families`} media={media.newborn} tone="pink" icon={<Heart/>}/>
          <JourneyPromo title="AngelCare Academy" body={locale === 'fr' ? 'Apprendre, pratiquer et ouvrir de nouvelles perspectives.' : locale === 'en' ? 'Learn, practise and open new possibilities.' : 'تعلم وممارسة وآفاق جديدة.'} href={`/angelcare-marketplace/${locale}/academy`} media={academyMedia} tone="blue" icon={<GraduationCap/>}/>
          <JourneyPromo title={locale === 'fr' ? 'Solutions professionnelles' : locale === 'en' ? 'Professional solutions' : 'حلول مهنية'} body={locale === 'fr' ? 'Crèches, écoles, santé, hospitality et entreprises.' : locale === 'en' ? 'Childcare, schools, health, hospitality and companies.' : 'حضانات ومدارس وصحة وفنادق وشركات.'} href={`/angelcare-marketplace/${locale}/professionals`} media={orgMedia} tone="green" icon={<Building2/>}/>
        </div>
      </section>

      <section className={styles.section}>
        <SectionHead eyebrow="ANGELCARE FAMILY" title={locale === 'fr' ? 'Une solution pour chaque moment' : locale === 'en' ? 'A solution for every moment' : 'حل لكل لحظة'} href={`/angelcare-marketplace/${locale}/families`} locale={locale}/>
        <CommerceRail label={locale === 'fr' ? 'Vos besoins en famille' : locale === 'en' ? 'Family needs' : 'احتياجات الأسرة'} locale={locale} className={styles.situationRail}>
          {[
            { anchor: 'garde-ponctuelle', title: ['Quelques heures pour vous', 'A few hours for you', 'بضع ساعات لكم'], body: ['Garde ponctuelle', 'One-time childcare', 'رعاية مؤقتة'], image: media.care, icon: <Heart/> },
            { anchor: 'sortie-ecole', title: ['Après l’école, tout continue', 'Life after school', 'بعد المدرسة'], body: ['Sortie d’école & relais', 'School pickup & care', 'استلام ورعاية'], image: media.school, icon: <CalendarDays/> },
            { anchor: 'montessori-domicile', title: ['Découvrir à son rythme', 'Discover at their own pace', 'اكتشاف بإيقاعهم'], body: ['Montessori à domicile', 'Montessori at home', 'مونتيسوري في المنزل'], image: media.development, icon: <Sparkles/> },
            { anchor: 'accompagnement-personnalise', title: ['Du soutien au quotidien', 'Support for everyday life', 'دعم للحياة اليومية'], body: ['Accompagnement personnalisé', 'Personalised support', 'مرافقة شخصية'], image: media.support, icon: <UsersRound/> },
            { anchor: 'voyage', title: ['Voyager en famille', 'Travel as a family', 'السفر مع الأسرة'], body: ['Garde en hôtel & voyage', 'Hotel & travel childcare', 'رعاية في السفر'], image: media.hospitality, icon: <Hotel/> },
            { anchor: 'flashcards', title: ['Jouer, apprendre, grandir', 'Play, learn, grow', 'اللعب والتعلم والنمو'], body: ['Flashcards & apprentissage', 'Flashcards & learning', 'بطاقات وتعلم'], image: media.flashcards, icon: <BookOpenCheck/> },
          ].map((need, index) => <Link className={styles.situationCard} href={`/angelcare-marketplace/${locale}/families#${need.anchor}`} key={need.anchor} data-tone={index % 3}>
            <img src={need.image} alt="" loading="lazy"/><span>{need.icon}</span><div><small>{need.body[locale === 'fr' ? 0 : locale === 'en' ? 1 : 2]}</small><strong>{need.title[locale === 'fr' ? 0 : locale === 'en' ? 1 : 2]}</strong><em>{c.details}<ArrowRight size={13}/></em></div>
          </Link>)}
        </CommerceRail>
      </section>

        <section id="living-selections" className={`${styles.section} ${styles.commerceSection}`}>
          <SectionHead eyebrow={locale === 'fr' ? 'DÉCOUVERTES DU MOMENT' : locale === 'en' ? 'CURRENT DISCOVERIES' : 'اكتشافات حالية'} title={c.flash} body={c.flashSub} href={`/angelcare-marketplace/${locale}/marketplace`} locale={locale}/>
          {flash.length ? <DenseRail items={flash} label={c.flash} locale={locale} saved={saved} onSave={toggleSaved} popular={popularSet} newest={newestSet} pending={savePending}/> : <DiscoveryShelf locale={locale} title={c.flash} href={`/angelcare-marketplace/${locale}/marketplace`} kind="selections"/>}
        </section>

        <section id="living-services" className={styles.section}>
          <SectionHead eyebrow="SERVICES" title={c.services} body={c.servicesSub} href={`/angelcare-marketplace/${locale}/home-services`} locale={locale}/>
          <div className={styles.splitCommerce}>
            <div>{services.length ? <DenseRail items={services.slice(0, 12)} label={c.services} locale={locale} saved={saved} onSave={toggleSaved} pending={savePending}/> : <DiscoveryShelf locale={locale} title={c.services} href={`/angelcare-marketplace/${locale}/home-services`} kind="services"/>}</div>
            <aside className={styles.helpCard}>
              {familyMedia ? <img className={styles.helpMedia} src={media.newborn} alt="" loading="lazy"/> : null}
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

        <section id="living-products" className={`${styles.section} ${styles.dualCommerce}`}>
          <div>
            <SectionHead eyebrow={locale === 'fr' ? 'GRANDIR & JOUER' : locale === 'en' ? 'GROW & PLAY' : 'النمو واللعب'} title={c.packs} body={c.packsSub} href={`/angelcare-marketplace/${locale}/kits`} locale={locale}/>
            {products.length ? <DenseRail items={products.slice(0, 12)} label={c.packs} locale={locale} saved={saved} onSave={toggleSaved} popular={popularSet} newest={newestSet} pending={savePending}/> : <DiscoveryShelf locale={locale} title={c.packs} href={`/angelcare-marketplace/${locale}/kits`} kind="products"/>}
          </div>
            <div>
              <SectionHead eyebrow={locale === 'fr' ? 'À EXPLORER' : locale === 'en' ? 'EXPLORE' : 'اكتشف'} title={c.best} href={`/angelcare-marketplace/${locale}/marketplace`} locale={locale}/>
              {experience.bestPickItems.length ? <DenseRail items={experience.bestPickItems.slice(0, 12)} label={c.best} locale={locale} saved={saved} onSave={toggleSaved} popular={popularSet} pending={savePending}/> : <DiscoveryShelf locale={locale} title={c.best} href={`/angelcare-marketplace/${locale}/development`} kind="picks"/>}
            </div>
        </section>

        <section id="living-academy" className={`${styles.section} ${styles.academySection}`}>
          <SectionHead eyebrow="ANGELCARE ACADEMY" title={c.academy} body={c.academySub} href={`/angelcare-marketplace/${locale}/academy`} locale={locale}/>
          <div className={styles.academyLayout}>
            <div>{academy.length ? <DenseRail items={academy.slice(0, 12)} label={c.academy} locale={locale} saved={saved} onSave={toggleSaved} newest={newestSet} pending={savePending}/> : <DiscoveryShelf locale={locale} title={c.academy} href={`/angelcare-marketplace/${locale}/academy`} kind="academy"/>}</div>
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

      <section id="living-professional" className={`${styles.section} ${styles.b2bSection}`}>
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
        {organizations.length ? <div className={styles.organizationRail}><DenseRail items={organizations.slice(0, 12)} label={c.b2b} locale={locale} saved={saved} onSave={toggleSaved} pending={savePending}/></div> : null}
      </section>

      <section className={`${styles.section} ${styles.guideSection}`}>
        <SectionHead eyebrow="ORIENTATION" title={c.guides} body={c.guidesSub} locale={locale}/>
        <div className={styles.guideExperience}>
          <div className={styles.guideGrid}>
            <GuideCard href={`/angelcare-marketplace/${locale}/home-services`} media={media.school} icon={<CalendarDays/>} title={locale === 'fr' ? 'Choisir un service' : locale === 'en' ? 'Choose a service' : 'اختيار خدمة'} body={locale === 'fr' ? 'Trouvez le point de départ adapté à votre quotidien.' : locale === 'en' ? 'Find a starting point that fits your everyday life.' : 'انتقل من العوالم إلى الخدمات المنشورة والمتاحة.'} locale={locale}/>
            <GuideCard href={`/angelcare-marketplace/${locale}/family/diagnostic`} media={media.support} icon={<Search/>} title={locale === 'fr' ? 'Clarifier votre besoin' : locale === 'en' ? 'Clarify your need' : 'حدد احتياجك'} body={locale === 'fr' ? 'Le diagnostic structure votre besoin avant recommandation.' : locale === 'en' ? 'The diagnostic structures your needs before recommendation.' : 'ينظم التشخيص احتياجك قبل التوصية.'} locale={locale}/>
            <GuideCard href={`/angelcare-marketplace/${locale}/trust`} media={media.health} icon={<BadgeCheck/>} title={locale === 'fr' ? 'Vérifier la confiance' : locale === 'en' ? 'Verify trust' : 'تحقق من الثقة'} body={locale === 'fr' ? 'Accédez aux standards, sécurité et preuves publiques.' : locale === 'en' ? 'Open standards, safety and public evidence.' : 'الوصول إلى المعايير والسلامة والأدلة العامة.'} locale={locale}/>
            <GuideCard href={`/angelcare-marketplace/${locale}/academy`} media={academyMedia} icon={<BookOpenCheck/>} title="AngelCare Academy" body={locale === 'fr' ? 'Apprenez et préparez votre prochaine étape.' : locale === 'en' ? 'Learn and prepare for your next step.' : 'استكشف البرامج ومسارات التكوين المنشورة.'} locale={locale}/>
          </div>
          <aside className={styles.humanGuidance}>
            {familyMedia ? <img src={media.support} alt="" loading="lazy"/> : <div className={styles.humanGuidanceFallback}><UsersRound/></div>}
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

        <section id="living-discovery" className={`${styles.section} ${styles.discoverySplit}`}>
          <div><SectionHead eyebrow="COLLECTIONS" title={c.collections} body={c.collectionsSub} href={`/angelcare-marketplace/${locale}/marketplace`} locale={locale}/>
          {experience.collections.length ? <CommerceRail label={c.collections} locale={locale} compact className={styles.collectionsRail}>{experience.collections.slice(0, 12).map((collection) => <CollectionCard key={collection.id} collection={collection} locale={locale}/>)}</CommerceRail> : <DiscoveryShelf locale={locale} title={c.collections} href={`/angelcare-marketplace/${locale}/marketplace`} kind="collections"/>}</div>
            <div className={styles.newArrivalBlock}>
              <SectionHead eyebrow="NEW" title={locale === 'fr' ? 'Dernières nouveautés' : locale === 'en' ? 'Latest arrivals' : 'أحدث الإضافات'} locale={locale}/>
              {newItems.length ? <DenseRail items={newItems} label={c.collections} locale={locale} saved={saved} onSave={toggleSaved} newest={newestSet} pending={savePending}/> : <DiscoveryShelf locale={locale} title={locale === 'fr' ? 'Les nouveautés se préparent' : locale === 'en' ? 'New arrivals are on their way' : 'جديد قيد الإعداد'} href={`/angelcare-marketplace/${locale}/marketplace`} kind="arrivals"/>}
            </div>
        </section>

      <section className={`${styles.section} ${styles.engagementGrid}`}>
        <EngagementCard href={`/angelcare-marketplace/${locale}/account`} media={media.desk} tone="blue" icon={<UsersRound/>} eyebrow="ACCOUNT" title={c.account} body={c.accountBody} cta={c.accountCta}/>
        <EngagementCard href={`/angelcare-marketplace/${locale}/family/request`} media={media.newborn} tone="pink" icon={<Heart/>} eyebrow="HUMAN SUPPORT" title={c.support} body={c.supportBody} cta={c.supportCta}/>
        {heroCampaign ? (
          <EngagementCard href={campaignHref(heroCampaign, locale)} media={campaignMedia} tone="green" icon={<Star/>} eyebrow="CAMPAIGN" title={heroCampaign.title} body={heroCampaign.subtitle || c.flashSub} cta={heroCampaign.primary_cta_label || c.discover}/>
        ) : (
          <EngagementCard href={`/angelcare-marketplace/${locale}/marketplace`} media={media.flashcards} tone="green" icon={<ShoppingBag/>} eyebrow="MARKETPLACE" title={locale === 'fr' ? 'Continuer à explorer' : locale === 'en' ? 'Keep exploring' : 'واصل الاستكشاف'} body={locale === 'fr' ? 'Produits, services, Academy et solutions professionnelles.' : locale === 'en' ? 'Products, services, Academy and professional solutions.' : 'منتجات وخدمات وAcademy وحلول مهنية.'} cta={c.discover}/>
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
              <strong>{locale === 'fr' ? 'Découvrez nos engagements.' : locale === 'en' ? 'Explore our commitments.' : 'اكتشف التزاماتنا.'}</strong>
              <p>{locale === 'fr' ? 'Consultez les standards, les parcours de sécurité et les informations de vérification AngelCare.' : locale === 'en' ? 'Read AngelCare standards, safety journeys and verification information.' : 'يتم ملء هذا القسم تلقائيًا عند توفر أدلة عامة نشطة.'}</p>
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
        <Link href={`/angelcare-marketplace/${locale}/account/saved`}><Heart size={19}/>{saved.size ? <span>{saved.size}</span> : null}</Link>
        <Link href={`/angelcare-marketplace/${locale}/quote-basket`}><ShoppingBag size={19}/></Link>
      </nav>
    </div>
  )
}
