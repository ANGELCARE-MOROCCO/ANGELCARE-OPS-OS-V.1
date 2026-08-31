import { publicAngelcare360Error } from '@/lib/angelcare360/server/public-error'
import { NextRequest, NextResponse } from 'next/server'
import { Angelcare360AccessError } from '@/lib/angelcare360/server/context'
import { executeInstitutionAreaAction, getInstitutionSiteDetail } from '@/lib/angelcare360/server/institutions-sites'
import type { InstitutionAreaActionRequest, InstitutionKind } from '@/types/angelcare360/institutions-sites'

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
    const kind = (request.nextUrl.searchParams.get('kind') || 'school') as InstitutionKind
    return NextResponse.json({ ok: true, record: await getInstitutionSiteDetail(id, kind) })
  } catch (error) {
    return failure(error)
  }
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const body = await request.json() as InstitutionAreaActionRequest
    return NextResponse.json(await executeInstitutionAreaAction({ ...body, institutionId: id }))
  } catch (error) {
    return failure(error)
  }
}
