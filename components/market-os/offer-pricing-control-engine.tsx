"use client"

import { useMemo, useState } from "react"
import {
  formatMad,
  offers,
  stageLabel,
  type OfferRisk,
  type OfferStage,
} from "@/lib/market-os/offer-pricing-control-engine"

function badgeClass(value: string) {
  if (value === "critical" || value === "high") return "border-red-200 bg-red-50 text-red-700"
  if (value === "medium" || value === "pricing" || value === "margin_review" || value === "approval") return "border-amber-200 bg-amber-50 text-amber-700"
  if (value === "low" || value === "ready" || value === "live") return "border-emerald-200 bg-emerald-50 text-emerald-700"
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

export default function OfferPricingControlEngine() {
  const [query, setQuery] = useState("")
  const [stage, setStage] = useState<OfferStage | "all">("all")
  const [risk, setRisk] = useState<OfferRisk | "all">("all")

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    return offers.filter((offer) => {
      const queryMatch =
        !q ||
        offer.title.toLowerCase().includes(q) ||
        offer.strategy.toLowerCase().includes(q) ||
        offer.segment.toLowerCase().includes(q) ||
        offer.owner.toLowerCase().includes(q)

      const stageMatch = stage === "all" || offer.stage === stage
      const riskMatch = risk === "all" || offer.risk === risk

      return queryMatch && stageMatch && riskMatch
    })
  }, [query, stage, risk])

  const totalPotential = offers.reduce((sum, o) => sum + o.revenuePotentialMad, 0)
  const avgMargin = Math.round(offers.reduce((sum, o) => sum + o.marginPercent, 0) / offers.length)
  const approvalCount = offers.filter((o) => o.approvalRequired).length
  const highRisk = offers.filter((o) => o.risk === "high" || o.risk === "critical").length

  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-950">
      <section className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-[2rem] bg-slate-950 p-8 text-white">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-300">
            Market-OS · Pack 9
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight">
            Offer Engineering & Pricing Control Engine
          </h1>
          <p className="mt-4 max-w-3xl text-slate-300">
            This layer turns research and strategy into controlled offers: pricing, margins,
            conversion potential, approval rules, discount discipline and revenue readiness.
          </p>

          <div className="mt-8 grid gap-3 md:grid-cols-4">
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="text-xs uppercase text-slate-300">Revenue Potential</p>
              <p className="mt-2 text-2xl font-black">{formatMad(totalPotential)}</p>
            </div>
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="text-xs uppercase text-slate-300">Avg Margin</p>
              <p className="mt-2 text-3xl font-black">{avgMargin}%</p>
            </div>
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="text-xs uppercase text-slate-300">Need Approval</p>
              <p className="mt-2 text-3xl font-black">{approvalCount}</p>
            </div>
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="text-xs uppercase text-slate-300">High Risk Offers</p>
              <p className="mt-2 text-3xl font-black">{highRisk}</p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-4">
          <div className="grid gap-3 md:grid-cols-3">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search offer, strategy, segment, owner..."
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900"
            />

            <select value={stage} onChange={(e) => setStage(e.target.value as OfferStage | "all")} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold">
              <option value="all">All stages</option>
              <option value="concept">Concept</option>
              <option value="pricing">Pricing</option>
              <option value="margin_review">Margin Review</option>
              <option value="approval">Approval</option>
              <option value="ready">Ready</option>
              <option value="live">Live</option>
              <option value="iteration">Iteration</option>
            </select>

            <select value={risk} onChange={(e) => setRisk(e.target.value as OfferRisk | "all")} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold">
              <option value="all">All risks</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        <div className="grid gap-5">
          {filtered.map((offer) => (
            <article key={offer.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="mb-3 flex flex-wrap gap-2">
                    <span className={`rounded-full border px-3 py-1 text-xs font-bold ${badgeClass(offer.stage)}`}>
                      Stage: {stageLabel(offer.stage)}
                    </span>
                    <span className={`rounded-full border px-3 py-1 text-xs font-bold ${badgeClass(offer.risk)}`}>
                      Risk: {offer.risk}
                    </span>
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-700">
                      Margin: {offer.marginPercent}%
                    </span>
                  </div>

                  <h2 className="text-xl font-black">{offer.title}</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Strategy: {offer.strategy} · Segment: {offer.segment} · Owner: {offer.owner}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4 text-right">
                  <p className="text-xs font-bold uppercase text-slate-500">Base Price</p>
                  <p className="mt-1 font-black">{formatMad(offer.basePriceMad)}</p>
                  <p className="text-xs text-slate-500">Cost: {formatMad(offer.costMad)}</p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 p-4">
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="font-bold">Readiness</span>
                    <span>{offer.readiness}%</span>
                  </div>
                  <Bar value={offer.readiness} />
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs font-bold uppercase text-slate-500">Expected Conversion</p>
                  <p className="mt-1 text-lg font-black">{offer.expectedConversion}%</p>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs font-bold uppercase text-slate-500">Revenue Potential</p>
                  <p className="mt-1 text-lg font-black">{formatMad(offer.revenuePotentialMad)}</p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs font-bold uppercase text-slate-500">Pricing Issue</p>
                  <p className="mt-2 text-sm text-slate-700">{offer.pricingIssue}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs font-bold uppercase text-slate-500">Offer Strength</p>
                  <p className="mt-2 text-sm text-slate-700">{offer.offerStrength}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs font-bold uppercase text-slate-500">Next Action</p>
                  <p className="mt-2 text-sm text-slate-700">{offer.nextAction}</p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <MarketActionButton moduleKey="offer" engine="content" actionKey="create_offer_task" actionLabel="Create Offer Task" className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-bold text-white">Create Offer Task</MarketActionButton>
                <MarketActionButton moduleKey="offer" engine="content" actionKey="request_pricing_approval" actionLabel="Request Pricing Approval" className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-bold">Request Pricing Approval</MarketActionButton>
                <MarketActionButton moduleKey="offer" engine="content" actionKey="execute_simulate_margin" actionLabel="Simulate Margin" className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-bold">Simulate Margin</MarketActionButton>
                <MarketActionButton moduleKey="offer" engine="content" actionKey="mark_ready" actionLabel="Mark Ready" className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-bold">Mark Ready</MarketActionButton>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
