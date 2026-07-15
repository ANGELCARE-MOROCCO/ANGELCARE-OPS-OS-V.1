import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

type AnyRow = Record<string, any>

function val(form: FormData, key: string, fallback = '') {
  const value = form.get(key)
  return value == null ? fallback : String(value).trim()
}

function redirectTo(request: NextRequest, form: FormData) {
  const next = val(form, 'next', request.headers.get('referer') || '/hr/work-schedules')
  return NextResponse.redirect(new URL(next || '/hr/work-schedules', request.url), { status: 303 })
}

function cleanTime(value: string, fallback: string) {
  const raw = (value || '').trim()
  if (/^\d{1,2}:\d{2}/.test(raw)) return raw.padStart(5, '0').slice(0, 5)
  return fallback
}

function cleanDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : new Date().toISOString().slice(0, 10)
}

async function log(supabase: Awaited<ReturnType<typeof createClient>>, action: string, entityId: string | null, title: string, details: AnyRow) {
  try {
    await supabase.from('hr_schedule_activity_log').insert({
      module: 'hr_work_schedules',
      action,
      entity_type: 'roster_shift',
      entity_id: entityId,
      title,
      details,
    })
  } catch {}
}

function payloadFromForm(form: FormData) {
  const staffName = val(form, 'staff_name')
  const shiftType = val(form, 'shift_type', 'Day')
  const department = val(form, 'department', 'Operations')
  const workDate = cleanDate(val(form, 'work_date'))
  const start = cleanTime(val(form, 'start_time'), '09:00')
  const end = cleanTime(val(form, 'end_time'), '17:00')
  return {
    title: val(form, 'title', `${shiftType} shift · ${staffName || 'Unassigned'}`),
    staff_id: val(form, 'staff_id'),
    staff_name: staffName,
    department,
    location: val(form, 'location', val(form, 'city', 'Office')),
    work_date: workDate,
    start_time: start,
    end_time: end,
    shift_type: shiftType,
    status: val(form, 'status', 'planned'),
    notes: val(form, 'notes'),
    updated_at: new Date().toISOString(),
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const form = await request.formData()
  const action = val(form, '_action', 'create')
  const id = val(form, 'id')

  if (action === 'delete' && id) {
    await supabase.from('hr_roster_assignments').delete().eq('id', id)
    await log(supabase, 'delete_shift', id, 'Deleted roster shift', { id })
    return redirectTo(request, form)
  }

  if (action === 'duplicate' && id) {
    const { data } = await supabase.from('hr_roster_assignments').select('*').eq('id', id).maybeSingle()
    if (data) {
      const copy = { ...data, id: undefined, title: `${data.title || data.shift_type || 'Shift'} copy`, status: 'planned', created_at: undefined, updated_at: new Date().toISOString() }
      const { data: inserted } = await supabase.from('hr_roster_assignments').insert(copy).select('id').maybeSingle()
      await log(supabase, 'duplicate_shift', inserted?.id || id, 'Duplicated roster shift', { source_id: id })
    }
    return redirectTo(request, form)
  }

  const payload = payloadFromForm(form)
  if (action === 'update' && id) {
    await supabase.from('hr_roster_assignments').update(payload).eq('id', id)
    await log(supabase, 'update_shift', id, 'Updated roster shift', payload)
    return redirectTo(request, form)
  }

  const { data } = await supabase.from('hr_roster_assignments').insert({ ...payload, created_at: new Date().toISOString() }).select('id').maybeSingle()
  await log(supabase, 'create_shift', data?.id || null, 'Created roster shift', payload)
  return redirectTo(request, form)
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const body = await request.json().catch(() => ({}))
  const id = String(body.id || '')
  if (!id) return NextResponse.json({ ok: false, error: 'Missing shift id' }, { status: 400 })
  const payload = {
    title: body.title,
    staff_id: body.staff_id,
    staff_name: body.staff_name,
    department: body.department,
    location: body.location,
    work_date: body.work_date,
    start_time: body.start_time,
    end_time: body.end_time,
    shift_type: body.shift_type,
    status: body.status,
    notes: body.notes,
    updated_at: new Date().toISOString(),
  }
  const { data, error } = await supabase.from('hr_roster_assignments').update(payload).eq('id', id).select('*').maybeSingle()
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  await log(supabase, 'patch_shift', id, 'Patched roster shift', payload)
  return NextResponse.json({ ok: true, data })
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const id = new URL(request.url).searchParams.get('id')
  if (!id) return NextResponse.json({ ok: false, error: 'Missing id' }, { status: 400 })
  const { error } = await supabase.from('hr_roster_assignments').delete().eq('id', id)
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  await log(supabase, 'delete_shift', id, 'Deleted roster shift', { id })
  return NextResponse.json({ ok: true })
}
