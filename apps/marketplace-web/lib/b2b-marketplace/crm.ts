import { createClient } from '@/lib/supabase/server'
import { isSupabaseServerConfigured } from '@/lib/supabase/env'

import { QUOTE_CRM_STATUS_LABELS, QUOTE_CRM_STATUSES, type QuoteCRMStatus } from './crm-constants'

export { QUOTE_CRM_STATUS_LABELS, QUOTE_CRM_STATUSES }
export type { QuoteCRMStatus }

type DbRow = Record<string, any>

export type QuoteCRMLine = {
  id: string
  quoteRequestId: string
  itemType: string
  referenceCode: string
  title: string
  description: string
  quantity: number
  unitPriceMad: number
  totalMad: number
  estimatedUnitPriceMad: number
  personalizationNotes: string
  sourcePage?: string
  itemSlug?: string
  raw?: DbRow
}

export type QuoteCRMRequest = {
  id: string
  quoteReference: string
  requestRef: string
  schoolName: string
  contactName: string
  phone: string
  email: string
  city: string
  message: string
  status: QuoteCRMStatus
  priority: 'low' | 'normal' | 'high' | 'urgent'
  requestType: string
  source: string
  sourcePage: string
  originUrl: string
  assignedTo: string
  assignedName: string
  nextAction: string
  followUpAt: string
  estimatedTotalMad: number
  createdAt: string
  updatedAt: string
  lastContactedAt: string
  archivedAt: string
  lostReason: string
  internalSummary: string
  devisTerms: string
  commercialNotes: string
  discountMad: number
  devisValidUntil: string
  linesCount?: number
  raw?: DbRow
}

export type QuoteCRMNote = { id: string; quoteRequestId: string; note: string; noteType: string; createdBy: string; createdByName: string; createdAt: string }
export type QuoteCRMStatusHistory = { id: string; quoteRequestId: string; fromStatus: string; toStatus: string; changedBy: string; changedByName: string; note: string; createdAt: string }
export type QuoteCRMActivity = { id: string; quoteRequestId: string; activityType: string; title: string; description: string; actorUserId: string; actorName: string; createdAt: string; metadata?: DbRow }
export type QuoteCRMDossier = { request: QuoteCRMRequest; lines: QuoteCRMLine[]; notes: QuoteCRMNote[]; statusHistory: QuoteCRMStatusHistory[]; activities: QuoteCRMActivity[] }

function str(value: unknown, fallback = ''): string {
  return value === null || value === undefined ? fallback : String(value)
}

function numberFrom(value: unknown, fallback = 0): number {
  if (value === null || value === undefined || value === '') return fallback
  if (typeof value === 'number') return Number.isFinite(value) ? value : fallback
  const cleaned = String(value).replace(/\u00a0/g, ' ').replace(/MAD|DH/gi, '').replace(/[^\d,.-]/g, '').replace(/\s+/g, '').replace(',', '.')
  const parsed = Number(cleaned)
  return Number.isFinite(parsed) ? parsed : fallback
}

function first(row: DbRow, keys: string[], fallback = ''): string {
  for (const key of keys) {
    const value = row?.[key]
    if (value !== undefined && value !== null && value !== '') return String(value)
  }
  return fallback
}

function firstNum(row: DbRow, keys: string[], fallback = 0): number {
  for (const key of keys) {
    const parsed = numberFrom(row?.[key], NaN)
    if (Number.isFinite(parsed) && parsed > 0) return parsed
  }
  return fallback
}

export function normalizeQuoteStatus(value: unknown): QuoteCRMStatus {
  const v = str(value, 'new_request')
  if ((QUOTE_CRM_STATUSES as string[]).includes(v)) return v as QuoteCRMStatus
  if (v === 'new') return 'new_request'
  if (v === 'to_qualify') return 'to_qualify'
  return 'new_request'
}

function normalizePriority(value: unknown): QuoteCRMRequest['priority'] {
  const v = str(value, 'normal')
  return (['low', 'normal', 'high', 'urgent'].includes(v) ? v : 'normal') as QuoteCRMRequest['priority']
}

