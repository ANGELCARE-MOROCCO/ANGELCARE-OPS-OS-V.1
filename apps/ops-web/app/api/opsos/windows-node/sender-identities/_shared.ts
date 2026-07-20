import { NextResponse } from "next/server"
import { getWindowsNodeRequestIp, requireWindowsNodeAdmin } from "@/app/api/opsos/windows-node/_shared"
import type { SenderIdentityActor } from "@/lib/email-os-core/sender-identity"

type UserLike = {
  id?: string
  email?: string
  name?: string
  full_name?: string
  role?: string
  permissions?: string[]
}

const MANAGE_PERMISSIONS = new Set([
  "*",
  "admin.manage",
  "email_os.sender_identity.view",
  "email_os.sender_identity.manage",
  "email_os.sender_identity.test",
  "email_os.sender_identity.activate",
  "email_os.sender_identity.rollback",
  "email_os.sender_identity.bulk_manage",
])

export async function requireSenderIdentityAdmin(request: Request) {
  const auth = await requireWindowsNodeAdmin(request)
  if (!auth.ok) return auth

  const user = (auth.context.user || {}) as UserLike
  const permissions = Array.isArray(user.permissions) ? user.permissions.map((value) => String(value).trim().toLowerCase()) : []
  const role = String(user.role || "").trim().toLowerCase()
  const allowedByRole = ["ceo", "owner", "founder", "super_admin", "superadmin", "admin", "direction", "managing_director", "infrastructure_admin", "platform_admin"].includes(role)
  const allowedByPermission = permissions.some((permission) => MANAGE_PERMISSIONS.has(permission))

  if (!allowedByRole && !allowedByPermission) {
    return {
      ok: false as const,
      response: NextResponse.json({ ok: false, error: "Sender identity administration permission required." }, { status: 403, headers: { "cache-control": "no-store" } }),
    }
  }

  return auth
}

export function actorFromSenderIdentityAuth(request: Request, auth: Awaited<ReturnType<typeof requireWindowsNodeAdmin>>): SenderIdentityActor {
  const context = auth.ok ? auth.context : { operator: "unknown", user: null }
  const user = (context.user || {}) as UserLike
  return {
    userId: String(user.id || "").trim() || null,
    name: String(context.operator || user.full_name || user.name || user.email || "Sender identity administrator").trim(),
    ip: getWindowsNodeRequestIp(request) || null,
  }
}

export function senderIdentityOk(data: unknown, status = 200) {
  return NextResponse.json({ ok: true, data }, { status, headers: { "cache-control": "no-store" } })
}

export function senderIdentityError(error: unknown, status = 500) {
  return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : String(error || "Sender identity operation failed") }, { status, headers: { "cache-control": "no-store" } })
}
