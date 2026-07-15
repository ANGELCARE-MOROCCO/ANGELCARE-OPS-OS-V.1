import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const id = body.id
    const action = body.action || 'touch'
    const moduleKey = body.module_key || 'tasks'
    if (!id) return NextResponse.json({ ok:false, error:'Missing id' }, { status:400 })
    const patch: Record<string, any> = { updated_at: new Date().toISOString() }
    if (action === 'complete') { patch.status = 'completed'; patch.health = 'on_track'; patch.completed_at = new Date().toISOString() }
    if (action === 'pause') patch.status = 'paused'
    if (action === 'archive') patch.status = 'archived'
    if (action === 'escalate') { patch.priority = 'critical'; patch.health = 'risk'; patch.stage = 'intervention' }
    if (action === 'recover') { patch.status = 'active'; patch.health = 'recovery'; patch.stage = 'recovery_plan' }
    if (action === 'won') { patch.status = 'won'; patch.stage = 'closed_won'; patch.health = 'on_track' }
    if (action === 'lost') { patch.status = 'lost'; patch.stage = 'closed_lost'; patch.health = 'risk' }
    const supabase = await createClient()
    const { data, error } = await supabase.from('revenue_command_records').update(patch).eq('id', id).select('*').single()
    if (error) throw error
    await supabase.from('revenue_command_action_logs').insert({ action_type:action, related_type:moduleKey, related_id:id, note:body.note || action, metadata:{ patch } })
    return NextResponse.json({ ok:true, record:data })
  } catch (e:any) { return NextResponse.json({ ok:false, error:e?.message || 'action failed' }, { status:500 }) }
}
