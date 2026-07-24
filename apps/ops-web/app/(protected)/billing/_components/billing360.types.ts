export type BillingFamily = {
  family_name?: string | null
  parent_name?: string | null
  city?: string | null
  phone?: string | null
}

export type BillingContract = {
  id: string | number
  contract_reference?: string | null
  package_label?: string | null
  status?: string | null
  payment_status?: string | null
  contract_value?: number | string | null
  monthly_amount?: number | string | null
  amount_paid?: number | string | null
  service_type?: string | null
  billing_cycle?: string | null
  risk_level?: string | null
  family_id?: string | number | null
  created_at?: string | null
  next_billing_date?: string | null
  families?: BillingFamily | BillingFamily[] | null
}

export type BillingInvoice = {
  id: string | number
  contract_id?: string | number | null
  invoice_reference?: string | null
  invoice_label?: string | null
  amount?: number | string | null
  amount_paid?: number | string | null
  status?: string | null
  due_date?: string | null
  paid_at?: string | null
  created_at?: string | null
  updated_at?: string | null
  notes?: string | null
  mission_id?: string | number | null
}

export type BillingFinanceEvent = {
  id: string | number
  contract_id?: string | number | null
  event_type?: string | null
  amount?: number | string | null
  note?: string | null
  created_at?: string | null
  metadata?: unknown
}

export type BillingConsumption = {
  id: string | number
  contract_id?: string | number | null
  action_type?: string | null
  amount_value?: number | string | null
  units_used?: number | string | null
  notes?: string | null
  created_at?: string | null
  mission_id?: string | number | null
}

export type BillingMission = {
  id: string | number
  mission_code?: string | null
  status?: string | null
  service_type?: string | null
  mission_date?: string | null
  created_at?: string | null
}

export function familyFromContract(contract: BillingContract): BillingFamily | null {
  if (!contract.families) return null
  return Array.isArray(contract.families) ? contract.families[0] || null : contract.families
}

export function contractLabel(contract: BillingContract): string {
  return contract.contract_reference || contract.package_label || `Contrat #${contract.id}`
}

export function familyLabel(contract: BillingContract): string {
  const family = familyFromContract(contract)
  return family?.family_name || family?.parent_name || 'Famille non définie'
}

export function amount(value: unknown): number {
  const parsed = Number(value || 0)
  return Number.isFinite(parsed) ? parsed : 0
}

export function formatDh(value: unknown): string {
  return `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(amount(value))} Dh`
}

export function formatDate(value: unknown, withTime = false): string {
  if (!value) return '—'
  const parsed = new Date(String(value))
  if (Number.isNaN(parsed.getTime())) return '—'
  return new Intl.DateTimeFormat('fr-FR', withTime
    ? { dateStyle: 'medium', timeStyle: 'short' }
    : { dateStyle: 'medium' }).format(parsed)
}

export function normalizedStatus(value: unknown): string {
  return String(value || 'pending').trim().toLowerCase()
}

export function statusLabel(value: unknown): string {
  const status = normalizedStatus(value)
  const labels: Record<string, string> = {
    paid: 'Réglée',
    pending: 'En attente',
    partial: 'Partiellement réglée',
    overdue: 'En retard',
    cancelled: 'Annulée',
    active: 'Actif',
    signed: 'Signé',
    confirmed: 'Confirmé',
    draft: 'Brouillon',
  }
  return labels[status] || status.replaceAll('_', ' ')
}

export function isPaid(invoice: BillingInvoice): boolean {
  return normalizedStatus(invoice.status) === 'paid'
}

export function isOverdue(invoice: BillingInvoice, now = new Date()): boolean {
  if (isPaid(invoice) || normalizedStatus(invoice.status) === 'cancelled') return false
  if (normalizedStatus(invoice.status) === 'overdue') return true
  if (!invoice.due_date) return false
  const due = new Date(invoice.due_date)
  return !Number.isNaN(due.getTime()) && due.getTime() < startOfDay(now).getTime()
}

export function daysFromDue(invoice: BillingInvoice, now = new Date()): number | null {
  if (!invoice.due_date) return null
  const due = startOfDay(new Date(invoice.due_date))
  if (Number.isNaN(due.getTime())) return null
  return Math.floor((startOfDay(now).getTime() - due.getTime()) / 86_400_000)
}

export function agingLabel(invoice: BillingInvoice, now = new Date()): string {
  if (isPaid(invoice)) return 'Réglée'
  const days = daysFromDue(invoice, now)
  if (days === null) return 'Sans échéance'
  if (days < 0) return 'À venir'
  if (days === 0) return "Échéance aujourd’hui"
  if (days <= 7) return '1–7 jours de retard'
  if (days <= 30) return '8–30 jours de retard'
  return 'Plus de 30 jours'
}

export function eventLabel(value: unknown): string {
  const type = String(value || 'finance_event').trim().toLowerCase()
  const labels: Record<string, string> = {
    invoice_created: 'Facture créée',
    mission_invoice_generated: 'Facture générée depuis une mission',
    payment_received: 'Règlement enregistré',
    contract_consumption: 'Consommation contractuelle enregistrée',
    contract_session_consumed: 'Session contractuelle consommée',
    payment_status_updated: 'Statut financier mis à jour',
  }
  return labels[type] || type.replaceAll('_', ' ')
}

function startOfDay(value: Date): Date {
  const next = new Date(value)
  next.setHours(0, 0, 0, 0)
  return next
}
