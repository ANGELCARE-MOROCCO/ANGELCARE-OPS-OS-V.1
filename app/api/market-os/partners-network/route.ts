import { NextResponse } from "next/server"
import { createMarketOsRecord, listMarketOsRecords, normalizeResource } from "@/lib/market-os/database-crud"

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const resource = normalizeResource(url.searchParams.get("resource"), "partners-network")
    const data = await listMarketOsRecords(resource, url.searchParams.get("search"))
    return NextResponse.json({ ok: true, module: "partners-network", resource, data })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || "Unable to list records" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const url = new URL(req.url)
    const resource = normalizeResource(url.searchParams.get("resource"), "partners-network")
    const body = await req.json().catch(() => ({}))
    const data = await createMarketOsRecord(resource, body)
    return NextResponse.json({ ok: true, module: "partners-network", resource, data })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || "Unable to create record" }, { status: 500 })
  }
}
