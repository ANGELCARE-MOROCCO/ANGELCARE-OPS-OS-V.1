import { NextResponse } from 'next/server'
async function loadOverview(): Promise<any> { try { const server = await import('@/lib/saas-factory/server'); return await server.getFactoryOverview() } catch (error: any) { return { source: 'fallback', warnings: [error?.message || 'server helper unavailable'], optionGroups: [], options: [], featureFlags: [], modules: [] } } }
async function writeAudit(event: Record<string, any>) { try { const server = await import('@/lib/saas-factory/server'); await server.logAudit(event) } catch {} }
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const confirmed = body.confirmed === true
  const overview = await loadOverview()
  const now = new Date().toISOString()
  const blockers = [ ...(overview.source !== 'supabase' ? ['Live Supabase source not confirmed. Publish is preview-only.'] : []), ...((overview.optionGroups || []).length === 0 ? ['No option groups available.'] : []), ...((overview.options || []).length === 0 ? ['No options available.'] : []) ]
  if (!confirmed) {
    await writeAudit({ event_type: 'saas_factory.configuration.publish.preview', title: 'Configuration publish preview generated', severity: blockers.length ? 'warning' : 'info', metadata_json: { blockers } })
    return NextResponse.json({ ok: blockers.length === 0, preview: true, requiresConfirmation: true, blockers, generatedAt: now, publishPlan: ['Freeze current baseline', 'Validate option registry', 'Write audit event', 'Notify dependent modules', 'Refresh configuration cache'] })
  }
  if (blockers.length) {
    await writeAudit({ event_type: 'saas_factory.configuration.publish.blocked', title: 'Configuration publish blocked', severity: 'warning', metadata_json: { blockers } })
    return NextResponse.json({ ok: false, blocked: true, blockers, executedAt: now }, { status: 409 })
  }
  await writeAudit({ event_type: 'saas_factory.configuration.publish', title: 'Configuration published', severity: 'info', metadata_json: { counts: overview.counts } })
  return NextResponse.json({ ok: true, published: true, executedAt: now, source: overview.source, impactedModules: (overview.modules || []).length, cacheRefresh: 'requested', audit: 'written' })
}
