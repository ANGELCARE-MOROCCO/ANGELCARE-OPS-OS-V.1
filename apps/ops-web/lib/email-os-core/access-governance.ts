import bcrypt from 'bcryptjs'
import { createEmailOSCoreDb } from '@/lib/email-os-core/db'
import { makeEmailOSId, nowIso } from '@/lib/email-os-core/schema'

export type EmailOSMailboxRole = 'viewer' | 'operator' | 'sender' | 'manager' | 'admin'
export type EmailOSMailboxAssignmentStatus = 'active' | 'suspended' | 'revoked'
export type EmailOSMailboxPinStatus = 'not_configured' | 'active' | 'reset_required' | 'locked' | 'revoked'
export type EmailOSMailboxSessionStatus = 'active' | 'expired' | 'revoked'
export type EmailOSMailboxPinDiagnostics = {
  resolvedUserId: string
  requestedMailboxId: string
  assignmentFound: boolean
  assignmentStatus: EmailOSMailboxAssignmentStatus | string | null
  pinStatus: EmailOSMailboxPinStatus | string | null
  pinConfigured: boolean
  mailboxIdSource: string
}

export type EmailOSPermissionSet = {
  can_read: boolean
  can_send: boolean
  can_reply: boolean
  can_archive: boolean
  can_delete: boolean
  can_manage_templates: boolean
  can_view_logs: boolean
  can_manage_mailbox_settings: boolean
}

export type EmailOSMailboxAccessErrorPayload = {
  status: number
  message: string
}

export class EmailOSMailboxAccessError extends Error {
  status: number
  diagnostics?: EmailOSMailboxPinDiagnostics

  constructor(message: string, status = 403, diagnostics?: EmailOSMailboxPinDiagnostics) {
    super(message)
    this.name = 'EmailOSMailboxAccessError'
    this.status = status
    this.diagnostics = diagnostics
  }
}

const ACTIVE_SESSION_TIMEOUT_MS = 4 * 60 * 60 * 1000
const PIN_LOCKOUT_MS = 15 * 60 * 1000
const PIN_ATTEMPT_LIMIT = 5
const PIN_RE = /^\d{6}$/
const ADMIN_ROLES = new Set(['ceo', 'direction', 'admin', 'super_admin', 'root', 'root_admin', 'owner', 'manager'])
const EMAIL_OS_ACCESS_EVENTS = new Set([
  'mailbox_assignment_created',
  'mailbox_assignment_updated',
  'mailbox_assignment_revoked',
  'mailbox_permissions_changed',
  'mailbox_pin_set',
  'mailbox_pin_reset',
  'mailbox_pin_required',
  'mailbox_unlock_success',
  'mailbox_unlock_failed',
  'mailbox_unlock_locked',
  'mailbox_session_created',
  'mailbox_session_refreshed',
  'mailbox_session_expired',
  'mailbox_session_revoked',
  'mailbox_workspace_opened',
  'email_read',
  'email_sent',
  'email_replied',
  'email_archived',
  'email_deleted',
  'attachment_opened',
  'unauthorized_mailbox_access_blocked',
  'spoofed_mailbox_payload_blocked',
  'server_control_access_blocked',
])

const ROLE_PRESETS: Record<EmailOSMailboxRole, EmailOSPermissionSet> = {
  viewer: {
    can_read: true,
    can_send: false,
    can_reply: false,
    can_archive: false,
    can_delete: false,
    can_manage_templates: false,
    can_view_logs: false,
    can_manage_mailbox_settings: false,
  },
  operator: {
    can_read: true,
    can_send: true,
    can_reply: true,
    can_archive: true,
    can_delete: false,
    can_manage_templates: false,
    can_view_logs: false,
    can_manage_mailbox_settings: false,
  },
  sender: {
    can_read: true,
    can_send: true,
    can_reply: true,
    can_archive: false,
    can_delete: false,
    can_manage_templates: true,
    can_view_logs: false,
    can_manage_mailbox_settings: false,
  },
  manager: {
    can_read: true,
    can_send: true,
    can_reply: true,
    can_archive: true,
    can_delete: false,
    can_manage_templates: true,
    can_view_logs: true,
    can_manage_mailbox_settings: false,
  },
  admin: {
    can_read: true,
    can_send: true,
    can_reply: true,
    can_archive: true,
    can_delete: true,
    can_manage_templates: true,
    can_view_logs: true,
    can_manage_mailbox_settings: true,
  },
}

type AnyRecord = Record<string, any>

type SafeMailbox = {
  id: string
  name: string
  address: string
  status: string
  owner: string | null
  provider: string | null
  source: 'database'
}

type AssignmentRow = AnyRecord & {
  id: string
  user_id: string
  mailbox_id: string
  role: EmailOSMailboxRole | string
  status: EmailOSMailboxAssignmentStatus | string
  pin_status: EmailOSMailboxPinStatus | string
}

type SessionRow = AnyRecord & {
  id: string
  status: EmailOSMailboxSessionStatus | string
  user_id: string
  mailbox_id: string
  assignment_id: string | null
  unlocked_at: string | null
  expires_at: string
  last_activity_at: string | null
}

function clean(value: unknown) {
  return String(value ?? '').trim()
}

function cleanLower(value: unknown) {
  return clean(value).toLowerCase()
}

function safeBool(value: unknown) {
  return Boolean(value)
}

function isPin(value: unknown) {
  return PIN_RE.test(clean(value))
}

function expiresAtFromNow(hours = 4) {
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString()
}

function safeJsonValue(value: unknown): unknown {
  if (value === null || value === undefined) return null
  if (Array.isArray(value)) return value.map((item) => safeJsonValue(item))
  if (typeof value === 'object') {
    const input = value as Record<string, unknown>
    const output: Record<string, unknown> = {}
    for (const [key, next] of Object.entries(input)) {
      const lowered = key.toLowerCase()
      if (['pin', 'pin_hash', 'password', 'password_ref', 'smtp_pass', 'smtp_password', 'token', 'bridge_token', 'secret'].some((needle) => lowered.includes(needle))) {
        continue
      }
      output[key] = safeJsonValue(next)
    }
    return output
  }
  if (typeof value === 'string' && /^\d{6}$/.test(value)) return '******'
  return value
}

function permissionFieldFromRole(role: EmailOSMailboxRole): EmailOSPermissionSet {
  return ROLE_PRESETS[role] || ROLE_PRESETS.viewer
}

