import type { Angelcare360ClaimPriority, Angelcare360ClaimStatus, Angelcare360ClaimTicketRecord } from '@/types/angelcare360/communications'

export const CLAIM_STATUS_ORDER: Angelcare360ClaimStatus[] = [
  'new', 'in_review', 'assigned', 'waiting_parent', 'waiting_internal', 'resolved', 'closed', 'archived',
]

export const CLAIM_STATUS_LABELS: Record<Angelcare360ClaimStatus, string> = {
  new: 'Signal reçu',
  in_review: 'Compréhension',
  assigned: 'Responsabilité engagée',
  waiting_parent: 'En attente famille',
  waiting_internal: 'En attente interne',
  resolved: 'Résolution enregistrée',
  closed: 'Dossier clos',
  archived: 'Archivé',
}

export const CLAIM_PRIORITY_LABELS: Record<Angelcare360ClaimPriority, string> = {
  low: 'Faible',
  normal: 'Normale',
  high: 'Élevée',
  urgent: 'Urgente',
}

export function claimStatusLabel(value: unknown) {
  const key = String(value || '') as Angelcare360ClaimStatus
  return CLAIM_STATUS_LABELS[key] || String(value || 'Non défini')
}

export function claimPriorityLabel(value: unknown) {
  const key = String(value || '') as Angelcare360ClaimPriority
  return CLAIM_PRIORITY_LABELS[key] || String(value || 'Normale')
}

export function isClaimOpen(ticket: Pick<Angelcare360ClaimTicketRecord, 'status'>) {
  return !['closed', 'archived'].includes(String(ticket.status))
}

export function isClaimAtRisk(ticket: Pick<Angelcare360ClaimTicketRecord, 'status' | 'priority' | 'assigned_staff_id'>) {
  return isClaimOpen(ticket as Angelcare360ClaimTicketRecord) && (
    ['urgent', 'high'].includes(String(ticket.priority)) ||
    !ticket.assigned_staff_id ||
    ['waiting_parent', 'waiting_internal'].includes(String(ticket.status))
  )
}

export function formatClaimDate(value?: string | null, withTime = true) {
  if (!value) return 'Non documenté'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return new Intl.DateTimeFormat('fr-FR', withTime
    ? { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }
    : { day: '2-digit', month: 'short', year: 'numeric' }
  ).format(date)
}

export function claimAge(value?: string | null) {
  if (!value) return { label: 'Ancienneté inconnue', bucket: 'unknown' as const, hours: null }
  const timestamp = new Date(value).getTime()
  if (Number.isNaN(timestamp)) return { label: 'Ancienneté inconnue', bucket: 'unknown' as const, hours: null }
  const hours = Math.max(0, Math.floor((Date.now() - timestamp) / 3_600_000))
  if (hours < 1) return { label: 'Moins d’une heure', bucket: 'fresh' as const, hours }
  if (hours < 24) return { label: `${hours} h`, bucket: 'today' as const, hours }
  const days = Math.floor(hours / 24)
  if (days < 3) return { label: `${days} j`, bucket: 'recent' as const, hours }
  return { label: `${days} j`, bucket: 'aged' as const, hours }
}

export function compactIdentity(value?: string | null) {
  if (!value) return 'Identité protégée'
  if (value.length <= 22) return value
  return `${value.slice(0, 8)}…${value.slice(-6)}`
}

export function humanizeClaimAction(value?: string | null) {
  const map: Record<string, string> = {
    'claim.created': 'Signal enregistré',
    'claim.updated': 'Dossier mis à jour',
    'claim.assigned': 'Responsabilité attribuée',
    'claim.status_changed': 'Étape de traitement modifiée',
    'claim.resolved': 'Résolution certifiée',
    'claim.closed': 'Dossier clôturé',
  }
  return map[String(value || '')] || String(value || 'Événement')
}

export function normalizeClaimHistory(ticket: Angelcare360ClaimTicketRecord) {
  const status = Array.isArray(ticket.status_history_json) ? ticket.status_history_json : []
  const notes = Array.isArray(ticket.internal_notes_json) ? ticket.internal_notes_json : []
  const events: Array<{ id: string; kind: 'status' | 'note'; title: string; detail: string; at: string | null; actor: string | null }> = []

  status.forEach((entry, index) => {
    const row = entry || {}
    const state = String(row.status || row.state || '')
    events.push({
      id: `status-${index}-${String(row.changed_at || row.at || '')}`,
      kind: 'status',
      title: claimStatusLabel(state),
      detail: String(row.note || row.reason || 'Transition de dossier enregistrée.'),
      at: row.changed_at ? String(row.changed_at) : row.at ? String(row.at) : null,
      actor: row.changed_by ? String(row.changed_by) : row.actor ? String(row.actor) : null,
    })
  })

  notes.forEach((entry, index) => {
    const row = entry || {}
    events.push({
      id: `note-${index}-${String(row.created_at || row.at || '')}`,
      kind: 'note',
      title: 'Note interne protégée',
      detail: String(row.note || row.text || row.body || row.content || 'Note enregistrée.'),
      at: row.created_at ? String(row.created_at) : row.at ? String(row.at) : null,
      actor: row.created_by ? String(row.created_by) : row.actor ? String(row.actor) : null,
    })
  })

  if (!events.length) {
    events.push({
      id: `current-${ticket.id}`,
      kind: 'status',
      title: claimStatusLabel(ticket.status),
      detail: 'État courant du dossier. Aucun historique détaillé antérieur n’est persisté dans ce ticket.',
      at: ticket.created_at || null,
      actor: null,
    })
  }

  return events.sort((a, b) => {
    const aTime = a.at ? new Date(a.at).getTime() : 0
    const bTime = b.at ? new Date(b.at).getTime() : 0
    return aTime - bTime
  })
}

export function claimLifecycleProgress(status: string) {
  const map: Record<string, number> = {
    new: 10,
    in_review: 26,
    assigned: 44,
    waiting_parent: 58,
    waiting_internal: 58,
    resolved: 82,
    closed: 100,
    archived: 100,
  }
  return map[status] ?? 10
}
