import { NextRequest, NextResponse } from 'next/server'
import { Angelcare360AccessError } from '@/lib/angelcare360/server/context'
import { executeInstitutionAreaAction, getInstitutionsSitesSnapshot } from '@/lib/angelcare360/server/institutions-sites'
import type { InstitutionAreaActionRequest } from '@/types/angelcare360/institutions-sites'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function failure(error: unknown) {
  const message = error instanceof Error ? error.message : 'L’espace Établissements ne peut pas terminer cette action.'
  const status = error instanceof Angelcare360AccessError ? error.status : 400
  return NextResponse.json({ ok: false, message }, { status })
}

export async function GET() {
  try {
    return NextResponse.json({ ok: true, snapshot: await getInstitutionsSitesSnapshot() })
  } catch (error) {
    return failure(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as InstitutionAreaActionRequest
    return NextResponse.json(await executeInstitutionAreaAction(body))
  } catch (error) {
    return failure(error)
  }
}
