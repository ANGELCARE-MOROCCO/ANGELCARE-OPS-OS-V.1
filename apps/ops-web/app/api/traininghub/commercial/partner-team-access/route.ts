import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getTrainingHubContext, requireTrainingHubPermission, trainingHubErrorResponse, TrainingHubHttpError } from '@/lib/traininghub/auth'

export const dynamic = 'force-dynamic'

type AnyRecord = Record<string, any>
const PERMS = ['training.access.manage', 'training.billing.manage']
const s = (v: unknown) => String(v || '').trim()
const lower = (v: unknown) => s(v).toLowerCase()
const password = () => `AC-Team-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}!`

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE
  if (!url || !key) throw new TrainingHubHttpError('Clé serveur Supabase requise pour gérer les accès partenaires.', 500, 'TRAININGHUB_SERVICE_ROLE_MISSING')
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } }) as any
}

function missingColumn(error: any) {
  const text = String(error?.message || error?.details || '')
  return text.match(/Could not find the '([^']+)' column/i)?.[1] || null
}

function notNullColumn(error: any) {
  const text = String(error?.message || error?.details || '')
  return text.match(/null value in column "([^"]+)"/i)?.[1] || null
}

function fallback(table: string, column: string, payload: AnyRecord) {
  const code = Date.now().toString(36).toUpperCase()
  const defaults: AnyRecord = {
    'core_user_profiles.status': 'active',
    'core_user_profiles.email': payload.email || `partner-${code.toLowerCase()}@example.com`,
    'core_user_profiles.full_name': payload.full_name || payload.name || 'Utilisateur partenaire',
    'core_memberships.status': 'active',
    'core_memberships.membership_type': 'partner',
    'authz_user_role_assignments.status': 'active',
    'authz_user_role_assignments.role_key': payload.role_key || 'traininghub_partner_member',
  }
  const key = `${table}.${column}`
  if (Object.prototype.hasOwnProperty.call(defaults, key)) return defaults[key]
  if (column.includes('status')) return 'active'
  if (column.includes('type')) return 'partner'
  if (column.includes('role')) return payload.role_key || 'traininghub_partner_member'
  if (column.includes('email')) return payload.email || `partner-${code.toLowerCase()}@example.com`
  if (column.includes('name') || column.includes('title')) return payload.full_name || 'Utilisateur partenaire'
  if (column === 'metadata' || column === 'payload') return {}
  return payload[column]
}

async function insertAdaptive(admin: any, table: string, payloads: AnyRecord[], code: string, message: string) {
  let last: any = null
  for (const payload of payloads) {
    let current = { ...payload }
    for (let i = 0; i < 12; i += 1) {
      const { data, error } = await admin.from(table).insert(current).select('*').maybeSingle()
      if (!error && data) return data
      last = error
      const miss = missingColumn(error)
      if (miss && Object.prototype.hasOwnProperty.call(current, miss)) {
        const { [miss]: _removed, ...next } = current
        current = next
        continue
      }
      const nn = notNullColumn(error)
      const val = nn ? fallback(table, nn, current) : undefined
      if (nn && val !== undefined) {
        current = { ...current, [nn]: val }
        continue
      }
      break
    }
  }
  throw new TrainingHubHttpError(last?.message || message, 500, code)
}

async function updateAdaptive(admin: any, table: string, id: string, payloads: AnyRecord[], code: string, message: string) {
  let last: any = null
  for (const payload of payloads) {
    let current = { ...payload }
    for (let i = 0; i < 10; i += 1) {
      const { data, error } = await admin.from(table).update(current).eq('id', id).select('*').maybeSingle()
      if (!error && data) return data
      last = error
      const miss = missingColumn(error)
      if (miss && Object.prototype.hasOwnProperty.call(current, miss)) {
        const { [miss]: _removed, ...next } = current
        current = next
        continue
      }
      break
    }
  }
  throw new TrainingHubHttpError(last?.message || message, 500, code)
}

async function audit(admin: any, payload: AnyRecord) {
  const row = { entity_type: 'traininghub_partner_team_access', severity: 'info', metadata: { source: 'traininghub_partner_team_access', ...(payload.metadata || {}) }, ...payload }
  for (const table of ['audit_change_logs', 'audit_security_logs']) {
    try {
      const { data, error } = await admin.from(table).insert(row).select('*').maybeSingle()
      if (!error && data) return data
    } catch {}
  }
  return null
}

async function organization(admin: any, id: string) {
  const { data, error } = await admin.from('core_organizations').select('*').eq('id', id).maybeSingle()
  if (error || !data?.id) throw new TrainingHubHttpError(error?.message || 'Partenaire introuvable.', 404, 'TRAININGHUB_PARTNER_NOT_FOUND')
  return data
}

