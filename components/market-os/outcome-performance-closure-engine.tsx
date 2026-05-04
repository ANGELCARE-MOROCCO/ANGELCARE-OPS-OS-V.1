"use client"

import { useMemo, useState } from "react"
import {
  formatMad,
  outcomeItems,
  statusLabel,
  type OutcomeRisk,
  type OutcomeStatus,
} from "@/lib/market-os/outcome-performance-closure-engine"

function badgeClass(value: string) {
  if (value === "critical" || value === "high" || value === "failed") return "border-red-200 bg-red-50 text-red-700"
  if (value === "medium" || value === "measuring" || value === "improve") return "border-amber-200 bg-amber-50 text-amber-700"
  if (value === "low" || value === "successful" || value === "repeat") return "border-emerald-200 bg-emerald-50 text-emerald-700"
  return "border-slate-200 bg-slate-50 text-slate-700"
}

function Bar({ value }: { value: number }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
      <div className="h-full rounded-full bg-slate-950" style={{ width: `${Math.min(100, value)}%` }} />
    </div>
  )
}
import MarketActionButton from "@/components/market-os/market-action-button"

export default function OutcomePerformanceClosureEngine() {
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState<OutcomeStatus | "all">("all")
  const [risk, setRisk] = useState<OutcomeRisk | "all">("all")

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()

    return outcomeItems.filter((item) => {
      const queryMatch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.linkedChain.toLowerCase().includes(q) ||
        item.owner.toLowerCase().includes(q)

      return queryMatch && (status === "all" || item.status === status) && (risk === "all" || item.risk === risk)
    })
  }, [query, status, risk])

  const totalImpact = outcomeItems.reduce((sum, item) => sum + item.revenueImpactMad, 0)
  const successful = outcomeItems.filter((item) => item.status === "successful" || item.status === "repeat").length
  const needsImprove = outcomeItems.filter((item) => item.status === "improve" || item.status === "failed").length
  const avgConfidence = Math.round(outcomeItems.reduce((sum, item) => sum + item.confidence, 0) / outcomeItems.length)

  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-950">
      <section className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-[2rem] bg-slate-950 p-8 text-white">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-300">
            Market-OS · Pack 30
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight">
            Outcome Tracking & Performance Closure Engine
          </h1>
          <p className="mt-4 max-w-3xl text-slate-300">
            This layer closes the execution loop: every AI task chain and campaign action must be measured,
            judged, converted into learning, then closed, repeated or improved.
          </p>

          <div className="mt-8 grid gap-3 md:grid-cols-4">
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="text-xs uppercase text-slate-300">Revenue Impact</p>
              <p className="mt-2 text-2xl font-black">{formatMad(totalImpact)}</p>
            </div>
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="text-xs uppercase text-slate-300">Successful / Repeat</p>
              <p className="mt-2 text-3xl font-black">{successful}</p>
            </div>
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="text-xs uppercase text-slate-300">Need Improve</p>
              <p className="mt-2 text-3xl font-black">{needsImprove}</p>
            </div>
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="text-xs uppercase text-slate-300">Confidence</p>
              <p className="mt-2 text-3xl font-black">{avgConfidence}%</p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-4">
          <div className="grid gap-3 md:grid-cols-3">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search outcome, chain, owner..."
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900"
            />

            <select value={status} onChange={(e) => setStatus(e.target.value as OutcomeStatus | "all")} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold">
              <option value="all">All statuses</option>
              <option value="open">Open</option>
              <option value="measuring">Measuring</option>
              <option value="successful">Successful</option>
              <option value="failed">Failed</option>
              <option value="repeat">Repeat</option>
              <option value="improve">Improve</option>
            </select>

            <select value={risk} onChange={(e) => setRisk(e.target.value as OutcomeRisk | "all")} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold">
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
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="mb-3 flex flex-wrap gap-2">
                    <span className={`rounded-full border px-3 py-1 text-xs font-bold ${badgeClass(item.status)}`}>
                      {statusLabel(item.status)}
                    </span>
                    <span className={`rounded-full border px-3 py-1 text-xs font-bold ${badgeClass(item.risk)}`}>
                      Risk: {item.risk}
                    </span>
                  </div>

                  <h2 className="text-xl font-black">{item.title}</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Chain: {item.linkedChain} · Owner: {item.owner}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4 text-right">
                  <p className="text-xs font-bold uppercase text-slate-500">Impact</p>
                  <p className="mt-1 font-black">{formatMad(item.revenueImpactMad)}</p>
                  <p className="text-xs text-slate-500">Confidence: {item.confidence}%</p>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-slate-200 p-4">
                <div className="mb-2 flex justify-between text-sm">
                  <span className="font-bold">Outcome Confidence</span>
                  <span>{item.confidence}%</span>
                </div>
                <Bar value={item.confidence} />
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs font-bold uppercase text-slate-500">Before</p>
                  <p className="mt-2 text-sm text-slate-700">{item.beforeMetric}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs font-bold uppercase text-slate-500">After</p>
                  <p className="mt-2 text-sm text-slate-700">{item.afterMetric}</p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs font-bold uppercase text-slate-500">Result Summary</p>
                  <p className="mt-2 text-sm text-slate-700">{item.resultSummary}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs font-bold uppercase text-slate-500">Lesson Learned</p>
                  <p className="mt-2 text-sm text-slate-700">{item.lessonLearned}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs font-bold uppercase text-slate-500">Decision</p>
                  <p className="mt-2 text-sm text-slate-700">{item.decision}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs font-bold uppercase text-slate-500">Next Action</p>
                  <p className="mt-2 text-sm text-slate-700">{item.nextAction}</p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <MarketActionButton moduleKey="outcomes" engine="data" actionKey="execute_close_outcome" actionLabel="Close Outcome" className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-bold text-white">Close Outcome</MarketActionButton>
                <MarketActionButton moduleKey="outcomes" engine="data" actionKey="convert_to_playbook" actionLabel="Convert to Playbook" className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-bold">Convert to Playbook</MarketActionButton>
                <MarketActionButton moduleKey="outcomes" engine="data" actionKey="execute_repeat_action" actionLabel="Repeat Action" className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-bold">Repeat Action</MarketActionButton>
                <MarketActionButton moduleKey="outcomes" engine="data" actionKey="create_improvement_task" actionLabel="Create Improvement Task" className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-bold">Create Improvement Task</MarketActionButton>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
