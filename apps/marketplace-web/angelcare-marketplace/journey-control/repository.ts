import { createServiceClient } from '@/lib/supabase/server'
import { writeMarketplaceAudit } from '../audit/write-audit'
import type { CatalogLocale } from '../catalog-discovery/types'
import type { MarketplaceRequestContext } from '../domain/types'
import { MarketplaceError } from '../server/errors'
import type {
  CustomerAccountSummary,
  JourneyAction,
  JourneyAdminFilters,
  JourneyAdminSummary,
  JourneyChangeRequest,
  JourneyDocument,
  JourneyEvent,
  JourneyNotification,
  JourneyRecoveryCase,
  JourneyStatus,
  MarketplaceJourney,
} from './types'

type Row = Record<string, unknown>
type DbError = { code?: string; message?: string } | null

const asRows = (value: unknown): Row[] => Array.isArray(value)
  ? value.filter((entry): entry is Row => Boolean(entry) && typeof entry === 'object')
  : []
const text = (value: unknown): string => typeof value === 'string' ? value : ''
const nullableText = (value: unknown): string | null => text(value) || null
const numberValue = (value: unknown): number => Number(value || 0)
const objectValue = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}

function fail(operation: string, error: DbError): MarketplaceError {
  const missing = error?.code === '42P01' || String(error?.message || '').includes('angelcare_marketplace_journey_')
  return new MarketplaceError(
    missing ? 'CONFIGURATION_ERROR' : 'INTERNAL_ERROR',
    missing
      ? 'La migration Orders, Requests, Fulfillment & Journey Control Universe doit être appliquée.'
      : `Impossible de ${operation}.`,
    { cause: error || undefined },
  )
}

function mapEvent(row: Row): JourneyEvent {
  return {
    id: text(row.id), event_key: text(row.event_key), title: text(row.title), description: nullableText(row.description),
    status: text(row.status) as JourneyEvent['status'], authority_type: text(row.authority_type),
    authority_object_id: nullableText(row.authority_object_id), evidence: objectValue(row.evidence),
    customer_visible: Boolean(row.customer_visible), occurred_at: text(row.occurred_at),
  }
}
function mapAction(row: Row): JourneyAction {
  return {
    id: text(row.id), action_key: text(row.action_key), title: text(row.title), description: nullableText(row.description),
    status: text(row.status) as JourneyAction['status'], due_at: nullableText(row.due_at),
    consequence: nullableText(row.consequence), action_url: nullableText(row.action_url),
    required_authority: text(row.required_authority), evidence: objectValue(row.evidence),
  }
}
function mapDocument(row: Row): JourneyDocument {
  return {
    id: text(row.id), document_type: text(row.document_type), title: text(row.title), version_label: nullableText(row.version_label),
    locale: text(row.locale) as CatalogLocale, visibility: text(row.visibility) as JourneyDocument['visibility'],
    source_system: text(row.source_system), source_object_id: nullableText(row.source_object_id),
    download_url: nullableText(row.download_url), expires_at: nullableText(row.expires_at), status: text(row.status),
    published_at: nullableText(row.published_at),
  }
}
function mapNotification(row: Row): JourneyNotification {
  return {
    id: text(row.id), channel: text(row.channel) as JourneyNotification['channel'], template_key: text(row.template_key),
    title: text(row.title), message: text(row.message), status: text(row.status) as JourneyNotification['status'],
    deep_link: nullableText(row.deep_link), scheduled_at: text(row.scheduled_at), delivered_at: nullableText(row.delivered_at),
    acknowledged_at: nullableText(row.acknowledged_at),
  }
}
function mapChangeRequest(row: Row): JourneyChangeRequest {
  return {
    id: text(row.id), request_type: text(row.request_type), status: text(row.status) as JourneyChangeRequest['status'],
    reason: text(row.reason), requested_changes: objectValue(row.requested_changes), policy_decision: objectValue(row.policy_decision),
    submitted_at: text(row.submitted_at), resolved_at: nullableText(row.resolved_at),
  }
}
function mapRecovery(row: Row): JourneyRecoveryCase {
  return {
    id: text(row.id), issue_type: text(row.issue_type), urgency: text(row.urgency) as JourneyRecoveryCase['urgency'],
    status: text(row.status) as JourneyRecoveryCase['status'], summary: text(row.summary), evidence: objectValue(row.evidence),
    resolution_proposal: nullableText(row.resolution_proposal), customer_accepted_at: nullableText(row.customer_accepted_at),
    sla_due_at: nullableText(row.sla_due_at), created_at: text(row.created_at),
  }
}

