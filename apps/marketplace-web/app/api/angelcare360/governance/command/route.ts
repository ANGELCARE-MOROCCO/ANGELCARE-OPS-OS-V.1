import { NextRequest, NextResponse } from 'next/server'
import { Angelcare360AccessError } from '@/lib/angelcare360/server/context'
import {
  createGovernanceEntity,
  executeGovernanceEntityAction,
  executeGovernanceMatterAction,
  generateGovernanceBriefing,
  getGovernanceCommandSnapshot,
} from '@/lib/angelcare360/server/governance-command'
import type {
  GovernanceBriefing,
  GovernanceCreateRequest,
  GovernanceEntityActionRequest,
  GovernanceMatterActionRequest,
} from '@/types/angelcare360/governance-command'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function failure(error: unknown) {
  const message = error instanceof Error ? error.message : 'Échec inattendu du commandement Gouvernance.'
  const status = error instanceof Angelcare360AccessError ? error.status : 400
  return NextResponse.json({ ok: false, message }, { status })
}

export async function GET() {
  try {
    return NextResponse.json({ ok: true, snapshot: await getGovernanceCommandSnapshot() })
  } catch (error) {
    return failure(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as Record<string, unknown>
    const command = String(body.command || '')
    if (command === 'matter_action') return NextResponse.json(await executeGovernanceMatterAction(body.payload as GovernanceMatterActionRequest))
    if (command === 'entity_action') return NextResponse.json(await executeGovernanceEntityAction(body.payload as GovernanceEntityActionRequest))
    if (command === 'entity_create') return NextResponse.json(await createGovernanceEntity(body.payload as GovernanceCreateRequest))
    if (command === 'briefing_generate') {
      const payload = body.payload as { briefingType?: GovernanceBriefing['briefingType']; idempotencyKey?: string | null }
      return NextResponse.json(await generateGovernanceBriefing({ briefingType: payload.briefingType || 'weekly', idempotencyKey: payload.idempotencyKey || null }))
    }
    return NextResponse.json({ ok: false, message: 'Commande Gouvernance inconnue.' }, { status: 400 })
  } catch (error) {
    return failure(error)
  }
}
