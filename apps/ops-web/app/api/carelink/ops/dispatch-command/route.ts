import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type AnyRecord = Record<string, any>

const MISSION_SOURCE_TABLES = [
  'carelink_missions',
  'carelink_ops_missions',
  'mission_dossiers',
  'carelink_mission_dossiers',
  'missions',
  'carelink_submissions',
  'carelink_schedule_events',
]

function text(value: unknown, fallback = '') {
  if (value === null || value === undefined || value === '') return fallback
  return String(value).trim()
}

function number(value: unknown) {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

function bool(value: unknown) {
  return value === true || value === 'true' || value === 1 || value === '1'
}

function compact(row: AnyRecord) {
  const out: AnyRecord = {}
  Object.entries(row).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') out[key] = value
  })
  return out
}

function iso(value: unknown) {
  if (value === null || value === undefined || value === '') return ''
  const raw = String(value).trim()
  const normalized = raw.includes('T') || raw.includes(':') ? raw : `${raw}T12:00:00`
  const d = new Date(normalized)
  return Number.isNaN(d.getTime()) ? '' : d.toISOString()
}

function combineDateAndTime(dateValue: unknown, timeValue: unknown) {
  const dateRaw = text(dateValue)
  const timeRaw = text(timeValue)
  if (!dateRaw) return ''
  if (dateRaw.includes('T')) return iso(dateRaw)
  const safeTime = timeRaw ? (timeRaw.length === 5 ? `${timeRaw}:00` : timeRaw) : '12:00:00'
  return iso(`${dateRaw}T${safeTime}`)
}

function firstIso(row: AnyRecord, keys: string[]) {
  for (const key of keys) {
    const parsed = iso(row[key])
    if (parsed) return parsed
  }
  return ''
}

function startOf(row: AnyRecord) {
  const combined = combineDateAndTime(
    row.mission_date || row.scheduled_date || row.service_date || row.schedule_date || row.date || row.start_date || row.day_date,
    row.start_time || row.start_hour || row.scheduled_start_time || row.mission_start_time,
  )
  if (combined) return combined
  return firstIso(row, ['start_at', 'scheduled_start_at', 'mission_start_at', 'service_start_at', 'start_date', 'mission_date', 'scheduled_date', 'service_date', 'date', 'created_at'])
}

function endOf(row: AnyRecord) {
  const combined = combineDateAndTime(
    row.mission_date || row.scheduled_date || row.service_date || row.schedule_date || row.date || row.end_date || row.start_date,
    row.end_time || row.end_hour || row.scheduled_end_time || row.mission_end_time,
  )
  if (combined) return combined
  return firstIso(row, ['end_at', 'scheduled_end_at', 'mission_end_at', 'service_end_at', 'end_date', 'due_at', 'due_date'])
}

function normalizeStatus(value: unknown) {
  const s = text(value, 'draft').toLowerCase()
  if (s.includes('cancel')) return 'cancelled'
  if (s.includes('complete') || s.includes('done') || s.includes('closed')) return 'completed'
  if (s.includes('active') || s.includes('started') || s.includes('progress')) return 'active'
  if (s.includes('ready')) return 'ready_for_dispatch'
  if (s.includes('assign')) return 'assigned'
  if (s.includes('risk') || s.includes('escal')) return 'escalated'
  return s || 'draft'
}

function riskOf(row: AnyRecord) {
  const raw = text(row.risk_level || row.priority || row.sla_status, 'normal').toLowerCase()
  if (raw.includes('critical') || raw.includes('high') || raw.includes('late') || raw.includes('risk')) return 'high'
  if (raw.includes('medium') || raw.includes('warn')) return 'medium'
  return 'normal'
}

function cityOf(row: AnyRecord) {
  return text(row.city || row.location_city || row.base_city || row.service_city || row.client_city, 'Unassigned city')
}

function zoneOf(row: AnyRecord) {
  return text(row.zone || row.location_zone || row.base_zone || row.service_zone || row.client_zone, 'No zone')
}

function caregiverName(row: AnyRecord) {
  return text(row.caregiver_name || row.caregiver_full_name || row.agent_name || row.assignee_name || row.primary_caregiver_name, 'Unassigned')
}

