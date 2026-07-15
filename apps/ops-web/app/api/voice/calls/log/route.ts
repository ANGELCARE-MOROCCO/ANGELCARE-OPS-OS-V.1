import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  const body = await req.json()

  const { data, error } = await supabase
    .from("calls")
    .insert({
      direction: body.direction || "outbound",
      from_number: body.from_number || "VoiceWidget",
      to_number: body.to_number,
      agent_extension: body.agent_extension || "1001",
      lead_id: body.lead_id || null,
      status: body.status || "completed",
      queue_status: body.queue_status || "completed",
      queue_name: body.queue_name || "main_voice_queue",
      duration_seconds: body.duration_seconds || 0,
      notes: body.notes || null,
      outcome: body.outcome || "completed",
      ended_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 })
  }

  return Response.json({ ok: true, call: data })
}