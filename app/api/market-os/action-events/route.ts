import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('market_action_events')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data: data ?? [] })
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const supabase = await createClient()

  if (!body.module_key || !body.action_key || !body.action_label) {
    return NextResponse.json(
      { error: 'module_key, action_key and action_label are required' },
      { status: 400 }
    )
  }

  const { data, error } = await supabase
    .from('market_action_events')
    .insert({
      module_key: body.module_key,
      action_key: body.action_key,
      action_label: body.action_label,
      target_id: body.target_id || null,
      target_title: body.target_title || null,
      payload: body.payload || {},
      status: body.status || 'executed',
      actor_name: body.actor_name || 'User',
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const { error: auditError } = await supabase
    .from('market_audit_events')
    .insert({
      objective_id: body.objective_id || null,
      event_type: body.action_key,
      event_title: body.action_label,
      event_summary: body.target_title || null,
      actor_name: body.actor_name || 'User',
      source_module: body.module_key,
      payload: body.payload || {},
    })

  if (auditError) {
    console.error('Market audit insert failed:', auditError.message)
  }

  return NextResponse.json({ data })
}