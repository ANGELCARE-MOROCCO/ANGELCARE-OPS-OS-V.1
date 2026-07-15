import { NextResponse } from 'next/server'
import { getSupabase, getRecord, createLinkedRecord, logAction, actionUpdates, addHours, playbooks } from '../_shared'

export async function GET() {
  return NextResponse.json({ ok: true, playbooks })
}

export async function POST(req: Request) {
  try {
    const supabase = await getSupabase()
    const body = await req.json()
    const id = body.id
    const chain_key = body.chain_key || 'sla_rescue'
    if (!id) return NextResponse.json({ ok: false, error: 'Missing source record id' }, { status: 400 })
    const source = await getRecord(supabase, id)
    if (!source) return NextResponse.json({ ok: false, error: 'Source record not found' }, { status: 404 })

    const created: any[] = []
    const sourceUpdates: any = {}

    if (chain_key === 'sla_rescue') {
      Object.assign(sourceUpdates, actionUpdates('escalate'))
      created.push(await createLinkedRecord(supabase, source, { chain_key, module_key: 'follow_ups', record_type: 'follow_up', title: `Same-day rescue follow-up: ${source.title}`, description: 'Call/WhatsApp/email this account today, confirm blocker, and update recovery state.', priority: 'critical', risk_level: 'critical', due_at: addHours(4) }))
      created.push(await createLinkedRecord(supabase, source, { chain_key, module_key: 'management', record_type: 'manager_review', title: `Manager rescue approval: ${source.title}`, description: 'Manager must validate owner, next step, and SLA recovery plan.', priority: 'critical', risk_level: 'critical', due_at: addHours(8) }))
      await supabase.from('revenue_command_approvals').insert({ source_record_id: source.id, approval_key: 'sla_rescue_manager_review', title: `Approve SLA rescue for ${source.title}`, requested_by: body.requested_by || 'Revenue Command', approver_name: body.approver_name || 'Revenue Manager', status: 'pending', payload: { chain_key, source_id: source.id } })
    }

    if (chain_key === 'prospect_acceleration') {
      Object.assign(sourceUpdates, actionUpdates('qualify'))
      created.push(await createLinkedRecord(supabase, source, { chain_key, module_key: 'appointments', record_type: 'appointment', title: `Decision appointment: ${source.title}`, description: 'Schedule decision conversation with key buyer and confirm agenda.', priority: 'high', risk_level: 'medium', value_mad: source.value_mad || 0, due_at: addHours(24) }))
      created.push(await createLinkedRecord(supabase, source, { chain_key, module_key: 'tasks', record_type: 'decision_map', title: `Build decision map: ${source.title}`, description: 'Identify buyer, influencer, blocker, budget holder, timeline, and success criteria.', priority: 'high', risk_level: 'medium', due_at: addHours(12) }))
      created.push(await createLinkedRecord(supabase, source, { chain_key, module_key: 'follow_ups', record_type: 'follow_up', title: `Next commercial touch: ${source.title}`, description: 'Protect momentum after qualification and appointment creation.', priority: 'high', risk_level: 'medium', due_at: addHours(36) }))
    }

    if (chain_key === 'campaign_recovery') {
      Object.assign(sourceUpdates, actionUpdates('start'))
      created.push(await createLinkedRecord(supabase, source, { chain_key, module_key: 'campaigns', record_type: 'roi_inspection', title: `ROI inspection: ${source.title}`, description: 'Inspect source, spend, conversion quality, lead handoff speed, and owner accountability.', priority: 'high', risk_level: 'high', due_at: addHours(12) }))
      created.push(await createLinkedRecord(supabase, source, { chain_key, module_key: 'tasks', record_type: 'quality_task', title: `Lead quality corrective task: ${source.title}`, description: 'Review bad lead reasons, fix form/source quality, and confirm routing.', priority: 'high', risk_level: 'medium', due_at: addHours(24) }))
      await supabase.from('revenue_command_approvals').insert({ source_record_id: source.id, approval_key: 'campaign_recovery_approval', title: `Approve campaign recovery plan for ${source.title}`, requested_by: body.requested_by || 'Revenue Command', approver_name: body.approver_name || 'Growth Manager', status: 'pending', payload: { chain_key, source_id: source.id } })
    }

    if (chain_key === 'manager_review') {
      Object.assign(sourceUpdates, actionUpdates('escalate'))
      created.push(await createLinkedRecord(supabase, source, { chain_key, module_key: 'management', record_type: 'manager_task', title: `Management decision required: ${source.title}`, description: 'Review context, blockers, owner, value, risk, and final decision path.', priority: 'critical', risk_level: 'critical', due_at: addHours(8) }))
      await supabase.from('revenue_command_approvals').insert({ source_record_id: source.id, approval_key: 'manager_review', title: `Manager decision: ${source.title}`, requested_by: body.requested_by || 'Revenue Command', approver_name: body.approver_name || 'Revenue Manager', status: 'pending', payload: { chain_key, source_id: source.id } })
    }

    const { data: updated, error } = await supabase.from('revenue_command_records').update({ ...sourceUpdates, metadata: { ...(source.metadata || {}), last_chain_key: chain_key, last_chain_at: new Date().toISOString() } }).eq('id', id).select('*').single()
    if (error) throw error
    await logAction(supabase, `chain_${chain_key}`, { id, chain_key, created_count: created.length, created, record: updated })
    return NextResponse.json({ ok: true, record: updated, created, created_count: created.length })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || 'Failed to run execution chain' }, { status: 500 })
  }
}
