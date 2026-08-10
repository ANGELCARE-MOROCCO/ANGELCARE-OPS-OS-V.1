import { NextResponse } from 'next/server'
import { actOnDirectionCommitment, createDirectionCommitment } from '@/lib/angelcare360/server/direction-command'
import { Angelcare360AccessError } from '@/lib/angelcare360/server/context'
import type { DirectionCommitmentActionRequest, DirectionCommitmentCreateRequest } from '@/types/angelcare360/direction-command'

function failure(error: unknown) {
  const status = error instanceof Angelcare360AccessError ? error.status : 400
  return NextResponse.json({ ok: false, message: error instanceof Error ? error.message : 'Commande engagement invalide.' }, { status })
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { action?: 'create' | 'update'; payload?: DirectionCommitmentCreateRequest | DirectionCommitmentActionRequest }
    if (body.action === 'create') return NextResponse.json(await createDirectionCommitment(body.payload as DirectionCommitmentCreateRequest))
    if (body.action === 'update') return NextResponse.json(await actOnDirectionCommitment(body.payload as DirectionCommitmentActionRequest))
    return NextResponse.json({ ok: false, message: "L'action engagement est requise." }, { status: 400 })
  } catch (error) { return failure(error) }
}
