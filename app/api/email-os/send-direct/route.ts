import { NextResponse } from "next/server"

type WorkerResult = {
  id?: string
  outboxId?: string
  ok?: boolean
  messageId?: string
  error?: string
}

export async function POST(request: Request) {
  try {
    const payload = await request.json().catch(() => ({}))
    const url = new URL(request.url)
    const origin = `${url.protocol}//${url.host}`

    const sendResponse = await fetch(`${origin}/api/email-os/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })

    const sendJson = await sendResponse.json().catch(() => null)

    if (!sendResponse.ok || sendJson?.ok === false) {
      return NextResponse.json(
        {
          ok: false,
          stage: "queue",
          status: "failed",
          error: sendJson?.error || `Send API failed with HTTP ${sendResponse.status}`,
          send: sendJson
        },
        { status: 500 }
      )
    }

    const queueId = sendJson?.data?.queueId
    const outboxId = sendJson?.data?.outboxId

    const dispatchResponse = await fetch(`${origin}/api/email-os/cron/queue-worker`, {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    })

    const dispatchJson = await dispatchResponse.json().catch(() => null)
    const processed: WorkerResult[] = Array.isArray(dispatchJson?.data) ? dispatchJson.data : []

    const current =
      processed.find((item) => item.id === queueId) ||
      processed.find((item) => item.outboxId === outboxId) ||
      null

    if (!dispatchResponse.ok || dispatchJson?.ok === false) {
      return NextResponse.json(
        {
          ok: false,
          stage: "dispatch",
          status: "failed",
          error: dispatchJson?.error || `Dispatch failed with HTTP ${dispatchResponse.status}`,
          send: sendJson?.data,
          dispatch: dispatchJson
        },
        { status: 500 }
      )
    }

    if (!current) {
      return NextResponse.json(
        {
          ok: false,
          stage: "dispatch",
          status: "queued",
          error: "Email was queued but the worker did not process this queue item immediately.",
          send: sendJson?.data,
          dispatch: dispatchJson
        },
        { status: 500 }
      )
    }

    if (!current.ok) {
      return NextResponse.json(
        {
          ok: false,
          stage: "smtp",
          status: "failed",
          error: current.error || "SMTP dispatch failed",
          send: sendJson?.data,
          dispatch: current
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ok: true,
      stage: "sent",
      status: "sent",
      data: {
        ...sendJson?.data,
        messageId: current.messageId,
        worker: current
      }
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        stage: "exception",
        status: "failed",
        error: error instanceof Error ? error.message : "Direct send failed"
      },
      { status: 500 }
    )
  }
}
