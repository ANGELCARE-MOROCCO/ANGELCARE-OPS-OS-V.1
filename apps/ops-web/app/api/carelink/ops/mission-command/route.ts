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

function normalizeStatus(value: unknown, fallback = 'draft') {
  const s = text(value, fallback).toLowerCase()
  if (s.includes('cancel')) return 'cancelled'
  if (s.includes('complete') || s.includes('done') || s.includes('closed')) return 'completed'
  if (s.includes('active') || s.includes('started') || s.includes('progress')) return 'active'
  if (s.includes('dispatch')) return 'dispatched'
  if (s.includes('assign')) return 'assigned'
  if (s.includes('valid') || s.includes('approve')) return 'validated'
  if (s.includes('escal')) return 'escalated'
  if (s.includes('pay')) return 'payment_pending'
  return s || fallback
}

function missionRefFromBody(body: AnyRecord) {
  return text(
    body.mission_id ||
      body.missionId ||
      body.entity_id ||
      body.source_id ||
      body.id ||
      body.raw_id ||
      body.mission_code ||
      body.missionCode ||
      body.payload?.id ||
      body.payload?.raw_id ||
      body.payload?.mission_code,
  )
}

function getAdmin(body: AnyRecord) {
  return text(body.created_by || body.actor_name || body.admin_name, 'CareLink Ops')
}

function timePatch(value: unknown) {
  const raw = text(value)
  if (!raw) return undefined
  if (/^\d{2}:\d{2}/.test(raw)) return raw.slice(0, 5)
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return raw
  return date.toTimeString().slice(0, 5)
}

function datePatch(value: unknown) {
  const raw = text(value)
  if (!raw) return undefined
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return raw
  return date.toISOString().slice(0, 10)
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

function detailsPatch(body: AnyRecord) {
  const updates = body.updates || body.payload?.updates || body.payload || body

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
    mission_date: datePatch(updates.mission_date || updates.missionDate || updates.date || updates.scheduled_start || updates.scheduledStart),
    start_time: timePatch(updates.start_time || updates.startTime || updates.scheduled_start || updates.scheduledStart),
    end_time: timePatch(updates.end_time || updates.endTime || updates.scheduled_end || updates.scheduledEnd),
    scheduled_start: updates.scheduled_start || updates.scheduledStart,
    scheduled_end: updates.scheduled_end || updates.scheduledEnd,
    caregiver_id: numeric(updates.caregiver_id || updates.caregiverId || updates.primary_caregiver_id || updates.primaryCaregiverId) ?? undefined,
    backup_caregiver_id: numeric(updates.backup_caregiver_id || updates.backupCaregiverId) ?? undefined,
    city: updates.city,
    zone: updates.zone,
    home_address: updates.home_address || updates.homeAddress || updates.address,
    personal_address: updates.personal_address || updates.personalAddress,
    mobile: updates.mobile || updates.phone,
    language: updates.language,
    required_skills: jsonValue(updates.required_skills || updates.requiredSkills),
    route_lines: jsonValue(updates.route_lines || updates.routeLines),
    program_lines: jsonValue(updates.program_lines || updates.programLines),
    transport_config: jsonValue(updates.transport_config || updates.transportConfig),
    allowance_config: jsonValue(updates.allowance_config || updates.allowanceConfig),
    parameter_config: jsonValue(updates.parameter_config || updates.parameterConfig),
    missionnaire_data: jsonValue(updates.missionnaire_data || updates.missionnaireData),
    special_conditions: updates.special_conditions || updates.specialConditions,
    safety_notes: updates.safety_notes || updates.safetyNotes,
    ops_notes: updates.ops_notes || updates.opsNotes || updates.notes || updates.validation_notes,
    notes: updates.notes,
    risk_level: updates.risk_level || updates.riskLevel,
    ops_priority: updates.ops_priority || updates.opsPriority || updates.priority,
    urgency: updates.urgency,
    updated_at: new Date().toISOString(),
  })
}

