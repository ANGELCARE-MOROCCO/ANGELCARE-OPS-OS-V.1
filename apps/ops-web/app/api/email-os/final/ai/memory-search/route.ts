import { NextResponse } from "next/server"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const q = (url.searchParams.get("q") || "").trim()

    const db = createEmailOSCoreDb()
    let query = db.from("email_os_core_ai_memory").select("*").order("created_at", { ascending: false }).limit(50)

    if (q) query = query.ilike("content", `%${q}%`)

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json({ ok: true, data: data || [] })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "AI memory search failed" }, { status: 500 })
  }
}
