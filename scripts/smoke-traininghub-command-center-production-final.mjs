import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or Supabase key.')
  process.exit(1)
}

const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })

const tables = [
  'core_organizations',
  'bill_proposals',
  'bill_orders',
  'bill_invoices',
  'bill_training_credits',
  'trn_sessions',
  'trn_session_participants',
  'trn_certificates',
  'partner_requests',
  'partner_documents',
  'traininghub_internal_actions',
]

const rows = []
for (const table of tables) {
  try {
    const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true })
    rows.push({ table, reachable: !error, count: count || 0, error: error?.message || '' })
  } catch (error) {
    rows.push({ table, reachable: false, count: 0, error: String(error?.message || error) })
  }
}

console.table(rows)

const hardFailures = rows.filter((row) => !row.reachable && !['partner_requests', 'partner_documents', 'traininghub_internal_actions'].includes(row.table))
if (hardFailures.length) {
  console.error('Command Center production smoke FAILED: core tables unreachable.')
  process.exit(1)
}

console.log('TrainingHub Command Center production smoke PASSED with optional-table tolerance.')
