import { NextRequest, NextResponse } from 'next/server'
import { actionUpdates, getSupabase, logAction } from '../_shared'

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json().catch(() => ({}))
    const ids = Array.isArray(payload.ids) ? payload.ids : []
    if (!ids.length) return NextResponse.json({ ok: false, error: 'No ids selected' }, { status: 400 })
    const supabase = await getSupabase()
    const updates = { ...actionUpdates(payload.action_key || 'bulk_update', payload), ...(payload.updates || {}) }
    const { data, error } = await supabase.from('revenue_command_records').update(updates).in('id', ids).select('*')
    await logAction(supabase, payload.action_key || 'bulk_update', { ids, updates, selected_count: ids.length }, error ? 'failed' : 'completed')
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, records: data || [], count: data?.length || 0 })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || 'bulk failed' }, { status: 500 })
  }
}
