import { NextResponse } from 'next/server'
import { createPaymentDispute } from '@/lib/carelink/mobile-persistence'
import { carelinkMobileErrorResponse, requireCareLinkMobileAgent, requireCareLinkMobileMissionAccess } from '@/lib/carelink/mobile-auth'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({})) as {
      missionId?: number | null
      amountClaimed?: number | null
      reason?: string
      metadata?: Record<string, unknown>
    }
    const session = body.missionId
      ? await requireCareLinkMobileMissionAccess(Number(body.missionId), 'can_view_payments')
      : await requireCareLinkMobileAgent('can_view_payments')
    if (!body.reason || !String(body.reason).trim()) {
      return NextResponse.json({ ok: false, error: 'Le motif de correction est requis.' }, { status: 400 })
    }
    const data = await createPaymentDispute({
      caregiverId: session.caregiverId,
      missionId: body.missionId ?? null,
      amountClaimed: body.amountClaimed ?? null,
      reason: String(body.reason),
      metadata: body.metadata || {},
    })
    return NextResponse.json({ ok: true, data })
  } catch (error) {
    return carelinkMobileErrorResponse(error, 'Payment dispute failed')
  }
}
