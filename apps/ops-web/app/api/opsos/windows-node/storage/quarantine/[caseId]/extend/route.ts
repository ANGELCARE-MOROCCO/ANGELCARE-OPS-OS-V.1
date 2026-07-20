import { NextResponse } from "next/server"
import { auditWindowsNodeEvent, requireWindowsNodeAdmin } from "@/app/api/opsos/windows-node/_shared"
import { actorId } from "@/app/api/opsos/windows-node/storage/quarantine/_shared"
import { extendQuarantineRetention } from "@/lib/opsos/storage-quarantine"

export const dynamic = "force-dynamic"
function clean(value: unknown) { return String(value ?? "").trim() }

export async function POST(request: Request, { params }: { params: Promise<{ caseId: string }> }) {
  const auth = await requireWindowsNodeAdmin(request)
  if (!auth.ok) return auth.response
  const { caseId } = await params
  const body = await request.json().catch(() => ({}))
  const days = Number(body.days || 30)
  const reason = clean(body.reason).slice(0, 1000) || "Quarantine retention extended"
  try {
    const data = await extendQuarantineRetention(caseId, days, actorId(auth.context.user, auth.context.operator), reason)
    await auditWindowsNodeEvent({ timestamp: new Date().toISOString(), actor: auth.context.operator, action: "windows_storage_quarantine_retention_extended", target: "/opsos/infrastructure/windows-node#storage", result: data.status, reason, severity: "medium", metadataSummary: `case=${data.caseNumber} days=${days}` })
    return NextResponse.json({ ok: true, data }, { headers: { "cache-control": "no-store" } })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Retention extension failed" }, { status: 400 })
  }
}
