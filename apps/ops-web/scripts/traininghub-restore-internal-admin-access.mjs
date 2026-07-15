import fs from 'node:fs'
import crypto from 'node:crypto'
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
const has = (name) => args.includes(name)
const getArg = (name, fallback = '') => {
  const index = args.indexOf(name)
  return index >= 0 ? args[index + 1] : fallback
}

const email = getArg('--email', '').trim().toLowerCase()
const password = getArg('--password', '')
const internalOrgName = getArg('--internal-org-name', 'AngelCare TrainingHub Internal Admin OS')
const execute = has('--execute') && has('--yes')

if (!email || !execute) {
  console.log('Usage:')
  console.log('  node --env-file=.env.local scripts/traininghub-restore-internal-admin-access.mjs --email ADMIN_EMAIL --password "PASSWORD" --execute --yes')
  console.log('')
  console.log('Notes:')
  console.log('  - This restores TrainingHub ADMIN access to an internal AngelCare organization.')
  console.log('  - It does not restore deleted partner data.')
  console.log('  - Use a real internal admin email, not a partner portal email.')
  process.exit(email ? 0 : 1)
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const service = process.env.SUPABASE_SERVICE_ROLE_KEY
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

if (!url || !service) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.')
  process.exit(1)
}

const admin = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } })
const publicClient = anon ? createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } }) : null

function uuid() {
  return crypto.randomUUID()
}

function now() {
  return new Date().toISOString()
}

function clean(value, fallback = '') {
  const text = String(value || '').trim()
  return text || fallback
}

function norm(value) {
  return clean(value).toLowerCase()
}

function asArray(data) {
  return Array.isArray(data) ? data : data ? [data] : []
}

function parseColumn(error) {
  const msg = String(error?.message || error || '')
  return (
    msg.match(/Could not find the '([^']+)' column/i)?.[1] ||
    msg.match(/column [^.\s]+\.([a-zA-Z0-9_]+) does not exist/i)?.[1] ||
    msg.match(/null value in column "([^"]+)"/i)?.[1] ||
    ''
  )
}

function isMissingTable(error) {
  const msg = String(error?.message || error || '').toLowerCase()
  return (
    msg.includes('not find the table') ||
    (msg.includes('table') && msg.includes('does not exist')) ||
    (msg.includes('relation') && msg.includes('does not exist'))
  )
}

function defaultForRequiredColumn(column, ctx = {}) {
  if (/id$/.test(column)) return uuid()
  if (column.includes('email')) return email
  if (column.includes('name')) return ctx.name || internalOrgName
  if (column.includes('status')) return 'active'
  if (column.includes('role')) return ctx.roleId || ctx.role || 'traininghub_admin'
  if (column.includes('type')) return 'internal'
  if (column.includes('created') || column.includes('updated')) return now()
  if (column.includes('active')) return true
  return 'active'
}

async function adaptiveInsert(table, payload, ctx = {}) {
  let row = JSON.parse(JSON.stringify(payload || {}))
  for (let attempt = 0; attempt < 32; attempt += 1) {
    const { data, error } = await admin.from(table).insert(row).select('*').maybeSingle()
    if (!error) return { ok: true, table, data, row, error: null }
    if (isMissingTable(error)) return { ok: false, table, data: null, row, error: error.message }
    const col = parseColumn(error)
    if (col) {
      if (String(error.message || '').includes('null value')) {
        row[col] = defaultForRequiredColumn(col, ctx)
      } else if (Object.prototype.hasOwnProperty.call(row, col)) {
        delete row[col]
      } else {
        row[col] = defaultForRequiredColumn(col, ctx)
      }
      continue
    }
    return { ok: false, table, data: null, row, error: error.message }
  }
  return { ok: false, table, data: null, row, error: 'Adaptive insert exhausted attempts.' }
}

