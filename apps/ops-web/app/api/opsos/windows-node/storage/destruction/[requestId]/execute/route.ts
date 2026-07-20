import { randomUUID } from "node:crypto"
import { NextResponse } from "next/server"
import { auditWindowsNodeEvent, getWindowsNodeRequestIp, requireWindowsNodeAdmin } from "@/app/api/opsos/windows-node/_shared"
import { actorId } from "@/app/api/opsos/windows-node/storage/quarantine/_shared"
import { buildWindowsNodeApiErrorFromBridgeResult, callWindowsBridgeAdmin } from "@/lib/opsos/windows-node"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import {
  createDestructionCertificate,
  loadDestructionRequest,
  recordDestructionEvent,
  updateDestructionRequest,
} from "@/lib/opsos/storage-destruction"
import type { WindowsStorageDestructionJobResult } from "@/lib/opsos/windows-node-types"

export const dynamic = "force-dynamic"

export async function POST(request: Request, { params }: { params: Promise<{ requestId: string }> }) {
  const auth = await requireWindowsNodeAdmin(request)
  if (!auth.ok) return auth.response
  const { requestId } = await params
  const current = await loadDestructionRequest(requestId).catch(() => null)
  if (!current) return NextResponse.json({ ok: false, error: "Destruction request not found" }, { status: 404 })
  if (current.status !== "destruction_scheduled") return NextResponse.json({ ok: false, error: "Request must be scheduled before execution" }, { status: 409 })
  if (!current.scheduledFor || new Date(current.scheduledFor).getTime() > Date.now()) return NextResponse.json({ ok: false, error: "Cooling-off period is still active", scheduledFor: current.scheduledFor }, { status: 409 })
  const actor = actorId(auth.context.user, auth.context.operator)
  const db = createEmailOSCoreDb()
  const jobId = randomUUID()
  await db.from("opsos_storage_destruction_jobs").insert({ id: jobId, request_id: current.id, status: "executing", requested_by: actor, started_at: new Date().toISOString(), result: {}, created_at: new Date().toISOString(), updated_at: new Date().toISOString() })
  await updateDestructionRequest(current.id, { status: "destroying", executed_by: actor, last_error: null })
  await recordDestructionEvent(current.id, "destruction_execution_started", "destroying", actor, current.reason, { scope: current.scope, permanent: true })

  const endpoint = "/admin/storage/destruction/execute"
  const bridge = await callWindowsBridgeAdmin<WindowsStorageDestructionJobResult>(endpoint, {
    method: "POST",
    body: JSON.stringify({
      requestId: current.id,
      requestNumber: current.requestNumber,
      quarantineCaseId: current.quarantineCaseId,
      quarantineLocationToken: current.quarantineLocationToken,
      expectedSha256: current.expectedSha256,
      scope: current.scope,
      reason: current.reason,
      actor,
    }),
  }, { operator: auth.context.operator, requestIp: getWindowsNodeRequestIp(request) })

  if (!bridge.ok) {
    const error = buildWindowsNodeApiErrorFromBridgeResult(bridge, endpoint, "storage_destruction_execute_failed")
    if (!error) return NextResponse.json({ ok: false, error: bridge.errorMessage }, { status: bridge.status })
    await updateDestructionRequest(current.id, { status: "failed", last_error: error.errorMessage })
    await db.from("opsos_storage_destruction_jobs").update({ status: "failed", last_error: error.errorMessage, completed_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", jobId)
    await recordDestructionEvent(current.id, "destruction_execution_failed", "failed", actor, error.errorMessage, { bridgeStatus: bridge.status })
    return NextResponse.json(error, { status: bridge.status })
  }

  await updateDestructionRequest(current.id, { status: "verifying" })
  await recordDestructionEvent(current.id, "destruction_verification_started", "verifying", actor, "Verifying targeted path, hash and recovered capacity", { job: bridge.data })
  const verified = !bridge.data.targetedHashPresentAfterExecution && !bridge.data.quarantinePathExistsAfterExecution
  const finalStatus = verified ? "destroyed" : "partially_destroyed"

  if (current.fileId) {
    const { data: fileRow } = await db.from("angelcare_storage_files").select("metadata").eq("id", current.fileId).maybeSingle()
    const metadata = fileRow?.metadata && typeof fileRow.metadata === "object" ? fileRow.metadata : {}
    await db.from("angelcare_storage_files").update({
      status: "destroyed",
      destroyed_at: new Date().toISOString(),
      destruction_request_id: current.id,
      metadata: { ...metadata, destruction: { requestId: current.id, requestNumber: current.requestNumber, scope: current.scope, destroyedAt: new Date().toISOString(), destroyedBy: actor, originalFilename: current.originalName, originalSizeBytes: current.originalSizeBytes, originalSha256: current.expectedSha256, permanent: true } },
      updated_at: new Date().toISOString(),
    }).eq("id", current.fileId)
  }

  const completed = await updateDestructionRequest(current.id, { status: finalStatus, actual_recovered_bytes: bridge.data.actualRecoveredBytes, completed_at: new Date().toISOString(), last_error: verified ? null : "Verification reported remaining targeted content" })
  const certificate = await createDestructionCertificate({ request: completed, actor, verificationResult: verified ? "VERIFIED_DESTROYED" : "PARTIAL_VERIFICATION", actualRecoveredBytes: bridge.data.actualRecoveredBytes, remainingCopies: bridge.data.remainingCopies || [] })
  await db.from("opsos_storage_destruction_jobs").update({ status: verified ? "completed" : "partially_completed", result: bridge.data, completed_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", jobId)
  await recordDestructionEvent(current.id, verified ? "destruction_verified" : "destruction_partially_verified", finalStatus, actor, current.reason, { job: bridge.data, certificateNumber: certificate.certificateNumber })
  await auditWindowsNodeEvent({ timestamp: new Date().toISOString(), actor: auth.context.operator, action: "windows_storage_object_permanently_destroyed", target: "/opsos/infrastructure/windows-node#storage", result: finalStatus, reason: current.reason, severity: "critical", metadataSummary: `request=${current.requestNumber} certificate=${certificate.certificateNumber} recovered=${bridge.data.actualRecoveredBytes} permanent=true` })
  return NextResponse.json({ ok: true, data: { request: completed, job: bridge.data, certificate } }, { headers: { "cache-control": "no-store" } })
}
