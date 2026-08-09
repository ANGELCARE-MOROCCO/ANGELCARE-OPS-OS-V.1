export type MarketOSEngineRecord = Record<string, any>
export type MarketOsRuntimeAudit = {
  ok: boolean
  source: string
  score: number
  label: string
  tone: string
  progress: number
  data: any
  args: any[]
  totalButtons?: number
  suspectButtons?: Array<{ selector: string; text: string }>
}

export const executionGuardData: MarketOSEngineRecord[] = []

export function formatMad(value: number | string = 0) {
  const amount = Number(value || 0)
  return `${amount.toLocaleString("fr-MA")} MAD`
}

export function getEngineSnapshot(records: MarketOSEngineRecord[] = executionGuardData) {
  return {
    ok: true,
    source: "execution-guard-compat",
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

export default executionGuardData

export async function reportMarketOsRuntimeAudit(input: any = {}, ...args: any[]) {
  return {
    ok: true,
    source: "reportMarketOsRuntimeAudit-compat",
    score: Number(input?.score || input?.progress || 0),
    label: input?.label || input?.status || "Not configured",
    tone: input?.tone || "slate",
    progress: Number(input?.progress || 0),
    data: input,
    args,
  }
}

export function runMarketOsRuntimeAudit(input: any = {}, ...args: any[]) {
  return {
    ok: true,
    source: "runMarketOsRuntimeAudit-compat",
    score: Number(input?.score || input?.progress || 0),
    label: input?.label || input?.status || "Not configured",
    tone: input?.tone || "slate",
    progress: Number(input?.progress || 0),
    data: input,
    args,
    totalButtons: Number(input?.querySelectorAll?.("[data-market-action]")?.length || 0),
    suspectButtons: [],
  }
}
