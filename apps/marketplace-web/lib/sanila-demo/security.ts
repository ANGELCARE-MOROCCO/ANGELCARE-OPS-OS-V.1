import crypto from 'crypto'

function requirePepper(explicit?: string) {
  const pepper = explicit || process.env.SANILA_DEMO_PIN_PEPPER || ''
  if (pepper.length < 32) throw new Error('SANILA_DEMO_PIN_PEPPER must contain at least 32 characters.')
  return pepper
}

export function pinLookupDigest(pin: string, explicitPepper?: string) {
  return crypto.createHmac('sha256', requirePepper(explicitPepper)).update(`pin:${pin}`).digest('hex')
}

export function demoAttemptFingerprint(input: { ip?: string | null; userAgent?: string | null }, explicitPepper?: string) {
  const normalizedIp = String(input.ip || 'unknown').split(',')[0].trim().toLowerCase()
  const normalizedAgent = String(input.userAgent || 'unknown').trim().toLowerCase().slice(0, 512)
  return crypto.createHmac('sha256', requirePepper(explicitPepper)).update(`attempt:${normalizedIp}:${normalizedAgent}`).digest('hex')
}

export function isValidDemoPinFormat(pin: string) {
  return /^\d{8}$/.test(pin)
}
