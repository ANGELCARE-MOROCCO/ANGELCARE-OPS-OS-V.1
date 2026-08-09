import { createTrainingHubUserClient } from './supabase'
import { TrainingHubHttpError, requireTrainingHubPermission } from './auth'
import type {
  JsonRecord,
  TrainingHubAttendanceInput,
  TrainingHubAttendanceRequest,
  TrainingHubContext,
  TrainingHubCourse,
  TrainingHubSessionCompleteRequest,
  TrainingHubSessionCreateRequest,
  TrainingHubSessionDetail,
  TrainingHubSessionParticipantInput,
  TrainingHubSessionParticipantsRequest,
  TrainingHubSessionStatusRequest,
  TrainingHubSessionSummary,
} from './types'

const SESSION_LIST_LIMIT_DEFAULT = 50
const SESSION_LIST_LIMIT_MAX = 200

const SESSION_SELECT = `
  id,
  organization_id,
  site_id,
  course_id,
  course_version_id,
  order_item_id,
  session_code,
  status,
  delivery_mode,
  city,
  location_address,
  participant_min,
  participant_max,
  planned_participant_count,
  actual_participant_count,
  planned_hours,
  hours_distribution_notes,
  trainer_owner_id,
  academy_owner_id,
  scheduled_start_at,
  scheduled_end_at,
  delivered_at,
  closed_at,
  created_at,
  updated_at,
  metadata,
  trn_courses(id, category_id, ref, title, short_description, onsite_entry_price_minor, refresh_entry_price_minor, currency_code, starter_min_participants, starter_max_participants, min_hours, max_hours, has_refresh_module, publication_status, status),
  core_organizations(id, name, legal_name, organization_type, status, city, country_code, currency_code)
`

const ALLOWED_CREATE_STATUSES = new Set(['requested', 'qualified', 'confirmed', 'scheduled'])
const ALLOWED_STATUS_UPDATES = new Set([
  'requested',
  'qualified',
  'quoted',
  'confirmed',
  'scheduled',
  'kit_preparation',
  'ready_to_deliver',
  'in_delivery',
  'delivered',
  'attendance_validated',
  'certificates_issued',
  'refresh_unlocked',
  'aftersales_completed',
  'closed',
  'cancelled',
])

const ALLOWED_ATTENDANCE = new Set(['present', 'absent', 'partial', 'late', 'excused'])

function asObject(value: unknown, message = 'Invalid TrainingHub fulfillment payload.'): JsonRecord {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TrainingHubHttpError(message, 400, 'TRAININGHUB_INVALID_FULFILLMENT_PAYLOAD')
  }
  return value as JsonRecord
}

function text(value: unknown) {
  return String(value || '').trim()
}

function nullableText(value: unknown) {
  const result = text(value)
  return result || null
}

function uuidText(value: unknown) {
  return text(value)
}

function toPositiveInt(value: unknown, fallback = 1, max = 999) {
  const n = Number(value ?? fallback)
  if (!Number.isFinite(n)) return fallback
  return Math.min(Math.max(Math.floor(n), 1), max)
}

function toNullableInt(value: unknown) {
  if (value === null || value === undefined || value === '') return null
  const n = Number(value)
  if (!Number.isFinite(n)) return null
  return Math.max(Math.floor(n), 0)
}

function toIsoOrNull(value: unknown, field: string) {
  const raw = nullableText(value)
  if (!raw) return null
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) {
    throw new TrainingHubHttpError(`Invalid ${field}.`, 400, 'TRAININGHUB_INVALID_DATE', { field, value: raw })
  }
  return date.toISOString()
}

function normalizeLimit(value: string | null) {
  const n = Number(value || '')
  if (!Number.isFinite(n) || n <= 0) return SESSION_LIST_LIMIT_DEFAULT
  return Math.min(Math.floor(n), SESSION_LIST_LIMIT_MAX)
}

