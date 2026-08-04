import { NextResponse } from 'next/server'
import { getCurrentAppUser } from '@/lib/auth/session'
import { createAccessGovernanceAdminClient } from '@/lib/users/access-governance/admin-client'
import { executeUniversalRollback } from '@/lib/users/access-governance/universal/execution'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await getCurrentAppUser()
  if (!actor) return NextResponse.json({ ok: false, error: 'Authentication required.' }, { status: 401 })
  const { id } = await params
  try {
    return NextResponse.json({ ok: true, ...(await executeUniversalRollback(createAccessGovernanceAdminClient(), actor, id)) })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Unable to execute rollback.' }, { status: 500 })
  }
}
