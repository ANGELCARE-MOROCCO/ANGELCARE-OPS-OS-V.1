import { NextResponse } from "next/server"
import { getCurrentAppUser } from "@/lib/auth/session"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import { getUserEmailOSAdminProfile, requireUnlockedMailboxAccess, resolveMailboxScopeForUser } from "@/lib/email-os-core/access-governance"
import {
  downloadStorageFileFromBridge,
  loadStorageFileMetadata,
  recordStorageEvent
} from "@/lib/email-os-core/storage-gateway"

export const dynamic = "force-dynamic"

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

export async function GET(request: Request, { params }: { params: Promise<{ fileId: string }> }) {
  try {
    const user = await getCurrentAppUser()
    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
    }

    const { fileId } = await params
    if (!clean(fileId)) {
      return NextResponse.json({ ok: false, error: "fileId is required" }, { status: 400 })
    }

    const db = createEmailOSCoreDb()
    const admin = await getUserEmailOSAdminProfile(user.id)
    const fileRow = await loadStorageFileMetadata(db, fileId)
    if (!fileRow) {
      return NextResponse.json({ ok: false, error: "Storage file not found" }, { status: 404 })
    }

    if (["destroyed", "permanently_deleted"].includes(clean(fileRow.status).toLowerCase())) {
      const destruction = fileRow.metadata && typeof fileRow.metadata === "object" ? (fileRow.metadata as Record<string, any>).destruction : null
      return NextResponse.json({
        ok: false,
        error: "Attachment was permanently deleted",
        code: "STORAGE_FILE_PERMANENTLY_DELETED",
        message: "This attachment was permanently destroyed under the governed OPSOS retention and destruction policy.",
        destruction: destruction ? {
          requestNumber: clean(destruction.requestNumber),
          certificateNumber: clean(fileRow.destruction_certificate_number || destruction.certificateNumber),
          destroyedAt: clean(fileRow.destroyed_at || destruction.destroyedAt),
          permanent: true,
        } : null,
      }, { status: 410, headers: { "cache-control": "no-store" } })
    }

    if (clean(fileRow.status).toLowerCase() === "quarantined") {
      const quarantine = fileRow.metadata && typeof fileRow.metadata === "object" ? (fileRow.metadata as Record<string, any>).quarantine : null
      return NextResponse.json({
        ok: false,
        error: "Attachment is quarantined",
        code: "STORAGE_FILE_QUARANTINED",
        message: "This attachment is temporarily isolated under the reversible OPSOS storage quarantine policy.",
        quarantine: quarantine ? {
          caseNumber: clean(quarantine.caseNumber),
          reason: clean(quarantine.reason),
          reversible: quarantine.reversible !== false,
        } : null,
      }, { status: 423, headers: { "cache-control": "no-store" } })
    }

    const mailboxId = fileRow.mailbox_id || clean(new URL(request.url).searchParams.get("mailboxId")) || null
    if (mailboxId) {
      const scope = await resolveMailboxScopeForUser(user.id, mailboxId)
      await requireUnlockedMailboxAccess({
        userId: user.id,
        mailboxId: scope.mailboxId,
        requiredPermission: "can_read",
        request,
      })
    } else if (!admin.isAdmin) {
      return NextResponse.json({ ok: false, error: "Mailbox scope required." }, { status: 403 })
    }

    const bridgeResponse = await downloadStorageFileFromBridge(fileId)
    const arrayBuffer = await bridgeResponse.arrayBuffer()
    const headers = new Headers()
    const contentType = bridgeResponse.headers.get("content-type") || fileRow.content_type || "application/octet-stream"
    headers.set("Content-Type", contentType)
    headers.set("Content-Disposition", bridgeResponse.headers.get("content-disposition") || `attachment; filename="${fileRow.safe_filename.replace(/"/g, "_")}"`)
    headers.set("Cache-Control", "no-store")
    headers.set("X-Content-Type-Options", "nosniff")

    const response = new NextResponse(Buffer.from(arrayBuffer), {
      status: bridgeResponse.status,
      headers
    })

    await recordStorageEvent(db, {
      fileId,
      action: "download",
      moduleKey: fileRow.module_key,
      actorUserId: user.id,
      ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || null,
      userAgent: request.headers.get("user-agent") || null,
      metadata: {
        originalFilename: fileRow.original_filename,
        storageBucket: fileRow.storage_bucket,
        storageKey: fileRow.storage_key,
        sizeBytes: fileRow.size_bytes
      }
    })

    return response
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Storage download failed"
      },
      { status: 500 }
    )
  }
}
