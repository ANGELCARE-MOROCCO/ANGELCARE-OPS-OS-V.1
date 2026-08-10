import { createClient } from '@/lib/supabase/server'
import { getAngelcare360AccessContext, requireAngelcare360Permission } from './context'
import { recordAngelcare360AuditEventServer } from './audit'
import { detectAngelcare360TimetableConflicts } from './attendance'
import {
  angelcare360SchoolCalendarEventCreateSchema,
  angelcare360SchoolCalendarEventUpdateSchema,
  angelcare360TimetableSlotCreateSchema,
  angelcare360TimetableSlotUpdateSchema,
  type Angelcare360ValidationResult,
} from '@/lib/angelcare360/validation'
import type {
  Angelcare360AttendanceTimetableConflictResult,
  Angelcare360SchoolCalendarEventListRecord,
  Angelcare360TimetableSlotListRecord,
} from '@/types/angelcare360/attendance'
import type { Angelcare360AuditRecord } from '@/types/angelcare360/audit'

type Row = Record<string, unknown>
type SupabaseClient = Awaited<ReturnType<typeof createClient>>

function asString(value: unknown) {
  if (value === null || value === undefined) return ''
  return String(value)
}

function asMaybeString(value: unknown) {
  const text = asString(value).trim()
  return text || null
}

function parseValidationErrors<T>(result: Angelcare360ValidationResult<T>, fallback: string) {
  if (result.success) return null
  return result.errors[0]?.message || fallback
}