function mapJourney(row: Row): MarketplaceJourney {
  return {
    id: text(row.id), public_reference: text(row.public_reference), journey_type: text(row.journey_type) as MarketplaceJourney['journey_type'],
    status: text(row.status) as MarketplaceJourney['status'], locale: text(row.locale) as CatalogLocale,
    title: text(row.title), subtitle: nullableText(row.subtitle), owner_user_id: nullableText(row.owner_user_id),
    family_account_id: nullableText(row.family_account_id), crm_account_id: nullableText(row.crm_account_id),
    tenant_id: nullableText(row.tenant_id), territory_id: nullableText(row.territory_id),
    conversion_outcome_id: nullableText(row.conversion_outcome_id), canonical_object_type: text(row.canonical_object_type),
    canonical_object_id: nullableText(row.canonical_object_id), current_authority: text(row.current_authority),
    next_action_label: nullableText(row.next_action_label), next_action_due_at: nullableText(row.next_action_due_at),
    risk_level: text(row.risk_level) as MarketplaceJourney['risk_level'],
    completion_percent: Math.min(100, Math.max(0, numberValue(row.completion_percent))),
    scheduled_start_at: nullableText(row.scheduled_start_at), scheduled_end_at: nullableText(row.scheduled_end_at),
    completed_at: nullableText(row.completed_at), financial_status: objectValue(row.financial_status),
    fulfillment_status: objectValue(row.fulfillment_status), customer_context: objectValue(row.customer_context),
    metadata: objectValue(row.metadata), customer_account_id: nullableText(row.customer_account_id),
    creation_source: text(row.creation_source) || 'customer_checkout',
    assisted_order_payload: objectValue(row.assisted_order_payload),
    events: asRows(row.events).map(mapEvent), actions: asRows(row.actions).map(mapAction),
    documents: asRows(row.documents).map(mapDocument), notifications: asRows(row.notifications).map(mapNotification),
    change_requests: asRows(row.change_requests).map(mapChangeRequest), recovery_cases: asRows(row.recovery_cases).map(mapRecovery),
    created_at: text(row.created_at), updated_at: text(row.updated_at),
  }
}

const detailSelect = `*,
  events:angelcare_marketplace_journey_events(*),
  actions:angelcare_marketplace_journey_actions(*),
  documents:angelcare_marketplace_journey_documents(*),
  notifications:angelcare_marketplace_journey_notifications(*),
  change_requests:angelcare_marketplace_journey_change_requests(*),
  recovery_cases:angelcare_marketplace_journey_recovery_cases(*)`

async function familyAccountId(userId: string): Promise<string | null> {
  const db = await createServiceClient()
  const { data, error } = await db.from('angelcare_marketplace_family_accounts').select('id').eq('app_user_id', userId).maybeSingle()
  if (error && error.code !== '42P01') throw fail('résoudre le compte famille', error)
  return data?.id ? String(data.id) : null
}

async function customerJourneyRows(context: MarketplaceRequestContext): Promise<Row[]> {
  const db = await createServiceClient()
  const familyId = await familyAccountId(context.actor.id)
  let query = db.from('angelcare_marketplace_journeys').select(detailSelect).order('updated_at', { ascending: false })
  if (context.tenantId) query = query.eq('tenant_id', context.tenantId)
  else if (familyId) query = query.or(`owner_user_id.eq.${context.actor.id},family_account_id.eq.${familyId}`)
  else query = query.eq('owner_user_id', context.actor.id)
  const { data, error } = await query
  if (error) throw fail('charger les parcours client', error)
  return (data || []) as Row[]
}

export async function listCustomerJourneys(context: MarketplaceRequestContext): Promise<MarketplaceJourney[]> {
  return (await customerJourneyRows(context)).map(mapJourney)
}

export async function getCustomerAccountSummary(context: MarketplaceRequestContext, locale: CatalogLocale): Promise<CustomerAccountSummary> {
  const journeys = await listCustomerJourneys(context)
  const active = journeys.filter((journey) => !['completed','cancelled'].includes(journey.status))
  const completed = journeys.filter((journey) => journey.status === 'completed')
  const nextActions = active.flatMap((journey) => journey.actions.filter((action) => action.status === 'open'))
    .sort((a, b) => String(a.due_at || '').localeCompare(String(b.due_at || '')))
  const now = Date.now()
  const upcoming = active.filter((journey) => journey.scheduled_start_at && new Date(journey.scheduled_start_at).getTime() >= now)
    .sort((a, b) => String(a.scheduled_start_at).localeCompare(String(b.scheduled_start_at)))
  const notifications = journeys.flatMap((journey) => journey.notifications).filter((notification) => notification.status !== 'acknowledged').slice(0, 12)
  return {
    locale, active, completed, nextActions, upcoming, notifications,
    counters: {
      active: active.length,
      awaitingCustomer: active.filter((journey) => journey.status === 'awaiting_customer').length,
      upcoming: upcoming.length,
      documents: journeys.reduce((count, journey) => count + journey.documents.length, 0),
      recovery: active.filter((journey) => journey.status === 'recovery' || journey.recovery_cases.some((entry) => !['resolved','closed'].includes(entry.status))).length,
    },
  }
}

