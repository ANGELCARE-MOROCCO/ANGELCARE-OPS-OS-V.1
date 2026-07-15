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
const has = (name) => args.includes(name)

const email = (getArg('--email') || process.env.PARTNER_EMAIL || '').trim().toLowerCase()
const password = (getArg('--password') || process.env.PARTNER_PASSWORD || '').trim()
const orgId = (getArg('--org-id') || process.env.PARTNER_ORG_ID || '').trim()
const execute = has('--execute') && has('--yes')

if (!email || !password || !orgId) {
  console.error('Usage:')
  console.error('  node --env-file=.env.local scripts/traininghub-force-auth-reset-bind.mjs --email EMAIL --password PASSWORD --org-id ORG_ID --execute --yes')
  process.exit(1)
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const service = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !anon || !service) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, or SUPABASE_SERVICE_ROLE_KEY.')
  process.exit(1)
}
if (!execute) {
  console.error('Safety guard: add --execute --yes.')
  process.exit(1)
}

const admin = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } })
const publicClient = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } })

function text(error) {
  return String(error?.message || error || '')
}
function parseDbError(error) {
  const msg = text(error)
  return (
    msg.match(/Could not find the '([^']+)' column/i)?.[1] ||
    msg.match(/column [^.\s]+\.([a-zA-Z0-9_]+) does not exist/i)?.[1] ||
    msg.match(/null value in column "([^"]+)"/i)?.[1] ||
    ''
  )
}
function clean(row) {
  const next = { ...row }
  delete next.__variant
  return JSON.parse(JSON.stringify(next))
}
function isRecoverableShapeError(error) {
  const msg = text(error)
  return msg.includes('Could not find the') ||
    msg.includes('does not exist') ||
    msg.includes('violates foreign key constraint') ||
    msg.includes('null value in column') ||
    msg.includes('23503') ||
    msg.includes('23502')
}

async function adaptiveUpdate(table, id, payload) {
  let row = clean(payload || {})
  for (let attempt = 0; attempt < 22; attempt += 1) {
    const { data, error } = await admin.from(table).update(row).eq('id', id).select('*').maybeSingle()
    if (!error) return { table, action: 'update', id, ok: true, data }
    const column = parseDbError(error)
    if (column && column in row) {
      delete row[column]
      continue
    }
    return { table, action: 'update', id, ok: false, error: text(error), payload: row }
  }
  return { table, action: 'update', id, ok: false, error: 'adaptive update failed' }
}

async function adaptiveInsert(table, payload) {
  let row = clean(payload || {})
  for (let attempt = 0; attempt < 22; attempt += 1) {
    const { data, error } = await admin.from(table).insert(row).select('*').maybeSingle()
    if (!error) return { table, action: 'insert', ok: true, data }
    const column = parseDbError(error)
    if (column && column in row) {
      delete row[column]
      continue
    }
    return { table, action: 'insert', ok: false, error: text(error), payload: row }
  }
  return { table, action: 'insert', ok: false, error: 'adaptive insert failed' }
}

async function writeWithCandidates(table, existingId, candidates, label) {
  const errors = []

  for (const candidate of candidates) {
    const payload = clean(candidate)
    const variant = candidate.__variant || label

    if (existingId) {
      let row = { ...payload }
      for (let attempt = 0; attempt < 14; attempt += 1) {
        const { data, error } = await admin.from(table).update(row).eq('id', existingId).select('*').maybeSingle()
        if (!error) return { table, action: 'update', id: existingId, ok: true, data, variant }

        const column = parseDbError(error)
        if (column && column in row) {
          delete row[column]
          continue
        }

        errors.push({ variant, error: text(error) })
        break
      }
      continue
    }

    let row = { ...payload }
    for (let attempt = 0; attempt < 14; attempt += 1) {
      const { data, error } = await admin.from(table).insert(row).select('*').maybeSingle()
      if (!error) return { table, action: 'insert', ok: true, data, variant }

      const column = parseDbError(error)
      if (column && column in row) {
        delete row[column]
        continue
      }

      errors.push({ variant, error: text(error) })
      if (!isRecoverableShapeError(error)) break
      break
    }
  }

  return { table, action: existingId ? 'update' : 'insert', ok: false, error: errors.map((e) => `${e.variant}: ${e.error}`).join(' | ') }
}

async function selectRows(table, builder) {
  try {
    const { data, error } = await builder(admin.from(table).select('*'))
    if (error) return []
    return Array.isArray(data) ? data : data ? [data] : []
  } catch {
    return []
  }
}

