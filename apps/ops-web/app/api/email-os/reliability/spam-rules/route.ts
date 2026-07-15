import { NextResponse } from "next/server"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import { makeEmailOSId, nowIso } from "@/lib/email-os-core/schema"

export async function GET() {
  try {
    const db = createEmailOSCoreDb()
    const { data, error } = await db.from("email_os_core_spam_rules").select("*").order("created_at", { ascending: false })
    if (error) throw error
    return NextResponse.json({ ok: true, data: data || [] })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Failed to load spam rules" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const db = createEmailOSCoreDb()
    const row = {
      id: makeEmailOSId(),
      rule_name: body.ruleName || "Spam rule",
      rule_type: body.ruleType || "keyword",
      pattern: body.pattern || "spam",
      action: body.action || "flag",
      enabled: body.enabled !== false,
      created_at: nowIso()
    }
    const { data, error } = await db.from("email_os_core_spam_rules").insert(row).select("*").single()
    if (error) throw error
    return NextResponse.json({ ok: true, data })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Failed to create spam rule" }, { status: 500 })
  }
}
