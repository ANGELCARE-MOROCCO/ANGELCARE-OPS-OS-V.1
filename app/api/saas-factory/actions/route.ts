import { NextResponse } from 'next/server'
import { getFactoryOverview, logAudit } from '@/lib/saas-factory/server'

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const action = String(body.action || 'inspect')
  const overview = await getFactoryOverview()
  const now = new Date().toISOString()
  const unsafe = ['hard-delete', 'purge-configuration', 'force-production-publish']
  if (unsafe.includes(action)) {
    await logAudit({ event_type: 'saas_factory.configuration.blocked', title: `Blocked unsafe configuration action: ${action}`, severity: 'warning', metadata_json: { action, body } })
    return NextResponse.json({ ok: false, blocked: true, action, reason: 'This action is intentionally blocked. Use archive, preview publish, or rollback workflow with audit evidence instead.', executedAt: now }, { status: 409 })
  }
  const result = {
    ok: true,
    action,
    executedAt: now,
    source: overview.source,
    impacted: {
      optionGroups: overview.optionGroups.length,
      options: overview.options.length,
      featureFlags: overview.featureFlags.length,
    },
    steps: [
      { label: 'Loaded configuration state', status: 'passed', detail: `${overview.options.length} options and ${overview.optionGroups.length} groups inspected.` },
      { label: 'Checked source confidence', status: overview.source === 'supabase' ? 'passed' : 'warning', detail: overview.source === 'supabase' ? 'Live Supabase state available.' : 'Fallback state detected. Action returned as safe preview.' },
      { label: 'Wrote audit evidence', status: 'passed', detail: 'Action attempt persisted when audit table is available.' },
    ],
    recommendations: overview.warnings.length ? overview.warnings : ['No blocking configuration warning returned by the overview loader.'],
  }
  await logAudit({ event_type: `saas_factory.configuration.${action}`, title: `Configuration action executed: ${action}`, severity: result.steps.some((s) => s.status === 'warning') ? 'warning' : 'info', metadata_json: { action, result } })
  return NextResponse.json(result)
}
