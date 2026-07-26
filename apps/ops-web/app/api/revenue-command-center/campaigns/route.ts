import { NextResponse } from "next/server"
import {
  archiveRevenueRow,
  createRevenueRow,
  listRevenueRows,
  restoreRevenueRow,
  revenueTableConfigs,
  updateRevenueRow,
} from "@/lib/revenue-command-center/enterprise-api"
import { campaignContext } from "@/lib/revenue-command-center/campaign-enterprise/server"
import { revenueAccessFailure } from "@/lib/revenue-command-center/api-access"

const config = revenueTableConfigs.campaigns
export const dynamic = "force-dynamic"

function failed(error: unknown) {
  const access = revenueAccessFailure(error)
  const message = access?.message || (error instanceof Error ? error.message : "Revenue campaign operation failed")
  return NextResponse.json({ ok: false, error: message }, { status: access?.status || 500 })
}

export async function GET(request: Request) {
  try {
    const { supabase } = await campaignContext("revenue.campaigns.read")
    const { data, error } = await listRevenueRows(supabase, config, request.url)
    if (error) throw error
    return NextResponse.json({ ok: true, source: config.table, [config.collectionKey]: data || [] })
  } catch (error) {
    return failed(error)
  }
}

export async function POST(request: Request) {
  try {
    const { supabase } = await campaignContext("revenue.campaigns.manage")
    const body = await request.json()
    const data = await createRevenueRow(supabase, config, body)
    return NextResponse.json({ ok: true, source: config.table, [config.singleKey]: data })
  } catch (error) {
    return failed(error)
  }
}

export async function PATCH(request: Request) {
  try {
    const { supabase } = await campaignContext("revenue.campaigns.manage")
    const body = await request.json()
    const mode = String(body.mode || body.action || "update")
    const data = mode === "archive"
      ? await archiveRevenueRow(supabase, config, body)
      : mode === "restore"
        ? await restoreRevenueRow(supabase, config, body)
        : await updateRevenueRow(supabase, config, body)
    return NextResponse.json({ ok: true, source: config.table, [config.singleKey]: data })
  } catch (error) {
    return failed(error)
  }
}
