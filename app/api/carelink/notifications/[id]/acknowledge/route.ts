import { NextResponse } from 'next/server'
import { acknowledgeNotification } from '@/lib/carelink/mobile-persistence'

export const dynamic = 'force-dynamic'

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const body = await request.json().catch(() => ({})) as { missionId?: number; note?: string }
    const data = await acknowledgeNotification(id, body.missionId ? Number(body.missionId) : null, body.note || null)
    return NextResponse.json({ ok: true, acknowledged: true, data })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Notification acknowledgement failed' }, { status: 500 })
  }
}
