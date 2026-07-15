import { NextResponse } from "next/server"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import { makeEmailOSId, nowIso } from "@/lib/email-os-core/schema"
import { getDefaultMenaraProviderProfile } from "@/lib/email-os-core/default-provider"

function toDb(body: any) {
  return {
    id: body.id || makeEmailOSId(),
    name: body.name || "Provider Profile",
    provider_type: body.providerType || body.provider_type || "smtp_imap",
    smtp_host: body.smtpHost || body.smtp_host || null,
    smtp_port: Number(body.smtpPort || body.smtp_port || 587),
    smtp_secure: Boolean(body.smtpSecure || body.smtp_secure),
    imap_host: body.imapHost || body.imap_host || null,
    imap_port: Number(body.imapPort || body.imap_port || 993),
    imap_secure: body.imapSecure !== false && body.imap_secure !== false,
    is_default: Boolean(body.isDefault || body.is_default),
    status: body.status || "active",
    created_at: nowIso(),
    updated_at: nowIso()
  }
}

export async function GET() {
  try {
    const db = createEmailOSCoreDb()
    const { data, error } = await db.from("email_os_core_provider_profiles").select("*").order("updated_at", { ascending: false })
    if (error) throw error
    return NextResponse.json({ ok: true, data: data || [] })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Failed to load provider profiles" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const db = createEmailOSCoreDb()
    const row = toDb(body.useMenaraDefault ? getDefaultMenaraProviderProfile() : body)

    if (row.is_default) {
      await db.from("email_os_core_provider_profiles").update({ is_default: false }).neq("id", row.id)
    }

    const { data, error } = await db.from("email_os_core_provider_profiles").insert(row).select("*").single()
    if (error) throw error
    return NextResponse.json({ ok: true, data })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Failed to create provider profile" }, { status: 500 })
  }
}
