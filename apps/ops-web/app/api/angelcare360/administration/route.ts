import { NextRequest, NextResponse } from 'next/server'
import {
  changeAngelcare360SchoolStatus,
  createAngelcare360AcademicYear,
  createAngelcare360Class,
  createAngelcare360Section,
  createAngelcare360School,
  createAngelcare360Term,
  createAngelcare360Subject,
  createAngelcare360TeacherAssignment,
  setAngelcare360ActiveAcademicYear,
  updateAngelcare360AcademicYear,
  updateAngelcare360Class,
  updateAngelcare360RolePermissions,
  updateAngelcare360School,
  updateAngelcare360SchoolSettings,
  updateAngelcare360Section,
  updateAngelcare360Term,
  updateAngelcare360Subject,
  updateAngelcare360TeacherAssignment,
} from '@/lib/angelcare360/server/administration'
import { Angelcare360AccessError, requireAngelcare360Permission } from '@/lib/angelcare360/server'

export const runtime = 'nodejs'

type AdminMutationBody = {
  entity?: string
  operation?: string
  id?: string
  payload?: Record<string, unknown>
}

function pickString(value: unknown) {
  return typeof value === 'string' ? value : null
}

function pickBoolean(value: unknown) {
  return typeof value === 'boolean' ? value : value === 'true'
}

function pickNumber(value: unknown) {
  if (typeof value === 'number') return value
  if (typeof value === 'string' && value.trim() !== '' && !Number.isNaN(Number(value))) return Number(value)
  return null
}

function normalizeSchoolPayload(body: AdminMutationBody) {
  const payload = body.payload || {}
  return {
    id: body.id || pickString(payload.id),
    schoolCode: pickString(payload.schoolCode) || pickString(payload.school_code) || '',
    name: pickString(payload.name) || '',
    schoolType: pickString(payload.schoolType) || pickString(payload.school_type) || 'ecole',
    city: pickString(payload.city),
    country: pickString(payload.country),
    address: pickString(payload.address),
    phone: pickString(payload.phone),
    email: pickString(payload.email),
    contactPrincipal: pickString(payload.contactPrincipal) || pickString(payload.contact_principal),
    currency: pickString(payload.currency),
    language: pickString(payload.language),
    timezone: pickString(payload.timezone),
    status: pickString(payload.status) || 'active',
    targetCapacity: pickNumber(payload.targetCapacity) || pickNumber(payload.target_capacity),
    notes: pickString(payload.notes),
  }
}

function normalizeAcademicYearPayload(body: AdminMutationBody) {
  const payload = body.payload || {}
  return {
    id: body.id || pickString(payload.id),
    schoolId: pickString(payload.schoolId) || pickString(payload.school_id) || '',
    yearCode: pickString(payload.yearCode) || pickString(payload.year_code) || '',
    label: pickString(payload.label) || '',
    startsOn: pickString(payload.startsOn) || pickString(payload.starts_on) || '',
    endsOn: pickString(payload.endsOn) || pickString(payload.ends_on) || '',
    status: pickString(payload.status) || 'planned',
    isCurrent: pickBoolean(payload.isCurrent ?? payload.is_current),
  }
}

function normalizeTermPayload(body: AdminMutationBody) {
  const payload = body.payload || {}
  return {
    id: body.id || pickString(payload.id),
    schoolId: pickString(payload.schoolId) || pickString(payload.school_id) || '',
    academicYearId: pickString(payload.academicYearId) || pickString(payload.academic_year_id) || '',
    termCode: pickString(payload.termCode) || pickString(payload.term_code) || '',
    label: pickString(payload.label) || '',
    termType: pickString(payload.termType) || pickString(payload.term_type),
    startsOn: pickString(payload.startsOn) || pickString(payload.starts_on) || '',
    endsOn: pickString(payload.endsOn) || pickString(payload.ends_on) || '',
    orderIndex: pickNumber(payload.orderIndex) || pickNumber(payload.order_index) || 1,
    status: pickString(payload.status) || 'planned',
  }
}

function normalizeClassPayload(body: AdminMutationBody) {
  const payload = body.payload || {}
  return {
    id: body.id || pickString(payload.id),
    schoolId: pickString(payload.schoolId) || pickString(payload.school_id) || '',
    academicYearId: pickString(payload.academicYearId) || pickString(payload.academic_year_id) || '',
    classCode: pickString(payload.classCode) || pickString(payload.class_code) || '',
    name: pickString(payload.name) || '',
    level: pickString(payload.level) || '',
    capacity: pickNumber(payload.capacity) || 0,
    orderIndex: pickNumber(payload.orderIndex) || pickNumber(payload.order_index) || 1,
    homeroomStaffId: pickString(payload.homeroomStaffId) || pickString(payload.homeroom_staff_id),
    description: pickString(payload.description),
    status: pickString(payload.status) || 'active',
  }
}

