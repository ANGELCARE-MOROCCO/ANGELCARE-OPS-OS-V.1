"use client"

import { useCallback, useEffect, useState } from "react"
import { liveEmailOSFetch, unwrapEmailOSData } from "./live-api"
import { normalizeThreadList } from "./thread-normalizer"
import type { LiveThread } from "./live-types"

const fallbackThreads: LiveThread[] = [
  {
    id: "thr-local-1",
    sender: "AngelCare Operations",
    role: "Operations",
    subject: "Live Email-OS connection pending",
    preview: "This fallback appears when live thread APIs are not connected yet.",
    mailbox: "Operations Inbox",
    priority: "High",
    status: "Open",
    time: "Now",
    unread: true,
    labels: ["Runtime"]
  }
]

export function useLiveEmailThreads(query = "") {
  const [threads, setThreads] = useState<LiveThread[]>(fallbackThreads)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastLoadedAt, setLastLoadedAt] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)

    const candidates = [
      "/api/email-os/v12/threads",
      "/api/email-os/threads",
      "/api/email-os/runtime/events"
    ]

    for (const path of candidates) {
      const result = await liveEmailOSFetch(path)
      if (result.ok) {
        const raw = unwrapEmailOSData<any>(result, [])
        const normalized = normalizeThreadList(raw)

        if (normalized.length > 0) {
          setThreads(normalized)
          setLastLoadedAt(new Date().toISOString())
          setLoading(false)
          return
        }
      }
    }

    setError("Live thread API not connected yet. Showing operational fallback.")
    setThreads(fallbackThreads)
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const filtered = threads.filter((thread) => {
    const q = query.trim().toLowerCase()
    if (!q) return true
    return [thread.sender, thread.subject, thread.preview, thread.mailbox, ...thread.labels]
      .join(" ")
      .toLowerCase()
      .includes(q)
  })

  return {
    threads: filtered,
    allThreads: threads,
    loading,
    error,
    lastLoadedAt,
    reload: load,
    setThreads
  }
}
