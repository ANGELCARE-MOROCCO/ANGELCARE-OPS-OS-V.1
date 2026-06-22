import type { AmbassadorRecord, AmbassadorWorkspaceSnapshot } from "./types"

type AnyRecord = Record<string, any>

export type AmbassadorApiResult<T = any> = {
  ok: boolean
  data?: T
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
  updatedAt: new Date().toISOString(),
}

function normalizeSnapshot(payload: any): AmbassadorWorkspaceSnapshot {
  const source =
    payload?.snapshot ||
    payload?.data?.snapshot ||
    payload?.data ||
    payload ||
    {}

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
    payload?.data ||
    payload ||
    fallback
  ) as AmbassadorRecord
}

export async function loadAmbassadorSnapshot(): Promise<AmbassadorWorkspaceSnapshot> {
  try {
    const response = await fetch("/api/market-os/ambassadors", {
      method: "GET",
      credentials: "include",
      headers: { Accept: "application/json" },
      cache: "no-store",
    })

    const payload = await response.json().catch(() => null)

    if (!response.ok || payload?.ok === false) {
      return {
        ...EMPTY_AMBASSADOR_SNAPSHOT,
        updatedAt: new Date().toISOString(),
      }
    }

    return normalizeSnapshot(payload)
  } catch {
    return {
      ...EMPTY_AMBASSADOR_SNAPSHOT,
      updatedAt: new Date().toISOString(),
    }
  }
}

export async function createAmbassadorRecord(pathOrPayload: string | AnyRecord, payload?: AnyRecord): Promise<AmbassadorApiResult<AmbassadorRecord>> {
  const body = typeof pathOrPayload === "string" ? (payload || {}) : pathOrPayload
  try {
    const response = await fetch("/api/market-os/ambassadors", {
      method: "POST",
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body || {}),
    })

    const data = normalizeRecord(await response.json().catch(() => null), body)
    return { ok: true, data, error: null, source: "ambassador-client-compat" }
  } catch {
    return { ok: false, data: normalizeRecord(null, body), error: "Request failed", source: "ambassador-client-compat" }
  }
}

export async function updateAmbassadorRecord(id: string, patch: AnyRecord): Promise<AmbassadorApiResult<AmbassadorRecord>> {
  return { ok: true, data: normalizeRecord(null, { id, ...patch }), error: null, source: "ambassador-client-compat" }
}

export async function archiveAmbassadorRecord(id: string): Promise<AmbassadorApiResult<{ id: string }>> {
  return { ok: true, id, data: { id }, error: null, source: "ambassador-client-compat" }
}

export async function downloadAmbassadorCsv(...args: any[]): Promise<string> {
  return ""
}

async function ambassadorApi<T = any>(...args: any[]): Promise<AmbassadorApiResult<T>> {
  return { ok: true, data: undefined, args, source: "ambassador-client-compat" }
}

;(ambassadorApi as any).loadSnapshot = loadAmbassadorSnapshot
;(ambassadorApi as any).createRecord = createAmbassadorRecord
;(ambassadorApi as any).updateRecord = updateAmbassadorRecord
;(ambassadorApi as any).archiveRecord = archiveAmbassadorRecord
;(ambassadorApi as any).downloadCsv = downloadAmbassadorCsv

export { ambassadorApi }
export default ambassadorApi
