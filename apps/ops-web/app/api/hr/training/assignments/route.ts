import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

type AnyRow = Record<string, any>

function s(value: unknown) { return String(value ?? '').trim() }
function now() { return new Date().toISOString() }

async function insertActivity(supabase: any, payload: AnyRow) {
  const base = {
    module: 'hr_training',
    action: payload.action || 'training_assignment_created',
    entity_type: payload.entity_type || 'training_assignment',
    entity_id: payload.entity_id || null,
    title: payload.title || 'Training assignment created',
    description: payload.description || payload.notes || null,
    metadata: payload.metadata || payload,
    created_at: now(),
    updated_at: now(),
  }
  try { await supabase.from('hr_activity_timeline').insert(base) } catch {}
  try { await supabase.from('hr_training_audit_logs').insert(base) } catch {}
  try { await supabase.from('hr_audit_logs').insert({ ...base, event_type: base.action, severity: payload.severity || 'info' }) } catch {}
}

export async function GET() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('hr_training_assignments')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(500)
  return NextResponse.json({ ok: !error, data: data || [], error: error?.message })
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({} as AnyRow))
  const trainings = Array.isArray(body.trainings) ? body.trainings : []
  if (!trainings.length) return NextResponse.json({ ok: false, error: 'No trainings selected' }, { status: 400 })

  const supabase = await createClient()
  const assignmentIds: string[] = []
  const created: AnyRow[] = []
  const errors: string[] = []

  for (const training of trainings) {
    const trainingTitle = s(training.title || training.training_title || training.name) || 'Assigned training'
    const payload: AnyRow = {
      title: trainingTitle,
      training_title: trainingTitle,
      training_id: s(training.id) || null,
      staff_id: s(body.staff_id) || null,
      user_id: s(body.employee?.raw?.user_id || body.employee?.raw?.profile_id || '') || null,
      staff_name: s(body.staff_name || body.employee?.name),
      employee_name: s(body.staff_name || body.employee?.name),
      staff_email: s(body.staff_email || body.employee?.email),
      position_title: s(body.position_title || training.position || body.employee?.position),
      department: s(body.department || training.department || body.employee?.department),
      category: s(training.type || training.training_type || 'assigned_training'),
      audience: s(body.staff_name || body.employee?.name) || 'Selected employee',
      status: 'assigned',
      priority: s(body.priority) || s(training.priority) || 'mandatory',
      progress_percent: 0,
      start_at: s(body.start_at) || null,
      starting_at: s(body.start_at) || null,
      due_at: s(body.due_at) || null,
      due_date: s(body.due_at) ? s(body.due_at).slice(0, 10) : null,
      assigned_at: now(),
      last_activity_at: now(),
      description: s(training.description),
      resource_url: s(training.resource_url),
      notes: s(body.notes),
      metadata: {
        source: 'hr_training_assign_modal_enterprise',
        employee: body.employee || null,
        training,
        schedule: { start_at: body.start_at || null, due_at: body.due_at || null },
      },
      created_at: now(),
      updated_at: now(),
    }

    const { data, error } = await supabase
      .from('hr_training_assignments')
      .insert(payload)
      .select('*')
      .maybeSingle()

    if (error) {
      errors.push(`${trainingTitle}: ${error.message}`)
    } else {
      if (data?.id) assignmentIds.push(String(data.id))
      created.push(data || payload)
      try {
        await supabase.from('hr_training_records').upsert({
          id: data?.id || payload.training_id || undefined,
          training_id: payload.training_id,
          staff_id: payload.staff_id,
          user_id: payload.user_id,
          staff_name: payload.staff_name,
          employee_name: payload.employee_name,
          staff_email: payload.staff_email,
          position_title: payload.position_title,
          department: payload.department,
          title: payload.title,
          training_title: payload.training_title,
          category: payload.category,
          status: payload.status,
          progress_percent: payload.progress_percent,
          assigned_at: payload.assigned_at,
          due_at: payload.due_at,
          due_date: payload.due_date,
          priority: payload.priority,
          notes: payload.notes,
          metadata: payload.metadata,
          last_activity_at: payload.last_activity_at,
          updated_at: now(),
          created_at: now(),
        }, { onConflict: 'id' })
      } catch {}
      await insertActivity(supabase, {
        action: 'training_assigned_to_employee',
        entity_id: data?.id || null,
        title: `Training assigned: ${trainingTitle}`,
        description: `${trainingTitle} assigned to ${payload.staff_name}`,
        metadata: payload,
      })
    }
  }

  revalidatePath('/hr/training')
  revalidatePath('/hr')
  revalidatePath('/hr/employees')
  revalidatePath('/hr/staff')

  return NextResponse.json({ ok: errors.length === 0, mutationApplied: created.length > 0, assignmentIds, created, errors, count: created.length }, { status: errors.length && !created.length ? 500 : 200 })
}
