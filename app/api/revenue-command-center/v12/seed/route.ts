import { NextResponse } from 'next/server'
import { getSupabase, cleanRecordPayload, logAction } from '../_shared'

export async function POST() {
  try {
    const supabase = await getSupabase()
    const due = (h: number) => new Date(Date.now() + h * 60 * 60 * 1000).toISOString()
    const rows = [
      cleanRecordPayload({ module_key: 'prospects', record_type: 'prospect', title: 'B2B clinic group expansion prospect', description: 'High-value account needs decision-map, appointment, and commercial next step.', owner_name: 'BD Lead', status: 'open', priority: 'critical', risk_level: 'high', value_mad: 120000, due_at: due(12) }),
      cleanRecordPayload({ module_key: 'follow_ups', record_type: 'follow_up', title: 'Overdue WhatsApp recovery for stalled buyer', description: 'Recover stalled account and create next decision point today.', owner_name: 'SDR Desk', status: 'open', priority: 'critical', risk_level: 'critical', value_mad: 30000, due_at: due(-6) }),
      cleanRecordPayload({ module_key: 'campaigns', record_type: 'campaign_control', title: 'Meta leads quality inspection', description: 'Inspect campaign conversion, rejected leads, source quality, and owner follow-through.', owner_name: 'Growth Manager', status: 'active', priority: 'high', risk_level: 'medium', value_mad: 65000, due_at: due(20) }),
      cleanRecordPayload({ module_key: 'appointments', record_type: 'appointment', title: 'Decision meeting confirmation desk', description: 'Confirm agenda, attendance, decision makers, and next commitment.', owner_name: 'Sales Coordinator', status: 'open', priority: 'medium', risk_level: 'medium', value_mad: 25000, due_at: due(8) }),
      cleanRecordPayload({ module_key: 'management', record_type: 'workload', title: 'Revenue owner overload protection', description: 'Rebalance active ownership and protect critical opportunities from delay.', owner_name: 'Revenue Manager', status: 'open', priority: 'high', risk_level: 'high', value_mad: 0, due_at: due(6) }),
      cleanRecordPayload({ module_key: 'automation', record_type: 'workflow_rule', title: 'Auto-escalate critical overdue follow-ups', description: 'Every overdue critical follow-up should trigger manager review and same-day recovery chain.', owner_name: 'Ops Admin', status: 'open', priority: 'high', risk_level: 'medium', value_mad: 0, due_at: due(24) }),
    ]
    const { data, error } = await supabase.from('revenue_command_records').insert(rows).select('*')
    if (error) throw error
    await logAction(supabase, 'v12_seed_records', { selected_count: data?.length || 0, records: data })
    return NextResponse.json({ ok: true, count: data?.length || 0, records: data || [] })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || 'Seed failed' }, { status: 500 })
  }
}
