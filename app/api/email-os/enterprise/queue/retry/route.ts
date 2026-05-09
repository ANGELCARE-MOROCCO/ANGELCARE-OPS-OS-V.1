
import { NextRequest, NextResponse } from "next/server"
import { markJobForRetry } from "@/lib/email-os/enterprise/queue-engine"

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)

  if (!body || typeof body !== "object") {
    return NextResponse.json({ ok: false, error: "Invalid retry payload" }, { status: 400 })
  }

  const job = markJobForRetry(body as any)

  return NextResponse.json({
    ok: true,
    job,
    processedAt: new Date().toISOString()
  })
}
