"use client"

import { useMemo, useState } from "react"
import {
  formatMad,
  riskLabel,
  riskSignals,
  statusLabel,
  type RiskLevel,
  type SignalStatus,
  type SignalType,
} from "@/lib/market-os/risk-signals-ai-engine"

function badgeClass(value: string) {
  if (value === "critical" || value === "high" || value === "new") {
    return "border-red-200 bg-red-50 text-red-700"
  }
  if (value === "medium" || value === "assigned" || value === "monitoring") {
    return "border-amber-200 bg-amber-50 text-amber-700"
  }
  if (value === "low" || value === "resolved") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700"
  }
  return "border-slate-200 bg-slate-50 text-slate-700"
}
import MarketActionButton from "@/components/market-os/market-action-button"

export default function RiskSignalsAiEngine() {
  const [query, setQuery] = useState("")
  const [level, setLevel] = useState<RiskLevel | "all">("all")
  const [status, setStatus] = useState<SignalStatus | "all">("all")
  const [type, setType] = useState<SignalType | "all">("all")

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()

    return riskSignals.filter((signal) => {
      const queryMatch =
        !q ||
        signal.title.toLowerCase().includes(q) ||
        signal.owner.toLowerCase().includes(q) ||
        signal.source.toLowerCase().includes(q)

      const levelMatch = level === "all" || signal.level === level
      const statusMatch = status === "all" || signal.status === status
      const typeMatch = type === "all" || signal.type === type

      return queryMatch && levelMatch && statusMatch && typeMatch
    })
  }, [query, level, status, type])

  const criticalCount = riskSignals.filter((s) => s.level === "critical" || s.level === "high").length
  const totalImpact = riskSignals.reduce((sum, s) => sum + s.impactMad, 0)
  const newSignals = riskSignals.filter((s) => s.status === "new").length
  const avgConfidence = Math.round(
    riskSignals.reduce((sum, s) => sum + s.confidence, 0) / riskSignals.length
  )

  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-950">
      <section className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-[2rem] bg-slate-950 p-8 text-white">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-300">
            Market-OS · Pack 5
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight">
            Risk, Signals & AI Recommendation Engine
          </h1>
          <p className="mt-4 max-w-3xl text-slate-300">
            This anticipative layer detects weak signals from strategy, execution, approvals and ROI.
            It classifies risk, estimates business impact, recommends action and prepares the next execution task.
          </p>

          <div className="mt-8 grid gap-3 md:grid-cols-4">
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="text-xs uppercase text-slate-300">High/Critical Risks</p>
              <p className="mt-2 text-3xl font-black">{criticalCount}</p>
            </div>
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="text-xs uppercase text-slate-300">Potential Impact</p>
              <p className="mt-2 text-2xl font-black">{formatMad(totalImpact)}</p>
            </div>
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="text-xs uppercase text-slate-300">New Signals</p>
              <p className="mt-2 text-3xl font-black">{newSignals}</p>
            </div>
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="text-xs uppercase text-slate-300">AI Confidence</p>
              <p className="mt-2 text-3xl font-black">{avgConfidence}%</p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-4">
          <div className="grid gap-3 md:grid-cols-4">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search signal, owner, source..."
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900"
            />

            <select value={level} onChange={(e) => setLevel(e.target.value as RiskLevel | "all")} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold">
              <option value="all">All risk levels</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            <select value={status} onChange={(e) => setStatus(e.target.value as SignalStatus | "all")} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold">
              <option value="all">All statuses</option>
              <option value="new">New</option>
              <option value="assigned">Assigned</option>
              <option value="monitoring">Monitoring</option>
              <option value="resolved">Resolved</option>
            </select>

            <select value={type} onChange={(e) => setType(e.target.value as SignalType | "all")} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold">
              <option value="all">All signal types</option>
              <option value="financial">Financial</option>
              <option value="execution">Execution</option>
              <option value="brand">Brand</option>
              <option value="conversion">Conversion</option>
              <option value="market">Market</option>
              <option value="team">Team</option>
            </select>
          </div>
        </div>

        <div className="grid gap-5">
          {filtered.map((signal) => (
            <article key={signal.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="mb-3 flex flex-wrap gap-2">
                    <span className={`rounded-full border px-3 py-1 text-xs font-bold ${badgeClass(signal.level)}`}>
                      Risk: {riskLabel(signal.level)}
                    </span>
                    <span className={`rounded-full border px-3 py-1 text-xs font-bold ${badgeClass(signal.status)}`}>
                      {statusLabel(signal.status)}
                    </span>
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-700">
                      Type: {signal.type}
                    </span>
                  </div>

                  <h2 className="text-xl font-black">{signal.title}</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Source: {signal.source} · Owner: {signal.owner} · Detected: {signal.detectedAt}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4 text-right">
                  <p className="text-xs font-bold uppercase text-slate-500">Estimated Impact</p>
                  <p className="mt-1 font-black">{formatMad(signal.impactMad)}</p>
                  <p className="text-xs text-slate-500">Confidence: {signal.confidence}%</p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs font-bold uppercase text-slate-500">AI Diagnosis</p>
                  <p className="mt-2 text-sm text-slate-700">{signal.diagnosis}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs font-bold uppercase text-slate-500">Recommended Action</p>
                  <p className="mt-2 text-sm text-slate-700">{signal.recommendedAction}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs font-bold uppercase text-slate-500">Trigger Task</p>
                  <p className="mt-2 text-sm text-slate-700">{signal.triggerTask}</p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <MarketActionButton moduleKey="risk" engine="data" actionKey="create_corrective_task" actionLabel="Create Corrective Task" className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-bold text-white">Create Corrective Task</MarketActionButton>
                <MarketActionButton moduleKey="risk" engine="data" actionKey="assign_owner" actionLabel="Assign Owner" className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-bold">Assign Owner</MarketActionButton>
                <MarketActionButton moduleKey="risk" engine="data" actionKey="execute_monitor_signal" actionLabel="Monitor Signal" className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-bold">Monitor Signal</MarketActionButton>
                <MarketActionButton moduleKey="risk" engine="data" actionKey="escalate_risk" actionLabel="Escalate Risk" className="rounded-2xl border border-red-200 px-4 py-2 text-sm font-bold text-red-700">Escalate Risk</MarketActionButton>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
