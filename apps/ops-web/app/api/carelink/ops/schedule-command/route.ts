import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type AnyRecord = Record<string, any>

const CANONICAL_SCHEDULE_SOURCE_TABLES = [
  'carelink_schedule_events',
  'carelink_missions',
  'carelink_ops_missions',
  'mission_dossiers',
  'carelink_mission_dossiers',
  'missions',
  'carelink_submissions',
]

function editablePatchFromBody(body: AnyRecord) {
  const updates = body.updates || body.payload?.updates || {}

  return compact({
    title: updates.title,
    service_type: updates.service_type,
    family_name: updates.family_name,
    caregiver_id: updates.caregiver_id ? Number(updates.caregiver_id) : undefined,
    caregiver_name: updates.caregiver_name,
    city: updates.city,
    zone: updates.zone,
    start_at: updates.start_at,
    end_at: updates.end_at,
    route_from: updates.route_from,
    route_to: updates.route_to,
    transport_mode: updates.transport_mode,
    risk_level: updates.risk_level,
    validation_status: updates.validation_status,
    notes: updates.notes || updates.validation_notes,
    updated_at: new Date().toISOString(),
  })
}

function canonicalPatchCandidates(action: string, body: AnyRecord, workflowPatch: AnyRecord) {
  const edits = editablePatchFromBody(body)
  const status = workflowPatch.current_status
  const validation = workflowPatch.validation_status
  const now = new Date().toISOString()

  return [
    compact({ ...edits, status, validation_status: validation, updated_at: now }),
    compact({ ...edits, current_status: status, review_status: validation, updated_at: now }),
    compact({ ...edits, lifecycle_status: status, approval_status: validation, updated_at: now }),
    compact({ status, validation_status: validation, updated_at: now }),
    compact({ current_status: status, review_status: validation, updated_at: now }),
    compact({ lifecycle_status: status, approval_status: validation, updated_at: now }),
    compact({ ...edits, updated_at: now }),
  ].filter((row) => Object.keys(row).length > 1)
}

async function bridgeCanonicalScheduleSource(supabase: any, body: AnyRecord, workflowPatch: AnyRecord) {
  const sourceType = text(body.entity_type || body.source_type, 'schedule')
  const sourceId = text(body.entity_id || body.source_id || body.raw_id || body.id)

  if (!sourceId) {
    return { ok: false, status: 'missing_source_id', error: 'Missing source id' }
  }

  if (!CANONICAL_SCHEDULE_SOURCE_TABLES.includes(sourceType)) {
    return { ok: true, status: 'overlay_only', error: '' }
  }

  const candidates = canonicalPatchCandidates(text(body.action), body, workflowPatch)

  for (const patch of candidates) {
    try {
      const { error } = await supabase
        .from(sourceType)
        .update(patch)
        .eq('id', sourceId)

      if (!error) {
        return {
          ok: true,
          status: sourceType === 'carelink_schedule_events' ? 'manual_schedule_updated' : 'canonical_source_updated',
          table: sourceType,
          patchKeys: Object.keys(patch),
        }
      }
    } catch {
      // Try next patch shape.
    }
  }

  return {
    ok: false,
    status: 'workflow_overlay_saved_canonical_update_failed',
    table: sourceType,
    error: 'No compatible canonical patch shape was accepted by source table.',
  }
}

