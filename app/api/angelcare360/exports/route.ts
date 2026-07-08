import { NextRequest, NextResponse } from 'next/server'
import {
  blockAngelcare360ExportAttempt,
  getAngelcare360ExportOverview,
  getAngelcare360PdfA4Readiness,
  getAngelcare360CsvXlsxReadiness,
  listAngelcare360ExportAuditEvents,
  listAngelcare360ExportFiles,
  listAngelcare360ExportHistory,
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

  if (mode === 'files') {
    const files = await listAngelcare360ExportFiles({ schoolId })
    return NextResponse.json({ ok: true, files }, { status: 200 })
  }
  if (mode === 'pdf-a4') {
    const readiness = await getAngelcare360PdfA4Readiness({ schoolId })
    return NextResponse.json({ ok: Boolean(readiness), readiness }, { status: readiness ? 200 : 404 })
  }
  if (mode === 'csv-xlsx') {
    const readiness = await getAngelcare360CsvXlsxReadiness({ schoolId })
    return NextResponse.json({ ok: Boolean(readiness), readiness }, { status: readiness ? 200 : 404 })
  }
  if (mode === 'history') {
    const history = await listAngelcare360ExportHistory({ schoolId })
    return NextResponse.json({ ok: true, history }, { status: 200 })
  }
  if (mode === 'audit') {
    const events = await listAngelcare360ExportAuditEvents({ schoolId, filters: {} })
    return NextResponse.json({ ok: true, events }, { status: 200 })
  }

  const overview = await getAngelcare360ExportOverview({ schoolId })
  return NextResponse.json({ ok: Boolean(overview), overview }, { status: overview ? 200 : 404 })
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => null)) as Body | null
    if (!body?.entity || !body.operation) {
      return NextResponse.json({ ok: false, error: 'La requête export est incomplète.' }, { status: 422 })
    }
    const payload = normalizePayload(body)

    if (body.entity === 'export' && body.operation === 'block') {
      return NextResponse.json(await blockAngelcare360ExportAttempt(payload), { status: 200 })
    }

    return NextResponse.json({ ok: false, error: 'Entité export inconnue.' }, { status: 400 })
  } catch (error) {
    if (error instanceof Angelcare360AccessError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: error.status })
    }
    const message = error instanceof Error ? error.message : 'Erreur inattendue'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
