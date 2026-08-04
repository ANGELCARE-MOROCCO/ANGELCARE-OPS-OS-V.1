import { NextResponse } from 'next/server'
import { getCurrentAppUser } from '@/lib/auth/session'
import { createAccessGovernanceAdminClient } from '@/lib/users/access-governance/admin-client'
import { canManageUniversalAuthorizationCommand, canViewUniversalAuthorizationCommand } from '@/lib/users/access-governance/universal/security'
import { actorIdentity, assertSafeRpcName } from '@/lib/users/access-governance/universal/security'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const actor = await getCurrentAppUser()
  if (!actor) return NextResponse.json({ ok: false, error: 'Authentication required.' }, { status: 401 })
  if (!canViewUniversalAuthorizationCommand(actor)) return NextResponse.json({ ok: false, error: 'Access denied.' }, { status: 403 })
  const url = new URL(request.url)
  const scanId = String(url.searchParams.get('scanId') ?? '').trim()
  const client = createAccessGovernanceAdminClient()
  let query = client.from('access_authority_manifests').select('*').order('confidence_score', { ascending: false }).limit(5000)
  if (scanId) query = query.eq('scan_id', scanId)
  const { data, error } = await query
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, manifests: data ?? [] })
}

export async function PATCH(request: Request) {
  const actor = await getCurrentAppUser()
  if (!actor) return NextResponse.json({ ok: false, error: 'Authentication required.' }, { status: 401 })
  if (!canManageUniversalAuthorizationCommand(actor)) return NextResponse.json({ ok: false, error: 'Access denied.' }, { status: 403 })
  const body = await request.json().catch(() => ({}))
  if (!body || typeof body !== 'object') return NextResponse.json({ ok: false, error: 'Invalid request.' }, { status: 400 })
  const manifestId = 'manifestId' in body ? String(body.manifestId) : ''
  const decision = 'decision' in body ? String(body.decision) : ''
  if (!manifestId || !['confirm', 'invalidate'].includes(decision)) return NextResponse.json({ ok: false, error: 'manifestId and a valid decision are required.' }, { status: 400 })
  const mutationAuthority = 'mutationAuthority' in body && body.mutationAuthority && typeof body.mutationAuthority === 'object' && !Array.isArray(body.mutationAuthority) ? body.mutationAuthority : {}
  for (const key of ['rpc', 'verificationRpc', 'rollbackRpc']) {
    if (key in mutationAuthority && mutationAuthority[key]) assertSafeRpcName(String(mutationAuthority[key]))
  }
  const actorInfo = actorIdentity(actor)
  const client = createAccessGovernanceAdminClient()
  const patch = decision === 'confirm'
    ? { validation_status: 'confirmed', executable: Boolean('rpc' in mutationAuthority && mutationAuthority.rpc && 'verificationRpc' in mutationAuthority && mutationAuthority.verificationRpc), mutation_authority: mutationAuthority, unresolved: [], confirmed_by: actorInfo.id, confirmed_at: new Date().toISOString(), updated_at: new Date().toISOString() }
    : { validation_status: 'invalidated', executable: false, invalidated_at: new Date().toISOString(), updated_at: new Date().toISOString() }
  const { data, error } = await client.from('access_authority_manifests').update(patch).eq('id', manifestId).select('*').single()
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, manifest: data })
}
