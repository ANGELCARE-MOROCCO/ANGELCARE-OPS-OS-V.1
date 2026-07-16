import {CARELINK_ANDROID_VERSION, CARELINK_ENDPOINTS} from '../../config/env'
import {setMobileSnapshot} from '../../store/mobileSnapshotStore'
import {clearSessionSnapshot, setSessionSnapshot, type AppSession} from '../../store/sessionStore'
import {requestJson} from '../api/httpClient'
import {clearCareLinkSession as clearCareLinkSessionStorage, loadCareLinkSession, saveCareLinkSession} from './sessionStorage'
import {extractCareLinkWorkspace, fetchCareLinkDashboard, fetchCareLinkMobileWorkspace, type CareLinkMobileWorkspace} from '../carelink/mobileService'

export type LoginInput = {
  identifier: string
  password: string
}

export type LoginResult =
  | {
      ok: true
      endpoint: string
      session: AppSession
      data: unknown
      sessionToken: string
      sessionExpiresAt: string | null
    }
  | {ok: false; endpoint: string; status: number; error: string; data: unknown}

function pickProfile(data: any) {
  return data?.agent || data?.profile || data?.user || data?.data || data?.session || {}
}

function unwrapPayload(data: unknown) {
  if (!data || typeof data !== 'object') return {}
  const payload = data as Record<string, unknown>
  if ('data' in payload && payload.data && typeof payload.data === 'object' && !Array.isArray(payload.data)) {
    return payload.data as Record<string, unknown>
  }
  return payload
}

function extractList(data: unknown) {
  const payload = unwrapPayload(data) as Record<string, unknown>
  if (Array.isArray(payload)) return payload

  for (const key of ['data', 'items', 'messages', 'notifications', 'alerts', 'results', 'rows']) {
    const value = payload[key]
    if (Array.isArray(value)) return value
  }

  return []
}

function resolveAgentName(profile: Record<string, unknown>, fallback: string) {
  const candidates = [
    profile.fullName,
    profile.full_name,
    profile.name,
    profile.display_name,
    profile.agent_name,
    profile.caregiver_name,
  ]
  return String(candidates.find((value) => typeof value === 'string' && String(value).trim()) || fallback).trim()
}

function pickSessionToken(data: Record<string, unknown>) {
  const token = data.sessionToken || data.session_token || data.token || data.session?.token
  return typeof token === 'string' ? token.trim() : ''
}

function pickSessionExpiry(data: Record<string, unknown>) {
  const expiry = data.sessionExpiresAt || data.session_expires_at || data.expiresAt || data.expires_at || data.session?.expiresAt
  return typeof expiry === 'string' && expiry.trim() ? expiry : null
}

function readErrorMessage(result: {status: number; data: unknown; error: string | null}) {
  const payload = unwrapPayload(result.data)
  const explicit = typeof payload.error === 'string' && payload.error.trim() ? payload.error.trim() : ''
  const message = typeof payload.message === 'string' && payload.message.trim() ? payload.message.trim() : ''
  return explicit || message || result.error || `HTTP ${result.status}`
}

function mapSession(data: Record<string, unknown>, token: string, expiresAt: string | null): AppSession {
  const profile = pickProfile(data)
  const rawData = data as Record<string, unknown>
  const rawAccess = rawData.access as Record<string, unknown> | undefined
  return {
    identifier: String(rawData.identifier || rawData.email || rawData.username || ''),
    agentName: resolveAgentName(profile, String(rawData.identifier || rawData.email || rawData.username || 'Agent CareLink')),
    role: String(profile.role || rawData.role || 'Agent CareLink'),
    accessStatus: String(profile.status || profile.access_status || rawAccess?.access_status || ''),
    token,
    expiresAt,
    raw: data,
  }
}

async function tryLoginEndpoint(endpoint: string, payload: Record<string, unknown>): Promise<LoginResult> {
  const result = await requestJson(endpoint, {
    method: 'POST',
    body: payload,
  })

  if (!result.ok) {
    return {
      ok: false,
      endpoint,
      status: result.status,
      error: readErrorMessage(result),
      data: result.data,
    }
  }

  const data = unwrapPayload(result.data)
  const token = pickSessionToken(data)
  const expiresAt = pickSessionExpiry(data)

  if (!token) {
    return {
      ok: false,
      endpoint,
      status: 500,
      error: 'The backend did not return a CareLink session token.',
      data: result.data,
    }
  }

  const session = mapSession(data, token, expiresAt)
  await saveCareLinkSession(session, token, expiresAt)
  setSessionSnapshot(session)

  return {
    ok: true,
    endpoint,
    session,
    data: result.data,
    sessionToken: token,
    sessionExpiresAt: expiresAt,
  }
}