async function getContext(permissionKey: string, schoolId?: string | null) {
  return requireAngelcare360Permission(permissionKey, { schoolId })
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

function mapSlotRow(row: Row, conflicts: Angelcare360AttendanceTimetableConflictResult['conflicts']) {
  const classRecord = (row.class as Row | undefined) || {}
  const sectionRecord = (row.section as Row | undefined) || {}
  const subjectRecord = (row.subject as Row | undefined) || {}
  const staffRecord = (row.staff as Row | undefined) || {}
  const academicYear = (row.academic_year as Row | undefined) || {}
  return {
    id: asString(row.id),
    school_id: asString(row.school_id),
    academic_year_id: asString(row.academic_year_id),
    class_id: asString(row.class_id),
    section_id: row.section_id ? asString(row.section_id) : null,
    subject_id: asString(row.subject_id),
    staff_id: row.staff_id ? asString(row.staff_id) : null,
    day_of_week: Number(row.day_of_week || 1),
    start_time: asString(row.start_time),
    end_time: asString(row.end_time),
    room: row.room ? asString(row.room) : null,
    slot_type: row.slot_type ? asString(row.slot_type) : null,
    status: asString(row.status),
    created_at: asString(row.created_at),
    updated_at: asString(row.updated_at),
    metadata_json: (row.metadata_json as Record<string, unknown> | undefined) || {},
    academic_year_label: academicYear.label ? asString(academicYear.label) : null,
    class_name: classRecord.name ? asString(classRecord.name) : null,
    class_code: classRecord.class_code ? asString(classRecord.class_code) : null,
    section_name: sectionRecord.name ? asString(sectionRecord.name) : null,
    section_code: sectionRecord.section_code ? asString(sectionRecord.section_code) : null,
    subject_name: subjectRecord.name ? asString(subjectRecord.name) : null,
    subject_code: subjectRecord.subject_code ? asString(subjectRecord.subject_code) : null,
    staff_full_name: staffRecord.full_name ? asString(staffRecord.full_name) : null,
    conflict_count: conflicts.filter((conflict) => conflict.slotIds.includes(asString(row.id))).length,
    detail_href: `/angelcare-360-command-center/emploi-du-temps/classes/${asString(row.class_id)}`,
  } satisfies Angelcare360TimetableSlotListRecord
}

function mapEventRow(row: Row): Angelcare360SchoolCalendarEventListRecord {
  const academicYear = (row.academic_year as Row | undefined) || {}
  return {
    id: asString(row.id),
    school_id: asString(row.school_id),
    academic_year_id: row.academic_year_id ? asString(row.academic_year_id) : null,
    event_code: asString(row.event_code),
    title: asString(row.title),
    description: row.description ? asString(row.description) : null,
    event_type: asString(row.event_type),
    starts_on: asString(row.starts_on),
    ends_on: asString(row.ends_on),
    all_day: Boolean(row.all_day),
    audience: asString(row.audience),
    status: asString(row.status),
    created_at: asString(row.created_at),
    updated_at: asString(row.updated_at),
    metadata_json: (row.metadata_json as Record<string, unknown> | undefined) || {},
    academic_year_label: academicYear.label ? asString(academicYear.label) : null,
    detail_href: `/angelcare-360-command-center/emploi-du-temps/calendrier`,
  }
}

export async function getAngelcare360TimetableOverview(options?: { schoolId?: string | null }) {
  const context = await getAngelcare360AccessContext({ schoolId: options?.schoolId })
  if (!context?.school) return null

  const supabase = await createClient()
  const schoolId = context.school.id
  const [slotCount, calendarEventCount, classCount, teacherCount, auditRows, conflictCheck] = await Promise.all([
    countRows(supabase, 'angelcare360_timetable_slots', schoolId, [['status', 'eq', 'active']]),
    countRows(supabase, 'angelcare360_school_calendar_events', schoolId),
    countRows(supabase, 'angelcare360_classes', schoolId, [['status', 'eq', 'active']]),
    countRows(supabase, 'angelcare360_staff', schoolId, [['status', 'eq', 'active']]),
    supabase
      .from('angelcare360_audit_logs')
      .select('id, school_id, actor_user_id, actor_role, module, action, entity_type, entity_id, severity, request_id, metadata, created_at')
      .eq('school_id', schoolId)
      .or('module.eq.attendance,module.eq.timetable')
      .order('created_at', { ascending: false })
      .limit(6),
    detectAngelcare360TimetableConflicts({ schoolId }),
  ])

  const risks: string[] = []
  if (!context.academicYear) risks.push('Aucune année scolaire active n’est résolue.')
  if (slotCount === 0) risks.push('Aucun créneau n’est encore configuré.')
  if (calendarEventCount === 0) risks.push('Aucun évènement scolaire n’est encore planifié.')
  if (conflictCheck.conflicts.length > 0) risks.push(`${conflictCheck.conflicts.length} conflit(s) d’emploi du temps doivent être analysés.`)

  return {
    schoolCount: 1,
    activeAcademicYearLabel: context.academicYear?.label || null,
    slotCount,
    calendarEventCount,
    classCount,
    teacherCount,
    conflictCount: conflictCheck.conflicts.length,
    latestAuditEvents: (auditRows.data || []) as Angelcare360AuditRecord[],
    risks,
  }
}

export async function listAngelcare360TimetableSlots(options?: {
  schoolId?: string | null
  academicYearId?: string | null
  classId?: string | null
  sectionId?: string | null
  staffId?: string | null
  dayOfWeek?: number | null
  status?: string | null
}) {
  const context = await getContext('emploi_du_temps.view', options?.schoolId)
  const supabase = await createClient()
  let query = supabase
    .from('angelcare360_timetable_slots')
    .select('id, school_id, academic_year_id, class_id, section_id, subject_id, staff_id, day_of_week, start_time, end_time, room, slot_type, status, created_at, updated_at, metadata_json, class:angelcare360_classes(id, name, class_code), section:angelcare360_sections(id, name, section_code), subject:angelcare360_subjects(id, name, subject_code), staff:angelcare360_staff(id, full_name), academic_year:angelcare360_academic_years(id, label)')
    .eq('school_id', context.school!.id)
    .order('day_of_week', { ascending: true })
    .order('start_time', { ascending: true })
    .limit(300)

  if (options?.academicYearId) query = query.eq('academic_year_id', options.academicYearId)
  if (options?.classId) query = query.eq('class_id', options.classId)
  if (options?.sectionId) query = query.eq('section_id', options.sectionId)
  if (options?.staffId) query = query.eq('staff_id', options.staffId)
  if (options?.dayOfWeek) query = query.eq('day_of_week', options.dayOfWeek)
  if (options?.status) query = query.eq('status', options.status)

  const { data } = await query
  const conflicts = (await detectAngelcare360TimetableConflicts({
    schoolId: context.school!.id,
    academicYearId: options?.academicYearId || null,
    classId: options?.classId || null,
    sectionId: options?.sectionId || null,
    staffId: options?.staffId || null,
    dayOfWeek: options?.dayOfWeek || null,
  })).conflicts
  return (data || []).map((row) => mapSlotRow(row as Row, conflicts))
}

export async function createAngelcare360TimetableSlot(input: Record<string, unknown>) {
  const parsed = angelcare360TimetableSlotCreateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parseValidationErrors(parsed, 'Créneau invalide.') }
  const context = await getContext('emploi_du_temps.create', parsed.data.schoolId)
  const supabase = await createClient()

  const { data: existing } = await supabase
    .from('angelcare360_timetable_slots')
    .select('*')
    .eq('school_id', context.school!.id)
    .eq('academic_year_id', parsed.data.academicYearId)
    .eq('class_id', parsed.data.classId)
    .eq('day_of_week', parsed.data.dayOfWeek)
    .eq('start_time', parsed.data.startTime)
    .eq('end_time', parsed.data.endTime)
    .eq('subject_id', parsed.data.subjectId)
    .maybeSingle()

  if (existing) {
    return { ok: true, record: existing as Angelcare360TimetableSlotListRecord, warning: 'Un créneau identique existe déjà. Le créneau existant a été conservé.' }
  }

  const conflictCheck = await detectAngelcare360TimetableConflicts({
    schoolId: context.school!.id,
    academicYearId: parsed.data.academicYearId,
    classId: parsed.data.classId,
    sectionId: parsed.data.sectionId || null,
    staffId: parsed.data.staffId || null,
    dayOfWeek: parsed.data.dayOfWeek,
    startTime: parsed.data.startTime,
    endTime: parsed.data.endTime,
  })

  const payload = {
    school_id: context.school!.id,
    academic_year_id: parsed.data.academicYearId,
    class_id: parsed.data.classId,
    section_id: parsed.data.sectionId || null,
    subject_id: parsed.data.subjectId,
    staff_id: parsed.data.staffId || null,
    day_of_week: parsed.data.dayOfWeek,
    start_time: parsed.data.startTime,
    end_time: parsed.data.endTime,
    room: parsed.data.room || null,
    slot_type: parsed.data.slotType || 'regular',
    status: parsed.data.status || 'active',
    metadata_json: { notes: parsed.data.room || null, phase: 'phase6' },
  }

  const { data, error } = await supabase.from('angelcare360_timetable_slots').insert(payload).select('*').single()
  if (error) return { ok: false, error: error.message }

  const auditResult = await recordAngelcare360AuditEventServer({
    category: 'timetable',
    module: 'timetable',
    action: 'timetable_slot.created',
    schoolId: context.school!.id,
    actorUserId: context.user.id,
    actorRole: context.primaryRoleKey,
    entityType: 'timetable_slot',
    entityId: String(data.id),
    severity: conflictCheck.conflicts.length > 0 ? 'warning' : 'info',
    afterData: data as Record<string, unknown>,
    metadata: { conflictCount: conflictCheck.conflicts.length },
  })

  return {
    ok: true,
    record: data as Angelcare360TimetableSlotListRecord,
    warning: conflictCheck.conflicts.length > 0 ? 'Des conflits ont été détectés, mais le créneau a été enregistré.' : auditResult.ok ? null : auditResult.error || 'Créneau enregistré, mais audit indisponible.',
  }
}