function mapRequest(row: DbRow): QuoteCRMRequest {
  return {
    id: str(row.id),
    quoteReference: first(row, ['quote_reference', 'request_ref', 'reference_code', 'devis_reference', 'id']),
    requestRef: first(row, ['request_ref', 'quote_reference', 'reference_code', 'id']),
    schoolName: first(row, ['school_name', 'organization_name', 'creche_name', 'establishment_name', 'customer_name', 'title'], 'Établissement à confirmer'),
    contactName: first(row, ['contact_name', 'contact_person', 'customer_contact', 'full_name'], 'Contact à confirmer'),
    phone: first(row, ['phone', 'telephone', 'contact_phone', 'customer_phone', 'mobile', 'whatsapp']),
    email: first(row, ['email', 'contact_email', 'customer_email']),
    city: first(row, ['city', 'ville']),
    message: first(row, ['message', 'customer_message', 'notes', 'description']),
    status: normalizeQuoteStatus(row.status),
    priority: normalizePriority(row.priority),
    requestType: first(row, ['request_type', 'type'], 'quote_cart'),
    source: first(row, ['source', 'request_source', 'origin'], 'public_marketplace'),
    sourcePage: first(row, ['source_page', 'sourcePage']),
    originUrl: first(row, ['origin_url', 'originUrl']),
    assignedTo: first(row, ['assigned_to', 'assignedTo']),
    assignedName: first(row, ['assigned_name', 'assignedName']),
    nextAction: first(row, ['next_action', 'nextAction']),
    followUpAt: first(row, ['follow_up_at', 'followUpAt']),
    estimatedTotalMad: firstNum(row, ['estimated_total_mad', 'total_mad', 'quote_total_mad', 'amount_mad', 'total']),
    createdAt: str(row.created_at),
    updatedAt: str(row.updated_at),
    lastContactedAt: str(row.last_contacted_at),
    archivedAt: str(row.archived_at),
    lostReason: str(row.lost_reason),
    internalSummary: str(row.internal_summary),
    devisTerms: str(row.devis_terms),
    commercialNotes: str(row.commercial_notes),
    discountMad: numberFrom(row.discount_mad),
    devisValidUntil: str(row.devis_valid_until),
    linesCount: row.lines_count === undefined ? undefined : numberFrom(row.lines_count),
    raw: row,
  }
}

function mapLine(row: DbRow): QuoteCRMLine {
  const quantity = firstNum(row, ['quantity', 'qty', 'qte'], 1) || 1
  const unitPrice = firstNum(row, ['unit_price_mad', 'estimated_unit_price_mad', 'catalogue_unit_price_mad', 'price_mad', 'unit_price', 'estimated_unit_price', 'price'])
  const totalDirect = firstNum(row, ['total_mad', 'estimated_total_mad', 'line_total_mad', 'subtotal_mad', 'amount_mad', 'total', 'subtotal'])
  const total = totalDirect > 0 ? totalDirect : quantity * unitPrice
  return {
    id: str(row.id),
    quoteRequestId: str(row.quote_request_id),
    itemType: first(row, ['item_type', 'type'], 'catalogue'),
    referenceCode: first(row, ['reference_code', 'item_reference', 'item_ref', 'product_ref', 'training_ref', 'ref'], '—'),
    title: first(row, ['title', 'item_title', 'product_title', 'training_title', 'name', 'designation'], 'Ligne devis'),
    description: first(row, ['description', 'details', 'notes', 'personalization_notes']),
    quantity,
    unitPriceMad: unitPrice,
    totalMad: total,
    estimatedUnitPriceMad: unitPrice,
    personalizationNotes: str(row.personalization_notes),
    sourcePage: str(row.source_page),
    itemSlug: str(row.item_slug),
    raw: row,
  }
}

function mapNote(row: DbRow): QuoteCRMNote { return { id: str(row.id), quoteRequestId: str(row.quote_request_id), note: str(row.note), noteType: str(row.note_type, 'internal'), createdBy: str(row.created_by), createdByName: str(row.created_by_name), createdAt: str(row.created_at) } }
function mapStatus(row: DbRow): QuoteCRMStatusHistory { return { id: str(row.id), quoteRequestId: str(row.quote_request_id), fromStatus: str(row.from_status), toStatus: str(row.to_status), changedBy: str(row.changed_by), changedByName: str(row.changed_by_name), note: str(row.note), createdAt: str(row.created_at) } }
function mapActivity(row: DbRow): QuoteCRMActivity { return { id: str(row.id), quoteRequestId: str(row.quote_request_id), activityType: str(row.activity_type), title: str(row.title), description: str(row.description), actorUserId: str(row.actor_user_id), actorName: str(row.actor_name), createdAt: str(row.created_at), metadata: row.metadata || {} } }

