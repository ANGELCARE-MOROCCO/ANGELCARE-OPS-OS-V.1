import { CareLinkMobileAccessError, requireCareLinkMobileMissionAccess } from '@/lib/carelink/mobile-auth'
import { beginCareLinkMobileAction, completeCareLinkMobileAction, failCareLinkMobileAction } from '@/lib/carelink/mobile-action-idempotency'
import { createAlert, createNotification, missionBriefAcknowledgementIsComplete } from '@/lib/carelink/mobile-persistence'
import { patchMission } from '@/lib/missions/repository'
import { recordMissionEvent } from '@/lib/missions/events'
import { recordCareLinkAgentActivity, recordCareLinkDispatchSlaSnapshot, recordCareLinkMissionTimelineAudit } from '@/lib/carelink/mobile-audit-ledger'
import { createCareLinkOperationalEscalation, shouldCreateCareLinkOperationalEscalation } from '@/lib/carelink/mobile-operational-escalation'

type AnyRow = Record<string, any>

type CareLinkMobileCapability = 'can_view_missions' | 'can_accept_missions' | 'can_submit_reports' | 'can_view_payments'

export type CareLinkMobileMissionAction =
  | 'accept'
  | 'decline'
  | 'confirm_readiness'
  | 'en_route'
  | 'arrive'
  | 'check_in'
  | 'start'
  | 'report_submit'
  | 'complete'
  | 'delay_report'
  | 'incident_report'
  | 'request_replacement'

export type CareLinkMobileActionBody = {
  note?: string | null
  summary?: string | null
  severity?: string | null
  minutes?: number | null
  idempotencyKey?: string | null
  offlineActionId?: string | null
  metadata?: Record<string, unknown> | null
  details?: Record<string, unknown> | null
  [key: string]: unknown
}

type ActionConfig = {
  capability: CareLinkMobileCapability
  status?: string
  lifecycleStage?: string
  eventType: string
  eventContent: string
  title: string
  priority: 'low' | 'normal' | 'high' | 'critical'
  targetRank?: number
  allowAfterStarted?: boolean
  alertType?: string
  notificationType?: string
  buildPatch?: (args: { now: string; body: CareLinkMobileActionBody; mission: AnyRow }) => Record<string, unknown>
}

const TERMINAL_STATES = new Set(['completed', 'closed', 'validated', 'cancelled', 'canceled', 'deleted', 'archived'])

const STAGE_RANK: Record<string, number> = {
  draft: 0,
  created: 0,
  new_request: 0,
  intake: 0,
  planned: 1,
  scheduled: 1,
  assigned: 1,
  agent_notified: 1,
  notified: 1,
  proposed: 1,
  agent_accepted: 2,
  accepted: 2,
  confirmed: 2,
  readiness_confirmed: 2,
  caregiver_confirmed: 2,
  family_confirmed: 2,
  en_route: 3,
  arrival_confirmed: 4,
  arrived: 4,
  checked_in: 5,
  check_in: 5,
  mission_started: 6,
  started: 6,
  in_progress: 6,
  report_submitted: 7,
  final_report_submitted: 7,
  field_report_pending: 7,
  completed: 8,
  closed: 8,
  validated: 8,
}

