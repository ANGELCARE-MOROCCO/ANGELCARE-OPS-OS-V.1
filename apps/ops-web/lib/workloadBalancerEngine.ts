export type WorkloadUser = {
  id: string
  full_name?: string | null
  username?: string | null
  role?: string | null
}

export type WorkloadSnapshot = {
  user_id: string
  open_tasks: number
  overdue_tasks: number
  owned_prospects: number
  missing_next_actions: number
  pipeline_value: number
  weighted_pressure: number
  workload_status: 'low' | 'normal' | 'high' | 'critical'
}

function weightedPressure(input: {
  open_tasks: number
  overdue_tasks: number
  owned_prospects: number
  missing_next_actions: number
  pipeline_value: number
}) {
  return Math.round(
    input.open_tasks * 6 +
    input.overdue_tasks * 18 +
    input.owned_prospects * 3 +
    input.missing_next_actions * 14 +
    Math.min(input.pipeline_value / 10000, 35)
  )
}

function statusFromPressure(score: number): WorkloadSnapshot['workload_status'] {
  if (score >= 95) return 'critical'
  if (score >= 65) return 'high'
  if (score <= 18) return 'low'
  return 'normal'
}

export function computeWorkloadSnapshots({
  users,
  tasks,
  prospects,
}: {
  users: WorkloadUser[]
  tasks: any[]
  prospects: any[]
}) {
  const now = new Date().toISOString()

  return users.map((user) => {
    const userTasks = tasks.filter((t) => t.assigned_to === user.id && t.status !== 'completed')
    const overdueTasks = userTasks.filter((t) => {
      const due = t.due_at || t.planned_end_at
      return due && due < now
    })
    const ownedProspects = prospects.filter((p) => p.owner_id === user.id && !p.is_archived)
    const missingNext = ownedProspects.filter((p) => !p.next_action && !p.next_action_at)
    const pipelineValue = ownedProspects.reduce((sum, p) => sum + Number(p.estimated_value || 0), 0)

    const pressure = weightedPressure({
      open_tasks: userTasks.length,
      overdue_tasks: overdueTasks.length,
      owned_prospects: ownedProspects.length,
      missing_next_actions: missingNext.length,
      pipeline_value: pipelineValue,
    })

    return {
      user_id: user.id,
      open_tasks: userTasks.length,
      overdue_tasks: overdueTasks.length,
      owned_prospects: ownedProspects.length,
      missing_next_actions: missingNext.length,
      pipeline_value: pipelineValue,
      weighted_pressure: pressure,
      workload_status: statusFromPressure(pressure),
    }
  })
}

export function buildRebalanceRecommendations({
  users,
  snapshots,
  tasks,
  prospects,
}: {
  users: WorkloadUser[]
  snapshots: WorkloadSnapshot[]
  tasks: any[]
  prospects: any[]
}) {
  const overloaded = snapshots
    .filter((s) => s.workload_status === 'critical' || s.workload_status === 'high')
    .sort((a, b) => b.weighted_pressure - a.weighted_pressure)

  const available = snapshots
    .filter((s) => s.workload_status === 'low' || s.workload_status === 'normal')
    .sort((a, b) => a.weighted_pressure - b.weighted_pressure)

  const recommendations: any[] = []

  for (const heavy of overloaded) {
    const receiver = available.find((a) => a.user_id !== heavy.user_id)
    if (!receiver) continue

    const overdueTask = tasks.find((t) => t.assigned_to === heavy.user_id && t.status !== 'completed' && (t.due_at || t.planned_end_at))
    if (overdueTask) {
      recommendations.push({
        from_user_id: heavy.user_id,
        to_user_id: receiver.user_id,
        related_type: 'task',
        related_id: overdueTask.id,
        recommendation_type: 'reassign_overdue_task',
        severity: heavy.workload_status === 'critical' ? 'critical' : 'warning',
        reason: `Reassign overdue/high-pressure task from overloaded agent to lower-pressure agent.`,
      })
    }

    const missingProspect = prospects.find((p) => p.owner_id === heavy.user_id && !p.is_archived && !p.next_action && !p.next_action_at)
    if (missingProspect) {
      recommendations.push({
        from_user_id: heavy.user_id,
        to_user_id: receiver.user_id,
        related_type: 'prospect',
        related_id: missingProspect.id,
        recommendation_type: 'reassign_pipeline_gap',
        severity: heavy.workload_status === 'critical' ? 'critical' : 'warning',
        reason: `Reassign prospect with missing next action from overloaded agent to available agent.`,
      })
    }
  }

  return recommendations.slice(0, 20)
}

export function userLabel(user?: WorkloadUser | null) {
  if (!user) return 'Unassigned'
  return user.full_name || user.username || user.id
}
