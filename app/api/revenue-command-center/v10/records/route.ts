import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function json(body: any, status = 200) {
  return NextResponse.json(body, { status })
}

const TABLE = 'revenue_command_records'
const LOGS = 'revenue_command_action_logs'

async function logAction(supabase: any, payload: any) {
  await supabase.from(LOGS).insert({
    module_key: payload.module_key || 'revenue_hq',
    page_key: payload.page_key || '/revenue-command-center',
    action_key: payload.action_key || 'records_api',
    selected_count: payload.selected_count || 1,
    payload,
    status: payload.status || 'logged',
  }).throwOnError().catch(() => {})
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const module = req.nextUrl.searchParams.get('module') || undefined
    const page = req.nextUrl.searchParams.get('page') || undefined
    const status = req.nextUrl.searchParams.get('status') || undefined
    const type = req.nextUrl.searchParams.get('type') || undefined

    let query = supabase.from(TABLE).select('*').order('updated_at', { ascending: false }).limit(300)
    if (module) query = query.eq('module_key', module)
    if (page) query = query.eq('page_key', page)
    if (status) query = query.eq('status', status)
    if (type) query = query.eq('record_type', type)

    const { data, error } = await query
    if (error) return json({ ok: false, records: [], error: error.message }, 500)
    return json({ ok: true, records: data || [] })
  } catch (error: any) {
    return json({ ok: false, records: [], error: error?.message || 'records GET failed' }, 500)
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json().catch(() => ({}))
    const supabase = await createClient()
    const row = {
      module_key: payload.module_key || payload.module || 'revenue_hq',
      page_key: payload.page_key || payload.page || '/revenue-command-center',
      record_type: payload.record_type || 'command_record',
      title: payload.title || payload.name || 'Revenue command record',
      description: payload.description || payload.note || null,
      owner_name: payload.owner_name || payload.owner || null,
      department: payload.department || 'Revenue Command',
      status: payload.status || 'Open',
      priority: payload.priority || 'medium',
      risk_level: payload.risk_level || payload.risk || 'low',
      value_mad: Number(payload.value_mad || payload.value || 0),
      due_date: payload.due_date || null,
      metadata: payload.metadata || payload,
      updated_at: new Date().toISOString(),
    }
    const { data, error } = await supabase.from(TABLE).insert(row).select('*').single()
    await logAction(supabase, { ...row, action_key: 'create_record', status: error ? 'failed' : 'logged' })
    if (error) return json({ ok: false, record: null, error: error.message }, 500)
    return json({ ok: true, record: data })
  } catch (error: any) {
    return json({ ok: false, record: null, error: error?.message || 'records POST failed' }, 500)
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const payload = await req.json().catch(() => ({}))
    const supabase = await createClient()
    const id = payload.id
    if (!id) return json({ ok: false, error: 'Missing id' }, 400)
    const updates = { ...payload, updated_at: new Date().toISOString() }
    delete updates.id
    delete updates.created_at
    const { data, error } = await supabase.from(TABLE).update(updates).eq('id', id).select('*').single()
    await logAction(supabase, { id, updates, action_key: 'update_record', status: error ? 'failed' : 'logged' })
    if (error) return json({ ok: false, record: null, error: error.message }, 500)
    return json({ ok: true, record: data })
  } catch (error: any) {
    return json({ ok: false, error: error?.message || 'records PATCH failed' }, 500)
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const payload = await req.json().catch(() => ({}))
    const supabase = await createClient()
    const id = payload.id
    const ids = Array.isArray(payload.ids) ? payload.ids : id ? [id] : []
    if (!ids.length) return json({ ok: false, error: 'Missing id or ids' }, 400)
    const { data, error } = await supabase.from(TABLE).delete().in('id', ids).select('*')
    await logAction(supabase, { ids, action_key: 'delete_record', selected_count: ids.length, status: error ? 'failed' : 'logged' })
    if (error) return json({ ok: false, deleted: [], error: error.message }, 500)
    return json({ ok: true, deleted: data || [] })
  } catch (error: any) {
    return json({ ok: false, deleted: [], error: error?.message || 'records DELETE failed' }, 500)
  }
}
