import { NextResponse } from "next/server"
import { getCurrentAppUser } from "@/lib/auth/session"
import { requireUnlockedMailboxAccess, resolveMailboxScopeForUser } from "@/lib/email-os-core/access-governance"
import { makeEmailOSId } from "@/lib/email-os-core/schema"
import { normalizeStorageDirection, normalizeStorageEntityType, normalizeStorageModuleKey, readStorageBridgeConfig, sanitizeStorageFilename } from "@/lib/email-os-core/storage-gateway"
import { EMAIL_OS_MAX_ATTACHMENT_BYTES } from "@/lib/email-os-core/compose-attachments"
import { getStorageTransferTtlSeconds, signStorageTransferTicket } from "@/lib/email-os-core/storage-transfer-ticket"

export const dynamic = "force-dynamic"

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function requestOrigin(request: Request) {
  const direct = clean(request.headers.get("origin"))
  if (direct) return direct.replace(/\/+$/, "")
  const forwardedHost = clean(request.headers.get("x-forwarded-host"))
  const forwardedProto = clean(request.headers.get("x-forwarded-proto")) || "https"
  if (forwardedHost) return `${forwardedProto}://${forwardedHost}`.replace(/\/+$/, "")
  const host = clean(request.headers.get("host"))
  if (!host) return ""
  const proto = host.includes("localhost") || host.includes("127.0.0.1") ? "http" : "https"
  return `${proto}://${host}`
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentAppUser()
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })

    const body = await request.json().catch(() => ({}))
    const mailboxScope = await resolveMailboxScopeForUser(user.id, clean(body.mailboxId || body.mailbox_id) || null)
    await requireUnlockedMailboxAccess({
      userId: user.id,
      mailboxId: mailboxScope.mailboxId,
      requiredPermission: "can_send",
      request,
    })

    const filename = sanitizeStorageFilename(body.filename || body.originalFilename || "attachment")
    const contentType = clean(body.contentType || body.content_type || body.mimeType) || "application/octet-stream"
    const sizeBytes = Number(body.sizeBytes || body.size_bytes || 0)
    if (!Number.isFinite(sizeBytes) || sizeBytes <= 0) {
      return NextResponse.json({ ok: false, error: "Attachment size must be greater than zero.", code: "ATTACHMENT_INVALID" }, { status: 400 })
    }
    if (sizeBytes > EMAIL_OS_MAX_ATTACHMENT_BYTES) {
      return NextResponse.json({ ok: false, error: "Attachment exceeds the 8 MB limit.", code: "ATTACHMENT_TOO_LARGE" }, { status: 413 })
    }

    const moduleKey = normalizeStorageModuleKey(body.moduleKey || body.module_key || "email_os")
    if (moduleKey !== "email_os") {
      return NextResponse.json({ ok: false, error: "Only Email OS attachment uploads are allowed.", code: "ATTACHMENT_ACCESS_DENIED" }, { status: 403 })
    }

    const entityType = normalizeStorageEntityType(body.entityType || body.entity_type || "compose_attachment")
    if (!new Set(["compose_attachment", "reply_attachment", "attachment"]).has(entityType)) {
      return NextResponse.json({ ok: false, error: "Attachment entity type is not allowed.", code: "ATTACHMENT_INVALID" }, { status: 400 })
    }

    const direction = normalizeStorageDirection(body.direction || "outbound")
    if (direction !== "outbound") {
      return NextResponse.json({ ok: false, error: "Compose attachments must use outbound storage.", code: "ATTACHMENT_INVALID" }, { status: 400 })
    }

    const origin = requestOrigin(request)
    if (!origin) {
      return NextResponse.json({ ok: false, error: "Request origin could not be resolved.", code: "ATTACHMENT_PREPARATION_FAILED" }, { status: 400 })
    }

    const bridge = readStorageBridgeConfig()
    if (!bridge.hasBridgeUrl || !/^https?:\/\//i.test(bridge.bridgeUrl)) {
      return NextResponse.json({ ok: false, error: "Storage bridge URL is not configured.", code: "ATTACHMENT_PREPARATION_FAILED" }, { status: 503 })
    }

    const fileId = makeEmailOSId()
    const ttl = getStorageTransferTtlSeconds()
    const ticket = signStorageTransferTicket("storage_upload", {
      fileId,
      userId: user.id,
      mailboxId: mailboxScope.mailboxId,
      moduleKey,
      entityType,
      entityId: clean(body.entityId || body.entity_id) || null,
      direction,
      filename,
      contentType,
      sizeBytes,
      origin,
    }, ttl)

    return NextResponse.json({
      ok: true,
      data: {
        fileId,
        uploadUrl: `${bridge.bridgeUrl}/storage/direct-upload/${encodeURIComponent(fileId)}`,
        ticket,
        expiresAt: new Date(Date.now() + ttl * 1000).toISOString(),
        metadata: { mailboxId: mailboxScope.mailboxId, moduleKey, entityType, direction, filename, contentType, sizeBytes },
      },
    }, { headers: { "cache-control": "no-store" } })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Upload ticket creation failed", code: "ATTACHMENT_PREPARATION_FAILED" }, { status: 500 })
  }
}
