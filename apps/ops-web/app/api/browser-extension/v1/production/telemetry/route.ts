import { NextRequest, NextResponse } from 'next/server'
import { authenticateExtensionRequest } from '@/lib/browser-extension/runtime'
import { recordProductionTelemetry } from '@/lib/browser-extension/production-control/service'
import { writeExtensionAudit } from '@/lib/browser-extension/audit'

export async function POST(req: NextRequest) {
  const auth = await authenticateExtensionRequest(req)
  if (!auth.ok) return auth.response
  const body = await req.json().catch(() => ({}))
  if (!body?.extensionVersion) return NextResponse.json({ ok: false, error: 'extensionVersion is required.' }, { status: 400 })
  try {
    const result = await recordProductionTelemetry(auth.db, auth.context.user, auth.context.device, body)
    if (result.overall !== 'healthy') await writeExtensionAudit(auth.db, { actor: auth.context.user, deviceId: auth.context.device.id, eventType: 'production_health_degraded', moduleKey: 'revenue_b2b', result: result.overall, severity: 'warning', metadata: result.accepted })
    return NextResponse.json({ ok: true, ...result })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: String(error?.message || 'TELEMETRY_REJECTED') }, { status: 400 })
  }
}
