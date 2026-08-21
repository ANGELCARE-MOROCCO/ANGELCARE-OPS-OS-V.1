import { governRoute } from '@/lib/runtime/governor/route'
import { NextResponse } from 'next/server'
import { getCurrentAppUser } from '@/lib/auth/session'
import { createAccessGovernanceAdminClient } from '@/lib/users/access-governance/admin-client'
import { executeUniversalPlan } from '@/lib/users/access-governance/universal/execution'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

async function POST__angelcareGovernedImpl(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await getCurrentAppUser()
  if (!actor) return NextResponse.json({ ok: false, error: 'Authentication required.' }, { status: 401 })
  const { id } = await params
  try {
    const result = await executeUniversalPlan(createAccessGovernanceAdminClient(), actor, id)
    return NextResponse.json({ ok: true, ...result })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Unable to execute plan.' }, { status: 400 })
  }
}

export const POST = governRoute(
  {
    workloadClass: 'worker',
    operation: 'POST:/api/users/access-governance/command/plans/[id]/execute',
  },
  POST__angelcareGovernedImpl,
)
