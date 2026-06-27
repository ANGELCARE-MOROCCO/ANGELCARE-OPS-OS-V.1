import { NextResponse } from 'next/server'
import { getCurrentAppUser } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { getMissionRow } from '@/lib/missions/repository'
import { recordCareLinkMobileGuardPass } from '@/lib/carelink/mobile-audit-ledger'
import { evaluateCareLinkMobileDeviceGovernance } from '@/lib/carelink/mobile-device-governance'

type AnyRow = Record<string, any>

type MobileCapability =
  | 'can_view_missions'
  | 'can_accept_missions'
  | 'can_submit_reports'
  | 'can_view_payments'

type SupabaseClient = Awaited<ReturnType<typeof createClient>>

const OPS_ROLES = new Set(['ceo', 'owner', 'super_admin', 'direction', 'admin', 'operations', 'session_leader'])
const ACTIVE_ACCESS_STATUSES = new Set(['active', 'enabled', 'approved', 'live'])
const BLOCKED_MISSION_STATUSES = new Set(['deleted', 'archived', 'cancelled', 'canceled'])

export class CareLinkMobileAccessError extends Error {
  status: number
  code: string
  details?: Record<string, unknown>

  constructor(message: string, status = 403, code = 'carelink_mobile_access_denied', details?: Record<string, unknown>) {
    super(message)
    this.name = 'CareLinkMobileAccessError'
    this.status = status
    this.code = code
    this.details = details
  }
}

function normalizeString(value: unknown) {
  return String(value || '').trim()
}

function normalizeLower(value: unknown) {
  return normalizeString(value).toLowerCase()
}

function asPermissionList(value: unknown): string[] {
  return Array.isArray(value)
    ? value.map((item) => normalizeString(item)).filter(Boolean)
    : []
}

function isFullAccessActor(user: AnyRow | null) {
  if (!user) return false
  const role = normalizeLower(user.role || user.role_key || user.roleKey)
  const permissions = asPermissionList(user.permissions)
  return role === 'ceo' || role === 'owner' || role === 'super_admin' || permissions.includes('*')
}

function hasAnyPermission(user: AnyRow | null, permissionsToCheck: string[]) {
  if (isFullAccessActor(user)) return true
  const permissions = asPermissionList(user?.permissions)
  return permissionsToCheck.some((permission) => permissions.includes(permission))
}

async function safeSingle<T = AnyRow>(promise: any): Promise<T | null> {
  try {
    const { data, error } = await promise
    if (error) return null
    return data || null
  } catch {
    return null
  }
}

async function safeMaybeByColumn<T = AnyRow>(supabase: SupabaseClient, table: string, column: string, value: unknown, select = '*'): Promise<T | null> {
  const clean = normalizeString(value)
  if (!clean) return null
  return safeSingle<T>(supabase.from(table).select(select).eq(column, clean).maybeSingle())
}

async function resolveCaregiverForAppUser(supabase: SupabaseClient, user: AnyRow): Promise<AnyRow | null> {
  const userId = normalizeString(user.id)
  const email = normalizeLower(user.email || user.work_email || user.username || user.login)
  const phone = normalizeString(user.phone)

  for (const column of ['app_user_id', 'user_id', 'auth_user_id', 'account_user_id', 'supabase_user_id']) {
    const row = await safeMaybeByColumn(supabase, 'caregivers', column, userId)
    if (row) return row
  }

  for (const column of ['email', 'work_email']) {
    const row = await safeMaybeByColumn(supabase, 'caregivers', column, email)
    if (row) return row
  }

  if (phone) {
    for (const column of ['phone', 'mobile_phone']) {
      const row = await safeMaybeByColumn(supabase, 'caregivers', column, phone)
      if (row) return row
    }
  }

  return null
}

async function resolveMobileAccessForUser(supabase: SupabaseClient, user: AnyRow, caregiver: AnyRow | null): Promise<AnyRow | null> {
  const userId = normalizeString(user.id)
  const email = normalizeLower(user.email || user.work_email || user.username || user.login)

  for (const column of ['auth_user_id', 'app_user_id', 'user_id']) {
    const row = await safeMaybeByColumn(supabase, 'carelink_agent_app_access', column, userId)
    if (row) return row
  }

  if (email) {
    const byEmail = await safeMaybeByColumn(supabase, 'carelink_agent_app_access', 'email', email)
    if (byEmail) return byEmail
  }

  if (caregiver?.id != null) {
    const byCaregiver = await safeMaybeByColumn(supabase, 'carelink_agent_app_access', 'caregiver_id', caregiver.id)
    if (byCaregiver) return byCaregiver
  }

  return null
}

