import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

type Row = Record<string, any>

function client() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } }) as any
}

function parseColumn(message: string) {
  const missing = message.match(/Could not find the '([^']+)' column/i) || message.match(/column [^.\s]+\.([a-zA-Z0-9_]+) does not exist/i)
  if (missing?.[1]) return missing[1]
  return null
}

async function safeUpdate(supabase: any, table: string, id: string, payload: Row) {
  let row = JSON.parse(JSON.stringify(payload || {}))
  for (let i = 0; i < 12; i += 1) {
    const { data, error } = await supabase.from(table).update(row).eq('id', id).select('*').maybeSingle()
    if (!error) return { ok: true, data }
    const column = parseColumn(error.message || String(error))
    if (column) {
      delete row[column]
      continue
    }
    return { ok: false, error: error.message || String(error) }
  }
  return { ok: false, error: `Update failed for ${table}` }
}

async function log(supabase: any, action: string, id: string, payload: Row) {
  try {
    await supabase.from('traininghub_internal_actions').insert({
      module: 'partners',
      action,
      organization_id: id,
      entity_id: id,
      status: 'recorded',
      notes: payload.notes || null,
      metadata: payload,
      created_at: new Date().toISOString(),
    })
  } catch {}
}

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const supabase = client()
  if (!supabase) return NextResponse.json({ ok: false, message: 'Supabase non configuré.' }, { status: 500 })

  const { id } = await context.params
  const organization = await supabase.from('core_organizations').select('*').eq('id', id).maybeSingle()
  if (organization.error) return NextResponse.json({ ok: false, message: organization.error.message }, { status: 400 })

  const related: Record<string, any[]> = {}
  for (const [key, table] of Object.entries({
    accounts: 'bill_accounts',
    proposals: 'bill_proposals',
    orders: 'bill_orders',
    invoices: 'bill_invoices',
    credits: 'bill_training_credits',
    sessions: 'trn_sessions',
    participants: 'trn_session_participants',
    certificates: 'trn_certificates',
    requests: 'partner_requests',
    documents: 'partner_documents',
  })) {
    try {
      const rows = await supabase.from(table).select('*').eq('organization_id', id).limit(100)
      related[key] = Array.isArray(rows.data) ? rows.data : []
    } catch {
      related[key] = []
    }
  }

  return NextResponse.json({ ok: true, data: { organization: organization.data, related } })
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const supabase = client()
  if (!supabase) return NextResponse.json({ ok: false, message: 'Supabase non configuré.' }, { status: 500 })

  const { id } = await context.params
  const body = await request.json().catch(() => ({}))

  const result = await safeUpdate(supabase, 'core_organizations', id, {
    name: body.name,
    legal_name: body.legal_name,
    display_name: body.display_name || body.name,
    city: body.city,
    organization_type: body.organization_type || body.segment,
    partner_type: body.partner_type,
    status: body.status,
    stage: body.stage,
    metadata: {
      ...(body.metadata || {}),
      owner_name: body.owner_name || body.owner || null,
      plan: body.plan || null,
      phone: body.phone || null,
      email: body.email || null,
      notes: body.notes || null,
      segment: body.segment || null,
      updated_from: 'partners_portfolio',
    },
    updated_at: new Date().toISOString(),
  })

  if (!result.ok) return NextResponse.json(result, { status: 400 })
  await log(supabase, 'partner_updated', id, body)
  return NextResponse.json(result)
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const supabase = client()
  if (!supabase) return NextResponse.json({ ok: false, message: 'Supabase non configuré.' }, { status: 500 })

  const { id } = await context.params
  const permanent = request.nextUrl.searchParams.get('permanent') === 'true'

  if (!permanent) {
    const result = await safeUpdate(supabase, 'core_organizations', id, { status: 'disabled', disabled_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    await log(supabase, 'partner_disabled', id, {})
    return NextResponse.json(result, { status: result.ok ? 200 : 400 })
  }

  const tables = ['partner_documents', 'partner_requests', 'trn_certificates', 'trn_session_participants', 'trn_sessions', 'bill_training_credits', 'bill_invoices', 'bill_orders', 'bill_proposals', 'bill_accounts', 'core_memberships']
  const results = []
  for (const table of tables) {
    try {
      const res = await supabase.from(table).delete().eq('organization_id', id)
      results.push({ table, ok: !res.error, error: res.error?.message || '' })
    } catch (error: any) {
      results.push({ table, ok: false, error: error?.message || String(error) })
    }
  }

  const deleted = await supabase.from('core_organizations').delete().eq('id', id)
  results.push({ table: 'core_organizations', ok: !deleted.error, error: deleted.error?.message || '' })

  return NextResponse.json({ ok: !deleted.error, results }, { status: deleted.error ? 400 : 200 })
}
