import { NextRequest, NextResponse } from 'next/server'
import { Angelcare360AccessError } from '@/lib/angelcare360/server/context'
import { executeAcademicStructureAction, getAcademicStructureDetail } from '@/lib/angelcare360/server/academic-structure-area'
import type { AcademicDossierKind, AcademicStructureActionRequest } from '@/types/angelcare360/academic-structure-area'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function failure(error: unknown) {
  const message = error instanceof Error ? error.message : 'Le dossier académique ne peut pas être chargé.'
  const status = error instanceof Angelcare360AccessError ? error.status : 400
  return NextResponse.json({ ok: false, message }, { status })
}

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const kind = (request.nextUrl.searchParams.get('kind') || 'academic_year') as AcademicDossierKind
    return NextResponse.json({ ok: true, record: await getAcademicStructureDetail(id, kind) })
  } catch (error) {
    return failure(error)
  }
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const body = await request.json() as AcademicStructureActionRequest
    const kind = request.nextUrl.searchParams.get('kind') || 'academic_year'
    return NextResponse.json(await executeAcademicStructureAction({
      ...body,
      academicYearId: body.academicYearId || (kind === 'academic_year' ? id : null),
      periodId: body.periodId || (kind === 'period' ? id : null),
      transitionRunId: body.transitionRunId || (kind === 'transition' ? id : null),
    }))
  } catch (error) {
    return failure(error)
  }
}