function normalizePermissionPatch(input: Partial<EmailOSPermissionSet> & { role?: string }) {
  const role = normalizeRole(input.role)
  const base = permissionFieldFromRole(role)
  return {
    role,
    permissions: {
      can_read: input.can_read ?? base.can_read,
      can_send: input.can_send ?? base.can_send,
      can_reply: input.can_reply ?? base.can_reply,
      can_archive: input.can_archive ?? base.can_archive,
      can_delete: input.can_delete ?? base.can_delete,
      can_manage_templates: input.can_manage_templates ?? base.can_manage_templates,
      can_view_logs: input.can_view_logs ?? base.can_view_logs,
      can_manage_mailbox_settings: input.can_manage_mailbox_settings ?? base.can_manage_mailbox_settings,
    },
  }
}

function normalizeRole(value: unknown): EmailOSMailboxRole {
  const role = cleanLower(value)
  if (role === 'operator' || role === 'sender' || role === 'manager' || role === 'admin') return role
  return 'viewer'
}

function normalizeAssignmentStatus(value: unknown): EmailOSMailboxAssignmentStatus {
  const status = cleanLower(value)
  if (status === 'suspended' || status === 'revoked') return status
  return 'active'
}

function normalizePinStatus(value: unknown): EmailOSMailboxPinStatus {
  const status = cleanLower(value)
  if (status === 'active' || status === 'reset_required' || status === 'locked' || status === 'revoked') return status
  return 'not_configured'
}

function normalizeSessionStatus(value: unknown): EmailOSMailboxSessionStatus {
  const status = cleanLower(value)
  if (status === 'expired' || status === 'revoked') return status
  return 'active'
}

function normalizeMailboxRow(row: AnyRecord | null | undefined): SafeMailbox | null {
  if (!row) return null
  const address = clean(row.address || row.email_address || row.email || row.from_email || row.username)
  return {
    id: clean(row.id),
    name: clean(row.name || row.label || row.title || address || row.id),
    address,
    status: clean(row.status || 'active'),
    owner: row.owner ? clean(row.owner) : null,
    provider: row.provider ? clean(row.provider) : null,
    source: 'database',
  }
}

function normalizeAssignmentRow(row: AnyRecord): AssignmentRow {
  return {
    ...row,
    id: clean(row.id),
    user_id: clean(row.user_id),
    mailbox_id: clean(row.mailbox_id),
    role: normalizeRole(row.role),
    status: normalizeAssignmentStatus(row.status),
    pin_status: normalizePinStatus(row.pin_status),
  }
}

function normalizeSessionRow(row: AnyRecord): SessionRow {
  return {
    ...row,
    id: clean(row.id),
    status: normalizeSessionStatus(row.status),
    user_id: clean(row.user_id),
    mailbox_id: clean(row.mailbox_id),
    assignment_id: row.assignment_id ? clean(row.assignment_id) : null,
    unlocked_at: row.unlocked_at ? clean(row.unlocked_at) : null,
    expires_at: clean(row.expires_at),
    last_activity_at: row.last_activity_at ? clean(row.last_activity_at) : null,
  }
}

function getRequestContext(request?: Request | null) {
  if (!request) {
    return { ip_address: null as string | null, user_agent: null as string | null }
  }

  return {
    ip_address: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || null,
    user_agent: request.headers.get('user-agent') || null,
  }
}

export function getRolePermissionPreset(role: string) {
  return permissionFieldFromRole(normalizeRole(role))
}

export function getEmailOSMailboxAccessStates() {
  return {
    assignment: ['active', 'suspended', 'revoked'] as const,
    pin: ['not_configured', 'active', 'reset_required', 'locked', 'revoked'] as const,
    session: ['active', 'expired', 'revoked'] as const,
  }
}

export async function getUserEmailOSAdminProfile(userId: string) {
  const db = createEmailOSCoreDb()
  const resolvedUserId = clean(userId)

  const { data, error } = await db.from('app_users').select('*').eq('id', resolvedUserId).maybeSingle()
  if (error || !data) {
    return {
      user: null,
      canManageAssignments: false,
      canViewAudit: false,
      canForceLogout: false,
      canManagePins: false,
      canManageMailboxSettings: false,
      isAdmin: false,
    }
  }

  const role = cleanLower(data.role)
  const permissions = Array.isArray(data.permissions) ? data.permissions.map(String) : []
  const privileged = ADMIN_ROLES.has(role) || permissions.includes('*') || permissions.includes('admin.manage') || permissions.includes('users.manage') || permissions.includes('email_os.access.manage')

  return {
    user: data,
    canManageAssignments: privileged,
    canViewAudit: privileged,
    canForceLogout: privileged,
    canManagePins: privileged,
    canManageMailboxSettings: privileged,
    isAdmin: privileged,
  }
}

async function loadMailboxMap(db: ReturnType<typeof createEmailOSCoreDb>, mailboxIds: string[]) {
  if (!mailboxIds.length) return new Map<string, SafeMailbox>()

  const { data } = await db.from('email_os_core_mailboxes').select('*').in('id', mailboxIds)
  const map = new Map<string, SafeMailbox>()
  for (const row of data || []) {
    const mailbox = normalizeMailboxRow(row)
    if (mailbox) map.set(mailbox.id, mailbox)
  }
  return map
}

