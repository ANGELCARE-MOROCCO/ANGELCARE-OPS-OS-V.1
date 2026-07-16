import { NextResponse } from "next/server"
import { auditWindowsNodeEvent, getWindowsNodeRequestIp, requireWindowsNodeAdmin } from "@/app/api/opsos/windows-node/_shared"
import { buildWindowsNodeApiErrorResponse, callWindowsBridgeAdmin } from "@/lib/opsos/windows-node"
import type { MaintenanceModeState } from "@/lib/opsos/windows-node-types"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const auth = await requireWindowsNodeAdmin(request)
  if (!auth.ok) return auth.response

  const result = await callWindowsBridgeAdmin<MaintenanceModeState>("/admin/maintenance/status", {}, {
    operator: auth.context.operator,
    requestIp: getWindowsNodeRequestIp(request),
  })

  if (!result.ok) {
    return NextResponse.json(result, { status: result.status, headers: { "cache-control": "no-store" } })
  }

  return NextResponse.json({ ok: true, data: result.data }, { headers: { "cache-control": "no-store" } })
}

export async function POST(request: Request) {
  const auth = await requireWindowsNodeAdmin(request)
  if (!auth.ok) return auth.response

  const body = await request.json().catch(() => ({}))
  const mode = String(body?.mode || body?.action || "").trim().toLowerCase()
  const reason = String(body?.reason || "").trim()
  const expectedDuration = String(body?.expectedDuration || body?.duration || "").trim()
  const message = String(body?.message || "").trim()

  let endpointPath = ""
  if (mode === "enable") endpointPath = "/admin/maintenance/enable"
  else if (mode === "disable") endpointPath = "/admin/maintenance/disable"
  else if (mode === "extend") endpointPath = "/admin/maintenance/extend"

  if (!endpointPath) {
    return NextResponse.json(buildWindowsNodeApiErrorResponse({
      status: 400,
      errorName: "MaintenanceActionUnsupported",
      errorMessage: "Unsupported maintenance action",
      causeCode: "MAINTENANCE_ACTION_UNSUPPORTED",
      endpointPath: "/admin/maintenance",
    }), { status: 400, headers: { "cache-control": "no-store" } })
  }

  if (mode !== "disable" && !reason) {
    return NextResponse.json(buildWindowsNodeApiErrorResponse({
      status: 400,
      errorName: "ReasonRequired",
      errorMessage: "Maintenance reason is required",
      causeCode: "MAINTENANCE_REASON_REQUIRED",
      endpointPath,
    }), { status: 400, headers: { "cache-control": "no-store" } })
  }

  if (mode === "enable" && !expectedDuration) {
    return NextResponse.json(buildWindowsNodeApiErrorResponse({
      status: 400,
      errorName: "DurationRequired",
      errorMessage: "Maintenance expected duration is required",
      causeCode: "MAINTENANCE_DURATION_REQUIRED",
      endpointPath,
    }), { status: 400, headers: { "cache-control": "no-store" } })
  }

  const result = await callWindowsBridgeAdmin<MaintenanceModeState>(endpointPath, {
    method: "POST",
    body: JSON.stringify({
      reason,
      expectedDuration,
      message,
    }),
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
    action: mode === "enable" ? "windows_node_maintenance_enabled" : mode === "disable" ? "windows_node_maintenance_disabled" : "windows_node_maintenance_extended",
    target: "/opsos/infrastructure/windows-node",
    result: "ok",
    reason: reason || "Maintenance change",
    severity: mode === "disable" ? "low" : "medium",
    metadataSummary: `enabled=${result.data.enabled} duration=${result.data.expectedDuration}`,
  })

  return NextResponse.json({ ok: true, data: result.data }, { headers: { "cache-control": "no-store" } })
}

