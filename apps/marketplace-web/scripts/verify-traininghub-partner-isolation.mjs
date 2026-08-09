import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE

if (!url || !anonKey || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY.')
  process.exit(1)
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

let email = process.env.PARTNER_TEST_EMAIL || ''
let password = process.env.PARTNER_TEST_PASSWORD || ''

if (!email || !password) {
  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
  if (error) throw error

  const smokeUsers = (data.users || [])
    .filter((user) => String(user.email || '').startsWith('traininghub-smoke-'))
    .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))

  const latest = smokeUsers[0]
  if (!latest?.email) {
    console.error('No smoke partner user found. Set PARTNER_TEST_EMAIL and PARTNER_TEST_PASSWORD, or run scripts/smoke-traininghub-partner-lifecycle.mjs first.')
    process.exit(1)
  }

  email = latest.email
  const match = email.match(/traininghub-smoke-(\d+)@/)
  if (!match?.[1]) {
    console.error(`Could not derive smoke password from ${email}. Set PARTNER_TEST_PASSWORD manually.`)
    process.exit(1)
  }

  password = `AC-Smoke-${match[1]}!`
}

const partner = createClient(url, anonKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const { data: signIn, error: signInError } = await partner.auth.signInWithPassword({ email, password })
if (signInError || !signIn?.user?.id) {
  console.error('Partner sign-in failed:', signInError?.message || 'unknown error')
  process.exit(1)
}

async function rows(table, select = '*') {
  const { data, error } = await partner.from(table).select(select)
  return { table, data: Array.isArray(data) ? data : [], error: error?.message || '' }
}

function selectForIsolation(table) {
  if (table === 'core_organizations') return 'id,name,status'
  return 'id,organization_id'
}

const profileResult = await rows('core_user_profiles', 'id,auth_user_id,email,status')
const profile = profileResult.data.find((row) => row.auth_user_id === signIn.user.id || String(row.email).toLowerCase() === email.toLowerCase()) || profileResult.data[0]

const membershipResult = await rows('core_memberships', 'id,user_id,organization_id,status')
const ownMemberships = membershipResult.data.filter((row) => row.user_id === profile?.id)
const ownOrgIds = new Set(ownMemberships.map((row) => row.organization_id).filter(Boolean))

const checks = []
for (const [table, label, orgField] of [
  ['core_organizations', 'Organizations', 'id'],
  ['core_memberships', 'Memberships', 'organization_id'],
  ['authz_user_role_assignments', 'Role assignments', 'organization_id'],
  ['bill_accounts', 'Billing accounts', 'organization_id'],
  ['bill_subscriptions', 'Subscriptions', 'organization_id'],
  ['bill_proposals', 'Proposals', 'organization_id'],
  ['bill_orders', 'Orders', 'organization_id'],
  ['bill_invoices', 'Invoices', 'organization_id'],
  ['bill_training_credits', 'Training credits', 'organization_id'],
  ['trn_sessions', 'Sessions', 'organization_id'],
  ['trn_session_participants', 'Participants', 'organization_id'],
  ['trn_certificates', 'Certificates', 'organization_id'],
]) {
  const result = await rows(table, selectForIsolation(table))
  const leakedRows =
    orgField === 'id'
      ? result.data.filter((row) => !ownOrgIds.has(row.id))
      : result.data.filter((row) => row.organization_id && !ownOrgIds.has(row.organization_id))

  checks.push({
    table,
    label,
    visible: result.data.length,
    ownVisible: result.data.length - leakedRows.length,
    leaked: leakedRows.length,
    error: result.error,
  })
}

console.log(`Partner isolation smoke user: ${email}`)
console.log(`Auth user: ${signIn.user.id}`)
console.log(`Profile: ${profile?.id || 'not visible'}`)
console.log(`Own organizations: ${Array.from(ownOrgIds).join(', ') || 'none visible'}`)
console.table(checks)

const leaks = checks.reduce((total, row) => total + row.leaked, 0)
const errors = checks.filter((row) => row.error).length

if (leaks > 0) {
  console.error(`Partner isolation FAILED: ${leaks} row(s) outside own organization visible.`)
  process.exit(1)
}

if (errors > 0) {
  console.warn(`Partner isolation completed with ${errors} table warning(s). Review RLS/table grants.`)
}

console.log('Partner isolation PASSED: no cross-organization rows visible for this test user.')
