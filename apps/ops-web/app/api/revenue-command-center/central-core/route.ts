import { NextResponse } from 'next/server'
import { createCentralRevenueRecord, readCentralRevenueCore, seedCentralRevenueCoreIfEmpty } from '@/lib/revenue-command-center/central-core'

export const dynamic = 'force-dynamic'

export async function GET() {
  await seedCentralRevenueCoreIfEmpty().catch(() => null)
  const snapshot = await readCentralRevenueCore()
  return NextResponse.json({ ok: true, snapshot, syncedAt: new Date().toISOString() })
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const record = await createCentralRevenueRecord(body)
  const snapshot = await readCentralRevenueCore()
  return NextResponse.json({ ok: true, record, snapshot, syncedAt: new Date().toISOString() })
}
