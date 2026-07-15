import { NextResponse } from 'next/server'
import { runDispatchAction } from '../../../../../../lib/carelink/ops-dispatch-repository'
import type { DispatchActionRequest } from '../../../../../../lib/carelink/ops-dispatch-types'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as DispatchActionRequest
    const result = await runDispatchAction(body)
    return NextResponse.json(result, { status: result.ok ? 200 : 400, headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    return NextResponse.json(
      { ok: false, action: 'unknown', message: 'CareLink Ops dispatch action failed.', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 400, headers: { 'Cache-Control': 'no-store' } },
    )
  }
}
