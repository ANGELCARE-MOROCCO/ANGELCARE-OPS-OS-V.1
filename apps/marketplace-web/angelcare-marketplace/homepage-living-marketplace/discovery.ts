import type { HomepageLocale } from '../homepage-flagship/types'
import { LIVING_EDITORIAL_MEDIA as media } from './media'

type Words = readonly [string, string, string]
export type EditorialShelfKind = 'selections' | 'services' | 'products' | 'picks' | 'academy' | 'collections' | 'arrivals'
export interface EditorialJourney { key: string; path: string; image: string; title: Words; detail: Words; tone: 'pink' | 'blue' | 'mint' | 'amber' }
export const editorialWords = (words: Words, locale: HomepageLocale) => words[locale === 'fr' ? 0 : locale === 'en' ? 1 : 2]

// Editorial navigation only. These are not offers, stock, programmes or products.
// Family anchors belong to the existing sixteen-type Families storefront contract.
const care: EditorialJourney = { key: 'care', path: 'families#garde-ponctuelle', image: media.care, title: ['Un relais pour les parents', 'A helping hand for parents', 'مساعدة للآباء'], detail: ['Garde ponctuelle', 'One-time care', 'رعاية مؤقتة'], tone: 'pink' }
const school: EditorialJourney = { key: 'school', path: 'families#sortie-ecole', image: media.school, title: ['L’après-école, plus serein', 'Calmer after-school days', 'طمأنينة بعد المدرسة'], detail: ['Sortie d’école & relais', 'School pickup & care', 'الاستلام والرعاية'], tone: 'blue' }
const develop: EditorialJourney = { key: 'develop', path: 'families#montessori-domicile', image: media.development, title: ['Explorer à son rythme', 'Explore at their own pace', 'الاكتشاف بإيقاع الطفل'], detail: ['Montessori à domicile', 'Montessori at home', 'مونتيسوري في المنزل'], tone: 'mint' }
const support: EditorialJourney = { key: 'support', path: 'families#accompagnement-personnalise', image: media.support, title: ['Chaque enfant, son chemin', 'Every child has a path', 'لكل طفل مساره'], detail: ['Accompagnement personnalisé', 'Personalised support', 'مرافقة شخصية'], tone: 'blue' }
const travel: EditorialJourney = { key: 'travel', path: 'families#voyage', image: media.hospitality, title: ['Des escapades en famille', 'Family escapes', 'رحلات مع الأسرة'], detail: ['Voyage & garde en hôtel', 'Travel & hotel care', 'السفر والرعاية بالفندق'], tone: 'amber' }
const cards: EditorialJourney = { key: 'cards', path: 'families#flashcards', image: media.flashcards, title: ['Apprendre en s’amusant', 'Learn through play', 'التعلم باللعب'], detail: ['Flashcards & apprentissage', 'Flashcards & learning', 'بطاقات وتعلم'], tone: 'pink' }
const kits: EditorialJourney = { key: 'kits', path: 'kits', image: media.development, title: ['Grandir par la découverte', 'Grow through discovery', 'النمو بالاكتشاف'], detail: ['Explorer l’univers Kits', 'Explore the Kits universe', 'استكشف عالم المجموعات'], tone: 'mint' }
const training: EditorialJourney = { key: 'training', path: 'academy', image: media.academy, title: ['Faire grandir ses compétences', 'Build your skills', 'تطوير المهارات'], detail: ['Explorer AngelCare Academy', 'Explore AngelCare Academy', 'استكشف أكاديمية أنجل كير'], tone: 'blue' }
const professional: EditorialJourney = { key: 'professional', path: 'professionals', image: media.professional, title: ['Construire un projet ensemble', 'Build a project together', 'بناء مشروع معًا'], detail: ['Solutions professionnelles', 'Professional solutions', 'حلول مهنية'], tone: 'amber' }
const earlyYears: EditorialJourney = { key: 'early-years', path: 'families#prescolaire', image: media.preschool, title: ['Préparer les premières années', 'Prepare the early years', 'الاستعداد للسنوات الأولى'], detail: ['Préscolaire & admission', 'Preschool & admission', 'مرحلة ما قبل المدرسة'], tone: 'pink' }
const familyHelp: EditorialJourney = { key: 'family-help', path: 'family/request', image: media.newborn, title: ['Une nouvelle vie de famille', 'A new chapter for your family', 'بداية جديدة للأسرة'], detail: ['Parler de votre besoin', 'Tell us what you need', 'حدثنا عن احتياجك'], tone: 'pink' }

const shelves: Record<EditorialShelfKind, readonly EditorialJourney[]> = {
  selections: [care, cards, training, travel, earlyYears, professional],
  services: [care, school, develop, support, travel, familyHelp],
  products: [cards, kits, { ...earlyYears, key: 'games', path: 'families#jeux-developpement', title: ['Jeux & découvertes', 'Play & discovery', 'اللعب والاكتشاف'], detail: ['Explorer le développement', 'Explore development', 'استكشف التطور'] }],
  picks: [familyHelp, support, { ...travel, key: 'holiday', path: 'families#vacances', title: ['Des moments à partager', 'Moments to share', 'لحظات مشتركة'], detail: ['Vacances & excursions', 'Holidays & excursions', 'العطل والرحلات'] }],
  academy: [training, { ...professional, key: 'academy-professional', path: 'academy', title: ['Transmettre avec confiance', 'Teach with confidence', 'التعليم بثقة'], detail: ['Découvrir les parcours', 'Discover learning pathways', 'اكتشف مسارات التكوين'] }, { ...earlyYears, key: 'academy-practice', path: 'academy', title: ['Relier théorie et pratique', 'Connect theory and practice', 'ربط النظرية بالممارسة'], detail: ['Préparer votre formation', 'Plan your training', 'الاستعداد للتكوين'] }],
  collections: [cards, travel, { ...school, key: 'routines', title: ['Les petits rituels du quotidien', 'Little everyday rituals', 'روتين الحياة اليومية'], detail: ['Explorer la vie de famille', 'Explore family life', 'استكشف حياة الأسرة'] }],
  arrivals: [kits, earlyYears, { ...training, key: 'new-pathways', title: ['Ouvrir de nouvelles perspectives', 'Open new possibilities', 'فتح آفاق جديدة'], detail: ['Découvrir les univers', 'Discover the universes', 'اكتشف العوالم'] }],
}
export function editorialJourneys(kind: EditorialShelfKind): readonly EditorialJourney[] { return shelves[kind] }