async function loadLatestSessions(db: ReturnType<typeof createEmailOSCoreDb>, userId: string) {
  const { data } = await db
    .from('email_os_mailbox_access_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(250)

  const rows = (data || []).map(normalizeSessionRow)
  const latestByAssignment = new Map<string, SessionRow>()
  const latestByMailbox = new Map<string, SessionRow>()

  for (const session of rows) {
    if (session.assignment_id && !latestByAssignment.has(session.assignment_id)) {
      latestByAssignment.set(session.assignment_id, session)
    }
    if (!latestByMailbox.has(session.mailbox_id)) {
      latestByMailbox.set(session.mailbox_id, session)
    }
  }

  return { rows, latestByAssignment, latestByMailbox }
}

function sessionStateForRow(session?: SessionRow | null) {
  if (!session) return 'expired' as const
  if (session.status === 'revoked') return 'revoked' as const
  if (new Date(session.expires_at).getTime() <= Date.now()) return 'expired' as const
  return 'active' as const
}

function assignmentSecurityLabel(assignment: AssignmentRow, session?: SessionRow | null) {
  if (assignment.status === 'revoked') return 'Revoked'
  if (assignment.pin_status === 'locked') return 'Locked'
  if (assignment.pin_status === 'not_configured') return 'Needs PIN'
  if (assignment.pin_status === 'reset_required') return 'Needs PIN'
  if (sessionStateForRow(session) === 'active') return 'Ready'
  if (assignment.pin_status === 'active') return 'PIN active'
  if (sessionStateForRow(session) === 'expired') return 'PIN active'
  if (sessionStateForRow(session) === 'revoked') return 'Locked'
  return 'PIN active'
}

function rowStateLabel(assignment: AssignmentRow, session?: SessionRow | null) {
  if (assignment.status === 'revoked') return 'Access revoked'
  if (assignment.status === 'suspended') return 'Temporarily locked'
  if (assignment.pin_status === 'not_configured') return 'PIN not configured'
  if (assignment.pin_status === 'locked' || (assignment.locked_until && new Date(assignment.locked_until).getTime() > Date.now())) return 'Temporarily locked'
  if (assignment.pin_status === 'reset_required') return 'PIN reset required'
  if (sessionStateForRow(session) === 'active') return 'Session active'
  if (sessionStateForRow(session) === 'expired') return 'Session expired'
  if (sessionStateForRow(session) === 'revoked') return 'Session revoked'
  if (assignment.pin_status === 'active') return 'PIN active'
  return 'Active'
}

function toSafeAssignmentSummary(assignment: AssignmentRow, mailbox: SafeMailbox | null, session?: SessionRow | null) {
  const pinConfigured = Boolean((assignment as AnyRecord).pin_hash)
  const assignmentStatus = normalizeAssignmentStatus(assignment.status)
  const pinStatus = normalizePinStatus(assignment.pin_status)
  const sessionStatus = sessionStateForRow(session)
  return {
    assignmentId: assignment.id,
    id: assignment.id,
    user_id: assignment.user_id,
    mailboxId: assignment.mailbox_id,
    mailbox_id: assignment.mailbox_id,
    mailboxEmail: mailbox?.address || null,
    mailboxName: mailbox?.name || null,
    mailbox,
    role: normalizeRole(assignment.role),
    permissions: {
      can_read: safeBool(assignment.can_read),
      can_send: safeBool(assignment.can_send),
      can_reply: safeBool(assignment.can_reply),
      can_archive: safeBool(assignment.can_archive),
      can_delete: safeBool(assignment.can_delete),
      can_manage_templates: safeBool(assignment.can_manage_templates),
      can_view_logs: safeBool(assignment.can_view_logs),
      can_manage_mailbox_settings: safeBool(assignment.can_manage_mailbox_settings),
    },
    pinConfigured,
    pinStatus,
    pin_status: pinStatus,
    assignmentStatus,
    status: assignmentStatus,
    failed_pin_attempts: Number(assignment.failed_pin_attempts || 0),
    locked_until: assignment.locked_until || null,
    assigned_by: assignment.assigned_by || null,
    assigned_at: assignment.assigned_at || null,
    revoked_by: assignment.revoked_by || null,
    revoked_at: assignment.revoked_at || null,
    revoke_reason: assignment.revoke_reason || null,
    notes: assignment.notes || null,
    sessionStatus,
    session_status: sessionStatus,
    session: session
      ? {
          id: session.id,
          status: sessionStatus,
          unlocked_at: session.unlocked_at || null,
          expires_at: session.expires_at,
          last_activity_at: session.last_activity_at || null,
          revoked_at: session.revoked_at || null,
          revoked_by: session.revoked_by || null,
          revoked_reason: session.revoked_reason || null,
        }
      : null,
    last_unlock_at: session?.unlocked_at || null,
    last_activity_at: session?.last_activity_at || null,
    row_state: rowStateLabel(assignment, session),
    security_status: assignmentSecurityLabel(assignment, session),
  }
}

function mailboxAccessSummaryStatus(rows: Array<{
  assignmentStatus?: string
  pinConfigured?: boolean
  pinStatus?: string
  sessionStatus?: string
  session_status?: string
  security_status?: string
}>) {
  const isActive = (value: unknown) => cleanLower(value) === 'active'
  const activeRows = rows.filter((row) => isActive(row.assignmentStatus))
  if (rows.some((row) => row.security_status === 'Revoked')) return 'Revoked'
  if (rows.some((row) => row.security_status === 'Locked')) return 'Locked'
  if (activeRows.some((row) => cleanLower(row.pinStatus) === 'locked')) return 'Locked'
  if (activeRows.some((row) => cleanLower(row.pinStatus) === 'not_configured' || cleanLower(row.pinStatus) === 'reset_required')) return 'Needs PIN'
  if (activeRows.some((row) => isActive(row.sessionStatus || row.session_status))) return 'Ready'
  if (activeRows.some((row) => row.pinConfigured && cleanLower(row.pinStatus) === 'active')) return 'PIN active'
  return 'Needs PIN'
}

export async function auditMailboxAccessEvent(payload: {
  actor_user_id?: string | null
  target_user_id?: string | null
  mailbox_id?: string | null
  assignment_id?: string | null
  session_id?: string | null
  event_type: string
  event_result: string
  severity?: 'info' | 'warning' | 'critical'
  request?: Request | null
  metadata_json?: Record<string, unknown>
}) {
  const db = createEmailOSCoreDb()
  const ctx = getRequestContext(payload.request)
  const eventType = clean(payload.event_type)
  const eventResult = clean(payload.event_result)

  if (!EMAIL_OS_ACCESS_EVENTS.has(eventType)) {
    throw new Error(`Unsupported mailbox access audit event: ${eventType}`)
  }

  const { error } = await db.from('email_os_mailbox_access_audit').insert({
    id: makeEmailOSId(),
    actor_user_id: payload.actor_user_id ? clean(payload.actor_user_id) : null,
    target_user_id: payload.target_user_id ? clean(payload.target_user_id) : null,
    mailbox_id: payload.mailbox_id ? clean(payload.mailbox_id) : null,
    assignment_id: payload.assignment_id ? clean(payload.assignment_id) : null,
    session_id: payload.session_id ? clean(payload.session_id) : null,
    event_type: eventType,
    event_result: eventResult,
    severity: payload.severity || 'info',
    ip_address: ctx.ip_address,
    user_agent: ctx.user_agent,
    metadata_json: safeJsonValue(payload.metadata_json || {}) || {},
    created_at: nowIso(),
  })

  if (error) throw error
}

export async function getUserEmailOSMailboxAssignments(userId: string) {
  const db = createEmailOSCoreDb()
  const resolvedUserId = clean(userId)

  const { data: assignmentRows, error } = await db
    .from('email_os_mailbox_user_assignments')
    .select('*')
    .eq('user_id', resolvedUserId)
    .order('assigned_at', { ascending: false })
    .limit(250)

  if (error) throw error

  const assignments = (assignmentRows || []).map(normalizeAssignmentRow)
  const mailboxIds = Array.from(new Set(assignments.map((assignment) => assignment.mailbox_id).filter(Boolean)))
  const mailboxes = await loadMailboxMap(db, mailboxIds)
  const sessions = await loadLatestSessions(db, resolvedUserId)

  const rows = assignments.map((assignment) => {
    const mailbox = mailboxes.get(assignment.mailbox_id) || null
    const session = sessions.latestByAssignment.get(assignment.id) || sessions.latestByMailbox.get(assignment.mailbox_id) || null
    return toSafeAssignmentSummary(assignment, mailbox, session)
  })

  const activeSessions = rows.filter((row) => row.session_status === 'active').length
  const lockedAssignments = rows.filter((row) => ['PIN not configured', 'PIN reset required', 'Temporarily locked', 'Access revoked'].includes(row.row_state)).length
  const lastActivityAt = rows
    .map((row) => row.last_activity_at)
    .filter(Boolean)
    .sort()
    .at(-1) || null

  const securityStatus = mailboxAccessSummaryStatus(rows)

  return {
    user_id: resolvedUserId,
    summary: {
      assigned_mailboxes_count: rows.length,
      active_sessions_count: activeSessions,
      locked_assignments_count: lockedAssignments,
      last_activity_at: lastActivityAt,
      security_status: securityStatus,
    },
    assignments: rows,
  }
}

export async function assignMailboxToUser(params: {
  actorUserId: string
  targetUserId: string
  mailboxId: string
  role: string
  pin?: string | null
  notes?: string | null
  permissions?: Partial<EmailOSPermissionSet> & { role?: string }
  assignedBy?: string | null
  request?: Request | null
}) {
  const actor = await getUserEmailOSAdminProfile(params.actorUserId)
  if (!actor.isAdmin) throw new EmailOSMailboxAccessError('Admin permission required.', 403)

  const db = createEmailOSCoreDb()
  const targetUserId = clean(params.targetUserId)
  const mailboxId = clean(params.mailboxId)
  const role = normalizeRole(params.role)

  if (!targetUserId || !mailboxId) throw new EmailOSMailboxAccessError('Target user and mailbox are required.', 400)
  if (params.pin && !isPin(params.pin)) throw new EmailOSMailboxAccessError('PIN must contain exactly 6 digits.', 400)

  const { data: mailbox, error: mailboxError } = await db.from('email_os_core_mailboxes').select('*').eq('id', mailboxId).maybeSingle()
  if (mailboxError || !mailbox) throw new EmailOSMailboxAccessError('Mailbox not found.', 404)

  const { data: existing, error: existingError } = await db
    .from('email_os_mailbox_user_assignments')
    .select('*')
    .eq('user_id', targetUserId)
    .eq('mailbox_id', mailboxId)
    .eq('status', 'active')
    .maybeSingle()

  if (existingError) throw existingError
  if (existing) throw new EmailOSMailboxAccessError('Duplicate active assignment is not allowed.', 409)

  const preset = normalizePermissionPatch({ role, ...params.permissions })
  const now = nowIso()
  const pinHash = params.pin ? await bcrypt.hash(clean(params.pin), 12) : null
  const pinStatus: EmailOSMailboxPinStatus = params.pin ? 'active' : 'not_configured'

  const row = {
    id: makeEmailOSId(),
    user_id: targetUserId,
    mailbox_id: mailboxId,
    role: preset.role,
    can_read: preset.permissions.can_read,
    can_send: preset.permissions.can_send,
    can_reply: preset.permissions.can_reply,
    can_archive: preset.permissions.can_archive,
    can_delete: preset.permissions.can_delete,
    can_manage_templates: preset.permissions.can_manage_templates,
    can_view_logs: preset.permissions.can_view_logs,
    can_manage_mailbox_settings: preset.permissions.can_manage_mailbox_settings,
    pin_hash: pinHash,
    pin_status: pinStatus,
    status: 'active',
    failed_pin_attempts: 0,
    locked_until: null,
    assigned_by: params.assignedBy || params.actorUserId,
    assigned_at: now,
    revoked_by: null,
    revoked_at: null,
    revoke_reason: null,
    notes: params.notes || null,
    created_at: now,
    updated_at: now,
  }

  const { data, error } = await db.from('email_os_mailbox_user_assignments').insert(row).select('*').single()
  if (error) throw error

  await auditMailboxAccessEvent({
    actor_user_id: params.actorUserId,
    target_user_id: targetUserId,
    mailbox_id: mailboxId,
    assignment_id: data.id,
    event_type: 'mailbox_assignment_created',
    event_result: 'success',
    request: params.request || null,
    metadata_json: {
      role: preset.role,
      permissions: preset.permissions,
      notes: params.notes || null,
    },
  })

  if (params.pin) {
    await auditMailboxAccessEvent({
      actor_user_id: params.actorUserId,
      target_user_id: targetUserId,
      mailbox_id: mailboxId,
      assignment_id: data.id,
      event_type: 'mailbox_pin_set',
      event_result: 'success',
      request: params.request || null,
      metadata_json: { pin_status: pinStatus },
    })
  }

  return normalizeAssignmentRow(data)
}

export async function updateMailboxAssignment(params: {
  actorUserId: string
  assignmentId: string
  role?: string
  permissions?: Partial<EmailOSPermissionSet> & { role?: string }
  status?: EmailOSMailboxAssignmentStatus
  notes?: string | null
  request?: Request | null
}) {
  const actor = await getUserEmailOSAdminProfile(params.actorUserId)
  if (!actor.isAdmin) throw new EmailOSMailboxAccessError('Admin permission required.', 403)

  const db = createEmailOSCoreDb()
  const assignmentId = clean(params.assignmentId)
  const { data: existing, error } = await db.from('email_os_mailbox_user_assignments').select('*').eq('id', assignmentId).maybeSingle()
  if (error || !existing) throw new EmailOSMailboxAccessError('Mailbox assignment not found.', 404)

  const preset = normalizePermissionPatch({ role: params.role || existing.role, ...params.permissions })
  const status = params.status ? normalizeAssignmentStatus(params.status) : normalizeAssignmentStatus(existing.status)
  const now = nowIso()
  const updates = {
    role: preset.role,
    can_read: preset.permissions.can_read,
    can_send: preset.permissions.can_send,
    can_reply: preset.permissions.can_reply,
    can_archive: preset.permissions.can_archive,
    can_delete: preset.permissions.can_delete,
    can_manage_templates: preset.permissions.can_manage_templates,
    can_view_logs: preset.permissions.can_view_logs,
    can_manage_mailbox_settings: preset.permissions.can_manage_mailbox_settings,
    status,
    notes: params.notes ?? existing.notes ?? null,
    updated_at: now,
  }

  const { data: updated, error: updateError } = await db.from('email_os_mailbox_user_assignments').update(updates).eq('id', assignmentId).select('*').single()
  if (updateError) throw updateError

  await auditMailboxAccessEvent({
    actor_user_id: params.actorUserId,
    target_user_id: existing.user_id,
    mailbox_id: existing.mailbox_id,
    assignment_id: assignmentId,
    event_type: preset.role !== existing.role ? 'mailbox_assignment_updated' : 'mailbox_permissions_changed',
    event_result: 'success',
    request: params.request || null,
    metadata_json: { before: { role: existing.role, status: existing.status }, after: { role: preset.role, status } },
  })

  return normalizeAssignmentRow(updated)
}

export async function setMailboxAssignmentPin(params: {
  actorUserId: string
  assignmentId: string
  pin: string
  reason?: string | null
  revokeActiveSessions?: boolean
  request?: Request | null
}) {
  const actor = await getUserEmailOSAdminProfile(params.actorUserId)
  if (!actor.isAdmin) throw new EmailOSMailboxAccessError('Admin permission required.', 403)
  if (!isPin(params.pin)) throw new EmailOSMailboxAccessError('PIN must contain exactly 6 digits.', 400)

  const db = createEmailOSCoreDb()
  const assignmentId = clean(params.assignmentId)
  const { data: existing, error } = await db.from('email_os_mailbox_user_assignments').select('*').eq('id', assignmentId).maybeSingle()
  if (error || !existing) throw new EmailOSMailboxAccessError('Mailbox assignment not found.', 404)

  const now = nowIso()
  const pinHash = await bcrypt.hash(clean(params.pin), 12)
  const pinStatus: EmailOSMailboxPinStatus = 'active'

  const { data: updated, error: updateError } = await db
    .from('email_os_mailbox_user_assignments')
    .update({
      pin_hash: pinHash,
      pin_status: pinStatus,
      failed_pin_attempts: 0,
      locked_until: null,
      updated_at: now,
    })
    .eq('id', assignmentId)
    .select('*')
    .single()

  if (updateError) throw updateError

  if (params.revokeActiveSessions !== false) {
    await revokeActiveSessionsForAssignment({
      assignmentId,
      actorUserId: params.actorUserId,
      reason: params.reason || 'PIN reset',
      request: params.request || null,
      mailboxId: clean(existing.mailbox_id),
      targetUserId: clean(existing.user_id),
    })
  }

  await auditMailboxAccessEvent({
    actor_user_id: params.actorUserId,
    target_user_id: existing.user_id,
    mailbox_id: existing.mailbox_id,
    assignment_id: assignmentId,
    event_type: existing.pin_hash ? 'mailbox_pin_reset' : 'mailbox_pin_set',
    event_result: 'success',
    request: params.request || null,
    metadata_json: { reason: params.reason || null, revoked_sessions: params.revokeActiveSessions !== false },
  })

  return normalizeAssignmentRow(updated)
}

async function revokeActiveSessionsForAssignment(params: {
  assignmentId: string
  actorUserId: string
  reason?: string | null
  mailboxId: string
  targetUserId: string
  request?: Request | null
}) {
  const db = createEmailOSCoreDb()
  const now = nowIso()

  const { data: sessions } = await db
    .from('email_os_mailbox_access_sessions')
    .select('*')
    .eq('assignment_id', params.assignmentId)
    .eq('status', 'active')

  const activeSessions = (sessions || []).map(normalizeSessionRow)

  if (!activeSessions.length) return

  for (const session of activeSessions) {
    await db
      .from('email_os_mailbox_access_sessions')
      .update({
        status: 'revoked',
        revoked_at: now,
        revoked_by: params.actorUserId,
        revoked_reason: params.reason || 'revoked',
        updated_at: now,
      })
      .eq('id', session.id)
      .then(() => null, () => null)

    await auditMailboxAccessEvent({
      actor_user_id: params.actorUserId,
      target_user_id: params.targetUserId,
      mailbox_id: params.mailboxId,
      assignment_id: params.assignmentId,
      session_id: session.id,
      event_type: 'mailbox_session_revoked',
      event_result: 'success',
      request: params.request || null,
      metadata_json: { reason: params.reason || null },
    }).catch(() => null)
  }
}

export async function revokeMailboxAssignment(params: {
  actorUserId: string
  assignmentId: string
  reason?: string | null
  revokeSessions?: boolean
  request?: Request | null
}) {
  const actor = await getUserEmailOSAdminProfile(params.actorUserId)
  if (!actor.isAdmin) throw new EmailOSMailboxAccessError('Admin permission required.', 403)

  const db = createEmailOSCoreDb()
  const assignmentId = clean(params.assignmentId)
  const { data: existing, error } = await db.from('email_os_mailbox_user_assignments').select('*').eq('id', assignmentId).maybeSingle()
  if (error || !existing) throw new EmailOSMailboxAccessError('Mailbox assignment not found.', 404)

  const now = nowIso()
  const { data: updated, error: updateError } = await db
    .from('email_os_mailbox_user_assignments')
    .update({
      status: 'revoked',
      pin_status: 'revoked',
      revoked_by: params.actorUserId,
      revoked_at: now,
      revoke_reason: params.reason || null,
      updated_at: now,
    })
    .eq('id', assignmentId)
    .select('*')
    .single()

  if (updateError) throw updateError

  if (params.revokeSessions !== false) {
    await revokeActiveSessionsForAssignment({
      assignmentId,
      actorUserId: params.actorUserId,
      reason: params.reason || 'assignment revoked',
      mailboxId: clean(existing.mailbox_id),
      targetUserId: clean(existing.user_id),
      request: params.request || null,
    })
  }

  await auditMailboxAccessEvent({
    actor_user_id: params.actorUserId,
    target_user_id: existing.user_id,
    mailbox_id: existing.mailbox_id,
    assignment_id: assignmentId,
    event_type: 'mailbox_assignment_revoked',
    event_result: 'success',
    request: params.request || null,
    metadata_json: { reason: params.reason || null, revoke_sessions: params.revokeSessions !== false },
  })

  return normalizeAssignmentRow(updated)
}

async function getAssignmentContext(userId: string, mailboxId: string) {
  const db = createEmailOSCoreDb()
  const { data: assignment, error } = await db
    .from('email_os_mailbox_user_assignments')
    .select('*')
    .eq('user_id', clean(userId))
    .eq('mailbox_id', clean(mailboxId))
    .maybeSingle()

  if (error || !assignment) return null

  const normalized = normalizeAssignmentRow(assignment)
  const { data: mailboxData } = await db.from('email_os_core_mailboxes').select('*').eq('id', normalized.mailbox_id).maybeSingle()
  const mailbox = normalizeMailboxRow(mailboxData)
  const sessions = await loadLatestSessions(db, clean(userId))
  const session = sessions.latestByAssignment.get(normalized.id) || sessions.latestByMailbox.get(normalized.mailbox_id) || null

  return { assignment: normalized, mailbox, session }
}

export async function createMailboxAccessSession(params: {
  userId: string
  mailboxId: string
  assignmentId: string
  request?: Request | null
}) {
  const db = createEmailOSCoreDb()
  const now = nowIso()
  const ctx = getRequestContext(params.request || null)
  const sessionRow = {
    id: makeEmailOSId(),
    user_id: clean(params.userId),
    mailbox_id: clean(params.mailboxId),
    assignment_id: clean(params.assignmentId),
    status: 'active',
    unlocked_at: now,
    expires_at: expiresAtFromNow(4),
    last_activity_at: now,
    ip_address: ctx.ip_address,
    user_agent: ctx.user_agent,
    revoked_at: null,
    revoked_by: null,
    revoked_reason: null,
    created_at: now,
    updated_at: now,
  }

  const { data, error } = await db.from('email_os_mailbox_access_sessions').insert(sessionRow).select('*').single()
  if (error) throw error

  await auditMailboxAccessEvent({
    actor_user_id: params.userId,
    target_user_id: params.userId,
    mailbox_id: params.mailboxId,
    assignment_id: params.assignmentId,
    session_id: data.id,
    event_type: 'mailbox_session_created',
    event_result: 'success',
    request: params.request || null,
    metadata_json: { expires_at: sessionRow.expires_at },
  })

  return normalizeSessionRow(data)
}

export async function getActiveMailboxAccessSession(userId: string, mailboxId: string) {
  const db = createEmailOSCoreDb()
  const { data, error } = await db
    .from('email_os_mailbox_access_sessions')
    .select('*')
    .eq('user_id', clean(userId))
    .eq('mailbox_id', clean(mailboxId))
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) throw error

  const sessions = (data || []).map(normalizeSessionRow)
  const current = sessions.find((session) => new Date(session.expires_at).getTime() > Date.now()) || null

  if (current) {
    return current
  }

  const expired = sessions[0]
  if (expired) {
    const now = nowIso()
    await db.from('email_os_mailbox_access_sessions').update({ status: 'expired', updated_at: now }).eq('id', expired.id).then(() => null, () => null)
    await auditMailboxAccessEvent({
      actor_user_id: userId,
      target_user_id: userId,
      mailbox_id: mailboxId,
      assignment_id: expired.assignment_id || null,
      session_id: expired.id,
      event_type: 'mailbox_session_expired',
      event_result: 'expired',
      metadata_json: { expires_at: expired.expires_at },
    }).catch(() => null)
  }

  return null
}

