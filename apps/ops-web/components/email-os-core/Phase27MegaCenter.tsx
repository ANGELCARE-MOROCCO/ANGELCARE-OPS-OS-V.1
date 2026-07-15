"use client"

import { useEffect, useState } from "react"
import { Brain, Shield, Activity, Bell, Zap } from "lucide-react"

async function api(path:string, options?:RequestInit) {
  const res = await fetch(path, {
    ...options,
    headers: {
      "Content-Type":"application/json",
      ...(options?.headers || {})
    }
  })

  return res.json()
}

export default function Phase27MegaCenter() {
  const [status, setStatus] = useState("Ready")
  const [events, setEvents] = useState<any[]>([])

  async function runAI() {
    const result = await api("/api/email-os/ai/triage", {
      method: "POST"
    })

    setStatus(result.ok ? "AI triage completed" : "AI failed")
  }

  async function seedPermissions() {
    const result = await api("/api/email-os/security/permissions/seed", {
      method: "POST"
    })

    setStatus(result.ok ? "Permissions initialized" : "Permission seed failed")
  }

  async function loadRealtime() {
    const result = await api("/api/email-os/realtime/events")
    setEvents(result.data || [])
  }

  useEffect(() => {
    loadRealtime()
  }, [])

  return (
    <section className="space-y-5">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-slate-950 p-3 text-white">
            <Zap className="h-5 w-5" />
          </div>

          <div>
            <h1 className="text-2xl font-black text-slate-950">
              Phase 27 Mega Operations Layer
            </h1>

            <p className="text-sm text-slate-500">
              {status}
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-5">
          {([
  ["AI Triage", Brain],
  ["Realtime", Activity],
  ["Notifications", Bell],
  ["Security", Shield],
  ["Automation", Zap]
] as const).map(([label, Icon]) => (
            <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <Icon className="h-5 w-5 text-slate-500" />
              <div className="mt-3 text-lg font-black text-slate-950">
                {label}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            onClick={runAI}
            className="h-11 rounded-2xl bg-slate-950 px-5 text-sm font-black text-white"
          >
            Run AI Triage
          </button>

          <button
            onClick={seedPermissions}
            className="h-11 rounded-2xl border border-slate-200 px-5 text-sm font-black"
          >
            Seed Permissions
          </button>

          <button
            onClick={loadRealtime}
            className="h-11 rounded-2xl border border-slate-200 px-5 text-sm font-black"
          >
            Refresh Feed
          </button>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-black text-slate-950">
          Live Operational Feed
        </h2>

        <div className="mt-5 space-y-3">
          {events.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-bold text-slate-500">
              No realtime events yet.
            </div>
          ) : (
            events.map((event) => (
              <div
                key={event.id}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="font-black text-slate-950">
                  {event.event_type}
                </div>

                <div className="mt-1 text-sm text-slate-500">
                  {event.entity_type}:{event.entity_id}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  )
}
