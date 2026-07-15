import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/getUser'
import { updateAcademyCohort } from '@/lib/academy-cohorts/repository'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Context = {
  params: Promise<{ id: string }> | { id: string }
}

function numberOrNull(value: any) {
  if (value === undefined || value === null || value === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function cleanTime(value: any, fallback: string) {
  if (value === undefined || value === null || value === '') return fallback
  const raw = String(value)
  const match = raw.match(/(\d{1,2}):(\d{2})/)
  if (!match) return fallback
  return `${match[1].padStart(2, '0')}:${match[2]}`
}

function cleanCohortPatch(body: any) {
  const patch: Record<string, any> = {}

  const textFields = [
    'reference_number',
    'title',
    'status',
    'notes',
    'program_title',
    'trainer_name',
  ]

  const numberFields = [
    'program_id',
    'capacity',
    'readiness_score',
    'progression_percent',
    'attendance_health',
  ]

  for (const key of textFields) {
    if (body[key] !== undefined) patch[key] = body[key] === '' ? null : String(body[key])
  }

  for (const key of numberFields) {
    if (body[key] !== undefined) patch[key] = numberOrNull(body[key])
  }

  if (body.start_date !== undefined) patch.start_date = body.start_date || null
  if (body.end_date !== undefined) patch.end_date = body.end_date || null
  if (body.trainer_id !== undefined) patch.trainer_id = body.trainer_id || null

  // Critical: do not force defaults unless the UI truly sends nothing.
  if (body.training_start_time !== undefined) {
    patch.training_start_time = cleanTime(body.training_start_time, '09:00')
  }

  if (body.training_end_time !== undefined) {
    patch.training_end_time = cleanTime(body.training_end_time, '17:00')
  }

  if (body.hours_per_day !== undefined) {
    const parsedHours = Number(body.hours_per_day)
    patch.hours_per_day = Number.isFinite(parsedHours) ? parsedHours : 8
  }

  patch.updated_at = new Date().toISOString()
  return patch
}

async function syncCohortToTrainerAssignments(supabase: any, cohort: Record<string, any>) {
  const cohortId = cohort?.id
  const trainerId = cohort?.trainer_id

  if (!cohortId) return

  if (!trainerId) {
    await supabase.from('academy_trainer_assignments').delete().eq('cohort_id', cohortId)
    return
  }

  const title =
    cohort?.program_title ||
    cohort?.program_name ||
    cohort?.title ||
    cohort?.reference_number ||
    `Cohort ${cohortId}`

  const startDate = cohort?.start_date || new Date().toISOString().slice(0, 10)
  const endDate = cohort?.end_date || startDate
  const startTime = cleanTime(cohort?.training_start_time, '09:00')
  const endTime = cleanTime(cohort?.training_end_time, '17:00')

  await supabase.from('academy_trainer_assignments').delete().eq('cohort_id', cohortId)

  const assignment = {
    trainer_id: trainerId,
    trainer_name: cohort?.trainer_name || null,
    cohort_id: cohortId,
    cohort_title: cohort?.title || null,
    cohort_reference: cohort?.reference_number || null,
    program_id: cohort?.program_id || null,
    program_title: cohort?.program_title || cohort?.program_name || title,
    title,
    status: cohort?.status || 'planned',
    start_time: `${startDate}T${startTime}:00`,
    end_time: `${endDate}T${endTime}:00`,
    updated_at: new Date().toISOString(),
  }

  const { error } = await supabase.from('academy_trainer_assignments').insert(assignment)

  if (error) {
    await supabase.from('academy_trainer_assignments').insert({
      trainer_id: trainerId,
      trainer_name: cohort?.trainer_name || null,
      title,
      status: cohort?.status || 'planned',
      start_time: `${startDate}T${startTime}:00`,
      end_time: `${endDate}T${endTime}:00`,
      updated_at: new Date().toISOString(),
    })
  }
}

export async function GET(_request: NextRequest, context: Context) {
  const params = await context.params
  const id = Number(params.id)

  if (!Number.isFinite(id)) {
    return NextResponse.json({ ok: false, error: 'Invalid cohort id' }, { status: 400 })
  }

  const supabase = await createClient()

  const { data: cohort, error } = await supabase
    .from('academy_cohorts')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  if (!cohort) return NextResponse.json({ ok: false, error: 'Cohort not found' }, { status: 404 })

  const { data: participants } = await supabase
    .from('academy_cohort_participants')
    .select('*')
    .eq('cohort_id', id)
    .order('joined_at', { ascending: true })

  const { data: checklist } = await supabase
    .from('academy_cohort_checklist')
    .select('*')
    .eq('cohort_id', id)
    .order('sort_order', { ascending: true })

  return NextResponse.json({
    ok: true,
    data: {
      ...cohort,
      training_start_time: cleanTime(cohort.training_start_time, '09:00'),
      training_end_time: cleanTime(cohort.training_end_time, '17:00'),
      hours_per_day: Number(cohort.hours_per_day || 8),
      participants: participants || [],
      checklist: checklist || [],
    },
  })
}

export async function PATCH(request: NextRequest, context: Context) {
  const params = await context.params
  const id = Number(params.id)

  if (!Number.isFinite(id)) {
    return NextResponse.json({ ok: false, error: 'Invalid cohort id' }, { status: 400 })
  }

  const body = await request.json().catch(() => ({}))
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ ok: false, error: 'Invalid JSON payload' }, { status: 400 })
  }

  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })

  try {
    const data = await updateAcademyCohort(String(id), body, user.id)
    if (!data) {
      return NextResponse.json({ ok: false, error: 'Cohort not found or not updated' }, { status: 404 })
    }

    const updatedCohort = data as Record<string, any>
    const supabase = await createClient()
    await syncCohortToTrainerAssignments(supabase, updatedCohort)

    return NextResponse.json({
      ok: true,
      data: {
        ...updatedCohort,
        training_start_time: cleanTime(updatedCohort.training_start_time, '09:00'),
        training_end_time: cleanTime(updatedCohort.training_end_time, '17:00'),
        hours_per_day: Number(updatedCohort.hours_per_day || 8),
      },
      cohort: updatedCohort,
      synced: true,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error || 'Unable to update cohort')
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, context: Context) {
  return PATCH(request, context)
}

export async function POST(request: NextRequest, context: Context) {
  return PATCH(request, context)
}
