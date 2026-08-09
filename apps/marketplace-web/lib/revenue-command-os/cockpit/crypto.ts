import crypto from 'node:crypto'

export const cockpitHash = (value: unknown): string => crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex')

export function cockpitStableId(namespace: string, ...parts: Array<string | number | undefined>): string {
  const hex = crypto.createHash('sha256').update([namespace, ...parts.map((part) => String(part ?? ''))].join('|')).digest('hex')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`
}

export function redactCockpitPayload(input: Record<string, unknown>): Record<string, unknown> {
  const secret = /token|secret|password|authorization|api[_-]?key|credential|cookie|session/i
  const entries: Array<[string, unknown]> = Object.entries(input).map(([key, value]): [string, unknown] => {
    if (secret.test(key)) return [key, '[REDACTED]']
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) return [key, redactCockpitPayload(value as Record<string, unknown>)]
    return [key, value]
  })
  return Object.fromEntries(entries) as Record<string, unknown>
}
