import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentAppUser } from '@/lib/auth/session'
import { canViewAccessGovernance, loadAccessGovernanceEvents } from '@/lib/users/access-governance/registry'

export const dynamic = 'force-dynamic'

function jsonError(error: string, status = 400, extra: Record<string, unknown> = {}) {
  return NextResponse.json({ ok: false, error, ...extra }, { status })
}

export async function GET() {
  const actor = await getCurrentAppUser()
  if (!actor) return jsonError('Authentication required.', 401)
  if (!canViewAccessGovernance(actor)) return jsonError('Access denied.', 403)

  const supabase = await createClient()
  const result = await loadAccessGovernanceEvents(supabase)

  if (!result.ok) {
    return jsonError(result.error, result.missingMigration ? 500 : 500, { missingMigration: result.missingMigration })
  }

  return NextResponse.json({ ok: true, events: result.events, scans: result.scans })
}

