import { NextRequest, NextResponse } from 'next/server'
import { getCurrentB2BAppUser, getServerB2BDatabaseClient } from '@/lib/b2b-partnerships/runtime'
import { requireB2BPermission } from '@/lib/b2b-partnerships/permissions'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const TABLE = 'b2b_workspace_partner_programs'

type AnyRecord = Record<string, any>

function json(data: AnyRecord, status = 200) {
  return NextResponse.json(data, { status, headers: { 'Cache-Control': 'no-store' } })
}

function text(value: unknown, fallback = '') {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

function bool(value: unknown, fallback = true) {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') return ['true', '1', 'yes', 'on', 'active'].includes(value.toLowerCase())
  if (typeof value === 'number') return value !== 0
  return fallback
}

function asArray(value: unknown) {
  return Array.isArray(value) ? value : []
}

function asStringArray(value: unknown) {
  return asArray(value).map((item) => text(item, String(item ?? ''))).filter(Boolean)
}

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function stableId(body: AnyRecord) {
  const sector = text(body.sector, body.category || 'all')
  const name = text(body.name, 'program')
  const priority = text(body.priority, 'B')
  const base = [sector, name, priority].filter(Boolean).map(slug).join('-')
  return `program-${base || Date.now()}`
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

function normalizeProgram(row: AnyRecord) {
  const payload = row.payload && typeof row.payload === 'object' && !Array.isArray(row.payload) ? row.payload as AnyRecord : {}
  const source = { ...payload, ...row }
  const services = asStringArray(source.services)
  const valueProposition = asStringArray(source.value_proposition || source.valueProposition)
  const pricingModels = asStringArray(source.pricing_models || source.pricingModels)
  const isDeleted = Boolean(source.deleted_at || source.is_deleted)
  const name = text(source.name, 'Partner program')
  const sector = text(source.sector, text(source.category, 'all'))
  const category = text(source.category, text(source.sector_focus, sector))

  return {
    id: text(source.id, stableId(source)),
    sector,
    name,
    status: text(source.status, isDeleted ? 'Archived' : 'Ready to pitch'),
    category,
    icon: text(source.icon, '🧭'),
    targetPartners: asStringArray(source.targetPartners || source.target_partners),
    positioning: text(source.positioning, ''),
    executivePitch: text(source.executivePitch || source.executive_pitch, text(source.description, '')),
    valueProposition: valueProposition.length ? valueProposition : services,
    services,
    advantages: asStringArray(source.advantages),
    operatingModel: asStringArray(source.operatingModel || source.operating_model),
    commercialModel: text(source.commercialModel || source.commercial_model, ''),
    rollout: asStringArray(source.rollout),
    kpis: asStringArray(source.kpis),
    activationAssets: asStringArray(source.activationAssets || source.activation_assets),
    riskControls: asStringArray(source.riskControls || source.risk_controls),
    nextAction: text(source.nextAction || source.next_action, ''),
    owner: text(source.owner, 'B2B Partnerships'),
    priority: text(source.priority, 'B'),
    createdAt: text(source.createdAt || source.created_at, new Date().toISOString()),
    updatedAt: text(source.updatedAt || source.updated_at, new Date().toISOString()),
    deletedAt: source.deleted_at || null,
    sector_focus: text(source.sector_focus, category),
    description: text(source.description, text(source.executivePitch || source.executive_pitch, '')),
    pricing_models: pricingModels,
    is_active: bool(source.is_active, !isDeleted),
    created_at: source.created_at || source.createdAt || null,
    updated_at: source.updated_at || source.updatedAt || null,
  }
}

function buildPayload(body: AnyRecord, existing?: AnyRecord) {
  const sector = text(body.sector, text(existing?.sector, text(existing?.category, 'all')))
  const name = text(body.name, text(existing?.name, 'Partner program'))
  const priority = text(body.priority, text(existing?.priority, 'B'))
  const category = text(body.category, text(existing?.category, text(existing?.sector_focus, sector)))
  const services = asStringArray(body.services ?? existing?.services)
  const valueProposition = asStringArray(body.valueProposition ?? body.value_proposition ?? existing?.valueProposition ?? existing?.value_proposition)
  const pricingModels = asStringArray(body.pricing_models ?? body.pricingModels ?? existing?.pricing_models ?? existing?.pricingModels)
  const isDeleted = Boolean(body.deleted_at || body.is_deleted || existing?.deleted_at || existing?.is_deleted)

  return {
    id: text(body.id, text(existing?.id, stableId(body || existing || {}))),
    sector,
    name,
    status: text(body.status, text(existing?.status, isDeleted ? 'Archived' : 'Ready to pitch')),
    category,
    icon: text(body.icon, text(existing?.icon, '🧭')),
    target_partners: asStringArray(body.targetPartners ?? body.target_partners ?? existing?.targetPartners ?? existing?.target_partners),
    positioning: text(body.positioning, text(existing?.positioning, '')),
    executive_pitch: text(body.executivePitch ?? body.executive_pitch, text(existing?.executivePitch ?? existing?.executive_pitch, text(body.description, text(existing?.description, '')))),
    value_proposition: valueProposition.length ? valueProposition : services,
    services,
    advantages: asStringArray(body.advantages ?? existing?.advantages),
    operating_model: asStringArray(body.operatingModel ?? body.operating_model ?? existing?.operatingModel ?? existing?.operating_model),
    commercial_model: text(body.commercialModel ?? body.commercial_model, text(existing?.commercialModel ?? existing?.commercial_model, '')),
    rollout: asStringArray(body.rollout ?? existing?.rollout),
    kpis: asStringArray(body.kpis ?? existing?.kpis),
    activation_assets: asStringArray(body.activationAssets ?? body.activation_assets ?? existing?.activationAssets ?? existing?.activation_assets),
    risk_controls: asStringArray(body.riskControls ?? body.risk_controls ?? existing?.riskControls ?? existing?.risk_controls),
    next_action: text(body.nextAction ?? body.next_action, text(existing?.nextAction ?? existing?.next_action, '')),
    owner: text(body.owner, text(existing?.owner, 'B2B Partnerships')),
    priority,
    created_at: body.created_at ?? existing?.createdAt ?? existing?.created_at ?? new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: body.deleted_at ?? existing?.deleted_at ?? null,
    is_deleted: body.is_deleted ?? existing?.is_deleted ?? false,
    payload: body.payload && typeof body.payload === 'object' ? body.payload : body,
    sector_focus: text(body.sector_focus, category),
    description: text(body.description, text(body.executivePitch ?? body.executive_pitch, '')),
    pricing_models: pricingModels,
    is_active: bool(body.is_active, !isDeleted),
    created_by: body.created_by ?? existing?.created_by ?? null,
    updated_by: body.updated_by ?? existing?.updated_by ?? null,
  }
}

async function saveProgram(req: NextRequest) {
  const action = req.method === 'DELETE' ? 'archive' : (req.method === 'POST' ? 'create' : 'update')
  const g = await guard(action)
  if (!g.ok) return g.response

  const body = await req.json().catch(() => ({}))
  const existing = body?.id
    ? (await g.db.from(TABLE).select('*').eq('id', String(body.id)).maybeSingle()).data
    : null

  if (req.method === 'DELETE') {
    const id = text(body.id, text(existing?.id, ''))
    if (!id) return json({ ok: false, data: [], error: 'Missing program id.' }, 400)
    const { data, error } = await g.db.from(TABLE).update({ deleted_at: new Date().toISOString(), is_deleted: true, is_active: false, status: 'Archived', updated_by: g.actor?.id ?? null, updated_at: new Date().toISOString() }).eq('id', id).select('*').single()
    if (error) return json({ ok: false, data: [], error: 'Unable to delete partner program.' }, 500)
    return json({ ok: true, data: normalizeProgram(data) })
  }

  const payload = buildPayload(body, existing || undefined)
  const { data, error } = await g.db.from(TABLE).upsert(payload, { onConflict: 'id' }).select('*').single()
  if (error) {
    console.error('[B2B_PARTNER_PROGRAMS_SAVE_FAILED]', error)
    return json({ ok: false, data: [], error: 'Unable to save partner program.' }, 500)
  }

  return json({ ok: true, data: normalizeProgram(data) }, req.method === 'POST' ? 201 : 200)
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
      console.error('[B2B_PARTNER_PROGRAMS_GET_FAILED]', error)
      return json({ ok: false, data: [], error: error.message }, 200)
    }

    return json({ ok: true, data: (data || []).map(normalizeProgram) })
  } catch (error) {
    console.error('[B2B_PARTNER_PROGRAMS_GET_CRASHED]', error)
    return json({ ok: false, data: [], error: 'Unable to load partner programs.' }, 500)
  }
}

export async function POST(req: NextRequest) {
  return saveProgram(req)
}

export async function PATCH(req: NextRequest) {
  return saveProgram(req)
}

export async function DELETE(req: NextRequest) {
  return saveProgram(req)
}