const ACTIONS: Record<CareLinkMobileMissionAction, ActionConfig> = {
  accept: {
    capability: 'can_accept_missions',
    status: 'agent_accepted',
    lifecycleStage: 'agent_accepted',
    eventType: 'mobile_accept',
    eventContent: 'Mission acceptée depuis CareLink mobile',
    title: 'Mission acceptée',
    priority: 'high',
    targetRank: 2,
    buildPatch: ({ now }) => ({ readiness_status: 'pending', confirmed_at: now }),
  },
  decline: {
    capability: 'can_accept_missions',
    status: 'agent_declined',
    lifecycleStage: 'agent_declined',
    eventType: 'mobile_decline',
    eventContent: 'Mission refusée depuis CareLink mobile',
    title: 'Mission refusée',
    priority: 'high',
    targetRank: 2,
    alertType: 'mission_declined',
    buildPatch: ({ body }) => ({ readiness_status: 'blocked', risk_level: 'elevated', ops_notes: body.note || 'Mission refusée par l’agent mobile' }),
  },
  confirm_readiness: {
    capability: 'can_accept_missions',
    status: 'confirmed',
    lifecycleStage: 'readiness_confirmed',
    eventType: 'mobile_readiness_confirmed',
    eventContent: 'Readiness confirmée depuis CareLink mobile',
    title: 'Readiness confirmée',
    priority: 'normal',
    targetRank: 2,
    buildPatch: ({ now }) => ({ readiness_status: 'ready', confirmed_at: now }),
  },
  en_route: {
    capability: 'can_accept_missions',
    status: 'en_route',
    lifecycleStage: 'en_route',
    eventType: 'mobile_en_route',
    eventContent: 'Départ en route depuis CareLink mobile',
    title: 'En route',
    priority: 'normal',
    targetRank: 3,
  },
  arrive: {
    capability: 'can_accept_missions',
    status: 'arrival_confirmed',
    lifecycleStage: 'arrival_confirmed',
    eventType: 'mobile_arrival_confirmed',
    eventContent: 'Arrivée confirmée depuis CareLink mobile',
    title: 'Arrivée confirmée',
    priority: 'normal',
    targetRank: 4,
    buildPatch: ({ now }) => ({ confirmed_at: now, arrival_confirmed_at: now }),
  },
  check_in: {
    capability: 'can_accept_missions',
    status: 'checked_in',
    lifecycleStage: 'checked_in',
    eventType: 'mobile_check_in',
    eventContent: 'Check-in confirmé depuis CareLink mobile',
    title: 'Check-in confirmé',
    priority: 'normal',
    targetRank: 5,
    buildPatch: ({ now }) => ({ checked_in_at: now }),
  },
  start: {
    capability: 'can_accept_missions',
    status: 'mission_started',
    lifecycleStage: 'mission_started',
    eventType: 'mobile_started',
    eventContent: 'Mission démarrée depuis CareLink mobile',
    title: 'Mission démarrée',
    priority: 'normal',
    targetRank: 6,
    buildPatch: ({ now }) => ({ started_at: now }),
  },
  report_submit: {
    capability: 'can_submit_reports',
    status: 'report_submitted',
    lifecycleStage: 'report_submitted',
    eventType: 'mobile_report_submitted',
    eventContent: 'Rapport mission soumis depuis CareLink mobile',
    title: 'Rapport soumis',
    priority: 'high',
    targetRank: 7,
    buildPatch: ({ now }) => ({ report_status: 'submitted', validation_status: 'ready', report_submitted_at: now }),
  },
  complete: {
    capability: 'can_submit_reports',
    status: 'completed',
    lifecycleStage: 'completed',
    eventType: 'mobile_completed',
    eventContent: 'Mission terminée depuis CareLink mobile',
    title: 'Mission terminée',
    priority: 'high',
    targetRank: 8,
    buildPatch: ({ now }) => ({ completed_at: now }),
  },
  delay_report: {
    capability: 'can_accept_missions',
    eventType: 'mobile_delay_reported',
    eventContent: 'Retard signalé depuis CareLink mobile',
    title: 'Retard signalé',
    priority: 'high',
    allowAfterStarted: true,
    alertType: 'mission_delay',
    buildPatch: ({ now, body }) => ({
      risk_level: 'elevated',
      delay_reported_at: now,
      ops_notes: body.note || 'Retard déclaré depuis CareLink mobile',
    }),
  },
  incident_report: {
    capability: 'can_submit_reports',
    status: 'incident',
    lifecycleStage: 'incident',
    eventType: 'mobile_incident_reported',
    eventContent: 'Incident signalé depuis CareLink mobile',
    title: 'Incident signalé',
    priority: 'critical',
    allowAfterStarted: true,
    alertType: 'incident',
    buildPatch: ({ now, body }) => ({ risk_level: body.severity || 'critical', incident_at: now }),
  },
  request_replacement: {
    capability: 'can_accept_missions',
    eventType: 'mobile_replacement_requested',
    eventContent: 'Demande de remplacement envoyée depuis CareLink mobile',
    title: 'Remplacement demandé',
    priority: 'high',
    allowAfterStarted: true,
    alertType: 'replacement_requested',
    buildPatch: ({ now, body }) => ({
      risk_level: 'elevated',
      replacement_requested_at: now,
      ops_notes: body.note || 'Demande de remplacement depuis CareLink mobile',
    }),
  },
}

function cleanString(value: unknown) {
  return String(value || '').trim()
}

function normalizeState(value: unknown) {
  return cleanString(value).toLowerCase()
}

function currentStage(mission: AnyRow) {
  return normalizeState(mission.lifecycle_stage || mission.status || mission.dossier_status || 'created')
}

function stateRank(state: string) {
  if (STAGE_RANK[state] !== undefined) return STAGE_RANK[state]
  if (state.includes('complete') || state.includes('closed') || state.includes('validated')) return 8
  if (state.includes('report')) return 7
  if (state.includes('progress') || state.includes('start')) return 6
  if (state.includes('check')) return 5
  if (state.includes('arrival') || state.includes('arriv')) return 4
  if (state.includes('route') || state.includes('travel')) return 3
  if (state.includes('accept') || state.includes('confirm')) return 2
  if (state.includes('assign') || state.includes('notify')) return 1
  return 0
}

