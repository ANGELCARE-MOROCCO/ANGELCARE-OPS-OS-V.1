import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const TABLES: Record<string, string> = {
  partners: 'core_organizations',
  proposals: 'bill_proposals',
  orders: 'bill_orders',
  invoices: 'bill_invoices',
  credits: 'bill_training_credits',
  sessions: 'trn_sessions',
  participants: 'trn_session_participants',
  certificates: 'trn_certificates',
  requests: 'partner_requests',
  documents: 'partner_documents',
}

function client() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } }) as any
}

async function countTable(supabase: any, table: string) {
  try {
    const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true })
    return error ? 0 : Number(count || 0)
  } catch {
    return 0
  }
}

export async function GET() {
  const supabase = client()
  if (!supabase) return NextResponse.json({ ok: false, message: 'Supabase non configuré.' }, { status: 500 })

  const lines = ['module,table,count,exported_at']
  const exportedAt = new Date().toISOString()

  for (const [module, table] of Object.entries(TABLES)) {
    const count = await countTable(supabase, table)
    lines.push([module, table, String(count), exportedAt].map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(','))
  }

  return new Response(lines.join('\n'), {
    status: 200,
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="traininghub-command-center-${exportedAt.slice(0, 10)}.csv"`,
    },
  })
}
