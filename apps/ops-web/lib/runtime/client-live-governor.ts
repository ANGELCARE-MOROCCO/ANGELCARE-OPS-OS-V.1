export const ANGELCARE_IS_PRODUCTION =
  process.env.NODE_ENV === 'production'

export const ANGELCARE_LIVE_POLLING_DISABLED =
  process.env.NEXT_PUBLIC_DISABLE_LIVE_POLLING === '1' ||
  process.env.NEXT_PUBLIC_PRODUCTION_POLLING_BRAKE === '1'

/**
 * API/data refresh policy:
 * - keep automation alive
 * - forbid aggressive server/API polling
 * - production data refresh is minimum 5 minutes + jitter up to 5 minutes
 */
export const ANGELCARE_AUTO_REFRESH_ALLOWED =
  !ANGELCARE_LIVE_POLLING_DISABLED

export const ANGELCARE_MINIMUM_AUTO_REFRESH_MS =
  ANGELCARE_IS_PRODUCTION ? 300_000 : 60_000

export const ANGELCARE_MAXIMUM_REFRESH_JITTER_MS =
  ANGELCARE_IS_PRODUCTION ? 300_000 : 30_000

export function shouldStartAutoRefresh() {
  return ANGELCARE_AUTO_REFRESH_ALLOWED
}

/**
 * Use this ONLY for API/server/data polling.
 * Production result: 5–10 minutes.
 */
export function safeRefreshInterval(ms?: number) {
  const requested = typeof ms === 'number' && Number.isFinite(ms) ? ms : ANGELCARE_MINIMUM_AUTO_REFRESH_MS
  const base = Math.max(requested, ANGELCARE_MINIMUM_AUTO_REFRESH_MS)

  if (!ANGELCARE_IS_PRODUCTION) return base

  const jitter = Math.floor(Math.random() * ANGELCARE_MAXIMUM_REFRESH_JITTER_MS)
  return base + jitter
}

/**
 * Use this ONLY for browser-local UI timers:
 * clocks, elapsed time labels, progress animations, beep intervals,
 * typing indicators, local-only freshness labels.
 *
 * This does NOT protect API usage because it should never wrap API polling.
 */
export function safeUiInterval(ms?: number) {
  const requested = typeof ms === 'number' && Number.isFinite(ms) ? ms : 1000
  return Math.max(requested, 250)
}
