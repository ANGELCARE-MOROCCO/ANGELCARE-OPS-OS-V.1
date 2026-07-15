import { createClient } from '@/lib/supabase/server'
import { getAngelcare360AccessContext, requireAngelcare360Permission } from './context'
import { recordAngelcare360AuditEventServer } from './audit'
import {
  angelcare360DocumentReferenceSchema,
  angelcare360EmergencyContactSchema,
  angelcare360ParentPeopleSchema,
  angelcare360PeopleAuditFilterSchema,
  angelcare360StaffPeopleSchema,
  angelcare360StudentClassAssignmentSchema,
  angelcare360StudentParentLinkSchema,
  angelcare360StudentPeopleSchema,
} from '@/lib/angelcare360/validation'
import type {
  Angelcare360ClassEnrollmentRecord,
  Angelcare360DocumentListRecord,
  Angelcare360DocumentRecord,
  Angelcare360EmergencyContactListRecord,
  Angelcare360EmergencyContactRecord,
  Angelcare360PeopleAuditFilter,
  Angelcare360PeopleOverviewRecord,
  Angelcare360ParentListRecord,
  Angelcare360ParentRecord,
  Angelcare360StaffListRecord,
  Angelcare360StaffRecord,
  Angelcare360StudentListRecord,
  Angelcare360StudentParentLinkListRecord,
  Angelcare360StudentParentLinkRecord,
  Angelcare360StudentRecord,
  Angelcare360TeacherListRecord,
} from '@/types/angelcare360/people'
import type { Angelcare360AuditRecord } from '@/types/angelcare360/audit'

type SupabaseClient = Awaited<ReturnType<typeof createClient>>
type Angelcare360AccessContext = NonNullable<Awaited<ReturnType<typeof getAngelcare360AccessContext>>>
type Angelcare360AccessContextWithSchool = Angelcare360AccessContext & {
  school: NonNullable<Angelcare360AccessContext['school']>
}

type QueryCountResult = {
  count: number
}

function asString(value: unknown) {
  return typeof value === 'string' ? value : value ? String(value) : ''
}

function buildDetailHref(basePath: string, id: string) {
  return `${basePath}/${id}`
}

function textOfName(record: { full_name?: string | null; first_name?: string | null; last_name?: string | null } | null | undefined) {
  if (!record) return ''
  return record.full_name || [record.first_name, record.last_name].filter(Boolean).join(' ').trim()
}

function uniqueStrings(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value && String(value).trim()))))
}

async function getContextOrThrow(permissionKey?: string, schoolId?: string | null): Promise<Angelcare360AccessContextWithSchool> {
  if (permissionKey) {
    const context = await requireAngelcare360Permission(permissionKey, { schoolId })
    if (!context.school) {
      throw new Error('Aucun établissement actif n’est disponible.')
    }
    return context as Angelcare360AccessContextWithSchool
  }

  const context = await getAngelcare360AccessContext({ schoolId: schoolId || undefined })
  if (!context?.school) {
    throw new Error('Aucun établissement actif n’est disponible.')
  }
  return context as Angelcare360AccessContextWithSchool
}

async function countRows(client: SupabaseClient, table: string, schoolId?: string | null, filters?: Array<[string, 'eq' | 'gte' | 'lte' | 'in', unknown]>) {
  let query = client.from(table).select('id', { count: 'exact', head: true })
  if (schoolId) query = query.eq('school_id', schoolId)
  for (const [column, operator, value] of filters || []) {
    if (operator === 'eq') query = query.eq(column, value as never)
    if (operator === 'gte') query = query.gte(column, value as never)
    if (operator === 'lte') query = query.lte(column, value as never)
    if (operator === 'in' && Array.isArray(value)) query = query.in(column, value as never[])
  }
  const { count } = await query
  return count ?? 0
}

async function maybeAudit(input: Parameters<typeof recordAngelcare360AuditEventServer>[0], critical = false) {
  const result = await recordAngelcare360AuditEventServer(input)
  if (!result.ok && critical) {
    return result
  }
  return result
}

async function mapStudentRows(client: SupabaseClient, schoolId: string, academicYearId?: string | null) {
  const [
    studentsResponse,
    linksResponse,
    contactsResponse,
    documentsResponse,
    enrollmentsResponse,
  ] = await Promise.all([
    client
      .from('angelcare360_students')
      .select(`
        id,
        school_id,
        student_code,
        portal_app_user_id,
        first_name,
        last_name,
        full_name,
        gender,
        date_of_birth,
        national_id,
        current_class_id,
        current_section_id,
        admission_status,
        admission_date,
        exit_date,
        transport_required,
        status,
        metadata_json,
        created_at,
        updated_at,
        class:angelcare360_classes(id, name, class_code, level),
        section:angelcare360_sections(id, name, section_code)
      `)
      .eq('school_id', schoolId)
      .order('full_name', { ascending: true })
      .limit(300),
    client
      .from('angelcare360_student_parent_links')
      .select(`
        id,
        school_id,
        student_id,
        parent_id,
        relationship_type,
        is_primary,
        is_guardian,
        can_pickup,
        can_receive_messages,
        can_pay_fees,
        status,
        created_at,
        updated_at,
        parent:angelcare360_parents(id, parent_code, full_name, first_name, last_name, email, phone, status)
      `)
      .eq('school_id', schoolId)
      .eq('status', 'active'),
    client
      .from('angelcare360_emergency_contacts')
      .select('id, school_id, contactable_type, contactable_id, contact_name, relationship_type, phone, email, priority, status, metadata_json, created_at, updated_at')
      .eq('school_id', schoolId)
      .eq('contactable_type', 'student'),
    client
      .from('angelcare360_documents')
      .select('id, school_id, document_code, documentable_type, documentable_id, category, title, file_name, file_path, storage_provider, mime_type, file_size_bytes, visibility, status, metadata_json, created_at, updated_at')
      .eq('school_id', schoolId)
      .eq('documentable_type', 'student'),
    client
      .from('angelcare360_class_enrollments')
      .select(`
        id,
        school_id,
        academic_year_id,
        student_id,
        class_id,
        section_id,
        enrollment_number,
        enrollment_status,
        enrolled_on,
        left_on,
        status,
        metadata_json,
        created_at,
        updated_at,
        class:angelcare360_classes(id, name, class_code, level),
        section:angelcare360_sections(id, name, section_code)
      `)
      .eq('school_id', schoolId)
      .order('enrolled_on', { ascending: false }),
  ])

  const linksByStudent = new Map<string, Array<Record<string, unknown>>>()
  for (const link of linksResponse.data || []) {
    const current = linksByStudent.get(String((link as Record<string, unknown>).student_id)) || []
    current.push(link as Record<string, unknown>)
    linksByStudent.set(String((link as Record<string, unknown>).student_id), current)
  }

  const contactsByStudent = new Map<string, Array<Record<string, unknown>>>()
  for (const contact of contactsResponse.data || []) {
    const current = contactsByStudent.get(String((contact as Record<string, unknown>).contactable_id)) || []
    current.push(contact as Record<string, unknown>)
    contactsByStudent.set(String((contact as Record<string, unknown>).contactable_id), current)
  }

  const documentsByStudent = new Map<string, Array<Record<string, unknown>>>()
  for (const document of documentsResponse.data || []) {
    const current = documentsByStudent.get(String((document as Record<string, unknown>).documentable_id)) || []
    current.push(document as Record<string, unknown>)
    documentsByStudent.set(String((document as Record<string, unknown>).documentable_id), current)
  }

  const enrollmentsByStudent = new Map<string, Array<Record<string, unknown>>>()
  for (const enrollment of enrollmentsResponse.data || []) {
    if (academicYearId && String((enrollment as Record<string, unknown>).academic_year_id) !== academicYearId) continue
    const current = enrollmentsByStudent.get(String((enrollment as Record<string, unknown>).student_id)) || []
    current.push(enrollment as Record<string, unknown>)
    enrollmentsByStudent.set(String((enrollment as Record<string, unknown>).student_id), current)
  }

  return (((studentsResponse.data || []) as unknown) as Array<Record<string, unknown>>).map((student) => {
    const parents = (linksByStudent.get(String(student.id)) || []).map((link) => link.parent as Record<string, unknown> | undefined).filter(Boolean)
    const classRecord = (student.class as Record<string, unknown> | undefined) || null
    const sectionRecord = (student.section as Record<string, unknown> | undefined) || null
    const studentLinks = linksByStudent.get(String(student.id)) || []
    const studentContacts = contactsByStudent.get(String(student.id)) || []
    const studentDocuments = documentsByStudent.get(String(student.id)) || []
    const studentEnrollments = enrollmentsByStudent.get(String(student.id)) || []

    return {
      ...student,
      current_class_name: classRecord ? asString(classRecord.name) : null,
      current_class_code: classRecord ? asString(classRecord.class_code) : null,
      current_section_name: sectionRecord ? asString(sectionRecord.name) : null,
      current_section_code: sectionRecord ? asString(sectionRecord.section_code) : null,
      parent_count: parents.length,
      parent_names: uniqueStrings(parents.map((parent) => textOfName(parent))),
      emergency_contact_count: studentContacts.length,
      document_count: studentDocuments.length,
      enrollment_count: studentEnrollments.length,
      parent_links: studentLinks,
      emergency_contacts: studentContacts,
      documents: studentDocuments,
      enrollments: studentEnrollments,
      detail_href: buildDetailHref('/angelcare-360-command-center/eleves', String(student.id)),
    }
  }) as unknown as Angelcare360StudentListRecord[]
}

