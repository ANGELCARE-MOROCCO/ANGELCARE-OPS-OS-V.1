import { NextResponse } from 'next/server'
import { getSupabase } from '../_shared'

function norm(v: any) { return String(v || '').toLowerCase().replace(/\s+/g, '_') }
function overdue(r: any) { return r?.due_at && !['done','archived','won','lost'].includes(norm(r.status)) && new Date(r.due_at).getTime() < Date.now() }

export async function GET() {
  try {
    const supabase = await getSupabase()
    const { data: records, error } = await supabase.from('revenue_command_records').select('*').is('deleted_at', null).limit(500)
    if (error) return NextResponse.json({ ok: false, error: error.message, pulse: null }, { status: 500 })
    const { data: logs } = await supabase.from('revenue_command_action_logs').select('id,action_key,status,payload,created_at').order('created_at', { ascending: false }).limit(20)
    const pulse = {
      total: records?.length || 0,
      open: records?.filter((r:any) => norm(r.status) === 'open').length || 0,
      active: records?.filter((r:any) => ['active','in_progress'].includes(norm(r.status))).length || 0,
      done: records?.filter((r:any) => ['done','won'].includes(norm(r.status))).length || 0,
      archived: records?.filter((r:any) => norm(r.status) === 'archived' || r.archived_at).length || 0,
      escalated: records?.filter((r:any) => norm(r.status) === 'escalated').length || 0,
      highRisk: records?.filter((r:any) => ['high','critical'].includes(norm(r.risk_level))).length || 0,
      overdue: records?.filter(overdue).length || 0,
      totalValue: records?.reduce((s:number,r:any)=>s+Number(r.value_mad||0),0) || 0,
      weightedValue: records?.reduce((s:number,r:any)=> {
        const risk = norm(r.risk_level) === 'critical' ? 0.35 : norm(r.risk_level) === 'high' ? 0.55 : norm(r.risk_level) === 'medium' ? 0.75 : 0.9
        return s + Number(r.value_mad || 0) * risk
      },0) || 0,
      byModule: {},
      byOwner: {},
      byStatus: {},
      recentActivity: logs || [],
    } as any
    for (const r of records || []) {
      pulse.byModule[norm(r.module_key) || 'hq'] = (pulse.byModule[norm(r.module_key) || 'hq'] || 0) + 1
      pulse.byOwner[r.owner_name || 'Unassigned'] = (pulse.byOwner[r.owner_name || 'Unassigned'] || 0) + 1
      pulse.byStatus[norm(r.status) || 'open'] = (pulse.byStatus[norm(r.status) || 'open'] || 0) + 1
    }
    return NextResponse.json({ ok: true, pulse })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || 'pulse failed', pulse: null }, { status: 500 })
  }
}
