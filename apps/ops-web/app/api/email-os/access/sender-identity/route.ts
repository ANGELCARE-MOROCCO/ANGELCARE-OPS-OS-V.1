import { NextResponse } from "next/server"
import { getCurrentAppUser } from "@/lib/auth/session"
import { requireUnlockedMailboxAccess, resolveMailboxScopeForUser } from "@/lib/email-os-core/access-governance"
import { resolveSenderIdentity } from "@/lib/email-os-core/sender-identity"

export const dynamic = "force-dynamic"

function clean(value: unknown) {
  return String(value ?? "").trim()
}

export async function GET(request: Request) {
  const user = await getCurrentAppUser()
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
  try {
    const mailboxId = clean(new URL(request.url).searchParams.get("mailboxId"))
    const scope = await resolveMailboxScopeForUser(user.id, mailboxId || null)
    const access = await requireUnlockedMailboxAccess({ userId: user.id, mailboxId: scope.mailboxId, requiredPermission: "can_send", request })
    const fromAddress = clean(access.mailbox?.address || access.mailbox?.name)
    const identity = await resolveSenderIdentity({
      mailboxId: scope.mailboxId,
      canonicalFromAddress: fromAddress,
      mailboxInternalName: access.mailbox?.name || null,
    })
    return NextResponse.json({ ok: true, data: identity }, { headers: { "cache-control": "no-store" } })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Sender identity unavailable" }, { status: 500 })
  }
}
