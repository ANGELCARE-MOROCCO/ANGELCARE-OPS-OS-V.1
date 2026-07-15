import fs from 'node:fs'
import crypto from 'node:crypto'
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
const getArg = (name) => {
  const i = args.indexOf(name)
  return i >= 0 ? args[i + 1] : ''
}
const has = (name) => args.includes(name)

const email = (getArg('--email') || process.env.PARTNER_EMAIL || process.env.PARTNER_TEST_EMAIL || '').trim().toLowerCase()
const orgIdArg = (getArg('--org-id') || process.env.PARTNER_ORG_ID || '').trim()
const orgNameArg = (getArg('--org-name') || process.env.PARTNER_ORG_NAME || '').trim()
const execute = has('--execute') && has('--yes')
const role = getArg('--role') || 'partner_admin'

if (!email) {
  console.error('Usage: node --env-file=.env.local scripts/traininghub-repair-partner-login-binding.mjs --email partner@example.com [--org-id uuid OR --org-name "GENY"] --execute --yes')
  process.exit(1)
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.')
  process.exit(1)
}

const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })

function parseDbError(message) {
  const missing =
    message.match(/Could not find the '([^']+)' column/i) ||
    message.match(/column [^.\s]+\.([a-zA-Z0-9_]+) does not exist/i)
  if (missing?.[1]) return missing[1]
  const notNull = message.match(/null value in column "([^"]+)"/i)
  if (notNull?.[1]) return notNull[1]
  return ''
}

async function adaptiveInsert(table, payload) {
  let row = JSON.parse(JSON.stringify(payload))
  for (let attempt = 0; attempt < 18; attempt += 1) {
    if (!execute) return { table, action: 'insert', ok: true, dryRun: true, payload: row }
    const { data, error } = await supabase.from(table).insert(row).select('*').maybeSingle()
    if (!error) return { table, action: 'insert', ok: true, data }
    const column = parseDbError(error.message || String(error))
    if (column && column in row) {
      delete row[column]
      continue
    }
    return { table, action: 'insert', ok: false, error: error.message || String(error), payload: row }
  }
  return { table, action: 'insert', ok: false, error: 'adaptive insert failed', payload: row }
}

async function adaptiveUpdate(table, id, payload) {
  let row = JSON.parse(JSON.stringify(payload))
  for (let attempt = 0; attempt < 18; attempt += 1) {
    if (!execute) return { table, action: 'update', id, ok: true, dryRun: true, payload: row }
    const { data, error } = await supabase.from(table).update(row).eq('id', id).select('*').maybeSingle()
    if (!error) return { table, action: 'update', id, ok: true, data }
    const column = parseDbError(error.message || String(error))
    if (column && column in row) {
      delete row[column]
      continue
    }
    return { table, action: 'update', id, ok: false, error: error.message || String(error), payload: row }
  }
  return { table, action: 'update', id, ok: false, error: 'adaptive update failed', payload: row }
}

async function selectAll(table, builder) {
  try {
    const { data, error } = await builder(supabase.from(table).select('*'))
    if (error) return []
    return Array.isArray(data) ? data : data ? [data] : []
  } catch {
    return []
  }
}

async function findAuthUser() {
  let page = 1
  while (page <= 20) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) throw new Error(error.message)
    const found = data?.users?.find((user) => String(user.email || '').toLowerCase() === email)
    if (found) return found
    if (!data?.users?.length || data.users.length < 1000) break
    page += 1
  }
  return null
}

const now = new Date().toISOString()
const authUser = await findAuthUser()
if (!authUser?.id) {
  console.error(`No Supabase Auth user found for ${email}. Create/regenerate password from the modal first.`)
  process.exit(1)
}

let org = null
if (orgIdArg) {
  const { data } = await supabase.from('core_organizations').select('*').eq('id', orgIdArg).maybeSingle()
  org = data || null
}
if (!org && orgNameArg) {
  const rows = await selectAll('core_organizations', (q) => q.ilike('name', `%${orgNameArg}%`).limit(5))
  org = rows[0] || null
}

const profilesByAuth = await selectAll('core_user_profiles', (q) => q.eq('auth_user_id', authUser.id).limit(10))
const profilesByEmail = await selectAll('core_user_profiles', (q) => q.ilike('email', email).limit(10))
let profiles = [...profilesByAuth, ...profilesByEmail].filter((row, index, arr) => row?.id && arr.findIndex((x) => x.id === row.id) === index)

if (!org && profiles[0]?.organization_id) {
  const { data } = await supabase.from('core_organizations').select('*').eq('id', profiles[0].organization_id).maybeSingle()
  org = data || null
}

if (!org) {
  console.error('Could not resolve partner organization. Provide --org-id or --org-name.')
  process.exit(1)
}

let profile = profiles.find((p) => p.organization_id === org.id) || profiles[0] || null

const results = []

results.push(await adaptiveUpdate('core_organizations', org.id, {
  status: 'active',
  stage: 'active',
  is_active: true,
  disabled_at: null,
  archived_at: null,
  deleted_at: null,
  metadata: {
    ...(org.metadata || {}),
    partner_portal_enabled: true,
    access_temporarily_suspended: false,
    activation_status_changed_at: now,
    access_status_changed_at: now,
    traininghub_access_repaired_at: now,
    traininghub_access_repaired_for: email,
  },
  updated_at: now,
}))

