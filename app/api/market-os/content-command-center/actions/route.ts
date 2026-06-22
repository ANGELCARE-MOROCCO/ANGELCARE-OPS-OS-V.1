import { NextResponse } from "next/server"

type ContentCommandActionPayload = {
  action?: string
  payload?: Record<string, unknown>
  source?: string
}

function normalizeAction(value: unknown) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, ".")
    .replace(/[^a-zA-Z0-9._:-]/g, "")
    .toLowerCase()
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as ContentCommandActionPayload
    const action = normalizeAction(body.action)
    const payload = body.payload && typeof body.payload === "object" ? body.payload : {}

    if (!action) {
      return NextResponse.json({ ok: false, error: "Missing content command action." }, { status: 400 })
    }

    return NextResponse.json({
      ok: true,
      action,
      payload,
      acceptedAt: new Date().toISOString(),
      persisted: false,
      message: `Content command action accepted: ${action}`,
    })
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Content command action failed." },
      { status: 500 },
    )
  }
}
