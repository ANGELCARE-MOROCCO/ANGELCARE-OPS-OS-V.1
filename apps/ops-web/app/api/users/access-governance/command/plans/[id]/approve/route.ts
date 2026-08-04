import { NextResponse } from 'next/server'
import { getCurrentAppUser } from '@/lib/auth/session'
import { createAccessGovernanceAdminClient } from '@/lib/users/access-governance/admin-client'
import { approveUniversalPlan } from '@/lib/users/access-governance/universal/execution'

export const dynamic = 'force-dynamic'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await getCurrentAppUser()
  if (!actor) return NextResponse.json({ ok: false, error: 'Authentication required.' }, { status: 401 })
  const { id } = await params
  const body = await request.json().catch(() => ({}))
  const comment = body && typeof body === 'object' && 'comment' in body ? String(body.comment).trim() || null : null
  try {
    const result = await approveUniversalPlan(createAccessGovernanceAdminClient(), actor, id, comment)
    return NextResponse.json({ ok: true, ...result })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Unable to approve plan.' }, { status: 400 })
  }
}
