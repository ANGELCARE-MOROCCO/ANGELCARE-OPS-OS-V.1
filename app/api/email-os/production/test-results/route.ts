import { NextResponse } from "next/server"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import { makeEmailOSId, nowIso } from "@/lib/email-os-core/schema"
import { EMAIL_OS_PRODUCTION_QA_MANIFEST } from "@/lib/email-os-core/production-qa-manifest"

export async function GET() {
  try {
    const db = createEmailOSCoreDb()
    const { data, error } = await db
      .from("email_os_core_test_case_results")
      .select("*")
      .order("tested_at", { ascending: false })
      .limit(300)

    if (error) throw error
    return NextResponse.json({ ok: true, data: data || [] })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Failed to load test results" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const db = createEmailOSCoreDb()

    const row = {
      id: makeEmailOSId(),
      session_id: body.sessionId || null,
      area: body.area || "manual",
      test_key: body.testKey || "manual_test",
      test_label: body.testLabel || "Manual QA test",
      status: body.status || "passed",
      severity: body.severity || "normal",
      notes: body.notes || null,
      evidence: body.evidence || {},
      tested_at: nowIso()
    }

    const { data, error } = await db.from("email_os_core_test_case_results").insert(row).select("*").single()
    if (error) throw error

    return NextResponse.json({ ok: true, data })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Failed to record test result" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const sessionId = body.sessionId || null
    const db = createEmailOSCoreDb()

    const rows = EMAIL_OS_PRODUCTION_QA_MANIFEST.map((item) => ({
      id: makeEmailOSId(),
      session_id: sessionId,
      area: item.area,
      test_key: item.key,
      test_label: item.label,
      status: "pending",
      severity: item.severity,
      notes: null,
      evidence: {},
      tested_at: nowIso()
    }))

    const { data, error } = await db.from("email_os_core_test_case_results").insert(rows).select("*")
    if (error) throw error

    return NextResponse.json({ ok: true, data: data || [] })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Failed to seed QA manifest" }, { status: 500 })
  }
}
