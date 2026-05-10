"use client"

import { useEffect, useState } from "react"
import { Bookmark, Plus } from "lucide-react"

async function api(path: string, options?: RequestInit) {
  const res = await fetch(path, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options?.headers || {}) }
  })
  return res.json()
}

export default function SavedViewsPanel() {
  const [views, setViews] = useState<any[]>([])
  const [status, setStatus] = useState("Ready")

  async function load() {
    const result = await api("/api/email-os/saved-views")
    setViews(result.ok ? result.data || [] : [])
  }

  async function createPreset(name: string, filters: Record<string, unknown>) {
    const result = await api("/api/email-os/saved-views", {
      method: "POST",
      body: JSON.stringify({ name, entity: "threads", filters })
    })
    setStatus(result.ok ? "Saved view created" : result.error || "Failed")
    await load()
  }

  useEffect(() => { load() }, [])

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-indigo-100 p-3 text-indigo-700">
          <Bookmark className="h-5 w-5" />
        </div>

        <div>
          <h2 className="text-lg font-black text-slate-950">Saved Views</h2>
          <p className="text-sm text-slate-500">{status}</p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <button onClick={() => createPreset("Open threads", { status: "open" })} className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-bold hover:bg-slate-50">
          <Plus className="h-4 w-4" /> Open
        </button>
        <button onClick={() => createPreset("Escalated threads", { status: "escalated" })} className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-bold hover:bg-slate-50">
          <Plus className="h-4 w-4" /> Escalated
        </button>
        <button onClick={() => createPreset("Critical priority", { priority: "critical" })} className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-bold hover:bg-slate-50">
          <Plus className="h-4 w-4" /> Critical
        </button>
      </div>

      <div className="mt-5 space-y-2">
        {views.map((view) => (
          <div key={view.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <div className="text-sm font-black text-slate-950">{view.name}</div>
            <div className="mt-1 text-xs text-slate-500">{JSON.stringify(view.filters || {})}</div>
          </div>
        ))}
      </div>
    </section>
  )
}
