import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { HR_TABLES } from '@/lib/hr-production/repository'

export const dynamic = 'force-dynamic'

type AnyRecord = Record<string, any>

function env(name: string) {
  return process.env[name] || ''
}

function supabaseAdmin() {
  const url = env('NEXT_PUBLIC_SUPABASE_URL') || env('SUPABASE_URL')
  const key =
    env('SUPABASE_SERVICE_ROLE_KEY') ||
    env('SUPABASE_SERVICE_KEY') ||
    env('SUPABASE_ANON_KEY') ||
    env('NEXT_PUBLIC_SUPABASE_ANON_KEY')

  if (!url || !key) {
    throw new Error('Missing Supabase environment variables.')
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

function uniq(values: Array<string | undefined | null>) {
  return Array.from(new Set(values.filter(Boolean).map(String)))
}

function departmentTables() {
  return uniq([
    (HR_TABLES as AnyRecord).departments,
    'hr_departments',
    'departments',
  ])
}

function staffTables() {
  return uniq([
    (HR_TABLES as AnyRecord).staff,
    (HR_TABLES as AnyRecord).employees,
    'hr_staff',
    'hr_employees',
    'employees',
    'app_users',
    'users',
  ])
}

function structureTables() {
  return uniq([
    (HR_TABLES as AnyRecord).positions,
    (HR_TABLES as AnyRecord).openings,
    'hr_positions',
    'hr_openings',
    'positions',
    'openings',
  ])
}

async function tryUpdateByIdOrName(table: string, id: string, oldName: string, patch: AnyRecord) {
  const supabase = supabaseAdmin()

  if (id && id !== oldName) {
    const byId = await supabase.from(table).update(patch).eq('id', id).select('*').maybeSingle()
    if (!byId.error && byId.data) return { ok: true, data: byId.data, table, method: 'id' }
  }

  if (oldName) {
    const byName = await supabase.from(table).update(patch).or(`name.eq.${oldName},department.eq.${oldName}`).select('*').maybeSingle()
    if (!byName.error && byName.data) return { ok: true, data: byName.data, table, method: 'name' }
  }

  return { ok: false, table }
}

async function tryDeleteByIdOrName(table: string, id: string, oldName: string) {
  const supabase = supabaseAdmin()

  if (id && id !== oldName) {
    const byId = await supabase.from(table).delete().eq('id', id)
    if (!byId.error) return { ok: true, table, method: 'id' }
  }

  if (oldName) {
    const byName = await supabase.from(table).delete().or(`name.eq.${oldName},department.eq.${oldName}`)
    if (!byName.error) return { ok: true, table, method: 'name' }
  }

  return { ok: false, table }
}

async function tryCascadeRename(oldName: string, newName: string) {
  if (!oldName || !newName || oldName === newName) return []

  const supabase = supabaseAdmin()
  const logs: AnyRecord[] = []

  for (const table of [...staffTables(), ...structureTables()]) {
    for (const column of ['department', 'department_name', 'business_unit', 'team']) {
      try {
        const result = await supabase.from(table).update({ [column]: newName }).eq(column, oldName)
        if (!result.error) logs.push({ table, column, action: 'renamed' })
      } catch {
        // ignore missing tables/columns
      }
    }
  }

  return logs
}

async function tryCascadeDelete(oldName: string) {
  if (!oldName) return []

  const supabase = supabaseAdmin()
  const logs: AnyRecord[] = []

  // Important: do not delete employees. Clear department links so the deleted department stops being rebuilt from staff data.
  for (const table of staffTables()) {
    for (const column of ['department', 'department_name', 'business_unit', 'team']) {
      try {
        const result = await supabase.from(table).update({ [column]: null }).eq(column, oldName)
        if (!result.error) logs.push({ table, column, action: 'employee_department_cleared' })

        const upper = await supabase.from(table).update({ [column]: null }).eq(column, oldName.toUpperCase())
        if (!upper.error) logs.push({ table, column, action: 'employee_department_cleared_upper' })

        const lower = await supabase.from(table).update({ [column]: null }).eq(column, oldName.toLowerCase())
        if (!lower.error) logs.push({ table, column, action: 'employee_department_cleared_lower' })
      } catch {
        // ignore missing tables/columns
      }
    }
  }

  // Remove structure objects that are explicitly attached to that department.
  for (const table of structureTables()) {
    for (const column of ['department', 'department_name', 'parent_department', 'sub_department']) {
      try {
        const result = await supabase.from(table).delete().eq(column, oldName)
        if (!result.error) logs.push({ table, column, action: 'structure_deleted' })
      } catch {
        // ignore missing tables/columns
      }
    }
  }

  return logs
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const id = String(body.id || '')
    const oldName = String(body.oldName || body.name || '')
    const newName = String(body.name || oldName || '').trim()

    if (!oldName && !id) {
      return NextResponse.json({ ok: false, error: 'Missing department identifier.' }, { status: 400 })
    }

    const patch = {
      name: newName,
      department: newName,
      manager: body.manager || body.owner || null,
      owner: body.manager || body.owner || null,
      code: body.code || null,
      mission: body.mission || null,
      status: body.status || 'active',
      updated_at: new Date().toISOString(),
    }

    let updated: AnyRecord | null = null
    const attempts: AnyRecord[] = []

    for (const table of departmentTables()) {
      const result = await tryUpdateByIdOrName(table, id, oldName, patch)
      attempts.push(result)
      if (result.ok) {
        updated = result
        break
      }
    }

    const cascade = await tryCascadeRename(oldName, newName)

    return NextResponse.json({
      ok: true,
      updated,
      cascade,
      attempts,
      message: updated ? 'Department updated.' : 'Department references updated; department row was not found.',
    })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || 'Unable to update department.' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url)
    const id = url.searchParams.get('id') || ''
    const name = url.searchParams.get('name') || ''

    if (!id && !name) {
      return NextResponse.json({ ok: false, error: 'Missing department id or name.' }, { status: 400 })
    }

    const attempts: AnyRecord[] = []
    for (const table of departmentTables()) {
      const result = await tryDeleteByIdOrName(table, id, name)
      attempts.push(result)
    }

    const cascade = await tryCascadeDelete(name)

    return NextResponse.json({
      ok: true,
      attempts,
      cascade,
      message: 'Department permanently removed and linked HR references cleared.',
    })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || 'Unable to delete department.' }, { status: 500 })
  }
}
