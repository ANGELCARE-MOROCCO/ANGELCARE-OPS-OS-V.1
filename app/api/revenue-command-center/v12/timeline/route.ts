import { NextResponse } from 'next/server'
import { getSupabase } from '../_shared'

export async function GET() {
  try {
    const supabase = await getSupabase()
    const { data: logs, error } = await supabase.from('revenue_command_action_logs').select('*').order('created_at', { ascending: false }).limit(80)
    if (error) throw error
    const { data: records } = await supabase.from('revenue_command_records').select('id,title,module_key,status,priority,risk_level,due_at,updated_at').is('deleted_at', null).order('updated_at', { ascending: false }).limit(40)
    return NextResponse.json({ ok: true, logs: logs || [], records: records || [] })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || 'Timeline failed' }, { status: 500 })
  }
}