async function createScheduleNotifications(supabase: any, action: string, body: AnyRecord, workflowState: AnyRecord) {
  const payload = body.payload || {}
  const sourceType = text(body.entity_type || body.source_type, workflowState?.source_type || 'schedule')
  const sourceId = text(body.entity_id || body.source_id || workflowState?.source_id || '')
  const caregiverId = Number(payload.caregiver_id || body.caregiver_id || workflowState?.payload?.caregiver_id || 0) || null
  const caregiverName = text(payload.caregiver_name || body.caregiver_name || 'Unassigned')
  const titleBase = text(payload.title || body.title || 'Schedule item')

  const titleByAction: Record<string, string> = {
    approve_schedule_item: 'Schedule approved',
    request_assignment_review: 'Assignment review requested',
    route_validation_required: 'Route review required',
    set_status: `Schedule status changed to ${text(body.next_status || body.status, 'updated')}`,
    update_schedule_details: 'Schedule details updated',
  }

  const title = titleByAction[action] || `Schedule workflow: ${action}`

  const rows = [
    {
      audience_type: 'admin',
      title,
      body: `${titleBase} · ${caregiverName}`,
      priority: action.includes('cancel') || action.includes('review') ? 'high' : 'normal',
    },
    {
      audience_type: 'supervisor',
      title,
      body: `${titleBase} · ${caregiverName}`,
      priority: action.includes('review') ? 'high' : 'normal',
    },
  ]

  if (caregiverId || caregiverName !== 'Unassigned') {
    rows.push({
      audience_type: 'carelink_mobile_agent',
      title,
      body: `${titleBase} · ${text(body.next_status || body.status || workflowState?.current_status || workflowState?.validation_status, 'workflow updated')}`,
      priority: action.includes('cancel') ? 'high' : 'normal',
    })
  }

  const insertRows = rows.map((row) => ({
    ...row,
    caregiver_id: caregiverId,
    caregiver_name: caregiverName,
    action_type: action,
    source_type: sourceType,
    source_id: sourceId,
    workflow_state_id: workflowState?.id || null,
    payload: body,
    created_by: text(body.created_by, 'CareLink Ops'),
  }))

  try {
    const { error } = await supabase.from('carelink_schedule_notifications').insert(insertRows)
    if (error) return { ok: false, error: error.message, count: 0 }
    return { ok: true, error: '', count: insertRows.length }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Notification insert failed',
      count: 0,
    }
  }
}


function text(value: unknown, fallback = '') {
  if (value === null || value === undefined || value === '') return fallback
  return String(value).trim()
}

function number(value: unknown) {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

function iso(value: unknown) {
  if (value === null || value === undefined || value === '') return ''
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? '' : value.toISOString()

  const raw = String(value).trim()
  if (!raw) return ''

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

function compact(row: AnyRecord) {
  const out: AnyRecord = {}
  Object.entries(row).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') out[key] = value
  })
  return out
}

function normalizeStatus(value: unknown) {
  const s = text(value, 'planned').toLowerCase()

  if (s.includes('cancel')) return 'cancelled'
  if (s.includes('complete') || s.includes('done') || s.includes('closed')) return 'completed'
  if (s.includes('active') || s.includes('progress') || s.includes('started')) return 'active'
  if (s.includes('assign')) return 'assigned'
  if (s.includes('valid') || s.includes('review')) return 'validation'
  if (s.includes('risk') || s.includes('alert')) return 'risk'
  if (s.includes('draft')) return 'draft'
  return s || 'planned'
}

function normalizeRisk(row: AnyRecord) {
  const raw = text(row.risk_level || row.risk || row.priority || row.sla_status, 'normal').toLowerCase()

  if (raw.includes('critical') || raw.includes('high') || raw.includes('risk') || raw.includes('late')) return 'high'
  if (raw.includes('medium') || raw.includes('warn') || raw.includes('gap')) return 'medium'
  return 'normal'
}

function cityOf(row: AnyRecord) {
  return text(row.city || row.location_city || row.base_city || row.service_city || row.client_city || row.zone_city, 'Unassigned city')
}

function zoneOf(row: AnyRecord) {
  return text(row.zone || row.location_zone || row.base_zone || row.service_zone || row.client_zone, 'No zone')
}

function caregiverName(row: AnyRecord) {
  return text(
    row.caregiver_name ||
      row.caregiver_full_name ||
      row.agent_name ||
      row.assignee_name ||
      row.primary_caregiver_name ||
      row.caregiver?.full_name,
    'Unassigned',
  )
}

function itemTitle(row: AnyRecord) {
  return text(
    row.title ||
      row.mission_title ||
      row.service_title ||
      row.service_type ||
      row.type ||
      row.mission_code ||
      row.code,
    `Mission #${text(row.id, '—')}`,
  )
}

