import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const CLOSED_STATUSES = new Set(["completed", "won", "closed", "approved", "archived"])
const HIGH_RISK_LEVELS = new Set(["critical", "high", "urgent"])

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const moduleKey = req.nextUrl.searchParams.get("module") || "academy"

    let query = supabase
      .from("academy_command_records")
      .select("status,owner_name,risk_level,value_mad,due_at,module_key")
      .order("created_at", { ascending: false })
      .limit(1000)

    if (moduleKey && moduleKey !== "all") {
      query = query.eq("module_key", moduleKey)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json(
        {
          ok: false,
          pulse: {
            total: 0,
            open: 0,
            blocked: 0,
            completed: 0,
            highRisk: 0,
            overdue: 0,
            value: 0,
            byStatus: {},
            byOwner: {},
          },
          error: error.message,
        },
        { status: 200 },
      )
    }

    const rows = data || []
    const now = new Date()
    const byStatus: Record<string, number> = {}
    const byOwner: Record<string, number> = {}

    for (const row of rows as any[]) {
      const status = String(row.status || "unknown")
      const owner = String(row.owner_name || "unassigned")
      byStatus[status] = (byStatus[status] || 0) + 1
      byOwner[owner] = (byOwner[owner] || 0) + 1
    }

    const pulse = {
      total: rows.length,
      open: rows.filter((row: any) => !CLOSED_STATUSES.has(String(row.status || ""))).length,
      blocked: rows.filter((row: any) => String(row.status || "").toLowerCase().includes("blocked")).length,
      completed: rows.filter((row: any) => CLOSED_STATUSES.has(String(row.status || ""))).length,
      highRisk: rows.filter((row: any) => HIGH_RISK_LEVELS.has(String(row.risk_level || "").toLowerCase())).length,
      overdue: rows.filter((row: any) => {
        if (!row.due_at) return false
        return new Date(row.due_at) < now && !CLOSED_STATUSES.has(String(row.status || ""))
      }).length,
      value: rows.reduce((sum: number, row: any) => sum + Number(row.value_mad || 0), 0),
      byStatus,
      byOwner,
    }

    return NextResponse.json({ ok: true, module: moduleKey, pulse, error: null })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        pulse: {
          total: 0,
          open: 0,
          blocked: 0,
          completed: 0,
          highRisk: 0,
          overdue: 0,
          value: 0,
          byStatus: {},
          byOwner: {},
        },
        error: error instanceof Error ? error.message : "Unknown Academy pulse error",
      },
      { status: 200 },
    )
  }
}
