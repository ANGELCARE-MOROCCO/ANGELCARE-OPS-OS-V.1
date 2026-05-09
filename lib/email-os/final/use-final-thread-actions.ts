"use client"

import { useState } from "react"
import { liveEmailOSFetch } from "@/lib/email-os/live/live-api"

export function useFinalThreadActions() {
  const [busy, setBusy] = useState<string | null>(null)
  const [lastResult, setLastResult] = useState<string | null>(null)

  async function execute(input: {
    threadId: string
    mailboxId?: string
    action: "read" | "archive" | "resolve" | "assign" | "escalate" | "tag" | "snooze"
    payload?: Record<string, unknown>
  }) {
    setBusy(`${input.threadId}:${input.action}`)

    const result = await liveEmailOSFetch("/api/email-os/live/thread-action", {
      method: "POST",
      body: JSON.stringify(input)
    })

    setLastResult(result.ok ? `${input.action} completed` : result.error || "Action failed")
    setBusy(null)
    return result
  }

  return { execute, busy, lastResult }
}
