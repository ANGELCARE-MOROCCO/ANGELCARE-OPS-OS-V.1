import crypto from "node:crypto"

type KeyCandidate = { id: string; key: Buffer; source: string }

function decodeKey(rawValue: string) {
  const raw = String(rawValue || "").trim()
  if (!raw) return null
  if (/^[a-f0-9]{64}$/i.test(raw)) return Buffer.from(raw, "hex")
  try {
    const decoded = Buffer.from(raw, "base64")
    if (decoded.length === 32) return decoded
  } catch {}
  return crypto.createHash("sha256").update(raw).digest()
}

function keyId(key: Buffer) {
  return crypto.createHash("sha256").update(key).digest("hex").slice(0, 16)
}

function parsePreviousKeys() {
  const raw = String(
    process.env.SOCIAL_COMMAND_TOKEN_ENCRYPTION_KEYS_PREVIOUS ||
    process.env.SOCIAL_COMMAND_TOKEN_ENCRYPTION_KEY_PREVIOUS ||
    "",
  ).trim()
  if (!raw) return [] as string[]
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed.map(String).map((value) => value.trim()).filter(Boolean)
  } catch {}
  return raw.split(/[\n;,]+/).map((value) => value.trim()).filter(Boolean)
}

function keyring(): KeyCandidate[] {
  const currentRaw = String(process.env.SOCIAL_COMMAND_TOKEN_ENCRYPTION_KEY || "").trim()
  if (!currentRaw) throw new Error("SOCIAL_COMMAND_TOKEN_ENCRYPTION_KEY is not configured")
  const values = [
    { source: "SOCIAL_COMMAND_TOKEN_ENCRYPTION_KEY", raw: currentRaw },
    ...parsePreviousKeys().map((raw, index) => ({ source: `SOCIAL_COMMAND_TOKEN_ENCRYPTION_KEY_PREVIOUS[${index}]`, raw })),
  ]
  const seen = new Set<string>()
  const out: KeyCandidate[] = []
  for (const item of values) {
    const key = decodeKey(item.raw)
    if (!key) continue
    const id = keyId(key)
    if (seen.has(id)) continue
    seen.add(id)
    out.push({ id, key, source: item.source })
  }
  return out
}

function currentKey() {
  const keys = keyring()
  if (!keys.length) throw new Error("No Social Command token encryption key is available")
  return keys[0]
}

function decryptWithKey(value: string, key: Buffer, offset: number) {
  const parts = value.split(".")
  const iv = Buffer.from(parts[offset], "base64url")
  const tag = Buffer.from(parts[offset + 1], "base64url")
  const ciphertext = Buffer.from(parts[offset + 2], "base64url")
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8")
}

export function encryptSecret(value: string) {
  if (!value) return ""
  const active = currentKey()
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv("aes-256-gcm", active.key, iv)
  const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()])
  const tag = cipher.getAuthTag()
  return `v2.${active.id}.${iv.toString("base64url")}.${tag.toString("base64url")}.${ciphertext.toString("base64url")}`
}

export function decryptSecret(value: string | null | undefined) {
  if (!value) return ""
  const keys = keyring()
  const parts = value.split(".")
  if (parts[0] === "v2" && parts.length === 5) {
    const candidate = keys.find((item) => item.id === parts[1])
    if (!candidate) throw new Error(`Social Command token encryption key ${parts[1]} is unavailable`)
    return decryptWithKey(value, candidate.key, 2)
  }
  if (parts[0] === "v1" && parts.length === 4) {
    let lastError: unknown = null
    for (const candidate of keys) {
      try { return decryptWithKey(value, candidate.key, 1) }
      catch (error) { lastError = error }
    }
    throw lastError instanceof Error ? lastError : new Error("Unable to decrypt legacy Social Command secret")
  }
  throw new Error("Unsupported encrypted secret format")
}

export function socialCommandEncryptionHealth() {
  const keys = keyring()
  return {
    configured: keys.length > 0,
    currentKeyId: keys[0]?.id || null,
    previousKeyCount: Math.max(0, keys.length - 1),
    writeFormat: "v2",
    legacyReadSupported: true,
  }
}

export function signCompact(payload: Record<string, unknown>, secretEnv = "SOCIAL_COMMAND_MEDIA_SIGNING_SECRET") {
  const secret = String(process.env[secretEnv] || "").trim()
  if (!secret) throw new Error(`${secretEnv} is not configured`)
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url")
  const sig = crypto.createHmac("sha256", secret).update(body).digest("base64url")
  return `${body}.${sig}`
}

export function randomState(bytes = 32) {
  return crypto.randomBytes(bytes).toString("base64url")
}
