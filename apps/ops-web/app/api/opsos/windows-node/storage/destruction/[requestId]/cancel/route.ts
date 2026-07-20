import { NextResponse } from "next/server"
import { auditWindowsNodeEvent, requireWindowsNodeAdmin } from "@/app/api/opsos/windows-node/_shared"
import { actorId } from "@/app/api/opsos/windows-node/storage/quarantine/_shared"
import { cancelDestructionRequest } from "@/lib/opsos/storage-destruction"

export const dynamic = "force-dynamic"
function clean(value: unknown) { return String(value ?? "").trim() }
export async function POST(request: Request, { params }: { params: Promise<{ requestId: string }> }) {
  const auth = await requireWindowsNodeAdmin(request)
  if (!auth.ok) return auth.response
  const { requestId } = await params
  const body = await request.json().catch(() => ({}))
  const reason = clean(body.reason).slice(0, 1200) || "Destruction request cancelled before execution"
  try {
    const data = await cancelDestructionRequest(requestId, actorId(auth.context.user, auth.context.operator), reason)
    await auditWindowsNodeEvent({ timestamp: new Date().toISOString(), actor: auth.context.operator, action: "windows_storage_destruction_cancelled", target: "/opsos/infrastructure/windows-node#storage", result: "cancelled", reason, severity: "high", metadataSummary: `request=${data.requestNumber} permanentDeletionExecuted=false` })
    return NextResponse.json({ ok: true, data }, { headers: { "cache-control": "no-store" } })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Cancellation failed" }, { status: 400 })
  }
}
