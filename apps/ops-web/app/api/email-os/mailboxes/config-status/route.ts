import { NextResponse } from "next/server"
import { listEmailOSMailboxConfigStatusFromDb } from "@/lib/email-os-core/multi-mailbox-resolver"

export async function GET() {
  try {
    const data = await listEmailOSMailboxConfigStatusFromDb()

    return NextResponse.json({
      ok: true,
      data: {
        providerMode: process.env.EMAIL_PROVIDER_MODE || "multi_mailbox_enterprise",
        ...data
      }
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to load mailbox config status"
      },
      { status: 500 }
    )
  }
}
