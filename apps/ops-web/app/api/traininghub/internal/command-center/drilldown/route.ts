import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const SECTION_TABLES: Record<string, string> = {
  partners: 'core_organizations',
  proposals: 'bill_proposals',
  offers: 'bill_proposals',
  orders: 'bill_orders',
  invoices: 'bill_invoices',
  credits: 'bill_training_credits',
  sessions: 'trn_sessions',
  participants: 'trn_session_participants',
  certificates: 'trn_certificates',
  requests: 'partner_requests',
  documents: 'partner_documents',
  risks: 'partner_requests',
  activity: 'traininghub_internal_actions',
}

function client() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } }) as any
}

function title(row: Record<string, any>, fallback: string) {
  return row.title || row.name || row.display_name || row.legal_name || row.proposal_number || row.order_number || row.invoice_number || row.session_code || row.certificate_number || row.full_name || fallback
}

function subtitle(row: Record<string, any>) {
  return row.city || row.status || row.stage || row.organization_type || row.document_type || row.request_type || row.mode || row.email || ''
}

function amount(row: Record<string, any>) {
  const cols = ['grand_total_minor', 'total_minor', 'amount_due_minor', 'subtotal_minor', 'amount_minor', 'amount']
  for (const col of cols) {
    const n = Number(row[col])
    if (Number.isFinite(n) && n) return col.includes('minor') ? n / 100 : n
  }
  return 0
}

export async function GET(request: NextRequest) {
  const supabase = client()
  if (!supabase) return NextResponse.json({ ok: false, message: 'Supabase non configuré.' }, { status: 500 })

  const section = request.nextUrl.searchParams.get('section') || 'partners'
  const table = SECTION_TABLES[section] || SECTION_TABLES.partners
  const q = String(request.nextUrl.searchParams.get('q') || '').toLowerCase()
  const status = String(request.nextUrl.searchParams.get('status') || '').toLowerCase()

  try {
    let query = supabase.from(table).select('*')
    const ordered = await query.order('created_at', { ascending: false }).limit(120)
    let rows = ordered.data
    let error = ordered.error

    if (error) {
      const plain = await supabase.from(table).select('*').limit(120)
      rows = plain.data
      error = plain.error
    }

    if (error) return NextResponse.json({ ok: false, message: error.message || String(error), rows: [] }, { status: 400 })

    const normalized = (Array.isArray(rows) ? rows : [])
      .filter((row: Record<string, any>) => {
        const haystack = JSON.stringify(row).toLowerCase()
        if (q && !haystack.includes(q)) return false
        if (status && !String(row.status || row.stage || '').toLowerCase().includes(status)) return false
        return true
      })
      .map((row: Record<string, any>) => ({
        id: row.id,
        title: title(row, section),
        subtitle: subtitle(row),
        status: row.status || row.stage || row.payment_status || '',
        amount_mad: amount(row),
        date: row.created_at || row.updated_at || row.issued_at || row.scheduled_start_at || '',
        raw: row,
      }))

    return NextResponse.json({ ok: true, section, table, count: normalized.length, rows: normalized })
  } catch (error: any) {
    return NextResponse.json({ ok: false, message: error?.message || String(error), rows: [] }, { status: 500 })
  }
}
