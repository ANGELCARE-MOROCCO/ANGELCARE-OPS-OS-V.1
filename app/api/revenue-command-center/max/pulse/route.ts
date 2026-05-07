import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from('revenue_command_records').select('module_key,status,priority,health,value_mad,due_at')
    if (error) throw error
    const rows = data || []
    const now = Date.now()
    const pulse = {
      total: rows.length,
      active: rows.filter((r:any) => !['completed','won','lost','archived'].includes(r.status)).length,
      critical: rows.filter((r:any) => r.priority === 'critical' || r.health === 'risk').length,
      overdue: rows.filter((r:any) => r.due_at && new Date(r.due_at).getTime() < now && !['completed','won','lost'].includes(r.status)).length,
      value_mad: rows.reduce((s:number,r:any)=>s+Number(r.value_mad||0),0),
      by_module: rows.reduce((a:any,r:any)=>{ a[r.module_key]=(a[r.module_key]||0)+1; return a },{})
    }
    return NextResponse.json({ ok:true, pulse })
  } catch (e:any) { return NextResponse.json({ ok:false, error:e?.message || 'pulse failed' }, { status:500 }) }
}
