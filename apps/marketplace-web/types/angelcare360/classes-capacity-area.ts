export type ClassesCapacityView =
  | 'today'
  | 'classes'
  | 'sections'
  | 'places'
  | 'waiting'
  | 'movements'
  | 'attention'
  | 'projections'
  | 'history'

export type CapacityDossierKind = 'class' | 'section' | 'movement' | 'reservation' | 'issue'
export type CapacityDossierTab = 'todo' | 'children' | 'places' | 'organisation' | 'waiting' | 'movements' | 'history'
export type CapacityTone = 'neutral' | 'active' | 'verified' | 'warning' | 'critical' | 'decision'
export type CapacityHumanStatus =
  | 'to_prepare'
  | 'ready'
  | 'open'
  | 'near_full'
  | 'full'
  | 'over_capacity'
  | 'frozen'
  | 'closing'
  | 'closed'
  | 'archived'

export type CapacityActionKey =
  | 'class.create'
  | 'class.update'
  | 'class.open'
  | 'class.freeze_placements'
  | 'class.unfreeze_placements'
  | 'class.begin_closure'
  | 'class.close'
  | 'class.archive'
  | 'section.create'
  | 'section.update'
  | 'section.assign_responsible'
  | 'section.freeze_placements'
  | 'section.unfreeze_placements'
  | 'section.begin_closure'
  | 'section.close'
  | 'capacity.preview_change'
  | 'capacity.request_change'
  | 'capacity.approve_change'
  | 'capacity.apply_change'
  | 'capacity.request_exception'
  | 'capacity.approve_exception'
  | 'capacity.expire_exception'
  | 'capacity.request_topup'
  | 'seat.reserve'
  | 'seat.confirm'
  | 'seat.extend'
  | 'seat.release'
  | 'seat.cancel'
  | 'placement.preview'
  | 'placement.assign'
  | 'placement.cancel'
  | 'population_move.preview'
  | 'population_move.execute'
  | 'population_move.retry_item'
  | 'population_move.cancel'
  | 'class_split.preview'
  | 'class_split.execute'
  | 'section_merge.preview'
  | 'section_merge.execute'
  | 'capacity_issue.assign'
  | 'capacity_issue.resolve'
  | 'capacity_issue.reopen'
  | 'capacity_note.add'
  | 'capacity_evidence.request'

export type CapacityDirectoryOption = { id: string; label: string; secondary?: string | null }
export type CapacityMetric = { key: string; label: string; value: string; detail: string; tone: CapacityTone; view: ClassesCapacityView }

export type CapacityEntitlement = {
  meterKey: string | null
  label: string
  included: number | null
  purchased: number
  allowed: number | null
  current: number
  remaining: number | null
  state: 'available' | 'warning' | 'reached' | 'unconfigured'
  topupEnabled: boolean
  topupIncrement: number | null
  packageVersionName: string | null
}

export type CapacityChild = {
  id: string
  fullName: string
  studentCode: string
  enrollmentId: string
  enrollmentStatus: string
  classId: string
  sectionId: string | null
  classLabel: string
  sectionLabel: string | null
  enrolledOn: string | null
  nextYearTargetClassId: string | null
  nextYearTargetLabel: string | null
  attentionLabel: string | null
  exactHref: string
}

export type CapacityReservation = {
  id: string
  studentId: string | null
  admissionApplicationId: string | null
  childLabel: string
  classId: string
  sectionId: string | null
  state: 'reserved' | 'to_confirm' | 'expiring' | 'expired' | 'used' | 'released' | 'cancelled'
  stateLabel: string
  startsOn: string
  expiresOn: string
  responsibleLabel: string | null
  reason: string | null
  countsAgainstCapacity: boolean
  exactHref: string | null
}

export type CapacityWaitingRequest = {
  id: string
  applicationCode: string
  childLabel: string
  studentId: string | null
  academicYearId: string | null
  requestedClassId: string | null
  requestedClassLabel: string | null
  requestedSectionId: string | null
  state: string
  stateLabel: string
  applicationDate: string | null
  priorityLabel: string | null
  missingRequirement: string | null
  compatibleClassIds: string[]
  exactHref: string
}

export type CapacityAttentionItem = {
  id: string
  sourceType: 'class' | 'section' | 'reservation' | 'movement' | 'entitlement' | 'placement'
  sourceId: string
  title: string
  explanation: string
  consequence: string | null
  severity: 'blocking' | 'warning' | 'information'
  tone: CapacityTone
  ownerLabel: string | null
  dueAt: string | null
  recommendedActionKey: CapacityActionKey | null
  recommendedActionLabel: string | null
  exactHref: string | null
  resolved: boolean
}

export type CapacityHistoryEvent = {
  id: string
  label: string
  detail: string | null
  actorLabel: string | null
  createdAt: string
  tone: CapacityTone
  sourceType: string | null
  sourceId: string | null
}

