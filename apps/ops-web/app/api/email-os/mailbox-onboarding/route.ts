import { NextResponse } from "next/server"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import { makeEmailOSId, nowIso } from "@/lib/email-os-core/schema"
import { audit } from "@/lib/email-os-core/audit"

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    if (!body.emailAddress || !body.passwordRef) {
      return NextResponse.json({ ok: false, error: "emailAddress and passwordRef are required" }, { status: 400 })
    }

    const db = createEmailOSCoreDb()
    let providerProfileId = body.providerProfileId || null

    if (!providerProfileId) {
      const { data: profiles, error: profileError } = await db.from("email_os_core_provider_profiles").select("*").eq("is_default", true).limit(1)
      if (profileError) throw profileError
      providerProfileId = profiles?.[0]?.id || null
    }

    const mailbox = {
      id: makeEmailOSId(),
      name: body.name || body.emailAddress,
      address: body.emailAddress,
      provider: "smtp_imap",
      status: "active",
      owner: body.owner || "operations",
      created_at: nowIso(),
      updated_at: nowIso()
    }

    const { data: mailboxData, error: mailboxError } = await db.from("email_os_core_mailboxes").insert(mailbox).select("*").single()
    if (mailboxError) throw mailboxError

    const credential = {
      id: makeEmailOSId(),
      mailbox_id: mailboxData.id,
      provider_profile_id: providerProfileId,
      email_address: body.emailAddress,
      username: body.username || body.emailAddress,
      password_ref: body.passwordRef,
      auth_mode: body.authMode || "password",
      status: "active",
      created_at: nowIso(),
      updated_at: nowIso()
    }

    const { data: credentialData, error: credentialError } = await db.from("email_os_core_mailbox_credentials").insert(credential).select("*").single()
    if (credentialError) throw credentialError

    await audit("mailbox.onboarded", { targetType: "mailbox", targetId: mailboxData.id, emailAddress: body.emailAddress })
    return NextResponse.json({ ok: true, data: { mailbox: mailboxData, credential: credentialData } })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Mailbox onboarding failed" }, { status: 500 })
  }
}
