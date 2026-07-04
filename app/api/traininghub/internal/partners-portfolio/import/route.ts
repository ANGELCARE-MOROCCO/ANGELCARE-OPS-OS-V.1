import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function client() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } }) as any
}

function parseCsv(text: string) {
  const lines = text.split(/\r?\n/).filter(Boolean)
  if (!lines.length) return []
  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''))
  return lines.slice(1).map((line) => {
    const values = line.match(/("([^"]|"")*"|[^,]+)/g)?.map((v) => v.trim().replace(/^"|"$/g, '').replaceAll('""', '"')) || []
    return Object.fromEntries(headers.map((h, i) => [h, values[i] || '']))
  })
}

export async function POST(request: NextRequest) {
  const supabase = client()
  if (!supabase) return NextResponse.json({ ok: false, message: 'Supabase non configuré.' }, { status: 500 })

  const body = await request.json().catch(() => ({}))
  const rows = Array.isArray(body.rows) ? body.rows : parseCsv(String(body.csv || ''))
  const results = []

  for (const row of rows) {
    const name = row.name || row.partner_name || row.legal_name
    if (!name) continue
    const inserted = await supabase.from('core_organizations').insert({
      name,
      legal_name: row.legal_name || name,
      display_name: row.display_name || name,
      city: row.city || 'Rabat',
      organization_type: row.organization_type || row.segment || 'traininghub_partner',
      status: row.status || 'active',
      stage: row.stage || 'Prospect',
      metadata: { source: 'partners_portfolio_import', row },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).select('*').maybeSingle()
    results.push({ name, ok: !inserted.error, id: inserted.data?.id || null, error: inserted.error?.message || '' })
  }

  return NextResponse.json({ ok: true, imported: results.filter((r) => r.ok).length, results })
}
