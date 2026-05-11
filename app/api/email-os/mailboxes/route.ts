import { NextResponse } from "next/server"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"

export async function GET() {
  try {
    const db = createEmailOSCoreDb()

    const { data, error } = await db
      .from("email_os_core_mailboxes")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) throw error

    return NextResponse.json({
      ok: true,
      data: data || []
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Mailbox load failed"
      },
      { status: 500 }
    )
  }
}
