import type { EnterpriseObjectKind } from './types'

const PREFIX: Record<EnterpriseObjectKind, string> = {
  customer: 'CUS',
  family: 'FAM',
  order: 'ORD',
  payment: 'PAY',
  invoice: 'INV',
  receipt: 'RCP',
  booking: 'BKG',
  subscription: 'SUB',
  catalog_item: 'PRD',
  provider: 'PRV',
  vendor: 'VND',
  supplier: 'SUP',
  inquiry: 'INQ',
  crm_lead: 'LED',
  crm_opportunity: 'OPP',
  crm_quote: 'QTE',
}

const PHASE_CODES: Record<string, string> = {
  registered: 'REG',
  awaiting_customer: 'CUS',
  awaiting_angelcare: 'ACR',
  qualified: 'QLF',
  scheduled: 'SCH',
  in_preparation: 'PREP',
  in_progress: 'EXEC',
  completed: 'DONE',
  blocked: 'BLK',
  recovery: 'RCV',
  cancelled: 'CAN',
  payment: 'PAY',
  fulfillment: 'FUL',
  refund: 'RFD',
  invoice: 'INV',
  receipt: 'RCP',
}

function cleanReference(value: unknown): string {
  return String(value || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(-12)
}

function dateCode(value?: string | Date | null): string {
  const date = value ? new Date(value) : new Date()
  if (Number.isNaN(date.getTime())) return new Date().toISOString().slice(2, 10).replaceAll('-', '')
  return date.toISOString().slice(2, 10).replaceAll('-', '')
}

export function enterpriseReference(input: {
  kind: EnterpriseObjectKind
  publicReference?: string | null
  id?: string | null
  territoryCode?: string | null
  createdAt?: string | Date | null
}): string {
  const prefix = PREFIX[input.kind]
  const territory = String(input.territoryCode || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 5)
  const token = cleanReference(input.publicReference || input.id || '') || 'PENDING'
  const time = dateCode(input.createdAt)
  return ['AC', prefix, territory || null, time, token].filter(Boolean).join('-')
}

export function orderPhaseReference(input: {
  orderReference: string
  phase: string
  ordinal?: number
}): string {
  const phase = PHASE_CODES[input.phase] || input.phase.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6) || 'PHASE'
  const token = cleanReference(input.orderReference).slice(-10) || 'ORDER'
  const ordinal = Math.max(1, Number(input.ordinal || 1)).toString().padStart(2, '0')
  return `AC-${phase}-${token}-${ordinal}`
}

export function referenceLabel(kind: EnterpriseObjectKind): string {
  const labels: Record<EnterpriseObjectKind, string> = {
    customer: 'Client', family: 'Famille', order: 'Commande', payment: 'Paiement', invoice: 'Facture', receipt: 'Reçu',
    booking: 'Réservation', subscription: 'Abonnement', catalog_item: 'Produit / service', provider: 'Provider', vendor: 'Vendor',
    supplier: 'Supplier', inquiry: 'Inquiry', crm_lead: 'Lead', crm_opportunity: 'Opportunity', crm_quote: 'Quote',
  }
  return labels[kind]
}
