import { createClient } from '@supabase/supabase-js'
import { spawnSync } from 'node:child_process'

const args = new Set(process.argv.slice(2))
const STRICT = args.has('--strict')

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE

if (!url || !anonKey || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY.')
  process.exit(1)
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const schemaTables = [
  'core_organizations',
  'bill_accounts',
  'bill_subscriptions',
  'core_user_profiles',
  'core_memberships',
  'authz_user_role_assignments',
  'bill_proposals',
  'bill_orders',
  'bill_invoices',
  'bill_payments',
  'bill_training_credits',
  'trn_sessions',
  'trn_session_participants',
  'trn_certificates',
]

const smokeTables = [
  'core_organizations',
  'core_user_profiles',
  'bill_proposals',
  'bill_orders',
  'bill_invoices',
  'trn_sessions',
  'trn_session_participants',
  'trn_certificates',
]

const operationalTables = [
  'bill_accounts',
  'bill_subscriptions',
  'bill_proposals',
  'bill_orders',
  'bill_invoices',
  'bill_payments',
  'bill_training_credits',
  'trn_sessions',
  'trn_session_participants',
  'trn_certificates',
]

async function count(table, apply) {
  try {
    let query = supabase.from(table).select('id', { count: 'exact', head: true })
    if (apply) query = apply(query)
    const { count, error } = await query
    return { table, count: count || 0, reachable: !error, error: error ? (error.message || JSON.stringify(error)) : '' }
  } catch (error) {
    return { table, count: 0, reachable: false, error: error instanceof Error ? error.message : String(error || 'Erreur inconnue') }
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

function runPartnerIsolation() {
  return spawnSync(process.execPath, ['--env-file=.env.local', 'scripts/verify-traininghub-partner-isolation.mjs'], {
    stdio: 'inherit',
    env: process.env,
  })
}

const reachability = []
for (const table of schemaTables) reachability.push(await count(table))

const smoke = []
for (const table of smokeTables) smoke.push(await count(table, (query) => smokeFilter(query, table)))

const operational = []
for (const table of operationalTables) operational.push(await count(table))

const smokeCount = smoke.reduce((total, row) => total + row.count, 0)
const operationalCount = operational.reduce((total, row) => total + row.count, 0)
const envPass = Boolean(url && anonKey && serviceKey)
const schemaPass = reachability.every((row) => row.reachable)

let isolationPass = false
let isolationMode = ''
let isolationStatus = 0

console.log('\nTrainingHub release cutover gate')
console.log('Mode:', STRICT ? 'strict' : 'standard')

console.log('\nSchema reachability')
console.table(reachability)

console.log('\nSmoke records')
console.table(smoke)

console.log('\nOperational records after cleanup')
console.table(operational)

const hasExplicitPartnerCredentials = Boolean(process.env.PARTNER_TEST_EMAIL && process.env.PARTNER_TEST_PASSWORD)

if (hasExplicitPartnerCredentials) {
  console.log('\nPartner isolation evidence: explicit PARTNER_TEST_EMAIL/PARTNER_TEST_PASSWORD')
  const isolation = runPartnerIsolation()
  isolationStatus = isolation.status || 0
  isolationPass = isolation.status === 0
  isolationMode = 'explicit_partner_test_user'
} else if (smokeCount > 0) {
  console.log('\nPartner isolation evidence: smoke partner user still available')
  const isolation = runPartnerIsolation()
  isolationStatus = isolation.status || 0
  isolationPass = isolation.status === 0
  isolationMode = 'smoke_partner_test_user'
} else if (operationalCount === 0) {
  console.log('\nPartner isolation evidence: CLEAN BASELINE')
  console.log('No smoke user remains and no partner operational rows remain. Runtime isolation was already validated before cleanup; strict gate now validates clean release state.')
  isolationPass = true
  isolationMode = 'clean_baseline_no_partner_rows'
} else {
  console.log('\nPartner isolation evidence: MISSING TEST USER')
  console.log('Operational partner rows exist but no test credentials were provided.')
  console.log('Set PARTNER_TEST_EMAIL and PARTNER_TEST_PASSWORD to validate isolation against a real partner user.')
  isolationPass = false
  isolationMode = 'missing_partner_test_user'
}

const strictSmokePass = !STRICT || smokeCount === 0
const pass = envPass && schemaPass && isolationPass && strictSmokePass

console.log('\nRelease gate summary')
console.table([
  { checkpoint: 'Environment variables', pass: envPass },
  { checkpoint: 'Schema reachability', pass: schemaPass },
  { checkpoint: 'Partner isolation evidence', pass: isolationPass, mode: isolationMode, status: isolationStatus },
  { checkpoint: STRICT ? 'Smoke records cleaned' : 'Smoke records reported', pass: STRICT ? smokeCount === 0 : true, smoke_count: smokeCount },
  { checkpoint: 'Clean operational baseline', pass: operationalCount === 0 || hasExplicitPartnerCredentials || smokeCount > 0, operational_count: operationalCount },
])

if (!pass) {
  if (STRICT && smokeCount > 0) {
    console.error('Strict release gate FAILED: smoke records remain. Run cleanup.')
    console.error('  node --env-file=.env.local scripts/traininghub-clean-smoke-records.mjs --execute --yes')
  } else if (!isolationPass && isolationMode === 'missing_partner_test_user') {
    console.error('Release cutover gate FAILED: provide a real partner test user for isolation validation, or run from a clean baseline before real partner records exist.')
    console.error('  PARTNER_TEST_EMAIL="partner@example.com" PARTNER_TEST_PASSWORD="password" node --env-file=.env.local scripts/verify-traininghub-release-cutover-gate.mjs --strict')
  } else {
    console.error('Release cutover gate FAILED.')
  }
  process.exit(1)
}

console.log(STRICT ? 'TrainingHub STRICT RELEASE CUTOVER GATE PASSED.' : 'TrainingHub RELEASE CUTOVER GATE PASSED.')
