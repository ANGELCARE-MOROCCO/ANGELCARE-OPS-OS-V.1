export type CustomerChapterId =
  | 'overview'
  | 'identity'
  | 'contacts'
  | 'institutions'
  | 'product'
  | 'commercial'
  | 'finance'
  | 'service'
  | 'renewal'
  | 'documents'

export type CustomerPortalKind =
  | 'edit-customer'
  | 'edit-contact'
  | 'intervention'
  | 'support-ticket'
  | 'confidential-note'
  | 'lifecycle'
  | 'archive'
  | 'evidence'
  | 'locked'

export type CustomerPortalState = {
  kind: CustomerPortalKind
  evidenceId?: string
  lockedTitle?: string
  lockedReason?: string
} | null

export const CUSTOMER_CHAPTERS: Array<{ id: CustomerChapterId; label: string; short: string }> = [
  { id: 'overview', label: 'Vue 360', short: 'Vue 360' },
  { id: 'identity', label: 'Identité & gouvernance', short: 'Identité' },
  { id: 'contacts', label: 'Contacts & influence', short: 'Contacts' },
  { id: 'institutions', label: 'Institutions', short: 'Institutions' },
  { id: 'product', label: 'Tenants & produit', short: 'Produit' },
  { id: 'commercial', label: 'Commercial & contrats', short: 'Commercial' },
  { id: 'finance', label: 'Finance', short: 'Finance' },
  { id: 'service', label: 'Service & expérience', short: 'Service' },
  { id: 'renewal', label: 'Renouvellement & expansion', short: 'Renouvellement' },
  { id: 'documents', label: 'Documents & audit', short: 'Audit' },
]