export async function refreshMailboxAccessSession(sessionId: string) {
  const db = createEmailOSCoreDb()
  const now = nowIso()
  const expiresAt = expiresAtFromNow(4)
  const { data, error } = await db
    .from('email_os_mailbox_access_sessions')
    .update({
      last_activity_at: now,
      expires_at: expiresAt,
      updated_at: now,
      status: 'active',
    })
    .eq('id', clean(sessionId))
    .select('*')
    .maybeSingle()

  if (error) throw error
  if (data) {
    await auditMailboxAccessEvent({
      session_id: clean(sessionId),
      event_type: 'mailbox_session_refreshed',
      event_result: 'success',
      metadata_json: { expires_at: expiresAt },
    }).catch(() => null)
  }
  return data ? normalizeSessionRow(data) : null
}

export async function verifyMailboxPin(params: {
  userId: string
  mailboxId: string
  pin: string
  request?: Request | null
}) {
  const db = createEmailOSCoreDb()
  const userId = clean(params.userId)
  const mailboxId = clean(params.mailboxId)
  const pin = clean(params.pin)
  const diagnosticsBase: EmailOSMailboxPinDiagnostics = {
    resolvedUserId: userId,
    requestedMailboxId: mailboxId,
    assignmentFound: false,
    assignmentStatus: null,
    pinStatus: null,
    pinConfigured: false,
    mailboxIdSource: 'request.body.mailboxId',
  }

  if (!userId || !mailboxId) throw new EmailOSMailboxAccessError('Mailbox not assigned to this user.', 403)
  if (!isPin(pin)) throw new EmailOSMailboxAccessError('PIN must contain exactly 6 digits.', 400)

  const { data: assignmentData, error: assignmentError } = await db
    .from('email_os_mailbox_user_assignments')
    .select('*')
    .eq('user_id', userId)
    .eq('mailbox_id', mailboxId)
    .eq('status', 'active')
    .maybeSingle()

  if (assignmentError) throw assignmentError

  const assignment = assignmentData ? normalizeAssignmentRow(assignmentData) : null
  const diagnostics: EmailOSMailboxPinDiagnostics = {
    ...diagnosticsBase,
    assignmentFound: Boolean(assignment),
    assignmentStatus: assignment ? assignment.status : null,
    pinStatus: assignment ? assignment.pin_status : null,
    pinConfigured: Boolean(assignmentData?.pin_hash),
  }

  if (!assignment) {
    await auditMailboxAccessEvent({
      actor_user_id: userId,
      target_user_id: userId,
      mailbox_id: mailboxId,
      event_type: 'unauthorized_mailbox_access_blocked',
      event_result: 'denied',
      severity: 'warning',
      request: params.request || null,
      metadata_json: { reason: 'mailbox not assigned' },
    }).catch(() => null)
    throw new EmailOSMailboxAccessError('Mailbox is not assigned to this user.', 403, diagnostics)
  }

  const { data: mailboxData } = await db.from('email_os_core_mailboxes').select('*').eq('id', assignment.mailbox_id).maybeSingle()
  const mailbox = normalizeMailboxRow(mailboxData)
  const now = Date.now()
  const lockedUntil = assignment.locked_until ? new Date(assignment.locked_until).getTime() : 0

  if (assignment.pin_status === 'locked' || (assignment.locked_until && lockedUntil > now)) {
    await auditMailboxAccessEvent({
      actor_user_id: userId,
      target_user_id: userId,
      mailbox_id: mailboxId,
      assignment_id: assignment.id,
      event_type: 'mailbox_unlock_failed',
      event_result: 'denied',
      severity: 'warning',
      request: params.request || null,
      metadata_json: { reason: 'pin locked', locked_until: assignment.locked_until || null },
    }).catch(() => null)
    throw new EmailOSMailboxAccessError('Mailbox PIN is temporarily locked. Please try again later or contact an administrator.', 423, diagnostics)
  }

  if (assignment.pin_status === 'not_configured' || !assignment.pin_hash) {
    await auditMailboxAccessEvent({
      actor_user_id: userId,
      target_user_id: userId,
      mailbox_id: mailboxId,
      assignment_id: assignment.id,
      event_type: 'mailbox_pin_required',
      event_result: 'denied',
      severity: 'warning',
      request: params.request || null,
    }).catch(() => null)
    throw new EmailOSMailboxAccessError('Mailbox PIN is not configured.', 400, diagnostics)
  }

  if (assignment.pin_status !== 'active') {
    await auditMailboxAccessEvent({
      actor_user_id: userId,
      target_user_id: userId,
      mailbox_id: mailboxId,
      assignment_id: assignment.id,
      event_type: 'mailbox_unlock_failed',
      event_result: 'denied',
      severity: 'warning',
      request: params.request || null,
      metadata_json: { reason: 'pin status not active', pin_status: assignment.pin_status },
    }).catch(() => null)
    throw new EmailOSMailboxAccessError('Mailbox PIN status is not active.', 400, diagnostics)
  }

  const pinOk = await bcrypt.compare(pin, assignment.pin_hash)
  if (!pinOk) {
    const attempts = Number(assignment.failed_pin_attempts || 0) + 1
    const shouldLock = attempts >= PIN_ATTEMPT_LIMIT
    const nextLockedUntil = shouldLock ? new Date(Date.now() + PIN_LOCKOUT_MS).toISOString() : null
    const nextStatus: EmailOSMailboxPinStatus = shouldLock ? 'locked' : 'active'

    await db
      .from('email_os_mailbox_user_assignments')
      .update({
        failed_pin_attempts: attempts,
        locked_until: nextLockedUntil,
        pin_status: nextStatus,
        updated_at: nowIso(),
      })
      .eq('id', assignment.id)
      .then(() => null, () => null)

    await auditMailboxAccessEvent({
      actor_user_id: userId,
      target_user_id: userId,
      mailbox_id: mailboxId,
      assignment_id: assignment.id,
      event_type: shouldLock ? 'mailbox_unlock_locked' : 'mailbox_unlock_failed',
      event_result: shouldLock ? 'locked' : 'failed',
      severity: shouldLock ? 'warning' : 'info',
      request: params.request || null,
      metadata_json: { failed_pin_attempts: attempts, locked_until: nextLockedUntil },
    }).catch(() => null)

    throw new EmailOSMailboxAccessError(
      shouldLock
        ? 'Mailbox PIN is temporarily locked. Please try again later or contact an administrator.'
        : 'Invalid mailbox PIN.',
      shouldLock ? 423 : 400,
      diagnostics
    )
  }

  const { data: existingSessions } = await db
    .from('email_os_mailbox_access_sessions')
    .select('*')
    .eq('assignment_id', assignment.id)
    .eq('status', 'active')

  for (const row of (existingSessions || []).map(normalizeSessionRow)) {
    await db.from('email_os_mailbox_access_sessions').update({
      status: 'revoked',
      revoked_at: nowIso(),
      revoked_by: userId,
      revoked_reason: 'new unlock session created',
      updated_at: nowIso(),
    }).eq('id', row.id).then(() => null, () => null)
    await auditMailboxAccessEvent({
      actor_user_id: userId,
      target_user_id: userId,
      mailbox_id: mailboxId,
      assignment_id: assignment.id,
      session_id: row.id,
      event_type: 'mailbox_session_revoked',
      event_result: 'success',
      severity: 'info',
      request: params.request || null,
      metadata_json: { reason: 'new unlock session created' },
    }).catch(() => null)
  }

  await db.from('email_os_mailbox_user_assignments').update({
    failed_pin_attempts: 0,
    locked_until: null,
    pin_status: 'active',
    updated_at: nowIso(),
  }).eq('id', assignment.id).then(() => null, () => null)

  const session = await createMailboxAccessSession({
    userId,
    mailboxId,
    assignmentId: assignment.id,
    request: params.request || null,
  })

  await auditMailboxAccessEvent({
    actor_user_id: userId,
    target_user_id: userId,
    mailbox_id: mailboxId,
    assignment_id: assignment.id,
    session_id: session.id,
    event_type: 'mailbox_unlock_success',
    event_result: 'success',
    request: params.request || null,
    metadata_json: { mailbox_name: mailbox?.name || null, mailbox_address: mailbox?.address || null },
  })

  return {
    assignment,
    mailbox,
    session,
  }
}

