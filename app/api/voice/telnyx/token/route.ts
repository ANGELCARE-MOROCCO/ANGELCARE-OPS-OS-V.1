export async function POST() {
  const apiKey = process.env.TELNYX_API_KEY
  const credentialId = process.env.TELNYX_TELEPHONY_CREDENTIAL_ID

  if (!apiKey || !credentialId) {
    return Response.json(
      { ok: false, error: "Missing Telnyx env keys" },
      { status: 500 }
    )
  }

  const res = await fetch(
    `https://api.telnyx.com/v2/telephony_credentials/${credentialId}/token`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    }
  )

  const json = await res.json()

  if (!res.ok) {
    return Response.json({ ok: false, error: json }, { status: res.status })
  }

  return Response.json({
    ok: true,
    token: json.data?.token,
  })
}