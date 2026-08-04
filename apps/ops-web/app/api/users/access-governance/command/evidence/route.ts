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
  const subjectKey = String(url.searchParams.get('subjectKey') ?? '').trim()
  const evidenceKey = String(url.searchParams.get('evidenceKey') ?? '').trim()
  if (!scanId) return NextResponse.json({ ok: false, error: 'scanId is required.' }, { status: 400 })
  const client = createAccessGovernanceAdminClient()
  let query = client.from('access_authorization_evidence').select('*').eq('scan_id', scanId).order('confidence_score', { ascending: false }).limit(500)
  if (subjectKey) query = query.or(`subject_key.eq.${subjectKey},object_key.eq.${subjectKey}`)
  if (evidenceKey) query = query.eq('evidence_key', evidenceKey)
  const { data, error } = await query
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, evidence: data ?? [] })
}
