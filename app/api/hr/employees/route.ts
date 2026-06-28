import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

const STAFF_TABLE_ATTEMPTS = ['hr_staff_profiles', 'hr_staff', 'staff_profiles', 'profiles']
const USER_TABLE_ATTEMPTS = ['app_users', 'users', 'profiles']
const RELATED_TABLES = [
  'hr_attendance_records', 'hr_attendance', 'attendance_records', 'attendance_events',
  'hr_leave_requests', 'hr_payroll_inputs', 'hr_contracts', 'hr_documents', 'hr_training_records', 'hr_training_assignments',
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

const AC_HR_WORKSPACE_BEGIN_V2 = '[[ANGELCARE_HR_WORKSPACE_V2_BEGIN]]'
const AC_HR_WORKSPACE_END_V2 = '[[ANGELCARE_HR_WORKSPACE_V2_END]]'

function acPlainObjectV2(value: any) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {}
}

function acExtractWorkspaceFromNotesV2(notes: any) {
  const text = String(notes || '')
  const start = text.indexOf(AC_HR_WORKSPACE_BEGIN_V2)
  const end = text.indexOf(AC_HR_WORKSPACE_END_V2)

  if (start === -1 || end === -1 || end <= start) return null

  const json = text.slice(start + AC_HR_WORKSPACE_BEGIN_V2.length, end).trim()

  try {
    const parsed = JSON.parse(json)
    return Array.isArray(parsed?.hr_management_workspace) ? parsed : null
  } catch {
    return null
  }
}

function acNotesWithWorkspaceV2(existingNotes: any, workspaceMeta: Record<string, any>) {
  const text = String(existingNotes || '')
  const start = text.indexOf(AC_HR_WORKSPACE_BEGIN_V2)
  const end = text.indexOf(AC_HR_WORKSPACE_END_V2)

  const before = start >= 0 ? text.slice(0, start).trim() : text.trim()
  const after = start >= 0 && end >= 0 ? text.slice(end + AC_HR_WORKSPACE_END_V2.length).trim() : ''

  const payload = JSON.stringify(workspaceMeta)

  return [
    before,
    AC_HR_WORKSPACE_BEGIN_V2,
    payload,
    AC_HR_WORKSPACE_END_V2,
    after,
  ].filter(Boolean).join('\n')
}

function acAttachWorkspaceToEmployeeV2(employee: any) {
  if (!employee) return employee

  const metadata = acPlainObjectV2(employee.metadata)
  const data = acPlainObjectV2(employee.data)
  const notesWorkspace = acExtractWorkspaceFromNotesV2(employee.notes)

  const hasMetadataWorkspace = Object.prototype.hasOwnProperty.call(metadata, 'hr_management_workspace')
  const hasDataWorkspace = Object.prototype.hasOwnProperty.call(data, 'hr_management_workspace')
  const hasTopWorkspace = Object.prototype.hasOwnProperty.call(employee, 'hr_management_workspace')
  const hasNotesWorkspace = Boolean(notesWorkspace && Object.prototype.hasOwnProperty.call(notesWorkspace, 'hr_management_workspace'))

  const workspace =
    hasMetadataWorkspace && Array.isArray(metadata.hr_management_workspace) ? metadata.hr_management_workspace :
    hasDataWorkspace && Array.isArray(data.hr_management_workspace) ? data.hr_management_workspace :
    hasTopWorkspace && Array.isArray(employee.hr_management_workspace) ? employee.hr_management_workspace :
    hasNotesWorkspace && Array.isArray(notesWorkspace?.hr_management_workspace) ? notesWorkspace.hr_management_workspace :
    null

  const deletedKeys =
    Array.isArray(metadata.hr_management_workspace_deleted_keys) ? metadata.hr_management_workspace_deleted_keys :
    Array.isArray(data.hr_management_workspace_deleted_keys) ? data.hr_management_workspace_deleted_keys :
    Array.isArray(notesWorkspace?.hr_management_workspace_deleted_keys) ? notesWorkspace.hr_management_workspace_deleted_keys :
    []

  const hasSavedWorkspace =
    Boolean(metadata.hr_management_workspace_saved) ||
    Boolean(data.hr_management_workspace_saved) ||
    Boolean(notesWorkspace?.hr_management_workspace_saved) ||
    hasMetadataWorkspace ||
    hasDataWorkspace ||
    hasTopWorkspace ||
    hasNotesWorkspace

  if (!hasSavedWorkspace && !workspace) return employee

  return {
    ...employee,
    metadata: {
      ...metadata,
      ...(notesWorkspace || {}),
      hr_management_workspace: Array.isArray(workspace) ? workspace : [],
      hr_management_workspace_deleted_keys: deletedKeys,
      hr_management_workspace_saved: hasSavedWorkspace,
    },
    data: {
      ...data,
      hr_management_workspace: Array.isArray(workspace) ? workspace : [],
      hr_management_workspace_deleted_keys: deletedKeys,
      hr_management_workspace_saved: hasSavedWorkspace,
    },
    hr_management_workspace: Array.isArray(workspace) ? workspace : [],
  }
}

