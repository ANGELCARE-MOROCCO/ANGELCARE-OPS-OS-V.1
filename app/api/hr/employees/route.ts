import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const STAFF_TABLE_ATTEMPTS = ['hr_staff_profiles', 'hr_staff', 'staff_profiles', 'profiles']
const USER_TABLE_ATTEMPTS = ['app_users', 'users', 'profiles']
const RELATED_TABLES = [
  'hr_attendance_records', 'hr_attendance', 'attendance_records', 'attendance_events',
  'hr_leave_requests', 'hr_payroll_inputs', 'hr_contracts', 'hr_documents', 'hr_training_records',
  'hr_roster_assignments', 'hr_rosters', 'hr_performance_reviews', 'hr_onboarding_tasks',
]
const AUDIT_TABLE_ATTEMPTS = ['hr_audit_logs', 'hr_activity_timeline', 'hr_activity_log', 'hr_audit_trail']

function clean(value: any) {
  if (value === undefined || value === null) return null
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed.length ? trimmed : null
  }
  return value
}
function pickNumber(value: any) {
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}
function isoOrNull(value: any) {
  const v = clean(value)
  if (!v) return null
  return String(v)
}
function stripUndefined(row: Record<string, any>) {
  return Object.fromEntries(Object.entries(row).filter(([, value]) => value !== undefined))
}
function normalizeName(body: any) {
  const first = clean(body.first_name)
  const last = clean(body.last_name)
  return clean(body.full_name) || clean(body.name) || clean([first, last].filter(Boolean).join(' ')) || clean(body.preferred_name) || clean(body.email) || 'New employee'
}
function employeePayload(body: any, mode: 'create' | 'update' = 'create') {
  const fullName = normalizeName(body)
  const now = new Date().toISOString()
  const base: Record<string, any> = {
    first_name: clean(body.first_name),
    last_name: clean(body.last_name),
    preferred_name: clean(body.preferred_name),
    full_name: fullName,
    name: fullName,
    email: clean(body.email),
    phone: clean(body.phone),
    national_id: clean(body.national_id),
    cin: clean(body.national_id),
    date_of_birth: isoOrNull(body.date_of_birth),
    place_of_birth: clean(body.place_of_birth),
    nationality: clean(body.nationality) || (mode === 'create' ? 'Moroccan' : undefined),
    gender: clean(body.gender),
    marital_status: clean(body.marital_status),
    children_count: body.children_count !== undefined ? (pickNumber(body.children_count) || 0) : undefined,
    address: clean(body.address),
    city: clean(body.city),
    postal_code: clean(body.postal_code),
    country: clean(body.country) || (mode === 'create' ? 'Morocco' : undefined),
    branch_office: clean(body.branch_office),
    location: clean(body.location) || clean(body.branch_office) || clean(body.work_city) || clean(body.city),
    work_city: clean(body.work_city) || clean(body.city),
    remote_option: clean(body.remote_option),
    position: clean(body.position),
    job_title: clean(body.position),
    department: clean(body.department),
    role: clean(body.role),
    manager: clean(body.manager),
    reports_to: clean(body.manager),
    employment_status: body.save_as_draft ? 'Draft' : clean(body.employment_status),
    status: body.save_as_draft ? 'draft' : clean(body.employment_status),
    employment_type: clean(body.employment_type),
    start_date: isoOrNull(body.start_date),
    hire_date: isoOrNull(body.start_date),
    probation_end_date: isoOrNull(body.probation_end_date),
    contract_type: clean(body.contract_type),
    salary: body.salary !== undefined ? pickNumber(body.salary) : undefined,
    currency: clean(body.currency),
    payment_method: clean(body.payment_method),
    cnss_number: clean(body.cnss_number),
    amo_number: clean(body.amo_number),
    emergency_contact_name: clean(body.emergency_name),
    emergency_contact_phone: clean(body.emergency_phone),
    emergency_contact_relation: clean(body.emergency_relation),
    create_login_account: body.create_login_account === undefined ? undefined : Boolean(body.create_login_account),
    send_welcome_email: body.send_welcome_email === undefined ? undefined : Boolean(body.send_welcome_email),
    onboarding_status: body.save_as_draft ? 'draft' : mode === 'create' ? 'pending' : undefined,
    source: 'hr-employees-command-center',
    updated_at: now,
  }
  if (mode === 'create') base.created_at = now
  if (mode === 'create' && !base.employment_status) base.employment_status = 'Active'
  if (mode === 'create' && !base.status) base.status = 'active'
  return stripUndefined(base)
}

