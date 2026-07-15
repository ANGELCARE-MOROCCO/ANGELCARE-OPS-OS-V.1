export const PACOJACO_DOCUMENT_TYPES = ['invoice', 'quote'] as const
export type PacojacoDocumentType = (typeof PACOJACO_DOCUMENT_TYPES)[number]

export const PACOJACO_DOCUMENT_STATUSES = [
  'draft',
  'issued',
  'sent',
  'accepted',
  'rejected',
  'paid',
  'partially_paid',
  'cancelled',
] as const
export type PacojacoDocumentStatus = (typeof PACOJACO_DOCUMENT_STATUSES)[number]

export const PACOJACO_DISCOUNT_TYPES = ['amount', 'percent'] as const
export type PacojacoDiscountType = (typeof PACOJACO_DISCOUNT_TYPES)[number]

export type PacojacoClient = {
  id: string
  client_name: string
  client_company: string | null
  client_ice: string | null
  client_email: string | null
  client_phone: string | null
  client_address: string | null
  contact_name: string | null
  child_name: string | null
  region: string | null
  zone: string | null
  default_intervention_address: string | null
  default_imm: string | null
  notes: string | null
  payload: Record<string, any>
  created_by: string | null
  created_at: string
  updated_at: string
}

export type PacojacoClientDraft = {
  id?: string | null
  client_name: string
  client_company: string
  client_ice: string
  client_email: string
  client_phone: string
  client_address: string
  contact_name: string
  child_name: string
  region: string
  zone: string
  default_intervention_address: string
  default_imm: string
  notes: string
}

export type PacojacoDocumentIntervention = {
  id: string
  document_id: string
  sort_order: number
  title: string | null
  service_type: string | null
  region: string | null
  zone: string | null
  address: string | null
  contact_name: string | null
  imm: string | null
  service_dates_text: string | null
  schedule_text: string | null
  notes: string | null
  payload: Record<string, any>
  created_at: string
}

export type PacojacoDocumentInterventionDraft = {
  id: string
  sort_order: number
  title: string
  service_type: string
  region: string
  zone: string
  address: string
  contact_name: string
  imm: string
  service_dates_text: string
  schedule_text: string
  notes: string
}

export type PacojacoDocumentItem = {
  id: string
  document_id?: string | null
  sort_order: number
  ref: string | null
  designation: string
  description: string | null
  category: string | null
  unit_price: number
  quantity: number
  unit: string | null
  total: number
  created_at?: string
}

export type PacojacoDocumentEvent = {
  id: string
  document_id: string | null
  event_type: string
  actor_email: string | null
  message: string | null
  payload: Record<string, any>
  created_at: string
}

export type PacojacoDocumentDispatch = {
  id: string
  document_id: string | null
  channel: 'email' | 'whatsapp' | 'download' | 'print'
  recipient: string | null
  status: string
  message: string | null
  error: string | null
  payload: Record<string, any>
  created_by: string | null
  created_at: string
}

export type PacojacoDocumentRow = {
  id: string
  document_type: PacojacoDocumentType
  document_number: string
  status: PacojacoDocumentStatus
  issue_date: string
  due_date: string | null
  validity_date: string | null
  object: string | null
  client_id: string | null
  client_name: string
  client_company: string | null
  client_ice: string | null
  client_email: string | null
  client_phone: string | null
  client_address: string | null
  child_name: string | null
  region: string | null
  zone: string | null
  intervention_address: string | null
  contact_name: string | null
  imm: string | null
  service_dates_text: string | null
  schedule_text: string | null
  payment_info: string | null
  payment_method: string | null
  payment_date: string | null
  notes: string | null
  conditions: string | null
  subtotal: number
  discount_type: PacojacoDiscountType | null
  discount_value: number
  discount_total: number
  tax_rate: number
  tax_total: number
  advance_amount: number
  remaining_amount: number
  total_ttc: number
  currency: string
  legal_footer: string | null
  payload: Record<string, any>
  created_by: string | null
  created_at: string
  updated_at: string
  items?: PacojacoDocumentItem[]
  events?: PacojacoDocumentEvent[]
  dispatches?: PacojacoDocumentDispatch[]
  interventions?: PacojacoDocumentIntervention[]
  client?: PacojacoClient | null
}

