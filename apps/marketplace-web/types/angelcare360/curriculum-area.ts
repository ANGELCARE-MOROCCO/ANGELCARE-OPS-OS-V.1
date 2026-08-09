export type CurriculumView =
  | 'today'
  | 'catalogue'
  | 'programmes'
  | 'levels-classes'
  | 'coverage'
  | 'evaluation'
  | 'resources'
  | 'attention'
  | 'history'

export type CurriculumDossierKind = 'subject' | 'curriculum' | 'evaluation_policy' | 'resource' | 'issue'
export type CurriculumDossierTab = 'todo' | 'information' | 'levels-classes' | 'objectives' | 'evaluation' | 'resources' | 'versions' | 'history'
export type CurriculumTone = 'neutral' | 'active' | 'verified' | 'warning' | 'critical' | 'decision'
export type CurriculumLifecycle = 'draft' | 'review' | 'ready' | 'active' | 'change_prepared' | 'scheduled' | 'replaced' | 'retired' | 'archived'
export type CurriculumCoverageState = 'complete' | 'complete_with_note' | 'missing' | 'version_update' | 'teacher_missing' | 'evaluation_missing' | 'resource_missing' | 'blocked' | 'not_applicable'

export type CurriculumActionKey =
  | 'subject.create'
  | 'subject.update'
  | 'subject.prepare'
  | 'subject.request_approval'
  | 'subject.activate'
  | 'subject.prepare_version'
  | 'subject.publish_version'
  | 'subject.replace'
  | 'subject.retire'
  | 'subject.archive'
  | 'curriculum.create'
  | 'curriculum.update'
  | 'curriculum.copy_from_previous_year'
  | 'curriculum.add_subject'
  | 'curriculum.remove_future_subject'
  | 'curriculum.bind_level'
  | 'curriculum.bind_class'
  | 'curriculum.unbind_future_class'
  | 'curriculum.preview'
  | 'curriculum.request_approval'
  | 'curriculum.activate'
  | 'curriculum.prepare_replacement'
  | 'curriculum.replace'
  | 'curriculum.retire'
  | 'curriculum.archive'
  | 'learning_objective.create'
  | 'learning_objective.update'
  | 'learning_objective.reorder'
  | 'learning_objective.retire'
  | 'evaluation_policy.create'
  | 'evaluation_policy.update'
  | 'evaluation_policy.request_approval'
  | 'evaluation_policy.activate'
  | 'evaluation_policy.replace'
  | 'evaluation_policy.retire'
  | 'curriculum_resource.link'
  | 'curriculum_resource.unlink_future'
  | 'curriculum_resource.replace'
  | 'curriculum_resource.request_access'
  | 'curriculum_variation.create'
  | 'curriculum_variation.request_approval'
  | 'curriculum_variation.approve'
  | 'curriculum_variation.reject'
  | 'curriculum_variation.retire'
  | 'curriculum_issue.assign'
  | 'curriculum_issue.resolve'
  | 'curriculum_issue.reopen'
  | 'curriculum_task.assign'
  | 'curriculum_task.complete'
  | 'curriculum_task.reopen'
  | 'curriculum_note.add'
  | 'curriculum_evidence.request'

export type CurriculumDirectoryOption = { id: string; label: string; secondary?: string | null }
export type CurriculumMetric = { key: string; label: string; value: string; detail: string; tone: CurriculumTone; view: CurriculumView }

export type CurriculumProductAccess = {
  packageVersionId: string | null
  packageVersionName: string | null
  enabledCurriculumCodes: string[]
  restrictedCurriculumCodes: string[]
  availableOffers: Array<{ code: string; label: string; state: 'included' | 'activated' | 'available' | 'trial' | 'expired' | 'unavailable'; exactCatalogueHref: string | null }>
}

export type LearningObjective = {
  id: string
  subjectId: string | null
  curriculumId: string | null
  title: string
  description: string | null
  levelLabel: string | null
  expectedPeriodId: string | null
  expectedPeriodLabel: string | null
  required: boolean
  observableResult: string | null
  competencyCode: string | null
  sequenceOrder: number
  effectiveFrom: string | null
  effectiveTo: string | null
  state: CurriculumLifecycle
}

