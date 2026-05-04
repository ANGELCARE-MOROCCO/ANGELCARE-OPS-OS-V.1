"use client"

import { useMemo, useState } from "react"
import MarketActionButton from "@/components/market-os/market-action-button"

import {
  decisionLabel,
  executiveDecisions,
  executiveKpis,
  formatMad,
  type DecisionStatus,
  type ExecutiveRisk,
} from "@/lib/market-os/investor-marketing-command-center"

function badgeClass(value: string) {
  if (value === "critical" || value === "high" || value === "pending") return "border-red-200 bg-red-50 text-red-700"
  if (value === "medium" || value === "monitoring") return "border-amber-200 bg-amber-50 text-amber-700"
  if (value === "low" || value === "approved") return "border-emerald-200 bg-emerald-50 text-emerald-700"
  return "border-slate-200 bg-slate-50 text-slate-700"
}

export default function InvestorMarketingCommandCenter() {
  const [query, setQuery] = useState("")
  const [risk, setRisk] = useState<ExecutiveRisk | "all">("all")
  const [status, setStatus] = useState<DecisionStatus | "all">("all")

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()

    return executiveDecisions.filter((decision) => {
      const queryMatch =
        !q ||
        decision.title.toLowerCase().includes(q) ||
        decision.source.toLowerCase().includes(q) ||
        decision.owner.toLowerCase().includes(q)

      return queryMatch && (risk === "all" || decision.risk === risk) && (status === "all" || decision.status === status)
    })
  }, [query, risk, status])

  const totalImpact = executiveDecisions.reduce((sum, d) => sum + d.financialImpactMad, 0)
  const pendingDecisions = executiveDecisions.filter((d) => d.status === "pending").length
  const highRisk = executiveDecisions.filter((d) => d.risk === "high" || d.risk === "critical").length

  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-950">
      <section className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-[2rem] bg-slate-950 p-8 text-white">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-300">
            Market-OS · Pack 15
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight">
            CEO / Investor Marketing Command Center
          </h1>
          <p className="mt-4 max-w-3xl text-slate-300">
            This final consolidation layer turns Market-OS into an executive operating room:
            strategic KPIs, decision control, financial impact, risk exposure and management actions.
          </p>

          <div className="mt-8 grid gap-3 md:grid-cols-4">
            {executiveKpis.map((kpi) => (
              <div key={kpi.id} className="rounded-3xl bg-white/10 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs uppercase text-slate-300">{kpi.label}</p>
                  <span className={`rounded-full border px-2 py-1 text-[10px] font-bold ${badgeClass(kpi.risk)}`}>
                    {kpi.risk}
                  </span>
                </div>
                <p className="mt-2 text-2xl font-black">{kpi.value}</p>
                <p className="mt-1 text-xs text-slate-300">{kpi.trend}</p>
                <p className="mt-3 text-xs leading-5 text-slate-300">{kpi.interpretation}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-bold uppercase text-slate-500">Decision Impact</p>
            <p className="mt-2 text-2xl font-black">{formatMad(totalImpact)}</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-bold uppercase text-slate-500">Pending Decisions</p>
            <p className="mt-2 text-2xl font-black">{pendingDecisions}</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-bold uppercase text-slate-500">High Risk Items</p>
            <p className="mt-2 text-2xl font-black">{highRisk}</p>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-4">
          <div className="grid gap-3 md:grid-cols-3">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search decision, source, owner..."
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900"
            />

            <select value={risk} onChange={(e) => setRisk(e.target.value as ExecutiveRisk | "all")} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold">
              <option value="all">All risks</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            <select value={status} onChange={(e) => setStatus(e.target.value as DecisionStatus | "all")} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold">
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="monitoring">Monitoring</option>
            </select>
          </div>
        </div>

        <div className="grid gap-5">
          {filtered.map((decision) => (
            <article key={decision.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="mb-3 flex flex-wrap gap-2">
                    <span className={`rounded-full border px-3 py-1 text-xs font-bold ${badgeClass(decision.status)}`}>
                      {decisionLabel(decision.status)}
                    </span>
                    <span className={`rounded-full border px-3 py-1 text-xs font-bold ${badgeClass(decision.risk)}`}>
                      Risk: {decision.risk}
                    </span>
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-700">
                      Deadline: {decision.deadline}
                    </span>
                  </div>

                  <h2 className="text-xl font-black">{decision.title}</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Source: {decision.source} · Owner: {decision.owner}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4 text-right">
                  <p className="text-xs font-bold uppercase text-slate-500">Financial Impact</p>
                  <p className="mt-1 font-black">{formatMad(decision.financialImpactMad)}</p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs font-bold uppercase text-slate-500">Diagnosis</p>
                  <p className="mt-2 text-sm text-slate-700">{decision.diagnosis}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs font-bold uppercase text-slate-500">Recommended Decision</p>
                  <p className="mt-2 text-sm text-slate-700">{decision.recommendedDecision}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs font-bold uppercase text-slate-500">Next Action</p>
                  <p className="mt-2 text-sm text-slate-700">{decision.nextAction}</p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <MarketActionButton moduleKey="investor" engine="data" actionKey="approve_decision" actionLabel="Approve Decision" className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-bold text-white">Approve Decision</MarketActionButton>
                <MarketActionButton moduleKey="investor" engine="data" actionKey="create_executive_task" actionLabel="Create Executive Task" className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-bold">Create Executive Task</MarketActionButton>
                <MarketActionButton moduleKey="investor" engine="data" actionKey="request_revision" actionLabel="Request Revision" className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-bold">Request Revision</MarketActionButton>
                <MarketActionButton moduleKey="investor" engine="data" actionKey="escalate" actionLabel="Escalate" className="rounded-2xl border border-red-200 px-4 py-2 text-sm font-bold text-red-700">Escalate</MarketActionButton>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
