import { NextResponse } from "next/server"
import { getWindowsNodeRequestIp, requireWindowsNodeAdmin } from "@/app/api/opsos/windows-node/_shared"
import { buildWindowsNodeApiErrorFromBridgeResult, callWindowsBridgeAdmin } from "@/lib/opsos/windows-node"
import type { WindowsStorageBrowseResult } from "@/lib/opsos/windows-node-types"

export const dynamic = "force-dynamic"

function bounded(value: string | null, fallback = 150) {
  const parsed = Number(value || fallback)
  if (!Number.isFinite(parsed)) return fallback
  return Math.max(1, Math.min(200, Math.floor(parsed)))
}

export async function GET(request: Request) {
  const auth = await requireWindowsNodeAdmin(request)
  if (!auth.ok) return auth.response
  const url = new URL(request.url)
  const params = new URLSearchParams()
  params.set("sourceId", (url.searchParams.get("sourceId") || "email_attachments").slice(0, 80))
  params.set("path", (url.searchParams.get("path") || ".").slice(0, 800))
  const query = (url.searchParams.get("query") || "").slice(0, 160)
  if (query) params.set("query", query)
  if (query || url.searchParams.get("recursive") === "1") params.set("recursive", "1")
  params.set("limit", String(bounded(url.searchParams.get("limit"))))
  params.set("cursor", String(Math.max(0, Number(url.searchParams.get("cursor") || 0))))
  const endpoint = `/admin/storage/browse?${params.toString()}`
  const result = await callWindowsBridgeAdmin<WindowsStorageBrowseResult>(endpoint, {}, {
    operator: auth.context.operator,
    requestIp: getWindowsNodeRequestIp(request),
  })
  if (!result.ok) {
    const error = buildWindowsNodeApiErrorFromBridgeResult(result, endpoint, "storage_browse_failed")
    return NextResponse.json(error, { status: result.status, headers: { "cache-control": "no-store" } })
  }
  return NextResponse.json({ ok: true, data: result.data }, { headers: { "cache-control": "no-store" } })
}
