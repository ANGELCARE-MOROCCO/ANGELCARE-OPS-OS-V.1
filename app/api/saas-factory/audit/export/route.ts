import { recentSaasFactoryAudit } from '@/lib/saas-factory/overview-runtime'
export const dynamic = 'force-dynamic'
function csvEscape(value: unknown) { return `"${String(value ?? '').replace(/"/g, '""')}"` }
export async function GET(request: Request) {
  const url = new URL(request.url)
  const format = (url.searchParams.get('format') || 'json').toLowerCase()
  const audit = await recentSaasFactoryAudit(100)
  if (format === 'csv') {
    const rows = audit.rows as any[]
    const headers = ['created_at','event_type','event','title','message','actor','module_key','severity','status']
    const csv = [headers.join(','), ...rows.map((row) => headers.map((key) => csvEscape(row[key])).join(','))].join('\n')
    return new Response(csv, { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="saas-factory-command-audit.csv"' } })
  }
  return new Response(JSON.stringify(audit, null, 2), { headers: { 'Content-Type': 'application/json; charset=utf-8', 'Content-Disposition': 'attachment; filename="saas-factory-command-audit.json"' } })
}
