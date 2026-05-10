import { NextResponse } from "next/server"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import { makeEmailOSId, nowIso } from "@/lib/email-os-core/schema"
import { audit } from "@/lib/email-os-core/audit"

export async function GET() {
  try {
    const db = createEmailOSCoreDb()
    const { data, error } = await db
      .from("email_os_core_saved_views")
      .select("*")
      .order("updated_at", { ascending: false })

    if (error) throw error
    return NextResponse.json({ ok: true, data: data || [] })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Failed to load saved views" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const db = createEmailOSCoreDb()

    const row = {
      id: body.id || makeEmailOSId(),
      name: body.name || "Saved View",
      entity: body.entity || "threads",
      filters: body.filters || {},
      owner: body.owner || "operations",
      is_default: Boolean(body.isDefault),
      created_at: nowIso(),
      updated_at: nowIso()
    }

    const { data, error } = await db
      .from("email_os_core_saved_views")
      .insert(row)
      .select("*")
      .single()

    if (error) throw error

    await audit("saved_view.created", { targetType: "saved_view", targetId: row.id })
    return NextResponse.json({ ok: true, data })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Failed to create saved view" }, { status: 500 })
  }
}
