import { NextResponse } from "next/server"
import {
  auditWindowsNodeEvent,
  getWindowsNodeRequestIp,
  requireWindowsNodeAdmin,
} from "@/app/api/opsos/windows-node/_shared"
import {
  buildWindowsNodeApiErrorFromBridgeResult,
  callWindowsBridgeAdmin,
} from "@/lib/opsos/windows-node"
import type { WindowsStorageInventory } from "@/lib/opsos/windows-node-types"

export const dynamic = "force-dynamic"

function modeFromUrl(url: URL) {
  return url.searchParams.get("mode") === "deep" ? "deep" : "summary"
}

export async function GET(request: Request) {
  const auth = await requireWindowsNodeAdmin(request)
  if (!auth.ok) return auth.response

  const url = new URL(request.url)
  const mode = modeFromUrl(url)
  const force = url.searchParams.get("force") === "1"
  const endpoint = `/admin/storage/inventory?mode=${mode}${force ? "&force=1" : ""}`

  const result = await callWindowsBridgeAdmin<WindowsStorageInventory>(endpoint, {}, {
    operator: auth.context.operator,
    requestIp: getWindowsNodeRequestIp(request),
  })

  if (!result.ok) {
    const error = buildWindowsNodeApiErrorFromBridgeResult(result, endpoint, "storage_inventory_failed")
    return NextResponse.json(error, {
      status: result.status,
      headers: { "cache-control": "no-store" },
    })
  }

  if (force || mode === "deep") {
    await auditWindowsNodeEvent({
      timestamp: new Date().toISOString(),
      actor: auth.context.operator,
      action: "windows_storage_inventory_scanned",
      target: "/opsos/infrastructure/windows-node#storage",
      result: result.data.scanStatus,
      reason: mode === "deep" ? "Analyse approfondie du stockage en lecture seule" : "Actualisation forcée de l’inventaire stockage",
      severity: result.data.limits.truncated ? "medium" : "info",
      metadataSummary: `mode=${mode} files=${result.data.limits.filesVisited} classified=${result.data.summary.classifiedBytes} readOnly=true`,
    })
  }

  return NextResponse.json(
    { ok: true, data: result.data },
    { headers: { "cache-control": "no-store" } },
  )
}
