import { NextResponse } from "next/server"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"

export async function GET(request: Request) {
  try {
    const db = createEmailOSCoreDb()
    const url = new URL(request.url)
    const mailboxId = url.searchParams.get("mailboxId")

    let query = db
      .from("email_os_core_inbox")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(250)

    if (mailboxId && mailboxId !== "all") {
      query = query.eq("mailbox_id", mailboxId)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({
      ok: true,
      data: data || []
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Inbox load failed"
      },
      { status: 500 }
    )
  }
}
