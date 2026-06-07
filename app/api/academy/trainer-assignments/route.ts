import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type AnyRow = Record<string, any>

async function safeRows(builder: PromiseLike<{ data: AnyRow[] | null; error: any }>) {
  try {
    const { data, error } = await builder
    if (error) return []
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

function dateOnly(value: any) {
  if (!value) return ''
  const raw = String(value)
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw
  const parsed = new Date(raw)
  if (Number.isNaN(parsed.getTime())) return raw.slice(0, 10)
  return parsed.toISOString().slice(0, 10)
}

function timeOnly(value: any, fallback: string) {
  if (!value) return fallback
  const raw = String(value)

  const hhmm = raw.match(/(\d{1,2}):(\d{2})/)
  if (hhmm) {
    return `${hhmm[1].padStart(2, '0')}:${hhmm[2]}:00`
  }

  return fallback
}

function addHours(time: string, hours: number) {
  const [h, m] = time.split(':').map(Number)
  const date = new Date()
  date.setHours(Number.isFinite(h) ? h : 9, Number.isFinite(m) ? m : 0, 0, 0)
  date.setHours(date.getHours() + Math.max(1, hours || 8))
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:00`
}

function eachDateInclusive(startDate: string, endDate: string) {
  const start = new Date(`${startDate}T12:00:00`)
  const end = new Date(`${endDate || startDate}T12:00:00`)

  if (Number.isNaN(start.getTime())) return [startDate]
  if (Number.isNaN(end.getTime())) return [startDate]

  const days: string[] = []
  const cursor = new Date(start)

  while (cursor <= end && days.length < 120) {
    days.push(cursor.toISOString().slice(0, 10))
    cursor.setDate(cursor.getDate() + 1)
  }

  return days.length ? days : [startDate]
}

function trainerNameFrom(trainersById: Map<string, AnyRow>, trainerId: any, fallback?: string | null) {
  const trainer = trainersById.get(String(trainerId))
  return (
    fallback ||
    trainer?.full_name ||
    trainer?.name ||
    trainer?.email ||
    trainer?.trainer_code ||
    'Assigned trainer'
  )
}

function normalizeExistingAssignment(row: AnyRow) {
  const start =
    row.start_time ||
    row.start_at ||
    row.starts_at ||
    row.scheduled_date ||
    row.date ||
    null

  const end =
    row.end_time ||
    row.end_at ||
    row.ends_at ||
    null

  return {
    id: row.id,
    source: 'assignment',
    trainer_id: row.trainer_id,
    trainer_name: row.trainer_name,
    cohort_id: row.cohort_id,
    cohort_title: row.cohort_title,
    cohort_reference: row.cohort_reference,
    program_id: row.program_id,
    program_title: row.program_title,
    title: row.title || row.program_title || row.cohort_title || 'Scheduled training',
    status: row.status || 'planned',
    start_time: start,
    end_time: end,
    location: row.location || null,
    delivery_format: row.delivery_format || null,
  }
}

function cohortStartTime(cohort: AnyRow) {
  return timeOnly(
    cohort.training_start_time ||
      cohort.daily_start_time ||
      cohort.start_time ||
      cohort.starts_at ||
      cohort.session_start_time ||
      cohort.preferred_start_time,
    '09:00:00',
  )
}

function cohortEndTime(cohort: AnyRow, startTime: string) {
  const explicit = timeOnly(
    cohort.training_end_time ||
      cohort.daily_end_time ||
      cohort.end_time ||
      cohort.ends_at ||
      cohort.session_end_time ||
      cohort.preferred_end_time,
    '',
  )

  if (explicit) return explicit

  const hoursPerDay = Number(
    cohort.hours_per_day ||
      cohort.daily_hours ||
      cohort.training_hours_per_day ||
      cohort.duration_hours_per_day ||
      8,
  )

  return addHours(startTime, hoursPerDay)
}

function normalizeCohortAssignments(cohort: AnyRow, trainersById: Map<string, AnyRow>) {
  const startDate = dateOnly(cohort.start_date || cohort.intake_start || cohort.date || new Date().toISOString())
  const endDate = dateOnly(cohort.end_date || cohort.intake_end || cohort.start_date || startDate)

  const days = eachDateInclusive(startDate, endDate)
  const startTime = cohortStartTime(cohort)
  const endTime = cohortEndTime(cohort, startTime)

  const title =
    cohort.program_title ||
    cohort.program_name ||
    cohort.title ||
    cohort.reference_number ||
    `Cohort ${cohort.id}`

  return days.map((day, index) => ({
    id: `cohort-${cohort.id}-${cohort.trainer_id}-${day}`,
    source: 'cohort',
    cohort_day_index: index + 1,
    cohort_total_days: days.length,
    trainer_id: cohort.trainer_id,
    trainer_name: trainerNameFrom(trainersById, cohort.trainer_id, cohort.trainer_name),
    cohort_id: cohort.id,
    cohort_title: cohort.title,
    cohort_reference: cohort.reference_number,
    program_id: cohort.program_id,
    program_title: cohort.program_title || cohort.program_name || title,
    title,
    status: cohort.status || 'planned',
    start_time: `${day}T${startTime}`,
    end_time: `${day}T${endTime}`,
    location: cohort.location || 'Academy training zone',
    delivery_format: cohort.delivery_format || 'onsite',
    readiness_score: cohort.readiness_score || 0,
    progression_percent: cohort.progression_percent || 0,
  }))
}

export async function GET() {
  const supabase = await createClient()

  const trainers = await safeRows(
    supabase
      .from('academy_trainers')
      .select('*')
      .limit(500),
  )

  const trainersById = new Map(trainers.map((trainer) => [String(trainer.id), trainer]))

  const existingAssignments = await safeRows(
    supabase
      .from('academy_trainer_assignments')
      .select('*')
      .order('start_time', { ascending: true }),
  )

  const assignedCohorts = await safeRows(
    supabase
      .from('academy_cohorts')
      .select('*')
      .not('trainer_id', 'is', null)
      .order('start_date', { ascending: true }),
  )

  const normalizedExisting = existingAssignments.map(normalizeExistingAssignment)

  const existingCohortKeys = new Set(
    normalizedExisting
      .filter((row) => row.cohort_id)
      .map((row) => `${row.cohort_id}:${row.trainer_id}:${dateOnly(row.start_time)}`),
  )

  const derivedFromCohorts = assignedCohorts
    .flatMap((cohort) => normalizeCohortAssignments(cohort, trainersById))
    .filter((row) => !existingCohortKeys.has(`${row.cohort_id}:${row.trainer_id}:${dateOnly(row.start_time)}`))

  const assignments = [...normalizedExisting, ...derivedFromCohorts]
    .filter((row) => row.trainer_id && row.start_time)
    .sort((a, b) => String(a.start_time).localeCompare(String(b.start_time)))

  return NextResponse.json({
    ok: true,
    data: assignments,
    assignments,
    count: assignments.length,
    derivedFromCohorts: derivedFromCohorts.length,
    existingAssignments: normalizedExisting.length,
  })
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const supabase = await createClient()

  const trainerId = body.trainer_id || body.trainerId
  if (!trainerId) {
    return NextResponse.json({ ok: false, error: 'trainer_id is required' }, { status: 400 })
  }

  const payload: AnyRow = {
    trainer_id: trainerId,
    trainer_name: body.trainer_name || body.trainerName || null,
    title: body.title || body.program_title || body.cohort_title || 'Scheduled training',
    status: body.status || 'planned',
    start_time: body.start_time || body.start_at || body.starts_at || body.scheduled_date || body.date || new Date().toISOString(),
    end_time: body.end_time || body.end_at || body.ends_at || null,
  }

  if (body.cohort_id !== undefined) payload.cohort_id = body.cohort_id
  if (body.cohort_title !== undefined) payload.cohort_title = body.cohort_title
  if (body.cohort_reference !== undefined) payload.cohort_reference = body.cohort_reference
  if (body.program_id !== undefined) payload.program_id = body.program_id
  if (body.program_title !== undefined) payload.program_title = body.program_title
  if (body.location !== undefined) payload.location = body.location
  if (body.delivery_format !== undefined) payload.delivery_format = body.delivery_format
  payload.updated_at = new Date().toISOString()

  const { data, error } = await supabase
    .from('academy_trainer_assignments')
    .insert(payload)
    .select('*')
    .maybeSingle()

  if (error) {
    const minimal = {
      trainer_id: trainerId,
      trainer_name: payload.trainer_name,
      title: payload.title,
      status: payload.status,
      start_time: payload.start_time,
      end_time: payload.end_time,
      updated_at: new Date().toISOString(),
    }

    const fallback = await supabase
      .from('academy_trainer_assignments')
      .insert(minimal)
      .select('*')
      .maybeSingle()

    if (fallback.error) {
      return NextResponse.json({ ok: false, error: fallback.error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, data: fallback.data, assignment: fallback.data })
  }

  return NextResponse.json({ ok: true, data, assignment: data })
}
