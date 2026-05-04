import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function fail(status:number, message:string) { return NextResponse.json({ ok:false, message }, { status }) }
async function audit(supabase:any, payload:any) { await supabase.from('sales_audit_logs').insert({ entity_type:'sales_action', entity_id:payload.entity_id || null, action:payload.action || 'action_queue', message:payload.message || '', payload:payload.payload || {} }) }

export async function GET() {
  const supabase = await createClient()
  const { data, error } = await supabase.from('sales_action_queue').select('*').order('created_at', { ascending:false }).limit(100)
  if (error) return fail(500, error.message)
  return NextResponse.json({ ok:true, data:data || [] })
}

export async function POST(req: Request) {
  const body = await req.json()
  if (!body.order_id) return fail(400, 'order_id is required')
  if (!body.title) return fail(400, 'Action title is required')
  const supabase = await createClient()
  const { data, error } = await supabase.from('sales_action_queue').insert({ order_id: body.order_id, action_type: body.action_type || 'follow_up', title: body.title, priority: body.priority || 'medium', status: 'open', due_at: body.due_at || null, notes: body.notes || null }).select('*').single()
  if (error) return fail(500, error.message)
  await audit(supabase, { entity_id:data.id, action:'create_action', message:data.title, payload:data })
  return NextResponse.json({ ok:true, data })
}

export async function PATCH(req: Request) {
  const body = await req.json()
  if (!body.id) return fail(400, 'Action id is required')
  const supabase = await createClient()
  const payload:any = { status: body.status || 'done', completed_at: body.status === 'open' ? null : new Date().toISOString(), updated_at: new Date().toISOString() }
  const { data, error } = await supabase.from('sales_action_queue').update(payload).eq('id', body.id).select('*').single()
  if (error) return fail(500, error.message)
  await audit(supabase, { entity_id:data.id, action:'complete_action', message:data.title, payload:data })
  return NextResponse.json({ ok:true, data })
}