export async function updateAngelcare360TimetableSlot(input: Record<string, unknown>) {
  const parsed = angelcare360TimetableSlotUpdateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parseValidationErrors(parsed, 'Mise à jour du créneau invalide.') }
  const context = await getContext('emploi_du_temps.update', parsed.data.schoolId)
  const supabase = await createClient()
  const { data: before } = await supabase.from('angelcare360_timetable_slots').select('*').eq('school_id', context.school!.id).eq('id', parsed.data.id).maybeSingle()
  if (!before) return { ok: false, error: 'Créneau introuvable.' }

  const conflictCheck = await detectAngelcare360TimetableConflicts({
    schoolId: context.school!.id,
    academicYearId: parsed.data.academicYearId,
    classId: parsed.data.classId,
    sectionId: parsed.data.sectionId || null,
    staffId: parsed.data.staffId || null,
    dayOfWeek: parsed.data.dayOfWeek,
    startTime: parsed.data.startTime,
    endTime: parsed.data.endTime,
  })

  const { data, error } = await supabase
    .from('angelcare360_timetable_slots')
    .update({
      academic_year_id: parsed.data.academicYearId,
      class_id: parsed.data.classId,
      section_id: parsed.data.sectionId || null,
      subject_id: parsed.data.subjectId,
      staff_id: parsed.data.staffId || null,
      day_of_week: parsed.data.dayOfWeek,
      start_time: parsed.data.startTime,
      end_time: parsed.data.endTime,
      room: parsed.data.room || null,
      slot_type: parsed.data.slotType || 'regular',
      status: parsed.data.status || 'active',
      metadata_json: { ...(before.metadata_json as Record<string, unknown> || {}), phase: 'phase6' },
    })
    .eq('school_id', context.school!.id)
    .eq('id', parsed.data.id)
    .select('*')
    .single()

  if (error) return { ok: false, error: error.message }

  const auditResult = await recordAngelcare360AuditEventServer({
    category: 'timetable',
    module: 'timetable',
    action: 'timetable_slot.updated',
    schoolId: context.school!.id,
    actorUserId: context.user.id,
    actorRole: context.primaryRoleKey,
    entityType: 'timetable_slot',
    entityId: String(data.id),
    severity: conflictCheck.conflicts.length > 0 ? 'warning' : 'info',
    beforeData: before as Record<string, unknown>,
    afterData: data as Record<string, unknown>,
    metadata: { conflictCount: conflictCheck.conflicts.length },
  })

  return {
    ok: true,
    record: data as Angelcare360TimetableSlotListRecord,
    warning: conflictCheck.conflicts.length > 0 ? 'Des conflits ont été détectés après mise à jour.' : auditResult.ok ? null : auditResult.error || 'Créneau mis à jour, mais audit indisponible.',
  }
}

