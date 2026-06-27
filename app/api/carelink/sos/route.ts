import { NextResponse } from 'next/server'
import { createAlert, createDispatchMessage, createNotification } from '@/lib/carelink/mobile-persistence'
import { createCareLinkOperationalEscalation } from '@/lib/carelink/mobile-operational-escalation'
import { carelinkMobileErrorResponse, requireCareLinkMobileAgent, requireCareLinkMobileMissionAccess } from '@/lib/carelink/mobile-auth'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({})) as Record<string, unknown>
    const missionId = body.missionId ? Number(body.missionId) : null
    const session = missionId && Number.isFinite(missionId)
      ? await requireCareLinkMobileMissionAccess(missionId, 'can_view_missions', request)
      : await requireCareLinkMobileAgent('can_view_missions', request)

    const emergencyType = String(body.emergencyType || body.emergency_type || 'sos')
    const note = String(body.note || `Alerte ${emergencyType} envoyée depuis CareLink mobile`)
    const priority = emergencyType === 'sos' ? 'critical' : 'high'

    const alert = await createAlert({
      type: `mobile_${emergencyType}`,
      title: emergencyType === 'sos' ? 'SOS agent CareLink' : 'Alerte sécurité agent',
      body: note,
      priority,
      missionId,
      caregiverId: session.caregiverId,
      linkedEntityType: missionId ? 'mission' : 'caregiver',
      linkedEntityId: String(missionId || session.caregiverId),
      metadata: { emergency_type: emergencyType, source: body.source || 'carelink_mobile_safety_enterprise', device: session.deviceContext || null },
    })

    await createNotification({
      type: `mobile_${emergencyType}`,
      title: emergencyType === 'sos' ? 'SOS agent reçu' : 'Alerte sécurité reçue',
      body: note,
      priority,
      missionId,
      caregiverId: session.caregiverId,
      linkedEntityType: missionId ? 'mission' : 'caregiver',
      linkedEntityId: String(missionId || session.caregiverId),
      metadata: { alert_id: alert?.id || null, emergency_type: emergencyType },
    }).catch(() => null)

    await createDispatchMessage({
      missionId,
      caregiverId: session.caregiverId,
      senderType: 'agent',
      senderId: String(session.user.id || session.caregiverId),
      recipientType: 'dispatch_supervisor',
      subject: emergencyType === 'sos' ? 'SOS CareLink Mobile' : 'Alerte sécurité CareLink Mobile',
      body: note,
      priority,
      status: 'sent',
      threadKey: missionId ? `mission:${missionId}` : `caregiver:${session.caregiverId}:safety`,
      metadata: { alert_id: alert?.id || null, emergency_type: emergencyType },
    }).catch(() => null)

    if (missionId && Number.isFinite(missionId)) {
      await createCareLinkOperationalEscalation({
        missionId,
        caregiverId: session.caregiverId,
        actionType: 'mobile_safety_alert',
        escalationType: emergencyType === 'replacement' ? 'replacement_requested' : 'mobile_safety_alert',
        severity: priority,
        title: emergencyType === 'sos' ? 'SOS agent CareLink' : 'Alerte sécurité agent',
        body: note,
        request,
        metadata: { alert_id: alert?.id || null, emergency_type: emergencyType },
      }).catch(() => null)
    }

    return NextResponse.json({ ok: true, data: { alert, emergencyType, missionId } })
  } catch (error) {
    return carelinkMobileErrorResponse(error, 'CareLink SOS request failed')
  }
}
