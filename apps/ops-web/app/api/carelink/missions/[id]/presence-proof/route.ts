import { NextResponse } from 'next/server'
import { carelinkMobileErrorResponse, requireCareLinkMobileMissionAccess } from '@/lib/carelink/mobile-auth'
import { recordCareLinkAgentActivity, recordCareLinkDispatchSlaSnapshot, recordCareLinkMissionTimelineAudit } from '@/lib/carelink/mobile-audit-ledger'
import { createAlert, createDispatchMessage, createNotification, loadMissionPresenceProofs, saveMissionPresenceProof } from '@/lib/carelink/mobile-persistence'

export const dynamic = 'force-dynamic'

type Body = {
  action?: string | null
  status?: string | null
  proofType?: string | null
  occurredAt?: string | null
  locationSnapshot?: Record<string, unknown> | null
  deviceSnapshot?: Record<string, unknown> | null
  reason?: string | null
  note?: string | null
  riskFlag?: string | null
  metadata?: Record<string, unknown> | null
}

function clean(value: unknown, fallback = '') {
  const text = String(value || '').trim()
  return text || fallback
}

function normalizePresenceAction(value: unknown) {
  const action = clean(value, 'presence_update').toLowerCase().replaceAll(' ', '_')
  if ([
    'day_started',
    'day_ended',
    'mission_check_in',
    'mission_check_out',
    'pause_started',
    'pause_resumed',
    'late_reason',
    'early_departure_reason',
    'presence_update',
    'location_proof',
  ].includes(action)) return action
  return 'presence_update'
}

function riskFromAction(action: string, body: Body) {
  if (body.riskFlag) return clean(body.riskFlag, 'attention_required')
  if (action === 'late_reason') return 'late_arrival'
  if (action === 'early_departure_reason') return 'early_departure'
  return null
}

function shouldEscalate(action: string, riskFlag: string | null) {
  return Boolean(riskFlag) || ['late_reason', 'early_departure_reason'].includes(action)
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const missionId = Number(id)
    const session = await requireCareLinkMobileMissionAccess(missionId, 'can_view_missions', request)
    const data = await loadMissionPresenceProofs(missionId, session.caregiverId)
    return NextResponse.json({ ok: true, data })
  } catch (error) {
    return carelinkMobileErrorResponse(error, 'Presence proof load failed')
  }
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const missionId = Number(id)
    const session = await requireCareLinkMobileMissionAccess(missionId, 'can_accept_missions', request)
    const body = await request.json().catch(() => ({})) as Body
    const action = normalizePresenceAction(body.action)
    const riskFlag = riskFromAction(action, body)

    const proof = await saveMissionPresenceProof({
      missionId,
      caregiverId: session.caregiverId,
      authUserId: String(session.user?.id || ''),
      action,
      status: body.status || 'recorded',
      proofType: body.proofType || 'timestamp',
      occurredAt: body.occurredAt || null,
      locationSnapshot: body.locationSnapshot || {},
      deviceSnapshot: body.deviceSnapshot || session.deviceContext || {},
      reason: body.reason || null,
      note: body.note || null,
      riskFlag,
      metadata: { source: 'carelink_mobile_p13', missionCode: session.mission?.code || null, ...(body.metadata || {}) },
    })

    await Promise.allSettled([
      recordCareLinkAgentActivity({
        caregiverId: session.caregiverId,
        userId: String(session.user?.id || ''),
        missionId,
        activityType: 'attendance-presence-proof',
        source: 'carelink_mobile',
        status: action,
        outcome: shouldEscalate(action, riskFlag) ? 'attention_required' : 'recorded',
        priority: shouldEscalate(action, riskFlag) ? 'high' : 'normal',
        request,
        metadata: { presence_proof_id: proof.id, action, risk_flag: riskFlag },
      }),
      recordCareLinkMissionTimelineAudit({
        missionId,
        caregiverId: session.caregiverId,
        actionType: 'attendance-presence-proof',
        eventType: `mobile_presence_${action}`,
        previousMission: session.mission,
        nextMission: session.mission,
        outcome: action,
        metadata: { presence_proof_id: proof.id, risk_flag: riskFlag, proof_type: proof.proofType },
      }),
      recordCareLinkDispatchSlaSnapshot({
        missionId,
        caregiverId: session.caregiverId,
        actionType: shouldEscalate(action, riskFlag) ? 'presence_exception' : 'presence_proof',
        mission: session.mission,
        previousMission: session.mission,
        source: 'carelink_mobile',
        metadata: { presence_proof_id: proof.id, action, risk_flag: riskFlag },
      }),
    ])

    if (shouldEscalate(action, riskFlag)) {
      await Promise.allSettled([
        createAlert({
          caregiverId: session.caregiverId,
          missionId,
          type: action === 'late_reason' ? 'late_arrival_reason' : action === 'early_departure_reason' ? 'early_departure_reason' : 'presence_exception',
          title: action === 'late_reason' ? 'Retard présence signalé' : action === 'early_departure_reason' ? 'Départ anticipé signalé' : 'Exception présence terrain',
          body: body.reason || body.note || 'Exception présence depuis CareLink mobile.',
          priority: 'high',
          linkedEntityType: 'mission_presence_proof',
          linkedEntityId: proof.id,
          metadata: { presence_proof_id: proof.id, risk_flag: riskFlag },
        }),
        createDispatchMessage({
          missionId,
          caregiverId: session.caregiverId,
          threadKey: `mission:${missionId}`,
          senderType: 'agent',
          recipientType: 'liaison_operationnelle',
          subject: 'Présence terrain · attention requise',
          body: body.reason || body.note || 'Exception présence depuis CareLink mobile.',
          priority: 'high',
          metadata: { presence_proof_id: proof.id, action, risk_flag: riskFlag },
        }),
      ])
    } else {
      await createNotification({
        caregiverId: session.caregiverId,
        missionId,
        type: 'presence_proof_recorded',
        title: 'Présence mission enregistrée',
        body: action.replaceAll('_', ' '),
        priority: 'normal',
        linkedEntityType: 'mission_presence_proof',
        linkedEntityId: proof.id,
        metadata: { presence_proof_id: proof.id, action },
      })
    }

    return NextResponse.json({ ok: true, data: proof })
  } catch (error) {
    return carelinkMobileErrorResponse(error, 'Presence proof update failed')
  }
}
