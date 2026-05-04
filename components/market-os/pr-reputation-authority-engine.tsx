"use client"

import { useMemo, useState } from "react"
import {
  prOpportunities,
  stageLabel,
  typeLabel,
  type PrRisk,
  type PrStage,
  type PrType,
} from "@/lib/market-os/pr-reputation-authority-engine"

function badgeClass(value: string) {
  if (value === "critical" || value === "high") return "border-red-200 bg-red-50 text-red-700"
  if (value === "medium" || value === "pitch" || value === "outreach" || value === "follow_up") return "border-amber-200 bg-amber-50 text-amber-700"
  if (value === "low" || value === "secured" || value === "published") return "border-emerald-200 bg-emerald-50 text-emerald-700"
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

export default function PrReputationAuthorityEngine() {
  const [query, setQuery] = useState("")
  const [stage, setStage] = useState<PrStage | "all">("all")
  const [risk, setRisk] = useState<PrRisk | "all">("all")
  const [type, setType] = useState<PrType | "all">("all")

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    return prOpportunities.filter((item) => {
      const queryMatch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.targetName.toLowerCase().includes(q) ||
        item.owner.toLowerCase().includes(q) ||
        item.targetMarket.toLowerCase().includes(q)

      return queryMatch && (stage === "all" || item.stage === stage) && (risk === "all" || item.risk === risk) && (type === "all" || item.type === type)
    })
  }, [query, stage, risk, type])

  const totalReach = prOpportunities.reduce((sum, p) => sum + p.reachPotential, 0)
  const totalLeads = prOpportunities.reduce((sum, p) => sum + p.leadPotential, 0)
  const avgTrust = Math.round(prOpportunities.reduce((sum, p) => sum + p.trustImpact, 0) / prOpportunities.length)
  const highRisk = prOpportunities.filter((p) => p.risk === "high" || p.risk === "critical").length

  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-950">
      <section className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-[2rem] bg-slate-950 p-8 text-white">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-300">
            Market-OS · Pack 13
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight">
            PR, Reputation & Authority Pipeline Engine
          </h1>
          <p className="mt-4 max-w-3xl text-slate-300">
            This layer turns authority into a managed pipeline: targets, pitches, outreach,
            follow-ups, publications, trust impact, reputation value and lead potential.
          </p>

          <div className="mt-8 grid gap-3 md:grid-cols-4">
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="text-xs uppercase text-slate-300">Reach Potential</p>
              <p className="mt-2 text-3xl font-black">{totalReach}</p>
            </div>
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="text-xs uppercase text-slate-300">Lead Potential</p>
              <p className="mt-2 text-3xl font-black">{totalLeads}</p>
            </div>
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="text-xs uppercase text-slate-300">Avg Trust Impact</p>
              <p className="mt-2 text-3xl font-black">{avgTrust}%</p>
            </div>
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="text-xs uppercase text-slate-300">High Risk</p>
              <p className="mt-2 text-3xl font-black">{highRisk}</p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-4">
          <div className="grid gap-3 md:grid-cols-4">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search opportunity, target, owner, market..."
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900"
            />

            <select value={type} onChange={(e) => setType(e.target.value as PrType | "all")} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold">
              <option value="all">All types</option>
              <option value="media">Media</option>
              <option value="expert">Expert</option>
              <option value="clinic">Clinic</option>
              <option value="community">Community</option>
              <option value="institution">Institution</option>
              <option value="podcast">Podcast</option>
            </select>

            <select value={stage} onChange={(e) => setStage(e.target.value as PrStage | "all")} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold">
              <option value="all">All stages</option>
              <option value="targeting">Targeting</option>
              <option value="pitch">Pitch</option>
              <option value="outreach">Outreach</option>
              <option value="follow_up">Follow-Up</option>
              <option value="secured">Secured</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>

            <select value={risk} onChange={(e) => setRisk(e.target.value as PrRisk | "all")} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold">
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
                      Type: {typeLabel(item.type)}
                    </span>
                    <span className={`rounded-full border px-3 py-1 text-xs font-bold ${badgeClass(item.stage)}`}>
                      Stage: {stageLabel(item.stage)}
                    </span>
                    <span className={`rounded-full border px-3 py-1 text-xs font-bold ${badgeClass(item.risk)}`}>
                      Risk: {item.risk}
                    </span>
                  </div>

                  <h2 className="text-xl font-black">{item.title}</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Target: {item.targetName} · Market: {item.targetMarket} · Owner: {item.owner}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4 text-right">
                  <p className="text-xs font-bold uppercase text-slate-500">Reach Potential</p>
                  <p className="mt-1 font-black">{item.reachPotential}</p>
                  <p className="text-xs text-slate-500">Lead potential: {item.leadPotential}</p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 p-4">
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="font-bold">Authority Score</span>
                    <span>{item.authorityScore}%</span>
                  </div>
                  <Bar value={item.authorityScore} />
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="font-bold">Trust Impact</span>
                    <span>{item.trustImpact}%</span>
                  </div>
                  <Bar value={item.trustImpact} />
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs font-bold uppercase text-slate-500">Lead Potential</p>
                  <p className="mt-1 text-lg font-black">{item.leadPotential}</p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs font-bold uppercase text-slate-500">Pitch Angle</p>
                  <p className="mt-2 text-sm text-slate-700">{item.pitchAngle}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs font-bold uppercase text-slate-500">Blocker</p>
                  <p className="mt-2 text-sm text-slate-700">{item.blocker}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs font-bold uppercase text-slate-500">Next Action</p>
                  <p className="mt-2 text-sm text-slate-700">{item.nextAction}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs font-bold uppercase text-slate-500">Reputation Value</p>
                  <p className="mt-2 text-sm text-slate-700">{item.reputationValue}</p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <MarketActionButton moduleKey="pr" engine="content" actionKey="create_pr_task" actionLabel="Create PR Task" className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-bold text-white">Create PR Task</MarketActionButton>
                <MarketActionButton moduleKey="pr" engine="content" actionKey="add_pitch" actionLabel="Add Pitch" className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-bold">Add Pitch</MarketActionButton>
                <MarketActionButton moduleKey="pr" engine="content" actionKey="log_outreach" actionLabel="Log Outreach" className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-bold">Log Outreach</MarketActionButton>
                <MarketActionButton moduleKey="pr" engine="content" actionKey="mark_published" actionLabel="Mark Published" className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-bold">Mark Published</MarketActionButton>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
