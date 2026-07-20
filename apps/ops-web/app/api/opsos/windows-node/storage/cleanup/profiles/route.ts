import { NextResponse } from "next/server"
import { requireWindowsNodeAdmin } from "@/app/api/opsos/windows-node/_shared"
import { listCleanupProfiles } from "@/lib/opsos/storage-destruction"
export const dynamic = "force-dynamic"
export async function GET(request: Request) {
  const auth = await requireWindowsNodeAdmin(request)
  if (!auth.ok) return auth.response
  return NextResponse.json({ ok: true, data: await listCleanupProfiles() }, { headers: { "cache-control": "no-store" } })
}
