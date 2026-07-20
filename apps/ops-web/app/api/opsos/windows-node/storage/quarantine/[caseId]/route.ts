import { NextResponse } from "next/server"
import { requireWindowsNodeAdmin } from "@/app/api/opsos/windows-node/_shared"
import { listQuarantineEvents, loadQuarantineCase } from "@/lib/opsos/storage-quarantine"

export const dynamic = "force-dynamic"

export async function GET(request: Request, { params }: { params: Promise<{ caseId: string }> }) {
  const auth = await requireWindowsNodeAdmin(request)
  if (!auth.ok) return auth.response
  const { caseId } = await params
  try {
    const [record, events] = await Promise.all([loadQuarantineCase(caseId), listQuarantineEvents(caseId)])
    if (!record) return NextResponse.json({ ok: false, error: "Quarantine case not found" }, { status: 404 })
    return NextResponse.json({ ok: true, data: { case: record, events } }, { headers: { "cache-control": "no-store" } })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Quarantine case unavailable" }, { status: 500 })
  }
}
