import { NextResponse } from "next/server"
import { auditWindowsNodeEvent, getWindowsNodeRequestIp, requireWindowsNodeAdmin } from "@/app/api/opsos/windows-node/_shared"
import { actorId } from "@/app/api/opsos/windows-node/storage/quarantine/_shared"
import { buildWindowsNodeApiErrorFromBridgeResult, callWindowsBridgeAdmin } from "@/lib/opsos/windows-node"
import { createRestoreJob, loadQuarantineCase, recordQuarantineEvent, updateQuarantineCase, updateQuarantineItemStatus, updateRestoreJob, updateStorageRecordForQuarantine } from "@/lib/opsos/storage-quarantine"
import type { WindowsStorageQuarantineJobResult } from "@/lib/opsos/windows-node-types"

export const dynamic = "force-dynamic"
function clean(value: unknown) { return String(value ?? "").trim() }

export async function POST(request: Request, { params }: { params: Promise<{ caseId: string }> }) {
  const auth = await requireWindowsNodeAdmin(request)
  if (!auth.ok) return auth.response
  const { caseId } = await params
  const body = await request.json().catch(() => ({}))
  const reason = clean(body.reason).slice(0, 1000) || "Restore requested by authorized infrastructure administrator"
  const current = await loadQuarantineCase(caseId).catch(() => null)
  if (!current) return NextResponse.json({ ok: false, error: "Quarantine case not found" }, { status: 404 })
  if (current.status !== "quarantined") return NextResponse.json({ ok: false, error: "Only quarantined cases can be restored" }, { status: 409 })
  if (!current.quarantineLocationToken) return NextResponse.json({ ok: false, error: "Quarantine location token is missing" }, { status: 409 })
  const actor = actorId(auth.context.user, auth.context.operator)
  const restoreJob = await createRestoreJob({ caseId, actor, reason, originalSha256: current.originalSha256 })
  await updateQuarantineCase(caseId, { status: "restore_requested", last_error: null })
  await recordQuarantineEvent(caseId, "restore_requested", "restore_requested", actor, reason, { restoreJobId: restoreJob.id })
  await updateQuarantineCase(caseId, { status: "restoring" })
  await updateRestoreJob(restoreJob.id, { status: "restoring", started_at: new Date().toISOString() })
  await recordQuarantineEvent(caseId, "restore_started", "restoring", actor, reason, { restoreJobId: restoreJob.id })
  const endpoint = "/admin/storage/quarantine/restore"
  const result = await callWindowsBridgeAdmin<WindowsStorageQuarantineJobResult>(endpoint, {
    method: "POST",
    body: JSON.stringify({ caseId: current.id, quarantineLocationToken: current.quarantineLocationToken, actor, fileId: current.fileId, mailboxId: current.mailboxId, entityType: current.entityType }),
  }, { operator: auth.context.operator, requestIp: getWindowsNodeRequestIp(request) })
  if (!result.ok) {
    const error = buildWindowsNodeApiErrorFromBridgeResult(result, endpoint, "storage_quarantine_restore_failed")
    if (!error) return NextResponse.json({ ok: false, error: result.errorMessage }, { status: result.status })
    await updateQuarantineCase(caseId, { status: "quarantined", last_error: error.errorMessage })
    await updateRestoreJob(restoreJob.id, { status: "failed", last_error: error.errorMessage, completed_at: new Date().toISOString() })
    await recordQuarantineEvent(caseId, "restore_failed", "quarantined", actor, error.errorMessage, { bridgeStatus: result.status, restoreJobId: restoreJob.id })
    return NextResponse.json(error, { status: result.status })
  }
  await updateRestoreJob(restoreJob.id, { status: "verifying", restored_sha256: result.data.resultingSha256, result: result.data })
  await updateStorageRecordForQuarantine({ fileId: current.fileId, caseId: current.id, caseNumber: current.caseNumber, status: "active", reason, actor })
  await updateQuarantineItemStatus(caseId, "restored", { restoredRelativePath: result.data.restoredRelativePath, resultingSha256: result.data.resultingSha256 })
  const updated = await updateQuarantineCase(caseId, { status: "restored", restored_at: new Date().toISOString(), last_error: null })
  await updateRestoreJob(restoreJob.id, { status: "completed", restored_sha256: result.data.resultingSha256, result: result.data, completed_at: new Date().toISOString() })
  await recordQuarantineEvent(caseId, "restore_completed", "restored", actor, reason, { job: result.data, restoreJobId: restoreJob.id })
  await auditWindowsNodeEvent({ timestamp: new Date().toISOString(), actor: auth.context.operator, action: "windows_storage_object_restored", target: "/opsos/infrastructure/windows-node#storage", result: "restored", reason, severity: "high", metadataSummary: `case=${current.caseNumber} hashMatch=${result.data.originalSha256 === result.data.resultingSha256}` })
  return NextResponse.json({ ok: true, data: { case: updated, job: result.data } }, { headers: { "cache-control": "no-store" } })
}
