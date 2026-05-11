import { NextResponse } from "next/server"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"

export async function GET() {
  try {
    const db = createEmailOSCoreDb()

    const { data, error } = await db
      .from("email_os_core_provider_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100)

    if (error) throw error

    return NextResponse.json({
      ok: true,
      data: data || []
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Provider logs failed"
      },
      { status: 500 }
    )
  }
}
