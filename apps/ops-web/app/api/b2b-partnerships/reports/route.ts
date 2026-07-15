import { NextRequest, NextResponse } from 'next/server'
import { getCurrentB2BAppUser, getServerB2BDatabaseClient } from '@/lib/b2b-partnerships/runtime'
import { requireB2BPermission } from '@/lib/b2b-partnerships/permissions'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const TABLE = 'b2b_workspace_reports'

type AnyRecord = Record<string, any>

function json(data: AnyRecord, status = 200) {
  return NextResponse.json(data, { status, headers: { 'Cache-Control': 'no-store' } })
}

function text(value: unknown, fallback = '') {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

function asArray(value: unknown) {
  return Array.isArray(value) ? value : []
}

function asObject(value: unknown) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as AnyRecord : {}
}

function stableId(body: AnyRecord) {
  if (body.id && typeof body.id === 'string') return body.id
  const type = text(body.report_type || body.purpose, 'report').toLowerCase().replace(/[^a-z0-9]+/g, '-')
  const stamp = Date.now().toString(36)
  return `report-${type}-${stamp}`
}

async function guard(action: 'read' | 'create' | 'update' | 'archive' = 'read') {
  const db = await getServerB2BDatabaseClient()
  const actor = await getCurrentB2BAppUser()

  if (!actor?.id) {
    return { ok: false as const, db, actor, response: json({ ok: false, data: [], error: 'Authentication required.' }, 401) }
  }

  const permission = requireB2BPermission(action, {
    actorId: actor.id,
    actorRole: actor.role || actor.role_key,
    permissions: actor.permissions,
  })

  if (!permission.ok) {
    return { ok: false as const, db, actor, response: json({ ok: false, data: [], error: permission.error }, permission.status) }
  }

  return { ok: true as const, db, actor }
}

function normalizeReport(row: AnyRecord) {
  const payload = asObject(row.payload)
  const source = { ...payload, ...row }
  const reportType = text(source.report_type, text(source.purpose, 'weekly'))
  const purpose = text(source.purpose, reportType)
  const summary = text(source.summary, text(source.executiveSummary, ''))
  const alerts = asArray(source.alerts)
  const congratulations = asArray(source.congratulations)
  const coaching = asArray(source.coaching)
  const revenueMoves = asArray(source.revenueMoves)
  const reminders = asArray(source.reminders)
  const marketInsights = asArray(source.marketInsights)
  const kpis = asArray(source.kpis)
  const actionPlan = asArray(source.actionPlan)
  const kind = text(source.kind, purpose === 'weekly' || reportType === 'weekly' ? 'weekly' : 'premium')

  return {
    id: text(source.id, stableId(source)),
    kind,
    report_type: reportType,
    reportType,
    purpose,
    sector: text(source.sector, 'all'),
    title: text(source.title, text(source.name, `${reportType} report`)),
    reference: text(source.reference, text(source.reference_code, text(source.reference_number, ''))),
    period: text(source.period, ''),
    period_start: text(source.period_start, ''),
    period_end: text(source.period_end, ''),
    status: text(source.status, 'Generated'),
    generatedAt: text(source.generatedAt || source.generated_at, text(source.created_at, new Date().toISOString())),
    owner: text(source.owner, text(source.owner_id, 'ANGELCARE Controller Agent')),
    executiveSummary: text(source.executiveSummary || source.executive_summary, summary),
    alerts,
    congratulations,
    coaching,
    revenueMoves,
    reminders,
    marketInsights,
    kpis,
    actionPlan,
    summary,
    best_opportunities: text(source.best_opportunities, ''),
    objections: text(source.objections, ''),
    support_needed: text(source.support_needed, ''),
    next_week_plan: text(source.next_week_plan, ''),
    metrics: source.metrics && typeof source.metrics === 'object' && !Array.isArray(source.metrics) ? source.metrics : {},
    created_at: source.created_at || null,
    updated_at: source.updated_at || null,
    deleted_at: source.deleted_at || null,
    is_active: source.deleted_at ? false : source.is_active !== false,
  }
}

