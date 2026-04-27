export async function POST(req: Request) {
  const body = await req.json()

  const callControlId = body.call_control_id
  const action = body.action

  const apiKey = process.env.TELNYX_API_KEY
  const sipUsername = process.env.NEXT_PUBLIC_TELNYX_SIP_USERNAME

  if (!apiKey) {
    return Response.json(
      { ok: false, error: "Missing TELNYX_API_KEY" },
      { status: 500 }
    )
  }

  if (!callControlId || !action) {
    return Response.json(
      { ok: false, error: "Missing call_control_id or action" },
      { status: 400 }
    )
  }

  if (!["answer", "reject", "hangup"].includes(action)) {
    return Response.json(
      { ok: false, error: "Invalid action" },
      { status: 400 }
    )
  }

  try {
    // 🟥 REJECT / HANGUP (unchanged)
    if (action === "reject" || action === "hangup") {
      const res = await fetch(
        `https://api.telnyx.com/v2/calls/${callControlId}/actions/${action}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}),
        }
      )

      const json = await res.json().catch(() => ({}))

      if (!res.ok) {
        return Response.json({ ok: false, error: json }, { status: res.status })
      }

      return Response.json({ ok: true })
    }

    // 🟩 ANSWER + AUDIO BRIDGE
    if (action === "answer") {
      // Step 1 — Answer call
      await fetch(
        `https://api.telnyx.com/v2/calls/${callControlId}/actions/answer`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}),
        }
      )

      // Step 2 — Bridge to WebRTC SIP (THIS FIXES AUDIO)
      await fetch(
        `https://api.telnyx.com/v2/calls/${callControlId}/actions/transfer`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            to: `sip:${sipUsername}@sip.telnyx.com`,
          }),
        }
      )

      return Response.json({ ok: true })
    }

  } catch (err) {
    console.error("Call control error:", err)
    return Response.json({ ok: false, error: err }, { status: 500 })
  }

  return Response.json({ ok: true })
}