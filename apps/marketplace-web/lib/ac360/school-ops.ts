import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/getUser'
import { getAc360CurrentContext } from './runtime'

export type Ac360SchoolOpsResource =
  | 'students'
  | 'guardians'
  | 'staff'
  | 'classes'
  | 'enrollments'
  | 'attendance'
  | 'invoices'
  | 'documents'
  | 'messages'
  | 'reports'
  | 'tasks'

export type Ac360SchoolOpsConfig = {
  resource: Ac360SchoolOpsResource
  table: string
  orderColumn: string
  defaultSelect?: string
  wiringKey?: string
  capacityKey?: string
}

export const AC360_SCHOOL_OPS_RESOURCES: Record<Ac360SchoolOpsResource, Ac360SchoolOpsConfig> = {
  students: { resource: 'students', table: 'ac360_school_students', orderColumn: 'created_at', wiringKey: 'ac360.school_ops.student.create', capacityKey: 'students' },
  guardians: { resource: 'guardians', table: 'ac360_school_guardians', orderColumn: 'created_at', wiringKey: 'ac360.school_ops.guardian.create' },
  staff: { resource: 'staff', table: 'ac360_school_staff_profiles', orderColumn: 'created_at', wiringKey: 'ac360.school_ops.staff.create', capacityKey: 'staff_users' },
  classes: { resource: 'classes', table: 'ac360_school_classes', orderColumn: 'created_at', wiringKey: 'ac360.school_ops.class.create', capacityKey: 'classes' },
  enrollments: { resource: 'enrollments', table: 'ac360_school_class_enrollments', orderColumn: 'created_at', wiringKey: 'ac360.school_ops.enrollment.create' },
  attendance: { resource: 'attendance', table: 'ac360_school_attendance_records', orderColumn: 'recorded_at', wiringKey: 'ac360.school_ops.attendance.record' },
  invoices: { resource: 'invoices', table: 'ac360_school_tuition_invoices', orderColumn: 'created_at', wiringKey: 'ac360.school_ops.invoice.create' },
  documents: { resource: 'documents', table: 'ac360_school_documents', orderColumn: 'created_at', wiringKey: 'ac360.school_ops.document.upload', capacityKey: 'storage_gb' },
  messages: { resource: 'messages', table: 'ac360_school_messages', orderColumn: 'created_at', wiringKey: 'ac360.school_ops.message.send' },
  reports: { resource: 'reports', table: 'ac360_school_report_jobs', orderColumn: 'created_at', wiringKey: 'ac360.school_ops.report.generate' },
  tasks: { resource: 'tasks', table: 'ac360_school_tasks', orderColumn: 'created_at', wiringKey: 'ac360.school_ops.task.create' },
}

function normalizeText(value: unknown, fallback = '') {
  const text = String(value ?? '').trim()
  return text || fallback
}