function generateSessionCode(courseRef?: string | null) {
  const now = new Date()
  const stamp = now.toISOString().replace(/[-:TZ.]/g, '').slice(0, 14)
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase()
  const ref = text(courseRef || 'TRN').replace(/[^A-Z0-9-]/gi, '').toUpperCase() || 'TRN'
  return `TH-${ref}-${stamp}-${rand}`
}

function generateCertificateNumber(courseRef: string, participantIndex: number) {
  const now = new Date()
  const stamp = now.toISOString().replace(/[-:TZ.]/g, '').slice(0, 14)
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `CERT-${courseRef}-${stamp}-${String(participantIndex + 1).padStart(2, '0')}-${rand}`
}

function currentUserProfileId(context: TrainingHubContext) {
  return context.profile.id
}

function contextCanAccessOrg(context: TrainingHubContext, organizationId: string) {
  return context.isInternal || context.isSuperAdmin || context.organizationIds.includes(organizationId)
}

function requireOrgAccess(context: TrainingHubContext, organizationId: string) {
  if (!contextCanAccessOrg(context, organizationId)) {
    throw new TrainingHubHttpError('Cannot access another TrainingHub organization.', 403, 'TRAININGHUB_ORG_FORBIDDEN')
  }
}

function requireSessionControl(context: TrainingHubContext, permission: string | string[]) {
  if (!context.isInternal && !context.isSuperAdmin) {
    throw new TrainingHubHttpError('Internal TrainingHub fulfillment control required.', 403, 'TRAININGHUB_INTERNAL_ONLY')
  }
  requireTrainingHubPermission(context, permission)
}

function normalizeSessionRow(row: any): TrainingHubSessionSummary {
  return {
    ...row,
    course: row.trn_courses || row.course || null,
    organization: row.core_organizations || row.organization || null,
    trn_courses: undefined,
    core_organizations: undefined,
  } as TrainingHubSessionSummary
}

function normalizeSessionDetail(row: any, children: {
  dates: JsonRecord[]
  trainers: JsonRecord[]
  participants: JsonRecord[]
  attendance: JsonRecord[]
  quizzes: JsonRecord[]
  checklists: JsonRecord[]
  resources: JsonRecord[]
  certificates: JsonRecord[]
  aftersales_reports: JsonRecord[]
}): TrainingHubSessionDetail {
  return {
    ...normalizeSessionRow(row),
    ...children,
  }
}

function requestOrganizationId(context: TrainingHubContext, body: TrainingHubSessionCreateRequest) {
  const explicit = uuidText(body.organization_id || body.organizationId)
  if (context.isInternal || context.isSuperAdmin) {
    if (!explicit) {
      throw new TrainingHubHttpError('organization_id is required to create a TrainingHub session.', 400, 'TRAININGHUB_SESSION_ORG_REQUIRED')
    }
    return explicit
  }

  const fallback = context.organizationIds[0]
  if (!fallback) throw new TrainingHubHttpError('No TrainingHub organization available.', 403, 'TRAININGHUB_NO_ORGANIZATION')
  if (explicit && explicit !== fallback) {
    throw new TrainingHubHttpError('Cannot create a session for another organization.', 403, 'TRAININGHUB_SESSION_ORG_FORBIDDEN')
  }
  return fallback
}

async function loadCourse(courseRef: string, courseId: string): Promise<TrainingHubCourse> {
  const supabase = await createTrainingHubUserClient()
  let query = supabase
    .from('trn_courses')
    .select('id, category_id, ref, title, short_description, onsite_entry_price_minor, refresh_entry_price_minor, currency_code, starter_min_participants, starter_max_participants, min_hours, max_hours, has_refresh_module, publication_status, status, metadata')

  if (courseId) query = query.eq('id', courseId)
  else if (courseRef) query = query.eq('ref', courseRef.toUpperCase())
  else throw new TrainingHubHttpError('course_ref or course_id is required.', 400, 'TRAININGHUB_SESSION_COURSE_REQUIRED')

  const { data, error } = await query.maybeSingle()
  if (error) throw new TrainingHubHttpError(error.message, 500, 'TRAININGHUB_SESSION_COURSE_LOAD_FAILED')
  if (!data) throw new TrainingHubHttpError('TrainingHub course not found.', 404, 'TRAININGHUB_SESSION_COURSE_NOT_FOUND')
  return data as TrainingHubCourse
}

