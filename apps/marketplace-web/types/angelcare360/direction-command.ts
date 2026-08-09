export type DirectionPlaneKey =
  | 'today'
  | 'network'
  | 'decisions'
  | 'risks'
  | 'commitments'
  | 'performance'
  | 'calendar'
  | 'audit'

export type DirectionDomainKey =
  | 'governance'
  | 'people'
  | 'admissions'
  | 'attendance'
  | 'academics'
  | 'finance'
  | 'payroll'
  | 'transport'
  | 'quality'
  | 'communications'
  | 'compliance'

export type DirectionMatterState =
  | 'new'
  | 'acknowledged'
  | 'owned'
  | 'in_progress'
  | 'waiting_evidence'
  | 'decision_required'
  | 'approved_execution'
  | 'executing'
  | 'resolved'
  | 'released'
  | 'snoozed'
  | 'reopened'
  | 'rejected'
  | 'cancelled'

export type DirectionSeverity = 'critical' | 'high' | 'medium' | 'low' | 'information'

export type DirectionTone = 'critical' | 'warning' | 'active' | 'verified' | 'decision' | 'neutral'

export type DirectionMatterAction =
  | 'acknowledge'
  | 'take_ownership'
  | 'assign'
  | 'mark_checked'
  | 'request_evidence'
  | 'add_note'
  | 'snooze'
  | 'escalate'
  | 'resolve'
  | 'release'
  | 'reopen'
  | 'approve'
  | 'reject'
  | 'conditional_approval'

export type DirectionLinkedRecord = {
  id: string
  type: string
  label: string
  secondary: string | null
  status: string | null
  href: string
}

export type DirectionEvidenceItem = {
  id: string
  label: string
  kind: 'document' | 'record' | 'calculation' | 'communication' | 'event' | 'note'
  state: 'available' | 'missing' | 'requested' | 'verified'
  href: string | null
  createdAt: string | null
}

export type DirectionTimelineEvent = {
  id: string
  eventType: string
  label: string
  detail: string | null
  actorLabel: string | null
  createdAt: string
  tone: DirectionTone
}

export type DirectionImpact = {
  operational: string | null
  financialMinor: number | null
  peopleCount: number | null
  familyCount: number | null
  compliance: string | null
  dependencies: string[]
}

export type DirectionMatter = {
  id: string
  fingerprint: string
  title: string
  summary: string
  domain: DirectionDomainKey
  sourceType: string
  sourceId: string
  sourceLabel: string
  state: DirectionMatterState
  severity: DirectionSeverity
  tone: DirectionTone
  lane: 'immediate' | 'decision' | 'overdue' | 'watch' | 'resolved'
  ownerUserId: string | null
  ownerLabel: string | null
  dueAt: string | null
  detectedAt: string
  updatedAt: string
  acknowledgedAt: string | null
  checkedAt: string | null
  resolvedAt: string | null
  resolutionReason: string | null
  exactHref: string
  availableActions: DirectionMatterAction[]
  impact: DirectionImpact
  linkedRecords: DirectionLinkedRecord[]
  evidence: DirectionEvidenceItem[]
  timeline: DirectionTimelineEvent[]
  metadata: Record<string, unknown>
}

export type DirectionDecision = {
  id: string
  decisionCode: string
  title: string
  question: string
  domain: DirectionDomainKey
  state: 'draft' | 'submitted' | 'evidence_required' | 'approved' | 'conditionally_approved' | 'rejected' | 'executing' | 'executed' | 'cancelled'
  severity: DirectionSeverity
  matterId: string | null
  ownerLabel: string | null
  dueAt: string | null
  options: Array<{ key: string; label: string; consequence: string }>
  recommendedOptionKey: string | null
  selectedOptionKey: string | null
  conditions: string[]
  impact: DirectionImpact
  createdAt: string
  updatedAt: string
}

export type DirectionCommitment = {
  id: string
  commitmentCode: string
  title: string
  domain: DirectionDomainKey
  state: 'open' | 'acknowledged' | 'in_progress' | 'blocked' | 'completed' | 'cancelled'
  ownerLabel: string | null
  dueAt: string | null
  progressPercent: number
  blocker: string | null
  nextCheckpoint: string | null
  matterId: string | null
  exactHref: string | null
  createdAt: string
  updatedAt: string
}