async function resolveCaregiverFromAccess(supabase: SupabaseClient, access: AnyRow | null): Promise<AnyRow | null> {
  if (!access?.caregiver_id) return null
  return safeMaybeByColumn(supabase, 'caregivers', 'id', access.caregiver_id)
}

function assertMobileAccessIsLive(access: AnyRow | null, capability: MobileCapability) {
  if (!access) {
    throw new CareLinkMobileAccessError('CareLink mobile access is not provisioned for this account.', 403, 'carelink_mobile_not_provisioned')
  }

  const status = normalizeLower(access.access_status || access.status)
  const mobileEnabled = access.mobile_enabled === true || normalizeLower(access.mobile_enabled) === 'true'

  if (!mobileEnabled) {
    throw new CareLinkMobileAccessError('CareLink mobile access is disabled by operations.', 403, 'carelink_mobile_disabled')
  }

  if (!ACTIVE_ACCESS_STATUSES.has(status)) {
    throw new CareLinkMobileAccessError(`CareLink mobile access is not active (${status || 'unknown'}).`, 403, 'carelink_mobile_inactive', { status })
  }

  if (access.revoked_at) {
    throw new CareLinkMobileAccessError('CareLink mobile access has been revoked.', 403, 'carelink_mobile_revoked')
  }

  if (access.suspended_at) {
    throw new CareLinkMobileAccessError('CareLink mobile access is suspended.', 403, 'carelink_mobile_suspended')
  }

  if (access.shutdown_until && new Date(access.shutdown_until).getTime() > Date.now()) {
    throw new CareLinkMobileAccessError('CareLink mobile access is temporarily shut down.', 423, 'carelink_mobile_shutdown', { shutdownUntil: access.shutdown_until })
  }

  if (access[capability] === false) {
    throw new CareLinkMobileAccessError('This CareLink mobile action is not allowed for this agent.', 403, 'carelink_mobile_permission_denied', { capability })
  }
}

function assertMissionIsLive(row: AnyRow | null) {
  if (!row) {
    throw new CareLinkMobileAccessError('Mission not found.', 404, 'carelink_mission_not_found')
  }

  const statusValues = [row.status, row.lifecycle_stage, row.dossier_status]
    .map(normalizeLower)
    .filter(Boolean)

  if (row.is_archived === true || statusValues.some((status) => BLOCKED_MISSION_STATUSES.has(status))) {
    throw new CareLinkMobileAccessError('Mission is not available in CareLink mobile.', 404, 'carelink_mission_not_available')
  }
}

function missionBelongsToCaregiver(row: AnyRow, caregiverId: number) {
  const candidateIds = [
    row.caregiver_id,
    row.agent_id,
    row.assigned_caregiver_id,
    row.primary_caregiver_id,
    row.backup_caregiver_id,
    row.replacement_caregiver_id,
  ]
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value))

  return candidateIds.some((value) => value === caregiverId)
}

export async function requireCareLinkOpsActor() {
  const user = await getCurrentAppUser()
  if (!user) {
    throw new CareLinkMobileAccessError('Login required.', 401, 'carelink_ops_login_required')
  }

  const role = normalizeLower((user as AnyRow).role || (user as AnyRow).role_key)
  const allowed = OPS_ROLES.has(role) || hasAnyPermission(user as AnyRow, [
    'operations.view',
    'operations.manage',
    'interventions.dispatch',
    'interventions.manage',
    'missions.view',
    'missions.assign',
    'caregivers.view',
  ])

  if (!allowed) {
    throw new CareLinkMobileAccessError('CareLink OPS access denied.', 403, 'carelink_ops_access_denied')
  }

  return user as AnyRow
}