function acWorkspaceMetaFromBodyV2(body: any) {
  const metadata = acPlainObjectV2(body?.metadata)
  const data = acPlainObjectV2(body?.data)

  const hasTopWorkspace = Object.prototype.hasOwnProperty.call(body || {}, 'hr_management_workspace')
  const hasMetadataWorkspace = Object.prototype.hasOwnProperty.call(metadata, 'hr_management_workspace')
  const hasDataWorkspace = Object.prototype.hasOwnProperty.call(data, 'hr_management_workspace')

  const workspace =
    hasTopWorkspace && Array.isArray(body?.hr_management_workspace) ? body.hr_management_workspace :
    hasMetadataWorkspace && Array.isArray(metadata.hr_management_workspace) ? metadata.hr_management_workspace :
    hasDataWorkspace && Array.isArray(data.hr_management_workspace) ? data.hr_management_workspace :
    []

  if (!hasTopWorkspace && !hasMetadataWorkspace && !hasDataWorkspace) return null

  const deletedKeys = Array.from(new Set([
    ...(Array.isArray(body?.hr_management_workspace_deleted_keys) ? body.hr_management_workspace_deleted_keys : []),
    ...(Array.isArray(metadata.hr_management_workspace_deleted_keys) ? metadata.hr_management_workspace_deleted_keys : []),
    ...(Array.isArray(data.hr_management_workspace_deleted_keys) ? data.hr_management_workspace_deleted_keys : []),
  ].map((value) => String(value || '').trim()).filter(Boolean)))

  const now = new Date().toISOString()

  return {
    ...metadata,
    hr_management_workspace: workspace,
    hr_management_workspace_deleted_keys: deletedKeys,
    hr_management_workspace_saved: true,
    hr_management_workspace_updated_at: body?.hr_management_workspace_updated_at || metadata.hr_management_workspace_updated_at || now,
    hr_management_workspace_source: body?.hr_management_workspace_source || metadata.hr_management_workspace_source || 'employee_360_dossier_modal',
    hr_management_workspace_case_count: workspace.length,
    hr_management_workspace_validated_count: workspace.filter((item: any) =>
      String(item?.validation_status || item?.status || '').toLowerCase().includes('valid')
    ).length,
    hr_management_workspace_last_saved_at: now,
    hr_management_workspace_last_event: body?.audit_event || metadata.hr_management_workspace_last_event || null,
  }
}

async function acUpdateRowWithSchemaFallbackV2(supabase: any, table: string, existing: any, row: Record<string, any>, id: string | null, email: string | null) {
  let current = { ...row }

  for (let attempt = 0; attempt < 8; attempt += 1) {
    try {
      let query = supabase.from(table).update(current)

      if (existing?.id) query = query.eq('id', existing.id)
      else if (id) query = query.eq('id', id)
      else if (email) query = query.eq('email', email)
      else return { data: null, error: { message: 'No update key available' } }

      const { data, error } = await query.select('*').maybeSingle()

      if (!error && data) return { data, error: null }

      const msg = String(error?.message || '')
      const missing1 = msg.match(/Could not find the '([^']+)' column/i)?.[1]
      const missing2 = msg.match(/column "([^"]+)" .*does not exist/i)?.[1]
      const missing = missing1 || missing2

      if (missing && missing in current) {
        delete current[missing]
        continue
      }

      return { data: null, error }
    } catch (error: any) {
      return { data: null, error }
    }
  }

  return { data: null, error: { message: 'Schema fallback exhausted' } }
}

