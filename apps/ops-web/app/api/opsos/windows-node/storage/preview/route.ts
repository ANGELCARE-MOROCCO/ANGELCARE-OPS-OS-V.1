import { NextResponse } from "next/server"
import { getWindowsNodeRequestIp, requireWindowsNodeAdmin } from "@/app/api/opsos/windows-node/_shared"
import { buildWindowsNodeApiErrorFromBridgeResult, callWindowsBridgeAdmin } from "@/lib/opsos/windows-node"
import type { WindowsStoragePreviewResult } from "@/lib/opsos/windows-node-types"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const auth = await requireWindowsNodeAdmin(request)
  if (!auth.ok) return auth.response
  const url = new URL(request.url)
  const sourceId = (url.searchParams.get("sourceId") || "email_attachments").slice(0, 80)
  const relativePath = (url.searchParams.get("path") || "").slice(0, 1000)
  const endpoint = `/admin/storage/preview?sourceId=${encodeURIComponent(sourceId)}&path=${encodeURIComponent(relativePath)}`
  const result = await callWindowsBridgeAdmin<WindowsStoragePreviewResult>(endpoint, {}, {
    operator: auth.context.operator,
    requestIp: getWindowsNodeRequestIp(request),
  })
  if (!result.ok) {
    const error = buildWindowsNodeApiErrorFromBridgeResult(result, endpoint, "storage_preview_failed")
    return NextResponse.json(error, { status: result.status, headers: { "cache-control": "no-store" } })
  }
  return NextResponse.json({ ok: true, data: result.data }, { headers: { "cache-control": "private, no-store" } })
}
