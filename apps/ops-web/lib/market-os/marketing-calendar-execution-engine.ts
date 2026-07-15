export type MarketOSEngineRecord = Record<string, any>
export type CalendarItemType = string
export type CalendarRisk = "low" | "medium" | "high" | "critical" | string
export type CalendarStatus = "draft" | "scheduled" | "published" | "blocked" | string

export const marketingCalendarExecutionEngineData: MarketOSEngineRecord[] = []

export function formatMad(value: number | string = 0) {
  const amount = Number(value || 0)
  return `${amount.toLocaleString("fr-MA")} MAD`
}

export function getEngineSnapshot(records: MarketOSEngineRecord[] = marketingCalendarExecutionEngineData) {
  return {
    ok: true,
    source: "marketing-calendar-execution-engine-compat",
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

export default marketingCalendarExecutionEngineData

export const calendarItems: any[] = []

export function statusLabel(value: any = "") {
  return String(value || "Not configured")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

export function typeLabel(value: any = "") {
  return String(value || "Not configured")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
}