export async function listAngelcare360ClassTimetable(options: { schoolId?: string | null; classId: string; academicYearId?: string | null; sectionId?: string | null }) {
  const slots = await listAngelcare360TimetableSlots({ schoolId: options.schoolId, classId: options.classId, academicYearId: options.academicYearId, sectionId: options.sectionId })
  return slots
    .filter((slot) => !options.sectionId || slot.section_id === options.sectionId)
    .sort((left, right) => (left.day_of_week - right.day_of_week) || left.start_time.localeCompare(right.start_time))
}

export async function listAngelcare360TeacherTimetable(options: { schoolId?: string | null; staffId: string; academicYearId?: string | null }) {
  const slots = await listAngelcare360TimetableSlots({ schoolId: options.schoolId, staffId: options.staffId, academicYearId: options.academicYearId })
  return slots.sort((left, right) => (left.day_of_week - right.day_of_week) || left.start_time.localeCompare(right.start_time))
}

export async function listAngelcare360SchoolCalendarEvents(options?: { schoolId?: string | null; academicYearId?: string | null; status?: string | null }) {
  const context = await getContext('emploi_du_temps.view', options?.schoolId)
  const supabase = await createClient()
  let query = supabase
    .from('angelcare360_school_calendar_events')
    .select('id, school_id, academic_year_id, event_code, title, description, event_type, starts_on, ends_on, all_day, audience, status, created_at, updated_at, metadata_json, academic_year:angelcare360_academic_years(id, label)')
    .eq('school_id', context.school!.id)
    .order('starts_on', { ascending: true })
    .limit(200)
  if (options?.academicYearId) query = query.eq('academic_year_id', options.academicYearId)
  if (options?.status) query = query.eq('status', options.status)
  const { data } = await query
  return (data || []).map((row) => mapEventRow(row as Row))
}

