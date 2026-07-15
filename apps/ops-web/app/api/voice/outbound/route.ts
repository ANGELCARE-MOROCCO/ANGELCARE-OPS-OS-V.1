export async function POST(req: Request) {
  const { to } = await req.json()

  const apiKey = process.env.TELNYX_API_KEY
  const connectionId = process.env.TELNYX_CONNECTION_ID
  const from = process.env.TELNYX_PHONE_NUMBER
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL

  if (!apiKey || !connectionId || !from || !baseUrl) {
    return Response.json(
      {
        ok: false,
        error: "Missing TELNYX_API_KEY, TELNYX_CONNECTION_ID, TELNYX_PHONE_NUMBER or NEXT_PUBLIC_BASE_URL",
      },
      { status: 500 }
    )
  }

  if (!to) {
    return Response.json({ ok: false, error: "Missing destination number" }, { status: 400 })
  }

  const res = await fetch("https://api.telnyx.com/v2/calls", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      connection_id: connectionId,
      to,
      from,
      webhook_url: `${baseUrl}/api/voice/inbound`,
    }),
  })

  const json = await res.json().catch(() => ({}))

  if (!res.ok) {
    return Response.json({ ok: false, error: json }, { status: res.status })
  }

  return Response.json({ ok: true, result: json })
}