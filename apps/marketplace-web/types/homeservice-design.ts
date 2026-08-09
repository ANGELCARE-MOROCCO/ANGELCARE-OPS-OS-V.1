export type HsdStatus = 'draft' | 'active' | 'review' | 'approved' | 'blocked' | 'suspended' | 'retired' | 'archived'
export type HsdAudience = 'b2c' | 'b2b' | 'both'
export type HsdRuleKind = 'mandatory' | 'recommended' | 'conditional' | 'prohibited' | 'blocking' | 'escalation'
export type HsdSeverity = 'information' | 'attention' | 'important' | 'critical' | 'blocking'
export type HsdDecision = 'approve' | 'return' | 'reject' | 'suspend' | 'request_evidence'

export interface ServiceFamily {
  id: string
  tenantId: string
  code: string
  nameFr: string
  descriptionFr: string
  iconKey: string
  sortOrder: number
  status: HsdStatus
  categoryCount?: number
  readinessScore?: number
}

export interface ServiceCategory {
  id: string
  tenantId: string
  familyId: string
  familyCode?: string
  familyName?: string
  code: string
  commercialNameFr: string
  operationalNameFr: string
  descriptionFr: string
  carelinkServiceType: string | null
  audience: HsdAudience
  cities: string[]
  languages: string[]
  beneficiaryProfiles: string[]
  missionFormats: string[]
  status: HsdStatus
  versionNumber: number
  doctrineReadiness: number
  capacityReadiness: number
  activityReadiness: number
  staffingReadiness: number
  safetyReadiness: number
  qualityReadiness: number
  commercialReadiness: number
  overallReadiness: number
  blockers: string[]
  createdAt: string | null
  updatedAt: string | null
}

export interface DossierSection {
  id: string
  categoryId: string
  sectionCode: string
  titleFr: string
  purposeFr: string
  status: HsdStatus
  completionPercent: number
  blockerCount: number
  ownerRole: string
  sortOrder: number
  approvedAt: string | null
}

export interface DoctrineRule {
  id: string
  categoryId: string
  categoryCode?: string
  categoryName?: string
  code: string
  kind: HsdRuleKind
  titleFr: string
  descriptionFr: string
  severity: HsdSeverity
  mandatory: boolean
  blocking: boolean
  applicability: Record<string, unknown>
  requiredEvidence: string[]
  escalationRoute: string | null
  status: HsdStatus
  versionNumber: number
  effectiveFrom: string | null
  effectiveTo: string | null
  createdAt: string | null
  updatedAt: string | null
}

export interface CapacityRule {
  id: string
  categoryId: string
  categoryCode?: string
  categoryName?: string
  minimumHours: number
  maximumHours: number
  maximumConsecutiveDays: number
  maximumNonConsecutiveDays: number
  earliestStartTime: string
  latestEndTime: string
  maxBeneficiariesPerAgent: number
  minimumAgents: number
  backupRequired: boolean
  supervisorRequired: boolean
  leadTimeHours: number
  nightAllowed: boolean
  weekendAllowed: boolean
  holidayAllowed: boolean
  allowedCities: string[]
  conditions: Record<string, unknown>
  status: HsdStatus
  updatedAt: string | null
}

export interface ActivityBlock {
  id: string
  code: string
  nameFr: string
  descriptionFr: string
  blockType: string
  objectiveCodes: string[]
  categoryCodes: string[]
  ageMinMonths: number | null
  ageMaxMonths: number | null
  minMinutes: number
  maxMinutes: number
  energyLevel: 'low' | 'moderate' | 'high' | 'variable'
  locationType: 'indoor' | 'outdoor' | 'transport' | 'hybrid'
  materials: string[]
  competencyCodes: string[]
  riskCodes: string[]
  evidenceCodes: string[]
  repetitionLimitPerDay: number
  status: HsdStatus
  versionNumber: number
  updatedAt: string | null
}

export interface Competency {
  id: string
  code: string
  nameFr: string
  family: string
  descriptionFr: string
  evidenceType: string
  renewalMonths: number | null
  status: HsdStatus
  categoryCount?: number
}

export interface RiskControl {
  id: string
  code: string
  nameFr: string
  descriptionFr: string
  severity: HsdSeverity
  triggerConditions: string[]
  preventiveControls: string[]
  requiredEvidence: string[]
  stopWork: boolean
  escalationRoute: string
  categoryCodes: string[]
  status: HsdStatus
}

export interface ConfigurationImport {
  id: string
  importType: string
  fileName: string
  checksum: string
  status: 'staged' | 'validated' | 'partially_valid' | 'committed' | 'rejected' | 'rolled_back'
  totalRows: number
  validRows: number
  invalidRows: number
  duplicateRows: number
  committedRows: number
  createdBy: string
  createdAt: string | null
  committedAt: string | null
}

export interface ApprovalItem {
  id: string
  entityType: string
  entityId: string
  entityLabel: string
  approvalType: string
  requestedBy: string
  requestedAt: string | null
  assignedRole: string
  status: 'pending' | 'approved' | 'returned' | 'rejected' | 'cancelled'
  consequenceSummary: string
  blockerSummary: string[]
  evidenceCount: number
}

export interface AuditEvent {
  id: string
  actorId: string
  actorLabel: string
  action: string
  entityType: string
  entityId: string
  entityLabel: string
  fromState: string | null
  toState: string | null
  reason: string | null
  consequence: string | null
  correlationId: string
  createdAt: string | null
}

export interface SearchHit {
  id: string
  recordType: string
  code: string
  title: string
  subtitle: string
  status: string
  href: string
  context: string[]
}

export interface ServiceDesignMetrics {
  families: number
  categories: number
  activeCategories: number
  categoriesReady: number
  categoriesBlocked: number
  averageReadiness: number
  doctrineRules: number
  blockingRules: number
  activityBlocks: number
  competencies: number
  risks: number
  safetyBlockers: number
  pendingApprovals: number
  importsRequiringDecision: number
  carelinkMappedCategories: number
}

export interface ServiceDesignSnapshot {
  databaseReady: boolean
  generatedAt: string
  metrics: ServiceDesignMetrics
  families: ServiceFamily[]
  categories: ServiceCategory[]
  doctrineRules: DoctrineRule[]
  capacityRules: CapacityRule[]
  activities: ActivityBlock[]
  competencies: Competency[]
  risks: RiskControl[]
  imports: ConfigurationImport[]
  approvals: ApprovalItem[]
  auditEvents: AuditEvent[]
  warnings: string[]
}

export interface CategoryDossier extends ServiceCategory {
  sections: DossierSection[]
  doctrineRules: DoctrineRule[]
  capacityRule: CapacityRule | null
  activities: ActivityBlock[]
  competencies: Competency[]
  risks: RiskControl[]
  features: Array<Record<string, unknown>>
  topups: Array<Record<string, unknown>>
  upsells: Array<Record<string, unknown>>
  materials: Array<Record<string, unknown>>
  checklistTemplates: Array<Record<string, unknown>>
  reportTemplates: Array<Record<string, unknown>>
  priceEntries: Array<Record<string, unknown>>
}

export interface MutationResult<T = unknown> {
  ok: boolean
  data?: T
  error?: string
  correlationId: string
}
