import type { Angelcare360AuditEventInput } from '@/types/angelcare360/audit'
import type { Angelcare360AdmissionsAuditFilter } from '@/types/angelcare360/admissions'
import type {
  Angelcare360TransportAssignmentStatus,
  Angelcare360TransportAuditFilter,
  Angelcare360TransportRouteStatus,
  Angelcare360TransportStopStatus,
  Angelcare360TransportVehicleStatus,
} from '@/types/angelcare360/transport'

export type Angelcare360ValidationIssue = {
  path: string
  message: string
}

export type Angelcare360ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; errors: Angelcare360ValidationIssue[] }

export type Angelcare360Schema<T> = {
  name: string
  parse: (input: unknown) => T
  safeParse: (input: unknown) => Angelcare360ValidationResult<T>
}

type Validator<T> = (input: unknown) => Angelcare360ValidationResult<T>

function isRecord(input: unknown): input is Record<string, unknown> {
  return Boolean(input) && typeof input === 'object' && !Array.isArray(input)
}

function isNonEmptyString(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0
}

function asString(value: unknown, message: string, path: string, errors: Angelcare360ValidationIssue[]) {
  if (!isNonEmptyString(value)) {
    errors.push({ path, message })
    return ''
  }

  return String(value).trim()
}

function asOptionalString(value: unknown) {
  if (value === undefined || value === null || value === '') return null
  return typeof value === 'string' ? value.trim() : null
}

function asOptionalBoolean(value: unknown, fallback = false) {
  if (typeof value === 'boolean') return value
  if (value === 'true') return true
  if (value === 'false') return false
  return fallback
}

function asOptionalNumber(value: unknown, fallback = 0) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '' && !Number.isNaN(Number(value))) {
    return Number(value)
  }
  return fallback
}

function asOptionalInteger(value: unknown, fallback = 0) {
  const parsed = asOptionalNumber(value, fallback)
  return Number.isFinite(parsed) ? Math.trunc(parsed) : fallback
}

function asOptionalStringArray(value: unknown) {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string').map((item) => item.trim()).filter(Boolean)
  }

  if (typeof value === 'string' && value.trim() !== '') {
    return value.split(',').map((item) => item.trim()).filter(Boolean)
  }

  return []
}

function isValidDateOrder(startsOn: string, endsOn: string) {
  if (!startsOn || !endsOn) return false
  return new Date(startsOn).getTime() <= new Date(endsOn).getTime()
}

function asDateString(value: unknown, message: string, path: string, errors: Angelcare360ValidationIssue[]) {
  if (!isNonEmptyString(value)) {
    errors.push({ path, message })
    return ''
  }

  const parsed = new Date(String(value))
  if (Number.isNaN(parsed.getTime())) {
    errors.push({ path, message })
    return ''
  }

  return String(value).trim()
}

function asTimeString(value: unknown, message: string, path: string, errors: Angelcare360ValidationIssue[]) {
  if (!isNonEmptyString(value)) {
    errors.push({ path, message })
    return ''
  }

  const normalized = String(value).trim()
  if (!/^\d{2}:\d{2}(:\d{2})?$/.test(normalized)) {
    errors.push({ path, message })
    return ''
  }

  return normalized.length === 5 ? `${normalized}:00` : normalized
}

function asEnum<T extends string>(value: unknown, allowed: readonly T[], message: string, path: string, errors: Angelcare360ValidationIssue[]) {
  if (typeof value !== 'string' || !allowed.includes(value as T)) {
    errors.push({ path, message })
    return allowed[0]
  }
  return value as T
}

function createSchema<T>(name: string, validator: Validator<T>): Angelcare360Schema<T> {
  return {
    name,
    parse(input) {
      const result = validator(input)
      if (!result.success) {
        throw new Error(result.errors.map((item) => `${item.path}: ${item.message}`).join(' | '))
      }
      return result.data
    },
    safeParse: validator,
  }
}

export type Angelcare360SchoolInput = {
  schoolCode: string
  name: string
  status: 'active' | 'inactive' | 'suspended' | 'archived'
  language?: string | null
  currency?: string | null
  timezone?: string | null
}

export const angelcare360SchoolSchema = createSchema<Angelcare360SchoolInput>('school', (input) => {
  const errors: Angelcare360ValidationIssue[] = []
  if (!isRecord(input)) {
    return { success: false, errors: [{ path: 'racine', message: 'Le payload établissement doit être un objet.' }] }
  }

  const data: Angelcare360SchoolInput = {
    schoolCode: asString(input.schoolCode, 'Le code établissement est obligatoire.', 'schoolCode', errors),
    name: asString(input.name, 'Le nom de l’établissement est obligatoire.', 'name', errors),
    status: asEnum(
      input.status,
      ['active', 'inactive', 'suspended', 'archived'] as const,
      'Le statut de l’établissement est invalide.',
      'status',
      errors,
    ),
    language: asOptionalString(input.language),
    currency: asOptionalString(input.currency),
    timezone: asOptionalString(input.timezone),
  }

  return errors.length ? { success: false, errors } : { success: true, data }
})

export type Angelcare360AcademicYearInput = {
  schoolId: string
  yearCode: string
  label: string
  startsOn: string
  endsOn: string
  status: 'planned' | 'active' | 'closed' | 'archived'
}

export const angelcare360AcademicYearSchema = createSchema<Angelcare360AcademicYearInput>('academic_year', (input) => {
  const errors: Angelcare360ValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'Le payload année scolaire doit être un objet.' }] }

  const data: Angelcare360AcademicYearInput = {
    schoolId: asString(input.schoolId, 'L’établissement est requis.', 'schoolId', errors),
    yearCode: asString(input.yearCode, 'Le code de l’année scolaire est obligatoire.', 'yearCode', errors),
    label: asString(input.label, 'Le libellé de l’année scolaire est obligatoire.', 'label', errors),
    startsOn: asDateString(input.startsOn, 'La date de début est invalide.', 'startsOn', errors),
    endsOn: asDateString(input.endsOn, 'La date de fin est invalide.', 'endsOn', errors),
    status: asEnum(input.status, ['planned', 'active', 'closed', 'archived'] as const, 'Le statut de l’année scolaire est invalide.', 'status', errors),
  }

  return errors.length ? { success: false, errors } : { success: true, data }
})

export type Angelcare360RoleInput = {
  schoolId: string
  roleKey: string
  label: string
  scope: 'platform' | 'school' | 'module' | 'class' | 'family'
  status: 'active' | 'inactive' | 'archived'
}

export const angelcare360RoleSchema = createSchema<Angelcare360RoleInput>('role', (input) => {
  const errors: Angelcare360ValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'Le payload rôle doit être un objet.' }] }
  const data: Angelcare360RoleInput = {
    schoolId: asString(input.schoolId, 'L’établissement est requis.', 'schoolId', errors),
    roleKey: asString(input.roleKey, 'La clé du rôle est obligatoire.', 'roleKey', errors),
    label: asString(input.label, 'Le libellé du rôle est obligatoire.', 'label', errors),
    scope: asEnum(input.scope, ['platform', 'school', 'module', 'class', 'family'] as const, 'Le périmètre du rôle est invalide.', 'scope', errors),
    status: asEnum(input.status, ['active', 'inactive', 'archived'] as const, 'Le statut du rôle est invalide.', 'status', errors),
  }
  return errors.length ? { success: false, errors } : { success: true, data }
})

export type Angelcare360PermissionInput = {
  permissionKey: string
  domainKey: string
  actionKey: string
  label: string
}

export const angelcare360PermissionSchema = createSchema<Angelcare360PermissionInput>('permission', (input) => {
  const errors: Angelcare360ValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'Le payload permission doit être un objet.' }] }
  const data: Angelcare360PermissionInput = {
    permissionKey: asString(input.permissionKey, 'La clé de permission est obligatoire.', 'permissionKey', errors),
    domainKey: asString(input.domainKey, 'Le domaine de permission est obligatoire.', 'domainKey', errors),
    actionKey: asString(input.actionKey, 'L’action de permission est obligatoire.', 'actionKey', errors),
    label: asString(input.label, 'Le libellé de permission est obligatoire.', 'label', errors),
  }
  return errors.length ? { success: false, errors } : { success: true, data }
})

type SimpleDomainInput = { schoolId: string; [key: string]: unknown }

function buildSimpleSchema<T extends SimpleDomainInput>(name: string, fields: Array<[string, string, boolean]>): Angelcare360Schema<T> {
  return createSchema<T>(name, (input) => {
    const errors: Angelcare360ValidationIssue[] = []
    if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'Le payload doit être un objet.' }] }
    const output: Record<string, unknown> = {}
    for (const [field, message, required] of fields) {
      const value = input[field]
      if (required) {
        output[field] = asString(value, message, field, errors)
      } else {
        output[field] = asOptionalString(value)
      }
    }
    return errors.length ? { success: false, errors } : { success: true, data: output as T }
  })
}

export type Angelcare360StudentInput = SimpleDomainInput & { studentCode: string; firstName: string; lastName: string; fullName: string; admissionStatus: string }
export type Angelcare360ParentInput = SimpleDomainInput & { parentCode: string; firstName: string; lastName: string; fullName: string }
export type Angelcare360StaffInput = SimpleDomainInput & { staffCode: string; firstName: string; lastName: string; fullName: string; staffType: string }
export type Angelcare360ClassInput = SimpleDomainInput & { academicYearId: string; classCode: string; name: string; level: string }
export type Angelcare360SectionInput = SimpleDomainInput & { academicYearId: string; classId: string; sectionCode: string; name: string }
export type Angelcare360SubjectInput = SimpleDomainInput & { subjectCode: string; name: string }
export type Angelcare360AdmissionLeadInput = SimpleDomainInput & { leadCode: string; parentName: string; studentFullName: string }
export type Angelcare360AttendanceRecordInput = SimpleDomainInput & { attendanceSessionId: string; studentId: string; attendanceStatus: string }
export type Angelcare360TimetableSlotInput = SimpleDomainInput & { academicYearId: string; classId: string; sectionId?: string | null; subjectId: string; dayOfWeek: number; startTime: string; endTime: string }
export type Angelcare360AssignmentInput = SimpleDomainInput & { academicYearId: string; classId: string; subjectId: string; title: string; dueOn?: string | null }
export type Angelcare360ExamInput = SimpleDomainInput & { academicYearId: string; classId: string; subjectId: string; title: string; scheduledOn: string }
export type Angelcare360MarkInput = SimpleDomainInput & { studentId: string; subjectId: string; assessmentType: string; score: number; maxScore: number }
export type Angelcare360InvoiceInput = SimpleDomainInput & { academicYearId: string; studentId: string; invoiceNumber: string; totalAmount: number }
export type Angelcare360PaymentInput = SimpleDomainInput & { invoiceId: string; paymentNumber: string; amount: number; method: string }
export type Angelcare360PayrollInput = SimpleDomainInput & { payrollPeriodId: string; staffId: string; payrollNumber: string; grossAmount: number }
export type Angelcare360LibraryBookInput = SimpleDomainInput & { bookCode: string; title: string; author?: string | null }
export type Angelcare360InventoryItemInput = SimpleDomainInput & { categoryId: string; itemCode: string; label: string; currentStock: number }
export type Angelcare360MessageInput = SimpleDomainInput & { messageCode: string; subject: string; body: string }
export type Angelcare360NotificationInput = SimpleDomainInput & { notificationCode: string; title: string; body: string }
export type Angelcare360AttendanceSessionOpenInput = SimpleDomainInput & {
  academicYearId: string
  classId: string
  sectionId?: string | null
  sessionDate: string
  sessionKey: string
  sessionStatus: 'draft' | 'open' | 'closed' | 'locked' | 'cancelled'
  notes?: string | null
}
export type Angelcare360AttendanceSessionCloseInput = SimpleDomainInput & {
  attendanceSessionId: string
  notes?: string | null
}
export type Angelcare360AttendanceSessionQueryInput = SimpleDomainInput & {
  date?: string | null
  academicYearId?: string | null
  classId?: string | null
  sectionId?: string | null
}
export type Angelcare360AttendanceRecordUpdateInput = SimpleDomainInput & {
  attendanceSessionId: string
  studentId: string
  attendanceStatus: string
  minutesLate?: number | null
  note?: string | null
  justificationRequired?: boolean
}
export type Angelcare360AttendanceBulkUpdateInput = SimpleDomainInput & {
  attendanceSessionId: string
  records: Angelcare360AttendanceRecordUpdateInput[]
}
export type Angelcare360AttendanceStudentSummaryQueryInput = SimpleDomainInput & {
  studentId?: string | null
  classId?: string | null
  sectionId?: string | null
  from?: string | null
  to?: string | null
}
export type Angelcare360AttendanceLateRecordsQueryInput = SimpleDomainInput & {
  from?: string | null
  to?: string | null
  classId?: string | null
  studentId?: string | null
}
export type Angelcare360AttendanceAbsenceRecordsQueryInput = SimpleDomainInput & {
  from?: string | null
  to?: string | null
  classId?: string | null
  studentId?: string | null
}
export type Angelcare360AttendanceJustificationCreateInput = SimpleDomainInput & {
  attendanceRecordId: string
  justificationCode: string
  reasonCategory: string
  description: string
  evidenceDocumentId?: string | null
  status?: 'pending' | 'accepted' | 'rejected' | 'expired' | 'cancelled'
}
export type Angelcare360AttendanceJustificationUpdateInput = Angelcare360AttendanceJustificationCreateInput & {
  id: string
  reviewedAt?: string | null
}
export type Angelcare360AttendanceJustificationDecisionInput = SimpleDomainInput & {
  id: string
  decision: 'pending' | 'accepted' | 'rejected' | 'expired' | 'cancelled'
  decisionReason?: string | null
}
export type Angelcare360TimetableSlotCreateInput = SimpleDomainInput & {
  academicYearId: string
  classId: string
  sectionId?: string | null
  subjectId: string
  staffId?: string | null
  dayOfWeek: number
  startTime: string
  endTime: string
  room?: string | null
  slotType?: string | null
  status?: 'active' | 'draft' | 'suspended' | 'archived'
}
export type Angelcare360TimetableSlotUpdateInput = Angelcare360TimetableSlotCreateInput & { id: string }
export type Angelcare360TimetableConflictCheckInput = SimpleDomainInput & {
  academicYearId?: string | null
  classId?: string | null
  sectionId?: string | null
  staffId?: string | null
  dayOfWeek?: number | null
  startTime?: string | null
  endTime?: string | null
}
export type Angelcare360SchoolCalendarEventCreateInput = SimpleDomainInput & {
  academicYearId?: string | null
  eventCode: string
  title: string
  description?: string | null
  eventType: string
  startsOn: string
  endsOn: string
  allDay?: boolean
  audience?: string
  status?: 'planned' | 'published' | 'completed' | 'cancelled' | 'archived'
}
export type Angelcare360SchoolCalendarEventUpdateInput = Angelcare360SchoolCalendarEventCreateInput & { id: string }
export type Angelcare360AttendanceAuditFilterInput = {
  search?: string | null
  module?: string | null
  action?: string | null
  severity?: string | null
  entityType?: string | null
  from?: string | null
  to?: string | null
}

export const angelcare360StudentSchema = buildSimpleSchema<Angelcare360StudentInput>('student', [
  ['schoolId', 'L’établissement est requis.', true],
  ['studentCode', 'Le code élève est obligatoire.', true],
  ['firstName', 'Le prénom de l’élève est obligatoire.', true],
  ['lastName', 'Le nom de famille de l’élève est obligatoire.', true],
  ['fullName', 'Le nom complet de l’élève est obligatoire.', true],
  ['admissionStatus', 'Le statut de l’élève est obligatoire.', true],
])

export const angelcare360ParentSchema = buildSimpleSchema<Angelcare360ParentInput>('parent', [
  ['schoolId', 'L’établissement est requis.', true],
  ['parentCode', 'Le code parent est obligatoire.', true],
  ['firstName', 'Le prénom du parent est obligatoire.', true],
  ['lastName', 'Le nom du parent est obligatoire.', true],
  ['fullName', 'Le nom complet du parent est obligatoire.', true],
])

export const angelcare360StaffSchema = buildSimpleSchema<Angelcare360StaffInput>('staff', [
  ['schoolId', 'L’établissement est requis.', true],
  ['staffCode', 'Le code personnel est obligatoire.', true],
  ['firstName', 'Le prénom du personnel est obligatoire.', true],
  ['lastName', 'Le nom du personnel est obligatoire.', true],
  ['fullName', 'Le nom complet du personnel est obligatoire.', true],
  ['staffType', 'Le type de personnel est obligatoire.', true],
])

export const angelcare360ClassSchema = buildSimpleSchema<Angelcare360ClassInput>('class', [
  ['schoolId', 'L’établissement est requis.', true],
  ['academicYearId', 'L’année scolaire est requise.', true],
  ['classCode', 'Le code classe est obligatoire.', true],
  ['name', 'Le nom de la classe est obligatoire.', true],
  ['level', 'Le niveau est obligatoire.', true],
])

export const angelcare360SectionSchema = buildSimpleSchema<Angelcare360SectionInput>('section', [
  ['schoolId', 'L’établissement est requis.', true],
  ['academicYearId', 'L’année scolaire est requise.', true],
  ['classId', 'La classe est requise.', true],
  ['sectionCode', 'Le code section est obligatoire.', true],
  ['name', 'Le nom de la section est obligatoire.', true],
])

export const angelcare360SubjectSchema = buildSimpleSchema<Angelcare360SubjectInput>('subject', [
  ['schoolId', 'L’établissement est requis.', true],
  ['subjectCode', 'Le code matière est obligatoire.', true],
  ['name', 'Le nom de la matière est obligatoire.', true],
])

export const angelcare360AdmissionLeadSchema = buildSimpleSchema<Angelcare360AdmissionLeadInput>('admission_lead', [
  ['schoolId', 'L’établissement est requis.', true],
  ['leadCode', 'Le code du prospect est obligatoire.', true],
  ['parentName', 'Le nom du parent est obligatoire.', true],
  ['studentFullName', 'Le nom de l’enfant est obligatoire.', true],
])

export type Angelcare360AdmissionLeadUpsertInput = SimpleDomainInput & {
  id?: string | null
  leadCode: string
  parentName: string
  parentPhone?: string | null
  parentEmail?: string | null
  studentFullName: string
  childFirstName?: string | null
  childLastName?: string | null
  childDateOfBirth?: string | null
  relationshipType?: 'père' | 'mère' | 'tuteur' | 'autre' | string | null
  desiredLevel?: string | null
  sourceChannel?: string | null
  assignedStaffId?: string | null
  priority?: 'low' | 'normal' | 'high' | 'urgent' | string | null
  nextAction?: string | null
  nextActionAt?: string | null
  responsibleStaffId?: string | null
  notes?: string | null
  status: 'new' | 'contacted' | 'qualified' | 'application_open' | 'converted' | 'archived'
}

function buildAdmissionLeadUpsertSchema(name: string) {
  return createSchema<Angelcare360AdmissionLeadUpsertInput>(name, (input) => {
    const errors: Angelcare360ValidationIssue[] = []
    if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'Le payload de demande d’inscription doit être un objet.' }] }

    const childDateOfBirth = asOptionalString(input.childDateOfBirth)
    if (childDateOfBirth) {
      const parsed = new Date(childDateOfBirth)
      if (Number.isNaN(parsed.getTime())) {
        errors.push({ path: 'childDateOfBirth', message: 'La date de naissance de l’enfant est invalide.' })
      }
    }

    const data: Angelcare360AdmissionLeadUpsertInput = {
      id: asOptionalString(input.id),
      schoolId: asString(input.schoolId, 'L’établissement est requis.', 'schoolId', errors),
      leadCode: asString(input.leadCode, 'Le code de la demande est obligatoire.', 'leadCode', errors),
      parentName: asString(input.parentName, 'Le nom du parent est obligatoire.', 'parentName', errors),
      parentPhone: asOptionalString(input.parentPhone),
      parentEmail: asOptionalString(input.parentEmail),
      studentFullName: asString(input.studentFullName, 'Le nom de l’enfant est obligatoire.', 'studentFullName', errors),
      childFirstName: asOptionalString(input.childFirstName),
      childLastName: asOptionalString(input.childLastName),
      childDateOfBirth,
      relationshipType: asEnum(
        input.relationshipType || 'tuteur',
        ['père', 'mère', 'tuteur', 'autre'] as const,
        'La relation du contact est invalide.',
        'relationshipType',
        errors,
      ),
      desiredLevel: asOptionalString(input.desiredLevel),
      sourceChannel: asOptionalString(input.sourceChannel),
      assignedStaffId: asOptionalString(input.assignedStaffId),
      priority: asEnum(
        input.priority || 'normal',
        ['low', 'normal', 'high', 'urgent'] as const,
        'La priorité de la demande est invalide.',
        'priority',
        errors,
      ),
      nextAction: asOptionalString(input.nextAction),
      nextActionAt: asOptionalString(input.nextActionAt),
      responsibleStaffId: asOptionalString(input.responsibleStaffId),
      notes: asOptionalString(input.notes),
      status: asEnum(input.status, ['new', 'contacted', 'qualified', 'application_open', 'converted', 'archived'] as const, 'Le statut de la demande est invalide.', 'status', errors),
    }

    if (!data.parentPhone && !data.parentEmail) {
      errors.push({ path: 'parentPhone', message: 'Le téléphone ou l’adresse email du contact est requis.' })
    }

    if (data.parentEmail) {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailPattern.test(data.parentEmail)) {
        errors.push({ path: 'parentEmail', message: 'L’adresse email du contact est invalide.' })
      }
    }

    return errors.length ? { success: false, errors } : { success: true, data }
  })
}

export const angelcare360AdmissionLeadCreateSchema = buildAdmissionLeadUpsertSchema('admission_lead_create')
export const angelcare360AdmissionLeadUpdateSchema = buildAdmissionLeadUpsertSchema('admission_lead_update')

export type Angelcare360AdmissionLeadStatusChangeInput = {
  id: string
  schoolId: string
  status: 'new' | 'contacted' | 'qualified' | 'application_open' | 'converted' | 'archived'
  note?: string | null
}

