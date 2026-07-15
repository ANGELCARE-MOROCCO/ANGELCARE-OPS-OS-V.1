import { NextResponse } from "next/server"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import { makeEmailOSId, nowIso } from "@/lib/email-os-core/schema"

export async function POST() {
  try {
    const db = createEmailOSCoreDb()
    const base = [
      ["admin", "thread", "read", "allow"],
      ["admin", "thread", "send", "allow"],
      ["admin", "executive", "execute", "allow"],
      ["operations", "thread", "read", "allow"],
      ["operations", "thread", "assign", "allow"],
      ["support", "thread", "reply", "allow"],
      ["viewer", "dashboard", "read", "allow"]
    ].map(([role_key, resource, action, effect]) => ({
      id: makeEmailOSId(),
      role_key,
      resource,
      action,
      effect,
      conditions: {},
      created_at: nowIso()
    }))

    const { error } = await db.from("email_os_core_rbac_policies").insert(base)
    if (error) throw error
    return NextResponse.json({ ok: true, data: { inserted: base.length } })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "RBAC seed failed" }, { status: 500 })
  }
}
