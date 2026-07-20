import { NextResponse } from "next/server"
import { auditWindowsNodeEvent, requireWindowsNodeAdmin } from "@/app/api/opsos/windows-node/_shared"
import { actorId } from "@/app/api/opsos/windows-node/storage/quarantine/_shared"
import { scheduleDestructionRequest } from "@/lib/opsos/storage-destruction"

export const dynamic = "force-dynamic"
function clean(value: unknown) { return String(value ?? "").trim() }
export async function POST(request: Request, { params }: { params: Promise<{ requestId: string }> }) {
  const auth = await requireWindowsNodeAdmin(request)
  if (!auth.ok) return auth.response
  const { requestId } = await params
  const body = await request.json().catch(() => ({}))
  try {
    const data = await scheduleDestructionRequest(requestId, actorId(auth.context.user, auth.context.operator), clean(body.confirmation))
    await auditWindowsNodeEvent({ timestamp: new Date().toISOString(), actor: auth.context.operator, action: "windows_storage_destruction_scheduled", target: "/opsos/infrastructure/windows-node#storage", result: data.status, reason: "Cooling-off period started", severity: "critical", metadataSummary: `request=${data.requestNumber} scheduledFor=${data.scheduledFor}` })
    return NextResponse.json({ ok: true, data }, { headers: { "cache-control": "no-store" } })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Scheduling failed" }, { status: 400 })
  }
}
