import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type AnyRecord = Record<string, any>

function text(value: unknown, fallback = '') {
  if (value === null || value === undefined || value === '') return fallback
  return String(value).trim()
}

function number(value: unknown) {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

function bool(value: unknown) {
  return value === true || value === 'true' || value === 1 || value === '1' || value === 'yes'
}

function lower(value: unknown) {
  return text(value).toLowerCase()
}

function asArray(value: unknown): AnyRecord[] {
  return Array.isArray(value) ? value as AnyRecord[] : []
}

function parseJsonLike(value: unknown) {
  if (Array.isArray(value) || (value && typeof value === 'object')) return value
  if (typeof value !== 'string' || !value.trim()) return null
  try { return JSON.parse(value) } catch { return null }
}

function isEmptyObject(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return true
  return Object.keys(value as AnyRecord).length === 0
}

function isBadMissionDate(value: unknown) {
  const raw = text(value)
  if (!raw) return true
  if (raw.startsWith('0001-01-01')) return true
  if (raw.startsWith('1970-01-01')) return true
  const date = new Date(raw.includes('T') ? raw : `${raw}T12:00:00`)
  return Number.isNaN(date.getTime())
}

function isDeletedOrArchivedMission(row: AnyRecord) {
  const flags = [row.status, row.lifecycle_stage, row.dossier_status, row.execution_status, row.dispatch_status]
    .map((v) => lower(v))
    .join(' ')

  return Boolean(
    bool(row.is_archived) ||
    row.archived_at ||
    flags.includes('deleted') ||
    flags.includes('archived') ||
    flags.includes('void')
  )
}

function isCancelledMission(row: AnyRecord) {
  const flags = [row.status, row.lifecycle_stage, row.dossier_status, row.execution_status]
    .map((v) => lower(v))
    .join(' ')

  return Boolean(flags.includes('cancel') || row.cancelled_at)
}

function isCompletedMission(row: AnyRecord) {
  const flags = [row.status, row.lifecycle_stage, row.validation_status, row.report_status]
    .map((v) => lower(v))
    .join(' ')

  return Boolean(flags.includes('completed') || row.completed_at || row.actual_end_at)
}

function routeLines(row: AnyRecord) {
  const parsed = parseJsonLike(row.route_lines)
  return Array.isArray(parsed) ? parsed : []
}

function transportConfig(row: AnyRecord) {
  const parsed = parseJsonLike(row.transport_config)
  return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as AnyRecord : {}
}

function hasRouteReady(row: AnyRecord) {
  const routes = routeLines(row)
  const transport = transportConfig(row)
  const hasRouteLines = routes.length > 0
  const hasTransport = !isEmptyObject(transport)
  const hasRouteText = Boolean(text(row.route_from || row.route_to || row.departure_zone || row.arrival_zone))
  return hasRouteLines || hasTransport || hasRouteText
}

function missionDisplayCode(row: AnyRecord) {
  return text(row.mission_code || row.mission_reference || row.dossier_reference || `MISSION-${row.id}`)
}

function normalizeMission(row: AnyRecord) {
  const missionDate = text(row.mission_date || row.scheduled_start || row.created_at)
  const invalidDate = isBadMissionDate(missionDate)
  const deletedOrArchived = isDeletedOrArchivedMission(row)
  const cancelled = isCancelledMission(row)
  const completed = isCompletedMission(row)
  const routeReady = hasRouteReady(row)
  const caregiverId = number(row.caregiver_id || row.staff_id)
  const backupCaregiverId = number(row.backup_caregiver_id)

  return {
    id: row.id,
    mission_code: missionDisplayCode(row),
    title: text(row.service_type || row.service_family || row.mission_kind || 'CareLink mission'),
    city: text(row.city, 'Unassigned city'),
    zone: text(row.zone, 'No zone'),
    caregiver_id: caregiverId || null,
    backup_caregiver_id: backupCaregiverId || null,
    status: text(row.status || row.lifecycle_stage || 'planned'),
    lifecycle_stage: text(row.lifecycle_stage),
    dispatch_status: text(row.dispatch_status || 'unassigned'),
    validation_status: text(row.validation_status || 'pending'),
    report_status: text(row.report_status || 'pending'),
    readiness_status: text(row.readiness_status || 'pending'),
    sla_status: text(row.sla_status || 'normal'),
    risk_level: text(row.risk_level || row.urgency || 'normal'),
    mission_date: missionDate,
    start_time: text(row.start_time),
    end_time: text(row.end_time),
    scheduled_start: text(row.scheduled_start),
    scheduled_end: text(row.scheduled_end),
    route_ready: routeReady,
    route_lines: routeLines(row),
    transport_config: transportConfig(row),
    ops_notes: text(row.ops_notes || row.notes),
    invalid_date: invalidDate,
    deleted_or_archived: deletedOrArchived,
    cancelled,
    completed,
    clean_operational: !deletedOrArchived && !cancelled && !invalidDate,
    updated_at: text(row.updated_at || row.created_at),
    raw: row,
  }
}

async function safeRows(supabase: any, table: string, limit = 500) {
  try {
    const { data, error } = await supabase.from(table).select('*').limit(limit)
    if (error || !Array.isArray(data)) return []
    return data as AnyRecord[]
  } catch {
    return []
  }
}

function pendingValidation(item: AnyRecord) {
  const value = lower(item.validation_status)
  return ['pending', 'draft', 'review', 'assignment_review', 'route_review'].some((key) => value.includes(key))
}

function highRisk(item: AnyRecord) {
  const risk = lower(item.risk_level)
  const sla = lower(item.sla_status)
  return risk.includes('high') || risk.includes('critical') || sla.includes('late') || sla.includes('risk')
}

function isOperationalActive(item: AnyRecord) {
  if (!item.clean_operational) return false
  if (item.completed) return false
  const status = lower(item.status)
  const lifecycle = lower(item.lifecycle_stage)
  return !['completed', 'cancelled', 'deleted', 'archived'].some((key) => status.includes(key) || lifecycle.includes(key))
}

function latest(rows: AnyRecord[], count = 12) {
  return [...rows]
    .sort((a, b) => new Date(text(b.created_at || b.updated_at || b.last_action_at)).getTime() - new Date(text(a.created_at || a.updated_at || a.last_action_at)).getTime())
    .slice(0, count)
}

export async function GET() {
  try {
    const supabase = await createClient()

    const [
      missionRows,
      dispatchAssignments,
      dispatchLogs,
      dispatchNotifications,
      scheduleEvents,
      scheduleWorkflows,
      scheduleLogs,
      scheduleNotifications,
      missionWorkflows,
      missionLogs,
      missionNotifications,
      caregivers,
      agentAccess,
      agentLogs,
      agentNotifications,
    ] = await Promise.all([
      safeRows(supabase as any, 'missions', 1500),
      safeRows(supabase as any, 'carelink_dispatch_assignments', 800),
      safeRows(supabase as any, 'carelink_dispatch_action_logs', 800),
      safeRows(supabase as any, 'carelink_dispatch_notifications', 800),
      safeRows(supabase as any, 'carelink_schedule_events', 800),
      safeRows(supabase as any, 'carelink_schedule_workflow_states', 800),
      safeRows(supabase as any, 'carelink_schedule_action_logs', 800),
      safeRows(supabase as any, 'carelink_schedule_notifications', 800),
      safeRows(supabase as any, 'carelink_mission_workflow_states', 800),
      safeRows(supabase as any, 'carelink_mission_action_logs', 800),
      safeRows(supabase as any, 'carelink_mission_notifications', 800),
      safeRows(supabase as any, 'caregivers', 800),
      safeRows(supabase as any, 'carelink_agent_app_access', 800),
      safeRows(supabase as any, 'carelink_agent_action_logs', 800),
      safeRows(supabase as any, 'carelink_agent_notifications', 800),
    ])

    const missions = missionRows.map(normalizeMission)
    const cleanMissions = missions.filter((item) => item.clean_operational)
    const activeMissions = cleanMissions.filter(isOperationalActive)
    const completedMissions = cleanMissions.filter((item) => item.completed)
    const cancelledMissions = missions.filter((item) => item.cancelled && !item.deleted_or_archived)
    const archivedMissions = missions.filter((item) => item.deleted_or_archived)
    const invalidDateMissions = missions.filter((item) => item.invalid_date)
    const pendingValidationMissions = activeMissions.filter(pendingValidation)
    const highRiskMissions = activeMissions.filter(highRisk)
    const routeGapMissions = activeMissions.filter((item) => !item.route_ready)
    const caregiverUnassigned = activeMissions.filter((item) => !item.caregiver_id)
    const dispatchUnassigned = activeMissions.filter((item) => lower(item.dispatch_status).includes('unassigned'))

    const queuedNotifications = [
      ...missionNotifications,
      ...dispatchNotifications,
      ...scheduleNotifications,
      ...agentNotifications,
    ].filter((row) => ['queued', 'pending', 'unread'].includes(lower(row.delivery_status || (row.is_read ? 'read' : 'queued'))))

    const allActionLogs = [
      ...missionLogs.map((row) => ({ ...row, source: 'mission' })),
      ...dispatchLogs.map((row) => ({ ...row, source: 'dispatch' })),
      ...scheduleLogs.map((row) => ({ ...row, source: 'schedule' })),
      ...agentLogs.map((row) => ({ ...row, source: 'agent' })),
    ]

    const allWorkflows = [
      ...missionWorkflows.map((row) => ({ ...row, source: 'mission' })),
      ...scheduleWorkflows.map((row) => ({ ...row, source: 'schedule' })),
      ...dispatchAssignments.map((row) => ({ ...row, source: 'dispatch' })),
    ]

    const mobileReady = agentAccess.filter((row) => bool(row.mobile_enabled) && !lower(row.access_status).includes('suspend'))

    const penalty =
      pendingValidationMissions.length * 5 +
      routeGapMissions.length * 4 +
      highRiskMissions.length * 8 +
      caregiverUnassigned.length * 6 +
      dispatchUnassigned.length * 3 +
      queuedNotifications.length * 2

    const healthScore = Math.max(0, Math.min(100, 100 - penalty))

    return NextResponse.json({
      ok: true,
      generatedAt: new Date().toISOString(),
      logic: {
        sourceOfTruth: 'public.missions',
        activeMissionDefinition: 'not archived/deleted/cancelled, valid mission_date, not completed',
        excludedFromActive: ['is_archived=true', 'status/lifecycle/dossier_status deleted', 'cancelled', 'invalid mission_date 0001-01-01', 'completed'],
      },
      summary: {
        healthScore,
        missions: cleanMissions.length,
        allMissionRows: missions.length,
        activeMissions: activeMissions.length,
        completedMissions: completedMissions.length,
        cancelledMissions: cancelledMissions.length,
        archivedMissions: archivedMissions.length,
        invalidDateMissions: invalidDateMissions.length,
        pendingValidation: pendingValidationMissions.length,
        caregiverUnassigned: caregiverUnassigned.length,
        dispatchUnassigned: dispatchUnassigned.length,
        highRisk: highRiskMissions.length,
        routeGaps: routeGapMissions.length,
        dispatchAssignments: dispatchAssignments.length,
        scheduleItems: scheduleEvents.length + scheduleWorkflows.length,
        caregivers: caregivers.length,
        mobileReady: mobileReady.length,
        queuedNotifications: queuedNotifications.length,
        workflows: allWorkflows.length,
        actionLogs: allActionLogs.length,
      },
      records: {
        missions: cleanMissions,
        allMissions: missions,
        activeMissions,
        completedMissions,
        cancelledMissions,
        archivedMissions,
        invalidDateMissions,
        pendingValidationMissions,
        highRiskMissions,
        routeGapMissions,
        caregiverUnassigned,
        dispatchUnassigned,
        dispatchAssignments,
        scheduleEvents,
        scheduleWorkflows,
        missionWorkflows,
        caregivers,
        agentAccess,
        queuedNotifications: latest(queuedNotifications, 30),
        actionLogs: latest(allActionLogs, 30),
        workflows: latest(allWorkflows, 30),
      },
    })
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unable to load CareLink overview command',
      summary: {},
      records: {},
    }, { status: 500 })
  }
}