function normalizeSectionPayload(body: AdminMutationBody) {
  const payload = body.payload || {}
  return {
    id: body.id || pickString(payload.id),
    schoolId: pickString(payload.schoolId) || pickString(payload.school_id) || '',
    academicYearId: pickString(payload.academicYearId) || pickString(payload.academic_year_id) || '',
    classId: pickString(payload.classId) || pickString(payload.class_id) || '',
    sectionCode: pickString(payload.sectionCode) || pickString(payload.section_code) || '',
    name: pickString(payload.name) || '',
    capacity: pickNumber(payload.capacity) || 0,
    room: pickString(payload.room),
    mainTeacherId: pickString(payload.mainTeacherId) || pickString(payload.main_teacher_id),
    status: pickString(payload.status) || 'active',
  }
}

function normalizeSubjectPayload(body: AdminMutationBody) {
  const payload = body.payload || {}
  return {
    id: body.id || pickString(payload.id),
    schoolId: pickString(payload.schoolId) || pickString(payload.school_id) || '',
    subjectCode: pickString(payload.subjectCode) || pickString(payload.subject_code) || '',
    name: pickString(payload.name) || '',
    shortName: pickString(payload.shortName) || pickString(payload.short_name),
    department: pickString(payload.department),
    creditHours: pickNumber(payload.creditHours) || pickNumber(payload.credit_hours),
    linkedClassIds: Array.isArray(payload.linkedClassIds)
      ? payload.linkedClassIds.map(String)
      : Array.isArray(payload.linked_class_ids)
        ? payload.linked_class_ids.map(String)
        : [],
    status: pickString(payload.status) || 'active',
  }
}

function normalizeTeacherAssignmentPayload(body: AdminMutationBody) {
  const payload = body.payload || {}
  return {
    id: body.id || pickString(payload.id),
    schoolId: pickString(payload.schoolId) || pickString(payload.school_id) || '',
    academicYearId: pickString(payload.academicYearId) || pickString(payload.academic_year_id) || '',
    staffId: pickString(payload.staffId) || pickString(payload.staff_id) || '',
    classId: pickString(payload.classId) || pickString(payload.class_id),
    sectionId: pickString(payload.sectionId) || pickString(payload.section_id),
    subjectId: pickString(payload.subjectId) || pickString(payload.subject_id),
    assignmentRole: pickString(payload.assignmentRole) || pickString(payload.assignment_role) || 'teacher',
    weeklyHours: pickNumber(payload.weeklyHours) || pickNumber(payload.weekly_hours) || 0,
    assignedFrom: pickString(payload.assignedFrom) || pickString(payload.assigned_from),
    assignedTo: pickString(payload.assignedTo) || pickString(payload.assigned_to),
    status: pickString(payload.status) || 'active',
  }
}

function normalizeSchoolSettingsPayload(body: AdminMutationBody) {
  const payload = body.payload || {}
  return {
    schoolId: pickString(payload.schoolId) || pickString(payload.school_id) || '',
    defaultLanguage: pickString(payload.defaultLanguage) || pickString(payload.default_language) || 'fr',
    defaultCurrency: pickString(payload.defaultCurrency) || pickString(payload.default_currency) || 'MAD',
    defaultTimezone: pickString(payload.defaultTimezone) || pickString(payload.default_timezone) || 'Africa/Casablanca',
    academicYearStartMonth: pickNumber(payload.academicYearStartMonth) || pickNumber(payload.academic_year_start_month) || 9,
    weekStartDay: pickNumber(payload.weekStartDay) || pickNumber(payload.week_start_day) || 1,
    gradingScale: pickString(payload.gradingScale) || pickString(payload.grading_scale) || '0-20',
    attendanceGraceMinutes: pickNumber(payload.attendanceGraceMinutes) || pickNumber(payload.attendance_grace_minutes) || 10,
    allowParentPortal: pickBoolean(payload.allowParentPortal ?? payload.allow_parent_portal),
    allowStudentPortal: pickBoolean(payload.allowStudentPortal ?? payload.allow_student_portal),
    communicationSenderName: pickString(payload.communicationSenderName) || pickString(payload.communication_sender_name),
    schoolYearLabelFormat: pickString(payload.schoolYearLabelFormat) || pickString(payload.school_year_label_format) || 'YYYY-YYYY+1',
    status: pickString(payload.status) || 'active',
  }
}

