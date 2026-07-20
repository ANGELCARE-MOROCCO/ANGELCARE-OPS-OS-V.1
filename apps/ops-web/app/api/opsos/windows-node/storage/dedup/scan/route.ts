import { NextResponse } from "next/server"
import { requireWindowsNodeAdmin } from "@/app/api/opsos/windows-node/_shared"
import { scanExactDuplicates } from "@/lib/opsos/storage-lifecycle"
export const dynamic = "force-dynamic"
export async function GET(request: Request) { const auth = await requireWindowsNodeAdmin(request); if (!auth.ok) return auth.response; try { return NextResponse.json({ ok: true, data: await scanExactDuplicates() }, { headers: { "cache-control": "no-store" } }) } catch (error) { return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Duplicate scan failed" }, { status: 500 }) } }
export const POST = GET
