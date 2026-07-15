import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL and Supabase key.')
  process.exit(1)
}

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const checks = [
  ['core_organizations', 'Partner dossiers'],
  ['bill_accounts', 'Partner billing accounts'],
  ['bill_subscriptions', 'Subscriptions / plans'],
  ['core_user_profiles', 'User profiles'],
  ['core_memberships', 'Memberships'],
  ['authz_user_role_assignments', 'Role assignments'],
  ['bill_proposals', 'Proposals'],
  ['bill_orders', 'Orders'],
  ['bill_invoices', 'Invoices'],
  ['bill_payments', 'Payments'],
  ['bill_training_credits', 'Training credits'],
  ['trn_sessions', 'Training sessions'],
  ['trn_session_participants', 'Participants'],
  ['trn_certificates', 'Certificates'],
]

let failed = 0
const rows = []

for (const [table, label] of checks) {
  try {
    const { count, error } = await supabase.from(table).select('id', { count: 'exact', head: true })
    if (error) {
      failed += 1
      rows.push({ table, label, ok: false, count: '-', error: error.message })
    } else {
      rows.push({ table, label, ok: true, count: count || 0, error: '' })
    }
  } catch (error) {
    failed += 1
    rows.push({ table, label, ok: false, count: '-', error: error instanceof Error ? error.message : String(error) })
  }
}

console.table(rows)

const readiness = Math.round((rows.filter((row) => row.ok).length / rows.length) * 100)
console.log(`TrainingHub production sync readiness: ${readiness}/100`)

if (failed) {
  console.error(`${failed} sync check(s) failed.`)
  process.exit(1)
}
