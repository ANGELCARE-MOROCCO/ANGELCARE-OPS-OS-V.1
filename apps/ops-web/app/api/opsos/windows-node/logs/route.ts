import { NextResponse } from "next/server"
import { auditWindowsNodeEvent, getWindowsNodeRequestIp, requireWindowsNodeAdmin } from "@/app/api/opsos/windows-node/_shared"
import { callWindowsBridgeAdmin, buildWindowsNodeApiErrorFromBridgeResult, normalizeLines, normalizeWindowsNodeLogType } from "@/lib/opsos/windows-node"
import type { WindowsNodeLogType } from "@/lib/opsos/windows-node-types"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const auth = await requireWindowsNodeAdmin(request)
  if (!auth.ok) return auth.response

  const url = new URL(request.url)
  const type = normalizeWindowsNodeLogType(url.searchParams.get("type"))
  const lines = normalizeLines(url.searchParams.get("lines"), 100)
  const endpointPath = `/admin/logs/${type}?lines=${lines}`

  const result = await callWindowsBridgeAdmin<{ kind: WindowsNodeLogType; lines: unknown[]; returnedLines?: number; totalLines?: number }>(endpointPath, {}, {
    operator: auth.context.operator,
    requestIp: getWindowsNodeRequestIp(request),
  })

  if (!result.ok) {
    const error = buildWindowsNodeApiErrorFromBridgeResult(result, endpointPath, "logs_load_failed")
    return NextResponse.json(error, { status: result.status, headers: { "cache-control": "no-store" } })
  }

  await auditWindowsNodeEvent({
    timestamp: new Date().toISOString(),
    actor: auth.context.operator,
    action: "windows_node_logs_viewed",
    target: type,
    result: "ok",
    reason: `Viewed ${type} logs`,
    severity: "info",
    metadataSummary: `lines=${lines}`,
  })

  return NextResponse.json({ ok: true, data: result.data }, { headers: { "cache-control": "no-store" } })
}

