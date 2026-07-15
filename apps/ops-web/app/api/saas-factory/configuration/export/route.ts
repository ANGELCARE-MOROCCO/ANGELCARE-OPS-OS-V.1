import { NextResponse } from 'next/server'
async function loadOverview(): Promise<any> { try { const server = await import('@/lib/saas-factory/server'); return await server.getFactoryOverview() } catch (error: any) { return { source: 'fallback', warnings: [error?.message || 'server helper unavailable'], counts: {}, optionGroups: [], options: [], featureFlags: [], auditEvents: [] } } }
async function writeAudit(event: Record<string, any>) { try { const server = await import('@/lib/saas-factory/server'); await server.logAudit(event) } catch {} }
function csv(rows: Record<string, any>[]) { if (!rows.length) return 'empty\n'; const keys = Object.keys(rows[0]); const escape = (value: any) => `"${String(value ?? '').replace(/"/g, '""')}"`; return [keys.join(','), ...rows.map((row) => keys.map((key) => escape(row[key])).join(','))].join('\n') }
export async function GET(request: Request) {
  const url = new URL(request.url)
  const format = url.searchParams.get('format') === 'csv' ? 'csv' : 'json'
  const dataset = url.searchParams.get('dataset') || 'snapshot'
  const overview = await loadOverview()
  const payload = { generatedAt: new Date().toISOString(), source: overview.source, summary: overview.counts || {}, optionGroups: overview.optionGroups || [], options: overview.options || [], featureFlags: overview.featureFlags || [], auditEvents: overview.auditEvents || [] }
  await writeAudit({ event_type: 'saas_factory.configuration.export', title: 'Configuration export generated', severity: 'info', metadata_json: { dataset, format } })
  if (format === 'csv') {
    const rows = dataset === 'flags' ? payload.featureFlags : dataset === 'groups' ? payload.optionGroups : dataset === 'audit' ? payload.auditEvents : payload.options
    return new NextResponse(csv(rows as any[]), { headers: { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': `attachment; filename="saas-factory-configuration-${dataset}.csv"` } })
  }
  return NextResponse.json(payload, { headers: { 'content-disposition': `attachment; filename="saas-factory-configuration-${dataset}.json"` } })
}
