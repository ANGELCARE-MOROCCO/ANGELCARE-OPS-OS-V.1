import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()
    const [appointmentsRes, metricsRes, typesRes, prospectsRes] = await Promise.all([
      supabase.from("revenue_appointment_command_view").select("*").order("appointment_at", { ascending: true }),
      supabase.from("revenue_appointment_metrics_view").select("*").single(),
      supabase.from("revenue_appointment_type_view").select("*").limit(12),
      supabase.from("revenue_prospects").select("id,name,city,stage,priority,value_mad,score,data,updated_at").order("updated_at", { ascending: false }).limit(1200),
    ])

    const firstError = appointmentsRes.error || metricsRes.error || typesRes.error || prospectsRes.error
    if (firstError) return NextResponse.json({ ok: false, error: firstError.message }, { status: 500 })

    return NextResponse.json({
      ok: true,
      source: "supabase",
      syncedAt: new Date().toISOString(),
      appointments: appointmentsRes.data || [],
      metrics: metricsRes.data || { today_count: 0, week_count: 0, month_count: 0, confirmed_rate: 0, conversion_rate: 0, avg_duration_minutes: 0, total_count: 0 },
      types: typesRes.data || [],
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
          email: String(payload.email || ""),
          phone: String(payload.phone || ""),
        }
      }),
    })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Appointments command failed" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const body = await request.json()

  if (body?.mode === "quick_action") {
    const { data, error } = await supabase.rpc("revenue_appointment_quick_action", {
      p_appointment_id: body.appointmentId,
      p_action: body.action,
      p_actor: body.actor || "AngelCare",
    })
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }

  return NextResponse.json({ ok: false, error: "Unsupported mode" }, { status: 400 })
}
