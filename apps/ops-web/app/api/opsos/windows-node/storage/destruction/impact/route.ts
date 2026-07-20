import { NextResponse } from "next/server"
import { getWindowsNodeRequestIp, requireWindowsNodeAdmin } from "@/app/api/opsos/windows-node/_shared"
import { analyzeDestructionEligibility } from "@/lib/opsos/storage-destruction"
import { buildWindowsNodeApiErrorFromBridgeResult, callWindowsBridgeAdmin } from "@/lib/opsos/windows-node"
import type { WindowsStorageDestructionImpact } from "@/lib/opsos/windows-node-types"

export const dynamic = "force-dynamic"
function clean(value: unknown) { return String(value ?? "").trim() }

export async function POST(request: Request) {
  const auth = await requireWindowsNodeAdmin(request)
  if (!auth.ok) return auth.response
  const body = await request.json().catch(() => ({}))
  const quarantineCaseId = clean(body.quarantineCaseId)
  if (!quarantineCaseId) return NextResponse.json({ ok: false, error: "quarantineCaseId is required" }, { status: 400 })
  try {
    const impact = await analyzeDestructionEligibility(quarantineCaseId)
    if (impact.quarantineLocationToken) {
      const endpoint = "/admin/storage/destruction/preflight"
      const bridge = await callWindowsBridgeAdmin<any>(endpoint, {
        method: "POST",
        body: JSON.stringify({ caseId: impact.quarantineCaseId, quarantineLocationToken: impact.quarantineLocationToken, expectedSha256: impact.originalSha256 }),
      }, { operator: auth.context.operator, requestIp: getWindowsNodeRequestIp(request) })
      if (!bridge.ok) {
        const error = buildWindowsNodeApiErrorFromBridgeResult(bridge, endpoint, "storage_destruction_preflight_failed")
        return NextResponse.json(error, { status: bridge.status })
      }
      const data: WindowsStorageDestructionImpact = {
        ...impact,
        eligible: impact.eligible && bridge.data?.eligible !== false,
        blockedReasons: [...impact.blockedReasons, ...(Array.isArray(bridge.data?.blockedReasons) ? bridge.data.blockedReasons : [])],
        immediateRecoverableBytes: Number(bridge.data?.immediateRecoverableBytes ?? impact.immediateRecoverableBytes),
        estimatedTotalRecoverableBytes: Number(bridge.data?.estimatedTotalRecoverableBytes ?? impact.estimatedTotalRecoverableBytes),
        copies: Array.isArray(bridge.data?.copies) ? bridge.data.copies : impact.copies,
      }
      return NextResponse.json({ ok: true, data }, { headers: { "cache-control": "no-store" } })
    }
    return NextResponse.json({ ok: true, data: impact }, { headers: { "cache-control": "no-store" } })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Destruction impact analysis failed" }, { status: 400 })
  }
}
