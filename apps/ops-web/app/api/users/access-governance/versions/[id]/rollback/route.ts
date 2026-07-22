import { NextResponse } from 'next/server'
import { getCurrentAppUser } from '@/lib/auth/session'
import { createAccessGovernanceAdminClient } from '@/lib/users/access-governance/admin-client'
import { rollbackAccessRegistryVersion } from '@/lib/users/access-governance/scan'

export const dynamic = 'force-dynamic'

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await getCurrentAppUser()
  if (!actor) return NextResponse.json({ ok: false, error: 'Authentication required.' }, { status: 401 })
  const { id } = await params
  try {
    const supabase = createAccessGovernanceAdminClient()
    const result = await rollbackAccessRegistryVersion(supabase, actor as any, id)
    if (!result.ok) return NextResponse.json({ ok: false, error: result.error }, { status: result.status })
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Registry rollback failed.' }, { status: 500 })
  }
}
