import type {
  AmbassadorSettingsConfiguration,
  AmbassadorSettingsControlCenterSnapshot,
  AmbassadorSettingsImpactSnapshot,
  AmbassadorSettingsValidationResult,
  AmbassadorSettingsVersion,
  SettingsApprovalDomain,
  SettingsApprovalStatus,
} from "./contracts"

type ApiResult<T> = { ok: boolean; data?: T; error?: string; code?: string; [key: string]: unknown }

async function request<T>(path: string, init: RequestInit = {}): Promise<ApiResult<T>> {
  try {
    const response = await fetch(`/api/market-os/ambassadors/settings${path}`, {
      credentials: "include",
      cache: "no-store",
      ...init,
      headers: {
        Accept: "application/json",
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        ...(init.headers || {}),
      },
    })
    const payload = await response.json().catch(() => ({})) as ApiResult<T>
    if (!response.ok || payload.ok === false) return { ...payload, ok: false, error: payload.error || response.statusText }
    return payload
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Request failed" }
  }
}

export const ambassadorSettingsApi = {
  load: () => request<AmbassadorSettingsControlCenterSnapshot>("/control-center"),
  createDraft: (payload: { title: string; scopeType: string; scopeKey: string; changeSummary: string }) =>
    request<AmbassadorSettingsVersion>("/drafts", { method: "POST", body: JSON.stringify(payload) }),
  updateDraft: (id: string, payload: { title?: string; changeSummary?: string; configuration?: AmbassadorSettingsConfiguration }) =>
    request<AmbassadorSettingsVersion>(`/drafts/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  validateDraft: (id: string) => request<{ version: AmbassadorSettingsVersion; validation: AmbassadorSettingsValidationResult }>(`/drafts/${id}/validate`, { method: "POST" }),
  simulateDraft: (id: string) => request<{ version: AmbassadorSettingsVersion; impact: AmbassadorSettingsImpactSnapshot }>(`/drafts/${id}/simulate`, { method: "POST" }),
  submitDraft: (id: string) => request<AmbassadorSettingsVersion>(`/drafts/${id}/submit`, { method: "POST" }),
  decideDraft: (id: string, payload: { domain: SettingsApprovalDomain; decision: SettingsApprovalStatus; note: string }) =>
    request<AmbassadorSettingsVersion>(`/drafts/${id}/decision`, { method: "POST", body: JSON.stringify(payload) }),
  publishDraft: (id: string, scheduledFor?: string | null) =>
    request<AmbassadorSettingsVersion>(`/drafts/${id}/publish`, { method: "POST", body: JSON.stringify({ scheduledFor: scheduledFor || null }) }),
  rollbackVersion: (id: string, reason: string) =>
    request<AmbassadorSettingsVersion>(`/versions/${id}/rollback`, { method: "POST", body: JSON.stringify({ reason }) }),
  processRuntime: () => request<{ processed: number; failed: number }>("/runtime/process", { method: "POST" }),
}
