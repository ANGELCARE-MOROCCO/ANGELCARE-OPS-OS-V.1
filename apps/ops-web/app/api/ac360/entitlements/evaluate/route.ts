import { NextRequest, NextResponse } from 'next/server'
import { evaluateAc360Access } from '@/lib/ac360/foundation'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const orgId = String(body.orgId || body.org_id || '')
    const featureKey = String(body.featureKey || body.feature_key || '')
    const actionKey = body.actionKey || body.action_key ? String(body.actionKey || body.action_key) : undefined
    const quantity = Number(body.quantity || 1)

    const decision = await evaluateAc360Access({ orgId, featureKey, actionKey, quantity })
    return NextResponse.json({ ok: decision.decision !== 'error', decision }, { status: decision.decision === 'error' ? 400 : 200 })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'AC360 entitlement evaluation failed.' }, { status: 500 })
  }
}