async function mapParentRows(client: SupabaseClient, schoolId: string) {
  const [parentsResponse, linksResponse, documentsResponse] = await Promise.all([
    client
      .from('angelcare360_parents')
      .select('id, school_id, parent_code, portal_app_user_id, first_name, last_name, full_name, email, phone, whatsapp, occupation, address, preferred_language, status, metadata_json, created_at, updated_at')
      .eq('school_id', schoolId)
      .order('full_name', { ascending: true })
      .limit(300),
    client
      .from('angelcare360_student_parent_links')
      .select(`
        id,
        school_id,
        student_id,
        parent_id,
        relationship_type,
        is_primary,
        status,
        student:angelcare360_students(id, student_code, full_name, first_name, last_name, status)
      `)
      .eq('school_id', schoolId)
      .eq('status', 'active'),
    client
      .from('angelcare360_documents')
      .select('id, school_id, document_code, documentable_type, documentable_id, category, title, file_name, file_path, storage_provider, mime_type, file_size_bytes, visibility, status, metadata_json, created_at, updated_at')
      .eq('school_id', schoolId)
      .eq('documentable_type', 'parent'),
  ])

  const linksByParent = new Map<string, Array<Record<string, unknown>>>()
  for (const link of linksResponse.data || []) {
    const current = linksByParent.get(String((link as Record<string, unknown>).parent_id)) || []
    current.push(link as Record<string, unknown>)
    linksByParent.set(String((link as Record<string, unknown>).parent_id), current)
  }

  const documentsByParent = new Map<string, Array<Record<string, unknown>>>()
  for (const document of documentsResponse.data || []) {
    const current = documentsByParent.get(String((document as Record<string, unknown>).documentable_id)) || []
    current.push(document as Record<string, unknown>)
    documentsByParent.set(String((document as Record<string, unknown>).documentable_id), current)
  }

  return (((parentsResponse.data || []) as unknown) as Array<Record<string, unknown>>).map((parent) => {
    const metadata = (parent.metadata_json as Record<string, unknown> | undefined) || {}
    const childrenLinks = linksByParent.get(String(parent.id)) || []
    const childNames = uniqueStrings(
      childrenLinks
        .map((link) => link.student as Record<string, unknown> | undefined)
        .filter(Boolean)
        .map((student) => textOfName(student)),
    )

    return {
      ...parent,
      relationship_type: asString(metadata.relationship_type || 'tuteur'),
      child_count: childNames.length,
      child_names: childNames,
      parent_links: childrenLinks,
      documents: documentsByParent.get(String(parent.id)) || [],
      detail_href: buildDetailHref('/angelcare-360-command-center/parents', String(parent.id)),
    }
  }) as unknown as Angelcare360ParentListRecord[]
}

async function mapStaffRows(client: SupabaseClient, schoolId: string, staffType?: string | null) {
  let query = client
    .from('angelcare360_staff')
    .select('id, school_id, staff_code, portal_app_user_id, staff_type, first_name, last_name, full_name, email, phone, hire_date, end_date, department, status, metadata_json, created_at, updated_at')
    .eq('school_id', schoolId)
    .order('full_name', { ascending: true })
    .limit(300)

  if (staffType) query = query.eq('staff_type', staffType)

  const [staffResponse, contractsResponse, assignmentsResponse, documentsResponse, contactsResponse] = await Promise.all([
    query,
    client
      .from('angelcare360_staff_contracts')
      .select('id, school_id, staff_id, contract_number, contract_type, starts_on, ends_on, employment_type, salary_amount, currency, workload_percent, status, metadata_json, created_at, updated_at')
      .eq('school_id', schoolId)
      .eq('status', 'active'),
    client
      .from('angelcare360_staff_assignments')
      .select(`
        id,
        school_id,
        academic_year_id,
        staff_id,
        class_id,
        section_id,
        subject_id,
        assignment_type,
        assigned_from,
        assigned_to,
        status,
        metadata_json,
        created_at,
        updated_at,
        class:angelcare360_classes(id, name, class_code),
        section:angelcare360_sections(id, name, section_code),
        subject:angelcare360_subjects(id, name, subject_code)
      `)
      .eq('school_id', schoolId)
      .eq('status', 'active'),
    client
      .from('angelcare360_documents')
      .select('id, school_id, document_code, documentable_type, documentable_id, category, title, file_name, file_path, storage_provider, mime_type, file_size_bytes, visibility, status, metadata_json, created_at, updated_at')
      .eq('school_id', schoolId)
      .eq('documentable_type', 'staff'),
    client
      .from('angelcare360_emergency_contacts')
      .select('id, school_id, contactable_type, contactable_id, contact_name, relationship_type, phone, email, priority, status, metadata_json, created_at, updated_at')
      .eq('school_id', schoolId)
      .eq('contactable_type', 'staff'),
  ])

  const contractsByStaff = new Map<string, Array<Record<string, unknown>>>()
  for (const contract of contractsResponse.data || []) {
    const current = contractsByStaff.get(String((contract as Record<string, unknown>).staff_id)) || []
    current.push(contract as Record<string, unknown>)
    contractsByStaff.set(String((contract as Record<string, unknown>).staff_id), current)
  }

  const assignmentsByStaff = new Map<string, Array<Record<string, unknown>>>()
  for (const assignment of assignmentsResponse.data || []) {
    const current = assignmentsByStaff.get(String((assignment as Record<string, unknown>).staff_id)) || []
    current.push(assignment as Record<string, unknown>)
    assignmentsByStaff.set(String((assignment as Record<string, unknown>).staff_id), current)
  }

  const documentsByStaff = new Map<string, Array<Record<string, unknown>>>()
  for (const document of documentsResponse.data || []) {
    const current = documentsByStaff.get(String((document as Record<string, unknown>).documentable_id)) || []
    current.push(document as Record<string, unknown>)
    documentsByStaff.set(String((document as Record<string, unknown>).documentable_id), current)
  }

  const contactsByStaff = new Map<string, Array<Record<string, unknown>>>()
  for (const contact of contactsResponse.data || []) {
    const current = contactsByStaff.get(String((contact as Record<string, unknown>).contactable_id)) || []
    current.push(contact as Record<string, unknown>)
    contactsByStaff.set(String((contact as Record<string, unknown>).contactable_id), current)
  }

  return (((staffResponse.data || []) as unknown) as Array<Record<string, unknown>>).map((staff) => {
    const assignments = assignmentsByStaff.get(String(staff.id)) || []
    const classes = uniqueStrings(
      assignments
        .map((assignment) => assignment.class as Record<string, unknown> | undefined)
        .filter(Boolean)
        .map((item) => textOfName(item)),
    )
    const subjects = uniqueStrings(
      assignments
        .map((assignment) => assignment.subject as Record<string, unknown> | undefined)
        .filter(Boolean)
        .map((item) => textOfName(item)),
    )

    return {
      ...staff,
      contract_count: (contractsByStaff.get(String(staff.id)) || []).length,
      assignment_count: assignments.length,
      class_names: classes,
      subject_names: subjects,
      documents: documentsByStaff.get(String(staff.id)) || [],
      emergency_contacts: contactsByStaff.get(String(staff.id)) || [],
      detail_href: buildDetailHref('/angelcare-360-command-center/personnel', String(staff.id)),
    }
  }) as unknown as Angelcare360StaffListRecord[]
}

async function mapEmergencyContacts(client: SupabaseClient, schoolId: string) {
  const [contactsResponse, studentsResponse, staffResponse] = await Promise.all([
    client
      .from('angelcare360_emergency_contacts')
      .select('id, school_id, contactable_type, contactable_id, contact_name, relationship_type, phone, email, priority, status, metadata_json, created_at, updated_at')
      .eq('school_id', schoolId)
      .order('priority', { ascending: true })
      .order('contact_name', { ascending: true }),
    client
      .from('angelcare360_students')
      .select('id, student_code, full_name')
      .eq('school_id', schoolId),
    client
      .from('angelcare360_staff')
      .select('id, staff_code, full_name')
      .eq('school_id', schoolId),
  ])

  const studentMap = new Map<string, Record<string, unknown>>((studentsResponse.data || []).map((row) => [String((row as Record<string, unknown>).id), row as Record<string, unknown>]))
  const staffMap = new Map<string, Record<string, unknown>>((staffResponse.data || []).map((row) => [String((row as Record<string, unknown>).id), row as Record<string, unknown>]))

  return ((contactsResponse.data || []) as Array<Record<string, unknown>>).map((contact) => {
    const linked = contact.contactable_type === 'student' ? studentMap.get(String(contact.contactable_id)) : staffMap.get(String(contact.contactable_id))
    return {
      ...contact,
      linked_person_name: linked ? textOfName(linked) : null,
      linked_person_code: linked ? asString(linked.student_code || linked.staff_code) : null,
      detail_href:
        contact.contactable_type === 'student'
          ? `/angelcare-360-command-center/eleves/${contact.contactable_id}`
          : `/angelcare-360-command-center/personnel/${contact.contactable_id}`,
    }
  }) as Angelcare360EmergencyContactListRecord[]
}

