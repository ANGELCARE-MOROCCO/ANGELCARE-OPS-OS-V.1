import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export async function GET() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from('revenue_command_records').select('status,priority,risk_level,value_mad,module_key')
    const records = data || []
    return NextResponse.json({ ok: !error, pulse: { total: records.length, open: records.filter((r:any)=>!['completed','archived'].includes(r.status)).length, risk: records.filter((r:any)=>['high','critical'].includes(r.risk_level)).length, value_mad: records.reduce((s:number,r:any)=>s+Number(r.value_mad||0),0) }, error: error?.message || null })
  } catch (e:any) { return NextResponse.json({ ok:false, pulse:{ total:0, open:0, risk:0, value_mad:0 }, error:e?.message || 'Pulse unavailable' }) }
}
