import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from('revenue_command_records').select('status, priority, risk_level, value_mad, record_type, owner_name').eq('page_key', '/revenue-command-center').limit(500)
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    const records = data || []
    return NextResponse.json({
      ok: true,
      pulse: {
        total: records.length,
        open: records.filter((r: any) => r.status === 'Open').length,
        progress: records.filter((r: any) => r.status === 'In progress').length,
        blocked: records.filter((r: any) => r.status === 'Blocked').length,
        done: records.filter((r: any) => r.status === 'Done').length,
        risk: records.filter((r: any) => ['high', 'critical'].includes(String(r.risk_level))).length,
        urgent: records.filter((r: any) => r.priority === 'urgent').length,
        value_mad: records.reduce((sum: number, r: any) => sum + Number(r.value_mad || 0), 0),
      }
    })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || 'pulse failed' }, { status: 500 })
  }
}
