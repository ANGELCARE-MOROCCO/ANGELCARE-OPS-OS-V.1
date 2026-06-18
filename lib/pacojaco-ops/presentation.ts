import { calculateDocumentTotals, normalizeDocumentItems } from './calculations'
import { PACOJACO_DEFAULT_LEGAL_FOOTER, type PacojacoDocumentRow, type PacojacoPrintableDocument } from './types'

export const PACOJACO_COMPANY_NAME = 'ANGELCARE'
export const PACOJACO_COMPANY_EMAIL = 'BACKOFFICE@ANGELCAREHUB.COM'
export const PACOJACO_COMPANY_TEL = '0537581462'
export const PACOJACO_COMPANY_PLATFORM = 'WWW.ANGELCAREHUB.COM'

export const PACOJACO_COMPANY_BOX_ENTRIES: Array<[string, string]> = [
  ['Company', PACOJACO_COMPANY_NAME],
  ['Email', PACOJACO_COMPANY_EMAIL],
  ['Tel', PACOJACO_COMPANY_TEL],
  ['ONLINE PLATFORM', PACOJACO_COMPANY_PLATFORM],
  ['ICE', '003184429000053'],
  ['IF', '53237789'],
  ['TP', '20113706'],
  ['Address', '36 BIS RUE HAROUN ERRACHID KENITRA'],
]

export const PACOJACO_FOOTER_SIGNATURE_LINES = [
  'ANGELCARE',
  'OPERATIONS CENTER',
  'EXECUTIVE SESSIONS',
  'backoffice@gmail.com',
  '+212 537 581 462',
  PACOJACO_COMPANY_PLATFORM,
]

export type PacojacoInterventionDisplayRow = {
  title: string
  service_type: string
  schedule: string
  summary: string
}

type PacojacoInterventionSource = {
  title?: string | null
  service_type?: string | null
  service_dates_text?: string | null
  schedule_text?: string | null
} | null | undefined

type PacojacoInterventionFallback = {
  object?: string | null
  service_dates_text?: string | null
  schedule_text?: string | null
}

function cleanDisplayText(value: any, fallback = '—') {
  const text = value == null ? '' : String(value)
  const trimmed = text.trim()
  return trimmed || fallback
}

function hasInterventionContent(value: any) {
  return [
    value?.title,
    value?.service_type,
    value?.region,
    value?.zone,
    value?.address,
    value?.contact_name,
    value?.imm,
    value?.service_dates_text,
    value?.schedule_text,
    value?.notes,
  ].some((entry) => String(entry || '').trim().length > 0)
}

export function summarizePacojacoIntervention(
  intervention: PacojacoInterventionSource,
  index: number,
  fallback?: PacojacoInterventionFallback
): PacojacoInterventionDisplayRow {
  const title = cleanDisplayText(intervention?.title || fallback?.object || `Intervention ${index + 1}`)
  const serviceType = cleanDisplayText(intervention?.service_type || 'SVC')
  const schedule = cleanDisplayText(intervention?.schedule_text || intervention?.service_dates_text || fallback?.schedule_text || fallback?.service_dates_text)

  return {
    title,
    service_type: serviceType,
    schedule,
    summary: `${title} • ${serviceType} • ${schedule}`,
  }
}

export function buildPacojacoInterventionDisplayRows(
  document: {
    interventions?: PacojacoInterventionSource[]
    object?: string | null
    service_dates_text?: string | null
    schedule_text?: string | null
  }
): PacojacoInterventionDisplayRow[] {
  const interventions = (document.interventions || []).filter(hasInterventionContent)

  if (interventions.length) {
    return interventions.map((intervention, index) =>
      summarizePacojacoIntervention(intervention as any, index)
    )
  }

  return [
    summarizePacojacoIntervention(
      {
        title: document.object || null,
        service_type: 'SVC',
        service_dates_text: document.service_dates_text,
        schedule_text: document.schedule_text,
      },
      0,
      {
        object: document.object,
        service_dates_text: document.service_dates_text,
        schedule_text: document.schedule_text,
      }
    ),
  ]
}

export function getPacojacoDisplayedTotals(document: Pick<PacojacoPrintableDocument, 'subtotal' | 'discount_total' | 'advance_amount' | 'remaining_amount' | 'total_ttc'>) {
  return [
    ['Subtotal', document.subtotal],
    ['Discount', document.discount_total],
    ['Advance', document.advance_amount],
    ['Remaining', document.remaining_amount],
    ['Total TTC', document.total_ttc],
  ] as const
}

export function pacojacoDocumentDocumentLabel(documentType: PacojacoDocumentRow['document_type']) {
  return documentType === 'invoice' ? 'Invoice' : 'Quotation'
}

export function pacojacoDocumentPrintLabel(documentType: PacojacoDocumentRow['document_type']) {
  return documentType === 'invoice' ? 'FACTURE' : 'DEVIS'
}

export function buildPacojacoPrintableDocument(document: PacojacoDocumentRow): PacojacoPrintableDocument {
  const items = normalizeDocumentItems(
    (document.items || []).map((item) => ({
      id: item.id,
      sort_order: item.sort_order,
      ref: item.ref,
      designation: item.designation,
      description: item.description,
      category: item.category,
      unit_price: item.unit_price,
      quantity: item.quantity,
      unit: item.unit,
    }))
  )

  const totals = calculateDocumentTotals({
    items,
    discountType: document.discount_type || null,
    discountValue: document.discount_value,
    taxRate: document.tax_rate,
    advanceAmount: document.advance_amount,
  })

  return {
    document_type: document.document_type,
    document_number: document.document_number,
    status: document.status,
    issue_date: document.issue_date,
    due_date: document.due_date,
    validity_date: document.validity_date,
    object: document.object,
    client_name: document.client_name,
    client_company: document.client_company,
    client_ice: document.client_ice,
    client_email: document.client_email,
    client_phone: document.client_phone,
    region: document.region,
    zone: document.zone,
    intervention_address: document.intervention_address,
    contact_name: document.contact_name,
    imm: document.imm,
    service_dates_text: document.service_dates_text,
    schedule_text: document.schedule_text,
    payment_info: document.payment_info,
    payment_method: document.payment_method,
    payment_date: document.payment_date,
    notes: document.notes,
    conditions: document.conditions,
    subtotal: totals.subtotal,
    discount_total: totals.discount_total,
    tax_total: totals.tax_total,
    total_ttc: totals.total_ttc,
    advance_amount: totals.advance_amount,
    remaining_amount: totals.remaining_amount,
    currency: document.currency,
    legal_footer: document.legal_footer || PACOJACO_DEFAULT_LEGAL_FOOTER,
    items: items.map((item) => ({
      ref: item.ref,
      designation: item.designation,
      description: item.description,
      category: item.category,
      unit_price: item.unit_price,
      quantity: item.quantity,
      unit: item.unit,
      total: item.total,
    })),
    interventions: (document.interventions || [])
      .filter(hasInterventionContent)
      .map((item) => ({
        title: item.title,
        service_type: item.service_type,
        region: item.region,
        zone: item.zone,
        address: item.address,
        contact_name: item.contact_name,
        imm: item.imm,
        service_dates_text: item.service_dates_text,
        schedule_text: item.schedule_text,
        notes: item.notes,
      })),
  }
}