export type SubjectVersion = {
  id: string
  subjectId: string
  versionLabel: string
  versionNumber: number
  state: CurriculumLifecycle
  stateLabel: string
  effectiveFrom: string | null
  effectiveTo: string | null
  applicableLevels: string[]
  expectedWeeklyHours: number | null
  evaluationPolicyId: string | null
  resourceIds: string[]
  changeReason: string | null
  replacesVersionId: string | null
  approvedByLabel: string | null
  createdAt: string
}

export type CurriculumBinding = {
  id: string
  curriculumId: string | null
  subjectId: string
  subjectVersionId: string | null
  academicYearId: string | null
  classId: string | null
  classLabel: string | null
  sectionId: string | null
  sectionLabel: string | null
  levelLabel: string | null
  required: boolean
  expectedWeeklyHours: number | null
  teacherAssignmentCount: number
  teacherLabels: string[]
  evaluationPolicyId: string | null
  evaluationState: 'ready' | 'missing' | 'conflict' | 'not_required'
  resourceState: 'ready' | 'missing' | 'restricted' | 'not_required'
  coverageState: CurriculumCoverageState
  coverageLabel: string
  tone: CurriculumTone
  exactClassHref: string | null
  exactAssignmentHref: string | null
}

export type CurriculumSubjectRecord = {
  id: string
  schoolId: string
  code: string
  name: string
  shortName: string | null
  description: string | null
  pedagogicalType: 'required_subject' | 'optional_subject' | 'learning_domain' | 'activity' | 'specialised_programme' | 'workshop' | 'language_programme' | 'cross_project'
  pedagogicalTypeLabel: string
  department: string | null
  languages: string[]
  requiredByDefault: boolean
  applicableLevels: string[]
  lifecycle: CurriculumLifecycle
  lifecycleLabel: string
  tone: CurriculumTone
  currentVersionId: string | null
  currentVersionLabel: string | null
  linkedClasses: number
  teacherCoverageCount: number
  classCoverageCount: number
  evaluationReadyCount: number
  resourceReadyCount: number
  coverageState: CurriculumCoverageState
  coverageLabel: string
  expectedWeeklyHours: number | null
  nextActionKey: CurriculumActionKey | null
  nextActionLabel: string
  versions: SubjectVersion[]
  objectives: LearningObjective[]
  bindings: CurriculumBinding[]
  resourceIds: string[]
  issueIds: string[]
  updatedAt: string | null
}

export type CurriculumFrameworkRecord = {
  id: string
  schoolId: string
  code: string
  name: string
  description: string | null
  academicYearId: string | null
  academicYearLabel: string | null
  institutionId: string | null
  institutionLabel: string | null
  siteId: string | null
  siteLabel: string | null
  applicableLevels: string[]
  lifecycle: CurriculumLifecycle
  lifecycleLabel: string
  tone: CurriculumTone
  currentVersionLabel: string
  subjectIds: string[]
  requiredSubjectIds: string[]
  optionalSubjectIds: string[]
  classIds: string[]
  classLabels: string[]
  objectiveCount: number
  evaluationPolicyCount: number
  resourceCount: number
  coverageComplete: number
  coverageTotal: number
  coverageLabel: string
  nextActionKey: CurriculumActionKey | null
  nextActionLabel: string
  variationIds: string[]
  issueIds: string[]
  updatedAt: string | null
}

export type EvaluationPolicyRecord = {
  id: string
  schoolId: string
  subjectId: string | null
  subjectLabel: string | null
  curriculumId: string | null
  curriculumLabel: string | null
  levelLabel: string | null
  academicYearId: string | null
  method: 'continuous_observation' | 'competency_scale' | 'numeric_grade' | 'descriptive' | 'portfolio' | 'project' | 'participation' | 'none'
  methodLabel: string
  scaleCode: string | null
  requiredPeriodIds: string[]
  evidenceRequired: boolean
  reportCardMapping: string | null
  lifecycle: CurriculumLifecycle
  lifecycleLabel: string
  tone: CurriculumTone
  versionNumber: number
  effectiveFrom: string | null
  effectiveTo: string | null
  classCount: number
  issueIds: string[]
  updatedAt: string | null
}

export type CurriculumResourceRecord = {
  id: string
  schoolId: string
  documentId: string | null
  code: string
  name: string
  category: string
  language: string | null
  subjectId: string | null
  subjectLabel: string | null
  curriculumId: string | null
  curriculumLabel: string | null
  applicableLevels: string[]
  state: 'available' | 'review' | 'missing' | 'restricted' | 'expired' | 'replaced' | 'archived'
  stateLabel: string
  tone: CurriculumTone
  licenceCode: string | null
  entitlementCode: string | null
  effectiveFrom: string | null
  effectiveTo: string | null
  exactHref: string | null
  updatedAt: string | null
}

