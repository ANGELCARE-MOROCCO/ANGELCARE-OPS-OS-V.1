import { NextResponse } from "next/server"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import { makeEmailOSId, nowIso } from "@/lib/email-os-core/schema"

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    if (!body.vaultKey) return NextResponse.json({ ok: false, error: "vaultKey is required" }, { status: 400 })
    const db = createEmailOSCoreDb()
    const row = {
      id: makeEmailOSId(),
      secret_type: body.secretType || "mailbox_password",
      entity_type: body.entityType || null,
      entity_id: body.entityId || null,
      vault_provider: body.vaultProvider || "manual",
      vault_key: body.vaultKey,
      rotation_due_at: body.rotationDueAt || null,
      status: "active",
      created_at: nowIso()
    }
    const { data, error } = await db.from("email_os_core_secret_vault_refs").insert(row).select("*").single()
    if (error) throw error
    return NextResponse.json({ ok: true, data })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Secret vault ref failed" }, { status: 500 })
  }
}
