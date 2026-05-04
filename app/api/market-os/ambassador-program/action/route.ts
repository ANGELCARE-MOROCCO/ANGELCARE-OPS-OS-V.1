import { NextResponse } from "next/server"
import { normalizeResource, runMarketOsAction } from "@/lib/market-os/database-crud"

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const resource = normalizeResource(body.resource, "ambassador-program")
    const data = await runMarketOsAction(resource, Array.isArray(body.ids) ? body.ids : [], String(body.action || "sync"), body.note)
    return NextResponse.json({ ok: true, module: "ambassador-program", resource, data })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || "Unable to run action" }, { status: 500 })
  }
}
