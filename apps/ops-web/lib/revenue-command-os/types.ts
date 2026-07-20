export type RevenueOsWorkspaceKey =
  | 'strategic-view'
  | 'revenue-objectives'
  | 'signals'
  | 'strategies'
  | 'intelligent-commands'
  | 'active-programs'
  | 'compiled-missions'
  | 'approvals'
  | 'exceptions'
  | 'memory-learning'
  | 'audit'
  | 'settings'

export type RevenueOsHealthStatus = 'operational' | 'degraded' | 'attention' | 'offline'
export type RevenueOsMaturityStatus = 'locked' | 'ready' | 'foundation' | 'planned'
export type RevenueOsPriority = 'critical' | 'high' | 'medium' | 'low'
export type RevenueOsObjectiveStatus = 'draft' | 'submitted' | 'validated' | 'active' | 'paused' | 'completed' | 'cancelled'
export type RevenueOsExecutionMode = 'shadow' | 'recommend' | 'approval-gated' | 'limited-autonomy'
export type RevenueOsEnvironment = 'development' | 'staging' | 'production'

export type RevenueOsWorkspaceDefinition = {
  key: RevenueOsWorkspaceKey
  label: string
  shortLabel: string
  description: string
  href: string
  icon: string
  order: number
  permission: string
  status: RevenueOsMaturityStatus
  accent: 'navy' | 'blue' | 'cyan' | 'green' | 'amber' | 'rose' | 'violet'
  contractScope: string[]
}

export type RevenueOsFeatureFlag = {
  key: string
  label: string
  description: string
  enabled: boolean
  locked: boolean
  environment: RevenueOsEnvironment | 'all'
  riskClass: 'low' | 'controlled' | 'restricted'
}

export type RevenueOsSystemCheck = {
  key: string
  label: string
  status: RevenueOsHealthStatus
  detail: string
  checkedAt: string
  action?: string
}

export type RevenueOsObjective = {
  id: string
  code: string
  title: string
  mandate: string
  businessUnit: string
  targetMarket: string
  horizon: string
  priority: RevenueOsPriority
  status: RevenueOsObjectiveStatus
  executionMode: RevenueOsExecutionMode
  owner: string
  createdAt: string
  updatedAt: string
  source: 'database' | 'foundation-seed' | 'manual'
}

export type RevenueOsAuditEvent = {
  id: string
  eventId: string
  action: string
  actor: string
  actorType: 'user' | 'system' | 'migration' | 'api'
  resourceType: string
  resourceId?: string
  outcome: 'success' | 'blocked' | 'failure' | 'pending'
  summary: string
  createdAt: string
  metadata?: Record<string, unknown>
}

export type RevenueOsFoundationBootstrap = {
  contractVersion: string
  releaseCode: string
  moduleVersion: string
  environment: RevenueOsEnvironment
  executionMode: RevenueOsExecutionMode
  storageMode: 'supabase' | 'foundation-fallback'
  generatedAt: string
  workspaces: RevenueOsWorkspaceDefinition[]
  featureFlags: RevenueOsFeatureFlag[]
  systemChecks: RevenueOsSystemCheck[]
  objectives: RevenueOsObjective[]
  auditEvents: RevenueOsAuditEvent[]
  counters: {
    workspaceCount: number
    lockedContractItems: number
    enabledFeatureFlags: number
    pendingApprovals: number
    openExceptions: number
    auditEventsToday: number
  }
}

export type RevenueOsSearchResult = {
  id: string
  type: 'workspace' | 'objective' | 'audit' | 'feature-flag' | 'status'
  title: string
  subtitle: string
  href: string
  badge?: string
  keywords: string[]
}

export type RevenueOsObjectiveInput = {
  title: string
  mandate: string
  businessUnit: string
  targetMarket: string
  horizon: string
  priority: RevenueOsPriority
  executionMode: RevenueOsExecutionMode
}
