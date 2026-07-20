import { NextResponse } from "next/server"
import { auditWindowsNodeEvent, getWindowsNodeRequestIp, requireWindowsNodeAdmin } from "@/app/api/opsos/windows-node/_shared"
import { analyzeQuarantineImpact } from "@/app/api/opsos/windows-node/storage/quarantine/_shared"

export const dynamic = "force-dynamic"

function clean(value: unknown) {
  return String(value ?? "").trim()
}

export async function POST(request: Request) {
  const auth = await requireWindowsNodeAdmin(request)
  if (!auth.ok) return auth.response
  const body = await request.json().catch(() => ({}))
  const sourceId = clean(body.sourceId).slice(0, 80)
  const relativePath = clean(body.relativePath || body.path).slice(0, 1200)
  if (!sourceId || !relativePath) return NextResponse.json({ ok: false, error: "sourceId and relativePath are required" }, { status: 400 })
  const result = await analyzeQuarantineImpact({ sourceId, relativePath, operator: auth.context.operator, requestIp: getWindowsNodeRequestIp(request) })
  if (!result.ok) return NextResponse.json(result.error, { status: result.status, headers: { "cache-control": "no-store" } })
  await auditWindowsNodeEvent({
    timestamp: new Date().toISOString(),
    actor: auth.context.operator,
    action: "windows_storage_quarantine_impact_analyzed",
    target: "/opsos/infrastructure/windows-node#storage",
    result: result.data.riskLevel,
    reason: "Phase 3 reversible quarantine impact analysis",
    severity: result.data.riskLevel === "blocked" ? "high" : result.data.riskLevel === "high" ? "medium" : "info",
    metadataSummary: `source=${sourceId} path=${relativePath.slice(0, 180)} refs=${result.data.referenceCount} reversible=true`,
  })
  return NextResponse.json({ ok: true, data: result.data }, { headers: { "cache-control": "no-store" } })
}