async function adaptiveUpdateById(table, id, payload, ctx = {}) {
  let row = JSON.parse(JSON.stringify(payload || {}))
  for (let attempt = 0; attempt < 32; attempt += 1) {
    const { data, error } = await admin.from(table).update(row).eq('id', id).select('*').maybeSingle()
    if (!error) return { ok: true, table, data, row, error: null }
    if (isMissingTable(error)) return { ok: false, table, data: null, row, error: error.message }
    const col = parseColumn(error)
    if (col && Object.prototype.hasOwnProperty.call(row, col)) {
      delete row[col]
      continue
    }
    return { ok: false, table, data: null, row, error: error.message }
  }
  return { ok: false, table, data: null, row, error: 'Adaptive update exhausted attempts.' }
}

async function readRows(table, limit = 5000) {
  const { data, error } = await admin.from(table).select('*').limit(limit)
  if (error) return { rows: [], error: error.message }
  return { rows: asArray(data), error: null }
}

async function ensureAuthUser() {
  let found = null
  let page = 1

  while (!found && page <= 20) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) throw new Error(`Auth list failed: ${error.message}`)
    found = (data?.users || []).find((user) => norm(user.email) === email) || null
    if (!data?.users?.length || data.users.length < 1000) break
    page += 1
  }

  if (found) {
    if (password) {
      const { data, error } = await admin.auth.admin.updateUserById(found.id, {
        password,
        email_confirm: true,
        user_metadata: {
          ...(found.user_metadata || {}),
          traininghub_admin_restored: true,
          restored_at: now(),
        },
      })
      if (error) throw new Error(`Auth password/update failed: ${error.message}`)
      return data.user
    }
    return found
  }

  if (!password) {
    throw new Error('Auth user is missing and --password was not provided, so it cannot be recreated.')
  }

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      traininghub_admin_restored: true,
      role: 'traininghub_admin',
      restored_at: now(),
    },
  })

  if (error) throw new Error(`Auth create failed: ${error.message}`)
  return data.user
}

async function ensureInternalOrganization() {
  const orgs = await readRows('core_organizations', 5000)
  if (orgs.error) throw new Error(`core_organizations read failed: ${orgs.error}`)

  const existing =
    orgs.rows.find((org) => {
      const text = norm(`${org.name || ''} ${org.title || ''} ${org.display_name || ''} ${org.organization_type || ''} ${org.segment || ''} ${org.metadata ? JSON.stringify(org.metadata) : ''}`)
      return text.includes('angelcare') && (text.includes('internal') || text.includes('admin') || text.includes('opsos') || text.includes('traininghub'))
    }) ||
    orgs.rows.find((org) => {
      const text = norm(`${org.name || ''} ${org.organization_type || ''} ${org.segment || ''}`)
      return text.includes('internal') && !text.includes('partner_school')
    })

  if (existing?.id) return existing

  const payload = {
    id: uuid(),
    name: internalOrgName,
    display_name: internalOrgName,
    legal_name: 'AngelCare',
    status: 'active',
    access_status: 'active',
    organization_type: 'internal',
    type: 'internal',
    segment: 'angelcare_internal',
    is_active: true,
    metadata: {
      traininghub_internal_admin_org: true,
      source: 'traininghub_restore_internal_admin_access',
      created_at: now(),
    },
    created_at: now(),
    updated_at: now(),
  }

  const insert = await adaptiveInsert('core_organizations', payload, { name: internalOrgName })
  if (!insert.ok) throw new Error(`internal organization insert failed: ${insert.error}`)
  return insert.data
}

async function ensureRole() {
  const roles = await readRows('authz_roles', 5000)
  if (!roles.error) {
    const chosen =
      roles.rows.find((role) => {
        const text = norm(`${role.name || ''} ${role.key || ''} ${role.role_key || ''} ${role.slug || ''}`)
        return text.includes('super') && (text.includes('admin') || text.includes('owner'))
      }) ||
      roles.rows.find((role) => {
        const text = norm(`${role.name || ''} ${role.key || ''} ${role.role_key || ''} ${role.slug || ''}`)
        return text.includes('admin') || text.includes('owner')
      }) ||
      roles.rows[0]

    if (chosen?.id) return chosen
  }

  const payload = {
    id: uuid(),
    name: 'TrainingHub Super Admin',
    key: 'traininghub_super_admin',
    role_key: 'traininghub_super_admin',
    slug: 'traininghub_super_admin',
    status: 'active',
    is_active: true,
    created_at: now(),
    updated_at: now(),
  }

  const insert = await adaptiveInsert('authz_roles', payload, { role: 'traininghub_super_admin' })
  if (!insert.ok) throw new Error(`authz role insert failed: ${insert.error}`)
  return insert.data
}

