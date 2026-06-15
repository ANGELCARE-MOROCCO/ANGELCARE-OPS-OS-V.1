import { NextResponse } from 'next/server'
import { createPaymentDispute } from '@/lib/carelink/mobile-persistence'
import { loadCarelinkMobileWorkspace } from '@/lib/carelink/mobile-adapter'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({})) as {
      missionId?: number | null
      caregiverId?: number
      amountClaimed?: number | null
      reason?: string
      metadata?: Record<string, unknown>
    }
    const workspace = await loadCarelinkMobileWorkspace()
    const caregiverId = body.caregiverId || (workspace.agent?.id ? Number(workspace.agent.id) : null)
    if (!caregiverId) {
      return NextResponse.json({ ok: false, error: 'Profil agent introuvable pour la contestation.' }, { status: 400 })
    }
    if (!body.reason || !String(body.reason).trim()) {
      return NextResponse.json({ ok: false, error: 'Le motif de correction est requis.' }, { status: 400 })
    }
    const data = await createPaymentDispute({
      caregiverId,
      missionId: body.missionId ?? null,
      amountClaimed: body.amountClaimed ?? null,
      reason: String(body.reason),
      metadata: body.metadata || {},
    })
    return NextResponse.json({ ok: true, data })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Payment dispute failed' }, { status: 500 })
  }
}
