"use client"

import { useMemo, useState } from "react"
import {
  areaLabel,
  doctrineRules,
  statusLabel,
  type DoctrineArea,
  type DoctrineRisk,
  type DoctrineStatus,
} from "@/lib/market-os/operating-doctrine-engine"

function badgeClass(value: string) {
  if (value === "critical" || value === "high" || value === "draft") return "border-red-200 bg-red-50 text-red-700"
  if (value === "medium" || value === "review") return "border-amber-200 bg-amber-50 text-amber-700"
  if (value === "low" || value === "active" || value === "locked") return "border-emerald-200 bg-emerald-50 text-emerald-700"
  return "border-slate-200 bg-slate-50 text-slate-700"
}
import MarketActionButton from "@/components/market-os/market-action-button"

export default function OperatingDoctrineEngine() {
  const [query, setQuery] = useState("")
  const [area, setArea] = useState<DoctrineArea | "all">("all")
  const [status, setStatus] = useState<DoctrineStatus | "all">("all")
  const [risk, setRisk] = useState<DoctrineRisk | "all">("all")

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()

    return doctrineRules.filter((item) => {
      const queryMatch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.owner.toLowerCase().includes(q) ||
        item.rule.toLowerCase().includes(q)

      return (
        queryMatch &&
        (area === "all" || item.area === area) &&
        (status === "all" || item.status === status) &&
        (risk === "all" || item.risk === risk)
      )
    })
  }, [query, area, status, risk])

  const activeRules = doctrineRules.filter((r) => r.status === "active" || r.status === "locked").length
  const reviewRules = doctrineRules.filter((r) => r.status === "review").length
  const highRisk = doctrineRules.filter((r) => r.risk === "high" || r.risk === "critical").length
  const totalRules = doctrineRules.length

  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-950">
      <section className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-[2rem] bg-slate-950 p-8 text-white">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-300">
            Market-OS · Pack 31
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight">
            Market-OS Final Operating Doctrine Engine
          </h1>
          <p className="mt-4 max-w-3xl text-slate-300">
            This layer converts all Market-OS execution into a permanent operating doctrine:
            strategic rules, governance standards, AI execution laws, reporting discipline and institutional control.
          </p>

          <div className="mt-8 grid gap-3 md:grid-cols-4">
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="text-xs uppercase text-slate-300">Total Doctrine Rules</p>
              <p className="mt-2 text-3xl font-black">{totalRules}</p>
            </div>
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="text-xs uppercase text-slate-300">Active / Locked</p>
              <p className="mt-2 text-3xl font-black">{activeRules}</p>
            </div>
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="text-xs uppercase text-slate-300">Need Review</p>
              <p className="mt-2 text-3xl font-black">{reviewRules}</p>
            </div>
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="text-xs uppercase text-slate-300">High Risk Rules</p>
              <p className="mt-2 text-3xl font-black">{highRisk}</p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-4">
          <div className="grid gap-3 md:grid-cols-4">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search doctrine, owner, rule..."
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900"
            />

            <select value={area} onChange={(e) => setArea(e.target.value as DoctrineArea | "all")} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold">
              <option value="all">All areas</option>
              <option value="strategy">Strategy</option>
              <option value="execution">Execution</option>
              <option value="governance">Governance</option>
              <option value="ai">AI</option>
              <option value="growth">Growth</option>
              <option value="reporting">Reporting</option>
            </select>

            <select value={status} onChange={(e) => setStatus(e.target.value as DoctrineStatus | "all")} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold">
              <option value="all">All statuses</option>
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="review">Review</option>
              <option value="locked">Locked</option>
            </select>

            <select value={risk} onChange={(e) => setRisk(e.target.value as DoctrineRisk | "all")} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold">
              <option value="all">All risks</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        <div className="grid gap-5">
          {filtered.map((item) => (
            <article key={item.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-3 flex flex-wrap gap-2">
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-700">
                  Area: {areaLabel(item.area)}
                </span>
                <span className={`rounded-full border px-3 py-1 text-xs font-bold ${badgeClass(item.status)}`}>
                  {statusLabel(item.status)}
                </span>
                <span className={`rounded-full border px-3 py-1 text-xs font-bold ${badgeClass(item.risk)}`}>
                  Risk: {item.risk}
                </span>
              </div>

              <h2 className="text-xl font-black">{item.title}</h2>
              <p className="mt-1 text-sm text-slate-500">Owner: {item.owner}</p>

              <div className="mt-5 grid gap-4 lg:grid-cols-5">
                <div className="rounded-2xl border border-slate-200 p-4 lg:col-span-2">
                  <p className="text-xs font-bold uppercase text-slate-500">Rule</p>
                  <p className="mt-2 text-sm font-semibold text-slate-800">{item.rule}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs font-bold uppercase text-slate-500">Reason</p>
                  <p className="mt-2 text-sm text-slate-700">{item.reason}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs font-bold uppercase text-slate-500">Enforcement</p>
                  <p className="mt-2 text-sm text-slate-700">{item.enforcement}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs font-bold uppercase text-slate-500">Success Condition</p>
                  <p className="mt-2 text-sm text-slate-700">{item.successCondition}</p>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase text-slate-500">Next Action</p>
                <p className="mt-2 text-sm text-slate-700">{item.nextAction}</p>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <MarketActionButton moduleKey="doctrine" engine="system" actionKey="execute_lock_doctrine" actionLabel="Lock Doctrine" className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-bold text-white">Lock Doctrine</MarketActionButton>
                <MarketActionButton moduleKey="doctrine" engine="system" actionKey="create_enforcement_task" actionLabel="Create Enforcement Task" className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-bold">Create Enforcement Task</MarketActionButton>
                <MarketActionButton moduleKey="doctrine" engine="system" actionKey="execute_send_to_board" actionLabel="Send to Board" className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-bold">Send to Board</MarketActionButton>
                <MarketActionButton moduleKey="doctrine" engine="system" actionKey="add_audit_rule" actionLabel="Add Audit Rule" className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-bold">Add Audit Rule</MarketActionButton>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
