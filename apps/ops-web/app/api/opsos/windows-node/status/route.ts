import { NextResponse } from "next/server"
import { auditWindowsNodeEvent, getWindowsNodeRequestIp, requireWindowsNodeAdmin } from "@/app/api/opsos/windows-node/_shared"
import { callWindowsBridgeAdmin, buildWindowsNodeApiErrorFromBridgeResult } from "@/lib/opsos/windows-node"
import type { WindowsNodeStatus } from "@/lib/opsos/windows-node-types"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const auth = await requireWindowsNodeAdmin(request)
  if (!auth.ok) return auth.response

  const result = await callWindowsBridgeAdmin<WindowsNodeStatus>("/admin/status", {}, {
    operator: auth.context.operator,
    requestIp: getWindowsNodeRequestIp(request),
  })

  if (!result.ok) {
    const error = buildWindowsNodeApiErrorFromBridgeResult(result, "/admin/status", "status_refresh_failed")
    return NextResponse.json(error, { status: result.status, headers: { "cache-control": "no-store" } })
  }

  await auditWindowsNodeEvent({
    timestamp: new Date().toISOString(),
    actor: auth.context.operator,
    action: "windows_node_status_refreshed",
    target: "/opsos/infrastructure/windows-node",
    result: "ok",
    reason: "Status refresh",
    severity: "info",
    metadataSummary: `classification=${result.data.classification} status=${result.data.status}`,
  })

  return NextResponse.json({ ok: true, data: result.data }, { headers: { "cache-control": "no-store" } })
}
