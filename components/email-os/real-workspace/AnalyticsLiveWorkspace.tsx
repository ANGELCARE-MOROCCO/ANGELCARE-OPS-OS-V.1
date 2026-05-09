"use client"

import { useEffect, useState } from "react"
import { realEmailOSRequest } from "@/lib/email-os/real/client"
import { BarChart3, RefreshCw } from "lucide-react"

export default function AnalyticsLiveWorkspace() {
  const [counts, setCounts] = useState<Record<string, number>>({})
  const entities = ["mailboxes", "templates", "automation", "approvals", "outbox", "audit", "runtime-events"]

  async function load() {
    const next: Record<string, number> = {}
    for (const entity of entities) {
      const result = await realEmailOSRequest<any[]>(`/api/email-os/real/${entity}`)
      next[entity] = result.ok ? (result.data || []).length : 0
    }
    setCounts(next)
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <div className="min-h-full bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white"><BarChart3 className="h-5 w-5" /></div>
              <div>
                <h1 className="text-2xl font-black text-slate-950">Live Email-OS Analytics</h1>
                <p className="mt-1 text-sm text-slate-500">Counts are loaded from real API/database records.</p>
              </div>
            </div>
            <button onClick={load} className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold shadow-sm">
              <RefreshCw className="h-4 w-4" /> Refresh
            </button>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {entities.map((entity) => (
            <div key={entity} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="text-xs font-black uppercase tracking-wide text-slate-400">{entity}</div>
              <div className="mt-3 text-3xl font-black text-slate-950">{counts[entity] ?? 0}</div>
              <div className="mt-2 text-sm text-slate-500">Live record count</div>
            </div>
          ))}
        </section>
      </div>
    </div>
  )
}
