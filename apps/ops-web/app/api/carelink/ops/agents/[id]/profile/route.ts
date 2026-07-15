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
  return text(value).split(',').map((x) => x.trim()).filter(Boolean)
}

function num(value: unknown, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function compact(row: AnyRecord) {
  const out: AnyRecord = {}
  Object.entries(row).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') out[key] = value
  })
  return out
}

function buildCaregiverPatch(body: AnyRecord) {
  const fullName = text(body.full_name || body.fullName || body.name)
  const phone = text(body.phone || body.mobile || body.mobile_phone)
  const email = text(body.email || body.work_email || body.mobile_email || body.login_email)
  const city = text(body.city, 'Rabat')
  const zone = text(body.zone)
  const status = text(body.status || body.current_status, 'available')
  const role = text(body.role || body.agent_role || body.caregiver_type, 'Caregiver')
  const skills = list(body.skills || body.skill_tags || body.competencies)
  const languages = list(body.languages || body.language_tags || body.spoken_languages)
  const missionTypes = list(body.mission_types || body.missionTypes || body.service_types)
  const readiness = num(body.readiness_score || body.readinessScore, 0)
  const reliability = num(body.reliability_score || body.reliabilityScore || readiness, readiness)
  const summary = text(body.summary || body.notes) || `Updated from CareLink Agent Command Console on ${new Date().toLocaleString()}`

  const payload = {
    source: 'carelink_ops_agents_profile_update',
    captured_at: new Date().toISOString(),
    identity: { full_name: fullName, phone, email, city, zone, status, role, skills, languages, mission_types: missionTypes },
    raw: body,
  }

  return compact({
    full_name: fullName,
    name: fullName,
    display_name: fullName,
    phone,
    mobile: phone,
    email,
    city,
    zone,
    current_status: status,
    status,
    availability_status: status,
    role,
    skills_summary: skills.join(', '),
    skill_tags: skills,
    languages,
    language_tags: languages,
    mission_types: missionTypes,
    academy_certified: bool(body.academy_certified || body.academyCertified),
    special_needs_capable: bool(body.special_needs_capable || body.specialNeedsCapable),
    readiness_score: readiness,
    reliability_score: reliability,
    summary,
    notes: summary,
    carelink_ops_payload: payload,
    updated_at: new Date().toISOString(),
  })
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
    const patch = buildCaregiverPatch(body)

    const { data, error } = await supabase.from('caregivers').update(patch).eq('id', caregiverId).select('*').single()

    if (error) {
      return NextResponse.json({
        ok: false,
        error: `Caregiver profile schema/save failed: ${error.message}. Run migration 20260628_carelink_caregiver_profile_schema_recovery.sql before editing caregivers.`,
      }, { status: 500 })
    }

    return NextResponse.json({ ok: true, caregiver: data, savedPayload: patch })
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unable to update caregiver profile',
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
