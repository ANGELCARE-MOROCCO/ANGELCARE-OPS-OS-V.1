import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data, error } = await supabase.from('sales_terminal_options').select('*').order('area').order('sort_order')
  if (error) return NextResponse.json({ ok:false, message:error.message, data:[] }, { status:500 })
  return NextResponse.json({ ok:true, data:data || [] })
}

export async function POST(req: Request) {
  const body = await req.json()
  const supabase = await createClient()
  const option_key = body.option_key || String(body.label || '').toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'') || crypto.randomUUID()
  const payload = { area: body.area, option_key, label: body.label, value: body.value || option_key, description: body.description || '', sort_order: Number(body.sort_order || 0), is_active: body.is_active !== false }
  const { data, error } = await supabase.from('sales_terminal_options').upsert(payload, { onConflict:'area,option_key' }).select('*').single()
  if (error) return NextResponse.json({ ok:false, message:error.message }, { status:500 })
  return NextResponse.json({ ok:true, data })
}

export async function PATCH(req: Request) {
  const body = await req.json()
  const { id, ...patch } = body
  const supabase = await createClient()
  const { data, error } = await supabase.from('sales_terminal_options').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', id).select('*').single()
  if (error) return NextResponse.json({ ok:false, message:error.message }, { status:500 })
  return NextResponse.json({ ok:true, data })
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ ok:false, message:'Missing id' }, { status:400 })
  const supabase = await createClient()
  const { error } = await supabase.from('sales_terminal_options').delete().eq('id', id)
  if (error) return NextResponse.json({ ok:false, message:error.message }, { status:500 })
  return NextResponse.json({ ok:true })
}
