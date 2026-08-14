export type Angelcare360PortalKind = 'teacher' | 'parent' | 'staff' | 'student'
export type Angelcare360PortalTone = 'slate' | 'blue' | 'emerald' | 'amber' | 'red' | 'violet'
export type Angelcare360PortalView = string

export type Angelcare360PortalRecord = {
  id: string
  title: string
  subtitle?: string | null
  detail?: string | null
  status?: string | null
  statusLabel?: string | null
  tone?: Angelcare360PortalTone
  date?: string | null
  meta?: Record<string, string | number | boolean | null>
}

export type Angelcare360PortalMetric = {
  key: string
  label: string
  value: string
  detail: string
  tone: Angelcare360PortalTone
  href?: string | null
}

export type Angelcare360TeacherPortalSnapshot = {
  portal: 'teacher'
  school: { id: string; name: string }
  academicYear: { id: string | null; label: string }
  teacher: { id: string; appUserId: string; code: string | null; name: string; email: string | null; department: string | null }
  view: string
  metrics: Angelcare360PortalMetric[]
  classes: Angelcare360PortalRecord[]
  students: Angelcare360PortalRecord[]
  subjects: Angelcare360PortalRecord[]
  timetable: Angelcare360PortalRecord[]
  attendance: Angelcare360PortalRecord[]
  lessons: Angelcare360PortalRecord[]
  assignments: Angelcare360PortalRecord[]
  submissions: Angelcare360PortalRecord[]
  exams: Angelcare360PortalRecord[]
  marks: Angelcare360PortalRecord[]
  reportCards: Angelcare360PortalRecord[]
  comments: Angelcare360PortalRecord[]
  communications: Angelcare360PortalRecord[]
  tasks: Angelcare360PortalRecord[]
  notifications: Angelcare360PortalRecord[]
  leave: Angelcare360PortalRecord[]
  sourceWarnings: string[]
  permissions: string[]
  generatedAt: string
}

export type Angelcare360ParentPortalSnapshot = {
  portal: 'parent'
  school: { id: string; name: string }
  academicYear: { id: string | null; label: string }
  parent: { id: string; appUserId: string; code: string | null; name: string; email: string | null; phone: string | null }
  family: { id: string | null; label: string }
  view: string
  selectedStudentId: string | null
  metrics: Angelcare360PortalMetric[]
  children: Angelcare360PortalRecord[]
  attendance: Angelcare360PortalRecord[]
  timetable: Angelcare360PortalRecord[]
  assignments: Angelcare360PortalRecord[]
  marks: Angelcare360PortalRecord[]
  reportCards: Angelcare360PortalRecord[]
  finance: Angelcare360PortalRecord[]
  payments: Angelcare360PortalRecord[]
  transport: Angelcare360PortalRecord[]
  pickup: Angelcare360PortalRecord[]
  messages: Angelcare360PortalRecord[]
  notifications: Angelcare360PortalRecord[]
  requests: Angelcare360PortalRecord[]
  meetings: Angelcare360PortalRecord[]
  commitments: Angelcare360PortalRecord[]
  complaints: Angelcare360PortalRecord[]
  recoveries: Angelcare360PortalRecord[]
  satisfaction: Angelcare360PortalRecord[]
  renewals: Angelcare360PortalRecord[]
  feedback: Angelcare360PortalRecord[]
  documents: Angelcare360PortalRecord[]
  sourceWarnings: string[]
  permissions: string[]
  generatedAt: string
}

export type Angelcare360PortalProvisionTarget = {
  kind: Angelcare360PortalKind
  id: string
  name: string
  email: string | null
  code: string | null
  portalAppUserId: string | null
  state: 'not_linked' | 'active' | 'suspended' | 'inactive' | 'unknown'
  roleLabel: string
  schoolScope: string
}

