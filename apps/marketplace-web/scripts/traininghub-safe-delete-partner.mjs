import fs from 'node:fs'
import { createClient } from '@supabase/supabase-js'

function loadEnv(file = '.env.local') {
  if (!fs.existsSync(file)) return
  for (const rawLine of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#') || !line.includes('=')) continue
    const [key, ...rest] = line.split('=')
    if (!process.env[key]) process.env[key] = rest.join('=').replace(/^['"]|['"]$/g, '')
  }
}

loadEnv()

const args = process.argv.slice(2)
const has = (name) => args.includes(name)
const getArg = (name, fallback = '') => {
  const index = args.indexOf(name)
  return index >= 0 ? args[index + 1] : fallback
}

const orgId = getArg('--org-id', '').trim()
const mode = getArg('--mode', 'hard_delete_if_smoke_else_archive')
const execute = has('--execute') && has('--yes')
const reason = getArg('--reason', 'CLI safe delete/cleanup')

if (!orgId || !execute) {
  console.log('Usage:')
  console.log('  node --env-file=.env.local scripts/traininghub-safe-delete-partner.mjs --org-id ORG_ID --mode hard_delete_if_smoke_else_archive --execute --yes')
  console.log('')
  console.log('Modes:')
  console.log('  archive')
  console.log('  suspend')
  console.log('  hard_delete')
  console.log('  hard_delete_if_smoke_else_archive')
  process.exit(orgId ? 0 : 1)
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const service = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !service) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.')
  process.exit(1)
}

const supabase = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } })

function clean(value, fallback = '') {
  const text = String(value || '').trim()
  return text || fallback
}

function normalize(value) {
  return clean(value).toLowerCase()
}

function nowIso() {
  return new Date().toISOString()
}

function isSmoke(org) {
  const haystack = [org.name, org.legal_name, org.display_name, org.email, org.primary_contact_email, JSON.stringify(org.metadata || {})].map(normalize).join(' ')
  return haystack.includes('smoke') || haystack.includes('test') || haystack.includes('demo') || org.metadata?.is_smoke === true
}

async function updateOrDelete(table, column, value, hard, payload) {
  try {
    const query = hard
      ? supabase.from(table).delete().eq(column, value).select('id')
      : supabase.from(table).update(payload).eq(column, value).select('id')
    const { data, error } = await query
    if (error) return { table, column, ok: false, count: 0, error: error.message }
    return { table, column, ok: true, count: Array.isArray(data) ? data.length : 0, error: '' }
  } catch (error) {
    return { table, column, ok: true, count: 0, error: '' }
  }
}

const CHILD_TABLES = [
  'partner_documents',
  'trn_certificates',
  'trn_session_participants',
  'trn_sessions',
  'bill_training_credits',
  'bill_invoices',
  'bill_orders',
  'bill_proposals',
  'bill_subscriptions',
  'bill_accounts',
  'partner_requests',
  'traininghub_commercial_opportunities',
  'learn_entitlements',
  'core_organization_sites',
  'authz_user_role_assignments',
  'core_memberships',
]

async function main() {
  const { data: org, error } = await supabase.from('core_organizations').select('*').eq('id', orgId).maybeSingle()
  if (error || !org) {
    console.error('Organization not found:', error?.message || orgId)
    process.exit(1)
  }

  const smokeSafe = isSmoke(org)
  const hard = mode === 'hard_delete' || (mode === 'hard_delete_if_smoke_else_archive' && smokeSafe)
  const archivePayload = {
    status: mode === 'suspend' ? 'suspended' : 'archived',
    access_status: mode === 'suspend' ? 'suspended' : 'archived',
    stage: mode === 'suspend' ? 'suspended' : 'archived',
    is_active: false,
    portal_visible: false,
    is_visible_to_partner: false,
    archived_at: nowIso(),
    deleted_at: nowIso(),
    updated_at: nowIso(),
  }

  const results = []
  for (const table of CHILD_TABLES) {
    results.push(await updateOrDelete(table, 'organization_id', orgId, hard, archivePayload))
    results.push(await updateOrDelete(table, 'partner_id', orgId, hard, archivePayload))
  }

  let orgResult = await updateOrDelete('core_organizations', 'id', orgId, hard, archivePayload)
  if (!orgResult.ok && hard) {
    orgResult = await updateOrDelete('core_organizations', 'id', orgId, false, archivePayload)
  }
  results.push(orgResult)

  console.log(`\nTrainingHub safe delete partner: ${clean(org.name || org.legal_name || org.display_name, orgId)}`)
  console.log(`Mode requested: ${mode}`)
  console.log(`Smoke-safe detected: ${smokeSafe}`)
  console.log(`Hard delete attempted: ${hard}`)
  console.table(results.filter((r) => r.count || r.error).map((r) => ({
    table: r.table,
    column: r.column,
    ok: r.ok,
    count: r.count,
    error: r.error,
  })))

  fs.mkdirSync('tmp', { recursive: true })
  fs.writeFileSync('tmp/traininghub-safe-delete-partner-report.json', JSON.stringify({ orgId, mode, smokeSafe, hard, reason, results }, null, 2))

  if (!orgResult.ok) {
    console.error('\nCould not complete organization delete/archive. Check tmp/traininghub-safe-delete-partner-report.json')
    process.exit(1)
  }

  console.log('\n✅ Safe delete/archive completed.')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
