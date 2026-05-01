export type HrOnboardingRole = 'agent' | 'manager' | 'executive'

export const ROLE_PATHS: Record<HrOnboardingRole, any[]> = {
  agent: [
    { code: 'AG-01', title: 'Start from Realtime Alerts', route: '/hr-os/realtime', required: true },
    { code: 'AG-02', title: 'Create and own HR actions', route: '/hr-os/recruitment', required: true },
    { code: 'AG-03', title: 'Resolve compliance tasks', route: '/hr-os/compliance', required: true },
    { code: 'AG-04', title: 'Update action status correctly', route: '/hr-os', required: true },
  ],
  manager: [
    { code: 'MG-01', title: 'Review Enterprise Queue', route: '/hr-os/enterprise', required: true },
    { code: 'MG-02', title: 'Use Intelligence Recommendations', route: '/hr-os/intelligence', required: true },
    { code: 'MG-03', title: 'Escalate unresolved alerts', route: '/hr-os/realtime', required: true },
    { code: 'MG-04', title: 'Validate lifecycle movement', route: '/hr-os/enterprise', required: true },
  ],
  executive: [
    { code: 'EX-01', title: 'Review Executive AI scenarios', route: '/hr-os/executive-ai', required: true },
    { code: 'EX-02', title: 'Open War Room staffing pressure', route: '/hr-os/war-room', required: true },
    { code: 'EX-03', title: 'Generate Board Report record', route: '/hr-os/board-reports', required: true },
  ],
}

export function getRolePath(role?: string | null) {
  if (role === 'manager') return ROLE_PATHS.manager
  if (role === 'executive' || role === 'ceo') return ROLE_PATHS.executive
  return ROLE_PATHS.agent
}

export function calculateTrainingScore(completed: number, total: number) {
  if (!total) return 0
  return Math.round((completed / total) * 100)
}

export function getTrainingStatus(score: number) {
  if (score >= 100) return 'certified'
  if (score >= 70) return 'nearly_ready'
  if (score >= 40) return 'in_progress'
  return 'blocked'
}

export function shouldBlockAdvancedAccess(score: number) {
  return score < 70
}
