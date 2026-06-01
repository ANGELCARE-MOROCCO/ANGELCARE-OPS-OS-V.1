import { NextResponse } from 'next/server'
import { listFactoryAuditEvents } from '@/lib/saas-factory/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const result = await listFactoryAuditEvents()
    return NextResponse.json({ ok: true, source: result.source, events: result.data, error: result.error })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || 'Unknown audit recent error' }, { status: 500 })
  }
}
