import { NextResponse } from "next/server"
import { auditWindowsNodeEvent, requireWindowsNodeAdmin } from "@/app/api/opsos/windows-node/_shared"
import { actorId } from "@/app/api/opsos/windows-node/storage/quarantine/_shared"
import { analyzeDestructionEligibility, createDestructionRequest, listDestructionRegistry } from "@/lib/opsos/storage-destruction"
import type { WindowsStorageDestructionScope } from "@/lib/opsos/windows-node-types"

export const dynamic = "force-dynamic"
function clean(value: unknown) { return String(value ?? "").trim() }

export async function GET(request: Request) {
  const auth = await requireWindowsNodeAdmin(request)
  if (!auth.ok) return auth.response
  try {
    const data = await listDestructionRegistry(400)
    return NextResponse.json({ ok: true, data }, { headers: { "cache-control": "no-store" } })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Phase 4 registry unavailable", recommendedAction: "Apply the Phase 4 database migration and retry." }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const auth = await requireWindowsNodeAdmin(request)
  if (!auth.ok) return auth.response
  const body = await request.json().catch(() => ({}))
  const quarantineCaseId = clean(body.quarantineCaseId)
  const scope = clean(body.scope) as WindowsStorageDestructionScope
  const reason = clean(body.reason).slice(0, 1500)
  if (!quarantineCaseId || !scope || !reason) return NextResponse.json({ ok: false, error: "quarantineCaseId, scope and reason are required" }, { status: 400 })
  try {
    const impact = await analyzeDestructionEligibility(quarantineCaseId)
    const actor = actorId(auth.context.user, auth.context.operator)
    const data = await createDestructionRequest({ impact, scope, reason, actor })
    await auditWindowsNodeEvent({ timestamp: new Date().toISOString(), actor: auth.context.operator, action: "windows_storage_destruction_requested", target: "/opsos/infrastructure/windows-node#storage", result: data.status, reason, severity: "critical", metadataSummary: `request=${data.requestNumber} case=${data.quarantineCaseNumber} scope=${data.scope} permanent=true` })
    return NextResponse.json({ ok: true, data }, { status: 201, headers: { "cache-control": "no-store" } })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unable to create destruction request" }, { status: 400 })
  }
}
