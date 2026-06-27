import { createClient } from '@/lib/supabase/server'

type AnyRow = Record<string, any>

type AuditPriority = 'low' | 'normal' | 'high' | 'critical'

type AgentActivityInput = {
  caregiverId?: number | null
  userId?: string | null
  missionId?: number | null
  activityType: string
  source?: string
  status?: string
  outcome?: string
  priority?: AuditPriority
  request?: Request | null
  metadata?: Record<string, unknown>
}

type MissionTimelineInput = {
  missionId: number
  caregiverId?: number | null
  actionType: string
  eventType?: string
  source?: string
  outcome?: string
  previousMission?: AnyRow | null
  nextMission?: AnyRow | null
  metadata?: Record<string, unknown>
}

type SlaSnapshotInput = {
  missionId: number
  caregiverId?: number | null
  actionType: string
  mission?: AnyRow | null
  previousMission?: AnyRow | null
  source?: string
  metadata?: Record<string, unknown>
}

function cleanString(value: unknown) {
  return String(value || '').trim()
}

function cleanLower(value: unknown) {
  return cleanString(value).toLowerCase()
}

function safeDate(value: unknown): Date | null {
  if (!value) return null
  const date = new Date(String(value))
  return Number.isFinite(date.getTime()) ? date : null
}

function toIso(value: unknown) {
  const date = safeDate(value)
  return date ? date.toISOString() : null
}

function minutesBetween(start: unknown, end: unknown) {
  const startDate = safeDate(start)
  const endDate = safeDate(end)
  if (!startDate || !endDate) return null
  return Math.round((endDate.getTime() - startDate.getTime()) / 60000)
}

function requestDeviceContext(request?: Request | null) {
  if (!request) return {}
  const forwardedFor = request.headers.get('x-forwarded-for') || ''
  return {
    ip: forwardedFor.split(',')[0]?.trim() || request.headers.get('x-real-ip') || null,
    user_agent: request.headers.get('user-agent') || null,
    forwarded_for: forwardedFor || null,
    request_id: request.headers.get('x-request-id') || request.headers.get('x-vercel-id') || null,
    idempotency_key:
      request.headers.get('Idempotency-Key') ||
      request.headers.get('X-Idempotency-Key') ||
      request.headers.get('x-carelink-idempotency-key') ||
      null,
  }
}

function firstPresent(row: AnyRow | null | undefined, keys: string[]) {
  if (!row) return null
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null && cleanString(row[key])) return row[key]
  }
  return null
}

function plannedStart(row: AnyRow | null | undefined) {
  return firstPresent(row, ['scheduled_start_at', 'planned_start_at', 'start_at', 'starts_at', 'mission_start_at', 'departure_at'])
}

function plannedEnd(row: AnyRow | null | undefined) {
  return firstPresent(row, ['scheduled_end_at', 'planned_end_at', 'due_at', 'ends_at', 'mission_end_at'])
}

function actualArrival(row: AnyRow | null | undefined) {
  return firstPresent(row, ['arrival_confirmed_at', 'arrived_at', 'checked_in_at'])
}

function actualStart(row: AnyRow | null | undefined) {
  return firstPresent(row, ['started_at', 'checked_in_at', 'arrival_confirmed_at'])
}

function actualCompletion(row: AnyRow | null | undefined) {
  return firstPresent(row, ['completed_at', 'report_submitted_at', 'updated_at'])
}

function resolveSlaStatus(minutes: number | null) {
  if (minutes === null) return 'unknown'
  if (minutes <= 5) return 'on_time'
  if (minutes <= 15) return 'watch'
  if (minutes <= 30) return 'delayed'
  return 'critical_delay'
}

function complianceFlags(input: MissionTimelineInput) {
  const flags = new Set<string>()
  const action = cleanLower(input.actionType)
  const nextMission = input.nextMission || input.previousMission || {}
  const arrivalDelta = minutesBetween(plannedStart(nextMission), actualArrival(nextMission))
  const startDelta = minutesBetween(plannedStart(nextMission), actualStart(nextMission))
  const completionDelta = minutesBetween(plannedEnd(nextMission), actualCompletion(nextMission))

  if (action.includes('delay')) flags.add('delay_declared')
  if (action.includes('incident')) flags.add('incident_declared')
  if (action.includes('replacement')) flags.add('replacement_requested')
  if (arrivalDelta !== null && arrivalDelta > 10) flags.add('arrival_sla_breach')
  if (startDelta !== null && startDelta > 10) flags.add('start_sla_breach')
  if (completionDelta !== null && completionDelta > 15) flags.add('completion_sla_breach')
  if (cleanLower(nextMission.risk_level).includes('critical')) flags.add('critical_risk')
  if (action.includes('complete') && !nextMission.report_submitted_at && cleanLower(nextMission.report_status) !== 'submitted') {
    flags.add('completion_without_report_timestamp')
  }

  return Array.from(flags)
}

