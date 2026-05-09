"use client"

import { useCallback, useEffect, useState } from "react"
import { liveEmailOSFetch } from "./live-api"
import type { LiveComposePayload } from "./live-types"

const DRAFT_KEY = "angelcare-email-os-live-draft"

export function useComposeController() {
  const [draft, setDraft] = useState<LiveComposePayload>({
    to: "",
    subject: "",
    text: ""
  })
  const [sending, setSending] = useState(false)
  const [status, setStatus] = useState<string>("Draft ready")

  useEffect(() => {
    const saved = localStorage.getItem(DRAFT_KEY)
    if (saved) {
      try {
        setDraft(JSON.parse(saved))
      } catch {
        localStorage.removeItem(DRAFT_KEY)
      }
    }
  }, [])

  useEffect(() => {
    const id = window.setTimeout(() => {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
      setStatus("Draft autosaved locally")
    }, 700)

    return () => window.clearTimeout(id)
  }, [draft])

  const send = useCallback(async () => {
    setSending(true)
    setStatus("Sending...")

    const sendPayload = {
      to: draft.to,
      subject: draft.subject,
      text: draft.text,
      html: draft.html,
      mailboxId: draft.mailboxId,
      threadId: draft.threadId
    }

    const result = await liveEmailOSFetch("/api/email-os/production/send", {
      method: "POST",
      body: JSON.stringify(sendPayload)
    })

    if (result.ok) {
      localStorage.removeItem(DRAFT_KEY)
      setDraft({ to: "", subject: "", text: "" })
      setStatus("Message sent")
      setSending(false)
      return result
    }

    const queueResult = await liveEmailOSFetch("/api/email-os/production/queue", {
      method: "POST",
      body: JSON.stringify({
        type: "send",
        payload: sendPayload
      })
    })

    if (queueResult.ok) {
      setStatus("Provider unavailable. Message queued.")
    } else {
      setStatus(result.error || queueResult.error || "Send failed")
    }

    setSending(false)
    return queueResult.ok ? queueResult : result
  }, [draft])

  return {
    draft,
    setDraft,
    sending,
    status,
    send
  }
}