async function acPersistHRWorkspaceV2(supabase: any, id: string | null, email: string | null, workspaceMeta: Record<string, any>) {
  const errors: string[] = []
  const now = new Date().toISOString()

  for (const table of STAFF_TABLE_ATTEMPTS) {
    const existing = await selectFromTable(supabase, table, id, email)
    if (!existing) continue

    const mergedMetadata = {
      ...acPlainObjectV2(existing.metadata),
      ...workspaceMeta,
    }

    const mergedData = {
      ...acPlainObjectV2(existing.data),
      ...workspaceMeta,
    }

    const attempts = [
      {
        label: 'metadata',
        row: {
          metadata: mergedMetadata,
          updated_at: now,
        },
      },
      {
        label: 'data',
        row: {
          data: mergedData,
          updated_at: now,
        },
      },
      {
        label: 'top_level',
        row: {
          hr_management_workspace: workspaceMeta.hr_management_workspace,
          hr_management_workspace_updated_at: workspaceMeta.hr_management_workspace_updated_at,
          hr_management_workspace_source: workspaceMeta.hr_management_workspace_source,
          updated_at: now,
        },
      },
      {
        label: 'notes_marker',
        row: {
          notes: acNotesWithWorkspaceV2(existing.notes, workspaceMeta),
          updated_at: now,
        },
      },
    ]

    for (const attempt of attempts) {
      const result = await acUpdateRowWithSchemaFallbackV2(supabase, table, existing, attempt.row, id, email)

      if (result.data) {
        return {
          data: acAttachWorkspaceToEmployeeV2(result.data),
          table,
          storage: attempt.label,
          errors,
        }
      }

      if (result.error?.message) errors.push(`${table}.${attempt.label}: ${result.error.message}`)
    }
  }

  return { data: null, table: null, storage: null, errors }
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
    training: ['hr_training_records', 'hr_training_assignments'],
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
  return { ...acAttachWorkspaceToEmployeeV2(employee), __sync: sync }
}


function plainRecord(value: any) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {}
}

function hrWorkspaceMetaFromBody(body: any) {
  const metadata = plainRecord(body?.metadata)
  const data = plainRecord(body?.data)
  const workspace =
    metadata.hr_management_workspace ||
    data.hr_management_workspace ||
    body?.hr_management_workspace ||
    []

  if (!Array.isArray(workspace)) return null

  const now = new Date().toISOString()

  return {
    ...metadata,
    hr_management_workspace: workspace,
    hr_management_workspace_updated_at: metadata.hr_management_workspace_updated_at || body?.hr_management_workspace_updated_at || now,
    hr_management_workspace_source: metadata.hr_management_workspace_source || body?.hr_management_workspace_source || 'employee_360_dossier_modal',
    hr_management_workspace_case_count: workspace.length,
    hr_management_workspace_validated_count: workspace.filter((item: any) => String(item?.validation_status || item?.status || '').toLowerCase().includes('valid')).length,
    hr_management_workspace_last_saved_at: now,
  }
}

