import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const payload = await req.json().catch(() => ({}))
  const supabase = await createClient()
  const ids = Array.isArray(payload.ids) ? payload.ids : []
  const status = String(payload.status || 'updated')
  try {
    if (ids.length) {
      await supabase.from('revenue_command_records').update({ status, updated_at: new Date().toISOString() }).in('id', ids)
    }
    await supabase.from('revenue_command_action_logs').insert({ module_key: 'Bulk', page_key: 'bulk', action_key: `bulk_${status}`, selected_count: ids.length, payload, status: 'logged' })
  } catch {}
  return NextResponse.json({ ok: true, updated: ids.length, status })
}
