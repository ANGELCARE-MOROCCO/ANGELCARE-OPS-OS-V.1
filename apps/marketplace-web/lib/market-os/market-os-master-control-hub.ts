export type MarketOSEngineRecord = Record<string, any>
export type HubRisk = "low" | "medium" | "high" | "critical" | string
export type HubStatus = "open" | "monitoring" | "locked" | string

export const marketOsMasterControlHubData: MarketOSEngineRecord[] = []

export function formatMad(value: number | string = 0) {
  const amount = Number(value || 0)
  return `${amount.toLocaleString("fr-MA")} MAD`
}

export function getEngineSnapshot(records: MarketOSEngineRecord[] = marketOsMasterControlHubData) {
  return {
    ok: true,
    source: "market-os-master-control-hub-compat",
    records,
    items: records,
    data: records,
    totals: {
      count: records.length,
      total: records.length,
      active: records.filter((item: any) => String(item.status || "").toLowerCase() === "active").length,
    },
    updatedAt: new Date().toISOString(),
  }
}

export default marketOsMasterControlHubData

export const marketOsEngines: any[] = []

export function statusLabel(value: any = "") {
  return String(value || "Not configured")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
}