export async function requireUnlockedMailboxAccess(params: {
  userId: string
  mailboxId: string
  requiredPermission:
    | 'can_read'
    | 'can_send'
    | 'can_reply'
    | 'can_archive'
    | 'can_delete'
    | 'can_manage_templates'
    | 'can_view_logs'
    | 'can_manage_mailbox_settings'
  request?: Request | null
}) {
  const userId = clean(params.userId)
  const mailboxId = clean(params.mailboxId)
  const context = await getAssignmentContext(userId, mailboxId)

  if (!context) {
    await auditMailboxAccessEvent({
      actor_user_id: userId,
      target_user_id: userId,
      mailbox_id: mailboxId,
      event_type: 'unauthorized_mailbox_access_blocked',
      event_result: 'denied',
      severity: 'warning',
      request: params.request || null,
      metadata_json: { reason: 'mailbox not assigned' },
    }).catch(() => null)
    throw new EmailOSMailboxAccessError('Mailbox not assigned to this user.', 403)
  }

  const { assignment, mailbox } = context
  const permissionValue = Boolean((assignment as AnyRecord)[params.requiredPermission])

  if (!permissionValue) {
    await auditMailboxAccessEvent({
      actor_user_id: userId,
      target_user_id: userId,
      mailbox_id: mailboxId,
      assignment_id: assignment.id,
      event_type: 'unauthorized_mailbox_access_blocked',
      event_result: 'denied',
      severity: 'warning',
      request: params.request || null,
      metadata_json: { reason: `missing ${params.requiredPermission}` },
    }).catch(() => null)
    throw new EmailOSMailboxAccessError('Permission denied for this mailbox action.', 403)
  }

  const session = await getActiveMailboxAccessSession(userId, mailboxId)
  if (!session) {
    await auditMailboxAccessEvent({
      actor_user_id: userId,
      target_user_id: userId,
      mailbox_id: mailboxId,
      assignment_id: assignment.id,
      event_type: 'mailbox_session_expired',
      event_result: 'expired',
      severity: 'info',
      request: params.request || null,
      metadata_json: { reason: 'session missing or expired' },
    }).catch(() => null)
    throw new EmailOSMailboxAccessError('Mailbox session expired. Please enter the PIN again.', 440)
  }

  if (session.status === 'revoked') {
    await auditMailboxAccessEvent({
      actor_user_id: userId,
      target_user_id: userId,
      mailbox_id: mailboxId,
      assignment_id: assignment.id,
      session_id: session.id,
      event_type: 'mailbox_session_revoked',
      event_result: 'revoked',
      severity: 'warning',
      request: params.request || null,
    }).catch(() => null)
    throw new EmailOSMailboxAccessError('Mailbox session expired. Please enter the PIN again.', 440)
  }

  await refreshMailboxAccessSession(session.id)
  return { assignment, mailbox, session }
}

