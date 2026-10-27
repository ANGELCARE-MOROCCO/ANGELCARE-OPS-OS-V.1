/**
 * Existing Marketplace runtime only: consume the existing Supabase Auth email ledger
 * without a separate service/container/worker deployment.
 *
 * Explicit opt-in. Enabling the runner affects the shared Auth email queue (not only
 * JOBKIX); the shared hook must be confirmed operational before setting the flag.
 */
import 'server-only'
import { processOneAuthEmail } from './worker'

const POLL_MS = 5_000
const state = globalThis as typeof globalThis & {
  __angelcareAuthEmailInlineStarted?: boolean
}
let busy = false
let previousError = ''

async function tick(): Promise<void> {
  if (busy) return
  busy = true
  try {
    const response = await processOneAuthEmail()
    const status = String(response.state || 'unknown')
    if (status === 'failed' || status === 'retry_wait' || status === 'delivery_unknown') {
      // Do not log recipients, mail content, OAuth codes or confirmation tokens.
      console.warn('[AUTH MAIL] Queue delivery result', { state: status, code: String(response.errorCode || 'unknown') })
    }
    previousError = ''
  } catch (error) {
    const code = error instanceof Error ? error.message : 'UNKNOWN'
    const safeCode = /^(?:AUTH_EMAIL_[A-Z_]+|SUPPORTS_[A-Z_]+|BRIDGE_REQUIRED)$/.test(code)
      ? code : 'DELIVERY_COORDINATOR_UNAVAILABLE'
    if (safeCode !== previousError) {
      console.warn('[AUTH MAIL] Inline coordinator', safeCode)
      previousError = safeCode
    }
  } finally {
    busy = false
  }
}

export function startAngelcareAuthEmailInline(): void {
  if (state.__angelcareAuthEmailInlineStarted) return
  if (process.env.NODE_ENV !== 'production' || process.env.NEXT_RUNTIME !== 'nodejs') return
  if (process.env.npm_lifecycle_event === 'build' || process.env.NEXT_PHASE === 'phase-production-build') return
  if (process.env.ANGELCARE_AUTH_EMAIL_INLINE_ENABLED !== 'true') return
  // Fail closed instead of claiming work that cannot be sent.
  if (!process.env.EMAIL_OS_BRIDGE_URL?.trim() || !process.env.EMAIL_OS_BRIDGE_TOKEN?.trim()) {
    console.warn('[AUTH MAIL] Inline coordinator NOT started: existing Email OS bridge not configured')
    return
  }
  const origin = process.env.ANGELCARE_AUTH_EMAIL_MARKETPLACE_ORIGIN || ''
  if (origin !== 'https://my.angelcarehub.com') {
    console.warn('[AUTH MAIL] Inline coordinator NOT started: Marketplace auth origin not certified')
    return
  }
  state.__angelcareAuthEmailInlineStarted = true
  const timer = setInterval(() => { void tick() }, POLL_MS)
  timer.unref()
  void tick()
  console.info('[AUTH MAIL] Existing Marketplace inline coordinator started; shared Supabase Auth email queue')
}
