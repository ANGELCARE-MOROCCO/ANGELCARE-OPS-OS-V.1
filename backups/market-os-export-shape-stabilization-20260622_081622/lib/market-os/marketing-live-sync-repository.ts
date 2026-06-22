export type SyncItem = {
  id?: string
  label?: string
  title?: string
  status?: string
  value?: number
  [key: string]: any
}

export async function getMarketingLiveSnapshot() {
  return {
    ok: true,
    source: "marketing-live-sync-compat",
    snapshot: {},
    items: [] as SyncItem[],
    records: [] as SyncItem[],
    updatedAt: new Date().toISOString(),
  }
}

export const loadMarketingLiveSnapshot = getMarketingLiveSnapshot
export default getMarketingLiveSnapshot