async function selectFromTable(supabase: any, table: string, id: string | null, email: string | null) {
  try {
    if (id) {
      const { data, error } = await supabase.from(table).select('*').eq('id', id).maybeSingle()
      if (!error && data) return data
    }
  } catch {}
  try {
    if (email) {
      const { data, error } = await supabase.from(table).select('*').eq('email', email).maybeSingle()
      if (!error && data) return data
    }
  } catch {}
  return null
}
async function countRelated(supabase: any, employee: any, table: string) {
  const id = employee?.id || null
  const email = employee?.email || null
  const candidates = [
    ['staff_id', id], ['employee_id', id], ['profile_id', id], ['user_id', employee?.user_id || id], ['email', email]
  ].filter(([, v]) => v)
  for (const [column, value] of candidates) {
    try {
      const { count, error } = await supabase.from(table).select('id', { count: 'exact', head: true }).eq(column, value)
      if (!error && typeof count === 'number') return count
    } catch {}
  }
  return 0
}
async function enrichEmployee(supabase: any, employee: any) {
  const sync: Record<string, number> = {
    attendance: 0, leave: 0, payroll: 0, documents: 0, contracts: 0, roster: 0, training: 0, performance: 0, onboarding: 0,
  }
  const map: Record<string, string[]> = {
    attendance: ['hr_attendance_records', 'hr_attendance', 'attendance_records'],
    leave: ['hr_leave_requests'],
    payroll: ['hr_payroll_inputs'],
    documents: ['hr_documents'],
    contracts: ['hr_contracts'],
    roster: ['hr_roster_assignments', 'hr_rosters'],
    training: ['hr_training_records'],
    performance: ['hr_performance_reviews'],
    onboarding: ['hr_onboarding_tasks'],
  }
  for (const [key, tables] of Object.entries(map)) {
    for (const table of tables) {
      const n = await countRelated(supabase, employee, table)
      if (n) { sync[key] = n; break }
    }
  }
  const required = ['full_name', 'email', 'department', 'position', 'city', 'employment_status']
  const filled = required.filter((k) => clean(employee?.[k] || employee?.[k === 'position' ? 'job_title' : k])).length
  const readiness = Math.round((filled / required.length) * 70 + Math.min(30, Object.values(sync).reduce((a, b) => a + Number(b || 0), 0) * 4))
  sync.readiness = Math.max(0, Math.min(100, readiness))
  sync.risk = Math.max(0, Math.min(100, 100 - sync.readiness))
  return { ...employee, __sync: sync }
}

