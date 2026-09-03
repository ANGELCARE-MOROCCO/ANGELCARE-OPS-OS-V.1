import { publicAngelcare360Error } from '@/lib/angelcare360/server/public-error'
import { NextRequest, NextResponse } from 'next/server'
import { publishAngelcare360AcademicCalendar } from '@/lib/angelcare360/server/academic-years-overview'
import { Angelcare360AccessError, assertAngelcare360DemoOperationAllowed } from '@/lib/angelcare360/server/context'

export const runtime = 'nodejs'

type AcademicYearsMutationBody = {
  operation?: string
  schoolId?: string
  academicYearId?: string
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null) as AcademicYearsMutationBody | null
    await assertAngelcare360DemoOperationAllowed(`academic-year.${body?.operation || ''}`)
    if (!body?.operation || !body.schoolId || !body.academicYearId) {
      return NextResponse.json({ ok: false, error: 'La requête calendrier académique est incomplète.' }, { status: 422 })
    }

    if (body.operation === 'publish-calendar') {
      const result = await publishAngelcare360AcademicCalendar({
        schoolId: body.schoolId,
        academicYearId: body.academicYearId,
      })
      return NextResponse.json(result, { status: result.ok ? 200 : 400 })
    }

    return NextResponse.json({ ok: false, error: 'Opération calendrier académique inconnue.' }, { status: 400 })
  } catch (error) {
    if (error instanceof Angelcare360AccessError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: error.status })
    }
    return NextResponse.json({ ok: false, error: publicAngelcare360Error(error) }, { status: 500 })
  }
}
