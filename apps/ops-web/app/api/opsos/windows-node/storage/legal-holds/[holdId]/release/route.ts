import { NextResponse } from "next/server"
import { auditWindowsNodeEvent, requireWindowsNodeAdmin } from "@/app/api/opsos/windows-node/_shared"
import { actorId } from "@/app/api/opsos/windows-node/storage/quarantine/_shared"
import { releaseLegalHold } from "@/lib/opsos/storage-destruction"
export const dynamic = "force-dynamic"
function clean(value: unknown) { return String(value ?? "").trim() }
export async function POST(request: Request, { params }: { params: Promise<{ holdId: string }> }) {
  const auth = await requireWindowsNodeAdmin(request)
  if (!auth.ok) return auth.response
  const { holdId } = await params
  const body = await request.json().catch(() => ({}))
  try {
    const data = await releaseLegalHold(holdId, actorId(auth.context.user, auth.context.operator), clean(body.reason))
    await auditWindowsNodeEvent({ timestamp: new Date().toISOString(), actor: auth.context.operator, action: "windows_storage_legal_hold_released", target: "/opsos/infrastructure/windows-node#storage", result: "released", reason: clean(body.reason), severity: "critical", metadataSummary: `hold=${data.id} object=${data.objectReference}` })
    return NextResponse.json({ ok: true, data })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Legal hold release failed" }, { status: 400 })
  }
}