async function updateHRWorkspaceWithFallback(supabase: any, id: string | null, email: string | null, workspaceMeta: Record<string, any>) {
  const errors: string[] = []
  const now = new Date().toISOString()

  for (const table of STAFF_TABLE_ATTEMPTS) {
    const existing = await selectFromTable(supabase, table, id, email)
    if (!existing) continue

    const mergedMetadata = {
      ...plainRecord(existing.metadata),
      ...workspaceMeta,
    }

    const mergedData = {
      ...plainRecord(existing.data),
      ...workspaceMeta,
    }

    const attempts = [
      {
        label: 'metadata',
        row: {
          metadata: mergedMetadata,
          updated_at: now,
        },
      },
      {
        label: 'data',
        row: {
          data: mergedData,
          updated_at: now,
        },
      },
      {
        label: 'top_level',
        row: {
          hr_management_workspace: workspaceMeta.hr_management_workspace,
          hr_management_workspace_updated_at: workspaceMeta.hr_management_workspace_updated_at,
          hr_management_workspace_source: workspaceMeta.hr_management_workspace_source,
          updated_at: now,
        },
      },
    ]

    for (const attempt of attempts) {
      try {
        let query = supabase.from(table).update(attempt.row)

        if (id && existing.id === id) query = query.eq('id', id)
        else if (existing.id) query = query.eq('id', existing.id)
        else if (email) query = query.eq('email', email)
        else continue

        const { data, error } = await query.select('*').maybeSingle()

        if (!error && data) {
          return {
            data,
            table,
            storage: attempt.label,
            errors,
          }
        }

        if (error) errors.push(`${table}.${attempt.label}: ${error.message}`)
      } catch (err: any) {
        errors.push(`${table}.${attempt.label}: ${err?.message || String(err)}`)
      }
    }
  }

  return { data: null, table: null, storage: null, errors }
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
    revalidatePath('/hr/employees')
    revalidatePath('/hr/staff')
    revalidatePath('/hr/onboarding')
    revalidatePath('/hr/training')
    revalidatePath('/hr')
    return NextResponse.json({ ok: true, employee: result.data, table: result.table, warnings: result.errors })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Unexpected employee creation error' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const url = new URL(request.url)
    const body = await request.json()

    const id = (clean(body.id) || clean(url.searchParams.get('id'))) as string | null
    const email = (clean(body.email) || clean(url.searchParams.get('email'))) as string | null

    if (!id && !email) {
      return NextResponse.json({ ok: false, error: 'Missing employee id or email.' }, { status: 400 })
    }

    const supabase = await createClient()
    const workspaceMeta = acWorkspaceMetaFromBodyV2(body)

    if (workspaceMeta) {
      const result = await acPersistHRWorkspaceV2(supabase, id, email, workspaceMeta)

      if (!result.data) {
        return NextResponse.json({
          ok: false,
          error: 'Could not persist HR workspace into employee production record.',
          details: result.errors,
        }, { status: 500 })
      }

      await logActivity(
        supabase,
        result.data,
        'employee_hr_workspace_saved',
        `${result.data?.full_name || result.data?.name || email || id} HR workspace was saved from Employee 360 Case Operations Center.`,
      )

      revalidatePath('/hr/employees')
      revalidatePath('/hr/staff')
      revalidatePath('/hr/onboarding')
      revalidatePath('/hr/training')
      revalidatePath('/hr')

      return NextResponse.json({
        ok: true,
        employee: await enrichEmployee(supabase, result.data),
        table: result.table,
        storage: result.storage,
        workspace_saved: true,
        workspace_count: Array.isArray(workspaceMeta.hr_management_workspace) ? workspaceMeta.hr_management_workspace.length : 0,
        warnings: result.errors,
      })
    }

    const row = employeePayload(body, 'update')
    const result = await updateWithFallback(supabase, id, email, row)

    if (!result.data) {
      return NextResponse.json({ ok: false, error: 'Could not update employee in known staff tables.', details: result.errors }, { status: 500 })
    }

    await logActivity(supabase, result.data, 'employee_updated', `${result.data?.full_name || result.data?.name || email || id} was updated from the live staff modal.`)

    revalidatePath('/hr/employees')
    revalidatePath('/hr/staff')
    revalidatePath('/hr/onboarding')
    revalidatePath('/hr/training')
    revalidatePath('/hr')

    return NextResponse.json({ ok: true, employee: await enrichEmployee(supabase, result.data), table: result.table, warnings: result.errors })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Employee update failed' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url)
    const body = await request.json().catch(() => ({}))
    const id = clean(body.id) || clean(url.searchParams.get('id')) as string | null
    const email = clean(body.email) || clean(url.searchParams.get('email')) as string | null
    const hardDelete = body.confirm_hard_delete === true
    if (!id && !email) return NextResponse.json({ ok: false, error: 'Missing employee id or email.' }, { status: 400 })
    const supabase = await createClient()
    const before = id || email ? { id, email } : null

    if (!hardDelete) {
      const archiveRow = { employment_status: 'Archived', status: 'archived', archived_at: new Date().toISOString(), updated_at: new Date().toISOString() }
      const result = await updateWithFallback(supabase, id, email, archiveRow)
      if (!result.data) return NextResponse.json({ ok: false, error: 'Could not safely archive employee in known staff tables.', details: result.errors }, { status: 500 })
      await logActivity(supabase, result.data, 'employee_archived', `Employee ${email || id} was safely archived from the Employees Command Center.`)
      revalidatePath('/hr/employees')
      revalidatePath('/hr/staff')
      revalidatePath('/hr/onboarding')
      revalidatePath('/hr/training')
      revalidatePath('/hr')
      return NextResponse.json({ ok: true, mode: 'safe_archive', employee: result.data, table: result.table, warnings: result.errors })
    }

    const result = await deleteFromKnownTables(supabase, id, email)
    await logActivity(supabase, before, 'employee_hard_deleted', `Employee ${email || id} was hard-deleted after explicit confirmation.`)
    revalidatePath('/hr/employees')
    revalidatePath('/hr/staff')
    revalidatePath('/hr/onboarding')
    revalidatePath('/hr/training')
    revalidatePath('/hr')
    return NextResponse.json({ ok: true, mode: 'hard_delete', deleted: result.deleted, warnings: result.errors })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Employee archive/delete failed' }, { status: 500 })
  }
}
