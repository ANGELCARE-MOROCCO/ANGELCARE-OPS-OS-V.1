import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const moduleKey = searchParams.get('module_key') || 'tasks'
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from('revenue_command_records').select('*').eq('module_key', moduleKey).order('created_at', { ascending:false }).limit(100)
    if (error) throw error
    return NextResponse.json({ ok:true, records:data || [] })
  } catch (e:any) { return NextResponse.json({ ok:false, error:e?.message || 'records failed' }, { status:500 }) }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const supabase = await createClient()
    const payload = { module_key: body.module_key || 'tasks', title: body.title || 'Revenue command record', owner: body.owner || 'Revenue Owner', priority: body.priority || 'high', status: body.status || 'active', stage: body.stage || 'intake', health: body.health || 'on_track', value_mad: Number(body.value_mad || 0), due_at: body.due_at || null, description: body.description || null, metadata: body.metadata || {} }
    const { data, error } = await supabase.from('revenue_command_records').insert(payload).select('*').single()
    if (error) throw error
    await supabase.from('revenue_command_action_logs').insert({ action_type:'api_record_created', related_type:payload.module_key, related_id:data?.id, note:payload.title, metadata:payload })
    return NextResponse.json({ ok:true, record:data })
  } catch (e:any) { return NextResponse.json({ ok:false, error:e?.message || 'create failed' }, { status:500 }) }
}
