import { NextResponse } from 'next/server'
import { getCurrentAppUser } from '@/lib/auth/session'
import { createAccessGovernanceAdminClient } from '@/lib/users/access-governance/admin-client'
import { canViewUniversalAuthorizationCommand } from '@/lib/users/access-governance/universal/security'
import { loadUniversalExecution } from '@/lib/users/access-governance/universal/execution'

export const dynamic = 'force-dynamic'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await getCurrentAppUser()
  if (!actor) return NextResponse.json({ ok: false, error: 'Authentication required.' }, { status: 401 })
  if (!canViewUniversalAuthorizationCommand(actor)) return NextResponse.json({ ok: false, error: 'Access denied.' }, { status: 403 })
  const { id } = await params
  try {
    return NextResponse.json({ ok: true, ...(await loadUniversalExecution(createAccessGovernanceAdminClient(), id)) })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Unable to load execution.' }, { status: 500 })
  }
}
