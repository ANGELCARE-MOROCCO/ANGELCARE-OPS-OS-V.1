import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE

if (!url || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.')
  process.exit(1)
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function count(table, filter) {
  try {
    let query = supabase.from(table).select('id', { count: 'exact', head: true })
    if (filter) query = filter(query)
    const { count, error } = await query
    return { table, count: count || 0, ok: !error, error: error ? (error.message || JSON.stringify(error)) : '' }
  } catch (error) {
    return { table, count: 0, ok: false, error: error instanceof Error ? error.message : String(error || 'Erreur inconnue') }
  }
}

function smokeFilter(query, table) {
  if (table === 'core_organizations') return query.or('name.ilike.%SMOKE%,name.ilike.%Smoke%,primary_contact_email.ilike.%traininghub-smoke%,billing_email.ilike.%traininghub-smoke%')
  if (table === 'core_user_profiles') return query.or('email.ilike.%traininghub-smoke%,email.ilike.%smoke-participant%,full_name.ilike.%Smoke%')
  if (table === 'bill_proposals') return query.or('proposal_number.ilike.%SMOKE%,title.ilike.%Smoke%')
  if (table === 'bill_orders') return query.or('order_number.ilike.%SMOKE%,title.ilike.%Smoke%')
  if (table === 'bill_invoices') return query.or('invoice_number.ilike.%SMOKE%,title.ilike.%Smoke%')
  if (table === 'trn_sessions') return query.or('session_code.ilike.%SMOKE%,title.ilike.%Smoke%')
  if (table === 'trn_session_participants') return query.or('email.ilike.%smoke-participant%,full_name.ilike.%Smoke%,participant_name.ilike.%Smoke%')
  if (table === 'trn_certificates') return query.or('certificate_number.ilike.%SMOKE%')
  return query
}

const schemaTables = [
  ['core_organizations', 'Partner / internal organizations'],
  ['bill_accounts', 'Partner accounts'],
  ['core_user_profiles', 'User profiles'],
  ['core_memberships', 'Memberships'],
  ['authz_user_role_assignments', 'Role assignments'],
  ['bill_proposals', 'Proposals'],
  ['bill_orders', 'Orders'],
  ['bill_invoices', 'Invoices'],
  ['bill_training_credits', 'Training credits'],
  ['trn_sessions', 'Sessions'],
  ['trn_session_participants', 'Participants'],
  ['trn_certificates', 'Certificates'],
]

const rows = []
for (const [table, label] of schemaTables) {
  const row = await count(table)
  rows.push({ table, label, count: row.count, reachable: row.ok, error: row.error })
}

const smokeTables = ['core_organizations', 'core_user_profiles', 'bill_proposals', 'bill_orders', 'bill_invoices', 'trn_sessions', 'trn_session_participants', 'trn_certificates']
const smoke = []
for (const table of smokeTables) {
  const row = await count(table, (query) => smokeFilter(query, table))
  smoke.push({ table, count: row.count, reachable: row.ok, error: row.error })
}

const env = {
  NEXT_PUBLIC_SUPABASE_URL: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  SUPABASE_SERVICE_ROLE_KEY: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE),
}

const operationalCount = rows
  .filter((row) => !['core_organizations', 'core_user_profiles', 'core_memberships', 'authz_user_role_assignments'].includes(row.table))
  .reduce((total, row) => total + row.count, 0)

const smokeCount = smoke.reduce((total, row) => total + row.count, 0)
const schemaPass = rows.every((row) => row.reachable)
const envPass = Object.values(env).every(Boolean)

console.log('\nTrainingHub Production Cutover Report')
console.log('Generated:', new Date().toISOString())
console.log('\nEnvironment')
console.table(Object.entries(env).map(([name, present]) => ({ name, present })))
console.log('\nSchema / baseline reachability')
console.table(rows)
console.log('\nSmoke records')
console.table(smoke)

console.log('\nVerdict')
if (schemaPass && envPass && smokeCount === 0) {
  console.log(operationalCount === 0 ? 'READY FOR CLEAN STRICT PRODUCTION CUTOVER.' : 'READY WITH LIVE OPERATIONAL DATA. VALIDATE ISOLATION USING A REAL PARTNER TEST USER.')
} else if (schemaPass && envPass) {
  console.log('SCHEMA READY. CLEAN SMOKE RECORDS BEFORE STRICT PRODUCTION.')
  console.log('Dry-run cleanup:')
  console.log('  node --env-file=.env.local scripts/traininghub-clean-smoke-records.mjs')
  console.log('Execute cleanup:')
  console.log('  node --env-file=.env.local scripts/traininghub-clean-smoke-records.mjs --execute --yes')
} else {
  console.log('NOT READY. COMPLETE ENV OR SCHEMA CHECKPOINTS.')
}

console.log('\nStrict release gate:')
console.log('  node --env-file=.env.local scripts/verify-traininghub-release-cutover-gate.mjs --strict')

if (!schemaPass || !envPass) process.exit(1)
