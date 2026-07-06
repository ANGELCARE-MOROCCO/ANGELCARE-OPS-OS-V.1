export type OpsosSeverity = 'healthy' | 'degraded' | 'warning' | 'critical'
export type OpsosRisk = 'Low' | 'Medium' | 'High' | 'Critical'
export type OpsosActionStatus = 'success' | 'warning' | 'pending' | 'failed'

export type OpsosRouteHealth = {
  id: string
  route: string
  page: string
  module: string
  status: OpsosSeverity
  loadTimeMs: number
  memoryMb: number
  crashes24h: number
  apiCalls: number
  slowInteractions: number
  jsRisk: OpsosRisk
  safeMode: boolean
  lastDeploy: string
}

export type OpsosModalHealth = {
  id: string
  name: string
  parentRoute: string
  openTimeMs: number
  renderCount: number
  memoryAfterCloseMb: number
  status: OpsosSeverity
  topIssue: string
  autoFixAvailable: boolean
}

export type OpsosFeatureFlag = {
  id: string
  name: string
  description: string
  rollout: number
  target: string
  status: boolean
  override: boolean
  risk: OpsosRisk
}

export type OpsosSafeModeRule = {
  id: string
  rule: string
  scope: string
  enabled: boolean
  impact: string
}

export type OpsosRepairQueueItem = {
  id: string
  priority: OpsosRisk
  type: string
  target: string
  issue: string
  detected: string
  status: 'pending' | 'simulated' | 'ready' | 'monitoring'
  rollback: boolean
}

export type OpsosAuditEvent = {
  id: string
  time: string
  operator: string
  category: string
  event: string
  target: string
  status: OpsosActionStatus
}

export type OpsosRuntimeSnapshot = {
  generatedAt: string
  environment: string
  region: string
  version: string
  status: OpsosSeverity
  kpis: {
    liveIncidents: number
    unhealthyRoutes: number
    slowPages: number
    modalFailures: number
    apiErrors: number
    memoryRiskPct: number
    cpuSpikes: number
    activeExperiments: number
    repairQueue: number
  }
  routes: OpsosRouteHealth[]
  modals: OpsosModalHealth[]
  flags: OpsosFeatureFlag[]
  safeModes: OpsosSafeModeRule[]
  repairQueue: OpsosRepairQueueItem[]
  audit: OpsosAuditEvent[]
}

export type OpsosRuntimeActionPayload = {
  action: string
  target?: string
  scope?: string
  value?: unknown
  operator?: string
}

export const opsosNavigation = [
  { id: 'command-board', label: 'Command Board' },
  { id: 'runtime-health', label: 'Runtime Health' },
  { id: 'pages-routes', label: 'Pages & Routes' },
  { id: 'api-control', label: 'API Control' },
  { id: 'modals-ux', label: 'Modals & UX' },
  { id: 'performance', label: 'Performance' },
  { id: 'feature-flags', label: 'Feature Flags' },
  { id: 'safe-repair', label: 'Safe Repair' },
  { id: 'logs-audit', label: 'Logs & Audit' },
] as const

export const repairSkills = [
  { title: 'Route Scan', detail: 'Deep route analysis', icon: '▱', risk: 'Low' as OpsosRisk },
  { title: 'Memory Cleaner', detail: 'Free leaked memory', icon: '▣', risk: 'Medium' as OpsosRisk },
  { title: 'Modal Freeze Diagnosis', detail: 'Detect UI freezes', icon: '◎', risk: 'Low' as OpsosRisk },
  { title: 'Cache Purge', detail: 'Clear runtime cache', icon: '▤', risk: 'Low' as OpsosRisk },
  { title: 'Local State Reset', detail: 'Reset local states', icon: '⌁', risk: 'Medium' as OpsosRisk },
  { title: 'API Health Test', detail: 'Test API endpoints', icon: '✦', risk: 'Low' as OpsosRisk },
  { title: 'Lazy-Load Repair', detail: 'Optimize loading', icon: '⌁', risk: 'Low' as OpsosRisk },
  { title: 'Polling Control', detail: 'Control polling loops', icon: '↻', risk: 'Medium' as OpsosRisk },
]

