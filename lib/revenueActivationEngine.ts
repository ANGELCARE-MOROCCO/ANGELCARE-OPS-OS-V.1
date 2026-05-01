type ActivationInput = {
  prospects: any[]
  tasks: any[]
  appointments: any[]
}

type ActivationRecommendation = {
  event_type: string
  severity: 'info' | 'warning' | 'critical'
  title: string
  message: string
  related_type: string
  related_id: string
  action_taken: string
  payload?: Record<string, any>
}

function hoursSince(date?: string | null) {
  if (!date) return 9999
  return (Date.now() - new Date(date).getTime()) / 36e5
}

export function buildActivationPlan({ prospects = [], tasks = [], appointments = [] }: ActivationInput) {
  const nowIso = new Date().toISOString()
  const events: ActivationRecommendation[] = []

  const activeProspects = prospects.filter((p) => !p.is_archived)

  for (const prospect of activeProspects) {
    const hasNext = Boolean(prospect.next_action || prospect.next_action_at)
    const inactiveHours = hoursSince(prospect.last_interaction_at || prospect.updated_at || prospect.created_at)
    const value = Number(prospect.estimated_value || 0)
    const strategic = Number(prospect.strategic_value || 0)

    if (!hasNext) {
      events.push({
        event_type: 'missing_next_action',
        severity: 'critical',
        title: 'Prospect missing next action',
        message: `${prospect.name || 'Prospect'} has no next action.`,
        related_type: 'prospect',
        related_id: prospect.id,
        action_taken: 'create_task_and_followup',
        payload: {
          task_title: `Define next action for ${prospect.name || 'prospect'}`,
          task_priority: 'critical',
          followup_title: `Repair next action: ${prospect.name || 'prospect'}`,
          due_hours: 24,
        },
      })
    }

    if (inactiveHours >= 72 && (value >= 5000 || strategic >= 75)) {
      events.push({
        event_type: 'high_value_inactive',
        severity: 'critical',
        title: 'High-value prospect inactive',
        message: `${prospect.name || 'Prospect'} has been inactive for ${Math.round(inactiveHours)} hours.`,
        related_type: 'prospect',
        related_id: prospect.id,
        action_taken: 'create_escalated_followup',
        payload: {
          task_title: `Urgent follow-up: ${prospect.name || 'prospect'}`,
          task_priority: 'critical',
          followup_title: `High-value inactive follow-up: ${prospect.name || 'prospect'}`,
          due_hours: 12,
        },
      })
    }
  }

  const openTasks = tasks.filter((t) => t.status !== 'completed')
  for (const task of openTasks) {
    const due = task.due_at || task.planned_end_at
    if (due && due < nowIso) {
      events.push({
        event_type: 'task_overdue',
        severity: 'critical',
        title: 'Task overdue',
        message: `${task.title || 'Task'} is overdue.`,
        related_type: 'task',
        related_id: task.id,
        action_taken: 'escalate_task',
        payload: {
          escalation_level: Number(task.escalation_level || 0) + 1,
        },
      })
    }
  }

  for (const appointment of appointments) {
    if (appointment.scheduled_at && appointment.scheduled_at < nowIso && !appointment.outcome) {
      events.push({
        event_type: 'meeting_outcome_missing',
        severity: 'warning',
        title: 'Meeting outcome missing',
        message: `${appointment.title || 'Appointment'} has no logged outcome.`,
        related_type: 'appointment',
        related_id: appointment.id,
        action_taken: 'create_outcome_task',
        payload: {
          task_title: `Log outcome for ${appointment.title || 'appointment'}`,
          task_priority: 'high',
          due_hours: 12,
        },
      })
    }
  }

  return events
}

export function dueIso(hours: number) {
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString()
}