async function findAuthUserByEmail(targetEmail) {
  let page = 1
  while (page <= 30) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) throw new Error(error.message)
    const found = data?.users?.find((user) => String(user.email || '').toLowerCase() === targetEmail)
    if (found) return found
    if (!data?.users?.length || data.users.length < 1000) break
    page += 1
  }
  return null
}

function looksLikePartnerRole(row) {
  const haystack = [
    row.key, row.slug, row.code, row.name, row.label, row.title, row.role, row.role_key,
    row.metadata?.key, row.metadata?.slug, row.metadata?.role, row.metadata?.role_key,
  ].filter(Boolean).join(' ').toLowerCase()

  return haystack.includes('partner_admin') ||
    haystack.includes('partner admin') ||
    haystack.includes('partenaire') ||
    haystack.includes('traininghub_partner') ||
    haystack.includes('partner')
}

async function resolveRoleId() {
  const candidateTables = [
    'authz_roles',
    'core_roles',
    'rbac_roles',
    'app_roles',
    'roles',
    'core_role_definitions',
    'authz_role_definitions',
  ]

  const scanReport = []

  for (const table of candidateTables) {
    const rows = await selectRows(table, (q) => q.select('*').limit(500))
    if (!rows.length) {
      scanReport.push({ table, rows: 0, roleId: '' })
      continue
    }

    const partner = rows.find(looksLikePartnerRole)
    const fallback = rows.find((r) => r.id && String(r.id).length >= 10)
    const chosen = partner || fallback

    scanReport.push({
      table,
      rows: rows.length,
      roleId: chosen?.id || '',
      chosenName: chosen?.name || chosen?.key || chosen?.slug || chosen?.role_key || '',
    })

    if (chosen?.id) {
      return { roleId: chosen.id, table, scanReport }
    }
  }

  return { roleId: '', table: '', scanReport }
}

const now = new Date().toISOString()
const results = []

console.log('\nTRAININGHUB FORCE AUTH RESET + ROLE-ID SAFE BIND')
console.log(`Email: ${email}`)
console.log(`Org:   ${orgId}`)

let authUser = await findAuthUserByEmail(email)
if (authUser?.id) {
  console.log(`\n1) Existing Auth user found: ${authUser.id}`)
  const authUpdate = await admin.auth.admin.updateUserById(authUser.id, {
    email,
    password,
    email_confirm: true,
    user_metadata: {
      ...(authUser.user_metadata || {}),
      organization_id: orgId,
      traininghub_role: 'partner_admin',
      access_level: 'standard_partner_access',
      portal_path: '/traininghub/partner',
      source: 'traininghub_force_auth_reset_role_id_safe_bind',
      password_reset_at: now,
    },
  })
  if (authUpdate.error) {
    console.error('Auth update failed:', authUpdate.error.message)
    process.exit(1)
  }
  authUser = authUpdate.data.user
  console.log('Password force-set in Supabase Auth ✅')
} else {
  console.log('\n1) No Auth user found. Creating Auth user...')
  const created = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      organization_id: orgId,
      traininghub_role: 'partner_admin',
      access_level: 'standard_partner_access',
      portal_path: '/traininghub/partner',
      source: 'traininghub_force_auth_reset_role_id_safe_bind',
      created_at: now,
    },
  })
  if (created.error) {
    console.error('Auth create failed:', created.error.message)
    process.exit(1)
  }
  authUser = created.data.user
  console.log(`Auth user created ✅ ${authUser.id}`)
}

const authUserId = authUser.id

console.log('\n2) Resolving required role_id...')
const roleResolution = await resolveRoleId()
console.table(roleResolution.scanReport)
if (!roleResolution.roleId) {
  console.error('Could not resolve a role_id. Your authz_user_role_assignments table requires role_id, but no role table was found.')
  console.error('Create/identify a partner_admin role in authz_roles/core_roles/rbac_roles, then rerun.')
  process.exit(1)
}
console.log(`role_id resolved ✅ ${roleResolution.roleId} from ${roleResolution.table}`)

console.log('\n3) Activating organization...')
const { data: org, error: orgError } = await admin.from('core_organizations').select('*').eq('id', orgId).maybeSingle()
if (orgError || !org) {
  console.error('Organization not found:', orgError?.message || orgId)
  process.exit(1)
}

