import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type AnyRecord = Record<string, any>

function text(value: unknown, fallback = '') {
  if (value === null || value === undefined || value === '') return fallback
  return String(value).trim()
}

function numeric(value: unknown) {
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function compact(row: AnyRecord) {
  const out: AnyRecord = {}
  Object.entries(row).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') out[key] = value
  })
  return out
}

function jsonValue(value: unknown) {
  if (value === undefined || value === null || value === '') return undefined
  if (typeof value === 'string') {
    try {
      return JSON.parse(value)
    } catch {
      return value
    }
  }
  return value
}

async function findMission(supabase: any, ref: string) {
  const id = numeric(ref)

  if (id) {
    const { data, error } = await supabase.from('missions').select('*').eq('id', id).maybeSingle()
    if (!error && data) return data
  }

  for (const column of ['mission_code', 'mission_reference', 'dossier_reference']) {
    const { data, error } = await supabase.from('missions').select('*').eq(column, ref).limit(1).maybeSingle()
    if (!error && data) return data
  }

  return null
}

function hydrateMissionDossier(mission: AnyRecord) {
  return {
    ...mission,
    id: mission.id,
    mission_id: mission.id,
    missionId: mission.id,
    dossier_id: mission.id,
    dossierId: mission.id,
    source_table: 'missions',
    sourceType: 'missions',
    source_type: 'missions',
    mission_code: mission.mission_code,
    missionCode: mission.mission_code,
    code: mission.mission_code,
    title: mission.mission_object || mission.service_type || mission.mission_code,
    clientLabel: mission.family_id ? `Family #${mission.family_id}` : mission.dossier_reference || mission.mission_reference || 'Client not linked',
    client_label: mission.family_id ? `Family #${mission.family_id}` : mission.dossier_reference || mission.mission_reference || 'Client not linked',
    city: mission.city,
    zone: mission.zone,
    scheduled_start: mission.scheduled_start,
    scheduledStart: mission.scheduled_start,
    scheduled_end: mission.scheduled_end,
    scheduledEnd: mission.scheduled_end,
    mission_date: mission.mission_date,
    missionDate: mission.mission_date,
    start_time: mission.start_time,
    startTime: mission.start_time,
    end_time: mission.end_time,
    endTime: mission.end_time,
    route_lines: mission.route_lines || [],
    routeLines: mission.route_lines || [],
    program_lines: mission.program_lines || [],
    programLines: mission.program_lines || [],
    transport_config: mission.transport_config || {},
    transportConfig: mission.transport_config || {},
    allowance_config: mission.allowance_config || {},
    allowanceConfig: mission.allowance_config || {},
    parameter_config: mission.parameter_config || {},
    parameterConfig: mission.parameter_config || {},
    missionnaire_data: mission.missionnaire_data || {},
    missionnaireData: mission.missionnaire_data || {},
  }
}

