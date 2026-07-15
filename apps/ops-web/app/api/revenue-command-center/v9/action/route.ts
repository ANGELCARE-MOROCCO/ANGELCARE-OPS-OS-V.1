import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function mutationFor(action: string) {
  if (action.includes('complete')) return { status: 'completed', risk_level: 'low' }
  if (action.includes('archive')) return { status: 'archived' }
  if (action.includes('escalate')) return { status: 'blocked', priority: 'critical', risk_level: 'critical' }
  if (action.includes('approval')) return { status: 'pending_approval' }
  if (action.includes('followup')) return { status: 'open', record_type: 'follow_up' }
  if (action.includes('automation')) return { status: 'in_progress', source: 'automation' }
  return { updated_at: new Date().toISOString() }
}

export async function POST(req: NextRequest) {
  const payload = await req.json().catch(() => ({}))
  const selected: string[] = Array.isArray(payload.selected) ? payload.selected.filter(Boolean) : []
  const action = String(payload.action || 'command_action')
  const moduleKey = payload.module || payload.module_key || 'revenue_hq'
  const pageKey = payload.page || payload.page_key || null
  try {
    const supabase = await createClient()
    const patch = { ...mutationFor(action), updated_at: new Date().toISOString() }
    if (selected.length) await supabase.from('revenue_command_records').update(patch).in('id', selected)
    const { data } = await supabase.from('revenue_command_records').select('*').eq('module_key', moduleKey).order('updated_at', { ascending: false }).limit(150)
    const { error: logError } = await supabase.from('revenue_command_action_logs').insert({ module_key: moduleKey, page_key: pageKey, action_key: action, selected_count: selected.length, payload, status: 'logged' })
    return NextResponse.json({ ok: !logError, records: data || null, error: logError?.message || null })
  } catch (e: any) {
    return NextResponse.json({ ok: false, records: null, error: e?.message || 'Action fallback active' })
  }
}