export const angelcare360AdmissionLeadStatusChangeSchema = createSchema<Angelcare360AdmissionLeadStatusChangeInput>('admission_lead_status_change', (input) => {
  const errors: Angelcare360ValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'Le changement de statut doit être un objet.' }] }
  const data: Angelcare360AdmissionLeadStatusChangeInput = {
    id: asString(input.id, 'L’identifiant de la demande est requis.', 'id', errors),
    schoolId: asString(input.schoolId, 'L’établissement est requis.', 'schoolId', errors),
    status: asEnum(input.status, ['new', 'contacted', 'qualified', 'application_open', 'converted', 'archived'] as const, 'Le statut de la demande est invalide.', 'status', errors),
    note: asOptionalString(input.note),
  }
  return errors.length ? { success: false, errors } : { success: true, data }
})

export type Angelcare360AdmissionApplicationUpsertInput = SimpleDomainInput & {
  id?: string | null
  applicationCode: string
  leadId?: string | null
  parentId?: string | null
  studentId?: string | null
  academicYearId?: string | null
  classId?: string | null
  sectionId?: string | null
  source?: string | null
  childFirstName?: string | null
  childLastName?: string | null
  childDateOfBirth?: string | null
  childGender?: string | null
  childNationality?: string | null
  parentFirstName?: string | null
  parentLastName?: string | null
  relationshipType?: 'père' | 'mère' | 'tuteur' | 'autre' | string | null
  phone?: string | null
  email?: string | null
  address?: string | null
  applicationStage: string
  applicationDate?: string | null
  decisionDate?: string | null
  decisionStatus?: 'pending' | 'accepted' | 'rejected' | 'waitlisted' | 'converted' | string | null
  decisionReason?: string | null
  priority?: 'low' | 'normal' | 'high' | 'urgent' | string | null
  nextAction?: string | null
  nextActionAt?: string | null
  responsibleStaffId?: string | null
  convertedAt?: string | null
  convertedStudentId?: string | null
  convertedParentId?: string | null
  convertedEnrollmentId?: string | null
  status: 'open' | 'in_review' | 'approved' | 'rejected' | 'waitlisted' | 'converted' | 'archived'
}

function buildAdmissionApplicationUpsertSchema(name: string) {
  return createSchema<Angelcare360AdmissionApplicationUpsertInput>(name, (input) => {
    const errors: Angelcare360ValidationIssue[] = []
    if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'Le payload dossier d’admission doit être un objet.' }] }

    const data: Angelcare360AdmissionApplicationUpsertInput = {
      id: asOptionalString(input.id),
      schoolId: asString(input.schoolId, 'L’établissement est requis.', 'schoolId', errors),
      applicationCode: asString(input.applicationCode, 'Le code du dossier est obligatoire.', 'applicationCode', errors),
      leadId: asOptionalString(input.leadId),
      parentId: asOptionalString(input.parentId),
      studentId: asOptionalString(input.studentId),
      academicYearId: asOptionalString(input.academicYearId),
      classId: asOptionalString(input.classId),
      sectionId: asOptionalString(input.sectionId),
      source: asOptionalString(input.source),
      childFirstName: asOptionalString(input.childFirstName),
      childLastName: asOptionalString(input.childLastName),
      childDateOfBirth: asOptionalString(input.childDateOfBirth),
      childGender: asOptionalString(input.childGender),
      childNationality: asOptionalString(input.childNationality),
      parentFirstName: asOptionalString(input.parentFirstName),
      parentLastName: asOptionalString(input.parentLastName),
      relationshipType: asEnum(
        input.relationshipType || 'tuteur',
        ['père', 'mère', 'tuteur', 'autre'] as const,
        'La relation du parent est invalide.',
        'relationshipType',
        errors,
      ),
      phone: asOptionalString(input.phone),
      email: asOptionalString(input.email),
      address: asOptionalString(input.address),
      applicationStage: asString(input.applicationStage, 'L’étape du dossier est obligatoire.', 'applicationStage', errors),
      applicationDate: asOptionalString(input.applicationDate),
      decisionDate: asOptionalString(input.decisionDate),
      decisionStatus: asOptionalString(input.decisionStatus),
      decisionReason: asOptionalString(input.decisionReason),
      priority: asEnum(
        input.priority || 'normal',
        ['low', 'normal', 'high', 'urgent'] as const,
        'La priorité du dossier est invalide.',
        'priority',
        errors,
      ),
      nextAction: asOptionalString(input.nextAction),
      nextActionAt: asOptionalString(input.nextActionAt),
      responsibleStaffId: asOptionalString(input.responsibleStaffId),
      convertedAt: asOptionalString(input.convertedAt),
      convertedStudentId: asOptionalString(input.convertedStudentId),
      convertedParentId: asOptionalString(input.convertedParentId),
      convertedEnrollmentId: asOptionalString(input.convertedEnrollmentId),
      status: asEnum(input.status, ['open', 'in_review', 'approved', 'rejected', 'waitlisted', 'converted', 'archived'] as const, 'Le statut du dossier est invalide.', 'status', errors),
    }

    if (data.childDateOfBirth) {
      const parsed = new Date(data.childDateOfBirth)
      if (Number.isNaN(parsed.getTime())) {
        errors.push({ path: 'childDateOfBirth', message: 'La date de naissance de l’enfant est invalide.' })
      }
    }

    if (!data.childFirstName || !data.childLastName) {
      errors.push({ path: 'childFirstName', message: 'Le prénom et le nom de l’enfant sont requis pour le dossier.' })
    }

    if (!data.parentFirstName || !data.parentLastName) {
      errors.push({ path: 'parentFirstName', message: 'Le prénom et le nom du parent sont requis pour le dossier.' })
    }

    if (data.email) {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailPattern.test(data.email)) {
        errors.push({ path: 'email', message: 'L’adresse email du parent est invalide.' })
      }
    }

    if (!data.phone && !data.email) {
      errors.push({ path: 'phone', message: 'Le téléphone ou l’adresse email du parent est requis.' })
    }

    return errors.length ? { success: false, errors } : { success: true, data }
  })
}

export const angelcare360AdmissionApplicationCreateSchema = buildAdmissionApplicationUpsertSchema('admission_application_create')
export const angelcare360AdmissionApplicationUpdateSchema = buildAdmissionApplicationUpsertSchema('admission_application_update')

export type Angelcare360AdmissionApplicationStatusChangeInput = {
  id: string
  schoolId: string
  status: 'open' | 'in_review' | 'approved' | 'rejected' | 'waitlisted' | 'converted' | 'archived'
  applicationStage?: string | null
  note?: string | null
}

export const angelcare360AdmissionApplicationStatusChangeSchema = createSchema<Angelcare360AdmissionApplicationStatusChangeInput>('admission_application_status_change', (input) => {
  const errors: Angelcare360ValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'Le changement de statut du dossier doit être un objet.' }] }
  const data: Angelcare360AdmissionApplicationStatusChangeInput = {
    id: asString(input.id, 'L’identifiant du dossier est requis.', 'id', errors),
    schoolId: asString(input.schoolId, 'L’établissement est requis.', 'schoolId', errors),
    status: asEnum(input.status, ['open', 'in_review', 'approved', 'rejected', 'waitlisted', 'converted', 'archived'] as const, 'Le statut du dossier est invalide.', 'status', errors),
    applicationStage: asOptionalString(input.applicationStage),
    note: asOptionalString(input.note),
  }
  return errors.length ? { success: false, errors } : { success: true, data }
})

export type Angelcare360AdmissionDecisionInput = {
  id: string
  schoolId: string
  decisionStatus: 'pending' | 'accepted' | 'rejected' | 'waitlisted' | 'converted'
  decisionReason?: string | null
}

export const angelcare360AdmissionDecisionSchema = createSchema<Angelcare360AdmissionDecisionInput>('admission_decision', (input) => {
  const errors: Angelcare360ValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'La décision d’admission doit être un objet.' }] }
  const data: Angelcare360AdmissionDecisionInput = {
    id: asString(input.id, 'L’identifiant du dossier est requis.', 'id', errors),
    schoolId: asString(input.schoolId, 'L’établissement est requis.', 'schoolId', errors),
    decisionStatus: asEnum(input.decisionStatus, ['pending', 'accepted', 'rejected', 'waitlisted', 'converted'] as const, 'Le statut de décision est invalide.', 'decisionStatus', errors),
    decisionReason: asOptionalString(input.decisionReason),
  }
  return errors.length ? { success: false, errors } : { success: true, data }
})

export type Angelcare360AdmissionRequiredDocumentInput = {
  id?: string | null
  schoolId: string
  academicYearId?: string | null
  documentKey: string
  title: string
  description?: string | null
  requiredForStage?: string | null
  sortOrder: number
  isRequired?: boolean
  status: 'active' | 'inactive' | 'archived'
}

export const angelcare360AdmissionRequiredDocumentCreateSchema = createSchema<Angelcare360AdmissionRequiredDocumentInput>('admission_required_document_create', (input) => {
  const errors: Angelcare360ValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'Le document requis doit être un objet.' }] }
  const data: Angelcare360AdmissionRequiredDocumentInput = {
    id: asOptionalString(input.id),
    schoolId: asString(input.schoolId, 'L’établissement est requis.', 'schoolId', errors),
    academicYearId: asOptionalString(input.academicYearId),
    documentKey: asString(input.documentKey, 'La clé du document est obligatoire.', 'documentKey', errors),
    title: asString(input.title, 'Le titre du document est obligatoire.', 'title', errors),
    description: asOptionalString(input.description),
    requiredForStage: asOptionalString(input.requiredForStage),
    sortOrder: Math.max(1, asOptionalNumber(input.sortOrder, 1)),
    isRequired: asOptionalBoolean(input.isRequired, true),
    status: asEnum(input.status, ['active', 'inactive', 'archived'] as const, 'Le statut du document est invalide.', 'status', errors),
  }
  return errors.length ? { success: false, errors } : { success: true, data }
})

export const angelcare360AdmissionRequiredDocumentUpdateSchema = angelcare360AdmissionRequiredDocumentCreateSchema

export type Angelcare360AdmissionDocumentSubmissionUpdateInput = {
  id?: string | null
  schoolId: string
  applicationId: string
  requiredDocumentId: string
  documentId?: string | null
  verificationStatus: 'pending' | 'complete' | 'missing' | 'rejected'
  notes?: string | null
  rejectionReason?: string | null
  status: 'active' | 'inactive' | 'archived'
}

export const angelcare360AdmissionDocumentSubmissionUpdateSchema = createSchema<Angelcare360AdmissionDocumentSubmissionUpdateInput>('admission_document_submission_update', (input) => {
  const errors: Angelcare360ValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'La soumission documentaire doit être un objet.' }] }
  const data: Angelcare360AdmissionDocumentSubmissionUpdateInput = {
    id: asOptionalString(input.id),
    schoolId: asString(input.schoolId, 'L’établissement est requis.', 'schoolId', errors),
    applicationId: asString(input.applicationId, 'Le dossier est requis.', 'applicationId', errors),
    requiredDocumentId: asString(input.requiredDocumentId, 'Le document requis est obligatoire.', 'requiredDocumentId', errors),
    documentId: asOptionalString(input.documentId),
    verificationStatus: asEnum(input.verificationStatus, ['pending', 'complete', 'missing', 'rejected'] as const, 'Le statut documentaire est invalide.', 'verificationStatus', errors),
    notes: asOptionalString(input.notes),
    rejectionReason: asOptionalString(input.rejectionReason),
    status: asEnum(input.status, ['active', 'inactive', 'archived'] as const, 'Le statut de la soumission est invalide.', 'status', errors),
  }
  return errors.length ? { success: false, errors } : { success: true, data }
})

export type Angelcare360AdmissionNextActionInput = {
  schoolId: string
  id: string
  entity: 'lead' | 'application'
  nextAction?: string | null
  nextActionAt?: string | null
  responsibleStaffId?: string | null
  notes?: string | null
}

export const angelcare360AdmissionNextActionSchema = createSchema<Angelcare360AdmissionNextActionInput>('admission_next_action', (input) => {
  const errors: Angelcare360ValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'La prochaine action doit être un objet.' }] }
  const data: Angelcare360AdmissionNextActionInput = {
    schoolId: asString(input.schoolId, 'L’établissement est requis.', 'schoolId', errors),
    id: asString(input.id, 'L’identifiant est requis.', 'id', errors),
    entity: asEnum(input.entity, ['lead', 'application'] as const, 'Le type de dossier est invalide.', 'entity', errors),
    nextAction: asOptionalString(input.nextAction),
    nextActionAt: asOptionalString(input.nextActionAt),
    responsibleStaffId: asOptionalString(input.responsibleStaffId),
    notes: asOptionalString(input.notes),
  }
  return errors.length ? { success: false, errors } : { success: true, data }
})

export type Angelcare360AdmissionConversionInput = {
  schoolId: string
  applicationId: string
  academicYearId?: string | null
  classId?: string | null
  sectionId?: string | null
  duplicateOverride?: boolean
  notes?: string | null
}

export const angelcare360AdmissionConversionSchema = createSchema<Angelcare360AdmissionConversionInput>('admission_conversion', (input) => {
  const errors: Angelcare360ValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'La conversion doit être un objet.' }] }
  const data: Angelcare360AdmissionConversionInput = {
    schoolId: asString(input.schoolId, 'L’établissement est requis.', 'schoolId', errors),
    applicationId: asString(input.applicationId, 'Le dossier d’admission est requis.', 'applicationId', errors),
    academicYearId: asOptionalString(input.academicYearId),
    classId: asOptionalString(input.classId),
    sectionId: asOptionalString(input.sectionId),
    duplicateOverride: asOptionalBoolean(input.duplicateOverride, false),
    notes: asOptionalString(input.notes),
  }
  return errors.length ? { success: false, errors } : { success: true, data }
})

export const angelcare360AdmissionsAuditFilterSchema = createSchema<Angelcare360AdmissionsAuditFilter>('admissions_audit_filter', (input) => {
  const errors: Angelcare360ValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'Le filtre d’audit admissions doit être un objet.' }] }
  const data: Angelcare360AdmissionsAuditFilter = {
    search: asOptionalString(input.search),
    module: asOptionalString(input.module),
    action: asOptionalString(input.action),
    severity: asOptionalString(input.severity),
    entityType: asOptionalString(input.entityType),
    actorRole: asOptionalString(input.actorRole),
    from: asOptionalString(input.from),
    to: asOptionalString(input.to),
  }
  if (data.from && data.to && !isValidDateOrder(data.from, data.to)) {
    errors.push({ path: 'to', message: 'La date de fin doit être postérieure à la date de début.' })
  }
  return errors.length ? { success: false, errors } : { success: true, data }
})

export const angelcare360AttendanceSessionOpenSchema = createSchema<Angelcare360AttendanceSessionOpenInput>('attendance_session_open', (input) => {
  const errors: Angelcare360ValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'Le payload de session de présence doit être un objet.' }] }
  const data: Angelcare360AttendanceSessionOpenInput = {
    schoolId: asString(input.schoolId, 'L’établissement est requis.', 'schoolId', errors),
    academicYearId: asString(input.academicYearId, 'L’année scolaire est requise.', 'academicYearId', errors),
    classId: asString(input.classId, 'La classe est requise.', 'classId', errors),
    sectionId: asOptionalString(input.sectionId),
    sessionDate: asDateString(input.sessionDate, 'La date de présence est invalide.', 'sessionDate', errors),
    sessionKey: asString(input.sessionKey || 'daily', 'La clé de session est obligatoire.', 'sessionKey', errors),
    sessionStatus: asEnum(input.sessionStatus || 'open', ['draft', 'open', 'closed', 'locked', 'cancelled'] as const, 'Le statut de session est invalide.', 'sessionStatus', errors),
    notes: asOptionalString(input.notes),
  }
  if (data.sessionDate && data.sessionDate.length > 10) {
    data.sessionDate = data.sessionDate.slice(0, 10)
  }
  return errors.length ? { success: false, errors } : { success: true, data }
})

export const angelcare360AttendanceSessionCloseSchema = createSchema<Angelcare360AttendanceSessionCloseInput>('attendance_session_close', (input) => {
  const errors: Angelcare360ValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'Le payload de clôture de session doit être un objet.' }] }
  const data: Angelcare360AttendanceSessionCloseInput = {
    schoolId: asString(input.schoolId, 'L’établissement est requis.', 'schoolId', errors),
    attendanceSessionId: asString(input.attendanceSessionId, 'La session de présence est requise.', 'attendanceSessionId', errors),
    notes: asOptionalString(input.notes),
  }
  return errors.length ? { success: false, errors } : { success: true, data }
})

export const angelcare360AttendanceSessionQuerySchema = createSchema<Angelcare360AttendanceSessionQueryInput>('attendance_session_query', (input) => {
  const errors: Angelcare360ValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'Le filtre de session doit être un objet.' }] }
  const data: Angelcare360AttendanceSessionQueryInput = {
    schoolId: asString(input.schoolId, 'L’établissement est requis.', 'schoolId', errors),
    date: asOptionalString(input.date),
    academicYearId: asOptionalString(input.academicYearId),
    classId: asOptionalString(input.classId),
    sectionId: asOptionalString(input.sectionId),
  }
  if (data.date && !/^\d{4}-\d{2}-\d{2}$/.test(data.date)) {
    errors.push({ path: 'date', message: 'La date de filtre est invalide.' })
  }
  return errors.length ? { success: false, errors } : { success: true, data }
})

export const angelcare360AttendanceRecordUpdateSchema = createSchema<Angelcare360AttendanceRecordUpdateInput>('attendance_record_update', (input) => {
  const errors: Angelcare360ValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'Le payload de présence doit être un objet.' }] }
  const data: Angelcare360AttendanceRecordUpdateInput = {
    schoolId: asString(input.schoolId, 'L’établissement est requis.', 'schoolId', errors),
    attendanceSessionId: asString(input.attendanceSessionId, 'La session de présence est requise.', 'attendanceSessionId', errors),
    studentId: asString(input.studentId, 'L’élève est requis.', 'studentId', errors),
    attendanceStatus: asEnum(
      input.attendanceStatus,
      ['present', 'absent', 'late', 'excused', 'justified', 'pending_justification', 'left_early', 'unknown'] as const,
      'Le statut de présence est invalide.',
      'attendanceStatus',
      errors,
    ),
    minutesLate: input.minutesLate === undefined || input.minutesLate === null ? null : asOptionalInteger(input.minutesLate, 0),
    note: asOptionalString(input.note),
    justificationRequired: asOptionalBoolean(input.justificationRequired, false),
  }
  if (data.attendanceStatus === 'late' && (data.minutesLate === null || data.minutesLate === undefined || data.minutesLate <= 0)) {
    errors.push({ path: 'minutesLate', message: 'Le retard doit contenir un nombre de minutes positif.' })
  }
  return errors.length ? { success: false, errors } : { success: true, data }
})

export const angelcare360AttendanceBulkUpdateSchema = createSchema<Angelcare360AttendanceBulkUpdateInput>('attendance_bulk_update', (input) => {
  const errors: Angelcare360ValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'Le lot de présence doit être un objet.' }] }
  const recordsInput = Array.isArray(input.records) ? input.records : []
  const records = recordsInput.map((record, index) => {
    const parsed = angelcare360AttendanceRecordUpdateSchema.safeParse({
      ...(isRecord(record) ? record : {}),
      schoolId: input.schoolId,
      attendanceSessionId: input.attendanceSessionId,
    })
    if (!parsed.success) {
      for (const error of parsed.errors) {
        errors.push({ path: `records.${index}.${error.path}`, message: error.message })
      }
      return null
    }
    return parsed.data
  }).filter((record): record is Angelcare360AttendanceRecordUpdateInput => Boolean(record))

  const data: Angelcare360AttendanceBulkUpdateInput = {
    schoolId: asString(input.schoolId, 'L’établissement est requis.', 'schoolId', errors),
    attendanceSessionId: asString(input.attendanceSessionId, 'La session de présence est requise.', 'attendanceSessionId', errors),
    records,
  }

  return errors.length ? { success: false, errors } : { success: true, data }
})

export const angelcare360AttendanceStudentSummaryQuerySchema = createSchema<Angelcare360AttendanceStudentSummaryQueryInput>('attendance_student_summary_query', (input) => {
  const errors: Angelcare360ValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'Le filtre des présences élève doit être un objet.' }] }
  const data: Angelcare360AttendanceStudentSummaryQueryInput = {
    schoolId: asString(input.schoolId, 'L’établissement est requis.', 'schoolId', errors),
    studentId: asOptionalString(input.studentId),
    classId: asOptionalString(input.classId),
    sectionId: asOptionalString(input.sectionId),
    from: asOptionalString(input.from),
    to: asOptionalString(input.to),
  }
  if (data.from && data.to && !isValidDateOrder(data.from, data.to)) {
    errors.push({ path: 'to', message: 'La date de fin doit être postérieure à la date de début.' })
  }
  return errors.length ? { success: false, errors } : { success: true, data }
})

export const angelcare360AttendanceLateRecordsQuerySchema = createSchema<Angelcare360AttendanceLateRecordsQueryInput>('attendance_late_records_query', (input) => {
  const errors: Angelcare360ValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'Le filtre des retards doit être un objet.' }] }
  const data: Angelcare360AttendanceLateRecordsQueryInput = {
    schoolId: asString(input.schoolId, 'L’établissement est requis.', 'schoolId', errors),
    from: asOptionalString(input.from),
    to: asOptionalString(input.to),
    classId: asOptionalString(input.classId),
    studentId: asOptionalString(input.studentId),
  }
  if (data.from && data.to && !isValidDateOrder(data.from, data.to)) {
    errors.push({ path: 'to', message: 'La date de fin doit être postérieure à la date de début.' })
  }
  return errors.length ? { success: false, errors } : { success: true, data }
})

export const angelcare360AttendanceAbsenceRecordsQuerySchema = createSchema<Angelcare360AttendanceAbsenceRecordsQueryInput>('attendance_absence_records_query', (input) => {
  const errors: Angelcare360ValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'Le filtre des absences doit être un objet.' }] }
  const data: Angelcare360AttendanceAbsenceRecordsQueryInput = {
    schoolId: asString(input.schoolId, 'L’établissement est requis.', 'schoolId', errors),
    from: asOptionalString(input.from),
    to: asOptionalString(input.to),
    classId: asOptionalString(input.classId),
    studentId: asOptionalString(input.studentId),
  }
  if (data.from && data.to && !isValidDateOrder(data.from, data.to)) {
    errors.push({ path: 'to', message: 'La date de fin doit être postérieure à la date de début.' })
  }
  return errors.length ? { success: false, errors } : { success: true, data }
})

