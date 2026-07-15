import { NextResponse } from 'next/server'
import { getSupabase, logAction } from '../_shared'

function norm(v: any) { return String(v || '').toLowerCase() }
function isOpen(r: any) { return !['done','won','lost','archived'].includes(norm(r.status)) }
function breached(r: any) { return r?.due_at && isOpen(r) && new Date(r.due_at).getTime() < Date.now() }

export async function GET() {
  try {
    const supabase = await getSupabase()
    const { data, error } = await supabase.from('revenue_command_records').select('*').is('deleted_at', null).limit(500)
    if (error) throw error
    const rows = data || []
    const breaches = rows.filter(breached).sort((a: any, b: any) => new Date(a.due_at).getTime() - new Date(b.due_at).getTime())
    const danger = rows.filter((r: any) => isOpen(r) && ['high','critical'].includes(norm(r.risk_level)))
    const unassigned = rows.filter((r: any) => isOpen(r) && !r.owner_name)
    return NextResponse.json({ ok: true, sla: { breaches, danger, unassigned, breach_count: breaches.length, danger_count: danger.length, unassigned_count: unassigned.length } })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || 'SLA failed' }, { status: 500 })
  }
}

export async function POST() {
  try {
    const supabase = await getSupabase()
    const { data, error } = await supabase.from('revenue_command_records').select('*').is('deleted_at', null).limit(500)
    if (error) throw error
    const breaches = (data || []).filter(breached)
    const ids = breaches.map((r: any) => r.id)
    if (ids.length) {
      await supabase.from('revenue_command_records').update({ status: 'escalated', risk_level: 'critical', priority: 'critical', updated_at: new Date().toISOString() }).in('id', ids)
    }
    await logAction(supabase, 'sla_enforcement_run', { ids, selected_count: ids.length })
    return NextResponse.json({ ok: true, escalated_count: ids.length })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || 'SLA enforcement failed' }, { status: 500 })
  }
}
