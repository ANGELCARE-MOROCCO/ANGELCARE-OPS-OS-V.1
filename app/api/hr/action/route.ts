import { NextResponse } from 'next/server'
import { recordHRSafeAction } from '@/lib/hr-production/operations'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const result = await recordHRSafeAction({ action: String(body.action || 'unknown'), reason: body.reason, payload: body.payload })
    return NextResponse.json(result, { status: result.blocked ? 409 : 200 })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || 'Unable to record HR action.' }, { status: 500 })
  }
}
