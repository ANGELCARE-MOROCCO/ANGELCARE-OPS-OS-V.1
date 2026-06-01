import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { PHASE13_DEFAULT_CONFIG_ITEMS, getConfigItems, type ConfigScope, type InterventionConfigItem } from '@/lib/interventions/phase13-configuration-control'

const VALID_SCOPES = new Set(PHASE13_DEFAULT_CONFIG_ITEMS.map(item => item.scope))

function normalizeScope(scope: string): ConfigScope {
  if (!VALID_SCOPES.has(scope as ConfigScope)) throw new Error(`Scope configuration inconnu: ${scope}`)
  return scope as ConfigScope
}

function auditRow(action: string, scope: ConfigScope, item: Partial<InterventionConfigItem>) {
  return {
    id: `cfg-audit-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    at: new Date().toISOString(),
    actor: 'AngelCare Configuration Center',
    role: 'Manager Opérations',
    scope,
    item_id: item.id || null,
    event: 'settings changed',
    action,
    summary: `${action} configuration ${scope}: ${item.label || item.code || item.id || 'élément'}`,
    payload: item,
  }
}

async function safeSupabase() {
  try { return await createClient() } catch { return null }
}

export async function GET(_: Request, context: { params: Promise<{ scope: string }> | { scope: string } }) {
  const params = await context.params
  const scope = normalizeScope(params.scope)
  const fallback = getConfigItems(scope)
  try {
    const supabase = await safeSupabase()
    if (!supabase) return NextResponse.json({ ok: true, persisted: false, scope, records: fallback, source: 'default-fallback' })
    const { data, error } = await supabase.from('intervention_config_items').select('*').eq('scope', scope).order('sort_order', { ascending: true })
    if (error || !data?.length) return NextResponse.json({ ok: true, persisted: false, scope, records: fallback, source: 'default-fallback', warning: error?.message })
    const records = data.map((row: any) => ({ id: row.id, scope: row.scope, label: row.label, code: row.code, status: row.status, sortOrder: row.sort_order, ownerRole: row.owner_role, updatedAt: row.updated_at, description: row.description, impacts: row.impacts || [], auditEvent: row.audit_event || 'settings changed', metadata: row.metadata || {} }))
    return NextResponse.json({ ok: true, persisted: true, scope, records, source: 'supabase' })
  } catch (error: any) {
    return NextResponse.json({ ok: true, persisted: false, scope, records: fallback, warning: error?.message || 'Configuration fallback active.' })
  }
}

export async function POST(request: Request, context: { params: Promise<{ scope: string }> | { scope: string } }) {
  const params = await context.params
  const scope = normalizeScope(params.scope)
  const body = await request.json()
  const item = body.item as InterventionConfigItem
  try {
    const supabase = await safeSupabase()
    if (!supabase) return NextResponse.json({ ok: true, persisted: false, scope, item, audit: auditRow('create', scope, item), warning: 'Supabase unavailable; UI state updated client-side.' })
    const row = { id: item.id, scope, label: item.label, code: item.code, status: item.status, sort_order: item.sortOrder, owner_role: item.ownerRole, description: item.description, impacts: item.impacts, audit_event: item.auditEvent, metadata: item.metadata, updated_at: new Date().toISOString() }
    const { error } = await supabase.from('intervention_config_items').upsert(row)
    const audit = auditRow('create', scope, item)
    await supabase.from('intervention_config_audit_logs').insert(audit)
    if (error) throw error
    return NextResponse.json({ ok: true, persisted: true, scope, item, audit })
  } catch (error: any) {
    return NextResponse.json({ ok: true, persisted: false, scope, item, warning: error?.message || 'Configuration persisted fallback.' })
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ scope: string }> | { scope: string } }) {
  const params = await context.params
  const scope = normalizeScope(params.scope)
  const body = await request.json()
  const item = body.item as InterventionConfigItem
  try {
    const supabase = await safeSupabase()
    if (!supabase) return NextResponse.json({ ok: true, persisted: false, scope, item, audit: auditRow('update', scope, item), warning: 'Supabase unavailable; UI state updated client-side.' })
    const row = { label: item.label, code: item.code, status: item.status, sort_order: item.sortOrder, owner_role: item.ownerRole, description: item.description, impacts: item.impacts, audit_event: item.auditEvent, metadata: item.metadata, updated_at: new Date().toISOString() }
    const { error } = await supabase.from('intervention_config_items').update(row).eq('id', item.id).eq('scope', scope)
    const audit = auditRow('update', scope, item)
    await supabase.from('intervention_config_audit_logs').insert(audit)
    if (error) throw error
    return NextResponse.json({ ok: true, persisted: true, scope, item, audit })
  } catch (error: any) {
    return NextResponse.json({ ok: true, persisted: false, scope, item, warning: error?.message || 'Configuration update fallback.' })
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ scope: string }> | { scope: string } }) {
  const params = await context.params
  const scope = normalizeScope(params.scope)
  const body = await request.json().catch(() => ({}))
  const item = body.item as InterventionConfigItem | undefined
  try {
    const supabase = await safeSupabase()
    if (!supabase || !item?.id) return NextResponse.json({ ok: true, persisted: false, scope, item, audit: auditRow('archive', scope, item || {}), warning: 'Supabase unavailable; UI state updated client-side.' })
    const { error } = await supabase.from('intervention_config_items').update({ status: 'Archivé', updated_at: new Date().toISOString() }).eq('id', item.id).eq('scope', scope)
    const audit = auditRow('archive', scope, item)
    await supabase.from('intervention_config_audit_logs').insert(audit)
    if (error) throw error
    return NextResponse.json({ ok: true, persisted: true, scope, item, audit })
  } catch (error: any) {
    return NextResponse.json({ ok: true, persisted: false, scope, item, warning: error?.message || 'Configuration archive fallback.' })
  }
}
