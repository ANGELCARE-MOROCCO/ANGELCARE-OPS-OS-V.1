import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const module = req.nextUrl.searchParams.get("module")
  let query = supabase.from("revenue_command_records").select("status,owner_name,risk_level,value_mad,due_at,module_key")
  if (module) query = query.eq("module_key", module)
  const { data, error } = await query.limit(1000)
  const rows = data || []
  const byStatus: Record<string, number> = {}
  const byOwner: Record<string, number> = {}
  const now = new Date()
  for (const r of rows as any[]) {
    byStatus[r.status || "unknown"] = (byStatus[r.status || "unknown"] || 0) + 1
    byOwner[r.owner_name || "unassigned"] = (byOwner[r.owner_name || "unassigned"] || 0) + 1
  }
  const pulse = {
    total: rows.length,
    open: rows.filter((r:any) => !["completed","won","closed","approved","archived"].includes(r.status)).length,
    blocked: rows.filter((r:any) => String(r.status || "").includes("blocked")).length,
    completed: rows.filter((r:any) => ["completed","won","closed","approved"].includes(r.status)).length,
    highRisk: rows.filter((r:any) => ["critical","high","urgent"].includes(String(r.risk_level || "").toLowerCase())).length,
    overdue: rows.filter((r:any) => r.due_at && new Date(r.due_at) < now && !["completed","won","closed","approved"].includes(r.status)).length,
    value: rows.reduce((sum:number, r:any) => sum + Number(r.value_mad || 0), 0),
    byStatus,
    byOwner,
  }
  return NextResponse.json({ ok: !error, pulse, error: error?.message || null })
}