async function loadCurrentCourseVersion(courseId: string, explicitVersionId?: string | null) {
  const supabase = await createTrainingHubUserClient()
  if (explicitVersionId) {
    const { data, error } = await supabase
      .from('trn_course_versions')
      .select('id, course_id, version_label, status, is_current')
      .eq('id', explicitVersionId)
      .maybeSingle()
    if (error) throw new TrainingHubHttpError(error.message, 500, 'TRAININGHUB_COURSE_VERSION_LOAD_FAILED')
    return data || null
  }

  const { data, error } = await supabase
    .from('trn_course_versions')
    .select('id, course_id, version_label, status, is_current, valid_from, created_at')
    .eq('course_id', courseId)
    .order('is_current', { ascending: false })
    .order('valid_from', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw new TrainingHubHttpError(error.message, 500, 'TRAININGHUB_COURSE_VERSION_LOAD_FAILED')
  return data || null
}

async function loadSessionRow(sessionId: string) {
  const supabase = await createTrainingHubUserClient()
  const { data, error } = await supabase.from('trn_sessions').select(SESSION_SELECT).eq('id', sessionId).maybeSingle()
  if (error) throw new TrainingHubHttpError(error.message, 500, 'TRAININGHUB_SESSION_LOAD_FAILED')
  if (!data) throw new TrainingHubHttpError('TrainingHub session not found.', 404, 'TRAININGHUB_SESSION_NOT_FOUND')
  return data as any
}

async function writeEvent(eventType: string, context: TrainingHubContext, sourceType: string, sourceId: string, organizationId: string, siteId: string | null, payload: JsonRecord = {}) {
  const supabase = await createTrainingHubUserClient()
  const { error } = await supabase.from('auto_events').insert({
    event_type: eventType,
    organization_id: organizationId,
    site_id: siteId,
    actor_user_id: currentUserProfileId(context),
    source_type: sourceType,
    source_id: sourceId,
    payload,
    status: 'pending',
  })
  if (error) console.warn('[traininghub] auto event failed', eventType, error.message)
}

export async function listTrainingHubSessions(context: TrainingHubContext, url: URL): Promise<TrainingHubSessionSummary[]> {
  requireTrainingHubPermission(context, ['training.session.schedule', 'training.catalogue.view'])
  const supabase = await createTrainingHubUserClient()
  const limit = normalizeLimit(url.searchParams.get('limit'))
  const status = nullableText(url.searchParams.get('status'))
  const organizationId = nullableText(url.searchParams.get('organization_id') || url.searchParams.get('organizationId'))
  const courseRef = nullableText(url.searchParams.get('course_ref') || url.searchParams.get('courseRef'))

  let query = supabase
    .from('trn_sessions')
    .select(SESSION_SELECT)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (!context.isInternal && !context.isSuperAdmin) {
    if (!context.organizationIds.length) return []
    query = query.in('organization_id', context.organizationIds)
  } else if (organizationId) {
    query = query.eq('organization_id', organizationId)
  }

  if (status) query = query.eq('status', status)
  if (courseRef) {
    const course = await loadCourse(courseRef, '')
    query = query.eq('course_id', course.id)
  }

  const { data, error } = await query
  if (error) throw new TrainingHubHttpError(error.message, 500, 'TRAININGHUB_SESSIONS_LIST_FAILED')
  return (data || []).map(normalizeSessionRow)
}

export async function getTrainingHubSessionById(context: TrainingHubContext, sessionId: string): Promise<TrainingHubSessionDetail> {
  requireTrainingHubPermission(context, ['training.session.schedule', 'training.catalogue.view'])
  const supabase = await createTrainingHubUserClient()
  const row = await loadSessionRow(sessionId)
  requireOrgAccess(context, row.organization_id)

  const [dates, trainers, participants, attendance, quizzes, checklists, resources, certificates, aftersales] = await Promise.all([
    supabase.from('trn_session_dates').select('*').eq('session_id', sessionId).order('starts_at', { ascending: true }),
    supabase.from('trn_session_trainers').select('*, trn_trainers(id, user_id, trainer_type, specialties, languages, city, status)').eq('session_id', sessionId),
    supabase.from('trn_session_participants').select('*').eq('session_id', sessionId).order('created_at', { ascending: true }),
    supabase.from('trn_attendance_records').select('*').eq('session_id', sessionId).order('check_in_at', { ascending: true }),
    supabase.from('trn_quiz_results').select('*').eq('session_id', sessionId).order('completed_at', { ascending: true }),
    supabase.from('trn_delivery_checklists').select('*').eq('session_id', sessionId).order('checklist_type', { ascending: true }),
    supabase.from('trn_session_resources_allocated').select('*').eq('session_id', sessionId),
    supabase.from('trn_certificates').select('*').eq('session_id', sessionId).order('issued_at', { ascending: true }),
    supabase.from('trn_aftersales_reports').select('*').eq('session_id', sessionId).order('completed_at', { ascending: false }),
  ])

  const errors = [dates.error, trainers.error, participants.error, attendance.error, quizzes.error, checklists.error, resources.error, certificates.error, aftersales.error].filter(Boolean)
  if (errors.length) {
    throw new TrainingHubHttpError(errors.map((error) => error?.message).join(' | '), 500, 'TRAININGHUB_SESSION_CHILD_LOAD_FAILED')
  }

  return normalizeSessionDetail(row, {
    dates: (dates.data || []) as JsonRecord[],
    trainers: (trainers.data || []) as JsonRecord[],
    participants: (participants.data || []) as JsonRecord[],
    attendance: (attendance.data || []) as JsonRecord[],
    quizzes: (quizzes.data || []) as JsonRecord[],
    checklists: (checklists.data || []) as JsonRecord[],
    resources: (resources.data || []) as JsonRecord[],
    certificates: (certificates.data || []) as JsonRecord[],
    aftersales_reports: (aftersales.data || []) as JsonRecord[],
  })
}

export async function createTrainingHubSession(context: TrainingHubContext, rawBody: unknown): Promise<TrainingHubSessionDetail> {
  requireSessionControl(context, 'training.session.schedule')
  const body = asObject(rawBody) as TrainingHubSessionCreateRequest
  const organizationId = requestOrganizationId(context, body)
  requireOrgAccess(context, organizationId)

  const siteId = nullableText(body.site_id || body.siteId)
  const course = await loadCourse(text(body.course_ref || body.courseRef), text(body.course_id || body.courseId))
  const version = await loadCurrentCourseVersion(course.id, nullableText(body.course_version_id || body.courseVersionId))
  const requestedStatus = text(body.status || 'requested') || 'requested'
  const status = ALLOWED_CREATE_STATUSES.has(requestedStatus) ? requestedStatus : 'requested'
  const plannedParticipants = toNullableInt(body.planned_participant_count ?? body.plannedParticipantCount) || Number(course.starter_min_participants || 3)
  const plannedHours = toNullableInt(body.planned_hours ?? body.plannedHours) || Number(course.min_hours || 6)

  const insertRow = {
    organization_id: organizationId,
    site_id: siteId,
    course_id: course.id,
    course_version_id: version?.id || null,
    order_item_id: nullableText(body.order_item_id || body.orderItemId),
    session_code: generateSessionCode(course.ref),
    status,
    delivery_mode: nullableText(body.delivery_mode || body.deliveryMode) || 'onsite',
    city: nullableText(body.city),
    location_address: nullableText(body.location_address || body.locationAddress),
    participant_min: Number(course.starter_min_participants || 3),
    participant_max: Number(course.starter_max_participants || 8),
    planned_participant_count: plannedParticipants,
    planned_hours: plannedHours,
    hours_distribution_notes: nullableText(body.hours_distribution_notes || body.hoursDistributionNotes),
    trainer_owner_id: nullableText(body.trainer_owner_id || body.trainerOwnerId),
    academy_owner_id: nullableText(body.academy_owner_id || body.academyOwnerId) || currentUserProfileId(context),
    scheduled_start_at: toIsoOrNull(body.scheduled_start_at || body.scheduledStartAt, 'scheduled_start_at'),
    scheduled_end_at: toIsoOrNull(body.scheduled_end_at || body.scheduledEndAt, 'scheduled_end_at'),
    created_by: currentUserProfileId(context),
    updated_by: currentUserProfileId(context),
    metadata: {
      ...(body.metadata || {}),
      source: 'traininghub_api',
      created_by_email: context.authUser.email || null,
    },
  }

  const supabase = await createTrainingHubUserClient()
  const { data, error } = await supabase.from('trn_sessions').insert(insertRow).select('id').single()
  if (error) throw new TrainingHubHttpError(error.message, 500, 'TRAININGHUB_SESSION_CREATE_FAILED')

  await writeEvent('training.session_scheduled', context, 'trn_sessions', data.id, organizationId, siteId, {
    session_code: insertRow.session_code,
    course_ref: course.ref,
    status,
  })

  return getTrainingHubSessionById(context, data.id)
}

export async function updateTrainingHubSessionStatus(context: TrainingHubContext, sessionId: string, rawBody: unknown): Promise<TrainingHubSessionDetail> {
  requireSessionControl(context, 'training.session.schedule')
  const body = asObject(rawBody) as TrainingHubSessionStatusRequest
  const nextStatus = text(body.status)
  if (!ALLOWED_STATUS_UPDATES.has(nextStatus)) {
    throw new TrainingHubHttpError('Invalid TrainingHub session status.', 400, 'TRAININGHUB_INVALID_SESSION_STATUS', { status: nextStatus })
  }

  const row = await loadSessionRow(sessionId)
  requireOrgAccess(context, row.organization_id)
  const supabase = await createTrainingHubUserClient()
  const metadataPatch = {
    ...(typeof row.metadata === 'object' && row.metadata ? row.metadata : {}),
    ...(body.metadata || {}),
    last_status_note: nullableText(body.note),
    last_status_update_by: currentUserProfileId(context),
    last_status_update_at: new Date().toISOString(),
  }

  const patch: JsonRecord = {
    status: nextStatus,
    updated_by: currentUserProfileId(context),
    updated_at: new Date().toISOString(),
    metadata: metadataPatch,
  }
  if (nextStatus === 'delivered') patch.delivered_at = new Date().toISOString()
  if (nextStatus === 'closed') patch.closed_at = new Date().toISOString()

  const { error } = await supabase.from('trn_sessions').update(patch).eq('id', sessionId)
  if (error) throw new TrainingHubHttpError(error.message, 500, 'TRAININGHUB_SESSION_STATUS_UPDATE_FAILED')

  await writeEvent(`training.${nextStatus}`, context, 'trn_sessions', sessionId, row.organization_id, row.site_id || null, {
    previous_status: row.status,
    next_status: nextStatus,
  })

  return getTrainingHubSessionById(context, sessionId)
}

function normalizeParticipant(input: TrainingHubSessionParticipantInput, session: any, organizationId: string, siteId: string | null): JsonRecord {
  const fullName = nullableText(input.full_name || input.fullName)
  const email = nullableText(input.email)
  const userId = nullableText(input.user_id || input.userId)
  if (!fullName && !email && !userId) {
    throw new TrainingHubHttpError('Each participant requires at least full_name, email, or user_id.', 400, 'TRAININGHUB_PARTICIPANT_REQUIRED')
  }

  return {
    session_id: session.id,
    organization_id: organizationId,
    site_id: siteId,
    user_id: userId,
    full_name: fullName,
    email,
    phone: nullableText(input.phone),
    job_title: nullableText(input.job_title || input.jobTitle),
    participant_type: nullableText(input.participant_type || input.participantType) || 'staff_participant',
    attendance_status: 'pending',
    certificate_status: 'not_issued',
    refresh_access_status: 'locked',
    metadata: input.metadata || {},
  }
}

export async function addTrainingHubSessionParticipants(context: TrainingHubContext, sessionId: string, rawBody: unknown): Promise<TrainingHubSessionDetail> {
  requireSessionControl(context, 'training.session.schedule')
  const body = asObject(rawBody) as TrainingHubSessionParticipantsRequest
  const session = await loadSessionRow(sessionId)
  requireOrgAccess(context, session.organization_id)

  const participants = Array.isArray(body.participants) ? body.participants : body.participant ? [body.participant] : []
  if (!participants.length) {
    throw new TrainingHubHttpError('participants array is required.', 400, 'TRAININGHUB_PARTICIPANTS_REQUIRED')
  }

  const rows = participants.map((participant) => normalizeParticipant(participant, session, session.organization_id, session.site_id || null))
  const supabase = await createTrainingHubUserClient()
  const { error } = await supabase.from('trn_session_participants').insert(rows)
  if (error) throw new TrainingHubHttpError(error.message, 500, 'TRAININGHUB_PARTICIPANTS_INSERT_FAILED')

  const { count } = await supabase
    .from('trn_session_participants')
    .select('id', { count: 'exact', head: true })
    .eq('session_id', sessionId)

  await supabase.from('trn_sessions').update({ actual_participant_count: count || rows.length, updated_at: new Date().toISOString(), updated_by: currentUserProfileId(context) }).eq('id', sessionId)
  await writeEvent('training.participants_added', context, 'trn_sessions', sessionId, session.organization_id, session.site_id || null, { added: rows.length })

  return getTrainingHubSessionById(context, sessionId)
}

function normalizeAttendance(input: TrainingHubAttendanceInput, session: any, context: TrainingHubContext): JsonRecord {
  const participantId = uuidText(input.participant_id || input.participantId)
  if (!participantId) {
    throw new TrainingHubHttpError('participant_id is required for each attendance record.', 400, 'TRAININGHUB_ATTENDANCE_PARTICIPANT_REQUIRED')
  }
  const status = nullableText(input.attendance_status || input.attendanceStatus) || 'present'
  if (!ALLOWED_ATTENDANCE.has(status)) {
    throw new TrainingHubHttpError('Invalid attendance status.', 400, 'TRAININGHUB_INVALID_ATTENDANCE_STATUS', { status })
  }

  return {
    session_id: session.id,
    participant_id: participantId,
    session_date_id: nullableText(input.session_date_id || input.sessionDateId),
    check_in_at: toIsoOrNull(input.check_in_at || input.checkInAt, 'check_in_at') || new Date().toISOString(),
    check_out_at: toIsoOrNull(input.check_out_at || input.checkOutAt, 'check_out_at'),
    attendance_status: status,
    signature_url: nullableText(input.signature_url || input.signatureUrl),
    validated_by: currentUserProfileId(context),
    validated_at: new Date().toISOString(),
    metadata: input.metadata || {},
  }
}

export async function validateTrainingHubAttendance(context: TrainingHubContext, sessionId: string, rawBody: unknown): Promise<TrainingHubSessionDetail> {
  requireSessionControl(context, 'training.session.validate_attendance')
  const body = asObject(rawBody) as TrainingHubAttendanceRequest
  const session = await loadSessionRow(sessionId)
  requireOrgAccess(context, session.organization_id)

  const records = Array.isArray(body.records) ? body.records : body.record ? [body.record] : []
  if (!records.length) {
    throw new TrainingHubHttpError('attendance records array is required.', 400, 'TRAININGHUB_ATTENDANCE_REQUIRED')
  }

  const rows = records.map((record) => normalizeAttendance(record, session, context))
  const supabase = await createTrainingHubUserClient()
  const { error } = await supabase.from('trn_attendance_records').insert(rows)
  if (error) throw new TrainingHubHttpError(error.message, 500, 'TRAININGHUB_ATTENDANCE_INSERT_FAILED')

  await Promise.all(rows.map((record) =>
    supabase
      .from('trn_session_participants')
      .update({ attendance_status: record.attendance_status, metadata: { attendance_validated_at: new Date().toISOString() } })
      .eq('id', String(record.participant_id || ''))
      .eq('session_id', sessionId)
  ))

  await supabase.from('trn_sessions').update({ status: 'attendance_validated', updated_at: new Date().toISOString(), updated_by: currentUserProfileId(context) }).eq('id', sessionId)
  await writeEvent('training.attendance_validated', context, 'trn_sessions', sessionId, session.organization_id, session.site_id || null, { records: rows.length })

  return getTrainingHubSessionById(context, sessionId)
}

async function issueCertificatesIfNeeded(context: TrainingHubContext, session: any, participants: JsonRecord[], course: any) {
  const supabase = await createTrainingHubUserClient()
  const issued: JsonRecord[] = []
  for (let index = 0; index < participants.length; index += 1) {
    const participant = participants[index]
    const participantId = String(participant.id || '')
    const status = String(participant.attendance_status || '')
    if (!participantId || !['present', 'partial', 'late', 'excused'].includes(status)) continue

    const { data: existing, error: existingError } = await supabase
      .from('trn_certificates')
      .select('id')
      .eq('session_id', session.id)
      .eq('participant_id', participantId)
      .maybeSingle()
    if (existingError) throw new TrainingHubHttpError(existingError.message, 500, 'TRAININGHUB_CERTIFICATE_LOOKUP_FAILED')
    if (existing?.id) continue

    const certificate = {
      organization_id: session.organization_id,
      session_id: session.id,
      participant_id: participantId,
      course_id: session.course_id,
      certificate_number: generateCertificateNumber(String(course.ref || 'TR'), index),
      issued_at: new Date().toISOString(),
      issued_by: currentUserProfileId(context),
      status: 'issued',
      metadata: {
        participant_name: participant.full_name || null,
        participant_email: participant.email || null,
        course_ref: course.ref || null,
        course_title: course.title || null,
      },
    }
    const { data, error } = await supabase.from('trn_certificates').insert(certificate).select('*').single()
    if (error) throw new TrainingHubHttpError(error.message, 500, 'TRAININGHUB_CERTIFICATE_ISSUE_FAILED')
    issued.push(data as JsonRecord)
    await supabase.from('trn_session_participants').update({ certificate_status: 'issued' }).eq('id', participantId)
  }
  return issued
}

async function unlockRefreshIfNeeded(context: TrainingHubContext, session: any, course: any) {
  if (!course.has_refresh_module) return null
  const supabase = await createTrainingHubUserClient()
  const { data: module, error: moduleError } = await supabase
    .from('learn_modules')
    .select('id, module_code, title, status')
    .eq('course_id', session.course_id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (moduleError) throw new TrainingHubHttpError(moduleError.message, 500, 'TRAININGHUB_REFRESH_MODULE_LOOKUP_FAILED')
  if (!module?.id) return null

  const { data: existing, error: existingError } = await supabase
    .from('learn_entitlements')
    .select('id')
    .eq('organization_id', session.organization_id)
    .eq('course_id', session.course_id)
    .eq('module_id', module.id)
    .maybeSingle()

  if (existingError) throw new TrainingHubHttpError(existingError.message, 500, 'TRAININGHUB_REFRESH_ENTITLEMENT_LOOKUP_FAILED')
  if (existing?.id) return existing

  const { data, error } = await supabase
    .from('learn_entitlements')
    .insert({
      organization_id: session.organization_id,
      site_id: session.site_id || null,
      course_id: session.course_id,
      module_id: module.id,
      source_session_id: session.id,
      source_order_item_id: session.order_item_id || null,
      status: 'unlocked',
      unlocked_at: new Date().toISOString(),
      access_policy: 'forever_for_school_refresh',
      metadata: {
        unlocked_by: currentUserProfileId(context),
        course_ref: course.ref || null,
        session_code: session.session_code || null,
      },
    })
    .select('*')
    .single()

  if (error) throw new TrainingHubHttpError(error.message, 500, 'TRAININGHUB_REFRESH_UNLOCK_FAILED')
  await supabase.from('trn_session_participants').update({ refresh_access_status: 'unlocked' }).eq('session_id', session.id)
  return data as JsonRecord
}

export async function completeTrainingHubSession(context: TrainingHubContext, sessionId: string, rawBody: unknown): Promise<TrainingHubSessionDetail> {
  requireSessionControl(context, ['training.session.complete', 'training.certificate.issue'])
  const body = asObject(rawBody) as TrainingHubSessionCompleteRequest
  const session = await loadSessionRow(sessionId)
  requireOrgAccess(context, session.organization_id)
  const course = session.trn_courses || session.course
  if (!course?.id) throw new TrainingHubHttpError('Session course not available.', 500, 'TRAININGHUB_SESSION_COURSE_MISSING')

  const supabase = await createTrainingHubUserClient()
  const { data: participants, error: participantsError } = await supabase
    .from('trn_session_participants')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })
  if (participantsError) throw new TrainingHubHttpError(participantsError.message, 500, 'TRAININGHUB_SESSION_PARTICIPANTS_LOAD_FAILED')

  const issueCertificates = body.issue_certificates ?? body.issueCertificates ?? true
  const unlockRefresh = body.unlock_refresh ?? body.unlockRefresh ?? true
  const issued = issueCertificates ? await issueCertificatesIfNeeded(context, session, (participants || []) as JsonRecord[], course) : []
  const refresh = unlockRefresh ? await unlockRefreshIfNeeded(context, session, course) : null
  const finalStatus = text(body.final_status || body.finalStatus || (refresh ? 'refresh_unlocked' : issued.length ? 'certificates_issued' : 'aftersales_completed'))

  const { error: updateError } = await supabase
    .from('trn_sessions')
    .update({
      status: finalStatus,
      delivered_at: session.delivered_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      updated_by: currentUserProfileId(context),
    })
    .eq('id', sessionId)
  if (updateError) throw new TrainingHubHttpError(updateError.message, 500, 'TRAININGHUB_SESSION_COMPLETE_UPDATE_FAILED')

  const shouldCreateReport = Boolean(body.trainer_notes || body.trainerNotes || body.direction_feedback || body.directionFeedback || body.action_plan_7_days || body.actionPlan7Days)
  if (shouldCreateReport) {
    const reportNumber = `AFT-${session.session_code}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
    const { error: reportError } = await supabase.from('trn_aftersales_reports').insert({
      organization_id: session.organization_id,
      session_id: sessionId,
      report_number: reportNumber,
      trainer_notes: nullableText(body.trainer_notes || body.trainerNotes),
      direction_feedback: nullableText(body.direction_feedback || body.directionFeedback),
      action_plan_7_days: nullableText(body.action_plan_7_days || body.actionPlan7Days),
      status: 'draft',
      completed_by: currentUserProfileId(context),
      metadata: body.metadata || {},
    })
    if (reportError) console.warn('[traininghub] aftersales report creation failed', reportError.message)
  }

  await writeEvent('training.completed', context, 'trn_sessions', sessionId, session.organization_id, session.site_id || null, {
    certificates_issued: issued.length,
    refresh_unlocked: Boolean(refresh),
    final_status: finalStatus,
  })

  return getTrainingHubSessionById(context, sessionId)
}