function isTerminalState(state: string) {
  if (TERMINAL_STATES.has(state)) return true
  return ['deleted', 'archived', 'cancel', 'complete', 'closed'].some((item) => state.includes(item))
}

function actionKey(action: CareLinkMobileMissionAction) {
  return action.replace(/_/g, '-')
}

function resolveIdempotencyKey(request: Request, body: CareLinkMobileActionBody) {
  return cleanString(
    request.headers.get('Idempotency-Key') ||
    request.headers.get('X-Idempotency-Key') ||
    request.headers.get('x-carelink-idempotency-key') ||
    body.idempotencyKey ||
    body.offlineActionId ||
    body.offline_action_id ||
    '',
  ) || null
}

function duplicatePayload(existing: AnyRow | null, action: CareLinkMobileMissionAction) {
  const response = existing?.response_payload && typeof existing.response_payload === 'object' ? existing.response_payload : null
  return {
    duplicate: true,
    idempotent: true,
    action,
    data: response?.data || response || null,
  }
}

function assertActionCanRun(action: CareLinkMobileMissionAction, mission: AnyRow, config: ActionConfig) {
  const stage = currentStage(mission)
  const status = normalizeState(mission.status)
  if (isTerminalState(stage) || isTerminalState(status)) {
    if (action === 'complete' && (stage.includes('complete') || status.includes('complete'))) return 'already_applied' as const
    throw new CareLinkMobileAccessError('This mission is already closed and cannot receive this mobile action.', 409, 'carelink_mobile_mission_closed', { action, stage, status })
  }

  if (!config.targetRank) return 'allowed' as const

  const rank = Math.max(stateRank(stage), stateRank(status))
  if (rank > config.targetRank) return 'late_noop' as const

  const requiredPreviousRank = Math.max(config.targetRank - 1, 0)
  if (rank < requiredPreviousRank && !config.allowAfterStarted) {
    throw new CareLinkMobileAccessError('This CareLink mobile action is not allowed at the current mission stage.', 409, 'carelink_mobile_transition_blocked', {
      action,
      stage,
      status,
      currentRank: rank,
      requiredPreviousRank,
    })
  }

  return 'allowed' as const
}

function notificationBody(action: CareLinkMobileMissionAction, missionId: number, body: CareLinkMobileActionBody) {
  if (body.note) return body.note
  if (body.summary) return body.summary
  if (action === 'delay_report' && body.minutes) return `Retard déclaré: ${body.minutes} minute(s).`
  return `Action mobile CareLink enregistrée pour la mission ${String(missionId)}.`
}

