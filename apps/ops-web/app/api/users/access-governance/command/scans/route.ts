import { NextResponse } from 'next/server'
import { getCurrentAppUser } from '@/lib/auth/session'
import { createAccessGovernanceAdminClient } from '@/lib/users/access-governance/admin-client'
import { canManageUniversalAuthorizationCommand, canViewUniversalAuthorizationCommand } from '@/lib/users/access-governance/universal/security'
import { startUniversalAuthorizationScan } from '@/lib/users/access-governance/universal/service'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET() {
  const actor = await getCurrentAppUser()
  if (!actor) return NextResponse.json({ ok: false, error: 'Authentication required.' }, { status: 401 })
  if (!canViewUniversalAuthorizationCommand(actor)) return NextResponse.json({ ok: false, error: 'Access denied.' }, { status: 403 })
  const client = createAccessGovernanceAdminClient()
  const { data, error } = await client.from('access_scanner_jobs').select('*').order('created_at', { ascending: false }).limit(30)
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, jobs: data ?? [] })
}

export async function POST(request: Request) {
  const actor = await getCurrentAppUser()
  if (!actor) return NextResponse.json({ ok: false, error: 'Authentication required.' }, { status: 401 })
  if (!canManageUniversalAuthorizationCommand(actor)) return NextResponse.json({ ok: false, error: 'Access denied.' }, { status: 403 })
  const body = await request.json().catch(() => ({}))
  const mode = body && typeof body === 'object' && 'mode' in body && ['full', 'scoped', 'verification'].includes(String(body.mode))
    ? String(body.mode) as 'full' | 'scoped' | 'verification'
    : 'full'
  const scope = body && typeof body === 'object' && 'scope' in body && body.scope && typeof body.scope === 'object' && !Array.isArray(body.scope)
    ? body.scope
    : {}
  const chunkSize = body && typeof body === 'object' && 'chunkSize' in body ? Number(body.chunkSize) : 20
  try {
    const result = await startUniversalAuthorizationScan(createAccessGovernanceAdminClient(), actor, {
      mode,
      scope,
      processImmediately: true,
      chunkSize: Number.isFinite(chunkSize) ? Math.max(1, Math.min(chunkSize, 50)) : 20,
    })
    return NextResponse.json({ ok: true, ...result }, { status: 202 })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Unable to start universal authorization scan.' }, { status: 500 })
  }
}
