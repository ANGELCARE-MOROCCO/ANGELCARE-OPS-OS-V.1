import { NextResponse } from "next/server"
import { getWindowsNodeRequestIp, requireWindowsNodeAdmin } from "@/app/api/opsos/windows-node/_shared"
import { buildWindowsNodeApiErrorFromBridgeResult, callWindowsBridgeAdmin } from "@/lib/opsos/windows-node"
import type { WindowsStorageDuplicateInvestigation } from "@/lib/opsos/windows-node-types"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const auth = await requireWindowsNodeAdmin(request)
  if (!auth.ok) return auth.response
  const url = new URL(request.url)
  const hash = (url.searchParams.get("hash") || "").slice(0, 128)
  const endpoint = `/admin/storage/duplicates${hash ? `?hash=${encodeURIComponent(hash)}` : ""}`
  const result = await callWindowsBridgeAdmin<WindowsStorageDuplicateInvestigation>(endpoint, {}, {
    operator: auth.context.operator,
    requestIp: getWindowsNodeRequestIp(request),
  })
  if (!result.ok) {
    const error = buildWindowsNodeApiErrorFromBridgeResult(result, endpoint, "storage_duplicates_failed")
    return NextResponse.json(error, { status: result.status, headers: { "cache-control": "no-store" } })
  }
  return NextResponse.json({ ok: true, data: result.data }, { headers: { "cache-control": "no-store" } })
}
