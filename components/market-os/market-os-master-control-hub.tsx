"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import {
  marketOsEngines,
  statusLabel,
  type HubRisk,
  type HubStatus,
} from "@/lib/market-os/market-os-master-control-hub"

function badgeClass(value: string) {
  if (value === "critical" || value === "high" || value === "blocked") return "border-red-200 bg-red-50 text-red-700"
  if (value === "medium" || value === "watch") return "border-amber-200 bg-amber-50 text-amber-700"
  if (value === "low" || value === "active" || value === "ready") return "border-emerald-200 bg-emerald-50 text-emerald-700"
  return "border-slate-200 bg-slate-50 text-slate-700"
}

export default function MarketOsMasterControlHub() {
  const [query, setQuery] = useState("")
  const [risk, setRisk] = useState<HubRisk | "all">("all")
  const [status, setStatus] = useState<HubStatus | "all">("all")

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()

    return marketOsEngines.filter((engine) => {
      const queryMatch =
        !q ||
        engine.title.toLowerCase().includes(q) ||
        engine.layer.toLowerCase().includes(q) ||
        engine.owner.toLowerCase().includes(q) ||
        engine.purpose.toLowerCase().includes(q)

      return queryMatch && (risk === "all" || engine.risk === risk) && (status === "all" || engine.status === status)
    })
  }, [query, risk, status])

  const highRisk = marketOsEngines.filter((e) => e.risk === "high" || e.risk === "critical").length
  const watchItems = marketOsEngines.filter((e) => e.status === "watch" || e.status === "blocked").length
  const activeItems = marketOsEngines.filter((e) => e.status === "active").length
  const totalEngines = marketOsEngines.length

  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-950">
      <section className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-[2rem] bg-slate-950 p-8 text-white">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-300">
            Market-OS · Pack 17
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight">
            Market-OS Master Control Hub
          </h1>
          <p className="mt-4 max-w-3xl text-slate-300">
            This hub connects every Market-OS execution engine into one operational entry point:
            strategy, execution, approval, ROI, risk, campaigns, content, research, offers,
            sales, partnerships, SEO, PR, workforce, executive control and learning memory.
          </p>

          <div className="mt-8 grid gap-3 md:grid-cols-4">
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="text-xs uppercase text-slate-300">Total Engines</p>
              <p className="mt-2 text-3xl font-black">{totalEngines}</p>
            </div>
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="text-xs uppercase text-slate-300">Active Engines</p>
              <p className="mt-2 text-3xl font-black">{activeItems}</p>
            </div>
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="text-xs uppercase text-slate-300">Watch / Blocked</p>
              <p className="mt-2 text-3xl font-black">{watchItems}</p>
            </div>
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="text-xs uppercase text-slate-300">High Risk</p>
              <p className="mt-2 text-3xl font-black">{highRisk}</p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-4">
          <div className="grid gap-3 md:grid-cols-3">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search engine, layer, owner, purpose..."
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900"
            />

            <select value={risk} onChange={(e) => setRisk(e.target.value as HubRisk | "all")} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold">
              <option value="all">All risks</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            <select value={status} onChange={(e) => setStatus(e.target.value as HubStatus | "all")} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold">
              <option value="all">All statuses</option>
              <option value="ready">Ready</option>
              <option value="active">Active</option>
              <option value="watch">Watch</option>
              <option value="blocked">Blocked</option>
            </select>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {filtered.map((engine) => (
            <article key={engine.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-3 flex flex-wrap gap-2">
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-700">
                  Layer: {engine.layer}
                </span>
                <span className={`rounded-full border px-3 py-1 text-xs font-bold ${badgeClass(engine.status)}`}>
                  {statusLabel(engine.status)}
                </span>
                <span className={`rounded-full border px-3 py-1 text-xs font-bold ${badgeClass(engine.risk)}`}>
                  Risk: {engine.risk}
                </span>
              </div>

              <h2 className="text-xl font-black">{engine.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{engine.purpose}</p>

              <div className="mt-4 grid gap-3 lg:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs font-bold uppercase text-slate-500">Owner</p>
                  <p className="mt-2 text-sm font-semibold text-slate-800">{engine.owner}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs font-bold uppercase text-slate-500">Next Action</p>
                  <p className="mt-2 text-sm text-slate-700">{engine.nextAction}</p>
                </div>
              </div>

              <div className="mt-5">
                <Link
                  href={engine.route}
                  className="inline-flex rounded-2xl bg-slate-950 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800"
                >
                  Open Engine
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
