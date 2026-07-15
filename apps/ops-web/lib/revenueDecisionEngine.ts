export function computeRevenueSignals({ prospects = [], tasks = [], appointments = [] }: { prospects?: any[]; tasks?: any[]; appointments?: any[] }) {
  const now = new Date().toISOString()

  const activeProspects = prospects.filter((p) => !p.is_archived)
  const grossPipeline = activeProspects.reduce((sum, p) => sum + Number(p.estimated_value || 0), 0)
  const weightedPipeline = activeProspects.reduce((sum, p) => {
    const probability = Number(p.probability || 0) / 100
    return sum + Number(p.estimated_value || 0) * probability
  }, 0)

  const missingNextActions = activeProspects.filter((p) => !p.next_action && !p.next_action_at)
  const openTasks = tasks.filter((t) => t.status !== 'completed')
  const overdueTasks = openTasks.filter((t) => {
    const due = t.due_at || t.planned_end_at
    return due && due < now
  })

  const pastAppointmentsWithoutOutcome = appointments.filter((a) => a.scheduled_at && a.scheduled_at < now && !a.outcome)

  const risks = [
    missingNextActions.length
      ? {
          type: 'pipeline_discipline',
          severity: 'critical',
          title: 'Pipeline discipline gap',
          message: `${missingNextActions.length} prospects have no next action.`,
          recommendation: 'Assign next action and deadline for every uncovered prospect today.',
        }
      : null,
    overdueTasks.length
      ? {
          type: 'execution_delay',
          severity: 'critical',
          title: 'Execution delay risk',
          message: `${overdueTasks.length} revenue tasks are overdue.`,
          recommendation: 'Managers should reassign or escalate overdue tasks immediately.',
        }
      : null,
    pastAppointmentsWithoutOutcome.length
      ? {
          type: 'meeting_conversion',
          severity: 'warning',
          title: 'Meeting conversion leakage',
          message: `${pastAppointmentsWithoutOutcome.length} past appointments have no logged outcome.`,
          recommendation: 'Convert meeting outcomes into follow-up tasks or closure decisions.',
        }
      : null,
  ].filter(Boolean)

  let confidenceScore = 75
  if (missingNextActions.length) confidenceScore -= 20
  if (overdueTasks.length) confidenceScore -= 20
  if (pastAppointmentsWithoutOutcome.length) confidenceScore -= 10
  confidenceScore = Math.max(5, Math.min(95, confidenceScore))

  return {
    activeProspects: activeProspects.length,
    grossPipeline,
    weightedPipeline,
    missingNextActions: missingNextActions.length,
    overdueTasks: overdueTasks.length,
    pastAppointmentsWithoutOutcome: pastAppointmentsWithoutOutcome.length,
    confidenceScore,
    risks,
  }
}

export function money(value: number) {
  return `${Number(value || 0).toLocaleString('fr-FR')} MAD`
}
