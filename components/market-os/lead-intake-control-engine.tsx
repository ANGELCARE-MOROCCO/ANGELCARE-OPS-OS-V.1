"use client"

import { useMemo, useState } from "react"
import {
  formatMad,
  marketLeads,
  sourceLabel,
  stageLabel,
  type LeadRisk,
  type LeadSource,
  type LeadStage,
} from "@/lib/market-os/lead-intake-control-engine"

function badgeClass(value: string) {
  if (value === "critical" || value === "high" || value === "new") return "border-red-200 bg-red-50 text-red-700"
  if (value === "medium" || value === "assigned" || value === "contacted") return "border-amber-200 bg-amber-50 text-amber-700"
  if (value === "low" || value === "qualified" || value === "appointment" || value === "converted") return "border-emerald-200 bg-emerald-50 text-emerald-700"
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

export default function LeadIntakeControlEngine() {
  const [query, setQuery] = useState("")
  const [source, setSource] = useState<LeadSource | "all">("all")
  const [stage, setStage] = useState<LeadStage | "all">("all")
  const [risk, setRisk] = useState<LeadRisk | "all">("all")

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()

    return marketLeads.filter((lead) => {
      const queryMatch =
        !q ||
        lead.name.toLowerCase().includes(q) ||
        lead.campaign.toLowerCase().includes(q) ||
        lead.serviceInterest.toLowerCase().includes(q) ||
        lead.owner.toLowerCase().includes(q)

      return (
        queryMatch &&
        (source === "all" || lead.source === source) &&
        (stage === "all" || lead.stage === stage) &&
        (risk === "all" || lead.risk === risk)
      )
    })
  }, [query, source, stage, risk])

  const totalValue = marketLeads.reduce((sum, lead) => sum + lead.estimatedValueMad, 0)
  const avgIntent = Math.round(marketLeads.reduce((sum, lead) => sum + lead.intentScore, 0) / marketLeads.length)
  const urgentLeads = marketLeads.filter((lead) => lead.slaMinutesRemaining <= 15).length
  const highRisk = marketLeads.filter((lead) => lead.risk === "high" || lead.risk === "critical").length

  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-950">
      <section className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-[2rem] bg-slate-950 p-8 text-white">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-300">
            Market-OS · Pack 18
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight">
            Meta / WhatsApp / Lead Intake Control Engine
          </h1>
          <p className="mt-4 max-w-3xl text-slate-300">
            This layer controls inbound marketing leads from Meta, WhatsApp, website,
            referral and partners: intent scoring, SLA response, ownership, script matching,
            attribution and estimated revenue value.
          </p>

          <div className="mt-8 grid gap-3 md:grid-cols-4">
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="text-xs uppercase text-slate-300">Pipeline Value</p>
              <p className="mt-2 text-2xl font-black">{formatMad(totalValue)}</p>
            </div>
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="text-xs uppercase text-slate-300">Avg Intent</p>
              <p className="mt-2 text-3xl font-black">{avgIntent}%</p>
            </div>
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="text-xs uppercase text-slate-300">SLA Urgent</p>
              <p className="mt-2 text-3xl font-black">{urgentLeads}</p>
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
              placeholder="Search lead, campaign, service, owner..."
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900"
            />

            <select value={source} onChange={(e) => setSource(e.target.value as LeadSource | "all")} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold">
              <option value="all">All sources</option>
              <option value="meta_ads">Meta Ads</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="website">Website</option>
              <option value="referral">Referral</option>
              <option value="partner">Partner</option>
              <option value="organic">Organic</option>
            </select>

            <select value={stage} onChange={(e) => setStage(e.target.value as LeadStage | "all")} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold">
              <option value="all">All stages</option>
              <option value="new">New</option>
              <option value="assigned">Assigned</option>
              <option value="contacted">Contacted</option>
              <option value="qualified">Qualified</option>
              <option value="appointment">Appointment</option>
              <option value="converted">Converted</option>
              <option value="lost">Lost</option>
            </select>

            <select value={risk} onChange={(e) => setRisk(e.target.value as LeadRisk | "all")} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold">
              <option value="all">All risks</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        <div className="grid gap-5">
          {filtered.map((lead) => (
            <article key={lead.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="mb-3 flex flex-wrap gap-2">
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-700">
                      Source: {sourceLabel(lead.source)}
                    </span>
                    <span className={`rounded-full border px-3 py-1 text-xs font-bold ${badgeClass(lead.stage)}`}>
                      Stage: {stageLabel(lead.stage)}
                    </span>
                    <span className={`rounded-full border px-3 py-1 text-xs font-bold ${badgeClass(lead.risk)}`}>
                      Risk: {lead.risk}
                    </span>
                  </div>

                  <h2 className="text-xl font-black">{lead.name}</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Campaign: {lead.campaign} · Service: {lead.serviceInterest} · Owner: {lead.owner}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4 text-right">
                  <p className="text-xs font-bold uppercase text-slate-500">Estimated Value</p>
                  <p className="mt-1 font-black">{formatMad(lead.estimatedValueMad)}</p>
                  <p className="text-xs text-slate-500">SLA: {lead.slaMinutesRemaining} min</p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 p-4">
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="font-bold">Intent Score</span>
                    <span>{lead.intentScore}%</span>
                  </div>
                  <Bar value={lead.intentScore} />
                </div>

                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs font-bold uppercase text-slate-500">Attribution</p>
                  <p className="mt-2 text-sm text-slate-700">{lead.attribution}</p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs font-bold uppercase text-slate-500">Last Message</p>
                  <p className="mt-2 text-sm text-slate-700">{lead.lastMessage}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs font-bold uppercase text-slate-500">Recommended Script</p>
                  <p className="mt-2 text-sm text-slate-700">{lead.recommendedScript}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4 lg:col-span-2">
                  <p className="text-xs font-bold uppercase text-slate-500">Next Action</p>
                  <p className="mt-2 text-sm text-slate-700">{lead.nextAction}</p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <MarketActionButton moduleKey="conversion" engine="conversion" actionKey="assign_lead" actionLabel="Assign Lead" className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-bold text-white">Assign Lead</MarketActionButton>
                <MarketActionButton moduleKey="conversion" engine="conversion" actionKey="start_sla_call" actionLabel="Start SLA Call" className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-bold">Start SLA Call</MarketActionButton>
                <MarketActionButton moduleKey="conversion" engine="conversion" actionKey="open_script" actionLabel="Open Script" className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-bold">Open Script</MarketActionButton>
                <MarketActionButton moduleKey="conversion" engine="conversion" actionKey="convert_to_task" actionLabel="Convert to Task" className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-bold">Convert to Task</MarketActionButton>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
