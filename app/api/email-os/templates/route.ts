import { NextResponse } from "next/server"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"

export async function GET() {
  try {
    const db = createEmailOSCoreDb()

    const { data, error } = await db
      .from("email_os_core_templates")
      .select("*")
      .order("category", { ascending: true })
      .order("name", { ascending: true })
      .limit(500)

    if (error) throw error

    return NextResponse.json({
      ok: true,
      data: data || []
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Templates load failed"
      },
      { status: 500 }
    )
  }
}
