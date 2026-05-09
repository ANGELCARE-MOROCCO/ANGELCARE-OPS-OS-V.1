"use client"

import { useState } from "react"
import { liveEmailOSFetch } from "./live-api"
import type { LiveThread, LiveThreadAction } from "./live-types"

export function useThreadActions() {
  const [busyAction, setBusyAction] = useState<string | null>(null)
  const [lastAction, setLastAction] = useState<string | null>(null)

  async function runAction(thread: LiveThread, action: LiveThreadAction, payload: Record<string, unknown> = {}) {
    setBusyAction(`${thread.id}:${action}`)

    const audit = await liveEmailOSFetch("/api/email-os/production/audit", {
      method: "POST",
      body: JSON.stringify({
        action: `thread.${action}`,
        threadId: thread.id,
        mailboxId: thread.mailboxId,
        severity: action === "escalate" || action === "approve" ? "critical" : "info",
        details: payload
      })
    })

    if (action === "escalate") {
      await liveEmailOSFetch("/api/email-os/production/queue", {
        method: "POST",
        body: JSON.stringify({
          type: "notification",
          payload: {
            type: "sla_breach",
            title: "Thread escalated",
            body: `${thread.subject} was escalated`,
            priority: "high"
          }
        })
      })
    }

    await liveEmailOSFetch("/api/email-os/runtime/events", {
      method: "POST",
      body: JSON.stringify({
        type: `thread.${action}`,
        threadId: thread.id,
        mailboxId: thread.mailboxId,
        payload
      })
    })

    setLastAction(`${action} executed`)
    setBusyAction(null)
    return audit
  }

  return {
    runAction,
    busyAction,
    lastAction
  }
}