async function mapDocuments(client: SupabaseClient, schoolId: string) {
  const [documentsResponse, studentsResponse, parentsResponse, staffResponse] = await Promise.all([
    client
      .from('angelcare360_documents')
      .select('id, school_id, document_code, documentable_type, documentable_id, category, title, file_name, file_path, storage_provider, mime_type, file_size_bytes, visibility, status, uploaded_by, verified_by, verified_at, metadata_json, created_at, updated_at')
      .eq('school_id', schoolId)
      .order('created_at', { ascending: false })
      .limit(400),
    client.from('angelcare360_students').select('id, student_code, full_name').eq('school_id', schoolId),
    client.from('angelcare360_parents').select('id, parent_code, full_name').eq('school_id', schoolId),
    client.from('angelcare360_staff').select('id, staff_code, full_name').eq('school_id', schoolId),
  ])

  const studentMap = new Map<string, Record<string, unknown>>((studentsResponse.data || []).map((row) => [String((row as Record<string, unknown>).id), row as Record<string, unknown>]))
  const parentMap = new Map<string, Record<string, unknown>>((parentsResponse.data || []).map((row) => [String((row as Record<string, unknown>).id), row as Record<string, unknown>]))
  const staffMap = new Map<string, Record<string, unknown>>((staffResponse.data || []).map((row) => [String((row as Record<string, unknown>).id), row as Record<string, unknown>]))

  return ((documentsResponse.data || []) as Array<Record<string, unknown>>).map((document) => {
    const linked =
      document.documentable_type === 'student'
        ? studentMap.get(String(document.documentable_id))
        : document.documentable_type === 'parent'
          ? parentMap.get(String(document.documentable_id))
          : document.documentable_type === 'staff'
            ? staffMap.get(String(document.documentable_id))
            : null
    return {
      ...document,
      linked_person_name: linked ? textOfName(linked) : null,
      linked_person_code: linked ? asString(linked.student_code || linked.parent_code || linked.staff_code) : null,
      detail_href:
        document.documentable_type === 'student'
          ? `/angelcare-360-command-center/eleves/${document.documentable_id}`
          : document.documentable_type === 'parent'
            ? `/angelcare-360-command-center/parents/${document.documentable_id}`
            : document.documentable_type === 'staff'
              ? `/angelcare-360-command-center/personnel/${document.documentable_id}`
              : '/angelcare-360-command-center/personnes/documents',
    }
  }) as Angelcare360DocumentListRecord[]
}

async function mapClassEnrollments(client: SupabaseClient, schoolId: string) {
  const { data } = await client
    .from('angelcare360_class_enrollments')
    .select(`
      id,
      school_id,
      academic_year_id,
      student_id,
      class_id,
      section_id,
      enrollment_number,
      enrollment_status,
      enrolled_on,
      left_on,
      status,
      metadata_json,
      created_at,
      updated_at,
      student:angelcare360_students(id, student_code, full_name),
      class:angelcare360_classes(id, name, class_code),
      section:angelcare360_sections(id, name, section_code)
    `)
    .eq('school_id', schoolId)
    .order('enrolled_on', { ascending: false })
    .limit(300)

  return ((data || []) as Array<Record<string, unknown>>).map((enrollment) => ({
    ...enrollment,
    student_full_name: textOfName(enrollment.student as Record<string, unknown> | undefined),
    student_code: asString((enrollment.student as Record<string, unknown> | undefined)?.student_code),
    class_name: asString((enrollment.class as Record<string, unknown> | undefined)?.name),
    class_code: asString((enrollment.class as Record<string, unknown> | undefined)?.class_code),
    section_name: asString((enrollment.section as Record<string, unknown> | undefined)?.name),
    section_code: asString((enrollment.section as Record<string, unknown> | undefined)?.section_code),
    detail_href: buildDetailHref('/angelcare-360-command-center/eleves', String(enrollment.student_id)),
  })) as Angelcare360ClassEnrollmentRecord[]
}

