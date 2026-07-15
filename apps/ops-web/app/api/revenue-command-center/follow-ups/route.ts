import { NextResponse } from "next/server"
import { revenueClient } from "@/lib/revenue-command-center/canonical-server"
import { archiveRevenueRow, createRevenueRow, listRevenueRows, restoreRevenueRow, revenueTableConfigs, updateRevenueRow } from "@/lib/revenue-command-center/enterprise-api"

const config = revenueTableConfigs.followups

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const supabase = await revenueClient()
  const { data, error } = await listRevenueRows(supabase, config, request.url)
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, source: config.table, [config.collectionKey]: data || [] })
}

export async function POST(request: Request) {
  const supabase = await revenueClient()
  try {
    const body = await request.json()
    const data = await createRevenueRow(supabase, config, body)
    return NextResponse.json({ ok: true, source: config.table, [config.singleKey]: data })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Revenue create failed" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const supabase = await revenueClient()
  try {
    const body = await request.json()
    const mode = String(body.mode || body.action || "update")
    const data = mode === "archive" ? await archiveRevenueRow(supabase, config, body) : mode === "restore" ? await restoreRevenueRow(supabase, config, body) : await updateRevenueRow(supabase, config, body)
    return NextResponse.json({ ok: true, source: config.table, [config.singleKey]: data })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Revenue update failed" }, { status: 500 })
  }
}
