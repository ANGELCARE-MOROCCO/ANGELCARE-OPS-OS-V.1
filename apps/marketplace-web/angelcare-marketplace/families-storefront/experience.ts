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
export function selectFamilyItems(items: readonly DiscoveryItem[], options: { query?: string; availableOnly?: boolean; sort?: string }, locale: CatalogLocale) {
  const query = (options.query || '').trim().toLocaleLowerCase(locale)
  const selected = items.filter(item => isFamilyAtomicSchemaKey(familySchema(item)) && (!options.availableOnly || familyAvailable(item)) && (!query || (item.name + ' ' + (item.short_description || '') + ' ' + familyLabel(familySchema(item) as FamilyAtomicSchemaKey, locale)).toLocaleLowerCase(locale).includes(query)))
  return selected.sort((a, b) => {
    if (options.sort === 'price-low') return (a.price_amount ?? Infinity) - (b.price_amount ?? Infinity)
    if (options.sort === 'price-high') return (b.price_amount ?? -Infinity) - (a.price_amount ?? -Infinity)
    return Number(b.featured) - Number(a.featured) || Number(familyAvailable(b)) - Number(familyAvailable(a)) || a.name.localeCompare(b.name, locale)
  })
}
export const FAMILY_STORIES_BY_CHAPTER = FAMILY_CHAPTERS.map(chapter => ({ ...chapter, stories: FAMILY_ATOMIC_STORIES.filter(story => familyChapter(story.schemaKey) === chapter.key) }))
