import { NextResponse } from "next/server"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const q = (url.searchParams.get("q") || "").trim()
    const entity = url.searchParams.get("entity")
    const limit = Number(url.searchParams.get("limit") || 50)

    const db = createEmailOSCoreDb()
    let query = db.from("email_os_core_search_index").select("*").order("updated_at", { ascending: false })

    if (entity) query = query.eq("entity", entity)

    if (q) {
      query = query.or(`title.ilike.%${q}%,body.ilike.%${q}%`)
    }

    const { data, error } = await query.limit(limit)
    if (error) throw error

    return NextResponse.json({ ok: true, data: data || [] })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Search failed" }, { status: 500 })
  }
}
