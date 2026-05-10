import { NextResponse } from "next/server"
import nodemailer from "nodemailer"
import { ImapFlow } from "imapflow"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import { makeEmailOSId, nowIso } from "@/lib/email-os-core/schema"

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const credentialId = body.credentialId
    const password = body.password || body.passwordRef

    if (!credentialId || !password) {
      return NextResponse.json({ ok: false, error: "credentialId and password are required" }, { status: 400 })
    }

    const db = createEmailOSCoreDb()

    const { data: credential, error: credError } = await db
      .from("email_os_core_mailbox_credentials")
      .select("*")
      .eq("id", credentialId)
      .single()

    if (credError) throw credError
    if (!credential) throw new Error("Credential not found")

    const { data: profile, error: profileError } = await db
      .from("email_os_core_provider_profiles")
      .select("*")
      .eq("id", credential.provider_profile_id)
      .single()

    if (profileError) throw profileError
    if (!profile) throw new Error("Provider profile not found")

    const results: Record<string, any> = {}

    try {
      const transporter = nodemailer.createTransport({
        host: profile.smtp_host,
        port: Number(profile.smtp_port || 587),
        secure: Boolean(profile.smtp_secure),
        auth: { user: credential.username, pass: password }
      })
      await transporter.verify()
      results.smtp = { ok: true }
    } catch (error) {
      results.smtp = { ok: false, error: error instanceof Error ? error.message : "SMTP failed" }
    }

    try {
      const client = new ImapFlow({
        host: profile.imap_host,
        port: Number(profile.imap_port || 993),
        secure: profile.imap_secure !== false,
        auth: { user: credential.username, pass: password }
      })
      await client.connect()
      await client.logout()
      results.imap = { ok: true }
    } catch (error) {
      results.imap = { ok: false, error: error instanceof Error ? error.message : "IMAP failed" }
    }

    const passed = Object.values(results).every((item: any) => item?.ok)

    await db.from("email_os_core_mailbox_credentials").update({
      last_tested_at: nowIso(),
      last_test_status: passed ? "passed" : "failed",
      updated_at: nowIso()
    }).eq("id", credential.id)

    await db.from("email_os_core_credential_tests").insert({
      id: makeEmailOSId(),
      mailbox_credential_id: credential.id,
      provider_profile_id: credential.provider_profile_id,
      email_address: credential.email_address,
      test_type: "mailbox_credential",
      status: passed ? "passed" : "failed",
      error: passed ? null : "One or more credential tests failed",
      metadata: results,
      tested_at: nowIso()
    })
    return NextResponse.json({ ok: true, data: { passed, results } })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Credential test failed" }, { status: 500 })
  }
}
