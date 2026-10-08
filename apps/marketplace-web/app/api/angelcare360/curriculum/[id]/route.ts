import { publicAngelcare360Error } from '@/lib/angelcare360/server/public-error'
import { NextRequest, NextResponse } from 'next/server'
import { Angelcare360AccessError } from '@/lib/angelcare360/server/context'
import { executeCurriculumAction, getCurriculumDossier } from '@/lib/angelcare360/server/curriculum-area'
import type { CurriculumActionRequest, CurriculumDossierKind } from '@/types/angelcare360/curriculum-area'

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
    const kind = (request.nextUrl.searchParams.get('kind') || 'subject') as CurriculumDossierKind
    return NextResponse.json({ ok: true, record: await getCurriculumDossier(kind, id) })
  } catch (error) { return failure(error) }
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const body = await request.json() as CurriculumActionRequest
    const kind = request.nextUrl.searchParams.get('kind') || 'subject'
    return NextResponse.json(await executeCurriculumAction({
      ...body,
      subjectId: body.subjectId || (kind === 'subject' ? id : null),
      curriculumId: body.curriculumId || (kind === 'curriculum' ? id : null),
      evaluationPolicyId: body.evaluationPolicyId || (kind === 'evaluation_policy' ? id : null),
      resourceId: body.resourceId || (kind === 'resource' ? id : null),
      issueId: body.issueId || (kind === 'issue' ? id : null),
    }))
  } catch (error) { return failure(error) }
}