export async function loginCareLinkMobile(input: LoginInput): Promise<LoginResult> {
  const identifier = String(input.identifier || '').trim()
  const password = String(input.password || '')
  const isEmail = identifier.includes('@')
  const payload = {
    identifier,
    email: isEmail ? identifier : undefined,
    username: isEmail ? undefined : identifier,
    password,
    source: 'angelcare_carelink_android_native',
    version: CARELINK_ANDROID_VERSION,
  }

  const endpoints = [CARELINK_ENDPOINTS.mobileLogin, CARELINK_ENDPOINTS.login]
  let lastFailure: LoginResult | null = null

  for (const endpoint of endpoints) {
    const result = await tryLoginEndpoint(endpoint, payload)
    if (result.ok) {
      return result
    }
    lastFailure = result
  }

  return lastFailure || {ok: false, endpoint: CARELINK_ENDPOINTS.mobileLogin, status: 0, error: 'Login failed', data: null}
}

export async function restoreCareLinkSession() {
  const stored = await loadCareLinkSession()
  if (!stored) return null
  setSessionSnapshot(stored.session)
  return stored
}

export async function syncCareLinkWorkspace() {
  const [workspaceResult, dashboardResult, messagesResult, notificationsResult, alertsResult] = await Promise.all([
    fetchCareLinkMobileWorkspace(),
    fetchCareLinkDashboard(),
    requestJson('/api/carelink/messages', {method: 'GET'}),
    requestJson('/api/carelink/notifications', {method: 'GET'}),
    requestJson('/api/carelink/alerts', {method: 'GET'}),
  ])

  const workspace = extractCareLinkWorkspace(workspaceResult.data) || extractCareLinkWorkspace(dashboardResult.data)

  if (!workspace) {
    const failure = [workspaceResult, dashboardResult, messagesResult, notificationsResult, alertsResult].find((item) => !item.ok) || workspaceResult
    return {
      ...failure,
      data: null,
      error: failure.error || 'CareLink workspace unavailable',
    }
  }

  const messages = extractList(messagesResult.data)
  const notifications = extractList(notificationsResult.data)
  const alerts = extractList(alertsResult.data)

  const mergedWorkspace: CareLinkMobileWorkspace = {
    ...workspace,
    messages: messages.length ? messages as Array<Record<string, unknown>> : (workspace.messages || []),
    notifications: notifications.length ? notifications as Array<Record<string, unknown>> : (workspace.notifications || []),
    alerts: alerts.length ? alerts as Array<Record<string, unknown>> : (workspace.alerts || []),
  }

  const stats = mergedWorkspace.stats || {}
  const messageList = mergedWorkspace.messages || []
  const notificationList = mergedWorkspace.notifications || []
  const alertList = mergedWorkspace.alerts || []

  setMobileSnapshot({
    missions: Number(stats.todayMissions || mergedWorkspace.todayMissions?.length || mergedWorkspace.records?.length || 0),
    messages: Number(stats.unreadMessages || messageList.filter((item: any) => item?.unread).length || 0),
    notifications: Number(notificationList.length || 0),
    alerts: Number(alertList.length || 0),
    syncState: 'online',
    summary: `Workspace live · ${mergedWorkspace.source || 'carelink_mobile'}`,
  })

  return {
    ok: true as const,
    status: workspaceResult.ok ? workspaceResult.status : dashboardResult.status,
    endpoint: workspaceResult.endpoint || dashboardResult.endpoint,
    url: workspaceResult.url || dashboardResult.url,
    data: mergedWorkspace,
    error: null,
  }
}

export async function clearCareLinkSession() {
  await clearCareLinkSessionStorage()
  clearSessionSnapshot()
  setMobileSnapshot({
    missions: 0,
    messages: 0,
    notifications: 0,
    alerts: 0,
    syncState: 'unknown',
    summary: 'Snapshot mobile non initialisé.',
  })
}

export async function fetchCareLinkMe() {
  return requestJson('/api/carelink/me', {method: 'GET'})
}
