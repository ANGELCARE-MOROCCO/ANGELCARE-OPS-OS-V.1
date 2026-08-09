import { createAlert, createDispatchMessage, createNotification } from '@/lib/carelink/mobile-persistence'
import { recordCareLinkAgentActivity, recordCareLinkDispatchSlaSnapshot, recordCareLinkMissionTimelineAudit } from '@/lib/carelink/mobile-audit-ledger'
import { createClient } from '@/lib/supabase/server'
import { recordMissionEvent } from '@/lib/missions/events'

type AnyRow = Record<string, any>

type EscalationPriority = 'low' | 'normal' | 'high' | 'critical'

type CareLinkOperationalEscalationInput = {
  missionId: number
  caregiverId: number
  userId?: string | null
  actionType: string
  escalationType: string
  title: string
  body: string
  priority?: EscalationPriority
  severity?: string | null
  minutes?: number | null
  mission?: AnyRow | null
  previousMission?: AnyRow | null
  request?: Request | null
  metadata?: Record<string, unknown>
}

function cleanString(value: unknown) {
  return String(value || '').trim()
}

function normalizeLower(value: unknown) {
  return cleanString(value).toLowerCase()
}

function safeNumber(value: unknown) {
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

function escalationPriority(input: CareLinkOperationalEscalationInput): EscalationPriority {
  const severity = normalizeLower(input.severity)
  const minutes = safeNumber(input.minutes) || 0
  if (input.priority === 'critical' || ['critical', 'grave', 'urgent', 'danger', 'emergency'].includes(severity)) return 'critical'
  if (input.escalationType.includes('incident')) return severity === 'high' ? 'critical' : 'high'
  if (input.escalationType.includes('replacement')) return 'high'
  if (input.escalationType.includes('delay') && minutes >= 20) return 'critical'
  if (input.escalationType.includes('delay') && minutes >= 5) return 'high'
  return input.priority || 'normal'
}

function buildEscalationStatus(priority: EscalationPriority) {
  return priority === 'critical' ? 'urgent_ops_review' : 'ops_review_required'
}

async function insertCareLinkOperationalEscalation(input: CareLinkOperationalEscalationInput, priority: EscalationPriority) {
  try {
    const supabase = await createClient()
    const { data } = await supabase.from('carelink_operational_escalations').insert([{
      mission_id: input.missionId,
      caregiver_id: input.caregiverId,
      action_type: input.actionType,
      escalation_type: input.escalationType,
      title: input.title,
      body: input.body,
      priority,
      severity: input.severity || priority,
      status: buildEscalationStatus(priority),
      minutes: input.minutes ?? null,
      source: 'carelink_mobile',
      metadata: input.metadata || {},
    }]).select('*').maybeSingle()
    return data as AnyRow | null
  } catch {
    return null
  }
}

async function enqueueOpsAction(input: CareLinkOperationalEscalationInput, priority: EscalationPriority, escalationId?: string | number | null) {
  try {
    const supabase = await createClient()
    await supabase.from('carelink_ops_action_queue').insert([{
      mission_id: input.missionId,
      caregiver_id: input.caregiverId,
      escalation_id: escalationId ?? null,
      queue_type: input.escalationType,
      action_type: input.actionType,
      title: input.title,
      body: input.body,
      priority,
      status: 'open',
      source: 'carelink_mobile',
      metadata: input.metadata || {},
    }])
  } catch {
    // Queue writes must never block field execution.
  }
}

export async function createCareLinkOperationalEscalation(input: CareLinkOperationalEscalationInput) {
  const priority = escalationPriority(input)
  const metadata = {
    action_type: input.actionType,
    escalation_type: input.escalationType,
    severity: input.severity || null,
    minutes: input.minutes ?? null,
    priority,
    ...(input.metadata || {}),
  }

  const escalation = await insertCareLinkOperationalEscalation({ ...input, metadata }, priority)
  const escalationId = escalation?.id ?? null

  await Promise.allSettled([
    enqueueOpsAction({ ...input, metadata }, priority, escalationId),
    createAlert({
      type: input.escalationType,
      title: input.title,
      body: input.body,
      priority,
      missionId: input.missionId,
      caregiverId: input.caregiverId,
      linkedEntityType: 'carelink_operational_escalation',
      linkedEntityId: escalationId ? String(escalationId) : String(input.missionId),
      metadata,
    }),
    createNotification({
      type: input.escalationType,
      title: input.title,
      body: input.body,
      priority,
      missionId: input.missionId,
      caregiverId: input.caregiverId,
      linkedEntityType: 'carelink_operational_escalation',
      linkedEntityId: escalationId ? String(escalationId) : String(input.missionId),
      metadata,
    }),
    createDispatchMessage({
      missionId: input.missionId,
      caregiverId: input.caregiverId,
      senderType: 'agent',
      senderId: String(input.caregiverId),
      recipientType: 'ops',
      subject: input.title,
      body: input.body,
      priority,
      status: 'sent',
      threadKey: `mission:${input.missionId}`,
      metadata,
    }),
    recordMissionEvent({
      missionId: input.missionId,
      eventType: `ops_escalation_${input.escalationType}`,
      content: input.body,
      metadata: { ...metadata, escalation_id: escalationId },
      source: 'carelink_mobile',
    }),
    recordCareLinkAgentActivity({
      caregiverId: input.caregiverId,
      userId: input.userId || null,
      missionId: input.missionId,
      activityType: input.actionType,
      source: 'carelink_mobile_escalation',
      status: buildEscalationStatus(priority),
      outcome: 'ops_escalation_created',
      priority,
      request: input.request || null,
      metadata: { ...metadata, escalation_id: escalationId },
    }),
    recordCareLinkMissionTimelineAudit({
      missionId: input.missionId,
      caregiverId: input.caregiverId,
      actionType: input.actionType,
      eventType: `ops_escalation_${input.escalationType}`,
      previousMission: input.previousMission || null,
      nextMission: input.mission || null,
      outcome: 'ops_escalation_created',
      metadata: { ...metadata, escalation_id: escalationId },
    }),
    recordCareLinkDispatchSlaSnapshot({
      missionId: input.missionId,
      caregiverId: input.caregiverId,
      actionType: input.actionType,
      mission: input.mission || null,
      previousMission: input.previousMission || null,
      source: 'carelink_mobile_escalation',
      metadata: { ...metadata, escalation_id: escalationId },
    }),
  ])

  return { escalation, priority, escalationId }
}

export function shouldCreateCareLinkOperationalEscalation(actionType: string) {
  return ['delay_report', 'incident_report', 'request_replacement', 'decline'].includes(actionType)
}
