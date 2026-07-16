import { NextResponse } from "next/server"
import { auditWindowsNodeEvent, getWindowsNodeRequestIp, requireWindowsNodeAdmin } from "@/app/api/opsos/windows-node/_shared"
import { buildWindowsNodeApiErrorResponse, callWindowsBridgeAdmin } from "@/lib/opsos/windows-node"

export const dynamic = "force-dynamic"

type ProofSendResult = {
  messageId?: string
  accepted?: string[]
  rejected?: string[]
  response?: string
  latencyMs?: number
  transport?: string
  from?: string
  to?: string
}

export async function POST(request: Request) {
  const auth = await requireWindowsNodeAdmin(request)
  if (!auth.ok) return auth.response

  const body = await request.json().catch(() => ({}))
  const toEmail = String(body?.toEmail || "").trim()
  const subject = String(body?.subject || "").trim()
  const text = String(body?.text || "").trim()
  const reason = String(body?.reason || "").trim()

  if (!toEmail || !text || !reason) {
    return NextResponse.json(buildWindowsNodeApiErrorResponse({
      status: 400,
      errorName: "ProofSendInvalid",
      errorMessage: "toEmail, text, and reason are required",
      causeCode: "PROOF_SEND_INVALID",
      endpointPath: "/admin/test/send",
    }), { status: 400, headers: { "cache-control": "no-store" } })
  }

  const result = await callWindowsBridgeAdmin<ProofSendResult>("/admin/test/send", {
    method: "POST",
    body: JSON.stringify({ toEmail, subject, text, reason }),
  }, {
    operator: auth.context.operator,
    requestIp: getWindowsNodeRequestIp(request),
  })

  if (!result.ok) {
    return NextResponse.json(result, { status: result.status, headers: { "cache-control": "no-store" } })
  }

  await auditWindowsNodeEvent({
    timestamp: new Date().toISOString(),
    actor: auth.context.operator,
    action: "windows_node_proof_send",
    target: toEmail,
    result: "ok",
    reason,
    severity: "medium",
    metadataSummary: `messageId=${result.data.messageId || ""} accepted=${(result.data.accepted || []).length}`,
  })

  return NextResponse.json({ ok: true, data: result.data }, { headers: { "cache-control": "no-store" } })
}

