import 'server-only'
import { createHash } from 'node:crypto'
import { REVENUE_SIGNAL_MESSAGE_CONTENT_FIELDS, REVENUE_SIGNAL_SENSITIVE_FIELD_PATTERNS, REVENUE_SIGNAL_SOURCE_TABLE_ALLOWLIST } from './constants'
import type { RevenueSignalCategory, RevenueSignalEntityType, RevenueSignalIngestionInput, RevenueSignalSource } from '../types'

export type RevenueSignalAdapterDefinition = {
  key: string
  sourceCode: string
  table: string
  sourceKind: RevenueSignalSource['sourceKind']
  category: RevenueSignalCategory
  entityType: RevenueSignalEntityType
  defaultEventType: string
  idFields: string[]
  timestampFields: string[]
  labelFields: string[]
  statusFields: string[]
}

export const REVENUE_SIGNAL_ADAPTERS: RevenueSignalAdapterDefinition[] = [
  { key:'b2b-prospects', sourceCode:'SRC-B2B-PROSPECTS', table:'b2b_prospects', sourceKind:'crm', category:'market-opportunity', entityType:'account', defaultEventType:'prospect.observed', idFields:['id','prospect_id'], timestampFields:['updated_at','created_at'], labelFields:['name','prospect_name','organization_name','company_name'], statusFields:['status','stage'] },
  { key:'b2b-contacts', sourceCode:'SRC-B2B-CONTACTS', table:'b2b_contacts', sourceKind:'crm', category:'account-intent', entityType:'contact', defaultEventType:'contact.observed', idFields:['id','contact_id'], timestampFields:['updated_at','created_at'], labelFields:['full_name','name','email'], statusFields:['status','role'] },
  { key:'b2b-meetings', sourceCode:'SRC-B2B-MEETINGS', table:'b2b_meetings', sourceKind:'calendar', category:'meeting', entityType:'meeting', defaultEventType:'meeting.observed', idFields:['id','meeting_id'], timestampFields:['updated_at','scheduled_at','start_at','created_at'], labelFields:['title','subject','prospect_name'], statusFields:['status','outcome'] },
  { key:'b2b-proposals', sourceCode:'SRC-B2B-PROPOSALS', table:'b2b_proposals', sourceKind:'crm', category:'proposal', entityType:'proposal', defaultEventType:'proposal.observed', idFields:['id','proposal_id'], timestampFields:['updated_at','sent_at','created_at'], labelFields:['title','proposal_number','prospect_name'], statusFields:['status','stage'] },
  { key:'browser-opportunities', sourceCode:'SRC-BROWSER-OPPORTUNITIES', table:'browser_extension_b2b_opportunities', sourceKind:'browser-extension', category:'market-opportunity', entityType:'opportunity', defaultEventType:'opportunity.observed', idFields:['id','opportunity_id'], timestampFields:['updated_at','created_at'], labelFields:['name','title','account_name'], statusFields:['status','stage'] },
  { key:'revenue-prospects', sourceCode:'SRC-REVENUE-PROSPECTS', table:'revenue_prospects', sourceKind:'crm', category:'account-intent', entityType:'account', defaultEventType:'revenue.prospect.observed', idFields:['id'], timestampFields:['updated_at','created_at'], labelFields:['name','company_name','organization_name'], statusFields:['status','stage'] },
  { key:'revenue-appointments', sourceCode:'SRC-REVENUE-APPOINTMENTS', table:'revenue_appointments', sourceKind:'calendar', category:'meeting', entityType:'meeting', defaultEventType:'appointment.observed', idFields:['id'], timestampFields:['updated_at','scheduled_at','created_at'], labelFields:['title','subject'], statusFields:['status','outcome'] },
  { key:'revenue-partnerships', sourceCode:'SRC-REVENUE-PARTNERSHIPS', table:'revenue_partnerships', sourceKind:'crm', category:'renewal', entityType:'account', defaultEventType:'partnership.observed', idFields:['id'], timestampFields:['updated_at','created_at','renewal_at'], labelFields:['name','partner_name','organization_name'], statusFields:['status','stage'] },
  { key:'email-inbox', sourceCode:'SRC-EMAIL-INBOX', table:'email_os_core_inbox', sourceKind:'email', category:'engagement', entityType:'message', defaultEventType:'email.received', idFields:['id','message_id'], timestampFields:['received_at','date','created_at'], labelFields:['subject','from_name','from_address'], statusFields:['status','read_status'] },
  { key:'email-outbox', sourceCode:'SRC-EMAIL-OUTBOX', table:'email_os_core_outbox', sourceKind:'email', category:'execution', entityType:'message', defaultEventType:'email.outbound', idFields:['id','message_id'], timestampFields:['sent_at','updated_at','created_at'], labelFields:['subject','to_name','to_address'], statusFields:['status','delivery_status'] },
  { key:'training-sessions', sourceCode:'SRC-TRAINING-SESSIONS', table:'trn_sessions', sourceKind:'academy', category:'capacity', entityType:'training-session', defaultEventType:'training.session.observed', idFields:['id'], timestampFields:['updated_at','starts_at','created_at'], labelFields:['title','name','session_code'], statusFields:['status'] },
  { key:'academy-trainers', sourceCode:'SRC-ACADEMY-TRAINERS', table:'academy_trainers', sourceKind:'academy', category:'capacity', entityType:'trainer', defaultEventType:'trainer.capacity.observed', idFields:['id'], timestampFields:['updated_at','created_at'], labelFields:['full_name','name'], statusFields:['status','availability_status'] },
  { key:'invoices', sourceCode:'SRC-FINANCE-INVOICES', table:'angelcare360_invoices', sourceKind:'finance', category:'payment', entityType:'invoice', defaultEventType:'invoice.observed', idFields:['id','invoice_id'], timestampFields:['updated_at','due_date','created_at'], labelFields:['invoice_number','reference','customer_name'], statusFields:['status','payment_status'] },
  { key:'payments', sourceCode:'SRC-FINANCE-PAYMENTS', table:'angelcare360_payments', sourceKind:'finance', category:'payment', entityType:'payment', defaultEventType:'payment.observed', idFields:['id','payment_id'], timestampFields:['updated_at','paid_at','created_at'], labelFields:['reference','receipt_number'], statusFields:['status'] },
  { key:'complaints', sourceCode:'SRC-CUSTOMER-CLAIMS', table:'angelcare360_reclamations', sourceKind:'operations', category:'customer-risk', entityType:'complaint', defaultEventType:'complaint.observed', idFields:['id','reclamation_id'], timestampFields:['updated_at','created_at'], labelFields:['title','subject','reference'], statusFields:['status','severity'] },
]

