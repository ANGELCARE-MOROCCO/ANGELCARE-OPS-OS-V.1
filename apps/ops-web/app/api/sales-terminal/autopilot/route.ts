import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function fail(status:number, message:string) { return NextResponse.json({ ok:false, message }, { status }) }
async function audit(supabase:any, payload:any) { await supabase.from('sales_audit_logs').insert({ entity_type:'autopilot', entity_id:payload.entity_id || 'sales_terminal_v2', action:payload.action || 'autopilot', message:payload.message || '', payload:payload.payload || {} }) }

export async function GET() {
  const supabase = await createClient()
  const { data, error } = await supabase.from('sales_autopilot_rules').select('*').order('sort_order', { ascending:true })
  if (error) return fail(500, error.message)
  return NextResponse.json({ ok:true, data:data || [] })
}

export async function POST() {
  const supabase = await createClient()
  const [{ data: orders, error: orderError }, { data: openActions }] = await Promise.all([
    supabase.from('sales_orders').select('*').not('status','in','(cancelled,archived)').order('created_at', { ascending:false }).limit(300),
    supabase.from('sales_action_queue').select('order_id, action_type, status').eq('status','open')
  ])
  if (orderError) return fail(500, orderError.message)
  const existing = new Set((openActions || []).map((a:any) => `${a.order_id}:${a.action_type}`))
  const toInsert:any[] = []
  for (const o of orders || []) {
    const status = String(o.status || '')
    const payment = String(o.payment_status || '')
    const fulfillment = String(o.fulfillment_status || '')
    const amount = Number(o.total_amount || 0)
    if (status === 'draft' && !existing.has(`${o.id}:quote`)) toInsert.push({ order_id:o.id, action_type:'quote', title:'Build/send quote and lock decision deadline', priority:'high', status:'open' })
    if (status === 'quoted' && !existing.has(`${o.id}:follow_up`)) toInsert.push({ order_id:o.id, action_type:'follow_up', title:'Follow up quoted client and request answer', priority:'high', status:'open' })
    if (status === 'confirmed' && payment !== 'paid' && !existing.has(`${o.id}:payment`)) toInsert.push({ order_id:o.id, action_type:'payment', title:'Request payment proof before ops activation', priority:'urgent', status:'open' })
    if (payment === 'paid' && ['not_started','handoff_ready'].includes(fulfillment) && !existing.has(`${o.id}:handoff`)) toInsert.push({ order_id:o.id, action_type:'handoff', title:'Prepare operations handoff and service notice', priority:'high', status:'open' })
    if (amount >= 5000 && !existing.has(`${o.id}:manager_review`)) toInsert.push({ order_id:o.id, action_type:'manager_review', title:'Manager review required for high-value sale', priority:'urgent', status:'open' })
  }
  let created = 0
  if (toInsert.length) {
    const { error } = await supabase.from('sales_action_queue').insert(toInsert)
    if (error) return fail(500, error.message)
    created = toInsert.length
  }
  await audit(supabase, { action:'run_autopilot_rules', message:`Autopilot created ${created} actions`, payload:{ created } })
  return NextResponse.json({ ok:true, created })
}
