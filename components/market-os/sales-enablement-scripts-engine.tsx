"use client"

import { useMemo, useState } from "react"
import {
  scripts,
  stageLabel,
  type ScriptRisk,
  type ScriptStage,
} from "@/lib/market-os/sales-enablement-scripts-engine"

function badgeClass(value: string) {
  if (value === "critical" || value === "high" || value === "draft") return "border-red-200 bg-red-50 text-red-700"
  if (value === "medium" || value === "review" || value === "optimization") return "border-amber-200 bg-amber-50 text-amber-700"
  if (value === "low" || value === "approved" || value === "assigned" || value === "in_use") return "border-emerald-200 bg-emerald-50 text-emerald-700"
  return "border-slate-200 bg-slate-50 text-slate-700"
}

function Bar({ value }: { value: number }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
      <div className="h-full rounded-full bg-slate-950" style={{ width: `${value}%` }} />
    </div>
  )
}
import MarketActionButton from "@/components/market-os/market-action-button"

export default function SalesEnablementScriptsEngine() {
  const [query, setQuery] = useState("")
  const [stage, setStage] = useState<ScriptStage | "all">("all")
  const [risk, setRisk] = useState<ScriptRisk | "all">("all")

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()

    return scripts.filter((script) => {
      const queryMatch =
        !q ||
        script.title.toLowerCase().includes(q) ||
        script.linkedOffer.toLowerCase().includes(q) ||
        script.scenario.toLowerCase().includes(q) ||
        script.owner.toLowerCase().includes(q)

      const stageMatch = stage === "all" || script.stage === stage
      const riskMatch = risk === "all" || script.risk === risk

      return queryMatch && stageMatch && riskMatch
    })
  }, [query, stage, risk])

  const avgConversion = (scripts.reduce((sum, s) => sum + s.conversionRate, 0) / scripts.length).toFixed(1)
  const avgCoverage = Math.round(scripts.reduce((sum, s) => sum + s.objectionCoverage, 0) / scripts.length)
  const assignedAgents = scripts.reduce((sum, s) => sum + s.assignedAgents, 0)
  const highRisk = scripts.filter((s) => s.risk === "high" || s.risk === "critical").length

  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-950">
      <section className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-[2rem] bg-slate-950 p-8 text-white">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-300">
            Market-OS · Pack 10
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight">
            Sales Enablement, Scripts & Objection Intelligence Engine
          </h1>
          <p className="mt-4 max-w-3xl text-slate-300">
            This layer converts offers into real sales execution: scripts, objection handling,
            agent assignment, usage feedback, conversion tracking and continuous improvement.
          </p>

          <div className="mt-8 grid gap-3 md:grid-cols-4">
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="text-xs uppercase text-slate-300">Avg Conversion</p>
              <p className="mt-2 text-3xl font-black">{avgConversion}%</p>
            </div>
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="text-xs uppercase text-slate-300">Objection Coverage</p>
              <p className="mt-2 text-3xl font-black">{avgCoverage}%</p>
            </div>
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="text-xs uppercase text-slate-300">Assigned Agents</p>
              <p className="mt-2 text-3xl font-black">{assignedAgents}</p>
            </div>
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="text-xs uppercase text-slate-300">High Risk Scripts</p>
              <p className="mt-2 text-3xl font-black">{highRisk}</p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-4">
          <div className="grid gap-3 md:grid-cols-3">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search script, offer, scenario, owner..."
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900"
            />

            <select value={stage} onChange={(e) => setStage(e.target.value as ScriptStage | "all")} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold">
              <option value="all">All stages</option>
              <option value="draft">Draft</option>
              <option value="review">Review</option>
              <option value="approved">Approved</option>
              <option value="assigned">Assigned</option>
              <option value="in_use">In Use</option>
              <option value="optimization">Optimization</option>
            </select>

            <select value={risk} onChange={(e) => setRisk(e.target.value as ScriptRisk | "all")} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold">
              <option value="all">All risks</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        <div className="grid gap-5">
          {filtered.map((script) => (
            <article key={script.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="mb-3 flex flex-wrap gap-2">
                    <span className={`rounded-full border px-3 py-1 text-xs font-bold ${badgeClass(script.stage)}`}>
                      Stage: {stageLabel(script.stage)}
                    </span>
                    <span className={`rounded-full border px-3 py-1 text-xs font-bold ${badgeClass(script.risk)}`}>
                      Risk: {script.risk}
                    </span>
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-700">
                      Channel: {script.channel}
                    </span>
                  </div>

                  <h2 className="text-xl font-black">{script.title}</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Offer: {script.linkedOffer} · Scenario: {script.scenario} · Owner: {script.owner}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4 text-right">
                  <p className="text-xs font-bold uppercase text-slate-500">Conversion</p>
                  <p className="mt-1 font-black">{script.conversionRate}%</p>
                  <p className="text-xs text-slate-500">Usage: {script.usageCount}</p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 p-4">
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="font-bold">Objection Coverage</span>
                    <span>{script.objectionCoverage}%</span>
                  </div>
                  <Bar value={script.objectionCoverage} />
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="font-bold">Confidence Score</span>
                    <span>{script.confidenceScore}%</span>
                  </div>
                  <Bar value={script.confidenceScore} />
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs font-bold uppercase text-slate-500">Assigned Agents</p>
                  <p className="mt-1 text-lg font-black">{script.assignedAgents}</p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs font-bold uppercase text-slate-500">Top Objection</p>
                  <p className="mt-2 text-sm text-slate-700">{script.topObjection}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs font-bold uppercase text-slate-500">Weak Point</p>
                  <p className="mt-2 text-sm text-slate-700">{script.weakPoint}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs font-bold uppercase text-slate-500">Improvement Action</p>
                  <p className="mt-2 text-sm text-slate-700">{script.improvementAction}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs font-bold uppercase text-slate-500">Expected Impact</p>
                  <p className="mt-2 text-sm text-slate-700">{script.expectedImpact}</p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <MarketActionButton moduleKey="enablement" engine="content" actionKey="assign_to_agents" actionLabel="Assign to Agents" className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-bold text-white">Assign to Agents</MarketActionButton>
                <MarketActionButton moduleKey="enablement" engine="content" actionKey="add_objection" actionLabel="Add Objection" className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-bold">Add Objection</MarketActionButton>
                <MarketActionButton moduleKey="enablement" engine="content" actionKey="request_review" actionLabel="Request Review" className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-bold">Request Review</MarketActionButton>
                <MarketActionButton moduleKey="enablement" engine="content" actionKey="execute_optimize_script" actionLabel="Optimize Script" className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-bold">Optimize Script</MarketActionButton>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
