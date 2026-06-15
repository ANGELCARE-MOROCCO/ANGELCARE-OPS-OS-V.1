export const ANGELCARE_IS_PRODUCTION =
  process.env.NODE_ENV === 'production'

/**
 * Production default:
 * - auto refresh OFF unless explicitly allowed
 * - local dev still allowed unless disabled
 */
export const ANGELCARE_LIVE_POLLING_DISABLED =
  process.env.NEXT_PUBLIC_DISABLE_LIVE_POLLING === '1' ||
  process.env.NEXT_PUBLIC_PRODUCTION_POLLING_BRAKE === '1' ||
  (ANGELCARE_IS_PRODUCTION && process.env.NEXT_PUBLIC_ALLOW_AUTO_REFRESH !== '1')

export const ANGELCARE_AUTO_REFRESH_ALLOWED =
  !ANGELCARE_LIVE_POLLING_DISABLED &&
  process.env.NEXT_PUBLIC_ALLOW_AUTO_REFRESH === '1'

export const ANGELCARE_MINIMUM_AUTO_REFRESH_MS =
  ANGELCARE_IS_PRODUCTION ? 300_000 : 60_000

export function shouldStartAutoRefresh() {
  return ANGELCARE_AUTO_REFRESH_ALLOWED
}

export function safeRefreshInterval(ms?: number) {
  const requested = typeof ms === 'number' && Number.isFinite(ms) ? ms : ANGELCARE_MINIMUM_AUTO_REFRESH_MS
  return Math.max(requested, ANGELCARE_MINIMUM_AUTO_REFRESH_MS)
}
