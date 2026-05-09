
import { NextRequest, NextResponse } from "next/server"
import { evaluateSla } from "@/lib/email-os/enterprise/sla-engine"

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)

  if (!body?.rule || !body?.receivedAtIso) {
    return NextResponse.json({ ok: false, error: "Missing rule or receivedAtIso" }, { status: 400 })
  }

  return NextResponse.json({
    ok: true,
    evaluation: evaluateSla(body.rule, body.receivedAtIso)
  })
}