async function assertCustomerJourney(journeyId: string, context: MarketplaceRequestContext): Promise<MarketplaceJourney> {
  const journeys = await listCustomerJourneys(context)
  const journey = journeys.find((entry) => entry.id === journeyId || entry.public_reference === journeyId)
  if (!journey) throw new MarketplaceError('NOT_FOUND', 'Ce parcours ANGELCARE est introuvable ou ne vous est pas accessible.')
  return journey
}

export async function getCustomerJourney(journeyId: string, context: MarketplaceRequestContext): Promise<MarketplaceJourney> {
  return assertCustomerJourney(journeyId, context)
}

export async function completeCustomerAction(input: {
  journeyId: string; actionId: string; evidence: Record<string, unknown>; context: MarketplaceRequestContext;
  requestId: string; request: Request
}): Promise<MarketplaceJourney> {
  await assertCustomerJourney(input.journeyId, input.context)
  const db = await createServiceClient()
  const completedAt = new Date().toISOString()
  const { error } = await db.from('angelcare_marketplace_journey_actions').update({
    status: 'completed', evidence: input.evidence, completed_at: completedAt, completed_by: input.context.actor.id, updated_at: completedAt,
  }).eq('id', input.actionId).eq('journey_id', input.journeyId).eq('status', 'open')
  if (error) throw fail('terminer l’action client', error)
  await db.from('angelcare_marketplace_journey_events').insert({
    journey_id: input.journeyId, event_key: 'customer_action_completed', title: 'Action client complétée',
    status: 'awaiting_angelcare', authority_type: 'journey_action', authority_object_id: input.actionId,
    evidence: input.evidence, customer_visible: true, occurred_at: completedAt,
  })
  await writeMarketplaceAudit({ context: input.context, requestId: input.requestId, action: 'marketplace.journey.action.completed',
    objectType: 'marketplace_journey', objectId: input.journeyId, result: 'success', source: 'journey-control', request: input.request })
  return assertCustomerJourney(input.journeyId, input.context)
}

export async function createCustomerChangeRequest(input: {
  journeyId: string; requestType: string; reason: string; requestedChanges: Record<string, unknown>;
  context: MarketplaceRequestContext; requestId: string; request: Request
}): Promise<JourneyChangeRequest> {
  await assertCustomerJourney(input.journeyId, input.context)
  const db = await createServiceClient()
  const { data, error } = await db.from('angelcare_marketplace_journey_change_requests').insert({
    journey_id: input.journeyId, request_type: input.requestType, reason: input.reason,
    requested_changes: input.requestedChanges, status: 'submitted', submitted_by: input.context.actor.id,
  }).select('*').single()
  if (error) throw fail('soumettre la demande de changement', error)
  await writeMarketplaceAudit({ context: input.context, requestId: input.requestId, action: 'marketplace.journey.change_requested',
    objectType: 'marketplace_journey', objectId: input.journeyId, result: 'success', source: 'journey-control', request: input.request })
  return mapChangeRequest(data as Row)
}

export async function createCustomerRecoveryCase(input: {
  journeyId: string; issueType: string; urgency: JourneyRecoveryCase['urgency']; summary: string;
  evidence: Record<string, unknown>; context: MarketplaceRequestContext; requestId: string; request: Request
}): Promise<JourneyRecoveryCase> {
  await assertCustomerJourney(input.journeyId, input.context)
  const db = await createServiceClient()
  const slaHours = input.urgency === 'critical' ? 2 : input.urgency === 'high' ? 8 : 24
  const slaDueAt = new Date(Date.now() + slaHours * 3_600_000).toISOString()
  const { data, error } = await db.from('angelcare_marketplace_journey_recovery_cases').insert({
    journey_id: input.journeyId, issue_type: input.issueType, urgency: input.urgency, summary: input.summary,
    evidence: input.evidence, status: 'open', opened_by: input.context.actor.id, sla_due_at: slaDueAt,
  }).select('*').single()
  if (error) throw fail('ouvrir le parcours de récupération', error)
  await db.from('angelcare_marketplace_journeys').update({ status: 'recovery', risk_level: input.urgency, updated_at: new Date().toISOString() }).eq('id', input.journeyId)
  await writeMarketplaceAudit({ context: input.context, requestId: input.requestId, action: 'marketplace.journey.recovery.opened',
    objectType: 'marketplace_journey', objectId: input.journeyId, result: 'success', severity: input.urgency === 'critical' ? 'critical' : 'warning', source: 'journey-control', request: input.request })
  return mapRecovery(data as Row)
}

