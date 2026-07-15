import { NextRequest, NextResponse } from 'next/server'
import { createResource, listResource, STARTER_TASKS } from '@/lib/capital-command-center/tasks-store'
import { ac360GuardBlockedResponse, buildAc360IdempotencyKey, runAc360WiredAction } from '@/lib/ac360/action-wiring'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const data = await listResource('tasks')
    return NextResponse.json({ ok: true, data })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || 'Unable to load tasks' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const quantity = body?.starter === true ? STARTER_TASKS.length : 1
    const guarded = await runAc360WiredAction('capital.tasks.create', async () => {
      if (body?.starter === true) {
        const created = []
        for (const task of STARTER_TASKS) created.push(await createResource('tasks', task))
        return created
      }
      return createResource('tasks', body || {})
    }, {
      orgId: body.orgId || body.org_id,
      quantity,
      idempotencyKey: body.idempotencyKey || body.idempotency_key || buildAc360IdempotencyKey('capital.tasks.create', `${body?.title || body?.starter || 'task'}:${quantity}`),
      metadata: { starter: body?.starter === true, quantity, source: 'api.capital-command-center.tasks.POST' },
    })
    if (!guarded.ok) return ac360GuardBlockedResponse(guarded)
    return NextResponse.json({ ok: true, data: guarded.data, ac360: { guard: guarded.guard, usage: guarded.usage } })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || 'Unable to create task' }, { status: 500 })
  }
}
