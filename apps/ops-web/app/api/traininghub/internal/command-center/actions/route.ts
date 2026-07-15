import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function client() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } }) as any
}

function text(value: unknown, fallback = '') {
  const t = String(value || '').trim()
  return t || fallback
}

export async function POST(request: NextRequest) {
  const supabase = client()
  if (!supabase) return NextResponse.json({ ok: false, message: 'Supabase non configuré.' }, { status: 500 })

  const body = await request.json().catch(() => ({}))
  const payload = {
    module: 'command-center',
    action: text(body.action, 'action_prioritaire'),
    status: text(body.status, 'open'),
    notes: text(body.notes),
    organization_id: body.organization_id || null,
    entity_id: body.entity_id || null,
    metadata: {
      priority: text(body.priority, 'high'),
      section: text(body.section, 'global'),
      assignee: text(body.assignee),
      due_at: body.due_at || null,
      source: 'traininghub_command_center',
      payload: body,
    },
    created_at: new Date().toISOString(),
  }

  try {
    const inserted = await supabase.from('traininghub_internal_actions').insert(payload).select('*').maybeSingle()
    if (!inserted.error) return NextResponse.json({ ok: true, data: inserted.data })
  } catch {}

  try {
    const fallback = await supabase.from('partner_activity_events').insert({
      organization_id: payload.organization_id,
      event_type: 'traininghub.command_center.action',
      title: payload.action,
      body: payload.notes,
      metadata: payload,
      created_at: payload.created_at,
    }).select('*').maybeSingle()

    if (!fallback.error) return NextResponse.json({ ok: true, data: fallback.data, fallback: true })
    return NextResponse.json({ ok: false, message: fallback.error.message || String(fallback.error) }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ ok: false, message: error?.message || String(error) }, { status: 500 })
  }
}
