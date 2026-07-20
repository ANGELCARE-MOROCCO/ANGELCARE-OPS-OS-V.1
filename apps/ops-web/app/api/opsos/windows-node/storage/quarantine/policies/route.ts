import { NextResponse } from "next/server"
import { auditWindowsNodeEvent, requireWindowsNodeAdmin } from "@/app/api/opsos/windows-node/_shared"
import { actorId } from "@/app/api/opsos/windows-node/storage/quarantine/_shared"
import { getQuarantinePolicy, saveQuarantinePolicy } from "@/lib/opsos/storage-quarantine"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const auth = await requireWindowsNodeAdmin(request)
  if (!auth.ok) return auth.response
  try { return NextResponse.json({ ok: true, data: await getQuarantinePolicy() }, { headers: { "cache-control": "no-store" } }) }
  catch (error) { return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Policy unavailable" }, { status: 500 }) }
}

export async function PUT(request: Request) {
  const auth = await requireWindowsNodeAdmin(request)
  if (!auth.ok) return auth.response
  const body = await request.json().catch(() => ({}))
  try {
    const data = await saveQuarantinePolicy(body, actorId(auth.context.user, auth.context.operator))
    await auditWindowsNodeEvent({ timestamp: new Date().toISOString(), actor: auth.context.operator, action: "windows_storage_quarantine_policy_updated", target: "/opsos/infrastructure/windows-node#storage", result: "updated", reason: "Phase 3 quarantine policy updated", severity: "high", metadataSummary: `default=${data.defaultRetentionDays} max=${data.maximumRetentionDays} permanentDelete=false` })
    return NextResponse.json({ ok: true, data }, { headers: { "cache-control": "no-store" } })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Policy update failed" }, { status: 400 })
  }
}
