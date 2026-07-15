import { NextResponse } from 'next/server'
import { carelinkMobileErrorResponse } from '@/lib/carelink/mobile-auth'
import { loadCarelinkMobileWorkspace } from '@/lib/carelink/mobile-adapter'
import { loadPaymentDisputes } from '@/lib/carelink/mobile-persistence'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const workspace = await loadCarelinkMobileWorkspace()
    const disputes = await loadPaymentDisputes({ caregiverId: workspace.agent?.id ? Number(workspace.agent.id) : null, missionIds: workspace.records.map((record) => record.id) }).catch(() => [])
    return NextResponse.json({ ok: true, data: { ...workspace.payments, disputes } })
  } catch (error) {
    return carelinkMobileErrorResponse(error, 'Load CareLink payments failed')
  }
}
