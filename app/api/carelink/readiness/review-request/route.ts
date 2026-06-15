import { NextResponse } from 'next/server'
import { loadCarelinkMobileWorkspace } from '@/lib/carelink/mobile-adapter'
import { requestDocumentReview } from '@/lib/carelink/mobile-persistence'
import { recordMissionEvent } from '@/lib/missions/events'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({})) as {
      documentType?: string | null
      note?: string | null
      metadata?: Record<string, unknown>
      missionId?: number | null
    }
    const workspace = await loadCarelinkMobileWorkspace()
    const caregiverId = workspace.agent?.id ? Number(workspace.agent.id) : null
    if (!caregiverId) return NextResponse.json({ ok: false, error: 'Profil agent introuvable.' }, { status: 400 })

    const document = await requestDocumentReview(caregiverId, { documentType: body.documentType || null, note: body.note || null, metadata: body.metadata || {} }).catch(() => null)

    if (body.missionId) {
      await recordMissionEvent({
        missionId: Number(body.missionId),
        eventType: 'profile_update_requested',
        content: body.note || 'Demande de revue readiness transmise depuis CareLink mobile',
        metadata: { document_type: body.documentType || null, ...body.metadata },
        source: 'carelink_mobile',
      })
    }

    return NextResponse.json({ ok: true, data: { document } })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Readiness review request failed' }, { status: 500 })
  }
}