function patchForAction(action: string, body: AnyRecord) {
  const now = new Date().toISOString()
  const admin = getAdmin(body)
  const base = detailsPatch(body)
  const nextStatus = normalizeStatus(body.next_status || body.status || body.payload?.status || body.updates?.status, '')

  if (action === 'validate_mission') {
    return compact({
      ...base,
      status: 'validated',
      lifecycle_stage: 'validated',
      validation_status: 'validated',
      readiness_status: 'ready_for_dispatch',
      validated_at: now,
      validated_by: admin,
      updated_at: now,
    })
  }

  if (action === 'assign_mission') {
    return compact({
      ...base,
      caregiver_id: numeric(body.caregiver_id || body.caregiverId || body.payload?.caregiver_id || body.updates?.caregiver_id) ?? base.caregiver_id,
      backup_caregiver_id: numeric(body.backup_caregiver_id || body.backupCaregiverId || body.payload?.backup_caregiver_id || body.updates?.backup_caregiver_id) ?? base.backup_caregiver_id,
      status: 'assigned',
      lifecycle_stage: 'assigned',
      dispatch_status: 'assigned',
      readiness_status: 'ready_for_dispatch',
      updated_at: now,
    })
  }

  if (action === 'set_backup_caregiver') {
    return compact({
      ...base,
      backup_caregiver_id: numeric(body.backup_caregiver_id || body.backupCaregiverId || body.payload?.backup_caregiver_id || body.updates?.backup_caregiver_id),
      replacement_required: false,
      replacement_reason: text(body.replacement_reason || body.payload?.replacement_reason, ''),
      updated_at: now,
    })
  }

  if (action === 'dispatch_mission') {
    return compact({ ...base, status: 'dispatched', lifecycle_stage: 'dispatched', dispatch_status: 'dispatched', updated_at: now })
  }

  if (action === 'activate_mission') {
    return compact({ ...base, status: 'active', lifecycle_stage: 'active', dispatch_status: 'active', started_at: now, actual_start_at: now, updated_at: now })
  }

  if (action === 'complete_mission') {
    return compact({ ...base, status: 'completed', lifecycle_stage: 'completed', dispatch_status: 'completed', execution_status: 'completed', report_status: 'pending', completed_at: now, actual_end_at: now, updated_at: now })
  }

  if (action === 'cancel_mission') {
    return compact({ ...base, status: 'cancelled', lifecycle_stage: 'cancelled', dispatch_status: 'cancelled', execution_status: 'cancelled', cancelled_at: now, archived_reason: text(body.reason || body.notes || body.payload?.reason, 'Cancelled from mission command'), updated_at: now })
  }

  if (action === 'escalate_mission') {
    return compact({ ...base, risk_level: 'high', sla_status: 'escalated', ops_priority: 'high', incident_at: now, incident_note: text(body.notes || body.reason || body.payload?.notes, 'Mission escalated from command center'), updated_at: now })
  }

  if (action === 'payment_pending') {
    return compact({ ...base, dossier_status: 'payment_pending', ops_notes: text(body.notes || body.payload?.notes, 'Payment pending'), updated_at: now })
  }

  if (action === 'payment_validated') {
    return compact({ ...base, dossier_status: 'payment_validated', ops_notes: text(body.notes || body.payload?.notes, 'Payment validated'), updated_at: now })
  }

  if (action === 'update_mission_details') {
    return compact({ ...base, ...(nextStatus ? { status: nextStatus, lifecycle_stage: nextStatus } : {}), updated_at: now })
  }

  if (action === 'set_status' && nextStatus) {
    return compact({ ...base, status: nextStatus, lifecycle_stage: nextStatus, updated_at: now })
  }

  return compact({ ...base, updated_at: now })
}

