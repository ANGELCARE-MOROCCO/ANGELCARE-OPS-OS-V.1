import type { CatalogLocale } from '../catalog-discovery/types'
import type { MarketplaceRequestContext } from '../domain/types'

export type JourneyType =
  | 'product_order'
  | 'kit_order'
  | 'family_booking'
  | 'recurring_service'
  | 'academy_enrollment'
  | 'b2b_quotation'
  | 'hospitality_programme'
  | 'corporate_benefit'
  | 'partner_activation'
  | 'quality_assessment'

export type JourneyStatus =
  | 'registered'
  | 'awaiting_customer'
  | 'awaiting_angelcare'
  | 'qualified'
  | 'scheduled'
  | 'in_preparation'
  | 'in_progress'
  | 'completed'
  | 'blocked'
  | 'recovery'
  | 'cancelled'

export type JourneyActionStatus = 'open' | 'in_progress' | 'completed' | 'waived' | 'expired'
export type JourneyRisk = 'low' | 'medium' | 'high' | 'critical'
export type JourneyVisibility = 'customer' | 'organization' | 'internal' | 'restricted'

export interface JourneyEvent {
  id: string
  event_key: string
  title: string
  description: string | null
  status: JourneyStatus
  authority_type: string
  authority_object_id: string | null
  evidence: Record<string, unknown>
  customer_visible: boolean
  occurred_at: string
}

export interface JourneyAction {
  id: string
  action_key: string
  title: string
  description: string | null
  status: JourneyActionStatus
  due_at: string | null
  consequence: string | null
  action_url: string | null
  required_authority: string
  evidence: Record<string, unknown>
}

export interface JourneyDocument {
  id: string
  document_type: string
  title: string
  version_label: string | null
  locale: CatalogLocale
  visibility: JourneyVisibility
  source_system: string
  source_object_id: string | null
  download_url: string | null
  expires_at: string | null
  status: string
  published_at: string | null
}

export interface JourneyNotification {
  id: string
  channel: 'in_app' | 'email' | 'whatsapp' | 'sms'
  template_key: string
  title: string
  message: string
  status: 'queued' | 'sent' | 'delivered' | 'failed' | 'acknowledged'
  deep_link: string | null
  scheduled_at: string
  delivered_at: string | null
  acknowledged_at: string | null
}

export interface JourneyChangeRequest {
  id: string
  request_type: string
  status: 'submitted' | 'under_review' | 'approved' | 'rejected' | 'completed' | 'cancelled'
  reason: string
  requested_changes: Record<string, unknown>
  policy_decision: Record<string, unknown>
  submitted_at: string
  resolved_at: string | null
}

export interface JourneyRecoveryCase {
  id: string
  issue_type: string
  urgency: JourneyRisk
  status: 'open' | 'investigating' | 'proposal' | 'awaiting_customer' | 'resolved' | 'closed'
  summary: string
  evidence: Record<string, unknown>
  resolution_proposal: string | null
  customer_accepted_at: string | null
  sla_due_at: string | null
  created_at: string
}

export interface MarketplaceJourney {
  id: string
  public_reference: string
  journey_type: JourneyType
  status: JourneyStatus
  locale: CatalogLocale
  title: string
  subtitle: string | null
  owner_user_id: string | null
  family_account_id: string | null
  crm_account_id: string | null
  tenant_id: string | null
  territory_id: string | null
  conversion_outcome_id: string | null
  canonical_object_type: string
  canonical_object_id: string | null
  current_authority: string
  next_action_label: string | null
  next_action_due_at: string | null
  risk_level: JourneyRisk
  completion_percent: number
  scheduled_start_at: string | null
  scheduled_end_at: string | null
  completed_at: string | null
  financial_status: Record<string, unknown>
  fulfillment_status: Record<string, unknown>
  customer_context: Record<string, unknown>
  metadata: Record<string, unknown>
  customer_account_id: string | null
  creation_source: string
  assisted_order_payload: Record<string, unknown>
  events: JourneyEvent[]
  actions: JourneyAction[]
  documents: JourneyDocument[]
  notifications: JourneyNotification[]
  change_requests: JourneyChangeRequest[]
  recovery_cases: JourneyRecoveryCase[]
  created_at: string
  updated_at: string
}

export interface CustomerAccountSummary {
  locale: CatalogLocale
  active: MarketplaceJourney[]
  completed: MarketplaceJourney[]
  nextActions: JourneyAction[]
  upcoming: MarketplaceJourney[]
  notifications: JourneyNotification[]
  counters: {
    active: number
    awaitingCustomer: number
    upcoming: number
    documents: number
    recovery: number
  }
}

export interface JourneyAdminSummary {
  total: number
  requiringAction: number
  late: number
  awaitingCustomer: number
  blocked: number
  recovery: number
  failedNotifications: number
  byType: Array<{ journey_type: JourneyType; count: number }>
  byStatus: Array<{ status: JourneyStatus; count: number }>
  journeys: MarketplaceJourney[]
}

export interface JourneyAdminFilters {
  journeyType?: JourneyType
  status?: JourneyStatus
  riskLevel?: JourneyRisk
  query?: string
}

export interface JourneyMutationContext {
  context: MarketplaceRequestContext
  requestId: string
  request: Request
}
