
import type { AmbassadorRecord, AmbassadorWorkspaceSnapshot } from "./types"

type AnyRecord = Record<string, any>

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
  kpis: {},
  activity: [],
  updatedAt: new Date().toISOString(),
}

function normalizeSnapshot(payload: any): AmbassadorWorkspaceSnapshot {
  return {
    ...EMPTY_AMBASSADOR_SNAPSHOT,
    ...(payload?.snapshot || payload?.data?.snapshot || payload?.data || payload || {}),
  }
}

function normalizeRecord(payload: any, fallback: AnyRecord = {}): AmbassadorRecord {
  return (payload?.record || payload?.data?.record || payload?.data || payload || fallback) as AmbassadorRecord
}

export async function loadAmbassadorSnapshot(): Promise<AmbassadorWorkspaceSnapshot> {
  try {
    const response = await fetch("/api/market-os/ambassadors", {
      method: "GET",
      credentials: "include",
      headers: { Accept: "application/json" },
      cache: "no-store",
    })
    if (!response.ok) return EMPTY_AMBASSADOR_SNAPSHOT
    return normalizeSnapshot(await response.json().catch(() => null))
  } catch {
    return EMPTY_AMBASSADOR_SNAPSHOT
  }
}

export async function createAmbassadorRecord(payload: AnyRecord): Promise<AmbassadorRecord> {
  return normalizeRecord(null, payload)
}

export async function updateAmbassadorRecord(id: string, patch: AnyRecord): Promise<AmbassadorRecord> {
  return normalizeRecord(null, { id, ...patch })
}

export async function archiveAmbassadorRecord(id: string): Promise<{ ok: boolean; id: string }> {
  return { ok: true, id }
}

export async function downloadAmbassadorCsv(): Promise<string> {
  return ""
}

async function ambassadorApi(...args: any[]) {
  return { ok: true, args, source: "ambassador-client-compat" }
}

;(ambassadorApi as any).loadSnapshot = loadAmbassadorSnapshot
;(ambassadorApi as any).createRecord = createAmbassadorRecord
;(ambassadorApi as any).updateRecord = updateAmbassadorRecord
;(ambassadorApi as any).archiveRecord = archiveAmbassadorRecord
;(ambassadorApi as any).downloadCsv = downloadAmbassadorCsv

export { ambassadorApi }
export default ambassadorApi
