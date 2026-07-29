import { NextResponse } from "next/server"
import { executiveContext, optionalExecutiveRows } from "@/lib/revenue-command-center/executive-enterprise/server"
import { executiveFailure } from "../_shared"
export const dynamic = "force-dynamic"
export async function GET() {
  try {
    const { supabase } = await executiveContext("revenue.executive.audit")
    const audit = await optionalExecutiveRows(supabase, "revenue_executive_audit_events", 2000, (query) => query.order("created_at", { ascending: false }))
    return NextResponse.json({ ok: true, source: "revenue_executive_audit_events", available: audit.available, events: audit.rows })
  } catch (error) { return executiveFailure(error) }
}
