import { NextResponse } from "next/server"
import { auditWindowsNodeEvent, requireWindowsNodeAdmin } from "@/app/api/opsos/windows-node/_shared"
import { actorId } from "@/app/api/opsos/windows-node/storage/quarantine/_shared"
import { approveDestructionRequest } from "@/lib/opsos/storage-destruction"

export const dynamic = "force-dynamic"
function clean(value: unknown) { return String(value ?? "").trim() }
export async function POST(request: Request, { params }: { params: Promise<{ requestId: string }> }) {
  const auth = await requireWindowsNodeAdmin(request)
  if (!auth.ok) return auth.response
  const { requestId } = await params
  const body = await request.json().catch(() => ({}))
  const reason = clean(body.reason).slice(0, 1200) || "Permanent destruction approved after evidence and retention review"
  try {
    const data = await approveDestructionRequest(requestId, actorId(auth.context.user, auth.context.operator), reason)
    await auditWindowsNodeEvent({ timestamp: new Date().toISOString(), actor: auth.context.operator, action: "windows_storage_destruction_approved", target: "/opsos/infrastructure/windows-node#storage", result: data.status, reason, severity: "critical", metadataSummary: `request=${data.requestNumber} approvals=${data.approvalCount}/${data.approvalsRequired}` })
    return NextResponse.json({ ok: true, data }, { headers: { "cache-control": "no-store" } })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Approval failed" }, { status: 400 })
  }
}