export async function executeCareLinkMobileMissionAction(args: {
  request: Request
  missionId: number
  action: CareLinkMobileMissionAction
  body?: CareLinkMobileActionBody
}) {
  const config = ACTIONS[args.action]
  if (!config) throw new CareLinkMobileAccessError('Unsupported CareLink mobile mission action.', 400, 'carelink_mobile_action_unknown', { action: args.action })

  const body = args.body || {}
  const missionId = Number(args.missionId)
  const session = await requireCareLinkMobileMissionAccess(missionId, config.capability, args.request)
  const idempotencyKey = resolveIdempotencyKey(args.request, body)
  const started = await beginCareLinkMobileAction({
    missionId,
    caregiverId: session.caregiverId,
    actionType: actionKey(args.action),
    idempotencyKey,
    payload: { action: args.action, ...body },
  })

  if (started.duplicate) return duplicatePayload(started.existing, args.action)

  try {
    const previousMission = { ...session.mission }
    if (args.action === 'start') {
      const briefReady = await missionBriefAcknowledgementIsComplete(missionId, session.caregiverId)
      if (!briefReady) {
        throw new CareLinkMobileAccessError(
          'Mission brief and parent instructions must be acknowledged before starting the mission.',
          409,
          'carelink_mission_brief_acknowledgement_required',
          { missionId, caregiverId: session.caregiverId },
        )
      }
    }
    const outcome = assertActionCanRun(args.action, session.mission, config)
    if (outcome === 'late_noop' || outcome === 'already_applied') {
      await Promise.allSettled([
        recordMissionEvent({
          missionId,
          eventType: `mobile_${args.action}_${outcome}`,
          content: body.note || `Action ${args.action} ignorée car la mission est déjà à une étape plus avancée.`,
          metadata: { action: args.action, current_status: session.mission.status, current_lifecycle_stage: session.mission.lifecycle_stage, outcome },
          source: 'carelink_mobile',
        }),
        recordCareLinkAgentActivity({
          caregiverId: session.caregiverId,
          userId: String(session.user?.id || ''),
          missionId,
          activityType: actionKey(args.action),
          source: 'carelink_mobile',
          status: String(session.mission.status || ''),
          outcome,
          priority: config.priority,
          request: args.request,
          metadata: { action: args.action, lifecycle_stage: session.mission.lifecycle_stage || null },
        }),
        recordCareLinkMissionTimelineAudit({
          missionId,
          caregiverId: session.caregiverId,
          actionType: actionKey(args.action),
          eventType: `mobile_${args.action}_${outcome}`,
          previousMission,
          nextMission: session.mission,
          outcome,
          metadata: { idempotency_key: idempotencyKey || null },
        }),
        recordCareLinkDispatchSlaSnapshot({
          missionId,
          caregiverId: session.caregiverId,
          actionType: actionKey(args.action),
          mission: session.mission,
          previousMission,
          metadata: { outcome },
        }),
      ])
      const responsePayload = { action: args.action, data: session.mission, idempotent: true, outcome }
      await completeCareLinkMobileAction({ idempotencyKey, responsePayload })
      return responsePayload
    }

    const now = new Date().toISOString()
    const patch: Record<string, unknown> = {
      updated_at: now,
      last_mobile_action: args.action,
      last_mobile_action_at: now,
      ...(config.status ? { status: config.status } : {}),
      ...(config.lifecycleStage ? { lifecycle_stage: config.lifecycleStage } : {}),
      ...(config.buildPatch ? config.buildPatch({ now, body, mission: session.mission }) : {}),
    }

    const mission = await patchMission(missionId, patch)
    const content = body.note || config.eventContent
    const metadata = {
      action: args.action,
      caregiver_id: session.caregiverId,
      status: mission.status,
      lifecycle_stage: mission.lifecycle_stage,
      minutes: body.minutes || null,
      severity: body.severity || null,
      ...(body.metadata || {}),
      ...(body.details || {}),
    }

    await recordMissionEvent({ missionId, eventType: config.eventType, content, metadata, source: 'carelink_mobile' })
    await Promise.allSettled([
      createNotification({
        type: config.notificationType || 'mission_update',
        title: config.title,
        body: notificationBody(args.action, missionId, body),
        priority: config.priority,
        missionId,
        caregiverId: session.caregiverId,
        linkedEntityType: 'mission',
        linkedEntityId: String(missionId),
        metadata,
      }),
      config.alertType && !shouldCreateCareLinkOperationalEscalation(args.action)
        ? createAlert({
            type: config.alertType,
            title: config.title,
            body: notificationBody(args.action, missionId, body),
            priority: config.priority,
            missionId,
            caregiverId: session.caregiverId,
            linkedEntityType: 'mission',
            linkedEntityId: String(missionId),
            metadata,
          })
        : Promise.resolve(null),
      shouldCreateCareLinkOperationalEscalation(args.action)
        ? createCareLinkOperationalEscalation({
            missionId,
            caregiverId: session.caregiverId,
            userId: String(session.user?.id || ''),
            actionType: actionKey(args.action),
            escalationType: config.alertType || args.action,
            title: config.title,
            body: notificationBody(args.action, missionId, body),
            priority: config.priority,
            severity: body.severity ? String(body.severity) : null,
            minutes: typeof body.minutes === 'number' ? body.minutes : null,
            mission,
            previousMission,
            request: args.request,
            metadata,
          })
        : Promise.resolve(null),
      recordCareLinkAgentActivity({
        caregiverId: session.caregiverId,
        userId: String(session.user?.id || ''),
        missionId,
        activityType: actionKey(args.action),
        source: 'carelink_mobile',
        status: String(mission.status || ''),
        outcome: 'applied',
        priority: config.priority,
        request: args.request,
        metadata,
      }),
      recordCareLinkMissionTimelineAudit({
        missionId,
        caregiverId: session.caregiverId,
        actionType: actionKey(args.action),
        eventType: config.eventType,
        previousMission,
        nextMission: mission,
        outcome: 'applied',
        metadata: { ...metadata, idempotency_key: idempotencyKey || null },
      }),
      recordCareLinkDispatchSlaSnapshot({
        missionId,
        caregiverId: session.caregiverId,
        actionType: actionKey(args.action),
        mission,
        previousMission,
        metadata: { action: args.action },
      }),
    ])

    const responsePayload = { action: args.action, data: mission, idempotent: Boolean(idempotencyKey), outcome: 'applied' }
    await completeCareLinkMobileAction({ idempotencyKey, responsePayload })
    return responsePayload
  } catch (error) {
    await failCareLinkMobileAction({ idempotencyKey, error })
    throw error
  }
}

export async function parseCareLinkMobileActionBody(request: Request): Promise<CareLinkMobileActionBody> {
  return request.json().catch(() => ({})) as Promise<CareLinkMobileActionBody>
}
