import { governRoute } from '@/lib/runtime/governor/route'
import { NextResponse } from "next/server"
import { auditWindowsNodeEvent, getWindowsNodeRequestIp, requireWindowsNodeAdmin } from "@/app/api/opsos/windows-node/_shared"
import { buildWindowsNodeApiErrorFromBridgeResult, callWindowsBridgeAdmin } from "@/lib/opsos/windows-node"
import type { WindowsNodeStatus } from "@/lib/opsos/windows-node-types"


type SmtpTestResult = {
  host?: string
  port?: number
  secure?: boolean
  user?: string
  status?: string
  message?: string
  latencyMs?: number
  verify?: boolean
  error?: string
}

async function GET__angelcareGovernedImpl(request: Request) {
  const auth = await requireWindowsNodeAdmin(request)
  if (!auth.ok) return auth.response

  const result = await callWindowsBridgeAdmin<WindowsNodeStatus>("/admin/status", {}, {
    operator: auth.context.operator,
    requestIp: getWindowsNodeRequestIp(request),
  })

  if (!result.ok) {
    const error = buildWindowsNodeApiErrorFromBridgeResult(result, "/admin/status", "smtp_status_failed")
    return NextResponse.json(error, { status: result.status, headers: { "cache-control": "no-store" } })
  }

  return NextResponse.json({ ok: true, data: result.data.smtp }, { headers: { "cache-control": "no-store" } })
}

async function POST__angelcareGovernedImpl(request: Request) {
  const auth = await requireWindowsNodeAdmin(request)
  if (!auth.ok) return auth.response

  const result = await callWindowsBridgeAdmin<SmtpTestResult>("/admin/test/smtp", {
    method: "POST",
    body: JSON.stringify({ reason: "Validate SMTP connectivity" }),
  }, {
    operator: auth.context.operator,
    requestIp: getWindowsNodeRequestIp(request),
  })

  if (!result.ok) {
    const error = buildWindowsNodeApiErrorFromBridgeResult(result, "/admin/test/smtp", "smtp_test_failed")
    return NextResponse.json(error, { status: result.status, headers: { "cache-control": "no-store" } })
  }

  await auditWindowsNodeEvent({
    timestamp: new Date().toISOString(),
    actor: auth.context.operator,
    action: "windows_node_smtp_test",
    target: "smtp-auth.menara.ma:587",
    result: "ok",
    reason: "Validate SMTP connectivity",
    severity: result.data.status === "failed" ? "high" : "medium",
    metadataSummary: `status=${result.data.status || "unknown"} latencyMs=${result.data.latencyMs ?? ""}`,
  })

  return NextResponse.json({ ok: true, data: result.data }, { headers: { "cache-control": "no-store" } })
}

export const GET = governRoute(
  {
    workloadClass: 'provider',
    operation: 'GET:/api/opsos/windows-node/smtp-test',
  },
  GET__angelcareGovernedImpl,
)

export const POST = governRoute(
  {
    workloadClass: 'provider',
    operation: 'POST:/api/opsos/windows-node/smtp-test',
  },
  POST__angelcareGovernedImpl,
)
