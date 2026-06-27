import { NextResponse } from 'next/server'
import { createDispatchMessage, createNotification, createPaymentDispute } from '@/lib/carelink/mobile-persistence'
import { recordCareLinkAgentActivity, recordCareLinkDispatchSlaSnapshot, recordCareLinkMissionTimelineAudit } from '@/lib/carelink/mobile-audit-ledger'
import { carelinkMobileErrorResponse, requireCareLinkMobileAgent, requireCareLinkMobileMissionAccess } from '@/lib/carelink/mobile-auth'

export const dynamic = 'force-dynamic'

type PaymentDisputeBody = {
  missionId?: number | null
  amountClaimed?: number | null
  amountExpected?: number | null
  amountPaid?: number | null
  disputeType?: string | null
  targetLineId?: string | null
  targetLineKind?: string | null
  evidenceUrl?: string | null
  agentNote?: string | null
  reason?: string
  metadata?: Record<string, unknown>
}

function clean(value: unknown, fallback = '') {
  const text = String(value || '').trim()
  return text || fallback
}

function normalizeDisputeType(value: unknown) {
  const raw = clean(value, 'payment_correction').toLowerCase().replaceAll(' ', '_')
  if (['honoraires', 'transport_allowance', 'bonus', 'deduction', 'correction', 'payment_delay', 'payment_correction'].includes(raw)) return raw
  return 'payment_correction'
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({})) as PaymentDisputeBody
    const missionId = body.missionId ? Number(body.missionId) : null
    const session = missionId && Number.isFinite(missionId)
      ? await requireCareLinkMobileMissionAccess(missionId, 'can_view_payments', request)
      : await requireCareLinkMobileAgent('can_view_payments', request)

    if (!body.reason || !String(body.reason).trim()) {
      return NextResponse.json({ ok: false, error: 'Le motif de correction est requis.' }, { status: 400 })
    }

    const disputeType = normalizeDisputeType(body.disputeType)
    const data = await createPaymentDispute({
      caregiverId: session.caregiverId,
      missionId,
      amountClaimed: body.amountClaimed ?? null,
      amountExpected: body.amountExpected ?? null,
      amountPaid: body.amountPaid ?? null,
      disputeType,
      targetLineId: body.targetLineId || null,
      targetLineKind: body.targetLineKind || null,
      evidenceUrl: body.evidenceUrl || null,
      agentNote: body.agentNote || null,
      reason: String(body.reason),
      metadata: { source: 'carelink_mobile_p17_payment_dispute', ...(body.metadata || {}) },
    })

    const missionAuditJobs = missionId ? [
      recordCareLinkMissionTimelineAudit({
        missionId,
        caregiverId: session.caregiverId,
        actionType: 'payment-honoraires-dispute',
        eventType: 'mobile_payment_dispute_created',
        previousMission: null,
        nextMission: null,
        outcome: 'pending_ops_review',
        metadata: { payment_dispute_id: data?.id || null, dispute_type: disputeType, amount_claimed: body.amountClaimed ?? null },
      }),
      recordCareLinkDispatchSlaSnapshot({
        missionId,
        caregiverId: session.caregiverId,
        actionType: 'payment_dispute',
        mission: null,
        previousMission: null,
        source: 'carelink_mobile',
        metadata: { payment_dispute_id: data?.id || null, dispute_type: disputeType, amount_claimed: body.amountClaimed ?? null },
      }),
    ] : []

    await Promise.allSettled([
      recordCareLinkAgentActivity({
        caregiverId: session.caregiverId,
        userId: String(session.user?.id || ''),
        missionId,
        activityType: 'payment-honoraires-dispute',
        source: 'carelink_mobile',
        status: disputeType,
        outcome: 'pending_ops_review',
        priority: 'high',
        request,
        metadata: { payment_dispute_id: data?.id || null, dispute_type: disputeType, amount_claimed: body.amountClaimed ?? null },
      }),
      ...missionAuditJobs,
      createNotification({
        type: 'payment_dispute_created',
        title: 'Litige honoraires transmis',
        body: 'Votre demande est enregistrée pour revue OPS finance.',
        priority: 'high',
        missionId,
        caregiverId: session.caregiverId,
        linkedEntityType: 'payment_dispute',
        linkedEntityId: String(data?.id || ''),
        metadata: { dispute_type: disputeType },
      }),
      createDispatchMessage({
        missionId,
        caregiverId: session.caregiverId,
        senderType: 'agent',
        senderId: String(session.user?.id || session.caregiverId),
        recipientType: 'finance_ops',
        subject: 'Litige honoraires agent',
        body: String(body.reason),
        priority: 'high',
        status: 'sent',
        threadKey: missionId ? `mission:${missionId}:finance` : `caregiver:${session.caregiverId}:finance`,
        metadata: { payment_dispute_id: data?.id || null, dispute_type: disputeType, amount_claimed: body.amountClaimed ?? null },
      }),
    ])

    return NextResponse.json({ ok: true, data })
  } catch (error) {
    return carelinkMobileErrorResponse(error, 'Payment dispute failed')
  }
}
