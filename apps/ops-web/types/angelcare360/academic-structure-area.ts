export type AcademicStructureView =
  | 'today'
  | 'years'
  | 'periods'
  | 'calendar'
  | 'preparation'
  | 'closure'
  | 'next-year'
  | 'attention'
  | 'history'

export type AcademicDossierKind = 'academic_year' | 'period' | 'transition'

export type AcademicDossierTab =
  | 'todo'
  | 'information'
  | 'periods-calendar'
  | 'organisation'
  | 'closure'
  | 'next-year'
  | 'history'

export type AcademicTone = 'critical' | 'warning' | 'active' | 'verified' | 'decision' | 'neutral'
export type AcademicAttentionSeverity = 'blocking' | 'warning' | 'information'
export type AcademicRequirementState = 'complete' | 'to_complete' | 'to_verify' | 'blocked' | 'not_applicable'
export type AcademicHumanStatus =
  | 'draft'
  | 'to_verify'
  | 'ready'
  | 'active'
  | 'closing'
  | 'closed'
  | 'reopened'
  | 'archived'

export type AcademicStructureActionKey =
  | 'academic_year.create'
  | 'academic_year.update'
  | 'academic_year.prepare'
  | 'academic_year.request_activation'
  | 'academic_year.activate'
  | 'academic_year.begin_closure'
  | 'academic_year.request_closure'
  | 'academic_year.request_reopen'
  | 'academic_year.close'
  | 'academic_year.reopen'
  | 'academic_year.archive'
  | 'academic_period.create'
  | 'academic_period.update'
  | 'academic_period.reorder'
  | 'academic_period.verify_calendar'
  | 'academic_period.activate'
  | 'academic_period.begin_closure'
  | 'academic_period.request_closure'
  | 'academic_period.close'
  | 'academic_period.reopen'
  | 'academic_period.request_reopen'
  | 'academic_period.replace'
  | 'academic_transition.prepare_target'
  | 'academic_transition.copy_structure'
  | 'academic_transition.generate_proposals'
  | 'academic_transition.update_decision'
  | 'academic_transition.bulk_approve'
  | 'academic_transition.request_approval'
  | 'academic_transition.execute'
  | 'academic_transition.retry_item'
  | 'academic_transition.verify'
  | 'academic_transition.complete'
  | 'academic_exception.assign'
  | 'academic_exception.resolve'
  | 'academic_exception.reopen'
  | 'academic_task.assign'
  | 'academic_task.start'
  | 'academic_task.complete'
  | 'academic_task.reopen'
  | 'academic_note.add'
  | 'academic_evidence.request'

export type AcademicRequirement = {
  key: string
  label: string
  explanation: string
  passed: boolean
  applicable: boolean
  blocking: boolean
  state: AcademicRequirementState
  ownerLabel: string | null
  dueAt: string | null
  sourceType: string | null
  sourceId: string | null
  actionLabel: string | null
  actionKey: AcademicStructureActionKey | null
  exactHref: string | null
}

export type AcademicAttentionItem = {
  id: string
  academicYearId: string | null
  periodId: string | null
  transitionRunId: string | null
  title: string
  explanation: string
  consequence: string
  severity: AcademicAttentionSeverity
  tone: AcademicTone
  ownerLabel: string | null
  dueAt: string | null
  recommendedActionLabel: string
  actionKey: AcademicStructureActionKey | null
  exactHref: string | null
  sourceType: string
  sourceId: string | null
}

export type AcademicTask = {
  id: string
  academicYearId: string
  periodId: string | null
  transitionRunId: string | null
  title: string
  description: string | null
  state: 'open' | 'assigned' | 'in_progress' | 'waiting' | 'completed' | 'cancelled' | 'reopened'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  ownerUserId: string | null
  ownerLabel: string | null
  dueAt: string | null
  createdAt: string
  updatedAt: string
}

export type AcademicNote = {
  id: string
  academicYearId: string
  periodId: string | null
  transitionRunId: string | null
  body: string
  important: boolean
  authorLabel: string
  createdAt: string
}

export type AcademicHistoryEvent = {
  id: string
  label: string
  detail: string | null
  actorLabel: string | null
  createdAt: string
  tone: AcademicTone
  sourceType: string | null
  sourceId: string | null
}

export type AcademicCalendarFinding = {
  id: string
  academicYearId: string
  periodId: string | null
  findingType: 'overlap' | 'gap' | 'outside_year' | 'invalid_dates' | 'duplicate_active' | 'missing_period' | 'closure_dependency'
  title: string
  explanation: string
  severity: AcademicAttentionSeverity
  tone: AcademicTone
  resolved: boolean
  exactHref: string | null
}

