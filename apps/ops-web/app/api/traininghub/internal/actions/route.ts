import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function clean(value: unknown) {
  return String(value || '').trim()
}

function getClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } }) as any
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const action = clean(body.action)
  const module = clean(body.module)

  if (!action || !module) {
    return NextResponse.json({ ok: false, message: 'Module et action requis.' }, { status: 400 })
  }

  const payload = {
    module,
    action,
    entity_id: clean(body.entity_id) || null,
    organization_id: clean(body.organization_id) || null,
    status: 'recorded',
    notes: clean(body.notes),
    metadata: body,
    created_at: new Date().toISOString(),
  }

  const supabase = getClient()
  if (!supabase) return NextResponse.json({ ok: true, data: payload, dry_run: true })

  try {
    const { data, error } = await supabase.from('traininghub_internal_actions').insert(payload).select('*').maybeSingle()
    if (!error) return NextResponse.json({ ok: true, data })
  } catch {}

  try {
    const { data } = await supabase.from('auto_events').insert({
      event_type: `traininghub.internal.${module}`,
      title: action,
      status: 'open',
      payload,
    }).select('*').maybeSingle()
    return NextResponse.json({ ok: true, data, fallback: true })
  } catch {
    return NextResponse.json({ ok: true, data: payload, dry_run: true })
  }
}
