import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const TABLES: Record<string, string> = {
  partners: 'core_organizations',
  users: 'core_user_profiles',
  memberships: 'core_memberships',
  proposals: 'bill_proposals',
  orders: 'bill_orders',
  invoices: 'bill_invoices',
  payments: 'bill_payments',
  credits: 'bill_training_credits',
  sessions: 'trn_sessions',
  participants: 'trn_session_participants',
  certificates: 'trn_certificates',
  requests: 'partner_requests',
  documents: 'partner_documents',
  notifications: 'partner_notifications',
}

function getClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } }) as any
}

export async function GET() {
  const supabase = getClient()
  const counts: Record<string, number> = {}

  if (!supabase) {
    return NextResponse.json({ ok: true, data: { counts, generated_at: new Date().toISOString(), note: 'Supabase absent: preview UI.' } })
  }

  for (const [label, table] of Object.entries(TABLES)) {
    try {
      const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true })
      counts[label] = error ? 0 : Number(count || 0)
    } catch {
      counts[label] = 0
    }
  }

  return NextResponse.json({ ok: true, data: { counts, generated_at: new Date().toISOString() } })
}
