import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function docRef(type:string) {
  const prefix = type === 'invoice' ? 'INV' : type === 'delivery_notice' ? 'BL' : 'DEVIS'
  const d = new Date(); const date = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`
  return `${prefix}-${date}-${Math.random().toString(36).slice(2,7).toUpperCase()}`
}
export async function GET() {
  const supabase = await createClient()
  const { data, error } = await supabase.from('sales_terminal_documents').select('*').order('created_at',{ascending:false})
  if (error) return NextResponse.json({ ok:false, message:error.message, data:[] }, { status:500 })
  return NextResponse.json({ ok:true, data:data || [] })
}
export async function POST(req: Request) {
  const body = await req.json(); const order_id = body.order_id; const document_type = body.document_type || 'quote'
  if (!order_id) return NextResponse.json({ ok:false, message:'Missing order_id' }, { status:400 })
  const supabase = await createClient()
  const { data: order, error: orderError } = await supabase.from('sales_terminal_orders').select('*').eq('id', order_id).single()
  if (orderError || !order) return NextResponse.json({ ok:false, message:orderError?.message || 'Order not found' }, { status:404 })
  const payload = { document_ref: docRef(document_type), order_id, document_type, total_amount: order.total_amount || 0, payload: order }
  const { data, error } = await supabase.from('sales_terminal_documents').insert(payload).select('*').single()
  if (error) return NextResponse.json({ ok:false, message:error.message }, { status:500 })
  const statusPatch:any = {}
  if (document_type === 'quote') statusPatch.status = 'quoted'
  if (document_type === 'invoice') statusPatch.status = 'invoiced'
  if (document_type === 'delivery_notice') statusPatch.fulfillment_status = 'prepared'
  if (Object.keys(statusPatch).length) await supabase.from('sales_terminal_orders').update({ ...statusPatch, updated_at:new Date().toISOString() }).eq('id', order_id)
  await supabase.from('sales_terminal_audit_logs').insert({ entity_type:'document', entity_id:data.id, action:'created', message:`${document_type} created`, payload:data })
  return NextResponse.json({ ok:true, data, document_url:`/api/sales-terminal/print?id=${data.id}` })
}
