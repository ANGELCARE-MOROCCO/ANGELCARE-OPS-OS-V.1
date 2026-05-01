export type HrAutonomousAction = {
  id?: string
  title?: string | null
  notes?: string | null
  module?: string | null
  priority?: string | null
  status?: string | null
  owner?: string | null
}

export type HrAutoTriggerResult =
  | {
      auto: true
      effect:
        | 'BLOCK_DEPLOYMENT'
        | 'CREATE_ACADEMY_PIPELINE'
        | 'ESCALATE_ALLOCATION'
        | 'OPEN_INCIDENT_GOVERNANCE'
      target: 'compliance' | 'academy' | 'allocation' | 'incidents'
      severity: 'critical' | 'high'
      message: string
    }
  | {
      auto: false
      effect: 'NO_AUTOMATION'
      target: 'hr-os'
      severity: 'normal'
      message: string
    }

export function evaluateAutoTriggers(action: HrAutonomousAction): HrAutoTriggerResult {
  const text = `${action.title || ''} ${action.notes || ''} ${action.module || ''}`.toLowerCase()

  if (text.includes('missing') || text.includes('document') || text.includes('compliance')) {
    return {
      auto: true,
      effect: 'BLOCK_DEPLOYMENT',
      target: 'compliance',
      severity: 'critical',
      message: 'Compliance/document issue detected. Deployment should be blocked until validation is complete.',
    }
  }

  if (text.includes('academy') || text.includes('training') || text.includes('certificate')) {
    return {
      auto: true,
      effect: 'CREATE_ACADEMY_PIPELINE',
      target: 'academy',
      severity: 'high',
      message: 'Training or certification dependency detected. Route profile to Academy pipeline.',
    }
  }

  if (text.includes('urgent') || text.includes('mission') || text.includes('allocation')) {
    return {
      auto: true,
      effect: 'ESCALATE_ALLOCATION',
      target: 'allocation',
      severity: 'high',
      message: 'Urgent mission/allocation signal detected. Escalate to allocation command.',
    }
  }

  if (text.includes('incident') || text.includes('escalation')) {
    return {
      auto: true,
      effect: 'OPEN_INCIDENT_GOVERNANCE',
      target: 'incidents',
      severity: 'critical',
      message: 'Incident signal detected. Open incident governance path.',
    }
  }

  return {
    auto: false,
    effect: 'NO_AUTOMATION',
    target: 'hr-os',
    severity: 'normal',
    message: 'No automation trigger detected. Continue monitoring.',
  }
}
