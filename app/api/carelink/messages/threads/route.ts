import { NextResponse } from 'next/server'
import { loadCarelinkMobileWorkspace } from '@/lib/carelink/mobile-adapter'
import { loadDispatchMessages } from '@/lib/carelink/mobile-persistence'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const workspace = await loadCarelinkMobileWorkspace()
    const feed = await loadDispatchMessages({ caregiverId: workspace.agent?.id ? Number(workspace.agent.id) : null, missionIds: workspace.records.map((record) => record.id) })
    return NextResponse.json({ ok: true, data: feed.threads, unreadCount: feed.unreadCount })
  } catch (error) {
    return NextResponse.json({ ok: false, data: [], error: error instanceof Error ? error.message : 'Load CareLink message threads failed' }, { status: 500 })
  }
}
