export type Angelcare360Area10View =
  | 'today'
  | 'students'
  | 'new-enrollments'
  | 'attendance'
  | 'journey'
  | 'health-safety'
  | 'documents'
  | 'authorizations'
  | 'academics'
  | 'wellbeing'
  | 'incidents'
  | 'services'
  | 'transport-meals'
  | 'attention'
  | 'transitions'
  | 'history'

export type Angelcare360Area10DossierTab =
  | 'today'
  | 'overview'
  | 'journey'
  | 'family'
  | 'health'
  | 'documents'
  | 'attendance'
  | 'academics'
  | 'wellbeing'
  | 'incidents'
  | 'services'
  | 'transport'
  | 'finance'
  | 'actions'
  | 'history'

export type Angelcare360Area10Tone = 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'violet'

export type Angelcare360Area10Metric = {
  key: string
  label: string
  value: number | string
  detail: string
  tone: Angelcare360Area10Tone
  targetView: Angelcare360Area10View
}

export type Angelcare360Area10StudentSummary = {
  id: string
  studentCode: string | null
  fullName: string
  firstName: string | null
  lastName: string | null
  photoUrl: string | null
  dateOfBirth: string | null
  ageLabel: string | null
  status: string
  statusLabel: string
  admissionStatus: string | null
  admissionDate: string | null
  classId: string | null
  className: string | null
  sectionId: string | null
  sectionName: string | null
  institutionLabel: string
  academicYearLabel: string
  attendanceState: string
  attendanceLabel: string
  arrivedAt: string | null
  departedAt: string | null
  guardianLabel: string | null
  guardianPhone: string | null
  hasHealthAlert: boolean
  healthAlertLabel: string | null
  documentState: string
  openIncidentCount: number
  openTaskCount: number
  balance: number
  transportActive: boolean
  transportLabel: string | null
  adaptationState: string | null
  attentionCount: number
}

export type Angelcare360Area10Attention = {
  id: string
  studentId: string
  studentLabel: string
  category: 'attendance' | 'health' | 'documents' | 'incident' | 'family' | 'transition' | 'adaptation' | 'task'
  title: string
  detail: string
  consequence: string
  actionLabel: string
  tone: Angelcare360Area10Tone
  operation?: string | null
  deepLink?: string | null
}

export type Angelcare360Area10TimelineEvent = {
  id: string
  at: string | null
  category: string
  title: string
  detail: string
  source: string
  tone: Angelcare360Area10Tone
}

export type Angelcare360Area10Dossier = {
  student: Angelcare360Area10StudentSummary
  identity: Record<string, unknown>
  enrollmentHistory: Array<Record<string, unknown>>
  family: Array<Record<string, unknown>>
  emergencyContacts: Array<Record<string, unknown>>
  healthInstructions: Array<Record<string, unknown>>
  medicationPlans: Array<Record<string, unknown>>
  medicationAdministrations: Array<Record<string, unknown>>
  documents: Array<Record<string, unknown>>
  authorizations: Array<Record<string, unknown>>
  attendance: Array<Record<string, unknown>>
  academics: Array<Record<string, unknown>>
  wellbeing: Array<Record<string, unknown>>
  supportPlans: Array<Record<string, unknown>>
  incidents: Array<Record<string, unknown>>
  services: Array<Record<string, unknown>>
  transport: Array<Record<string, unknown>>
  finance: Array<Record<string, unknown>>
  adaptationPlans: Array<Record<string, unknown>>
  transitions: Array<Record<string, unknown>>
  departures: Array<Record<string, unknown>>
  tasks: Array<Record<string, unknown>>
  notes: Array<Record<string, unknown>>
  admissionHandover: Array<Record<string, unknown>>
  timeline: Angelcare360Area10TimelineEvent[]
  sourceWarnings: string[]
}

export type Angelcare360Area10CommandData = {
  view: Angelcare360Area10View
  school: { id: string; name: string }
  academicYear: { id: string | null; label: string }
  metrics: Angelcare360Area10Metric[]
  students: Angelcare360Area10StudentSummary[]
  attention: Angelcare360Area10Attention[]
  selectedStudent: Angelcare360Area10Dossier | null
  sourceWarnings: string[]
  permissions: string[]
  generatedAt: string
}

export type Angelcare360Area10MutationRequest = {
  operation: string
  studentId: string
  idempotencyKey: string
  payload?: Record<string, unknown>
}

export type Angelcare360Area10MutationResult = {
  ok: boolean
  operation: string
  studentId: string
  receiptId?: string | null
  message: string
  deepLink?: string | null
  refresh?: boolean
  data?: Record<string, unknown> | null
}
