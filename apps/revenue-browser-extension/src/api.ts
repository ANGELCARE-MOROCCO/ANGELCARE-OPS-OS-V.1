import { getSession, setSession } from './storage.js'
import type { BootstrapPayload, StoredSession } from './types.js'
import { measure } from './production/runtime-health.js'
import { withRetry } from './production/reliability.js'
async function request<T>(path: string, init: RequestInit = {}, retryAuth = true): Promise<T> {
  const metricKey = path.includes('/workspace/hydrate') ? (path.includes('/partner/') ? 'partner_hydration' : path.includes('/management/') ? 'management_hydration' : 'account_hydration') : path.includes('/commands/') ? 'command_acknowledgement' : 'gateway_request'
  return measure(metricKey, async () => {
    const session = await getSession()
    if (!session) throw new Error('EXTENSION_NOT_PAIRED')
    return withRetry(async () => {
      const response = await fetch(`${session.apiBase}${path}`, { ...init, headers: { 'Content-Type':'application/json', Authorization:`Bearer ${session.accessToken}`, 'X-AngelCare-Device-ID':session.deviceId, 'X-AngelCare-Extension-Version':chrome.runtime.getManifest().version, ...(init.headers || {}) } })
      if (response.status === 401 && retryAuth) { const refreshed = await refreshSession(session); if (refreshed) return request<T>(path, init, false) }
      const payload = await response.json().catch(() => ({}))
      if (!response.ok || (payload as any)?.ok === false) { const error=new Error(String((payload as any)?.error || `HTTP_${response.status}`)); (error as any).details=(payload as any)?.details; throw error }
      return payload as T
    }, { attempts: path.includes('/scanner/') && init.method && init.method !== 'GET' ? 1 : init.method && init.method !== 'GET' ? 2 : 3, baseDelayMs: 250 })
  }, { component: 'gateway', sampleContext: path })
}
export async function refreshSession(session: StoredSession) { const response = await fetch(`${session.apiBase}/api/browser-extension/v1/auth/refresh`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ refreshToken:session.refreshToken, deviceId:session.deviceId }) }); const payload = await response.json().catch(() => ({})); if (!response.ok || !payload?.ok) { await setSession(null); return false }; await setSession({ ...session, accessToken:payload.accessToken, refreshToken:payload.refreshToken, expiresAt:payload.expiresAt }); return true }
export function getBootstrap() { return request<BootstrapPayload>('/api/browser-extension/v1/bootstrap') }
export async function exchangePairing(apiBase: string, pairingCode: string, metadata: Record<string, unknown>) { const response = await fetch(`${apiBase}/api/browser-extension/v1/auth/pairing/exchange`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ pairingCode, ...metadata }) }); const payload = await response.json().catch(() => ({})); if (!response.ok || !payload?.ok) throw new Error(String(payload?.error || 'PAIRING_FAILED')); await setSession({ accessToken:payload.accessToken, refreshToken:payload.refreshToken, apiBase, deviceId:payload.deviceId, expiresAt:payload.expiresAt }); return payload }
export function executeB2BCommand<T=any>(input:{commandKey:string;idempotencyKey?:string;sourceAdapter?:string|null;sourceOrigin?:string|null;targetType?:string|null;targetId?:string|null;payload?:Record<string,unknown>}){return request<{ok:true;approvalRequired?:boolean;result:T;command:any}>('/api/browser-extension/v1/commands/execute',{method:'POST',body:JSON.stringify({...input,idempotencyKey:input.idempotencyKey||crypto.randomUUID()})})}

export function hydrateB2BWorkspace<T = any>(prospectId: string, opportunityId?: string | null) {
  return request<{ ok: true; workspace: T }>('/api/browser-extension/v1/b2b/workspace/hydrate', {
    method: 'POST',
    body: JSON.stringify({ prospectId, opportunityId: opportunityId || null }),
  })
}

export function hydrateB2BPartnerWorkspace<T = any>(input: { partnerId?: string | null; prospectId?: string | null; activeIds?: Record<string, string | null | undefined> }) {
  return request<{ ok: true; workspace: T }>('/api/browser-extension/v1/b2b/partner/workspace/hydrate', {
    method: 'POST',
    body: JSON.stringify({ partnerId: input.partnerId || null, prospectId: input.prospectId || null, activeIds: input.activeIds || {} }),
  })
}

export function hydrateB2BManagementWorkspace<T = any>(input: { activeIds?: Record<string, string | null | undefined> } = {}) {
  return request<{ ok: true; data: T }>('/api/browser-extension/v1/b2b/management/workspace/hydrate', {
    method: 'POST',
    body: JSON.stringify({ activeIds: input.activeIds || {} }),
  })
}

export function quickScanActiveContext<T = any>(context: Record<string, unknown>) {
  return request<{ ok: true; scan: T }>('/api/browser-extension/v1/b2b/scanner/quick', {
    method: 'POST',
    body: JSON.stringify({ context }),
  })
}

export function deepScanActiveContext<T = any>(context: Record<string, unknown>, mode: 'deep' | 'strategic' = 'deep') {
  return request<{ ok: true; scan: T }>('/api/browser-extension/v1/b2b/scanner/deep', {
    method: 'POST',
    body: JSON.stringify({ context, mode }),
  })
}

export function searchB2BAccounts<T = any>(input: { query?: string; city?: string; sector?: string; status?: string; limit?: number } = {}) {
  return request<{ ok: true; accounts: T }>('/api/browser-extension/v1/b2b/scanner/accounts/search', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function recordScannerDecision<T = any>(input: { sessionId: string; decisionType: string; targetType?: string | null; targetId?: string | null; payload?: Record<string, unknown> }) {
  return request<{ ok: true; decision: T }>('/api/browser-extension/v1/b2b/scanner/decision', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}