export const angelcare360AttendanceJustificationCreateSchema = createSchema<Angelcare360AttendanceJustificationCreateInput>('attendance_justification_create', (input) => {
  const errors: Angelcare360ValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'Le payload de justification doit être un objet.' }] }
  const data: Angelcare360AttendanceJustificationCreateInput = {
    schoolId: asString(input.schoolId, 'L’établissement est requis.', 'schoolId', errors),
    attendanceRecordId: asString(input.attendanceRecordId, 'Le relevé de présence est requis.', 'attendanceRecordId', errors),
    justificationCode: asString(input.justificationCode, 'Le code de justification est obligatoire.', 'justificationCode', errors),
    reasonCategory: asString(input.reasonCategory, 'La catégorie de motif est obligatoire.', 'reasonCategory', errors),
    description: asString(input.description, 'La description de justification est obligatoire.', 'description', errors),
    evidenceDocumentId: asOptionalString(input.evidenceDocumentId),
    status: asEnum(input.status || 'pending', ['pending', 'accepted', 'rejected', 'expired', 'cancelled'] as const, 'Le statut de justification est invalide.', 'status', errors),
  }
  return errors.length ? { success: false, errors } : { success: true, data }
})

export const angelcare360AttendanceJustificationUpdateSchema = createSchema<Angelcare360AttendanceJustificationUpdateInput>('attendance_justification_update', (input) => {
  const errors: Angelcare360ValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'Le payload de justification doit être un objet.' }] }
  const parsed = angelcare360AttendanceJustificationCreateSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, errors: parsed.errors }
  }
  const data: Angelcare360AttendanceJustificationUpdateInput = {
    ...parsed.data,
    id: asString(input.id, 'L’identifiant de la justification est requis.', 'id', errors),
    reviewedAt: asOptionalString(input.reviewedAt),
  }
  return errors.length ? { success: false, errors } : { success: true, data }
})

export const angelcare360AttendanceJustificationDecisionSchema = createSchema<Angelcare360AttendanceJustificationDecisionInput>('attendance_justification_decision', (input) => {
  const errors: Angelcare360ValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'Le payload de décision doit être un objet.' }] }
  const data: Angelcare360AttendanceJustificationDecisionInput = {
    schoolId: asString(input.schoolId, 'L’établissement est requis.', 'schoolId', errors),
    id: asString(input.id, 'L’identifiant de la justification est requis.', 'id', errors),
    decision: asEnum(input.decision, ['pending', 'accepted', 'rejected', 'expired', 'cancelled'] as const, 'La décision de justification est invalide.', 'decision', errors),
    decisionReason: asOptionalString(input.decisionReason),
  }
  if (data.decision === 'rejected' && !data.decisionReason) {
    errors.push({ path: 'decisionReason', message: 'Le motif de refus est obligatoire.' })
  }
  return errors.length ? { success: false, errors } : { success: true, data }
})

export const angelcare360TimetableSlotCreateSchema = createSchema<Angelcare360TimetableSlotCreateInput>('timetable_slot_create', (input) => {
  const errors: Angelcare360ValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'Le payload d’emploi du temps doit être un objet.' }] }
  const data: Angelcare360TimetableSlotCreateInput = {
    schoolId: asString(input.schoolId, 'L’établissement est requis.', 'schoolId', errors),
    academicYearId: asString(input.academicYearId, 'L’année scolaire est requise.', 'academicYearId', errors),
    classId: asString(input.classId, 'La classe est requise.', 'classId', errors),
    sectionId: asOptionalString(input.sectionId),
    subjectId: asString(input.subjectId, 'La matière est requise.', 'subjectId', errors),
    staffId: asOptionalString(input.staffId),
    dayOfWeek: asOptionalInteger(input.dayOfWeek, 1),
    startTime: asTimeString(input.startTime, 'L’heure de début est obligatoire.', 'startTime', errors),
    endTime: asTimeString(input.endTime, 'L’heure de fin est obligatoire.', 'endTime', errors),
    room: asOptionalString(input.room),
    slotType: asOptionalString(input.slotType),
    status: asEnum(input.status || 'active', ['active', 'draft', 'suspended', 'archived'] as const, 'Le statut du créneau est invalide.', 'status', errors),
  }
  if (data.dayOfWeek < 1 || data.dayOfWeek > 7) {
    errors.push({ path: 'dayOfWeek', message: 'Le jour de semaine doit être compris entre 1 et 7.' })
  }
  if (data.startTime && data.endTime && data.startTime >= data.endTime) {
    errors.push({ path: 'endTime', message: 'L’heure de fin doit être postérieure à l’heure de début.' })
  }
  return errors.length ? { success: false, errors } : { success: true, data }
})

export const angelcare360TimetableSlotUpdateSchema = createSchema<Angelcare360TimetableSlotUpdateInput>('timetable_slot_update', (input) => {
  const errors: Angelcare360ValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'Le payload d’emploi du temps doit être un objet.' }] }
  const parsed = angelcare360TimetableSlotCreateSchema.safeParse(input)
  if (!parsed.success) return { success: false, errors: parsed.errors }
  const data: Angelcare360TimetableSlotUpdateInput = {
    ...parsed.data,
    id: asString(input.id, 'L’identifiant du créneau est requis.', 'id', errors),
  }
  return errors.length ? { success: false, errors } : { success: true, data }
})

export const angelcare360TimetableConflictCheckSchema = createSchema<Angelcare360TimetableConflictCheckInput>('timetable_conflict_check', (input) => {
  const errors: Angelcare360ValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'Le filtre de conflit doit être un objet.' }] }
  const data: Angelcare360TimetableConflictCheckInput = {
    schoolId: asString(input.schoolId, 'L’établissement est requis.', 'schoolId', errors),
    academicYearId: asOptionalString(input.academicYearId),
    classId: asOptionalString(input.classId),
    sectionId: asOptionalString(input.sectionId),
    staffId: asOptionalString(input.staffId),
    dayOfWeek: input.dayOfWeek === undefined || input.dayOfWeek === null ? null : asOptionalInteger(input.dayOfWeek, 0),
    startTime: asOptionalString(input.startTime),
    endTime: asOptionalString(input.endTime),
  }
  return errors.length ? { success: false, errors } : { success: true, data }
})

export const angelcare360SchoolCalendarEventCreateSchema = createSchema<Angelcare360SchoolCalendarEventCreateInput>('school_calendar_event_create', (input) => {
  const errors: Angelcare360ValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'Le payload d’évènement scolaire doit être un objet.' }] }
  const data: Angelcare360SchoolCalendarEventCreateInput = {
    schoolId: asString(input.schoolId, 'L’établissement est requis.', 'schoolId', errors),
    academicYearId: asOptionalString(input.academicYearId),
    eventCode: asString(input.eventCode, 'Le code de l’évènement est obligatoire.', 'eventCode', errors),
    title: asString(input.title, 'Le titre de l’évènement est obligatoire.', 'title', errors),
    description: asOptionalString(input.description),
    eventType: asString(input.eventType, 'Le type d’évènement est obligatoire.', 'eventType', errors),
    startsOn: asDateString(input.startsOn, 'La date de début est invalide.', 'startsOn', errors),
    endsOn: asDateString(input.endsOn, 'La date de fin est invalide.', 'endsOn', errors),
    allDay: asOptionalBoolean(input.allDay, true),
    audience: asOptionalString(input.audience) || 'all',
    status: asEnum(input.status || 'planned', ['planned', 'published', 'completed', 'cancelled', 'archived'] as const, 'Le statut de l’évènement est invalide.', 'status', errors),
  }
  if (data.startsOn && data.endsOn && !isValidDateOrder(data.startsOn, data.endsOn)) {
    errors.push({ path: 'endsOn', message: 'La date de fin doit être postérieure à la date de début.' })
  }
  return errors.length ? { success: false, errors } : { success: true, data }
})

export const angelcare360SchoolCalendarEventUpdateSchema = createSchema<Angelcare360SchoolCalendarEventUpdateInput>('school_calendar_event_update', (input) => {
  const errors: Angelcare360ValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'Le payload d’évènement scolaire doit être un objet.' }] }
  const parsed = angelcare360SchoolCalendarEventCreateSchema.safeParse(input)
  if (!parsed.success) return { success: false, errors: parsed.errors }
  const data: Angelcare360SchoolCalendarEventUpdateInput = {
    ...parsed.data,
    id: asString(input.id, 'L’identifiant de l’évènement est requis.', 'id', errors),
  }
  return errors.length ? { success: false, errors } : { success: true, data }
})

export const angelcare360AttendanceAuditFilterSchema = createSchema<Angelcare360AttendanceAuditFilterInput>('attendance_audit_filter', (input) => {
  const errors: Angelcare360ValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'Le filtre d’audit présence doit être un objet.' }] }
  const data: Angelcare360AttendanceAuditFilterInput = {
    search: asOptionalString(input.search),
    module: asOptionalString(input.module),
    action: asOptionalString(input.action),
    severity: asOptionalString(input.severity),
    entityType: asOptionalString(input.entityType),
    from: asOptionalString(input.from),
    to: asOptionalString(input.to),
  }
  if (data.from && data.to && !isValidDateOrder(data.from, data.to)) {
    errors.push({ path: 'to', message: 'La date de fin doit être postérieure à la date de début.' })
  }
  return errors.length ? { success: false, errors } : { success: true, data }
})

export type Angelcare360LessonCreateInput = {
  schoolId: string
  academicYearId: string
  classId: string
  sectionId?: string | null
  subjectId: string
  staffId?: string | null
  lessonCode?: string | null
  lessonDate: string
  title: string
  objectives?: string | null
  homeworkSummary?: string | null
  status: 'draft' | 'planned' | 'completed' | 'cancelled' | 'archived'
}

export const angelcare360LessonCreateSchema = createSchema<Angelcare360LessonCreateInput>('lesson_create', (input) => {
  const errors: Angelcare360ValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'Le payload de cours doit être un objet.' }] }
  const data: Angelcare360LessonCreateInput = {
    schoolId: asString(input.schoolId, 'L’établissement est requis.', 'schoolId', errors),
    academicYearId: asString(input.academicYearId, 'L’année scolaire est requise.', 'academicYearId', errors),
    classId: asString(input.classId, 'La classe est requise.', 'classId', errors),
    sectionId: asOptionalString(input.sectionId),
    subjectId: asString(input.subjectId, 'La matière est requise.', 'subjectId', errors),
    staffId: asOptionalString(input.staffId),
    lessonCode: asOptionalString(input.lessonCode),
    lessonDate: asDateString(input.lessonDate, 'La date du cours est obligatoire.', 'lessonDate', errors),
    title: asString(input.title, 'Le titre du cours est obligatoire.', 'title', errors),
    objectives: asOptionalString(input.objectives),
    homeworkSummary: asOptionalString(input.homeworkSummary),
    status: asEnum(input.status, ['draft', 'planned', 'completed', 'cancelled', 'archived'] as const, 'Le statut du cours est invalide.', 'status', errors),
  }

  if (data.status === 'planned' && !data.lessonDate) {
    errors.push({ path: 'lessonDate', message: 'Une date est requise pour un cours planifié.' })
  }

  return errors.length ? { success: false, errors } : { success: true, data }
})

export type Angelcare360LessonUpdateInput = Angelcare360LessonCreateInput & {
  id: string
}

export const angelcare360LessonUpdateSchema = createSchema<Angelcare360LessonUpdateInput>('lesson_update', (input) => {
  const errors: Angelcare360ValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'Le payload de cours doit être un objet.' }] }
  const parsed = angelcare360LessonCreateSchema.safeParse(input)
  if (!parsed.success) return { success: false, errors: parsed.errors }
  const data: Angelcare360LessonUpdateInput = {
    ...parsed.data,
    id: asString(input.id, 'L’identifiant du cours est requis.', 'id', errors),
  }
  return errors.length ? { success: false, errors } : { success: true, data }
})

export type Angelcare360AssignmentCreateInput = {
  schoolId: string
  academicYearId: string
  classId: string
  sectionId?: string | null
  subjectId: string
  staffId: string
  assignmentCode?: string | null
  title: string
  description?: string | null
  dueOn?: string | null
  maxScore?: number | null
  status: 'draft' | 'published' | 'closed' | 'archived'
}

export const angelcare360AssignmentCreateSchema = createSchema<Angelcare360AssignmentCreateInput>('assignment_create', (input) => {
  const errors: Angelcare360ValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'Le payload de devoir doit être un objet.' }] }
  const status = asEnum(input.status || 'draft', ['draft', 'published', 'closed', 'archived'] as const, 'Le statut du devoir est invalide.', 'status', errors)
  const dueOn = asOptionalString(input.dueOn)
  if (status === 'published' && !dueOn) {
    errors.push({ path: 'dueOn', message: 'La date d’échéance est obligatoire pour un devoir publié.' })
  }
  const maxScore = input.maxScore === null || input.maxScore === undefined ? null : asOptionalNumber(input.maxScore, 0)
  if (maxScore !== null && maxScore <= 0) {
    errors.push({ path: 'maxScore', message: 'Le score maximal doit être strictement positif.' })
  }
  const data: Angelcare360AssignmentCreateInput = {
    schoolId: asString(input.schoolId, 'L’établissement est requis.', 'schoolId', errors),
    academicYearId: asString(input.academicYearId, 'L’année scolaire est requise.', 'academicYearId', errors),
    classId: asString(input.classId, 'La classe est requise.', 'classId', errors),
    sectionId: asOptionalString(input.sectionId),
    subjectId: asString(input.subjectId, 'La matière est requise.', 'subjectId', errors),
    staffId: asString(input.staffId, 'L’enseignant responsable est requis.', 'staffId', errors),
    assignmentCode: asOptionalString(input.assignmentCode),
    title: asString(input.title, 'Le titre du devoir est obligatoire.', 'title', errors),
    description: asOptionalString(input.description),
    dueOn,
    maxScore,
    status,
  }
  return errors.length ? { success: false, errors } : { success: true, data }
})

export type Angelcare360AssignmentUpdateInput = Angelcare360AssignmentCreateInput & { id: string }

export const angelcare360AssignmentUpdateSchema = createSchema<Angelcare360AssignmentUpdateInput>('assignment_update', (input) => {
  const errors: Angelcare360ValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'Le payload de devoir doit être un objet.' }] }
  const parsed = angelcare360AssignmentCreateSchema.safeParse(input)
  if (!parsed.success) return { success: false, errors: parsed.errors }
  const data: Angelcare360AssignmentUpdateInput = {
    ...parsed.data,
    id: asString(input.id, 'L’identifiant du devoir est requis.', 'id', errors),
  }
  return errors.length ? { success: false, errors } : { success: true, data }
})

export type Angelcare360AssignmentStatusChangeInput = {
  schoolId: string
  id: string
  status: 'draft' | 'published' | 'closed' | 'archived'
}

export const angelcare360AssignmentStatusChangeSchema = createSchema<Angelcare360AssignmentStatusChangeInput>('assignment_status_change', (input) => {
  const errors: Angelcare360ValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'Le changement de statut du devoir doit être un objet.' }] }
  const data: Angelcare360AssignmentStatusChangeInput = {
    schoolId: asString(input.schoolId, 'L’établissement est requis.', 'schoolId', errors),
    id: asString(input.id, 'L’identifiant du devoir est requis.', 'id', errors),
    status: asEnum(input.status, ['draft', 'published', 'closed', 'archived'] as const, 'Le statut du devoir est invalide.', 'status', errors),
  }
  return errors.length ? { success: false, errors } : { success: true, data }
})

export type Angelcare360SubmissionStatusUpdateInput = {
  schoolId: string
  assignmentId: string
  studentId: string
  status: 'pending' | 'draft' | 'submitted' | 'late' | 'reviewed' | 'graded' | 'missing' | 'archived'
  score?: number | null
  feedback?: string | null
  submittedAt?: string | null
}

export const angelcare360SubmissionStatusUpdateSchema = createSchema<Angelcare360SubmissionStatusUpdateInput>('submission_status_update', (input) => {
  const errors: Angelcare360ValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'Le payload de soumission doit être un objet.' }] }
  const score = input.score === null || input.score === undefined ? null : asOptionalNumber(input.score, 0)
  if (score !== null && score < 0) {
    errors.push({ path: 'score', message: 'La note de soumission ne peut pas être négative.' })
  }
  const data: Angelcare360SubmissionStatusUpdateInput = {
    schoolId: asString(input.schoolId, 'L’établissement est requis.', 'schoolId', errors),
    assignmentId: asString(input.assignmentId, 'Le devoir est requis.', 'assignmentId', errors),
    studentId: asString(input.studentId, 'L’élève est requis.', 'studentId', errors),
    status: asEnum(input.status, ['pending', 'draft', 'submitted', 'late', 'reviewed', 'graded', 'missing', 'archived'] as const, 'Le statut de soumission est invalide.', 'status', errors),
    score,
    feedback: asOptionalString(input.feedback),
    submittedAt: asOptionalString(input.submittedAt),
  }
  return errors.length ? { success: false, errors } : { success: true, data }
})

export type Angelcare360ExamCreateInput = {
  schoolId: string
  academicYearId: string
  classId: string
  sectionId?: string | null
  subjectId: string
  staffId?: string | null
  examCode?: string | null
  title: string
  examType: string
  scheduledOn: string
  durationMinutes?: number | null
  maxScore?: number | null
  status: 'draft' | 'planned' | 'scheduled' | 'active' | 'open' | 'completed' | 'closed' | 'graded' | 'archived'
}

export const angelcare360ExamCreateSchema = createSchema<Angelcare360ExamCreateInput>('exam_create', (input) => {
  const errors: Angelcare360ValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'Le payload d’examen doit être un objet.' }] }
  const durationMinutes = input.durationMinutes === null || input.durationMinutes === undefined ? null : Math.trunc(asOptionalNumber(input.durationMinutes, 0))
  if (durationMinutes !== null && durationMinutes <= 0) {
    errors.push({ path: 'durationMinutes', message: 'La durée de l’examen doit être strictement positive.' })
  }
  const maxScore = input.maxScore === null || input.maxScore === undefined ? null : asOptionalNumber(input.maxScore, 0)
  if (maxScore !== null && maxScore <= 0) {
    errors.push({ path: 'maxScore', message: 'Le score maximal de l’examen doit être strictement positif.' })
  }
  const data: Angelcare360ExamCreateInput = {
    schoolId: asString(input.schoolId, 'L’établissement est requis.', 'schoolId', errors),
    academicYearId: asString(input.academicYearId, 'L’année scolaire est requise.', 'academicYearId', errors),
    classId: asString(input.classId, 'La classe est requise.', 'classId', errors),
    sectionId: asOptionalString(input.sectionId),
    subjectId: asString(input.subjectId, 'La matière est requise.', 'subjectId', errors),
    staffId: asOptionalString(input.staffId),
    examCode: asOptionalString(input.examCode),
    title: asString(input.title, 'Le titre de l’examen est obligatoire.', 'title', errors),
    examType: asString(input.examType, 'Le type d’examen est obligatoire.', 'examType', errors),
    scheduledOn: asDateString(input.scheduledOn, 'La date de l’examen est obligatoire.', 'scheduledOn', errors),
    durationMinutes,
    maxScore,
    status: asEnum(input.status, ['draft', 'planned', 'scheduled', 'active', 'open', 'completed', 'closed', 'graded', 'archived'] as const, 'Le statut de l’examen est invalide.', 'status', errors),
  }
  return errors.length ? { success: false, errors } : { success: true, data }
})

export type Angelcare360ExamUpdateInput = Angelcare360ExamCreateInput & { id: string }

export const angelcare360ExamUpdateSchema = createSchema<Angelcare360ExamUpdateInput>('exam_update', (input) => {
  const errors: Angelcare360ValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'Le payload d’examen doit être un objet.' }] }
  const parsed = angelcare360ExamCreateSchema.safeParse(input)
  if (!parsed.success) return { success: false, errors: parsed.errors }
  const data: Angelcare360ExamUpdateInput = {
    ...parsed.data,
    id: asString(input.id, 'L’identifiant de l’examen est requis.', 'id', errors),
  }
  return errors.length ? { success: false, errors } : { success: true, data }
})

export type Angelcare360ExamStatusChangeInput = {
  schoolId: string
  id: string
  status: 'draft' | 'planned' | 'scheduled' | 'active' | 'open' | 'completed' | 'closed' | 'graded' | 'archived'
}

export const angelcare360ExamStatusChangeSchema = createSchema<Angelcare360ExamStatusChangeInput>('exam_status_change', (input) => {
  const errors: Angelcare360ValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'Le changement de statut de l’examen doit être un objet.' }] }
  const data: Angelcare360ExamStatusChangeInput = {
    schoolId: asString(input.schoolId, 'L’établissement est requis.', 'schoolId', errors),
    id: asString(input.id, 'L’identifiant de l’examen est requis.', 'id', errors),
    status: asEnum(input.status, ['draft', 'planned', 'scheduled', 'active', 'open', 'completed', 'closed', 'graded', 'archived'] as const, 'Le statut de l’examen est invalide.', 'status', errors),
  }
  return errors.length ? { success: false, errors } : { success: true, data }
})

export type Angelcare360ExamSessionCreateInput = {
  schoolId: string
  examId: string
  sessionCode: string
  room?: string | null
  startsAt?: string | null
  endsAt?: string | null
  invigilatorStaffId?: string | null
  status: 'planned' | 'scheduled' | 'open' | 'closed' | 'archived'
}

export const angelcare360ExamSessionCreateSchema = createSchema<Angelcare360ExamSessionCreateInput>('exam_session_create', (input) => {
  const errors: Angelcare360ValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'Le payload de session d’examen doit être un objet.' }] }
  const startsAt = asOptionalString(input.startsAt)
  const endsAt = asOptionalString(input.endsAt)
  if (startsAt && endsAt && !isValidDateOrder(startsAt, endsAt)) {
    errors.push({ path: 'endsAt', message: 'La fin de session doit être postérieure au début.' })
  }
  const data: Angelcare360ExamSessionCreateInput = {
    schoolId: asString(input.schoolId, 'L’établissement est requis.', 'schoolId', errors),
    examId: asString(input.examId, 'L’examen est requis.', 'examId', errors),
    sessionCode: asString(input.sessionCode, 'Le code de session est obligatoire.', 'sessionCode', errors),
    room: asOptionalString(input.room),
    startsAt,
    endsAt,
    invigilatorStaffId: asOptionalString(input.invigilatorStaffId),
    status: asEnum(input.status, ['planned', 'scheduled', 'open', 'closed', 'archived'] as const, 'Le statut de session est invalide.', 'status', errors),
  }
  return errors.length ? { success: false, errors } : { success: true, data }
})

