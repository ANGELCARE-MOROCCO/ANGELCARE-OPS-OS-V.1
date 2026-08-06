export type Angelcare360Area9View =
  | 'today'
  | 'inquiries'
  | 'families'
  | 'visits'
  | 'applications'
  | 'documents'
  | 'evaluations'
  | 'decisions'
  | 'waiting-list'
  | 'offers'
  | 'enrollments'
  | 'onboarding'
  | 'attention'
  | 'history'

export type Angelcare360Area9Tone =
  | 'navy'
  | 'cyan'
  | 'emerald'
  | 'amber'
  | 'red'
  | 'violet'
  | 'graphite'

export type Angelcare360Area9RecordKind =
  | 'inquiry'
  | 'family'
  | 'candidate'
  | 'visit'
  | 'application'
  | 'document'
  | 'evaluation'
  | 'decision'
  | 'waitlist'
  | 'offer'
  | 'reservation'
  | 'enrollment'
  | 'onboarding'
  | 'issue'
  | 'history'

export type Angelcare360Area9Record = {
  id: string
  sourceId?: string | null
  kind: Angelcare360Area9RecordKind
  reference: string
  title: string
  subtitle: string
  candidateName?: string | null
  contactName?: string | null
  stage: string
  stageLabel: string
  tone: Angelcare360Area9Tone
  owner?: string | null
  institution?: string | null
  programme?: string | null
  intake?: string | null
  source?: string | null
  preferredChannel?: string | null
  nextAction?: string | null
  dueAt?: string | null
  updatedAt?: string | null
  completion?: number | null
  missingCount?: number | null
  flags: string[]
  metadata?: Record<string, unknown>
}

export type Angelcare360Area9Metric = {
  key: string
  label: string
  value: number
  detail: string
  view: Angelcare360Area9View
  tone: Angelcare360Area9Tone
}

export type Angelcare360Area9JourneyLane = {
  key: string
  label: string
  description: string
  tone: Angelcare360Area9Tone
  count: number
  records: Angelcare360Area9Record[]
}

export type Angelcare360Area9Attention = {
  id: string
  title: string
  detail: string
  consequence: string
  nextAction: string
  tone: Angelcare360Area9Tone
  dueAt?: string | null
  record?: Angelcare360Area9Record | null
}

export type Angelcare360Area9CommandData = {
  generatedAt: string
  school: {
    id: string
    name: string
    timezone: string
  }
  academicYear: {
    id: string | null
    label: string
  }
  selectedView: Angelcare360Area9View
  metrics: Angelcare360Area9Metric[]
  lanes: Angelcare360Area9JourneyLane[]
  recordsByView: Record<Angelcare360Area9View, Angelcare360Area9Record[]>
  attention: Angelcare360Area9Attention[]
  selectedRecord: Angelcare360Area9Record | null
  capabilities: {
    canCreate: boolean
    canUpdate: boolean
    canApprove: boolean
    canExport: boolean
    hasAdvancedAdmissions: boolean
    hasMultiSiteWaitingList: boolean
    hasAutomatedReminders: boolean
  }
  readiness: {
    academicYear: boolean
    applicationRequirements: boolean
    capacityAuthority: boolean
    decisionAuthority: boolean
    auditAuthority: boolean
  }
}

export type Angelcare360Area9MutationRequest = {
  operation: string
  idempotencyKey: string
  recordId?: string | null
  sourceId?: string | null
  payload?: Record<string, unknown>
}

export type Angelcare360Area9MutationResult = {
  ok: boolean
  operation: string
  receiptId?: string
  recordId?: string
  message: string
  error?: string
  refreshedAt?: string
}
