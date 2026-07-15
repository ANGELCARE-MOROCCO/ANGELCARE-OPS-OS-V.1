import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function fail(status:number, message:string) { return NextResponse.json({ ok:false, message }, { status }) }
async function audit(supabase:any, payload:any) { await supabase.from('sales_audit_logs').insert({ entity_type:'communication', entity_id:payload.entity_id || null, action:payload.action || 'communication_log', message:payload.message || '', payload:payload.payload || {} }) }

export async function GET() {
  const supabase = await createClient()
  const { data, error } = await supabase.from('sales_communication_logs').select('*').order('created_at', { ascending:false }).limit(100)
  if (error) return fail(500, error.message)
  return NextResponse.json({ ok:true, data:data || [] })
}

export async function POST(req: Request) {
  const body = await req.json()
  if (!body.order_id) return fail(400, 'order_id is required')
  if (!String(body.message || '').trim()) return fail(400, 'message is required')
  const supabase = await createClient()
  const { data, error } = await supabase.from('sales_communication_logs').insert({ order_id: body.order_id, channel: body.channel || 'whatsapp', direction: body.direction || 'outbound', message: String(body.message), outcome: body.outcome || null, metadata: body.metadata || {} }).select('*').single()
  if (error) return fail(500, error.message)
  await audit(supabase, { entity_id:data.id, action:'log_communication', message:data.message.slice(0,120), payload:data })
  return NextResponse.json({ ok:true, data })
}
