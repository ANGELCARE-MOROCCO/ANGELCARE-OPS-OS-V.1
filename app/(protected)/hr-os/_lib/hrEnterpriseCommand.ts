export type HrLifecycleStage =
  | 'candidate'
  | 'qualified'
  | 'academy'
  | 'certified'
  | 'compliant'
  | 'ready'
  | 'allocated'
  | 'monitored'
  | 'escalated'

export const HR_LIFECYCLE: HrLifecycleStage[] = [
  'candidate',
  'qualified',
  'academy',
  'certified',
  'compliant',
  'ready',
  'allocated',
  'monitored',
  'escalated',
]

export function canMoveHrStage(from: string, to: string) {
  const fromIndex = HR_LIFECYCLE.indexOf(from as HrLifecycleStage)
  const toIndex = HR_LIFECYCLE.indexOf(to as HrLifecycleStage)
  if (fromIndex === -1 || toIndex === -1) return false
  if (to === 'escalated') return true
  return toIndex === fromIndex + 1 || toIndex === fromIndex
}

export function getEnterpriseCommand(action: any) {
  const text = `${action.module || ''} ${action.title || ''} ${action.notes || ''}`.toLowerCase()

  if (text.includes('missing') || text.includes('document') || text.includes('compliance')) {
    return {
      command: 'Block deployment and trigger compliance recovery',
      targetModule: 'compliance',
      linkedRoute: '/hr-os/compliance',
      severity: 'critical',
    }
  }

  if (text.includes('academy') || text.includes('training') || text.includes('certificate')) {
    return {
      command: 'Route profile through Academy readiness validation',
      targetModule: 'academy',
      linkedRoute: '/academy',
      severity: 'high',
    }
  }

  if (text.includes('mission') || text.includes('allocation') || text.includes('urgent')) {
    return {
      command: 'Escalate to allocation command and confirm availability',
      targetModule: 'allocation',
      linkedRoute: '/hr-os/allocation',
      severity: 'high',
    }
  }

  if (text.includes('incident')) {
    return {
      command: 'Open investigation path and assign incident owner',
      targetModule: 'incidents',
      linkedRoute: '/hr-os/incidents',
      severity: 'critical',
    }
  }

  return {
    command: 'Assign owner and convert into controlled HR action',
    targetModule: action.module || 'command',
    linkedRoute: `/hr-os/${action.module || ''}`.replace(/\/$/, ''),
    severity: action.priority === 'high' ? 'high' : 'normal',
  }
}

export function buildEnterpriseQueue(actions: any[]) {
  return actions
    .filter((a) => a.status !== 'closed')
    .map((a) => ({
      ...a,
      enterprise: getEnterpriseCommand(a),
    }))
    .sort((a, b) => {
      const order: Record<string, number> = { critical: 0, high: 1, normal: 2 }
      return (order[a.enterprise.severity] ?? 3) - (order[b.enterprise.severity] ?? 3)
    })
}