export type Angelcare360ExamSessionUpdateInput = Angelcare360ExamSessionCreateInput & { id: string }

export const angelcare360ExamSessionUpdateSchema = createSchema<Angelcare360ExamSessionUpdateInput>('exam_session_update', (input) => {
  const errors: Angelcare360ValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'Le payload de session d’examen doit être un objet.' }] }
  const parsed = angelcare360ExamSessionCreateSchema.safeParse(input)
  if (!parsed.success) return { success: false, errors: parsed.errors }
  const data: Angelcare360ExamSessionUpdateInput = {
    ...parsed.data,
    id: asString(input.id, 'L’identifiant de la session est requis.', 'id', errors),
  }
  return errors.length ? { success: false, errors } : { success: true, data }
})

export type Angelcare360MarkUpdateInput = {
  schoolId: string
  academicYearId: string
  studentId: string
  subjectId: string
  examId?: string | null
  assignmentId?: string | null
  assessmentType: string
  score?: number | null
  maxScore: number
  markState: 'present' | 'absent' | 'exempt' | 'pending'
  grade?: string | null
  recordedByStaffId?: string | null
}

export const angelcare360MarkUpdateSchema = createSchema<Angelcare360MarkUpdateInput>('mark_update', (input) => {
  const errors: Angelcare360ValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'Le payload de note doit être un objet.' }] }
  const score = input.score === null || input.score === undefined ? null : asOptionalNumber(input.score, 0)
  const maxScore = asOptionalNumber(input.maxScore, 0)
  const markState = asEnum(input.markState || 'present', ['present', 'absent', 'exempt', 'pending'] as const, 'L’état de note est invalide.', 'markState', errors)
  if (maxScore <= 0) {
    errors.push({ path: 'maxScore', message: 'Le score maximal doit être strictement positif.' })
  }
  if (score !== null && score < 0) {
    errors.push({ path: 'score', message: 'La note ne peut pas être négative.' })
  }
  if (score !== null && maxScore > 0 && score > maxScore) {
    errors.push({ path: 'score', message: 'La note ne peut pas dépasser le score maximal.' })
  }
  const data: Angelcare360MarkUpdateInput = {
    schoolId: asString(input.schoolId, 'L’établissement est requis.', 'schoolId', errors),
    academicYearId: asString(input.academicYearId, 'L’année scolaire est requise.', 'academicYearId', errors),
    studentId: asString(input.studentId, 'L’élève est requis.', 'studentId', errors),
    subjectId: asString(input.subjectId, 'La matière est requise.', 'subjectId', errors),
    examId: asOptionalString(input.examId),
    assignmentId: asOptionalString(input.assignmentId),
    assessmentType: asString(input.assessmentType, 'Le type d’évaluation est obligatoire.', 'assessmentType', errors),
    score,
    maxScore,
    markState,
    grade: asOptionalString(input.grade),
    recordedByStaffId: asOptionalString(input.recordedByStaffId),
  }
  return errors.length ? { success: false, errors } : { success: true, data }
})

export type Angelcare360BulkMarkUpdateInput = {
  schoolId: string
  academicYearId: string
  examId?: string | null
  assignmentId?: string | null
  classId?: string | null
  sectionId?: string | null
  subjectId: string
  assessmentType: string
  records: Array<Angelcare360MarkUpdateInput & { studentId: string }>
}

export const angelcare360BulkMarkUpdateSchema = createSchema<Angelcare360BulkMarkUpdateInput>('bulk_mark_update', (input) => {
  const errors: Angelcare360ValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'Le lot de notes doit être un objet.' }] }
  const recordsInput = Array.isArray(input.records) ? input.records : []
  const records = recordsInput.map((record, index) => {
    const parsed = angelcare360MarkUpdateSchema.safeParse({
      ...(isRecord(record) ? record : {}),
      schoolId: input.schoolId,
      academicYearId: input.academicYearId,
      subjectId: input.subjectId,
      examId: input.examId || null,
      assignmentId: input.assignmentId || null,
      assessmentType: input.assessmentType,
    })
    if (!parsed.success) {
      for (const error of parsed.errors) {
        errors.push({ path: `records.${index}.${error.path}`, message: error.message })
      }
      return null
    }
    return parsed.data
  }).filter((record): record is Angelcare360MarkUpdateInput => Boolean(record))

  const data: Angelcare360BulkMarkUpdateInput = {
    schoolId: asString(input.schoolId, 'L’établissement est requis.', 'schoolId', errors),
    academicYearId: asString(input.academicYearId, 'L’année scolaire est requise.', 'academicYearId', errors),
    examId: asOptionalString(input.examId),
    assignmentId: asOptionalString(input.assignmentId),
    classId: asOptionalString(input.classId),
    sectionId: asOptionalString(input.sectionId),
    subjectId: asString(input.subjectId, 'La matière est requise.', 'subjectId', errors),
    assessmentType: asString(input.assessmentType, 'Le type d’évaluation est obligatoire.', 'assessmentType', errors),
    records,
  }

  if (records.length === 0) {
    errors.push({ path: 'records', message: 'Au moins une note doit être fournie.' })
  }

  return errors.length ? { success: false, errors } : { success: true, data }
})

export type Angelcare360AverageReadinessCheckInput = {
  schoolId: string
  academicYearId?: string | null
  termId?: string | null
  classId?: string | null
  sectionId?: string | null
  studentId?: string | null
  subjectId?: string | null
}

export const angelcare360AverageReadinessCheckSchema = createSchema<Angelcare360AverageReadinessCheckInput>('average_readiness_check', (input) => {
  const errors: Angelcare360ValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'Le contrôle de moyennes doit être un objet.' }] }
  const data: Angelcare360AverageReadinessCheckInput = {
    schoolId: asString(input.schoolId, 'L’établissement est requis.', 'schoolId', errors),
    academicYearId: asOptionalString(input.academicYearId),
    termId: asOptionalString(input.termId),
    classId: asOptionalString(input.classId),
    sectionId: asOptionalString(input.sectionId),
    studentId: asOptionalString(input.studentId),
    subjectId: asOptionalString(input.subjectId),
  }
  return errors.length ? { success: false, errors } : { success: true, data }
})

export type Angelcare360ReportCardDraftCreateInput = {
  schoolId: string
  academicYearId: string
  studentId: string
  classId: string
  sectionId?: string | null
  termId: string
  reportCardCode?: string | null
  generatedOn?: string | null
  status?: 'draft'
}

export const angelcare360ReportCardDraftCreateSchema = createSchema<Angelcare360ReportCardDraftCreateInput>('report_card_draft_create', (input) => {
  const errors: Angelcare360ValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'Le brouillon du bulletin doit être un objet.' }] }
  const data: Angelcare360ReportCardDraftCreateInput = {
    schoolId: asString(input.schoolId, 'L’établissement est requis.', 'schoolId', errors),
    academicYearId: asString(input.academicYearId, 'L’année scolaire est requise.', 'academicYearId', errors),
    studentId: asString(input.studentId, 'L’élève est requis.', 'studentId', errors),
    classId: asString(input.classId, 'La classe est requise.', 'classId', errors),
    sectionId: asOptionalString(input.sectionId),
    termId: asString(input.termId, 'La période est requise.', 'termId', errors),
    reportCardCode: asOptionalString(input.reportCardCode),
    generatedOn: asOptionalString(input.generatedOn),
    status: 'draft',
  }
  return errors.length ? { success: false, errors } : { success: true, data }
})

export type Angelcare360ReportCardStatusChangeInput = {
  schoolId: string
  id: string
  status: 'draft' | 'calculated' | 'reviewed' | 'approved' | 'published' | 'archived'
}

export const angelcare360ReportCardStatusChangeSchema = createSchema<Angelcare360ReportCardStatusChangeInput>('report_card_status_change', (input) => {
  const errors: Angelcare360ValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'Le changement de statut du bulletin doit être un objet.' }] }
  const data: Angelcare360ReportCardStatusChangeInput = {
    schoolId: asString(input.schoolId, 'L’établissement est requis.', 'schoolId', errors),
    id: asString(input.id, 'L’identifiant du bulletin est requis.', 'id', errors),
    status: asEnum(input.status, ['draft', 'calculated', 'reviewed', 'approved', 'published', 'archived'] as const, 'Le statut du bulletin est invalide.', 'status', errors),
  }
  return errors.length ? { success: false, errors } : { success: true, data }
})

export type Angelcare360TeacherCommentCreateInput = {
  schoolId: string
  academicYearId: string
  studentId: string
  classId: string
  sectionId?: string | null
  termId?: string | null
  staffId: string
  commentType: string
  commentText: string
  rating?: number | null
  status?: 'active' | 'archived'
}

export const angelcare360TeacherCommentCreateSchema = createSchema<Angelcare360TeacherCommentCreateInput>('teacher_comment_create', (input) => {
  const errors: Angelcare360ValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'Le commentaire enseignant doit être un objet.' }] }
  const rating = input.rating === null || input.rating === undefined ? null : asOptionalInteger(input.rating, 0)
  if (rating !== null && (rating < 0 || rating > 5)) {
    errors.push({ path: 'rating', message: 'La note d’appréciation doit être comprise entre 0 et 5.' })
  }
  const data: Angelcare360TeacherCommentCreateInput = {
    schoolId: asString(input.schoolId, 'L’établissement est requis.', 'schoolId', errors),
    academicYearId: asString(input.academicYearId, 'L’année scolaire est requise.', 'academicYearId', errors),
    studentId: asString(input.studentId, 'L’élève est requis.', 'studentId', errors),
    classId: asString(input.classId, 'La classe est requise.', 'classId', errors),
    sectionId: asOptionalString(input.sectionId),
    termId: asOptionalString(input.termId),
    staffId: asString(input.staffId, 'L’enseignant est requis.', 'staffId', errors),
    commentType: asString(input.commentType, 'Le type d’appréciation est obligatoire.', 'commentType', errors),
    commentText: asString(input.commentText, 'Le commentaire est obligatoire.', 'commentText', errors),
    rating,
    status: asEnum(input.status || 'active', ['active', 'archived'] as const, 'Le statut du commentaire est invalide.', 'status', errors),
  }
  return errors.length ? { success: false, errors } : { success: true, data }
})

export type Angelcare360TeacherCommentUpdateInput = Angelcare360TeacherCommentCreateInput & { id: string }

export const angelcare360TeacherCommentUpdateSchema = createSchema<Angelcare360TeacherCommentUpdateInput>('teacher_comment_update', (input) => {
  const errors: Angelcare360ValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'Le commentaire enseignant doit être un objet.' }] }
  const parsed = angelcare360TeacherCommentCreateSchema.safeParse(input)
  if (!parsed.success) return { success: false, errors: parsed.errors }
  const data: Angelcare360TeacherCommentUpdateInput = {
    ...parsed.data,
    id: asString(input.id, 'L’identifiant du commentaire est requis.', 'id', errors),
  }
  return errors.length ? { success: false, errors } : { success: true, data }
})

export type Angelcare360AcademicAuditQueryInput = {
  search?: string | null
  module?: string | null
  action?: string | null
  severity?: string | null
  entityType?: string | null
  entityId?: string | null
  actorRole?: string | null
  from?: string | null
  to?: string | null
}

export const angelcare360AcademicAuditQuerySchema = createSchema<Angelcare360AcademicAuditQueryInput>('academic_audit_query', (input) => {
  const errors: Angelcare360ValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'Le filtre d’audit académique doit être un objet.' }] }
  const data: Angelcare360AcademicAuditQueryInput = {
    search: asOptionalString(input.search),
    module: asOptionalString(input.module),
    action: asOptionalString(input.action),
    severity: asOptionalString(input.severity),
    entityType: asOptionalString(input.entityType),
    entityId: asOptionalString(input.entityId),
    actorRole: asOptionalString(input.actorRole),
    from: asOptionalString(input.from),
    to: asOptionalString(input.to),
  }
  if (data.from && data.to && !isValidDateOrder(data.from, data.to)) {
    errors.push({ path: 'to', message: 'La date de fin doit être postérieure à la date de début.' })
  }
  return errors.length ? { success: false, errors } : { success: true, data }
})

export const angelcare360AttendanceRecordSchema = angelcare360AttendanceRecordUpdateSchema
export const angelcare360TimetableSlotSchema = angelcare360TimetableSlotCreateSchema

export const angelcare360AssignmentSchema = buildSimpleSchema<Angelcare360AssignmentInput>('assignment', [
  ['schoolId', 'L’établissement est requis.', true],
  ['academicYearId', 'L’année scolaire est requise.', true],
  ['classId', 'La classe est requise.', true],
  ['subjectId', 'La matière est requise.', true],
  ['title', 'Le titre du devoir est obligatoire.', true],
])

export const angelcare360ExamSchema = buildSimpleSchema<Angelcare360ExamInput>('exam', [
  ['schoolId', 'L’établissement est requis.', true],
  ['academicYearId', 'L’année scolaire est requise.', true],
  ['classId', 'La classe est requise.', true],
  ['subjectId', 'La matière est requise.', true],
  ['title', 'Le titre de l’examen est obligatoire.', true],
  ['scheduledOn', 'La date de l’examen est obligatoire.', true],
])

export const angelcare360MarkSchema = buildSimpleSchema<Angelcare360MarkInput>('mark', [
  ['schoolId', 'L’établissement est requis.', true],
  ['studentId', 'L’élève est requis.', true],
  ['subjectId', 'La matière est requise.', true],
  ['assessmentType', 'Le type d’évaluation est obligatoire.', true],
])

export const angelcare360InvoiceSchema = buildSimpleSchema<Angelcare360InvoiceInput>('invoice', [
  ['schoolId', 'L’établissement est requis.', true],
  ['academicYearId', 'L’année scolaire est requise.', true],
  ['studentId', 'L’élève est requis.', true],
  ['invoiceNumber', 'Le numéro de facture est obligatoire.', true],
])

export const angelcare360PaymentSchema = buildSimpleSchema<Angelcare360PaymentInput>('payment', [
  ['schoolId', 'L’établissement est requis.', true],
  ['invoiceId', 'La facture est requise.', true],
  ['paymentNumber', 'Le numéro de paiement est obligatoire.', true],
  ['method', 'Le mode de paiement est obligatoire.', true],
])

export const angelcare360PayrollSchema = buildSimpleSchema<Angelcare360PayrollInput>('payroll_record', [
  ['schoolId', 'L’établissement est requis.', true],
  ['payrollPeriodId', 'La période de paie est requise.', true],
  ['staffId', 'Le membre du personnel est requis.', true],
  ['payrollNumber', 'Le numéro de paie est obligatoire.', true],
])

export type Angelcare360PayrollPeriodCreateInput = {
  schoolId: string
  academicYearId: string
  periodCode: string
  label: string
  startsOn: string
  endsOn: string
  paymentDate?: string | null
  status?: 'draft' | 'planned' | 'open' | 'calculated' | 'validated' | 'paid' | 'closed' | 'cancelled' | 'archived'
  idempotencyKey?: string | null
}
export type Angelcare360PayrollPeriodUpdateInput = Angelcare360PayrollPeriodCreateInput & { id: string; blockedReason?: string | null }
export type Angelcare360PayrollPeriodStatusChangeInput = { schoolId: string; id: string; status: 'draft' | 'planned' | 'open' | 'calculated' | 'validated' | 'paid' | 'closed' | 'cancelled' | 'archived'; reason?: string | null }
export type Angelcare360PayrollRecordPrepareInput = {
  schoolId: string
  payrollPeriodId: string
  staffId: string
  payrollNumber?: string | null
  baseSalary?: number | null
  status?: 'draft' | 'pending_review' | 'validated' | 'payment_pending' | 'paid' | 'blocked' | 'cancelled' | 'approved' | 'archived'
  paymentStatus?: 'not_ready' | 'pending' | 'confirmed' | 'blocked' | 'cancelled' | 'partial' | 'paid' | 'failed'
  idempotencyKey?: string | null
}
export type Angelcare360PayrollRecordUpdateInput = {
  schoolId: string
  id: string
  payrollNumber?: string | null
  baseSalary?: number | null
  grossAmount?: number | null
  deductionsTotal?: number | null
  bonusesTotal?: number | null
  netAmount?: number | null
  paymentStatus?: 'not_ready' | 'pending' | 'confirmed' | 'blocked' | 'cancelled' | 'partial' | 'paid' | 'failed'
  status?: 'draft' | 'pending_review' | 'validated' | 'payment_pending' | 'paid' | 'blocked' | 'cancelled' | 'approved' | 'archived'
  blockedReason?: string | null
  idempotencyKey?: string | null
}
export type Angelcare360PayrollRecordValidateInput = { schoolId: string; id: string; reason?: string | null }
export type Angelcare360PayrollRecordBlockInput = { schoolId: string; id: string; reason: string }
export type Angelcare360PayrollRecordPaymentStatusInput = {
  schoolId: string
  id: string
  status: 'not_ready' | 'pending' | 'confirmed' | 'blocked' | 'cancelled' | 'partial' | 'paid' | 'failed'
  paymentDate?: string | null
  paymentMethod?: string | null
  paymentReference?: string | null
  reason?: string | null
}
export type Angelcare360PayrollItemCreateInput = {
  schoolId: string
  payrollRecordId: string
  itemCode?: string | null
  itemType: 'base_salary' | 'bonus' | 'deduction' | 'advance' | 'adjustment' | 'reimbursement' | 'other' | 'earning' | 'allowance'
  label: string
  amount: number
  notes?: string | null
  status?: 'active' | 'archived'
  idempotencyKey?: string | null
}
export type Angelcare360PayrollItemUpdateInput = Angelcare360PayrollItemCreateInput & { id: string }
export type Angelcare360PayrollItemCancelInput = { schoolId: string; id: string; reason: string }
export type Angelcare360PayrollHistoryFiltersInput = {
  schoolId?: string | null
  staffId?: string | null
  payrollPeriodId?: string | null
  status?: string | null
  search?: string | null
  from?: string | null
  to?: string | null
}
export type Angelcare360PayrollComplianceReadinessInput = {
  schoolId?: string | null
  payrollPeriodId?: string | null
  staffId?: string | null
}
export type Angelcare360PayrollAuditQueryFiltersInput = {
  schoolId?: string | null
  module?: string | null
  action?: string | null
  severity?: string | null
  entityType?: string | null
  entityId?: string | null
  actorUserId?: string | null
  search?: string | null
  from?: string | null
  to?: string | null
}

export const angelcare360PayrollPeriodCreateSchema = createSchema<Angelcare360PayrollPeriodCreateInput>('payroll_period_create', (input) => {
  const errors: Angelcare360ValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'La période de paie doit être un objet.' }] }
  const startsOn = asDateString(input.startsOn, 'La date de début est obligatoire.', 'startsOn', errors)
  const endsOn = asDateString(input.endsOn, 'La date de fin est obligatoire.', 'endsOn', errors)
  if (startsOn && endsOn && new Date(startsOn).getTime() > new Date(endsOn).getTime()) {
    errors.push({ path: 'endsOn', message: 'La date de fin doit être postérieure à la date de début.' })
  }
  const data: Angelcare360PayrollPeriodCreateInput = {
    schoolId: asString(input.schoolId, 'L’établissement est requis.', 'schoolId', errors),
    academicYearId: asString(input.academicYearId, 'L’année scolaire est requise.', 'academicYearId', errors),
    periodCode: asString(input.periodCode, 'Le code de la période de paie est obligatoire.', 'periodCode', errors),
    label: asString(input.label, 'Le libellé de la période de paie est obligatoire.', 'label', errors),
    startsOn,
    endsOn,
    paymentDate: asOptionalString(input.paymentDate),
    status: asEnum(input.status || 'planned', ['draft', 'planned', 'open', 'calculated', 'validated', 'paid', 'closed', 'cancelled', 'archived'] as const, 'Le statut de la période de paie est invalide.', 'status', errors),
    idempotencyKey: asOptionalString(input.idempotencyKey),
  }
  return errors.length ? { success: false, errors } : { success: true, data }
})

export const angelcare360PayrollPeriodUpdateSchema = createSchema<Angelcare360PayrollPeriodUpdateInput>('payroll_period_update', (input) => {
  const errors: Angelcare360ValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'La mise à jour de période de paie doit être un objet.' }] }
  const data = angelcare360PayrollPeriodCreateSchema.safeParse(input)
  if (!data.success) return data
  if (!isNonEmptyString((input as Record<string, unknown>).id)) {
    return { success: false, errors: [{ path: 'id', message: 'L’identifiant de la période de paie est requis.' }] }
  }
  return { success: true, data: { ...data.data, id: String((input as Record<string, unknown>).id).trim(), blockedReason: asOptionalString(input.blockedReason) } }
})

export const angelcare360PayrollPeriodStatusChangeSchema = createSchema<Angelcare360PayrollPeriodStatusChangeInput>('payroll_period_status_change', (input) => {
  const errors: Angelcare360ValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'Le changement de statut de période de paie doit être un objet.' }] }
  const data: Angelcare360PayrollPeriodStatusChangeInput = {
    schoolId: asString(input.schoolId, 'L’établissement est requis.', 'schoolId', errors),
    id: asString(input.id, 'La période de paie est requise.', 'id', errors),
    status: asEnum(input.status, ['draft', 'planned', 'open', 'calculated', 'validated', 'paid', 'closed', 'cancelled', 'archived'] as const, 'Le statut de la période de paie est invalide.', 'status', errors),
    reason: asOptionalString(input.reason),
  }
  if (data.status === 'cancelled' && !data.reason) {
    errors.push({ path: 'reason', message: 'Le motif d’annulation est obligatoire.' })
  }
  return errors.length ? { success: false, errors } : { success: true, data }
})

