"use client"

import { useMemo, useState } from "react"
import {
  formatMad,
  seoClusters,
  stageLabel,
  type SeoRisk,
  type SeoStage,
} from "@/lib/market-os/seo-authority-growth-engine"

function badgeClass(value: string) {
  if (value === "critical" || value === "high") return "border-red-200 bg-red-50 text-red-700"
  if (value === "medium" || value === "brief" || value === "production") return "border-amber-200 bg-amber-50 text-amber-700"
  if (value === "low" || value === "published" || value === "ranking" || value === "optimization") return "border-emerald-200 bg-emerald-50 text-emerald-700"
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

export default function SeoAuthorityGrowthEngine() {
  const [query, setQuery] = useState("")
  const [stage, setStage] = useState<SeoStage | "all">("all")
  const [risk, setRisk] = useState<SeoRisk | "all">("all")

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()

    return seoClusters.filter((cluster) => {
      const queryMatch =
        !q ||
        cluster.title.toLowerCase().includes(q) ||
        cluster.serviceLine.toLowerCase().includes(q) ||
        cluster.primaryKeyword.toLowerCase().includes(q) ||
        cluster.owner.toLowerCase().includes(q)

      return queryMatch && (stage === "all" || cluster.stage === stage) && (risk === "all" || cluster.risk === risk)
    })
  }, [query, stage, risk])

  const totalPotential = seoClusters.reduce((sum, c) => sum + c.revenuePotentialMad, 0)
  const totalOrganicLeads = seoClusters.reduce((sum, c) => sum + c.organicLeads, 0)
  const totalPublished = seoClusters.reduce((sum, c) => sum + c.publishedPages, 0)
  const avgAuthority = Math.round(seoClusters.reduce((sum, c) => sum + c.authorityScore, 0) / seoClusters.length)

  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-950">
      <section className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-[2rem] bg-slate-950 p-8 text-white">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-300">
            Market-OS · Pack 12
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight">
            SEO, Authority & Organic Growth Engine
          </h1>
          <p className="mt-4 max-w-3xl text-slate-300">
            This layer builds long-term marketing power through keyword clusters, authority pages,
            service-line visibility, organic lead tracking and content optimization discipline.
          </p>

          <div className="mt-8 grid gap-3 md:grid-cols-4">
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="text-xs uppercase text-slate-300">Revenue Potential</p>
              <p className="mt-2 text-2xl font-black">{formatMad(totalPotential)}</p>
            </div>
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="text-xs uppercase text-slate-300">Organic Leads</p>
              <p className="mt-2 text-3xl font-black">{totalOrganicLeads}</p>
            </div>
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="text-xs uppercase text-slate-300">Published Pages</p>
              <p className="mt-2 text-3xl font-black">{totalPublished}</p>
            </div>
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="text-xs uppercase text-slate-300">Avg Authority</p>
              <p className="mt-2 text-3xl font-black">{avgAuthority}%</p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-4">
          <div className="grid gap-3 md:grid-cols-3">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search cluster, service, keyword, owner..."
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900"
            />

            <select value={stage} onChange={(e) => setStage(e.target.value as SeoStage | "all")} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold">
              <option value="all">All stages</option>
              <option value="research">Research</option>
              <option value="brief">Brief</option>
              <option value="production">Production</option>
              <option value="published">Published</option>
              <option value="ranking">Ranking</option>
              <option value="optimization">Optimization</option>
            </select>

            <select value={risk} onChange={(e) => setRisk(e.target.value as SeoRisk | "all")} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold">
              <option value="all">All risks</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        <div className="grid gap-5">
          {filtered.map((cluster) => (
            <article key={cluster.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="mb-3 flex flex-wrap gap-2">
                    <span className={`rounded-full border px-3 py-1 text-xs font-bold ${badgeClass(cluster.stage)}`}>
                      Stage: {stageLabel(cluster.stage)}
                    </span>
                    <span className={`rounded-full border px-3 py-1 text-xs font-bold ${badgeClass(cluster.risk)}`}>
                      Risk: {cluster.risk}
                    </span>
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-700">
                      Market: {cluster.targetMarket}
                    </span>
                  </div>

                  <h2 className="text-xl font-black">{cluster.title}</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Service: {cluster.serviceLine} · Keyword: {cluster.primaryKeyword} · Owner: {cluster.owner}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4 text-right">
                  <p className="text-xs font-bold uppercase text-slate-500">Revenue Potential</p>
                  <p className="mt-1 font-black">{formatMad(cluster.revenuePotentialMad)}</p>
                  <p className="text-xs text-slate-500">Organic leads: {cluster.organicLeads}</p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 p-4">
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="font-bold">Ranking Score</span>
                    <span>{cluster.rankingScore}%</span>
                  </div>
                  <Bar value={cluster.rankingScore} />
                </div>

                <div className="rounded-2xl border border-slate-200 p-4">
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="font-bold">Authority Score</span>
                    <span>{cluster.authorityScore}%</span>
                  </div>
                  <Bar value={cluster.authorityScore} />
                </div>

                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs font-bold uppercase text-slate-500">Pages</p>
                  <p className="mt-1 text-lg font-black">{cluster.publishedPages}/{cluster.plannedPages}</p>
                  <p className="text-xs text-slate-500">{cluster.supportingKeywords} supporting keywords</p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs font-bold uppercase text-slate-500">Blocker</p>
                  <p className="mt-2 text-sm text-slate-700">{cluster.blocker}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs font-bold uppercase text-slate-500">Next Action</p>
                  <p className="mt-2 text-sm text-slate-700">{cluster.nextAction}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs font-bold uppercase text-slate-500">Strategic Meaning</p>
                  <p className="mt-2 text-sm text-slate-700">{cluster.strategicMeaning}</p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <MarketActionButton moduleKey="seo" engine="seo" actionKey="create_seo_task" actionLabel="Create SEO Task" className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-bold text-white">Create SEO Task</MarketActionButton>
                <MarketActionButton moduleKey="seo" engine="seo" actionKey="add_keyword" actionLabel="Add Keyword" className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-bold">Add Keyword</MarketActionButton>
                <MarketActionButton moduleKey="seo" engine="seo" actionKey="create_content_brief" actionLabel="Create Content Brief" className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-bold">Create Content Brief</MarketActionButton>
                <MarketActionButton moduleKey="seo" engine="seo" actionKey="update_ranking" actionLabel="Update Ranking" className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-bold">Update Ranking</MarketActionButton>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
