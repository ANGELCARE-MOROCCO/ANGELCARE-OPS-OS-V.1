import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function safeNumber(v: any) { const n = Number(v); return Number.isFinite(n) ? n : 0 }
function seed(moduleKey: string, pageKey: string | null) {
  const now = new Date().toISOString()
  return [
    { id: `${moduleKey}-seed-1`, module_key: moduleKey, page_key: pageKey, record_type: 'priority_action', title: 'Priority revenue command action', description: 'Fallback record shown when database rows are not available yet.', owner_name: 'Amina', status: 'in_progress', priority: 'high', risk_level: 'medium', value_mad: 42000, stage: 'Today', source: 'fallback', score: 82, updated_at: now },
    { id: `${moduleKey}-seed-2`, module_key: moduleKey, page_key: pageKey, record_type: 'manager_review', title: 'Manager review required', description: 'Approval gate and audit trace item.', owner_name: 'Youssef', status: 'pending_approval', priority: 'critical', risk_level: 'high', value_mad: 88000, stage: 'Approval', source: 'fallback', score: 76, updated_at: now },
    { id: `${moduleKey}-seed-3`, module_key: moduleKey, page_key: pageKey, record_type: 'recovery', title: 'Blocked recovery item', description: 'Critical blocked work requiring escalation and owner action.', owner_name: 'Salma', status: 'blocked', priority: 'critical', risk_level: 'critical', value_mad: 27000, stage: 'Blocked', source: 'fallback', score: 41, updated_at: now },
  ]
}

export async function GET(req: NextRequest) {
  const moduleKey = req.nextUrl.searchParams.get('module') || 'revenue_hq'
  const pageKey = req.nextUrl.searchParams.get('page')
  try {
    const supabase = await createClient()
    let query = supabase.from('revenue_command_records').select('*').eq('module_key', moduleKey).order('updated_at', { ascending: false }).limit(150)
    if (pageKey) query = query.eq('page_key', pageKey)
    const { data, error } = await query
    if (error) return NextResponse.json({ ok: false, records: seed(moduleKey, pageKey), error: error.message })
    return NextResponse.json({ ok: true, records: data?.length ? data : seed(moduleKey, pageKey), error: null })
  } catch (e: any) {
    return NextResponse.json({ ok: false, records: seed(moduleKey, pageKey), error: e?.message || 'Revenue Command records fallback active' })
  }
}

export async function POST(req: NextRequest) {
  const payload = await req.json().catch(() => ({}))
  const row = {
    module_key: payload.module_key || payload.module || 'revenue_hq',
    page_key: payload.page_key || payload.page || null,
    record_type: payload.record_type || 'command_record',
    title: payload.title || payload.name || 'Revenue command record',
    description: payload.description || null,
    owner_name: payload.owner_name || payload.owner || null,
    department: payload.department || 'Revenue',
    status: payload.status || 'open',
    priority: payload.priority || 'medium',
    risk_level: payload.risk_level || payload.risk || 'low',
    value_mad: safeNumber(payload.value_mad || payload.value),
    due_at: payload.due_at || null,
    sla_minutes: payload.sla_minutes ? safeNumber(payload.sla_minutes) : null,
    score: payload.score ? safeNumber(payload.score) : null,
    stage: payload.stage || null,
    source: payload.source || 'manual',
    metadata: payload,
  }
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from('revenue_command_records').insert(row).select('*').single()
    await supabase.from('revenue_command_action_logs').insert({ module_key: row.module_key, page_key: row.page_key, action_key: 'create_record', selected_count: 1, payload: row, status: error ? 'failed' : 'logged', error_message: error?.message || null })
    if (error) return NextResponse.json({ ok: false, record: { id: `local-${Date.now()}`, ...row }, error: error.message })
    return NextResponse.json({ ok: true, record: data, error: null })
  } catch (e: any) {
    return NextResponse.json({ ok: false, record: { id: `local-${Date.now()}`, ...row }, error: e?.message || 'Create fallback active' })
  }
}

export async function PATCH(req: NextRequest) {
  const payload = await req.json().catch(() => ({}))
  const id = payload.id
  if (!id) return NextResponse.json({ ok: false, error: 'Missing id' }, { status: 400 })
  const updates = { ...payload, updated_at: new Date().toISOString() }
  delete updates.id
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from('revenue_command_records').update(updates).eq('id', id).select('*').single()
    await supabase.from('revenue_command_action_logs').insert({ module_key: payload.module_key || data?.module_key || 'unknown', page_key: payload.page_key || data?.page_key || null, action_key: 'patch_record', selected_count: 1, payload: { id, updates }, status: error ? 'failed' : 'logged', error_message: error?.message || null })
    return NextResponse.json({ ok: !error, record: data || null, error: error?.message || null })
  } catch (e: any) { return NextResponse.json({ ok: false, record: null, error: e?.message || 'Patch failed' }) }
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ ok: false, error: 'Missing id' }, { status: 400 })
  try {
    const supabase = await createClient()
    const { error } = await supabase.from('revenue_command_records').update({ status: 'archived', updated_at: new Date().toISOString() }).eq('id', id)
    return NextResponse.json({ ok: !error, error: error?.message || null })
  } catch (e: any) { return NextResponse.json({ ok: false, error: e?.message || 'Archive failed' }) }
}
