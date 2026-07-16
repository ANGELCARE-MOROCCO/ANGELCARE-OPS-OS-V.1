import { NextResponse } from "next/server"
import { auditWindowsNodeEvent, getWindowsNodeRequestIp, requireWindowsNodeAdmin } from "@/app/api/opsos/windows-node/_shared"
import { buildWindowsNodeApiErrorResponse, callWindowsBridgeAdmin, normalizeLines } from "@/lib/opsos/windows-node"
import type { WindowsAuditEvent } from "@/lib/opsos/windows-node-types"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const auth = await requireWindowsNodeAdmin(request)
  if (!auth.ok) return auth.response

  const url = new URL(request.url)
  const lines = normalizeLines(url.searchParams.get("lines"), 100)
  const result = await callWindowsBridgeAdmin<{ lines: WindowsAuditEvent[]; returnedLines?: number; totalLines?: number }>(`/admin/logs/audit?lines=${lines}`, {}, {
    operator: auth.context.operator,
    requestIp: getWindowsNodeRequestIp(request),
  })

  if (!result.ok) {
    return NextResponse.json(buildWindowsNodeApiErrorResponse({
      status: result.status,
      errorName: result.errorName,
      errorMessage: result.errorMessage,
      causeCode: result.cause?.code || "AUDIT_LOAD_FAILED",
      causeDetail: result.cause?.detail || "",
      endpointPath: "/admin/logs/audit",
      recommendedAction: "Verify bridge admin access and audit log availability.",
    }), { status: result.status, headers: { "cache-control": "no-store" } })
  }

  await auditWindowsNodeEvent({
    timestamp: new Date().toISOString(),
    actor: auth.context.operator,
    action: "windows_node_audit_viewed",
    target: "/opsos/infrastructure/windows-node",
    result: "ok",
    reason: "Audit log viewed",
    severity: "info",
    metadataSummary: `lines=${lines}`,
  })

  return NextResponse.json({ ok: true, data: result.data }, { headers: { "cache-control": "no-store" } })
}

export async function POST(request: Request) {
  const auth = await requireWindowsNodeAdmin(request)
  if (!auth.ok) return auth.response

  const body = await request.json().catch(() => ({}))
  const event = body?.event && typeof body.event === "object" ? body.event : body
  const action = String(event?.action || "").trim()
  const reason = String(event?.reason || "").trim()

  if (!action) {
    return NextResponse.json(buildWindowsNodeApiErrorResponse({
      status: 400,
      errorName: "AuditEventInvalid",
      errorMessage: "Audit event action is required",
      causeCode: "AUDIT_EVENT_INVALID",
      endpointPath: "/admin/audit/event",
      recommendedAction: "Provide a valid audit action.",
    }), { status: 400, headers: { "cache-control": "no-store" } })
  }

  const result = await callWindowsBridgeAdmin<WindowsAuditEvent>("/admin/audit/event", {
    method: "POST",
    body: JSON.stringify({ event }),
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
    action: "windows_node_audit_written",
    target: action,
    result: "ok",
    reason: reason || "Audit event posted",
    severity: "info",
    metadataSummary: `posted=${action}`,
  })

  return NextResponse.json({ ok: true, data: result.data }, { headers: { "cache-control": "no-store" } })
}