function startOf(row: AnyRecord) {
  const combined = combineDateAndTime(
    row.mission_date ||
      row.scheduled_date ||
      row.service_date ||
      row.schedule_date ||
      row.date ||
      row.start_date ||
      row.day_date,
    row.start_time ||
      row.start_hour ||
      row.scheduled_start_time ||
      row.mission_start_time,
  )

  if (combined) return combined

  return firstIso(row, [
    'start_at',
    'starts_at',
    'scheduled_start_at',
    'mission_start_at',
    'service_start_at',
    'planned_start_at',
    'start_datetime',
    'start_date',
    'mission_date',
    'scheduled_date',
    'service_date',
    'schedule_date',
    'date',
    'day_date',
    'created_at',
  ])
}

function endOf(row: AnyRecord) {
  const combined = combineDateAndTime(
    row.mission_date ||
      row.scheduled_date ||
      row.service_date ||
      row.schedule_date ||
      row.date ||
      row.end_date ||
      row.start_date ||
      row.day_date,
    row.end_time ||
      row.end_hour ||
      row.scheduled_end_time ||
      row.mission_end_time,
  )

  if (combined) return combined

  return firstIso(row, [
    'end_at',
    'ends_at',
    'scheduled_end_at',
    'mission_end_at',
    'service_end_at',
    'planned_end_at',
    'end_datetime',
    'end_date',
    'due_at',
    'due_date',
  ])
}

function normalizeMission(row: AnyRecord, sourceType: string): AnyRecord {
  const startAt = startOf(row)
  const fallbackEnd = startAt ? new Date(new Date(startAt).getTime() + 2 * 60 * 60 * 1000).toISOString() : ''
  const rawId = text(row.id || row.mission_id || row.dossier_id || row.uuid || row.code || row.source_id)

  return {
    id: `${sourceType}-${rawId || Math.random().toString(16).slice(2)}`,
    raw_id: rawId,
    source_type: sourceType,
    title: itemTitle(row),
    service_type: text(row.service_type || row.service || row.category || row.mission_type, 'CareLink service'),
    family_name: text(row.family_name || row.client_name || row.parent_name || row.family || row.customer_name, 'Family not loaded'),
    caregiver_id: number(row.caregiver_id || row.agent_id || row.assignee_id || row.primary_caregiver_id),
    caregiver_name: caregiverName(row),
    city: cityOf(row),
    zone: zoneOf(row),
    status: normalizeStatus(row.status || row.current_status || row.lifecycle_status || row.validation_status),
    priority: text(row.priority, normalizeRisk(row) === 'high' ? 'high' : 'normal'),
    risk_level: normalizeRisk(row),
    validation_status: text(row.validation_status || row.review_status || row.approval_status, 'draft'),
    start_at: startAt,
    end_at: endOf(row) || fallbackEnd,
    route_from: text(row.route_from || row.departure_zone || row.start_zone || row.from_location || row.city, ''),
    route_to: text(row.route_to || row.arrival_zone || row.end_zone || row.to_location || row.zone, ''),
    transport_mode: text(row.transport_mode || row.transport || row.mobility_mode, ''),
    notes: text(row.notes || row.description || row.summary || row.instructions, ''),
  }
}

function normalizeCaregiver(row: AnyRecord): AnyRecord {
  return {
    id: number(row.id),
    full_name: text(row.full_name || row.name || row.display_name, `Caregiver #${row.id}`),
    city: cityOf(row),
    zone: zoneOf(row),
    status: normalizeStatus(row.current_status || row.status || row.availability_status || 'available'),
    phone: text(row.phone || row.mobile || row.phone_number, ''),
    readiness: number(row.readiness_score || row.reliability_score || row.score),
  }
}

async function safeRows(supabase: any, table: string, limit = 800) {
  try {
    const { data, error } = await supabase.from(table).select('*').limit(limit)
    if (error || !Array.isArray(data)) return []
    return data as AnyRecord[]
  } catch {
    return []
  }
}

function workflowKey(sourceType: string, sourceId: unknown) {
  return `${sourceType}:${text(sourceId)}`
}

