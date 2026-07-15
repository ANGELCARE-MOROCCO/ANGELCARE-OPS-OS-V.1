import fs from 'node:fs'
import readline from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'
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
const getArg = (name) => {
  const i = args.indexOf(name)
  return i >= 0 ? args[i + 1] : ''
}

const orgId = (getArg('--org-id') || process.env.PARTNER_ORG_ID || '').trim()
const orgName = (getArg('--org-name') || process.env.PARTNER_ORG_NAME || '').trim()
const execute = has('--execute') && has('--yes')
let email = (getArg('--email') || process.env.PARTNER_EMAIL || '').trim().toLowerCase()
let password = (getArg('--password') || process.env.PARTNER_PASSWORD || '').trim()

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const service = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !anon || !service) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, or SUPABASE_SERVICE_ROLE_KEY.')
  process.exit(1)
}

if (!email || !password) {
  const rl = readline.createInterface({ input, output })
  if (!email) email = (await rl.question('Partner email: ')).trim().toLowerCase()
  if (!password) password = (await rl.question('Partner password: ')).trim()
  rl.close()
}

const admin = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } })
const publicClient = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } })

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
  let row = JSON.parse(JSON.stringify(payload || {}))
  for (let attempt = 0; attempt < 18; attempt += 1) {
    if (!execute) return { table, action: 'insert', ok: true, dryRun: true, payload: row }
    const { data, error } = await admin.from(table).insert(row).select('*').maybeSingle()
    if (!error) return { table, action: 'insert', ok: true, data }
    const col = parseDbError(error.message || String(error))
    if (col && col in row) {
      delete row[col]
      continue
    }
    return { table, action: 'insert', ok: false, error: error.message || String(error), payload: row }
  }
  return { table, action: 'insert', ok: false, error: 'adaptive insert failed', payload: row }
}

async function adaptiveUpdate(table, id, payload) {
  let row = JSON.parse(JSON.stringify(payload || {}))
  for (let attempt = 0; attempt < 18; attempt += 1) {
    if (!execute) return { table, action: 'update', id, ok: true, dryRun: true, payload: row }
    const { data, error } = await admin.from(table).update(row).eq('id', id).select('*').maybeSingle()
    if (!error) return { table, action: 'update', id, ok: true, data }
    const col = parseDbError(error.message || String(error))
    if (col && col in row) {
      delete row[col]
      continue
    }
    return { table, action: 'update', id, ok: false, error: error.message || String(error), payload: row }
  }
  return { table, action: 'update', id, ok: false, error: 'adaptive update failed', payload: row }
}

async function listAuthUser(email) {
  let page = 1
  while (page <= 20) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) return { user: null, error: error.message }
    const found = data?.users?.find((user) => String(user.email || '').toLowerCase() === email)
    if (found) return { user: found, error: '' }
    if (!data?.users?.length || data.users.length < 1000) break
    page += 1
  }
  return { user: null, error: '' }
}

async function selectAll(table, builder) {
  try {
    const { data, error } = await builder(admin.from(table).select('*'))
    if (error) return { table, data: [], error: error.message }
    return { table, data: Array.isArray(data) ? data : data ? [data] : [], error: '' }
  } catch (error) {
    return { table, data: [], error: error.message || String(error) }
  }
}

async function resolveOrg(profileRows) {
  if (orgId) {
    const { data, error } = await admin.from('core_organizations').select('*').eq('id', orgId).maybeSingle()
    if (!error && data) return data
  }
  if (orgName) {
    const result = await selectAll('core_organizations', (q) => q.ilike('name', `%${orgName}%`).limit(10))
    if (result.data[0]) return result.data[0]
  }
  const profileOrg = profileRows.find((p) => p.organization_id)?.organization_id
  if (profileOrg) {
    const { data, error } = await admin.from('core_organizations').select('*').eq('id', profileOrg).maybeSingle()
    if (!error && data) return data
  }
  return null
}

async function attemptSignIn() {
  const { data, error } = await publicClient.auth.signInWithPassword({ email, password })
  return {
    ok: !error && Boolean(data?.user?.id),
    authUserId: data?.user?.id || '',
    session: Boolean(data?.session?.access_token),
    error: error?.message || '',
  }
}

