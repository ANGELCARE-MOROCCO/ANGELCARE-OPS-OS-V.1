import { NextResponse } from 'next/server'
import { getSupabase, logAction } from '../_shared'

const rows = [
  { module_key: 'prospects', page_key: 'revenue-command-center', record_type: 'prospect', title: 'B2B clinic group expansion opportunity', description: 'Map decision makers, confirm volume, prepare offer, and schedule executive call.', owner_name: 'BD Lead', status: 'open', priority: 'critical', risk_level: 'high', value_mad: 120000, due_at: new Date(Date.now()+86400000).toISOString(), metadata: { seed: true, source: 'v11_hq_real_sync' } },
  { module_key: 'tasks', page_key: 'revenue-command-center', record_type: 'task', title: 'Prepare revenue protection action plan', description: 'Audit high-value pipeline risks and assign recovery owners.', owner_name: 'Revenue Manager', status: 'active', priority: 'high', risk_level: 'medium', value_mad: 0, due_at: new Date(Date.now()+2*86400000).toISOString(), metadata: { seed: true, source: 'v11_hq_real_sync' } },
  { module_key: 'follow_ups', page_key: 'revenue-command-center', record_type: 'follow_up', title: 'Recover overdue prospect follow-up', description: 'Call, message, update stage, and create next appointment.', owner_name: 'SDR Team', status: 'open', priority: 'high', risk_level: 'critical', value_mad: 35000, due_at: new Date(Date.now()-3600000).toISOString(), metadata: { seed: true, source: 'v11_hq_real_sync' } },
  { module_key: 'appointments', page_key: 'revenue-command-center', record_type: 'appointment', title: 'Confirm commercial presentation', description: 'Confirm attendees, agenda, offer context, and post-meeting action owner.', owner_name: 'Sales Coordinator', status: 'open', priority: 'medium', risk_level: 'medium', value_mad: 42000, due_at: new Date(Date.now()+5*3600000).toISOString(), metadata: { seed: true, source: 'v11_hq_real_sync' } },
  { module_key: 'campaigns', page_key: 'revenue-command-center', record_type: 'campaign_control', title: 'Campaign lead quality inspection', description: 'Check channel quality, conversion blockers, and handoff speed.', owner_name: 'Growth Manager', status: 'active', priority: 'high', risk_level: 'medium', value_mad: 65000, due_at: new Date(Date.now()+3*86400000).toISOString(), metadata: { seed: true, source: 'v11_hq_real_sync' } },
  { module_key: 'control_tower', page_key: 'revenue-command-center', record_type: 'intervention', title: 'Critical pipeline intervention', description: 'Immediate executive intervention to prevent lost value.', owner_name: 'Revenue Director', status: 'escalated', priority: 'critical', risk_level: 'critical', value_mad: 90000, due_at: new Date(Date.now()+12*3600000).toISOString(), metadata: { seed: true, source: 'v11_hq_real_sync' } },
]

export async function POST() {
  try {
    const supabase = await getSupabase()
    const { data, error } = await supabase.from('revenue_command_records').insert(rows).select('*')
    await logAction(supabase, 'seed_hq_real_sync', { selected_count: rows.length }, error ? 'failed' : 'completed')
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, count: data?.length || 0, records: data || [] })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || 'seed failed' }, { status: 500 })
  }
}
