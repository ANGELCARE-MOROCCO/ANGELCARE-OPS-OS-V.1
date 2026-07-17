import { NextResponse } from "next/server"
import { getCurrentAppUser } from "@/lib/auth/session"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import { requireUnlockedMailboxAccess, resolveMailboxScopeForUser, getUserEmailOSAdminProfile } from "@/lib/email-os-core/access-governance"
import {
  normalizeStorageDirection,
  normalizeStorageEntityType,
  normalizeStorageModuleKey,
  recordStorageEvent,
  sanitizeStorageFilename,
  uploadStorageFileToBridge,
  upsertStorageFileMetadata
} from "@/lib/email-os-core/storage-gateway"

export const dynamic = "force-dynamic"

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

async function readPayload(request: Request) {
  const contentType = request.headers.get("content-type") || ""
  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData()
    const file = form.get("file")
    const blob = file instanceof File ? file : null
    const buffer = blob ? Buffer.from(await blob.arrayBuffer()) : Buffer.alloc(0)

    return {
      moduleKey: clean(form.get("moduleKey") || form.get("module_key")) || "email_os",
      mailboxId: clean(form.get("mailboxId") || form.get("mailbox_id")) || null,
      entityType: clean(form.get("entityType") || form.get("entity_type")) || "attachment",
      entityId: clean(form.get("entityId") || form.get("entity_id")) || null,
      direction: clean(form.get("direction")) || "outbound",
      originalFilename: clean(form.get("originalFilename") || form.get("filename") || blob?.name) || "attachment",
      contentType: clean(form.get("contentType") || form.get("content_type") || blob?.type) || "application/octet-stream",
      contentBase64: buffer.length ? buffer.toString("base64") : "",
      createdBy: clean(form.get("createdBy") || form.get("created_by")) || null,
      metadata: (() => {
        const raw = clean(form.get("metadata"))
        if (!raw) return {}
        try {
          return JSON.parse(raw)
        } catch {
          return { value: raw }
        }
      })()
    }
  }

  const body = await request.json().catch(() => ({}))
  return {
    moduleKey: clean(body.moduleKey || body.module_key) || "email_os",
    mailboxId: clean(body.mailboxId || body.mailbox_id) || null,
    entityType: clean(body.entityType || body.entity_type) || "attachment",
    entityId: clean(body.entityId || body.entity_id) || null,
    direction: clean(body.direction) || "outbound",
    originalFilename: clean(body.originalFilename || body.filename) || "attachment",
    contentType: clean(body.contentType || body.content_type) || "application/octet-stream",
    contentBase64: clean(body.contentBase64 || body.content_base64 || body.base64 || body.content),
    createdBy: clean(body.createdBy || body.created_by) || null,
    metadata: body.metadata && typeof body.metadata === "object" ? body.metadata : {}
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentAppUser()
    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
    }

    const payload = await readPayload(request)
    const moduleKey = normalizeStorageModuleKey(payload.moduleKey || "email_os")
    const entityType = normalizeStorageEntityType(payload.entityType || "attachment")
    const direction = normalizeStorageDirection(payload.direction || "outbound")
    const mailboxId = clean(payload.mailboxId)
    const db = createEmailOSCoreDb()
    const admin = await getUserEmailOSAdminProfile(user.id)

    if (mailboxId) {
      const scope = await resolveMailboxScopeForUser(user.id, mailboxId)
      await requireUnlockedMailboxAccess({
        userId: user.id,
        mailboxId: scope.mailboxId,
        requiredPermission: "can_send",
        request,
      })
    } else if (!admin.isAdmin) {
      return NextResponse.json({ ok: false, error: "Mailbox scope required." }, { status: 403 })
    }

    const result = await uploadStorageFileToBridge({
      moduleKey,
      mailboxId: mailboxId || null,
      entityType,
      entityId: clean(payload.entityId) || null,
      originalFilename: sanitizeStorageFilename(payload.originalFilename || "attachment"),
      contentType: clean(payload.contentType) || "application/octet-stream",
      contentBase64: clean(payload.contentBase64),
      createdBy: clean(payload.createdBy) || user.id,
      direction,
      metadata: {
        ...(payload.metadata || {}),
        uploadedBy: user.id,
        uploadedByEmail: user.email || null
      }
    })

    const fileRow = await upsertStorageFileMetadata(db, {
      id: result.id,
      module_key: result.module_key,
      mailbox_id: result.mailbox_id,
      entity_type: result.entity_type,
      entity_id: result.entity_id,
      original_filename: result.original_filename,
      safe_filename: result.safe_filename,
      content_type: result.content_type,
      size_bytes: result.size_bytes,
      sha256_hash: result.sha256_hash,
      storage_provider: result.storage_provider,
      storage_node: result.storage_node,
      storage_bucket: result.storage_bucket,
      storage_key: result.storage_key,
      status: result.status,
      created_by: result.created_by,
      created_at: result.created_at,
      updated_at: result.updated_at,
      deleted_at: result.deleted_at,
      metadata: result.metadata || {}
    })

    const event = await recordStorageEvent(db, {
      fileId: fileRow.id,
      action: "upload",
      moduleKey,
      actorUserId: user.id,
      ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || null,
      userAgent: request.headers.get("user-agent") || null,
      metadata: {
        fileId: fileRow.id,
        originalFilename: fileRow.original_filename,
        sizeBytes: fileRow.size_bytes,
        storageBucket: fileRow.storage_bucket,
        storageKey: fileRow.storage_key,
        direction
      }
    })

    return NextResponse.json({
      ok: true,
      data: {
        ...fileRow,
        event,
        bridge: {
          freeBytes: result.freeBytes,
          usedBytes: result.usedBytes,
          totalBytes: result.totalBytes,
          warning: result.warning,
          critical: result.critical
        }
      }
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Storage upload failed"
      },
      { status: 500 }
    )
  }
}
