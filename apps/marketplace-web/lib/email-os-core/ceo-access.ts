import { NextResponse } from "next/server"

const CEO_ROLES = new Set(["ceo", "owner", "founder", "super_admin", "superadmin", "admin_ceo"])
function normalize(value: any) { return String(value || "").trim().toLowerCase() }

export function hasCeoAccessFromRequest(request: Request) {
  const headers = request.headers
  const role = normalize(headers.get("x-angelcare-role") || headers.get("x-user-role") || headers.get("x-role") || "")
  const email = normalize(headers.get("x-angelcare-email") || headers.get("x-user-email") || headers.get("x-email") || "")
  const allowedEmails = String(process.env.EMAIL_OS_CEO_EMAILS || process.env.CEO_EMAILS || "")
    .split(",").map((item) => normalize(item)).filter(Boolean)

  if (CEO_ROLES.has(role)) return true
  if (email && allowedEmails.includes(email)) return true

  const host = headers.get("host") || ""
  if ((host.includes("localhost") || host.includes("127.0.0.1")) && !process.env.EMAIL_OS_REQUIRE_CEO_GUARD) return true
  return false
}

export function assertCeoAccess(request: Request) {
  if (hasCeoAccessFromRequest(request)) return null
  return NextResponse.json({ ok: false, error: "CEO access required" }, { status: 403 })
}
