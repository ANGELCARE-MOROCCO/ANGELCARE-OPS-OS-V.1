import {
  PACOJACO_DEFAULT_LEGAL_FOOTER,
  PACOJACO_DOCUMENT_STATUSES,
  PACOJACO_DOCUMENT_TYPES,
  type PacojacoClientDraft,
  type PacojacoDocumentStatus,
  type PacojacoDocumentInterventionDraft,
  type PacojacoDocumentType,
  type PacojacoDiscountType,
} from './types'
import { calculateDocumentTotals, normalizeDocumentItems, round2, safeNumber } from './calculations'

export function isUuid(value: unknown) {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
}

export function normalizeText(value: unknown, fallback: string | null = null) {
  const text = typeof value === 'string' ? value.trim() : value == null ? '' : String(value).trim()
  return text ? text : fallback
}

export function normalizeDocumentType(value: unknown, fallback: PacojacoDocumentType = 'invoice') {
  const text = String(value || '').trim().toLowerCase()
  if ((PACOJACO_DOCUMENT_TYPES as readonly string[]).includes(text)) return text as PacojacoDocumentType
  return fallback
}

export function normalizeDocumentStatus(value: unknown, fallback: PacojacoDocumentStatus = 'draft') {
  const text = String(value || '').trim().toLowerCase()
  if ((PACOJACO_DOCUMENT_STATUSES as readonly string[]).includes(text)) return text as PacojacoDocumentStatus
  return fallback
}

export function normalizeDiscountType(value: unknown): PacojacoDiscountType | null {
  const text = String(value || '').trim().toLowerCase()
  if (text === 'amount' || text === 'percent') return text
  return null
}

export function normalizeDate(value: unknown): string | null {
  if (!value) return null
  const text = typeof value === 'string' ? value.trim() : String(value).trim()
  if (!text) return null
  const date = new Date(text)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString().slice(0, 10)
}

function normalizeMaybeArray(value: unknown) {
  return Array.isArray(value) ? value : []
}

function blankIfEmpty(value: unknown) {
  const text = normalizeText(value, '')
  return text || ''
}

export function todayIsoDate() {
  return new Date().toISOString().slice(0, 10)
}

export function normalizePacojacoBody(body: any, fallbackType: PacojacoDocumentType = 'invoice') {
  const document_type = normalizeDocumentType(body?.document_type ?? body?.type, fallbackType)
  const issue_date = normalizeDate(body?.issue_date) || todayIsoDate()
  const due_date = normalizeDate(body?.due_date)
  const validity_date = normalizeDate(body?.validity_date)
  const payment_date = normalizeDate(body?.payment_date)
  const status = normalizeDocumentStatus(body?.status)
  const discount_type = normalizeDiscountType(body?.discount_type)
  const currency = normalizeText(body?.currency, 'MAD') || 'MAD'
  const legal_footer = normalizeText(body?.legal_footer, PACOJACO_DEFAULT_LEGAL_FOOTER) || PACOJACO_DEFAULT_LEGAL_FOOTER
  const items = normalizeDocumentItems(Array.isArray(body?.items) ? body.items : [])
  const client_id = isUuid(body?.client_id) ? String(body.client_id) : null
  const interventionRows = normalizePacojacoInterventions(body)

  const totals = calculateDocumentTotals({
    items,
    discountType: discount_type,
    discountValue: body?.discount_value,
    taxRate: body?.tax_rate,
    advanceAmount: body?.advance_amount,
  })

  const payload = {
    source: 'pacojaco_ops',
    version: 1,
    raw: typeof body === 'object' && body ? body : {},
  }

  return {
    document: {
      document_type,
      status,
      issue_date,
      due_date,
      validity_date,
      object: normalizeText(body?.object ?? body?.objet, null),
      client_id,
      client_name: normalizeText(body?.client_name, '') || '',
      client_company: normalizeText(body?.client_company ?? body?.company, null),
      client_ice: normalizeText(body?.client_ice ?? body?.ice, null),
      client_email: normalizeText(body?.client_email ?? body?.email, null),
      client_phone: normalizeText(body?.client_phone ?? body?.phone, null),
      client_address: normalizeText(body?.client_address ?? body?.address, null),
      child_name: normalizeText(body?.child_name, null),
      region: normalizeText(body?.region, null),
      zone: normalizeText(body?.zone, null),
      intervention_address: normalizeText(body?.intervention_address, null),
      contact_name: normalizeText(body?.contact_name, null),
      imm: normalizeText(body?.imm, null),
      service_dates_text: normalizeText(body?.service_dates_text, null),
      schedule_text: normalizeText(body?.schedule_text, null),
      payment_info: normalizeText(body?.payment_info, null),
      payment_method: normalizeText(body?.payment_method, null),
      payment_date,
      notes: normalizeText(body?.notes, null),
      conditions: normalizeText(body?.conditions, null),
      subtotal: totals.subtotal,
      discount_type,
      discount_value: round2(body?.discount_value),
      discount_total: totals.discount_total,
      tax_rate: round2(body?.tax_rate),
      tax_total: totals.tax_total,
      advance_amount: totals.advance_amount,
      remaining_amount: totals.remaining_amount,
      total_ttc: totals.total_ttc,
      currency,
      legal_footer,
      payload,
    },
    items,
    interventions: interventionRows,
  }
}

