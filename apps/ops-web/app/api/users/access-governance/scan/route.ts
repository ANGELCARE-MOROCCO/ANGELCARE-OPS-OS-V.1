import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentAppUser } from '@/lib/auth/session'
import { runAccessGovernanceScan } from '@/lib/users/access-governance/scan'

export const dynamic = 'force-dynamic'

function jsonError(error: string, status = 400, extra: Record<string, unknown> = {}) {
  return NextResponse.json({ ok: false, error, ...extra }, { status })
}

export async function POST() {
  const actor = await getCurrentAppUser()
  if (!actor) return jsonError('Authentication required.', 401)

  const supabase = await createClient()
  const result = await runAccessGovernanceScan(supabase, actor as any)

  if (!result.ok) {
    return jsonError(result.error, result.status, { missingMigration: result.missingMigration })
  }

  return NextResponse.json({ ok: true, ...result.summary })
}
