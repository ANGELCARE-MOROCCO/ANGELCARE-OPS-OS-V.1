import { createServiceClient } from '@/lib/supabase/server'
import { writeMarketplaceAudit } from '../audit/write-audit'
import type { MarketplaceRequestContext } from '../domain/types'
import { MarketplaceError } from '../server/errors'
import type { PaymentIntent, PaymentAttempt } from './types'

type Row = Record<string, unknown>
const text = (value: unknown) => (typeof value === 'string' ? value : value == null ? '' : String(value))
const nullable = (value: unknown) => { const v = text(value).trim(); return v || null }
const numberValue = (value: unknown) => Number.isFinite(Number(value)) ? Number(value) : 0
const objectValue = (value: unknown): Record<string, unknown> => value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
const rows = <T>(value: unknown): T[] => Array.isArray(value) ? value as T[] : []
function fail(action: string, error: unknown): never { throw new MarketplaceError('INTERNAL_ERROR', `Impossible de ${action}.`, { cause: error, retryable: true }) }
function globalScope(context: MarketplaceRequestContext) {
  return context.roleKeys.includes('marketplace_admin') || context.roleKeys.includes('marketplace_super_admin') || context.roleKeys.includes('marketplace_executive') || context.assignments.some((a) => a.scopeType === 'global')
}

export interface PaymentAdminCustomer {
  id: string
  publicReference: string
  displayName: string
  email: string | null
  tenantId: string | null
  territoryId: string | null
}

export interface PaymentProviderEventAdmin {
  id: string
  paymentIntentId: string | null
  providerKey: string
  providerEventId: string
  eventType: string
  signatureValid: boolean
  status: string
  errorMessage: string | null
  receivedAt: string
  processedAt: string | null
}

export interface PaymentRefundAdmin {
  id: string
  publicReference: string
  paymentIntentId: string
  status: string
  requestedAmount: number
  walletRestoreAmount: number
  externalRefundAmount: number
  reason: string | null
  providerReference: string | null
  createdAt: string
  completedAt: string | null
}

export interface PaymentDisputeAdmin {
  id: string
  paymentIntentId: string
  providerReference: string | null
  status: string
  disputeType: string
  disputedAmount: number
  openedAt: string
  resolvedAt: string | null
}

export interface PaymentReconciliationAdmin {
  id: string
  paymentIntentId: string | null
  providerKey: string | null
  providerReference: string | null
  expectedAmount: number
  providerAmount: number
  differenceAmount: number
  status: 'open' | 'investigating' | 'matched' | 'adjusted' | 'reconciled' | 'waived'
  evidence: Record<string, unknown>
  ownerId: string | null
  createdAt: string
  reconciledAt: string | null
}

export interface PaymentAdminRecord {
  intent: PaymentIntent
  customer: PaymentAdminCustomer | null
  attempts: PaymentAttempt[]
  events: PaymentProviderEventAdmin[]
  refunds: PaymentRefundAdmin[]
  disputes: PaymentDisputeAdmin[]
  reconciliation: PaymentReconciliationAdmin[]
}

export interface PaymentAdminSummary {
  total: number
  captured: number
  requiringAction: number
  failed: number
  disputed: number
  reconciliationOpen: number
  refundOpen: number
  grossExpected: number
  grossCaptured: number
  grossRefunded: number
  records: PaymentAdminRecord[]
}

function mapIntent(row: Row): PaymentIntent {
  return {
    id: text(row.id), public_reference: text(row.public_reference), customer_account_id: nullable(row.customer_account_id), conversion_session_id: nullable(row.conversion_session_id),
    canonical_object_type: nullable(row.canonical_object_type), canonical_object_id: nullable(row.canonical_object_id), status: text(row.status) as PaymentIntent['status'], currency_label: text(row.currency_label) || 'Dh',
    expected_amount: numberValue(row.expected_amount), authorized_amount: numberValue(row.authorized_amount), captured_amount: numberValue(row.captured_amount), refunded_amount: numberValue(row.refunded_amount), due_now_amount: numberValue(row.due_now_amount), due_later_amount: numberValue(row.due_later_amount),
    wallet_contribution: numberValue(row.wallet_contribution), external_contribution: numberValue(row.external_contribution), metadata: objectValue(row.metadata), idempotency_key: text(row.idempotency_key), selected_method: nullable(row.selected_method) as PaymentIntent['selected_method'],
    provider_key: nullable(row.provider_key), provider_reference: nullable(row.provider_reference), wallet_reservation_id: nullable(row.wallet_reservation_id), expires_at: nullable(row.expires_at), created_at: text(row.created_at), updated_at: text(row.updated_at),
  }
}