async function main() {
  const signIn = await attemptSignIn()
  const authLookup = await listAuthUser(email)
  const authUser = authLookup.user
  const authUserId = signIn.authUserId || authUser?.id || ''

  const profilesByAuth = authUserId ? await selectAll('core_user_profiles', (q) => q.eq('auth_user_id', authUserId).limit(20)) : { data: [], error: '' }
  const profilesByUser = authUserId ? await selectAll('core_user_profiles', (q) => q.eq('user_id', authUserId).limit(20)) : { data: [], error: '' }
  const profilesByEmail = await selectAll('core_user_profiles', (q) => q.ilike('email', email).limit(20))
  let profiles = [...profilesByAuth.data, ...profilesByUser.data, ...profilesByEmail.data].filter((row, index, arr) => row?.id && arr.findIndex((x) => x.id === row.id) === index)

  const org = await resolveOrg(profiles)

  const membershipsByOrg = org?.id ? await selectAll('core_memberships', (q) => q.eq('organization_id', org.id).limit(50)) : { data: [], error: '' }
  const membershipsByUser = authUserId ? await selectAll('core_memberships', (q) => q.eq('user_id', authUserId).limit(50)) : { data: [], error: '' }
  let memberships = [...membershipsByOrg.data, ...membershipsByUser.data].filter((row, index, arr) => row?.id && arr.findIndex((x) => x.id === row.id) === index)

  const rolesByOrg = org?.id ? await selectAll('authz_user_role_assignments', (q) => q.eq('organization_id', org.id).limit(50)) : { data: [], error: '' }
  const rolesByUser = authUserId ? await selectAll('authz_user_role_assignments', (q) => q.eq('user_id', authUserId).limit(50)) : { data: [], error: '' }
  let roles = [...rolesByOrg.data, ...rolesByUser.data].filter((row, index, arr) => row?.id && arr.findIndex((x) => x.id === row.id) === index)

  const currentProfile = profiles.find((p) => p.organization_id === org?.id) || profiles[0] || null
  const activeOrg = org && org.status === 'active' && !['inactive', 'suspended'].includes(String(org.stage || ''))
  const activeProfile = profiles.find((p) => p.organization_id === org?.id && p.status === 'active' && !['inactive', 'suspended'].includes(String(p.access_status || '')))
  const activeMembership = memberships.find((m) => m.organization_id === org?.id && m.status === 'active' && (m.user_id === authUserId || m.auth_user_id === authUserId || m.profile_id === activeProfile?.id || m.profile_id === currentProfile?.id))
  const activeRole = roles.find((r) => r.organization_id === org?.id && r.status === 'active' && (r.user_id === authUserId || r.auth_user_id === authUserId || r.profile_id === activeProfile?.id || r.profile_id === currentProfile?.id))

  const reportBefore = {
    signIn,
    authUserFound: Boolean(authUserId),
    authUserId,
    organizationFound: Boolean(org?.id),
    organizationId: org?.id || '',
    organizationName: org?.name || org?.display_name || org?.legal_name || '',
    activeOrg: Boolean(activeOrg),
    activeProfile: Boolean(activeProfile),
    activeMembership: Boolean(activeMembership),
    activeRole: Boolean(activeRole),
    likelyBlocker:
      !signIn.ok ? 'password_or_auth_signin_failed'
      : !authUserId ? 'auth_user_missing'
      : !org?.id ? 'organization_not_resolved'
      : !activeOrg ? 'organization_not_active'
      : !activeProfile ? 'profile_missing_or_inactive'
      : !activeMembership ? 'membership_missing_or_inactive'
      : !activeRole ? 'role_assignment_missing_or_inactive'
      : 'binding_looks_ok_if_portal_still_fails_check_portal_resolver/RLS',
  }

  console.log('\nTrainingHub partner live login test')
  console.table([{
    email,
    signInOk: signIn.ok,
    authUserFound: Boolean(authUserId),
    authUserId,
    organization: reportBefore.organizationName,
    organizationId: reportBefore.organizationId,
    likelyBlocker: reportBefore.likelyBlocker,
    signInError: signIn.error,
  }])

  console.log('\nBinding before repair')
  console.table([reportBefore])

  const repairs = []
  const now = new Date().toISOString()

  if (signIn.ok && authUserId && org?.id) {
    repairs.push(await adaptiveUpdate('core_organizations', org.id, {
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
        traininghub_access_repaired_at: now,
        traininghub_access_repaired_for: email,
      },
      updated_at: now,
    }))

    let profile = currentProfile
    if (profile?.id) {
      repairs.push(await adaptiveUpdate('core_user_profiles', profile.id, {
        auth_user_id: authUserId,
        user_id: authUserId,
        organization_id: org.id,
        email,
        status: 'active',
        access_status: 'active',
        role: 'partner_admin',
        role_key: 'partner_admin',
        is_active: true,
        disabled_at: null,
        archived_at: null,
        deleted_at: null,
        metadata: {
          ...(profile.metadata || {}),
          partner_portal_enabled: true,
          traininghub_role: 'partner_admin',
          access_level: 'standard_partner_access',
          portal_policy: 'own_org_only',
          traininghub_access_repaired_at: now,
        },
        updated_at: now,
      }))
    } else {
      const insertedProfile = await adaptiveInsert('core_user_profiles', {
        auth_user_id: authUserId,
        user_id: authUserId,
        organization_id: org.id,
        email,
        full_name: authUser?.user_metadata?.full_name || email,
        display_name: authUser?.user_metadata?.full_name || email,
        status: 'active',
        access_status: 'active',
        role: 'partner_admin',
        role_key: 'partner_admin',
        is_active: true,
        metadata: {
          partner_portal_enabled: true,
          traininghub_role: 'partner_admin',
          access_level: 'standard_partner_access',
          portal_policy: 'own_org_only',
          traininghub_access_repaired_at: now,
        },
        created_at: now,
        updated_at: now,
      })
      repairs.push(insertedProfile)
      if (insertedProfile.data) profile = insertedProfile.data
    }

    const membership = memberships.find((m) => m.organization_id === org.id && (m.user_id === authUserId || m.auth_user_id === authUserId || m.profile_id === profile?.id))
    const membershipPayload = {
      organization_id: org.id,
      user_id: authUserId,
      auth_user_id: authUserId,
      profile_id: profile?.id || null,
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
        source: 'traininghub_partner_login_live_test_and_fix',
        partner_portal_enabled: true,
        portal_path: '/traininghub/partner',
        access_level: 'standard_partner_access',
        portal_policy: 'own_org_only',
        traininghub_access_repaired_at: now,
      },
      updated_at: now,
    }

    repairs.push(
      membership?.id
        ? await adaptiveUpdate('core_memberships', membership.id, membershipPayload)
        : await adaptiveInsert('core_memberships', { ...membershipPayload, created_at: now })
    )

    const role = roles.find((r) => r.organization_id === org.id && (r.user_id === authUserId || r.auth_user_id === authUserId || r.profile_id === profile?.id))
    const rolePayload = {
      organization_id: org.id,
      user_id: authUserId,
      auth_user_id: authUserId,
      profile_id: profile?.id || null,
      role: 'partner_admin',
      role_key: 'partner_admin',
      scope_type: 'organization',
      scope_id: org.id,
      status: 'active',
      is_active: true,
      disabled_at: null,
      archived_at: null,
      deleted_at: null,
      metadata: {
        ...(role?.metadata || {}),
        source: 'traininghub_partner_login_live_test_and_fix',
        partner_portal_enabled: true,
        portal_path: '/traininghub/partner',
        access_level: 'standard_partner_access',
        portal_policy: 'own_org_only',
        traininghub_access_repaired_at: now,
      },
      updated_at: now,
    }

    repairs.push(
      role?.id
        ? await adaptiveUpdate('authz_user_role_assignments', role.id, rolePayload)
        : await adaptiveInsert('authz_user_role_assignments', { ...rolePayload, created_at: now })
    )
  }

  console.log(`\nRepair mode: ${execute ? 'EXECUTE' : 'DRY RUN'}`)
  console.table(repairs.map((r) => ({
    table: r.table,
    action: r.action,
    ok: r.ok,
    dryRun: Boolean(r.dryRun),
    id: r.id || r.data?.id || '',
    error: r.error || '',
  })))

  const final = {
    generatedAt: now,
    email,
    mode: execute ? 'EXECUTE' : 'DRY_RUN',
    before: reportBefore,
    repairs,
    instruction:
      execute
        ? 'Repair executed. Retry /traininghub/partner in a fresh incognito window.'
        : 'No records changed. Re-run with --execute --yes to apply the repair.',
  }

  fs.mkdirSync('tmp', { recursive: true })
  fs.writeFileSync('tmp/traininghub-partner-login-live-test-and-fix-report.json', JSON.stringify(final, null, 2))
  console.log('\nReport saved: tmp/traininghub-partner-login-live-test-and-fix-report.json')

  if (!signIn.ok) {
    console.error('\nSupabase sign-in failed. Password is not accepted by Supabase Auth, or the user is not in this Supabase project.')
    process.exit(2)
  }

  if (repairs.some((r) => !r.ok)) {
    process.exit(1)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