if (profile?.id) {
  results.push(await adaptiveUpdate('core_user_profiles', profile.id, {
    auth_user_id: authUser.id,
    user_id: authUser.id,
    organization_id: org.id,
    email,
    status: 'active',
    access_status: 'active',
    role,
    role_key: role,
    is_active: true,
    disabled_at: null,
    archived_at: null,
    deleted_at: null,
    metadata: {
      ...(profile.metadata || {}),
      partner_portal_enabled: true,
      traininghub_role: role,
      access_level: 'standard_partner_access',
      portal_policy: 'own_org_only',
      traininghub_access_repaired_at: now,
    },
    updated_at: now,
  }))
} else {
  const insertedProfile = await adaptiveInsert('core_user_profiles', {
    id: crypto.randomUUID(),
    auth_user_id: authUser.id,
    user_id: authUser.id,
    organization_id: org.id,
    email,
    full_name: authUser.user_metadata?.full_name || email,
    display_name: authUser.user_metadata?.full_name || email,
    status: 'active',
    access_status: 'active',
    role,
    role_key: role,
    is_active: true,
    metadata: {
      partner_portal_enabled: true,
      traininghub_role: role,
      access_level: 'standard_partner_access',
      portal_policy: 'own_org_only',
      traininghub_access_repaired_at: now,
    },
    created_at: now,
    updated_at: now,
  })
  results.push(insertedProfile)
  if (insertedProfile.data) profile = insertedProfile.data
}

const memberships = await selectAll('core_memberships', (q) => q.eq('organization_id', org.id).limit(50))
let membership = memberships.find((m) => m.user_id === authUser.id || m.auth_user_id === authUser.id || m.profile_id === profile?.id)

const membershipPayload = {
  organization_id: org.id,
  user_id: authUser.id,
  auth_user_id: authUser.id,
  profile_id: profile?.id || null,
  role,
  role_key: role,
  status: 'active',
  membership_type: 'partner_portal',
  is_active: true,
  disabled_at: null,
  archived_at: null,
  deleted_at: null,
  metadata: {
    ...(membership?.metadata || {}),
    source: 'traininghub_partner_login_binding_repair',
    partner_portal_enabled: true,
    portal_path: '/traininghub/partner',
    access_level: 'standard_partner_access',
    portal_policy: 'own_org_only',
    traininghub_access_repaired_at: now,
  },
  updated_at: now,
}

results.push(
  membership?.id
    ? await adaptiveUpdate('core_memberships', membership.id, membershipPayload)
    : await adaptiveInsert('core_memberships', { id: crypto.randomUUID(), ...membershipPayload, created_at: now })
)

const assignments = await selectAll('authz_user_role_assignments', (q) => q.eq('organization_id', org.id).limit(50))
let assignment = assignments.find((r) => r.user_id === authUser.id || r.auth_user_id === authUser.id || r.profile_id === profile?.id)

const rolePayload = {
  organization_id: org.id,
  user_id: authUser.id,
  auth_user_id: authUser.id,
  profile_id: profile?.id || null,
  role,
  role_key: role,
  scope_type: 'organization',
  scope_id: org.id,
  status: 'active',
  is_active: true,
  disabled_at: null,
  archived_at: null,
  deleted_at: null,
  metadata: {
    ...(assignment?.metadata || {}),
    source: 'traininghub_partner_login_binding_repair',
    partner_portal_enabled: true,
    portal_path: '/traininghub/partner',
    access_level: 'standard_partner_access',
    portal_policy: 'own_org_only',
    traininghub_access_repaired_at: now,
  },
  updated_at: now,
}

results.push(
  assignment?.id
    ? await adaptiveUpdate('authz_user_role_assignments', assignment.id, rolePayload)
    : await adaptiveInsert('authz_user_role_assignments', { id: crypto.randomUUID(), ...rolePayload, created_at: now })
)

try {
  const activityPayload = {
    organization_id: org.id,
    event_type: 'traininghub.partner_access.binding_repaired',
    title: 'Partner portal login binding repaired',
    status: 'recorded',
    metadata: {
      email,
      auth_user_id: authUser.id,
      profile_id: profile?.id || null,
      organization_id: org.id,
      role,
      execute,
    },
    created_at: now,
  }
  results.push(await adaptiveInsert('partner_activity_events', activityPayload))
} catch {}

const summary = {
  generatedAt: now,
  mode: execute ? 'EXECUTE' : 'DRY_RUN',
  email,
  authUserId: authUser.id,
  organizationId: org.id,
  organizationName: org.name || org.display_name || org.legal_name,
  profileId: profile?.id || null,
  results,
}

console.log(`\nTrainingHub partner login binding repair ${execute ? 'EXECUTE' : 'DRY RUN'}`)
console.table(results.map((r) => ({
  table: r.table,
  action: r.action,
  id: r.id || r.data?.id || '',
  ok: r.ok,
  dryRun: Boolean(r.dryRun),
  error: r.error || '',
})))

fs.mkdirSync('tmp', { recursive: true })
fs.writeFileSync('tmp/traininghub-partner-login-binding-repair.json', JSON.stringify(summary, null, 2))
console.log('\nReport saved: tmp/traininghub-partner-login-binding-repair.json')

if (!execute) {
  console.log('\nNo records changed. To execute, add: --execute --yes')
}

if (results.some((r) => !r.ok)) {
  process.exit(1)
}
