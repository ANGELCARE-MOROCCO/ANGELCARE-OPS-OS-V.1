import crypto from 'crypto'
import { cookies } from 'next/headers'
import { getCurrentUser } from '@/lib/ac360-portability/get-user'
import { APP_SESSION_COOKIE, hashPassword } from '@/lib/ac360-portability/auth-session'
import { createServiceClient } from '@/lib/supabase/server'
import { sendAngelcare360Email } from '@/lib/angelcare360/email/email-os-bridge'
import { requireAngelcare360OperatorPermission } from './access'
import { writeOperatorAuditLog } from './audit'
import { asString, asStringArray, getOperatorClient, safeList, toRecord } from './shared'
import type {
  TenantAccessAccountRecord,
  TenantAccessSnapshot,
  TenantRoleTemplateRecord,
} from '@/types/angelcare360/operator/tenant-access'

const ACCESS_TABLE = 'angelcare360_operator_tenant_access_accounts'
const INVITE_TABLE = 'angelcare360_operator_tenant_admin_invitations'
const SCOPE_TABLE = 'angelcare360_operator_tenant_access_scopes'
const EVENT_TABLE = 'angelcare360_operator_tenant_access_events'
const RESET_TABLE = 'angelcare360_operator_tenant_password_resets'
const SUPPORT_TABLE = 'angelcare360_operator_tenant_support_access_sessions'
const TRANSFER_TABLE = 'angelcare360_operator_tenant_owner_transfers'
const ROLE_TABLE = 'angelcare360_operator_tenant_role_templates'


const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
const APP_ROLE_MAP: Record<string, string> = {
  tenant_owner: 'direction_generale',
  general_direction: 'direction_generale',
  school_admin: 'administration',
  finance_admin: 'comptabilite',
  operations_admin: 'administration',
  academic_admin: 'administration',
  hr_admin: 'rh',
  support_contact: 'support',
  auditor: 'qualite',
  custom: 'administration',
}

const SCHOOL_ROLE_MAP: Record<string, string> = {
  tenant_owner: 'direction_generale',
  general_direction: 'direction_generale',
  school_admin: 'direction_etablissement',
  finance_admin: 'comptabilite',
  operations_admin: 'administration',
  academic_admin: 'administration',
  hr_admin: 'rh',
  support_contact: 'support',
  auditor: 'qualite',
  custom: 'administration',
}

function effectiveAppPermissions(account: Record<string, unknown>) {
  const allowed = asStringArray(account.explicit_permissions)
  const modules = asStringArray(account.module_keys).map((key) => `module:${key}`)
  const denied = asStringArray(account.denied_permissions).map((key) => `deny:${key}`)
  return [...new Set([...allowed, ...modules, ...denied])]
}

function accessEncryptionKey() {
  const source = String(process.env.TENANT_ACCESS_ENCRYPTION_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '')
  if (!source) throw new Error('TENANT_ACCESS_ENCRYPTION_KEY or SUPABASE_SERVICE_ROLE_KEY is required for MFA secret protection.')
  return crypto.createHash('sha256').update(source).digest()
}

function encryptSecret(secret: string) {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', accessEncryptionKey(), iv)
  const ciphertext = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return [iv, tag, ciphertext].map((part) => part.toString('base64url')).join('.')
}

function decryptSecret(payload: string) {
  const [ivValue, tagValue, ciphertextValue] = String(payload || '').split('.')
  if (!ivValue || !tagValue || !ciphertextValue) throw new Error('Invalid encrypted MFA secret.')
  const decipher = crypto.createDecipheriv('aes-256-gcm', accessEncryptionKey(), Buffer.from(ivValue, 'base64url'))
  decipher.setAuthTag(Buffer.from(tagValue, 'base64url'))
  return Buffer.concat([decipher.update(Buffer.from(ciphertextValue, 'base64url')), decipher.final()]).toString('utf8')
}

function base32Encode(buffer: Buffer) {
  let bits = ''
  for (const byte of buffer) bits += byte.toString(2).padStart(8, '0')
  let output = ''
  for (let index = 0; index < bits.length; index += 5) output += BASE32_ALPHABET[parseInt(bits.slice(index, index + 5).padEnd(5, '0'), 2)]
  return output
}

function base32Decode(value: string) {
  const clean = value.toUpperCase().replace(/[^A-Z2-7]/g, '')
  let bits = ''
  for (const character of clean) {
    const index = BASE32_ALPHABET.indexOf(character)
    if (index < 0) continue
    bits += index.toString(2).padStart(5, '0')
  }
  const bytes: number[] = []
  for (let index = 0; index + 8 <= bits.length; index += 8) bytes.push(parseInt(bits.slice(index, index + 8), 2))
  return Buffer.from(bytes)
}

function totpCode(secret: string, timestamp = Date.now()) {
  const counter = Math.floor(timestamp / 30000)
  const buffer = Buffer.alloc(8)
  buffer.writeBigUInt64BE(BigInt(counter))
  const digest = crypto.createHmac('sha1', base32Decode(secret)).update(buffer).digest()
  const offset = digest[digest.length - 1] & 0x0f
  const value = ((digest[offset] & 0x7f) << 24) | ((digest[offset + 1] & 0xff) << 16) | ((digest[offset + 2] & 0xff) << 8) | (digest[offset + 3] & 0xff)
  return String(value % 1000000).padStart(6, '0')
}

function verifyTotp(secret: string, code: string) {
  const clean = String(code || '').replace(/\s/g, '')
  if (!/^\d{6}$/.test(clean)) return false
  return [-1, 0, 1].some((window) => crypto.timingSafeEqual(Buffer.from(totpCode(secret, Date.now() + window * 30000)), Buffer.from(clean)))
}

function generateRecoveryCodes() {
  return Array.from({ length: 8 }, () => crypto.randomBytes(5).toString('hex').toUpperCase())
}

function recoveryDigest(value: string) {
  return crypto.createHash('sha256').update(String(value || '').trim().toUpperCase()).digest('hex')
}