export type CurriculumVariationRecord = {
  id: string
  curriculumId: string
  curriculumLabel: string
  siteId: string | null
  siteLabel: string | null
  title: string
  reason: string
  lifecycle: 'draft' | 'pending' | 'approved' | 'rejected' | 'retired'
  lifecycleLabel: string
  tone: CurriculumTone
  changes: Record<string, unknown>
  effectiveFrom: string | null
  effectiveTo: string | null
  approvedByLabel: string | null
  updatedAt: string
}

export type CurriculumAttentionItem = {
  id: string
  sourceType: 'subject' | 'curriculum' | 'binding' | 'evaluation_policy' | 'resource' | 'variation' | 'product_access'
  sourceId: string
  title: string
  explanation: string
  consequence: string | null
  severity: 'blocking' | 'warning' | 'information'
  tone: CurriculumTone
  ownerLabel: string | null
  dueAt: string | null
  recommendedActionKey: CurriculumActionKey | null
  recommendedActionLabel: string | null
  exactHref: string | null
  resolved: boolean
}

export type CurriculumTask = {
  id: string
  subjectId: string | null
  curriculumId: string | null
  issueId: string | null
  title: string
  description: string | null
  state: 'open' | 'owned' | 'in_progress' | 'completed' | 'cancelled' | 'reopened'
  priority: 'low' | 'normal' | 'high' | 'critical'
  ownerUserId: string | null
  ownerLabel: string | null
  dueAt: string | null
  createdAt: string
  updatedAt: string
}

export type CurriculumNote = {
  id: string
  subjectId: string | null
  curriculumId: string | null
  issueId: string | null
  body: string
  important: boolean
  authorLabel: string
  createdAt: string
}

export type CurriculumHistoryEvent = {
  id: string
  label: string
  detail: string | null
  actorLabel: string | null
  createdAt: string
  tone: CurriculumTone
  sourceType: string | null
  sourceId: string | null
}

export type CurriculumSnapshot = {
  generatedAt: string
  mode: 'single_school' | 'multi_site'
  title: string
  subtitle: string
  school: { id: string; name: string; siteCount: number; currentAcademicYearId: string | null; currentAcademicYearLabel: string | null }
  viewer: { roleLabel: string; accessLevel: string; canEdit: boolean; canApprove: boolean; canManageCommercialAccess: boolean }
  metrics: CurriculumMetric[]
  subjects: CurriculumSubjectRecord[]
  curricula: CurriculumFrameworkRecord[]
  bindings: CurriculumBinding[]
  evaluationPolicies: EvaluationPolicyRecord[]
  resources: CurriculumResourceRecord[]
  variations: CurriculumVariationRecord[]
  attention: CurriculumAttentionItem[]
  tasks: CurriculumTask[]
  notes: CurriculumNote[]
  history: CurriculumHistoryEvent[]
  productAccess: CurriculumProductAccess
  directory: {
    academicYears: CurriculumDirectoryOption[]
    periods: CurriculumDirectoryOption[]
    institutions: CurriculumDirectoryOption[]
    sites: CurriculumDirectoryOption[]
    levels: CurriculumDirectoryOption[]
    classes: CurriculumDirectoryOption[]
    sections: CurriculumDirectoryOption[]
    subjects: CurriculumDirectoryOption[]
    curricula: CurriculumDirectoryOption[]
    staff: CurriculumDirectoryOption[]
    resources: CurriculumDirectoryOption[]
  }
}

export type CurriculumActionRequest = {
  actionKey: CurriculumActionKey
  subjectId?: string | null
  curriculumId?: string | null
  evaluationPolicyId?: string | null
  resourceId?: string | null
  variationId?: string | null
  issueId?: string | null
  objectiveId?: string | null
  bindingId?: string | null
  reason?: string | null
  effectiveAt?: string | null
  payload?: Record<string, unknown>
  idempotencyKey?: string | null
}

export type CurriculumActionResult = {
  ok: boolean
  state: 'completed' | 'preview' | 'partially_failed'
  message: string
  subjectId?: string | null
  curriculumId?: string | null
  evaluationPolicyId?: string | null
  resourceId?: string | null
  result?: Record<string, unknown>
  snapshot?: CurriculumSnapshot
}
