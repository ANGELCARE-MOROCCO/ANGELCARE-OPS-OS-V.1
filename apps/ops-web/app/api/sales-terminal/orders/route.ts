import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function ref(prefix='SO') {
  const d = new Date()
  const date = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`
  return `${prefix}-${date}-${Math.random().toString(36).slice(2,7).toUpperCase()}`
}
function nextAction(status:string, payment_status?:string, fulfillment_status?:string) {
  if (status === 'cancelled') return 'Review cancellation reason'
  if (status === 'draft') return 'Create/send quote'
  if (status === 'quoted') return 'Follow up client'
  if (status === 'confirmed' && payment_status !== 'paid') return 'Request payment proof'
  if (payment_status === 'paid' && fulfillment_status === 'not_started') return 'Prepare service notice'
  if (fulfillment_status === 'prepared') return 'Handoff to operations'
  return 'Monitor order'
}

export async function GET() {
  const supabase = await createClient()
  const { data, error } = await supabase.from('sales_terminal_orders').select('*').order('created_at', { ascending:false })
  if (error) return NextResponse.json({ ok:false, message:error.message, data:[] }, { status:500 })
  return NextResponse.json({ ok:true, data:data || [] })
}

export async function POST(req: Request) {
  const body = await req.json()
  if (!body.client_name) return NextResponse.json({ ok:false, message:'Client name is required' }, { status:400 })
  const total = Math.max(0, Number(body.quantity || 1) * Number(body.unit_price || 0) - Number(body.discount_amount || 0) + Number(body.tax_amount || 0))
  const status = body.status || 'draft'
  const payload = {
    order_ref: ref('SO'), client_id: body.client_id || null, client_name: body.client_name,
    customer_type: body.customer_type || '', service_category: body.service_category || '', service_type: body.service_type || '', segment: body.segment || '', city: body.city || '',
    service_date: body.service_date || null, start_time: body.start_time || '', end_time: body.end_time || '', quantity: Number(body.quantity || 1), unit_price: Number(body.unit_price || 0), discount_amount: Number(body.discount_amount || 0), tax_amount: Number(body.tax_amount || 0), total_amount: total,
    payment_method: body.payment_method || '', payment_term: body.payment_term || '', payment_status: body.payment_status || 'unpaid', fulfillment_status: body.fulfillment_status || 'not_started', status,
    urgency_score: Number(body.urgency_score || (body.segment === 'urgent' ? 80 : 20)), manager_review_required: total >= 5000, next_action: nextAction(status, body.payment_status, body.fulfillment_status), notes: body.notes || ''
  }
  const supabase = await createClient()
  const { data, error } = await supabase.from('sales_terminal_orders').insert(payload).select('*').single()
  if (error) return NextResponse.json({ ok:false, message:error.message }, { status:500 })
  await supabase.from('sales_terminal_audit_logs').insert({ entity_type:'order', entity_id:data.id, action:'created', message:'Order created', payload:data })
  return NextResponse.json({ ok:true, data })
}

export async function PATCH(req: Request) {
  const body = await req.json()
  const id = body.id
  if (!id) return NextResponse.json({ ok:false, message:'Missing order id' }, { status:400 })
  const supabase = await createClient()
  const patch:any = { updated_at: new Date().toISOString() }
  for (const key of ['status','payment_status','fulfillment_status','cancellation_reason','notes','next_action']) if (body[key] !== undefined) patch[key] = body[key]
  if (body.status || body.payment_status || body.fulfillment_status) patch.next_action = nextAction(body.status || 'draft', body.payment_status, body.fulfillment_status)
  const { data, error } = await supabase.from('sales_terminal_orders').update(patch).eq('id', id).select('*').single()
  if (error) return NextResponse.json({ ok:false, message:error.message }, { status:500 })
  await supabase.from('sales_terminal_audit_logs').insert({ entity_type:'order', entity_id:id, action:body.action || 'updated', message:'Order updated', payload:patch })
  return NextResponse.json({ ok:true, data })
}
