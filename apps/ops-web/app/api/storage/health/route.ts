import { NextResponse } from "next/server"
import { getCurrentAppUser } from "@/lib/auth/session"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import { getUserEmailOSAdminProfile, requireUnlockedMailboxAccess, resolveMailboxScopeForUser } from "@/lib/email-os-core/access-governance"
import { getStorageHealthFromBridge, loadStorageUsageSummary } from "@/lib/email-os-core/storage-gateway"

export const dynamic = "force-dynamic"

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

export async function GET(request: Request) {
  try {
    const user = await getCurrentAppUser()
    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
    }

    const url = new URL(request.url)
    const mailboxId = clean(url.searchParams.get("mailboxId")) || null
    const admin = await getUserEmailOSAdminProfile(user.id)

    if (mailboxId) {
      const scope = await resolveMailboxScopeForUser(user.id, mailboxId)
      await requireUnlockedMailboxAccess({
        userId: user.id,
        mailboxId: scope.mailboxId,
        requiredPermission: "can_read",
        request,
      })
    } else if (!admin.isAdmin) {
      return NextResponse.json({ ok: false, error: "Admin access required." }, { status: 403 })
    }

    const db = createEmailOSCoreDb()
    const bridge = await getStorageHealthFromBridge()
    const usage = await loadStorageUsageSummary(db, "email_os")

    return NextResponse.json({
      ok: true,
      data: {
        bridge,
        usage,
        mailboxId,
        generatedAt: new Date().toISOString()
      }
    })
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Storage health failed" },
      { status: 500 }
    )
  }
}
