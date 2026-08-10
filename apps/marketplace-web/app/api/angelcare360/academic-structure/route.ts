import { NextRequest, NextResponse } from 'next/server'
import { Angelcare360AccessError } from '@/lib/angelcare360/server/context'
import { executeAcademicStructureAction, getAcademicStructureSnapshot } from '@/lib/angelcare360/server/academic-structure-area'
import type { AcademicStructureActionRequest } from '@/types/angelcare360/academic-structure-area'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function failure(error: unknown) {
  const message = error instanceof Error ? error.message : 'L’espace Année scolaire et calendrier ne peut pas terminer cette action.'
  const status = error instanceof Angelcare360AccessError ? error.status : 400
  return NextResponse.json({ ok: false, message }, { status })
}

export async function GET() {
  try {
    return NextResponse.json({ ok: true, snapshot: await getAcademicStructureSnapshot() })
  } catch (error) {
    return failure(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as AcademicStructureActionRequest
    return NextResponse.json(await executeAcademicStructureAction(body))
  } catch (error) {
    return failure(error)
  }
}
