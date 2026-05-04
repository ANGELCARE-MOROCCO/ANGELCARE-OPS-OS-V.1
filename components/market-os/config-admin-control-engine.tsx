"use client"

import { useMemo, useState } from "react"
import {
  adminConfigs,
  statusLabel,
  typeLabel,
  type ConfigRisk,
  type ConfigStatus,
  type ConfigType,
} from "@/lib/market-os/config-admin-control-engine"

function badgeClass(value: string) {
  if (value === "critical" || value === "high" || value === "draft") return "border-red-200 bg-red-50 text-red-700"
  if (value === "medium" || value === "needs_review") return "border-amber-200 bg-amber-50 text-amber-700"
  if (value === "low" || value === "active") return "border-emerald-200 bg-emerald-50 text-emerald-700"
  return "border-slate-200 bg-slate-50 text-slate-700"
}
import MarketActionButton from "@/components/market-os/market-action-button"

export default function ConfigAdminControlEngine() {
  const [query, setQuery] = useState("")
  const [type, setType] = useState<ConfigType | "all">("all")
  const [status, setStatus] = useState<ConfigStatus | "all">("all")
  const [risk, setRisk] = useState<ConfigRisk | "all">("all")

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()

    return adminConfigs.filter((config) => {
      const queryMatch =
        !q ||
        config.title.toLowerCase().includes(q) ||
        config.module.toLowerCase().includes(q) ||
        config.owner.toLowerCase().includes(q)

      return (
        queryMatch &&
        (type === "all" || config.type === type) &&
        (status === "all" || config.status === status) &&
        (risk === "all" || config.risk === risk)
      )
    })
  }, [query, type, status, risk])

  const activeCount = adminConfigs.filter((c) => c.status === "active").length
  const draftCount = adminConfigs.filter((c) => c.status === "draft").length
  const highRisk = adminConfigs.filter((c) => c.risk === "high" || c.risk === "critical").length
  const reviewCount = adminConfigs.filter((c) => c.status === "needs_review").length

  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-950">
      <section className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-[2rem] bg-slate-950 p-8 text-white">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-300">
            Market-OS · Pack 24
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight">
            Market-OS Configuration & Admin Control Engine
          </h1>
          <p className="mt-4 max-w-3xl text-slate-300">
            This layer makes Market-OS configurable and governance-ready: workflows, SLA rules,
            approval gates, risk settings, visibility, priorities and role-based control.
          </p>

          <div className="mt-8 grid gap-3 md:grid-cols-4">
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="text-xs uppercase text-slate-300">Active Rules</p>
              <p className="mt-2 text-3xl font-black">{activeCount}</p>
            </div>
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="text-xs uppercase text-slate-300">Draft Rules</p>
              <p className="mt-2 text-3xl font-black">{draftCount}</p>
            </div>
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="text-xs uppercase text-slate-300">High Risk Configs</p>
              <p className="mt-2 text-3xl font-black">{highRisk}</p>
            </div>
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="text-xs uppercase text-slate-300">Need Review</p>
              <p className="mt-2 text-3xl font-black">{reviewCount}</p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-4">
          <div className="grid gap-3 md:grid-cols-4">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search config, module, owner..."
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900"
            />

            <select value={type} onChange={(e) => setType(e.target.value as ConfigType | "all")} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold">
              <option value="all">All types</option>
              <option value="workflow">Workflow</option>
              <option value="sla">SLA</option>
              <option value="approval">Approval</option>
              <option value="risk">Risk</option>
              <option value="visibility">Visibility</option>
              <option value="priority">Priority</option>
            </select>

            <select value={status} onChange={(e) => setStatus(e.target.value as ConfigStatus | "all")} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold">
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="needs_review">Needs Review</option>
            </select>

            <select value={risk} onChange={(e) => setRisk(e.target.value as ConfigRisk | "all")} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold">
              <option value="all">All risks</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        <div className="grid gap-5">
          {filtered.map((config) => (
            <article key={config.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="mb-3 flex flex-wrap gap-2">
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-700">
                      Type: {typeLabel(config.type)}
                    </span>
                    <span className={`rounded-full border px-3 py-1 text-xs font-bold ${badgeClass(config.status)}`}>
                      {statusLabel(config.status)}
                    </span>
                    <span className={`rounded-full border px-3 py-1 text-xs font-bold ${badgeClass(config.risk)}`}>
                      Risk: {config.risk}
                    </span>
                  </div>

                  <h2 className="text-xl font-black">{config.title}</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Module: {config.module} · Owner: {config.owner}
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs font-bold uppercase text-slate-500">Current Rule</p>
                  <p className="mt-2 text-sm text-slate-700">{config.currentRule}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs font-bold uppercase text-slate-500">Business Reason</p>
                  <p className="mt-2 text-sm text-slate-700">{config.businessReason}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs font-bold uppercase text-slate-500">Impact</p>
                  <p className="mt-2 text-sm text-slate-700">{config.impact}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs font-bold uppercase text-slate-500">Next Action</p>
                  <p className="mt-2 text-sm text-slate-700">{config.nextAction}</p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <MarketActionButton moduleKey="config" engine="system" actionKey="activate_config" actionLabel="Activate Config" className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-bold text-white">Activate Config</MarketActionButton>
                <MarketActionButton moduleKey="config" engine="system" actionKey="execute_edit_rule" actionLabel="Edit Rule" className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-bold">Edit Rule</MarketActionButton>
                <MarketActionButton moduleKey="config" engine="system" actionKey="request_review" actionLabel="Request Review" className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-bold">Request Review</MarketActionButton>
                <MarketActionButton moduleKey="config" engine="system" actionKey="open_audit" actionLabel="Open Audit" className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-bold">Open Audit</MarketActionButton>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
