import { NextRequest, NextResponse } from 'next/server'
import { getCurrentB2BAppUser, getServerB2BDatabaseClient } from '@/lib/b2b-partnerships/runtime'
import { requireB2BPermission } from '@/lib/b2b-partnerships/permissions'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const TABLE = 'b2b_workspace_automation_rules'

type AnyRecord = Record<string, any>

function json(data: AnyRecord, status = 200) {
  return NextResponse.json(data, { status, headers: { 'Cache-Control': 'no-store' } })
}

function text(value: unknown, fallback = '') {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

function bool(value: unknown, fallback = false) {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') return ['true', '1', 'yes', 'on', 'active'].includes(value.toLowerCase())
  if (typeof value === 'number') return value !== 0
  return fallback
}

function asArray(value: unknown) {
  return Array.isArray(value) ? value : []
}

function asObject(value: unknown) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as AnyRecord : {}
}

function severityScore(severity: string) {
  const normalized = severity.toLowerCase()
  if (normalized === 'critical') return 100
  if (normalized === 'high') return 76
  if (normalized === 'medium') return 52
  return 28
}

function stableId(body: AnyRecord) {
  const name = text(body.name, 'automation-rule').toLowerCase().replace(/[^a-z0-9]+/g, '-')
  const sector = text(body.sector, 'all').toLowerCase().replace(/[^a-z0-9]+/g, '-')
  const trigger = text(body.trigger_key || body.trigger, 'manual').toLowerCase().replace(/[^a-z0-9]+/g, '-')
  return `rule-${sector}-${name || 'automation'}-${trigger || 'manual'}`.replace(/-+/g, '-').replace(/^-|-$/g, '')
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

function normalizeRule(row: AnyRecord) {
  const payload = asObject(row.payload)
  const source = { ...payload, ...row }
  const channels = asArray(source.channels)
  const actions = asArray(source.actions)
  const conditions = asObject(source.conditions)
  const status = text(source.status, bool(source.is_active, true) ? 'Active' : 'Paused') as 'Active' | 'Paused' | 'Draft'
  const severity = text(source.severity, 'Medium') as 'Low' | 'Medium' | 'High' | 'Critical'

  return {
    id: text(source.id, stableId(source)),
    name: text(source.name, 'Automation rule'),
    status,
    sector: text(source.sector, 'all'),
    trigger: text(source.trigger, text(source.trigger_key, 'manual')),
    condition: text(source.condition, text(conditions.condition, '')),
    action: text(source.action, text(actions[0]?.title || actions[0]?.action || '', '')),
    cadence: text(source.cadence, 'Immediate'),
    owner: text(source.owner, 'B2B Partnerships Manager'),
    severity,
    channels,
    aiBrief: text(source.aiBrief || source.ai_brief, text(source.description, '')),
    expectedImpact: text(source.expectedImpact || source.expected_impact, ''),
    createdAt: text(source.createdAt || source.created_at, new Date().toISOString()),
    updatedAt: text(source.updatedAt || source.updated_at, new Date().toISOString()),
    deletedAt: source.deleted_at || null,
    trigger_key: text(source.trigger_key, text(source.trigger, 'manual')),
    field_key: text(source.field_key, ''),
    score_delta: Number(source.score_delta ?? severityScore(severity)),
    is_active: bool(source.is_active, status === 'Active'),
    conditions,
    actions,
    created_at: source.created_at || source.createdAt || null,
    updated_at: source.updated_at || source.updatedAt || null,
  }
}

function buildPayload(body: AnyRecord, existing?: AnyRecord) {
  const normalizedStatus = text(body.status, text(existing?.status, bool(body.is_active, existing?.is_active ?? true) ? 'Active' : 'Paused')) as 'Active' | 'Paused' | 'Draft'
  const severity = text(body.severity, text(existing?.severity, 'Medium')) as 'Low' | 'Medium' | 'High' | 'Critical'
  const trigger = text(body.trigger, text(body.trigger_key, text(existing?.trigger, text(existing?.trigger_key, 'manual'))))
  const condition = text(body.condition, text(existing?.condition, text(existing?.conditions?.condition, '')))
  const action = text(body.action, text(existing?.action, text(existing?.actions?.[0]?.title || existing?.actions?.[0]?.action || '', '')))
  const cadence = text(body.cadence, text(existing?.cadence, 'Immediate'))
  const owner = text(body.owner, text(existing?.owner, 'B2B Partnerships Manager'))
  const aiBrief = text(body.aiBrief || body.ai_brief, text(existing?.aiBrief || existing?.ai_brief, ''))
  const expectedImpact = text(body.expectedImpact || body.expected_impact, text(existing?.expectedImpact || existing?.expected_impact, ''))
  const channels = asArray(body.channels ?? existing?.channels)
  const conditions = asObject(body.conditions ?? existing?.conditions)
  const actions = asArray(body.actions ?? existing?.actions)

  return {
    id: text(body.id, text(existing?.id, stableId(body || existing || {}))),
    name: text(body.name, text(existing?.name, 'Automation rule')),
    status: normalizedStatus,
    sector: text(body.sector, text(existing?.sector, 'all')),
    trigger,
    condition,
    action,
    cadence,
    owner,
    severity,
    channels,
    ai_brief: aiBrief,
    expected_impact: expectedImpact,
    trigger_key: text(body.trigger_key, text(existing?.trigger_key, trigger)),
    field_key: text(body.field_key, text(existing?.field_key, '')),
    score_delta: Number(body.score_delta ?? existing?.score_delta ?? severityScore(severity)),
    is_active: bool(body.is_active, normalizedStatus === 'Active'),
    conditions: Object.keys(conditions).length ? conditions : { trigger, condition, sector: text(body.sector, text(existing?.sector, 'all')) },
    actions: actions.length ? actions : [{ type: 'automation_action', title: action, channels }],
    deleted_at: body.deleted_at ?? existing?.deleted_at ?? null,
    created_at: body.created_at ?? existing?.created_at ?? new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by: body.created_by ?? existing?.created_by ?? null,
    updated_by: body.updated_by ?? existing?.updated_by ?? null,
    payload: body.payload && typeof body.payload === 'object' ? body.payload : body,
  }
}

async function saveRule(req: NextRequest) {
  const action = req.method === 'DELETE' ? 'archive' : (req.method === 'POST' ? 'create' : 'update')
  const g = await guard(action)
  if (!g.ok) return g.response

  const body = await req.json().catch(() => ({}))
  const existing = body?.id
    ? (await g.db.from(TABLE).select('*').eq('id', String(body.id)).maybeSingle()).data
    : null

  const payload = buildPayload(body, existing || undefined)

  if (req.method === 'DELETE') {
    const id = text(body.id, text(existing?.id, ''))
    if (!id) return json({ ok: false, data: [], error: 'Missing rule id.' }, 400)
    const { data, error } = await g.db.from(TABLE).update({ deleted_at: new Date().toISOString(), is_active: false, status: 'Archived', updated_by: g.actor?.id ?? null, updated_at: new Date().toISOString() }).eq('id', id).select('*').single()
    if (error) return json({ ok: false, data: [], error: 'Unable to delete automation rule.' }, 500)
    return json({ ok: true, data: normalizeRule(data) })
  }

  const { data, error } = await g.db.from(TABLE).upsert(payload, { onConflict: 'id' }).select('*').single()
  if (error) {
    console.error('[B2B_AUTOMATION_RULES_SAVE_FAILED]', error)
    return json({ ok: false, data: [], error: 'Unable to save automation rule.' }, 500)
  }

  return json({ ok: true, data: normalizeRule(data) }, req.method === 'POST' ? 201 : 200)
}

export async function GET(req: NextRequest) {
  try {
    const g = await guard('read')
    if (!g.ok) return g.response

    const url = new URL(req.url)
    const includeDeleted = url.searchParams.get('include_deleted') === '1'
    let query = g.db.from(TABLE).select('*').order('updated_at', { ascending: false })
    if (!includeDeleted) query = query.is('deleted_at', null)

    const { data, error } = await query
    if (error) {
      console.error('[B2B_AUTOMATION_RULES_GET_FAILED]', error)
      return json({ ok: false, data: [], error: error.message }, 200)
    }

    return json({ ok: true, data: (data || []).map(normalizeRule) })
  } catch (error) {
    console.error('[B2B_AUTOMATION_RULES_GET_CRASHED]', error)
    return json({ ok: false, data: [], error: 'Unable to load automation rules.' }, 500)
  }
}

export async function POST(req: NextRequest) {
  return saveRule(req)
}

export async function PATCH(req: NextRequest) {
  return saveRule(req)
}

export async function DELETE(req: NextRequest) {
  return saveRule(req)
}
