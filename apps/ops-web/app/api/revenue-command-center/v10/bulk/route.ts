import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json().catch(() => ({}))
    const supabase = await createClient()
    const ids: string[] = Array.isArray(payload.ids) ? payload.ids.filter((x: string)=>!String(x).startsWith('local')) : []
    const updates = { ...(payload.updates || { status: 'Done' }), updated_at: new Date().toISOString() }
    if (!ids.length) return NextResponse.json({ ok: false, updated: [], error: 'No selected records' }, { status: 400 })
    const { data, error } = await supabase.from('revenue_command_records').update(updates).in('id', ids).select('*')
    await supabase.from('revenue_command_action_logs').insert({ module_key: 'revenue_hq', page_key: '/revenue-command-center', action_key: 'bulk_update', selected_count: ids.length, payload: { ids, updates }, status: error ? 'failed' : 'logged' }).throwOnError()
    return NextResponse.json({ ok: !error, updated: data || [], error: error?.message || null })
  } catch (error: any) {
    return NextResponse.json({ ok: false, updated: [], error: error?.message || 'bulk failed' }, { status: 500 })
  }
}