function validatePayrollItemAmount(itemType: Angelcare360PayrollItemCreateInput['itemType'], amount: number, errors: Angelcare360ValidationIssue[]) {
  if (!Number.isFinite(amount)) {
    errors.push({ path: 'amount', message: 'Le montant de l’élément de paie est invalide.' })
    return
  }
  if (itemType === 'adjustment') {
    if (amount === 0) {
      errors.push({ path: 'amount', message: 'L’ajustement ne peut pas être nul.' })
    }
    return
  }
  if (amount < 0) {
    errors.push({ path: 'amount', message: 'Le montant de l’élément de paie doit être positif.' })
  }
}

export const angelcare360PayrollRecordPrepareSchema = createSchema<Angelcare360PayrollRecordPrepareInput>('payroll_record_prepare', (input) => {
  const errors: Angelcare360ValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'Le dossier de paie doit être un objet.' }] }
  const amount = asOptionalNumber(input.baseSalary, Number.NaN)
  if (input.baseSalary !== undefined && !Number.isFinite(amount)) {
    errors.push({ path: 'baseSalary', message: 'Le salaire de base est invalide.' })
  }
  const data: Angelcare360PayrollRecordPrepareInput = {
    schoolId: asString(input.schoolId, 'L’établissement est requis.', 'schoolId', errors),
    payrollPeriodId: asString(input.payrollPeriodId, 'La période de paie est requise.', 'payrollPeriodId', errors),
    staffId: asString(input.staffId, 'Le membre du personnel est requis.', 'staffId', errors),
    payrollNumber: asOptionalString(input.payrollNumber),
    baseSalary: Number.isFinite(amount) ? amount : null,
    status: asEnum(input.status || 'draft', ['draft', 'pending_review', 'validated', 'payment_pending', 'paid', 'blocked', 'cancelled', 'approved', 'archived'] as const, 'Le statut du dossier de paie est invalide.', 'status', errors),
    paymentStatus: asEnum(input.paymentStatus || 'not_ready', ['not_ready', 'pending', 'confirmed', 'blocked', 'cancelled', 'partial', 'paid', 'failed'] as const, 'Le statut de paiement est invalide.', 'paymentStatus', errors),
    idempotencyKey: asOptionalString(input.idempotencyKey),
  }
  return errors.length ? { success: false, errors } : { success: true, data }
})

export const angelcare360PayrollRecordUpdateSchema = createSchema<Angelcare360PayrollRecordUpdateInput>('payroll_record_update', (input) => {
  const errors: Angelcare360ValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'La mise à jour du dossier de paie doit être un objet.' }] }
  const amount = asOptionalNumber(input.baseSalary, Number.NaN)
  const grossAmount = asOptionalNumber(input.grossAmount, Number.NaN)
  const deductionsTotal = asOptionalNumber(input.deductionsTotal, Number.NaN)
  const bonusesTotal = asOptionalNumber(input.bonusesTotal, Number.NaN)
  const netAmount = asOptionalNumber(input.netAmount, Number.NaN)
  const data: Angelcare360PayrollRecordUpdateInput = {
    schoolId: asString(input.schoolId, 'L’établissement est requis.', 'schoolId', errors),
    id: asString(input.id, 'Le dossier de paie est requis.', 'id', errors),
    payrollNumber: asOptionalString(input.payrollNumber),
    baseSalary: Number.isFinite(amount) ? amount : null,
    grossAmount: Number.isFinite(grossAmount) ? grossAmount : null,
    deductionsTotal: Number.isFinite(deductionsTotal) ? deductionsTotal : null,
    bonusesTotal: Number.isFinite(bonusesTotal) ? bonusesTotal : null,
    netAmount: Number.isFinite(netAmount) ? netAmount : null,
    paymentStatus: input.paymentStatus ? asEnum(input.paymentStatus, ['not_ready', 'pending', 'confirmed', 'blocked', 'cancelled', 'partial', 'paid', 'failed'] as const, 'Le statut de paiement est invalide.', 'paymentStatus', errors) : undefined,
    status: input.status ? asEnum(input.status, ['draft', 'pending_review', 'validated', 'payment_pending', 'paid', 'blocked', 'cancelled', 'approved', 'archived'] as const, 'Le statut du dossier de paie est invalide.', 'status', errors) : undefined,
    blockedReason: asOptionalString(input.blockedReason),
    idempotencyKey: asOptionalString(input.idempotencyKey),
  }
  return errors.length ? { success: false, errors } : { success: true, data }
})

export const angelcare360PayrollRecordValidateSchema = createSchema<Angelcare360PayrollRecordValidateInput>('payroll_record_validate', (input) => {
  const errors: Angelcare360ValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'La validation du dossier de paie doit être un objet.' }] }
  const data: Angelcare360PayrollRecordValidateInput = {
    schoolId: asString(input.schoolId, 'L’établissement est requis.', 'schoolId', errors),
    id: asString(input.id, 'Le dossier de paie est requis.', 'id', errors),
    reason: asOptionalString(input.reason),
  }
  return errors.length ? { success: false, errors } : { success: true, data }
})

export const angelcare360PayrollRecordBlockSchema = createSchema<Angelcare360PayrollRecordBlockInput>('payroll_record_block', (input) => {
  const errors: Angelcare360ValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'Le blocage du dossier de paie doit être un objet.' }] }
  const data: Angelcare360PayrollRecordBlockInput = {
    schoolId: asString(input.schoolId, 'L’établissement est requis.', 'schoolId', errors),
    id: asString(input.id, 'Le dossier de paie est requis.', 'id', errors),
    reason: asString(input.reason, 'Le motif de blocage est obligatoire.', 'reason', errors),
  }
  return errors.length ? { success: false, errors } : { success: true, data }
})

export const angelcare360PayrollRecordPaymentStatusSchema = createSchema<Angelcare360PayrollRecordPaymentStatusInput>('payroll_record_payment_status', (input) => {
  const errors: Angelcare360ValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'Le statut de paiement de la paie doit être un objet.' }] }
  const status = asEnum(input.status, ['not_ready', 'pending', 'confirmed', 'blocked', 'cancelled', 'partial', 'paid', 'failed'] as const, 'Le statut de paiement est invalide.', 'status', errors)
  const paymentDate = asOptionalString(input.paymentDate)
  const paymentMethod = asOptionalString(input.paymentMethod)
  const paymentReference = asOptionalString(input.paymentReference)
  if ((status === 'confirmed' || status === 'paid') && !paymentDate) {
    errors.push({ path: 'paymentDate', message: 'La date de paiement est obligatoire lorsque la paie est confirmée.' })
  }
  if ((status === 'confirmed' || status === 'paid') && !paymentMethod) {
    errors.push({ path: 'paymentMethod', message: 'Le mode de paiement est obligatoire lorsque la paie est confirmée.' })
  }
  const data: Angelcare360PayrollRecordPaymentStatusInput = {
    schoolId: asString(input.schoolId, 'L’établissement est requis.', 'schoolId', errors),
    id: asString(input.id, 'Le dossier de paie est requis.', 'id', errors),
    status,
    paymentDate,
    paymentMethod,
    paymentReference,
    reason: asOptionalString(input.reason),
  }
  if (status === 'blocked' && !data.reason) {
    errors.push({ path: 'reason', message: 'Le motif de blocage est obligatoire.' })
  }
  return errors.length ? { success: false, errors } : { success: true, data }
})

export const angelcare360PayrollItemCreateSchema = createSchema<Angelcare360PayrollItemCreateInput>('payroll_item_create', (input) => {
  const errors: Angelcare360ValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'L’élément de paie doit être un objet.' }] }
  const amount = asOptionalNumber(input.amount, Number.NaN)
  if (!Number.isFinite(amount)) errors.push({ path: 'amount', message: 'Le montant de l’élément de paie est invalide.' })
  const itemType = asEnum(input.itemType, ['base_salary', 'bonus', 'deduction', 'advance', 'adjustment', 'reimbursement', 'other', 'earning', 'allowance'] as const, 'Le type d’élément de paie est invalide.', 'itemType', errors)
  validatePayrollItemAmount(itemType, amount, errors)
  const data: Angelcare360PayrollItemCreateInput = {
    schoolId: asString(input.schoolId, 'L’établissement est requis.', 'schoolId', errors),
    payrollRecordId: asString(input.payrollRecordId, 'Le dossier de paie est requis.', 'payrollRecordId', errors),
    itemCode: asOptionalString(input.itemCode),
    itemType,
    label: asString(input.label, 'Le libellé de l’élément de paie est obligatoire.', 'label', errors),
    amount,
    notes: asOptionalString(input.notes),
    status: asEnum(input.status || 'active', ['active', 'archived'] as const, 'Le statut de l’élément de paie est invalide.', 'status', errors),
    idempotencyKey: asOptionalString(input.idempotencyKey),
  }
  return errors.length ? { success: false, errors } : { success: true, data }
})

export const angelcare360PayrollItemUpdateSchema = createSchema<Angelcare360PayrollItemUpdateInput>('payroll_item_update', (input) => {
  const errors: Angelcare360ValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'La mise à jour d’un élément de paie doit être un objet.' }] }
  const create = angelcare360PayrollItemCreateSchema.safeParse(input)
  if (!create.success) return create
  if (!isNonEmptyString((input as Record<string, unknown>).id)) {
    return { success: false, errors: [{ path: 'id', message: 'L’identifiant de l’élément de paie est requis.' }] }
  }
  return { success: true, data: { ...create.data, id: String((input as Record<string, unknown>).id).trim() } }
})

export const angelcare360PayrollItemCancelSchema = createSchema<Angelcare360PayrollItemCancelInput>('payroll_item_cancel', (input) => {
  const errors: Angelcare360ValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'L’annulation d’un élément de paie doit être un objet.' }] }
  const data: Angelcare360PayrollItemCancelInput = {
    schoolId: asString(input.schoolId, 'L’établissement est requis.', 'schoolId', errors),
    id: asString(input.id, 'L’élément de paie est requis.', 'id', errors),
    reason: asString(input.reason, 'Le motif d’annulation est obligatoire.', 'reason', errors),
  }
  return errors.length ? { success: false, errors } : { success: true, data }
})

export const angelcare360PayrollHistoryFiltersSchema = createSchema<Angelcare360PayrollHistoryFiltersInput>('payroll_history_filters', (input) => {
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'Les filtres d’historique paie doivent être un objet.' }] }
  return {
    success: true,
    data: {
      schoolId: asOptionalString(input.schoolId),
      staffId: asOptionalString(input.staffId),
      payrollPeriodId: asOptionalString(input.payrollPeriodId),
      status: asOptionalString(input.status),
      search: asOptionalString(input.search),
      from: asOptionalString(input.from),
      to: asOptionalString(input.to),
    },
  }
})

export const angelcare360PayrollComplianceReadinessSchema = createSchema<Angelcare360PayrollComplianceReadinessInput>('payroll_compliance_readiness', (input) => {
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'La vérification de conformité paie doit être un objet.' }] }
  return {
    success: true,
    data: {
      schoolId: asOptionalString(input.schoolId),
      payrollPeriodId: asOptionalString(input.payrollPeriodId),
      staffId: asOptionalString(input.staffId),
    },
  }
})

export const angelcare360PayrollAuditQueryFiltersSchema = createSchema<Angelcare360PayrollAuditQueryFiltersInput>('payroll_audit_filters', (input) => {
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'Les filtres d’audit paie doivent être un objet.' }] }
  return {
    success: true,
    data: {
      schoolId: asOptionalString(input.schoolId),
      module: asOptionalString(input.module),
      action: asOptionalString(input.action),
      severity: asOptionalString(input.severity),
      entityType: asOptionalString(input.entityType),
      entityId: asOptionalString(input.entityId),
      actorUserId: asOptionalString(input.actorUserId),
      search: asOptionalString(input.search),
      from: asOptionalString(input.from),
      to: asOptionalString(input.to),
    },
  }
})

type TransportRouteStatus = Angelcare360TransportRouteStatus
type TransportStopStatus = Angelcare360TransportStopStatus
type TransportVehicleStatus = Angelcare360TransportVehicleStatus
type TransportAssignmentStatus = Angelcare360TransportAssignmentStatus

const TRANSPORT_ROUTE_STATUSES: TransportRouteStatus[] = ['draft', 'active', 'inactive', 'suspended', 'archived']
const TRANSPORT_STOP_STATUSES: TransportStopStatus[] = ['active', 'inactive', 'suspended', 'archived']
const TRANSPORT_VEHICLE_STATUSES: TransportVehicleStatus[] = ['active', 'inactive', 'maintenance', 'unavailable', 'archived']
const TRANSPORT_ASSIGNMENT_STATUSES: TransportAssignmentStatus[] = ['active', 'inactive', 'pending', 'suspended', 'cancelled', 'archived']

export type Angelcare360TransportRouteInput = {
  schoolId: string
  routeCode: string
  label: string
  routeType?: string | null
  responsibleStaffId?: string | null
  assistantStaffId?: string | null
  vehicleId?: string | null
  capacitySeats: number | null
  status: TransportRouteStatus
}

export type Angelcare360TransportRouteUpdateInput = Angelcare360TransportRouteInput & { id: string }
export type Angelcare360TransportRouteStatusChangeInput = { schoolId: string; id: string; status: TransportRouteStatus; reason?: string | null }

export type Angelcare360TransportStopInput = {
  schoolId: string
  routeId: string
  stopCode: string
  label: string
  orderIndex: number
  latitude?: number | null
  longitude?: number | null
  plannedTime?: string | null
  status: TransportStopStatus
}

export type Angelcare360TransportStopUpdateInput = Angelcare360TransportStopInput & { id: string }

export type Angelcare360TransportVehicleInput = {
  schoolId: string
  vehicleCode: string
  plateNumber: string
  model?: string | null
  capacitySeats: number
  assignedDriverStaffId?: string | null
  insuranceExpiresOn?: string | null
  status: TransportVehicleStatus
}

export type Angelcare360TransportVehicleUpdateInput = Angelcare360TransportVehicleInput & { id: string }
export type Angelcare360TransportVehicleStatusChangeInput = { schoolId: string; id: string; status: TransportVehicleStatus; reason?: string | null }

export type Angelcare360TransportAssignmentInput = {
  schoolId: string
  academicYearId: string
  routeId: string
  studentId: string
  vehicleId?: string | null
  pickupStopId?: string | null
  dropoffStopId?: string | null
  assignedOn?: string | null
  status: TransportAssignmentStatus
}

export type Angelcare360TransportAssignmentUpdateInput = Angelcare360TransportAssignmentInput & { id: string }
export type Angelcare360TransportAssignmentCancelInput = { schoolId: string; id: string; reason: string }
export type Angelcare360TransportAuditQueryFiltersInput = Angelcare360TransportAuditFilter

function parseNullableNumber(value: unknown, path: string, message: string, errors: Angelcare360ValidationIssue[]) {
  if (value === undefined || value === null || value === '') return null
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) {
    errors.push({ path, message })
    return null
  }
  return parsed
}

function parseNullableInteger(value: unknown, path: string, message: string, errors: Angelcare360ValidationIssue[]) {
  const parsed = parseNullableNumber(value, path, message, errors)
  return parsed === null ? null : Math.trunc(parsed)
}

function parseNullableDate(value: unknown, path: string, message: string, errors: Angelcare360ValidationIssue[]) {
  if (value === undefined || value === null || value === '') return null
  if (typeof value !== 'string') {
    errors.push({ path, message })
    return null
  }
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    errors.push({ path, message })
    return null
  }
  return value.trim()
}

function parseNullableTime(value: unknown, path: string, message: string, errors: Angelcare360ValidationIssue[]) {
  if (value === undefined || value === null || value === '') return null
  if (typeof value !== 'string') {
    errors.push({ path, message })
    return null
  }
  const normalized = value.trim()
  if (!/^\d{2}:\d{2}(:\d{2})?$/.test(normalized)) {
    errors.push({ path, message })
    return null
  }
  return normalized.length === 5 ? `${normalized}:00` : normalized
}

export const angelcare360TransportRouteSchema = createSchema<Angelcare360TransportRouteInput>('transport_route', (input) => {
  const errors: Angelcare360ValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'Le payload de circuit doit être un objet.' }] }

  const data: Angelcare360TransportRouteInput = {
    schoolId: asString(input.schoolId, 'L’établissement est requis.', 'schoolId', errors),
    routeCode: asString(input.routeCode, 'Le code du circuit est obligatoire.', 'routeCode', errors),
    label: asString(input.label, 'Le libellé du circuit est obligatoire.', 'label', errors),
    routeType: asOptionalString(input.routeType),
    responsibleStaffId: asOptionalString(input.responsibleStaffId),
    assistantStaffId: asOptionalString(input.assistantStaffId),
    vehicleId: asOptionalString(input.vehicleId),
    capacitySeats: parseNullableInteger(input.capacitySeats, 'capacitySeats', 'La capacité du circuit doit être un nombre entier valide.', errors),
    status: asEnum(input.status, TRANSPORT_ROUTE_STATUSES, 'Le statut du circuit est invalide.', 'status', errors),
  }

  if (data.capacitySeats !== null && data.capacitySeats < 0) {
    errors.push({ path: 'capacitySeats', message: 'La capacité du circuit ne peut pas être négative.' })
  }

  return errors.length ? { success: false, errors } : { success: true, data }
})

export const angelcare360TransportRouteUpdateSchema = createSchema<Angelcare360TransportRouteUpdateInput>('transport_route_update', (input) => {
  const base = angelcare360TransportRouteSchema.safeParse(input)
  const errors: Angelcare360ValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'Le payload de circuit doit être un objet.' }] }
  const data = base.success ? { ...base.data, id: asString(input.id, 'L’identifiant du circuit est requis.', 'id', errors) } : null
  return !data || errors.length ? { success: false, errors: [...(base.success ? [] : base.errors), ...errors] } : { success: true, data }
})

export const angelcare360TransportRouteStatusChangeSchema = createSchema<Angelcare360TransportRouteStatusChangeInput>('transport_route_status_change', (input) => {
  const errors: Angelcare360ValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'Le changement de statut du circuit doit être un objet.' }] }
  const data: Angelcare360TransportRouteStatusChangeInput = {
    schoolId: asString(input.schoolId, 'L’établissement est requis.', 'schoolId', errors),
    id: asString(input.id, 'L’identifiant du circuit est requis.', 'id', errors),
    status: asEnum(input.status, TRANSPORT_ROUTE_STATUSES, 'Le statut du circuit est invalide.', 'status', errors),
    reason: asOptionalString(input.reason),
  }
  if (data.status === 'suspended' && !data.reason) {
    errors.push({ path: 'reason', message: 'Un motif est requis pour suspendre un circuit.' })
  }
  return errors.length ? { success: false, errors } : { success: true, data }
})

export const angelcare360TransportStopCreateSchema = createSchema<Angelcare360TransportStopInput>('transport_stop_create', (input) => {
  const errors: Angelcare360ValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'Le payload de stop doit être un objet.' }] }
  const data: Angelcare360TransportStopInput = {
    schoolId: asString(input.schoolId, 'L’établissement est requis.', 'schoolId', errors),
    routeId: asString(input.routeId, 'Le circuit est requis.', 'routeId', errors),
    stopCode: asString(input.stopCode, 'Le code de l’arrêt est obligatoire.', 'stopCode', errors),
    label: asString(input.label, 'Le libellé de l’arrêt est obligatoire.', 'label', errors),
    orderIndex: parseNullableInteger(input.orderIndex, 'orderIndex', 'L’ordre de l’arrêt doit être un entier valide.', errors) ?? 0,
    latitude: parseNullableNumber(input.latitude, 'latitude', 'La latitude est invalide.', errors),
    longitude: parseNullableNumber(input.longitude, 'longitude', 'La longitude est invalide.', errors),
    plannedTime: parseNullableTime(input.plannedTime, 'plannedTime', 'L’heure prévue est invalide.', errors),
    status: asEnum(input.status, TRANSPORT_STOP_STATUSES, 'Le statut de l’arrêt est invalide.', 'status', errors),
  }
  if (data.orderIndex < 1) {
    errors.push({ path: 'orderIndex', message: 'L’ordre de l’arrêt doit être supérieur à zéro.' })
  }
  return errors.length ? { success: false, errors } : { success: true, data }
})

export const angelcare360TransportStopUpdateSchema = createSchema<Angelcare360TransportStopUpdateInput>('transport_stop_update', (input) => {
  const base = angelcare360TransportStopCreateSchema.safeParse(input)
  const errors: Angelcare360ValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'Le payload de stop doit être un objet.' }] }
  const data = base.success ? { ...base.data, id: asString(input.id, 'L’identifiant de l’arrêt est requis.', 'id', errors) } : null
  return !data || errors.length ? { success: false, errors: [...(base.success ? [] : base.errors), ...errors] } : { success: true, data }
})

export const angelcare360TransportVehicleCreateSchema = createSchema<Angelcare360TransportVehicleInput>('transport_vehicle_create', (input) => {
  const errors: Angelcare360ValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'Le payload de véhicule doit être un objet.' }] }
  const data: Angelcare360TransportVehicleInput = {
    schoolId: asString(input.schoolId, 'L’établissement est requis.', 'schoolId', errors),
    vehicleCode: asString(input.vehicleCode, 'Le code du véhicule est obligatoire.', 'vehicleCode', errors),
    plateNumber: asString(input.plateNumber, 'La plaque du véhicule est obligatoire.', 'plateNumber', errors),
    model: asOptionalString(input.model),
    capacitySeats: parseNullableInteger(input.capacitySeats, 'capacitySeats', 'La capacité du véhicule est invalide.', errors) ?? 0,
    assignedDriverStaffId: asOptionalString(input.assignedDriverStaffId),
    insuranceExpiresOn: parseNullableDate(input.insuranceExpiresOn, 'insuranceExpiresOn', 'La date d’assurance est invalide.', errors),
    status: asEnum(input.status, TRANSPORT_VEHICLE_STATUSES, 'Le statut du véhicule est invalide.', 'status', errors),
  }
  if (data.capacitySeats < 1) {
    errors.push({ path: 'capacitySeats', message: 'La capacité du véhicule doit être supérieure à zéro.' })
  }
  return errors.length ? { success: false, errors } : { success: true, data }
})

export const angelcare360TransportVehicleUpdateSchema = createSchema<Angelcare360TransportVehicleUpdateInput>('transport_vehicle_update', (input) => {
  const base = angelcare360TransportVehicleCreateSchema.safeParse(input)
  const errors: Angelcare360ValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'Le payload de véhicule doit être un objet.' }] }
  const data = base.success ? { ...base.data, id: asString(input.id, 'L’identifiant du véhicule est requis.', 'id', errors) } : null
  return !data || errors.length ? { success: false, errors: [...(base.success ? [] : base.errors), ...errors] } : { success: true, data }
})