function normalizeMission(row: AnyRecord, sourceType: string) {
  const startAt = startOf(row)
  const endAt = endOf(row) || (startAt ? new Date(new Date(startAt).getTime() + 2 * 60 * 60 * 1000).toISOString() : '')
  const rawId = text(row.id || row.mission_id || row.dossier_id || row.uuid || row.code || row.source_id)

  return {
    id: `${sourceType}-${rawId || Math.random().toString(16).slice(2)}`,
    raw_id: rawId,
    source_type: sourceType,
    mission_code: text(row.mission_code || row.code || row.reference || rawId),
    title: text(row.title || row.mission_title || row.service_title || row.service_type || row.mission_type, `Mission #${rawId || '—'}`),
    service_type: text(row.service_type || row.service || row.category || row.mission_type, 'CareLink service'),
    family_name: text(row.family_name || row.client_name || row.parent_name || row.customer_name, 'Family not loaded'),
    caregiver_id: number(row.caregiver_id || row.agent_id || row.assignee_id || row.primary_caregiver_id),
    caregiver_name: caregiverName(row),
    city: cityOf(row),
    zone: zoneOf(row),
    dispatch_status: normalizeStatus(row.dispatch_status || row.status || row.current_status || row.lifecycle_status),
    assignment_status: text(row.assignment_status || row.assignmentStatus || '', ''),
    priority: text(row.priority, riskOf(row) === 'high' ? 'high' : 'normal'),
    risk_level: riskOf(row),
    scheduled_start_at: startAt,
    scheduled_end_at: endAt,
    route_from: text(row.route_from || row.departure_zone || row.start_zone || row.from_location || row.city, ''),
    route_to: text(row.route_to || row.arrival_zone || row.end_zone || row.to_location || row.zone, ''),
    transport_mode: text(row.transport_mode || row.transport || row.mobility_mode, ''),
    validation_notes: text(row.validation_notes || row.notes || row.description || row.summary || row.instructions, ''),
  }
}

function normalizeCaregiver(row: AnyRecord) {
  return {
    id: number(row.id),
    full_name: text(row.full_name || row.name || row.display_name, `Caregiver #${row.id}`),
    city: cityOf(row),
    zone: zoneOf(row),
    status: normalizeStatus(row.current_status || row.status || row.availability_status || 'available'),
    phone: text(row.phone || row.mobile || row.phone_number, ''),
    readiness: number(row.readiness_score || row.reliability_score || row.score),
    skills: Array.isArray(row.skills || row.skill_tags) ? row.skills || row.skill_tags : [],
  }
}

async function safeRows(supabase: any, table: string, limit = 900) {
  try {
    const { data, error } = await supabase.from(table).select('*').limit(limit)
    if (error || !Array.isArray(data)) return []
    return data as AnyRecord[]
  } catch {
    return []
  }
}

function applyAssignment(mission: AnyRecord, assignment?: AnyRecord): AnyRecord {
  if (!assignment) return { ...mission, assignment: null }
  return {
    ...mission,
    caregiver_id: assignment.caregiver_id ?? mission.caregiver_id,
    caregiver_name: text(assignment.caregiver_name, mission.caregiver_name),
    backup_caregiver_id: assignment.backup_caregiver_id,
    backup_caregiver_name: assignment.backup_caregiver_name,
    dispatch_status: text(assignment.dispatch_status, mission.dispatch_status),
    assignment_status: text(assignment.assignment_status, mission.assignment_status),
    route_from: text(assignment.route_from, mission.route_from),
    route_to: text(assignment.route_to, mission.route_to),
    transport_mode: text(assignment.transport_mode, mission.transport_mode),
    scheduled_start_at: assignment.scheduled_start_at || mission.scheduled_start_at,
    scheduled_end_at: assignment.scheduled_end_at || mission.scheduled_end_at,
    priority: text(assignment.priority, mission.priority),
    risk_level: text(assignment.risk_level, mission.risk_level),
    validation_notes: text(assignment.validation_notes, mission.validation_notes),
    assignment,
  }
}

function canonicalPatchFromAssignment(patch: AnyRecord) {
  const status = patch.dispatch_status
  return [
    compact({ caregiver_id: patch.caregiver_id, caregiver_name: patch.caregiver_name, dispatch_status: status, assignment_status: patch.assignment_status, route_from: patch.route_from, route_to: patch.route_to, transport_mode: patch.transport_mode, scheduled_start_at: patch.scheduled_start_at, scheduled_end_at: patch.scheduled_end_at, status, updated_at: new Date().toISOString() }),
    compact({ agent_id: patch.caregiver_id, agent_name: patch.caregiver_name, current_status: status, route_from: patch.route_from, route_to: patch.route_to, transport_mode: patch.transport_mode, updated_at: new Date().toISOString() }),
    compact({ assignee_id: patch.caregiver_id, assignee_name: patch.caregiver_name, lifecycle_status: status, updated_at: new Date().toISOString() }),
    compact({ status, updated_at: new Date().toISOString() }),
  ].filter((row) => Object.keys(row).length > 1)
}

