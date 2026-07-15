import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()

    const [tasksRes, metricsRes, workloadRes, categoryRes, prospectsRes] = await Promise.all([
      supabase
        .from("revenue_task_command_view")
        .select("*")
        .order("start_at", { ascending: true, nullsFirst: false })
        .order("due_date", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: false }),
      supabase.from("revenue_daily_task_metrics_view").select("*").single(),
      supabase.from("revenue_task_owner_workload_view").select("*").limit(8),
      supabase.from("revenue_task_category_view").select("*").limit(10),
      supabase
        .from("revenue_prospects")
        .select("id,name,city,stage,priority,value_mad,score,data,updated_at")
        .order("updated_at", { ascending: false })
        .limit(1000),
    ])

    const firstError = tasksRes.error || metricsRes.error || workloadRes.error || categoryRes.error || prospectsRes.error
    if (firstError) {
      return NextResponse.json({ ok: false, error: firstError.message }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      source: "supabase",
      syncedAt: new Date().toISOString(),
      tasks: tasksRes.data || [],
      metrics: metricsRes.data || {
        total_tasks: 0,
        completed_tasks: 0,
        in_progress_tasks: 0,
        pending_tasks: 0,
        overdue_tasks: 0,
        next_7_days: 0,
        completion_rate: 0,
      },
      workload: workloadRes.data || [],
      categories: categoryRes.data || [],
      prospects: (prospectsRes.data || []).map((row: any) => {
        const payload = row.data || {}
        return {
          id: String(row.id),
          name: String(row.name || payload.name || payload.company || "Unnamed prospect"),
          city: String(row.city || payload.city || "Unassigned"),
          stage: String(row.stage || payload.stage || "new_lead"),
          priority: String(row.priority || payload.priority || "medium"),
          value_mad: Number(row.value_mad || payload.valueMad || payload.value || 0),
          score: Number(row.score || payload.score || 0),
          contactName: String(payload.contactName || payload.decisionMaker || "N/A"),
          owner: String(payload.owner || "BD Officer"),
        }
      }),
    })
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Daily tasks command API failed" },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const body = await request.json()

  if (body?.mode === "quick_action") {
    const { data, error } = await supabase.rpc("revenue_task_quick_action", {
      p_task_id: body.taskId,
      p_action: body.action,
      p_actor: body.actor || "AngelCare",
    })
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }

  return NextResponse.json({ ok: false, error: "Unsupported mode" }, { status: 400 })
}
