export type GovernancePlaneKey =
  | 'institutions'
  | 'academic-structure'
  | 'classes-capacity'
  | 'subjects'
  | 'assignments'
  | 'roles-permissions'
  | 'settings'
  | 'audit'

export type GovernanceEntityType =
  | 'institution'
  | 'academic_year'
  | 'term'
  | 'class'
  | 'section'
  | 'subject'
  | 'assignment'
  | 'role'
  | 'delegation'
  | 'configuration'
  | 'rollover'
  | 'matter'
  | 'audit_event'

export type GovernanceTone = 'critical' | 'warning' | 'active' | 'verified' | 'decision' | 'neutral'
export type GovernanceSeverity = 'critical' | 'high' | 'medium' | 'low' | 'information'
export type GovernanceMatterState =
  | 'new'
  | 'acknowledged'
  | 'owned'
  | 'in_progress'
  | 'waiting_evidence'
  | 'decision_required'
  | 'approved_execution'
  | 'resolved'
  | 'released'
  | 'snoozed'
  | 'reopened'
  | 'cancelled'

export type GovernanceMatterAction =
  | 'acknowledge'
  | 'take_ownership'
  | 'assign'
  | 'verify'
  | 'request_evidence'
  | 'add_note'
  | 'schedule_review'
  | 'snooze'
  | 'escalate_direction'
  | 'resolve'
  | 'release'
  | 'reopen'

export type GovernanceOperationKey =
  | 'governance.institution.create'
  | 'governance.institution.review'
  | 'governance.institution.activate'
  | 'governance.institution.suspend'
  | 'governance.institution.reactivate'
  | 'governance.institution.close'
  | 'governance.institution.archive'
  | 'governance.academic_year.create'
  | 'governance.academic_year.publish'
  | 'governance.academic_year.activate'
  | 'governance.academic_year.close'
  | 'governance.academic_year.reopen'
  | 'governance.rollover.preview'
  | 'governance.rollover.execute'
  | 'governance.rollover.repair'
  | 'governance.period.create'
  | 'governance.period.publish'
  | 'governance.period.close'
  | 'governance.period.reopen'
  | 'governance.class.create'
  | 'governance.section.create'
  | 'governance.capacity.change'
  | 'governance.population.move'
  | 'governance.enrollment.freeze'
  | 'governance.subject.create'
  | 'governance.subject.publish'
  | 'governance.subject.replace'
  | 'governance.subject.retire'
  | 'governance.assignment.create'
  | 'governance.assignment.change'
  | 'governance.assignment.replace'
  | 'governance.assignment.end'
  | 'governance.role.create'
  | 'governance.role.publish'
  | 'governance.role.assign'
  | 'governance.role.revoke'
  | 'governance.delegation.create'
  | 'governance.delegation.revoke'
  | 'governance.configuration.publish'
  | 'governance.configuration.rollback'
  | 'governance.matter.action'
  | 'governance.briefing.generate'

export type GovernanceMetric = {
  key: string
  label: string
  value: string
  detail: string
  tone: GovernanceTone
  filter: string
}

export type GovernanceLinkedRecord = {
  id: string
  type: GovernanceEntityType | string
  label: string
  secondary: string | null
  status: string | null
  exactHref: string
}

export type GovernanceTimelineEvent = {
  id: string
  label: string
  detail: string | null
  actorLabel: string | null
  createdAt: string
  tone: GovernanceTone
  entityType?: string | null
  entityId?: string | null
}

export type GovernanceMatter = {
  id: string
  fingerprint: string
  title: string
  summary: string
  category:
    | 'activation'
    | 'academic_structure'
    | 'capacity'
    | 'subject_coverage'
    | 'assignment'
    | 'access'
    | 'configuration'
    | 'rollover'
    | 'closure'
  sourceType: string
  sourceId: string
  sourceLabel: string
  state: GovernanceMatterState
  severity: GovernanceSeverity
  tone: GovernanceTone
  lane: 'activation' | 'decision' | 'conflict' | 'publication' | 'resolved'
  ownerUserId: string | null
  ownerLabel: string | null
  dueAt: string | null
  detectedAt: string
  updatedAt: string
  acknowledgedAt: string | null
  verifiedAt: string | null
  resolvedAt: string | null
  resolutionReason: string | null
  exactHref: string
  availableActions: GovernanceMatterAction[]
  impact: {
    institutions: number
    students: number
    staff: number
    classes: number
    operational: string | null
    financial: string | null
    dependencies: string[]
  }
  linkedRecords: GovernanceLinkedRecord[]
  timeline: GovernanceTimelineEvent[]
  metadata: Record<string, unknown>
}

export type GovernanceEntityRecord = {
  id: string
  type: GovernanceEntityType
  code: string
  title: string
  subtitle: string
  status: string
  lifecycleState: string
  tone: GovernanceTone
  exactHref: string
  createdAt: string | null
  updatedAt: string | null
  metrics: Array<{ label: string; value: string; tone?: GovernanceTone }>
  metadata: Record<string, unknown>
}

export type GovernanceInstitutionRecord = GovernanceEntityRecord & {
  type: 'institution'
  city: string | null
  schoolType: string
  readinessState: 'ready' | 'ready_with_warnings' | 'incomplete' | 'blocked' | 'expired'
  readinessPassed: number
  readinessRequired: number
  activeStudents: number
  classCapacity: number
  currentAcademicYearLabel: string | null
  administrators: number
  findings: number
}

