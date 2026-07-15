import { NextResponse } from "next/server"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import { makeEmailOSId, nowIso } from "@/lib/email-os-core/schema"

export async function GET() {
  try {
    const db = createEmailOSCoreDb()
    const { data, error } = await db
      .from("email_os_core_provider_failover_groups")
      .select("*")
      .order("updated_at", { ascending: false })

    if (error) throw error
    return NextResponse.json({ ok: true, data: data || [] })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Failed to load failover groups" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const db = createEmailOSCoreDb()

    const row = {
      id: makeEmailOSId(),
      name: body.name || "Provider failover group",
      primary_provider_profile_id: body.primaryProviderProfileId || null,
      fallback_provider_profile_ids: Array.isArray(body.fallbackProviderProfileIds) ? body.fallbackProviderProfileIds : [],
      status: body.status || "active",
      created_at: nowIso(),
      updated_at: nowIso()
    }

    const { data, error } = await db.from("email_os_core_provider_failover_groups").insert(row).select("*").single()
    if (error) throw error

    return NextResponse.json({ ok: true, data })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Failed to create failover group" }, { status: 500 })
  }
}
