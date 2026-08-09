import { createClient } from '@supabase/supabase-js'

const args = new Set(process.argv.slice(2))
const EXECUTE = args.has('--execute')
const YES = args.has('--yes')
const DRY_RUN = !EXECUTE

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE

if (!url || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.')
  process.exit(1)
}

if (EXECUTE && !YES) {
  console.error('Refusing destructive cleanup without --yes.')
  console.error('Run dry-run first:')
  console.error('  node --env-file=.env.local scripts/traininghub-clean-smoke-records.mjs')
  console.error('Then execute:')
  console.error('  node --env-file=.env.local scripts/traininghub-clean-smoke-records.mjs --execute --yes')
  process.exit(1)
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

function unique(values) {
  return Array.from(new Set(values.filter(Boolean)))
}

async function selectAll(table, select, apply) {
  try {
    let query = supabase.from(table).select(select).limit(10000)
    if (apply) query = apply(query)
    const { data, error } = await query
    if (error) return { table, data: [], error: error.message }
    return { table, data: Array.isArray(data) ? data : [], error: '' }
  } catch (error) {
    return { table, data: [], error: error instanceof Error ? error.message : String(error || 'Erreur inconnue') }
  }
}

async function selectByIn(table, select, field, ids) {
  if (!ids.length) return { table, data: [], error: '' }
  return selectAll(table, select, (query) => query.in(field, ids))
}

async function selectSmoke(table, select) {
  const builders = {
    core_organizations: (q) => q.or('name.ilike.%SMOKE%,name.ilike.%Smoke%,primary_contact_email.ilike.%traininghub-smoke%,billing_email.ilike.%traininghub-smoke%'),
    core_user_profiles: (q) => q.or('email.ilike.%traininghub-smoke%,email.ilike.%smoke-participant%,full_name.ilike.%Smoke%'),
    bill_proposals: (q) => q.or('proposal_number.ilike.%SMOKE%,title.ilike.%Smoke%'),
    bill_orders: (q) => q.or('order_number.ilike.%SMOKE%,title.ilike.%Smoke%'),
    bill_invoices: (q) => q.or('invoice_number.ilike.%SMOKE%,title.ilike.%Smoke%'),
    trn_sessions: (q) => q.or('session_code.ilike.%SMOKE%,title.ilike.%Smoke%'),
    trn_session_participants: (q) => q.or('email.ilike.%smoke-participant%,full_name.ilike.%Smoke%,participant_name.ilike.%Smoke%'),
    trn_certificates: (q) => q.or('certificate_number.ilike.%SMOKE%'),
  }

  return selectAll(table, select, builders[table])
}

async function deleteIds(table, ids) {
  const safeIds = unique(ids)
  if (!safeIds.length) return { table, candidates: 0, deleted: 0, error: '' }
  if (DRY_RUN) return { table, candidates: safeIds.length, deleted: 0, error: '' }

  try {
    const { error } = await supabase.from(table).delete().in('id', safeIds)
    return { table, candidates: safeIds.length, deleted: error ? 0 : safeIds.length, error: error?.message || '' }
  } catch (error) {
    return { table, candidates: safeIds.length, deleted: 0, error: error instanceof Error ? error.message : String(error || 'Erreur inconnue') }
  }
}

async function deleteAuthUsers(authUserIds) {
  const ids = unique(authUserIds)
  const results = []
  for (const id of ids) {
    if (DRY_RUN) {
      results.push({ table: 'auth.users', candidates: 1, deleted: 0, error: '' })
      continue
    }

    try {
      const { error } = await supabase.auth.admin.deleteUser(id)
      results.push({ table: 'auth.users', candidates: 1, deleted: error ? 0 : 1, error: error?.message || '' })
    } catch (error) {
      results.push({ table: 'auth.users', candidates: 1, deleted: 0, error: error instanceof Error ? error.message : String(error || 'Erreur inconnue') })
    }
  }
  return results
}

const smokeOrgs = await selectSmoke('core_organizations', 'id,name,primary_contact_email,billing_email')
const smokeProfiles = await selectSmoke('core_user_profiles', 'id,auth_user_id,email,full_name')

let orgIds = unique(smokeOrgs.data.map((row) => row.id))
let profileIds = unique(smokeProfiles.data.map((row) => row.id))
let authUserIds = unique(smokeProfiles.data.map((row) => row.auth_user_id || row.id))

const proposalsByPattern = await selectSmoke('bill_proposals', 'id,organization_id,proposal_number,title')
const proposalsByOrg = await selectByIn('bill_proposals', 'id,organization_id,proposal_number,title', 'organization_id', orgIds)
const proposalIds = unique([...proposalsByPattern.data, ...proposalsByOrg.data].map((row) => row.id))
orgIds = unique([...orgIds, ...proposalsByPattern.data.map((row) => row.organization_id)])

const ordersByPattern = await selectSmoke('bill_orders', 'id,organization_id,proposal_id,order_number,title')
const ordersByOrg = await selectByIn('bill_orders', 'id,organization_id,proposal_id,order_number,title', 'organization_id', orgIds)
const ordersByProposal = await selectByIn('bill_orders', 'id,organization_id,proposal_id,order_number,title', 'proposal_id', proposalIds)
const orderIds = unique([...ordersByPattern.data, ...ordersByOrg.data, ...ordersByProposal.data].map((row) => row.id))
orgIds = unique([...orgIds, ...ordersByPattern.data.map((row) => row.organization_id)])

const invoicesByPattern = await selectSmoke('bill_invoices', 'id,organization_id,proposal_id,order_id,invoice_number,title')
const invoicesByOrg = await selectByIn('bill_invoices', 'id,organization_id,proposal_id,order_id,invoice_number,title', 'organization_id', orgIds)
const invoicesByOrder = await selectByIn('bill_invoices', 'id,organization_id,proposal_id,order_id,invoice_number,title', 'order_id', orderIds)
const invoiceIds = unique([...invoicesByPattern.data, ...invoicesByOrg.data, ...invoicesByOrder.data].map((row) => row.id))
orgIds = unique([...orgIds, ...invoicesByPattern.data.map((row) => row.organization_id)])

const sessionsByPattern = await selectSmoke('trn_sessions', 'id,organization_id,order_id,session_code,title')
const sessionsByOrg = await selectByIn('trn_sessions', 'id,organization_id,order_id,session_code,title', 'organization_id', orgIds)
const sessionsByOrder = await selectByIn('trn_sessions', 'id,organization_id,order_id,session_code,title', 'order_id', orderIds)
const sessionIds = unique([...sessionsByPattern.data, ...sessionsByOrg.data, ...sessionsByOrder.data].map((row) => row.id))
orgIds = unique([...orgIds, ...sessionsByPattern.data.map((row) => row.organization_id)])

const participantsByPattern = await selectSmoke('trn_session_participants', 'id,organization_id,session_id,email,full_name,participant_name')
const participantsBySession = await selectByIn('trn_session_participants', 'id,organization_id,session_id,email,full_name,participant_name', 'session_id', sessionIds)
const participantsByOrg = await selectByIn('trn_session_participants', 'id,organization_id,session_id,email,full_name,participant_name', 'organization_id', orgIds)
const participantIds = unique([...participantsByPattern.data, ...participantsBySession.data, ...participantsByOrg.data].map((row) => row.id))
orgIds = unique([...orgIds, ...participantsByPattern.data.map((row) => row.organization_id)])

const certificatesByPattern = await selectSmoke('trn_certificates', 'id,organization_id,session_id,participant_id,certificate_number')
const certificatesBySession = await selectByIn('trn_certificates', 'id,organization_id,session_id,participant_id,certificate_number', 'session_id', sessionIds)
const certificatesByOrg = await selectByIn('trn_certificates', 'id,organization_id,session_id,participant_id,certificate_number', 'organization_id', orgIds)
const certificatesByParticipant = await selectByIn('trn_certificates', 'id,organization_id,session_id,participant_id,certificate_number', 'participant_id', participantIds)
const certificateIds = unique([...certificatesByPattern.data, ...certificatesBySession.data, ...certificatesByOrg.data, ...certificatesByParticipant.data].map((row) => row.id))

const creditsByOrg = await selectByIn('bill_training_credits', 'id,organization_id,order_id', 'organization_id', orgIds)
const creditsByOrder = await selectByIn('bill_training_credits', 'id,organization_id,order_id', 'order_id', orderIds)
const creditIds = unique([...creditsByOrg.data, ...creditsByOrder.data].map((row) => row.id))

const paymentsByOrg = await selectByIn('bill_payments', 'id,organization_id,invoice_id', 'organization_id', orgIds)
const paymentsByInvoice = await selectByIn('bill_payments', 'id,organization_id,invoice_id', 'invoice_id', invoiceIds)
const paymentIds = unique([...paymentsByOrg.data, ...paymentsByInvoice.data].map((row) => row.id))

const invoiceItems = await selectByIn('bill_invoice_items', 'id,invoice_id', 'invoice_id', invoiceIds)
const orderItems = await selectByIn('bill_order_items', 'id,order_id', 'order_id', orderIds)
const proposalItems = await selectByIn('bill_proposal_items', 'id,proposal_id', 'proposal_id', proposalIds)

const accounts = await selectByIn('bill_accounts', 'id,organization_id', 'organization_id', orgIds)
const subscriptions = await selectByIn('bill_subscriptions', 'id,organization_id', 'organization_id', orgIds)
const membershipsByOrg = await selectByIn('core_memberships', 'id,user_id,organization_id', 'organization_id', orgIds)
const membershipsByUser = await selectByIn('core_memberships', 'id,user_id,organization_id', 'user_id', profileIds)
const roleAssignmentsByOrg = await selectByIn('authz_user_role_assignments', 'id,user_id,organization_id', 'organization_id', orgIds)
const roleAssignmentsByUser = await selectByIn('authz_user_role_assignments', 'id,user_id,organization_id', 'user_id', profileIds)

const deletionPlan = [
  ['trn_certificates', certificateIds],
  ['trn_session_participants', participantIds],
  ['trn_sessions', sessionIds],
  ['bill_training_credits', creditIds],
  ['bill_payments', paymentIds],
  ['bill_invoice_items', invoiceItems.data.map((row) => row.id)],
  ['bill_invoices', invoiceIds],
  ['bill_order_items', orderItems.data.map((row) => row.id)],
  ['bill_orders', orderIds],
  ['bill_proposal_items', proposalItems.data.map((row) => row.id)],
  ['bill_proposals', proposalIds],
  ['bill_subscriptions', subscriptions.data.map((row) => row.id)],
  ['bill_accounts', accounts.data.map((row) => row.id)],
  ['authz_user_role_assignments', unique([...roleAssignmentsByOrg.data, ...roleAssignmentsByUser.data].map((row) => row.id))],
  ['core_memberships', unique([...membershipsByOrg.data, ...membershipsByUser.data].map((row) => row.id))],
  ['core_user_profiles', profileIds],
  ['core_organizations', orgIds],
]

console.log(`TrainingHub smoke cleanup ${DRY_RUN ? 'DRY RUN' : 'EXECUTE'}`)
console.log('Smoke organization IDs:', orgIds.join(', ') || 'none')
console.log('Smoke profile IDs:', profileIds.join(', ') || 'none')

const planRows = deletionPlan.map(([table, ids]) => ({ table, candidates: unique(ids).length }))
console.table(planRows)

if (DRY_RUN) {
  console.log('\nNo records deleted. To execute:')
  console.log('  node --env-file=.env.local scripts/traininghub-clean-smoke-records.mjs --execute --yes')
  process.exit(0)
}

const results = []
for (const [table, ids] of deletionPlan) {
  results.push(await deleteIds(table, ids))
}

results.push(...await deleteAuthUsers(authUserIds))

console.log('\nCleanup results')
console.table(results)

const errors = results.filter((row) => row.error)
if (errors.length) {
  console.error(`Cleanup completed with ${errors.length} warning/error(s). Review rows above.`)
  process.exit(1)
}

console.log('Smoke cleanup completed.')
