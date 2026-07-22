import { NextResponse } from 'next/server'
import { getCurrentAppUser } from '@/lib/auth/session'
import { createAccessGovernanceAdminClient } from '@/lib/users/access-governance/admin-client'
import { runAccessGovernanceScan } from '@/lib/users/access-governance/scan'
import type { AccessResourceOverride } from '@/lib/users/access-governance/types'

export const dynamic = 'force-dynamic'

function jsonError(error: string, status = 400, extra: Record<string, unknown> = {}) {
  return NextResponse.json({ ok: false, error, ...extra }, { status })
}

export async function POST(request: Request) {
  const actor = await getCurrentAppUser()
  if (!actor) return jsonError('Authentication required.', 401)

  let body: Record<string, unknown> = {}
  try {
    body = await request.json()
  } catch {
    body = {}
  }

  const mode = body.mode === 'publish' ? 'publish' : 'dry_run'
  const includeApi = body.includeApi !== false
  const overrides = Array.isArray(body.overrides) ? body.overrides as AccessResourceOverride[] : []
  const idempotencyKey = String(request.headers.get('idempotency-key') || body.idempotencyKey || '').trim() || null

  try {
    const supabase = createAccessGovernanceAdminClient()
    const result = await runAccessGovernanceScan(supabase, actor as any, {
      mode,
      includeApi,
      overrides,
      idempotencyKey,
    })

    if (!result.ok) {
      return jsonError(result.error, result.status, { missingMigration: result.missingMigration })
    }

    return NextResponse.json({ ok: true, ...result.summary, idempotent: result.idempotent })
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Global access scan failed.', 500)
  }
}
