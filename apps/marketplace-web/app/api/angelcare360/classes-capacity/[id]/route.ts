import { publicAngelcare360Error } from '@/lib/angelcare360/server/public-error'
import { NextRequest, NextResponse } from 'next/server'
import { Angelcare360AccessError } from '@/lib/angelcare360/server/context'
import { executeClassesCapacityAction, getClassesCapacityDetail } from '@/lib/angelcare360/server/classes-capacity-area'
import type { CapacityActionRequest, CapacityDossierKind } from '@/types/angelcare360/classes-capacity-area'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function failure(error: unknown) {
  const message = publicAngelcare360Error(error)
  const status = error instanceof Angelcare360AccessError ? error.status : 400
  return NextResponse.json({ ok: false, message }, { status })
}

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const kind = (request.nextUrl.searchParams.get('kind') || 'class') as CapacityDossierKind
    return NextResponse.json({ ok: true, record: await getClassesCapacityDetail(id, kind) })
  } catch (error) { return failure(error) }
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const body = await request.json() as CapacityActionRequest
    const kind = request.nextUrl.searchParams.get('kind') || 'class'
    return NextResponse.json(await executeClassesCapacityAction({
      ...body,
      classId: body.classId || (kind === 'class' ? id : null),
      sectionId: body.sectionId || (kind === 'section' ? id : null),
      reservationId: body.reservationId || (kind === 'reservation' ? id : null),
      movementRunId: body.movementRunId || (kind === 'movement' ? id : null),
      issueId: body.issueId || (kind === 'issue' ? id : null),
    }))
  } catch (error) { return failure(error) }
}
