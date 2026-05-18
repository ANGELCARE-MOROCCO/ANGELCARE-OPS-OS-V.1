import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const STAFF_TABLE_ATTEMPTS = ['hr_staff_profiles', 'hr_staff', 'staff_profiles', 'profiles']
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
function employeePayload(body: any) {
  const first = clean(body.first_name)
  const last = clean(body.last_name)
  const fullName = clean([first, last].filter(Boolean).join(' ')) || clean(body.preferred_name) || clean(body.email) || 'New employee'
  const now = new Date().toISOString()

  return {
    first_name: first,
    last_name: last,
    preferred_name: clean(body.preferred_name),
    full_name: fullName,
    name: fullName,
    email: clean(body.email),
    phone: clean(body.phone),
    national_id: clean(body.national_id),
    cin: clean(body.national_id),
    date_of_birth: isoOrNull(body.date_of_birth),
    place_of_birth: clean(body.place_of_birth),
    nationality: clean(body.nationality) || 'Moroccan',
    gender: clean(body.gender),
    marital_status: clean(body.marital_status),
    children_count: pickNumber(body.children_count) || 0,
    address: clean(body.address),
    city: clean(body.city),
    postal_code: clean(body.postal_code),
    country: clean(body.country) || 'Morocco',
    branch_office: clean(body.branch_office),
    location: clean(body.branch_office) || clean(body.work_city) || clean(body.city),
    work_city: clean(body.work_city),
    remote_option: clean(body.remote_option),
    position: clean(body.position),
    job_title: clean(body.position),
    department: clean(body.department),
    manager: clean(body.manager),
    reports_to: clean(body.manager),
    employment_status: body.save_as_draft ? 'Draft' : (clean(body.employment_status) || 'Active'),
    status: body.save_as_draft ? 'draft' : (clean(body.employment_status) || 'active'),
    employment_type: clean(body.employment_type),
    start_date: isoOrNull(body.start_date),
    hire_date: isoOrNull(body.start_date),
    probation_end_date: isoOrNull(body.probation_end_date),
    contract_type: clean(body.contract_type),
    salary: pickNumber(body.salary),
    currency: clean(body.currency) || 'MAD',
    payment_method: clean(body.payment_method),
    cnss_number: clean(body.cnss_number),
    amo_number: clean(body.amo_number),
    emergency_contact_name: clean(body.emergency_name),
    emergency_contact_phone: clean(body.emergency_phone),
    emergency_contact_relation: clean(body.emergency_relation),
    create_login_account: Boolean(body.create_login_account),
    send_welcome_email: Boolean(body.send_welcome_email),
    onboarding_status: body.save_as_draft ? 'draft' : 'pending',
    source: 'hr-employees-command-center',
    created_at: now,
    updated_at: now,
  }
}

function stripUndefined(row: Record<string, any>) {
  return Object.fromEntries(Object.entries(row).filter(([, value]) => value !== undefined))
}

async function insertWithFallback(supabase: any, row: Record<string, any>) {
  const errors: string[] = []
  for (const table of STAFF_TABLE_ATTEMPTS) {
    try {
      const { data, error } = await supabase.from(table).insert(stripUndefined(row)).select('*').single()
      if (!error) return { data, table, errors }
      errors.push(`${table}: ${error.message}`)
    } catch (err: any) {
      errors.push(`${table}: ${err?.message || String(err)}`)
    }
  }

  // Ultra-compatible fallback for stricter existing schemas.
  const minimal = stripUndefined({
    full_name: row.full_name,
    name: row.name,
    email: row.email,
    phone: row.phone,
    department: row.department,
    position: row.position,
    job_title: row.job_title,
    city: row.city,
    location: row.location,
    status: row.status,
    employment_status: row.employment_status,
    created_at: row.created_at,
    updated_at: row.updated_at,
  })

  for (const table of STAFF_TABLE_ATTEMPTS) {
    try {
      const { data, error } = await supabase.from(table).insert(minimal).select('*').single()
      if (!error) return { data, table, errors }
      errors.push(`${table} minimal: ${error.message}`)
    } catch (err: any) {
      errors.push(`${table} minimal: ${err?.message || String(err)}`)
    }
  }

  return { data: null, table: null, errors }
}

async function logActivity(supabase: any, employee: any, body: any) {
  const row = {
    module: 'hr',
    source: 'hr-employees-command-center',
    status: body.save_as_draft ? 'draft_created' : 'employee_created',
    title: body.save_as_draft ? 'Employee draft created' : 'Employee profile created',
    description: `${employee?.full_name || employee?.name || body.email || 'Employee'} was created from the Employees Command Center.`,
    employee_id: employee?.id || null,
    staff_id: employee?.id || null,
    created_at: new Date().toISOString(),
  }
  for (const table of AUDIT_TABLE_ATTEMPTS) {
    try { await supabase.from(table).insert(row) } catch {}
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    if (!clean(body.first_name) && !clean(body.last_name) && !clean(body.email)) {
      return NextResponse.json({ ok: false, error: 'Please provide at least a name or email.' }, { status: 400 })
    }

    const supabase = await createClient()
    const row = employeePayload(body)
    const result = await insertWithFallback(supabase, row)

    if (!result.data) {
      return NextResponse.json({ ok: false, error: 'Could not insert employee into any known staff table.', details: result.errors }, { status: 500 })
    }

    await logActivity(supabase, result.data, body)

    return NextResponse.json({ ok: true, employee: result.data, table: result.table, warnings: result.errors })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Unexpected employee creation error' }, { status: 500 })
  }
}
