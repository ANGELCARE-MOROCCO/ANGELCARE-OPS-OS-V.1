import { NextResponse } from "next/server"
import { enforceEmailOSPermission } from "@/lib/email-os-core/final-rbac"

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const result = await enforceEmailOSPermission({
      roleKey: body.roleKey || "operations",
      resource: body.resource || "thread",
      action: body.action || "read",
      actor: body.actor || body.roleKey || "operations"
    })

    return NextResponse.json({ ok: true, data: result })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Permission enforcement failed" }, { status: 500 })
  }
}
