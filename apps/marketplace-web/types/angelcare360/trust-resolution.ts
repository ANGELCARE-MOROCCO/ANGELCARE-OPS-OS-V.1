export type TrustResolutionStatus =
  | 'new'
  | 'open'
  | 'in_review'
  | 'in_progress'
  | 'assigned'
  | 'waiting_parent'
  | 'waiting_internal'
  | 'resolved'
  | 'closed'
  | 'archived'

export type TrustResolutionPriority = 'low' | 'normal' | 'medium' | 'high' | 'urgent' | 'critical'

export type TrustPersonRef = {
  id: string
  label: string
  code?: string | null
  phone?: string | null
  email?: string | null
  role?: string | null
}

export type TrustCommunicationRecord = {
  id: string
  at: string
  channel: string
  direction: 'outbound' | 'inbound' | 'internal'
  authorLabel?: string | null
  recipientLabel?: string | null
  purpose?: string | null
  note?: string | null
  deliveryTruth: 'prepared' | 'recorded' | 'provider_accepted' | 'delivered' | 'failed' | 'unknown'
}

export type TrustCaseEvent = {
  id: string
  caseId: string
  eventType: string
  label: string
  note?: string | null
  actorLabel?: string | null
  at: string
  metadata?: Record<string, unknown> | null
}

export type TrustCase = {
  id: string
  code: string
  subject: string
  description: string
  category: string
  priority: TrustResolutionPriority
  status: TrustResolutionStatus
  reporterRole?: string | null
  reporter?: TrustPersonRef | null
  student?: TrustPersonRef | null
  assignedStaff?: TrustPersonRef | null
  createdAt: string
  updatedAt: string
  assignedAt?: string | null
  resolvedAt?: string | null
  closedAt?: string | null
  resolutionSummary?: string | null
  nextAction?: string | null
  dueAt?: string | null
  sourceChannel?: string | null
  ageHours: number
  waitingHours: number
  overdue: boolean
  internalNotes: TrustCaseEvent[]
  statusHistory: TrustCaseEvent[]
  communications: TrustCommunicationRecord[]
  metadata: Record<string, unknown>
}

export type TrustMetrics = {
  open: number
  urgent: number
  overdue: number
  unassigned: number
  waitingParent: number
  waitingInternal: number
  resolutionReady: number
  closedToday: number
  createdToday: number
}

export type TrustFlowBucket = {
  key: string
  label: string
  count: number
}

export type TrustResolutionSnapshot = {
  schoolId: string
  schoolName: string
  generatedAt: string
  cases: TrustCase[]
  staff: TrustPersonRef[]
  parents: TrustPersonRef[]
  students: TrustPersonRef[]
  audit: TrustCaseEvent[]
  metrics: TrustMetrics
  flow: TrustFlowBucket[]
  categories: Array<{ key: string; label: string; count: number }>
  interventionQueue: TrustCase[]
}

export type TrustMutationResult = {
  ok: boolean
  id?: string | null
  error?: string
}
