import {
  getAngelCareGovernorConfig,
} from '@/lib/runtime/governor/config'

type BurstState = {
  tokens: number
  updatedAt: number
}

type BurstGlobal = typeof globalThis & {
  __angelcareGlobalBurstState?: BurstState
}

function shouldProtect(
  pathname: string,
  method: string,
) {
  const upperMethod = method.toUpperCase()

  if (
    !pathname.startsWith('/api/') ||
    ['GET', 'HEAD', 'OPTIONS'].includes(upperMethod)
  ) {
    return false
  }

  if (
    pathname.includes('/health/') ||
    pathname.includes('/tracking/') ||
    pathname.includes('/webhooks/') ||
    pathname.includes('/realtime/')
  ) {
    return false
  }

  return true
}

export function consumeAngelCareGlobalBurstToken(
  pathname: string,
  method: string,
) {
  const config = getAngelCareGovernorConfig()

  if (
    !config.enabled ||
    !shouldProtect(pathname, method)
  ) {
    return {
      allowed: true,
      retryAfterMs: 0,
      remaining: config.burstCapacity,
    }
  }

  const now = Date.now()
  const globalState = globalThis as BurstGlobal

  if (!globalState.__angelcareGlobalBurstState) {
    globalState.__angelcareGlobalBurstState = {
      tokens: config.burstCapacity,
      updatedAt: now,
    }
  }

  const state = globalState.__angelcareGlobalBurstState
  const elapsedMs = Math.max(
    0,
    now - state.updatedAt,
  )

  state.tokens = Math.min(
    config.burstCapacity,
    state.tokens +
      elapsedMs *
        (
          config.burstRefillPerSecond /
          1_000
        ),
  )

  state.updatedAt = now

  if (state.tokens >= 1) {
    state.tokens -= 1

    return {
      allowed: true,
      retryAfterMs: 0,
      remaining: Math.floor(state.tokens),
    }
  }

  const deficit = 1 - state.tokens
  const retryAfterMs = Math.max(
    50,
    Math.ceil(
      deficit /
        (
          config.burstRefillPerSecond /
          1_000
        ),
    ),
  )

  return {
    allowed: false,
    retryAfterMs,
    remaining: 0,
  }
}