function patchFromBody(body: AnyRecord) {
  const updates = body.updates || body.payload || body

  return compact({
    mission_code: updates.mission_code || updates.missionCode,
    mission_reference: updates.mission_reference || updates.missionReference,
    dossier_reference: updates.dossier_reference || updates.dossierReference,
    service_type: updates.service_type || updates.serviceType,
    service_category: updates.service_category || updates.serviceCategory,
    service_family: updates.service_family || updates.serviceFamily,
    mission_object: updates.mission_object || updates.missionObject || updates.title,
    mission_scope: updates.mission_scope || updates.missionScope,
    mission_kind: updates.mission_kind || updates.missionKind,
    mission_date: updates.mission_date || updates.missionDate,
    start_time: updates.start_time || updates.startTime,
    end_time: updates.end_time || updates.endTime,
    scheduled_start: updates.scheduled_start || updates.scheduledStart,
    scheduled_end: updates.scheduled_end || updates.scheduledEnd,
    caregiver_id: numeric(updates.caregiver_id || updates.caregiverId) ?? undefined,
    backup_caregiver_id: numeric(updates.backup_caregiver_id || updates.backupCaregiverId) ?? undefined,
    city: updates.city,
    zone: updates.zone,
    home_address: updates.home_address || updates.homeAddress,
    personal_address: updates.personal_address || updates.personalAddress,
    mobile: updates.mobile || updates.phone,
    language: updates.language,
    route_lines: jsonValue(updates.route_lines || updates.routeLines),
    program_lines: jsonValue(updates.program_lines || updates.programLines),
    transport_config: jsonValue(updates.transport_config || updates.transportConfig),
    allowance_config: jsonValue(updates.allowance_config || updates.allowanceConfig),
    parameter_config: jsonValue(updates.parameter_config || updates.parameterConfig),
    missionnaire_data: jsonValue(updates.missionnaire_data || updates.missionnaireData),
    special_conditions: updates.special_conditions || updates.specialConditions,
    safety_notes: updates.safety_notes || updates.safetyNotes,
    ops_notes: updates.ops_notes || updates.opsNotes || updates.notes,
    notes: updates.notes,
    status: updates.status,
    lifecycle_stage: updates.lifecycle_stage || updates.lifecycleStage,
    dispatch_status: updates.dispatch_status || updates.dispatchStatus,
    validation_status: updates.validation_status || updates.validationStatus,
    report_status: updates.report_status || updates.reportStatus,
    readiness_status: updates.readiness_status || updates.readinessStatus,
    risk_level: updates.risk_level || updates.riskLevel,
    ops_priority: updates.ops_priority || updates.opsPriority || updates.priority,
    updated_at: new Date().toISOString(),
  })
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params
    const supabase = await createClient()
    const mission = await findMission(supabase as any, params.id)

    if (!mission) return NextResponse.json({ ok: false, error: 'Mission dossier not found in public.missions' }, { status: 404 })

    const { data: workflow } = await (supabase as any)
      .from('carelink_mission_workflow_states')
      .select('*')
      .eq('source_type', 'missions')
      .eq('source_id', String(mission.id))
      .maybeSingle()

    return NextResponse.json({ ok: true, data: { ...hydrateMissionDossier(mission), workflow: workflow || null }, source: 'public.missions' })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Unable to load mission dossier' }, { status: 500 })
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params
    const supabase = await createClient()
    const existing = await findMission(supabase as any, params.id)

    if (!existing) return NextResponse.json({ ok: false, error: 'Mission dossier not found in public.missions' }, { status: 404 })

    const body = await request.json()
    const patch = patchFromBody(body)

    const { data, error } = await (supabase as any)
      .from('missions')
      .update(patch)
      .eq('id', existing.id)
      .select('*')
      .single()

    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })

    await (supabase as any).from('carelink_mission_action_logs').insert({
      mission_id: data.id,
      mission_code: data.mission_code,
      action_type: 'patch_mission_dossier',
      source_type: 'missions',
      source_id: String(data.id),
      payload: body,
      canonical_bridge_status: 'canonical_missions_updated',
      created_by: text(body.created_by, 'CareLink Ops'),
    }).catch?.(() => null)

    return NextResponse.json({ ok: true, data: hydrateMissionDossier(data), source: 'public.missions' })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Unable to update mission dossier' }, { status: 500 })
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params
    const supabase = await createClient()
    const existing = await findMission(supabase as any, params.id)

    if (!existing) return NextResponse.json({ ok: false, error: 'Mission dossier not found in public.missions' }, { status: 404 })

    const body = await request.json().catch(() => ({}))
    const now = new Date().toISOString()

    const { data, error } = await (supabase as any)
      .from('missions')
      .update({
        is_archived: true,
        archived_at: now,
        archived_reason: text(body.reason || body.archived_reason, 'Archived from mission dossier modal'),
        status: 'archived',
        lifecycle_stage: 'archived',
        dispatch_status: 'archived',
        updated_at: now,
      })
      .eq('id', existing.id)
      .select('*')
      .single()

    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })

    await (supabase as any).from('carelink_mission_action_logs').insert({
      mission_id: data.id,
      mission_code: data.mission_code,
      action_type: 'archive_mission_dossier',
      source_type: 'missions',
      source_id: String(data.id),
      payload: body,
      canonical_bridge_status: 'canonical_missions_archived',
      created_by: text(body.created_by, 'CareLink Ops'),
    }).catch?.(() => null)

    return NextResponse.json({ ok: true, data: hydrateMissionDossier(data), archived: true, source: 'public.missions' })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Unable to archive mission dossier' }, { status: 500 })
  }
}