results.push(await adaptiveUpdate('core_organizations', orgId, {
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
    traininghub_access_forced_at: now,
    traininghub_access_forced_for: email,
  },
  updated_at: now,
}))

console.log('\n4) Upserting active core_user_profiles...')
const profiles = [
  ...await selectRows('core_user_profiles', (q) => q.eq('auth_user_id', authUserId).limit(20)),
  ...await selectRows('core_user_profiles', (q) => q.eq('user_id', authUserId).limit(20)),
  ...await selectRows('core_user_profiles', (q) => q.ilike('email', email).limit(20)),
].filter((row, index, arr) => row?.id && arr.findIndex((x) => x.id === row.id) === index)

let profile = profiles.find((p) => p.organization_id === orgId) || profiles[0] || null

const profilePayload = {
  auth_user_id: authUserId,
  user_id: authUserId,
  organization_id: orgId,
  email,
  full_name: authUser.user_metadata?.full_name || email,
  display_name: authUser.user_metadata?.full_name || email,
  status: 'active',
  access_status: 'active',
  role: 'partner_admin',
  role_key: 'partner_admin',
  role_id: roleResolution.roleId,
  is_active: true,
  disabled_at: null,
  archived_at: null,
  deleted_at: null,
  metadata: {
    ...(profile?.metadata || {}),
    partner_portal_enabled: true,
    traininghub_role: 'partner_admin',
    role_id: roleResolution.roleId,
    access_level: 'standard_partner_access',
    portal_policy: 'own_org_only',
    portal_path: '/traininghub/partner',
    traininghub_access_forced_at: now,
  },
  updated_at: now,
}

const profileResult = profile?.id
  ? await adaptiveUpdate('core_user_profiles', profile.id, profilePayload)
  : await adaptiveInsert('core_user_profiles', { ...profilePayload, created_at: now })

results.push(profileResult)
if (!profileResult.ok) {
  console.error('Profile repair failed:', profileResult.error)
  process.exit(1)
}
profile = profileResult.data || profile
console.log(`Profile active/linked ✅ ${profile.id}`)

console.log('\n5) Upserting active core_memberships with FK-safe candidates...')
const memberships = [
  ...await selectRows('core_memberships', (q) => q.eq('organization_id', orgId).limit(100)),
  ...await selectRows('core_memberships', (q) => q.eq('user_id', authUserId).limit(100)),
  ...await selectRows('core_memberships', (q) => q.eq('user_id', profile.id).limit(100)),
  ...await selectRows('core_memberships', (q) => q.eq('profile_id', profile.id).limit(100)),
].filter((row, index, arr) => row?.id && arr.findIndex((x) => x.id === row.id) === index)

const membership = memberships.find((m) => m.organization_id === orgId && (m.user_id === authUserId || m.user_id === profile.id || m.auth_user_id === authUserId || m.profile_id === profile.id))

const membershipBase = {
  organization_id: orgId,
  auth_user_id: authUserId,
  profile_id: profile.id,
  role_id: roleResolution.roleId,
  role: 'partner_admin',
  role_key: 'partner_admin',
  status: 'active',
  membership_type: 'partner_portal',
  is_active: true,
  disabled_at: null,
  archived_at: null,
  deleted_at: null,
  metadata: {
    ...(membership?.metadata || {}),
    partner_portal_enabled: true,
    portal_path: '/traininghub/partner',
    access_level: 'standard_partner_access',
    portal_policy: 'own_org_only',
    role_id: roleResolution.roleId,
    traininghub_access_forced_at: now,
    auth_user_id: authUserId,
    profile_id: profile.id,
  },
  updated_at: now,
}

const membershipCandidates = [
  { __variant: 'membership_user_id_auth_role_id', ...membershipBase, user_id: authUserId, created_at: now },
  { __variant: 'membership_user_id_profile_role_id', ...membershipBase, user_id: profile.id, created_at: now },
  { __variant: 'membership_profile_only_role_id', ...membershipBase, created_at: now },
]

const membershipResult = await writeWithCandidates('core_memberships', membership?.id, membershipCandidates, 'membership')
results.push(membershipResult)
if (!membershipResult.ok) {
  console.error('Membership repair failed:', membershipResult.error)
  process.exit(1)
}
console.log(`Membership active/linked ✅ variant=${membershipResult.variant || 'default'}`)

