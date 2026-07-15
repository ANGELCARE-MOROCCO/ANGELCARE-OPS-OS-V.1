import { NextResponse } from 'next/server'
import { carelinkMobileErrorResponse, requireCareLinkMobileMissionAccess } from '@/lib/carelink/mobile-auth'
import { recordCareLinkAgentActivity, recordCareLinkDispatchSlaSnapshot, recordCareLinkMissionTimelineAudit } from '@/lib/carelink/mobile-audit-ledger'
import { createAlert, createDispatchMessage, createNotification, loadMissionRouteExecutionLogs, saveMissionRouteExecutionLog } from '@/lib/carelink/mobile-persistence'

export const dynamic = 'force-dynamic'

type Body = {
  routeId?: string | null
  routeCode?: string | null
  action?: string | null
  status?: string | null
  transportMode?: string | null
  eta?: string | null
  locationSnapshot?: Record<string, unknown> | null
  routeSnapshot?: Record<string, unknown> | null
  allowanceClaim?: Record<string, unknown> | null
  notes?: string | null
  issueSeverity?: string | null
  metadata?: Record<string, unknown> | null
}

function clean(value: unknown, fallback = '') {
  const text = String(value || '').trim()
  return text || fallback
}

function normalizeRouteAction(value: unknown) {
  const action = clean(value, 'route_update').toLowerCase().replaceAll(' ', '_')
  if (['departure_confirmed', 'eta_updated', 'delay_reported', 'issue_reported', 'route_completed', 'allowance_claimed', 'location_shared', 'route_update'].includes(action)) return action
  return 'route_update'
}

function isEscalationAction(action: string) {
  return ['delay_reported', 'issue_reported'].includes(action)
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const missionId = Number(id)
    const session = await requireCareLinkMobileMissionAccess(missionId, 'can_view_missions', request)
    const logs = await loadMissionRouteExecutionLogs(missionId, session.caregiverId)
    return NextResponse.json({ ok: true, data: logs })
  } catch (error) {
    return carelinkMobileErrorResponse(error, 'Route execution load failed')
  }
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const missionId = Number(id)
    const session = await requireCareLinkMobileMissionAccess(missionId, 'can_accept_missions', request)
    const body = await request.json().catch(() => ({})) as Body
    const action = normalizeRouteAction(body.action)
    const issueSeverity = body.issueSeverity ? clean(body.issueSeverity, 'medium') : null

    const log = await saveMissionRouteExecutionLog({
      missionId,
      caregiverId: session.caregiverId,
      routeId: body.routeId || 'primary-route',
      routeCode: body.routeCode || null,
      action,
      status: body.status || (action === 'route_completed' ? 'completed' : 'recorded'),
      transportMode: body.transportMode || null,
      eta: body.eta || null,
      locationSnapshot: body.locationSnapshot || {},
      routeSnapshot: body.routeSnapshot || {},
      allowanceClaim: body.allowanceClaim || {},
      notes: body.notes || null,
      issueSeverity,
      metadata: { source: 'carelink_mobile', ...(body.metadata || {}) },
    })

    await Promise.allSettled([
      recordCareLinkAgentActivity({
        caregiverId: session.caregiverId,
        userId: String(session.user?.id || ''),
        missionId,
        activityType: 'route-transport-execution',
        source: 'carelink_mobile',
        status: action,
        outcome: isEscalationAction(action) ? 'attention_required' : 'recorded',
        priority: isEscalationAction(action) ? 'high' : 'normal',
        request,
        metadata: { route_execution_log_id: log.id, route_id: log.routeId, route_code: log.routeCode, eta: log.eta, issue_severity: issueSeverity },
      }),
      recordCareLinkMissionTimelineAudit({
        missionId,
        caregiverId: session.caregiverId,
        actionType: 'route-transport-execution',
        eventType: `mobile_route_${action}`,
        previousMission: session.mission,
        nextMission: session.mission,
        outcome: action,
        metadata: { route_execution_log_id: log.id, route_id: log.routeId, route_code: log.routeCode, eta: log.eta, issue_severity: issueSeverity },
      }),
      recordCareLinkDispatchSlaSnapshot({
        missionId,
        caregiverId: session.caregiverId,
        actionType: isEscalationAction(action) ? 'route_escalation' : 'route_execution',
        mission: session.mission,
        previousMission: session.mission,
        source: 'carelink_mobile',
        metadata: { route_execution_log_id: log.id, route_id: log.routeId, eta: log.eta, route_action: action, severity: isEscalationAction(action) ? 'high' : 'normal' },
      }),
    ])

    if (isEscalationAction(action)) {
      await Promise.allSettled([
        createAlert({
          caregiverId: session.caregiverId,
          missionId,
          type: action === 'delay_reported' ? 'route_delay_reported' : 'route_issue_reported',
          title: action === 'delay_reported' ? 'Retard trajet signalé' : 'Incident trajet signalé',
          body: body.notes || body.eta || 'Signalement trajet depuis CareLink mobile.',
          priority: issueSeverity === 'critical' ? 'critical' : 'high',
          linkedEntityType: 'mission_route',
          linkedEntityId: log.routeId,
          metadata: { route_execution_log_id: log.id, route_code: log.routeCode, issue_severity: issueSeverity },
        }),
        createDispatchMessage({
          missionId,
          caregiverId: session.caregiverId,
          threadKey: `mission:${missionId}`,
          senderType: 'agent',
          recipientType: 'liaison_operationnelle',
          subject: action === 'delay_reported' ? 'Retard trajet agent' : 'Incident trajet agent',
          body: body.notes || body.eta || 'Signalement trajet depuis CareLink mobile.',
          priority: issueSeverity === 'critical' ? 'critical' : 'high',
          metadata: { route_execution_log_id: log.id, route_id: log.routeId, route_code: log.routeCode, eta: log.eta },
        }),
      ])
    } else {
      await createNotification({
        caregiverId: session.caregiverId,
        missionId,
        type: 'route_execution_updated',
        title: 'Trajet mission mis à jour',
        body: action.replaceAll('_', ' '),
        priority: 'normal',
        linkedEntityType: 'mission_route',
        linkedEntityId: log.routeId,
        metadata: { route_execution_log_id: log.id, route_code: log.routeCode, action },
      })
    }

    return NextResponse.json({ ok: true, data: log })
  } catch (error) {
    return carelinkMobileErrorResponse(error, 'Route execution update failed')
  }
}
