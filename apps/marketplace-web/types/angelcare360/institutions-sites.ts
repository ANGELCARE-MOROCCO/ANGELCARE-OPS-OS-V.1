export type InstitutionAreaView =
  | 'today'
  | 'schools'
  | 'sites'
  | 'preparation'
  | 'openings'
  | 'attention'
  | 'history'

export type InstitutionDossierTab =
  | 'todo'
  | 'information'
  | 'organisation'
  | 'team-access'
  | 'documents'
  | 'history'

export type InstitutionKind = 'school' | 'site'
export type InstitutionHumanStatus =
  | 'to_complete'
  | 'preparing'
  | 'ready_to_open'
  | 'open'
  | 'suspended'
  | 'closing'
  | 'closed'
  | 'archived'

export type InstitutionTone = 'critical' | 'warning' | 'active' | 'verified' | 'decision' | 'neutral'
export type InstitutionAttentionSeverity = 'blocking' | 'warning' | 'information'

export type InstitutionRequirement = {
  key: string
  label: string
  explanation: string
  passed: boolean
  applicable: boolean
  blocking: boolean
  status: 'complete' | 'to_complete' | 'to_verify' | 'blocked' | 'not_applicable'
  sourceType: string | null
  sourceId: string | null
  actionLabel: string | null
  actionKey: InstitutionAreaActionKey | null
  exactHref: string | null
  ownerLabel: string | null
  dueAt: string | null
}

export type InstitutionAttentionItem = {
  id: string
  institutionId: string
  institutionKind: InstitutionKind
  title: string
  explanation: string
  consequence: string
  severity: InstitutionAttentionSeverity
  tone: InstitutionTone
  ownerLabel: string | null
  dueAt: string | null
  recommendedActionLabel: string
  actionKey: InstitutionAreaActionKey | null
  exactHref: string | null
  sourceType: string
  sourceId: string | null
}

export type InstitutionDocument = {
  id: string
  title: string
  category: string
  status: 'missing' | 'to_verify' | 'verified' | 'expired' | 'replaced'
  fileName: string | null
  filePath: string | null
  createdAt: string | null
  updatedAt: string | null
  expiresAt: string | null
  uploadedByLabel: string | null
  verifiedByLabel: string | null
}

export type InstitutionTask = {
  id: string
  title: string
  description: string | null
  state: 'open' | 'assigned' | 'in_progress' | 'waiting' | 'completed' | 'cancelled' | 'reopened'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  ownerUserId: string | null
  ownerLabel: string | null
  dueAt: string | null
  sourceType: string | null
  sourceId: string | null
  createdAt: string
  updatedAt: string
}

export type InstitutionNote = {
  id: string
  body: string
  important: boolean
  authorLabel: string
  createdAt: string
}

export type InstitutionHistoryEvent = {
  id: string
  label: string
  detail: string | null
  actorLabel: string | null
  createdAt: string
  tone: InstitutionTone
}

export type InstitutionRecord = {
  id: string
  kind: InstitutionKind
  parentSchoolId: string | null
  code: string
  name: string
  legalName: string | null
  schoolType: string
  city: string | null
  address: string | null
  phone: string | null
  email: string | null
  website: string | null
  timezone: string
  operatingHours: string | null
  publicDescription: string | null
  responsibleUserId: string | null
  responsibleLabel: string | null
  coordinatorUserId: string | null
  coordinatorLabel: string | null
  status: InstitutionHumanStatus
  technicalStatus: string
  statusExplanation: string
  tone: InstitutionTone
  currentAcademicYearId: string | null
  currentAcademicYearLabel: string | null
  activeChildren: number
  classesCount: number
  capacity: number
  activeUsers: number
  sitesCount: number
  requirementsComplete: number
  requirementsRequired: number
  blockersCount: number
  warningsCount: number
  nextActionLabel: string
  nextActionKey: InstitutionAreaActionKey | null
  updatedAt: string | null
  requirements: InstitutionRequirement[]
  attention: InstitutionAttentionItem[]
  documents: InstitutionDocument[]
  tasks: InstitutionTask[]
  notes: InstitutionNote[]
  history: InstitutionHistoryEvent[]
}

export type InstitutionAreaViewer = {
  userId: string
  displayName: string
  roleLabel: string
  canEdit: boolean
  canApproveOpening: boolean
  canSuspend: boolean
  canClose: boolean
  canAssign: boolean
  canViewHistory: boolean
}

export type InstitutionAreaDirectoryOption = {
  id: string
  label: string
  secondary: string | null
}

export type InstitutionAreaSnapshot = {
  generatedAt: string
  mode: 'single' | 'multi'
  title: string
  subtitle: string
  viewer: InstitutionAreaViewer
  institutions: InstitutionRecord[]
  attention: InstitutionAttentionItem[]
  directory: {
    staff: InstitutionAreaDirectoryOption[]
    users: InstitutionAreaDirectoryOption[]
  }
  metrics: Array<{
    key: string
    label: string
    value: string
    detail: string
    tone: InstitutionTone
    view: InstitutionAreaView
  }>
  warnings: string[]
}

export type InstitutionAreaActionKey =
  | 'institution.update_information'
  | 'institution.assign_responsible'
  | 'institution.request_document'
  | 'institution.verify_document'
  | 'institution.prepare_opening'
  | 'institution.request_opening_approval'
  | 'institution.open'
  | 'institution.suspend'
  | 'institution.reopen'
  | 'institution.begin_closure'
  | 'institution.close'
  | 'institution.archive'
  | 'site.create'
  | 'site.open'
  | 'site.update_information'
  | 'site.assign_coordinator'
  | 'site.suspend'
  | 'site.reopen'
  | 'site.begin_closure'
  | 'site.close'
  | 'institution.task.assign'
  | 'institution.task.start'
  | 'institution.task.complete'
  | 'institution.task.reopen'
  | 'institution.note.add'

export type InstitutionAreaActionRequest = {
  actionKey: InstitutionAreaActionKey
  institutionId: string
  institutionKind: InstitutionKind
  taskId?: string | null
  documentId?: string | null
  reason?: string | null
  effectiveAt?: string | null
  idempotencyKey?: string | null
  payload?: Record<string, unknown>
}

export type InstitutionAreaActionResult = {
  ok: boolean
  state: 'completed' | 'blocked' | 'approval_required' | 'replayed' | 'failed'
  message: string
  institutionId: string
  blockers?: string[]
  warnings?: string[]
  result?: Record<string, unknown>
}
