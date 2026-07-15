import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'

function clean(value: unknown) {
  const text = String(value || '').trim()
  return text.length ? text : null
}

function dateOnly(value: unknown) {
  const text = String(value || '').trim().slice(0, 10)
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : null
}

export async function GET(request: NextRequest) {
  await requireRole(['ceo', 'manager', 'admin', 'hr_admin', 'hr_manager', 'operations_manager'])

  const userId = clean(request.nextUrl.searchParams.get('userId'))
  const staffId = clean(request.nextUrl.searchParams.get('staffId'))
  const month = clean(request.nextUrl.searchParams.get('month'))

  const supabase = await createClient()
  let query = supabase
    .from('hr_attendance_authorized_absences')
    .select('*')
    .eq('status', 'approved')
    .order('start_date', { ascending: false })

  if (userId) query = query.eq('user_id', userId)
  if (!userId && staffId) query = query.eq('staff_id', staffId)

  if (month && /^\d{4}-\d{2}$/.test(month)) {
    const start = `${month}-01`
    const endDate = new Date(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0)
    const end = `${month}-${String(endDate.getDate()).padStart(2, '0')}`

    query = query.lte('start_date', end).gte('end_date', start)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ ok: false, error: error.message, records: [] }, { status: 500 })
  }

  return NextResponse.json({ ok: true, records: data || [] })
}

export async function POST(request: NextRequest) {
  const actor = await requireRole(['ceo', 'manager', 'admin', 'hr_admin', 'hr_manager', 'operations_manager'])
  const body = await request.json().catch(() => ({}))

  const startDate = dateOnly(body.startDate)
  const endDate = dateOnly(body.endDate || body.startDate)

  if (!startDate || !endDate) {
    return NextResponse.json({ ok: false, error: 'Missing valid date range' }, { status: 400 })
  }

  const row = {
    user_id: clean(body.userId),
    staff_id: clean(body.staffId),
    staff_profile_id: clean(body.staffProfileId),
    employee_email: clean(body.employeeEmail),
    employee_name: clean(body.employeeName),
    absence_type: clean(body.absenceType) || 'authorized_absence',
    status: 'approved',
    start_date: startDate,
    end_date: endDate,
    reason: clean(body.reason),
    notes: clean(body.notes),
    created_by: String(actor.id || actor.email || ''),
    updated_at: new Date().toISOString(),
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('hr_attendance_authorized_absences')
    .insert(row)
    .select('*')
    .single()

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, record: data })
}
