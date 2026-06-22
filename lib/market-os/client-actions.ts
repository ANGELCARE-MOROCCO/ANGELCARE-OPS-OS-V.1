export type MarketActionPayload = Record<string, any>

export type MarketActionResult = {
  ok: boolean
  action: string
  data: any
  payload: any
  recordId: string
  source: string
  message: string
  error?: string
  [key: string]: any
}

function normalizeAction(input: string | MarketActionPayload, payload: MarketActionPayload = {}) {
  if (typeof input === "string") {
    return {
      action: input,
      payload,
      recordId: String(payload.id || payload.recordId || ""),
    }
  }

  return {
    action: String(input.action || input.type || "market.action"),
    payload: input,
    recordId: String(input.recordId || input.id || input.payload?.recordId || input.payload?.id || ""),
  }
}

export async function executeMarketAction(
  input: string | MarketActionPayload,
  payload: MarketActionPayload = {},
): Promise<MarketActionResult> {
  const normalized = normalizeAction(input, payload)

  return {
    ok: true,
    action: normalized.action,
    payload: normalized.payload,
    data: normalized.payload,
    recordId: normalized.recordId,
    source: "market-os-client-actions-compat",
    message: `Market action accepted: ${normalized.action}`,
  }
}

export async function fetchMarketOSCore(): Promise<MarketActionResult> {
  return {
    ok: true,
    action: "fetch.core",
    payload: {},
    data: {
      modules: [],
      workspaces: [],
      kpis: {},
      activity: [],
      updatedAt: new Date().toISOString(),
    },
    recordId: "",
    source: "market-os-core-compat",
    message: "Market OS core compatibility snapshot loaded.",
  }
}

export const executeMarketOSClientAction = executeMarketAction
export const refreshMarketOSClientAction = fetchMarketOSCore
export const updateMarketOSModuleStatus = executeMarketAction
export const createMarketOSAuditEvent = executeMarketAction
export const registerMarketOSSession = executeMarketAction
export const completeMarketOSAction = executeMarketAction
