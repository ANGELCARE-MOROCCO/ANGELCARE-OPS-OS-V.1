export type NotificationCandidate = {
  recipient_user_id?: string | null
  notification_type: string
  severity: 'info' | 'warning' | 'critical' | 'success'
  impact_score: number
  title: string
  message?: string
  related_type?: string
  related_id?: string
  action_url?: string
  action_label?: string
  source?: string
  expires_at?: string | null
}

function dueInHours(hours: number) {
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString()
}

function hoursSince(date?: string | null) {
  if (!date) return 9999
  return (Date.now() - new Date(date).getTime()) / 36e5
}

export function notificationTone(severity?: string | null) {
  if (severity === 'critical') return '#dc2626'
  if (severity === 'warning') return '#d97706'
  if (severity === 'success') return '#16a34a'
  return '#2563eb'
}

export function buildNotificationCandidates({
  tasks = [],
  prospects = [],
  followups = [],
  insights = [],
  interventions = [],
  activationEvents = [],
}: {
  tasks?: any[]
  prospects?: any[]
  followups?: any[]
  insights?: any[]
  interventions?: any[]
  activationEvents?: any[]
}) {
  const now = new Date().toISOString()
  const items: NotificationCandidate[] = []

  for (const task of tasks) {
    const due = task.due_at || task.planned_end_at
    if (task.status !== 'completed' && due && due < now) {
      const lateHours = Math.round(hoursSince(due))
      items.push({
        recipient_user_id: task.assigned_to || task.owner_id || null,
        notification_type: 'task_overdue',
        severity: lateHours >= 48 ? 'critical' : 'warning',
        impact_score: Math.min(100, 60 + lateHours),
        title: 'Overdue revenue task',
        message: `${task.title || 'Task'} is overdue by ${lateHours}h and requires action.`,
        related_type: 'task',
        related_id: task.id,
        action_url: `/revenue-command-center/tasks/${task.id}`,
        action_label: 'Open Task',
        source: 'task_engine',
        expires_at: dueInHours(72),
      })
    }

    if (task.blocker && task.status !== 'completed') {
      items.push({
        recipient_user_id: task.assigned_to || task.owner_id || null,
        notification_type: 'task_blocked',
        severity: 'critical',
        impact_score: 88,
        title: 'Blocked task requires intervention',
        message: `${task.title || 'Task'} has a blocker: ${task.blocker}`,
        related_type: 'task',
        related_id: task.id,
        action_url: `/revenue-command-center/tasks/${task.id}`,
        action_label: 'Resolve Blocker',
        source: 'task_engine',
        expires_at: dueInHours(48),
      })
    }
  }

  for (const prospect of prospects) {
    if (prospect.is_archived) continue

    const value = Number(prospect.estimated_value || 0)
    const strategic = Number(prospect.strategic_value || 0)
    const inactiveHours = hoursSince(prospect.last_interaction_at || prospect.updated_at || prospect.created_at)

    if (!prospect.next_action && !prospect.next_action_at) {
      items.push({
        recipient_user_id: prospect.owner_id || null,
        notification_type: 'missing_next_action',
        severity: 'critical',
        impact_score: Math.min(100, 65 + Math.round(value / 1000)),
        title: 'Prospect missing next action',
        message: `${prospect.name || 'Prospect'} has no next action or deadline.`,
        related_type: 'prospect',
        related_id: prospect.id,
        action_url: `/revenue-command-center/prospects/${prospect.id}`,
        action_label: 'Fix Next Action',
        source: 'pipeline_engine',
        expires_at: dueInHours(48),
      })
    }

    if (inactiveHours >= 72 && (value >= 5000 || strategic >= 75)) {
      items.push({
        recipient_user_id: prospect.owner_id || null,
        notification_type: 'high_value_inactive',
        severity: 'critical',
        impact_score: Math.min(100, 70 + Math.round(value / 1500)),
        title: 'High-value prospect inactive',
        message: `${prospect.name || 'Prospect'} has been inactive for ${Math.round(inactiveHours)}h.`,
        related_type: 'prospect',
        related_id: prospect.id,
        action_url: `/revenue-command-center/prospects/${prospect.id}`,
        action_label: 'Recover Prospect',
        source: 'pipeline_engine',
        expires_at: dueInHours(48),
      })
    }
  }

  for (const followup of followups) {
    if (followup.status !== 'completed' && followup.due_at && followup.due_at < now) {
      items.push({
        recipient_user_id: followup.owner_id || null,
        notification_type: 'followup_overdue',
        severity: 'warning',
        impact_score: 62,
        title: 'Follow-up overdue',
        message: `${followup.title || 'Follow-up'} is overdue.`,
        related_type: followup.related_type || 'followup',
        related_id: followup.related_id || followup.id,
        action_url: '/revenue-command-center/follow-ups',
        action_label: 'Open Follow-ups',
        source: 'followup_engine',
        expires_at: dueInHours(72),
      })
    }
  }

  for (const insight of insights) {
    if (insight.status === 'open') {
      items.push({
        recipient_user_id: null,
        notification_type: 'decision_insight',
        severity: insight.severity || 'info',
        impact_score: insight.severity === 'critical' ? 90 : insight.severity === 'warning' ? 70 : 50,
        title: insight.title || 'Open decision insight',
        message: insight.message || insight.recommendation || 'Control tower insight requires attention.',
        related_type: insight.related_type || 'insight',
        related_id: insight.related_id || insight.id,
        action_url: '/revenue-command-center/control-tower',
        action_label: 'Open Control Tower',
        source: 'control_tower',
        expires_at: dueInHours(96),
      })
    }
  }

  for (const intervention of interventions) {
    if (intervention.status === 'open') {
      items.push({
        recipient_user_id: intervention.target_user_id || null,
        notification_type: 'manager_intervention',
        severity: intervention.severity || 'warning',
        impact_score: intervention.severity === 'critical' ? 95 : 75,
        title: intervention.title || 'Manager intervention',
        message: intervention.description || 'Manager intervention requires attention.',
        related_type: intervention.related_type || 'intervention',
        related_id: intervention.related_id || intervention.id,
        action_url: '/revenue-command-center/workload-balancer',
        action_label: 'Open Intervention',
        source: 'workload_balancer',
        expires_at: dueInHours(96),
      })
    }
  }

  for (const event of activationEvents) {
    items.push({
      recipient_user_id: null,
      notification_type: event.event_type || 'activation_event',
      severity: event.severity || 'info',
      impact_score: event.severity === 'critical' ? 88 : event.severity === 'warning' ? 68 : 45,
      title: event.title || 'Activation event',
      message: event.message || event.action_taken || 'System activation event detected.',
      related_type: event.related_type || 'activation',
      related_id: event.related_id || event.id,
      action_url: '/revenue-command-center/system-activation',
      action_label: 'Open Activation',
      source: 'system_activation',
      expires_at: dueInHours(72),
    })
  }

  return items.sort((a, b) => b.impact_score - a.impact_score)
}