async function profile(admin: any, id: string) {
  const { data, error } = await admin.from('core_user_profiles').select('*').eq('id', id).maybeSingle()
  if (error || !data?.id) throw new TrainingHubHttpError(error?.message || 'Utilisateur introuvable.', 404, 'TRAININGHUB_PROFILE_NOT_FOUND')
  return data
}

async function createUser(admin: any, body: AnyRecord, actorId: string) {
  const organizationId = s(body.organization_id)
  const fullName = s(body.full_name || body.name)
  const email = lower(body.email)
  const phone = s(body.phone)
  const jobTitle = s(body.job_title || 'Équipe partenaire')
  const roleKey = s(body.role_key || 'traininghub_partner_member')
  const tempPassword = s(body.temporary_password || body.password || password())
  if (!organizationId) throw new TrainingHubHttpError('Partenaire requis.', 400, 'TRAININGHUB_PARTNER_REQUIRED')
  if (!fullName) throw new TrainingHubHttpError('Nom utilisateur requis.', 400, 'TRAININGHUB_USER_NAME_REQUIRED')
  if (!email || !email.includes('@')) throw new TrainingHubHttpError('Email valide requis.', 400, 'TRAININGHUB_USER_EMAIL_REQUIRED')

  const org = await organization(admin, organizationId)
  const { data: existingProfiles } = await admin.from('core_user_profiles').select('*').eq('email', email).limit(1)
  const existing = Array.isArray(existingProfiles) ? existingProfiles[0] : null
  let authUserId = existing?.auth_user_id || existing?.id || ''

  if (!authUserId) {
    const { data, error } = await admin.auth.admin.createUser({ email, password: tempPassword, email_confirm: true, user_metadata: { full_name: fullName, organization_id: organizationId } })
    if (error && !String(error.message || '').toLowerCase().includes('already')) throw new TrainingHubHttpError(error.message, 500, 'TRAININGHUB_AUTH_CREATE_FAILED')
    authUserId = data?.user?.id || ''
    if (!authUserId) {
      const users = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
      authUserId = users.data?.users?.find((user: any) => lower(user.email) === email)?.id || ''
    }
  }
  if (!authUserId) throw new TrainingHubHttpError('Utilisateur auth non créé.', 500, 'TRAININGHUB_AUTH_USER_MISSING')

  const userProfile = existing || await insertAdaptive(admin, 'core_user_profiles', [
    { id: authUserId, auth_user_id: authUserId, organization_id: organizationId, email, full_name: fullName, display_name: fullName, phone, job_title: jobTitle, user_type: 'partner', status: 'active', metadata: { source: 'traininghub_partner_team_access' } },
    { auth_user_id: authUserId, organization_id: organizationId, email, full_name: fullName, status: 'active' },
    { id: authUserId, email, full_name: fullName, status: 'active' },
  ], 'TRAININGHUB_PROFILE_CREATE_FAILED', 'Profil utilisateur non créé.')

  const userId = userProfile.id || authUserId
  const { data: existingMemberships } = await admin.from('core_memberships').select('*').eq('organization_id', organizationId).eq('user_id', userId).limit(1)
  const membership = existingMemberships?.[0] || await insertAdaptive(admin, 'core_memberships', [
    { organization_id: organizationId, user_id: userId, role_key: roleKey, membership_type: 'partner', status: 'active', metadata: { source: 'traininghub_partner_team_access', job_title: jobTitle } },
    { organization_id: organizationId, user_id: userId, status: 'active' },
  ], 'TRAININGHUB_MEMBERSHIP_CREATE_FAILED', 'Rattachement utilisateur non créé.')

  const role = await insertAdaptive(admin, 'authz_user_role_assignments', [
    { organization_id: organizationId, user_id: userId, role_key: roleKey, status: 'active', permissions: roleKey === 'traininghub_partner_admin' ? ['training.partner.view', 'training.partner.learning', 'training.partner.certificates', 'training.partner.refresh', 'training.partner.team'] : ['training.partner.view', 'training.partner.learning', 'training.partner.certificates', 'training.partner.refresh'], metadata: { source: 'traininghub_partner_team_access' } },
    { organization_id: organizationId, user_id: userId, role_key: roleKey, status: 'active' },
  ], 'TRAININGHUB_ROLE_ASSIGNMENT_CREATE_FAILED', 'Rôle utilisateur non attribué.')

  await audit(admin, { organization_id: organizationId, actor_user_id: actorId, entity_id: userId, action: 'traininghub.partner.team_user_created', message: 'Utilisateur partenaire ajouté', metadata: { organization_name: org.name, email, role_key: roleKey, membership_id: membership.id, role_assignment_id: role.id } })
  return { organization: org, profile: userProfile, membership, role_assignment: role, login: { email, temporary_password: tempPassword, portal_url: '/traininghub/partner' } }
}

