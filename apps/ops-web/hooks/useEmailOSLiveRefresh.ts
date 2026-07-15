"use client"
import { shouldStartAutoRefresh, safeRefreshInterval } from '@/lib/runtime/client-live-governor'

import { useEffect, useState } from "react"

export function useEmailOSLiveRefresh(intervalMs = 5000) {
  const [events, setEvents] = useState<any[]>([])
  const [status, setStatus] = useState("idle")

  async function poll() {
    try {
      setStatus("polling")
      const res = await fetch("/api/email-os/final/realtime/poll")
      const json = await res.json()
      setEvents(json.data || [])
      setStatus("live")
    } catch {
      setStatus("error")
    }
  }

  useEffect(() => {
    poll()
    if (!shouldStartAutoRefresh()) return
    if (!shouldStartAutoRefresh()) return
    const id = setInterval(poll, safeRefreshInterval(intervalMs))
    return () => clearInterval(id)
  }, [intervalMs])

  return { events, status, refresh: poll }
}
