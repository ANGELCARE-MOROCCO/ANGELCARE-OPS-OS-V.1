import { NextResponse } from 'next/server'
import { carelinkMobileErrorResponse } from '@/lib/carelink/mobile-auth'
import { loadCarelinkMobileWorkspace } from '@/lib/carelink/mobile-adapter'
import { loadNotifications } from '@/lib/carelink/mobile-persistence'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const workspace = await loadCarelinkMobileWorkspace()
    const notifications = await loadNotifications({ caregiverId: workspace.agent?.id ? Number(workspace.agent.id) : null, missionIds: workspace.records.map((record) => record.id) }).catch(() => [])
    return NextResponse.json({ ok: true, data: notifications.length ? notifications : workspace.notifications, unreadCount: notifications.filter((notification) => !['acknowledged', 'dismissed'].includes(String(notification.status).toLowerCase())).length })
  } catch (error) {
    return carelinkMobileErrorResponse(error, 'Load CareLink notifications failed')
  }
}