export type Angelcare360PortalAccessSnapshot = {
  school: { id: string; name: string }
  viewer: { id: string; label: string; canWrite: boolean }
  metrics: Angelcare360PortalMetric[]
  teachers: Angelcare360PortalProvisionTarget[]
  parents: Angelcare360PortalProvisionTarget[]
  staff: Angelcare360PortalProvisionTarget[]
  students: Angelcare360PortalProvisionTarget[]
  roles: Array<{ id: string; key: string; label: string }>
  recentInvitations: Angelcare360PortalRecord[]
  warnings: string[]
  generatedAt: string
}

export type Angelcare360PortalAccessOperation =
  | 'portal.credentials.provision'
  | 'portal.credentials.reset'
  | 'portal.access.suspend'
  | 'portal.access.restore'
  | 'portal.access.revoke_sessions'
  | 'portal.access.unlink'
  | 'portal.invitation.prepare'

export type Angelcare360PortalAccessRequest = {
  operation: Angelcare360PortalAccessOperation
  kind: Angelcare360PortalKind
  personId: string
  email?: string | null
  fullName?: string | null
  roleKey?: string | null
  temporaryPassword?: string | null
  reason?: string | null
  idempotencyKey: string
}

export type Angelcare360PortalActionRequest = {
  operation: string
  subjectId: string
  studentId?: string | null
  familyId?: string | null
  payload?: Record<string, unknown>
  idempotencyKey: string
}


export type Angelcare360StaffPortalSnapshot = {
  portal: 'staff'
  school: { id: string; name: string }
  academicYear: { id: string | null; label: string }
  staff: { id: string; appUserId: string; code: string | null; name: string; email: string | null; department: string | null; position: string | null }
  view: string
  metrics: Angelcare360PortalMetric[]
  schedule: Angelcare360PortalRecord[]
  attendance: Angelcare360PortalRecord[]
  leave: Angelcare360PortalRecord[]
  tasks: Angelcare360PortalRecord[]
  approvals: Angelcare360PortalRecord[]
  workflows: Angelcare360PortalRecord[]
  tickets: Angelcare360PortalRecord[]
  documents: Angelcare360PortalRecord[]
  messages: Angelcare360PortalRecord[]
  notifications: Angelcare360PortalRecord[]
  team: Angelcare360PortalRecord[]
  history: Angelcare360PortalRecord[]
  sourceWarnings: string[]
  permissions: string[]
  generatedAt: string
}

export type Angelcare360StudentPortalSnapshot = {
  portal: 'student'
  school: { id: string; name: string }
  academicYear: { id: string | null; label: string }
  student: { id: string; appUserId: string; code: string | null; name: string; classLabel: string | null; sectionLabel: string | null }
  view: string
  metrics: Angelcare360PortalMetric[]
  timetable: Angelcare360PortalRecord[]
  subjects: Angelcare360PortalRecord[]
  lessons: Angelcare360PortalRecord[]
  assignments: Angelcare360PortalRecord[]
  submissions: Angelcare360PortalRecord[]
  exams: Angelcare360PortalRecord[]
  marks: Angelcare360PortalRecord[]
  reportCards: Angelcare360PortalRecord[]
  attendance: Angelcare360PortalRecord[]
  library: Angelcare360PortalRecord[]
  messages: Angelcare360PortalRecord[]
  notifications: Angelcare360PortalRecord[]
  documents: Angelcare360PortalRecord[]
  supportTasks: Angelcare360PortalRecord[]
  sourceWarnings: string[]
  permissions: string[]
  generatedAt: string
}

export type Angelcare360PortalFulfilmentItem = {
  id: string
  portal: Angelcare360PortalKind
  actionLabel: string
  subjectLabel: string
  domain: string
  destination: string
  ownerLabel: string | null
  status: string
  statusLabel: string
  tone: Angelcare360PortalTone
  createdAt: string | null
  dueAt: string | null
  nextAction: string | null
  evidenceState: string | null
  deepLink: string | null
}

export type Angelcare360PortalFulfilmentSnapshot = {
  school: { id: string; name: string }
  metrics: Angelcare360PortalMetric[]
  items: Angelcare360PortalFulfilmentItem[]
  portalCounts: Record<Angelcare360PortalKind, number>
  domainCounts: Record<string, number>
  integrityWarnings: string[]
  generatedAt: string
}
