import { NextResponse } from "next/server"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import { makeEmailOSId, nowIso } from "@/lib/email-os-core/schema"
import { EMAIL_OS_PRODUCTION_ROUTES } from "@/lib/email-os-core/production-routes"

export async function GET() {
  return NextResponse.json({
    ok: true,
    data: {
      expectedProtectedRoutes: EMAIL_OS_PRODUCTION_ROUTES
    }
  })
}

export async function POST() {
  try {
    const db = createEmailOSCoreDb()

    const rows = EMAIL_OS_PRODUCTION_ROUTES.map((route) => ({
      id: makeEmailOSId(),
      route_path: route,
      expected_protection: "authenticated",
      observed_status: "requires-manual-browser-verification",
      result: "pending",
      metadata: {
        note: "Verify this route redirects unauthenticated users and loads for authenticated users."
      },
      checked_at: nowIso()
    }))

    const { data, error } = await db.from("email_os_core_route_protection_checks").insert(rows).select("*")
    if (error) throw error

    return NextResponse.json({ ok: true, data: data || [] })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Route protection seed failed" }, { status: 500 })
  }
}
