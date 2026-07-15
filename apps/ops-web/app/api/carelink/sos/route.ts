import { NextResponse } from 'next/server'
import { createAlert, createDispatchMessage, createNotification, saveMobileSosEvent } from '@/lib/carelink/mobile-persistence'
import { recordCareLinkAgentActivity, recordCareLinkDispatchSlaSnapshot, recordCareLinkMissionTimelineAudit } from '@/lib/carelink/mobile-audit-ledger'
import { createCareLinkOperationalEscalation } from '@/lib/carelink/mobile-operational-escalation'
import { carelinkMobileErrorResponse, requireCareLinkMobileAgent, requireCareLinkMobileMissionAccess } from '@/lib/carelink/mobile-auth'

export const dynamic = 'force-dynamic'

function clean(value: unknown, fallback = '') {
  const text = String(value || '').trim()
  return text || fallback
}

function normalizeEmergencyType(value: unknown) {
  const raw = clean(value, 'sos').toLowerCase().replaceAll(' ', '_')
  if (['sos', 'incident', 'child_health', 'family_conflict', 'replacement', 'callback', 'lost_phone', 'transport_risk', 'location_share'].includes(raw)) return raw
  return 'sos'
}

function severityForEmergency(type: string, value: unknown) {
  const requested = clean(value, '').toLowerCase()
  if (['low', 'normal', 'high', 'critical'].includes(requested)) return requested
  if (type === 'sos' || type === 'child_health') return 'critical'
  if (['incident', 'family_conflict', 'replacement', 'transport_risk'].includes(type)) return 'high'
  return 'normal'
}