function applyWorkflow(item: AnyRecord, state: AnyRecord | undefined): AnyRecord {
  if (!state) return { ...item, workflow: null }

  return {
    ...item,
    status: text(state.current_status, item.status),
    validation_status: text(state.validation_status, item.validation_status),
    workflow: state,
    approval_status: text(state.approval_status, 'pending'),
    assignment_review_status: text(state.assignment_review_status, ''),
    route_review_status: text(state.route_review_status, ''),
  }
}

function detectConflicts(items: AnyRecord[]) {
  const timed = items
    .filter((item) => item.start_at && item.end_at && item.caregiver_id)
    .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime())

  const groups = timed.reduce<Record<string, AnyRecord[]>>((acc, item) => {
    const key = `${item.caregiver_id}-${String(item.start_at).slice(0, 10)}`
    acc[key] = acc[key] || []
    acc[key].push(item)
    return acc
  }, {})

  const conflicts: AnyRecord[] = []

  Object.values(groups).forEach((rows) => {
    rows.forEach((item, index) => {
      const next = rows[index + 1]
      if (!next) return

      const itemEnd = new Date(item.end_at).getTime()
      const nextStart = new Date(next.start_at).getTime()

      if (nextStart < itemEnd) {
        conflicts.push({
          caregiver_id: item.caregiver_id,
          caregiver_name: item.caregiver_name,
          first: item,
          second: next,
          day: String(item.start_at).slice(0, 10),
        })
      }
    })
  })

  return conflicts.slice(0, 80)
}

async function logAction(supabase: any, action: string, entityType: string, entityId: string, payload: AnyRecord) {
  try {
    await supabase.from('carelink_schedule_action_logs').insert({
      action_type: action,
      entity_type: entityType,
      entity_id: entityId,
      payload,
      created_by: text(payload.created_by, 'CareLink Ops'),
    })
  } catch {
    // Logging must never block the operational workflow.
  }
}

function workflowPatchFromAction(action: string, body: AnyRecord) {
  const now = new Date().toISOString()
  const admin = text(body.created_by, 'CareLink Ops')
  const nextStatus = text(body.next_status || body.status)
  const updates = body.updates || body.payload?.updates || {}

  const patch: AnyRecord = {
    last_action: action,
    last_action_at: now,
    last_action_by: admin,
    updated_at: now,
    payload: body,
  }

  if (action === 'approve_schedule_item') {
    patch.approval_status = 'approved'
    patch.validation_status = 'approved'
    patch.approved_at = now
    patch.approved_by = admin
  }

  if (action === 'request_assignment_review') {
    patch.assignment_review_status = 'requested'
    patch.validation_status = 'assignment_review'
    patch.assignment_review_requested_at = now
  }

  if (action === 'route_validation_required') {
    patch.route_review_status = 'required'
    patch.validation_status = 'route_review'
    patch.route_review_requested_at = now
  }

  if (action === 'set_status' && nextStatus) {
    patch.current_status = normalizeStatus(nextStatus)
    patch.status_changed_at = now

    if (normalizeStatus(nextStatus) === 'completed') patch.validation_status = 'completed'
    if (normalizeStatus(nextStatus) === 'cancelled') patch.validation_status = 'cancelled'
    if (normalizeStatus(nextStatus) === 'active') patch.validation_status = 'active'
  }

  if (action === 'update_schedule_details') {
    patch.validation_status = text(updates.validation_status, body.validation_status || 'details_updated')
    patch.notes = text(updates.validation_notes || updates.notes || body.notes, '')
    if (updates.status) patch.current_status = normalizeStatus(updates.status)
  }

  return compact(patch)
}

