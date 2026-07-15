import { NextResponse } from 'next/server'
import { carelinkMobileErrorResponse } from '@/lib/carelink/mobile-auth'
import { loadCarelinkMobileWorkspace } from '@/lib/carelink/mobile-adapter'
import { loadDispatchMessages } from '@/lib/carelink/mobile-persistence'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const workspace = await loadCarelinkMobileWorkspace()
    const feed = await loadDispatchMessages({ caregiverId: workspace.agent?.id ? Number(workspace.agent.id) : null, missionIds: workspace.records.map((record) => record.id) })
    return NextResponse.json({ ok: true, data: feed.threads, unreadCount: feed.unreadCount })
  } catch (error) {
    return carelinkMobileErrorResponse(error, 'Load CareLink message threads failed')
  }
}