export function normalizePacojacoClientDraft(body: any): PacojacoClientDraft {
  return {
    id: isUuid(body?.id) ? String(body.id) : null,
    client_name: normalizeText(body?.client_name, '') || '',
    client_company: blankIfEmpty(body?.client_company ?? body?.company),
    client_ice: blankIfEmpty(body?.client_ice ?? body?.ice),
    client_email: blankIfEmpty(body?.client_email ?? body?.email),
    client_phone: blankIfEmpty(body?.client_phone ?? body?.phone),
    client_address: blankIfEmpty(body?.client_address ?? body?.address),
    contact_name: blankIfEmpty(body?.contact_name ?? body?.contact_person),
    child_name: blankIfEmpty(body?.child_name),
    region: blankIfEmpty(body?.region),
    zone: blankIfEmpty(body?.zone),
    default_intervention_address: blankIfEmpty(body?.default_intervention_address ?? body?.intervention_address),
    default_imm: blankIfEmpty(body?.default_imm ?? body?.imm),
    notes: blankIfEmpty(body?.notes),
  }
}

function normalizePacojacoInterventions(body: any): PacojacoDocumentInterventionDraft[] {
  const items = normalizeMaybeArray(body?.interventions)

  const normalized = items
    .map((item, index) => ({
      id: isUuid(item?.id) ? String(item.id) : crypto.randomUUID(),
      sort_order: Number.isFinite(Number(item?.sort_order)) ? Number(item.sort_order) : index,
      title: blankIfEmpty(item?.title ?? item?.name ?? item?.service_title),
      service_type: blankIfEmpty(item?.service_type ?? item?.type),
      region: blankIfEmpty(item?.region),
      zone: blankIfEmpty(item?.zone),
      address: blankIfEmpty(item?.address ?? item?.intervention_address),
      contact_name: blankIfEmpty(item?.contact_name),
      imm: blankIfEmpty(item?.imm),
      service_dates_text: blankIfEmpty(item?.service_dates_text ?? item?.service_dates),
      schedule_text: blankIfEmpty(item?.schedule_text ?? item?.schedule),
      notes: blankIfEmpty(item?.notes),
    }))
    .filter((item) => [item.title, item.service_type, item.region, item.zone, item.address, item.contact_name, item.imm, item.service_dates_text, item.schedule_text, item.notes].some(Boolean))
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((item, index) => ({ ...item, sort_order: index }))

  if (normalized.length) return normalized

  const legacy = {
    title: normalizeText(body?.intervention_title ?? body?.object, ''),
    service_type: normalizeText(body?.service_type, ''),
    region: normalizeText(body?.region, ''),
    zone: normalizeText(body?.zone, ''),
    address: normalizeText(body?.intervention_address, ''),
    contact_name: normalizeText(body?.contact_name, ''),
    imm: normalizeText(body?.imm, ''),
    service_dates_text: normalizeText(body?.service_dates_text, ''),
    schedule_text: normalizeText(body?.schedule_text, ''),
    notes: normalizeText(body?.notes, ''),
  }

  if (Object.values(legacy).some(Boolean)) {
    return [
      {
        id: crypto.randomUUID(),
        sort_order: 0,
        title: legacy.title || '',
        service_type: legacy.service_type || '',
        region: legacy.region || '',
        zone: legacy.zone || '',
        address: legacy.address || '',
        contact_name: legacy.contact_name || '',
        imm: legacy.imm || '',
        service_dates_text: legacy.service_dates_text || '',
        schedule_text: legacy.schedule_text || '',
        notes: legacy.notes || '',
      },
    ]
  }

  return []
}

export function ensureItemsHaveDesignation(items: Array<{ designation?: string }>) {
  return items.some((item) => String(item.designation || '').trim().length > 0)
}

export function buildPacojacoAuthorizationError() {
  return { ok: false as const, status: 403, message: 'PACOJACO OPS access is not available for this account.' }
}