export async function createAngelcare360SchoolCalendarEvent(input: Record<string, unknown>) {
  const parsed = angelcare360SchoolCalendarEventCreateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parseValidationErrors(parsed, 'Évènement scolaire invalide.') }
  const context = await getContext('emploi_du_temps.create', parsed.data.schoolId)
  const supabase = await createClient()

  const { data: existing } = await supabase
    .from('angelcare360_school_calendar_events')
    .select('*')
    .eq('school_id', context.school!.id)
    .eq('event_code', parsed.data.eventCode)
    .maybeSingle()
  if (existing) {
    return { ok: true, record: existing as Angelcare360SchoolCalendarEventListRecord, warning: 'Un évènement identique existe déjà. L’évènement existant a été conservé.' }
  }

  const payload = {
    school_id: context.school!.id,
    academic_year_id: parsed.data.academicYearId || null,
    event_code: parsed.data.eventCode,
    title: parsed.data.title,
    description: parsed.data.description || null,
    event_type: parsed.data.eventType,
    starts_on: parsed.data.startsOn,
    ends_on: parsed.data.endsOn,
    all_day: Boolean(parsed.data.allDay),
    audience: parsed.data.audience || 'all',
    status: parsed.data.status || 'planned',
    metadata_json: { phase: 'phase6' },
  }

  const { data, error } = await supabase.from('angelcare360_school_calendar_events').insert(payload).select('*').single()
  if (error) return { ok: false, error: error.message }

  const auditResult = await recordAngelcare360AuditEventServer({
    category: 'timetable',
    module: 'timetable',
    action: 'calendar_event.created',
    schoolId: context.school!.id,
    actorUserId: context.user.id,
    actorRole: context.primaryRoleKey,
    entityType: 'school_calendar_event',
    entityId: String(data.id),
    severity: 'info',
    afterData: data as Record<string, unknown>,
    metadata: { eventType: parsed.data.eventType },
  })

  return { ok: true, record: data as Angelcare360SchoolCalendarEventListRecord, warning: auditResult.ok ? null : auditResult.error || 'Évènement créé, mais audit indisponible.' }
}

export async function updateAngelcare360SchoolCalendarEvent(input: Record<string, unknown>) {
  const parsed = angelcare360SchoolCalendarEventUpdateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parseValidationErrors(parsed, 'Évènement scolaire invalide.') }
  const context = await getContext('emploi_du_temps.update', parsed.data.schoolId)
  const supabase = await createClient()
  const { data: before } = await supabase.from('angelcare360_school_calendar_events').select('*').eq('school_id', context.school!.id).eq('id', parsed.data.id).maybeSingle()
  if (!before) return { ok: false, error: 'Évènement introuvable.' }

  const { data, error } = await supabase
    .from('angelcare360_school_calendar_events')
    .update({
      academic_year_id: parsed.data.academicYearId || null,
      event_code: parsed.data.eventCode,
      title: parsed.data.title,
      description: parsed.data.description || null,
      event_type: parsed.data.eventType,
      starts_on: parsed.data.startsOn,
      ends_on: parsed.data.endsOn,
      all_day: Boolean(parsed.data.allDay),
      audience: parsed.data.audience || 'all',
      status: parsed.data.status || 'planned',
      metadata_json: { ...(before.metadata_json as Record<string, unknown> || {}), phase: 'phase6' },
    })
    .eq('school_id', context.school!.id)
    .eq('id', parsed.data.id)
    .select('*')
    .single()

  if (error) return { ok: false, error: error.message }

  const auditResult = await recordAngelcare360AuditEventServer({
    category: 'timetable',
    module: 'timetable',
    action: 'calendar_event.updated',
    schoolId: context.school!.id,
    actorUserId: context.user.id,
    actorRole: context.primaryRoleKey,
    entityType: 'school_calendar_event',
    entityId: String(data.id),
    severity: 'info',
    beforeData: before as Record<string, unknown>,
    afterData: data as Record<string, unknown>,
  })

  return { ok: true, record: data as Angelcare360SchoolCalendarEventListRecord, warning: auditResult.ok ? null : auditResult.error || 'Évènement mis à jour, mais audit indisponible.' }
}

