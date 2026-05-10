import { NextResponse } from "next/server"
import { validateComposePayload } from "@/lib/email-os-core/validation"
import { checkEmailOSRateLimit } from "@/lib/email-os-core/rate-limit"
import { getEmailOSRoleFromRequest, canExecuteEmailOSAction } from "@/lib/email-os-core/role-guard"

export async function POST(request: Request) {
  const role = getEmailOSRoleFromRequest(request)

  if (!canExecuteEmailOSAction(role, "send")) {
    return NextResponse.json({ ok: false, error: "You do not have permission to send Email-OS messages" }, { status: 403 })
  }

  const limit = checkEmailOSRateLimit(`validated-send:${role}`, 30, 60_000)
  if (!limit.ok) {
    return NextResponse.json({ ok: false, error: "Rate limit exceeded" }, { status: 429 })
  }

  const body = await request.json().catch(() => ({}))
  const validation = validateComposePayload(body)

  if (!validation.ok) {
    return NextResponse.json({ ok: false, error: "Invalid compose payload", errors: validation.errors }, { status: 400 })
  }

  const url = new URL(request.url)
  const sendUrl = `${url.origin}/api/email-os/send`

  const response = await fetch(sendUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(validation.data)
  })

  const json = await response.json()
  return NextResponse.json(json, { status: response.status })
}
