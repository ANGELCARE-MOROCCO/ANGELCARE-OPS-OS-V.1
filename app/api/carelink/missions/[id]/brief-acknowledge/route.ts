import { NextResponse } from 'next/server'
import { carelinkMobileErrorResponse, requireCareLinkMobileMissionAccess } from '@/lib/carelink/mobile-auth'
import { recordCareLinkAgentActivity, recordCareLinkMissionTimelineAudit } from '@/lib/carelink/mobile-audit-ledger'
import { createNotification, loadMissionBriefAcknowledgement, saveMissionBriefAcknowledgement } from '@/lib/carelink/mobile-persistence'

export const dynamic = 'force-dynamic'

type Body = {
  briefVersion?: string | null
  sections?: Record<string, unknown> | null
  briefSnapshot?: Record<string, unknown> | null
  parentInstructionsAcknowledged?: boolean
  serviceScopeAcknowledged?: boolean
  locationAcknowledged?: boolean
  emergencyAcknowledged?: boolean
  confidentialityAcknowledged?: boolean
  metadata?: Record<string, unknown> | null
}

function bool(value: unknown) {
  return value === true || String(value).toLowerCase() === 'true'
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const missionId = Number(id)
    const session = await requireCareLinkMobileMissionAccess(missionId, 'can_view_missions', request)
    const rows = await loadMissionBriefAcknowledgement(missionId, session.caregiverId)
    return NextResponse.json({ ok: true, data: rows })
  } catch (error) {
    return carelinkMobileErrorResponse(error, 'Mission brief acknowledgement load failed')
  }
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const missionId = Number(id)
    const session = await requireCareLinkMobileMissionAccess(missionId, 'can_accept_missions', request)
    const body = await request.json().catch(() => ({})) as Body

    const requiredFlags = {
      parentInstructionsAcknowledged: bool(body.parentInstructionsAcknowledged),
      serviceScopeAcknowledged: bool(body.serviceScopeAcknowledged),
      locationAcknowledged: bool(body.locationAcknowledged),
      emergencyAcknowledged: bool(body.emergencyAcknowledged),
      confidentialityAcknowledged: bool(body.confidentialityAcknowledged),
    }

    const missing = Object.entries(requiredFlags).filter(([, value]) => !value).map(([key]) => key)
    if (missing.length) {
      return NextResponse.json(
        { ok: false, error: 'All mission brief acknowledgement confirmations are required.', code: 'carelink_mission_brief_acknowledgement_incomplete', missing },
        { status: 400 },
      )
    }

    const acknowledgement = await saveMissionBriefAcknowledgement({
      missionId,
      caregiverId: session.caregiverId,
      briefVersion: body.briefVersion || 'carelink-mobile-brief-v1',
      sections: body.sections || {},
      briefSnapshot: body.briefSnapshot || {},
      ...requiredFlags,
      metadata: { source: 'carelink_mobile', ...(body.metadata || {}) },
    })

    await Promise.allSettled([
      createNotification({
        caregiverId: session.caregiverId,
        missionId,
        type: 'mission_brief_acknowledged',
        title: 'Brief mission reconnu',
        body: 'Consignes parent et brief mission confirmés depuis CareLink mobile.',
        priority: 'normal',
        linkedEntityType: 'mission',
        linkedEntityId: String(missionId),
        metadata: { acknowledgement_id: acknowledgement.id, brief_version: acknowledgement.briefVersion },
      }),
      recordCareLinkAgentActivity({
        caregiverId: session.caregiverId,
        userId: String(session.user?.id || ''),
        missionId,
        activityType: 'mission-brief-acknowledge',
        source: 'carelink_mobile',
        status: 'acknowledged',
        outcome: 'applied',
        priority: 'high',
        request,
        metadata: { acknowledgement_id: acknowledgement.id, brief_version: acknowledgement.briefVersion },
      }),
      recordCareLinkMissionTimelineAudit({
        missionId,
        caregiverId: session.caregiverId,
        actionType: 'mission-brief-acknowledge',
        eventType: 'mobile_mission_brief_acknowledged',
        previousMission: session.mission,
        nextMission: session.mission,
        outcome: 'applied',
        metadata: { acknowledgement_id: acknowledgement.id, brief_version: acknowledgement.briefVersion },
      }),
    ])

    return NextResponse.json({ ok: true, data: acknowledgement })
  } catch (error) {
    return carelinkMobileErrorResponse(error, 'Mission brief acknowledgement failed')
  }
}
