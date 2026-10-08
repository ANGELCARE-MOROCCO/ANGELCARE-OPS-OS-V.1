import { publicAngelcare360Error } from '@/lib/angelcare360/server/public-error'
import { NextRequest, NextResponse } from 'next/server'
import { Angelcare360AccessError } from '@/lib/angelcare360/server/context'
import { actOnDirectionDecision, createDirectionDecision } from '@/lib/angelcare360/server/direction-command'
import type { DirectionDecisionActionRequest, DirectionDecisionCreateRequest } from '@/types/angelcare360/direction-command'

export const dynamic = 'force-dynamic'

function errorResponse(error: unknown) {
  const message = publicAngelcare360Error(error)
  const status = error instanceof Angelcare360AccessError ? error.status : 400
  return NextResponse.json({ ok: false, message }, { status })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { action?: string; payload?: unknown }
    if (body.action === 'create') return NextResponse.json(await createDirectionDecision(body.payload as DirectionDecisionCreateRequest))
    return NextResponse.json(await actOnDirectionDecision(body.payload as DirectionDecisionActionRequest))
  } catch (error) {
    return errorResponse(error)
  }
}