export type DirectionDomainPosture = {
  domain: DirectionDomainKey
  label: string
  tone: DirectionTone
  posture: 'stable' | 'attention' | 'critical' | 'unconfigured'
  openMatters: number
  criticalMatters: number
  decisionsRequired: number
  financialExposureMinor: number
  peopleAffected: number
  oldestUnresolvedAt: string | null
  ownerLabel: string | null
  nextDeadline: string | null
}

export type DirectionSitePosture = {
  id: string
  label: string
  status: string
  readinessPercent: number | null
  attendanceTone: DirectionTone
  admissionsTone: DirectionTone
  financeTone: DirectionTone
  workforceTone: DirectionTone
  incidents: number
  complianceTone: DirectionTone
  openMatters: number
}

export type DirectionExecutiveMetric = {
  key: string
  label: string
  value: string
  detail: string
  tone: DirectionTone
  filter: string
}

export type DirectionBriefing = {
  id: string
  briefingType: 'morning' | 'end_of_day' | 'weekly' | 'site' | 'financial_risk' | 'people_workforce'
  title: string
  generatedAt: string
  posture: string
  topMatters: DirectionMatter[]
  decisionsRequired: DirectionDecision[]
  commitmentsDue: DirectionCommitment[]
  completedActions: DirectionTimelineEvent[]
  executiveSummary: string[]
}

export type DirectionCommandSnapshot = {
  generatedAt: string
  school: {
    id: string
    name: string
    code: string
    status: string
    academicYearLabel: string | null
    timezone: string
    currency: string
  }
  viewer: {
    userId: string
    displayName: string
    roleLabel: string
    accessLevel: string
    canDecide: boolean
    canIntervene: boolean
    canViewSensitiveFinance: boolean
    canViewAudit: boolean
  }
  posture: {
    state: 'stable' | 'attention' | 'critical'
    label: string
    score: number
    rationale: string
  }
  metrics: DirectionExecutiveMetric[]
  matters: DirectionMatter[]
  decisions: DirectionDecision[]
  commitments: DirectionCommitment[]
  domains: DirectionDomainPosture[]
  sites: DirectionSitePosture[]
  activity: DirectionTimelineEvent[]
  warnings: string[]
}

export type DirectionMatterActionRequest = {
  action: DirectionMatterAction
  matterId: string
  fingerprint?: string | null
  reason?: string | null
  note?: string | null
  assigneeUserId?: string | null
  assigneeLabel?: string | null
  dueAt?: string | null
  snoozedUntil?: string | null
  idempotencyKey?: string | null
  matterSnapshot?: Partial<DirectionMatter> | null
}

export type DirectionDecisionCreateRequest = {
  state?: 'draft' | 'submitted'
  matterId?: string | null
  title: string
  question: string
  domain: DirectionDomainKey
  severity: DirectionSeverity
  dueAt?: string | null
  ownerLabel?: string | null
  recommendedOptionKey?: string | null
  options: Array<{ key: string; label: string; consequence: string }>
  conditions?: string[]
  impact?: Partial<DirectionImpact>
  evidenceIds?: string[]
  idempotencyKey?: string | null
}

export type DirectionDecisionActionRequest = {
  decisionId: string
  action: 'submit' | 'request_evidence' | 'approve' | 'conditional_approval' | 'reject' | 'execute' | 'cancel'
  selectedOptionKey?: string | null
  reason?: string | null
  conditions?: string[]
  idempotencyKey?: string | null
}


export type DirectionCommitmentCreateRequest = {
  matterId?: string | null
  decisionId?: string | null
  title: string
  domain: DirectionDomainKey
  ownerLabel?: string | null
  dueAt?: string | null
  nextCheckpoint?: string | null
  evidenceRequired?: string[]
  exactHref?: string | null
  idempotencyKey?: string | null
}

export type DirectionCommitmentActionRequest = {
  commitmentId: string
  action: 'acknowledge' | 'start' | 'update' | 'block' | 'complete' | 'reopen' | 'cancel'
  progressPercent?: number | null
  blocker?: string | null
  nextCheckpoint?: string | null
  dueAt?: string | null
  reason?: string | null
  idempotencyKey?: string | null
}

export type DirectionCommandResult = {
  ok: boolean
  message: string
  matter?: DirectionMatter | null
  decision?: DirectionDecision | null
  commitment?: DirectionCommitment | null
  briefing?: DirectionBriefing | null
  snapshot?: DirectionCommandSnapshot | null
  replayed?: boolean
}
