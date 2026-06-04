import { NextResponse } from "next/server"
import { revenueClient } from "@/lib/revenue-command-center/canonical-server"
import { archiveRevenueRow, createRevenueRow, listRevenueRows, restoreRevenueRow, revenueTableConfigs, updateRevenueRow } from "@/lib/revenue-command-center/enterprise-api"

const config = revenueTableConfigs.partnerships

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const supabase = await revenueClient()
  const { data, error } = await listRevenueRows(supabase, config, request.url)
  if (error) return NextResponse.json({ ok: false, live: true, records: [], error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, live: true, source: config.table, records: data || [], partnerships: data || [] })
}

export async function POST(request: Request) {
  const supabase = await revenueClient()
  try {
    const body = await request.json()
    const data = await createRevenueRow(supabase, config, body)
    return NextResponse.json({ ok: true, live: true, source: config.table, partnership: data })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Partnership create failed" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const supabase = await revenueClient()
  try {
    const body = await request.json()
    const mode = String(body.mode || body.action || "update")
    const data = mode === "archive" ? await archiveRevenueRow(supabase, config, body) : mode === "restore" ? await restoreRevenueRow(supabase, config, body) : await updateRevenueRow(supabase, config, body)
    return NextResponse.json({ ok: true, live: true, source: config.table, partnership: data })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Partnership update failed" }, { status: 500 })
  }
}
