import { NextResponse } from "next/server"
import { auditWindowsNodeEvent, requireWindowsNodeAdmin } from "@/app/api/opsos/windows-node/_shared"
import { actorId } from "@/app/api/opsos/windows-node/storage/quarantine/_shared"
import { createLegalHold, listLegalHolds } from "@/lib/opsos/storage-destruction"
export const dynamic = "force-dynamic"
function clean(value: unknown) { return String(value ?? "").trim() }
export async function GET(request: Request) {
  const auth = await requireWindowsNodeAdmin(request)
  if (!auth.ok) return auth.response
  return NextResponse.json({ ok: true, data: await listLegalHolds(500) }, { headers: { "cache-control": "no-store" } })
}
export async function POST(request: Request) {
  const auth = await requireWindowsNodeAdmin(request)
  if (!auth.ok) return auth.response
  const body = await request.json().catch(() => ({}))
  try {
    const data = await createLegalHold({ sourceId: clean(body.sourceId), objectReference: clean(body.objectReference), fileId: clean(body.fileId) || null, mailboxId: clean(body.mailboxId) || null, reason: clean(body.reason), actor: actorId(auth.context.user, auth.context.operator), metadata: body.metadata && typeof body.metadata === "object" ? body.metadata : {} })
    await auditWindowsNodeEvent({ timestamp: new Date().toISOString(), actor: auth.context.operator, action: "windows_storage_legal_hold_placed", target: "/opsos/infrastructure/windows-node#storage", result: "active", reason: data.reason, severity: "critical", metadataSummary: `hold=${data.id} object=${data.objectReference}` })
    return NextResponse.json({ ok: true, data }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Legal hold creation failed" }, { status: 400 })
  }
}