export async function requireCareLinkMobileAgent(capability: MobileCapability = 'can_view_missions', request?: Request | null) {
  const user = await getCurrentAppUser()
  if (!user) {
    throw new CareLinkMobileAccessError('CareLink mobile login required.', 401, 'carelink_mobile_login_required')
  }

  const supabase = await createClient()
  let caregiver = await resolveCaregiverForAppUser(supabase, user as AnyRow)
  const access = await resolveMobileAccessForUser(supabase, user as AnyRow, caregiver)

  if (!caregiver && access?.caregiver_id) {
    caregiver = await resolveCaregiverFromAccess(supabase, access)
  }

  if (!caregiver?.id) {
    throw new CareLinkMobileAccessError('No caregiver profile is linked to this account.', 403, 'carelink_mobile_caregiver_not_linked')
  }

  assertMobileAccessIsLive(access, capability)

  const caregiverId = Number(caregiver.id)
  const userId = normalizeString((user as AnyRow).id)
  const deviceDecision = request
    ? await evaluateCareLinkMobileDeviceGovernance({
        supabase,
        request,
        caregiverId,
        userId,
        access: access as AnyRow,
        actionType: capability,
      })
    : { allowed: true as const, deviceContext: null }

  if (!deviceDecision.allowed) {
    throw new CareLinkMobileAccessError(
      deviceDecision.message || 'CareLink mobile device governance blocked this request.',
      deviceDecision.status || 403,
      deviceDecision.code || 'carelink_mobile_device_governance_blocked',
      deviceDecision.details,
    )
  }

  await recordCareLinkMobileGuardPass({
    caregiverId,
    userId,
    capability,
    accessStatus: normalizeString((access as AnyRow).access_status || (access as AnyRow).status),
    metadata: deviceDecision.deviceContext ? { device_fingerprint: deviceDecision.deviceContext.deviceFingerprint } : {},
  })

  return {
    supabase,
    user: user as AnyRow,
    caregiver,
    caregiverId,
    access: access as AnyRow,
    deviceContext: deviceDecision.deviceContext || null,
  }
}

export async function requireCareLinkMobileMissionAccess(missionId: number, capability: MobileCapability = 'can_view_missions', request?: Request | null) {
  if (!Number.isFinite(missionId)) {
    throw new CareLinkMobileAccessError('Invalid mission id.', 400, 'carelink_invalid_mission_id')
  }

  const session = await requireCareLinkMobileAgent(capability, request)
  const mission = await getMissionRow(missionId)
  assertMissionIsLive(mission as AnyRow | null)

  if (!missionBelongsToCaregiver(mission as AnyRow, session.caregiverId)) {
    throw new CareLinkMobileAccessError('This mission is not assigned to the authenticated CareLink agent.', 403, 'carelink_mission_not_assigned', {
      missionId,
      caregiverId: session.caregiverId,
    })
  }

  return { ...session, mission: mission as AnyRow }
}


export async function requireCareLinkMobileLinkedRowAccess(
  table: string,
  rowId: string | number,
  capability: MobileCapability = 'can_view_missions',
  request?: Request | null,
) {
  const session = await requireCareLinkMobileAgent(capability, request)
  const { data: row, error } = await session.supabase.from(table).select('*').eq('id', rowId).maybeSingle()
  if (error || !row) {
    throw new CareLinkMobileAccessError('CareLink mobile record not found.', 404, 'carelink_mobile_record_not_found', { table, rowId: String(rowId) })
  }

  const caregiverId = Number((row as AnyRow).caregiver_id)
  if (Number.isFinite(caregiverId) && caregiverId !== session.caregiverId) {
    throw new CareLinkMobileAccessError('This CareLink record is not assigned to the authenticated agent.', 403, 'carelink_mobile_record_not_assigned', { table, rowId: String(rowId) })
  }

  const missionId = Number((row as AnyRow).mission_id)
  if (Number.isFinite(missionId)) {
    const mission = await getMissionRow(missionId)
    assertMissionIsLive(mission as AnyRow | null)
    if (!missionBelongsToCaregiver(mission as AnyRow, session.caregiverId)) {
      throw new CareLinkMobileAccessError('This CareLink record is linked to a mission not assigned to the authenticated agent.', 403, 'carelink_mobile_record_mission_not_assigned', { table, rowId: String(rowId), missionId })
    }
  }

  return { ...session, row: row as AnyRow }
}

export function carelinkMobileErrorResponse(error: unknown, fallback = 'CareLink mobile request failed') {
  if (error instanceof CareLinkMobileAccessError) {
    return NextResponse.json(
      { ok: false, error: error.message, code: error.code, details: error.details || null },
      { status: error.status, headers: { 'Cache-Control': 'no-store' } },
    )
  }

  return NextResponse.json(
    { ok: false, error: error instanceof Error ? error.message : fallback },
    { status: 500, headers: { 'Cache-Control': 'no-store' } },
  )
}
