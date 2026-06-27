import { NextResponse } from 'next/server'
import { carelinkMobileErrorResponse } from '@/lib/carelink/mobile-auth'
import { loadCarelinkMobileWorkspace } from '@/lib/carelink/mobile-adapter'
import { loadAlerts } from '@/lib/carelink/mobile-persistence'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const workspace = await loadCarelinkMobileWorkspace()
    const alerts = await loadAlerts({ caregiverId: workspace.agent?.id ? Number(workspace.agent.id) : null, missionIds: workspace.records.map((record) => record.id) }).catch(() => [])
    return NextResponse.json({ ok: true, data: alerts.length ? alerts : workspace.alerts, criticalCount: alerts.filter((alert) => ['critical', 'high'].includes(String(alert.priority).toLowerCase())).length })
  } catch (error) {
    return carelinkMobileErrorResponse(error, 'Load CareLink alerts failed')
  }
}
