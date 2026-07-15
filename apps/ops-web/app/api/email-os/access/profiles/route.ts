import { NextResponse } from "next/server"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import { makeEmailOSId, nowIso } from "@/lib/email-os-core/schema"

export async function GET() {
  try {
    const db = createEmailOSCoreDb()
    const { data, error } = await db.from("email_os_core_access_profiles").select("*").order("updated_at", { ascending: false })
    if (error) throw error
    return NextResponse.json({ ok: true, data: data || [] })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Failed to load access profiles" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const db = createEmailOSCoreDb()

    const row = {
      id: body.id || makeEmailOSId(),
      name: body.name || "Access Profile",
      role_key: body.roleKey || body.role_key || "operations",
      description: body.description || null,
      permissions: body.permissions || {
        canRead: true,
        canCompose: true,
        canSend: false,
        canManage: false
      },
      enabled: body.enabled !== false,
      created_at: nowIso(),
      updated_at: nowIso()
    }

    const { data, error } = await db.from("email_os_core_access_profiles").insert(row).select("*").single()
    if (error) throw error

    return NextResponse.json({ ok: true, data })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Failed to create access profile" }, { status: 500 })
  }
}