export function buildOpsosRuntimeSnapshot(): OpsosRuntimeSnapshot {
  const now = new Date()
  const iso = now.toISOString()

  const routes: OpsosRouteHealth[] = [
    { id: 'r1', route: '/', page: 'Home', module: 'Core', status: 'healthy', loadTimeMs: 612, memoryMb: 128, crashes24h: 0, apiCalls: 8, slowInteractions: 0, jsRisk: 'Low', safeMode: false, lastDeploy: '2h ago' },
    { id: 'r2', route: '/dashboard', page: 'Dashboard', module: 'Direction', status: 'healthy', loadTimeMs: 734, memoryMb: 146, crashes24h: 1, apiCalls: 14, slowInteractions: 1, jsRisk: 'Low', safeMode: false, lastDeploy: '2h ago' },
    { id: 'r3', route: '/patients', page: 'Patients', module: 'Operations', status: 'degraded', loadTimeMs: 1400, memoryMb: 238, crashes24h: 2, apiCalls: 28, slowInteractions: 4, jsRisk: 'Medium', safeMode: true, lastDeploy: '2h ago' },
    { id: 'r4', route: '/appointments', page: 'Appointments', module: 'Planning', status: 'healthy', loadTimeMs: 682, memoryMb: 132, crashes24h: 0, apiCalls: 12, slowInteractions: 0, jsRisk: 'Low', safeMode: false, lastDeploy: '2h ago' },
    { id: 'r5', route: '/billing', page: 'Billing', module: 'Finance', status: 'healthy', loadTimeMs: 812, memoryMb: 164, crashes24h: 0, apiCalls: 16, slowInteractions: 0, jsRisk: 'Low', safeMode: false, lastDeploy: '2h ago' },
    { id: 'r6', route: '/reports', page: 'Reports', module: 'Analytics', status: 'warning', loadTimeMs: 2100, memoryMb: 312, crashes24h: 3, apiCalls: 36, slowInteractions: 18, jsRisk: 'Medium', safeMode: false, lastDeploy: '2h ago' },
    { id: 'r7', route: '/settings', page: 'Settings', module: 'Admin', status: 'healthy', loadTimeMs: 598, memoryMb: 118, crashes24h: 0, apiCalls: 9, slowInteractions: 0, jsRisk: 'Low', safeMode: false, lastDeploy: '2h ago' },
    { id: 'r8', route: '/profile', page: 'Profile', module: 'Identity', status: 'healthy', loadTimeMs: 576, memoryMb: 104, crashes24h: 0, apiCalls: 11, slowInteractions: 0, jsRisk: 'Low', safeMode: false, lastDeploy: '2h ago' },
    { id: 'r9', route: '/market-os/campaign-lifecycle', page: 'Campaign Lifecycle', module: 'Market OS', status: 'warning', loadTimeMs: 4860, memoryMb: 512, crashes24h: 5, apiCalls: 152, slowInteractions: 27, jsRisk: 'High', safeMode: true, lastDeploy: '30 sec ago' },
  ]

  const modals: OpsosModalHealth[] = [
    { id: 'm1', name: 'Employee 360 Dossier Modal', parentRoute: '/hr/employees', openTimeMs: 1240, renderCount: 42, memoryAfterCloseMb: 28, status: 'warning', topIssue: 'Draft state persists after close', autoFixAvailable: true },
    { id: 'm2', name: 'Campaign Timeline Control Modal', parentRoute: '/market-os/campaign-lifecycle', openTimeMs: 3910, renderCount: 97, memoryAfterCloseMb: 96, status: 'critical', topIssue: 'Card matrix stays mounted', autoFixAvailable: true },
    { id: 'm3', name: 'Print Preview Modal', parentRoute: '/market-os/campaign-lifecycle', openTimeMs: 2110, renderCount: 26, memoryAfterCloseMb: 64, status: 'warning', topIssue: 'Print assets load too early', autoFixAvailable: true },
  ]

  const flags: OpsosFeatureFlag[] = [
    { id: 'f1', name: 'new_nav_experience', description: 'New navigation system', rollout: 75, target: 'All Users', status: true, override: true, risk: 'Medium' },
    { id: 'f2', name: 'ai_summarization', description: 'AI summary for notes', rollout: 25, target: 'Beta Users', status: true, override: true, risk: 'Low' },
    { id: 'f3', name: 'billing_redesign', description: 'Billing UI redesign', rollout: 10, target: 'Internal Beta', status: true, override: false, risk: 'Medium' },
    { id: 'f4', name: 'realtime_notifications', description: 'Realtime notifications', rollout: 100, target: 'All Users', status: true, override: true, risk: 'Low' },
    { id: 'f5', name: 'advanced_search_v2', description: 'Advanced search v2', rollout: 0, target: 'All Users', status: false, override: false, risk: 'Low' },
    { id: 'f6', name: 'dark_mode', description: 'Dark mode theme', rollout: 50, target: 'All Users', status: false, override: true, risk: 'Medium' },
  ]

  const safeModes: OpsosSafeModeRule[] = [
    { id: 's1', rule: 'Disable animations', scope: 'Global', enabled: true, impact: 'Stops non-critical animation loops' },
    { id: 's2', rule: 'Disable charts', scope: 'Market OS', enabled: true, impact: 'Prevents heavy chart libraries from loading' },
    { id: 's3', rule: 'Disable live polling', scope: 'Global', enabled: true, impact: 'Stops auto polling and intervals' },
    { id: 's4', rule: 'Limit rows', scope: 'Market OS', enabled: true, impact: 'Limits list and table rows to safe thresholds' },
    { id: 's5', rule: 'Lazy-load modals', scope: 'Global', enabled: true, impact: 'Defers modal component loading' },
    { id: 's6', rule: 'Disable PDF preview', scope: 'Global', enabled: false, impact: 'Prevents print preview from preloading' },
  ]

  const repairQueue: OpsosRepairQueueItem[] = [
    { id: 'q1', priority: 'Critical', type: 'Freeze', target: '/reports', issue: 'High error rate (5xx)', detected: '2m ago', status: 'pending', rollback: true },
    { id: 'q2', priority: 'High', type: 'Memory', target: 'Dashboard', issue: 'Heap leak suspected', detected: '5m ago', status: 'simulated', rollback: true },
    { id: 'q3', priority: 'High', type: 'Modal', target: 'PatientSearchModal', issue: 'Z-index conflict', detected: '8m ago', status: 'pending', rollback: true },
    { id: 'q4', priority: 'Medium', type: 'Performance', target: '/patients', issue: 'Slow load P95 > 1.5s', detected: '12m ago', status: 'pending', rollback: true },
    { id: 'q5', priority: 'Medium', type: 'Feature Flag', target: 'billing_redesign', issue: 'High error rate', detected: '18m ago', status: 'ready', rollback: true },
    { id: 'q6', priority: 'Low', type: 'API', target: '/api/appointments', issue: '5xx error spike', detected: '22m ago', status: 'monitoring', rollback: true },
  ]

  const audit: OpsosAuditEvent[] = [
    { id: 'a1', time: '12:01:22', operator: 'System', category: 'Runtime', event: 'Route recovery executed', target: '/reports', status: 'success' },
    { id: 'a2', time: '12:01:01', operator: 'A. Patel', category: 'Memory', event: 'Optimization applied', target: 'Dashboard', status: 'success' },
    { id: 'a3', time: '12:00:45', operator: 'S. Kim', category: 'Feature Flag', event: 'Rollout updated to 75%', target: 'new_nav_experience', status: 'success' },
    { id: 'a4', time: '12:00:12', operator: 'System', category: 'Alert', event: 'High memory risk detected', target: 'Dashboard', status: 'warning' },
    { id: 'a5', time: '11:59:57', operator: 'J. Morgan', category: 'Modal', event: 'Modal failure auto-repaired', target: 'PatientSearchModal', status: 'success' },
    { id: 'a6', time: '11:58:12', operator: 'System', category: 'API', event: '5xx error rate elevated', target: '/api/appointments', status: 'warning' },
  ]

  return {
    generatedAt: iso,
    environment: 'Production',
    region: 'US-East-1',
    version: 'v3.24.1',
    status: 'healthy',
    kpis: {
      liveIncidents: 7,
      unhealthyRoutes: routes.filter((route) => route.status !== 'healthy').length,
      slowPages: routes.filter((route) => route.loadTimeMs > 1500).length,
      modalFailures: modals.filter((modal) => modal.status !== 'healthy').length,
      apiErrors: 42,
      memoryRiskPct: 82,
      cpuSpikes: 6,
      activeExperiments: flags.filter((flag) => flag.status).length,
      repairQueue: repairQueue.length,
    },
    routes,
    modals,
    flags,
    safeModes,
    repairQueue,
    audit,
  }
}