export const angelcare360TransportVehicleStatusChangeSchema = createSchema<Angelcare360TransportVehicleStatusChangeInput>('transport_vehicle_status_change', (input) => {
  const errors: Angelcare360ValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'Le changement de statut du véhicule doit être un objet.' }] }
  const data: Angelcare360TransportVehicleStatusChangeInput = {
    schoolId: asString(input.schoolId, 'L’établissement est requis.', 'schoolId', errors),
    id: asString(input.id, 'L’identifiant du véhicule est requis.', 'id', errors),
    status: asEnum(input.status, TRANSPORT_VEHICLE_STATUSES, 'Le statut du véhicule est invalide.', 'status', errors),
    reason: asOptionalString(input.reason),
  }
  if (data.status === 'maintenance' || data.status === 'unavailable') {
    if (!data.reason) errors.push({ path: 'reason', message: 'Un motif est requis pour basculer le véhicule dans cet état.' })
  }
  return errors.length ? { success: false, errors } : { success: true, data }
})

export const angelcare360TransportAssignmentCreateSchema = createSchema<Angelcare360TransportAssignmentInput>('transport_assignment_create', (input) => {
  const errors: Angelcare360ValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'Le payload d’affectation doit être un objet.' }] }
  const data: Angelcare360TransportAssignmentInput = {
    schoolId: asString(input.schoolId, 'L’établissement est requis.', 'schoolId', errors),
    academicYearId: asString(input.academicYearId, 'L’année scolaire est requise.', 'academicYearId', errors),
    routeId: asString(input.routeId, 'Le circuit est requis.', 'routeId', errors),
    studentId: asString(input.studentId, 'L’élève est requis.', 'studentId', errors),
    vehicleId: asOptionalString(input.vehicleId),
    pickupStopId: asOptionalString(input.pickupStopId),
    dropoffStopId: asOptionalString(input.dropoffStopId),
    assignedOn: parseNullableDate(input.assignedOn, 'assignedOn', 'La date d’affectation est invalide.', errors) || undefined,
    status: asEnum(input.status, TRANSPORT_ASSIGNMENT_STATUSES, 'Le statut d’affectation est invalide.', 'status', errors),
  }
  return errors.length ? { success: false, errors } : { success: true, data }
})

export const angelcare360TransportAssignmentUpdateSchema = createSchema<Angelcare360TransportAssignmentUpdateInput>('transport_assignment_update', (input) => {
  const base = angelcare360TransportAssignmentCreateSchema.safeParse(input)
  const errors: Angelcare360ValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'Le payload d’affectation doit être un objet.' }] }
  const data = base.success ? { ...base.data, id: asString(input.id, 'L’identifiant de l’affectation est requis.', 'id', errors) } : null
  return !data || errors.length ? { success: false, errors: [...(base.success ? [] : base.errors), ...errors] } : { success: true, data }
})

export const angelcare360TransportAssignmentCancelSchema = createSchema<Angelcare360TransportAssignmentCancelInput>('transport_assignment_cancel', (input) => {
  const errors: Angelcare360ValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'L’annulation d’affectation doit être un objet.' }] }
  const data: Angelcare360TransportAssignmentCancelInput = {
    schoolId: asString(input.schoolId, 'L’établissement est requis.', 'schoolId', errors),
    id: asString(input.id, 'L’identifiant de l’affectation est requis.', 'id', errors),
    reason: asString(input.reason, 'Le motif d’annulation est obligatoire.', 'reason', errors),
  }
  return errors.length ? { success: false, errors } : { success: true, data }
})

export const angelcare360TransportAuditQueryFiltersSchema = createSchema<Angelcare360TransportAuditQueryFiltersInput>('transport_audit_filters', (input) => {
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'Les filtres d’audit transport doivent être un objet.' }] }
  return {
    success: true,
    data: {
      schoolId: asOptionalString(input.schoolId),
      module: asOptionalString(input.module),
      action: asOptionalString(input.action),
      severity: asOptionalString(input.severity),
      entityType: asOptionalString(input.entityType),
      entityId: asOptionalString(input.entityId),
      actorUserId: asOptionalString(input.actorUserId),
      status: asOptionalString(input.status),
      search: asOptionalString(input.search),
      from: asOptionalString(input.from),
      to: asOptionalString(input.to),
    },
  }
})

export const angelcare360LibraryBookSchema = buildSimpleSchema<Angelcare360LibraryBookInput>('library_book', [
  ['schoolId', 'L’établissement est requis.', true],
  ['bookCode', 'Le code du livre est obligatoire.', true],
  ['title', 'Le titre du livre est obligatoire.', true],
])

export const angelcare360InventoryItemSchema = buildSimpleSchema<Angelcare360InventoryItemInput>('inventory_item', [
  ['schoolId', 'L’établissement est requis.', true],
  ['categoryId', 'La catégorie est requise.', true],
  ['itemCode', 'Le code article est obligatoire.', true],
  ['label', 'Le libellé de l’article est obligatoire.', true],
])

export const angelcare360MessageSchema = buildSimpleSchema<Angelcare360MessageInput>('message', [
  ['schoolId', 'L’établissement est requis.', true],
  ['messageCode', 'Le code du message est obligatoire.', true],
  ['subject', 'Le sujet est obligatoire.', true],
  ['body', 'Le corps du message est obligatoire.', true],
])

export const angelcare360NotificationSchema = buildSimpleSchema<Angelcare360NotificationInput>('notification', [
  ['schoolId', 'L’établissement est requis.', true],
  ['notificationCode', 'Le code de notification est obligatoire.', true],
  ['title', 'Le titre de la notification est obligatoire.', true],
  ['body', 'Le contenu de la notification est obligatoire.', true],
])

export const angelcare360AuditEventSchema = createSchema<Angelcare360AuditEventInput>('audit_event', (input) => {
  const errors: Angelcare360ValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'Le payload d’audit doit être un objet.' }] }
  const module = asString(input.module, 'Le module d’audit est obligatoire.', 'module', errors)
  const action = asString(input.action, 'L’action d’audit est obligatoire.', 'action', errors)
  const severity = asEnum(input.severity || 'info', ['debug', 'info', 'notice', 'warning', 'critical'] as const, 'La gravité d’audit est invalide.', 'severity', errors)
  const data: Angelcare360AuditEventInput = {
    category: typeof input.category === 'string' ? input.category as Angelcare360AuditEventInput['category'] : undefined,
    module,
    action,
    schoolId: asOptionalString(input.schoolId),
    actorUserId: asOptionalString(input.actorUserId),
    actorRole: asOptionalString(input.actorRole),
    entityType: asOptionalString(input.entityType),
    entityId: asOptionalString(input.entityId),
    severity,
    route: asOptionalString(input.route),
    requestId: asOptionalString(input.requestId),
    ipAddress: asOptionalString(input.ipAddress),
    userAgent: asOptionalString(input.userAgent),
    beforeData: isRecord(input.beforeData) ? input.beforeData : undefined,
    afterData: isRecord(input.afterData) ? input.afterData : undefined,
    metadata: isRecord(input.metadata) ? input.metadata : undefined,
  }
  return errors.length ? { success: false, errors } : { success: true, data }
})

export type Angelcare360SchoolAdminInput = {
  id?: string | null
  schoolCode: string
  name: string
  schoolType: string
  city?: string | null
  country?: string | null
  address?: string | null
  phone?: string | null
  email?: string | null
  contactPrincipal?: string | null
  currency?: string | null
  language?: string | null
  timezone?: string | null
  status: 'active' | 'inactive' | 'suspended' | 'archived'
  targetCapacity?: number | null
  notes?: string | null
}

export const angelcare360SchoolAdminSchema = createSchema<Angelcare360SchoolAdminInput>('school_admin', (input) => {
  const errors: Angelcare360ValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'Le payload établissement doit être un objet.' }] }
  const data: Angelcare360SchoolAdminInput = {
    id: asOptionalString(input.id),
    schoolCode: asString(input.schoolCode, 'Le code établissement est obligatoire.', 'schoolCode', errors),
    name: asString(input.name, 'Le nom de l’établissement est obligatoire.', 'name', errors),
    schoolType: asString(input.schoolType, 'Le type d’établissement est obligatoire.', 'schoolType', errors),
    city: asOptionalString(input.city),
    country: asOptionalString(input.country),
    address: asOptionalString(input.address),
    phone: asOptionalString(input.phone),
    email: asOptionalString(input.email),
    contactPrincipal: asOptionalString(input.contactPrincipal),
    currency: asOptionalString(input.currency),
    language: asOptionalString(input.language),
    timezone: asOptionalString(input.timezone),
    status: asEnum(input.status, ['active', 'inactive', 'suspended', 'archived'] as const, 'Le statut de l’établissement est invalide.', 'status', errors),
    targetCapacity: input.targetCapacity === null || input.targetCapacity === undefined ? null : Math.max(0, asOptionalNumber(input.targetCapacity, 0)),
    notes: asOptionalString(input.notes),
  }
  return errors.length ? { success: false, errors } : { success: true, data }
})

export type Angelcare360AcademicYearAdminInput = {
  id?: string | null
  schoolId: string
  yearCode: string
  label: string
  startsOn: string
  endsOn: string
  status: 'planned' | 'active' | 'closed' | 'archived'
  isCurrent?: boolean
}

export const angelcare360AcademicYearAdminSchema = createSchema<Angelcare360AcademicYearAdminInput>('academic_year_admin', (input) => {
  const errors: Angelcare360ValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'Le payload année scolaire doit être un objet.' }] }
  const startsOn = asDateString(input.startsOn, 'La date de début est invalide.', 'startsOn', errors)
  const endsOn = asDateString(input.endsOn, 'La date de fin est invalide.', 'endsOn', errors)
  if (startsOn && endsOn && !isValidDateOrder(startsOn, endsOn)) {
    errors.push({ path: 'endsOn', message: 'La date de fin doit être postérieure à la date de début.' })
  }
  const data: Angelcare360AcademicYearAdminInput = {
    id: asOptionalString(input.id),
    schoolId: asString(input.schoolId, 'L’établissement est requis.', 'schoolId', errors),
    yearCode: asString(input.yearCode, 'Le code de l’année scolaire est obligatoire.', 'yearCode', errors),
    label: asString(input.label, 'Le libellé de l’année scolaire est obligatoire.', 'label', errors),
    startsOn,
    endsOn,
    status: asEnum(input.status, ['planned', 'active', 'closed', 'archived'] as const, 'Le statut de l’année scolaire est invalide.', 'status', errors),
    isCurrent: asOptionalBoolean(input.isCurrent, false),
  }
  return errors.length ? { success: false, errors } : { success: true, data }
})

export type Angelcare360TermAdminInput = {
  id?: string | null
  schoolId: string
  academicYearId: string
  termCode: string
  label: string
  termType?: string | null
  startsOn: string
  endsOn: string
  orderIndex: number
  status: 'planned' | 'active' | 'closed' | 'archived'
}

export const angelcare360TermAdminSchema = createSchema<Angelcare360TermAdminInput>('term_admin', (input) => {
  const errors: Angelcare360ValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'Le payload période doit être un objet.' }] }
  const startsOn = asDateString(input.startsOn, 'La date de début est invalide.', 'startsOn', errors)
  const endsOn = asDateString(input.endsOn, 'La date de fin est invalide.', 'endsOn', errors)
  if (startsOn && endsOn && !isValidDateOrder(startsOn, endsOn)) {
    errors.push({ path: 'endsOn', message: 'La date de fin doit être postérieure à la date de début.' })
  }
  const data: Angelcare360TermAdminInput = {
    id: asOptionalString(input.id),
    schoolId: asString(input.schoolId, 'L’établissement est requis.', 'schoolId', errors),
    academicYearId: asString(input.academicYearId, 'L’année scolaire est requise.', 'academicYearId', errors),
    termCode: asString(input.termCode, 'Le code de la période est obligatoire.', 'termCode', errors),
    label: asString(input.label, 'Le libellé de la période est obligatoire.', 'label', errors),
    termType: asOptionalString(input.termType),
    startsOn,
    endsOn,
    orderIndex: Math.max(1, asOptionalNumber(input.orderIndex, 1)),
    status: asEnum(input.status, ['planned', 'active', 'closed', 'archived'] as const, 'Le statut de la période est invalide.', 'status', errors),
  }
  return errors.length ? { success: false, errors } : { success: true, data }
})

export type Angelcare360ClassAdminInput = {
  id?: string | null
  schoolId: string
  academicYearId: string
  classCode: string
  name: string
  level: string
  capacity: number
  orderIndex: number
  homeroomStaffId?: string | null
  description?: string | null
  status: 'active' | 'inactive' | 'archived'
}

export const angelcare360ClassAdminSchema = createSchema<Angelcare360ClassAdminInput>('class_admin', (input) => {
  const errors: Angelcare360ValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'Le payload classe doit être un objet.' }] }
  const data: Angelcare360ClassAdminInput = {
    id: asOptionalString(input.id),
    schoolId: asString(input.schoolId, 'L’établissement est requis.', 'schoolId', errors),
    academicYearId: asString(input.academicYearId, 'L’année scolaire est requise.', 'academicYearId', errors),
    classCode: asString(input.classCode, 'Le code classe est obligatoire.', 'classCode', errors),
    name: asString(input.name, 'Le nom de la classe est obligatoire.', 'name', errors),
    level: asString(input.level, 'Le niveau est obligatoire.', 'level', errors),
    capacity: Math.max(0, asOptionalNumber(input.capacity, 0)),
    orderIndex: Math.max(1, asOptionalNumber(input.orderIndex, 1)),
    homeroomStaffId: asOptionalString(input.homeroomStaffId),
    description: asOptionalString(input.description),
    status: asEnum(input.status, ['active', 'inactive', 'archived'] as const, 'Le statut de la classe est invalide.', 'status', errors),
  }
  return errors.length ? { success: false, errors } : { success: true, data }
})

export type Angelcare360SectionAdminInput = {
  id?: string | null
  schoolId: string
  academicYearId: string
  classId: string
  sectionCode: string
  name: string
  capacity: number
  room?: string | null
  mainTeacherId?: string | null
  status: 'active' | 'inactive' | 'archived'
}

export const angelcare360SectionAdminSchema = createSchema<Angelcare360SectionAdminInput>('section_admin', (input) => {
  const errors: Angelcare360ValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'Le payload section doit être un objet.' }] }
  const data: Angelcare360SectionAdminInput = {
    id: asOptionalString(input.id),
    schoolId: asString(input.schoolId, 'L’établissement est requis.', 'schoolId', errors),
    academicYearId: asString(input.academicYearId, 'L’année scolaire est requise.', 'academicYearId', errors),
    classId: asString(input.classId, 'La classe est requise.', 'classId', errors),
    sectionCode: asString(input.sectionCode, 'Le code de la section est obligatoire.', 'sectionCode', errors),
    name: asString(input.name, 'Le nom de la section est obligatoire.', 'name', errors),
    capacity: Math.max(0, asOptionalNumber(input.capacity, 0)),
    room: asOptionalString(input.room),
    mainTeacherId: asOptionalString(input.mainTeacherId),
    status: asEnum(input.status, ['active', 'inactive', 'archived'] as const, 'Le statut de la section est invalide.', 'status', errors),
  }
  return errors.length ? { success: false, errors } : { success: true, data }
})

export type Angelcare360SubjectAdminInput = {
  id?: string | null
  schoolId: string
  subjectCode: string
  name: string
  shortName?: string | null
  department?: string | null
  creditHours?: number | null
  linkedClassIds: string[]
  status: 'active' | 'inactive' | 'archived'
}

export const angelcare360SubjectAdminSchema = createSchema<Angelcare360SubjectAdminInput>('subject_admin', (input) => {
  const errors: Angelcare360ValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'Le payload matière doit être un objet.' }] }
  const data: Angelcare360SubjectAdminInput = {
    id: asOptionalString(input.id),
    schoolId: asString(input.schoolId, 'L’établissement est requis.', 'schoolId', errors),
    subjectCode: asString(input.subjectCode, 'Le code matière est obligatoire.', 'subjectCode', errors),
    name: asString(input.name, 'Le nom de la matière est obligatoire.', 'name', errors),
    shortName: asOptionalString(input.shortName),
    department: asOptionalString(input.department),
    creditHours: input.creditHours === null || input.creditHours === undefined ? null : Math.max(0, asOptionalNumber(input.creditHours, 0)),
    linkedClassIds: asOptionalStringArray(input.linkedClassIds),
    status: asEnum(input.status, ['active', 'inactive', 'archived'] as const, 'Le statut de la matière est invalide.', 'status', errors),
  }
  return errors.length ? { success: false, errors } : { success: true, data }
})

export type Angelcare360TeacherAssignmentAdminInput = {
  id?: string | null
  schoolId: string
  academicYearId: string
  staffId: string
  classId?: string | null
  sectionId?: string | null
  subjectId?: string | null
  assignmentRole: string
  weeklyHours: number
  assignedFrom?: string | null
  assignedTo?: string | null
  status: 'active' | 'inactive' | 'archived'
}

export const angelcare360TeacherAssignmentAdminSchema = createSchema<Angelcare360TeacherAssignmentAdminInput>('teacher_assignment_admin', (input) => {
  const errors: Angelcare360ValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'Le payload affectation doit être un objet.' }] }
  const assignedFrom = asOptionalString(input.assignedFrom)
  const assignedTo = asOptionalString(input.assignedTo)
  if (assignedFrom && assignedTo && !isValidDateOrder(assignedFrom, assignedTo)) {
    errors.push({ path: 'assignedTo', message: 'La date de fin doit être postérieure à la date de début.' })
  }
  const data: Angelcare360TeacherAssignmentAdminInput = {
    id: asOptionalString(input.id),
    schoolId: asString(input.schoolId, 'L’établissement est requis.', 'schoolId', errors),
    academicYearId: asString(input.academicYearId, 'L’année scolaire est requise.', 'academicYearId', errors),
    staffId: asString(input.staffId, 'L’enseignant est requis.', 'staffId', errors),
    classId: asOptionalString(input.classId),
    sectionId: asOptionalString(input.sectionId),
    subjectId: asOptionalString(input.subjectId),
    assignmentRole: asString(input.assignmentRole, 'Le rôle d’affectation est obligatoire.', 'assignmentRole', errors),
    weeklyHours: Math.max(0, asOptionalNumber(input.weeklyHours, 0)),
    assignedFrom,
    assignedTo,
    status: asEnum(input.status, ['active', 'inactive', 'archived'] as const, 'Le statut de l’affectation est invalide.', 'status', errors),
  }
  if (!data.classId && !data.sectionId && !data.subjectId) {
    errors.push({ path: 'classId', message: 'Au moins une cible d’affectation doit être renseignée.' })
  }
  return errors.length ? { success: false, errors } : { success: true, data }
})

export type Angelcare360SchoolSettingsInput = {
  schoolId: string
  defaultLanguage: string
  defaultCurrency: string
  defaultTimezone: string
  academicYearStartMonth: number
  weekStartDay: number
  gradingScale: string
  attendanceGraceMinutes: number
  allowParentPortal: boolean
  allowStudentPortal: boolean
  communicationSenderName?: string | null
  schoolYearLabelFormat: string
  status: 'active' | 'inactive' | 'archived'
}

export const angelcare360SchoolSettingsSchema = createSchema<Angelcare360SchoolSettingsInput>('school_settings', (input) => {
  const errors: Angelcare360ValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'Le payload paramètres doit être un objet.' }] }
  const data: Angelcare360SchoolSettingsInput = {
    schoolId: asString(input.schoolId, 'L’établissement est requis.', 'schoolId', errors),
    defaultLanguage: asString(input.defaultLanguage, 'La langue est obligatoire.', 'defaultLanguage', errors),
    defaultCurrency: asString(input.defaultCurrency, 'La devise est obligatoire.', 'defaultCurrency', errors),
    defaultTimezone: asString(input.defaultTimezone, 'Le fuseau horaire est obligatoire.', 'defaultTimezone', errors),
    academicYearStartMonth: Math.min(12, Math.max(1, asOptionalNumber(input.academicYearStartMonth, 9))),
    weekStartDay: Math.min(7, Math.max(1, asOptionalNumber(input.weekStartDay, 1))),
    gradingScale: asString(input.gradingScale, 'L’échelle de notation est obligatoire.', 'gradingScale', errors),
    attendanceGraceMinutes: Math.max(0, asOptionalNumber(input.attendanceGraceMinutes, 10)),
    allowParentPortal: asOptionalBoolean(input.allowParentPortal, true),
    allowStudentPortal: asOptionalBoolean(input.allowStudentPortal, true),
    communicationSenderName: asOptionalString(input.communicationSenderName),
    schoolYearLabelFormat: asString(input.schoolYearLabelFormat, 'Le format de l’année scolaire est obligatoire.', 'schoolYearLabelFormat', errors),
    status: asEnum(input.status, ['active', 'inactive', 'archived'] as const, 'Le statut des paramètres est invalide.', 'status', errors),
  }
  return errors.length ? { success: false, errors } : { success: true, data }
})

export type Angelcare360RolePermissionsInput = {
  schoolId: string
  roleId: string
  permissionKeys: string[]
}

export const angelcare360RolePermissionsSchema = createSchema<Angelcare360RolePermissionsInput>('role_permissions', (input) => {
  const errors: Angelcare360ValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'Le payload RBAC doit être un objet.' }] }
  const data: Angelcare360RolePermissionsInput = {
    schoolId: asString(input.schoolId, 'L’établissement est requis.', 'schoolId', errors),
    roleId: asString(input.roleId, 'Le rôle est requis.', 'roleId', errors),
    permissionKeys: asOptionalStringArray(input.permissionKeys),
  }
  if (data.permissionKeys.length === 0) {
    errors.push({ path: 'permissionKeys', message: 'Au moins une permission doit être sélectionnée.' })
  }
  return errors.length ? { success: false, errors } : { success: true, data }
})

export type Angelcare360AuditFilterInput = {
  search?: string | null
  module?: string | null
  action?: string | null
  severity?: string | null
  entityType?: string | null
  actorRole?: string | null
  from?: string | null
  to?: string | null
}

