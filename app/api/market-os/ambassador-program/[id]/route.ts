import { NextResponse } from "next/server"
import { deleteMarketOsRecord, getMarketOsRecord, normalizeResource, updateMarketOsRecord } from "@/lib/market-os/database-crud"

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(req: Request, context: RouteContext) {
  try {
    const { id } = await context.params
    const url = new URL(req.url)
    const resource = normalizeResource(url.searchParams.get("resource"), "ambassador-program")
    const data = await getMarketOsRecord(resource, id)
    return NextResponse.json({ ok: true, module: "ambassador-program", resource, data })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || "Unable to load record" }, { status: 500 })
  }
}

export async function PATCH(req: Request, context: RouteContext) {
  try {
    const { id } = await context.params
    const url = new URL(req.url)
    const resource = normalizeResource(url.searchParams.get("resource"), "ambassador-program")
    const body = await req.json().catch(() => ({}))
    const data = await updateMarketOsRecord(resource, id, body)
    return NextResponse.json({ ok: true, module: "ambassador-program", resource, data })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || "Unable to update record" }, { status: 500 })
  }
}

export async function DELETE(req: Request, context: RouteContext) {
  try {
    const { id } = await context.params
    const url = new URL(req.url)
    const resource = normalizeResource(url.searchParams.get("resource"), "ambassador-program")
    const data = await deleteMarketOsRecord(resource, id)
    return NextResponse.json({ ok: true, module: "ambassador-program", resource, data })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || "Unable to delete record" }, { status: 500 })
  }
}