async function mapStudentDetail(client: SupabaseClient, schoolId: string, studentId: string) {
  const [studentResponse, linksResponse, contactsResponse, documentsResponse, enrollmentsResponse, auditResponse] = await Promise.all([
    client
      .from('angelcare360_students')
      .select(`
        id,
        school_id,
        student_code,
        portal_app_user_id,
        first_name,
        last_name,
        full_name,
        gender,
        date_of_birth,
        national_id,
        current_class_id,
        current_section_id,
        admission_status,
        admission_date,
        exit_date,
        transport_required,
        status,
        metadata_json,
        created_at,
        updated_at,
        class:angelcare360_classes(id, name, class_code, level),
        section:angelcare360_sections(id, name, section_code)
      `)
      .eq('school_id', schoolId)
      .eq('id', studentId)
      .maybeSingle(),
    client
      .from('angelcare360_student_parent_links')
      .select(`
        id,
        school_id,
        student_id,
        parent_id,
        relationship_type,
        is_primary,
        is_guardian,
        can_pickup,
        can_receive_messages,
        can_pay_fees,
        status,
        created_at,
        updated_at,
        parent:angelcare360_parents(id, parent_code, full_name, first_name, last_name, email, phone, whatsapp, status)
      `)
      .eq('school_id', schoolId)
      .eq('student_id', studentId)
      .order('is_primary', { ascending: false }),
    client
      .from('angelcare360_emergency_contacts')
      .select('id, school_id, contactable_type, contactable_id, contact_name, relationship_type, phone, email, priority, status, metadata_json, created_at, updated_at')
      .eq('school_id', schoolId)
      .eq('contactable_type', 'student')
      .eq('contactable_id', studentId)
      .order('priority', { ascending: true }),
    client
      .from('angelcare360_documents')
      .select('id, school_id, document_code, documentable_type, documentable_id, category, title, file_name, file_path, storage_provider, mime_type, file_size_bytes, visibility, status, metadata_json, created_at, updated_at')
      .eq('school_id', schoolId)
      .eq('documentable_type', 'student')
      .eq('documentable_id', studentId)
      .order('created_at', { ascending: false }),
    client
      .from('angelcare360_class_enrollments')
      .select(`
        id,
        school_id,
        academic_year_id,
        student_id,
        class_id,
        section_id,
        enrollment_number,
        enrollment_status,
        enrolled_on,
        left_on,
        status,
        metadata_json,
        created_at,
        updated_at,
        class:angelcare360_classes(id, name, class_code, level),
        section:angelcare360_sections(id, name, section_code)
      `)
      .eq('school_id', schoolId)
      .eq('student_id', studentId)
      .order('enrolled_on', { ascending: false }),
    client
      .from('angelcare360_audit_logs')
      .select('id, school_id, actor_user_id, actor_role, module, action, entity_type, entity_id, severity, ip_address, user_agent, request_id, before_data, after_data, metadata, created_at')
      .eq('school_id', schoolId)
      .eq('entity_type', 'student')
      .eq('entity_id', studentId)
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  if (!studentResponse.data) return null
  const studentRow = studentResponse.data as Record<string, unknown>
  const studentClass = studentRow.class as Record<string, unknown> | undefined
  const studentSection = studentRow.section as Record<string, unknown> | undefined

  return {
    ...studentRow,
    class_name: asString(studentClass?.name),
    class_code: asString(studentClass?.class_code),
    section_name: asString(studentSection?.name),
    section_code: asString(studentSection?.section_code),
    parent_links: (linksResponse.data || []) as Array<Record<string, unknown>>,
    parents: ((linksResponse.data || []) as Array<Record<string, unknown>>).map((item) => item.parent).filter(Boolean),
    emergency_contacts: (contactsResponse.data || []) as Array<Record<string, unknown>>,
    documents: (documentsResponse.data || []) as Array<Record<string, unknown>>,
    enrollments: (enrollmentsResponse.data || []) as Array<Record<string, unknown>>,
    latest_audit_events: (auditResponse.data || []) as Angelcare360AuditRecord[],
  }
}

async function mapParentDetail(client: SupabaseClient, schoolId: string, parentId: string) {
  const [parentResponse, linksResponse, documentsResponse, auditResponse] = await Promise.all([
    client
      .from('angelcare360_parents')
      .select('id, school_id, parent_code, portal_app_user_id, first_name, last_name, full_name, email, phone, whatsapp, occupation, address, preferred_language, status, metadata_json, created_at, updated_at')
      .eq('school_id', schoolId)
      .eq('id', parentId)
      .maybeSingle(),
    client
      .from('angelcare360_student_parent_links')
      .select(`
        id,
        school_id,
        student_id,
        parent_id,
        relationship_type,
        is_primary,
        is_guardian,
        can_pickup,
        can_receive_messages,
        can_pay_fees,
        status,
        created_at,
        updated_at,
        student:angelcare360_students(id, student_code, full_name, first_name, last_name, status, current_class_id, current_section_id)
      `)
      .eq('school_id', schoolId)
      .eq('parent_id', parentId)
      .order('is_primary', { ascending: false }),
    client
      .from('angelcare360_documents')
      .select('id, school_id, document_code, documentable_type, documentable_id, category, title, file_name, file_path, storage_provider, mime_type, file_size_bytes, visibility, status, metadata_json, created_at, updated_at')
      .eq('school_id', schoolId)
      .eq('documentable_type', 'parent')
      .eq('documentable_id', parentId)
      .order('created_at', { ascending: false }),
    client
      .from('angelcare360_audit_logs')
      .select('id, school_id, actor_user_id, actor_role, module, action, entity_type, entity_id, severity, ip_address, user_agent, request_id, before_data, after_data, metadata, created_at')
      .eq('school_id', schoolId)
      .eq('entity_type', 'parent')
      .eq('entity_id', parentId)
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  if (!parentResponse.data) return null

  return {
    ...(parentResponse.data as Record<string, unknown>),
    relationship_type: asString(((parentResponse.data as Record<string, unknown>).metadata_json as Record<string, unknown> | undefined)?.relationship_type || 'tuteur'),
    child_links: (linksResponse.data || []) as Array<Record<string, unknown>>,
    children: ((linksResponse.data || []) as Array<Record<string, unknown>>).map((item) => item.student).filter(Boolean),
    documents: (documentsResponse.data || []) as Array<Record<string, unknown>>,
    latest_audit_events: (auditResponse.data || []) as Angelcare360AuditRecord[],
  }
}

async function mapStaffDetail(client: SupabaseClient, schoolId: string, staffId: string) {
  const [staffResponse, contractsResponse, assignmentsResponse, documentsResponse, contactsResponse, auditResponse] = await Promise.all([
    client
      .from('angelcare360_staff')
      .select('id, school_id, staff_code, portal_app_user_id, staff_type, first_name, last_name, full_name, email, phone, hire_date, end_date, department, status, metadata_json, created_at, updated_at')
      .eq('school_id', schoolId)
      .eq('id', staffId)
      .maybeSingle(),
    client
      .from('angelcare360_staff_contracts')
      .select('id, school_id, staff_id, contract_number, contract_type, starts_on, ends_on, employment_type, salary_amount, currency, workload_percent, status, metadata_json, created_at, updated_at')
      .eq('school_id', schoolId)
      .eq('staff_id', staffId)
      .order('starts_on', { ascending: false }),
    client
      .from('angelcare360_staff_assignments')
      .select(`
        id,
        school_id,
        academic_year_id,
        staff_id,
        class_id,
        section_id,
        subject_id,
        assignment_type,
        assigned_from,
        assigned_to,
        status,
        metadata_json,
        created_at,
        updated_at,
        class:angelcare360_classes(id, name, class_code),
        section:angelcare360_sections(id, name, section_code),
        subject:angelcare360_subjects(id, name, subject_code)
      `)
      .eq('school_id', schoolId)
      .eq('staff_id', staffId)
      .order('created_at', { ascending: false }),
    client
      .from('angelcare360_documents')
      .select('id, school_id, document_code, documentable_type, documentable_id, category, title, file_name, file_path, storage_provider, mime_type, file_size_bytes, visibility, status, metadata_json, created_at, updated_at')
      .eq('school_id', schoolId)
      .eq('documentable_type', 'staff')
      .eq('documentable_id', staffId)
      .order('created_at', { ascending: false }),
    client
      .from('angelcare360_emergency_contacts')
      .select('id, school_id, contactable_type, contactable_id, contact_name, relationship_type, phone, email, priority, status, metadata_json, created_at, updated_at')
      .eq('school_id', schoolId)
      .eq('contactable_type', 'staff')
      .eq('contactable_id', staffId)
      .order('priority', { ascending: true }),
    client
      .from('angelcare360_audit_logs')
      .select('id, school_id, actor_user_id, actor_role, module, action, entity_type, entity_id, severity, ip_address, user_agent, request_id, before_data, after_data, metadata, created_at')
      .eq('school_id', schoolId)
      .eq('entity_type', 'staff')
      .eq('entity_id', staffId)
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  if (!staffResponse.data) return null

  return {
    ...(staffResponse.data as Record<string, unknown>),
    contracts: (contractsResponse.data || []) as Array<Record<string, unknown>>,
    assignments: (assignmentsResponse.data || []) as Array<Record<string, unknown>>,
    documents: (documentsResponse.data || []) as Array<Record<string, unknown>>,
    emergency_contacts: (contactsResponse.data || []) as Array<Record<string, unknown>>,
    latest_audit_events: (auditResponse.data || []) as Angelcare360AuditRecord[],
  }
}

export async function getAngelcare360PeopleOverview(options?: { schoolId?: string | null }): Promise<Angelcare360PeopleOverviewRecord | null> {
  const context = await getAngelcare360AccessContext({ schoolId: options?.schoolId || undefined })
  if (!context?.school) return null

  const client = await createClient()
  const schoolId = context.school.id

  const [
    schoolCount,
    activeStudents,
    activeParents,
    activeTeachers,
    activeStaff,
    students,
    parents,
    staff,
    studentContacts,
    staffContacts,
    studentDocuments,
    parentDocuments,
    staffDocuments,
    enrollments,
    latestAuditEvents,
  ] = await Promise.all([
    countRows(client, 'angelcare360_schools'),
    countRows(client, 'angelcare360_students', schoolId, [['status', 'eq', 'active']]),
    countRows(client, 'angelcare360_parents', schoolId, [['status', 'eq', 'active']]),
    countRows(client, 'angelcare360_staff', schoolId, [['status', 'eq', 'active'], ['staff_type', 'eq', 'teacher']]),
    countRows(client, 'angelcare360_staff', schoolId, [['status', 'eq', 'active']]),
    client.from('angelcare360_students').select('id, date_of_birth, current_class_id, current_section_id, metadata_json').eq('school_id', schoolId).eq('status', 'active'),
    client.from('angelcare360_parents').select('id, email, phone, whatsapp, metadata_json').eq('school_id', schoolId).eq('status', 'active'),
    client.from('angelcare360_staff').select('id, email, phone, metadata_json').eq('school_id', schoolId).eq('status', 'active'),
    client.from('angelcare360_emergency_contacts').select('contactable_type, contactable_id').eq('school_id', schoolId).eq('contactable_type', 'student').eq('status', 'active'),
    client.from('angelcare360_emergency_contacts').select('contactable_type, contactable_id').eq('school_id', schoolId).eq('contactable_type', 'staff').eq('status', 'active'),
    client.from('angelcare360_documents').select('documentable_type, documentable_id').eq('school_id', schoolId).eq('documentable_type', 'student').eq('status', 'active'),
    client.from('angelcare360_documents').select('documentable_type, documentable_id').eq('school_id', schoolId).eq('documentable_type', 'parent').eq('status', 'active'),
    client.from('angelcare360_documents').select('documentable_type, documentable_id').eq('school_id', schoolId).eq('documentable_type', 'staff').eq('status', 'active'),
    client.from('angelcare360_class_enrollments').select('student_id').eq('school_id', schoolId).eq('status', 'active'),
    client
      .from('angelcare360_audit_logs')
      .select('id, school_id, actor_user_id, actor_role, module, action, entity_type, entity_id, severity, ip_address, user_agent, request_id, before_data, after_data, metadata, created_at')
      .eq('school_id', schoolId)
      .or('module.eq.eleves,module.eq.parents,module.eq.enseignants,module.eq.personnel,module.eq.personnes')
      .order('created_at', { ascending: false })
      .limit(8),
  ])

  const activeStudentRows = (students.data || []) as Array<Record<string, unknown>>
  const activeParentRows = (parents.data || []) as Array<Record<string, unknown>>
  const activeStaffRows = (staff.data || []) as Array<Record<string, unknown>>
  const studentContactIds = new Set(((studentContacts.data || []) as Array<Record<string, unknown>>).map((row) => String(row.contactable_id)))
  const staffContactIds = new Set(((staffContacts.data || []) as Array<Record<string, unknown>>).map((row) => String(row.contactable_id)))
  const studentDocumentIds = new Set(((studentDocuments.data || []) as Array<Record<string, unknown>>).map((row) => String(row.documentable_id)))
  const parentDocumentIds = new Set(((parentDocuments.data || []) as Array<Record<string, unknown>>).map((row) => String(row.documentable_id)))
  const staffDocumentIds = new Set(((staffDocuments.data || []) as Array<Record<string, unknown>>).map((row) => String(row.documentable_id)))
  const enrollmentIds = new Set(((enrollments.data || []) as Array<Record<string, unknown>>).map((row) => String(row.student_id)))

  const incompleteDossiers = [
    ...activeStudentRows.filter((student) => !student.date_of_birth || !student.current_class_id || !student.current_section_id),
    ...activeParentRows.filter((parent) => !parent.email && !parent.phone && !parent.whatsapp),
    ...activeStaffRows.filter((person) => !person.email && !person.phone),
  ].length

  const missingEmergencyContacts = activeStudentRows.filter((student) => !studentContactIds.has(String(student.id))).length + activeStaffRows.filter((person) => !staffContactIds.has(String(person.id))).length
  const missingDocuments = activeStudentRows.filter((student) => !studentDocumentIds.has(String(student.id))).length + activeParentRows.filter((parent) => !parentDocumentIds.has(String(parent.id))).length + activeStaffRows.filter((person) => !staffDocumentIds.has(String(person.id))).length
  const classAssignmentCoverage = activeStudentRows.length > 0 ? Math.round((enrollmentIds.size / activeStudentRows.length) * 100) : 0

  return {
    schoolCount,
    activeStudents,
    activeParents,
    activeTeachers,
    activeStaff,
    incompleteDossiers,
    missingEmergencyContacts,
    missingDocuments,
    classAssignmentCoverage,
    latestAuditEvents: (latestAuditEvents.data || []) as Angelcare360AuditRecord[],
  }
}

export async function listAngelcare360Students(options?: { schoolId?: string | null; academicYearId?: string | null }) {
  const context = await getContextOrThrow('eleves.view', options?.schoolId || undefined)
  const client = await createClient()
  return mapStudentRows(client, context.school.id, options?.academicYearId || context.academicYear?.id || null)
}

export async function getAngelcare360StudentById(studentId: string) {
  const context = await getContextOrThrow('eleves.view')
  const client = await createClient()
  return mapStudentDetail(client, context.school.id, studentId)
}

export async function createAngelcare360Student(input: unknown) {
  const parsed = angelcare360StudentPeopleSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.errors[0]?.message || 'Payload élève invalide.' }
  const context = await requireAngelcare360Permission('eleves.create', { schoolId: parsed.data.schoolId })
  const client = await createClient()
  const fullName = parsed.data.fullName?.trim() || `${parsed.data.firstName} ${parsed.data.lastName}`.trim()
  const payload = {
    school_id: context.school!.id,
    student_code: parsed.data.studentCode,
    portal_app_user_id: parsed.data.portalAppUserId || null,
    first_name: parsed.data.firstName,
    last_name: parsed.data.lastName,
    full_name: fullName,
    gender: parsed.data.gender || null,
    date_of_birth: parsed.data.dateOfBirth || null,
    national_id: parsed.data.nationalId || null,
    current_class_id: parsed.data.currentClassId || null,
    current_section_id: parsed.data.currentSectionId || null,
    admission_status: parsed.data.admissionStatus,
    status: parsed.data.status,
    transport_required: Boolean(parsed.data.transportRequired),
    admission_date: parsed.data.admissionStatus === 'enrolled' ? new Date().toISOString().slice(0, 10) : null,
    created_by: context.user.id,
    updated_by: context.user.id,
    metadata_json: {
      nationality: parsed.data.nationality || null,
      address: parsed.data.address || null,
      administrative_notes: parsed.data.administrativeNotes || null,
    },
  }

  const { data, error } = await client.from('angelcare360_students').insert(payload).select('id').single()
  if (error) return { ok: false, error: error.message }

  if (parsed.data.academicYearId && parsed.data.currentClassId) {
    await assignAngelcare360StudentToClass({
      schoolId: context.school!.id,
      studentId: String(data.id),
      academicYearId: parsed.data.academicYearId,
      classId: parsed.data.currentClassId,
      sectionId: parsed.data.currentSectionId || null,
      status: parsed.data.status,
    })
  }

  const audit = await maybeAudit({
    module: 'eleves',
    action: 'student.created',
    category: 'student',
    severity: 'notice',
    schoolId: context.school!.id,
    entityType: 'student',
    entityId: String(data.id),
    afterData: {
      ...parsed.data,
      fullName,
    },
  })
  if (!audit.ok && audit.persisted === false && audit.error) {
    return { ok: true, record: { id: String(data.id) }, warning: audit.error }
  }

  return { ok: true, record: { id: String(data.id) } }
}

export async function updateAngelcare360Student(input: unknown) {
  const parsed = angelcare360StudentPeopleSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.errors[0]?.message || 'Payload élève invalide.' }
  if (!parsed.data.id) return { ok: false, error: 'L’identifiant de l’élève est requis.' }
  const context = await requireAngelcare360Permission('eleves.update', { schoolId: parsed.data.schoolId })
  const client = await createClient()
  const before = await client.from('angelcare360_students').select('*').eq('school_id', context.school!.id).eq('id', parsed.data.id).maybeSingle()
  if (!before.data) return { ok: false, error: 'Élève introuvable.' }
  const fullName = parsed.data.fullName?.trim() || `${parsed.data.firstName} ${parsed.data.lastName}`.trim()

  const { error } = await client
    .from('angelcare360_students')
    .update({
      student_code: parsed.data.studentCode,
      first_name: parsed.data.firstName,
      last_name: parsed.data.lastName,
      full_name: fullName,
      gender: parsed.data.gender || null,
      date_of_birth: parsed.data.dateOfBirth || null,
      national_id: parsed.data.nationalId || null,
      current_class_id: parsed.data.currentClassId || null,
      current_section_id: parsed.data.currentSectionId || null,
      admission_status: parsed.data.admissionStatus,
      status: parsed.data.status,
      transport_required: Boolean(parsed.data.transportRequired),
      updated_by: context.user.id,
      metadata_json: {
        nationality: parsed.data.nationality || null,
        address: parsed.data.address || null,
        administrative_notes: parsed.data.administrativeNotes || null,
      },
      updated_at: new Date().toISOString(),
    })
    .eq('school_id', context.school!.id)
    .eq('id', parsed.data.id)

  if (error) return { ok: false, error: error.message }

  if (parsed.data.currentClassId && parsed.data.academicYearId) {
    await assignAngelcare360StudentToClass({
      schoolId: context.school!.id,
      studentId: parsed.data.id,
      academicYearId: parsed.data.academicYearId,
      classId: parsed.data.currentClassId,
      sectionId: parsed.data.currentSectionId || null,
      status: parsed.data.status,
    })
  }

  await maybeAudit({
    module: 'eleves',
    action: 'student.updated',
    category: 'student',
    severity: 'info',
    schoolId: context.school!.id,
    entityType: 'student',
    entityId: parsed.data.id,
    beforeData: before.data as Record<string, unknown>,
    afterData: {
      ...parsed.data,
      fullName,
    },
  })

  return { ok: true, record: { id: parsed.data.id } }
}

export async function changeAngelcare360StudentStatus(input: { schoolId?: string | null; id: string; status: 'active' | 'inactive' | 'archived' }) {
  const context = await requireAngelcare360Permission('eleves.update', { schoolId: input.schoolId || undefined })
  const client = await createClient()
  const before = await client.from('angelcare360_students').select('*').eq('school_id', context.school!.id).eq('id', input.id).maybeSingle()
  if (!before.data) return { ok: false, error: 'Élève introuvable.' }

  const { error } = await client
    .from('angelcare360_students')
    .update({
      status: input.status,
      exit_date: input.status === 'archived' ? new Date().toISOString().slice(0, 10) : null,
      updated_by: context.user.id,
      updated_at: new Date().toISOString(),
    })
    .eq('school_id', context.school!.id)
    .eq('id', input.id)

  if (error) return { ok: false, error: error.message }

  await maybeAudit({
    module: 'eleves',
    action: 'student.status_changed',
    category: 'student',
    severity: 'warning',
    schoolId: context.school!.id,
    entityType: 'student',
    entityId: input.id,
    beforeData: before.data as Record<string, unknown>,
    afterData: { status: input.status },
  }, true)

  return { ok: true, record: { id: input.id } }
}

export async function assignAngelcare360StudentToClass(input: unknown) {
  const parsed = angelcare360StudentClassAssignmentSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.errors[0]?.message || 'Affectation classe invalide.' }
  const context = await requireAngelcare360Permission('eleves.assign', { schoolId: parsed.data.schoolId })
  const client = await createClient()

  const [student, academicYear, classRow, sectionRow] = await Promise.all([
    client.from('angelcare360_students').select('id, school_id, current_class_id, current_section_id, status, full_name').eq('school_id', context.school!.id).eq('id', parsed.data.studentId).maybeSingle(),
    client.from('angelcare360_academic_years').select('id, school_id, label, status').eq('school_id', context.school!.id).eq('id', parsed.data.academicYearId).maybeSingle(),
    client.from('angelcare360_classes').select('id, school_id, academic_year_id, class_code, name, status').eq('school_id', context.school!.id).eq('id', parsed.data.classId).maybeSingle(),
    parsed.data.sectionId
      ? client.from('angelcare360_sections').select('id, school_id, academic_year_id, class_id, section_code, name, status').eq('school_id', context.school!.id).eq('id', parsed.data.sectionId).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ])

  if (!student.data) return { ok: false, error: 'Élève introuvable.' }
  if (!academicYear.data) return { ok: false, error: 'Année scolaire introuvable.' }
  if (!classRow.data) return { ok: false, error: 'Classe introuvable.' }
  if (String(classRow.data.academic_year_id) !== parsed.data.academicYearId) {
    return { ok: false, error: 'La classe ne correspond pas à l’année scolaire sélectionnée.' }
  }
  if (sectionRow.data && String((sectionRow.data as Record<string, unknown>).class_id) !== parsed.data.classId) {
    return { ok: false, error: 'La section ne correspond pas à la classe sélectionnée.' }
  }

  const beforeEnrollment = await client
    .from('angelcare360_class_enrollments')
    .select('*')
    .eq('school_id', context.school!.id)
    .eq('student_id', parsed.data.studentId)
    .eq('academic_year_id', parsed.data.academicYearId)
    .maybeSingle()

  const enrollmentPayload = {
    school_id: context.school!.id,
    academic_year_id: parsed.data.academicYearId,
    student_id: parsed.data.studentId,
    class_id: parsed.data.classId,
    section_id: parsed.data.sectionId || null,
    enrollment_number: parsed.data.enrollmentNumber || null,
    enrollment_status: 'enrolled',
    enrolled_on: new Date().toISOString().slice(0, 10),
    status: parsed.data.status,
    updated_by: context.user.id,
    created_by: context.user.id,
    metadata_json: {},
  }

  const { error: upsertError } = await client.from('angelcare360_class_enrollments').upsert(enrollmentPayload, {
    onConflict: 'student_id,academic_year_id',
  })
  if (upsertError) return { ok: false, error: upsertError.message }

  const { error: updateStudentError } = await client
    .from('angelcare360_students')
    .update({
      current_class_id: parsed.data.classId,
      current_section_id: parsed.data.sectionId || null,
      admission_status: 'enrolled',
      updated_by: context.user.id,
      updated_at: new Date().toISOString(),
    })
    .eq('school_id', context.school!.id)
    .eq('id', parsed.data.studentId)

  if (updateStudentError) return { ok: false, error: updateStudentError.message }

  await maybeAudit({
    module: 'eleves',
    action: 'student.class_assigned',
    category: 'student',
    severity: 'notice',
    schoolId: context.school!.id,
    entityType: 'student',
    entityId: parsed.data.studentId,
    beforeData: {
      student: student.data,
      enrollment: beforeEnrollment.data,
    },
    afterData: {
      classId: parsed.data.classId,
      sectionId: parsed.data.sectionId || null,
      academicYearId: parsed.data.academicYearId,
      enrollmentNumber: parsed.data.enrollmentNumber || null,
    },
  })

  return { ok: true, record: { id: parsed.data.studentId } }
}

export async function listAngelcare360Parents(options?: { schoolId?: string | null }) {
  const context = await getContextOrThrow('parents.view', options?.schoolId || undefined)
  const client = await createClient()
  return mapParentRows(client, context.school.id)
}

export async function getAngelcare360ParentById(parentId: string) {
  const context = await getContextOrThrow('parents.view')
  const client = await createClient()
  return mapParentDetail(client, context.school.id, parentId)
}

export async function createAngelcare360Parent(input: unknown) {
  const parsed = angelcare360ParentPeopleSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.errors[0]?.message || 'Payload parent invalide.' }
  const context = await requireAngelcare360Permission('parents.create', { schoolId: parsed.data.schoolId })
  const client = await createClient()
  const fullName = parsed.data.fullName?.trim() || `${parsed.data.firstName} ${parsed.data.lastName}`.trim()
  const payload = {
    school_id: context.school!.id,
    parent_code: parsed.data.parentCode,
    first_name: parsed.data.firstName,
    last_name: parsed.data.lastName,
    full_name: fullName,
    email: parsed.data.email || null,
    phone: parsed.data.phone || null,
    whatsapp: parsed.data.whatsapp || null,
    occupation: parsed.data.occupation || null,
    preferred_language: parsed.data.preferredLanguage || 'fr',
    address: parsed.data.address || null,
    status: parsed.data.status,
    created_by: context.user.id,
    updated_by: context.user.id,
    metadata_json: {
      relationship_type: parsed.data.relationshipType || null,
      secondary_phone: parsed.data.secondaryPhone || null,
      notes: parsed.data.administrativeNotes || null,
    },
  }

  const { data, error } = await client.from('angelcare360_parents').insert(payload).select('id').single()
  if (error) return { ok: false, error: error.message }

  await maybeAudit({
    module: 'parents',
    action: 'parent.created',
    category: 'parent',
    severity: 'notice',
    schoolId: context.school!.id,
    entityType: 'parent',
    entityId: String(data.id),
    afterData: {
      ...parsed.data,
      fullName,
    },
  })

  return { ok: true, record: { id: String(data.id) } }
}

export async function updateAngelcare360Parent(input: unknown) {
  const parsed = angelcare360ParentPeopleSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.errors[0]?.message || 'Payload parent invalide.' }
  if (!parsed.data.id) return { ok: false, error: 'L’identifiant du parent est requis.' }
  const context = await requireAngelcare360Permission('parents.update', { schoolId: parsed.data.schoolId })
  const client = await createClient()
  const before = await client.from('angelcare360_parents').select('*').eq('school_id', context.school!.id).eq('id', parsed.data.id).maybeSingle()
  if (!before.data) return { ok: false, error: 'Parent introuvable.' }
  const fullName = parsed.data.fullName?.trim() || `${parsed.data.firstName} ${parsed.data.lastName}`.trim()

  const { error } = await client
    .from('angelcare360_parents')
    .update({
      parent_code: parsed.data.parentCode,
      first_name: parsed.data.firstName,
      last_name: parsed.data.lastName,
      full_name: fullName,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
      whatsapp: parsed.data.whatsapp || null,
      occupation: parsed.data.occupation || null,
      preferred_language: parsed.data.preferredLanguage || 'fr',
      address: parsed.data.address || null,
      status: parsed.data.status,
      updated_by: context.user.id,
    metadata_json: {
      relationship_type: parsed.data.relationshipType || null,
      secondary_phone: parsed.data.secondaryPhone || null,
      notes: parsed.data.administrativeNotes || null,
    },
      updated_at: new Date().toISOString(),
    })
    .eq('school_id', context.school!.id)
    .eq('id', parsed.data.id)

  if (error) return { ok: false, error: error.message }

  await maybeAudit({
    module: 'parents',
    action: 'parent.updated',
    category: 'parent',
    severity: 'info',
    schoolId: context.school!.id,
    entityType: 'parent',
    entityId: parsed.data.id,
    beforeData: before.data as Record<string, unknown>,
    afterData: parsed.data as Record<string, unknown>,
  })

  return { ok: true, record: { id: parsed.data.id } }
}

export async function changeAngelcare360ParentStatus(input: { schoolId?: string | null; id: string; status: 'active' | 'inactive' | 'archived' }) {
  const context = await requireAngelcare360Permission('parents.update', { schoolId: input.schoolId || undefined })
  const client = await createClient()
  const before = await client.from('angelcare360_parents').select('*').eq('school_id', context.school!.id).eq('id', input.id).maybeSingle()
  if (!before.data) return { ok: false, error: 'Parent introuvable.' }

  const { error } = await client
    .from('angelcare360_parents')
    .update({
      status: input.status,
      updated_by: context.user.id,
      updated_at: new Date().toISOString(),
    })
    .eq('school_id', context.school!.id)
    .eq('id', input.id)

  if (error) return { ok: false, error: error.message }

  await maybeAudit({
    module: 'parents',
    action: 'parent.status_changed',
    category: 'parent',
    severity: 'warning',
    schoolId: context.school!.id,
    entityType: 'parent',
    entityId: input.id,
    beforeData: before.data as Record<string, unknown>,
    afterData: { status: input.status },
  }, true)

  return { ok: true, record: { id: input.id } }
}

export async function linkAngelcare360ParentToStudent(input: unknown) {
  const parsed = angelcare360StudentParentLinkSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.errors[0]?.message || 'Lien parent/enfant invalide.' }
  const context = await requireAngelcare360Permission('parents.update', { schoolId: parsed.data.schoolId })
  const client = await createClient()

  const before = await client
    .from('angelcare360_student_parent_links')
    .select('*')
    .eq('school_id', context.school!.id)
    .eq('student_id', parsed.data.studentId)
    .eq('parent_id', parsed.data.parentId)
    .maybeSingle()

  const { error } = await client.from('angelcare360_student_parent_links').upsert({
    school_id: context.school!.id,
    student_id: parsed.data.studentId,
    parent_id: parsed.data.parentId,
    relationship_type: parsed.data.relationshipType,
    is_primary: parsed.data.isPrimary,
    is_guardian: parsed.data.isGuardian,
    can_pickup: parsed.data.canPickup,
    can_receive_messages: parsed.data.canReceiveMessages,
    can_pay_fees: parsed.data.canPayFees,
    status: parsed.data.status,
    created_by: context.user.id,
    updated_by: context.user.id,
    metadata_json: {},
  }, {
    onConflict: 'student_id,parent_id',
  })

  if (error) return { ok: false, error: error.message }

  const action = before.data ? 'student_parent_link.updated' : 'student_parent_link.created'
  await maybeAudit({
    module: 'parents',
    action,
    category: 'parent',
    severity: before.data ? 'info' : 'notice',
    schoolId: context.school!.id,
    entityType: 'student_parent_link',
    entityId: String(before.data?.id || parsed.data.studentId),
    beforeData: (before.data as Record<string, unknown>) || {},
    afterData: parsed.data as Record<string, unknown>,
  })

  return { ok: true, record: { id: String(before.data?.id || parsed.data.studentId) } }
}

