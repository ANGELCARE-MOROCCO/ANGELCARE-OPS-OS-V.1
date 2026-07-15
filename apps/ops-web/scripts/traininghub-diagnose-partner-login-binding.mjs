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
const getArg = (name) => {
  const i = args.indexOf(name)
  return i >= 0 ? args[i + 1] : ''
}

const email = (getArg('--email') || process.env.PARTNER_EMAIL || process.env.PARTNER_TEST_EMAIL || '').trim().toLowerCase()
const orgIdArg = (getArg('--org-id') || process.env.PARTNER_ORG_ID || '').trim()
const orgNameArg = (getArg('--org-name') || process.env.PARTNER_ORG_NAME || '').trim()

if (!email && !orgIdArg && !orgNameArg) {
  console.error('Usage: node --env-file=.env.local scripts/traininghub-diagnose-partner-login-binding.mjs --email partner@example.com [--org-id uuid] [--org-name "GENY"]')
  process.exit(1)
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.')
  process.exit(1)
}

const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })

async function findAuthUserByEmail(email) {
  if (!email) return null
  let page = 1
  while (page <= 20) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) return { error: error.message }
    const found = data?.users?.find((user) => String(user.email || '').toLowerCase() === email)
    if (found) return found
    if (!data?.users?.length || data.users.length < 1000) break
    page += 1
  }
  return null
}

async function select(table, build) {
  try {
    const query = supabase.from(table).select('*')
    const { data, error } = await build(query)
    if (error) return { table, data: [], error: error.message }
    return { table, data: Array.isArray(data) ? data : data ? [data] : [], error: '' }
  } catch (error) {
    return { table, data: [], error: error.message || String(error) }
  }
}

const authUser = await findAuthUserByEmail(email)
const authUserId = authUser?.id || ''

const profilesByEmail = email ? await select('core_user_profiles', (q) => q.ilike('email', email)) : { data: [], error: '' }
const profilesByAuth = authUserId ? await select('core_user_profiles', (q) => q.eq('auth_user_id', authUserId)) : { data: [], error: '' }
const profileRows = [...profilesByEmail.data, ...profilesByAuth.data].filter((row, index, arr) => row?.id && arr.findIndex((x) => x.id === row.id) === index)

let orgIds = new Set()
for (const profile of profileRows) if (profile.organization_id) orgIds.add(profile.organization_id)
if (orgIdArg) orgIds.add(orgIdArg)

const membershipsByUser = authUserId ? await select('core_memberships', (q) => q.eq('user_id', authUserId)) : { data: [], error: '' }
const membershipsByProfile = profileRows.length ? await select('core_memberships', (q) => q.in('profile_id', profileRows.map((p) => p.id))) : { data: [], error: '' }
const membershipRows = [...membershipsByUser.data, ...membershipsByProfile.data].filter((row, index, arr) => row?.id && arr.findIndex((x) => x.id === row.id) === index)
for (const membership of membershipRows) if (membership.organization_id) orgIds.add(membership.organization_id)

let orgRows = []
if (orgIds.size) {
  const byIds = await select('core_organizations', (q) => q.in('id', [...orgIds]))
  orgRows.push(...byIds.data)
}
if (orgNameArg) {
  const byName = await select('core_organizations', (q) => q.ilike('name', `%${orgNameArg}%`))
  orgRows.push(...byName.data)
}
orgRows = orgRows.filter((row, index, arr) => row?.id && arr.findIndex((x) => x.id === row.id) === index)

const roleByUser = authUserId ? await select('authz_user_role_assignments', (q) => q.eq('user_id', authUserId)) : { data: [], error: '' }
const roleByProfile = profileRows.length ? await select('authz_user_role_assignments', (q) => q.in('profile_id', profileRows.map((p) => p.id))) : { data: [], error: '' }
const roleRows = [...roleByUser.data, ...roleByProfile.data].filter((row, index, arr) => row?.id && arr.findIndex((x) => x.id === row.id) === index)

