import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

type Patch = Record<string, string | null | undefined>

function cleanString(value: unknown) {
  return String(value || '').trim()
}

function withoutEmpty(payload: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined && value !== null))
}

async function safeUpdate(table: string, id: string | null | undefined, payload: Record<string, unknown>) {
  if (!id) return { ok: false, skipped: true, table, reason: 'missing id' }
  try {
    const supabase = await createClient()
    const { error } = await supabase.from(table).update(withoutEmpty(payload)).eq('id', id)
    if (error) return { ok: false, table, error: error.message }
    return { ok: true, table }
  } catch (error) {
    return { ok: false, table, error: error instanceof Error ? error.message : 'update failed' }
  }
}

async function safeInsertActivity(userId: string, staffId: string | null | undefined, title: string) {
  try {
    const supabase = await createClient()
    await supabase.from('hr_activity_timeline').insert({
      entity_type: 'staff',
      entity_id: staffId || userId,
      title,
      activity_type: 'users_staff_file_update',
      status: 'completed',
      source: 'users_command_center',
      metadata: { user_id: userId, staff_id: staffId || null },
      created_at: new Date().toISOString(),
    })
  } catch {}
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const userId = cleanString(body.userId)
    const staffId = cleanString(body.staffId) || null
    const patch = (body.patch || {}) as Patch

    if (!userId) return NextResponse.json({ ok: false, error: 'Missing userId' }, { status: 400 })

    const userPayload = {
      full_name: cleanString(patch.fullName),
      email: cleanString(patch.email),
      username: cleanString(patch.username),
      role: cleanString(patch.role),
      department: cleanString(patch.department),
      position: cleanString(patch.position),
      city: cleanString(patch.city),
      status: cleanString(patch.status),
      language: cleanString(patch.language),
      phone: cleanString(patch.phone),
      updated_at: new Date().toISOString(),
    }

    const staffPayload = {
      full_name: cleanString(patch.fullName),
      email: cleanString(patch.email),
      work_email: cleanString(patch.email),
      role: cleanString(patch.role),
      department: cleanString(patch.department),
      position: cleanString(patch.position),
      job_title: cleanString(patch.position),
      city: cleanString(patch.city),
      location: cleanString(patch.city),
      status: cleanString(patch.status),
      phone: cleanString(patch.phone),
      manager_name: cleanString(patch.manager),
      updated_at: new Date().toISOString(),
    }

    const appUser = await safeUpdate('app_users', userId, userPayload)
    const staff = staffId ? await safeUpdate('hr_staff_profiles', staffId, staffPayload) : { ok: false, skipped: true, table: 'hr_staff_profiles', reason: 'no linked staff profile' }

    await safeInsertActivity(userId, staffId, `Staff file updated from Users Command Center: ${userPayload.full_name || userId}`)

    return NextResponse.json({ ok: true, updated: { appUser, staff }, synced: true })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Unable to update staff file' }, { status: 500 })
  }
}
