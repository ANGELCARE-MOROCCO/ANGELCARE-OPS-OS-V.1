import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const payload = await req.json().catch(() => ({}))
  const supabase = await createClient()
  const action = String(payload.action || 'unknown')
  const module = String(payload.module || 'Revenue')
  const page = String(payload.page || 'unknown')
  const selected = Array.isArray(payload.selected) ? payload.selected : []
  const draft = payload.draft || {}

  const event = {
    module_key: module,
    page_key: page,
    action_key: action,
    selected_count: selected.length,
    payload,
    status: 'logged',
    created_at: new Date().toISOString(),
  }

  try {
    await supabase.from('revenue_command_action_logs').insert(event)
  } catch (error) {
    // Table may not exist before migration; still return a safe response for UI stability.
  }

  return NextResponse.json({ ok: true, action, module, page, selected_count: selected.length, draft, status: 'logged' })
}

export async function GET() {
  const supabase = await createClient()
  const { data } = await supabase.from('revenue_command_action_logs').select('*').order('created_at', { ascending: false }).limit(50)
  return NextResponse.json({ ok: true, logs: data || [] })
}
