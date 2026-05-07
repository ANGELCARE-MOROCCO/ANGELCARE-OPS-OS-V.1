import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  try {
    const supabase = await createClient()
    const now = new Date().toISOString()
    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10)
    const rows = [
      { module_key: 'revenue_hq', page_key: '/revenue-command-center', record_type: 'task', title: 'CEO revenue decision follow-up', description: 'Call, qualify the decision context, and confirm next commercial step.', owner_name: 'Amina', department: 'Revenue Command', status: 'Open', priority: 'urgent', risk_level: 'high', value_mad: 42000, due_date: tomorrow, metadata: { seed: true }, updated_at: now },
      { module_key: 'revenue_hq', page_key: '/revenue-command-center', record_type: 'prospect', title: 'Enterprise healthcare prospect qualification', description: 'Validate budget, authority, operational pain, and closing path.', owner_name: 'Youssef', department: 'Business Development', status: 'In progress', priority: 'high', risk_level: 'medium', value_mad: 120000, due_date: tomorrow, metadata: { seed: true }, updated_at: now },
      { module_key: 'revenue_hq', page_key: '/revenue-command-center', record_type: 'campaign', title: 'Q2 partner revenue sprint', description: 'Launch targeted partner activation and track qualified opportunities.', owner_name: 'Sara', department: 'Growth', status: 'Open', priority: 'high', risk_level: 'medium', value_mad: 86000, due_date: tomorrow, metadata: { seed: true }, updated_at: now },
      { module_key: 'revenue_hq', page_key: '/revenue-command-center', record_type: 'risk', title: 'Blocked proposal approval', description: 'Escalate stalled proposal and assign recovery owner.', owner_name: 'Ops Desk', department: 'Management', status: 'Blocked', priority: 'urgent', risk_level: 'critical', value_mad: 45000, due_date: tomorrow, metadata: { seed: true }, updated_at: now },
      { module_key: 'revenue_hq', page_key: '/revenue-command-center', record_type: 'follow_up', title: 'Daily conversion discipline review', description: 'Close stale follow-ups and prepare tomorrow command queue.', owner_name: 'Nour', department: 'Revenue Command', status: 'Open', priority: 'medium', risk_level: 'low', value_mad: 18000, due_date: tomorrow, metadata: { seed: true }, updated_at: now },
    ]
    const { data, error } = await supabase.from('revenue_command_records').insert(rows).select('*')
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    await supabase.from('revenue_command_action_logs').insert({ module_key: 'revenue_hq', page_key: '/revenue-command-center', action_key: 'seed_hq_records', selected_count: rows.length, payload: { rows: rows.length }, status: 'logged' }).throwOnError()
    return NextResponse.json({ ok: true, inserted: data?.length || 0, records: data || [] })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || 'seed failed' }, { status: 500 })
  }
}
