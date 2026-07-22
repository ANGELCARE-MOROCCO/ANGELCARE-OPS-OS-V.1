import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentAppUser } from '@/lib/auth/session'
import { canViewAccessGovernance, loadAccessGovernanceRegistry } from '@/lib/users/access-governance/registry'

export const dynamic = 'force-dynamic'

function jsonError(error: string, status = 400, extra: Record<string, unknown> = {}) {
  return NextResponse.json({ ok: false, error, ...extra }, { status })
}

export async function GET() {
  const actor = await getCurrentAppUser()
  if (!actor) return jsonError('Authentication required.', 401)
  if (!canViewAccessGovernance(actor)) return jsonError('Access denied.', 403)

  const supabase = await createClient()
  const registry = await loadAccessGovernanceRegistry(supabase)

  if (!registry.ok) {
    return jsonError(registry.error, registry.missingMigration ? 500 : 500, { missingMigration: registry.missingMigration })
  }

  return NextResponse.json({
    ok: true,
    modules: registry.snapshot.modules,
    routes: registry.snapshot.routes,
    resources: registry.snapshot.resources,
    templates: registry.snapshot.templates,
    latestScan: registry.snapshot.latestScan,
    latestVersion: registry.snapshot.latestVersion,
    stats: registry.snapshot.stats,
  })
}

