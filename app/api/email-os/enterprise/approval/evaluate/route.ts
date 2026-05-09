
import { NextRequest, NextResponse } from "next/server"
import { evaluateApprovalPolicy } from "@/lib/email-os/enterprise/approval-engine"

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)

  if (!body?.policy) {
    return NextResponse.json({ ok: false, error: "Missing approval policy" }, { status: 400 })
  }

  return NextResponse.json({
    ok: true,
    decision: evaluateApprovalPolicy(body)
  })
}
