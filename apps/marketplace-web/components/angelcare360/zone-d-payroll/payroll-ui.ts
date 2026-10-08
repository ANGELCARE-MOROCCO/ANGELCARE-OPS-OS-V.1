export function money(value: number | null | undefined, currency = 'Dh') {
  const amount = Number(value || 0)
  return `${new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(amount)} ${currency}`
}

export function dateFr(value?: string | null) {
  if (!value) return '—'
  const source = /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T12:00:00` : value
  const date = new Date(source)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }).format(date)
}

export function payrollStatusLabel(value?: string | null) {
  switch (String(value || '').toLowerCase()) {
    case 'draft': return 'Brouillon'
    case 'planned': return 'Planifiée'
    case 'open': return 'Ouverte'
    case 'calculated': return 'Calculée'
    case 'pending_review': return 'À vérifier'
    case 'validated': return 'Validée'
    case 'approved': return 'Approuvée'
    case 'payment_pending': return 'Paiement à préparer'
    case 'pending': return 'En attente'
    case 'confirmed': return 'Paiement enregistré'
    case 'partial': return 'Paiement partiel'
    case 'paid': return 'Payée'
    case 'blocked': return 'Bloquée'
    case 'failed': return 'Échec'
    case 'cancelled': return 'Annulée'
    case 'closed': return 'Clôturée'
    case 'archived': return 'Archivée'
    case 'not_ready': return 'Non prête'
    case 'active': return 'Actif'
    default: return value ? String(value) : 'À vérifier'
  }
}

export function itemTypeLabel(value?: string | null) {
  switch (String(value || '').toLowerCase()) {
    case 'base_salary': return 'Rémunération de base'
    case 'bonus': return 'Prime'
    case 'deduction': return 'Retenue'
    case 'advance': return 'Avance'
    case 'adjustment': return 'Ajustement'
    case 'reimbursement': return 'Remboursement'
    case 'earning': return 'Gain'
    case 'allowance': return 'Allocation'
    default: return value ? String(value) : 'Élément'
  }
}

export function statusTone(value?: string | null) {
  const state = String(value || '').toLowerCase()
  if (['paid','validated','approved','closed','active','confirmed'].includes(state)) return 'green'
  if (['blocked','failed','cancelled'].includes(state)) return 'red'
  if (['pending_review','payment_pending','pending','partial','open','planned'].includes(state)) return 'amber'
  if (['adjustment'].includes(state)) return 'violet'
  return 'blue'
}

export function initials(name?: string | null) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean)
  return parts.length ? parts.slice(0, 2).map(part => part[0]?.toUpperCase()).join('') : 'RH'
}

export function currentDateInput() {
  return new Date().toISOString().slice(0, 10)
}
