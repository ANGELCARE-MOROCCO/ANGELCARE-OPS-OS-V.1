import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data, error } = await supabase.from('sales_terminal_clients').select('*').order('created_at', { ascending:false })
  if (error) return NextResponse.json({ ok:false, message:error.message, data:[] }, { status:500 })
  return NextResponse.json({ ok:true, data:data || [] })
}

export async function POST(req: Request) {
  const body = await req.json()
  if (!body.client_name) return NextResponse.json({ ok:false, message:'Client name is required' }, { status:400 })
  const supabase = await createClient()
  const { data, error } = await supabase.from('sales_terminal_clients').insert({
    client_name: body.client_name,
    client_type: body.client_type || 'family',
    phone: body.phone || '', email: body.email || '', city: body.city || '', address: body.address || '', source: body.source || '', notes: body.notes || '', status: body.status || 'active'
  }).select('*').single()
  if (error) return NextResponse.json({ ok:false, message:error.message }, { status:500 })
  return NextResponse.json({ ok:true, data })
}

export async function PATCH(req: Request) {
  const body = await req.json(); const { id, ...patch } = body
  const supabase = await createClient()
  const { data, error } = await supabase.from('sales_terminal_clients').update({ ...patch, updated_at:new Date().toISOString() }).eq('id', id).select('*').single()
  if (error) return NextResponse.json({ ok:false, message:error.message }, { status:500 })
  return NextResponse.json({ ok:true, data })
}
