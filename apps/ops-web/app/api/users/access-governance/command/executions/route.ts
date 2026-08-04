import { NextResponse } from 'next/server'
import { getCurrentAppUser } from '@/lib/auth/session'
import { createAccessGovernanceAdminClient } from '@/lib/users/access-governance/admin-client'
import { canViewUniversalAuthorizationCommand } from '@/lib/users/access-governance/universal/security'
import { loadUniversalExecutions } from '@/lib/users/access-governance/universal/execution'

export const dynamic = 'force-dynamic'

export async function GET() {
  const actor = await getCurrentAppUser()
  if (!actor) return NextResponse.json({ ok: false, error: 'Authentication required.' }, { status: 401 })
  if (!canViewUniversalAuthorizationCommand(actor)) return NextResponse.json({ ok: false, error: 'Access denied.' }, { status: 403 })
  try {
    return NextResponse.json({ ok: true, ...(await loadUniversalExecutions(createAccessGovernanceAdminClient(), 100)) })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Unable to load execution history.' }, { status: 500 })
  }
}
