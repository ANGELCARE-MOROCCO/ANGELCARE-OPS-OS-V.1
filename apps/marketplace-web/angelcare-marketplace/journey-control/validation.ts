import { MarketplaceError } from '../server/errors'
import type { JourneyRisk, JourneyStatus, JourneyType } from './types'

export function requiredText(value: unknown, field: string, max = 2000): string {
  if (typeof value !== 'string' || !value.trim()) throw new MarketplaceError('VALIDATION_ERROR', `${field} est requis.`)
  return value.trim().slice(0, max)
}

export function optionalText(value: unknown, max = 2000): string | null {
  return typeof value === 'string' && value.trim() ? value.trim().slice(0, max) : null
}

export function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

const journeyTypes: JourneyType[] = ['product_order','kit_order','family_booking','recurring_service','academy_enrollment','b2b_quotation','hospitality_programme','corporate_benefit','partner_activation','quality_assessment']
const journeyStatuses: JourneyStatus[] = ['registered','awaiting_customer','awaiting_angelcare','qualified','scheduled','in_preparation','in_progress','completed','blocked','recovery','cancelled']
const risks: JourneyRisk[] = ['low','medium','high','critical']

export function journeyType(value: unknown): JourneyType | undefined {
  return typeof value === 'string' && journeyTypes.includes(value as JourneyType) ? value as JourneyType : undefined
}
export function journeyStatus(value: unknown): JourneyStatus | undefined {
  return typeof value === 'string' && journeyStatuses.includes(value as JourneyStatus) ? value as JourneyStatus : undefined
}
export function journeyRisk(value: unknown): JourneyRisk | undefined {
  return typeof value === 'string' && risks.includes(value as JourneyRisk) ? value as JourneyRisk : undefined
}
