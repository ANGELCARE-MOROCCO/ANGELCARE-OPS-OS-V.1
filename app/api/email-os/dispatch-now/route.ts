import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const url = new URL(request.url)
    const origin = `${url.protocol}//${url.host}`

    const response = await fetch(`${origin}/api/email-os/cron/queue-worker`, {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    })

    const json = await response.json().catch(() => null)

    return NextResponse.json(
      {
        ok: response.ok && json?.ok !== false,
        data: json?.data || [],
        error: json?.error || null
      },
      { status: response.ok ? 200 : 500 }
    )
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Dispatch failed"
      },
      { status: 500 }
    )
  }
}