export const angelcare360AuditFilterSchema = createSchema<Angelcare360AuditFilterInput>('audit_filter', (input) => {
  const errors: Angelcare360ValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'Le filtre d’audit doit être un objet.' }] }
  const data: Angelcare360AuditFilterInput = {
    search: asOptionalString(input.search),
    module: asOptionalString(input.module),
    action: asOptionalString(input.action),
    severity: asOptionalString(input.severity),
    entityType: asOptionalString(input.entityType),
    actorRole: asOptionalString(input.actorRole),
    from: asOptionalString(input.from),
    to: asOptionalString(input.to),
  }
  if (data.from && data.to && !isValidDateOrder(data.from, data.to)) {
    errors.push({ path: 'to', message: 'La date de fin doit être postérieure à la date de début.' })
  }
  return errors.length ? { success: false, errors } : { success: true, data }
})

export type Angelcare360StudentPeopleInput = {
  id?: string | null
  schoolId: string
  studentCode: string
  firstName: string
  lastName: string
  fullName?: string | null
  dateOfBirth?: string | null
  gender?: string | null
  nationalId?: string | null
  nationality?: string | null
  address?: string | null
  administrativeNotes?: string | null
  currentClassId?: string | null
  currentSectionId?: string | null
  academicYearId?: string | null
  admissionStatus: string
  status: 'active' | 'inactive' | 'archived'
  transportRequired?: boolean
  portalAppUserId?: string | null
}

export const angelcare360StudentPeopleSchema = createSchema<Angelcare360StudentPeopleInput>('student_people', (input) => {
  const errors: Angelcare360ValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'Le payload élève doit être un objet.' }] }

  const data: Angelcare360StudentPeopleInput = {
    id: asOptionalString(input.id),
    schoolId: asString(input.schoolId, 'L’établissement est requis.', 'schoolId', errors),
    studentCode: asString(input.studentCode, 'Le matricule élève est obligatoire.', 'studentCode', errors),
    firstName: asString(input.firstName, 'Le prénom de l’élève est obligatoire.', 'firstName', errors),
    lastName: asString(input.lastName, 'Le nom de l’élève est obligatoire.', 'lastName', errors),
    fullName: asOptionalString(input.fullName),
    dateOfBirth: asOptionalString(input.dateOfBirth),
    gender: asOptionalString(input.gender),
    nationalId: asOptionalString(input.nationalId),
    nationality: asOptionalString(input.nationality),
    address: asOptionalString(input.address),
    administrativeNotes: asOptionalString(input.administrativeNotes),
    currentClassId: asOptionalString(input.currentClassId),
    currentSectionId: asOptionalString(input.currentSectionId),
    academicYearId: asOptionalString(input.academicYearId),
    admissionStatus: asString(input.admissionStatus, 'Le statut d’admission est obligatoire.', 'admissionStatus', errors),
    status: asEnum(input.status, ['active', 'inactive', 'archived'] as const, 'Le statut de l’élève est invalide.', 'status', errors),
    transportRequired: asOptionalBoolean(input.transportRequired, false),
    portalAppUserId: asOptionalString(input.portalAppUserId),
  }

  if (data.dateOfBirth) {
    const parsed = new Date(data.dateOfBirth)
    if (Number.isNaN(parsed.getTime())) {
      errors.push({ path: 'dateOfBirth', message: 'La date de naissance est invalide.' })
    }
  }

  return errors.length ? { success: false, errors } : { success: true, data }
})

export type Angelcare360ParentPeopleInput = {
  id?: string | null
  schoolId: string
  parentCode: string
  firstName: string
  lastName: string
  fullName?: string | null
  relationshipType?: 'père' | 'mère' | 'tuteur' | 'autre' | string | null
  email?: string | null
  phone?: string | null
  secondaryPhone?: string | null
  whatsapp?: string | null
  occupation?: string | null
  preferredLanguage?: string | null
  address?: string | null
  administrativeNotes?: string | null
  status: 'active' | 'inactive' | 'archived'
}

export const angelcare360ParentPeopleSchema = createSchema<Angelcare360ParentPeopleInput>('parent_people', (input) => {
  const errors: Angelcare360ValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'Le payload parent doit être un objet.' }] }

  const data: Angelcare360ParentPeopleInput = {
    id: asOptionalString(input.id),
    schoolId: asString(input.schoolId, 'L’établissement est requis.', 'schoolId', errors),
    parentCode: asString(input.parentCode, 'Le code parent est obligatoire.', 'parentCode', errors),
    firstName: asString(input.firstName, 'Le prénom du parent est obligatoire.', 'firstName', errors),
    lastName: asString(input.lastName, 'Le nom du parent est obligatoire.', 'lastName', errors),
    fullName: asOptionalString(input.fullName),
    relationshipType: asEnum(
      input.relationshipType || 'tuteur',
      ['père', 'mère', 'tuteur', 'autre'] as const,
      'La relation du parent est invalide.',
      'relationshipType',
      errors,
    ),
    email: asOptionalString(input.email),
    phone: asOptionalString(input.phone),
    secondaryPhone: asOptionalString(input.secondaryPhone),
    whatsapp: asOptionalString(input.whatsapp),
    occupation: asOptionalString(input.occupation),
    preferredLanguage: asOptionalString(input.preferredLanguage),
    address: asOptionalString(input.address),
    administrativeNotes: asOptionalString(input.administrativeNotes),
    status: asEnum(input.status, ['active', 'inactive', 'archived'] as const, 'Le statut du parent est invalide.', 'status', errors),
  }

  if (!data.email && !data.phone && !data.whatsapp) {
    errors.push({ path: 'phone', message: 'Au moins un moyen de contact principal est requis.' })
  }

  if (data.email) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailPattern.test(data.email)) {
      errors.push({ path: 'email', message: 'L’adresse email est invalide.' })
    }
  }

  return errors.length ? { success: false, errors } : { success: true, data }
})

export type Angelcare360StaffPeopleInput = {
  id?: string | null
  schoolId: string
  staffCode: string
  firstName: string
  lastName: string
  fullName?: string | null
  email?: string | null
  phone?: string | null
  staffType: 'teacher' | 'personnel' | 'administration'
  department?: string | null
  hireDate?: string | null
  endDate?: string | null
  speciality?: string | null
  contractType?: string | null
  administrativeNotes?: string | null
  status: 'active' | 'on_leave' | 'inactive' | 'archived'
}

export const angelcare360StaffPeopleSchema = createSchema<Angelcare360StaffPeopleInput>('staff_people', (input) => {
  const errors: Angelcare360ValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'Le payload personnel doit être un objet.' }] }

  const data: Angelcare360StaffPeopleInput = {
    id: asOptionalString(input.id),
    schoolId: asString(input.schoolId, 'L’établissement est requis.', 'schoolId', errors),
    staffCode: asString(input.staffCode, 'Le matricule du personnel est obligatoire.', 'staffCode', errors),
    firstName: asString(input.firstName, 'Le prénom est obligatoire.', 'firstName', errors),
    lastName: asString(input.lastName, 'Le nom est obligatoire.', 'lastName', errors),
    fullName: asOptionalString(input.fullName),
    email: asOptionalString(input.email),
    phone: asOptionalString(input.phone),
    staffType: asEnum(input.staffType, ['teacher', 'personnel', 'administration'] as const, 'Le type de personnel est invalide.', 'staffType', errors),
    department: asOptionalString(input.department),
    hireDate: asOptionalString(input.hireDate),
    endDate: asOptionalString(input.endDate),
    speciality: asOptionalString(input.speciality),
    contractType: asOptionalString(input.contractType),
    administrativeNotes: asOptionalString(input.administrativeNotes),
    status: asEnum(input.status, ['active', 'on_leave', 'inactive', 'archived'] as const, 'Le statut du personnel est invalide.', 'status', errors),
  }

  if (data.email) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailPattern.test(data.email)) {
      errors.push({ path: 'email', message: 'L’adresse email est invalide.' })
    }
  }

  if (data.hireDate) {
    const parsed = new Date(data.hireDate)
    if (Number.isNaN(parsed.getTime())) {
      errors.push({ path: 'hireDate', message: 'La date d’entrée est invalide.' })
    }
  }

  if (data.endDate) {
    const parsed = new Date(data.endDate)
    if (Number.isNaN(parsed.getTime())) {
      errors.push({ path: 'endDate', message: 'La date de sortie est invalide.' })
    }
  }

  return errors.length ? { success: false, errors } : { success: true, data }
})

export type Angelcare360StudentParentLinkInput = {
  id?: string | null
  schoolId: string
  studentId: string
  parentId: string
  relationshipType: string
  isPrimary: boolean
  isGuardian: boolean
  canPickup: boolean
  canReceiveMessages: boolean
  canPayFees: boolean
  status: 'active' | 'inactive' | 'archived'
}

export const angelcare360StudentParentLinkSchema = createSchema<Angelcare360StudentParentLinkInput>('student_parent_link', (input) => {
  const errors: Angelcare360ValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'Le lien parent/enfant doit être un objet.' }] }

  const data: Angelcare360StudentParentLinkInput = {
    id: asOptionalString(input.id),
    schoolId: asString(input.schoolId, 'L’établissement est requis.', 'schoolId', errors),
    studentId: asString(input.studentId, 'L’élève est requis.', 'studentId', errors),
    parentId: asString(input.parentId, 'Le parent est requis.', 'parentId', errors),
    relationshipType: asString(input.relationshipType, 'La relation est obligatoire.', 'relationshipType', errors),
    isPrimary: asOptionalBoolean(input.isPrimary, false),
    isGuardian: asOptionalBoolean(input.isGuardian, true),
    canPickup: asOptionalBoolean(input.canPickup, true),
    canReceiveMessages: asOptionalBoolean(input.canReceiveMessages, true),
    canPayFees: asOptionalBoolean(input.canPayFees, true),
    status: asEnum(input.status, ['active', 'inactive', 'archived'] as const, 'Le statut du lien est invalide.', 'status', errors),
  }

  return errors.length ? { success: false, errors } : { success: true, data }
})

export type Angelcare360EmergencyContactInput = {
  id?: string | null
  schoolId: string
  contactableType: 'student' | 'staff'
  contactableId: string
  contactName: string
  relationshipType?: string | null
  phone?: string | null
  email?: string | null
  priority: number
  notes?: string | null
  status: 'active' | 'inactive' | 'archived'
}

export const angelcare360EmergencyContactSchema = createSchema<Angelcare360EmergencyContactInput>('emergency_contact', (input) => {
  const errors: Angelcare360ValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'Le contact d’urgence doit être un objet.' }] }

  const data: Angelcare360EmergencyContactInput = {
    id: asOptionalString(input.id),
    schoolId: asString(input.schoolId, 'L’établissement est requis.', 'schoolId', errors),
    contactableType: asEnum(input.contactableType, ['student', 'staff'] as const, 'Le type de contact est invalide.', 'contactableType', errors),
    contactableId: asString(input.contactableId, 'La personne liée est requise.', 'contactableId', errors),
    contactName: asString(input.contactName, 'Le nom du contact est obligatoire.', 'contactName', errors),
    relationshipType: asOptionalString(input.relationshipType),
    phone: asOptionalString(input.phone),
    email: asOptionalString(input.email),
    priority: Math.max(1, asOptionalNumber(input.priority, 1)),
    notes: asOptionalString(input.notes),
    status: asEnum(input.status, ['active', 'inactive', 'archived'] as const, 'Le statut du contact est invalide.', 'status', errors),
  }

  if (!data.phone && !data.email) {
    errors.push({ path: 'phone', message: 'Au moins un moyen de contact est requis.' })
  }
  if (data.email) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailPattern.test(data.email)) {
      errors.push({ path: 'email', message: 'L’adresse email est invalide.' })
    }
  }

  return errors.length ? { success: false, errors } : { success: true, data }
})

export type Angelcare360DocumentReferenceInput = {
  id?: string | null
  schoolId: string
  documentCode: string
  documentableType: 'student' | 'parent' | 'staff' | 'school'
  documentableId: string
  category: string
  title: string
  fileName?: string | null
  filePath?: string | null
  visibility: 'private' | 'school' | 'public' | 'restricted'
  documentState: 'requis' | 'recu' | 'validé' | 'expire'
  expiryDate?: string | null
  notes?: string | null
  status: 'active' | 'verified' | 'archived' | 'deleted'
}

export const angelcare360DocumentReferenceSchema = createSchema<Angelcare360DocumentReferenceInput>('document_reference', (input) => {
  const errors: Angelcare360ValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'Le document doit être un objet.' }] }

  const data: Angelcare360DocumentReferenceInput = {
    id: asOptionalString(input.id),
    schoolId: asString(input.schoolId, 'L’établissement est requis.', 'schoolId', errors),
    documentCode: asString(input.documentCode, 'Le code document est obligatoire.', 'documentCode', errors),
    documentableType: asEnum(input.documentableType, ['student', 'parent', 'staff', 'school'] as const, 'Le type de document est invalide.', 'documentableType', errors),
    documentableId: asString(input.documentableId, 'La cible du document est requise.', 'documentableId', errors),
    category: asString(input.category, 'La catégorie du document est obligatoire.', 'category', errors),
    title: asString(input.title, 'Le titre du document est obligatoire.', 'title', errors),
    fileName: asOptionalString(input.fileName),
    filePath: asOptionalString(input.filePath),
    visibility: asEnum(input.visibility, ['private', 'school', 'public', 'restricted'] as const, 'La visibilité est invalide.', 'visibility', errors),
    documentState: asEnum(input.documentState, ['requis', 'recu', 'validé', 'expire'] as const, 'Le statut du document est invalide.', 'documentState', errors),
    expiryDate: asOptionalString(input.expiryDate),
    notes: asOptionalString(input.notes),
    status: asEnum(
      input.status,
      ['active', 'verified', 'archived', 'deleted'] as const,
      'Le statut du document est invalide.',
      'status',
      errors,
    ),
  }

  if (data.expiryDate) {
    const parsed = new Date(data.expiryDate)
    if (Number.isNaN(parsed.getTime())) {
      errors.push({ path: 'expiryDate', message: 'La date d’expiration est invalide.' })
    }
  }

  return errors.length ? { success: false, errors } : { success: true, data }
})

export type Angelcare360StudentClassAssignmentInput = {
  schoolId: string
  studentId: string
  academicYearId: string
  classId: string
  sectionId?: string | null
  enrollmentNumber?: string | null
  status: 'active' | 'inactive' | 'archived'
}

export const angelcare360StudentClassAssignmentSchema = createSchema<Angelcare360StudentClassAssignmentInput>('student_class_assignment', (input) => {
  const errors: Angelcare360ValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'L’affectation classe doit être un objet.' }] }
  const data: Angelcare360StudentClassAssignmentInput = {
    schoolId: asString(input.schoolId, 'L’établissement est requis.', 'schoolId', errors),
    studentId: asString(input.studentId, 'L’élève est requis.', 'studentId', errors),
    academicYearId: asString(input.academicYearId, 'L’année scolaire est requise.', 'academicYearId', errors),
    classId: asString(input.classId, 'La classe est requise.', 'classId', errors),
    sectionId: asOptionalString(input.sectionId),
    enrollmentNumber: asOptionalString(input.enrollmentNumber),
    status: asEnum(input.status, ['active', 'inactive', 'archived'] as const, 'Le statut de l’inscription est invalide.', 'status', errors),
  }
  return errors.length ? { success: false, errors } : { success: true, data }
})

export const angelcare360PeopleAuditFilterSchema = angelcare360AuditFilterSchema

function asOptionalPositiveNumber(value: unknown, fallback: number | null = null) {
  const parsed = asOptionalNumber(value, Number.NaN)
  if (Number.isFinite(parsed) && parsed >= 0) return parsed
  return fallback
}

function asRequiredPositiveNumber(value: unknown, message: string, path: string, errors: Angelcare360ValidationIssue[]) {
  const parsed = asOptionalNumber(value, Number.NaN)
  if (!Number.isFinite(parsed) || parsed < 0) {
    errors.push({ path, message })
    return 0
  }
  return parsed
}

function ensureRange(value: number, min: number, max: number, message: string, path: string, errors: Angelcare360ValidationIssue[]) {
  if (value < min || value > max) {
    errors.push({ path, message })
  }
}

function ensureValidTransition(current: string | undefined | null, allowed: string[], message: string, path: string, errors: Angelcare360ValidationIssue[]) {
  if (current && !allowed.includes(current)) {
    errors.push({ path, message })
  }
}

export type Angelcare360FeeStructureCreateInput = {
  schoolId: string
  academicYearId: string
  feeCode?: string | null
  label: string
  description?: string | null
  dueDayOfMonth?: number | null
  currency?: string | null
  appliesToLevel?: string | null
  status?: 'draft' | 'active' | 'inactive' | 'archived'
}

export type Angelcare360FeeStructureUpdateInput = Angelcare360FeeStructureCreateInput & { id: string }

export const angelcare360FeeStructureCreateSchema = createSchema<Angelcare360FeeStructureCreateInput>('fee_structure_create', (input) => {
  const errors: Angelcare360ValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'La structure de frais doit être un objet.' }] }
  const dueDay = asOptionalInteger(input.dueDayOfMonth, null as unknown as number) as number | null
  if (dueDay !== null && (dueDay < 1 || dueDay > 31)) errors.push({ path: 'dueDayOfMonth', message: 'Le jour d’échéance doit être compris entre 1 et 31.' })
  const data: Angelcare360FeeStructureCreateInput = {
    schoolId: asString(input.schoolId, 'L’établissement est requis.', 'schoolId', errors),
    academicYearId: asString(input.academicYearId, 'L’année scolaire est requise.', 'academicYearId', errors),
    feeCode: asOptionalString(input.feeCode),
    label: asString(input.label, 'Le libellé de la structure de frais est obligatoire.', 'label', errors),
    description: asOptionalString(input.description),
    dueDayOfMonth: dueDay,
    currency: asOptionalString(input.currency) || 'MAD',
    appliesToLevel: asOptionalString(input.appliesToLevel),
    status: asEnum(input.status, ['draft', 'active', 'inactive', 'archived'] as const, 'Le statut de la structure de frais est invalide.', 'status', errors),
  }
  return errors.length ? { success: false, errors } : { success: true, data }
})

export const angelcare360FeeStructureUpdateSchema = createSchema<Angelcare360FeeStructureUpdateInput>('fee_structure_update', (input) => {
  const result = angelcare360FeeStructureCreateSchema.safeParse(input)
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'La structure de frais doit être un objet.' }] }
  if (!isNonEmptyString((input as Record<string, unknown>).id)) {
    return { success: false, errors: [{ path: 'id', message: 'L’identifiant de la structure de frais est requis.' }] }
  }
  return result.success ? { success: true, data: { ...(result.data as Angelcare360FeeStructureCreateInput), id: String((input as Record<string, unknown>).id).trim() } } : result
})

export type Angelcare360FeeItemCreateInput = {
  schoolId: string
  feeStructureId: string
  itemCode?: string | null
  label: string
  feeType?: string | null
  amount: number
  dueOn?: string | null
  isRequired?: boolean
  status?: 'active' | 'inactive' | 'archived'
}

export type Angelcare360FeeItemUpdateInput = Angelcare360FeeItemCreateInput & { id: string }

export const angelcare360FeeItemCreateSchema = createSchema<Angelcare360FeeItemCreateInput>('fee_item_create', (input) => {
  const errors: Angelcare360ValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'L’article de frais doit être un objet.' }] }
  const dueOn = asOptionalString(input.dueOn)
  if (dueOn) {
    const parsed = new Date(dueOn)
    if (Number.isNaN(parsed.getTime())) errors.push({ path: 'dueOn', message: 'La date d’échéance est invalide.' })
  }
  const data: Angelcare360FeeItemCreateInput = {
    schoolId: asString(input.schoolId, 'L’établissement est requis.', 'schoolId', errors),
    feeStructureId: asString(input.feeStructureId, 'La structure de frais est requise.', 'feeStructureId', errors),
    itemCode: asOptionalString(input.itemCode),
    label: asString(input.label, 'Le libellé de l’article est obligatoire.', 'label', errors),
    feeType: asOptionalString(input.feeType) || 'tuition',
    amount: asRequiredPositiveNumber(input.amount, 'Le montant de l’article doit être positif ou nul.', 'amount', errors),
    dueOn,
    isRequired: asOptionalBoolean(input.isRequired, true),
    status: asEnum(input.status, ['active', 'inactive', 'archived'] as const, 'Le statut de l’article est invalide.', 'status', errors),
  }
  return errors.length ? { success: false, errors } : { success: true, data }
})

export const angelcare360FeeItemUpdateSchema = createSchema<Angelcare360FeeItemUpdateInput>('fee_item_update', (input) => {
  const result = angelcare360FeeItemCreateSchema.safeParse(input)
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'L’article de frais doit être un objet.' }] }
  if (!isNonEmptyString((input as Record<string, unknown>).id)) {
    return { success: false, errors: [{ path: 'id', message: 'L’identifiant de l’article de frais est requis.' }] }
  }
  return result.success ? { success: true, data: { ...(result.data as Angelcare360FeeItemCreateInput), id: String((input as Record<string, unknown>).id).trim() } } : result
})

export type Angelcare360StudentFeeAssignmentCreateInput = {
  schoolId: string
  academicYearId: string
  studentId: string
  feeStructureId: string
  classId?: string | null
  sectionId?: string | null
  assignedOn?: string | null
  status?: 'active' | 'inactive' | 'archived'
}

export const angelcare360StudentFeeAssignmentCreateSchema = createSchema<Angelcare360StudentFeeAssignmentCreateInput>('student_fee_assignment_create', (input) => {
  const errors: Angelcare360ValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'L’affectation de frais doit être un objet.' }] }
  const assignedOn = asOptionalString(input.assignedOn)
  if (assignedOn) {
    const parsed = new Date(assignedOn)
    if (Number.isNaN(parsed.getTime())) errors.push({ path: 'assignedOn', message: 'La date d’affectation est invalide.' })
  }
  const data: Angelcare360StudentFeeAssignmentCreateInput = {
    schoolId: asString(input.schoolId, 'L’établissement est requis.', 'schoolId', errors),
    academicYearId: asString(input.academicYearId, 'L’année scolaire est requise.', 'academicYearId', errors),
    studentId: asString(input.studentId, 'L’élève est requis.', 'studentId', errors),
    feeStructureId: asString(input.feeStructureId, 'La structure de frais est requise.', 'feeStructureId', errors),
    classId: asOptionalString(input.classId),
    sectionId: asOptionalString(input.sectionId),
    assignedOn,
    status: asEnum(input.status, ['active', 'inactive', 'archived'] as const, 'Le statut de l’affectation de frais est invalide.', 'status', errors),
  }
  return errors.length ? { success: false, errors } : { success: true, data }
})

