"use client"

import { useEffect, useState } from "react"
import { Lock, RefreshCw } from "lucide-react"

async function api(path: string, options?: RequestInit) {
  const res = await fetch(path, { ...options, headers: { "Content-Type": "application/json", ...(options?.headers || {}) } })
  return res.json()
}

export default function RouteProtectionPanel() {
  const [routes, setRoutes] = useState<string[]>([])
  const [status, setStatus] = useState("Ready")

  async function load() {
    const result = await api("/api/email-os/production/route-protection")
    setRoutes(result.data?.expectedProtectedRoutes || [])
  }

  async function seedChecks() {
    const result = await api("/api/email-os/production/route-protection", { method: "POST" })
    setStatus(result.ok ? "Route protection checks seeded" : result.error || "Failed")
    await load()
  }

  useEffect(() => { load() }, [])

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
            <Lock className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-950">Route Protection Review</h2>
            <p className="text-sm text-slate-9500">{status}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-bold hover:bg-slate-50">
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
          <button onClick={seedChecks} className="h-10 cursor-pointer rounded-xl bg-white px-3 text-sm font-bold text-slate-950">Seed Checks</button>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {routes.map((route) => (
          <div key={route} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="font-black text-slate-950">{route}</div>
            <div className="mt-1 text-xs font-black uppercase text-slate-500">authenticated</div>
          </div>
        ))}
      </div>
    </section>
  )
}