function mapAttempt(row: Row): PaymentAttempt {
  return { id: text(row.id), payment_intent_id: text(row.payment_intent_id), attempt_number: numberValue(row.attempt_number), method_kind: text(row.method_kind) as PaymentAttempt['method_kind'], status: text(row.status), amount: numberValue(row.amount), provider_key: nullable(row.provider_key), provider_reference: nullable(row.provider_reference), failure_code: nullable(row.failure_code), customer_message: nullable(row.customer_message), created_at: text(row.created_at) }
}
function mapEvent(row: Row): PaymentProviderEventAdmin { return { id:text(row.id), paymentIntentId:nullable(row.payment_intent_id), providerKey:text(row.provider_key), providerEventId:text(row.provider_event_id), eventType:text(row.event_type), signatureValid:row.signature_valid===true, status:text(row.status), errorMessage:nullable(row.error_message), receivedAt:text(row.received_at), processedAt:nullable(row.processed_at) } }
function mapRefund(row: Row): PaymentRefundAdmin { return { id:text(row.id), publicReference:text(row.public_reference), paymentIntentId:text(row.payment_intent_id), status:text(row.status), requestedAmount:numberValue(row.requested_amount), walletRestoreAmount:numberValue(row.wallet_restore_amount), externalRefundAmount:numberValue(row.external_refund_amount), reason:nullable(row.reason), providerReference:nullable(row.provider_reference), createdAt:text(row.created_at), completedAt:nullable(row.completed_at) } }
function mapDispute(row: Row): PaymentDisputeAdmin { return { id:text(row.id), paymentIntentId:text(row.payment_intent_id), providerReference:nullable(row.provider_reference), status:text(row.status), disputeType:text(row.dispute_type), disputedAmount:numberValue(row.disputed_amount), openedAt:text(row.opened_at), resolvedAt:nullable(row.resolved_at) } }
function mapReconciliation(row: Row): PaymentReconciliationAdmin { return { id:text(row.id), paymentIntentId:nullable(row.payment_intent_id), providerKey:nullable(row.provider_key), providerReference:nullable(row.provider_reference), expectedAmount:numberValue(row.expected_amount), providerAmount:numberValue(row.provider_amount), differenceAmount:numberValue(row.difference_amount), status:text(row.status) as PaymentReconciliationAdmin['status'], evidence:objectValue(row.evidence), ownerId:nullable(row.owner_id), createdAt:text(row.created_at), reconciledAt:nullable(row.reconciled_at) } }

export async function paymentAdminSummary(context: MarketplaceRequestContext): Promise<PaymentAdminSummary> {
  const db = await createServiceClient()
  const intentResult = await db.from('angelcare_marketplace_payment_intents').select('*').order('updated_at', { ascending: false }).limit(250)
  if (intentResult.error) fail('charger les paiements', intentResult.error)
  let intents = rows<Row>(intentResult.data).map(mapIntent)
  const customerIds = [...new Set(intents.map((x) => x.customer_account_id).filter((x): x is string => Boolean(x)))]
  const customerResult = customerIds.length ? await db.from('angelcare_marketplace_customer_accounts').select('id,public_reference,display_name,email,tenant_id,territory_id').in('id', customerIds) : { data: [] as Row[], error: null }
  if (customerResult.error) fail('charger les clients des paiements', customerResult.error)
  const customers = new Map<string, PaymentAdminCustomer>()
  for (const row of rows<Row>(customerResult.data)) customers.set(text(row.id), { id:text(row.id), publicReference:text(row.public_reference), displayName:text(row.display_name)||'Client ANGELCARE', email:nullable(row.email), tenantId:nullable(row.tenant_id), territoryId:nullable(row.territory_id) })
  if (!globalScope(context)) {
    intents = intents.filter((intent) => {
      const customer = intent.customer_account_id ? customers.get(intent.customer_account_id) : null
      if (context.tenantId) return customer?.tenantId === context.tenantId
      if (context.territoryId) return customer?.territoryId === context.territoryId
      return true
    })
  }
  const ids = intents.map((x) => x.id)
  const [attemptsResult, eventsResult, refundsResult, disputesResult, reconciliationResult] = ids.length ? await Promise.all([
    db.from('angelcare_marketplace_payment_attempts').select('*').in('payment_intent_id', ids).order('created_at', { ascending: false }),
    db.from('angelcare_marketplace_payment_provider_events').select('*').in('payment_intent_id', ids).order('received_at', { ascending: false }),
    db.from('angelcare_marketplace_payment_refunds').select('*').in('payment_intent_id', ids).order('created_at', { ascending: false }),
    db.from('angelcare_marketplace_payment_disputes').select('*').in('payment_intent_id', ids).order('opened_at', { ascending: false }),
    db.from('angelcare_marketplace_payment_reconciliation_items').select('*').in('payment_intent_id', ids).order('created_at', { ascending: false }),
  ]) : [{data:[],error:null},{data:[],error:null},{data:[],error:null},{data:[],error:null},{data:[],error:null}]
  for (const result of [attemptsResult, eventsResult, refundsResult, disputesResult, reconciliationResult]) if (result.error) fail('charger le dossier paiement', result.error)
  const attempts = rows<Row>(attemptsResult.data).map(mapAttempt)
  const events = rows<Row>(eventsResult.data).map(mapEvent)
  const refunds = rows<Row>(refundsResult.data).map(mapRefund)
  const disputes = rows<Row>(disputesResult.data).map(mapDispute)
  const reconciliation = rows<Row>(reconciliationResult.data).map(mapReconciliation)
  const records: PaymentAdminRecord[] = intents.map((intent) => ({
    intent,
    customer: intent.customer_account_id ? customers.get(intent.customer_account_id) || null : null,
    attempts: attempts.filter((x) => x.payment_intent_id === intent.id),
    events: events.filter((x) => x.paymentIntentId === intent.id),
    refunds: refunds.filter((x) => x.paymentIntentId === intent.id),
    disputes: disputes.filter((x) => x.paymentIntentId === intent.id),
    reconciliation: reconciliation.filter((x) => x.paymentIntentId === intent.id),
  }))
  const actionStatuses = new Set(['requires_method','requires_customer_action','pending','failed','disputed','chargeback','reversed','reconciliation_pending'])
  return {
    total:records.length,
    captured:records.filter((x)=>['captured','partially_refunded','refunded','reconciled'].includes(x.intent.status)).length,
    requiringAction:records.filter((x)=>actionStatuses.has(x.intent.status)).length,
    failed:records.filter((x)=>x.intent.status==='failed').length,
    disputed:records.filter((x)=>x.disputes.some((d)=>!['resolved','closed'].includes(d.status))||['disputed','chargeback'].includes(x.intent.status)).length,
    reconciliationOpen:reconciliation.filter((x)=>!['reconciled','waived'].includes(x.status)).length,
    refundOpen:refunds.filter((x)=>!['completed','cancelled','reconciled'].includes(x.status)).length,
    grossExpected:records.reduce((sum,x)=>sum+x.intent.expected_amount,0),
    grossCaptured:records.reduce((sum,x)=>sum+x.intent.captured_amount,0),
    grossRefunded:records.reduce((sum,x)=>sum+x.intent.refunded_amount,0),
    records,
  }
}

