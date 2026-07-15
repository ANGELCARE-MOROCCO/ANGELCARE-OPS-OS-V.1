import { NextResponse } from 'next/server'
import { adminClient, countRows } from '@/lib/traininghub/production/server'

export const dynamic = 'force-dynamic'

const TABLES: Record<string, string> = {
  partners: 'core_organizations',
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
  actions: 'traininghub_internal_actions',
}

export async function GET() {
  const supabase = adminClient()
  if (!supabase) return NextResponse.json({ ok: true, data: { counts: {}, note: 'Supabase absent.', generated_at: new Date().toISOString() } })
  const counts: Record<string, number> = {}
  for (const [key, table] of Object.entries(TABLES)) counts[key] = await countRows(supabase, table)
  return NextResponse.json({ ok: true, data: { counts, generated_at: new Date().toISOString() } })
}