function buildPayload(body: AnyRecord, existing?: AnyRecord) {
  const kind = text(body.kind, body.purpose || body.alerts ? 'premium' : text(existing?.kind, 'weekly'))
  const reportType = text(body.report_type, text(body.purpose, text(existing?.report_type, 'weekly')))
  const summary = text(body.summary, text(body.executiveSummary, text(existing?.summary, '')))

  return {
    id: text(body.id, text(existing?.id, stableId(body || existing || {}))),
    kind,
    report_type: reportType,
    purpose: text(body.purpose, text(existing?.purpose, reportType)),
    sector: text(body.sector, text(existing?.sector, 'all')),
    title: text(body.title, text(existing?.title, text(existing?.report_type, 'Report'))),
    reference: text(body.reference, text(body.reference_code, text(existing?.reference, text(existing?.reference_code, '')))),
    period: text(body.period, text(existing?.period, '')),
    period_start: text(body.period_start, text(existing?.period_start, '')),
    period_end: text(body.period_end, text(existing?.period_end, '')),
    status: text(body.status, text(existing?.status, 'Generated')),
    generated_at: text(body.generatedAt || body.generated_at, text(existing?.generatedAt || existing?.generated_at, new Date().toISOString())),
    owner: text(body.owner, text(body.owner_id, text(existing?.owner, text(existing?.owner_id, 'ANGELCARE Controller Agent')))),
    executive_summary: text(body.executiveSummary || body.executive_summary, text(existing?.executiveSummary || existing?.executive_summary, summary)),
    alerts: asArray(body.alerts ?? existing?.alerts),
    congratulations: asArray(body.congratulations ?? existing?.congratulations),
    coaching: asArray(body.coaching ?? existing?.coaching),
    revenueMoves: asArray(body.revenueMoves ?? existing?.revenueMoves),
    reminders: asArray(body.reminders ?? existing?.reminders),
    marketInsights: asArray(body.marketInsights ?? existing?.marketInsights),
    kpis: asArray(body.kpis ?? existing?.kpis),
    actionPlan: asArray(body.actionPlan ?? existing?.actionPlan),
    summary,
    best_opportunities: text(body.best_opportunities, text(existing?.best_opportunities, '')),
    objections: text(body.objections, text(existing?.objections, '')),
    support_needed: text(body.support_needed, text(existing?.support_needed, '')),
    next_week_plan: text(body.next_week_plan, text(existing?.next_week_plan, '')),
    metrics: body.metrics && typeof body.metrics === 'object' && !Array.isArray(body.metrics) ? body.metrics : (existing?.metrics && typeof existing.metrics === 'object' && !Array.isArray(existing.metrics) ? existing.metrics : {}),
    payload: body.payload && typeof body.payload === 'object' ? body.payload : body,
    deleted_at: body.deleted_at ?? existing?.deleted_at ?? null,
    is_active: body.is_active ?? existing?.is_active ?? true,
    created_at: body.created_at ?? existing?.created_at ?? new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by: body.created_by ?? existing?.created_by ?? null,
    updated_by: body.updated_by ?? existing?.updated_by ?? null,
  }
}

async function saveReport(req: NextRequest) {
  const action = req.method === 'DELETE' ? 'archive' : (req.method === 'POST' ? 'create' : 'update')
  const g = await guard(action)
  if (!g.ok) return g.response

  const body = await req.json().catch(() => ({}))
  const existing = body?.id
    ? (await g.db.from(TABLE).select('*').eq('id', String(body.id)).maybeSingle()).data
    : null

  if (req.method === 'DELETE') {
    const id = text(body.id, text(existing?.id, ''))
    if (!id) return json({ ok: false, data: [], error: 'Missing report id.' }, 400)
    const { data, error } = await g.db.from(TABLE).update({ deleted_at: new Date().toISOString(), is_active: false, updated_by: g.actor?.id ?? null, updated_at: new Date().toISOString() }).eq('id', id).select('*').single()
    if (error) return json({ ok: false, data: [], error: 'Unable to delete report.' }, 500)
    return json({ ok: true, data: normalizeReport(data) })
  }

  const payload = buildPayload(body, existing || undefined)
  const { data, error } = await g.db.from(TABLE).upsert(payload, { onConflict: 'id' }).select('*').single()
  if (error) {
    console.error('[B2B_REPORTS_SAVE_FAILED]', error)
    return json({ ok: false, data: [], error: 'Unable to save report.' }, 500)
  }

  return json({ ok: true, data: normalizeReport(data) }, req.method === 'POST' ? 201 : 200)
}

export async function GET(req: NextRequest) {
  try {
    const g = await guard('read')
    if (!g.ok) return g.response

    const url = new URL(req.url)
    const includeDeleted = url.searchParams.get('include_deleted') === '1'
    const kind = url.searchParams.get('kind') || 'weekly'
    let query = g.db.from(TABLE).select('*').order('updated_at', { ascending: false })
    if (kind !== 'all') query = query.eq('kind', kind)
    if (!includeDeleted) query = query.is('deleted_at', null)

    const { data, error } = await query
    if (error) {
      console.error('[B2B_REPORTS_GET_FAILED]', error)
      return json({ ok: false, data: [], error: error.message }, 200)
    }

    return json({ ok: true, data: (data || []).map(normalizeReport) })
  } catch (error) {
    console.error('[B2B_REPORTS_GET_CRASHED]', error)
    return json({ ok: false, data: [], error: 'Unable to load B2B reports.' }, 500)
  }
}

export async function POST(req: NextRequest) {
  return saveReport(req)
}

export async function PATCH(req: NextRequest) {
  return saveReport(req)
}

export async function DELETE(req: NextRequest) {
  return saveReport(req)
}
