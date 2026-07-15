import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function client() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } }) as any
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const supabase = client()
  if (!supabase) return NextResponse.json({ ok: false, message: 'Supabase non configuré.' }, { status: 500 })

  const { id } = await context.params
  const body = await request.json().catch(() => ({}))
  const action = String(body.action || 'partner_action').trim()

  const inserted = await supabase.from('traininghub_internal_actions').insert({
    module: 'partners',
    action,
    organization_id: id,
    entity_id: id,
    status: String(body.status || 'open'),
    notes: body.notes || null,
    metadata: {
      priority: body.priority || 'normal',
      section: body.section || 'partners',
      due_at: body.due_at || null,
      source: 'partners_portfolio',
      payload: body,
    },
    created_at: new Date().toISOString(),
  }).select('*').maybeSingle()

  if (!inserted.error) return NextResponse.json({ ok: true, data: inserted.data })

  const fallback = await supabase.from('partner_activity_events').insert({
    organization_id: id,
    event_type: `traininghub.partners.${action}`,
    title: action,
    body: body.notes || null,
    metadata: body,
    created_at: new Date().toISOString(),
  }).select('*').maybeSingle()

  return NextResponse.json({ ok: !fallback.error, data: fallback.data, error: fallback.error?.message || '' }, { status: fallback.error ? 400 : 200 })
}
