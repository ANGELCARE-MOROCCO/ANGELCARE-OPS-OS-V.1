import type { Angelcare360AuditEventInput } from '@/types/angelcare360/audit'
import type { Angelcare360AdmissionsAuditFilter } from '@/types/angelcare360/admissions'

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

  return value.trim()
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

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    errors.push({ path, message })
    return ''
  }

  return value.trim()
}

function asTimeString(value: unknown, message: string, path: string, errors: Angelcare360ValidationIssue[]) {
  if (!isNonEmptyString(value)) {
    errors.push({ path, message })
    return ''
  }

  const normalized = value.trim()
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
export type Angelcare360TransportRouteInput = SimpleDomainInput & { routeCode: string; label: string }
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

export const angelcare360TransportRouteSchema = buildSimpleSchema<Angelcare360TransportRouteInput>('transport_route', [
  ['schoolId', 'L’établissement est requis.', true],
  ['routeCode', 'Le code de la route est obligatoire.', true],
  ['label', 'Le libellé de la route est obligatoire.', true],
])

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
      ['requis', 'recu', 'validé', 'expire', 'archived'] as const,
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
