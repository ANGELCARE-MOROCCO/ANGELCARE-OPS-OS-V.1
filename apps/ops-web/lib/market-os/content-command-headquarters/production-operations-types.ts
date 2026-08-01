export type ProductionControl = {
  maintenanceMode: boolean
  manualOnlyMode: boolean
  aiAutomationPaused: boolean
  tavilyPaused: boolean
  openRouterPaused: boolean
  scheduledScansPaused: boolean
  scheduledPublishingPaused: boolean
  reason: string
  updatedAt: string | null
  updatedBy: string
  criticalAuthorityId: string
  criticalAuthorityName: string
}

export type ProductionRelease = {
  id: string
  versionCode: string
  label: string
  status: 'draft' | 'candidate' | 'active' | 'superseded' | 'retired'
  doctrineVersion: string
  skillsVersion: string
  commandsVersion: string
  providerAssignmentVersion: string
  freezeScope: string[]
  notes: string
  approvedBy: string
  effectiveAt: string | null
  createdAt: string
}

export type ProductionIncident = {
  id: string
  sourceType: string
  sourceId: string
  incidentType: string
  severity: 'info' | 'warning' | 'high' | 'critical'
  status: 'open' | 'assigned' | 'retry_scheduled' | 'manual_continuation' | 'resolved' | 'dismissed'
  summary: string
  detail: string
  ownerName: string
  nextAction: string
  sourceHref: string
  occurredAt: string
  updatedAt: string
}

export type BudgetPolicy = {
  id: string
  scopeType: string
  scopeId: string
  dailyLimitDh: number
  monthlyLimitDh: number
  warningPercent: number
  hardStop: boolean
  fallbackProvider: string
  fallbackModel: string
  currentDayDh: number
  currentMonthDh: number
}

export type InternationalDefault = {
  id: string
  scopeType: string
  scopeId: string
  label: string
  timezone: string
  locale: string
  defaultLanguage: string
  contentLanguages: string[]
  currency: string
  dateFormat: string
  weekStartsOn: number
  workingDays: number[]
  holidays: string[]
  marketScope: string[]
}

export type RoleHomeProfile = {
  roleKey: string
  label: string
  defaultRoute: string
  visibleRoutes: string[]
  onboardingState: 'draft' | 'ready' | 'active' | 'retired'
}

export type NotificationRule = {
  eventKey: string
  label: string
  enabled: boolean
  severity: string
  channels: string[]
  recipientRoles: string[]
  dedupeMinutes: number
  escalateAfterMinutes: number
}

export type HygieneCandidate = {
  entityType: string
  id: string
  code: string
  title: string
  status: string
  reason: string
  ownerName: string
  updatedAt: string
}

export type ProductionOperationsSnapshot = {
  generatedAt: string
  schemaReady: boolean
  controls: ProductionControl
  activeRelease: ProductionRelease | null
  releases: ProductionRelease[]
  incidents: ProductionIncident[]
  budgetPolicies: BudgetPolicy[]
  defaults: InternationalDefault[]
  roleHomes: RoleHomeProfile[]
  notificationRules: NotificationRule[]
  hygieneCandidates: HygieneCandidate[]
  health: {
    database: 'healthy' | 'degraded' | 'setup_required'
    aiConfigured: number
    aiCapabilities: number
    openIncidents: number
    criticalIncidents: number
    failedJobs: number
    publicationFailures: number
    unownedActiveRecords: number
  }
}
