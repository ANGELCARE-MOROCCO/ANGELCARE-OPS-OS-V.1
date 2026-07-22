import { NextResponse } from 'next/server'
import { getCurrentAppUser } from '@/lib/auth/session'
import { createAccessGovernanceAdminClient } from '@/lib/users/access-governance/admin-client'
import { publishStoredAccessGovernanceScan } from '@/lib/users/access-governance/scan'
import type { AccessResourceOverride } from '@/lib/users/access-governance/types'

export const dynamic = 'force-dynamic'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await getCurrentAppUser()
  if (!actor) return NextResponse.json({ ok: false, error: 'Authentication required.' }, { status: 401 })
  const { id } = await params
  const body = await request.json().catch(() => ({})) as Record<string, unknown>
  const overrides = Array.isArray(body.overrides) ? body.overrides as AccessResourceOverride[] : []
  const idempotencyKey = String(request.headers.get('idempotency-key') || body.idempotencyKey || '').trim() || null

  try {
    const supabase = createAccessGovernanceAdminClient()
    const result = await publishStoredAccessGovernanceScan(supabase, actor as any, id, overrides, idempotencyKey)
    if (!result.ok) return NextResponse.json({ ok: false, error: result.error, missingMigration: result.missingMigration }, { status: result.status })
    return NextResponse.json({ ok: true, ...result.summary, idempotent: result.idempotent })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Registry publication failed.' }, { status: 500 })
  }
}