const reconciliationTransitions: Record<PaymentReconciliationAdmin['status'], PaymentReconciliationAdmin['status'][]> = {
  open:['investigating','matched','waived'], investigating:['matched','adjusted','waived'], matched:['reconciled','investigating'], adjusted:['reconciled','investigating'], waived:['reconciled'], reconciled:[],
}
export async function transitionPaymentReconciliation(input:{itemId:string;status:PaymentReconciliationAdmin['status'];reason:string;evidence?:Record<string,unknown>;context:MarketplaceRequestContext;requestId:string;request:Request}) {
  const db=await createServiceClient()
  const currentResult=await db.from('angelcare_marketplace_payment_reconciliation_items').select('*').eq('id',input.itemId).maybeSingle()
  if(currentResult.error)fail('charger le rapprochement paiement',currentResult.error)
  if(!currentResult.data)throw new MarketplaceError('NOT_FOUND','Élément de rapprochement paiement introuvable.')
  const current=mapReconciliation(currentResult.data as Row)
  if(!reconciliationTransitions[current.status].includes(input.status))throw new MarketplaceError('CONFLICT',`Transition de rapprochement ${current.status} → ${input.status} non autorisée.`)
  if(input.status==='matched'&&Math.abs(current.differenceAmount)>0.01)throw new MarketplaceError('DEPENDENCY_BLOCKED','Un rapprochement avec écart non nul doit être ajusté ou justifié, pas marqué matched.')
  const now=new Date().toISOString()
  const mergedEvidence={...current.evidence,...(input.evidence||{}),decision_reason:input.reason,decision_actor_id:input.context.actor.id,decision_at:now}
  const update={status:input.status,evidence:mergedEvidence,owner_id:input.context.actor.id,updated_at:now,reconciled_at:input.status==='reconciled'?now:null}
  const result=await db.from('angelcare_marketplace_payment_reconciliation_items').update(update).eq('id',input.itemId).select('*').single()
  if(result.error||!result.data)fail('mettre à jour le rapprochement paiement',result.error)
  if(current.paymentIntentId&&input.status==='reconciled'){
    const remaining=await db.from('angelcare_marketplace_payment_reconciliation_items').select('id,status').eq('payment_intent_id',current.paymentIntentId).not('id','eq',input.itemId)
    if(remaining.error)fail('vérifier les autres rapprochements paiement',remaining.error)
    const allDone=rows<Row>(remaining.data).every((row)=>['reconciled','waived'].includes(text(row.status)))
    if(allDone){const intentUpdate=await db.from('angelcare_marketplace_payment_intents').update({status:'reconciled',updated_at:now}).eq('id',current.paymentIntentId).in('status',['captured','partially_refunded','refunded','reconciliation_pending']);if(intentUpdate.error)fail('clôturer le rapprochement du paiement',intentUpdate.error)}
  }
  await writeMarketplaceAudit({context:input.context,requestId:input.requestId,request:input.request,action:`marketplace.payment.reconciliation.${input.status}`,objectType:'payment_reconciliation_item',objectId:input.itemId,beforeValue:currentResult.data as Row,afterValue:result.data as Row,reason:input.reason,severity:'warning',source:'payment-admin-command'})
  return mapReconciliation(result.data as Row)
}
