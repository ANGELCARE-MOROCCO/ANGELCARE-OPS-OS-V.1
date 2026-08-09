import { recordCareLinkAgentActivity } from '@/lib/carelink/mobile-audit-ledger'

type AnyRow = Record<string, any>

type GovernanceDecision = {
  allowed: boolean
  code?: string
  status?: number
  message?: string
  details?: Record<string, unknown>
  deviceContext?: CareLinkMobileDeviceContext
}

export type CareLinkMobileDeviceContext = {
  deviceFingerprint: string
  deviceId: string | null
  deviceLabel: string | null
  platform: string | null
  appVersion: string | null
  userAgent: string
  ipAddress: string | null
}

function cleanString(value: unknown) {
  return String(value || '').trim()
}

function cleanLower(value: unknown) {
  return cleanString(value).toLowerCase()
}

function firstHeader(request: Request | undefined | null, names: string[]) {
  if (!request) return ''
  for (const name of names) {
    const value = request.headers.get(name)
    if (value && value.trim()) return value.trim()
  }
  return ''
}

function simpleHash(value: string) {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0).toString(36)
}

function normalizeSessionLimit(value: unknown) {
  const limit = Number(value)
  return Number.isFinite(limit) && limit > 0 ? Math.min(Math.floor(limit), 8) : 1
}

