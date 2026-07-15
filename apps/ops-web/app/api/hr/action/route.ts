import { NextResponse } from 'next/server'
import { executeHRAction } from '@/lib/hr-production/action-completion'
import { recordHRSafeAction } from '@/lib/hr-production/operations'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const payload =
      body?.payload && typeof body.payload === 'object'
        ? body.payload
        : Object.fromEntries(
            Object.entries(body || {}).filter(([key]) => !['action', 'action_type', 'type', 'table', 'id', 'entity_id', 'reason', 'title'].includes(key))
          )
    const hasMutatingShape = Boolean(body?.table && Object.keys(payload).length)
    const result = hasMutatingShape
      ? await executeHRAction({
          action: String(body.action || body.action_type || 'unknown'),
          table: body.table,
          id: body.id || body.entity_id,
          payload,
          title: body.title,
          reason: body.reason,
        })
      : await recordHRSafeAction({ action: String(body.action || 'unknown'), reason: body.reason, payload: body.payload || body })
    const blocked = 'blocked' in result ? Boolean(result.blocked) : false

    return NextResponse.json({
      ...result,
      mutationApplied: Boolean(hasMutatingShape && result.ok && !blocked),
    }, { status: blocked ? 409 : result.ok ? 200 : 500 })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || 'Unable to record HR action.' }, { status: 500 })
  }
}
