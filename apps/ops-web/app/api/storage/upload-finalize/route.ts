import { NextResponse } from "next/server"
import { getCurrentAppUser } from "@/lib/auth/session"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import { requireUnlockedMailboxAccess, resolveMailboxScopeForUser } from "@/lib/email-os-core/access-governance"
import { upsertStorageFileMetadata, recordStorageEvent } from "@/lib/email-os-core/storage-gateway"
import { EMAIL_OS_MAX_ATTACHMENT_BYTES } from "@/lib/email-os-core/compose-attachments"
import { verifyStorageTransferTicket } from "@/lib/email-os-core/storage-transfer-ticket"

export const dynamic = "force-dynamic"

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentAppUser()
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })

    const body = await request.json().catch(() => ({}))
    const receipt = clean(body.receipt)
    if (!receipt) return NextResponse.json({ ok: false, error: "Signed upload receipt is required.", code: "ATTACHMENT_INVALID" }, { status: 400 })

    const claims = verifyStorageTransferTicket(receipt, "storage_upload_receipt")
    if (claims.userId !== user.id) {
      return NextResponse.json({ ok: false, error: "Upload receipt does not belong to the current user.", code: "ATTACHMENT_ACCESS_DENIED" }, { status: 403 })
    }
    if (clean(body.fileId) && clean(body.fileId) !== claims.fileId) {
      return NextResponse.json({ ok: false, error: "Upload receipt fileId mismatch.", code: "ATTACHMENT_INVALID" }, { status: 400 })
    }
    if (claims.moduleKey !== "email_os" || Number(claims.sizeBytes || 0) <= 0 || Number(claims.sizeBytes || 0) > EMAIL_OS_MAX_ATTACHMENT_BYTES) {
      return NextResponse.json({ ok: false, error: "Upload receipt contains invalid attachment metadata.", code: "ATTACHMENT_INVALID" }, { status: 400 })
    }

    const mailboxScope = await resolveMailboxScopeForUser(user.id, claims.mailboxId)
    await requireUnlockedMailboxAccess({
      userId: user.id,
      mailboxId: mailboxScope.mailboxId,
      requiredPermission: "can_send",
      request,
    })
    if (mailboxScope.mailboxId !== claims.mailboxId) {
      return NextResponse.json({ ok: false, error: "Upload receipt mailbox mismatch.", code: "ATTACHMENT_ACCESS_DENIED" }, { status: 403 })
    }

    const db = createEmailOSCoreDb()
    const row = await upsertStorageFileMetadata(db, {
      id: claims.fileId,
      module_key: claims.moduleKey,
      mailbox_id: claims.mailboxId,
      entity_type: claims.entityType,
      entity_id: clean(claims.entityId) || null,
      original_filename: claims.filename,
      safe_filename: clean(claims.safeFilename || claims.filename),
      content_type: claims.contentType,
      size_bytes: Number(claims.sizeBytes || 0),
      sha256_hash: clean(claims.sha256Hash),
      storage_provider: clean(claims.storageProvider) || "windows_node",
      storage_node: clean(claims.storageNode) || "angelcare-windows-node-01",
      storage_bucket: clean(claims.storageBucket),
      storage_key: clean(claims.storageKey),
      status: clean(claims.status) || "active",
      created_by: user.id,
      created_at: clean(claims.uploadedAt) || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
      metadata: {
        transfer: {
          finalized: true,
          uploadNonce: clean(claims.uploadNonce),
          receiptNonce: claims.nonce,
        },
      },
    })

    await recordStorageEvent(db, {
      fileId: row.id,
      action: "upload_finalized",
      moduleKey: row.module_key,
      actorUserId: user.id,
      ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || null,
      userAgent: request.headers.get("user-agent") || null,
      metadata: { mailboxId: row.mailbox_id, sizeBytes: row.size_bytes, sha256Hash: row.sha256_hash, storageKey: row.storage_key },
    })

    return NextResponse.json({ ok: true, data: row }, { headers: { "cache-control": "no-store" } })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Upload finalization failed", code: "ATTACHMENT_PREPARATION_FAILED" }, { status: 500 })
  }
}