function profilePayload(authUser, organization, role) {
  return {
    id: uuid(),
    email,
    auth_user_id: authUser.id,
    user_id: authUser.id,
    organization_id: organization.id,
    role_id: role.id,
    role: 'traininghub_admin',
    role_key: 'traininghub_admin',
    full_name: 'TrainingHub Admin',
    display_name: 'TrainingHub Admin',
    name: 'TrainingHub Admin',
    status: 'active',
    access_status: 'active',
    is_active: true,
    metadata: {
      traininghub_internal_admin: true,
      restored_after_partner_delete: true,
      restored_at: now(),
    },
    created_at: now(),
    updated_at: now(),
  }
}

async function ensureProfile(authUser, organization, role) {
  const profiles = await readRows('core_user_profiles', 5000)
  if (profiles.error) throw new Error(`core_user_profiles read failed: ${profiles.error}`)

  const existing = profiles.rows.find((profile) =>
    norm(profile.email) === email ||
    profile.auth_user_id === authUser.id ||
    profile.user_id === authUser.id
  )

  const payload = profilePayload(authUser, organization, role)

  if (existing?.id) {
    const update = await adaptiveUpdateById('core_user_profiles', existing.id, {
      ...payload,
      id: undefined,
      updated_at: now(),
    }, { roleId: role.id })
    if (!update.ok) throw new Error(`profile update failed: ${update.error}`)
    return update.data || { ...existing, ...payload, id: existing.id }
  }

  const insert = await adaptiveInsert('core_user_profiles', payload, { roleId: role.id })
  if (!insert.ok) throw new Error(`profile insert failed: ${insert.error}`)
  return insert.data
}

function membershipPayload(authUser, profile, organization, role) {
  return {
    id: uuid(),
    organization_id: organization.id,
    user_id: profile.id,
    profile_id: profile.id,
    auth_user_id: authUser.id,
    email,
    role_id: role.id,
    role: 'traininghub_admin',
    role_key: 'traininghub_admin',
    status: 'active',
    access_status: 'active',
    is_active: true,
    metadata: {
      traininghub_internal_admin: true,
      restored_after_partner_delete: true,
      restored_at: now(),
    },
    created_at: now(),
    updated_at: now(),
  }
}

async function ensureMembership(authUser, profile, organization, role) {
  const memberships = await readRows('core_memberships', 5000)
  if (memberships.error) throw new Error(`core_memberships read failed: ${memberships.error}`)

  const existing = memberships.rows.find((item) =>
    item.organization_id === organization.id &&
    (
      item.user_id === profile.id ||
      item.profile_id === profile.id ||
      item.auth_user_id === authUser.id ||
      item.user_id === authUser.id
    )
  )

  const payload = membershipPayload(authUser, profile, organization, role)

  if (existing?.id) {
    const update = await adaptiveUpdateById('core_memberships', existing.id, {
      ...payload,
      id: undefined,
      updated_at: now(),
    }, { roleId: role.id })
    if (!update.ok) throw new Error(`membership update failed: ${update.error}`)
    return update.data || { ...existing, ...payload, id: existing.id }
  }

  const insert = await adaptiveInsert('core_memberships', payload, { roleId: role.id })
  if (!insert.ok) throw new Error(`membership insert failed: ${insert.error}`)
  return insert.data
}

function roleAssignmentPayload(authUser, profile, organization, role) {
  return {
    id: uuid(),
    organization_id: organization.id,
    user_id: profile.id,
    profile_id: profile.id,
    auth_user_id: authUser.id,
    role_id: role.id,
    role: 'traininghub_admin',
    role_key: 'traininghub_admin',
    status: 'active',
    access_status: 'active',
    is_active: true,
    metadata: {
      traininghub_internal_admin: true,
      restored_after_partner_delete: true,
      restored_at: now(),
    },
    created_at: now(),
    updated_at: now(),
  }
}

