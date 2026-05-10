import { NextResponse } from "next/server"
import nodemailer from "nodemailer"
import { ImapFlow } from "imapflow"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import { makeEmailOSId, nowIso } from "@/lib/email-os-core/schema"

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const db = createEmailOSCoreDb()

    const { data: profile, error } = await db
      .from("email_os_core_provider_profiles")
      .select("*")
      .eq("id", body.providerProfileId)
      .single()

    if (error) throw error
    if (!profile) throw new Error("Provider profile not found")

    const results: Record<string, any> = {}

    if (!body.username || !body.password) {
      return NextResponse.json({ ok: false, error: "username and password are required" }, { status: 400 })
    }

    try {
      const transporter = nodemailer.createTransport({
        host: profile.smtp_host,
        port: Number(profile.smtp_port || 587),
        secure: Boolean(profile.smtp_secure),
        auth: { user: body.username, pass: body.password }
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
        auth: { user: body.username, pass: body.password }
      })
      await client.connect()
      await client.logout()
      results.imap = { ok: true }
    } catch (error) {
      results.imap = { ok: false, error: error instanceof Error ? error.message : "IMAP failed" }
    }

    const passed = Object.values(results).every((item: any) => item?.ok)

    await db.from("email_os_core_credential_tests").insert({
      id: makeEmailOSId(),
      mailbox_credential_id: null,
      provider_profile_id: profile.id,
      email_address: body.username,
      test_type: "provider_profile",
      status: passed ? "passed" : "failed",
      error: passed ? null : "One or more provider tests failed",
      metadata: results,
      tested_at: nowIso()
    })
    return NextResponse.json({ ok: true, data: { passed, results } })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Provider test failed" }, { status: 500 })
  }
}
