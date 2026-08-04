import { NextResponse } from 'next/server'
import { getCurrentAppUser } from '@/lib/auth/session'
import { createAccessGovernanceAdminClient } from '@/lib/users/access-governance/admin-client'
import { canViewUniversalAuthorizationCommand } from '@/lib/users/access-governance/universal/security'

export const dynamic = 'force-dynamic'

function limitValue(url: URL) {
  const value = Number(url.searchParams.get('limit') ?? 250)
  return Number.isFinite(value) ? Math.max(1, Math.min(value, 1000)) : 250
}

export async function GET(request: Request) {
  const actor = await getCurrentAppUser()
  if (!actor) return NextResponse.json({ ok: false, error: 'Authentication required.' }, { status: 401 })
  if (!canViewUniversalAuthorizationCommand(actor)) return NextResponse.json({ ok: false, error: 'Access denied.' }, { status: 403 })
  const url = new URL(request.url)
  const scanId = String(url.searchParams.get('scanId') ?? '').trim()
  if (!scanId) return NextResponse.json({ ok: false, error: 'scanId is required.' }, { status: 400 })
  const limit = limitValue(url)
  const offset = Math.max(0, Number(url.searchParams.get('offset') ?? 0) || 0)
  const nodeType = String(url.searchParams.get('nodeType') ?? '').trim()
  const query = String(url.searchParams.get('query') ?? '').trim()
  const client = createAccessGovernanceAdminClient()
  let nodeQuery = client.from('access_topology_nodes').select('*', { count: 'exact' }).eq('scan_id', scanId).order('display_name', { ascending: true }).range(offset, offset + limit - 1)
  if (nodeType) nodeQuery = nodeQuery.eq('node_type', nodeType)
  if (query) nodeQuery = nodeQuery.or(`display_name.ilike.%${query.replaceAll(',', '')}%,canonical_key.ilike.%${query.replaceAll(',', '')}%`)
  const { data: nodes, error, count } = await nodeQuery
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, nodes: nodes ?? [], total: count ?? 0, offset, limit })
}
