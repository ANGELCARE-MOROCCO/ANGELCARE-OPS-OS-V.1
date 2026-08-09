export type JsonPrimitive = string | number | boolean | null
export type JsonValue = JsonPrimitive | JsonObject | JsonValue[]
export type JsonObject = { [key: string]: JsonValue | undefined }

export type Employee360DomainKey =
  | 'attendance'
  | 'leave'
  | 'payroll'
  | 'planning'
  | 'documents'
  | 'contracts'
  | 'onboarding'
  | 'training'
  | 'performance'
  | 'communications'
  | 'tasks'
  | 'approvals'
  | 'incidents'

export type EmployeeLifecycleState =
  | 'draft'
  | 'preboarding'
  | 'probation'
  | 'active'
  | 'on_leave'
  | 'suspended'
  | 'transferred'
  | 'promoted'
  | 'notice_period'
  | 'terminated'
  | 'archived'
  | 'rehired'

export type Employee360PermissionSet = {
  read: boolean
  editProfile: boolean
  manageDomains: boolean
  manageLifecycle: boolean
  archive: boolean
  restore: boolean
  viewCompensation: boolean
  manageCompensation: boolean
  validate: boolean
  print: boolean
}

export type Employee360Record = {
  id: string
  employeeId: string
  domain: Employee360DomainKey
  title: string
  subtitle: string | null
  status: string
  stage: string | null
  priority: string | null
  effectiveAt: string | null
  dueAt: string | null
  amount: number | null
  currency: string | null
  owner: string | null
  archivedAt: string | null
  version: number
  sourceTable: string
  metadata: JsonObject
  createdAt: string | null
  updatedAt: string | null
}

export type Employee360TimelineEvent = {
  id: string
  employeeId: string
  eventType: string
  domain: string
  action: string
  title: string
  summary: string | null
  actorName: string | null
  actorId: string | null
  riskLevel: string
  beforeState: JsonObject
  afterState: JsonObject
  metadata: JsonObject
  createdAt: string
}

export type Employee360Profile = {
  id: string
  appUserId: string | null
  tenantId: string | null
  organizationId: string | null
  firstName: string | null
  lastName: string | null
  preferredName: string | null
  fullName: string
  email: string | null
  phone: string | null
  nationalId: string | null
  dateOfBirth: string | null
  placeOfBirth: string | null
  nationality: string | null
  gender: string | null
  maritalStatus: string | null
  childrenCount: number
  address: string | null
  city: string | null
  postalCode: string | null
  country: string | null
  branchOffice: string | null
  workCity: string | null
  remoteOption: string | null
  position: string | null
  department: string | null
  manager: string | null
  managerUserId: string | null
  employmentStatus: string
  lifecycleState: EmployeeLifecycleState
  employmentType: string | null
  startDate: string | null
  hireDate: string | null
  probationEndDate: string | null
  contractType: string | null
  salary: number | null
  currency: string | null
  paymentMethod: string | null
  cnssNumber: string | null
  amoNumber: string | null
  emergencyContactName: string | null
  emergencyContactPhone: string | null
  emergencyContactRelation: string | null
  confidentialityLevel: string
  archivedAt: string | null
  archiveReason: string | null
  terminatedAt: string | null
  terminationReason: string | null
  rehireEligible: boolean
  version: number
  createdAt: string | null
  updatedAt: string | null
}

export type Employee360Health = {
  canonicalEmployee: 'healthy' | 'missing' | 'degraded'
  tenantScope: 'verified' | 'unresolved' | 'mismatch'
  auditAuthority: 'healthy' | 'degraded'
  domainAuthority: Record<Employee360DomainKey, 'healthy' | 'unavailable' | 'degraded'>
  warnings: string[]
}

export type Employee360Aggregate = {
  profile: Employee360Profile
  permissions: Employee360PermissionSet
  domains: Record<Employee360DomainKey, Employee360Record[]>
  timeline: Employee360TimelineEvent[]
  summary: {
    readiness: number
    risk: number
    evidenceCoverage: number
    openActions: number
    overdueActions: number
    activeContract: boolean
    documentsAtRisk: number
    attendanceAnomalies: number
    leavePending: number
    trainingDue: number
    performanceDue: number
  }
  health: Employee360Health
  loadedAt: string
}

export type Employee360MutationAction =
  | 'profile.update'
  | 'employee.archive'
  | 'employee.restore'
  | 'lifecycle.transition'
  | 'domain.create'
  | 'domain.update'
  | 'domain.archive'
  | 'domain.restore'
  | 'domain.validate'
  | 'note.create'

export type Employee360MutationRequest = {
  action: Employee360MutationAction
  expectedVersion: number
  domain?: Employee360DomainKey
  recordId?: string
  expectedRecordVersion?: number
  reason?: string
  targetState?: EmployeeLifecycleState
  payload?: JsonObject
  idempotencyKey?: string
}

export type Employee360MutationResult = {
  ok: boolean
  aggregate?: Employee360Aggregate
  error?: string
  code?: string
  details?: string[]
  conflict?: {
    expectedVersion: number
    actualVersion: number
  }
}
