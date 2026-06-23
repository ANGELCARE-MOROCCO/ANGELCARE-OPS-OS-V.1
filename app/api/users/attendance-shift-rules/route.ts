import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'

function clean(value: unknown) {
  const text = String(value || '').trim()
  return text.length ? text : null
}

function validTime(value: unknown, fallback: string) {
  const text = String(value || '').trim()
  return /^\d{2}:\d{2}$/.test(text) ? text : fallback
}

export async function GET() {
  await requireRole(['ceo', 'manager', 'admin', 'hr_admin', 'hr_manager', 'operations_manager'])

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('hr_attendance_shift_rules')
    .select('*')
    .eq('active', true)
    .order('updated_at', { ascending: false })

  if (error) {
    return NextResponse.json({ ok: false, error: error.message, rules: [] }, { status: 500 })
  }

  return NextResponse.json({ ok: true, rules: data || [] })
}

export async function POST(request: NextRequest) {
  const actor = await requireRole(['ceo', 'manager', 'admin', 'hr_admin', 'hr_manager', 'operations_manager'])
  const body = await request.json().catch(() => ({}))

  const userId = clean(body.userId)

  if (!userId) {
    return NextResponse.json({ ok: false, error: 'Missing userId' }, { status: 400 })
  }

  const row = {
    user_id: userId,
    staff_id: clean(body.staffId),
    employee_email: clean(body.employeeEmail),
    employee_name: clean(body.employeeName),
    shift_start: validTime(body.shiftStart, '10:00'),
    shift_end: validTime(body.shiftEnd, '18:00'),
    grace_minutes: Math.max(0, Math.min(120, Number(body.graceMinutes || 10))),
    active: true,
    notes: clean(body.notes),
    created_by: String(actor.id || actor.email || ''),
    updated_at: new Date().toISOString(),
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('hr_attendance_shift_rules')
    .upsert(row, { onConflict: 'user_id' })
    .select('*')
    .single()

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, rule: data })
}
