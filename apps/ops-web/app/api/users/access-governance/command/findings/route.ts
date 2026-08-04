import { NextResponse } from 'next/server'
import { getCurrentAppUser } from '@/lib/auth/session'
import { createAccessGovernanceAdminClient } from '@/lib/users/access-governance/admin-client'
import { canViewUniversalAuthorizationCommand } from '@/lib/users/access-governance/universal/security'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const actor = await getCurrentAppUser()
  if (!actor) return NextResponse.json({ ok: false, error: 'Authentication required.' }, { status: 401 })
  if (!canViewUniversalAuthorizationCommand(actor)) return NextResponse.json({ ok: false, error: 'Access denied.' }, { status: 403 })
  const url = new URL(request.url)
  const scanId = String(url.searchParams.get('scanId') ?? '').trim()
  const state = String(url.searchParams.get('state') ?? '').trim()
  const severity = String(url.searchParams.get('severity') ?? '').trim()
  const status = String(url.searchParams.get('status') ?? 'open').trim()
  const limit = Math.max(1, Math.min(Number(url.searchParams.get('limit') ?? 500) || 500, 1000))
  const offset = Math.max(0, Number(url.searchParams.get('offset') ?? 0) || 0)
  const client = createAccessGovernanceAdminClient()
  let query = client.from('access_reconciliation_findings').select('*', { count: 'exact' }).order('severity', { ascending: true }).order('created_at', { ascending: false }).range(offset, offset + limit - 1)
  if (scanId) query = query.eq('scan_id', scanId)
  if (state) query = query.eq('reconciliation_state', state)
  if (severity) query = query.eq('severity', severity)
  if (status) query = query.eq('status', status)
  const { data, error, count } = await query
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, findings: data ?? [], total: count ?? 0, offset, limit })
}