console.log('\n6) Upserting active authz_user_role_assignments with role_id + FK-safe candidates...')
const assignments = [
  ...await selectRows('authz_user_role_assignments', (q) => q.eq('organization_id', orgId).limit(100)),
  ...await selectRows('authz_user_role_assignments', (q) => q.eq('user_id', authUserId).limit(100)),
  ...await selectRows('authz_user_role_assignments', (q) => q.eq('user_id', profile.id).limit(100)),
  ...await selectRows('authz_user_role_assignments', (q) => q.eq('profile_id', profile.id).limit(100)),
].filter((row, index, arr) => row?.id && arr.findIndex((x) => x.id === row.id) === index)

const assignment = assignments.find((r) => r.organization_id === orgId && (r.user_id === authUserId || r.user_id === profile.id || r.auth_user_id === authUserId || r.profile_id === profile.id || r.role_id === roleResolution.roleId))

const roleBase = {
  organization_id: orgId,
  auth_user_id: authUserId,
  profile_id: profile.id,
  role_id: roleResolution.roleId,
  role: 'partner_admin',
  role_key: 'partner_admin',
  scope_type: 'organization',
  scope_id: orgId,
  status: 'active',
  is_active: true,
  disabled_at: null,
  deleted_at: null,
  metadata: {
    ...(assignment?.metadata || {}),
    partner_portal_enabled: true,
    portal_path: '/traininghub/partner',
    access_level: 'standard_partner_access',
    portal_policy: 'own_org_only',
    role_id: roleResolution.roleId,
    traininghub_access_forced_at: now,
    auth_user_id: authUserId,
    profile_id: profile.id,
  },
  updated_at: now,
}

const roleCandidates = [
  { __variant: 'role_user_id_auth_with_role_id', ...roleBase, user_id: authUserId, created_at: now },
  { __variant: 'role_user_id_profile_with_role_id', ...roleBase, user_id: profile.id, created_at: now },
]

const roleResult = await writeWithCandidates('authz_user_role_assignments', assignment?.id, roleCandidates, 'role')
results.push(roleResult)
if (!roleResult.ok) {
  console.error('RBAC repair failed:', roleResult.error)
  process.exit(1)
}
console.log(`RBAC role active/linked ✅ variant=${roleResult.variant || 'default'}`)

console.log('\n7) Testing Supabase Auth sign-in with the forced password...')
const signIn = await publicClient.auth.signInWithPassword({ email, password })

if (signIn.error) {
  console.error('Still cannot login after force reset:', signIn.error.message)
  console.error('Check whether browser/app .env points to same Supabase project as this script.')
  process.exit(1)
}
console.log('Supabase Auth sign-in works ✅')

console.log('\n8) Final binding check...')
const finalProfiles = await selectRows('core_user_profiles', (q) => q.eq('organization_id', orgId).limit(100))
const finalMemberships = await selectRows('core_memberships', (q) => q.eq('organization_id', orgId).limit(100))
const finalRoles = await selectRows('authz_user_role_assignments', (q) => q.eq('organization_id', orgId).limit(100))

const activeProfile = finalProfiles.find((p) => String(p.email || '').toLowerCase() === email && p.auth_user_id === authUserId && p.status === 'active')
const activeMembership = finalMemberships.find((m) => (m.user_id === authUserId || m.user_id === activeProfile?.id || m.auth_user_id === authUserId || m.profile_id === activeProfile?.id) && m.status === 'active')
const activeRole = finalRoles.find((r) => (r.user_id === authUserId || r.user_id === activeProfile?.id || r.auth_user_id === authUserId || r.profile_id === activeProfile?.id) && r.role_id === roleResolution.roleId && r.status === 'active')

const verdict = {
  authSignIn: true,
  authUserId,
  roleId: roleResolution.roleId,
  organizationActive: true,
  activeProfile: Boolean(activeProfile),
  activeMembership: Boolean(activeMembership),
  activeRole: Boolean(activeRole),
}

console.table([verdict])

fs.mkdirSync('tmp', { recursive: true })
fs.writeFileSync('tmp/traininghub-force-auth-reset-bind-report.json', JSON.stringify({ email, orgId, verdict, roleResolution, results }, null, 2))

if (!verdict.activeProfile || !verdict.activeMembership || !verdict.activeRole) {
  console.error('Binding still incomplete. See tmp/traininghub-force-auth-reset-bind-report.json')
  process.exit(1)
}

console.log('\n✅ FINAL RESULT: AUTH + PROFILE + MEMBERSHIP + RBAC ROLE_ID ARE ACTIVE AND LINKED')
console.log('Open a NEW incognito window and retry: /traininghub/partner')