export type AcademicPeriodRecord = {
  id: string
  academicYearId: string
  code: string
  label: string
  startsOn: string
  endsOn: string
  orderIndex: number
  technicalStatus: string
  status: AcademicHumanStatus
  statusLabel: string
  tone: AcademicTone
  termType: string | null
  daysRemaining: number | null
  isCurrent: boolean
  closureBlockers: number
  attention: AcademicAttentionItem[]
  findings: AcademicCalendarFinding[]
  updatedAt: string | null
}

export type AcademicTransitionDecision =
  | 'promote'
  | 'repeat'
  | 'change_class'
  | 'change_section'
  | 'change_institution'
  | 'suspend'
  | 'withdraw'
  | 'graduate'
  | 'reenroll'
  | 'undecided'

export type AcademicTransitionItem = {
  id: string
  runId: string
  studentId: string
  studentLabel: string
  sourceClassId: string | null
  sourceClassLabel: string | null
  proposedDecision: AcademicTransitionDecision
  finalDecision: AcademicTransitionDecision
  targetClassId: string | null
  targetClassLabel: string | null
  targetSectionId: string | null
  state: 'proposed' | 'approved' | 'excluded' | 'executing' | 'completed' | 'failed'
  capacityConflict: boolean
  blockerReason: string | null
  ownerLabel: string | null
  executionId: string | null
  updatedAt: string
}

export type AcademicTransitionRun = {
  id: string
  sourceAcademicYearId: string
  targetAcademicYearId: string
  sourceAcademicYearLabel: string
  targetAcademicYearLabel: string
  state: 'draft' | 'prepared' | 'reviewing' | 'approval_requested' | 'approved' | 'executing' | 'partially_failed' | 'completed' | 'verified'
  totalItems: number
  readyItems: number
  decisionRequired: number
  capacityConflicts: number
  failedItems: number
  completedItems: number
  approvedByLabel: string | null
  executedAt: string | null
  verifiedAt: string | null
  items: AcademicTransitionItem[]
  updatedAt: string
}

export type AcademicYearRecord = {
  id: string
  code: string
  label: string
  startsOn: string
  endsOn: string
  technicalStatus: string
  status: AcademicHumanStatus
  statusLabel: string
  tone: AcademicTone
  isCurrent: boolean
  currentPeriodId: string | null
  currentPeriodLabel: string | null
  responsibleUserId: string | null
  responsibleLabel: string | null
  classCount: number
  childrenCount: number
  periodCount: number
  preparationComplete: number
  preparationRequired: number
  blockersCount: number
  warningsCount: number
  closureBlockers: number
  nextActionLabel: string
  nextActionKey: AcademicStructureActionKey | null
  successorYearId: string | null
  successorYearLabel: string | null
  periods: AcademicPeriodRecord[]
  requirements: AcademicRequirement[]
  attention: AcademicAttentionItem[]
  tasks: AcademicTask[]
  notes: AcademicNote[]
  history: AcademicHistoryEvent[]
  transition: AcademicTransitionRun | null
  updatedAt: string | null
}

export type AcademicStructureViewer = {
  userId: string
  displayName: string
  roleLabel: string
  canEdit: boolean
  canActivate: boolean
  canClose: boolean
  canReopen: boolean
  canExecuteTransition: boolean
  canAssign: boolean
  canViewHistory: boolean
}

export type AcademicDirectoryOption = {
  id: string
  label: string
  secondary: string | null
}

export type AcademicStructureSnapshot = {
  generatedAt: string
  mode: 'single' | 'multi'
  title: string
  subtitle: string
  school: {
    id: string
    name: string
    siteCount: number
  }
  viewer: AcademicStructureViewer
  years: AcademicYearRecord[]
  currentYearId: string | null
  currentYear: AcademicYearRecord | null
  attention: AcademicAttentionItem[]
  calendarFindings: AcademicCalendarFinding[]
  transitionRuns: AcademicTransitionRun[]
  directory: {
    staff: AcademicDirectoryOption[]
    classes: AcademicDirectoryOption[]
    sections: AcademicDirectoryOption[]
  }
  metrics: Array<{
    key: string
    label: string
    value: string
    detail: string
    tone: AcademicTone
    view: AcademicStructureView
  }>
  history: AcademicHistoryEvent[]
  warnings: string[]
}

export type AcademicStructureActionRequest = {
  actionKey: AcademicStructureActionKey
  academicYearId?: string | null
  periodId?: string | null
  transitionRunId?: string | null
  transitionItemId?: string | null
  taskId?: string | null
  reason?: string | null
  effectiveAt?: string | null
  idempotencyKey?: string | null
  payload?: Record<string, unknown>
}

export type AcademicStructureActionResult = {
  ok: boolean
  state: 'completed' | 'blocked' | 'approval_required' | 'replayed' | 'partially_failed' | 'failed'
  message: string
  academicYearId?: string | null
  periodId?: string | null
  transitionRunId?: string | null
  blockers?: string[]
  warnings?: string[]
  result?: Record<string, unknown>
}