export async function unlinkAngelcare360ParentFromStudent(input: { schoolId?: string | null; studentId: string; parentId: string }) {
  const context = await requireAngelcare360Permission('parents.update', { schoolId: input.schoolId || undefined })
  const client = await createClient()
  const before = await client
    .from('angelcare360_student_parent_links')
    .select('*')
    .eq('school_id', context.school!.id)
    .eq('student_id', input.studentId)
    .eq('parent_id', input.parentId)
    .maybeSingle()

  if (!before.data) return { ok: false, error: 'Lien introuvable.' }

  const { error } = await client
    .from('angelcare360_student_parent_links')
    .update({
      status: 'archived',
      updated_by: context.user.id,
      updated_at: new Date().toISOString(),
    })
    .eq('school_id', context.school!.id)
    .eq('student_id', input.studentId)
    .eq('parent_id', input.parentId)

  if (error) return { ok: false, error: error.message }

  await maybeAudit({
    module: 'parents',
    action: 'student_parent_link.deleted',
    category: 'parent',
    severity: 'warning',
    schoolId: context.school!.id,
    entityType: 'student_parent_link',
    entityId: String(before.data.id),
    beforeData: before.data as Record<string, unknown>,
    afterData: { status: 'archived' },
  }, true)

  return { ok: true, record: { id: String(before.data.id) } }
}