const report = {
  generatedAt: new Date().toISOString(),
  input: { email, orgIdArg, orgNameArg },
  auth: authUser ? {
    found: true,
    id: authUser.id,
    email: authUser.email,
    confirmedAt: authUser.email_confirmed_at,
    disabledUntil: authUser.banned_until || null,
    userMetadata: authUser.user_metadata || {},
  } : { found: false, error: authUser?.error || '' },
  profiles: profileRows.map((p) => ({
    id: p.id,
    email: p.email,
    auth_user_id: p.auth_user_id,
    organization_id: p.organization_id,
    status: p.status,
    access_status: p.access_status,
    role: p.role || p.role_key || p.metadata?.traininghub_role || '',
    metadataAccess: p.metadata?.access || p.metadata || {},
  })),
  memberships: membershipRows.map((m) => ({
    id: m.id,
    organization_id: m.organization_id,
    user_id: m.user_id,
    auth_user_id: m.auth_user_id,
    profile_id: m.profile_id,
    role: m.role || m.role_key,
    status: m.status,
    membership_type: m.membership_type,
    metadata: m.metadata || {},
  })),
  organizations: orgRows.map((o) => ({
    id: o.id,
    name: o.name || o.display_name || o.legal_name,
    status: o.status,
    stage: o.stage,
    organization_type: o.organization_type,
    partner_type: o.partner_type,
    metadataStatus: {
      partner_portal_enabled: o.metadata?.partner_portal_enabled,
      access_temporarily_suspended: o.metadata?.access_temporarily_suspended,
      access: o.metadata?.access || null,
    },
  })),
  roleAssignments: roleRows.map((r) => ({
    id: r.id,
    organization_id: r.organization_id,
    user_id: r.user_id,
    auth_user_id: r.auth_user_id,
    profile_id: r.profile_id,
    role: r.role || r.role_key,
    role_key: r.role_key,
    scope_type: r.scope_type,
    scope_id: r.scope_id,
    status: r.status,
    metadata: r.metadata || {},
  })),
}

const activeOrg = report.organizations.find((o) => o.status === 'active' && o.stage !== 'inactive' && o.stage !== 'suspended')
const activeProfile = report.profiles.find((p) => p.status === 'active' && p.access_status !== 'inactive' && p.access_status !== 'suspended')
const activeMembership = report.memberships.find((m) => m.status === 'active' && m.organization_id === activeOrg?.id && (m.user_id === authUserId || m.profile_id === activeProfile?.id))
const activeRole = report.roleAssignments.find((r) => r.status === 'active' && r.organization_id === activeOrg?.id && (r.user_id === authUserId || r.profile_id === activeProfile?.id))

report.verdict = {
  authUserFound: Boolean(authUserId),
  activeProfileFound: Boolean(activeProfile),
  activeOrganizationFound: Boolean(activeOrg),
  activeMembershipFound: Boolean(activeMembership),
  activeRoleFound: Boolean(activeRole),
  likelyBlocker:
    !authUserId ? 'auth_user_missing'
    : !activeProfile ? 'active_core_user_profile_missing'
    : !activeOrg ? 'active_core_organization_missing'
    : !activeMembership ? 'active_core_membership_missing_or_not_linked_to_auth_user'
    : !activeRole ? 'active_authz_role_assignment_missing_or_not_linked'
    : 'binding_looks_ok_if_portal_still_fails_check_portal_resolver/RLS',
}

console.log('\nTrainingHub partner login binding diagnosis')
console.log(`Email: ${email || '-'}`)
console.log(`Likely blocker: ${report.verdict.likelyBlocker}\n`)

console.table([report.auth].map((a) => ({ authUserFound: a.found, authUserId: a.id || '', email: a.email || '' })))
console.log('\nProfiles')
console.table(report.profiles)
console.log('\nMemberships')
console.table(report.memberships)
console.log('\nOrganizations')
console.table(report.organizations)
console.log('\nRole assignments')
console.table(report.roleAssignments)
console.log('\nVerdict')
console.table([report.verdict])

fs.mkdirSync('tmp', { recursive: true })
fs.writeFileSync('tmp/traininghub-partner-login-binding-diagnosis.json', JSON.stringify(report, null, 2))
console.log('\nReport saved: tmp/traininghub-partner-login-binding-diagnosis.json')

if (report.verdict.likelyBlocker !== 'binding_looks_ok_if_portal_still_fails_check_portal_resolver/RLS') {
  process.exit(2)
}
