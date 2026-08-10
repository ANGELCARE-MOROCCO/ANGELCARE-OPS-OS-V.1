export function attendanceLabel(value?: string | null) {
  switch (String(value || '').toLowerCase()) {
    case 'present': return 'Présent'
    case 'absent': return 'Absent'
    case 'late': return 'Retard'
    case 'excused': return 'Absence autorisée'
    case 'justified': return 'Justifiée'
    case 'pending_justification': return 'Justification attendue'
    case 'left_early': return 'Sortie anticipée'
    case 'unknown': return 'À vérifier'
    default: return value ? String(value) : 'À vérifier'
  }
}

export function justificationLabel(value?: string | null) {
  switch (String(value || '').toLowerCase()) {
    case 'pending': return 'À examiner'
    case 'accepted': return 'Validée'
    case 'rejected': return 'Refusée'
    case 'expired': return 'Expirée'
    case 'cancelled': return 'Annulée'
    default: return value ? String(value) : 'Non renseignée'
  }
}

export function sessionLabel(value?: string | null) {
  const v = String(value || '').toLowerCase()
  if (['closed','locked','completed'].includes(v)) return 'Clôturée'
  if (['open','partially_completed'].includes(v)) return 'En cours'
  if (v === 'draft') return 'À ouvrir'
  if (v === 'cancelled') return 'Annulée'
  return value ? String(value) : 'Non ouverte'
}

export function initials(name?: string | null) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return 'ÉL'
  return parts.slice(0,2).map((part) => part[0]?.toUpperCase()).join('')
}

export function dateFr(value?: string | null) {
  if (!value) return 'Date non renseignée'
  const source = /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T12:00:00` : value
  const date = new Date(source)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('fr-FR',{day:'2-digit',month:'short',year:'numeric'}).format(date)
}

export function timeFr(value?: string | null) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value.slice(0,5)
  return new Intl.DateTimeFormat('fr-FR',{hour:'2-digit',minute:'2-digit'}).format(date)
}

export function statusTone(value?: string | null) {
  const v = String(value || '').toLowerCase()
  if (['present','accepted','closed','locked','completed','justified','excused'].includes(v)) return 'green'
  if (['absent','rejected','missing','critical'].includes(v)) return 'red'
  if (['late','pending','pending_justification','left_early','warning','partially_completed'].includes(v)) return 'amber'
  return 'blue'
}
