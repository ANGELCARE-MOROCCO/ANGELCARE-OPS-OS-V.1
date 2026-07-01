import { createClient } from '@supabase/supabase-js'
import { spawnSync } from 'node:child_process'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE

if (!url || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.')
  process.exit(1)
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function count(table) {
  const { count, error } = await supabase.from(table).select('id', { count: 'exact', head: true })
  if (error) return { table, count: 0, ok: false, error: error.message }
  return { table, count: count || 0, ok: true, error: '' }
}

const required = [
  ['core_organizations', 1, 'partner dossiers'],
  ['bill_accounts', 1, 'partner billing accounts'],
  ['core_user_profiles', 1, 'user profiles'],
  ['core_memberships', 1, 'memberships'],
  ['authz_user_role_assignments', 1, 'role assignments'],
  ['bill_proposals', 1, 'proposals'],
  ['bill_orders', 1, 'orders'],
  ['bill_invoices', 1, 'invoices'],
  ['bill_training_credits', 1, 'training credits'],
  ['trn_sessions', 1, 'training sessions'],
  ['trn_session_participants', 1, 'participants'],
  ['trn_certificates', 1, 'certificates'],
]

const rows = []
for (const [table, minimum, label] of required) {
  const result = await count(table)
  rows.push({
    table,
    label,
    count: result.count,
    minimum,
    pass: result.ok && result.count >= minimum,
    error: result.error,
  })
}

console.log('\nTrainingHub final production gate — data chain')
console.table(rows)

const failed = rows.filter((row) => !row.pass)
if (failed.length) {
  console.error(`Final production gate FAILED: ${failed.length} required chain checkpoint(s) are missing.`)
  process.exit(1)
}

console.log('Data chain gate PASSED.')

console.log('\nRunning partner isolation gate...')
const isolation = spawnSync(process.execPath, ['--env-file=.env.local', 'scripts/verify-traininghub-partner-isolation.mjs'], {
  stdio: 'inherit',
  env: process.env,
})

if (isolation.status !== 0) {
  console.error('Final production gate FAILED: partner isolation gate failed.')
  process.exit(isolation.status || 1)
}

console.log('\nTrainingHub FINAL PRODUCTION GATE PASSED.')
