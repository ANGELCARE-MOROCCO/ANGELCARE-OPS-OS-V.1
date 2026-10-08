import type { CatalogLocale, DiscoveryItem } from '@/angelcare-marketplace/catalog-discovery/types'
import { FAMILY_ATOMIC_STORIES, isFamilyAtomicSchemaKey, type FamilyAtomicSchemaKey } from './contract'

export type FamilyChapter = 'care' | 'learn' | 'play' | 'travel'
export type FamilyWords = readonly [string, string, string]
export const familyWords = (words: FamilyWords, locale: CatalogLocale) => words[locale === 'fr' ? 0 : locale === 'en' ? 1 : 2]
export const FAMILY_CHAPTERS: readonly { key: FamilyChapter; title: FamilyWords; lead: FamilyWords }[] = [
  { key: 'care', title: ['Le quotidien, plus serein', 'Everyday life, with more ease', 'حياة يومية أكثر هدوءًا'], lead: ['Des relais pour chaque rythme de famille.', 'Support for every family rhythm.', 'دعم لكل إيقاع عائلي.'] },
  { key: 'learn', title: ['Découvrir. Apprendre. Progresser.', 'Discover. Learn. Grow.', 'اكتشفوا وتعلموا وتقدموا.'], lead: ['Des activités et un accompagnement adaptés à votre besoin.', 'Activities and guidance that fit your needs.', 'أنشطة ومرافقة تناسب احتياجاتكم.'] },
  { key: 'play', title: ['Le plaisir de grandir ensemble', 'The joy of growing together', 'متعة النمو معًا'], lead: ['Cartes, jeux, kits et ressources à explorer.', 'Cards, games, kits and resources to explore.', 'بطاقات وألعاب وحقائب وموارد للاستكشاف.'] },
  { key: 'travel', title: ['De nouveaux horizons en famille', 'New horizons for your family', 'آفاق جديدة للأسرة'], lead: ['Voyages, vacances et premiers pas au préscolaire.', 'Travel, holidays and first steps into preschool.', 'السفر والعطل والخطوات الأولى في التعليم الأولي.'] },
]
const labels: Record<FamilyAtomicSchemaKey, FamilyWords> = {
  'home-childcare-one-time': ['Garde ponctuelle', 'One-time care', 'رعاية مؤقتة'],
  'home-childcare-recurring': ['Garde régulière', 'Recurring care', 'رعاية منتظمة'],
  'school-pickup-care': ['Sortie d’école', 'School pickup', 'الاستلام من المدرسة'],
  'overnight-extended-care': ['Soirée & nuit', 'Evening & overnight', 'المساء والليل'],
  'emergency-last-minute-care': ['Besoin urgent', 'Urgent need', 'حاجة عاجلة'],
  'hotel-travel-childcare': ['Voyage & hôtel', 'Travel & hotel', 'السفر والفندق'],
  'holiday-excursion-programme': ['Vacances & excursions', 'Holidays & outings', 'العطل والرحلات'],
  'montessori-home-service': ['Montessori à domicile', 'Montessori at home', 'مونتيسوري في المنزل'],
  'learning-homework-support': ['Devoirs & apprentissage', 'Homework & learning', 'الواجبات والتعلم'],
  'non-medical-support-service': ['Accompagnement personnalisé', 'Personalised support', 'مرافقة شخصية'],
  'flashcards-learning-product': ['Flashcards', 'Flashcards', 'بطاقات تعليمية'],
  'montessori-development-kit': ['Kits Montessori', 'Montessori kits', 'حقائب مونتيسوري'],
  'development-game': ['Jeux de développement', 'Development games', 'ألعاب التطوير'],
  'activity-subscription-box': ['Box d’activités', 'Activity boxes', 'صناديق الأنشطة'],
  'digital-learning-resource': ['Ressources digitales', 'Digital resources', 'موارد رقمية'],
  'preschool-admission': ['Préscolaire & admission', 'Preschool & admission', 'التعليم الأولي والقبول'],
}
export function familyLabel(key: FamilyAtomicSchemaKey, locale: CatalogLocale) { return familyWords(labels[key], locale) }
export function familyChapter(key: FamilyAtomicSchemaKey): FamilyChapter {
  if (['hotel-travel-childcare', 'holiday-excursion-programme', 'preschool-admission'].includes(key)) return 'travel'
  if (['montessori-home-service', 'learning-homework-support', 'non-medical-support-service'].includes(key)) return 'learn'
  if (['flashcards-learning-product', 'montessori-development-kit', 'development-game', 'activity-subscription-box', 'digital-learning-resource'].includes(key)) return 'play'
  return 'care'
}
export function familySchema(item: DiscoveryItem) { return String(item.metadata.experience_schema_key || '') }
export function familyRequestHref(locale: CatalogLocale, need?: string) {
  return '/angelcare-marketplace/' + locale + '/family/request' + (isFamilyAtomicSchemaKey(need) ? '?need=' + encodeURIComponent(need) : '')
}
export function familyRequestNeed(need: unknown) { return typeof need === 'string' && isFamilyAtomicSchemaKey(need) ? need : null }
export function familyRequestLabel(need: unknown) { const key = familyRequestNeed(need); return key ? familyLabel(key, 'fr') : null }
export function familyDetailHref(locale: CatalogLocale, item: DiscoveryItem) { return '/angelcare-marketplace/' + locale + '/marketplace/item/' + encodeURIComponent(item.slug) }
export function familyAvailable(item: DiscoveryItem) { return ['available', 'limited'].includes(item.availability_status) }
export function familyPrice(item: DiscoveryItem, locale: CatalogLocale) {
  if (item.price_mode === 'quote_only') return familyWords(['Après qualification', 'After qualification', 'بعد التحقق'], locale)
  if (item.price_amount === null || !Number.isFinite(item.price_amount)) return familyWords(['Consulter les conditions', 'View conditions', 'عرض الشروط'], locale)
  const amount = new Intl.NumberFormat(locale === 'ar' ? 'ar-MA' : locale).format(item.price_amount)
  return (item.price_mode === 'starting_from' ? familyWords(['Dès ', 'From ', 'ابتداءً من '], locale) : '') + amount + ' ' + item.currency_label
}
export function familyAvailability(item: DiscoveryItem, locale: CatalogLocale) {
  const status = item.availability_status
  if (status === 'available') return familyWords(['Disponible', 'Available', 'متاح'], locale)
  if (status === 'limited') return familyWords(['Disponibilité limitée', 'Limited availability', 'توفر محدود'], locale)
  if (['unavailable', 'out_of_stock', 'sold_out', 'closed'].includes(status)) return familyWords(['Indisponible actuellement', 'Currently unavailable', 'غير متاح حاليًا'], locale)
  return familyWords(['Conditions à vérifier', 'Check conditions', 'تحققوا من الشروط'], locale)
}
export function familyAction(item: DiscoveryItem, locale: CatalogLocale) {
  if (!familyAvailable(item)) return familyWords(['Voir les détails', 'View details', 'عرض التفاصيل'], locale)
  const key = familySchema(item)
  if (key === 'non-medical-support-service') return familyWords(['Vérifier l’adéquation', 'Check suitability', 'تحققوا من الملاءمة'], locale)
  if (key === 'preschool-admission') return familyWords(['Découvrir l’admission', 'Explore admission', 'استكشفوا القبول'], locale)
  if (key === 'activity-subscription-box') return familyWords(['Découvrir l’abonnement', 'Explore subscription', 'استكشفوا الاشتراك'], locale)
  if (key === 'digital-learning-resource') return familyWords(['Découvrir la ressource', 'Explore resource', 'استكشفوا المورد'], locale)
  if (item.kind === 'product' || item.kind === 'kit') return familyWords(['Découvrir & commander', 'Explore & order', 'استكشفوا واطلبوا'], locale)
  return familyWords(['Découvrir & réserver', 'Explore & book', 'استكشفوا واحجزوا'], locale)
}
export type FamilyDisplayKey = FamilyAtomicSchemaKey | 'postpartum' | 'home-activities' | 'event-care' | 'family-offers'
export function isFamilyOffer(item: DiscoveryItem) {
  const schema = familySchema(item)
  if (isFamilyAtomicSchemaKey(schema)) return ['service', 'product', 'kit'].includes(item.kind) || (item.kind === 'training' && schema === 'preschool-admission')
  // A different explicit schema retains its own storefront and operational authority.
  if (schema || item.metadata.family_storefront_assignment !== true) return false
  if (item.kind === 'service') return ['one_time_service', 'recurring_service'].includes(String(item.metadata.family_sellable_type || ''))
  return item.kind === 'product' || item.kind === 'kit'
}
export function familyDisplayKey(item: DiscoveryItem): FamilyDisplayKey {
  const schema = familySchema(item)
  if (isFamilyAtomicSchemaKey(schema)) return schema
  if (item.kind === 'service') {
    switch (item.metadata.family_service_capability) {
      case 'advanced-childcare': return item.metadata.family_sellable_type === 'recurring_service' ? 'home-childcare-recurring' : 'home-childcare-one-time'
      case 'special-needs-home-support': return 'non-medical-support-service'
      case 'home-care-postpartum': return 'postpartum'
      case 'advanced-awakening-home': return 'home-activities'
      case 'event-childcare': return 'event-care'
    }
  }
  return 'family-offers'
}
export const FAMILY_SERVICE_SECTIONS: readonly { key: FamilyDisplayKey; anchor: string; chapter: FamilyChapter; tone: string; imageSchema: FamilyAtomicSchemaKey; title: FamilyWords; lead: FamilyWords }[] = [
  { key: 'postpartum', anchor: 'family-postpartum', chapter: 'care', tone: 'rose', imageSchema: 'home-childcare-recurring', title: ['Les premiers jours, mieux entourés.', 'More support for those first days.', 'دعم أكبر في الأيام الأولى.'], lead: ['Un relais non médical à domicile pour votre quotidien avec bébé. Explorez les accompagnements et choisissez votre point de départ.', 'Non-medical support at home for everyday life with your baby. Explore the services and choose your starting point.', 'دعم غير طبي في المنزل لحياتكم اليومية مع رضيعكم. استكشفوا الخدمات واختاروا نقطة البداية.'] },
  { key: 'home-activities', anchor: 'family-home-activities', chapter: 'learn', tone: 'blue', imageSchema: 'montessori-home-service', title: ['La curiosité s’invite à la maison.', 'Bring curiosity home.', 'الفضول يزور بيتكم.'], lead: ['Éveil, jeux et animation à domicile : découvrez les formats publiés, les âges et les activités proposés pour votre enfant.', 'Discovery, play and activities at home: explore the published formats, ages and activities for your child.', 'اكتشاف ولعب وأنشطة في المنزل: اطلعوا على الصيغ والأعمار والأنشطة المنشورة لطفلكم.'] },
  { key: 'event-care', anchor: 'family-event-care', chapter: 'care', tone: 'violet', imageSchema: 'holiday-excursion-programme', title: ['Vos grands moments. Leur petit univers.', 'Your big moments. Their own little world.', 'لحظاتكم الكبيرة وعالمهم الصغير.'], lead: ['Anniversaires, réceptions et événements privés : explorez les services de garde et d’animation pour préparer une fête en famille.', 'Birthdays, celebrations and private events: explore childcare and activity services for your family occasion.', 'أعياد الميلاد والاحتفالات والمناسبات الخاصة: استكشفوا خدمات الرعاية والأنشطة لمناسبتكم العائلية.'] },
  { key: 'family-offers', anchor: 'family-more-offers', chapter: 'care', tone: 'mint', imageSchema: 'home-childcare-one-time', title: ['Encore plus de possibilités pour votre famille.', 'More possibilities for your family.', 'مزيد من الخيارات لأسرتكم.'], lead: ['Découvrez les autres offres de cet univers et leurs conditions.', 'Explore the other offers in this universe and their conditions.', 'اكتشفوا العروض الأخرى في هذا العالم وشروطها.'] },
]
export function familyDisplayLabel(key: FamilyDisplayKey, locale: CatalogLocale) {
  if (isFamilyAtomicSchemaKey(key)) return familyLabel(key, locale)
  const extra: Record<string, FamilyWords> = { postpartum: ['Post-partum & bébé', 'Postpartum & baby', 'ما بعد الولادة والرضيع'], 'home-activities': ['Éveil & activités à domicile', 'Discovery & activities at home', 'اكتشاف وأنشطة في المنزل'], 'event-care': ['Garde événementielle', 'Care for private events', 'رعاية في المناسبات الخاصة'], 'family-offers': ['Autres offres famille', 'More family offers', 'عروض عائلية أخرى'] }
  return familyWords(extra[key], locale)
}
export function selectFamilyItems(items: readonly DiscoveryItem[], options: { query?: string; availableOnly?: boolean; sort?: string }, locale: CatalogLocale) {
  const query = (options.query || '').trim().toLocaleLowerCase(locale)
  const selected = items.filter(item => isFamilyOffer(item) && (!options.availableOnly || familyAvailable(item)) && (!query || (item.name + ' ' + (item.short_description || '') + ' ' + familyDisplayLabel(familyDisplayKey(item), locale)).toLocaleLowerCase(locale).includes(query)))
  return selected.sort((a, b) => {
    if (options.sort === 'price-low') return (a.price_amount ?? Infinity) - (b.price_amount ?? Infinity)
    if (options.sort === 'price-high') return (b.price_amount ?? -Infinity) - (a.price_amount ?? -Infinity)
    return Number(b.featured) - Number(a.featured) || Number(familyAvailable(b)) - Number(familyAvailable(a)) || a.name.localeCompare(b.name, locale)
  })
}
export const FAMILY_STORIES_BY_CHAPTER = FAMILY_CHAPTERS.map(chapter => ({ ...chapter, stories: FAMILY_ATOMIC_STORIES.filter(story => familyChapter(story.schemaKey) === chapter.key) }))
