export type HrAlertInput = {
  id?: string
  title?: string | null
  notes?: string | null
  priority?: string | null
  status?: string | null
  owner?: string | null
  created_at?: string | null
}

export function detectSlaStatus(action: HrAlertInput) {
  if (action.status === 'closed') return 'closed'
  if (action.priority === 'high') return 'urgent_review'
  if (!action.owner) return 'missing_owner'
  return 'monitor'
}

export function buildAlertMessage(action: HrAlertInput) {
  const title = action.title || 'HR action'
  const status = detectSlaStatus(action)

  if (status === 'urgent_review') return `Urgent HR review required: ${title}`
  if (status === 'missing_owner') return `Owner missing for HR action: ${title}`
  if (status === 'closed') return `Closed and archived: ${title}`

  return `Monitor HR action: ${title}`
}

export function getAlertSeverity(action: HrAlertInput) {
  const text = `${action.title || ''} ${action.notes || ''}`.toLowerCase()
  if (action.priority === 'high' || text.includes('urgent') || text.includes('incident')) return 'critical'
  if (!action.owner || text.includes('missing') || text.includes('document')) return 'high'
  return 'normal'
}

export function buildRealtimeQueue(actions: HrAlertInput[]) {
  return actions
    .filter((a) => a.status !== 'closed')
    .map((a) => ({
      ...a,
      alert_status: detectSlaStatus(a),
      alert_message: buildAlertMessage(a),
      alert_severity: getAlertSeverity(a),
    }))
    .sort((a, b) => {
      const order: Record<string, number> = { critical: 0, high: 1, normal: 2 }
      return (order[a.alert_severity] ?? 3) - (order[b.alert_severity] ?? 3)
    })
}
