export const HR_WORKFLOW_STAGES = {
  candidate: ['new', 'screening', 'interview', 'offer', 'hired', 'rejected'],
  onboarding: ['planned', 'documents', 'training', 'probation', 'completed'],
  attendance: ['pending', 'approved', 'corrected', 'rejected'],
  roster: ['planned', 'confirmed', 'completed', 'cancelled'],
  approval: ['pending', 'approved', 'rejected'],
  task: ['open', 'in_progress', 'blocked', 'done'],
}

export function nextStage(kind: keyof typeof HR_WORKFLOW_STAGES, current: string) {
  const stages = HR_WORKFLOW_STAGES[kind]
  const index = stages.indexOf(current)
  return stages[Math.min(stages.length - 1, Math.max(0, index + 1))]
}

export function isTerminalStage(kind: keyof typeof HR_WORKFLOW_STAGES, current: string) {
  const stages = HR_WORKFLOW_STAGES[kind]
  return stages.indexOf(current) === stages.length - 1
}