async function setStatus(admin: any, body: AnyRecord, actorId: string, enabled: boolean) {
  const profileId = s(body.profile_id || body.user_id)
  const organizationId = s(body.organization_id)
  if (!profileId || !organizationId) throw new TrainingHubHttpError('Partenaire et utilisateur requis.', 400, 'TRAININGHUB_ACCESS_TARGET_REQUIRED')
  const userProfile = await profile(admin, profileId)
  const status = enabled ? 'active' : 'suspended'
  const updated = await updateAdaptive(admin, 'core_user_profiles', userProfile.id, [{ status, metadata: { ...(userProfile.metadata || {}), partner_access_enabled: enabled, partner_access_changed_at: new Date().toISOString(), partner_access_changed_by: actorId } }, { status }], 'TRAININGHUB_PROFILE_STATUS_FAILED', 'Statut utilisateur non modifié.')
  const { data: memberships } = await admin.from('core_memberships').select('*').eq('organization_id', organizationId).eq('user_id', userProfile.id)
  for (const row of memberships || []) await updateAdaptive(admin, 'core_memberships', row.id, [{ status: enabled ? 'active' : 'inactive' }, { status }], 'TRAININGHUB_MEMBERSHIP_STATUS_FAILED', 'Rattachement non modifié.')
  const { data: roles } = await admin.from('authz_user_role_assignments').select('*').eq('organization_id', organizationId).eq('user_id', userProfile.id)
  for (const row of roles || []) await updateAdaptive(admin, 'authz_user_role_assignments', row.id, [{ status: enabled ? 'active' : 'inactive' }, { status }], 'TRAININGHUB_ROLE_STATUS_FAILED', 'Rôle non modifié.')
  try { await admin.auth.admin.updateUserById(userProfile.auth_user_id || userProfile.id, { ban_duration: enabled ? 'none' : '876000h' }) } catch {}
  await audit(admin, { organization_id: organizationId, actor_user_id: actorId, entity_id: userProfile.id, action: enabled ? 'traininghub.partner.access_enabled' : 'traininghub.partner.access_disabled', message: enabled ? 'Accès partenaire réactivé' : 'Accès partenaire désactivé', metadata: { email: userProfile.email } })
  return { profile: updated, enabled }
}

async function resetPassword(admin: any, body: AnyRecord, actorId: string) {
  const profileId = s(body.profile_id || body.user_id)
  const organizationId = s(body.organization_id)
  const tempPassword = s(body.temporary_password || body.password || password())
  if (!profileId || !organizationId) throw new TrainingHubHttpError('Partenaire et utilisateur requis.', 400, 'TRAININGHUB_ACCESS_TARGET_REQUIRED')
  const userProfile = await profile(admin, profileId)
  const { error } = await admin.auth.admin.updateUserById(userProfile.auth_user_id || userProfile.id, { password: tempPassword, email_confirm: true })
  if (error) throw new TrainingHubHttpError(error.message, 500, 'TRAININGHUB_PASSWORD_RESET_FAILED')
  await audit(admin, { organization_id: organizationId, actor_user_id: actorId, entity_id: userProfile.id, action: 'traininghub.partner.password_reset', message: 'Mot de passe partenaire réinitialisé', metadata: { email: userProfile.email } })
  return { profile: userProfile, login: { email: userProfile.email, temporary_password: tempPassword, portal_url: '/traininghub/partner' } }
}

export async function POST(request: NextRequest) {
  try {
    const context = await getTrainingHubContext()
    if (!context.isInternal && !context.isSuperAdmin) throw new TrainingHubHttpError('Accès direction requis.', 403, 'TRAININGHUB_TEAM_ACCESS_INTERNAL_ONLY')
    requireTrainingHubPermission(context, PERMS)
    const body = (await request.json()) as AnyRecord
    const action = s(body.action)
    const admin = adminClient()
    if (action === 'create_user') return NextResponse.json({ ok: true, data: await createUser(admin, body, context.profile.id) })
    if (action === 'disable_user') return NextResponse.json({ ok: true, data: await setStatus(admin, body, context.profile.id, false) })
    if (action === 'reactivate_user') return NextResponse.json({ ok: true, data: await setStatus(admin, body, context.profile.id, true) })
    if (action === 'reset_password') return NextResponse.json({ ok: true, data: await resetPassword(admin, body, context.profile.id) })
    throw new TrainingHubHttpError('Action accès utilisateur inconnue.', 400, 'TRAININGHUB_TEAM_ACCESS_ACTION_UNKNOWN')
  } catch (error) {
    return trainingHubErrorResponse(error)
  }
}
