const EVENT_PREFIX = 'ACREV'

function randomChunk(length = 8) {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID().replace(/-/g, '').slice(0, length).toUpperCase()
  }
  return Math.random().toString(36).slice(2, 2 + length).toUpperCase().padEnd(length, '0')
}

export function createRevenueOsEventId(kind = 'EVT', at = new Date()) {
  const date = at.toISOString().replace(/[-:.TZ]/g, '').slice(0, 14)
  return `${EVENT_PREFIX}-${kind.toUpperCase()}-${date}-${randomChunk(8)}`
}

export function createRevenueOsCode(prefix: string, at = new Date()) {
  const date = at.toISOString().slice(0, 10).replace(/-/g, '')
  return `${prefix.toUpperCase()}-${date}-${randomChunk(6)}`
}

export function isRevenueOsEventId(value: string) {
  return /^ACREV-[A-Z0-9_]+-\d{14}-[A-Z0-9]{8}$/.test(value)
}
