import { NextResponse } from 'next/server'
import { runObservatorySystemAction } from '@/lib/saas-factory/observatory'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    return NextResponse.json(await runObservatorySystemAction(String(body.action || 'observatory action'), body.payload || {}))
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || 'Unknown system action error' }, { status: 500 })
  }
}
