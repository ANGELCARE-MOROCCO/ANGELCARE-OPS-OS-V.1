import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const module = req.nextUrl.searchParams.get('module') || undefined
  let query = supabase.from('revenue_command_records').select('*').order('updated_at', { ascending: false }).limit(100)
  if (module) query = query.eq('module_key', module)
  const { data, error } = await query
  return NextResponse.json({ ok: !error, records: data || [], error: error?.message || null })
}

export async function POST(req: NextRequest) {
  const payload = await req.json().catch(() => ({}))
  const supabase = await createClient()
  const row = {
    module_key: payload.module_key || payload.module || 'Revenue',
    page_key: payload.page_key || payload.page || null,
    record_type: payload.record_type || 'action',
    title: payload.title || payload.name || 'Revenue command record',
    description: payload.description || null,
    owner_name: payload.owner_name || payload.owner || null,
    department: payload.department || null,
    status: payload.status || 'open',
    priority: payload.priority || 'medium',
    risk_level: payload.risk_level || payload.risk || 'low',
    value_mad: Number(payload.value_mad || payload.value || 0),
    metadata: payload,
  }
  const { data, error } = await supabase.from('revenue_command_records').insert(row).select('*').single()
  await supabase.from('revenue_command_action_logs').insert({ module_key: row.module_key, page_key: row.page_key, action_key: 'create_record', selected_count: 1, payload: row, status: error ? 'failed' : 'logged' }).catch?.(() => undefined)
  return NextResponse.json({ ok: !error, record: data || null, error: error?.message || null })
}

export async function PATCH(req: NextRequest) {
  const payload = await req.json().catch(() => ({}))
  const supabase = await createClient()
  const id = payload.id
  if (!id) return NextResponse.json({ ok: false, error: 'Missing id' }, { status: 400 })
  const updates = { ...payload, updated_at: new Date().toISOString() }
  delete updates.id
  const { data, error } = await supabase.from('revenue_command_records').update(updates).eq('id', id).select('*').single()
  return NextResponse.json({ ok: !error, record: data || null, error: error?.message || null })
}
