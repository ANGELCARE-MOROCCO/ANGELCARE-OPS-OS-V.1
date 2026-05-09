
"use client"

import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"

export type EmailOSRuntimeEvent = {
  id: string
  type: string
  actor_id?: string
  mailbox_id?: string
  thread_id?: string
  payload?: Record<string, unknown>
  created_at: string
}

export function useEmailOSRuntimeEvents(limit = 50) {
  const [events, setEvents] = useState<EmailOSRuntimeEvent[]>([])
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return

    const supabase = createClient(url, key)

    supabase
      .from("email_os_runtime_events")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit)
      .then(({ data }) => {
        if (data) setEvents(data as EmailOSRuntimeEvent[])
      })

    const channel = supabase
      .channel("email-os-runtime-events")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "email_os_runtime_events" },
        (payload) => {
          setEvents((current) => [payload.new as EmailOSRuntimeEvent, ...current].slice(0, limit))
        }
      )
      .subscribe((status) => setConnected(status === "SUBSCRIBED"))

    return () => {
      supabase.removeChannel(channel)
    }
  }, [limit])

  return { events, connected }
}
