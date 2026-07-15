import { NextResponse } from "next/server"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import { makeEmailOSId, nowIso } from "@/lib/email-os-core/schema"

export async function GET() {
  try {
    const db = createEmailOSCoreDb()
    const { data, error } = await db
      .from("email_os_core_credential_vault_refs")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(250)

    if (error) throw error
    return NextResponse.json({ ok: true, data: data || [] })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Failed to load vault refs" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))

    if (!body.mailboxCredentialId || !body.vaultKey) {
      return NextResponse.json({ ok: false, error: "mailboxCredentialId and vaultKey are required" }, { status: 400 })
    }

    const db = createEmailOSCoreDb()
    const row = {
      id: makeEmailOSId(),
      mailbox_credential_id: body.mailboxCredentialId,
      vault_provider: body.vaultProvider || "manual",
      vault_key: body.vaultKey,
      status: body.status || "active",
      created_at: nowIso(),
      updated_at: nowIso()
    }

    const { data, error } = await db.from("email_os_core_credential_vault_refs").insert(row).select("*").single()
    if (error) throw error

    return NextResponse.json({ ok: true, data })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Failed to create vault ref" }, { status: 500 })
  }
}
