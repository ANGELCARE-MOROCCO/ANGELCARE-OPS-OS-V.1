import type { AmbassadorRecord, AmbassadorWorkspaceSnapshot } from "./types"

type AnyRecord = Record<string, any>

export type AmbassadorApiResult<T = any> = {
  ok: boolean
  data?: T
  record?: AnyRecord | null
  snapshot?: AmbassadorWorkspaceSnapshot
  error?: string | null
  source?: string
  args?: any[]
  [key: string]: any
}

export const EMPTY_AMBASSADOR_SNAPSHOT: AmbassadorWorkspaceSnapshot = {
  records: [],
  ambassadors: [],
  archivedRecords: [],
  goals: [],
  missions: [],
  incentives: [],
  onboarding: [],
  recruitment: [],
  territories: [],
  training: [],
  audit: [],
  reports: [],
  settings: {},
  stats: {},
  kpis: {
    totalAmbassadors: 0,
    activeAmbassadors: 0,
    suspendedAmbassadors: 0,
    territoryCoverage: 0,
    assignedTerritories: 0,
    missionsAssigned: 0,
    missionsCompleted: 0,
    onboardingCompletion: 0,
    recruitmentPipeline: 0,
    trainingCompletion: 0,
    certificationValidity: 0,
    kpiCompletion: 0,
    incentivesPaid: 0,
    incentivesPending: 0,
  },
  activity: [],
  diagnostics: [],
  updatedAt: new Date().toISOString(),
}

function normalizeSnapshot(payload: any): AmbassadorWorkspaceSnapshot {
  const source = payload?.snapshot || payload?.data?.snapshot || payload?.data || payload || {}

  return {
    ...EMPTY_AMBASSADOR_SNAPSHOT,
    ...source,
    records: Array.isArray(source.records) ? source.records : [],
    ambassadors: Array.isArray(source.ambassadors) ? source.ambassadors : [],
    archivedRecords: Array.isArray(source.archivedRecords) ? source.archivedRecords : [],
    goals: Array.isArray(source.goals) ? source.goals : [],
    missions: Array.isArray(source.missions) ? source.missions : [],
    incentives: Array.isArray(source.incentives) ? source.incentives : [],
    onboarding: Array.isArray(source.onboarding) ? source.onboarding : [],
    recruitment: Array.isArray(source.recruitment) ? source.recruitment : [],
    territories: Array.isArray(source.territories) ? source.territories : [],
    training: Array.isArray(source.training) ? source.training : [],
    audit: Array.isArray(source.audit) ? source.audit : [],
    reports: Array.isArray(source.reports) ? source.reports : [],
    activity: Array.isArray(source.activity) ? source.activity : [],
    diagnostics: Array.isArray(source.diagnostics) ? source.diagnostics : [],
    settings: source.settings && typeof source.settings === "object" ? source.settings : {},
    stats: source.stats && typeof source.stats === "object" ? source.stats : {},
    kpis: {
      ...EMPTY_AMBASSADOR_SNAPSHOT.kpis,
      ...(source.kpis && typeof source.kpis === "object" ? source.kpis : {}),
    },
    updatedAt: source.updatedAt || new Date().toISOString(),
  }
}

function normalizeRecord(payload: any, fallback: AnyRecord = {}): AmbassadorRecord {
  return (
    payload?.record ||
    payload?.data?.record ||
    (payload?.data && !Array.isArray(payload.data) ? payload.data : null) ||
    payload ||
    fallback
  ) as AmbassadorRecord
}

function apiUrl(path = "") {
  const clean = path.startsWith("/") ? path : `/${path}`
  return `/api/market-os/ambassadors${clean === "/" ? "" : clean}`
}

async function parseJson(response: Response) {
  const text = await response.text().catch(() => "")
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return { raw: text }
  }
}

