import { getCurrentUser } from "@/lib/getUser"
import { normalizeRevenueOsRole } from "@/lib/revenue-command-os/access"

const PRIVILEGED_REVENUE_ROLES = new Set([
  "ceo",
  "direction",
  "admin",
  "super_admin",
  "owner",
  "founder",
  "managing_director",
])

export class RevenueApiAccessError extends Error {
  status: number
  code: "UNAUTHENTICATED" | "FORBIDDEN"

  constructor(code: "UNAUTHENTICATED" | "FORBIDDEN", message: string, status: number) {
    super(message)
    this.name = "RevenueApiAccessError"
    this.code = code
    this.status = status
  }
}

function normalizePermissions(value: unknown) {
  return Array.from(
    new Set(
      (Array.isArray(value) ? value : [])
        .map((permission) => String(permission || "").trim())
        .filter(Boolean),
    ),
  )
}

export async function requireRevenueApiAccess(required: string | string[] = "revenue.view") {
  const user = await getCurrentUser()
  if (!user) {
    throw new RevenueApiAccessError("UNAUTHENTICATED", "Session ANGELCARE requise.", 401)
  }

  const role = normalizeRevenueOsRole((user as any).role ?? (user as any).role_key)
  const permissions = normalizePermissions((user as any).permissions)
  const permissionSet = new Set(permissions)
  const requirements = Array.isArray(required) ? required : [required]

  const fullAccess =
    PRIVILEGED_REVENUE_ROLES.has(role) ||
    permissionSet.has("*") ||
    permissionSet.has("revenue.admin") ||
    permissionSet.has("revenue.manage")

  const allowed =
    fullAccess ||
    requirements.some((permission) => permissionSet.has(permission)) ||
    (requirements.every((permission) => permission.endsWith(".read")) && permissionSet.has("revenue.view"))

  if (!allowed) {
    throw new RevenueApiAccessError(
      "FORBIDDEN",
      "Votre rôle ne permet pas cette opération Revenue Command.",
      403,
    )
  }

  return {
    user,
    role,
    permissions,
    fullAccess,
  }
}

export function revenueAccessFailure(error: unknown) {
  if (error instanceof RevenueApiAccessError) {
    return { status: error.status, code: error.code, message: error.message }
  }
  return null
}
