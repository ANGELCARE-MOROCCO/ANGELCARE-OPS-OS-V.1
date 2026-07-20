import { NextResponse } from "next/server"
import { auditWindowsNodeEvent, getWindowsNodeRequestIp, requireWindowsNodeAdmin } from "@/app/api/opsos/windows-node/_shared"
import { actorId } from "@/app/api/opsos/windows-node/storage/quarantine/_shared"
import { buildWindowsNodeApiErrorFromBridgeResult, callWindowsBridgeAdmin } from "@/lib/opsos/windows-node"
import { loadQuarantineCase, recordQuarantineEvent, updateQuarantineCase, updateQuarantineItemStatus, updateStorageRecordForQuarantine } from "@/lib/opsos/storage-quarantine"
import type { WindowsStorageQuarantineJobResult } from "@/lib/opsos/windows-node-types"

export const dynamic = "force-dynamic"

export async function POST(request: Request, { params }: { params: Promise<{ caseId: string }> }) {
  const auth = await requireWindowsNodeAdmin(request)
  if (!auth.ok) return auth.response
  const { caseId } = await params
  const current = await loadQuarantineCase(caseId).catch(() => null)
  if (!current) return NextResponse.json({ ok: false, error: "Quarantine case not found" }, { status: 404 })
  if (current.status !== "approved") return NextResponse.json({ ok: false, error: "Case must be approved before execution" }, { status: 409 })
  const actor = actorId(auth.context.user, auth.context.operator)
  await updateQuarantineCase(caseId, { status: "executing", executed_by: actor, last_error: null })
  await recordQuarantineEvent(caseId, "quarantine_execution_started", "executing", actor, current.reason, { mode: current.quarantineMode })
  const endpoint = "/admin/storage/quarantine/execute"
  const result = await callWindowsBridgeAdmin<WindowsStorageQuarantineJobResult>(endpoint, {
    method: "POST",
    body: JSON.stringify({
      caseId: current.id, caseNumber: current.caseNumber, mode: current.quarantineMode,
      originalLocationToken: current.originalLocationToken, expectedSha256: current.originalSha256,
      reason: current.reason, retentionUntil: current.retentionUntil, actor,
      fileId: current.fileId, mailboxId: current.mailboxId, entityType: current.entityType,
      evidence: { impact: current.impactSnapshot, references: current.referencesSnapshot },
    }),
  }, { operator: auth.context.operator, requestIp: getWindowsNodeRequestIp(request) })
  if (!result.ok) {
    const error = buildWindowsNodeApiErrorFromBridgeResult(result, endpoint, "storage_quarantine_execute_failed")
    if (!error) return NextResponse.json({ ok: false, error: result.errorMessage }, { status: result.status })
    await updateQuarantineCase(caseId, { status: "failed", last_error: error.errorMessage })
    await recordQuarantineEvent(caseId, "quarantine_execution_failed", "failed", actor, error.errorMessage, { bridgeStatus: result.status })
    return NextResponse.json(error, { status: result.status })
  }
  await updateQuarantineCase(caseId, { status: "verifying" })
  await recordQuarantineEvent(caseId, "quarantine_integrity_verification", "verifying", actor, "Verifying hash and preserved references", { originalSha256: current.originalSha256, resultingSha256: result.data.resultingSha256 })
  await updateStorageRecordForQuarantine({ fileId: current.fileId, caseId: current.id, caseNumber: current.caseNumber, status: "quarantined", reason: current.reason, actor, quarantineMode: current.quarantineMode, quarantineLocationToken: result.data.quarantineLocationToken })
  await updateQuarantineItemStatus(caseId, "quarantined", { quarantineMode: current.quarantineMode, quarantineLocationToken: result.data.quarantineLocationToken, resultingSha256: result.data.resultingSha256 })
  const updated = await updateQuarantineCase(caseId, { status: "quarantined", quarantine_location_token: result.data.quarantineLocationToken, actual_recovered_bytes: result.data.actualRecoveredBytes, last_error: null })
  await recordQuarantineEvent(caseId, "quarantine_completed", "quarantined", actor, current.reason, { job: result.data })
  await auditWindowsNodeEvent({ timestamp: new Date().toISOString(), actor: auth.context.operator, action: "windows_storage_object_quarantined", target: "/opsos/infrastructure/windows-node#storage", result: "quarantined", reason: current.reason, severity: "high", metadataSummary: `case=${current.caseNumber} mode=${current.quarantineMode} recovered=${result.data.actualRecoveredBytes} reversible=true` })
  return NextResponse.json({ ok: true, data: { case: updated, job: result.data } }, { headers: { "cache-control": "no-store" } })
}
