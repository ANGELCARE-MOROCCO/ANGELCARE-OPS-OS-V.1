import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { HR_TABLES, logHRActivity } from '@/lib/hr-production/repository'

export const dynamic = 'force-dynamic'

const TABLES: Record<string, string[]> = {
  staff: [HR_TABLES.staff, 'hr_staff', 'staff_profiles', 'profiles'],
  employees: [HR_TABLES.staff, 'hr_staff', 'staff_profiles', 'profiles'],
  performance: [HR_TABLES.performance, 'hr_reviews', 'performance_reviews'],
  leave: [HR_TABLES.leave, 'hr_leave_requests', HR_TABLES.approvals, 'hr_approval_requests'],
  attendance: [HR_TABLES.attendance, 'hr_attendance', 'attendance_records', 'attendance_events'],
  documents: [HR_TABLES.documents, 'hr_employee_documents', 'staff_documents'],
  compliance: [HR_TABLES.compliance, 'hr_compliance_obligations', 'hr_compliance'],
  syncEvents: [HR_TABLES.syncEvents, 'hr_sync_jobs', 'hr_audit_logs', 'hr_activity_timeline'],
  approvals: [HR_TABLES.approvals, 'hr_approvals', 'approval_requests'],
  settings: ['hr_settings', 'platform_settings'],
}

function cleanPayload(input: any) {
  const now = new Date().toISOString()
  const out: Record<string, any> = { updated_at: now, source: 'hr-command-screenshot-workspace' }
  for (const [key, value] of Object.entries(input || {})) {
    if (key === 'id') continue
    if (value === undefined) continue
    if (typeof value === 'string') out[key] = value.trim() || null
    else out[key] = value
  }
  return out
}

async function firstWorkingTable(supabase: any, logical: string) {
  const attempts = TABLES[logical] || [logical]
  const errors: string[] = []
  for (const table of attempts) {
    try {
      const { error } = await supabase.from(table).select('id', { head: true, count: 'exact' }).limit(1)
      if (!error) return { table, errors }
      errors.push(`${table}: ${error.message}`)
    } catch (err: any) {
      errors.push(`${table}: ${err?.message || String(err)}`)
    }
  }
  return { table: attempts[0], errors }
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const logical = req.nextUrl.searchParams.get('table') || 'staff'
  const { table, errors } = await firstWorkingTable(supabase, logical)
  try {
    const { data, error } = await supabase.from(table).select('*').limit(500)
    if (error) return NextResponse.json({ ok: false, table, error: error.message, warnings: errors }, { status: 500 })
    return NextResponse.json({ ok: true, table, records: data || [], warnings: errors })
  } catch (err: any) {
    return NextResponse.json({ ok: false, table, error: err?.message || 'Read failed', warnings: errors }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const body = await req.json().catch(() => ({}))
  const logical = String(body.table || 'staff')
  const { table, errors } = await firstWorkingTable(supabase, logical)
  const row: Record<string, any> = { ...cleanPayload(body.payload || body), created_at: new Date().toISOString() }
  delete row.table
  try {
    const { data, error } = await supabase.from(table).insert(row).select('*').single()
    if (error) return NextResponse.json({ ok: false, table, error: error.message, warnings: errors }, { status: 500 })
    await logHRActivity({ action: 'create', title: `Created ${logical} record`, entity_type: logical, entity_id: data?.id, status: 'created', module: 'hr', source: 'hr-command-records' })
    return NextResponse.json({ ok: true, table, record: data })
  } catch (err: any) {
    return NextResponse.json({ ok: false, table, error: err?.message || 'Create failed', warnings: errors }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const body = await req.json().catch(() => ({}))
  const logical = String(body.table || 'staff')
  const id = String(body.id || body.payload?.id || '')
  if (!id) return NextResponse.json({ ok: false, error: 'Missing record id' }, { status: 400 })
  const { table, errors } = await firstWorkingTable(supabase, logical)
  const row = cleanPayload(body.payload || body)
  try {
    const { data, error } = await supabase.from(table).update(row).eq('id', id).select('*').single()
    if (error) return NextResponse.json({ ok: false, table, error: error.message, warnings: errors }, { status: 500 })
    await logHRActivity({ action: 'update', title: `Updated ${logical} record`, entity_type: logical, entity_id: id, status: 'updated', module: 'hr', source: 'hr-command-records' })
    return NextResponse.json({ ok: true, table, record: data })
  } catch (err: any) {
    return NextResponse.json({ ok: false, table, error: err?.message || 'Update failed', warnings: errors }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const logical = req.nextUrl.searchParams.get('table') || 'staff'
  const id = req.nextUrl.searchParams.get('id') || ''
  if (!id) return NextResponse.json({ ok: false, error: 'Missing record id' }, { status: 400 })
  const { table, errors } = await firstWorkingTable(supabase, logical)
  try {
    const { error } = await supabase.from(table).delete().eq('id', id)
    if (error) return NextResponse.json({ ok: false, table, error: error.message, warnings: errors }, { status: 500 })
    await logHRActivity({ action: 'delete', title: `Deleted ${logical} record`, entity_type: logical, entity_id: id, status: 'deleted', module: 'hr', source: 'hr-command-records' })
    return NextResponse.json({ ok: true, table, id })
  } catch (err: any) {
    return NextResponse.json({ ok: false, table, error: err?.message || 'Delete failed', warnings: errors }, { status: 500 })
  }
}
