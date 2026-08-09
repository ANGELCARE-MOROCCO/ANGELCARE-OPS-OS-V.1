import type { CatalogLocale } from '../catalog-discovery/types'
import type { ConversionJourney, ConversionSessionCreateInput, ConversionStatus } from './types'

const journeys = new Set<ConversionJourney>([
  'service_booking',
  'product_checkout',
  'academy_enrollment',
  'b2b_quotation',
  'partner_subscription',
  'quality_assessment',
])

const statuses = new Set<ConversionStatus>([
  'draft',
  'configuring',
  'identity_pending',
  'eligibility_pending',
  'availability_pending',
  'consent_pending',
  'review',
  'ready',
  'submitted',
  'confirmed',
  'handover_pending',
  'expired',
  'cancelled',
  'failed',
])

export function locale(value: unknown): CatalogLocale {
  return value === 'en' || value === 'ar' ? value : 'fr'
}

export function journey(value: unknown): ConversionJourney | undefined {
  if (value === undefined || value === null || value === '') return undefined
  const candidate = String(value) as ConversionJourney
  if (!journeys.has(candidate)) throw new Error('Parcours de conversion invalide.')
  return candidate
}

export function status(value: unknown): ConversionStatus {
  const candidate = String(value) as ConversionStatus
  if (!statuses.has(candidate)) throw new Error('Statut de conversion invalide.')
  return candidate
}

export function object(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {}
}

export function requiredText(value: unknown, label: string, max = 240): string {
  const text = String(value || '').trim()
  if (!text) throw new Error(`${label} est requis.`)
  if (text.length > max) throw new Error(`${label} dépasse ${max} caractères.`)
  return text
}

export function optionalText(value: unknown, max = 1000): string | null {
  const text = String(value || '').trim()
  if (!text) return null
  if (text.length > max) throw new Error(`Valeur trop longue (${max} caractères maximum).`)
  return text
}

export function positiveNumber(value: unknown, fallback = 1): number {
  const number = Number(value)
  return Number.isFinite(number) && number > 0 ? number : fallback
}

export function createInput(value: Record<string, unknown>): ConversionSessionCreateInput {
  return {
    itemSlug: requiredText(value.itemSlug, 'itemSlug', 180),
    locale: locale(value.locale),
    journey: journey(value.journey),
    visitorReference: requiredText(value.visitorReference, 'visitorReference', 180),
    sourceRoute: optionalText(value.sourceRoute, 500) || undefined,
    territoryCode: optionalText(value.territoryCode, 80),
    idempotencyKey: requiredText(value.idempotencyKey, 'idempotencyKey', 220),
    initialConfiguration: object(value.initialConfiguration),
  }
}