export async function resolveMailboxIdentityForAuthorizedUser(userId: string, mailboxId: string) {
  const context = await getAssignmentContext(clean(userId), clean(mailboxId))
  if (!context || !context.mailbox) {
    throw new EmailOSMailboxAccessError('Mailbox not assigned to this user.', 403)
  }
  if (context.assignment.status !== 'active') {
    throw new EmailOSMailboxAccessError('Mailbox not assigned to this user.', 403)
  }
  return {
    id: context.mailbox.id,
    mailboxId: context.mailbox.id,
    email: context.mailbox.address,
    name: context.mailbox.name,
    status: context.mailbox.status,
    owner: context.mailbox.owner,
    provider: context.mailbox.provider,
  }
}

export async function getUserEmailOSMailboxAccessProfile(userId: string) {
  const result = await getUserEmailOSMailboxAssignments(userId)
  return result
}

export async function resolveMailboxScopeForUser(userId: string, mailboxId?: string | null) {
  const resolvedUserId = clean(userId)
  const requestedMailboxId = clean(mailboxId)
  const profile = await getUserEmailOSMailboxAssignments(resolvedUserId)

  if (requestedMailboxId) {
    const assignment = profile.assignments.find((row) => row.mailbox_id === requestedMailboxId)
    if (!assignment) {
      throw new EmailOSMailboxAccessError('Mailbox not assigned to this user.', 403)
    }

    return {
      mailboxId: requestedMailboxId,
      assignment,
      mailbox: assignment.mailbox,
      session: assignment.session,
      summary: profile.summary,
    }
  }

  const activeAssignments = profile.assignments
    .filter((row) => row.session_status === 'active')
    .sort((a, b) => {
      const bStamp = new Date(b.last_activity_at || b.last_unlock_at || b.assigned_at || 0).getTime()
      const aStamp = new Date(a.last_activity_at || a.last_unlock_at || a.assigned_at || 0).getTime()
      return bStamp - aStamp
    })

  if (!activeAssignments.length) {
    throw new EmailOSMailboxAccessError('Mailbox session expired. Please enter the PIN again.', 440)
  }

  const assignment = activeAssignments[0]

  return {
    mailboxId: assignment.mailbox_id,
    assignment,
    mailbox: assignment.mailbox,
    session: assignment.session,
    summary: profile.summary,
  }
}

