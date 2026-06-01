import { NextRequest, NextResponse } from 'next/server'
import { buildHRDomainExport } from '@/lib/hr-production/live-sync'

export const dynamic = 'force-dynamic'

function csvEscape(value: unknown) {
  const s = String(value ?? '')
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

function toCsv(payload: any) {
  const rows = (payload.domains || []).map((domain: any) => ({
    domain: domain.domain,
    status: domain.status,
    confidence: domain.sourceConfidence,
    records: domain.summary?.records || 0,
    active: domain.summary?.active || 0,
    warnings: domain.summary?.warnings || 0,
    blocked: domain.summary?.blocked || 0,
    risks: (domain.risks || []).map((r: any) => r.title).join(' | '),
  }))
  const headers = ['domain', 'status', 'confidence', 'records', 'active', 'warnings', 'blocked', 'risks']
  return [headers.join(','), ...rows.map((row: any) => headers.map((h) => csvEscape(row[h])).join(','))].join('\n')
}

export async function GET(req: NextRequest) {
  try {
    const format = req.nextUrl.searchParams.get('format') || 'json'
    const payload = await buildHRDomainExport(format)
    if (format === 'csv') {
      return new NextResponse(toCsv(payload), {
        headers: {
          'Content-Type': 'text/csv;charset=utf-8',
          'Content-Disposition': `attachment; filename="angelcare-hr-complete-live-export-${new Date().toISOString().slice(0,10)}.csv"`,
          'Cache-Control': 'no-store',
        },
      })
    }
    return NextResponse.json(payload, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || 'Unable to export HR live package.' }, { status: 500 })
  }
}
