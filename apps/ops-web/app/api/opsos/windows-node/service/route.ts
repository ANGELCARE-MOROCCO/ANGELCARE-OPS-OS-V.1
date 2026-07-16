import { NextResponse } from "next/server"
import { auditWindowsNodeEvent, getWindowsNodeRequestIp, requireWindowsNodeAdmin } from "@/app/api/opsos/windows-node/_shared"
import { buildWindowsNodeApiErrorResponse, callWindowsBridgeAdmin } from "@/lib/opsos/windows-node"
import type { WindowsNodeActionResult } from "@/lib/opsos/windows-node-types"

export const dynamic = "force-dynamic"

const ALLOWED_SERVICES = new Set(["angelcare-email-bridge", "angelcare-caddy"])
const ALLOWED_ACTIONS = new Set(["start", "stop", "restart"])

export async function POST(request: Request) {
  const auth = await requireWindowsNodeAdmin(request)
  if (!auth.ok) return auth.response

  const body = await request.json().catch(() => ({}))
  const serviceName = String(body?.serviceName || body?.service || "").trim()
  const action = String(body?.action || "").trim()
  const reason = String(body?.reason || "").trim()
  const confirmation = String(body?.confirmation || "").trim()

  if (!ALLOWED_SERVICES.has(serviceName)) {
    return NextResponse.json(buildWindowsNodeApiErrorResponse({
      status: 400,
      errorName: "ServiceUnsupported",
      errorMessage: "Unsupported service",
      causeCode: "SERVICE_UNSUPPORTED",
      endpointPath: "/admin/service",
      recommendedAction: "Use angelcare-email-bridge or angelcare-caddy only.",
    }), { status: 400, headers: { "cache-control": "no-store" } })
  }

  if (!ALLOWED_ACTIONS.has(action)) {
    return NextResponse.json(buildWindowsNodeApiErrorResponse({
      status: 400,
      errorName: "ServiceActionUnsupported",
      errorMessage: "Unsupported service action",
      causeCode: "SERVICE_ACTION_UNSUPPORTED",
      endpointPath: "/admin/service",
    }), { status: 400, headers: { "cache-control": "no-store" } })
  }

  if (!reason) {
    return NextResponse.json(buildWindowsNodeApiErrorResponse({
      status: 400,
      errorName: "ReasonRequired",
      errorMessage: "Action reason is required",
      causeCode: "REASON_REQUIRED",
      endpointPath: "/admin/service",
    }), { status: 400, headers: { "cache-control": "no-store" } })
  }

  if (!confirmation) {
    return NextResponse.json(buildWindowsNodeApiErrorResponse({
      status: 400,
      errorName: "ConfirmationRequired",
      errorMessage: "Action confirmation is required",
      causeCode: "CONFIRMATION_REQUIRED",
      endpointPath: "/admin/service",
    }), { status: 400, headers: { "cache-control": "no-store" } })
  }

  const result = await callWindowsBridgeAdmin<WindowsNodeActionResult>(`/admin/service/${action}`, {
    method: "POST",
    body: JSON.stringify({ service: serviceName, confirmation, reason }),
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
    action: `windows_node_service_${action}`,
    target: serviceName,
    result: "ok",
    reason,
    severity: action === "stop" ? "high" : "medium",
    metadataSummary: `service=${serviceName} action=${action}`,
  })

  return NextResponse.json({ ok: true, data: result.data }, { headers: { "cache-control": "no-store" } })
}