export async function getMailboxAccessAudit(userId: string, mailboxId?: string | null, limit = 100) {
  const db = createEmailOSCoreDb()
  let query = db
    .from('email_os_mailbox_access_audit')
    .select('*')
    .eq('target_user_id', clean(userId))
    .order('created_at', { ascending: false })
    .limit(Math.max(1, Math.min(250, limit)))

  if (mailboxId) {
    query = query.eq('mailbox_id', clean(mailboxId))
  }

  const { data, error } = await query
  if (error) throw error

  return (data || []).map((row) => ({
    id: clean(row.id),
    actor_user_id: row.actor_user_id || null,
    target_user_id: row.target_user_id || null,
    mailbox_id: row.mailbox_id || null,
    assignment_id: row.assignment_id || null,
    session_id: row.session_id || null,
    event_type: row.event_type,
    event_result: row.event_result,
    severity: row.severity || 'info',
    ip_address: row.ip_address || null,
    user_agent: row.user_agent || null,
    metadata_json: safeJsonValue(row.metadata_json || {}) || {},
    created_at: row.created_at,
  }))
}

export async function getMailboxAccessAssignmentById(assignmentId: string) {
  const db = createEmailOSCoreDb()
  const { data, error } = await db.from('email_os_mailbox_user_assignments').select('*').eq('id', clean(assignmentId)).maybeSingle()
  if (error) throw error
  if (!data) return null

  const assignment = normalizeAssignmentRow(data)
  const { data: mailboxData } = await db.from('email_os_core_mailboxes').select('*').eq('id', assignment.mailbox_id).maybeSingle()
  const mailbox = normalizeMailboxRow(mailboxData)
  const sessions = await loadLatestSessions(db, assignment.user_id)
  const session = sessions.latestByAssignment.get(assignment.id) || sessions.latestByMailbox.get(assignment.mailbox_id) || null
  return toSafeAssignmentSummary(assignment, mailbox, session)
}

export function getMailboxAccessSummaryFromAssignments(assignments: Array<{
  session_status?: string
  sessionStatus?: string
  row_state?: string
  last_activity_at?: string | null
  security_status?: string
  assignmentStatus?: string
  pinConfigured?: boolean
  pinStatus?: string
}>) {
  const activeSessionsCount = assignments.filter((row) => cleanLower(row.sessionStatus || row.session_status) === 'active').length
  const lockedAssignmentsCount = assignments.filter((row) => ['PIN not configured', 'PIN reset required', 'Temporarily locked', 'Access revoked'].includes(clean(row.row_state))).length
  const lastActivityAt = assignments
    .map((row) => row.last_activity_at)
    .filter(Boolean)
    .sort()
    .at(-1) || null
  const securityStatus = mailboxAccessSummaryStatus(assignments)
  return { activeSessionsCount, lockedAssignmentsCount, lastActivityAt, securityStatus }
}
