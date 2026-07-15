import { NextResponse } from 'next/server'
import { listFactoryAuditEvents } from '@/lib/saas-factory/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const result = await listFactoryAuditEvents()
    return NextResponse.json({ ok: true, events: result.data, source: result.source, error: result.error })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || 'Unknown SaaS Factory API error' }, { status: 500 })
  }
}