async function bridgeCanonicalSource(supabase: any, sourceType: string, sourceId: string, patch: AnyRecord) {
  if (!MISSION_SOURCE_TABLES.includes(sourceType) || !sourceId) {
    return { ok: true, status: 'overlay_only', error: '' }
  }

  for (const candidate of canonicalPatchFromAssignment(patch)) {
    try {
      const { error } = await supabase.from(sourceType).update(candidate).eq('id', sourceId)
      if (!error) return { ok: true, status: 'canonical_source_updated', table: sourceType, patchKeys: Object.keys(candidate) }
    } catch {
      // Try next compatible shape.
    }
  }

  return { ok: false, status: 'overlay_saved_canonical_update_failed', table: sourceType, error: 'No compatible patch shape accepted by source table.' }
}

async function logAction(supabase: any, action: string, payload: AnyRecord, assignmentId?: number | null) {
  try {
    await supabase.from('carelink_dispatch_action_logs').insert({
      action_type: action,
      source_type: text(payload.source_type),
      source_id: text(payload.source_id || payload.raw_id),
      assignment_id: assignmentId || null,
      caregiver_id: payload.caregiver_id ? Number(payload.caregiver_id) : null,
      caregiver_name: text(payload.caregiver_name),
      payload,
      created_by: text(payload.created_by, 'CareLink Dispatch'),
    })
  } catch {
    // Never block dispatch for audit failure.
  }
}

async function createNotifications(supabase: any, action: string, payload: AnyRecord, assignment: AnyRecord) {
  const caregiverId = assignment.caregiver_id || payload.caregiver_id || null
  const caregiverName = text(assignment.caregiver_name || payload.caregiver_name, 'Unassigned')
  const titleByAction: Record<string, string> = {
    assign_mission: 'Mission assigned',
    reassign_mission: 'Mission reassigned',
    set_backup: 'Backup caregiver updated',
    route_update: 'Route updated',
    activate_dispatch: 'Mission activated',
    complete_dispatch: 'Mission completed',
    cancel_dispatch: 'Mission cancelled',
    escalate_dispatch: 'Dispatch escalation requested',
    update_dispatch_details: 'Dispatch details updated',
  }
  const title = titleByAction[action] || `Dispatch workflow: ${action}`
  const body = `${text(payload.title || assignment.mission_title || 'Mission')} · ${caregiverName}`
  const rows: AnyRecord[] = [
    { audience_type: 'admin', priority: action.includes('cancel') || action.includes('escalate') ? 'high' : 'normal' },
    { audience_type: 'supervisor', priority: action.includes('escalate') ? 'high' : 'normal' },
  ]
  if (caregiverId || caregiverName !== 'Unassigned') rows.push({ audience_type: 'carelink_mobile_agent', priority: action.includes('cancel') ? 'high' : 'normal' })

  try {
    await supabase.from('carelink_dispatch_notifications').insert(rows.map((row) => ({
      ...row,
      caregiver_id: caregiverId,
      caregiver_name: caregiverName,
      title,
      body,
      action_type: action,
      source_type: text(payload.source_type),
      source_id: text(payload.source_id || payload.raw_id),
      assignment_id: assignment.id,
      payload,
      created_by: text(payload.created_by, 'CareLink Dispatch'),
    })))
  } catch {
    // Notification queue must not block workflow.
  }
}

async function upsertAssignment(supabase: any, action: string, payload: AnyRecord) {
  const sourceType = text(payload.source_type || payload.entity_type, 'dispatch')
  const sourceId = text(payload.source_id || payload.raw_id || payload.entity_id || payload.id)
  if (!sourceId) return { data: null, error: 'Missing mission source id' }

  const nextStatus = action === 'activate_dispatch' ? 'active'
    : action === 'complete_dispatch' ? 'completed'
      : action === 'cancel_dispatch' ? 'cancelled'
        : action === 'escalate_dispatch' ? 'escalated'
          : text(payload.dispatch_status, 'assigned')

  const patch = compact({
    source_type: sourceType,
    source_id: sourceId,
    mission_title: text(payload.title || payload.mission_title),
    mission_code: text(payload.mission_code),
    caregiver_id: payload.caregiver_id ? Number(payload.caregiver_id) : undefined,
    caregiver_name: text(payload.caregiver_name),
    backup_caregiver_id: payload.backup_caregiver_id ? Number(payload.backup_caregiver_id) : undefined,
    backup_caregiver_name: text(payload.backup_caregiver_name),
    dispatch_status: normalizeStatus(nextStatus),
    assignment_status: action.includes('assign') || action === 'set_backup' ? 'assigned' : text(payload.assignment_status, 'assigned'),
    route_from: text(payload.route_from),
    route_to: text(payload.route_to),
    transport_mode: text(payload.transport_mode),
    scheduled_start_at: payload.scheduled_start_at || payload.start_at || null,
    scheduled_end_at: payload.scheduled_end_at || payload.end_at || null,
    city: text(payload.city),
    zone: text(payload.zone),
    priority: text(payload.priority, 'normal'),
    risk_level: text(payload.risk_level, 'normal'),
    validation_notes: text(payload.validation_notes || payload.notes),
    last_action: action,
    last_action_at: new Date().toISOString(),
    last_action_by: text(payload.created_by, 'CareLink Dispatch'),
    payload,
    updated_at: new Date().toISOString(),
  })

  const bridge = await bridgeCanonicalSource(supabase, sourceType, sourceId, patch)
  patch.canonical_bridge_status = bridge.status
  patch.canonical_bridge_error = bridge.error || ''

  const { data, error } = await supabase
    .from('carelink_dispatch_assignments')
    .upsert(patch, { onConflict: 'source_type,source_id' })
    .select('*')
    .single()

  if (error) return { data: null, error: error.message }

  await logAction(supabase, action, payload, data.id)
  await createNotifications(supabase, action, payload, data)

  return { data: { ...data, canonical_bridge: bridge }, error: null }
}

