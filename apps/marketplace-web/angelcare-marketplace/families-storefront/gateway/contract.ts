import type { CatalogLocale, DiscoveryItem, StorefrontExperience } from '../../catalog-discovery/types'
import { familyDisplayKey, selectFamilyItems } from '../experience'
import { FAMILY_ATOMIC_STORIES } from '../contract'

export type GatewayWorld = 'home-services' | 'development' | 'kits'
export type GatewayNeed = 'care' | 'baby' | 'learn' | 'play' | 'adapted'
export type GatewayRhythm = 'all' | 'occasional' | 'recurring' | 'night' | 'pickup'
export type GatewayAge = 'all' | '0-2' | '3-5' | '6-8' | '9-12'
export type GatewayInterest = 'all' | 'language' | 'autonomy' | 'creativity' | 'concentration'
export const GATEWAY_SECTIONS = ['family-top', 'family-gateways', 'family-needs', 'family-finder', 'family-care', 'family-rhythm', 'family-learn', 'family-play', 'family-ages', 'family-moments', 'family-featured', 'family-collections', 'family-confidence', 'family-continue', 'family-travel', 'family-guidance'] as const
export const GATEWAY_WORLDS: readonly GatewayWorld[] = ['home-services', 'development', 'kits']
export function gatewayHref(locale: CatalogLocale, world: GatewayWorld) { return `/angelcare-marketplace/${locale}/${world}` }
export function gatewayDestination(item: DiscoveryItem): GatewayWorld {
  if (item.kind === 'service') return 'home-services'
  return ['montessori-development-kit', 'activity-subscription-box'].includes(familyDisplayKey(item)) || item.kind === 'kit' ? 'kits' : 'development'
}
export function gatewayConfiguration(item: DiscoveryItem): Record<string, unknown> {
  const value = item.metadata.experience_configuration
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
}
export function gatewayFields(item: DiscoveryItem): Record<string, unknown> {
  const card = item.metadata.family_card_details
  return { ...gatewayConfiguration(item), ...(card && typeof card === 'object' && !Array.isArray(card) ? card as Record<string, unknown> : {}) }
}
function numbers(value: unknown) { return typeof value === 'number' && Number.isFinite(value) ? value : typeof value === 'string' && /^\d+(\.\d+)?$/.test(value) ? Number(value) : null }
export function configuredAgeRanges(item: DiscoveryItem): Array<[number, number]> {
  const c = gatewayFields(item), min = numbers(c.age_min), max = numbers(c.age_max)
  if (min !== null && max !== null && min >= 0 && max >= min && max <= 18) return [[min, max]]
  const source = c.child_age_bands ?? c.age_range ?? c.age_bands ?? item.metadata.family_card_details
  const values = Array.isArray(source) ? source : typeof source === 'string' ? source.split(/[|,;]/) : []
  return values.flatMap(value => {
    if (typeof value !== 'string' || /month|mois|شهر|أشهر/i.test(value)) return []
    const match = value.trim().match(/^(?:ages?\s*)?(\d{1,2})\s*(?:-|–|—|to|à|إلى)\s*(\d{1,2})(?:\s*(?:ans?|years?|years? old|سنوات|سنة))?$/i)
    if (!match) return []
    const a = Number(match[1]), b = Number(match[2]); return a <= b && b <= 18 ? [[a, b] as [number, number]] : []
  })
}
export function matchesAge(item: DiscoveryItem, age: GatewayAge) {
  if (age === 'all') return true
  const [min, max] = age.split('-').map(Number)
  return configuredAgeRanges(item).some(([a, b]) => a <= max && b >= min)
}
const interestValues: Record<Exclude<GatewayInterest, 'all'>, readonly string[]> = {
  language: ['language', 'language_development', 'langage', 'communication', 'لغة', 'اللغة'],
  autonomy: ['autonomy', 'autonomie', 'independence', 'practical_life', 'vie pratique', 'الاستقلالية'],
  creativity: ['creativity', 'créativité', 'creative', 'art', 'الإبداع'],
  concentration: ['concentration', 'attention', 'focus', 'التركيز'],
}
export function matchesInterest(item: DiscoveryItem, interest: GatewayInterest) {
  if (interest === 'all') return true
  const c = gatewayConfiguration(item)
  const values = [c.competency_areas, c.competency_domains, c.learning_domains, c.developmental_areas, c.learning_objectives].flatMap(v => Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : typeof v === 'string' ? v.split(/[|,;]/) : []).map(v => v.trim().toLocaleLowerCase())
  return values.some(v => interestValues[interest].includes(v))
}
export function matchesNeed(item: DiscoveryItem, need: GatewayNeed) {
  const key = familyDisplayKey(item)
  if (need === 'care') return item.kind === 'service' && ['home-childcare-one-time', 'home-childcare-recurring', 'school-pickup-care', 'overnight-extended-care', 'emergency-last-minute-care', 'hotel-travel-childcare'].includes(key)
  if (need === 'baby') return key === 'postpartum'
  if (need === 'adapted') return key === 'non-medical-support-service'
  if (need === 'learn') return ['montessori-home-service', 'learning-homework-support', 'home-activities', 'flashcards-learning-product', 'development-game', 'digital-learning-resource'].includes(key)
  return item.kind === 'product' || item.kind === 'kit'
}
export function matchesRhythm(item: DiscoveryItem, rhythm: GatewayRhythm) {
  if (rhythm === 'all') return true
  const key = familyDisplayKey(item)
  return key === ({ occasional: 'home-childcare-one-time', recurring: 'home-childcare-recurring', night: 'overnight-extended-care', pickup: 'school-pickup-care' } as const)[rhythm]
}
export function recommendGateway(items: readonly DiscoveryItem[], locale: CatalogLocale, options: { need?: GatewayNeed; rhythm?: GatewayRhythm; age?: GatewayAge; interest?: GatewayInterest; query?: string } = {}) {
  return selectFamilyItems(items, { query: options.query }, locale).filter(item => (!options.need || matchesNeed(item, options.need)) && matchesRhythm(item, options.rhythm || 'all') && matchesAge(item, options.age || 'all') && matchesInterest(item, options.interest || 'all'))
}
export function canonicalCollections(experience: StorefrontExperience, items: readonly DiscoveryItem[]) {
  const canonical = new Map(items.map(item => [item.id, item]))
  return experience.collections.map(collection => ({ ...collection, items: [...new Set(collection.items.map(item => item.id))].map(id => canonical.get(id)).filter((item): item is DiscoveryItem => !!item) })).filter(collection => collection.items.length > 0)
}
export function directoryHref(locale: CatalogLocale, key: string) {
  if (key === 'preschool-admission') return `/angelcare-marketplace/${locale}/establishments`
  if (key === 'holiday-excursion-programme') return `/angelcare-marketplace/${locale}/marketplace/search`
  if (['montessori-development-kit', 'activity-subscription-box'].includes(key)) return gatewayHref(locale, 'kits')
  if (['flashcards-learning-product', 'development-game', 'digital-learning-resource'].includes(key)) return gatewayHref(locale, 'development')
  return gatewayHref(locale, 'home-services')
}
export function directoryAnchor(key: string) { return FAMILY_ATOMIC_STORIES.find(story => story.schemaKey === key)?.anchor || 'family-needs' }
export function safeStoredIds(raw: string | null, allowed: ReadonlySet<string>): string[] {
  if (!raw || raw.length > 12000) return []
  try { const values: unknown = JSON.parse(raw); return Array.isArray(values) ? [...new Set(values.filter((id): id is string => typeof id === 'string' && allowed.has(id)))].slice(0, 12) : [] } catch { return [] }
}