export async function listAngelcare360Staff(options?: { schoolId?: string | null; staffType?: string | null }) {
  const context = await getContextOrThrow('personnel.view', options?.schoolId || undefined)
  const client = await createClient()
  return mapStaffRows(client, context.school.id, options?.staffType || null)
}

export async function listAngelcare360Teachers(options?: { schoolId?: string | null }) {
  const context = await getContextOrThrow('enseignants.view', options?.schoolId || undefined)
  const client = await createClient()
  return mapStaffRows(client, context.school.id, 'teacher')
}

export async function getAngelcare360StaffById(staffId: string) {
  const context = await getContextOrThrow('personnel.view')
  const client = await createClient()
  return mapStaffDetail(client, context.school.id, staffId)
}

export async function getAngelcare360TeacherById(staffId: string) {
  const context = await getContextOrThrow('enseignants.view')
  const client = await createClient()
  const detail = await mapStaffDetail(client, context.school.id, staffId)
  if (!detail) return null
  if (String((detail as Record<string, unknown>).staff_type || '') !== 'teacher') {
    return null
  }
  return detail
}

export async function createAngelcare360Staff(input: unknown) {
  const parsed = angelcare360StaffPeopleSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.errors[0]?.message || 'Payload personnel invalide.' }
  const permissionKey = parsed.data.staffType === 'teacher' ? 'enseignants.create' : 'personnel.create'
  const context = await requireAngelcare360Permission(permissionKey, { schoolId: parsed.data.schoolId })
  const client = await createClient()
  const fullName = parsed.data.fullName?.trim() || `${parsed.data.firstName} ${parsed.data.lastName}`.trim()
  const payload = {
    school_id: context.school!.id,
    staff_code: parsed.data.staffCode,
    portal_app_user_id: null,
    staff_type: parsed.data.staffType,
    first_name: parsed.data.firstName,
    last_name: parsed.data.lastName,
    full_name: fullName,
    email: parsed.data.email || null,
    phone: parsed.data.phone || null,
    hire_date: parsed.data.hireDate || null,
    end_date: parsed.data.endDate || null,
    department: parsed.data.department || null,
    status: parsed.data.status,
    created_by: context.user.id,
    updated_by: context.user.id,
    metadata_json: {
      speciality: parsed.data.speciality || null,
      contract_type: parsed.data.contractType || null,
      notes: parsed.data.administrativeNotes || null,
    },
  }

  const { data, error } = await client.from('angelcare360_staff').insert(payload).select('id').single()
  if (error) return { ok: false, error: error.message }

  const action = parsed.data.staffType === 'teacher' ? 'teacher.created' : 'staff.created'
  await maybeAudit({
    module: parsed.data.staffType === 'teacher' ? 'enseignants' : 'personnel',
    action,
    category: 'staff',
    severity: 'notice',
    schoolId: context.school!.id,
    entityType: 'staff',
    entityId: String(data.id),
    afterData: {
      ...parsed.data,
      fullName,
    },
  })

  return { ok: true, record: { id: String(data.id) } }
}

