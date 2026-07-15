import { revenueClient, ok, fail } from "@/lib/revenue-command-center/canonical-server"

export async function GET() {
  const supabase = await revenueClient()
  const [{ data: summary, error: summaryError }, { data: byStage, error: stageError }, { data: byCity, error: cityError }, { data: tasks, error: taskError }] = await Promise.all([
    supabase.from("revenue_command_center_analytics").select("*").maybeSingle(),
    supabase.from("revenue_prospects").select("stage,value_mad,priority,status"),
    supabase.from("revenue_prospects").select("city,value_mad,status"),
    supabase.from("revenue_tasks").select("status,priority,due_date"),
  ])
  const error = summaryError || stageError || cityError || taskError
  if (error) return fail(error)
  return ok({ summary, byStage: byStage || [], byCity: byCity || [], tasks: tasks || [], source: "real_revenue_tables" })
}
