"use client"

import type { EmailOSActionPayload, EmailOSActionResult, EmailOSClickAction } from "./action-types"

export async function executeEmailOSAction(
  action: EmailOSClickAction,
  payload: EmailOSActionPayload = {}
): Promise<EmailOSActionResult> {
  try {
    const response = await fetch("/api/email-os/actions/execute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, payload })
    })

    const json = await response.json().catch(() => null)

    if (!response.ok) {
      return {
        ok: false,
        action,
        message: "Action failed",
        error: json?.error || `HTTP ${response.status}`
      }
    }

    return json
  } catch (error) {
    return {
      ok: false,
      action,
      message: "Action failed",
      error: error instanceof Error ? error.message : "Unknown action error"
    }
  }
}