export async function updateAngelcare360Staff(input: unknown) {
  const parsed = angelcare360StaffPeopleSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.errors[0]?.message || 'Payload personnel invalide.' }
  if (!parsed.data.id) return { ok: false, error: 'L’identifiant du personnel est requis.' }
  const permissionKey = parsed.data.staffType === 'teacher' ? 'enseignants.update' : 'personnel.update'
  const context = await requireAngelcare360Permission(permissionKey, { schoolId: parsed.data.schoolId })
  const client = await createClient()
  const before = await client.from('angelcare360_staff').select('*').eq('school_id', context.school!.id).eq('id', parsed.data.id).maybeSingle()
  if (!before.data) return { ok: false, error: 'Personnel introuvable.' }
  const fullName = parsed.data.fullName?.trim() || `${parsed.data.firstName} ${parsed.data.lastName}`.trim()

  const { error } = await client
    .from('angelcare360_staff')
    .update({
      staff_code: parsed.data.staffCode,
      staff_type: parsed.data.staffType,
      first_name: parsed.data.firstName,
      last_name: parsed.data.lastName,
      full_name: fullName,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
      hire_date: parsed.data.hireDate || null,
      end_date: parsed.data.endDate || null,
      department: parsed.data.department || null,
      status: parsed.data.status,
      updated_by: context.user.id,
      metadata_json: {
        speciality: parsed.data.speciality || null,
        contract_type: parsed.data.contractType || null,
        notes: parsed.data.administrativeNotes || null,
      },
      updated_at: new Date().toISOString(),
    })
    .eq('school_id', context.school!.id)
    .eq('id', parsed.data.id)

  if (error) return { ok: false, error: error.message }

  await maybeAudit({
    module: parsed.data.staffType === 'teacher' ? 'enseignants' : 'personnel',
    action: parsed.data.staffType === 'teacher' ? 'teacher.updated' : 'staff.updated',
    category: 'staff',
    severity: 'info',
    schoolId: context.school!.id,
    entityType: 'staff',
    entityId: parsed.data.id,
    beforeData: before.data as Record<string, unknown>,
    afterData: parsed.data as Record<string, unknown>,
  })

  return { ok: true, record: { id: parsed.data.id } }
}

export async function changeAngelcare360StaffStatus(input: { schoolId?: string | null; id: string; status: 'active' | 'on_leave' | 'inactive' | 'archived' }) {
  const context = await requireAngelcare360Permission('personnel.update', { schoolId: input.schoolId || undefined })
  const client = await createClient()
  const before = await client.from('angelcare360_staff').select('*').eq('school_id', context.school!.id).eq('id', input.id).maybeSingle()
  if (!before.data) return { ok: false, error: 'Personnel introuvable.' }

  const { error } = await client
    .from('angelcare360_staff')
    .update({
      status: input.status,
      updated_by: context.user.id,
      updated_at: new Date().toISOString(),
    })
    .eq('school_id', context.school!.id)
    .eq('id', input.id)

  if (error) return { ok: false, error: error.message }

  await maybeAudit({
    module: String((before.data as Record<string, unknown>).staff_type || 'personnel') === 'teacher' ? 'enseignants' : 'personnel',
    action: String((before.data as Record<string, unknown>).staff_type || 'personnel') === 'teacher' ? 'teacher.status_changed' : 'staff.status_changed',
    category: 'staff',
    severity: 'warning',
    schoolId: context.school!.id,
    entityType: 'staff',
    entityId: input.id,
    beforeData: before.data as Record<string, unknown>,
    afterData: { status: input.status },
  }, true)

  return { ok: true, record: { id: input.id } }
}

export async function listAngelcare360EmergencyContacts(options?: { schoolId?: string | null }) {
  const context = await getAngelcare360AccessContext({ schoolId: options?.schoolId || undefined })
  if (!context?.school) throw new Error('Aucun établissement actif n’est disponible.')
  if (
    context.access.accessLevel !== 'super_admin' &&
    !context.permissions.has('eleves.view') &&
    !context.permissions.has('personnel.view')
  ) {
    throw new Error('Vous n’avez pas l’autorisation requise pour consulter les contacts d’urgence.')
  }
  const client = await createClient()
  return mapEmergencyContacts(client, context.school.id)
}

export async function createAngelcare360EmergencyContact(input: unknown) {
  const parsed = angelcare360EmergencyContactSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.errors[0]?.message || 'Payload contact d’urgence invalide.' }
  const permissionKey = parsed.data.contactableType === 'staff' ? 'personnel.update' : 'eleves.update'
  const context = await requireAngelcare360Permission(permissionKey, { schoolId: parsed.data.schoolId })
  const client = await createClient()
  const { data, error } = await client
    .from('angelcare360_emergency_contacts')
    .insert({
      school_id: context.school!.id,
      contactable_type: parsed.data.contactableType,
      contactable_id: parsed.data.contactableId,
      contact_name: parsed.data.contactName,
      relationship_type: parsed.data.relationshipType || null,
      phone: parsed.data.phone || null,
      email: parsed.data.email || null,
      priority: parsed.data.priority,
      status: parsed.data.status,
      created_by: context.user.id,
      updated_by: context.user.id,
      metadata_json: {
        notes: parsed.data.notes || null,
      },
    })
    .select('id')
    .single()

  if (error) return { ok: false, error: error.message }

  await maybeAudit({
    module: parsed.data.contactableType === 'staff' ? 'personnel' : 'eleves',
    action: 'emergency_contact.created',
    category: 'security',
    severity: 'notice',
    schoolId: context.school!.id,
    entityType: 'emergency_contact',
    entityId: String(data.id),
    afterData: parsed.data as Record<string, unknown>,
  })

  return { ok: true, record: { id: String(data.id) } }
}

export async function updateAngelcare360EmergencyContact(input: unknown) {
  const parsed = angelcare360EmergencyContactSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.errors[0]?.message || 'Payload contact d’urgence invalide.' }
  if (!parsed.data.id) return { ok: false, error: 'L’identifiant du contact est requis.' }
  const permissionKey = parsed.data.contactableType === 'staff' ? 'personnel.update' : 'eleves.update'
  const context = await requireAngelcare360Permission(permissionKey, { schoolId: parsed.data.schoolId })
  const client = await createClient()
  const before = await client.from('angelcare360_emergency_contacts').select('*').eq('school_id', context.school!.id).eq('id', parsed.data.id).maybeSingle()
  if (!before.data) return { ok: false, error: 'Contact introuvable.' }

  const { error } = await client
    .from('angelcare360_emergency_contacts')
    .update({
      contactable_type: parsed.data.contactableType,
      contactable_id: parsed.data.contactableId,
      contact_name: parsed.data.contactName,
      relationship_type: parsed.data.relationshipType || null,
      phone: parsed.data.phone || null,
      email: parsed.data.email || null,
      priority: parsed.data.priority,
      status: parsed.data.status,
      updated_by: context.user.id,
      metadata_json: {
        notes: parsed.data.notes || null,
      },
      updated_at: new Date().toISOString(),
    })
    .eq('school_id', context.school!.id)
    .eq('id', parsed.data.id)

  if (error) return { ok: false, error: error.message }

  await maybeAudit({
    module: parsed.data.contactableType === 'staff' ? 'personnel' : 'eleves',
    action: 'emergency_contact.updated',
    category: 'security',
    severity: 'info',
    schoolId: context.school!.id,
    entityType: 'emergency_contact',
    entityId: parsed.data.id,
    beforeData: before.data as Record<string, unknown>,
    afterData: parsed.data as Record<string, unknown>,
  })

  return { ok: true, record: { id: parsed.data.id } }
}

