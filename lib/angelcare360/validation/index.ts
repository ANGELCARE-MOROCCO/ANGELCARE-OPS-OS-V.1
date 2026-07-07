import type { Angelcare360AuditEventInput } from '@/types/angelcare360/audit'

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

export const angelcare360AttendanceRecordSchema = buildSimpleSchema<Angelcare360AttendanceRecordInput>('attendance_record', [
  ['schoolId', 'L’établissement est requis.', true],
  ['attendanceSessionId', 'La session de présence est requise.', true],
  ['studentId', 'L’élève est requis.', true],
  ['attendanceStatus', 'Le statut de présence est obligatoire.', true],
])

export const angelcare360TimetableSlotSchema = buildSimpleSchema<Angelcare360TimetableSlotInput>('timetable_slot', [
  ['schoolId', 'L’établissement est requis.', true],
  ['academicYearId', 'L’année scolaire est requise.', true],
  ['classId', 'La classe est requise.', true],
  ['subjectId', 'La matière est requise.', true],
  ['startTime', 'L’heure de début est obligatoire.', true],
  ['endTime', 'L’heure de fin est obligatoire.', true],
])

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
