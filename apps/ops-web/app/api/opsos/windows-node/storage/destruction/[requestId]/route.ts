import { NextResponse } from "next/server"
import { requireWindowsNodeAdmin } from "@/app/api/opsos/windows-node/_shared"
import { listDestructionEvents, loadDestructionCertificate, loadDestructionRequest } from "@/lib/opsos/storage-destruction"

export const dynamic = "force-dynamic"
export async function GET(request: Request, { params }: { params: Promise<{ requestId: string }> }) {
  const auth = await requireWindowsNodeAdmin(request)
  if (!auth.ok) return auth.response
  const { requestId } = await params
  try {
    const item = await loadDestructionRequest(requestId)
    if (!item) return NextResponse.json({ ok: false, error: "Destruction request not found" }, { status: 404 })
    const [events, certificate] = await Promise.all([listDestructionEvents(requestId), loadDestructionCertificate(requestId).catch(() => null)])
    return NextResponse.json({ ok: true, data: { request: item, events, certificate } }, { headers: { "cache-control": "no-store" } })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Request dossier unavailable" }, { status: 500 })
  }
}
