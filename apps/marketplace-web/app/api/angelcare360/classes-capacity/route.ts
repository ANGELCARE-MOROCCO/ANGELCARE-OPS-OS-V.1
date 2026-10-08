import { publicAngelcare360Error } from '@/lib/angelcare360/server/public-error'
import { NextRequest, NextResponse } from 'next/server'
import { Angelcare360AccessError } from '@/lib/angelcare360/server/context'
import { executeClassesCapacityAction, getClassesCapacitySnapshot } from '@/lib/angelcare360/server/classes-capacity-area'
import type { CapacityActionRequest } from '@/types/angelcare360/classes-capacity-area'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function failure(error: unknown) {
  const message = publicAngelcare360Error(error)
  const status = error instanceof Angelcare360AccessError ? error.status : 400
  return NextResponse.json({ ok: false, message }, { status })
}

export async function GET() {
  try { return NextResponse.json({ ok: true, snapshot: await getClassesCapacitySnapshot() }) }
  catch (error) { return failure(error) }
}

export async function POST(request: NextRequest) {
  try { return NextResponse.json(await executeClassesCapacityAction(await request.json() as CapacityActionRequest)) }
  catch (error) { return failure(error) }
}