export function canonicalDossierPayload(dossier: QuoteCRMDossier) {
  return {
    request: dossier.request,
    lines: dossier.lines,
    notes: dossier.notes,
    statusHistory: dossier.statusHistory,
    activities: dossier.activities,
    quoteRequest: dossier.request,
    quoteLines: dossier.lines,
  }
}

export async function listQuoteRequests(filters?: { status?: string; source?: string; city?: string; priority?: string; assigned?: string; search?: string }) {
  if (!isSupabaseServerConfigured()) return [] as QuoteCRMRequest[]
  const supabase = await createClient()
  let query = supabase.from('b2b_marketplace_quote_requests').select('*').order('created_at', { ascending: false })
  if (filters?.status && filters.status !== 'all') query = query.eq('status', filters.status)
  if (filters?.source && filters.source !== 'all') query = query.eq('source', filters.source)
  if (filters?.priority && filters.priority !== 'all') query = query.eq('priority', filters.priority)
  if (filters?.city) query = query.ilike('city', `%${filters.city}%`)
  if (filters?.assigned) query = query.ilike('assigned_name', `%${filters.assigned}%`)
  if (filters?.search) {
    const q = `%${filters.search}%`
    query = query.or(`quote_reference.ilike.${q},school_name.ilike.${q},contact_name.ilike.${q},phone.ilike.${q},email.ilike.${q},city.ilike.${q}`)
  }
  const { data, error } = await query
  if (error) throw error
  return (data || []).map(mapRequest)
}

export async function getQuoteDossier(idOrReference: string): Promise<QuoteCRMDossier | null> {
  if (!isSupabaseServerConfigured()) return null
  const supabase = await createClient()
  const uuidLike = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrReference)
  const query = supabase.from('b2b_marketplace_quote_requests').select('*')
  const { data: requestRow, error } = uuidLike ? await query.eq('id', idOrReference).maybeSingle() : await query.eq('quote_reference', idOrReference).maybeSingle()
  if (error) throw error
  if (!requestRow) return null
  const request = mapRequest(requestRow)
  const [linesRes, notesRes, statusRes, activitiesRes] = await Promise.all([
    supabase.from('b2b_marketplace_quote_lines').select('*').eq('quote_request_id', request.id).order('line_order', { ascending: true }).order('created_at', { ascending: true }),
    supabase.from('b2b_marketplace_quote_notes').select('*').eq('quote_request_id', request.id).order('created_at', { ascending: false }),
    supabase.from('b2b_marketplace_quote_status_history').select('*').eq('quote_request_id', request.id).order('created_at', { ascending: false }),
    supabase.from('b2b_marketplace_quote_activity_logs').select('*').eq('quote_request_id', request.id).order('created_at', { ascending: false }),
  ])
  if (linesRes.error) throw linesRes.error
  if (notesRes.error) throw notesRes.error
  if (statusRes.error) throw statusRes.error
  if (activitiesRes.error) throw activitiesRes.error
  const lines = (linesRes.data || []).map(mapLine)
  const totalFromLines = lines.reduce((sum, line) => sum + line.totalMad, 0)
  const normalizedRequest = totalFromLines > 0 ? { ...request, estimatedTotalMad: totalFromLines } : request
  return { request: normalizedRequest, lines, notes: (notesRes.data || []).map(mapNote), statusHistory: (statusRes.data || []).map(mapStatus), activities: (activitiesRes.data || []).map(mapActivity) }
}

export async function getQuoteCRMStats() {
  const requests = await listQuoteRequests()
  const total = requests.length
  const open = requests.filter((r) => !['accepted', 'lost', 'archived'].includes(r.status)).length
  const accepted = requests.filter((r) => r.status === 'accepted').length
  const urgent = requests.filter((r) => r.priority === 'urgent' || r.priority === 'high').length
  const estimated = requests.reduce((sum, r) => sum + r.estimatedTotalMad, 0)
  const byStatus = QUOTE_CRM_STATUSES.map((status) => ({ status, label: QUOTE_CRM_STATUS_LABELS[status], count: requests.filter((r) => r.status === status).length }))
  return { total, open, accepted, urgent, estimated, byStatus }
}
