import { NextRequest, NextResponse } from 'next/server'
import {
  blockAngelcare360ExportAttempt,
  cancelAngelcare360ReportRequest,
  createAngelcare360ReportRequest,
  createAngelcare360ReportTemplate,
  getAngelcare360DocumentGovernanceReadiness,
  getAngelcare360DocumentsOverview,
  getAngelcare360ExportOverview,
  getAngelcare360ReportsOverview,
  listAngelcare360DocumentAuditEvents,
  listAngelcare360DocumentTemplates,
  listAngelcare360ExportAuditEvents,
  listAngelcare360ExportFiles,
  listAngelcare360ExportHistory,
  listAngelcare360ReportAuditEvents,
  listAngelcare360ReportCatalogue,
  listAngelcare360ReportHistory,
  listAngelcare360ReportRequests,
  listAngelcare360ReportTemplates,
  updateAngelcare360DocumentTemplate,
  updateAngelcare360ReportTemplate,
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

  if (mode === 'catalogue') {
    const catalogue = await listAngelcare360ReportCatalogue({ schoolId })
    return NextResponse.json({ ok: true, catalogue }, { status: 200 })
  }
  if (mode === 'templates') {
    const templates = await listAngelcare360ReportTemplates({ schoolId })
    return NextResponse.json({ ok: true, templates }, { status: 200 })
  }
  if (mode === 'requests') {
    const requests = await listAngelcare360ReportRequests({ schoolId })
    return NextResponse.json({ ok: true, requests }, { status: 200 })
  }
  if (mode === 'history') {
    const history = await listAngelcare360ReportHistory({ schoolId })
    return NextResponse.json({ ok: true, history }, { status: 200 })
  }
  if (mode === 'audit') {
    const events = await listAngelcare360ReportAuditEvents({ schoolId, filters: {} })
    return NextResponse.json({ ok: true, events }, { status: 200 })
  }
  if (mode === 'export-audit') {
    const events = await listAngelcare360ExportAuditEvents({ schoolId, filters: {} })
    return NextResponse.json({ ok: true, events }, { status: 200 })
  }
  if (mode === 'document-audit') {
    const events = await listAngelcare360DocumentAuditEvents({ schoolId, filters: {} })
    return NextResponse.json({ ok: true, events }, { status: 200 })
  }
  if (mode === 'export-overview') {
    const overview = await getAngelcare360ExportOverview({ schoolId })
    return NextResponse.json({ ok: Boolean(overview), overview }, { status: overview ? 200 : 404 })
  }
  if (mode === 'document-governance') {
    const readiness = await getAngelcare360DocumentGovernanceReadiness({ schoolId })
    return NextResponse.json({ ok: Boolean(readiness), readiness }, { status: readiness ? 200 : 404 })
  }
  if (mode === 'document-overview') {
    const overview = await getAngelcare360DocumentsOverview({ schoolId })
    return NextResponse.json({ ok: Boolean(overview), overview }, { status: overview ? 200 : 404 })
  }
  const overview = await getAngelcare360ReportsOverview({ schoolId })
  return NextResponse.json({ ok: Boolean(overview), overview }, { status: overview ? 200 : 404 })
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => null)) as Body | null
    if (!body?.entity || !body.operation) {
      return NextResponse.json({ ok: false, error: 'La requête rapports est incomplète.' }, { status: 422 })
    }
    const payload = normalizePayload(body)

    if (body.entity === 'template') {
      if (body.operation === 'create') return NextResponse.json(await createAngelcare360ReportTemplate(payload), { status: 200 })
      if (body.operation === 'update') return NextResponse.json(await updateAngelcare360ReportTemplate(payload), { status: 200 })
    }

    if (body.entity === 'request') {
      if (body.operation === 'create') return NextResponse.json(await createAngelcare360ReportRequest(payload), { status: 200 })
      if (body.operation === 'cancel') return NextResponse.json(await cancelAngelcare360ReportRequest(payload), { status: 200 })
    }

    if (body.entity === 'export' && body.operation === 'block') {
      return NextResponse.json(await blockAngelcare360ExportAttempt(payload), { status: 200 })
    }

    return NextResponse.json({ ok: false, error: 'Entité rapports inconnue.' }, { status: 400 })
  } catch (error) {
    if (error instanceof Angelcare360AccessError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: error.status })
    }
    const message = error instanceof Error ? error.message : 'Erreur inattendue'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
