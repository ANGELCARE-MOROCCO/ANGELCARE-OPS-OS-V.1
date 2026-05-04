"use client"

import { useMemo, useState } from "react"
import {
  contentAssets,
  stageLabel,
  type ContentRisk,
  type ContentStage,
} from "@/lib/market-os/content-brand-governance-engine"

function badgeClass(value: string) {
  if (value === "critical" || value === "high") return "border-red-200 bg-red-50 text-red-700"
  if (value === "medium" || value === "brand_review" || value === "compliance_review" || value === "design") {
    return "border-amber-200 bg-amber-50 text-amber-700"
  }
  if (value === "approved" || value === "published" || value === "low") {
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

export default function ContentBrandGovernanceEngine() {
  const [query, setQuery] = useState("")
  const [stage, setStage] = useState<ContentStage | "all">("all")
  const [risk, setRisk] = useState<ContentRisk | "all">("all")

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()

    return contentAssets.filter((asset) => {
      const queryMatch =
        !q ||
        asset.title.toLowerCase().includes(q) ||
        asset.campaign.toLowerCase().includes(q) ||
        asset.owner.toLowerCase().includes(q) ||
        asset.assetType.toLowerCase().includes(q)

      const stageMatch = stage === "all" || asset.stage === stage
      const riskMatch = risk === "all" || asset.risk === risk

      return queryMatch && stageMatch && riskMatch
    })
  }, [query, stage, risk])

  const avgBrand = Math.round(contentAssets.reduce((sum, a) => sum + a.brandScore, 0) / contentAssets.length)
  const avgCompliance = Math.round(contentAssets.reduce((sum, a) => sum + a.complianceScore, 0) / contentAssets.length)
  const highRisk = contentAssets.filter((a) => a.risk === "high" || a.risk === "critical").length
  const missingCount = contentAssets.reduce((sum, a) => sum + a.missing.length, 0)

  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-950">
      <section className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-[2rem] bg-slate-950 p-8 text-white">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-300">
            Market-OS · Pack 7
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight">
            Content Production & Brand Governance Engine
          </h1>
          <p className="mt-4 max-w-3xl text-slate-300">
            This layer transforms campaigns into controlled production: content briefs, copywriting,
            design, brand review, compliance review, approval, publishing readiness and performance feedback.
          </p>

          <div className="mt-8 grid gap-3 md:grid-cols-4">
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="text-xs uppercase text-slate-300">Avg Brand Score</p>
              <p className="mt-2 text-3xl font-black">{avgBrand}%</p>
            </div>
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="text-xs uppercase text-slate-300">Avg Compliance</p>
              <p className="mt-2 text-3xl font-black">{avgCompliance}%</p>
            </div>
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="text-xs uppercase text-slate-300">High Risk Assets</p>
              <p className="mt-2 text-3xl font-black">{highRisk}</p>
            </div>
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="text-xs uppercase text-slate-300">Missing Items</p>
              <p className="mt-2 text-3xl font-black">{missingCount}</p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-4">
          <div className="grid gap-3 md:grid-cols-3">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search asset, campaign, owner, type..."
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900"
            />

            <select value={stage} onChange={(e) => setStage(e.target.value as ContentStage | "all")} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold">
              <option value="all">All stages</option>
              <option value="idea">Idea</option>
              <option value="brief">Brief</option>
              <option value="copywriting">Copywriting</option>
              <option value="design">Design</option>
              <option value="brand_review">Brand Review</option>
              <option value="compliance_review">Compliance Review</option>
              <option value="approved">Approved</option>
              <option value="published">Published</option>
            </select>

            <select value={risk} onChange={(e) => setRisk(e.target.value as ContentRisk | "all")} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold">
              <option value="all">All risks</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        <div className="grid gap-5">
          {filtered.map((asset) => (
            <article key={asset.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="mb-3 flex flex-wrap gap-2">
                    <span className={`rounded-full border px-3 py-1 text-xs font-bold ${badgeClass(asset.stage)}`}>
                      Stage: {stageLabel(asset.stage)}
                    </span>
                    <span className={`rounded-full border px-3 py-1 text-xs font-bold ${badgeClass(asset.risk)}`}>
                      Risk: {asset.risk}
                    </span>
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-700">
                      Type: {asset.assetType}
                    </span>
                  </div>

                  <h2 className="text-xl font-black">{asset.title}</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Campaign: {asset.campaign} · Owner: {asset.owner} · Channel: {asset.channel}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4 text-right">
                  <p className="text-xs font-bold uppercase text-slate-500">Deadline</p>
                  <p className="mt-1 font-black">{asset.deadline}</p>
                  <p className="text-xs text-slate-500">Readiness: {asset.readiness}%</p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 p-4">
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="font-bold">Production Readiness</span>
                    <span>{asset.readiness}%</span>
                  </div>
                  <Bar value={asset.readiness} />
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="font-bold">Brand Score</span>
                    <span>{asset.brandScore}%</span>
                  </div>
                  <Bar value={asset.brandScore} />
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="font-bold">Compliance Score</span>
                    <span>{asset.complianceScore}%</span>
                  </div>
                  <Bar value={asset.complianceScore} />
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-xs font-bold uppercase text-amber-700">Missing Before Approval</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {asset.missing.map((item) => (
                    <span key={item} className="rounded-full border border-amber-200 bg-white px-3 py-1 text-xs font-bold text-amber-700">
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs font-bold uppercase text-slate-500">Brand Issue</p>
                  <p className="mt-2 text-sm text-slate-700">{asset.brandIssue}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs font-bold uppercase text-slate-500">Compliance Issue</p>
                  <p className="mt-2 text-sm text-slate-700">{asset.complianceIssue}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs font-bold uppercase text-slate-500">Next Action</p>
                  <p className="mt-2 text-sm text-slate-700">{asset.nextAction}</p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <MarketActionButton moduleKey="content" engine="content" actionKey="create_production_task" actionLabel="Create Production Task" className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-bold text-white">Create Production Task</MarketActionButton>
                <MarketActionButton moduleKey="content" engine="content" actionKey="submit_brand_review" actionLabel="Submit Brand Review" className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-bold">Submit Brand Review</MarketActionButton>
                <MarketActionButton moduleKey="content" engine="content" actionKey="submit_compliance_review" actionLabel="Submit Compliance Review" className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-bold">Submit Compliance Review</MarketActionButton>
                <MarketActionButton moduleKey="content" engine="content" actionKey="approve_asset" actionLabel="Approve Asset" className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-bold">Approve Asset</MarketActionButton>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
