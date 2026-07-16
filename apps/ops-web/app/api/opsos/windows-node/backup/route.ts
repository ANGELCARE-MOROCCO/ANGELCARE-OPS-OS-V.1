import { NextResponse } from "next/server"
import { auditWindowsNodeEvent, getWindowsNodeRequestIp, requireWindowsNodeAdmin } from "@/app/api/opsos/windows-node/_shared"
import { buildWindowsNodeApiErrorResponse, callWindowsBridgeAdmin } from "@/lib/opsos/windows-node"

export const dynamic = "force-dynamic"

type BackupCreateResult = {
  backupId?: string
  timestamp?: string
  includedAssets?: Array<{ name?: string; present?: boolean; copied?: boolean }>
  missingAssets?: string[]
  warnings?: string[]
  manifestSummary?: string
}

export async function POST(request: Request) {
  const auth = await requireWindowsNodeAdmin(request)
  if (!auth.ok) return auth.response

  const body = await request.json().catch(() => ({}))
  const reason = String(body?.reason || "").trim()

  if (!reason) {
    return NextResponse.json(buildWindowsNodeApiErrorResponse({
      status: 400,
      errorName: "ReasonRequired",
      errorMessage: "Backup reason is required",
      causeCode: "BACKUP_REASON_REQUIRED",
      endpointPath: "/admin/backup/create",
    }), { status: 400, headers: { "cache-control": "no-store" } })
  }

  const result = await callWindowsBridgeAdmin<BackupCreateResult>("/admin/backup/create", {
    method: "POST",
    body: JSON.stringify({ reason }),
  }, {
    operator: auth.context.operator,
    requestIp: getWindowsNodeRequestIp(request),
  })

  if (!result.ok) {
    return NextResponse.json(result, { status: result.status, headers: { "cache-control": "no-store" } })
  }

  await auditWindowsNodeEvent({
    timestamp: new Date().toISOString(),
    actor: auth.context.operator,
    action: "windows_node_backup_created",
    target: result.data.backupId || "backup",
    result: "ok",
    reason,
    severity: "medium",
    metadataSummary: result.data.manifestSummary || "",
  })

  return NextResponse.json({ ok: true, data: result.data }, { headers: { "cache-control": "no-store" } })
}

