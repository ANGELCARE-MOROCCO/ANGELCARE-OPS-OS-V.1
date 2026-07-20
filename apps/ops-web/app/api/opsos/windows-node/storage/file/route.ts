import { NextResponse } from "next/server"
import { getWindowsNodeRequestIp, requireWindowsNodeAdmin } from "@/app/api/opsos/windows-node/_shared"
import { auditWindowsNodeEvent } from "@/app/api/opsos/windows-node/_shared"
import { buildWindowsNodeApiErrorFromBridgeResult, callWindowsBridgeAdmin } from "@/lib/opsos/windows-node"
import type { WindowsStorageFileDossier } from "@/lib/opsos/windows-node-types"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const auth = await requireWindowsNodeAdmin(request)
  if (!auth.ok) return auth.response
  const url = new URL(request.url)
  const sourceId = (url.searchParams.get("sourceId") || "email_attachments").slice(0, 80)
  const relativePath = (url.searchParams.get("path") || "").slice(0, 1000)
  const hash = url.searchParams.get("hash") === "1"
  const endpoint = `/admin/storage/file?sourceId=${encodeURIComponent(sourceId)}&path=${encodeURIComponent(relativePath)}${hash ? "&hash=1" : ""}`
  const result = await callWindowsBridgeAdmin<WindowsStorageFileDossier>(endpoint, {}, {
    operator: auth.context.operator,
    requestIp: getWindowsNodeRequestIp(request),
  })
  if (!result.ok) {
    const error = buildWindowsNodeApiErrorFromBridgeResult(result, endpoint, "storage_file_dossier_failed")
    return NextResponse.json(error, { status: result.status, headers: { "cache-control": "no-store" } })
  }
  await auditWindowsNodeEvent({
    timestamp: new Date().toISOString(),
    actor: auth.context.operator,
    action: "windows_storage_file_inspected",
    target: "/opsos/infrastructure/windows-node#storage",
    result: "read_only",
    reason: "Consultation sécurisée d’un dossier de fichier Phase 2",
    severity: "info",
    metadataSummary: `source=${sourceId} path=${relativePath.slice(0, 180)} readOnly=true`,
  })
  return NextResponse.json({ ok: true, data: result.data }, { headers: { "cache-control": "no-store" } })
}
