import type { CatalogLocale, DiscoveryItem } from '../catalog-discovery/types'

export type ConversionJourney =
  | 'service_booking'
  | 'product_checkout'
  | 'academy_enrollment'
  | 'b2b_quotation'
  | 'partner_subscription'
  | 'quality_assessment'

export type ConversionStatus =
  | 'draft'
  | 'configuring'
  | 'identity_pending'
  | 'eligibility_pending'
  | 'availability_pending'
  | 'consent_pending'
  | 'review'
  | 'ready'
  | 'submitted'
  | 'confirmed'
  | 'handover_pending'
  | 'expired'
  | 'cancelled'
  | 'failed'

export type ConversionExceptionSeverity = 'info' | 'warning' | 'high' | 'critical'

export interface ConversionPriceSnapshot {
  id: string
  session_id: string
  catalog_item_id: string
  pricing_source: 'finance_price_rule' | 'catalog_fallback' | 'quote_required'
  price_book_id: string | null
  price_rule_id: string | null
  currency_label: string
  pricing_model: string
  unit_price: number | null
  quantity: number
  subtotal: number | null
  discount_total: number
  tax_total: number
  grand_total: number | null
  status: 'valid' | 'quote_required' | 'expired' | 'rejected'
  source_hash: string
  valid_until: string
  evidence: Record<string, unknown>
}

export interface ConversionAvailabilityDecision {
  status: 'available' | 'hold_required' | 'configuration_required' | 'unavailable'
  authority: 'catalog' | 'academy' | 'inventory' | 'provider' | 'corporate_quota' | 'manual_review'
  quantity: number
  availableQuantity: number | null
  sourceId: string | null
  startsAt: string | null
  endsAt: string | null
  reason: string | null
  evidence: Record<string, unknown>
}

export interface ConversionConsentRecord {
  id: string
  session_id: string
  consent_key: string
  consent_version: string
  locale: CatalogLocale
  accepted: boolean
  accepted_at: string | null
  text_hash: string
  evidence: Record<string, unknown>
}

export interface ConversionOutcome {
  id: string
  session_id: string
  outcome_type: string
  canonical_object_type: string
  canonical_object_id: string | null
  public_reference: string
  status: 'created' | 'submitted' | 'handover_pending' | 'failed'
  handover_payload: Record<string, unknown>
  created_at: string
}

export interface ConversionSession {
  id: string
  public_reference: string
  session_key: string
  journey: ConversionJourney
  status: ConversionStatus
  locale: CatalogLocale
  territory_id: string | null
  tenant_id: string | null
  family_account_id: string | null
  crm_account_id: string | null
  catalog_item_id: string
  quote_basket_id: string | null
  identity_context: Record<string, unknown>
  configuration: Record<string, unknown>
  eligibility_result: Record<string, unknown>
  availability_result: Record<string, unknown>
  failure_code: string | null
  failure_message: string | null
  expires_at: string
  last_activity_at: string
  submitted_at: string | null
  confirmed_at: string | null
  outcome_type: string | null
  outcome_id: string | null
  item?: DiscoveryItem | null
  priceSnapshot?: ConversionPriceSnapshot | null
  consents?: ConversionConsentRecord[]
  outcome?: ConversionOutcome | null
}

export interface ConversionSessionCreateInput {
  itemSlug: string
  locale: CatalogLocale
  journey?: ConversionJourney
  visitorReference: string
  sourceRoute?: string
  territoryCode?: string | null
  idempotencyKey: string
  initialConfiguration?: Record<string, unknown>
}

export interface ConversionAdminSummary {
  activeSessions: number
  readyForConfirmation: number
  submittedToday: number
  abandoned: number
  expiringHolds: number
  quoteRequired: number
  failedSessions: number
  criticalExceptions: number
  conversionByJourney: Array<{ journey: ConversionJourney; count: number }>
}

export interface ConversionQueueFilters {
  journey?: ConversionJourney
  status?: ConversionStatus
  exceptionOnly?: boolean
  limit?: number
}

export interface ConversionJourneyPageData {
  item: DiscoveryItem
  journey: ConversionJourney
  locale: CatalogLocale
  territoryCode: string | null
}

export interface ConversionOption {
  id: string
  label: string
  subtitle: string | null
  status: string
  availableQuantity: number | null
  startsAt: string | null
  endsAt: string | null
  priceAmount: number | null
  currencyLabel: string | null
  metadata: Record<string, unknown>
}

export interface ConversionBasketRecord {
  id: string
  publicReference: string
  kind: 'transactional' | 'quotation'
  status: string
  pricingStatus: string
  lineCount: number
  subtotal: number
  grandTotal: number
  currencyLabel: string
  territoryId: string | null
  familyAccountId: string | null
  tenantId: string | null
  expiresAt: string | null
  createdAt: string
}

export interface ConversionEvidenceRecord {
  id: string
  recordType: 'hold' | 'consent' | 'exception'
  status: string
  severity: string | null
  sessionId: string
  sessionReference: string | null
  title: string
  detail: string
  expiresAt: string | null
  createdAt: string
}
