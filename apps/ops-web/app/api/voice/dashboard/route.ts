import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  const today = new Date().toISOString().slice(0, 10)

  const { count: callsToday } = await supabase
    .from("calls")
    .select("*", { count: "exact", head: true })
    .gte("started_at", `${today}T00:00:00`)

  const { count: missed } = await supabase
    .from("calls")
    .select("*", { count: "exact", head: true })
    .eq("status", "missed")

  const { count: openTasks } = await supabase
    .from("follow_up_tasks")
    .select("*", { count: "exact", head: true })
    .eq("status", "open")

  const { data: agents } = await supabase
    .from("agents")
    .select("extension, full_name, role, status")
    .order("extension")

  const { data: recentCalls } = await supabase
    .from("calls")
    .select("*")
    .order("started_at", { ascending: false })
    .limit(12)

  return Response.json({
    metrics: {
      callsToday: callsToday || 0,
      missed: missed || 0,
      openTasks: openTasks || 0,
    },
    agents: agents || [],
    recentCalls: recentCalls || [],
  })
}