async function upsertWorkflowState(supabase: any, body: AnyRecord) {
  const action = text(body.action)
  const sourceType = text(body.entity_type || body.source_type, 'schedule')
  const sourceId = text(body.entity_id || body.source_id || body.raw_id || body.id)

  if (!sourceId) {
    return { data: null, error: 'Missing source id' }
  }

  const patch = workflowPatchFromAction(action, body)
  const bridge = await bridgeCanonicalScheduleSource(supabase, body, patch)

  const row = compact({
    source_type: sourceType,
    source_id: sourceId,
    schedule_event_id: sourceType === 'carelink_schedule_events' ? Number(sourceId) : null,
    ...patch,
    canonical_bridge_status: bridge.status,
    canonical_bridge_error: bridge.error || '',
  })

  const { data, error } = await supabase
    .from('carelink_schedule_workflow_states')
    .upsert(row, { onConflict: 'source_type,source_id' })
    .select('*')
    .single()

  if (error) {
    return { data: null, error: error.message }
  }

  const notifications = await createScheduleNotifications(supabase, action, body, data)

  return {
    data: {
      ...data,
      canonical_bridge: bridge,
      notifications,
    },
    error: null,
  }
}

export async function GET() {
  try {
    const supabase = await createClient()

    const missionTables = [
      'carelink_schedule_events',
      'carelink_missions',
      'carelink_ops_missions',
      'mission_dossiers',
      'carelink_mission_dossiers',
      'missions',
      'carelink_submissions',
    ]

    const groups = await Promise.all(
      missionTables.map(async (table) => {
        const rows = await safeRows(supabase as any, table, table === 'carelink_schedule_events' ? 1200 : 800)
        return rows.map((row) => normalizeMission(row, table))
      }),
    )

    const rawMap = new Map<string, AnyRecord>()
    groups.flat().forEach((item) => {
      if (!rawMap.has(item.id)) rawMap.set(item.id, item)
    })

    const workflowRows = await safeRows(supabase as any, 'carelink_schedule_workflow_states', 3000)
    const workflowMap = new Map<string, AnyRecord>()

    workflowRows.forEach((row) => {
      workflowMap.set(workflowKey(row.source_type, row.source_id), row)
    })

    const items = Array.from(rawMap.values())
      .map((item) => applyWorkflow(item, workflowMap.get(workflowKey(item.source_type, item.raw_id))))
      .sort((a, b) => {
        const aa = a.start_at ? new Date(a.start_at).getTime() : 0
        const bb = b.start_at ? new Date(b.start_at).getTime() : 0
        return aa - bb
      })

    const caregiverRows = await safeRows(supabase as any, 'caregivers', 900)
    const caregivers = caregiverRows.map(normalizeCaregiver)

    const todayKey = new Date().toISOString().slice(0, 10)
    const currentMonth = new Date().toISOString().slice(0, 7)

    const today = items.filter((item) => String(item.start_at).slice(0, 10) === todayKey)
    const active = items.filter((item) => ['active', 'assigned'].includes(item.status))
    const cancelled = items.filter((item) => item.status === 'cancelled')
    const risk = items.filter((item) => item.risk_level === 'high' || item.status === 'risk')
    const validation = items.filter((item) => {
      const v = text(item.validation_status, '').toLowerCase()
      return ['draft', 'pending', 'validation', 'review', 'assignment_review', 'route_review'].some((x) => v.includes(x)) || item.status === 'validation'
    })
    const unassigned = items.filter((item) => !item.caregiver_id && item.caregiver_name === 'Unassigned')
    const undated = items.filter((item) => !item.start_at)
    const monthItems = items.filter((item) => String(item.start_at).slice(0, 7) === currentMonth)
    const routeGaps = items.filter((item) => !item.route_from || !item.route_to || !item.transport_mode)
    const conflicts = detectConflicts(items)
    const approved = items.filter((item) => item.workflow?.approval_status === 'approved')

    const cities = Array.from(new Set(items.map((item) => item.city).filter(Boolean))).sort()
    const statuses = Array.from(new Set(items.map((item) => item.status).filter(Boolean))).sort()

    return NextResponse.json({
      ok: true,
      generatedAt: new Date().toISOString(),
      summary: {
        total: items.length,
        today: today.length,
        active: active.length,
        cancelled: cancelled.length,
        risk: risk.length,
        validation: validation.length,
        unassigned: unassigned.length,
        caregivers: caregivers.length,
        cities: cities.length,
        undated: undated.length,
        month: monthItems.length,
        routeGaps: routeGaps.length,
        conflicts: conflicts.length,
        approved: approved.length,
      },
      cities,
      statuses,
      items,
      caregivers,
      conflicts,
      routeGaps,
      workflowStates: workflowRows,
    })
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unable to load schedule command center',
      summary: {},
      cities: [],
      statuses: [],
      items: [],
      caregivers: [],
      conflicts: [],
      routeGaps: [],
    }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const supabase = await createClient()
    const action = text(body.action, 'create_event')

    if (action === 'create_event') {
      const row = {
        source_type: 'manual',
        title: text(body.title, 'Manual schedule block'),
        service_type: text(body.service_type, 'CareLink operational block'),
        family_name: text(body.family_name),
        caregiver_id: body.caregiver_id ? Number(body.caregiver_id) : null,
        caregiver_name: text(body.caregiver_name),
        city: text(body.city),
        zone: text(body.zone),
        status: text(body.status, 'planned'),
        priority: text(body.priority, 'normal'),
        start_at: body.start_at || null,
        end_at: body.end_at || null,
        route_from: text(body.route_from),
        route_to: text(body.route_to),
        transport_mode: text(body.transport_mode),
        validation_status: text(body.validation_status, 'draft'),
        risk_level: text(body.risk_level, 'normal'),
        notes: text(body.notes),
        created_by: text(body.created_by, 'CareLink Ops'),
      }

      const { data, error } = await (supabase as any)
        .from('carelink_schedule_events')
        .insert(row)
        .select('*')
        .single()

      if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })

      await logAction(supabase as any, action, 'carelink_schedule_events', String(data.id), { ...body, event: data })

      return NextResponse.json({ ok: true, event: data })
    }

    await logAction(
      supabase as any,
      action,
      text(body.entity_type || body.source_type, 'schedule'),
      text(body.entity_id || body.source_id || body.raw_id || body.id),
      body,
    )

    if (
      [
        'approve_schedule_item',
        'request_assignment_review',
        'route_validation_required',
        'set_status',
        'update_schedule_details',
      ].includes(action)
    ) {
      const workflow = await upsertWorkflowState(supabase as any, body)

      if (workflow.error) {
        return NextResponse.json({ ok: false, error: workflow.error }, { status: 500 })
      }

      return NextResponse.json({
        ok: true,
        action,
        workflow: workflow.data,
      })
    }

    return NextResponse.json({ ok: true, action })
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unable to save schedule action',
    }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const id = Number(body.id)
    const supabase = await createClient()

    if (!Number.isFinite(id) || !id) {
      return NextResponse.json({ ok: false, error: 'Manual schedule event id is required' }, { status: 400 })
    }

    const patch: AnyRecord = {
      updated_at: new Date().toISOString(),
    }

    ;[
      'title',
      'service_type',
      'family_name',
      'caregiver_name',
      'city',
      'zone',
      'status',
      'priority',
      'start_at',
      'end_at',
      'route_from',
      'route_to',
      'transport_mode',
      'validation_status',
      'risk_level',
      'notes',
    ].forEach((key) => {
      if (key in body) patch[key] = body[key]
    })

    if ('caregiver_id' in body) patch.caregiver_id = body.caregiver_id ? Number(body.caregiver_id) : null

    const { data, error } = await (supabase as any)
      .from('carelink_schedule_events')
      .update(patch)
      .eq('id', id)
      .select('*')
      .single()

    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })

    await logAction(supabase as any, 'patch_manual_schedule_event', 'carelink_schedule_events', String(id), body)

    return NextResponse.json({ ok: true, event: data })
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unable to update schedule event',
    }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json()
    const id = Number(body.id)
    const supabase = await createClient()

    if (!Number.isFinite(id) || !id) {
      return NextResponse.json({ ok: false, error: 'Manual schedule event id is required' }, { status: 400 })
    }

    const { error } = await (supabase as any)
      .from('carelink_schedule_events')
      .delete()
      .eq('id', id)

    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })

    await logAction(supabase as any, 'delete_manual_schedule_event', 'carelink_schedule_events', String(id), body)

    return NextResponse.json({ ok: true, deleted: id })
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unable to delete schedule event',
    }, { status: 500 })
  }
}
