import { NextResponse } from 'next/server'
import { getSupabase } from '../_shared'

const terminal = ['done', 'archived', 'won', 'lost']
function norm(v: any) { return String(v || '').toLowerCase() }
function overdue(r: any) { return r?.due_at && !terminal.includes(norm(r.status)) && new Date(r.due_at).getTime() < Date.now() }
function weight(r: any) {
  const status = norm(r.status)
  const risk = norm(r.risk_level)
  const base = Number(r.value_mad || 0)
  let factor = 0.45
  if (status === 'active' || status === 'qualified') factor = 0.65
  if (status === 'won') factor = 1
  if (status === 'lost' || status === 'archived') factor = 0
  if (risk === 'critical') factor -= 0.15
  return Math.max(0, Math.round(base * factor))
}

export async function GET() {
  try {
    const supabase = await getSupabase()
    const { data: records, error } = await supabase.from('revenue_command_records').select('*').is('deleted_at', null).limit(500)
    if (error) throw error
    const rows = records || []
    const { data: logs } = await supabase.from('revenue_command_action_logs').select('*').order('created_at', { ascending: false }).limit(30)
    const { data: approvals } = await supabase.from('revenue_command_approvals').select('*').order('created_at', { ascending: false }).limit(100)
    const byModule: Record<string, number> = {}
    const byOwner: Record<string, number> = {}
    const byStatus: Record<string, number> = {}
    const byRisk: Record<string, number> = {}
    rows.forEach((r: any) => {
      byModule[r.module_key || 'hq'] = (byModule[r.module_key || 'hq'] || 0) + 1
      byOwner[r.owner_name || 'Unassigned'] = (byOwner[r.owner_name || 'Unassigned'] || 0) + 1
      byStatus[r.status || 'open'] = (byStatus[r.status || 'open'] || 0) + 1
      byRisk[r.risk_level || 'low'] = (byRisk[r.risk_level || 'low'] || 0) + 1
    })
    const pulse = {
      total: rows.length,
      open: rows.filter((r: any) => norm(r.status) === 'open').length,
      active: rows.filter((r: any) => ['active', 'in_progress', 'qualified'].includes(norm(r.status))).length,
      done: rows.filter((r: any) => ['done', 'won'].includes(norm(r.status))).length,
      archived: rows.filter((r: any) => norm(r.status) === 'archived').length,
      escalated: rows.filter((r: any) => norm(r.status) === 'escalated').length,
      highRisk: rows.filter((r: any) => ['high', 'critical'].includes(norm(r.risk_level))).length,
      overdue: rows.filter(overdue).length,
      totalValue: rows.reduce((s: number, r: any) => s + Number(r.value_mad || 0), 0),
      weightedValue: rows.reduce((s: number, r: any) => s + weight(r), 0),
      approvalPending: (approvals || []).filter((a: any) => norm(a.status) === 'pending').length,
      byModule,
      byOwner,
      byStatus,
      byRisk,
      recentActivity: logs || [],
    }
    return NextResponse.json({ ok: true, pulse })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || 'Failed to compute pulse' }, { status: 500 })
  }
}