function isBlockedStatus(value: unknown) {
  const status = cleanLower(value)
  return ['blocked', 'revoked', 'suspended', 'disabled', 'quarantined'].includes(status)
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

async function safeMany<T = AnyRow>(promise: any): Promise<T[]> {
  try {
    const { data, error } = await promise
    if (error || !Array.isArray(data)) return []
    return data
  } catch {
    return []
  }
}

export function resolveCareLinkMobileDeviceContext(request?: Request | null): CareLinkMobileDeviceContext {
  const userAgent = firstHeader(request, ['user-agent']) || 'unknown'
  const ipAddress = (firstHeader(request, ['x-forwarded-for', 'x-real-ip', 'cf-connecting-ip']) || '').split(',')[0]?.trim() || null
  const deviceId = firstHeader(request, ['x-carelink-device-id', 'x-device-id', 'x-client-device-id']) || null
  const deviceLabel = firstHeader(request, ['x-carelink-device-label', 'x-device-label']) || null
  const platform = firstHeader(request, ['x-carelink-platform', 'x-client-platform']) || null
  const appVersion = firstHeader(request, ['x-carelink-app-version', 'x-app-version']) || null
  const fingerprintSeed = [deviceId || '', platform || '', appVersion || '', userAgent || '', ipAddress || ''].join('|')
  const deviceFingerprint = deviceId ? `device:${simpleHash(deviceId)}` : `derived:${simpleHash(fingerprintSeed)}`

  return {
    deviceFingerprint,
    deviceId,
    deviceLabel,
    platform,
    appVersion,
    userAgent: userAgent.slice(0, 500),
    ipAddress,
  }
}

async function recordSecurityEvent(args: {
  supabase: any
  caregiverId: number
  userId: string
  eventType: string
  severity?: string
  device: CareLinkMobileDeviceContext
  metadata?: Record<string, unknown>
}) {
  await args.supabase.from('carelink_mobile_security_events').insert([{
    caregiver_id: args.caregiverId,
    auth_user_id: args.userId || null,
    event_type: args.eventType,
    severity: args.severity || 'normal',
    device_fingerprint: args.device.deviceFingerprint,
    ip_address: args.device.ipAddress,
    user_agent: args.device.userAgent,
    metadata: {
      device_id: args.device.deviceId,
      device_label: args.device.deviceLabel,
      platform: args.device.platform,
      app_version: args.device.appVersion,
      ...(args.metadata || {}),
    },
  }]).catch(() => null)
}

export async function evaluateCareLinkMobileDeviceGovernance(args: {
  supabase: any
  request?: Request | null
  caregiverId: number
  userId?: string | null
  access?: AnyRow | null
  missionId?: number | null
  actionType?: string | null
}): Promise<GovernanceDecision> {
  const device = resolveCareLinkMobileDeviceContext(args.request)
  const userId = cleanString(args.userId || args.access?.auth_user_id || args.access?.user_id || args.access?.app_user_id || '')
  const accessId = args.access?.id ? String(args.access.id) : null

  const existing = await safeSingle<AnyRow>(args.supabase
    .from('carelink_mobile_device_sessions')
    .select('*')
    .eq('caregiver_id', args.caregiverId)
    .eq('device_fingerprint', device.deviceFingerprint)
    .maybeSingle())

  if (existing && (existing.blocked_at || existing.revoked_at || isBlockedStatus(existing.status))) {
    await recordSecurityEvent({
      supabase: args.supabase,
      caregiverId: args.caregiverId,
      userId,
      eventType: 'blocked_device_attempt',
      severity: 'critical',
      device,
      metadata: { mission_id: args.missionId || null, action_type: args.actionType || null, status: existing.status || null },
    })
    return {
      allowed: false,
      status: 423,
      code: 'carelink_mobile_device_blocked',
      message: 'This CareLink mobile device is blocked by operations.',
      details: { deviceFingerprint: device.deviceFingerprint, status: existing.status || null },
      deviceContext: device,
    }
  }

  if (args.access?.trusted_device_required === true && !existing?.trusted_at) {
    await recordSecurityEvent({
      supabase: args.supabase,
      caregiverId: args.caregiverId,
      userId,
      eventType: 'untrusted_device_blocked',
      severity: 'high',
      device,
      metadata: { mission_id: args.missionId || null, action_type: args.actionType || null },
    })
    return {
      allowed: false,
      status: 423,
      code: 'carelink_mobile_device_not_trusted',
      message: 'This CareLink mobile device is not trusted for this agent.',
      details: { deviceFingerprint: device.deviceFingerprint },
      deviceContext: device,
    }
  }

  const sessionLimit = normalizeSessionLimit(args.access?.session_limit)
  const activeSessions = await safeMany<AnyRow>(args.supabase
    .from('carelink_mobile_device_sessions')
    .select('id, device_fingerprint, status, last_seen_at, revoked_at, blocked_at')
    .eq('caregiver_id', args.caregiverId)
    .eq('status', 'active')
    .is('revoked_at', null)
    .is('blocked_at', null)
    .order('last_seen_at', { ascending: false })
    .limit(20))

  const knownActive = activeSessions.some((row) => row.device_fingerprint === device.deviceFingerprint)
  if (!knownActive && activeSessions.length >= sessionLimit) {
    await recordSecurityEvent({
      supabase: args.supabase,
      caregiverId: args.caregiverId,
      userId,
      eventType: 'session_limit_blocked',
      severity: 'high',
      device,
      metadata: { mission_id: args.missionId || null, action_type: args.actionType || null, session_limit: sessionLimit, active_sessions: activeSessions.length },
    })
    return {
      allowed: false,
      status: 429,
      code: 'carelink_mobile_session_limit_exceeded',
      message: 'CareLink mobile session limit exceeded for this agent.',
      details: { sessionLimit, activeSessions: activeSessions.length },
      deviceContext: device,
    }
  }

  await args.supabase.from('carelink_mobile_device_sessions').upsert([{
    caregiver_id: args.caregiverId,
    auth_user_id: userId || null,
    access_id: accessId,
    device_fingerprint: device.deviceFingerprint,
    device_id: device.deviceId,
    device_label: device.deviceLabel,
    platform: device.platform,
    app_version: device.appVersion,
    user_agent: device.userAgent,
    ip_address: device.ipAddress,
    status: 'active',
    last_seen_at: new Date().toISOString(),
    metadata: { mission_id: args.missionId || null, action_type: args.actionType || null },
    updated_at: new Date().toISOString(),
  }], { onConflict: 'caregiver_id,device_fingerprint' }).catch(() => null)

  await Promise.allSettled([
    recordSecurityEvent({
      supabase: args.supabase,
      caregiverId: args.caregiverId,
      userId,
      eventType: 'device_session_seen',
      severity: 'normal',
      device,
      metadata: { mission_id: args.missionId || null, action_type: args.actionType || null },
    }),
    recordCareLinkAgentActivity({
      caregiverId: args.caregiverId,
      userId,
      missionId: args.missionId || null,
      activityType: 'device-session-seen',
      source: 'carelink_mobile_security',
      status: 'active',
      outcome: 'allowed',
      priority: 'normal',
      request: args.request || undefined,
      metadata: {
        action_type: args.actionType || null,
        device_fingerprint: device.deviceFingerprint,
        platform: device.platform,
        app_version: device.appVersion,
      },
    }),
  ])

  return { allowed: true, deviceContext: device }
}
