import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))

  const execution = {
    id: crypto.randomUUID(),
    automation: body.automation || "default",
    status: "executed",
    executedAt: new Date().toISOString()
  }

  return NextResponse.json({
    ok: true,
    data: execution
  })
}
