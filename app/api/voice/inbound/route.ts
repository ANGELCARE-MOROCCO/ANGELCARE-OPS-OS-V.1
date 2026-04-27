import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  const body = await req.json()

  const eventType = body?.data?.event_type || "unknown"
  const payload = body?.data?.payload || {}

  await supabase.from("calls").insert({
    direction: "inbound",
    status: eventType,
    queue_status:
      eventType === "call.initiated"
        ? "ringing"
        : eventType === "call.answered"
        ? "active"
        : eventType === "call.hangup"
        ? "completed"
        : eventType,
    telnyx_call_control_id: payload.call_control_id || null,
    from_number: payload.from || null,
    to_number: payload.to || null,
    agent_extension: "1001",
    queue_name: "main_voice_queue",
    notes: `Telnyx webhook: ${eventType}`,
  })

  return Response.json({ received: true })
}