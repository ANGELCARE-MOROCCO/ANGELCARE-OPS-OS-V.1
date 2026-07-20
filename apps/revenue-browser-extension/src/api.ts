import { getSession, setSession } from './storage.js'
import type { BootstrapPayload, StoredSession } from './types.js'
async function request<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  const session = await getSession()
  if (!session) throw new Error('EXTENSION_NOT_PAIRED')
  const response = await fetch(`${session.apiBase}${path}`, { ...init, headers: { 'Content-Type':'application/json', Authorization:`Bearer ${session.accessToken}`, 'X-AngelCare-Device-ID':session.deviceId, ...(init.headers || {}) } })
  if (response.status === 401 && retry) { const refreshed = await refreshSession(session); if (refreshed) return request<T>(path, init, false) }
  const payload = await response.json().catch(() => ({}))
  if (!response.ok || (payload as any)?.ok === false) { const error=new Error(String((payload as any)?.error || `HTTP_${response.status}`)); (error as any).details=(payload as any)?.details; throw error }
  return payload as T
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