export type PacojacoDocumentStats = {
  totalDocuments: number
  totalInvoices: number
  totalQuotes: number
  totalClients: number
  documentsLinkedToClients: number
  draftDocuments: number
  issuedDocuments: number
  sentDocuments: number
  acceptedDocuments: number
  rejectedDocuments: number
  paidDocuments: number
  partiallyPaidDocuments: number
  cancelledDocuments: number
  totalBilledMad: number
  totalRemainingMad: number
  thisMonthBilledMad: number
}

export const PACOJACO_DEFAULT_LEGAL_FOOTER =
  'AUTO ENTREPRENEUR: PAMELA JACOSALEM PACUMBA * CNIE: AD01324J * 36 BIS RUE HAROUN ERRACHID KENITRA * ANNEXE TEMARA: QUARTIER ALAWYN RUE KUWAIT N°13 1ER ETAGE N°3 CENTRE VILLE TEMARA * ICE: 003184429000053 * IF: 53237789 * TP:20113706 * angelcare.official@gmail.com * +212 7 20 33 15 06'

export type PacojacoDocumentItemDraft = {
  id: string
  client_id: string
  sort_order: number
  ref: string
  designation: string
  description: string
  category: string
  unit_price: string
  quantity: string
  unit: string
}

export type PacojacoDocumentFormState = {
  id?: string | null
  document_type: PacojacoDocumentType
  document_number: string
  status: PacojacoDocumentStatus
  issue_date: string
  due_date: string
  validity_date: string
  object: string
  client_id: string
  client_name: string
  client_company: string
  client_ice: string
  client_email: string
  client_phone: string
  client_address: string
  child_name: string
  region: string
  zone: string
  intervention_address: string
  contact_name: string
  imm: string
  service_dates_text: string
  schedule_text: string
  payment_info: string
  payment_method: string
  payment_date: string
  notes: string
  conditions: string
  discount_type: PacojacoDiscountType | ''
  discount_value: string
  tax_rate: string
  advance_amount: string
  currency: string
  legal_footer: string
  items: PacojacoDocumentItemDraft[]
  interventions: PacojacoDocumentInterventionDraft[]
}

export type PacojacoDocumentComputedTotals = {
  subtotal: number
  discount_total: number
  tax_total: number
  total_ttc: number
  remaining_amount: number
  advance_amount: number
  taxable_base: number
}

export type PacojacoPrintableDocument = {
  document_type: PacojacoDocumentType
  document_number: string
  status: PacojacoDocumentStatus
  issue_date: string
  due_date: string | null
  validity_date: string | null
  object: string | null
  client_name: string
  client_company: string | null
  client_ice: string | null
  client_email: string | null
  client_phone: string | null
  region: string | null
  zone: string | null
  intervention_address: string | null
  contact_name: string | null
  imm: string | null
  service_dates_text: string | null
  schedule_text: string | null
  payment_info: string | null
  payment_method: string | null
  payment_date: string | null
  notes: string | null
  conditions: string | null
  subtotal: number
  discount_total: number
  tax_total: number
  total_ttc: number
  advance_amount: number
  remaining_amount: number
  currency: string
  legal_footer: string | null
  items: Array<{
    ref: string | null
    designation: string
    description: string | null
    category: string | null
    unit_price: number
    quantity: number
    unit: string | null
    total: number
  }>
  interventions: Array<{
    title: string | null
    service_type: string | null
    region: string | null
    zone: string | null
    address: string | null
    contact_name: string | null
    imm: string | null
    service_dates_text: string | null
    schedule_text: string | null
    notes: string | null
  }>
}
