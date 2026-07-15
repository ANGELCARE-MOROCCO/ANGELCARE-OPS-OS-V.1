import { NextResponse } from 'next/server'
import { getCareLinkOpsDispatchPayload } from '../../../../../../lib/carelink/ops-dispatch-repository'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const payload = await getCareLinkOpsDispatchPayload()
    return NextResponse.json({ ...payload, workspace: 'sla-escalations' }, { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } })
  } catch (error) {
    return NextResponse.json({ ok: false, source: 'error', workspace: 'sla-escalations', error: error instanceof Error ? error.message : 'Unknown dispatch workspace error', generatedAt: new Date(0).toISOString(), kpis: [], lanes: [], missions: [], agents: [], sectors: [], incidents: [], communications: [], auditTrail: [], metadata: { dbConnected: false, schemaReady: false, tablesChecked: [], warnings: [] } }, { status: 500, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } })
  }
}