function titleForEmergency(type: string) {
  const titles: Record<string, string> = {
    sos: 'SOS agent CareLink',
    incident: 'Incident terrain agent',
    child_health: 'Alerte santé enfant',
    family_conflict: 'Conflit / tension famille',
    replacement: 'Remplacement urgent demandé',
    callback: 'Rappel superviseur demandé',
    lost_phone: 'Téléphone agent perdu',
    transport_risk: 'Risque transport agent',
    location_share: 'Localisation agent partagée',
  }
  return titles[type] || 'Alerte sécurité agent'
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({})) as Record<string, unknown>
    const missionId = body.missionId ? Number(body.missionId) : null
    const session = missionId && Number.isFinite(missionId)
      ? await requireCareLinkMobileMissionAccess(missionId, 'can_view_missions', request)
      : await requireCareLinkMobileAgent('can_view_missions', request)

    const emergencyType = normalizeEmergencyType(body.emergencyType || body.emergency_type)
    const severity = severityForEmergency(emergencyType, body.severity)
    const priority = severity === 'critical' ? 'critical' : severity === 'high' ? 'high' : 'normal'
    const note = clean(body.note, `Alerte ${emergencyType} envoyée depuis CareLink mobile`)
    const callbackRequested = Boolean(body.callbackRequested || body.callback_requested || emergencyType === 'callback' || emergencyType === 'sos')
    const replacementRequested = Boolean(body.replacementRequested || body.replacement_requested || emergencyType === 'replacement')
    const locationSnapshot = body.locationSnapshot && typeof body.locationSnapshot === 'object' ? body.locationSnapshot as Record<string, unknown> : {}
    const deviceSnapshot = session.deviceContext || {}

    const alert = await createAlert({
      type: `mobile_${emergencyType}`,
      title: titleForEmergency(emergencyType),
      body: note,
      priority,
      missionId,
      caregiverId: session.caregiverId,
      linkedEntityType: missionId ? 'mission' : 'caregiver',
      linkedEntityId: String(missionId || session.caregiverId),
      metadata: {
        emergency_type: emergencyType,
        severity,
        callback_requested: callbackRequested,
        replacement_requested: replacementRequested,
        source: body.source || 'carelink_mobile_p18_sos_incident',
        location: locationSnapshot,
        device: deviceSnapshot,
      },
    })

    const threadKey = missionId ? `mission:${missionId}:safety` : `caregiver:${session.caregiverId}:safety`
    const sosEvent = await saveMobileSosEvent({
      caregiverId: session.caregiverId,
      missionId,
      authUserId: String(session.user?.id || ''),
      emergencyType,
      severity,
      status: 'open',
      note,
      callbackRequested,
      replacementRequested,
      locationSnapshot,
      deviceSnapshot,
      alertId: alert?.id ? String(alert.id) : null,
      dispatchThreadKey: threadKey,
      metadata: { source: 'carelink_mobile_p18_sos_incident', alert_id: alert?.id || null, ...(body.metadata && typeof body.metadata === 'object' ? body.metadata as Record<string, unknown> : {}) },
    })

    if (!sosEvent) {
      throw new Error('CareLink SOS event was not persisted')
    }

    const missionAuditJobs = missionId ? [
      recordCareLinkMissionTimelineAudit({
        missionId,
        caregiverId: session.caregiverId,
        actionType: 'sos-incident-real-time-escalation',
        eventType: `mobile_sos_${emergencyType}`,
        previousMission: null,
        nextMission: null,
        outcome: 'open',
        metadata: { sos_event_id: sosEvent.id, alert_id: alert?.id || null, emergency_type: emergencyType, severity },
      }),
      recordCareLinkDispatchSlaSnapshot({
        missionId,
        caregiverId: session.caregiverId,
        actionType: 'mobile_sos_incident',
        mission: null,
        previousMission: null,
        source: 'carelink_mobile',
        metadata: { sos_event_id: sosEvent.id, alert_id: alert?.id || null, emergency_type: emergencyType, severity },
      }),
    ] : []

    await Promise.allSettled([
      createNotification({
        type: `mobile_${emergencyType}`,
        title: emergencyType === 'sos' ? 'SOS agent reçu' : 'Alerte sécurité reçue',
        body: note,
        priority,
        missionId,
        caregiverId: session.caregiverId,
        linkedEntityType: 'mobile_sos_event',
        linkedEntityId: sosEvent.id,
        metadata: { alert_id: alert?.id || null, sos_event_id: sosEvent.id, emergency_type: emergencyType, severity },
      }),
      createDispatchMessage({
        missionId,
        caregiverId: session.caregiverId,
        senderType: 'agent',
        senderId: String(session.user?.id || session.caregiverId),
        recipientType: 'dispatch_supervisor',
        subject: titleForEmergency(emergencyType),
        body: note,
        priority,
        status: 'sent',
        threadKey,
        metadata: { alert_id: alert?.id || null, sos_event_id: sosEvent.id, emergency_type: emergencyType, severity, callback_requested: callbackRequested, replacement_requested: replacementRequested },
      }),
      recordCareLinkAgentActivity({
        caregiverId: session.caregiverId,
        userId: String(session.user?.id || ''),
        missionId,
        activityType: 'sos-incident-real-time-escalation',
        source: 'carelink_mobile',
        status: emergencyType,
        outcome: 'open',
        priority,
        request,
        metadata: { sos_event_id: sosEvent.id, alert_id: alert?.id || null, emergency_type: emergencyType, severity },
      }),
      ...missionAuditJobs,
    ])

    if (missionId && Number.isFinite(missionId)) {
      await createCareLinkOperationalEscalation({
        missionId,
        caregiverId: session.caregiverId,
        actionType: 'mobile_safety_alert',
        escalationType: emergencyType === 'replacement' ? 'replacement_requested' : emergencyType === 'incident' ? 'incident_reported' : 'mobile_safety_alert',
        severity: priority,
        title: titleForEmergency(emergencyType),
        body: note,
        request,
        metadata: { alert_id: alert?.id || null, sos_event_id: sosEvent.id, emergency_type: emergencyType, severity },
      }).catch(() => null)
    }

    return NextResponse.json({ ok: true, data: { alert, sosEvent, emergencyType, missionId } })
  } catch (error) {
    return carelinkMobileErrorResponse(error, 'CareLink SOS request failed')
  }
}