async function insertWithFallback(supabase: any, row: Record<string, any>) {
  const errors: string[] = []
  for (const table of STAFF_TABLE_ATTEMPTS) {
    try {
      const { data, error } = await supabase.from(table).insert(row).select('*').single()
      if (!error) return { data, table, errors }
      errors.push(`${table}: ${error.message}`)
    } catch (err: any) { errors.push(`${table}: ${err?.message || String(err)}`) }
  }
  const minimal = stripUndefined({ full_name: row.full_name, name: row.name, email: row.email, phone: row.phone, department: row.department, position: row.position, job_title: row.job_title, city: row.city, location: row.location, status: row.status, employment_status: row.employment_status, created_at: row.created_at, updated_at: row.updated_at })
  for (const table of STAFF_TABLE_ATTEMPTS) {
    try {
      const { data, error } = await supabase.from(table).insert(minimal).select('*').single()
      if (!error) return { data, table, errors }
      errors.push(`${table} minimal: ${error.message}`)
    } catch (err: any) { errors.push(`${table} minimal: ${err?.message || String(err)}`) }
  }
  return { data: null, table: null, errors }
}
async function updateWithFallback(supabase: any, id: string | null, email: string | null, row: Record<string, any>) {
  const errors: string[] = []
  for (const table of STAFF_TABLE_ATTEMPTS) {
    try {
      if (id) {
        const { data, error } = await supabase.from(table).update(row).eq('id', id).select('*').maybeSingle()
        if (!error && data) return { data, table, errors }
        if (error) errors.push(`${table} id: ${error.message}`)
      }
    } catch (err: any) { errors.push(`${table} id: ${err?.message || String(err)}`) }
    try {
      if (email) {
        const { data, error } = await supabase.from(table).update(row).eq('email', email).select('*').maybeSingle()
        if (!error && data) return { data, table, errors }
        if (error) errors.push(`${table} email: ${error.message}`)
      }
    } catch (err: any) { errors.push(`${table} email: ${err?.message || String(err)}`) }
  }
  return { data: null, table: null, errors }
}
async function deleteFromKnownTables(supabase: any, id: string | null, email: string | null) {
  const deleted: string[] = []
  const errors: string[] = []
  for (const table of [...RELATED_TABLES, ...STAFF_TABLE_ATTEMPTS, ...USER_TABLE_ATTEMPTS]) {
    for (const [column, value] of [['staff_id', id], ['employee_id', id], ['profile_id', id], ['user_id', id], ['id', id], ['email', email]] as any[]) {
      if (!value) continue
      try {
        const { error } = await supabase.from(table).delete().eq(column, value)
        if (!error) { deleted.push(`${table}.${column}`); break }
        errors.push(`${table}.${column}: ${error.message}`)
      } catch (err: any) { errors.push(`${table}.${column}: ${err?.message || String(err)}`) }
    }
  }
  return { deleted: Array.from(new Set(deleted)), errors }
}
async function logActivity(supabase: any, employee: any, action: string, description: string) {
  const row = { module: 'hr', source: 'hr-employees-command-center', status: action, title: action.replaceAll('_', ' '), description, entity_type: 'staff', entity_id: employee?.id || null, employee_id: employee?.id || null, staff_id: employee?.id || null, created_at: new Date().toISOString() }
  for (const table of AUDIT_TABLE_ATTEMPTS) {
    try { await supabase.from(table).insert(row) } catch {}
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const id = clean(url.searchParams.get('id')) as string | null
    const email = clean(url.searchParams.get('email')) as string | null
    const supabase = await createClient()
    for (const table of STAFF_TABLE_ATTEMPTS) {
      const found = await selectFromTable(supabase, table, id, email)
      if (found) return NextResponse.json({ ok: true, employee: await enrichEmployee(supabase, found), table })
    }
    return NextResponse.json({ ok: false, error: 'Employee not found.' }, { status: 404 })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Employee lookup failed' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    if (!clean(body.first_name) && !clean(body.last_name) && !clean(body.full_name) && !clean(body.email)) return NextResponse.json({ ok: false, error: 'Please provide at least a name or email.' }, { status: 400 })
    const supabase = await createClient()
    const row = employeePayload(body, 'create')
    const result = await insertWithFallback(supabase, row)
    if (!result.data) return NextResponse.json({ ok: false, error: 'Could not insert employee into any known staff table.', details: result.errors }, { status: 500 })
    await logActivity(supabase, result.data, body.save_as_draft ? 'employee_draft_created' : 'employee_created', `${result.data?.full_name || result.data?.name || body.email || 'Employee'} was created from the Employees Command Center.`)
    return NextResponse.json({ ok: true, employee: result.data, table: result.table, warnings: result.errors })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Unexpected employee creation error' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const id = clean(body.id) as string | null
    const email = clean(body.email) as string | null
    if (!id && !email) return NextResponse.json({ ok: false, error: 'Missing employee id or email.' }, { status: 400 })
    const supabase = await createClient()
    const row = employeePayload(body, 'update')
    const result = await updateWithFallback(supabase, id, email, row)
    if (!result.data) return NextResponse.json({ ok: false, error: 'Could not update employee in known staff tables.', details: result.errors }, { status: 500 })
    await logActivity(supabase, result.data, 'employee_updated', `${result.data?.full_name || result.data?.name || email || id} was updated from the live staff modal.`)
    return NextResponse.json({ ok: true, employee: await enrichEmployee(supabase, result.data), table: result.table, warnings: result.errors })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Employee update failed' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url)
    const id = clean(url.searchParams.get('id')) as string | null
    const email = clean(url.searchParams.get('email')) as string | null
    if (!id && !email) return NextResponse.json({ ok: false, error: 'Missing employee id or email.' }, { status: 400 })
    const supabase = await createClient()
    const before = id || email ? { id, email } : null
    const result = await deleteFromKnownTables(supabase, id, email)
    await logActivity(supabase, before, 'employee_deleted', `Employee ${email || id} was deleted from the Employees Command Center.`)
    return NextResponse.json({ ok: true, deleted: result.deleted, warnings: result.errors })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Employee delete failed' }, { status: 500 })
  }
}
