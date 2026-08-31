import { publicAngelcare360Error } from '@/lib/angelcare360/server/public-error'
import { NextRequest, NextResponse } from 'next/server'
import { Angelcare360AccessError } from '@/lib/angelcare360/server/context'
import { decideFinanceAuthorityApproval, executeFinanceAuthorityCommand, getFinanceAuthoritySnapshot } from '@/lib/angelcare360/server/finance-authority'
import type { FinanceAuthorityCommandRequest, FinanceAuthorityScene } from '@/types/angelcare360/customer-finance-authority'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const SCENES = new Set<FinanceAuthorityScene>(['command','billing','payments','collections','expenses','documents'])

export async function GET(request: NextRequest) {
  try {
    const sceneValue = request.nextUrl.searchParams.get('scene') || 'command'
    const scene = SCENES.has(sceneValue as FinanceAuthorityScene) ? sceneValue as FinanceAuthorityScene : 'command'
    const snapshot = await getFinanceAuthoritySnapshot(scene)
    return NextResponse.json({ ok: true, snapshot })
  } catch (error) {
    if (error instanceof Angelcare360AccessError) return NextResponse.json({ ok: false, error: error.message }, { status: error.status })
    return NextResponse.json({ ok: false, error: publicAngelcare360Error(error) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null) as (FinanceAuthorityCommandRequest & { approvalId?: string; decision?: 'approved' | 'rejected' }) | null
    if (!body) return NextResponse.json({ ok: false, error: 'La commande financière est vide.' }, { status: 422 })
    if (body.operationKey === 'finance.approval.decide') {
      if (!body.approvalId || !body.decision || !body.reason) return NextResponse.json({ ok: false, error: 'Décision, approbation et motif sont requis.' }, { status: 422 })
      const result = await decideFinanceAuthorityApproval({ approvalId: body.approvalId, decision: body.decision, reason: body.reason })
      return NextResponse.json(result, { status: result.ok ? 200 : 409 })
    }
    if (!body.operationKey) return NextResponse.json({ ok: false, error: 'L’opération financière est requise.' }, { status: 422 })
    const result = await executeFinanceAuthorityCommand(body)
    return NextResponse.json(result, { status: result.ok ? 200 : 409 })
  } catch (error) {
    if (error instanceof Angelcare360AccessError) return NextResponse.json({ ok: false, error: error.message }, { status: error.status })
    return NextResponse.json({ ok: false, error: publicAngelcare360Error(error) }, { status: 500 })
  }
}