export type Angelcare360InvoiceCreateInput = {
  schoolId: string
  academicYearId: string
  studentId: string
  invoiceNumber?: string | null
  invoiceType?: string | null
  invoiceDate?: string | null
  dueDate?: string | null
  currency?: string | null
  subtotalAmount?: number
  discountTotal?: number
  taxTotal?: number
  totalAmount?: number
  amountPaid?: number
  status?: 'draft' | 'issued' | 'sent' | 'partial' | 'partially_paid' | 'paid' | 'overdue' | 'void' | 'cancelled' | 'archived'
}

export type Angelcare360InvoiceUpdateInput = Angelcare360InvoiceCreateInput & { id: string }
export type Angelcare360InvoiceIssueInput = { schoolId: string; id: string; reason?: string | null }
export type Angelcare360InvoiceCancelInput = { schoolId: string; id: string; reason: string }

export type Angelcare360InvoiceLineCreateInput = {
  schoolId: string
  invoiceId: string
  feeItemId?: string | null
  lineCode?: string | null
  label: string
  quantity?: number
  unitAmount: number
  status?: 'active' | 'archived'
}
export type Angelcare360InvoiceLineUpdateInput = Angelcare360InvoiceLineCreateInput & { id: string }

export const angelcare360InvoiceCreateSchema = createSchema<Angelcare360InvoiceCreateInput>('invoice_create', (input) => {
  const errors: Angelcare360ValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'La facture doit être un objet.' }] }
  const invoiceDate = asOptionalString(input.invoiceDate)
  const dueDate = asOptionalString(input.dueDate)
  if (invoiceDate && Number.isNaN(new Date(invoiceDate).getTime())) errors.push({ path: 'invoiceDate', message: 'La date de facture est invalide.' })
  if (dueDate && Number.isNaN(new Date(dueDate).getTime())) errors.push({ path: 'dueDate', message: 'La date d’échéance est invalide.' })
  const data: Angelcare360InvoiceCreateInput = {
    schoolId: asString(input.schoolId, 'L’établissement est requis.', 'schoolId', errors),
    academicYearId: asString(input.academicYearId, 'L’année scolaire est requise.', 'academicYearId', errors),
    studentId: asString(input.studentId, 'L’élève est requis.', 'studentId', errors),
    invoiceNumber: asOptionalString(input.invoiceNumber),
    invoiceType: asOptionalString(input.invoiceType) || 'tuition',
    invoiceDate,
    dueDate,
    currency: asOptionalString(input.currency) || 'MAD',
    subtotalAmount: asOptionalPositiveNumber(input.subtotalAmount, 0) ?? 0,
    discountTotal: asOptionalPositiveNumber(input.discountTotal, 0) ?? 0,
    taxTotal: asOptionalPositiveNumber(input.taxTotal, 0) ?? 0,
    totalAmount: asOptionalPositiveNumber(input.totalAmount, 0) ?? 0,
    amountPaid: asOptionalPositiveNumber(input.amountPaid, 0) ?? 0,
    status: asEnum(input.status, ['draft', 'issued', 'sent', 'partial', 'partially_paid', 'paid', 'overdue', 'void', 'cancelled', 'archived'] as const, 'Le statut de facture est invalide.', 'status', errors),
  }
  const totalAmount = data.totalAmount ?? 0
  if ((data.status === 'issued' || data.status === 'sent' || data.status === 'partial' || data.status === 'partially_paid' || data.status === 'paid' || data.status === 'overdue') && totalAmount <= 0) {
    errors.push({ path: 'totalAmount', message: 'Une facture émise doit avoir un total strictement positif.' })
  }
  return errors.length ? { success: false, errors } : { success: true, data }
})

export const angelcare360InvoiceUpdateSchema = createSchema<Angelcare360InvoiceUpdateInput>('invoice_update', (input) => {
  const result = angelcare360InvoiceCreateSchema.safeParse(input)
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'La facture doit être un objet.' }] }
  if (!isNonEmptyString((input as Record<string, unknown>).id)) return { success: false, errors: [{ path: 'id', message: 'L’identifiant de la facture est requis.' }] }
  return result.success ? { success: true, data: { ...(result.data as Angelcare360InvoiceCreateInput), id: String((input as Record<string, unknown>).id).trim() } } : result
})

export const angelcare360InvoiceIssueSchema = createSchema<Angelcare360InvoiceIssueInput>('invoice_issue', (input) => {
  const errors: Angelcare360ValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'L’émission de facture doit être un objet.' }] }
  const data: Angelcare360InvoiceIssueInput = {
    schoolId: asString(input.schoolId, 'L’établissement est requis.', 'schoolId', errors),
    id: asString(input.id, 'La facture est requise.', 'id', errors),
    reason: asOptionalString(input.reason),
  }
  return errors.length ? { success: false, errors } : { success: true, data }
})

export const angelcare360InvoiceCancelSchema = createSchema<Angelcare360InvoiceCancelInput>('invoice_cancel', (input) => {
  const errors: Angelcare360ValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'L’annulation de facture doit être un objet.' }] }
  const data: Angelcare360InvoiceCancelInput = {
    schoolId: asString(input.schoolId, 'L’établissement est requis.', 'schoolId', errors),
    id: asString(input.id, 'La facture est requise.', 'id', errors),
    reason: asString(input.reason, 'Le motif d’annulation est obligatoire.', 'reason', errors),
  }
  return errors.length ? { success: false, errors } : { success: true, data }
})

export const angelcare360InvoiceLineCreateSchema = createSchema<Angelcare360InvoiceLineCreateInput>('invoice_line_create', (input) => {
  const errors: Angelcare360ValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'La ligne de facture doit être un objet.' }] }
  const data: Angelcare360InvoiceLineCreateInput = {
    schoolId: asString(input.schoolId, 'L’établissement est requis.', 'schoolId', errors),
    invoiceId: asString(input.invoiceId, 'La facture est requise.', 'invoiceId', errors),
    feeItemId: asOptionalString(input.feeItemId),
    lineCode: asOptionalString(input.lineCode),
    label: asString(input.label, 'Le libellé de la ligne est obligatoire.', 'label', errors),
    quantity: asOptionalPositiveNumber(input.quantity, 1) ?? 1,
    unitAmount: asRequiredPositiveNumber(input.unitAmount, 'Le montant unitaire doit être positif ou nul.', 'unitAmount', errors),
    status: asEnum(input.status, ['active', 'archived'] as const, 'Le statut de la ligne est invalide.', 'status', errors),
  }
  return errors.length ? { success: false, errors } : { success: true, data }
})

export const angelcare360InvoiceLineUpdateSchema = createSchema<Angelcare360InvoiceLineUpdateInput>('invoice_line_update', (input) => {
  const result = angelcare360InvoiceLineCreateSchema.safeParse(input)
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'La ligne de facture doit être un objet.' }] }
  if (!isNonEmptyString((input as Record<string, unknown>).id)) return { success: false, errors: [{ path: 'id', message: 'L’identifiant de la ligne est requis.' }] }
  return result.success ? { success: true, data: { ...(result.data as Angelcare360InvoiceLineCreateInput), id: String((input as Record<string, unknown>).id).trim() } } : result
})

export type Angelcare360PaymentRecordInput = {
  schoolId: string
  academicYearId: string
  invoiceId?: string | null
  studentId?: string | null
  paymentNumber?: string | null
  paymentDate: string
  method: string
  amount: number
  reference?: string | null
  status?: 'pending' | 'confirmed' | 'failed' | 'rejected' | 'refunded' | 'cancelled'
}
export type Angelcare360PaymentConfirmInput = { schoolId: string; id: string; reference?: string | null }
export type Angelcare360PaymentRejectInput = { schoolId: string; id: string; reason: string }
export type Angelcare360PaymentCancelInput = { schoolId: string; id: string; reason: string }
export type Angelcare360PaymentAllocationInput = { schoolId: string; paymentId: string; invoiceId: string; amount?: number | null }

export const angelcare360PaymentRecordSchema = createSchema<Angelcare360PaymentRecordInput>('payment_record', (input) => {
  const errors: Angelcare360ValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'Le paiement doit être un objet.' }] }
  const paymentDate = asDateString(input.paymentDate, 'La date de paiement est obligatoire.', 'paymentDate', errors)
  const data: Angelcare360PaymentRecordInput = {
    schoolId: asString(input.schoolId, 'L’établissement est requis.', 'schoolId', errors),
    academicYearId: asString(input.academicYearId, 'L’année scolaire est requise.', 'academicYearId', errors),
    invoiceId: asOptionalString(input.invoiceId),
    studentId: asOptionalString(input.studentId),
    paymentNumber: asOptionalString(input.paymentNumber),
    paymentDate,
    method: asString(input.method, 'Le mode de paiement est obligatoire.', 'method', errors),
    amount: asRequiredPositiveNumber(input.amount, 'Le montant du paiement doit être strictement positif.', 'amount', errors),
    reference: asOptionalString(input.reference),
    status: asEnum(input.status, ['pending', 'confirmed', 'failed', 'rejected', 'refunded', 'cancelled'] as const, 'Le statut du paiement est invalide.', 'status', errors),
  }
  if (data.reference && data.reference.length < 2) errors.push({ path: 'reference', message: 'La référence de paiement est trop courte.' })
  return errors.length ? { success: false, errors } : { success: true, data }
})

export const angelcare360PaymentConfirmSchema = createSchema<Angelcare360PaymentConfirmInput>('payment_confirm', (input) => {
  const errors: Angelcare360ValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'La confirmation de paiement doit être un objet.' }] }
  const data: Angelcare360PaymentConfirmInput = {
    schoolId: asString(input.schoolId, 'L’établissement est requis.', 'schoolId', errors),
    id: asString(input.id, 'Le paiement est requis.', 'id', errors),
    reference: asOptionalString(input.reference),
  }
  return errors.length ? { success: false, errors } : { success: true, data }
})

export const angelcare360PaymentRejectSchema = createSchema<Angelcare360PaymentRejectInput>('payment_reject', (input) => {
  const errors: Angelcare360ValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'Le rejet de paiement doit être un objet.' }] }
  const data: Angelcare360PaymentRejectInput = {
    schoolId: asString(input.schoolId, 'L’établissement est requis.', 'schoolId', errors),
    id: asString(input.id, 'Le paiement est requis.', 'id', errors),
    reason: asString(input.reason, 'Le motif de rejet est obligatoire.', 'reason', errors),
  }
  return errors.length ? { success: false, errors } : { success: true, data }
})

export const angelcare360PaymentCancelSchema = createSchema<Angelcare360PaymentCancelInput>('payment_cancel', (input) => {
  const errors: Angelcare360ValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'L’annulation de paiement doit être un objet.' }] }
  const data: Angelcare360PaymentCancelInput = {
    schoolId: asString(input.schoolId, 'L’établissement est requis.', 'schoolId', errors),
    id: asString(input.id, 'Le paiement est requis.', 'id', errors),
    reason: asString(input.reason, 'Le motif d’annulation est obligatoire.', 'reason', errors),
  }
  return errors.length ? { success: false, errors } : { success: true, data }
})

export const angelcare360PaymentAllocationSchema = createSchema<Angelcare360PaymentAllocationInput>('payment_allocation', (input) => {
  const errors: Angelcare360ValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'L’allocation de paiement doit être un objet.' }] }
  const data: Angelcare360PaymentAllocationInput = {
    schoolId: asString(input.schoolId, 'L’établissement est requis.', 'schoolId', errors),
    paymentId: asString(input.paymentId, 'Le paiement est requis.', 'paymentId', errors),
    invoiceId: asString(input.invoiceId, 'La facture est requise.', 'invoiceId', errors),
    amount: asOptionalPositiveNumber(input.amount, null),
  }
  return errors.length ? { success: false, errors } : { success: true, data }
})

export type Angelcare360ReceiptCreateInput = { schoolId: string; paymentId: string; status?: 'draft' | 'issued' | 'void' | 'cancelled' | 'archived' }
export type Angelcare360ReceiptCancelInput = { schoolId: string; id: string; reason: string }

export const angelcare360ReceiptCreateSchema = createSchema<Angelcare360ReceiptCreateInput>('receipt_create', (input) => {
  const errors: Angelcare360ValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'Le reçu doit être un objet.' }] }
  const data: Angelcare360ReceiptCreateInput = {
    schoolId: asString(input.schoolId, 'L’établissement est requis.', 'schoolId', errors),
    paymentId: asString(input.paymentId, 'Le paiement est requis.', 'paymentId', errors),
    status: asEnum(input.status, ['draft', 'issued', 'void', 'cancelled', 'archived'] as const, 'Le statut du reçu est invalide.', 'status', errors),
  }
  return errors.length ? { success: false, errors } : { success: true, data }
})

export const angelcare360ReceiptCancelSchema = createSchema<Angelcare360ReceiptCancelInput>('receipt_cancel', (input) => {
  const errors: Angelcare360ValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'L’annulation de reçu doit être un objet.' }] }
  const data: Angelcare360ReceiptCancelInput = {
    schoolId: asString(input.schoolId, 'L’établissement est requis.', 'schoolId', errors),
    id: asString(input.id, 'Le reçu est requis.', 'id', errors),
    reason: asString(input.reason, 'Le motif d’annulation est obligatoire.', 'reason', errors),
  }
  return errors.length ? { success: false, errors } : { success: true, data }
})

export type Angelcare360DiscountCreateInput = {
  schoolId: string
  academicYearId?: string | null
  studentId?: string | null
  invoiceId?: string | null
  discountCode?: string | null
  discountType: string
  amount: number
  reason?: string | null
  status?: 'requested' | 'approved' | 'rejected' | 'applied' | 'cancelled' | 'active' | 'inactive' | 'archived'
}
export type Angelcare360DiscountDecisionInput = { schoolId: string; id: string; decision: 'approved' | 'rejected' | 'cancelled'; reason?: string | null }
export type Angelcare360DiscountApplyInput = { schoolId: string; id: string; invoiceId?: string | null }

export const angelcare360DiscountCreateSchema = createSchema<Angelcare360DiscountCreateInput>('discount_create', (input) => {
  const errors: Angelcare360ValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'La remise doit être un objet.' }] }
  const data: Angelcare360DiscountCreateInput = {
    schoolId: asString(input.schoolId, 'L’établissement est requis.', 'schoolId', errors),
    academicYearId: asOptionalString(input.academicYearId),
    studentId: asOptionalString(input.studentId),
    invoiceId: asOptionalString(input.invoiceId),
    discountCode: asOptionalString(input.discountCode),
    discountType: asString(input.discountType, 'Le type de remise est obligatoire.', 'discountType', errors),
    amount: asRequiredPositiveNumber(input.amount, 'Le montant de la remise doit être positif ou nul.', 'amount', errors),
    reason: asOptionalString(input.reason),
    status: asEnum(input.status, ['requested', 'approved', 'rejected', 'applied', 'cancelled', 'active', 'inactive', 'archived'] as const, 'Le statut de la remise est invalide.', 'status', errors),
  }
  if (input.discountType === 'percentage' && (data.amount < 0 || data.amount > 100)) {
    errors.push({ path: 'amount', message: 'Le pourcentage de remise doit être compris entre 0 et 100.' })
  }
  return errors.length ? { success: false, errors } : { success: true, data }
})

export const angelcare360DiscountDecisionSchema = createSchema<Angelcare360DiscountDecisionInput>('discount_decision', (input) => {
  const errors: Angelcare360ValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'La décision de remise doit être un objet.' }] }
  const data: Angelcare360DiscountDecisionInput = {
    schoolId: asString(input.schoolId, 'L’établissement est requis.', 'schoolId', errors),
    id: asString(input.id, 'La remise est requise.', 'id', errors),
    decision: asEnum(input.decision, ['approved', 'rejected', 'cancelled'] as const, 'La décision de remise est invalide.', 'decision', errors),
    reason: asOptionalString(input.reason),
  }
  if (data.decision !== 'approved' && !data.reason) {
    errors.push({ path: 'reason', message: 'Le motif de décision est obligatoire.' })
  }
  return errors.length ? { success: false, errors } : { success: true, data }
})

export const angelcare360DiscountApplySchema = createSchema<Angelcare360DiscountApplyInput>('discount_apply', (input) => {
  const errors: Angelcare360ValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'L’application de remise doit être un objet.' }] }
  const data: Angelcare360DiscountApplyInput = {
    schoolId: asString(input.schoolId, 'L’établissement est requis.', 'schoolId', errors),
    id: asString(input.id, 'La remise est requise.', 'id', errors),
    invoiceId: asOptionalString(input.invoiceId),
  }
  return errors.length ? { success: false, errors } : { success: true, data }
})

export type Angelcare360ReminderCreateInput = {
  schoolId: string
  invoiceId: string
  studentId?: string | null
  reminderCode?: string | null
  reminderType: string
  scheduledFor: string
  channel?: string | null
  status?: 'planned' | 'scheduled' | 'sent' | 'blocked' | 'failed' | 'cancelled' | 'archived'
}
export type Angelcare360ReminderBlockedInput = { schoolId: string; id: string; reason: string }

export const angelcare360ReminderCreateSchema = createSchema<Angelcare360ReminderCreateInput>('reminder_create', (input) => {
  const errors: Angelcare360ValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'La relance doit être un objet.' }] }
  const data: Angelcare360ReminderCreateInput = {
    schoolId: asString(input.schoolId, 'L’établissement est requis.', 'schoolId', errors),
    invoiceId: asString(input.invoiceId, 'La facture est requise.', 'invoiceId', errors),
    studentId: asOptionalString(input.studentId),
    reminderCode: asOptionalString(input.reminderCode),
    reminderType: asString(input.reminderType, 'Le type de relance est obligatoire.', 'reminderType', errors),
    scheduledFor: asDateString(input.scheduledFor, 'La date de relance est invalide.', 'scheduledFor', errors),
    channel: asOptionalString(input.channel) || 'email',
    status: asEnum(input.status, ['planned', 'scheduled', 'sent', 'blocked', 'failed', 'cancelled', 'archived'] as const, 'Le statut de relance est invalide.', 'status', errors),
  }
  return errors.length ? { success: false, errors } : { success: true, data }
})

export const angelcare360ReminderBlockedSchema = createSchema<Angelcare360ReminderBlockedInput>('reminder_blocked', (input) => {
  const errors: Angelcare360ValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'Le blocage de relance doit être un objet.' }] }
  const data: Angelcare360ReminderBlockedInput = {
    schoolId: asString(input.schoolId, 'L’établissement est requis.', 'schoolId', errors),
    id: asString(input.id, 'La relance est requise.', 'id', errors),
    reason: asString(input.reason, 'Le motif de blocage est obligatoire.', 'reason', errors),
  }
  return errors.length ? { success: false, errors } : { success: true, data }
})

export type Angelcare360ExpenseCreateInput = {
  schoolId: string
  academicYearId?: string | null
  expenseCode?: string | null
  expenseDate?: string | null
  category: string
  vendorName: string
  accountId?: string | null
  amount: number
  currency?: string | null
  paymentMethod?: string | null
  notes?: string | null
  status?: 'draft' | 'approved' | 'paid' | 'cancelled' | 'archived'
}
export type Angelcare360ExpenseUpdateInput = Angelcare360ExpenseCreateInput & { id: string }

export const angelcare360ExpenseCreateSchema = createSchema<Angelcare360ExpenseCreateInput>('expense_create', (input) => {
  const errors: Angelcare360ValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'La dépense doit être un objet.' }] }
  const data: Angelcare360ExpenseCreateInput = {
    schoolId: asString(input.schoolId, 'L’établissement est requis.', 'schoolId', errors),
    academicYearId: asOptionalString(input.academicYearId),
    expenseCode: asOptionalString(input.expenseCode),
    expenseDate: asDateString(input.expenseDate || new Date().toISOString().slice(0, 10), 'La date de dépense est invalide.', 'expenseDate', errors),
    category: asString(input.category, 'La catégorie de dépense est obligatoire.', 'category', errors),
    vendorName: asString(input.vendorName, 'Le fournisseur est obligatoire.', 'vendorName', errors),
    accountId: asOptionalString(input.accountId),
    amount: asRequiredPositiveNumber(input.amount, 'Le montant de la dépense doit être strictement positif.', 'amount', errors),
    currency: asOptionalString(input.currency) || 'MAD',
    paymentMethod: asOptionalString(input.paymentMethod) || 'cash',
    notes: asOptionalString(input.notes),
    status: asEnum(input.status, ['draft', 'approved', 'paid', 'cancelled', 'archived'] as const, 'Le statut de la dépense est invalide.', 'status', errors),
  }
  return errors.length ? { success: false, errors } : { success: true, data }
})

export const angelcare360ExpenseUpdateSchema = createSchema<Angelcare360ExpenseUpdateInput>('expense_update', (input) => {
  const result = angelcare360ExpenseCreateSchema.safeParse(input)
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'La dépense doit être un objet.' }] }
  if (!isNonEmptyString((input as Record<string, unknown>).id)) return { success: false, errors: [{ path: 'id', message: 'L’identifiant de la dépense est requis.' }] }
  return result.success ? { success: true, data: { ...(result.data as Angelcare360ExpenseCreateInput), id: String((input as Record<string, unknown>).id).trim() } } : result
})

export type Angelcare360FinanceAuditQueryInput = Angelcare360AuditFilterInput & {
  module?: string | null
  severity?: string | null
  entityType?: string | null
  entityId?: string | null
  search?: string | null
}

export const angelcare360FinanceAuditQueryFiltersSchema = createSchema<Angelcare360FinanceAuditQueryInput>('finance_audit_query', (input) => {
  const result = angelcare360AuditFilterSchema.safeParse(input)
  if (!result.success) return result
  const data = result.data as Angelcare360FinanceAuditQueryInput
  if (data.search && data.search.length > 200) {
    return { success: false, errors: [{ path: 'search', message: 'La recherche d’audit est trop longue.' }] }
  }
  return { success: true, data }
})