function workflowFromPatch(action: string, body: AnyRecord, patch: AnyRecord, mission: AnyRecord | null, bridge: AnyRecord) {
  const now = new Date().toISOString()
  return compact({
    source_type: 'missions',
    source_id: text(mission?.id || missionRefFromBody(body)),
    mission_id: numeric(mission?.id || missionRefFromBody(body)) ?? undefined,
    current_status: patch.status || mission?.status,
    lifecycle_stage: patch.lifecycle_stage || mission?.lifecycle_stage,
    dispatch_status: patch.dispatch_status || mission?.dispatch_status,
    validation_status: patch.validation_status || mission?.validation_status,
    report_status: patch.report_status || mission?.report_status,
    assignment_status: patch.caregiver_id || mission?.caregiver_id ? 'assigned' : undefined,
    payment_status: patch.dossier_status || undefined,
    primary_caregiver_id: patch.caregiver_id || mission?.caregiver_id,
    backup_caregiver_id: patch.backup_caregiver_id || mission?.backup_caregiver_id,
    risk_level: patch.risk_level || mission?.risk_level,
    last_action: action,
    last_action_at: now,
    last_action_by: getAdmin(body),
    canonical_bridge_status: bridge.status,
    canonical_bridge_error: bridge.error || '',
    notes: text(body.notes || body.payload?.notes || body.updates?.validation_notes, ''),
    payload: { action, request: body, patch, canonical_bridge: bridge },
    updated_at: now,
  })
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

async function updateCanonicalMission(supabase: any, ref: string, patch: AnyRecord) {
  const existing = await findMission(supabase, ref)
  if (!existing?.id) {
    return { ok: false, status: 'mission_not_found', error: `No mission found for ${ref}`, mission: null }
  }

  const { data, error } = await supabase.from('missions').update(patch).eq('id', existing.id).select('*').single()

  if (error) {
    return { ok: false, status: 'canonical_missions_update_failed', error: error.message, mission: existing }
  }

  return { ok: true, status: 'canonical_missions_updated', error: '', mission: data }
}

async function saveWorkflowState(supabase: any, workflow: AnyRecord) {
  const { data, error } = await supabase
    .from('carelink_mission_workflow_states')
    .upsert(workflow, { onConflict: 'source_type,source_id' })
    .select('*')
    .single()

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

async function logMissionAction(supabase: any, mission: AnyRecord | null, action: string, body: AnyRecord, bridge: AnyRecord) {
  try {
    await supabase.from('carelink_mission_action_logs').insert({
      mission_id: mission?.id || numeric(missionRefFromBody(body)),
      mission_code: mission?.mission_code || body.mission_code || body.payload?.mission_code || null,
      action_type: action,
      source_type: 'missions',
      source_id: text(mission?.id || missionRefFromBody(body)),
      payload: body,
      canonical_bridge_status: bridge.status,
      created_by: getAdmin(body),
    })
  } catch {
    // Audit logging should not block the canonical mission update.
  }
}

async function notifyMissionWorkflow(supabase: any, mission: AnyRecord | null, action: string, body: AnyRecord, workflowId?: number | null) {
  const missionId = mission?.id || numeric(missionRefFromBody(body))
  const missionCode = text(mission?.mission_code || body.mission_code || body.payload?.mission_code || `Mission ${missionId || ''}`)
  const caregiverId = numeric(body.caregiver_id || body.caregiverId || mission?.caregiver_id || body.payload?.caregiver_id)
  const titleMap: Record<string, string> = {
    validate_mission: 'Mission validated',
    assign_mission: 'Mission assigned',
    set_backup_caregiver: 'Backup caregiver updated',
    dispatch_mission: 'Mission dispatched',
    activate_mission: 'Mission activated',
    complete_mission: 'Mission completed',
    cancel_mission: 'Mission cancelled',
    escalate_mission: 'Mission escalated',
    payment_pending: 'Mission payment pending',
    payment_validated: 'Mission payment validated',
    update_mission_details: 'Mission dossier updated',
    set_status: 'Mission status updated',
  }
  const title = titleMap[action] || `Mission workflow: ${action}`
  const priority = ['cancel_mission', 'escalate_mission'].includes(action) ? 'high' : 'normal'

  const rows: AnyRecord[] = [
    { audience_type: 'admin', caregiver_id: caregiverId, mission_id: missionId, mission_code: missionCode, title, body: missionCode, action_type: action, priority, payload: { ...body, workflowId }, created_by: getAdmin(body) },
    { audience_type: 'supervisor', caregiver_id: caregiverId, mission_id: missionId, mission_code: missionCode, title, body: missionCode, action_type: action, priority, payload: { ...body, workflowId }, created_by: getAdmin(body) },
    { audience_type: 'dispatch', caregiver_id: caregiverId, mission_id: missionId, mission_code: missionCode, title, body: missionCode, action_type: action, priority, payload: { ...body, workflowId }, created_by: getAdmin(body) },
  ]

  if (caregiverId) {
    rows.push({ audience_type: 'carelink_mobile_agent', caregiver_id: caregiverId, mission_id: missionId, mission_code: missionCode, title, body: missionCode, action_type: action, priority, payload: { ...body, workflowId }, created_by: getAdmin(body) })
  }

  try {
    await supabase.from('carelink_mission_notifications').insert(rows)
  } catch {
    // Notification queue should not block mission workflow.
  }
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const url = new URL(request.url)
    const ref = text(url.searchParams.get('mission_id') || url.searchParams.get('id') || url.searchParams.get('mission_code'))

    if (ref) {
      const mission = await findMission(supabase as any, ref)
      if (!mission) return NextResponse.json({ ok: false, error: 'Mission not found' }, { status: 404 })

      const { data: workflow } = await (supabase as any)
        .from('carelink_mission_workflow_states')
        .select('*')
        .eq('source_type', 'missions')
        .eq('source_id', String(mission.id))
        .maybeSingle()

      return NextResponse.json({ ok: true, mission, workflow: workflow || null })
    }

    const { data: missions, error } = await (supabase as any)
      .from('missions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1000)

    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })

    const { data: workflows } = await (supabase as any)
      .from('carelink_mission_workflow_states')
      .select('*')
      .eq('source_type', 'missions')
      .limit(2000)

    const workflowMap = new Map<string, AnyRecord>((Array.isArray(workflows) ? workflows : []).map((row: AnyRecord) => [String(row.source_id), row]))
    const rows = (Array.isArray(missions) ? missions : []).map((mission: AnyRecord) => ({ ...mission, workflow: workflowMap.get(String(mission.id)) || null }))

    return NextResponse.json({ ok: true, source: 'public.missions', count: rows.length, missions: rows, workflows: workflows || [] })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Unable to load mission command' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const action = text(body.action, 'update_mission_details')
    const ref = missionRefFromBody(body)

    if (!ref) {
      return NextResponse.json({ ok: false, error: 'mission_id, entity_id, source_id or mission_code is required' }, { status: 400 })
    }

    const supabase = await createClient()
    const patch = patchForAction(action, body)
    const bridge = await updateCanonicalMission(supabase as any, ref, patch)
    const mission = bridge.mission
    const workflowPayload = workflowFromPatch(action, body, patch, mission, bridge)
    const workflow = await saveWorkflowState(supabase as any, workflowPayload)

    await logMissionAction(supabase as any, mission, action, body, bridge)
    await notifyMissionWorkflow(supabase as any, mission, action, body, workflow.data?.id || null)

    if (!bridge.ok) {
      return NextResponse.json({ ok: true, canonical: false, warning: bridge.error, bridge, workflow: workflow.data, patch })
    }

    return NextResponse.json({ ok: true, canonical: true, bridge, mission, workflow: workflow.data, patch })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Unable to run mission command' }, { status: 500 })
  }
}