function normalizeRolePermissionsPayload(body: AdminMutationBody) {
  const payload = body.payload || {}
  return {
    schoolId: pickString(payload.schoolId) || pickString(payload.school_id) || '',
    roleId: pickString(payload.roleId) || pickString(payload.role_id) || '',
    permissionKeys: Array.isArray(payload.permissionKeys)
      ? payload.permissionKeys.map(String)
      : Array.isArray(payload.permission_keys)
        ? payload.permission_keys.map(String)
        : [],
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => null)) as AdminMutationBody | null
    if (!body?.entity || !body.operation) {
      return NextResponse.json({ ok: false, error: 'La requête d’administration est incomplète.' }, { status: 422 })
    }

    const entity = body.entity
    const operation = body.operation

    if (entity === 'role-permissions') {
      await requireAngelcare360Permission('securite.configure')
      const result = await updateAngelcare360RolePermissions(normalizeRolePermissionsPayload(body))
      return NextResponse.json(result, { status: result.ok ? 200 : 400 })
    }

    if (entity === 'school-settings') {
      await requireAngelcare360Permission('parametres.update')
      const result = await updateAngelcare360SchoolSettings(normalizeSchoolSettingsPayload(body))
      return NextResponse.json(result, { status: result.ok ? 200 : 400 })
    }

    if (entity === 'etablissements') {
      if (operation === 'create') {
        const result = await createAngelcare360School(normalizeSchoolPayload(body))
        return NextResponse.json(result, { status: result.ok ? 200 : 400 })
      }
      if (operation === 'status') {
        const payload = normalizeSchoolPayload(body)
        const result = await changeAngelcare360SchoolStatus({ id: payload.id || '', status: payload.status as 'active' | 'inactive' | 'suspended' | 'archived' })
        return NextResponse.json(result, { status: result.ok ? 200 : 400 })
      }
      const result = await updateAngelcare360School(normalizeSchoolPayload(body))
      return NextResponse.json(result, { status: result.ok ? 200 : 400 })
    }

    if (entity === 'annees-scolaires') {
      if (operation === 'activate') {
        const payload = normalizeAcademicYearPayload(body)
        const result = await setAngelcare360ActiveAcademicYear({ schoolId: payload.schoolId, academicYearId: payload.id || '' })
        return NextResponse.json(result, { status: result.ok ? 200 : 400 })
      }
      if (operation === 'create') {
        const result = await createAngelcare360AcademicYear(normalizeAcademicYearPayload(body))
        return NextResponse.json(result, { status: result.ok ? 200 : 400 })
      }
      const result = await updateAngelcare360AcademicYear(normalizeAcademicYearPayload(body))
      return NextResponse.json(result, { status: result.ok ? 200 : 400 })
    }

    if (entity === 'periodes') {
      if (operation === 'create') {
        const result = await createAngelcare360Term(normalizeTermPayload(body))
        return NextResponse.json(result, { status: result.ok ? 200 : 400 })
      }
      const result = await updateAngelcare360Term(normalizeTermPayload(body))
      return NextResponse.json(result, { status: result.ok ? 200 : 400 })
    }

    if (entity === 'classes') {
      if (operation === 'create') {
        const result = await createAngelcare360Class(normalizeClassPayload(body))
        return NextResponse.json(result, { status: result.ok ? 200 : 400 })
      }
      if (operation === 'status') {
        const payload = normalizeClassPayload(body)
        const result = await updateAngelcare360Class({ ...payload, status: payload.status })
        return NextResponse.json(result, { status: result.ok ? 200 : 400 })
      }
      const result = await updateAngelcare360Class(normalizeClassPayload(body))
      return NextResponse.json(result, { status: result.ok ? 200 : 400 })
    }

    if (entity === 'sections') {
      if (operation === 'create') {
        const result = await createAngelcare360Section(normalizeSectionPayload(body))
        return NextResponse.json(result, { status: result.ok ? 200 : 400 })
      }
      const result = await updateAngelcare360Section(normalizeSectionPayload(body))
      return NextResponse.json(result, { status: result.ok ? 200 : 400 })
    }

    if (entity === 'matieres') {
      if (operation === 'create') {
        const result = await createAngelcare360Subject(normalizeSubjectPayload(body))
        return NextResponse.json(result, { status: result.ok ? 200 : 400 })
      }
      const result = await updateAngelcare360Subject(normalizeSubjectPayload(body))
      return NextResponse.json(result, { status: result.ok ? 200 : 400 })
    }

    if (entity === 'affectations') {
      if (operation === 'create') {
        const result = await createAngelcare360TeacherAssignment(normalizeTeacherAssignmentPayload(body))
        return NextResponse.json(result, { status: result.ok ? 200 : 400 })
      }
      const result = await updateAngelcare360TeacherAssignment(normalizeTeacherAssignmentPayload(body))
      return NextResponse.json(result, { status: result.ok ? 200 : 400 })
    }

    return NextResponse.json({ ok: false, error: 'Entité d’administration inconnue.' }, { status: 400 })
  } catch (error) {
    if (error instanceof Angelcare360AccessError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: error.status })
    }

    const message = error instanceof Error ? error.message : 'Erreur inattendue'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
