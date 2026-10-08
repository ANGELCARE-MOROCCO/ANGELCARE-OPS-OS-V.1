import { publicAngelcare360Error } from '@/lib/angelcare360/server/public-error'
import { NextRequest, NextResponse } from 'next/server'
import { Angelcare360AccessError } from '@/lib/angelcare360/server/context'
import { executeCurriculumAction, getCurriculumSnapshot } from '@/lib/angelcare360/server/curriculum-area'
import type { CurriculumActionRequest } from '@/types/angelcare360/curriculum-area'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function failure(error: unknown) {
  const message = publicAngelcare360Error(error)
  const status = error instanceof Angelcare360AccessError ? error.status : 400
  return NextResponse.json({ ok: false, message }, { status })
}

export async function GET() {
  try { return NextResponse.json({ ok: true, snapshot: await getCurriculumSnapshot() }) }
  catch (error) { return failure(error) }
}

export async function POST(request: NextRequest) {
  try { return NextResponse.json(await executeCurriculumAction(await request.json() as CurriculumActionRequest)) }
  catch (error) { return failure(error) }
}
