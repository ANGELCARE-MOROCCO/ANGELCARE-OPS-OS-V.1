"use client"

import { useMemo, useState } from "react"
import {
  campaigns,
  formatMad,
  stageLabel,
  type CampaignRisk,
  type CampaignStage,
} from "@/lib/market-os/campaign-lifecycle-engine"

function badgeClass(value: string) {
  if (value === "critical" || value === "high") {
    return "border-red-200 bg-red-50 text-red-700"
  }
  if (value === "medium" || value === "approval" || value === "assets") {
    return "border-amber-200 bg-amber-50 text-amber-700"
  }
  if (value === "live" || value === "ready" || value === "optimization" || value === "low") {
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

export default function CampaignLifecycleEngine() {
  const [query, setQuery] = useState("")
  const [stage, setStage] = useState<CampaignStage | "all">("all")
  const [risk, setRisk] = useState<CampaignRisk | "all">("all")

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    return campaigns.filter((campaign) => {
      const queryMatch =
        !q ||
        campaign.title.toLowerCase().includes(q) ||
        campaign.strategy.toLowerCase().includes(q) ||
        campaign.owner.toLowerCase().includes(q) ||
        campaign.channel.toLowerCase().includes(q)

      const stageMatch = stage === "all" || campaign.stage === stage
      const riskMatch = risk === "all" || campaign.risk === risk

      return queryMatch && stageMatch && riskMatch
    })
  }, [query, stage, risk])

  const totalBudget = campaigns.reduce((sum, c) => sum + c.budgetMad, 0)
  const avgReadiness = Math.round(campaigns.reduce((sum, c) => sum + c.readiness, 0) / campaigns.length)
  const highRisk = campaigns.filter((c) => c.risk === "high" || c.risk === "critical").length
  const launchBlockers = campaigns.reduce((sum, c) => sum + c.missingItems.length, 0)

  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-950">
      <section className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-[2rem] bg-slate-950 p-8 text-white">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-300">
            Market-OS · Pack 6
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight">
            Campaign Lifecycle Operating Engine
          </h1>
          <p className="mt-4 max-w-3xl text-slate-300">
            This layer transforms strategy into full campaign operations: brief, audience, offer,
            assets, budget, readiness, launch, optimization and post-mortem discipline.
          </p>

          <div className="mt-8 grid gap-3 md:grid-cols-4">
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="text-xs uppercase text-slate-300">Campaign Budget</p>
              <p className="mt-2 text-2xl font-black">{formatMad(totalBudget)}</p>
            </div>
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="text-xs uppercase text-slate-300">Avg Readiness</p>
              <p className="mt-2 text-3xl font-black">{avgReadiness}%</p>
            </div>
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="text-xs uppercase text-slate-300">High Risk</p>
              <p className="mt-2 text-3xl font-black">{highRisk}</p>
            </div>
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="text-xs uppercase text-slate-300">Launch Blockers</p>
              <p className="mt-2 text-3xl font-black">{launchBlockers}</p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-4">
          <div className="grid gap-3 md:grid-cols-3">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search campaign, strategy, owner, channel..."
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900"
            />

            <select value={stage} onChange={(e) => setStage(e.target.value as CampaignStage | "all")} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold">
              <option value="all">All stages</option>
              <option value="brief">Brief</option>
              <option value="assets">Assets</option>
              <option value="approval">Approval</option>
              <option value="ready">Ready</option>
              <option value="live">Live</option>
              <option value="optimization">Optimization</option>
              <option value="post_mortem">Post-Mortem</option>
            </select>

            <select value={risk} onChange={(e) => setRisk(e.target.value as CampaignRisk | "all")} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold">
              <option value="all">All risks</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        <div className="grid gap-5">
          {filtered.map((campaign) => (
            <article key={campaign.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="mb-3 flex flex-wrap gap-2">
                    <span className={`rounded-full border px-3 py-1 text-xs font-bold ${badgeClass(campaign.stage)}`}>
                      Stage: {stageLabel(campaign.stage)}
                    </span>
                    <span className={`rounded-full border px-3 py-1 text-xs font-bold ${badgeClass(campaign.risk)}`}>
                      Risk: {campaign.risk}
                    </span>
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-700">
                      Launch: {campaign.launchDate}
                    </span>
                  </div>

                  <h2 className="text-xl font-black">{campaign.title}</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Strategy: {campaign.strategy} · Owner: {campaign.owner} · Channel: {campaign.channel}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4 text-right">
                  <p className="text-xs font-bold uppercase text-slate-500">Budget</p>
                  <p className="mt-1 font-black">{formatMad(campaign.budgetMad)}</p>
                  <p className="text-xs text-slate-500">Spent: {formatMad(campaign.spentMad)}</p>
                </div>
              </div>

              <div className="mt-5">
                <div className="mb-2 flex justify-between text-sm">
                  <span className="font-bold">Launch Readiness</span>
                  <span>{campaign.readiness}%</span>
                </div>
                <Bar value={campaign.readiness} />
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs font-bold uppercase text-slate-500">Audience</p>
                  <p className="mt-2 text-sm text-slate-700">{campaign.audience}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs font-bold uppercase text-slate-500">Offer</p>
                  <p className="mt-2 text-sm text-slate-700">{campaign.offer}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs font-bold uppercase text-slate-500">Expected Outcome</p>
                  <p className="mt-2 text-sm text-slate-700">{campaign.expectedOutcome}</p>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-xs font-bold uppercase text-amber-700">Missing Before Launch</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {campaign.missingItems.map((item) => (
                    <span key={item} className="rounded-full border border-amber-200 bg-white px-3 py-1 text-xs font-bold text-amber-700">
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs font-bold uppercase text-slate-500">Optimization Focus</p>
                  <p className="mt-2 text-sm text-slate-700">{campaign.optimizationFocus}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs font-bold uppercase text-slate-500">Next Action</p>
                  <p className="mt-2 text-sm text-slate-700">{campaign.nextAction}</p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <MarketActionButton moduleKey="acquisition" engine="acquisition" actionKey="create_campaign_task" actionLabel="Create Campaign Task" className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-bold text-white">Create Campaign Task</MarketActionButton>
                <MarketActionButton moduleKey="acquisition" engine="acquisition" actionKey="validate_readiness" actionLabel="Validate Readiness" className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-bold">Validate Readiness</MarketActionButton>
                <MarketActionButton moduleKey="acquisition" engine="acquisition" actionKey="request_approval" actionLabel="Request Approval" className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-bold">Request Approval</MarketActionButton>
                <MarketActionButton moduleKey="acquisition" engine="acquisition" actionKey="open_post_mortem" actionLabel="Open Post-Mortem" className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-bold">Open Post-Mortem</MarketActionButton>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
