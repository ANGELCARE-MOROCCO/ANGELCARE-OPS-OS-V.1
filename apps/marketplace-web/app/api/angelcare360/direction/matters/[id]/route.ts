import { publicAngelcare360Error } from '@/lib/angelcare360/server/public-error'
import { NextRequest, NextResponse } from 'next/server'
import { Angelcare360AccessError } from '@/lib/angelcare360/server/context'
import { executeDirectionMatterAction, getDirectionMatterDetail } from '@/lib/angelcare360/server/direction-command'
import type { DirectionMatterActionRequest } from '@/types/angelcare360/direction-command'

export const dynamic = 'force-dynamic'

function errorResponse(error: unknown) {
  const message = publicAngelcare360Error(error)
  const status = error instanceof Angelcare360AccessError ? error.status : 400
  return NextResponse.json({ ok: false, message }, { status })
}

export async function GET(_: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const matter = await getDirectionMatterDetail(id)
    if (!matter) return NextResponse.json({ ok: false, message: 'Matter introuvable.' }, { status: 404 })
    return NextResponse.json({ ok: true, matter })
  } catch (error) {
    return errorResponse(error)
  }
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const payload = await request.json() as Omit<DirectionMatterActionRequest, 'matterId'>
    return NextResponse.json(await executeDirectionMatterAction({ ...payload, matterId: id }))
  } catch (error) {
    return errorResponse(error)
  }
}
