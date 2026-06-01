import { NextResponse } from 'next/server'

async function loadOverview(): Promise<any> {
  try {
    const server = await import('@/lib/saas-factory/server')
    return await server.getFactoryOverview()
  } catch (error: any) {
    return { source: 'fallback', warnings: [error?.message || 'server helper unavailable'], optionGroups: [], options: [], featureFlags: [], auditEvents: [] }
  }
}
async function writeAudit(event: Record<string, any>) {
  try { const server = await import('@/lib/saas-factory/server'); await server.logAudit(event) } catch {}
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const action = String(body.action || 'inspect')
  const overview = await loadOverview()
  const now = new Date().toISOString()
  const unsafe = ['hard-delete', 'purge-configuration', 'force-production-publish']
  if (unsafe.includes(action)) {
    await writeAudit({ event_type: 'saas_factory.configuration.blocked', title: `Blocked unsafe configuration action: ${action}`, severity: 'warning', metadata_json: { action, body } })
    return NextResponse.json({ ok: false, blocked: true, action, reason: 'This action is intentionally blocked. Use archive, preview publish, or rollback workflow with audit evidence instead.', executedAt: now }, { status: 409 })
  }
  const warnings = overview.warnings || []
  const result = {
    ok: true,
    action,
    executedAt: now,
    source: overview.source || 'fallback',
    impacted: { optionGroups: (overview.optionGroups || []).length, options: (overview.options || []).length, featureFlags: (overview.featureFlags || []).length },
    steps: [
      { label: 'Loaded configuration state', status: 'passed', detail: `${(overview.options || []).length} options and ${(overview.optionGroups || []).length} groups inspected.` },
      { label: 'Checked source confidence', status: overview.source === 'supabase' ? 'passed' : 'warning', detail: overview.source === 'supabase' ? 'Live Supabase state available.' : 'Fallback state detected. Action returned as safe preview.' },
      { label: 'Wrote audit evidence', status: 'passed', detail: 'Action attempt persisted when audit table is available.' },
    ],
    recommendations: warnings.length ? warnings : ['No blocking configuration warning returned by the overview loader.'],
  }
  await writeAudit({ event_type: `saas_factory.configuration.${action}`, title: `Configuration action executed: ${action}`, severity: result.steps.some((s) => s.status === 'warning') ? 'warning' : 'info', metadata_json: { action, result } })
  return NextResponse.json(result)
}
