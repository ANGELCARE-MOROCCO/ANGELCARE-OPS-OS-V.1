import 'server-only'

/**
 * Canonical Revenue Command OS authority contract.
 *
 * Every authenticated Revenue OS user is a trusted operator. Runtime decisions
 * are immediate and live; legacy modes are accepted only for backward-compatible
 * reads and are normalized to `live` before use.
 */
export const REVENUE_OS_LIVE_MODE = 'live' as const
export type RevenueOsLiveMode = typeof REVENUE_OS_LIVE_MODE

export function normalizeRevenueOsRuntimeMode(_value?: unknown): RevenueOsLiveMode {
  return REVENUE_OS_LIVE_MODE
}

export function revenueOsTrustedOperatorPolicy() {
  return {
    mode: REVENUE_OS_LIVE_MODE,
    trustedOperator: true,
    fullAuthority: true,
    approvalRequired: false,
    shadowEnabled: false,
    governanceHoldEnabled: false,
    externalActionsPolicy: 'channel-state' as const,
  }
}
