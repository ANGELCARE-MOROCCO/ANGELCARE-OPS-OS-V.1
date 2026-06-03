import { fail, ok, revenueClient } from "@/lib/revenue-command-center/canonical-server"
import { REVENUE_COMMAND_CENTER_ROUTES } from "@/lib/revenue-command-center/route-registry"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET() {
  const supabase = await revenueClient()
  try {
    const view = await supabase.from("revenue_command_center_live_counts").select("*").maybeSingle()
    if (!view.error && view.data) {
      const row = view.data as Record<string, any>
      return ok({
        routes: REVENUE_COMMAND_CENTER_ROUTES,
        counts: {
          prospects: Number(row.total_prospects || 0),
          activeProspects: Number(row.active_prospects || 0),
          partnerships: Number(row.active_partners || 0),
          tasks: Number(row.open_tasks || 0),
          overdueTasks: Number(row.overdue_tasks || 0),
          appointmentsToday: Number(row.today_appointments || 0),
          followUps: Number(row.pending_follow_ups || 0),
        },
        source: "revenue_command_center_live_counts",
      })
    }

    const [prospects, partnerships, tasks, appointments, followUps] = await Promise.all([
      supabase.from("revenue_prospects").select("id", { count: "exact", head: true }).neq("status", "archived"),
      supabase.from("revenue_partnerships").select("id", { count: "exact", head: true }).neq("status", "archived"),
      supabase.from("revenue_tasks").select("id", { count: "exact", head: true }).not("status", "in", "(done,completed,cancelled,canceled,archived)"),
      supabase.from("revenue_appointments").select("id", { count: "exact", head: true }).gte("appointment_at", new Date().toISOString().slice(0, 10)).lt("appointment_at", new Date(Date.now() + 86400000).toISOString().slice(0, 10)),
      supabase.from("revenue_follow_ups").select("id", { count: "exact", head: true }).in("status", ["pending", "open", "scheduled"]),
    ])

    return ok({
      routes: REVENUE_COMMAND_CENTER_ROUTES,
      counts: {
        prospects: prospects.count || 0,
        activeProspects: prospects.count || 0,
        partnerships: partnerships.count || 0,
        tasks: tasks.count || 0,
        overdueTasks: 0,
        appointmentsToday: appointments.count || 0,
        followUps: followUps.count || 0,
      },
      source: "canonical_route_registry + live_table_counts",
    })
  } catch (error) {
    return fail(error)
  }
}
