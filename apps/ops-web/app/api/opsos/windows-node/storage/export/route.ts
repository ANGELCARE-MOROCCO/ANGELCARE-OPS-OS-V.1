import { NextResponse } from "next/server"
import { auditWindowsNodeEvent, getWindowsNodeRequestIp, requireWindowsNodeAdmin } from "@/app/api/opsos/windows-node/_shared"
import { buildWindowsNodeApiErrorFromBridgeResult, callWindowsBridgeAdmin } from "@/lib/opsos/windows-node"
import type { WindowsStorageInventory } from "@/lib/opsos/windows-node-types"

export const dynamic = "force-dynamic"

function csvCell(value: unknown) {
  const text = String(value ?? "")
  return `"${text.replaceAll('"', '""')}"`
}

export async function GET(request: Request) {
  const auth = await requireWindowsNodeAdmin(request)
  if (!auth.ok) return auth.response
  const url = new URL(request.url)
  const format = url.searchParams.get("format") === "json" ? "json" : "csv"
  const endpoint = "/admin/storage/inventory?mode=deep"
  const result = await callWindowsBridgeAdmin<WindowsStorageInventory>(endpoint, {}, {
    operator: auth.context.operator,
    requestIp: getWindowsNodeRequestIp(request),
  })
  if (!result.ok) {
    const error = buildWindowsNodeApiErrorFromBridgeResult(result, endpoint, "storage_export_failed")
    return NextResponse.json(error, { status: result.status, headers: { "cache-control": "no-store" } })
  }

  await auditWindowsNodeEvent({
    timestamp: new Date().toISOString(),
    actor: auth.context.operator,
    action: "windows_storage_inventory_exported",
    target: "/opsos/infrastructure/windows-node#storage",
    result: "read_only",
    reason: `Export d’investigation stockage Phase 2 (${format})`,
    severity: "info",
    metadataSummary: `format=${format} files=${result.data.limits.filesVisited} readOnly=true`,
  })

  const stamp = new Date().toISOString().replace(/[:.]/g, "-")
  if (format === "json") {
    return new NextResponse(JSON.stringify({ phase: 2, readOnly: true, inventory: result.data }, null, 2), {
      headers: {
        "content-type": "application/json; charset=utf-8",
        "content-disposition": `attachment; filename="angelcare-storage-investigation-${stamp}.json"`,
        "cache-control": "no-store",
      },
    })
  }

  const headers = ["source", "source_label", "root_alias", "relative_path", "filename", "size_bytes", "file_type", "mailbox_id", "direction", "entity_type", "entity_id", "reference_state", "sha256_hash", "modified_at"]
  const rows = result.data.largestFiles.map((file) => [
    file.sourceId,
    file.sourceLabel,
    file.rootAlias,
    file.relativePath,
    file.filename,
    file.sizeBytes,
    file.fileType,
    file.mailboxId || "",
    file.direction || "",
    file.entityType || "",
    file.entityId || "",
    file.referenceState || "",
    file.sha256Hash || "",
    file.modifiedAt || "",
  ])
  const csv = [headers.map(csvCell).join(","), ...rows.map((row) => row.map(csvCell).join(","))].join("\n")
  return new NextResponse(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="angelcare-storage-investigation-${stamp}.csv"`,
      "cache-control": "no-store",
    },
  })
}
