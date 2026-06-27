import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type AnyRecord = Record<string, any>

function text(value: unknown, fallback = '') {
  if (value === null || value === undefined || value === '') return fallback
  return String(value).trim()
}

function bool(value: unknown) {
  return value === true || value === 'true' || value === 1 || value === '1' || value === 'yes'
}

function list(value: unknown) {
  if (Array.isArray(value)) return value.map((x) => text(x)).filter(Boolean)
  return text(value)
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean)
}

function compact(row: AnyRecord) {
  const out: AnyRecord = {}
  Object.entries(row).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') out[key] = value
  })
  return out
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params
    const caregiverId = Number(params.id)

    if (!Number.isFinite(caregiverId)) {
      return NextResponse.json({ ok: false, error: 'Invalid caregiver id' }, { status: 400 })
    }

    const body = await request.json()
    const supabase = await createClient()

    const candidates = [
      compact({
        full_name: text(body.full_name || body.fullName || body.name),
        name: text(body.full_name || body.fullName || body.name),
        display_name: text(body.full_name || body.fullName || body.name),
        phone: text(body.phone),
        mobile: text(body.phone),
        email: text(body.email),
        city: text(body.city),
        zone: text(body.zone),
        current_status: text(body.status),
        status: text(body.status),
        role: text(body.role),
        function: text(body.role),
        skills: list(body.skills),
        skill_tags: list(body.skills),
        languages: list(body.languages),
        mission_types: list(body.mission_types || body.missionTypes),
        academy_certified: bool(body.academy_certified || body.academyCertified),
        special_needs_capable: bool(body.special_needs_capable || body.specialNeedsCapable),
        readiness_score: Number(body.readiness_score || body.readinessScore || 0),
        reliability_score: Number(body.reliability_score || body.reliabilityScore || body.readiness_score || 0),
        summary: text(body.summary || body.notes),
        notes: text(body.notes || body.summary),
        updated_at: new Date().toISOString(),
      }),
      compact({
        full_name: text(body.full_name || body.fullName || body.name),
        phone: text(body.phone),
        email: text(body.email),
        city: text(body.city),
        zone: text(body.zone),
        status: text(body.status),
        notes: text(body.notes || body.summary),
      }),
      compact({
        name: text(body.full_name || body.fullName || body.name),
        phone: text(body.phone),
        email: text(body.email),
        city: text(body.city),
        zone: text(body.zone),
        status: text(body.status),
        notes: text(body.notes || body.summary),
      }),
    ]

    let lastError = ''

    for (const patch of candidates) {
      const { data, error } = await supabase
        .from('caregivers')
        .update(patch)
        .eq('id', caregiverId)
        .select('*')
        .single()

      if (!error) {
        return NextResponse.json({ ok: true, caregiver: data })
      }

      lastError = error.message
    }

    return NextResponse.json({ ok: false, error: lastError || 'Unable to update caregiver' }, { status: 500 })
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unable to update caregiver',
    }, { status: 500 })
  }
}


export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params
    const caregiverId = Number(params.id)

    if (!Number.isFinite(caregiverId) || !caregiverId) {
      return NextResponse.json({ ok: false, error: 'Invalid caregiver id' }, { status: 400 })
    }

    const body = await request.json().catch(() => ({}))

    if (body?.confirm !== 'DELETE') {
      return NextResponse.json({ ok: false, error: 'DELETE confirmation is required' }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: accessRows } = await supabase
      .from('carelink_agent_app_access')
      .select('auth_user_id')
      .eq('caregiver_id', caregiverId)

    const authUserIds = Array.isArray(accessRows)
      ? accessRows.map((row: any) => row?.auth_user_id).filter(Boolean)
      : []

    for (const authUserId of authUserIds) {
      try {
        const admin = (supabase as any).auth?.admin
        if (admin?.deleteUser) {
          await admin.deleteUser(authUserId)
        }
      } catch {
        // Database deletion remains the source of truth if Auth admin is unavailable.
      }
    }

    const linkedTables = [
      'carelink_agent_app_access',
      'carelink_agent_roster_preferences',
      'carelink_agent_payment_configs',
      'carelink_agent_payment_validations',
      'carelink_agent_training_plans',
    ]

    const cleanup: Record<string, string> = {}

    for (const table of linkedTables) {
      try {
        const { error } = await supabase
          .from(table)
          .delete()
          .eq('caregiver_id', caregiverId)

        cleanup[table] = error ? error.message : 'deleted'
      } catch (error) {
        cleanup[table] = error instanceof Error ? error.message : 'skipped'
      }
    }

    
    try {
      await supabase.from('carelink_agent_action_logs').insert({ caregiver_id: caregiverId, action_type: 'delete_caregiver', module_type: 'profile', payload: body || {}, created_by: 'CareLink Ops' })
      await supabase.from('carelink_agent_notifications').insert([
        { audience_type: 'admin', caregiver_id: caregiverId, caregiver_name: body?.caregiver_name || body?.caregiverName || '', title: 'Caregiver deleted permanently', body: 'Caregiver profile and linked CareLink agent records were deleted.', action_type: 'delete_caregiver', priority: 'high', payload: body || {}, created_by: 'CareLink Ops' },
        { audience_type: 'supervisor', caregiver_id: caregiverId, caregiver_name: body?.caregiver_name || body?.caregiverName || '', title: 'Caregiver deleted permanently', body: 'Caregiver profile and linked CareLink agent records were deleted.', action_type: 'delete_caregiver', priority: 'high', payload: body || {}, created_by: 'CareLink Ops' }
      ])
    } catch {
      // Delete audit/notification must not block deletion flow.
    }

const { error: caregiverError } = await supabase
      .from('caregivers')
      .delete()
      .eq('id', caregiverId)

    if (caregiverError) {
      return NextResponse.json({
        ok: false,
        error: caregiverError.message,
        cleanup,
      }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      deleted: caregiverId,
      cleanup,
    })
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unable to delete caregiver permanently',
    }, { status: 500 })
  }
}
