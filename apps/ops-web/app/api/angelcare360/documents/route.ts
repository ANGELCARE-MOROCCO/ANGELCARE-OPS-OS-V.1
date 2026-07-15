import { NextRequest, NextResponse } from 'next/server'
import {
  createAngelcare360DocumentTemplate,
  getAngelcare360DocumentGovernanceReadiness,
  getAngelcare360DocumentsOverview,
  listAngelcare360DocumentAuditEvents,
  listAngelcare360DocumentTemplates,
  listAngelcare360GeneratedDocuments,
  updateAngelcare360DocumentTemplate,
} from '@/lib/angelcare360/server/reports'
import { Angelcare360AccessError } from '@/lib/angelcare360/server/context'

export const runtime = 'nodejs'

type Body = {
  entity?: string
  operation?: string
  id?: string
  payload?: Record<string, unknown>
}

function normalizePayload(body: Body): Record<string, unknown> {
  return {
    ...(body.payload || {}),
    id: body.id || body.payload?.id || null,
  }
}

export async function GET(request: NextRequest) {
  const schoolId = request.nextUrl.searchParams.get('schoolId')
  const mode = request.nextUrl.searchParams.get('mode') || 'overview'

  if (mode === 'generated') {
    const documents = await listAngelcare360GeneratedDocuments({ schoolId })
    return NextResponse.json({ ok: true, documents }, { status: 200 })
  }
  if (mode === 'templates') {
    const templates = await listAngelcare360DocumentTemplates({ schoolId })
    return NextResponse.json({ ok: true, templates }, { status: 200 })
  }
  if (mode === 'governance') {
    const readiness = await getAngelcare360DocumentGovernanceReadiness({ schoolId })
    return NextResponse.json({ ok: Boolean(readiness), readiness }, { status: readiness ? 200 : 404 })
  }
  if (mode === 'audit') {
    const events = await listAngelcare360DocumentAuditEvents({ schoolId, filters: {} })
    return NextResponse.json({ ok: true, events }, { status: 200 })
  }

  const overview = await getAngelcare360DocumentsOverview({ schoolId })
  return NextResponse.json({ ok: Boolean(overview), overview }, { status: overview ? 200 : 404 })
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => null)) as Body | null
    if (!body?.entity || !body.operation) {
      return NextResponse.json({ ok: false, error: 'La requête documents est incomplète.' }, { status: 422 })
    }
    const payload = normalizePayload(body)

    if (body.entity === 'template') {
      if (body.operation === 'create') return NextResponse.json(await createAngelcare360DocumentTemplate(payload), { status: 200 })
      if (body.operation === 'update') return NextResponse.json(await updateAngelcare360DocumentTemplate(payload), { status: 200 })
    }

    return NextResponse.json({ ok: false, error: 'Entité documents inconnue.' }, { status: 400 })
  } catch (error) {
    if (error instanceof Angelcare360AccessError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: error.status })
    }
    const message = error instanceof Error ? error.message : 'Erreur inattendue'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
