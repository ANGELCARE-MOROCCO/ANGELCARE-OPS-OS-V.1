import { NextResponse } from 'next/server'
import { getFactoryOverview, logAudit } from '@/lib/saas-factory/server'

function csv(rows: Record<string, any>[]) {
  if (!rows.length) return 'empty\n'
  const keys = Object.keys(rows[0])
  const escape = (value: any) => `"${String(value ?? '').replace(/"/g, '""')}"`
  return [keys.join(','), ...rows.map((row) => keys.map((key) => escape(row[key])).join(','))].join('\n')
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const format = url.searchParams.get('format') === 'csv' ? 'csv' : 'json'
  const dataset = url.searchParams.get('dataset') || 'snapshot'
  const overview = await getFactoryOverview()
  const payload = {
    generatedAt: new Date().toISOString(),
    source: overview.source,
    summary: overview.counts,
    optionGroups: overview.optionGroups,
    options: overview.options,
    featureFlags: overview.featureFlags,
    auditEvents: overview.auditEvents,
  }
  await logAudit({ event_type: 'saas_factory.configuration.export', title: 'Configuration export generated', severity: 'info', metadata_json: { dataset, format } })
  if (format === 'csv') {
    const rows = dataset === 'flags' ? overview.featureFlags : dataset === 'groups' ? overview.optionGroups : overview.options
    return new NextResponse(csv(rows as any[]), { headers: { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': `attachment; filename="saas-factory-configuration-${dataset}.csv"` } })
  }
  return NextResponse.json(payload, { headers: { 'content-disposition': `attachment; filename="saas-factory-configuration-${dataset}.json"` } })
}
