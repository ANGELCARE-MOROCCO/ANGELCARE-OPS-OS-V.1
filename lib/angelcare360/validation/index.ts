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
  return fallback
}

function asOptionalNumber(value: unknown, fallback = 0) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '' && !Number.isNaN(Number(value))) {
    return Number(value)
  }
  return fallback
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

