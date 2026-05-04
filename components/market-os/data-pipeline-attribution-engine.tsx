"use client"

import { useMemo, useState } from "react"
import {
  attributionRecords,
  formatMad,
  sourceLabel,
  statusLabel,
  type AttributionRisk,
  type AttributionSource,
  type AttributionStatus,
} from "@/lib/market-os/data-pipeline-attribution-engine"

function badgeClass(value: string) {
  if (value === "critical" || value === "high" || value === "missing" || value === "conflict") return "border-red-200 bg-red-50 text-red-700"
  if (value === "medium" || value === "partial") return "border-amber-200 bg-amber-50 text-amber-700"
  if (value === "low" || value === "clean") return "border-emerald-200 bg-emerald-50 text-emerald-700"
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

export default function DataPipelineAttributionEngine() {
  const [query, setQuery] = useState("")
  const [source, setSource] = useState<AttributionSource | "all">("all")
  const [status, setStatus] = useState<AttributionStatus | "all">("all")
  const [risk, setRisk] = useState<AttributionRisk | "all">("all")

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()

    return attributionRecords.filter((item) => {
      const queryMatch =
        !q ||
        item.campaign.toLowerCase().includes(q) ||
        item.dataIssue.toLowerCase().includes(q) ||
        item.businessMeaning.toLowerCase().includes(q)

      return (
        queryMatch &&
        (source === "all" || item.source === source) &&
        (status === "all" || item.status === status) &&
        (risk === "all" || item.risk === risk)
      )
    })
  }, [query, source, status, risk])

  const totalCost = attributionRecords.reduce((sum, item) => sum + item.channelCostMad, 0)
  const totalRevenue = attributionRecords.reduce((sum, item) => sum + item.revenueMad, 0)
  const avgConfidence = Math.round(attributionRecords.reduce((sum, item) => sum + item.attributionConfidence, 0) / attributionRecords.length)
  const badData = attributionRecords.filter((item) => item.status === "missing" || item.status === "conflict").length

  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-950">
      <section className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-[2rem] bg-slate-950 p-8 text-white">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-300">
            Market-OS · Pack 26
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight">
            Marketing Data Pipeline & Source Attribution Engine
          </h1>
          <p className="mt-4 max-w-3xl text-slate-300">
            This layer proves where leads, conversions and revenue come from. It connects source,
            campaign, channel cost, qualified leads, revenue and attribution confidence.
          </p>

          <div className="mt-8 grid gap-3 md:grid-cols-4">
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="text-xs uppercase text-slate-300">Channel Cost</p>
              <p className="mt-2 text-2xl font-black">{formatMad(totalCost)}</p>
            </div>
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="text-xs uppercase text-slate-300">Revenue Tracked</p>
              <p className="mt-2 text-2xl font-black">{formatMad(totalRevenue)}</p>
            </div>
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="text-xs uppercase text-slate-300">Avg Confidence</p>
              <p className="mt-2 text-3xl font-black">{avgConfidence}%</p>
            </div>
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="text-xs uppercase text-slate-300">Bad Data</p>
              <p className="mt-2 text-3xl font-black">{badData}</p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-4">
          <div className="grid gap-3 md:grid-cols-4">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search campaign, issue, meaning..."
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900"
            />

            <select value={source} onChange={(e) => setSource(e.target.value as AttributionSource | "all")} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold">
              <option value="all">All sources</option>
              <option value="meta">Meta</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="website">Website</option>
              <option value="seo">SEO</option>
              <option value="partner">Partner</option>
              <option value="referral">Referral</option>
              <option value="direct">Direct</option>
            </select>

            <select value={status} onChange={(e) => setStatus(e.target.value as AttributionStatus | "all")} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold">
              <option value="all">All statuses</option>
              <option value="clean">Clean</option>
              <option value="partial">Partial</option>
              <option value="missing">Missing</option>
              <option value="conflict">Conflict</option>
            </select>

            <select value={risk} onChange={(e) => setRisk(e.target.value as AttributionRisk | "all")} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold">
              <option value="all">All risks</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        <div className="grid gap-5">
          {filtered.map((item) => {
            const conversionRate = item.leads > 0 ? Math.round((item.conversions / item.leads) * 100) : 0
            const qualifiedRate = item.leads > 0 ? Math.round((item.qualifiedLeads / item.leads) * 100) : 0

            return (
              <article key={item.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="mb-3 flex flex-wrap gap-2">
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-700">
                        Source: {sourceLabel(item.source)}
                      </span>
                      <span className={`rounded-full border px-3 py-1 text-xs font-bold ${badgeClass(item.status)}`}>
                        {statusLabel(item.status)}
                      </span>
                      <span className={`rounded-full border px-3 py-1 text-xs font-bold ${badgeClass(item.risk)}`}>
                        Risk: {item.risk}
                      </span>
                    </div>

                    <h2 className="text-xl font-black">{item.campaign}</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Leads: {item.leads} · Qualified: {item.qualifiedLeads} · Conversions: {item.conversions}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4 text-right">
                    <p className="text-xs font-bold uppercase text-slate-500">Revenue</p>
                    <p className="mt-1 font-black">{formatMad(item.revenueMad)}</p>
                    <p className="text-xs text-slate-500">Cost: {formatMad(item.channelCostMad)}</p>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200 p-4">
                    <div className="mb-2 flex justify-between text-sm">
                      <span className="font-bold">Attribution Confidence</span>
                      <span>{item.attributionConfidence}%</span>
                    </div>
                    <Bar value={item.attributionConfidence} />
                  </div>
                  <div className="rounded-2xl border border-slate-200 p-4">
                    <p className="text-xs font-bold uppercase text-slate-500">Qualified Rate</p>
                    <p className="mt-1 text-lg font-black">{qualifiedRate}%</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 p-4">
                    <p className="text-xs font-bold uppercase text-slate-500">Conversion Rate</p>
                    <p className="mt-1 text-lg font-black">{conversionRate}%</p>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 lg:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200 p-4">
                    <p className="text-xs font-bold uppercase text-slate-500">Data Issue</p>
                    <p className="mt-2 text-sm text-slate-700">{item.dataIssue}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 p-4">
                    <p className="text-xs font-bold uppercase text-slate-500">Business Meaning</p>
                    <p className="mt-2 text-sm text-slate-700">{item.businessMeaning}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 p-4">
                    <p className="text-xs font-bold uppercase text-slate-500">Next Action</p>
                    <p className="mt-2 text-sm text-slate-700">{item.nextAction}</p>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <MarketActionButton moduleKey="data" engine="data" actionKey="fix_attribution" actionLabel="Fix Attribution" className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-bold text-white">Fix Attribution</MarketActionButton>
                  <MarketActionButton moduleKey="data" engine="data" actionKey="link_campaign" actionLabel="Link Campaign" className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-bold">Link Campaign</MarketActionButton>
                  <MarketActionButton moduleKey="data" engine="data" actionKey="validate_source" actionLabel="Validate Source" className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-bold">Validate Source</MarketActionButton>
                  <MarketActionButton moduleKey="data" engine="data" actionKey="create_data_task" actionLabel="Create Data Task" className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-bold">Create Data Task</MarketActionButton>
                </div>
              </article>
            )
          })}
        </div>
      </section>
    </main>
  )
}