function slaSnapshot(input: SlaSnapshotInput) {
  const mission = input.mission || input.previousMission || {}
  const arrivalDeltaMinutes = minutesBetween(plannedStart(mission), actualArrival(mission))
  const startDeltaMinutes = minutesBetween(plannedStart(mission), actualStart(mission))
  const completionDeltaMinutes = minutesBetween(plannedEnd(mission), actualCompletion(mission))
  const worstDelta = [arrivalDeltaMinutes, startDeltaMinutes, completionDeltaMinutes]
    .filter((value): value is number => typeof value === 'number')
    .sort((a, b) => b - a)[0]

  return {
    mission_id: input.missionId,
    caregiver_id: input.caregiverId ?? null,
    action_type: input.actionType,
    source: input.source || 'carelink_mobile',
    sla_status: resolveSlaStatus(worstDelta ?? null),
    arrival_delta_minutes: arrivalDeltaMinutes,
    start_delta_minutes: startDeltaMinutes,
    completion_delta_minutes: completionDeltaMinutes,
    risk_level: mission.risk_level || null,
    metadata: {
      planned_start_at: toIso(plannedStart(mission)),
      planned_end_at: toIso(plannedEnd(mission)),
      actual_arrival_at: toIso(actualArrival(mission)),
      actual_start_at: toIso(actualStart(mission)),
      actual_completion_at: toIso(actualCompletion(mission)),
      ...(input.metadata || {}),
    },
  }
}

export async function recordCareLinkAgentActivity(input: AgentActivityInput) {
  try {
    const supabase = await createClient()
    await supabase.from('carelink_agent_activity_ledger').insert([{
      caregiver_id: input.caregiverId ?? null,
      app_user_id: input.userId || null,
      mission_id: input.missionId ?? null,
      activity_type: input.activityType,
      source: input.source || 'carelink_mobile',
      status: input.status || null,
      outcome: input.outcome || null,
      priority: input.priority || 'normal',
      device_context: requestDeviceContext(input.request),
      metadata: input.metadata || {},
    }])
  } catch {
    // Audit writes must never block field execution.
  }
}

export async function recordCareLinkMissionTimelineAudit(input: MissionTimelineInput) {
  try {
    const previousMission = input.previousMission || {}
    const nextMission = input.nextMission || {}
    const flags = complianceFlags(input)
    const arrivalDeltaMinutes = minutesBetween(plannedStart(nextMission), actualArrival(nextMission))
    const startDeltaMinutes = minutesBetween(plannedStart(nextMission), actualStart(nextMission))
    const completionDeltaMinutes = minutesBetween(plannedEnd(nextMission), actualCompletion(nextMission))
    const supabase = await createClient()

    await supabase.from('carelink_mission_timeline_audit').insert([{
      mission_id: input.missionId,
      caregiver_id: input.caregiverId ?? null,
      action_type: input.actionType,
      event_type: input.eventType || input.actionType,
      source: input.source || 'carelink_mobile',
      outcome: input.outcome || 'recorded',
      previous_status: previousMission.status || null,
      next_status: nextMission.status || null,
      previous_lifecycle_stage: previousMission.lifecycle_stage || null,
      next_lifecycle_stage: nextMission.lifecycle_stage || null,
      arrival_delta_minutes: arrivalDeltaMinutes,
      start_delta_minutes: startDeltaMinutes,
      completion_delta_minutes: completionDeltaMinutes,
      compliance_flags: flags,
      metadata: {
        previous_last_mobile_action: previousMission.last_mobile_action || null,
        next_last_mobile_action: nextMission.last_mobile_action || null,
        risk_level: nextMission.risk_level || previousMission.risk_level || null,
        ...(input.metadata || {}),
      },
    }])
  } catch {
    // Audit writes must never block field execution.
  }
}

export async function recordCareLinkDispatchSlaSnapshot(input: SlaSnapshotInput) {
  try {
    const supabase = await createClient()
    await supabase.from('carelink_dispatch_sla_audit_snapshots').insert([slaSnapshot(input)])
  } catch {
    // Audit writes must never block field execution.
  }
}

export async function recordCareLinkMobileGuardPass(input: {
  caregiverId: number
  userId?: string | null
  capability: string
  accessStatus?: string | null
  metadata?: Record<string, unknown>
}) {
  await recordCareLinkAgentActivity({
    caregiverId: input.caregiverId,
    userId: input.userId || null,
    activityType: 'mobile_guard_pass',
    source: 'carelink_mobile_guard',
    status: input.accessStatus || 'active',
    outcome: 'allowed',
    priority: 'low',
    metadata: { capability: input.capability, ...(input.metadata || {}) },
  })
}
