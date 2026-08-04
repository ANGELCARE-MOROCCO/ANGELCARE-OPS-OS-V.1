import { NextRequest, NextResponse } from 'next/server'
import { Angelcare360AccessError } from '@/lib/angelcare360/server/context'
import {
  actOnDirectionDecision,
  createDirectionDecision,
  executeDirectionMatterAction,
  generateDirectionBriefing,
  getDirectionCommandSnapshot,
} from '@/lib/angelcare360/server/direction-command'
import type {
  DirectionDecisionActionRequest,
  DirectionDecisionCreateRequest,
  DirectionMatterActionRequest,
} from '@/types/angelcare360/direction-command'

export const dynamic = 'force-dynamic'

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : 'Échec inattendu du commandement Direction.'
  const status = error instanceof Angelcare360AccessError ? error.status : 400
  return NextResponse.json({ ok: false, message }, { status })
}

export async function GET() {
  try {
    return NextResponse.json({ ok: true, snapshot: await getDirectionCommandSnapshot() })
  } catch (error) {
    return errorResponse(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as Record<string, unknown>
    const command = String(body.command || '')
    if (command === 'matter_action') {
      return NextResponse.json(await executeDirectionMatterAction(body.payload as DirectionMatterActionRequest))
    }
    if (command === 'decision_create') {
      return NextResponse.json(await createDirectionDecision(body.payload as DirectionDecisionCreateRequest))
    }
    if (command === 'decision_action') {
      return NextResponse.json(await actOnDirectionDecision(body.payload as DirectionDecisionActionRequest))
    }
    if (command === 'briefing_generate') {
      const payload = body.payload as { briefingType?: string; siteId?: string | null; idempotencyKey?: string | null }
      return NextResponse.json(await generateDirectionBriefing({
        briefingType: (payload.briefingType || 'morning') as Parameters<typeof generateDirectionBriefing>[0]['briefingType'],
        siteId: payload.siteId || null,
        idempotencyKey: payload.idempotencyKey || null,
      }))
    }
    return NextResponse.json({ ok: false, message: 'Commande Direction inconnue.' }, { status: 400 })
  } catch (error) {
    return errorResponse(error)
  }
}
