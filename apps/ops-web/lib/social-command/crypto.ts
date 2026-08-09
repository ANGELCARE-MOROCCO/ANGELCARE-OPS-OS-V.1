import crypto from "node:crypto"

function keyMaterial() {
  const raw = String(process.env.SOCIAL_COMMAND_TOKEN_ENCRYPTION_KEY || "").trim()
  if (!raw) throw new Error("SOCIAL_COMMAND_TOKEN_ENCRYPTION_KEY is not configured")
  if (/^[a-f0-9]{64}$/i.test(raw)) return Buffer.from(raw, "hex")
  try {
    const decoded = Buffer.from(raw, "base64")
    if (decoded.length === 32) return decoded
  } catch {}
  return crypto.createHash("sha256").update(raw).digest()
}

export function encryptSecret(value: string) {
  if (!value) return ""
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv("aes-256-gcm", keyMaterial(), iv)
  const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()])
  const tag = cipher.getAuthTag()
  return `v1.${iv.toString("base64url")}.${tag.toString("base64url")}.${ciphertext.toString("base64url")}`
}

export function decryptSecret(value: string | null | undefined) {
  if (!value) return ""
  const parts = value.split(".")
  if (parts.length !== 4 || parts[0] !== "v1") throw new Error("Unsupported encrypted secret format")
  const iv = Buffer.from(parts[1], "base64url")
  const tag = Buffer.from(parts[2], "base64url")
  const ciphertext = Buffer.from(parts[3], "base64url")
  const decipher = crypto.createDecipheriv("aes-256-gcm", keyMaterial(), iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8")
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
