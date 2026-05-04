"use client"

import { useMemo, useState } from "react"
import {
  formatMad,
  growthPartners,
  stageLabel,
  typeLabel,
  type PartnerRisk,
  type PartnerStage,
  type PartnerType,
} from "@/lib/market-os/partnership-referral-growth-engine"

function badgeClass(value: string) {
  if (value === "critical" || value === "high" || value === "paused") return "border-red-200 bg-red-50 text-red-700"
  if (value === "medium" || value === "meeting" || value === "qualified") return "border-amber-200 bg-amber-50 text-amber-700"
  if (value === "low" || value === "active") return "border-emerald-200 bg-emerald-50 text-emerald-700"
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

export default function PartnershipReferralGrowthEngine() {
  const [query, setQuery] = useState("")
  const [type, setType] = useState<PartnerType | "all">("all")
  const [stage, setStage] = useState<PartnerStage | "all">("all")
  const [risk, setRisk] = useState<PartnerRisk | "all">("all")

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()

    return growthPartners.filter((partner) => {
      const queryMatch =
        !q ||
        partner.name.toLowerCase().includes(q) ||
        partner.owner.toLowerCase().includes(q) ||
        partner.market.toLowerCase().includes(q)

      return (
        queryMatch &&
        (type === "all" || partner.type === type) &&
        (stage === "all" || partner.stage === stage) &&
        (risk === "all" || partner.risk === risk)
      )
    })
  }, [query, type, stage, risk])

  const totalPotential = growthPartners.reduce((sum, p) => sum + p.potentialLeads, 0)
  const totalLeads = growthPartners.reduce((sum, p) => sum + p.actualLeads, 0)
  const totalRevenue = growthPartners.reduce((sum, p) => sum + p.revenueMad, 0)
  const avgTrust = Math.round(growthPartners.reduce((sum, p) => sum + p.trustScore, 0) / growthPartners.length)

  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-950">
      <section className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-[2rem] bg-slate-950 p-8 text-white">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-300">
            Market-OS · Pack 11
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight">
            Partnership, Ambassador & Referral Growth Engine
          </h1>
          <p className="mt-4 max-w-3xl text-slate-300">
            This layer transforms external relationships into controlled growth channels:
            clinics, doctors, ambassadors, communities, influencers and corporate partners.
          </p>

          <div className="mt-8 grid gap-3 md:grid-cols-4">
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="text-xs uppercase text-slate-300">Potential Leads</p>
              <p className="mt-2 text-3xl font-black">{totalPotential}</p>
            </div>
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="text-xs uppercase text-slate-300">Actual Leads</p>
              <p className="mt-2 text-3xl font-black">{totalLeads}</p>
            </div>
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="text-xs uppercase text-slate-300">Revenue</p>
              <p className="mt-2 text-2xl font-black">{formatMad(totalRevenue)}</p>
            </div>
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="text-xs uppercase text-slate-300">Avg Trust Score</p>
              <p className="mt-2 text-3xl font-black">{avgTrust}%</p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-4">
          <div className="grid gap-3 md:grid-cols-4">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search partner, owner, market..."
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900"
            />

            <select value={type} onChange={(e) => setType(e.target.value as PartnerType | "all")} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold">
              <option value="all">All types</option>
              <option value="clinic">Clinic</option>
              <option value="doctor">Doctor</option>
              <option value="ambassador">Ambassador</option>
              <option value="influencer">Influencer</option>
              <option value="corporate">Corporate</option>
              <option value="community">Community</option>
            </select>

            <select value={stage} onChange={(e) => setStage(e.target.value as PartnerStage | "all")} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold">
              <option value="all">All stages</option>
              <option value="identified">Identified</option>
              <option value="qualified">Qualified</option>
              <option value="contacted">Contacted</option>
              <option value="meeting">Meeting</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
            </select>

            <select value={risk} onChange={(e) => setRisk(e.target.value as PartnerRisk | "all")} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold">
              <option value="all">All risks</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        <div className="grid gap-5">
          {filtered.map((partner) => (
            <article key={partner.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="mb-3 flex flex-wrap gap-2">
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-700">
                      Type: {typeLabel(partner.type)}
                    </span>
                    <span className={`rounded-full border px-3 py-1 text-xs font-bold ${badgeClass(partner.stage)}`}>
                      Stage: {stageLabel(partner.stage)}
                    </span>
                    <span className={`rounded-full border px-3 py-1 text-xs font-bold ${badgeClass(partner.risk)}`}>
                      Risk: {partner.risk}
                    </span>
                  </div>

                  <h2 className="text-xl font-black">{partner.name}</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Market: {partner.market} · Owner: {partner.owner}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4 text-right">
                  <p className="text-xs font-bold uppercase text-slate-500">Revenue</p>
                  <p className="mt-1 font-black">{formatMad(partner.revenueMad)}</p>
                  <p className="text-xs text-slate-500">Leads: {partner.actualLeads}/{partner.potentialLeads}</p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 p-4">
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="font-bold">Trust Score</span>
                    <span>{partner.trustScore}%</span>
                  </div>
                  <Bar value={partner.trustScore} />
                </div>

                <div className="rounded-2xl border border-slate-200 p-4">
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="font-bold">Activation Score</span>
                    <span>{partner.activationScore}%</span>
                  </div>
                  <Bar value={partner.activationScore} />
                </div>

                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs font-bold uppercase text-slate-500">Conversion</p>
                  <p className="mt-1 text-lg font-black">{partner.conversionRate}%</p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs font-bold uppercase text-slate-500">Blocker</p>
                  <p className="mt-2 text-sm text-slate-700">{partner.blocker}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs font-bold uppercase text-slate-500">Next Action</p>
                  <p className="mt-2 text-sm text-slate-700">{partner.nextAction}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs font-bold uppercase text-slate-500">Strategic Value</p>
                  <p className="mt-2 text-sm text-slate-700">{partner.strategicValue}</p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <MarketActionButton moduleKey="partnerships" engine="network" actionKey="create_partner_task" actionLabel="Create Partner Task" className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-bold text-white">Create Partner Task</MarketActionButton>
                <MarketActionButton moduleKey="partnerships" engine="network" actionKey="add_referral" actionLabel="Add Referral" className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-bold">Add Referral</MarketActionButton>
                <MarketActionButton moduleKey="partnerships" engine="network" actionKey="update_stage" actionLabel="Update Stage" className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-bold">Update Stage</MarketActionButton>
                <MarketActionButton moduleKey="partnerships" engine="network" actionKey="review_performance" actionLabel="Review Performance" className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-bold">Review Performance</MarketActionButton>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