export async function acknowledgeCustomerNotification(notificationId: string, context: MarketplaceRequestContext): Promise<void> {
  const journeys = await listCustomerJourneys(context)
  const allowed = journeys.some((journey) => journey.notifications.some((notification) => notification.id === notificationId))
  if (!allowed) throw new MarketplaceError('NOT_FOUND', 'Notification introuvable.')
  const db = await createServiceClient()
  const now = new Date().toISOString()
  const { error } = await db.from('angelcare_marketplace_journey_notifications').update({ status: 'acknowledged', acknowledged_at: now, updated_at: now }).eq('id', notificationId)
  if (error) throw fail('accuser réception de la notification', error)
}

export async function listAdminJourneys(context: MarketplaceRequestContext, filters: JourneyAdminFilters = {}): Promise<MarketplaceJourney[]> {
  const db = await createServiceClient()
  let query = db.from('angelcare_marketplace_journeys').select(detailSelect).order('updated_at', { ascending: false }).limit(250)
  if (context.tenantId) query = query.eq('tenant_id', context.tenantId)
  if (context.territoryId) query = query.eq('territory_id', context.territoryId)
  if (filters.journeyType) query = query.eq('journey_type', filters.journeyType)
  if (filters.status) query = query.eq('status', filters.status)
  if (filters.riskLevel) query = query.eq('risk_level', filters.riskLevel)
  if (filters.query) query = query.or(`public_reference.ilike.%${filters.query}%,title.ilike.%${filters.query}%`)
  const { data, error } = await query
  if (error) throw fail('charger Journey Command', error)
  return ((data || []) as Row[]).map(mapJourney)
}

export async function getAdminJourney(journeyId: string, context: MarketplaceRequestContext): Promise<MarketplaceJourney> {
  const journeys = await listAdminJourneys(context)
  const journey = journeys.find((entry) => entry.id === journeyId || entry.public_reference === journeyId)
  if (!journey) throw new MarketplaceError('NOT_FOUND', 'Parcours introuvable dans votre périmètre.')
  return journey
}

export async function getJourneyAdminSummary(context: MarketplaceRequestContext): Promise<JourneyAdminSummary> {
  const journeys = await listAdminJourneys(context)
  const now = Date.now()
  const byType = [...new Set(journeys.map((journey) => journey.journey_type))].map((journey_type) => ({ journey_type, count: journeys.filter((journey) => journey.journey_type === journey_type).length }))
  const byStatus = [...new Set(journeys.map((journey) => journey.status))].map((status) => ({ status, count: journeys.filter((journey) => journey.status === status).length }))
  return {
    total: journeys.length,
    requiringAction: journeys.filter((journey) => journey.actions.some((action) => action.status === 'open')).length,
    late: journeys.filter((journey) => journey.next_action_due_at && new Date(journey.next_action_due_at).getTime() < now && !['completed','cancelled'].includes(journey.status)).length,
    awaitingCustomer: journeys.filter((journey) => journey.status === 'awaiting_customer').length,
    blocked: journeys.filter((journey) => journey.status === 'blocked').length,
    recovery: journeys.filter((journey) => journey.status === 'recovery').length,
    failedNotifications: journeys.reduce((count, journey) => count + journey.notifications.filter((notification) => notification.status === 'failed').length, 0),
    byType, byStatus, journeys,
  }
}

export async function transitionAdminJourney(input: {
  journeyId: string; status: JourneyStatus; reason: string; context: MarketplaceRequestContext; requestId: string; request: Request
}): Promise<MarketplaceJourney> {
  await getAdminJourney(input.journeyId, input.context)
  const db = await createServiceClient()
  const now = new Date().toISOString()
  const patch: Record<string, unknown> = { status: input.status, updated_at: now }
  if (input.status === 'completed') patch.completed_at = now
  const { error } = await db.from('angelcare_marketplace_journeys').update(patch).eq('id', input.journeyId)
  if (error) throw fail('faire évoluer le parcours', error)
  await db.from('angelcare_marketplace_journey_events').insert({
    journey_id: input.journeyId, event_key: 'operator_transition', title: 'Évolution opérateur', description: input.reason,
    status: input.status, authority_type: 'journey-control', evidence: { actor: input.context.actor.id }, customer_visible: true, occurred_at: now,
  })
  await writeMarketplaceAudit({ context: input.context, requestId: input.requestId, action: 'marketplace.journey.transitioned',
    objectType: 'marketplace_journey', objectId: input.journeyId, result: 'success', reason: input.reason, source: 'journey-control', request: input.request })
  return getAdminJourney(input.journeyId, input.context)
}
