import { governRoute } from '@/lib/runtime/governor/route'
import { NextRequest, NextResponse } from 'next/server'
import { executeHRAction } from '@/lib/hr-production/action-completion'

export const dynamic = 'force-dynamic'

async function POST__angelcareGovernedImpl(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const result = await executeHRAction(body)
    return NextResponse.json({ ok: Boolean((result as any)?.ok), result })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'HR action execution failed' }, { status: 500 })
  }
}

export const POST = governRoute(
  {
    workloadClass: 'worker',
    operation: 'POST:/api/hr/action-completion/execute',
  },
  POST__angelcareGovernedImpl,
)
