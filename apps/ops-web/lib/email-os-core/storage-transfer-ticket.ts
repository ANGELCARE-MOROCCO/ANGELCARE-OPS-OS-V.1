import crypto from "node:crypto"

export type StorageTransferPurpose = "storage_upload" | "storage_download" | "storage_upload_receipt"

export type StorageTransferClaims = {
  v: 1
  purpose: StorageTransferPurpose
  iat: number
  exp: number
  nonce: string
  fileId: string
  userId: string
  mailboxId: string
  moduleKey: string
  entityType: string
  entityId: string | null
  direction: "inbound" | "outbound" | "temp" | "archive"
  filename: string
  contentType: string
  sizeBytes: number
  origin: string
  [key: string]: unknown
}

export class StorageTransferTicketError extends Error {
  code: string

  constructor(code: string, message: string) {
    super(message)
    this.name = "StorageTransferTicketError"
    this.code = code
  }
}

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function base64urlEncode(value: Buffer | string) {
  const buffer = Buffer.isBuffer(value) ? value : Buffer.from(value, "utf8")
  return buffer.toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_")
}

function base64urlDecode(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/")
  const pad = normalized.length % 4 ? "=".repeat(4 - (normalized.length % 4)) : ""
  return Buffer.from(`${normalized}${pad}`, "base64")
}

function signingSecret() {
  const secret = clean(process.env.EMAIL_STORAGE_TRANSFER_SIGNING_SECRET)
  if (!secret) {
    throw new StorageTransferTicketError("TRANSFER_SECRET_MISSING", "EMAIL_STORAGE_TRANSFER_SIGNING_SECRET is not configured")
  }
  if (secret.length < 32) {
    throw new StorageTransferTicketError("TRANSFER_SECRET_WEAK", "EMAIL_STORAGE_TRANSFER_SIGNING_SECRET must be at least 32 characters")
  }
  return secret
}

export function getStorageTransferTtlSeconds() {
  const raw = Number(process.env.EMAIL_STORAGE_TRANSFER_TTL_SECONDS || 90)
  if (!Number.isFinite(raw)) return 90
  return Math.max(30, Math.min(300, Math.floor(raw)))
}

function signature(payload: string) {
  return base64urlEncode(crypto.createHmac("sha256", signingSecret()).update(payload).digest())
}

function normalizePurpose(value: unknown): StorageTransferPurpose {
  const purpose = clean(value) as StorageTransferPurpose
  if (purpose !== "storage_upload" && purpose !== "storage_download" && purpose !== "storage_upload_receipt") {
    throw new StorageTransferTicketError("TRANSFER_PURPOSE_INVALID", "Storage transfer purpose is invalid")
  }
  return purpose
}

function normalizeDirection(value: unknown): StorageTransferClaims["direction"] {
  if (value === "inbound" || value === "outbound" || value === "temp" || value === "archive") {
    return value
  }
  throw new StorageTransferTicketError("TRANSFER_DIRECTION_INVALID", "Storage transfer direction is invalid")
}

export function signStorageTransferTicket(
  purpose: StorageTransferPurpose,
  input: Omit<StorageTransferClaims, "v" | "purpose" | "iat" | "exp" | "nonce"> & Partial<Pick<StorageTransferClaims, "nonce">>,
  ttlSeconds = getStorageTransferTtlSeconds(),
) {
  const now = Math.floor(Date.now() / 1000)
  const claims: StorageTransferClaims = {
    ...input,
    v: 1,
    purpose,
    iat: now,
    exp: now + Math.max(30, Math.min(300, Math.floor(ttlSeconds))),
    nonce: clean(input.nonce) || crypto.randomUUID(),
    fileId: clean(input.fileId),
    userId: clean(input.userId),
    mailboxId: clean(input.mailboxId),
    moduleKey: clean(input.moduleKey),
    entityType: clean(input.entityType),
    entityId: clean(input.entityId) || null,
    direction: normalizeDirection(input.direction),
    filename: clean(input.filename),
    contentType: clean(input.contentType) || "application/octet-stream",
    sizeBytes: Number(input.sizeBytes || 0),
    origin: clean(input.origin),
  }

  if (!claims.fileId || !claims.userId || !claims.mailboxId || !claims.moduleKey || !claims.entityType || !claims.filename) {
    throw new StorageTransferTicketError("TRANSFER_CLAIMS_INVALID", "Storage transfer ticket claims are incomplete")
  }
  if (!Number.isFinite(claims.sizeBytes) || claims.sizeBytes < 0) {
    throw new StorageTransferTicketError("TRANSFER_SIZE_INVALID", "Storage transfer ticket size is invalid")
  }

  const payload = base64urlEncode(JSON.stringify(claims))
  return `${payload}.${signature(payload)}`
}

export function verifyStorageTransferTicket(token: unknown, expectedPurpose?: StorageTransferPurpose) {
  const raw = clean(token)
  const [payload, providedSignature, ...rest] = raw.split(".")
  if (!payload || !providedSignature || rest.length) {
    throw new StorageTransferTicketError("TRANSFER_TOKEN_MALFORMED", "Storage transfer token is malformed")
  }

  const expectedSignature = signature(payload)
  const expectedBuffer = Buffer.from(expectedSignature)
  const providedBuffer = Buffer.from(providedSignature)
  if (expectedBuffer.length !== providedBuffer.length || !crypto.timingSafeEqual(expectedBuffer, providedBuffer)) {
    throw new StorageTransferTicketError("TRANSFER_SIGNATURE_INVALID", "Storage transfer token signature is invalid")
  }

  let parsed: any
  try {
    parsed = JSON.parse(base64urlDecode(payload).toString("utf8"))
  } catch {
    throw new StorageTransferTicketError("TRANSFER_PAYLOAD_INVALID", "Storage transfer token payload is invalid")
  }

  if (!parsed || parsed.v !== 1) {
    throw new StorageTransferTicketError("TRANSFER_VERSION_INVALID", "Storage transfer token version is invalid")
  }

  const purpose = normalizePurpose(parsed.purpose)
  if (expectedPurpose && purpose !== expectedPurpose) {
    throw new StorageTransferTicketError("TRANSFER_PURPOSE_MISMATCH", "Storage transfer token purpose does not match")
  }

  const now = Math.floor(Date.now() / 1000)
  const exp = Number(parsed.exp || 0)
  const iat = Number(parsed.iat || 0)
  if (!Number.isFinite(exp) || !Number.isFinite(iat) || exp <= now || iat > now + 30) {
    throw new StorageTransferTicketError("TRANSFER_TOKEN_EXPIRED", "Storage transfer token is expired or not yet valid")
  }
  if (exp - iat > 300) {
    throw new StorageTransferTicketError("TRANSFER_TTL_INVALID", "Storage transfer token lifetime is invalid")
  }

  const claims = parsed as StorageTransferClaims
  if (!clean(claims.nonce) || !clean(claims.fileId) || !clean(claims.userId) || !clean(claims.mailboxId)) {
    throw new StorageTransferTicketError("TRANSFER_CLAIMS_INVALID", "Storage transfer token claims are incomplete")
  }

  return claims
}
