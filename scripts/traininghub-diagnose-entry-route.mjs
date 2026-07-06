import fs from 'node:fs'
import { createClient } from '@supabase/supabase-js'

function loadEnv(file = '.env.local') {
  if (!fs.existsSync(file)) return
  for (const raw of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const line = raw.trim()
    if (!line || line.startsWith('#') || !line.includes('=')) continue
    const [key, ...rest] = line.split('=')
    if (!process.env[key]) process.env[key] = rest.join('=').replace(/^['"]|['"]$/g, '')
  }
}
loadEnv()

const args = process.argv.slice(2)
const getArg = (name, fallback = '') => {
  const index = args.indexOf(name)
  return index >= 0 ? args[index + 1] : fallback
}

const email = getArg('--email', '').trim().toLowerCase()
if (!email) {
  console.log('Usage: node --env-file=.env.local scripts/traininghub-diagnose-entry-route.mjs --email admin@email.com')
  process.exit(1)
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error('Missing Supabase env vars.')
  process.exit(1)
}

const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })

async function read(table) {
  const { data, error } = await supabase.from(table).select('*').limit(5000)
  return { table, rows: Array.isArray(data) ? data : [], error: error?.message || null }
}

function low(v) { return String(v || '').trim().toLowerCase() }
function text(row) { return low(Object.values(row || {}).map((v) => typeof v === 'object' ? JSON.stringify(v) : v).join(' ')) }

const [profiles, memberships, orgs, assignments, roles] = await Promise.all([
  read('core_user_profiles'),
  read('core_memberships'),
  read('core_organizations'),
  read('authz_user_role_assignments'),
  read('authz_roles'),
])

const p = profiles.rows.filter((row) => low(row.email) === email)
const profileIds = new Set(p.map((row) => String(row.id)))
const authIds = new Set(p.map((row) => String(row.auth_user_id || row.user_id || '')).filter(Boolean))
const m = memberships.rows.filter((row) => profileIds.has(String(row.profile_id)) || profileIds.has(String(row.user_id)) || authIds.has(String(row.auth_user_id)) || low(row.email) === email)
const orgIds = new Set([...p, ...m].map((row) => String(row.organization_id || row.org_id || row.tenant_id || '')).filter(Boolean))
const a = assignments.rows.filter((row) => profileIds.has(String(row.profile_id)) || profileIds.has(String(row.user_id)) || authIds.has(String(row.auth_user_id)) || orgIds.has(String(row.organization_id || row.org_id || row.tenant_id)))
const allOrgIds = new Set([...orgIds, ...a.map((row) => String(row.organization_id || row.org_id || row.tenant_id || '')).filter(Boolean)])
const o = orgs.rows.filter((row) => allOrgIds.has(String(row.id)))
const roleIds = new Set([...p, ...m, ...a].map((row) => String(row.role_id || '')).filter(Boolean))
const r = roles.rows.filter((row) => roleIds.has(String(row.id)))

const adminSignals = [...p, ...m, ...a, ...r, ...o].filter((row) => {
  const s = text(row)
  return s.includes('admin') || s.includes('owner') || s.includes('internal') || s.includes('super') || s.includes('opsos')
})

const partnerSignals = [...p, ...m, ...a, ...r, ...o].filter((row) => text(row).includes('partner'))

const report = {
  email,
  profiles: p.map((row) => ({ id: row.id, email: row.email, role: row.role, role_key: row.role_key, role_id: row.role_id, organization_id: row.organization_id, status: row.status, is_active: row.is_active })),
  memberships: m.map((row) => ({ id: row.id, user_id: row.user_id, profile_id: row.profile_id, auth_user_id: row.auth_user_id, organization_id: row.organization_id, role: row.role, role_key: row.role_key, role_id: row.role_id, status: row.status, is_active: row.is_active })),
  organizations: o.map((row) => ({ id: row.id, name: row.name || row.display_name || row.title, organization_type: row.organization_type, type: row.type, segment: row.segment, status: row.status, is_active: row.is_active, metadata: row.metadata })),
  roles: r.map((row) => ({ id: row.id, name: row.name, key: row.key, role_key: row.role_key, slug: row.slug })),
  roleAssignments: a.map((row) => ({ id: row.id, user_id: row.user_id, profile_id: row.profile_id, auth_user_id: row.auth_user_id, organization_id: row.organization_id, role_id: row.role_id, role: row.role, role_key: row.role_key, status: row.status, is_active: row.is_active })),
  adminSignals: adminSignals.length,
  partnerSignals: partnerSignals.length,
  expectedEntryRoute: adminSignals.length ? '/traininghub' : partnerSignals.length ? '/traininghub/partner' : '/traininghub/partner/login',
  tableErrors: [profiles, memberships, orgs, assignments, roles].filter((x) => x.error).map((x) => ({ table: x.table, error: x.error })),
}

fs.mkdirSync('tmp', { recursive: true })
fs.writeFileSync('tmp/traininghub-entry-route-diagnosis.json', JSON.stringify(report, null, 2))
console.log(JSON.stringify(report, null, 2))
console.log('\nSaved: tmp/traininghub-entry-route-diagnosis.json')
