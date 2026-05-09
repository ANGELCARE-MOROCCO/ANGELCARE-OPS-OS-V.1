"use client"

import { useCallback, useState } from "react"
import { executeEmailOSAction } from "./action-client"
import type { EmailOSActionPayload, EmailOSActionResult, EmailOSClickAction } from "./action-types"

export function useEmailOSActionRunner() {
  const [busy, setBusy] = useState<string | null>(null)
  const [lastResult, setLastResult] = useState<EmailOSActionResult | null>(null)
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null)

  const run = useCallback(async (action: EmailOSClickAction, payload: EmailOSActionPayload = {}) => {
    setBusy(action)
    const result = await executeEmailOSAction(action, payload)
    setLastResult(result)
    setToast({
      type: result.ok ? "success" : "error",
      message: result.ok ? result.message : result.error || result.message
    })
    setBusy(null)

    window.setTimeout(() => setToast(null), 3500)
    return result
  }, [])

  return {
    run,
    busy,
    lastResult,
    toast,
    clearToast: () => setToast(null)
  }
}
