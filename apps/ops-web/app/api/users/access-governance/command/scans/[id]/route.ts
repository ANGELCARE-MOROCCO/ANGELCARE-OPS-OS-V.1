import { NextResponse } from 'next/server'
import { getCurrentAppUser } from '@/lib/auth/session'
import { createAccessGovernanceAdminClient } from '@/lib/users/access-governance/admin-client'
import { canManageUniversalAuthorizationCommand, canViewUniversalAuthorizationCommand } from '@/lib/users/access-governance/universal/security'
import { continueUniversalAuthorizationScan, controlUniversalAuthorizationScan } from '@/lib/users/access-governance/universal/service'
import { loadUniversalJob } from '@/lib/users/access-governance/universal/repository'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await getCurrentAppUser()
  if (!actor) return NextResponse.json({ ok: false, error: 'Authentication required.' }, { status: 401 })
  if (!canViewUniversalAuthorizationCommand(actor)) return NextResponse.json({ ok: false, error: 'Access denied.' }, { status: 403 })
  const { id } = await params
  try {
    const job = await loadUniversalJob(createAccessGovernanceAdminClient(), id)
    if (!job) return NextResponse.json({ ok: false, error: 'Scanner job was not found.' }, { status: 404 })
    return NextResponse.json({ ok: true, job })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Unable to load scanner job.' }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await getCurrentAppUser()
  if (!actor) return NextResponse.json({ ok: false, error: 'Authentication required.' }, { status: 401 })
  if (!canManageUniversalAuthorizationCommand(actor)) return NextResponse.json({ ok: false, error: 'Access denied.' }, { status: 403 })
  const { id } = await params
  const body = await request.json().catch(() => ({}))
  const action = body && typeof body === 'object' && 'action' in body ? String(body.action) : 'continue'
  try {
    const client = createAccessGovernanceAdminClient()
    if (['pause', 'resume', 'cancel'].includes(action)) {
      const job = await controlUniversalAuthorizationScan(client, id, action as 'pause' | 'resume' | 'cancel')
      return NextResponse.json({ ok: true, job })
    }
    const chunkSize = body && typeof body === 'object' && 'chunkSize' in body ? Number(body.chunkSize) : 20
    const result = await continueUniversalAuthorizationScan(client, id, Number.isFinite(chunkSize) ? Math.max(1, Math.min(chunkSize, 50)) : 20)
    return NextResponse.json({ ok: true, ...result })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Unable to control scanner job.' }, { status: 500 })
  }
}