export async function loadAmbassadorSnapshot(): Promise<AmbassadorWorkspaceSnapshot> {
  try {
    const response = await fetch("/api/market-os/ambassadors", {
      method: "GET",
      credentials: "include",
      headers: { Accept: "application/json" },
      cache: "no-store",
    })

    const payload = await parseJson(response)

    if (!response.ok || payload?.ok === false) {
      return {
        ...EMPTY_AMBASSADOR_SNAPSHOT,
        diagnostics: [{ area: "workspace-load", reason: payload?.error || response.statusText }],
        updatedAt: new Date().toISOString(),
      }
    }

    return normalizeSnapshot(payload)
  } catch (error) {
    return {
      ...EMPTY_AMBASSADOR_SNAPSHOT,
      diagnostics: [{ area: "workspace-load", reason: error instanceof Error ? error.message : "Request failed" }],
      updatedAt: new Date().toISOString(),
    }
  }
}

export async function createAmbassadorRecord(pathOrPayload: string | AnyRecord, payload?: AnyRecord): Promise<AmbassadorApiResult<AmbassadorRecord>> {
  const path = typeof pathOrPayload === "string" ? pathOrPayload : ""
  const body = typeof pathOrPayload === "string" ? (payload || {}) : pathOrPayload
  return ambassadorApi<AmbassadorRecord>(path, { method: "POST", body: JSON.stringify(body || {}) })
}

export async function updateAmbassadorRecord(pathOrId: string, patch: AnyRecord): Promise<AmbassadorApiResult<AmbassadorRecord>> {
  const path = pathOrId.startsWith("/") ? pathOrId : `/ambassadors/${pathOrId}`
  return ambassadorApi<AmbassadorRecord>(path, { method: "PATCH", body: JSON.stringify(patch || {}) })
}

export async function archiveAmbassadorRecord(pathOrId: string): Promise<AmbassadorApiResult<{ id: string }>> {
  const path = pathOrId.startsWith("/") ? pathOrId : `/ambassadors/${pathOrId}`
  return ambassadorApi<{ id: string }>(path, { method: "DELETE" })
}

export async function downloadAmbassadorCsv(reportType = "ambassadors", headers: string[] = [], rows: unknown[][] = []): Promise<string> {
  const esc = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`
  const csv = [headers.map(esc).join(","), ...rows.map((row) => headers.map((_, index) => esc(row[index])).join(","))].filter(Boolean).join("\n")
  if (typeof window !== "undefined") {
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = `angelcare-${reportType}-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(url)
  }
  return csv
}

async function ambassadorApi<T = any>(path = "", init: RequestInit = {}): Promise<AmbassadorApiResult<T>> {
  try {
    const response = await fetch(apiUrl(path), {
      credentials: "include",
      headers: {
        Accept: "application/json",
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        ...(init.headers || {}),
      },
      cache: "no-store",
      ...init,
    })
    const payload = await parseJson(response)
    if (!response.ok || payload?.ok === false) {
      return {
        ok: false,
        data: normalizeRecord(payload) as T,
        record: payload?.record || null,
        snapshot: payload?.snapshot,
        error: payload?.error || response.statusText || "Request failed",
        source: payload?.source || "ambassador-client",
      }
    }
    return {
      ok: true,
      data: (payload?.data ?? payload?.record ?? payload) as T,
      record: payload?.record || payload?.data?.record || null,
      snapshot: payload?.snapshot,
      error: null,
      source: payload?.source || "ambassador-client",
      ...payload,
    }
  } catch (error) {
    return {
      ok: false,
      data: undefined,
      error: error instanceof Error ? error.message : "Request failed",
      source: "ambassador-client",
    }
  }
}

;(ambassadorApi as any).loadSnapshot = loadAmbassadorSnapshot
;(ambassadorApi as any).createRecord = createAmbassadorRecord
;(ambassadorApi as any).updateRecord = updateAmbassadorRecord
;(ambassadorApi as any).archiveRecord = archiveAmbassadorRecord
;(ambassadorApi as any).downloadCsv = downloadAmbassadorCsv

export { ambassadorApi }
export default ambassadorApi