export type GovernanceAcademicYearRecord = GovernanceEntityRecord & {
  type: 'academic_year'
  startsOn: string
  endsOn: string
  isCurrent: boolean
  termCount: number
  classCount: number
  studentCount: number
  rolloverState: string
  closureBlockers: number
}

export type GovernanceCapacityRecord = GovernanceEntityRecord & {
  type: 'class' | 'section'
  institutionId: string
  academicYearId: string
  classId: string | null
  level: string | null
  targetCapacity: number
  currentStudents: number
  reservedSeats: number
  availableSeats: number
  utilizationPercent: number
  waitingAdmissions: number
  rolloverProposals: number
  conflictState: 'stable' | 'warning' | 'overcapacity' | 'unconfigured'
}

export type GovernanceSubjectRecord = GovernanceEntityRecord & {
  type: 'subject'
  department: string | null
  linkedClasses: number
  teacherAssignments: number
  coverageState: 'covered' | 'partial' | 'uncovered' | 'inactive'
  versionNumber: number
}

export type GovernanceAssignmentRecord = GovernanceEntityRecord & {
  type: 'assignment'
  staffId: string
  staffLabel: string
  classId: string | null
  classLabel: string | null
  sectionId: string | null
  sectionLabel: string | null
  subjectId: string | null
  subjectLabel: string | null
  weeklyHours: number
  effectiveFrom: string | null
  effectiveTo: string | null
  conflictCount: number
}

export type GovernanceRoleRecord = GovernanceEntityRecord & {
  type: 'role'
  roleKey: string
  scope: string
  permissionCount: number
  userCount: number
  sensitivePermissionCount: number
  versionNumber: number
  systemLocked: boolean
}

export type GovernanceDelegationRecord = GovernanceEntityRecord & {
  type: 'delegation'
  userId: string
  userLabel: string
  roleId: string
  roleLabel: string
  scopeType: string
  scopeId: string | null
  startsAt: string
  endsAt: string | null
  reviewAt: string | null
}

export type GovernanceConfigurationRecord = GovernanceEntityRecord & {
  type: 'configuration'
  configurationKey: string
  ownership: 'operator' | 'tenant' | 'institution' | 'policy' | 'derived'
  versionNumber: number
  effectiveFrom: string | null
  effectiveTo: string | null
  currentValue: unknown
  proposedValue: unknown
  changeCount: number
}

export type GovernanceBriefing = {
  id: string
  briefingType: 'readiness' | 'academic_structure' | 'capacity_risk' | 'assignment_coverage' | 'access' | 'rollover' | 'configuration' | 'weekly'
  title: string
  generatedAt: string
  posture: string
  summary: string[]
  matterIds: string[]
}

export type GovernanceDirectoryOption = {
  id: string
  label: string
  secondary: string | null
}

export type GovernanceCommandSnapshot = {
  generatedAt: string
  school: {
    id: string
    name: string
    code: string
    city: string | null
    status: string
    currentAcademicYearId: string | null
    currentAcademicYearLabel: string | null
    timezone: string
    currency: string
  }
  viewer: {
    userId: string
    displayName: string
    roleLabel: string
    canConfigure: boolean
    canApprove: boolean
    canManageAccess: boolean
    canViewAudit: boolean
  }
  posture: {
    state: 'stable' | 'attention' | 'critical'
    label: string
    rationale: string
  }
  metrics: GovernanceMetric[]
  institutions: GovernanceInstitutionRecord[]
  academicYears: GovernanceAcademicYearRecord[]
  terms: GovernanceEntityRecord[]
  capacities: GovernanceCapacityRecord[]
  subjects: GovernanceSubjectRecord[]
  assignments: GovernanceAssignmentRecord[]
  roles: GovernanceRoleRecord[]
  directory: {
    staff: GovernanceDirectoryOption[]
    users: GovernanceDirectoryOption[]
    subjects: GovernanceDirectoryOption[]
    roles: GovernanceDirectoryOption[]
  }
  delegations: GovernanceDelegationRecord[]
  configurations: GovernanceConfigurationRecord[]
  matters: GovernanceMatter[]
  activity: GovernanceTimelineEvent[]
  briefings: GovernanceBriefing[]
  warnings: string[]
}

export type GovernanceMatterActionRequest = {
  action: GovernanceMatterAction
  matterId: string
  fingerprint?: string | null
  reason?: string | null
  note?: string | null
  assigneeUserId?: string | null
  assigneeLabel?: string | null
  dueAt?: string | null
  snoozedUntil?: string | null
  idempotencyKey?: string | null
  matterSnapshot?: Partial<GovernanceMatter> | null
}

export type GovernanceEntityActionRequest = {
  operationKey: GovernanceOperationKey
  entityType: GovernanceEntityType
  entityId?: string | null
  reason?: string | null
  effectiveAt?: string | null
  idempotencyKey?: string | null
  payload?: Record<string, unknown>
}

export type GovernanceCreateRequest = {
  entityType: GovernanceEntityType
  idempotencyKey?: string | null
  payload: Record<string, unknown>
}

export type GovernanceCommandResult = {
  ok: boolean
  state: 'completed' | 'blocked' | 'approval_required' | 'failed' | 'replayed'
  message: string
  operationKey?: GovernanceOperationKey | null
  executionId?: string | null
  entityId?: string | null
  matterId?: string | null
  blockers?: string[]
  warnings?: string[]
  result?: Record<string, unknown>
}