export type CapacityTask = {
  id: string
  classId: string | null
  sectionId: string | null
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

export type CapacityNote = {
  id: string
  classId: string | null
  sectionId: string | null
  issueId: string | null
  body: string
  important: boolean
  authorLabel: string
  createdAt: string
}

export type CapacitySectionRecord = {
  id: string
  schoolId: string
  academicYearId: string
  classId: string
  code: string
  name: string
  room: string | null
  status: CapacityHumanStatus
  statusLabel: string
  tone: CapacityTone
  plannedPlaces: number
  activeChildren: number
  reservedPlaces: number
  availablePlaces: number
  projectedChildren: number
  waitingRequests: number
  responsibleStaffId: string | null
  responsibleLabel: string | null
  placementsFrozen: boolean
  freezeReason: string | null
  nextActionKey: CapacityActionKey | null
  nextActionLabel: string
  children: CapacityChild[]
  reservations: CapacityReservation[]
  attention: CapacityAttentionItem[]
  tasks: CapacityTask[]
  notes: CapacityNote[]
  history: CapacityHistoryEvent[]
  updatedAt: string | null
}

export type CapacityClassRecord = {
  id: string
  schoolId: string
  academicYearId: string
  academicYearLabel: string
  siteId: string | null
  siteLabel: string | null
  code: string
  name: string
  level: string
  status: CapacityHumanStatus
  statusLabel: string
  tone: CapacityTone
  plannedPlaces: number
  activeChildren: number
  reservedPlaces: number
  availablePlaces: number
  projectedChildren: number
  waitingRequests: number
  contractualRemaining: number | null
  occupancyPercent: number
  projectedPercent: number
  homeroomStaffId: string | null
  homeroomLabel: string | null
  placementsFrozen: boolean
  freezeReason: string | null
  sections: CapacitySectionRecord[]
  children: CapacityChild[]
  reservations: CapacityReservation[]
  waiting: CapacityWaitingRequest[]
  attention: CapacityAttentionItem[]
  tasks: CapacityTask[]
  notes: CapacityNote[]
  history: CapacityHistoryEvent[]
  nextActionKey: CapacityActionKey | null
  nextActionLabel: string
  exactHref: string
  updatedAt: string | null
}

export type CapacityMovementItem = {
  id: string
  studentId: string
  childLabel: string
  sourceClassId: string | null
  sourceClassLabel: string | null
  sourceSectionId: string | null
  targetClassId: string
  targetClassLabel: string
  targetSectionId: string | null
  state: 'proposed' | 'approved' | 'executing' | 'completed' | 'failed' | 'cancelled' | 'repaired'
  stateLabel: string
  failureReason: string | null
  executedAt: string | null
}

export type CapacityMovementRun = {
  id: string
  runCode: string
  movementType: 'movement' | 'split' | 'merge' | 'placement'
  state: 'draft' | 'previewed' | 'approved' | 'executing' | 'completed' | 'partially_failed' | 'failed' | 'cancelled'
  stateLabel: string
  sourceClassId: string | null
  sourceClassLabel: string | null
  targetClassId: string | null
  targetClassLabel: string | null
  requestedByLabel: string | null
  reason: string | null
  effectiveAt: string | null
  totalItems: number
  completedItems: number
  failedItems: number
  items: CapacityMovementItem[]
  createdAt: string
  executedAt: string | null
}

export type CapacityProjectionSource = {
  key: string
  label: string
  value: number
  sourceType: string
  sourceHref: string | null
  committed: boolean
}

export type CapacityProjection = {
  classId: string
  current: number
  confirmedReservations: number
  acceptedWaiting: number
  approvedTransitions: number
  scheduledDepartures: number
  scheduledMovementsIn: number
  scheduledMovementsOut: number
  projected: number
  plannedPlaces: number
  difference: number
  sources: CapacityProjectionSource[]
}

export type ClassesCapacitySnapshot = {
  generatedAt: string
  mode: 'single' | 'multi'
  title: string
  subtitle: string
  school: { id: string; name: string; siteCount: number; operatingCapacity: number | null }
  academicYear: { id: string; label: string } | null
  viewer: {
    userId: string
    displayName: string
    roleLabel: string
    canEdit: boolean
    canApprove: boolean
    canMove: boolean
    canRequestTopup: boolean
    canViewHistory: boolean
  }
  entitlement: CapacityEntitlement
  classes: CapacityClassRecord[]
  sections: CapacitySectionRecord[]
  waiting: CapacityWaitingRequest[]
  reservations: CapacityReservation[]
  movements: CapacityMovementRun[]
  projections: CapacityProjection[]
  attention: CapacityAttentionItem[]
  metrics: CapacityMetric[]
  history: CapacityHistoryEvent[]
  directory: {
    classes: CapacityDirectoryOption[]
    sections: CapacityDirectoryOption[]
    students: CapacityDirectoryOption[]
    staff: CapacityDirectoryOption[]
    sites: CapacityDirectoryOption[]
    topups: CapacityDirectoryOption[]
  }
  warnings: string[]
}

export type CapacityActionRequest = {
  actionKey: CapacityActionKey
  classId?: string | null
  sectionId?: string | null
  reservationId?: string | null
  movementRunId?: string | null
  movementItemId?: string | null
  issueId?: string | null
  studentIds?: string[]
  payload?: Record<string, unknown>
  reason?: string | null
  effectiveAt?: string | null
  idempotencyKey?: string | null
}

export type CapacityActionResult = {
  ok: boolean
  state: 'applied' | 'preview' | 'requested' | 'replayed' | 'partially_failed'
  message: string
  classId?: string | null
  sectionId?: string | null
  reservationId?: string | null
  movementRunId?: string | null
  issueId?: string | null
  result?: Record<string, unknown>
  snapshot?: ClassesCapacitySnapshot
}
