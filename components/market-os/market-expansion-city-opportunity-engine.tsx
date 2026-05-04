"use client"

import { useMemo, useState } from "react"
import {
  cityOpportunities,
  countryLabel,
  formatMad,
  stageLabel,
  type ExpansionMarket,
  type ExpansionRisk,
  type ExpansionStage,
} from "@/lib/market-os/market-expansion-city-opportunity-engine"

function badgeClass(value: string) {
  if (value === "critical" || value === "high" || value === "paused") return "border-red-200 bg-red-50 text-red-700"
  if (value === "medium" || value === "research" || value === "validation" || value === "pilot") return "border-amber-200 bg-amber-50 text-amber-700"
  if (value === "low" || value === "launch_ready" || value === "launched") return "border-emerald-200 bg-emerald-50 text-emerald-700"
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

export default function MarketExpansionCityOpportunityEngine() {
  const [query, setQuery] = useState("")
  const [country, setCountry] = useState<ExpansionMarket | "all">("all")
  const [stage, setStage] = useState<ExpansionStage | "all">("all")
  const [risk, setRisk] = useState<ExpansionRisk | "all">("all")

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()

    return cityOpportunities.filter((item) => {
      const queryMatch =
        !q ||
        item.city.toLowerCase().includes(q) ||
        item.owner.toLowerCase().includes(q) ||
        item.mainOpportunity.toLowerCase().includes(q)

      return (
        queryMatch &&
        (country === "all" || item.country === country) &&
        (stage === "all" || item.stage === stage) &&
        (risk === "all" || item.risk === risk)
      )
    })
  }, [query, country, stage, risk])

  const totalRevenue = cityOpportunities.reduce((sum, item) => sum + item.estimatedRevenueMad, 0)
  const avgPriority = Math.round(cityOpportunities.reduce((sum, item) => sum + item.launchPriority, 0) / cityOpportunities.length)
  const highRisk = cityOpportunities.filter((item) => item.risk === "high" || item.risk === "critical").length
  const pilotReady = cityOpportunities.filter((item) => item.stage === "pilot" || item.stage === "launch_ready").length

  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-950">
      <section className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-[2rem] bg-slate-950 p-8 text-white">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-300">
            Market-OS · Pack 20
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight">
            Market Expansion & City Opportunity Engine
          </h1>
          <p className="mt-4 max-w-3xl text-slate-300">
            This layer helps AngelCare evaluate cities and countries before expansion:
            demand, supply readiness, competition, legal complexity, revenue potential,
            launch priority and next action discipline.
          </p>

          <div className="mt-8 grid gap-3 md:grid-cols-4">
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="text-xs uppercase text-slate-300">Revenue Potential</p>
              <p className="mt-2 text-2xl font-black">{formatMad(totalRevenue)}</p>
            </div>
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="text-xs uppercase text-slate-300">Avg Launch Priority</p>
              <p className="mt-2 text-3xl font-black">{avgPriority}%</p>
            </div>
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="text-xs uppercase text-slate-300">High Risk Markets</p>
              <p className="mt-2 text-3xl font-black">{highRisk}</p>
            </div>
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="text-xs uppercase text-slate-300">Pilot / Ready</p>
              <p className="mt-2 text-3xl font-black">{pilotReady}</p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-4">
          <div className="grid gap-3 md:grid-cols-4">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search city, owner, opportunity..."
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900"
            />

            <select value={country} onChange={(e) => setCountry(e.target.value as ExpansionMarket | "all")} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold">
              <option value="all">All countries</option>
              <option value="morocco">Morocco</option>
              <option value="spain">Spain</option>
              <option value="france">France</option>
              <option value="uae">UAE</option>
              <option value="qatar">Qatar</option>
              <option value="ksa">KSA</option>
            </select>

            <select value={stage} onChange={(e) => setStage(e.target.value as ExpansionStage | "all")} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold">
              <option value="all">All stages</option>
              <option value="scan">Scan</option>
              <option value="research">Research</option>
              <option value="validation">Validation</option>
              <option value="pilot">Pilot</option>
              <option value="launch_ready">Launch Ready</option>
              <option value="launched">Launched</option>
              <option value="paused">Paused</option>
            </select>

            <select value={risk} onChange={(e) => setRisk(e.target.value as ExpansionRisk | "all")} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold">
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
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-700">
                      Country: {countryLabel(item.country)}
                    </span>
                    <span className={`rounded-full border px-3 py-1 text-xs font-bold ${badgeClass(item.stage)}`}>
                      Stage: {stageLabel(item.stage)}
                    </span>
                    <span className={`rounded-full border px-3 py-1 text-xs font-bold ${badgeClass(item.risk)}`}>
                      Risk: {item.risk}
                    </span>
                  </div>

                  <h2 className="text-xl font-black">{item.city}</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Owner: {item.owner} · Launch priority: {item.launchPriority}%
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4 text-right">
                  <p className="text-xs font-bold uppercase text-slate-500">Estimated Revenue</p>
                  <p className="mt-1 font-black">{formatMad(item.estimatedRevenueMad)}</p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 p-4">
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="font-bold">Demand</span>
                    <span>{item.demandScore}%</span>
                  </div>
                  <Bar value={item.demandScore} />
                </div>

                <div className="rounded-2xl border border-slate-200 p-4">
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="font-bold">Supply Readiness</span>
                    <span>{item.supplyReadiness}%</span>
                  </div>
                  <Bar value={item.supplyReadiness} />
                </div>

                <div className="rounded-2xl border border-slate-200 p-4">
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="font-bold">Competition</span>
                    <span>{item.competitionIntensity}%</span>
                  </div>
                  <Bar value={item.competitionIntensity} />
                </div>

                <div className="rounded-2xl border border-slate-200 p-4">
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="font-bold">Legal Complexity</span>
                    <span>{item.legalComplexity}%</span>
                  </div>
                  <Bar value={item.legalComplexity} />
                </div>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs font-bold uppercase text-slate-500">Main Opportunity</p>
                  <p className="mt-2 text-sm text-slate-700">{item.mainOpportunity}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs font-bold uppercase text-slate-500">Blocker</p>
                  <p className="mt-2 text-sm text-slate-700">{item.blocker}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs font-bold uppercase text-slate-500">Launch Condition</p>
                  <p className="mt-2 text-sm text-slate-700">{item.launchCondition}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs font-bold uppercase text-slate-500">Next Action</p>
                  <p className="mt-2 text-sm text-slate-700">{item.nextAction}</p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <MarketActionButton moduleKey="expansion" engine="acquisition" actionKey="create_expansion_task" actionLabel="Create Expansion Task" className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-bold text-white">Create Expansion Task</MarketActionButton>
                <MarketActionButton moduleKey="expansion" engine="acquisition" actionKey="validate_market" actionLabel="Validate Market" className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-bold">Validate Market</MarketActionButton>
                <MarketActionButton moduleKey="expansion" engine="acquisition" actionKey="execute_build_launch_plan" actionLabel="Build Launch Plan" className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-bold">Build Launch Plan</MarketActionButton>
                <MarketActionButton moduleKey="expansion" engine="acquisition" actionKey="mark_pilot" actionLabel="Mark Pilot" className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-bold">Mark Pilot</MarketActionButton>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
