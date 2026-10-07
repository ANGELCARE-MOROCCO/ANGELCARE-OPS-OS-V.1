import type { FamilyAtomicSchemaKey } from './contract'
const asset = (name: string) => '/angelcare-marketplace/families-world-r2/' + name + '.jpg'
export const FAMILY_HERO_MEDIA = asset('hero')
export const FAMILY_EDITORIAL_MEDIA: Record<FamilyAtomicSchemaKey, string> = {
  'home-childcare-one-time': asset('care'),
  'home-childcare-recurring': asset('family'),
  'school-pickup-care': asset('school'),
  'overnight-extended-care': asset('evening'),
  'emergency-last-minute-care': asset('urgent'),
  'hotel-travel-childcare': asset('hospitality'),
  'holiday-excursion-programme': asset('holidays'),
  'montessori-home-service': asset('montessori'),
  'learning-homework-support': asset('homework'),
  'non-medical-support-service': asset('support'),
  'flashcards-learning-product': asset('flashcards'),
  'montessori-development-kit': asset('kits'),
  'development-game': asset('games'),
  'activity-subscription-box': asset('box'),
  'digital-learning-resource': asset('digital'),
  'preschool-admission': asset('preschool'),
}
