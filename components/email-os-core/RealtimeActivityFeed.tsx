"use client"

import { useEffect, useState } from "react"
import { Activity } from "lucide-react"

export default function RealtimeActivityFeed() {
  const [events, setEvents] = useState<any[]>([])

  async function load() {
    const res = await fetch("/api/email-os/realtime/events")
    const json = await res.json()
    setEvents(json.data || [])
  }

  useEffect(() => {
    load()

    const interval = setInterval(load, 4000)
    return () => clearInterval(interval)
  }, [])

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
          <Activity className="h-5 w-5" />
        </div>

        <div>
          <h2 className="text-lg font-black text-slate-950">
            Realtime Activity Feed
          </h2>

          <p className="text-sm text-slate-500">
            Live Email-OS runtime activity stream.
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {events.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm font-semibold text-slate-500">
            No realtime events yet.
          </div>
        ) : null}

        {events.map((event) => (
          <div
            key={event.id}
            className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
          >
            <div className="text-sm font-black text-slate-950">
              {event.type}
            </div>

            <div className="mt-1 text-xs text-slate-500">
              {event.createdAt}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
