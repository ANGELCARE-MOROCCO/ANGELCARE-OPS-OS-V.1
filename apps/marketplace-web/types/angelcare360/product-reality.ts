export type ProductRealityDomain =
  | 'product'
  | 'institution'
  | 'academic_year'
  | 'people'
  | 'guardian'
  | 'student'
  | 'admissions'
  | 'attendance'
  | 'timetable'
  | 'curriculum'
  | 'homework'
  | 'assessment'
  | 'report_cards'
  | 'capacity'
  | 'finance'

export type ProductRealityExecutionState =
  | 'requested'
  | 'validating'
  | 'approved'
  | 'executing'
  | 'completed'
  | 'partially_failed'
  | 'failed'
  | 'compensating'
  | 'compensated'
  | 'cancelled'

export type ProductRealitySeverity = 'info' | 'warning' | 'critical' | 'success'

export type ProductRealityOperationDefinition = {
  operationKey: string
  domain: ProductRealityDomain
  label: string
  description: string
  permissionKey: string
  moduleKey: string | null
  capabilityKey: string | null
  featureKey: string | null
  lifecycleGuard: string | null
  requiresApproval: boolean
  idempotent: boolean
  auditEvent: string
  commandFamily: string
  operatorOnly?: boolean
}

export type ProductRealityCommandRequest = {
  operationKey: string
  authority?: 'customer' | 'operator'
  schoolId?: string | null
  entityId?: string | null
  idempotencyKey?: string | null
  reason?: string | null
  effectiveAt?: string | null
  payload?: Record<string, unknown>
}

export type ProductRealityCommandResult = {
  ok: boolean
  operationKey: string
  executionId: string | null
  state: ProductRealityExecutionState
  message: string
  record?: Record<string, unknown> | null
  records?: Array<Record<string, unknown>>
  warnings?: string[]
  blockers?: string[]
  auditId?: string | null
  idempotentReplay?: boolean
}

export type ProductRealityRuntimeGate = {
  allowed: boolean
  operationKey: string
  permissionKey: string
  moduleKey: string | null
  capabilityKey: string | null
  featureKey: string | null
  entitlementState: string
  capacityState: 'available' | 'warning' | 'reached' | 'not_applicable' | 'unknown'
  reason: string | null
  allowance: number | null
  usage: number | null
  unit: string | null
}

export type ProductRealityMetric = {
  key: string
  label: string
  value: number
  severity: ProductRealitySeverity
  href?: string | null
}

export type ProductRealityQueueItem = {
  id: string
  domain: ProductRealityDomain
  title: string
  detail: string | null
  status: string
  severity: ProductRealitySeverity
  operationKey: string | null
  entityType: string | null
  entityId: string | null
  dueAt: string | null
  createdAt: string
}

export type ProductRealitySnapshot = {
  generatedAt: string
  schoolId: string | null
  tenantId: string | null
  entitlementState: string
  productRuntimeAuthority: {
    enforced: boolean
    packageVersion: string | null
    snapshotVersion: number | null
    enabledModules: number
    enabledCapabilities: number
    enabledFeatures: number
    enabledOperations: number
    meteredLimits: number
  }
  domainMaturity: Array<{
    key: ProductRealityDomain
    label: string
    configuredPolicies: number
    activeWorkflows: number
    openExceptions: number
    pendingExecutions: number
    state: 'operational' | 'attention' | 'unconfigured'
  }>
  metrics: ProductRealityMetric[]
  queues: ProductRealityQueueItem[]
  recentExecutions: Array<Record<string, unknown>>
  policyVersions: Array<Record<string, unknown>>
  operationDefinitions: ProductRealityOperationDefinition[]
  warnings: string[]
  operatorTenants?: Array<{ tenantId: string; schoolId: string; label: string; status: string }>
  selectedSchoolId?: string | null
}

export type ProductRealityWorkerResult = {
  ok: boolean
  processed: number
  completed: number
  failed: number
  results: Array<{
    executionId: string
    operationKey: string
    state: ProductRealityExecutionState
    message: string
  }>
}
