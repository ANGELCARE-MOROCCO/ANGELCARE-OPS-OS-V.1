import { NextResponse } from "next/server"
import { auditWindowsNodeEvent, getWindowsNodeRequestIp, requireWindowsNodeAdmin } from "@/app/api/opsos/windows-node/_shared"
import { actorId, analyzeQuarantineImpact } from "@/app/api/opsos/windows-node/storage/quarantine/_shared"
import { createQuarantineCase, listQuarantineCases } from "@/lib/opsos/storage-quarantine"
import type { WindowsStorageQuarantineMode } from "@/lib/opsos/windows-node-types"

export const dynamic = "force-dynamic"

function clean(value: unknown) { return String(value ?? "").trim() }

export async function GET(request: Request) {
  const auth = await requireWindowsNodeAdmin(request)
  if (!auth.ok) return auth.response
  try {
    const data = await listQuarantineCases(300)
    return NextResponse.json({ ok: true, data }, { headers: { "cache-control": "no-store" } })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Quarantine cases unavailable", recommendedAction: "Apply the Phase 3 database migration and retry." }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const auth = await requireWindowsNodeAdmin(request)
  if (!auth.ok) return auth.response
  const body = await request.json().catch(() => ({}))
  const sourceId = clean(body.sourceId).slice(0, 80)
  const relativePath = clean(body.relativePath || body.path).slice(0, 1200)
  const reason = clean(body.reason).slice(0, 1000)
  const mode = clean(body.mode) as WindowsStorageQuarantineMode
  const retentionDays = Number(body.retentionDays || 30)
  if (!sourceId || !relativePath || !["logical", "physical"].includes(mode)) return NextResponse.json({ ok: false, error: "sourceId, relativePath and a valid quarantine mode are required" }, { status: 400 })
  const analysis = await analyzeQuarantineImpact({ sourceId, relativePath, operator: auth.context.operator, requestIp: getWindowsNodeRequestIp(request) })
  if (!analysis.ok) return NextResponse.json(analysis.error, { status: analysis.status })
  try {
    const actor = actorId(auth.context.user, auth.context.operator)
    const data = await createQuarantineCase({ impact: analysis.data, mode, reason, retentionDays, actor })
    await auditWindowsNodeEvent({
      timestamp: new Date().toISOString(), actor: auth.context.operator, action: "windows_storage_quarantine_requested",
      target: "/opsos/infrastructure/windows-node#storage", result: data.status, reason,
      severity: data.riskLevel === "high" ? "high" : "medium",
      metadataSummary: `case=${data.caseNumber} mode=${data.quarantineMode} risk=${data.riskLevel} permanentDelete=false`,
    })
    return NextResponse.json({ ok: true, data }, { status: 201, headers: { "cache-control": "no-store" } })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unable to create quarantine case" }, { status: 400 })
  }
}
