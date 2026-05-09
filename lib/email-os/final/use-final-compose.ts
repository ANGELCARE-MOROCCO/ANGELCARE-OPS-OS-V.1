"use client"

import { useEffect, useState } from "react"
import { liveEmailOSFetch } from "@/lib/email-os/live/live-api"

const KEY = "angelcare-email-os-final-compose"

export function useFinalCompose() {
  const [draft, setDraft] = useState({ to: "", subject: "", text: "", html: "" })
  const [status, setStatus] = useState("Ready")
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem(KEY)
    if (saved) {
      try {
        setDraft(JSON.parse(saved))
      } catch {
        localStorage.removeItem(KEY)
      }
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(async () => {
      localStorage.setItem(KEY, JSON.stringify(draft))
      if (draft.subject || draft.text || draft.html || draft.to) {
        await liveEmailOSFetch("/api/email-os/live/drafts", {
          method: "POST",
          body: JSON.stringify(draft)
        })
        setStatus("Draft autosaved")
      }
    }, 900)

    return () => clearTimeout(timer)
  }, [draft])

  async function send() {
    setBusy(true)
    setStatus("Sending or queueing...")

    const result = await liveEmailOSFetch("/api/email-os/live/send-or-queue", {
      method: "POST",
      body: JSON.stringify(draft)
    })

    if (result.ok) {
      localStorage.removeItem(KEY)
      setDraft({ to: "", subject: "", text: "", html: "" })
      setStatus("Sent or queued successfully")
    } else {
      setStatus(result.error || "Send failed")
    }

    setBusy(false)
    return result
  }

  return { draft, setDraft, status, busy, send }
}