export async function GET() {
  try {
    const supabase = await createClient()
    const missionGroups = await Promise.all(MISSION_SOURCE_TABLES.map(async (table) => {
      const rows = await safeRows(supabase as any, table, table === 'carelink_schedule_events' ? 1200 : 900)
      return rows.map((row) => normalizeMission(row, table))
    }))

    const rawMap = new Map<string, AnyRecord>()
    missionGroups.flat().forEach((mission) => {
      if (!rawMap.has(mission.id)) rawMap.set(mission.id, mission)
    })

    const assignmentRows = await safeRows(supabase as any, 'carelink_dispatch_assignments', 2000)
    const assignmentMap = new Map<string, AnyRecord>()
    assignmentRows.forEach((row) => assignmentMap.set(`${row.source_type}:${row.source_id}`, row))

    const missions = Array.from(rawMap.values())
      .map((mission) => applyAssignment(mission, assignmentMap.get(`${mission.source_type}:${mission.raw_id}`)))
      .sort((a, b) => {
        const aa = a.scheduled_start_at ? new Date(a.scheduled_start_at).getTime() : 0
        const bb = b.scheduled_start_at ? new Date(b.scheduled_start_at).getTime() : 0
        return aa - bb
      })

    const caregivers = (await safeRows(supabase as any, 'caregivers', 900)).map(normalizeCaregiver)
    const actionLogs = await safeRows(supabase as any, 'carelink_dispatch_action_logs', 300)
    const notifications = await safeRows(supabase as any, 'carelink_dispatch_notifications', 300)

    const routeGaps = missions.filter((m) => !m.route_from || !m.route_to || !m.transport_mode)
    const unassigned = missions.filter((m) => !m.caregiver_id && m.caregiver_name === 'Unassigned')
    const escalated = missions.filter((m) => m.dispatch_status === 'escalated' || m.risk_level === 'high')
    const active = missions.filter((m) => ['active', 'assigned', 'ready_for_dispatch'].includes(m.dispatch_status))
    const completed = missions.filter((m) => m.dispatch_status === 'completed')
    const cities = Array.from(new Set(missions.map((m) => m.city).filter(Boolean))).sort()
    const statuses = Array.from(new Set(missions.map((m) => m.dispatch_status).filter(Boolean))).sort()

    return NextResponse.json({
      ok: true,
      generatedAt: new Date().toISOString(),
      summary: {
        missions: missions.length,
        caregivers: caregivers.length,
        assigned: missions.filter((m) => m.caregiver_id || m.caregiver_name !== 'Unassigned').length,
        unassigned: unassigned.length,
        routeGaps: routeGaps.length,
        escalated: escalated.length,
        active: active.length,
        completed: completed.length,
        notifications: notifications.length,
      },
      cities,
      statuses,
      missions,
      caregivers,
      assignments: assignmentRows,
      routeGaps,
      actionLogs,
      notifications,
    })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Unable to load dispatch command', summary: {}, missions: [], caregivers: [] }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const action = text(body.action, 'update_dispatch_details')
    const supabase = await createClient()

    if ([
      'assign_mission',
      'reassign_mission',
      'set_backup',
      'route_update',
      'activate_dispatch',
      'complete_dispatch',
      'cancel_dispatch',
      'escalate_dispatch',
      'update_dispatch_details',
    ].includes(action)) {
      const result = await upsertAssignment(supabase as any, action, body)
      if (result.error) return NextResponse.json({ ok: false, error: result.error }, { status: 500 })
      return NextResponse.json({ ok: true, action, assignment: result.data })
    }

    await logAction(supabase as any, action, body, null)
    return NextResponse.json({ ok: true, action })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Unable to run dispatch command' }, { status: 500 })
  }
}
