import { NextResponse } from "next/server"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"

export async function POST() {
  try {
    const db = createEmailOSCoreDb()

    const { data, error } = await db
      .from("email_os_core_queue")
      .update({
        status: "queued"
      })
      .eq("status", "failed")
      .select("*")

    if (error) throw error

    return NextResponse.json({
      ok: true,
      data: {
        requeued: data?.length || 0
      }
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Requeue failed"
      },
      { status: 500 }
    )
  }
}