function normalizeNumber(value: unknown, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function cleanMetadata(value: unknown) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function compact<T extends Record<string, unknown>>(value: T): T {
  const copy: Record<string, unknown> = {}
  for (const [key, item] of Object.entries(value)) {
    if (item !== undefined) copy[key] = item
  }
  return copy as T
}

function makeCode(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`.toUpperCase()
}

export function resolveAc360SchoolOpsResource(resource: string): Ac360SchoolOpsConfig | null {
  return (AC360_SCHOOL_OPS_RESOURCES as Record<string, Ac360SchoolOpsConfig>)[resource] || null
}

export async function resolveAc360SchoolOpsContext(orgId?: string) {
  const context = await getAc360CurrentContext(orgId)
  if (!context.ok) return { ok: false as const, status: 500, error: context.error || 'Unable to resolve AC360 context.', context }
  if (!context.context?.org?.id) return { ok: false as const, status: 400, error: 'No AC360 organization context found. Bootstrap AC360 first.', context }
  return { ok: true as const, status: 200, orgId: context.context.org.id as string, context }
}

export async function getAc360SchoolCapacity(orgId: string, capacityKey?: string) {
  if (!capacityKey) return null
  const db = await createClient()
  const { data, error } = await db.rpc('ac360_school_current_capacity', { p_org_id: orgId, p_capacity_key: capacityKey } as any)
  if (error) return null
  const parsed = Number(data)
  return Number.isFinite(parsed) ? parsed : null
}

export async function getAc360SchoolOpsSummary(orgId?: string) {
  const resolved = await resolveAc360SchoolOpsContext(orgId)
  if (!resolved.ok) return resolved
  const db = await createClient()
  const { data, error } = await db.rpc('ac360_school_ops_readiness_dashboard', { p_org_id: resolved.orgId } as any)
  if (error) return { ok: false as const, status: 500, error: error.message || 'Unable to load AC360 school operations readiness.', context: resolved.context }
  return { ok: true as const, context: resolved.context, readiness: data }
}

export async function bootstrapAc360SchoolOps(orgId?: string, metadata: Record<string, unknown> = {}) {
  const resolved = await resolveAc360SchoolOpsContext(orgId)
  if (!resolved.ok) return resolved
  const user = await getCurrentUser().catch(() => null) as any
  const db = await createClient()
  const { data, error } = await db.rpc('ac360_bootstrap_school_ops_skeleton', {
    p_org_id: resolved.orgId,
    p_actor_app_user_id: user?.id || null,
    p_metadata: metadata,
  } as any)
  if (error) return { ok: false as const, status: 500, error: error.message || 'Unable to bootstrap AC360 school operations skeleton.' }
  return { ok: true as const, data, context: resolved.context }
}

export async function listAc360SchoolOpsRecords(resource: Ac360SchoolOpsResource, orgId?: string, limit = 100) {
  const resolved = await resolveAc360SchoolOpsContext(orgId)
  if (!resolved.ok) return resolved
  const config = AC360_SCHOOL_OPS_RESOURCES[resource]
  const db = await createClient()
  const { data, error } = await db
    .from(config.table)
    .select('*')
    .eq('org_id', resolved.orgId)
    .order(config.orderColumn, { ascending: false })
    .limit(Math.min(Math.max(Number(limit) || 100, 1), 500)) as any

  if (error) return { ok: false as const, status: 500, error: error.message || `Unable to list ${resource}.` }
  return { ok: true as const, resource, records: data || [], context: resolved.context }
}

function buildStudentPayload(body: Record<string, unknown>, orgId: string, actorId?: string | null) {
  return compact({
    org_id: orgId,
    campus_id: body.campusId || body.campus_id || null,
    academic_year_id: body.academicYearId || body.academic_year_id || null,
    student_code: normalizeText(body.studentCode || body.student_code, makeCode('STU')),
    first_name: normalizeText(body.firstName || body.first_name || body.name, 'Nouveau'),
    last_name: normalizeText(body.lastName || body.last_name, ''),
    preferred_name: body.preferredName || body.preferred_name || null,
    date_of_birth: body.dateOfBirth || body.date_of_birth || null,
    gender: body.gender || null,
    enrollment_status: normalizeText(body.enrollmentStatus || body.enrollment_status, 'enrolled'),
    status: normalizeText(body.status, 'active'),
    joined_on: body.joinedOn || body.joined_on || new Date().toISOString().slice(0, 10),
    primary_language: normalizeText(body.primaryLanguage || body.primary_language, 'fr'),
    health_notes: body.healthNotes || body.health_notes || null,
    allergies: body.allergies || null,
    emergency_notes: body.emergencyNotes || body.emergency_notes || null,
    billing_status: normalizeText(body.billingStatus || body.billing_status, 'billable'),
    source_channel: normalizeText(body.sourceChannel || body.source_channel, 'manual'),
    created_by: actorId || null,
    metadata_json: cleanMetadata(body.metadata || body.metadata_json),
  })
}

function buildGuardianPayload(body: Record<string, unknown>, orgId: string) {
  return compact({
    org_id: orgId,
    campus_id: body.campusId || body.campus_id || null,
    guardian_code: normalizeText(body.guardianCode || body.guardian_code, makeCode('PAR')),
    full_name: normalizeText(body.fullName || body.full_name || body.name, 'Parent / Tuteur'),
    relation_label: body.relationLabel || body.relation_label || 'guardian',
    phone: body.phone || null,
    whatsapp: body.whatsapp || body.phone || null,
    email: body.email || null,
    preferred_channel: normalizeText(body.preferredChannel || body.preferred_channel, 'whatsapp'),
    portal_status: normalizeText(body.portalStatus || body.portal_status, 'not_invited'),
    status: normalizeText(body.status, 'active'),
    metadata_json: cleanMetadata(body.metadata || body.metadata_json),
  })
}

function buildStaffPayload(body: Record<string, unknown>, orgId: string, actorId?: string | null) {
  return compact({
    org_id: orgId,
    campus_id: body.campusId || body.campus_id || null,
    membership_id: body.membershipId || body.membership_id || null,
    staff_code: normalizeText(body.staffCode || body.staff_code, makeCode('STAFF')),
    full_name: normalizeText(body.fullName || body.full_name || body.name, 'Nouveau collaborateur'),
    email: body.email || null,
    phone: body.phone || null,
    staff_type: normalizeText(body.staffType || body.staff_type, 'staff'),
    department: body.department || null,
    role_label: body.roleLabel || body.role_label || null,
    employment_status: normalizeText(body.employmentStatus || body.employment_status, 'active'),
    status: normalizeText(body.status, 'active'),
    started_on: body.startedOn || body.started_on || new Date().toISOString().slice(0, 10),
    shift_profile_json: cleanMetadata(body.shiftProfile || body.shift_profile_json),
    created_by: actorId || null,
    metadata_json: cleanMetadata(body.metadata || body.metadata_json),
  })
}

function buildClassPayload(body: Record<string, unknown>, orgId: string) {
  return compact({
    org_id: orgId,
    campus_id: body.campusId || body.campus_id || null,
    academic_year_id: body.academicYearId || body.academic_year_id || null,
    class_code: normalizeText(body.classCode || body.class_code, makeCode('CLS')),
    name: normalizeText(body.name || body.className || body.class_name, 'Nouvelle classe'),
    level_label: body.levelLabel || body.level_label || null,
    age_band: body.ageBand || body.age_band || null,
    capacity_students: body.capacityStudents || body.capacity_students || null,
    main_teacher_staff_id: body.mainTeacherStaffId || body.main_teacher_staff_id || null,
    status: normalizeText(body.status, 'active'),
    metadata_json: cleanMetadata(body.metadata || body.metadata_json),
  })
}

function buildEnrollmentPayload(body: Record<string, unknown>, orgId: string) {
  return compact({
    org_id: orgId,
    student_id: body.studentId || body.student_id,
    class_id: body.classId || body.class_id,
    academic_year_id: body.academicYearId || body.academic_year_id || null,
    status: normalizeText(body.status, 'active'),
    starts_on: body.startsOn || body.starts_on || new Date().toISOString().slice(0, 10),
    ends_on: body.endsOn || body.ends_on || null,
    metadata_json: cleanMetadata(body.metadata || body.metadata_json),
  })
}

function buildAttendancePayload(body: Record<string, unknown>, orgId: string, actorId?: string | null) {
  return compact({
    org_id: orgId,
    attendance_session_id: body.attendanceSessionId || body.attendance_session_id || null,
    student_id: body.studentId || body.student_id || null,
    staff_profile_id: body.staffProfileId || body.staff_profile_id || null,
    attendance_type: normalizeText(body.attendanceType || body.attendance_type, body.staffProfileId || body.staff_profile_id ? 'staff' : 'student'),
    attendance_status: normalizeText(body.attendanceStatus || body.attendance_status, 'present'),
    recorded_at: body.recordedAt || body.recorded_at || new Date().toISOString(),
    check_in_at: body.checkInAt || body.check_in_at || null,
    check_out_at: body.checkOutAt || body.check_out_at || null,
    reason: body.reason || null,
    source: normalizeText(body.source, 'manual'),
    correction_status: normalizeText(body.correctionStatus || body.correction_status, 'none'),
    created_by: actorId || null,
    metadata_json: cleanMetadata(body.metadata || body.metadata_json),
  })
}

function buildInvoicePayload(body: Record<string, unknown>, orgId: string, actorId?: string | null) {
  const subtotal = normalizeNumber(body.subtotalMad || body.subtotal_mad || body.totalMad || body.total_mad, 0)
  const discount = normalizeNumber(body.discountMad || body.discount_mad, 0)
  const total = normalizeNumber(body.totalMad || body.total_mad, Math.max(subtotal - discount, 0))
  return compact({
    org_id: orgId,
    campus_id: body.campusId || body.campus_id || null,
    academic_year_id: body.academicYearId || body.academic_year_id || null,
    student_id: body.studentId || body.student_id || null,
    invoice_account_id: body.invoiceAccountId || body.invoice_account_id || null,
    invoice_number: normalizeText(body.invoiceNumber || body.invoice_number, makeCode('INV')),
    invoice_type: normalizeText(body.invoiceType || body.invoice_type, 'tuition'),
    status: normalizeText(body.status, 'draft'),
    currency: normalizeText(body.currency, 'MAD'),
    issue_date: body.issueDate || body.issue_date || new Date().toISOString().slice(0, 10),
    due_date: body.dueDate || body.due_date || null,
    subtotal_mad: subtotal,
    discount_mad: discount,
    total_mad: total,
    paid_mad: normalizeNumber(body.paidMad || body.paid_mad, 0),
    generated_by: actorId || null,
    metadata_json: cleanMetadata(body.metadata || body.metadata_json),
  })
}

function buildDocumentPayload(body: Record<string, unknown>, orgId: string, actorId?: string | null) {
  return compact({
    org_id: orgId,
    campus_id: body.campusId || body.campus_id || null,
    student_id: body.studentId || body.student_id || null,
    guardian_id: body.guardianId || body.guardian_id || null,
    staff_profile_id: body.staffProfileId || body.staff_profile_id || null,
    document_code: normalizeText(body.documentCode || body.document_code, makeCode('DOC')),
    document_type: normalizeText(body.documentType || body.document_type, 'general'),
    title: normalizeText(body.title || body.fileName || body.file_name, 'Document'),
    file_name: body.fileName || body.file_name || null,
    file_path: body.filePath || body.file_path || null,
    file_size_bytes: Math.max(0, Math.round(normalizeNumber(body.fileSizeBytes || body.file_size_bytes, 0))),
    mime_type: body.mimeType || body.mime_type || null,
    status: normalizeText(body.status, 'active'),
    uploaded_by: actorId || null,
    metadata_json: cleanMetadata(body.metadata || body.metadata_json),
  })
}

function buildMessagePayload(body: Record<string, unknown>, orgId: string, actorId?: string | null) {
  return compact({
    org_id: orgId,
    campus_id: body.campusId || body.campus_id || null,
    message_code: normalizeText(body.messageCode || body.message_code, makeCode('MSG')),
    channel: normalizeText(body.channel, 'email'),
    audience_type: normalizeText(body.audienceType || body.audience_type, 'parents'),
    subject: body.subject || null,
    body: normalizeText(body.body || body.message, 'Message AngelCare 360'),
    status: normalizeText(body.status, 'draft'),
    recipient_count: Math.max(1, Math.round(normalizeNumber(body.recipientCount || body.recipient_count, 1))),
    scheduled_at: body.scheduledAt || body.scheduled_at || null,
    sent_at: body.sentAt || body.sent_at || null,
    created_by: actorId || null,
    metadata_json: cleanMetadata(body.metadata || body.metadata_json),
  })
}

function buildReportPayload(body: Record<string, unknown>, orgId: string, actorId?: string | null) {
  return compact({
    org_id: orgId,
    campus_id: body.campusId || body.campus_id || null,
    report_code: normalizeText(body.reportCode || body.report_code, makeCode('REP')),
    report_type: normalizeText(body.reportType || body.report_type, 'standard'),
    title: normalizeText(body.title, 'Rapport AngelCare 360'),
    status: normalizeText(body.status, 'queued'),
    requested_by: actorId || null,
    period_start: body.periodStart || body.period_start || null,
    period_end: body.periodEnd || body.period_end || null,
    output_path: body.outputPath || body.output_path || null,
    metadata_json: cleanMetadata(body.metadata || body.metadata_json),
  })
}

function buildTaskPayload(body: Record<string, unknown>, orgId: string, actorId?: string | null) {
  return compact({
    org_id: orgId,
    campus_id: body.campusId || body.campus_id || null,
    task_code: normalizeText(body.taskCode || body.task_code, makeCode('TASK')),
    title: normalizeText(body.title, 'Nouvelle action opérationnelle'),
    description: body.description || null,
    department: body.department || null,
    status: normalizeText(body.status, 'planned'),
    priority: normalizeText(body.priority, 'medium'),
    assigned_staff_id: body.assignedStaffId || body.assigned_staff_id || null,
    related_entity_type: body.relatedEntityType || body.related_entity_type || null,
    related_entity_id: body.relatedEntityId || body.related_entity_id || null,
    due_at: body.dueAt || body.due_at || null,
    created_by: actorId || null,
    metadata_json: cleanMetadata(body.metadata || body.metadata_json),
  })
}

function buildPayload(resource: Ac360SchoolOpsResource, body: Record<string, unknown>, orgId: string, actorId?: string | null) {
  switch (resource) {
    case 'students': return buildStudentPayload(body, orgId, actorId)
    case 'guardians': return buildGuardianPayload(body, orgId)
    case 'staff': return buildStaffPayload(body, orgId, actorId)
    case 'classes': return buildClassPayload(body, orgId)
    case 'enrollments': return buildEnrollmentPayload(body, orgId)
    case 'attendance': return buildAttendancePayload(body, orgId, actorId)
    case 'invoices': return buildInvoicePayload(body, orgId, actorId)
    case 'documents': return buildDocumentPayload(body, orgId, actorId)
    case 'messages': return buildMessagePayload(body, orgId, actorId)
    case 'reports': return buildReportPayload(body, orgId, actorId)
    case 'tasks': return buildTaskPayload(body, orgId, actorId)
    default: return { org_id: orgId, metadata_json: cleanMetadata(body.metadata || body.metadata_json) }
  }
}

export async function createAc360SchoolOpsRecord(resource: Ac360SchoolOpsResource, body: Record<string, unknown>, orgId?: string) {
  const resolved = await resolveAc360SchoolOpsContext(orgId || String(body.orgId || body.org_id || ''))
  if (!resolved.ok) return resolved
  const config = AC360_SCHOOL_OPS_RESOURCES[resource]
  const user = await getCurrentUser().catch(() => null) as any
  const payload = buildPayload(resource, body, resolved.orgId, user?.id || null)

  if (resource === 'enrollments' && (!(payload as any).student_id || !(payload as any).class_id)) {
    return { ok: false as const, status: 400, error: 'studentId and classId are required for enrollment creation.' }
  }

  const db = await createClient()
  const { data, error } = await db.from(config.table).insert(payload as any).select('*').single() as any
  if (error) return { ok: false as const, status: 500, error: error.message || `Unable to create ${resource}.`, payload }

  try {
    await db.from('ac360_school_operation_events').insert({
      org_id: resolved.orgId,
      campus_id: (data as any)?.campus_id || null,
      event_key: `school_ops.${resource}.created`,
      action_key: config.wiringKey ? String(config.wiringKey).replace('ac360.school_ops.', 'school.').replace('student.create', 'student.create') : null,
      entity_type: resource,
      entity_id: (data as any)?.id || null,
      severity: 'info',
      message: `AC360 school ops ${resource} record created.`,
      actor_app_user_id: user?.id || null,
      metadata_json: { source: 'phase_2a_core_school_ops_skeleton' },
    } as any)
  } catch {
    // Non-blocking operation event ledger write.
  }

  if (config.capacityKey) {
    const nextCapacity = await getAc360SchoolCapacity(resolved.orgId, config.capacityKey)
    try {
      await db.rpc('ac360_measure_capacity', {
        p_org_id: resolved.orgId,
        p_capacity_key: config.capacityKey,
        p_current_value: nextCapacity,
        p_source_table: config.table,
        p_metadata: { source: 'phase_2a_create_record', resource },
      } as any)
    } catch {
      // Non-blocking capacity snapshot refresh.
    }
  }

  return { ok: true as const, status: 200, resource, record: data, context: resolved.context }
}