export function getRevenueSignalAdapter(sourceCode: string) {
  return REVENUE_SIGNAL_ADAPTERS.find((adapter) => adapter.sourceCode === sourceCode)
}

export function sanitizeRevenueSignalPayload(input: Record<string, unknown>) {
  const redactions: string[] = []
  const sanitized: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(input)) {
    const normalized = key.toLowerCase()
    if (REVENUE_SIGNAL_SENSITIVE_FIELD_PATTERNS.some((pattern) => normalized.includes(pattern))) { redactions.push(key); continue }
    if (REVENUE_SIGNAL_MESSAGE_CONTENT_FIELDS.includes(normalized)) {
      redactions.push(key)
      const text = typeof value === 'string' ? value : ''
      sanitized[`${key}_summary`] = text ? `${text.slice(0, 120)}${text.length > 120 ? '…' : ''}` : '[contenu minimisé]'
      continue
    }
    if (typeof value === 'string' && value.length > 1200) sanitized[key] = `${value.slice(0, 1200)}…`
    else sanitized[key] = value
  }
  return { sanitized, redactions }
}

export function pickFirst(record: Record<string, unknown>, fields: string[]) {
  for (const field of fields) {
    const value = record[field]
    if (value !== undefined && value !== null && String(value).trim()) return String(value)
  }
  return undefined
}

export function createSignalDeduplicationKey(input: RevenueSignalIngestionInput) {
  const sourceRecord = input.sourceRecordId || pickFirst(input.payload, ['id','message_id','invoice_id','prospect_id']) || 'no-record'
  const occurred = input.occurredAt || pickFirst(input.payload, ['updated_at','created_at','received_at','sent_at','scheduled_at']) || 'no-time'
  const status = pickFirst(input.payload, ['status','stage','payment_status','delivery_status']) || 'no-status'
  return createHash('sha256').update(`${input.sourceCode}|${sourceRecord}|${input.eventType}|${occurred}|${status}`).digest('hex')
}

export function createSignalPayloadHash(payload: Record<string, unknown>) {
  return createHash('sha256').update(JSON.stringify(payload, Object.keys(payload).sort())).digest('hex')
}

export function assertAllowedSignalTable(table: string) {
  if (!REVENUE_SIGNAL_SOURCE_TABLE_ALLOWLIST.has(table)) throw new Error(`Revenue Signal source table not allowed: ${table}`)
}