function normalizeEmail(value: unknown) {
  return asString(value).trim().toLowerCase()
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function tokenDigest(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

function rawToken() {
  return crypto.randomBytes(32).toString('base64url')
}

function toIso(value: unknown) {
  const text = asString(value).trim()
  if (!text) return null
  const date = new Date(text)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

function activationBase(origin?: string) {
  const configured = String(process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || '').replace(/\/$/, '')
  return configured || String(origin || '').replace(/\/$/, '') || 'http://localhost:3000'
}

async function writeAccessEvent(input: {
  accessAccountId?: string | null
  clientId?: string | null
  tenantId?: string | null
  actorUserId?: string | null
  eventType: string
  severity?: string
  summary: string
  metadata?: Record<string, unknown>
}) {
  const db = await getOperatorClient()
  await db.from(EVENT_TABLE).insert({
    access_account_id: input.accessAccountId || null,
    client_id: input.clientId || null,
    tenant_id: input.tenantId || null,
    actor_user_id: input.actorUserId || null,
    event_type: input.eventType,
    severity: input.severity || 'info',
    summary: input.summary,
    metadata: input.metadata || {},
  }).then(() => null, () => null)
}

export async function getTenantAccessSnapshot(filters?: { clientId?: string | null; tenantId?: string | null }): Promise<TenantAccessSnapshot> {
  await requireAngelcare360OperatorPermission('operator.tenants.view')
  const db = await getOperatorClient()
  const conditions: Array<[string, 'eq', unknown]> = []
  if (filters?.clientId) conditions.push(['client_id', 'eq', filters.clientId])
  if (filters?.tenantId) conditions.push(['tenant_id', 'eq', filters.tenantId])

  const [accounts, invitations, scopes, events, roleTemplates, permissionCatalog, supportSessions, ownerTransfers, clients, tenants, schools, campuses, entitlementSnapshots, entitlementItems] = await Promise.all([
    safeList(ACCESS_TABLE, 'id,client_id,tenant_id,app_user_id,membership_id,school_user_role_id,school_id,organization_id,campus_id,full_name,email,phone,job_title,preferred_language,role_template,status,is_primary_owner,scope_mode,module_keys,explicit_permissions,denied_permissions,security_policy,access_starts_at,access_expires_at,invited_at,activated_at,last_login_at,last_security_event_at,mfa_enrolled_at,mfa_last_verified_at,created_at,updated_at, client:angelcare360_operator_clients(id,client_code,display_name,legal_name,status), tenant:angelcare360_operator_tenants(id,tenant_slug,status,provisioning_status,school_id,client_id)', conditions, ['updated_at', { ascending: false }]),
    safeList(INVITE_TABLE, 'id,access_account_id,email,status,delivery_status,expires_at,sent_at,opened_at,accepted_at,cancelled_at,created_at', [], ['created_at', { ascending: false }], 300),
    safeList(SCOPE_TABLE, '*', [], ['created_at', { ascending: false }], 500),
    safeList(EVENT_TABLE, '*', filters?.tenantId ? [['tenant_id', 'eq', filters.tenantId]] : filters?.clientId ? [['client_id', 'eq', filters.clientId]] : [], ['created_at', { ascending: false }], 300),
    safeList(ROLE_TABLE, '*', [['status', 'eq', 'active']], ['name', { ascending: true }]),
    safeList('angelcare360_permissions', 'permission_key,domain_key,action_key,label,description,risk_level', [['status', 'eq', 'active']], ['domain_key', { ascending: true }], 1000),
    safeList(SUPPORT_TABLE, '*', filters?.tenantId ? [['tenant_id', 'eq', filters.tenantId]] : filters?.clientId ? [['client_id', 'eq', filters.clientId]] : [], ['created_at', { ascending: false }], 100),
    safeList(TRANSFER_TABLE, '*', filters?.tenantId ? [['tenant_id', 'eq', filters.tenantId]] : [], ['created_at', { ascending: false }], 100),
    safeList('angelcare360_operator_clients', 'id,client_code,display_name,legal_name,status,primary_contact_email', filters?.clientId ? [['id', 'eq', filters.clientId]] : [], ['display_name', { ascending: true }]),
    safeList('angelcare360_operator_tenants', 'id,client_id,school_id,tenant_slug,status,provisioning_status,command_center_url', filters?.tenantId ? [['id', 'eq', filters.tenantId]] : filters?.clientId ? [['client_id', 'eq', filters.clientId]] : [], ['tenant_slug', { ascending: true }]),
    safeList('angelcare360_schools', 'id,school_code,name,status,language,currency,timezone', [], ['name', { ascending: true }]),
    safeList('angelcare360_campuses', 'id,school_id,campus_code,name,city,status', [], ['name', { ascending: true }]),
    safeList('angelcare360_operator_tenant_entitlement_snapshots', '*', filters?.tenantId ? [['tenant_id', 'eq', filters.tenantId]] : filters?.clientId ? [['client_id', 'eq', filters.clientId]] : [], ['created_at', { ascending: false }], 200),
    safeList('angelcare360_operator_tenant_entitlement_items', '*', [], ['created_at', { ascending: false }], 2000),
  ])

  const userIds = (accounts as TenantAccessAccountRecord[]).map((row) => row.app_user_id).filter(Boolean) as string[]
  const activeSessionCounts: Record<string, number> = {}
  let sessions: Array<Record<string, unknown>> = []
  if (userIds.length) {
    const result = await db.from('app_sessions').select('user_id,created_at,expires_at,mfa_verified_at,device_label,ip_address,user_agent,last_seen_at').in('user_id', userIds).gt('expires_at', new Date().toISOString())
    sessions = result.data || []
    for (const row of sessions) activeSessionCounts[String(row.user_id)] = (activeSessionCounts[String(row.user_id)] || 0) + 1
  }

  return {
    accounts: accounts as TenantAccessAccountRecord[],
    invitations: invitations as TenantAccessSnapshot['invitations'],
    scopes: scopes as TenantAccessSnapshot['scopes'],
    events: events as TenantAccessSnapshot['events'],
    roleTemplates: roleTemplates as TenantRoleTemplateRecord[],
    permissionCatalog: permissionCatalog as TenantAccessSnapshot['permissionCatalog'],
    supportSessions: supportSessions as TenantAccessSnapshot['supportSessions'],
    ownerTransfers: ownerTransfers as TenantAccessSnapshot['ownerTransfers'],
    clients,
    tenants,
    schools,
    campuses,
    sessions: sessions as unknown as TenantAccessSnapshot['sessions'],
    entitlementSnapshots,
    entitlementItems,
    activeSessionCounts,
  }
}

export async function upsertTenantAccessAccount(input: unknown) {
  const session = await requireAngelcare360OperatorPermission('operator.tenants.update')
  const payload = toRecord(input)
  const id = asString(payload.id)
  const tenantId = asString(payload.tenantId || payload.tenant_id)
  const clientId = asString(payload.clientId || payload.client_id)
  const fullName = asString(payload.fullName || payload.full_name).trim()
  const email = normalizeEmail(payload.email)
  if (!tenantId || !clientId || !fullName || !isEmail(email)) return { ok: false, error: 'Client, tenant, nom complet et email professionnel valides sont requis.' }

  const db = await getOperatorClient()
  const { data: tenant, error: tenantError } = await db.from('angelcare360_operator_tenants').select('*').eq('id', tenantId).eq('client_id', clientId).maybeSingle()
  if (tenantError || !tenant) return { ok: false, error: 'Le tenant sélectionné ne correspond pas au client.' }

  let before: Record<string, unknown> | null = null
  if (id) before = (await db.from(ACCESS_TABLE).select('*').eq('id', id).maybeSingle()).data

  const roleTemplate = asString(payload.roleTemplate || payload.role_template, asString(before?.role_template, 'school_admin'))
  const role = await db.from(ROLE_TABLE).select('*').eq('role_key', roleTemplate).eq('status', 'active').maybeSingle()
  if (!role.data) return { ok: false, error: 'Le modèle de rôle sélectionné est indisponible.' }

  const allowedEmailDomains = asStringArray(payload.allowedEmailDomains || payload.allowed_email_domains)
  if (allowedEmailDomains.length && !allowedEmailDomains.some((domain) => email.endsWith(`@${domain.replace(/^@/, '').toLowerCase()}`))) return { ok: false, error: 'Le domaine email ne respecte pas la politique de sécurité sélectionnée.' }

  const securityPolicy = {
    require_mfa: Boolean(payload.requireMfa ?? payload.require_mfa ?? role.data.require_mfa),
    force_password_change: Boolean(payload.forcePasswordChange ?? payload.force_password_change ?? true),
    session_duration_hours: Math.max(1, Math.min(168, Number(payload.sessionDurationHours || payload.session_duration_hours || 12))),
    allowed_email_domains: allowedEmailDomains,
    sensitive_action_approval: Boolean(payload.sensitiveActionApproval ?? payload.sensitive_action_approval ?? false),
  }
  const moduleKeys = asStringArray(payload.moduleKeys || payload.module_keys || role.data.module_keys)
  const explicitPermissions = asStringArray(payload.explicitPermissions || payload.explicit_permissions || role.data.permissions)
  const deniedPermissions = asStringArray(payload.deniedPermissions || payload.denied_permissions || role.data.denied_permissions)
  const isPrimaryOwner = Boolean(payload.isPrimaryOwner ?? payload.is_primary_owner)

  if (isPrimaryOwner) {
    await db.from(ACCESS_TABLE).update({ is_primary_owner: false, updated_by: session.user.id }).eq('tenant_id', tenantId).eq('is_primary_owner', true)
  }

  const recordPayload = {
    client_id: clientId,
    tenant_id: tenantId,
    school_id: asString(tenant.school_id) || null,
    organization_id: asString(payload.organizationId || payload.organization_id) || null,
    campus_id: asString(payload.campusId || payload.campus_id) || null,
    full_name: fullName,
    email,
    phone: asString(payload.phone) || null,
    job_title: asString(payload.jobTitle || payload.job_title) || null,
    preferred_language: asString(payload.preferredLanguage || payload.preferred_language, 'fr'),
    role_template: roleTemplate,
    ...(id ? (payload.status ? { status: asString(payload.status) } : {}) : { status: 'draft' }),
    is_primary_owner: isPrimaryOwner,
    scope_mode: asString(payload.scopeMode || payload.scope_mode, 'tenant'),
    module_keys: moduleKeys,
    explicit_permissions: explicitPermissions,
    denied_permissions: deniedPermissions,
    security_policy: securityPolicy,
    access_starts_at: toIso(payload.accessStartsAt || payload.access_starts_at),
    access_expires_at: toIso(payload.accessExpiresAt || payload.access_expires_at),
    updated_by: session.user.id,
  }

  const result = id
    ? await db.from(ACCESS_TABLE).update(recordPayload).eq('id', id).select('*').single()
    : await db.from(ACCESS_TABLE).insert({ ...recordPayload, created_by: session.user.id }).select('*').single()
  if (result.error) return { ok: false, error: result.error.message }

  await db.from(SCOPE_TABLE).delete().eq('access_account_id', result.data.id)
  const scopeRows = Array.isArray(payload.scopes) ? payload.scopes : []
  if (scopeRows.length) {
    await db.from(SCOPE_TABLE).insert(scopeRows.map((scope) => {
      const item = toRecord(scope)
      return {
        access_account_id: result.data.id,
        scope_type: asString(item.scopeType || item.scope_type, 'tenant'),
        scope_id: asString(item.scopeId || item.scope_id) || null,
        scope_label: asString(item.scopeLabel || item.scope_label, 'Tenant complet'),
        access_level: asString(item.accessLevel || item.access_level, 'manage'),
        metadata: toRecord(item.metadata),
        created_by: session.user.id,
      }
    }))
  } else {
    await db.from(SCOPE_TABLE).insert({ access_account_id: result.data.id, scope_type: 'tenant', scope_id: tenantId, scope_label: asString(tenant.tenant_slug, 'Tenant complet'), access_level: roleTemplate === 'auditor' ? 'view' : 'manage', created_by: session.user.id })
  }

  if (result.data.app_user_id) {
    await db.from('app_users').update({ full_name: fullName, email, role: APP_ROLE_MAP[roleTemplate] || 'administration', permissions: effectiveAppPermissions(result.data) }).eq('id', result.data.app_user_id)
    if (result.data.school_id) {
      await db.from('angelcare360_user_roles').update({ status: 'paused' }).eq('app_user_id', result.data.app_user_id).eq('school_id', result.data.school_id).contains('metadata_json', { source: 'tenant-access' })
    }
    const provisioned = await provisionMembership(db as any, result.data, String(result.data.app_user_id))
    await db.from(ACCESS_TABLE).update({ membership_id: provisioned.membershipId, school_user_role_id: provisioned.schoolUserRoleId }).eq('id', result.data.id)
    if (id && before && JSON.stringify({ role: before.role_template, modules: before.module_keys, permissions: before.explicit_permissions, denied: before.denied_permissions, policy: before.security_policy, scope: before.scope_mode }) !== JSON.stringify({ role: roleTemplate, modules: moduleKeys, permissions: explicitPermissions, denied: deniedPermissions, policy: securityPolicy, scope: recordPayload.scope_mode })) {
      await db.from('app_sessions').delete().eq('user_id', result.data.app_user_id)
    }
  }

  await writeAccessEvent({ accessAccountId: result.data.id, clientId, tenantId, actorUserId: session.user.id, eventType: id ? 'account.updated' : 'account.created', severity: 'notice', summary: id ? 'Compte administrateur mis à jour.' : 'Compte administrateur préparé.', metadata: { role_template: roleTemplate, module_keys: moduleKeys } })
  await writeOperatorAuditLog({ module: 'tenant-access', action: id ? 'tenant_admin.updated' : 'tenant_admin.created', entityType: ACCESS_TABLE, entityId: result.data.id, clientId, tenantId, severity: 'notice', beforeData: before, afterData: recordPayload })
  return { ok: true, record: result.data }
}

async function sendAccessEmail(input: { toEmail: string; fullName: string; subject: string; body: string; clientId?: string | null; tenantId?: string | null; accessAccountId?: string | null; eventType?: string }) {
  return sendAngelcare360Email({
    templateKey: 'onboarding',
    subject: input.subject,
    body: input.body,
    toEmail: input.toEmail,
    metadata: {
      tenantAccess: true,
      clientId: input.clientId || null,
      tenantId: input.tenantId || null,
      entityType: 'tenant_access_account',
      entityId: input.accessAccountId || null,
      eventType: input.eventType || 'tenant.access.communication',
      mailboxKey: 'B2B',
    },
  })
}

export async function sendTenantAdminInvitation(input: unknown) {
  const session = await requireAngelcare360OperatorPermission('operator.tenants.update')
  const payload = toRecord(input)
  const accountId = asString(payload.accessAccountId || payload.access_account_id || payload.id)
  const origin = asString(payload.origin)
  const db = await getOperatorClient()
  const { data: account } = await db.from(ACCESS_TABLE).select('*, tenant:angelcare360_operator_tenants(tenant_slug), client:angelcare360_operator_clients(display_name)').eq('id', accountId).maybeSingle()
  if (!account) return { ok: false, error: 'Le compte administrateur est introuvable.' }
  if (['revoked','expired'].includes(account.status)) return { ok: false, error: 'Ce compte doit être restauré avant toute nouvelle invitation.' }

  await db.from(INVITE_TABLE).update({ status: 'revoked', cancelled_at: new Date().toISOString() }).eq('access_account_id', accountId).in('status', ['invited','opened'])
  const token = rawToken()
  const expiresAt = new Date(Date.now() + Math.max(1, Math.min(14, Number(payload.validDays || 3))) * 86400000).toISOString()
  const link = `${activationBase(origin)}/angelcare-360-access/activate?token=${encodeURIComponent(token)}&mode=invite`
  const { data: invitation, error } = await db.from(INVITE_TABLE).insert({ access_account_id: accountId, email: account.email, token_hash: tokenDigest(token), status: 'invited', delivery_status: 'ready', expires_at: expiresAt, sent_at: new Date().toISOString(), created_by: session.user.id }).select('*').single()
  if (error) return { ok: false, error: error.message }

  const emailResult = await sendAccessEmail({
    toEmail: account.email,
    fullName: account.full_name,
    subject: `Activation de votre accès AngelCare 360 — ${account.client?.display_name || account.tenant?.tenant_slug || 'Tenant'}`,
    body: `Bonjour ${account.full_name},\n\nAngelCare vous invite à activer votre accès administrateur sécurisé.\n\nLien d’activation à usage unique :\n${link}\n\nCe lien expire le ${new Date(expiresAt).toLocaleString('fr-FR')}. Votre mot de passe restera privé et ne sera jamais visible par AngelCare.\n\nÉquipe AngelCare`,
    clientId: account.client_id,
    tenantId: account.tenant_id,
    accessAccountId: accountId,
    eventType: 'tenant.admin.invited',
  })
  await db.from(INVITE_TABLE).update({ delivery_status: emailResult.ok ? 'sent' : 'manual_link_ready' }).eq('id', invitation.id)
  if (account.app_user_id && Boolean(toRecord(account.security_policy).require_mfa) && !account.mfa_enrolled_at) await db.from('app_sessions').delete().eq('user_id', account.app_user_id)
  await db.from(ACCESS_TABLE).update({ status: 'invited', invited_at: new Date().toISOString(), last_security_event_at: new Date().toISOString(), updated_by: session.user.id }).eq('id', accountId)
  await writeAccessEvent({ accessAccountId: accountId, clientId: account.client_id, tenantId: account.tenant_id, actorUserId: session.user.id, eventType: 'invitation.sent', severity: 'notice', summary: emailResult.ok ? 'Invitation envoyée via Email-OS.' : 'Lien d’activation généré; envoi Email-OS indisponible.', metadata: { invitation_id: invitation.id, delivery_status: emailResult.ok ? 'sent' : 'manual_link_ready', error: emailResult.error || null } })
  return { ok: true, invitation: { ...invitation, delivery_status: emailResult.ok ? 'sent' : 'manual_link_ready' }, activationUrl: link, email: emailResult }
}

export async function cancelTenantAdminInvitation(input: unknown) {
  const session = await requireAngelcare360OperatorPermission('operator.tenants.update')
  const payload = toRecord(input)
  const invitationId = asString(payload.invitationId || payload.id)
  const db = await getOperatorClient()
  const { data: invitation } = await db.from(INVITE_TABLE).select('*, account:angelcare360_operator_tenant_access_accounts(*)').eq('id', invitationId).maybeSingle()
  if (!invitation) return { ok: false, error: 'Invitation introuvable.' }
  const { error } = await db.from(INVITE_TABLE).update({ status: 'cancelled', cancelled_at: new Date().toISOString() }).eq('id', invitationId)
  if (error) return { ok: false, error: error.message }
  await db.from(ACCESS_TABLE).update({ status: invitation.account?.app_user_id ? 'active' : 'draft', updated_by: session.user.id }).eq('id', invitation.access_account_id)
  await writeAccessEvent({ accessAccountId: invitation.access_account_id, clientId: invitation.account?.client_id, tenantId: invitation.account?.tenant_id, actorUserId: session.user.id, eventType: 'invitation.cancelled', severity: 'warning', summary: 'Invitation d’accès annulée.' })
  return { ok: true }
}

export async function changeTenantAdminStatus(input: unknown) {
  const session = await requireAngelcare360OperatorPermission('operator.tenants.update')
  const payload = toRecord(input)
  const id = asString(payload.id || payload.accessAccountId)
  const status = asString(payload.status)
  const reason = asString(payload.reason).trim()
  const allowed = ['active','locked','suspended','expired','revoked']
  if (!id || !allowed.includes(status) || !reason) return { ok: false, error: 'Compte, statut et justification sont requis.' }
  const db = await getOperatorClient()
  const { data: before } = await db.from(ACCESS_TABLE).select('*').eq('id', id).maybeSingle()
  if (!before) return { ok: false, error: 'Compte administrateur introuvable.' }
  if (status === 'active' && Boolean(toRecord(before.security_policy).require_mfa) && !before.mfa_enrolled_at) return { ok: false, error: 'L’enrôlement MFA doit être terminé via le lien sécurisé avant activation.' }
  if (before.is_primary_owner && ['revoked','expired'].includes(status)) {
    const { count } = await db.from(ACCESS_TABLE).select('id', { count: 'exact', head: true }).eq('tenant_id', before.tenant_id).eq('is_primary_owner', true).eq('status', 'active').neq('id', id)
    if (!count) return { ok: false, error: 'Transférez d’abord la responsabilité Tenant Owner. Le dernier owner actif ne peut pas être supprimé silencieusement.' }
  }
  const { data, error } = await db.from(ACCESS_TABLE).update({ status, last_security_event_at: new Date().toISOString(), updated_by: session.user.id }).eq('id', id).select('*').single()
  if (error) return { ok: false, error: error.message }
  if (before.app_user_id && ['locked','suspended','expired','revoked'].includes(status)) await db.from('app_sessions').delete().eq('user_id', before.app_user_id)
  await writeAccessEvent({ accessAccountId: id, clientId: before.client_id, tenantId: before.tenant_id, actorUserId: session.user.id, eventType: `account.${status}`, severity: ['revoked','locked'].includes(status) ? 'critical' : 'warning', summary: `Compte ${status}.`, metadata: { reason } })
  await writeOperatorAuditLog({ module: 'tenant-access', action: `tenant_admin.${status}`, entityType: ACCESS_TABLE, entityId: id, clientId: before.client_id, tenantId: before.tenant_id, severity: ['revoked','locked'].includes(status) ? 'critical' : 'notice', beforeData: before, afterData: data, metadata: { reason } })
  return { ok: true, record: data }
}

export async function revokeTenantAdminSessions(input: unknown) {
  const session = await requireAngelcare360OperatorPermission('operator.tenants.update')
  const payload = toRecord(input)
  const id = asString(payload.id || payload.accessAccountId)
  const reason = asString(payload.reason).trim()
  const db = await getOperatorClient()
  const { data: account } = await db.from(ACCESS_TABLE).select('*').eq('id', id).maybeSingle()
  if (!account?.app_user_id) return { ok: false, error: 'Aucune identité activée ou session à révoquer.' }
  const { count } = await db.from('app_sessions').select('user_id', { count: 'exact', head: true }).eq('user_id', account.app_user_id)
  await db.from('app_sessions').delete().eq('user_id', account.app_user_id)
  await writeAccessEvent({ accessAccountId: id, clientId: account.client_id, tenantId: account.tenant_id, actorUserId: session.user.id, eventType: 'sessions.revoked', severity: 'warning', summary: `${count || 0} session(s) révoquée(s).`, metadata: { reason } })
  return { ok: true, revokedSessions: count || 0 }
}

export async function requestTenantPasswordReset(input: unknown) {
  const session = await requireAngelcare360OperatorPermission('operator.tenants.update')
  const payload = toRecord(input)
  const id = asString(payload.id || payload.accessAccountId)
  const origin = asString(payload.origin)
  const db = await getOperatorClient()
  const { data: account } = await db.from(ACCESS_TABLE).select('*, client:angelcare360_operator_clients(display_name)').eq('id', id).maybeSingle()
  if (!account?.app_user_id) return { ok: false, error: 'Le compte doit être activé avant de demander une réinitialisation.' }
  await db.from(RESET_TABLE).update({ status: 'cancelled' }).eq('access_account_id', id).in('status', ['requested','opened'])
  const token = rawToken()
  const expiresAt = new Date(Date.now() + 2 * 3600000).toISOString()
  const link = `${activationBase(origin)}/angelcare-360-access/activate?token=${encodeURIComponent(token)}&mode=reset`
  const { data: reset, error } = await db.from(RESET_TABLE).insert({ access_account_id: id, token_hash: tokenDigest(token), status: 'requested', expires_at: expiresAt, requested_by: session.user.id }).select('*').single()
  if (error) return { ok: false, error: error.message }
  const emailResult = await sendAccessEmail({
    toEmail: account.email,
    fullName: account.full_name,
    subject: `Réinitialisation sécurisée AngelCare 360 — ${account.client?.display_name || 'Tenant'}`,
    body: `Bonjour ${account.full_name},\n\nUne réinitialisation de mot de passe a été demandée pour votre accès AngelCare 360.\n\nLien sécurisé :\n${link}\n\nLe lien expire dans 2 heures. AngelCare ne connaît et ne stocke jamais votre mot de passe en clair.`,
    clientId: account.client_id,
    tenantId: account.tenant_id,
    accessAccountId: id,
    eventType: 'tenant.admin.password_reset_requested',
  })
  await writeAccessEvent({ accessAccountId: id, clientId: account.client_id, tenantId: account.tenant_id, actorUserId: session.user.id, eventType: 'password_reset.requested', severity: 'warning', summary: emailResult.ok ? 'Lien de réinitialisation envoyé.' : 'Lien de réinitialisation généré; envoi email indisponible.', metadata: { reset_id: reset.id, email_error: emailResult.error || null } })
  return { ok: true, reset, resetUrl: link, email: emailResult }
}

export async function transferTenantOwnership(input: unknown) {
  const session = await requireAngelcare360OperatorPermission('operator.tenants.update')
  const payload = toRecord(input)
  const tenantId = asString(payload.tenantId)
  const fromId = asString(payload.fromAccessAccountId) || null
  const toId = asString(payload.toAccessAccountId)
  const reason = asString(payload.reason).trim()
  if (!tenantId || !toId || !reason) return { ok: false, error: 'Tenant, nouveau owner et justification sont requis.' }
  const db = await getOperatorClient()
  const { data: target } = await db.from(ACCESS_TABLE).select('*').eq('id', toId).eq('tenant_id', tenantId).maybeSingle()
  if (!target || target.status !== 'active') return { ok: false, error: 'Le nouveau Tenant Owner doit être un administrateur actif du même tenant.' }
  const { data: transfer, error } = await db.from(TRANSFER_TABLE).insert({ tenant_id: tenantId, from_access_account_id: fromId, to_access_account_id: toId, status: 'completed', reason, effective_at: new Date().toISOString(), requested_by: session.user.id, approved_by: session.user.id, completed_at: new Date().toISOString() }).select('*').single()
  if (error) return { ok: false, error: error.message }
  await db.from(ACCESS_TABLE).update({ is_primary_owner: false, updated_by: session.user.id }).eq('tenant_id', tenantId)
  await db.from(ACCESS_TABLE).update({ is_primary_owner: true, role_template: 'tenant_owner', updated_by: session.user.id }).eq('id', toId)
  await writeAccessEvent({ accessAccountId: toId, clientId: target.client_id, tenantId, actorUserId: session.user.id, eventType: 'ownership.transferred', severity: 'notice', summary: `Responsabilité Tenant Owner transférée à ${target.full_name}.`, metadata: { from_access_account_id: fromId, reason } })
  return { ok: true, transfer }
}

export async function requestTenantSupportAccess(input: unknown) {
  const session = await requireAngelcare360OperatorPermission('operator.tenants.update')
  const payload = toRecord(input)
  const clientId = asString(payload.clientId)
  const tenantId = asString(payload.tenantId)
  const reason = asString(payload.reason).trim()
  const accessMode = asString(payload.accessMode, 'read_only')
  const hours = Math.max(1, Math.min(24, Number(payload.durationHours || 1)))
  if (!clientId || !tenantId || !reason) return { ok: false, error: 'Client, tenant et raison support sont requis.' }
  const db = await getOperatorClient()
  const status = accessMode === 'read_only' ? 'active' : 'requested'
  const { data, error } = await db.from(SUPPORT_TABLE).insert({ client_id: clientId, tenant_id: tenantId, operator_user_id: session.user.id, access_mode: accessMode, reason, status, starts_at: new Date().toISOString(), expires_at: new Date(Date.now() + hours * 3600000).toISOString(), approved_by: status === 'active' ? session.user.id : null }).select('*').single()
  if (error) return { ok: false, error: error.message }
  await writeAccessEvent({ clientId, tenantId, actorUserId: session.user.id, eventType: 'support_access.requested', severity: 'warning', summary: `Accès support ${accessMode} ${status === 'active' ? 'activé' : 'demandé'}.`, metadata: { support_session_id: data.id, reason, hours } })
  return { ok: true, session: data }
}

export async function approveTenantSupportAccess(input: unknown) {
  const actor = await requireAngelcare360OperatorPermission('operator.tenants.update')
  const payload = toRecord(input)
  const id = asString(payload.id)
  const db = await getOperatorClient()
  const { data: before } = await db.from(SUPPORT_TABLE).select('*').eq('id', id).maybeSingle()
  if (!before || before.status !== 'requested') return { ok: false, error: 'Seule une demande support en attente peut être approuvée.' }
  const { data, error } = await db.from(SUPPORT_TABLE).update({ status: 'active', approved_by: actor.user.id, starts_at: new Date().toISOString() }).eq('id', id).select('*').single()
  if (error) return { ok: false, error: error.message }
  await writeAccessEvent({ clientId: before.client_id, tenantId: before.tenant_id, actorUserId: actor.user.id, eventType: 'support_access.approved', severity: 'warning', summary: `Accès support ${before.access_mode} approuvé.`, metadata: { support_session_id: id } })
  return { ok: true, session: data }
}

export async function launchTenantSupportAccess(input: unknown) {
  const actor = await requireAngelcare360OperatorPermission('operator.tenants.view')
  const payload = toRecord(input)
  const id = asString(payload.id)
  const db = await getOperatorClient()
  const { data: supportSession } = await db.from(SUPPORT_TABLE).select('*, tenant:angelcare360_operator_tenants(id,school_id,tenant_slug,command_center_url), client:angelcare360_operator_clients(display_name)').eq('id', id).eq('operator_user_id', actor.user.id).maybeSingle()
  if (!supportSession) return { ok: false, error: 'Session support introuvable pour cet opérateur.' }
  if (supportSession.status !== 'active' || new Date(supportSession.expires_at).getTime() <= Date.now()) return { ok: false, error: 'La session support doit être active et non expirée.' }
  if (!supportSession.tenant?.school_id) return { ok: false, error: 'Le tenant ne possède pas de school_id exploitable pour le support.' }
  await writeAccessEvent({ clientId: supportSession.client_id, tenantId: supportSession.tenant_id, actorUserId: actor.user.id, eventType: 'support_access.launched', severity: 'warning', summary: 'Session View as tenant ouverte dans le Command Center.', metadata: { support_session_id: id, access_mode: supportSession.access_mode } })
  return { ok: true, supportSessionId: id, supportUrl: supportSession.tenant.command_center_url || '/angelcare-360-command-center', expiresAt: supportSession.expires_at }
}

export async function endTenantSupportAccess(input: unknown) {
  const actor = await requireAngelcare360OperatorPermission('operator.tenants.update')
  const payload = toRecord(input)
  const id = asString(payload.id)
  const db = await getOperatorClient()
  const { data: before } = await db.from(SUPPORT_TABLE).select('*').eq('id', id).maybeSingle()
  if (!before) return { ok: false, error: 'Session support introuvable.' }
  const { data, error } = await db.from(SUPPORT_TABLE).update({ status: 'ended', ended_at: new Date().toISOString() }).eq('id', id).select('*').single()
  if (error) return { ok: false, error: error.message }
  await writeAccessEvent({ clientId: before.client_id, tenantId: before.tenant_id, actorUserId: actor.user.id, eventType: 'support_access.ended', severity: 'notice', summary: 'Accès support terminé.' })
  return { ok: true, session: data }
}

export async function inspectTenantAccessToken(token: string, mode: 'invite' | 'reset') {
  const db = await createServiceClient()
  const digest = tokenDigest(token)
  if (mode === 'reset') {
    const { data } = await db.from(RESET_TABLE).select('*, account:angelcare360_operator_tenant_access_accounts(id,full_name,email,status,client:angelcare360_operator_clients(display_name),tenant:angelcare360_operator_tenants(tenant_slug))').eq('token_hash', digest).in('status', ['requested','opened']).gt('expires_at', new Date().toISOString()).maybeSingle()
    if (!data) return { ok: false, error: 'Le lien de réinitialisation est invalide ou expiré.' }
    await db.from(RESET_TABLE).update({ status: 'opened' }).eq('id', data.id)
    return { ok: true, mode, account: data.account, expiresAt: data.expires_at }
  }
  const { data } = await db.from(INVITE_TABLE).select('*, account:angelcare360_operator_tenant_access_accounts(id,full_name,email,status,role_template,security_policy,client_id,tenant_id,client:angelcare360_operator_clients(display_name),tenant:angelcare360_operator_tenants(tenant_slug))').eq('token_hash', digest).in('status', ['invited','opened']).gt('expires_at', new Date().toISOString()).maybeSingle()
  if (!data) return { ok: false, error: 'Le lien d’activation est invalide, annulé ou expiré.' }
  await db.from(INVITE_TABLE).update({ status: 'opened', opened_at: new Date().toISOString() }).eq('id', data.id)
  const existingIdentity = data.account?.email
    ? Boolean((await db.from('app_users').select('id').ilike('email', String(data.account.email)).maybeSingle()).data)
    : false
  return { ok: true, mode, account: data.account, expiresAt: data.expires_at, existingIdentity }
}

async function provisionMembership(db: Awaited<ReturnType<typeof createServiceClient>>, account: Record<string, unknown>, appUserId: string) {
  const warnings: string[] = []
  let membershipId: string | null = null
  let schoolUserRoleId: string | null = null

  const orgId = asString(account.organization_id)
  if (orgId) {
    const existing = await db.from('ac360_user_memberships').select('*').eq('app_user_id', appUserId).eq('org_id', orgId).maybeSingle()
    if (existing.data) {
      const update = await db.from('ac360_user_memberships').update({ status: 'active' }).eq('id', existing.data.id).select('id').single()
      membershipId = update.data?.id || existing.data.id
      if (update.error) warnings.push(update.error.message)
    } else {
      const base = { app_user_id: appUserId, org_id: orgId, status: 'active' }
      let inserted = await db.from('ac360_user_memberships').insert({ ...base, campus_id: asString(account.campus_id) || null, role_key: asString(account.role_template) }).select('id').single()
      if (inserted.error) inserted = await db.from('ac360_user_memberships').insert(base).select('id').single()
      membershipId = inserted.data?.id || null
      if (inserted.error) warnings.push(inserted.error.message)
    }
  }

  const schoolId = asString(account.school_id)
  if (schoolId) {
    const template = asString(account.role_template, 'school_admin')
    const roleKey = `tenant_access_${asString(account.id).replace(/-/g, '').slice(0, 20)}`
    let roleResult = await db.from('angelcare360_roles').select('*').eq('school_id', schoolId).eq('role_key', roleKey).maybeSingle()
    if (!roleResult.data) {
      roleResult = await db.from('angelcare360_roles').insert({ school_id: schoolId, role_key: roleKey, label: `${SCHOOL_ROLE_MAP[template] || 'administration'} · ${asString(account.full_name)}`, description: `Rôle individuel provisionné par Tenant Identity Access (${template}).`, scope: 'school', is_system_locked: true, status: 'active', metadata_json: { source: 'tenant-access', role_template: template, access_account_id: account.id } }).select('*').single()
    }
    if (roleResult.error || !roleResult.data) warnings.push(roleResult.error?.message || 'Rôle établissement non provisionné.')
    else {
      const { data: allPermissions } = await db.from('angelcare360_permissions').select('permission_key,domain_key,action_key').eq('status', 'active')
      const modules = new Set(asStringArray(account.module_keys))
      const explicit = new Set(asStringArray(account.explicit_permissions))
      const denied = new Set(asStringArray(account.denied_permissions))
      const fullAuthority = ['tenant_owner','general_direction'].includes(template)
      const readOnly = template === 'auditor'
      const selected = (allPermissions || []).filter((permission: any) => {
        const key = String(permission.permission_key)
        if (denied.has(key) || [...denied].some((entry) => entry.endsWith('.*') && key.startsWith(entry.slice(0, -1)))) return false
        if (template === 'custom') return explicit.has(key) || [...explicit].some((entry) => entry.endsWith('.*') && key.startsWith(entry.slice(0, -1)))
        if (fullAuthority) return true
        if (explicit.has(key) || [...explicit].some((entry) => entry.endsWith('.*') && key.startsWith(entry.slice(0, -1)))) return true
        if (readOnly) return ['view','export','audit'].includes(String(permission.action_key))
        return modules.has(String(permission.domain_key))
      })
      await db.from('angelcare360_role_permissions').delete().eq('role_id', roleResult.data.id).contains('metadata_json', { source: 'tenant-access' })
      const permissionRows = [
        ...selected.map((permission: any) => ({ role_id: roleResult.data.id, permission_key: permission.permission_key, effect: 'allow', metadata_json: { source: 'tenant-access', access_account_id: account.id } })),
        ...(allPermissions || []).filter((permission: any) => {
          const key = String(permission.permission_key)
          return denied.has(key) || [...denied].some((entry) => entry.endsWith('.*') && key.startsWith(entry.slice(0, -1)))
        }).map((permission: any) => ({ role_id: roleResult.data.id, permission_key: permission.permission_key, effect: 'deny', metadata_json: { source: 'tenant-access', access_account_id: account.id } })),
      ]
      if (permissionRows.length) await db.from('angelcare360_role_permissions').upsert(permissionRows, { onConflict: 'role_id,permission_key' })
      const existingUserRole = await db.from('angelcare360_user_roles').select('*').eq('school_id', schoolId).eq('app_user_id', appUserId).eq('role_id', roleResult.data.id).maybeSingle()
      if (existingUserRole.data) {
        const update = await db.from('angelcare360_user_roles').update({ status: 'active', starts_at: account.access_starts_at || new Date().toISOString(), ends_at: account.access_expires_at || null, metadata_json: { source: 'tenant-access', access_account_id: account.id } }).eq('id', existingUserRole.data.id).select('id').single()
        schoolUserRoleId = update.data?.id || existingUserRole.data.id
        if (update.error) warnings.push(update.error.message)
      } else {
        const inserted = await db.from('angelcare360_user_roles').insert({ school_id: schoolId, app_user_id: appUserId, role_id: roleResult.data.id, starts_at: account.access_starts_at || new Date().toISOString(), ends_at: account.access_expires_at || null, status: 'active', metadata_json: { source: 'tenant-access', access_account_id: account.id } }).select('id').single()
        schoolUserRoleId = inserted.data?.id || null
        if (inserted.error) warnings.push(inserted.error.message)
      }
    }
  } else warnings.push('Aucun school_id lié au tenant; les permissions AngelCare 360 métier n’ont pas été provisionnées.')

  return { membershipId, schoolUserRoleId, warning: warnings.filter(Boolean).join(' · ') || null }
}

export async function completeTenantAccessToken(input: { token: string; mode: 'invite' | 'reset'; password: string }) {
  const token = String(input.token || '')
  const password = String(input.password || '')
  if (token.length < 20) return { ok: false, error: 'Jeton de sécurité invalide.' }
  const db = await createServiceClient()
  const digest = tokenDigest(token)
  const passwordIsStrong = password.length >= 12 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password)

  if (input.mode === 'reset') {
    if (!passwordIsStrong) return { ok: false, error: 'Le mot de passe doit contenir au moins 12 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial.' }
    const passwordHash = await hashPassword(password)
    const { data: reset } = await db.from(RESET_TABLE).select('*, account:angelcare360_operator_tenant_access_accounts(*)').eq('token_hash', digest).in('status', ['requested','opened']).gt('expires_at', new Date().toISOString()).maybeSingle()
    if (!reset?.account?.app_user_id) return { ok: false, error: 'Lien de réinitialisation invalide ou compte non activé.' }
    const { error } = await db.from('app_users').update({ password_hash: passwordHash, status: 'active' }).eq('id', reset.account.app_user_id)
    if (error) return { ok: false, error: error.message }
    await db.from('app_sessions').delete().eq('user_id', reset.account.app_user_id)
    await db.from(RESET_TABLE).update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', reset.id)
    await db.from(ACCESS_TABLE).update({ status: 'active', last_security_event_at: new Date().toISOString() }).eq('id', reset.account.id)
    await writeAccessEvent({ accessAccountId: reset.account.id, clientId: reset.account.client_id, tenantId: reset.account.tenant_id, eventType: 'password_reset.completed', severity: 'notice', summary: 'Mot de passe réinitialisé et anciennes sessions révoquées.' })
    return { ok: true, mode: 'reset' as const }
  }

  const { data: invitation } = await db.from(INVITE_TABLE).select('*, account:angelcare360_operator_tenant_access_accounts(*)').eq('token_hash', digest).in('status', ['invited','opened']).gt('expires_at', new Date().toISOString()).maybeSingle()
  if (!invitation?.account) return { ok: false, error: 'Invitation invalide, annulée ou expirée.' }
  const account = invitation.account as Record<string, unknown>
  let appUser: any = await db.from('app_users').select('*').ilike('email', asString(account.email)).maybeSingle()
  if (!appUser.data) {
    if (!passwordIsStrong) return { ok: false, error: 'Le mot de passe doit contenir au moins 12 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial.' }
    const passwordHash = await hashPassword(password)
    appUser = await db.from('app_users').insert({
      email: asString(account.email),
      full_name: asString(account.full_name),
      role: APP_ROLE_MAP[asString(account.role_template)] || 'administration',
      status: 'active',
      password_hash: passwordHash,
      permissions: effectiveAppPermissions(account),
    }).select('*').single()
  } else {
    appUser = await db.from('app_users').update({ full_name: asString(account.full_name), role: APP_ROLE_MAP[asString(account.role_template)] || 'administration', status: 'active', permissions: effectiveAppPermissions(account) }).eq('id', appUser.data.id).select('*').single()
  }
  if (appUser.error || !appUser.data) return { ok: false, error: appUser.error?.message || 'Création de l’identité impossible.' }
  const membership = await provisionMembership(db, account, String(appUser.data.id))
  const now = new Date().toISOString()
  const requireMfa = Boolean(toRecord(account.security_policy).require_mfa)
  if (requireMfa) {
    const secret = base32Encode(crypto.randomBytes(20))
    const recoveryCodes = generateRecoveryCodes()
    await db.from(ACCESS_TABLE).update({ app_user_id: appUser.data.id, membership_id: membership.membershipId, school_user_role_id: membership.schoolUserRoleId, status: 'activation_pending', activated_at: now, last_security_event_at: now, mfa_secret_encrypted: encryptSecret(secret), mfa_recovery_codes: recoveryCodes.map(recoveryDigest) }).eq('id', account.id)
    await writeAccessEvent({ accessAccountId: asString(account.id), clientId: asString(account.client_id), tenantId: asString(account.tenant_id), eventType: 'mfa.enrollment_required', severity: 'warning', summary: 'Mot de passe créé; enrôlement MFA obligatoire avant activation finale.' })
    const issuer = encodeURIComponent('AngelCare 360')
    const label = encodeURIComponent(`AngelCare 360:${asString(account.email)}`)
    return { ok: true, mode: 'invite' as const, mfaRequired: true, mfaSecret: secret, otpauthUri: `otpauth://totp/${label}?secret=${secret}&issuer=${issuer}&digits=6&period=30`, recoveryCodes, membershipWarning: membership.warning }
  }
  await db.from(ACCESS_TABLE).update({ app_user_id: appUser.data.id, membership_id: membership.membershipId, school_user_role_id: membership.schoolUserRoleId, status: 'active', activated_at: now, last_security_event_at: now }).eq('id', account.id)
  await db.from(INVITE_TABLE).update({ status: 'accepted', accepted_at: now }).eq('id', invitation.id)
  await writeAccessEvent({ accessAccountId: asString(account.id), clientId: asString(account.client_id), tenantId: asString(account.tenant_id), eventType: 'account.activated', severity: 'notice', summary: 'Administrateur activé, rôle établissement et membership tenant provisionnés.', metadata: { membership_warning: membership.warning } })
  return { ok: true, mode: 'invite' as const, membershipWarning: membership.warning }
}


export async function confirmTenantMfaEnrollment(input: { token: string; code: string }) {
  const db = await createServiceClient()
  const digest = tokenDigest(input.token)
  const { data: invitation } = await db.from(INVITE_TABLE).select('*, account:angelcare360_operator_tenant_access_accounts(*)').eq('token_hash', digest).in('status', ['invited','opened']).gt('expires_at', new Date().toISOString()).maybeSingle()
  if (!invitation?.account?.mfa_secret_encrypted) return { ok: false, error: 'Session d’enrôlement MFA invalide ou expirée.' }
  const secret = decryptSecret(invitation.account.mfa_secret_encrypted)
  if (!verifyTotp(secret, input.code)) return { ok: false, error: 'Code MFA invalide. Vérifiez l’heure de votre appareil et réessayez.' }
  const now = new Date().toISOString()
  await db.from(ACCESS_TABLE).update({ status: 'active', mfa_enrolled_at: now, mfa_last_verified_at: now, last_security_event_at: now }).eq('id', invitation.account.id)
  await db.from(INVITE_TABLE).update({ status: 'accepted', accepted_at: now }).eq('id', invitation.id)
  await writeAccessEvent({ accessAccountId: invitation.account.id, clientId: invitation.account.client_id, tenantId: invitation.account.tenant_id, eventType: 'mfa.enrolled', severity: 'notice', summary: 'MFA authenticator enrôlé et compte administrateur activé.' })
  return { ok: true }
}

export async function inspectCurrentTenantMfaChallenge() {
  const cookieStore = await cookies()
  const token = cookieStore.get(APP_SESSION_COOKIE)?.value
  if (!token) return { ok: false, error: 'Session de connexion introuvable.' }
  const db = await createServiceClient()
  const { data: session } = await db.from('app_sessions').select('*').eq('session_token', token).gt('expires_at', new Date().toISOString()).maybeSingle()
  if (!session?.user_id) return { ok: false, error: 'Session expirée.' }
  const { data: account } = await db.from(ACCESS_TABLE).select('id,full_name,email,status,security_policy,mfa_enrolled_at,client:angelcare360_operator_clients(display_name),tenant:angelcare360_operator_tenants(tenant_slug)').eq('app_user_id', session.user_id).maybeSingle()
  if (!account || account.status !== 'active' || !account.mfa_enrolled_at || !toRecord(account.security_policy).require_mfa) return { ok: false, error: 'Aucun challenge MFA actif pour cette session.' }
  return { ok: true, account: { fullName: account.full_name, email: account.email, client: account.client, tenant: account.tenant }, alreadyVerified: Boolean(session.mfa_verified_at) }
}

export async function confirmCurrentTenantMfaChallenge(code: string) {
  const cookieStore = await cookies()
  const token = cookieStore.get(APP_SESSION_COOKIE)?.value
  if (!token) return { ok: false, error: 'Session de connexion introuvable.' }
  const db = await createServiceClient()
  const { data: session } = await db.from('app_sessions').select('*').eq('session_token', token).gt('expires_at', new Date().toISOString()).maybeSingle()
  if (!session?.user_id) return { ok: false, error: 'Session expirée.' }
  const { data: account } = await db.from(ACCESS_TABLE).select('*').eq('app_user_id', session.user_id).eq('status', 'active').maybeSingle()
  if (!account?.mfa_secret_encrypted) return { ok: false, error: 'MFA non configuré.' }
  let verified = verifyTotp(decryptSecret(account.mfa_secret_encrypted), code)
  let recoveryUsed = false
  if (!verified) {
    const digest = recoveryDigest(code)
    const recoveryCodes = asStringArray(account.mfa_recovery_codes)
    const index = recoveryCodes.indexOf(digest)
    if (index >= 0) {
      verified = true
      recoveryUsed = true
      recoveryCodes.splice(index, 1)
      await db.from(ACCESS_TABLE).update({ mfa_recovery_codes: recoveryCodes }).eq('id', account.id)
    }
  }
  if (!verified) {
    await writeAccessEvent({ accessAccountId: account.id, clientId: account.client_id, tenantId: account.tenant_id, actorUserId: session.user_id, eventType: 'mfa.failed', severity: 'warning', summary: 'Code MFA rejeté.' })
    return { ok: false, error: 'Code MFA ou code de récupération invalide.' }
  }
  const now = new Date().toISOString()
  await db.from('app_sessions').update({ mfa_verified_at: now, mfa_challenge_at: now, last_seen_at: now }).eq('session_token', token)
  await db.from(ACCESS_TABLE).update({ mfa_last_verified_at: now, last_login_at: now, last_security_event_at: now }).eq('id', account.id)
  await writeAccessEvent({ accessAccountId: account.id, clientId: account.client_id, tenantId: account.tenant_id, actorUserId: session.user_id, eventType: recoveryUsed ? 'mfa.recovery_used' : 'mfa.verified', severity: 'notice', summary: recoveryUsed ? 'Connexion MFA validée avec un code de récupération.' : 'Connexion MFA validée.' })
  return { ok: true, recoveryUsed }
}

export async function getCurrentTenantAdminAccess() {
  const user = await getCurrentUser()
  if (!user?.id) return null
  const db = await createServiceClient()
  const { data } = await db.from(ACCESS_TABLE).select('*, tenant:angelcare360_operator_tenants(*), client:angelcare360_operator_clients(*)').eq('app_user_id', user.id).eq('status', 'active').order('updated_at', { ascending: false }).limit(1).maybeSingle()
  return data || null
}
