import { NextResponse } from 'next/server'
import { getFactoryOverview, logAudit } from '@/lib/saas-factory/server'

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const confirmed = body.confirmed === true
  const overview = await getFactoryOverview()
  const now = new Date().toISOString()
  if (!confirmed) {
    return NextResponse.json({ ok: true, preview: true, requiresConfirmation: true, generatedAt: now, availableBaseline: overview.auditEvents?.[0] || null, steps: ['Select previous baseline', 'Validate affected option groups', 'Confirm rollback reason', 'Write audit evidence', 'Refresh dependent modules'] })
  }
  await logAudit({ event_type: 'saas_factory.configuration.rollback', title: 'Configuration rollback requested', severity: 'warning', metadata_json: { reason: body.reason || 'No reason provided', source: overview.source } })
  return NextResponse.json({ ok: true, rollbackRequested: true, executedAt: now, source: overview.source, mode: overview.source === 'supabase' ? 'audit-recorded' : 'fallback-preview' })
}