export async function listAngelcare360Documents(options?: { schoolId?: string | null }) {
  const context = await getContextOrThrow('documents.view', options?.schoolId || undefined)
  const client = await createClient()
  return mapDocuments(client, context.school.id)
}

export async function createAngelcare360DocumentReference(input: unknown) {
  const parsed = angelcare360DocumentReferenceSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.errors[0]?.message || 'Payload document invalide.' }
  const context = await requireAngelcare360Permission('documents.create', { schoolId: parsed.data.schoolId })
  const client = await createClient()
  const { data, error } = await client
    .from('angelcare360_documents')
    .insert({
      school_id: context.school!.id,
      document_code: parsed.data.documentCode,
      documentable_type: parsed.data.documentableType,
      documentable_id: parsed.data.documentableId,
      category: parsed.data.category,
      title: parsed.data.title,
      file_name: parsed.data.fileName || `${parsed.data.documentCode}.pdf`,
      file_path: parsed.data.filePath || `documents/${parsed.data.documentCode}.pdf`,
      storage_provider: 'supabase',
      visibility: parsed.data.visibility,
      status: parsed.data.status,
      created_by: context.user.id,
      updated_by: context.user.id,
      metadata_json: {
        document_state: parsed.data.documentState,
        expiry_date: parsed.data.expiryDate || null,
        notes: parsed.data.notes || null,
      },
    })
    .select('id')
    .single()

  if (error) return { ok: false, error: error.message }

  await maybeAudit({
    module: 'personnes',
    action: 'document.reference_created',
    category: 'documents',
    severity: 'notice',
    schoolId: context.school!.id,
    entityType: 'document',
    entityId: String(data.id),
    afterData: parsed.data as Record<string, unknown>,
  })

  return { ok: true, record: { id: String(data.id) } }
}

export async function updateAngelcare360DocumentStatus(input: unknown) {
  const parsed = angelcare360DocumentReferenceSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.errors[0]?.message || 'Payload document invalide.' }
  if (!parsed.data.id) return { ok: false, error: 'L’identifiant du document est requis.' }
  const context = await requireAngelcare360Permission('documents.update', { schoolId: parsed.data.schoolId })
  const client = await createClient()
  const before = await client.from('angelcare360_documents').select('*').eq('school_id', context.school!.id).eq('id', parsed.data.id).maybeSingle()
  if (!before.data) return { ok: false, error: 'Document introuvable.' }

  const { error } = await client
    .from('angelcare360_documents')
    .update({
      category: parsed.data.category,
      title: parsed.data.title,
      visibility: parsed.data.visibility,
      status: parsed.data.status,
      updated_by: context.user.id,
      metadata_json: {
        ...(before.data.metadata_json as Record<string, unknown> | undefined),
        document_state: parsed.data.documentState,
        expiry_date: parsed.data.expiryDate || null,
        notes: parsed.data.notes || null,
      },
      updated_at: new Date().toISOString(),
    })
    .eq('school_id', context.school!.id)
    .eq('id', parsed.data.id)

  if (error) return { ok: false, error: error.message }

  await maybeAudit({
    module: 'personnes',
    action: 'document.status_changed',
    category: 'documents',
    severity: 'info',
    schoolId: context.school!.id,
    entityType: 'document',
    entityId: parsed.data.id,
    beforeData: before.data as Record<string, unknown>,
    afterData: parsed.data as Record<string, unknown>,
  })

  return { ok: true, record: { id: parsed.data.id } }
}

export async function listAngelcare360StudentParentLinks(options?: { schoolId?: string | null }) {
  const context = await getContextOrThrow('parents.view', options?.schoolId || undefined)
  const client = await createClient()
  const [linksResponse, studentsResponse, parentsResponse] = await Promise.all([
    client
      .from('angelcare360_student_parent_links')
      .select(`
        id,
        school_id,
        student_id,
        parent_id,
        relationship_type,
        is_primary,
        is_guardian,
        can_pickup,
        can_receive_messages,
        can_pay_fees,
        status,
        created_at,
        updated_at,
        student:angelcare360_students(id, student_code, full_name),
        parent:angelcare360_parents(id, parent_code, full_name)
      `)
      .eq('school_id', context.school.id)
      .order('created_at', { ascending: false }),
    client.from('angelcare360_students').select('id, student_code, full_name').eq('school_id', context.school.id),
    client.from('angelcare360_parents').select('id, parent_code, full_name').eq('school_id', context.school.id),
  ])

  const studentMap = new Map<string, Record<string, unknown>>((studentsResponse.data || []).map((row) => [String((row as Record<string, unknown>).id), row as Record<string, unknown>]))
  const parentMap = new Map<string, Record<string, unknown>>((parentsResponse.data || []).map((row) => [String((row as Record<string, unknown>).id), row as Record<string, unknown>]))

  return ((linksResponse.data || []) as Array<Record<string, unknown>>).map((link) => {
    const student = link.student as Record<string, unknown> | undefined || studentMap.get(String(link.student_id))
    const parent = link.parent as Record<string, unknown> | undefined || parentMap.get(String(link.parent_id))
    return {
      ...link,
      student_full_name: student ? textOfName(student) : null,
      student_code: student ? asString(student.student_code) : null,
      parent_full_name: parent ? textOfName(parent) : null,
      parent_code: parent ? asString(parent.parent_code) : null,
      detail_href: `/angelcare-360-command-center/eleves/${link.student_id}`,
    }
  }) as Angelcare360StudentParentLinkListRecord[]
}

export async function listAngelcare360ClassEnrollments(options?: { schoolId?: string | null; academicYearId?: string | null }) {
  const context = await getContextOrThrow('classes.view', options?.schoolId || undefined)
  const client = await createClient()
  let query = client
    .from('angelcare360_class_enrollments')
    .select(`
      id,
      school_id,
      academic_year_id,
      student_id,
      class_id,
      section_id,
      enrollment_number,
      enrollment_status,
      enrolled_on,
      left_on,
      status,
      metadata_json,
      created_at,
      updated_at,
      student:angelcare360_students(id, student_code, full_name),
      class:angelcare360_classes(id, name, class_code),
      section:angelcare360_sections(id, name, section_code)
    `)
    .eq('school_id', context.school.id)
    .order('enrolled_on', { ascending: false })

  if (options?.academicYearId || context.academicYear?.id) {
    query = query.eq('academic_year_id', options?.academicYearId || context.academicYear?.id || '')
  }

  const { data } = await query
  return ((data || []) as Array<Record<string, unknown>>).map((enrollment) => ({
    ...enrollment,
    student_full_name: textOfName(enrollment.student as Record<string, unknown> | undefined),
    student_code: asString((enrollment.student as Record<string, unknown> | undefined)?.student_code),
    class_name: asString((enrollment.class as Record<string, unknown> | undefined)?.name),
    class_code: asString((enrollment.class as Record<string, unknown> | undefined)?.class_code),
    section_name: asString((enrollment.section as Record<string, unknown> | undefined)?.name),
    section_code: asString((enrollment.section as Record<string, unknown> | undefined)?.section_code),
    detail_href: `/angelcare-360-command-center/eleves/${enrollment.student_id}`,
  })) as Angelcare360ClassEnrollmentRecord[]
}

export async function listAngelcare360PeopleAuditEvents(filters?: Angelcare360PeopleAuditFilter) {
  const parsed = angelcare360PeopleAuditFilterSchema.safeParse(filters || {})
  const query = parsed.success ? parsed.data : null
  const context = await getAngelcare360AccessContext()
  if (!context?.school) return []

  const client = await createClient()
  let request = client
    .from('angelcare360_audit_logs')
    .select('id, school_id, actor_user_id, actor_role, module, action, entity_type, entity_id, severity, ip_address, user_agent, request_id, before_data, after_data, metadata, created_at')
    .eq('school_id', context.school.id)
    .or('module.eq.eleves,module.eq.parents,module.eq.enseignants,module.eq.personnel,module.eq.personnes')
    .order('created_at', { ascending: false })
    .limit(200)

  if (query?.search) {
    request = request.or(
      `module.ilike.%${query.search}%,action.ilike.%${query.search}%,entity_type.ilike.%${query.search}%,request_id.ilike.%${query.search}%`,
    )
  }
  if (query?.module) request = request.eq('module', query.module)
  if (query?.action) request = request.eq('action', query.action)
  if (query?.severity) request = request.eq('severity', query.severity)
  if (query?.entityType) request = request.eq('entity_type', query.entityType)
  if (query?.actorRole) request = request.eq('actor_role', query.actorRole)
  if (query?.from) request = request.gte('created_at', query.from)
  if (query?.to) request = request.lte('created_at', query.to)

  const { data } = await request
  return (data || []) as Angelcare360AuditRecord[]
}

export async function getAngelcare360PeopleAuditEventDetail(eventId: string) {
  const context = await getAngelcare360AccessContext()
  if (!context?.school) return null
  const client = await createClient()
  const { data } = await client
    .from('angelcare360_audit_logs')
    .select('id, school_id, actor_user_id, actor_role, module, action, entity_type, entity_id, severity, ip_address, user_agent, request_id, before_data, after_data, metadata, created_at')
    .eq('school_id', context.school.id)
    .eq('id', eventId)
    .maybeSingle()
  return data ?? null
}
