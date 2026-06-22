import type {
  AmbassadorRecord,
  AmbassadorWorkspaceSnapshot,
} from "./types"

type AnyRecord = Record<string, any>

const EMPTY_SNAPSHOT = {
  records: [],
  ambassadors: [],
  archivedRecords: [],
  stats: {},
  kpis: {},
  activity: [],
  updatedAt: new Date(0).toISOString(),
} as unknown as AmbassadorWorkspaceSnapshot

async function readJson(response: Response) {
  return response.json().catch(() => null)
}

function normalizeSnapshot(payload: any): AmbassadorWorkspaceSnapshot {
  return (
    payload?.snapshot ||
    payload?.data?.snapshot ||
    payload?.data ||
    payload ||
    EMPTY_SNAPSHOT
  ) as AmbassadorWorkspaceSnapshot
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

    if (!response.ok) return EMPTY_SNAPSHOT

    return normalizeSnapshot(await readJson(response))
  } catch {
    return EMPTY_SNAPSHOT
  }
}

export async function createAmbassadorRecord(
  payload: AnyRecord,
): Promise<AmbassadorRecord> {
  try {
    const response = await fetch("/api/market-os/ambassadors", {
      method: "POST",
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload || {}),
    })

    if (!response.ok) return normalizeRecord(null, payload)

    return normalizeRecord(await readJson(response), payload)
  } catch {
    return normalizeRecord(null, payload)
  }
}

export async function updateAmbassadorRecord(
  id: string,
  patch: AnyRecord,
): Promise<AmbassadorRecord> {
  const payload = { id, ...(patch || {}) }

  try {
    const response = await fetch(`/api/market-os/ambassadors/${encodeURIComponent(id)}`, {
      method: "PATCH",
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(patch || {}),
    })

    if (!response.ok) return normalizeRecord(null, payload)

    return normalizeRecord(await readJson(response), payload)
  } catch {
    return normalizeRecord(null, payload)
  }
}

export async function archiveAmbassadorRecord(id: string): Promise<{ ok: boolean; id: string }> {
  try {
    const response = await fetch(`/api/market-os/ambassadors/${encodeURIComponent(id)}/archive`, {
      method: "POST",
      credentials: "include",
      headers: { Accept: "application/json" },
    })

    if (!response.ok) return { ok: false, id }

    const payload = await readJson(response)
    return { ok: Boolean(payload?.ok ?? true), id }
  } catch {
    return { ok: false, id }
  }
}

export async function downloadAmbassadorCsv(): Promise<string> {
  try {
    const response = await fetch("/api/market-os/ambassadors/export", {
      method: "GET",
      credentials: "include",
      headers: { Accept: "text/csv,application/json" },
      cache: "no-store",
    })

    if (!response.ok) return ""

    return await response.text()
  } catch {
    return ""
  }
}

export const ambassadorApi = {
  loadSnapshot: loadAmbassadorSnapshot,
  createRecord: createAmbassadorRecord,
  updateRecord: updateAmbassadorRecord,
  archiveRecord: archiveAmbassadorRecord,
  downloadCsv: downloadAmbassadorCsv,
}

export default ambassadorApi
