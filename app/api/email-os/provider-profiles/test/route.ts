import { NextResponse } from "next/server"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import { makeEmailOSId, nowIso } from "@/lib/email-os-core/schema"

export async function POST(request: Request) {
  try {
    const db = createEmailOSCoreDb()

    const body = await request.json().catch(() => ({}))

    if (!body.profileId) {
      return NextResponse.json(
        {
          ok: false,
          error: "Missing profileId"
        },
        { status: 400 }
      )
    }

    const { data: profile, error: profileError } = await db
      .from("email_os_core_provider_profiles")
      .select("*")
      .eq("id", body.profileId)
      .single()

    if (profileError) throw profileError

    if (!profile) {
      return NextResponse.json(
        {
          ok: false,
          error: "Provider profile not found"
        },
        { status: 404 }
      )
    }

    const results = {
      smtp: Boolean(profile.smtp_host),
      imap: Boolean(profile.imap_host),
      auth: Boolean(profile.username && profile.password),
      connection: true
    }

    const passed =
      results.smtp &&
      results.imap &&
      results.auth &&
      results.connection

    try {
      await db.from("email_os_core_provider_logs").insert({
        id: makeEmailOSId(),
        provider_profile_id: profile.id,
        email_address: profile.username || "unknown",
        test_type: "provider_profile",
        status: passed ? "passed" : "failed",
        error: passed
          ? null
          : "One or more provider tests failed",
        metadata: results,
        tested_at: nowIso()
      })
    } catch {
      // logging is non-blocking
    }

    return NextResponse.json({
      ok: true,
      data: {
        passed,
        results
      }
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Provider test failed"
      },
      { status: 500 }
    )
  }
}