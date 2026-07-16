import { NextResponse } from "next/server"
import { auditWindowsNodeEvent, getWindowsNodeRequestIp, requireWindowsNodeAdmin } from "@/app/api/opsos/windows-node/_shared"
import { buildWindowsNodeApiErrorFromBridgeResult, callWindowsBridgeAdmin } from "@/lib/opsos/windows-node"
import type { WindowsNetworkDiagnostic } from "@/lib/opsos/windows-node-types"

export const dynamic = "force-dynamic"

async function runDiagnostic(request: Request) {
  const auth = await requireWindowsNodeAdmin(request)
  if (!auth.ok) return auth.response

  const result = await callWindowsBridgeAdmin<WindowsNetworkDiagnostic>("/admin/test/network", {
    method: "POST",
    body: JSON.stringify({ reason: "Run network diagnostic" }),
  }, {
    operator: auth.context.operator,
    requestIp: getWindowsNodeRequestIp(request),
  })

  if (!result.ok) {
    const error = buildWindowsNodeApiErrorFromBridgeResult(result, "/admin/test/network", "network_diagnostic_failed")
    return NextResponse.json(error, { status: result.status, headers: { "cache-control": "no-store" } })
  }

  await auditWindowsNodeEvent({
    timestamp: new Date().toISOString(),
    actor: auth.context.operator,
    action: "windows_node_network_diagnostic",
    target: "/opsos/infrastructure/windows-node",
    result: "ok",
    reason: "Network diagnostic",
    severity: result.data.status === "critical" ? "high" : "medium",
    metadataSummary: `classification=${result.data.classification} recommended=${result.data.recommendedAction}`,
  })

  return NextResponse.json({ ok: true, data: result.data }, { headers: { "cache-control": "no-store" } })
}

export async function GET(request: Request) {
  return runDiagnostic(request)
}

export async function POST(request: Request) {
  return runDiagnostic(request)
}

