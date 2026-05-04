// lib/market-os/client-actions.ts
import type { MarketActionInput } from './core'

export async function executeMarketAction(input: MarketActionInput) {
  const res = await fetch('/api/market-os/core', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })

  const json = await res.json().catch(() => null)
  if (!res.ok) {
    throw new Error(json?.error || 'Market-OS action failed')
  }
  return json
}

export async function fetchMarketOSCore() {
  const res = await fetch('/api/market-os/core', { cache: 'no-store' })
  const json = await res.json().catch(() => null)
  if (!res.ok) {
    throw new Error(json?.error || 'Market-OS data load failed')
  }
  return json
}
