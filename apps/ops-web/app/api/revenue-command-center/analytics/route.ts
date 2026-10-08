import { revenueClient, ok, fail } from "@/lib/revenue-command-center/canonical-server"

function normalized(value: unknown) {
  return String(value || '').trim().toLowerCase()
}

export async function GET() {
  const supabase = await revenueClient()
  const [prospects, tasks, appointments, notifications, events] = await Promise.all([
    supabase.from("revenue_prospects").select("stage,city,value_mad,priority,status,archived_at"),
    supabase.from("revenue_tasks").select("status,priority,due_date,completed_at,archived_at"),
    supabase.from("revenue_appointments").select("status,archived_at"),
    supabase.from("revenue_notifications").select("status,archived_at"),
    supabase.from("revenue_events").select("id"),
  ])

  const error = prospects.error || tasks.error || appointments.error || notifications.error || events.error
  if (error) return fail(error)

  const prospectRows = prospects.data || []
  const taskRows = tasks.data || []
  const appointmentRows = appointments.data || []
  const notificationRows = notifications.data || []
  const today = new Date().toISOString().slice(0, 10)

  const summary = {
    total_prospects: prospectRows.length,
    active_prospects: prospectRows.filter((row: any) => !row.archived_at && !['lost', 'archived', 'closed'].includes(normalized(row.status))).length,
    pipeline_value_mad: prospectRows.reduce((sum: number, row: any) => sum + Number(row.value_mad || 0), 0),
    total_tasks: taskRows.length,
    open_tasks: taskRows.filter((row: any) => !row.archived_at && !['done', 'completed', 'cancelled', 'archived'].includes(normalized(row.status))).length,
    completed_tasks: taskRows.filter((row: any) => Boolean(row.completed_at) || ['done', 'completed'].includes(normalized(row.status))).length,
    overdue_tasks: taskRows.filter((row: any) => !row.completed_at && row.due_date && String(row.due_date) < today && !['done', 'completed', 'cancelled', 'archived'].includes(normalized(row.status))).length,
    total_appointments: appointmentRows.length,
    scheduled_appointments: appointmentRows.filter((row: any) => !row.archived_at && ['scheduled', 'confirmed', 'pending'].includes(normalized(row.status))).length,
    completed_appointments: appointmentRows.filter((row: any) => ['completed', 'done'].includes(normalized(row.status))).length,
    missed_appointments: appointmentRows.filter((row: any) => ['missed', 'no_show', 'no-show'].includes(normalized(row.status))).length,
    unread_notifications: notificationRows.filter((row: any) => !row.archived_at && ['unread', 'new'].includes(normalized(row.status))).length,
    total_events: (events.data || []).length,
  }

  return ok({
    summary,
    byStage: prospectRows.map((row: any) => ({ stage: row.stage, value_mad: row.value_mad, priority: row.priority, status: row.status })),
    byCity: prospectRows.map((row: any) => ({ city: row.city, value_mad: row.value_mad, status: row.status })),
    tasks: taskRows,
    source: "canonical_revenue_tables",
  })
}
