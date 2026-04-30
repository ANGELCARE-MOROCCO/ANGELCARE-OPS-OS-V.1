export type SignalLevel = 'critical' | 'at_risk' | 'on_track'

export function getSignalVisual(level?: string) {
  if (level === 'critical') return { icon: '🔴', label: 'CRITICAL', color: '#dc2626', bg: '#fee2e2', border: '#fecaca' }
  if (level === 'at_risk') return { icon: '🟡', label: 'AT RISK', color: '#d97706', bg: '#fef3c7', border: '#fde68a' }
  return { icon: '🟢', label: 'ON TRACK', color: '#16a34a', bg: '#dcfce7', border: '#86efac' }
}

export function calculateTaskSignal(task: any) {
  if (task.status === 'completed') return { level: 'on_track' as SignalLevel, score: 10, reason: 'Task completed.', action: 'No immediate action required.' }

  const dueRaw = task.due_at || task.planned_end_at
  const priority = String(task.priority || 'medium')
  const priorityBoost = priority === 'critical' ? 35 : priority === 'high' ? 25 : priority === 'medium' ? 12 : 5

  if (!dueRaw) return { level: 'at_risk' as SignalLevel, score: 55 + priorityBoost, reason: 'No deadline defined.', action: 'Set deadline and owner.' }

  const hours = (new Date(dueRaw).getTime() - Date.now()) / 36e5
  if (hours < 0) return { level: 'critical' as SignalLevel, score: Math.min(100, 85 + priorityBoost), reason: 'Task is overdue.', action: 'Resolve or escalate now.' }
  if (hours <= 24) return { level: 'at_risk' as SignalLevel, score: Math.min(90, 60 + priorityBoost), reason: 'Task is due within 24 hours.', action: 'Execute today.' }

  return { level: 'on_track' as SignalLevel, score: Math.min(70, 25 + priorityBoost), reason: 'Task is inside planned timing.', action: 'Continue execution.' }
}

export function calculateProspectSignal(prospect: any) {
  const value = Number(prospect.estimated_value || 0)
  const hasNext = Boolean(prospect.next_action || prospect.next_action_at)
  const last = prospect.last_interaction_at || prospect.updated_at || prospect.created_at
  const hoursSince = last ? (Date.now() - new Date(last).getTime()) / 36e5 : 999
  const valueBoost = value >= 10000 ? 25 : value >= 5000 ? 15 : 5

  if (!hasNext) return { level: 'critical' as SignalLevel, score: Math.min(100, 78 + valueBoost), reason: 'Prospect has no next action.', action: 'Define next action and create follow-up task.' }
  if (hoursSince >= 72 && value >= 5000) return { level: 'critical' as SignalLevel, score: Math.min(100, 82 + valueBoost), reason: 'High-value prospect inactive for more than 72h.', action: 'Call now and log outcome.' }
  if (hoursSince >= 48) return { level: 'at_risk' as SignalLevel, score: Math.min(90, 62 + valueBoost), reason: 'Prospect has been inactive for 48h+.', action: 'Send follow-up and update next step.' }

  return { level: 'on_track' as SignalLevel, score: 35 + valueBoost, reason: 'Prospect has recent activity or next action.', action: 'Continue planned follow-up.' }
}

export function formatDate(date?: string | null) {
  if (!date) return '—'
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(date))
}