async function ensureRoleAssignment(authUser, profile, organization, role) {
  const assignments = await readRows('authz_user_role_assignments', 5000)
  if (assignments.error) throw new Error(`authz_user_role_assignments read failed: ${assignments.error}`)

  const existing = assignments.rows.find((item) =>
    item.organization_id === organization.id &&
    item.role_id === role.id &&
    (
      item.user_id === profile.id ||
      item.profile_id === profile.id ||
      item.auth_user_id === authUser.id ||
      item.user_id === authUser.id
    )
  )

  const payload = roleAssignmentPayload(authUser, profile, organization, role)

  if (existing?.id) {
    const update = await adaptiveUpdateById('authz_user_role_assignments', existing.id, {
      ...payload,
      id: undefined,
      updated_at: now(),
    }, { roleId: role.id })
    if (!update.ok) throw new Error(`role assignment update failed: ${update.error}`)
    return update.data || { ...existing, ...payload, id: existing.id }
  }

  const insert = await adaptiveInsert('authz_user_role_assignments', payload, { roleId: role.id })
  if (!insert.ok) throw new Error(`role assignment insert failed: ${insert.error}`)
  return insert.data
}

async function testPasswordLogin() {
  if (!password || !publicClient) return { tested: false, ok: null, error: null }

  const { data, error } = await publicClient.auth.signInWithPassword({ email, password })

  if (error) return { tested: true, ok: false, error: error.message }

  await publicClient.auth.signOut().catch(() => null)
  return { tested: true, ok: Boolean(data?.user?.id), error: null, authUserId: data?.user?.id || null }
}

async function main() {
  const report = {
    email,
    startedAt: now(),
    steps: [],
  }

  const authUser = await ensureAuthUser()
  report.steps.push({ step: 'auth_user', ok: true, id: authUser.id })

  const organization = await ensureInternalOrganization()
  report.steps.push({ step: 'internal_organization', ok: true, id: organization.id, name: organization.name || organization.display_name || organization.title })

  const role = await ensureRole()
  report.steps.push({ step: 'role', ok: true, id: role.id, name: role.name || role.key || role.role_key })

  const profile = await ensureProfile(authUser, organization, role)
  report.steps.push({ step: 'profile', ok: true, id: profile.id })

  const membership = await ensureMembership(authUser, profile, organization, role)
  report.steps.push({ step: 'membership', ok: true, id: membership.id })

  const roleAssignment = await ensureRoleAssignment(authUser, profile, organization, role)
  report.steps.push({ step: 'role_assignment', ok: true, id: roleAssignment.id })

  const loginTest = await testPasswordLogin()
  report.steps.push({ step: 'password_login_test', ...loginTest })

  report.finishedAt = now()

  fs.mkdirSync('tmp', { recursive: true })
  fs.writeFileSync('tmp/traininghub-restore-internal-admin-access-report.json', JSON.stringify(report, null, 2))

  console.log('\nTRAININGHUB INTERNAL ADMIN RESTORE')
  console.table(report.steps)
  console.log('\nInternal org:', organization.id, organization.name || organization.display_name || organization.title)
  console.log('Profile:', profile.id)
  console.log('Auth user:', authUser.id)
  console.log('Report: tmp/traininghub-restore-internal-admin-access-report.json')

  if (loginTest.tested && !loginTest.ok) {
    console.error('\nAuth password login still failed:', loginTest.error)
    console.error('The database binding is repaired, but the password/email still does not sign into Supabase Auth.')
    process.exit(1)
  }

  console.log('\n✅ TrainingHub admin access binding restored.')
  console.log('Now clear browser cookies/localStorage for localhost:3000 or open a fresh incognito window.')
  console.log('Then login with the internal admin email, not the deleted partner portal account.')
}

main().catch((error) => {
  fs.mkdirSync('tmp', { recursive: true })
  fs.writeFileSync('tmp/traininghub-restore-internal-admin-access-error.json', JSON.stringify({
    email,
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : null,
  }, null, 2))
  console.error('\nRESTORE FAILED:', error instanceof Error ? error.message : error)
  console.error('Report: tmp/traininghub-restore-internal-admin-access-error.json')
  process.exit(1)
})
