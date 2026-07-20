import { NextRequest, NextResponse } from 'next/server'
import { normalizeRevenueOsError } from '@/lib/revenue-command-os/errors'
import { runAllRevenueSignalScans } from '@/lib/revenue-command-os/signal-fabric/repository'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 300

function authorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET || process.env.REVENUE_OS_SIGNAL_CRON_SECRET
  if (!secret) return false
  return request.headers.get('authorization') === `Bearer ${secret}`
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ ok: false, error: { code: 'UNAUTHORIZED_CRON', message: 'Secret de planification invalide.' } }, { status: 401 })
  }
  if (process.env.REVENUE_OS_SIGNAL_SCAN_ENABLED === 'false') {
    return NextResponse.json({ ok: true, skipped: true, reason: 'Signal scans disabled by environment.' })
  }
  try {
    const data = await runAllRevenueSignalScans({ id: '', label: 'Revenue Signal Scheduler', role: 'system' })
    return NextResponse.json({ ok: true, executionPosture: 'shadow-observation', data }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    const normalized = normalizeRevenueOsError(error)
    return NextResponse.json({ ok: false, error: { code: normalized.code, message: normalized.message, recoverable: normalized.recoverable } }, { status: normalized.status })
  }
}
