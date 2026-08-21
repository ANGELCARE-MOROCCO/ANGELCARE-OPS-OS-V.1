import { governRoute } from '@/lib/runtime/governor/route'
import { NextResponse } from "next/server"
import { requireWindowsNodeAdmin } from "@/app/api/opsos/windows-node/_shared"
import { scanExactDuplicates } from "@/lib/opsos/storage-lifecycle"
async function GET__angelcareGovernedImpl(request: Request) { const auth = await requireWindowsNodeAdmin(request); if (!auth.ok) return auth.response; try { return NextResponse.json({ ok: true, data: await scanExactDuplicates() }, { headers: { "cache-control": "no-store" } }) } catch (error) { return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Duplicate scan failed" }, { status: 500 }) } }

export const GET = governRoute(
  {
    workloadClass: 'heavy',
    operation: 'GET:/api/opsos/windows-node/storage/dedup/scan',
  },
  GET__angelcareGovernedImpl,
)

export const POST = GET
