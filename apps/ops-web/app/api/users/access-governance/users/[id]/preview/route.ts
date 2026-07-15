import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentAppUser } from '@/lib/auth/session'
import { canViewAccessGovernance } from '@/lib/users/access-governance/registry'
import { buildAccessGovernancePreview } from '@/lib/users/access-governance/preview'

export const dynamic = 'force-dynamic'

function jsonError(error: string, status = 400, extra: Record<string, unknown> = {}) {
  return NextResponse.json({ ok: false, error, ...extra }, { status })
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const actor = await getCurrentAppUser()
  if (!actor) return jsonError('Authentication required.', 401)
  if (!canViewAccessGovernance(actor)) return jsonError('Access denied.', 403)

  const { id } = await params
  const userId = String(id || '').trim()
  if (!userId) return jsonError('Missing user id.', 400)

  const supabase = await createClient()
  const result = await buildAccessGovernancePreview(supabase, userId)

  if (!result.ok) {
    return jsonError(result.error, result.status, { missingMigration: result.missingMigration })
  }

  return NextResponse.json({ ok: true, ...result.preview })
}
