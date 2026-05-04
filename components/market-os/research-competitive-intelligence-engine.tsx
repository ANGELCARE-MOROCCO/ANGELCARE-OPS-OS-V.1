"use client"

import { useMemo, useState } from "react"
import {
  formatMad,
  researchSignals,
  statusLabel,
  typeLabel,
  type OpportunityLevel,
  type ResearchStatus,
  type ResearchType,
} from "@/lib/market-os/research-competitive-intelligence-engine"

function badgeClass(value: string) {
  if (value === "critical" || value === "high" || value === "new") {
    return "border-red-200 bg-red-50 text-red-700"
  }
  if (value === "medium" || value === "assigned" || value === "validated") {
    return "border-amber-200 bg-amber-50 text-amber-700"
  }
  if (value === "low" || value === "converted") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700"
  }
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

export default function ResearchCompetitiveIntelligenceEngine() {
  const [query, setQuery] = useState("")
  const [type, setType] = useState<ResearchType | "all">("all")
  const [status, setStatus] = useState<ResearchStatus | "all">("all")
  const [opportunity, setOpportunity] = useState<OpportunityLevel | "all">("all")

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()

    return researchSignals.filter((signal) => {
      const queryMatch =
        !q ||
        signal.title.toLowerCase().includes(q) ||
        signal.market.toLowerCase().includes(q) ||
        signal.source.toLowerCase().includes(q) ||
        signal.owner.toLowerCase().includes(q)

      const typeMatch = type === "all" || signal.type === type
      const statusMatch = status === "all" || signal.status === status
      const opportunityMatch = opportunity === "all" || signal.opportunity === opportunity

      return queryMatch && typeMatch && statusMatch && opportunityMatch
    })
  }, [query, type, status, opportunity])

  const totalPotential = researchSignals.reduce((sum, s) => sum + s.revenuePotentialMad, 0)
  const highOpp = researchSignals.filter((s) => s.opportunity === "high" || s.opportunity === "critical").length
  const avgConfidence = Math.round(researchSignals.reduce((sum, s) => sum + s.confidence, 0) / researchSignals.length)
  const avgUrgency = Math.round(researchSignals.reduce((sum, s) => sum + s.urgency, 0) / researchSignals.length)

  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-950">
      <section className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-[2rem] bg-slate-950 p-8 text-white">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-300">
            Market-OS · Pack 8
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight">
            Market Research & Competitive Intelligence Engine
          </h1>
          <p className="mt-4 max-w-3xl text-slate-300">
            This layer gives Market-OS a real intelligence desk: competitor observations,
            customer pain signals, pricing intelligence, city opportunities, market gaps and
            strategic recommendations converted into execution tasks.
          </p>

          <div className="mt-8 grid gap-3 md:grid-cols-4">
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="text-xs uppercase text-slate-300">Revenue Potential</p>
              <p className="mt-2 text-2xl font-black">{formatMad(totalPotential)}</p>
            </div>
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="text-xs uppercase text-slate-300">High Opportunities</p>
              <p className="mt-2 text-3xl font-black">{highOpp}</p>
            </div>
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="text-xs uppercase text-slate-300">Avg Confidence</p>
              <p className="mt-2 text-3xl font-black">{avgConfidence}%</p>
            </div>
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="text-xs uppercase text-slate-300">Avg Urgency</p>
              <p className="mt-2 text-3xl font-black">{avgUrgency}%</p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-4">
          <div className="grid gap-3 md:grid-cols-4">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search research, market, source, owner..."
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900"
            />

            <select value={type} onChange={(e) => setType(e.target.value as ResearchType | "all")} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold">
              <option value="all">All types</option>
              <option value="competitor">Competitor</option>
              <option value="customer_pain">Customer Pain</option>
              <option value="pricing">Pricing</option>
              <option value="market_signal">Market Signal</option>
              <option value="city_opportunity">City Opportunity</option>
              <option value="service_gap">Service Gap</option>
            </select>

            <select value={status} onChange={(e) => setStatus(e.target.value as ResearchStatus | "all")} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold">
              <option value="all">All statuses</option>
              <option value="new">New</option>
              <option value="validated">Validated</option>
              <option value="assigned">Assigned</option>
              <option value="converted">Converted</option>
              <option value="archived">Archived</option>
            </select>

            <select value={opportunity} onChange={(e) => setOpportunity(e.target.value as OpportunityLevel | "all")} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold">
              <option value="all">All opportunities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        <div className="grid gap-5">
          {filtered.map((signal) => (
            <article key={signal.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="mb-3 flex flex-wrap gap-2">
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-700">
                      Type: {typeLabel(signal.type)}
                    </span>
                    <span className={`rounded-full border px-3 py-1 text-xs font-bold ${badgeClass(signal.status)}`}>
                      {statusLabel(signal.status)}
                    </span>
                    <span className={`rounded-full border px-3 py-1 text-xs font-bold ${badgeClass(signal.opportunity)}`}>
                      Opportunity: {signal.opportunity}
                    </span>
                  </div>

                  <h2 className="text-xl font-black">{signal.title}</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Market: {signal.market} · Source: {signal.source} · Owner: {signal.owner}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4 text-right">
                  <p className="text-xs font-bold uppercase text-slate-500">Revenue Potential</p>
                  <p className="mt-1 font-black">{formatMad(signal.revenuePotentialMad)}</p>
                  <p className="text-xs text-slate-500">Confidence: {signal.confidence}%</p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 p-4">
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="font-bold">Confidence</span>
                    <span>{signal.confidence}%</span>
                  </div>
                  <Bar value={signal.confidence} />
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="font-bold">Urgency</span>
                    <span>{signal.urgency}%</span>
                  </div>
                  <Bar value={signal.urgency} />
                </div>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs font-bold uppercase text-slate-500">Finding</p>
                  <p className="mt-2 text-sm text-slate-700">{signal.finding}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs font-bold uppercase text-slate-500">Strategic Meaning</p>
                  <p className="mt-2 text-sm text-slate-700">{signal.strategicMeaning}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs font-bold uppercase text-slate-500">Recommended Action</p>
                  <p className="mt-2 text-sm text-slate-700">{signal.recommendedAction}</p>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase text-slate-500">Execution Task to Trigger</p>
                <p className="mt-2 text-sm font-semibold text-slate-800">{signal.executionTask}</p>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <MarketActionButton moduleKey="research" engine="data" actionKey="convert_to_strategy_task" actionLabel="Convert to Strategy Task" className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-bold text-white">Convert to Strategy Task</MarketActionButton>
                <MarketActionButton moduleKey="research" engine="data" actionKey="validate_research" actionLabel="Validate Research" className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-bold">Validate Research</MarketActionButton>
                <MarketActionButton moduleKey="research" engine="data" actionKey="execute_attach_evidence" actionLabel="Attach Evidence" className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-bold">Attach Evidence</MarketActionButton>
                <MarketActionButton moduleKey="research" engine="data" actionKey="archive_signal" actionLabel="Archive Signal" className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-bold">Archive Signal</MarketActionButton>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
