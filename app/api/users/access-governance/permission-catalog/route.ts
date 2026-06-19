import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentAppUser } from '@/lib/auth/session'
import { canViewAccessGovernance } from '@/lib/users/access-governance/registry'
import { loadPermissionCatalog } from '@/lib/users/access-governance/permission-catalog'

export const dynamic = 'force-dynamic'

function jsonError(error: string, status = 400, extra: Record<string, unknown> = {}) {
  return NextResponse.json({ ok: false, error, ...extra }, { status })
}

export async function GET() {
  const actor = await getCurrentAppUser()
  if (!actor) return jsonError('Authentication required.', 401)
  if (!canViewAccessGovernance(actor)) return jsonError('Access denied.', 403)

  const supabase = await createClient()
  const catalog = await loadPermissionCatalog(supabase)

  return NextResponse.json(catalog)
}
