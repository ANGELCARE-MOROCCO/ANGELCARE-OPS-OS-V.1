import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export async function POST(req: NextRequest) {
  const payload = await req.json().catch(() => ({}))
  const ids: string[] = Array.isArray(payload.ids) ? payload.ids : []
  const updates = payload.updates || {}
  if (!ids.length) return NextResponse.json({ ok: false, error: 'No records selected' }, { status: 400 })
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from('revenue_command_records').update({ ...updates, updated_at: new Date().toISOString() }).in('id', ids).select('*')
    await supabase.from('revenue_command_action_logs').insert({ module_key: payload.module || 'revenue_hq', page_key: payload.page || null, action_key: 'bulk_update', selected_count: ids.length, payload, status: error ? 'failed' : 'logged', error_message: error?.message || null })
    return NextResponse.json({ ok: !error, records: data || [], error: error?.message || null })
  } catch (e: any) { return NextResponse.json({ ok: false, records: [], error: e?.message || 'Bulk update failed' }) }
}
