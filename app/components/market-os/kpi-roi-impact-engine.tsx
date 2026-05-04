"use client"

import { useMemo, useState } from "react"
import {
  formatMad,
  impactItems,
  impactLabel,
  progress,
  type ImpactStatus,
} from "@/lib/market-os/kpi-roi-impact-engine"

function badgeClass(value: string) {
  if (value === "danger") return "border-red-200 bg-red-50 text-red-700"
  if (value === "watch") return "border-amber-200 bg-amber-50 text-amber-700"
  if (value === "healthy") return "border-emerald-200 bg-emerald-50 text-emerald-700"
  if (value === "excellent") return "border-blue-200 bg-blue-50 text-blue-700"
  return "border-slate-200 bg-slate-50 text-slate-700"
}

function Bar({ value }: { value: number }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
      <div className="h-full rounded-full bg-slate-950" style={{ width: `${value}%` }} />
    </div>
  )
}

export default function KpiRoiImpactEngine() {
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState<ImpactStatus | "all">("all")

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()

    return impactItems.filter((item) => {
      const queryMatch =
        !q ||
        item.strategy.toLowerCase().includes(q) ||
        item.owner.toLowerCase().includes(q)

      const statusMatch = status === "all" || item.status === status

      return queryMatch && statusMatch
    })
  }, [query, status])

  const totalBudget = impactItems.reduce((sum, item) => sum + item.budgetMad, 0)
  const totalSpent = impactItems.reduce((sum, item) => sum + item.spentMad, 0)
  const totalTarget = impactItems.reduce((sum, item) => sum + item.revenueTargetMad, 0)
  const totalActual = impactItems.reduce((sum, item) => sum + item.revenueActualMad, 0)

  const portfolioRoi = totalSpent > 0 ? (totalActual / totalSpent).toFixed(1) : "0"

  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-950">
      <section className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-[2rem] bg-slate-950 p-8 text-white">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-300">
            Market-OS · Pack 4
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight">
            KPI, ROI & Financial Impact Engine
          </h1>
          <p className="mt-4 max-w-3xl text-slate-300">
            This layer proves whether marketing execution is creating business value.
            It connects strategy, budget, CAC, conversion, revenue and ROI into one investor-grade view.
          </p>

          <div className="mt-8 grid gap-3 md:grid-cols-4">
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="text-xs uppercase text-slate-300">Total Budget</p>
              <p className="mt-2 text-2xl font-black">{formatMad(totalBudget)}</p>
            </div>
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="text-xs uppercase text-slate-300">Spent</p>
              <p className="mt-2 text-2xl font-black">{formatMad(totalSpent)}</p>
            </div>
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="text-xs uppercase text-slate-300">Revenue Actual</p>
              <p className="mt-2 text-2xl font-black">{formatMad(totalActual)}</p>
            </div>
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="text-xs uppercase text-slate-300">Portfolio ROI</p>
              <p className="mt-2 text-2xl font-black">{portfolioRoi}x</p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search strategy or owner..."
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900 md:max-w-xl"
            />

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ImpactStatus | "all")}
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none"
            >
              <option value="all">All statuses</option>
              <option value="excellent">Excellent</option>
              <option value="healthy">Healthy</option>
              <option value="watch">Watch</option>
              <option value="danger">Danger</option>
            </select>
          </div>
        </div>

        <div className="grid gap-5">
          {filtered.map((item) => {
            const revenueProgress = progress(item.revenueActualMad, item.revenueTargetMad)
            const leadProgress = progress(item.leadsActual, item.leadsTarget)
            const budgetProgress = progress(item.spentMad, item.budgetMad)

            return (
              <article key={item.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="mb-3 flex flex-wrap gap-2">
                      <span className={`rounded-full border px-3 py-1 text-xs font-bold ${badgeClass(item.status)}`}>
                        {impactLabel(item.status)}
                      </span>
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-700">
                        ROI: {item.roi}x
                      </span>
                    </div>

                    <h2 className="text-xl font-black">{item.strategy}</h2>
                    <p className="mt-1 text-sm text-slate-500">Owner: {item.owner}</p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4 text-right">
                    <p className="text-xs font-bold uppercase text-slate-500">Revenue</p>
                    <p className="mt-1 font-black">{formatMad(item.revenueActualMad)}</p>
                    <p className="text-xs text-slate-500">Target: {formatMad(item.revenueTargetMad)}</p>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200 p-4">
                    <div className="mb-2 flex justify-between text-sm">
                      <span className="font-bold">Revenue Progress</span>
                      <span>{revenueProgress}%</span>
                    </div>
                    <Bar value={revenueProgress} />
                    <p className="mt-2 text-xs text-slate-500">
                      {formatMad(item.revenueActualMad)} / {formatMad(item.revenueTargetMad)}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 p-4">
                    <div className="mb-2 flex justify-between text-sm">
                      <span className="font-bold">Lead Progress</span>
                      <span>{leadProgress}%</span>
                    </div>
                    <Bar value={leadProgress} />
                    <p className="mt-2 text-xs text-slate-500">
                      {item.leadsActual} / {item.leadsTarget} leads
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 p-4">
                    <div className="mb-2 flex justify-between text-sm">
                      <span className="font-bold">Budget Used</span>
                      <span>{budgetProgress}%</span>
                    </div>
                    <Bar value={budgetProgress} />
                    <p className="mt-2 text-xs text-slate-500">
                      {formatMad(item.spentMad)} / {formatMad(item.budgetMad)}
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-4">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-bold uppercase text-slate-500">CAC</p>
                    <p className="mt-1 text-lg font-black">{formatMad(item.cacActualMad)}</p>
                    <p className="text-xs text-slate-500">Target: {formatMad(item.cacTargetMad)}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-bold uppercase text-slate-500">Conversion</p>
                    <p className="mt-1 text-lg font-black">{item.conversionActual}%</p>
                    <p className="text-xs text-slate-500">Target: {item.conversionTarget}%</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-bold uppercase text-slate-500">Spent</p>
                    <p className="mt-1 text-lg font-black">{formatMad(item.spentMad)}</p>
                    <p className="text-xs text-slate-500">Budget control</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-bold uppercase text-slate-500">ROI</p>
                    <p className="mt-1 text-lg font-black">{item.roi}x</p>
                    <p className="text-xs text-slate-500">Return on spend</p>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 lg:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 p-4">
                    <p className="text-xs font-bold uppercase text-slate-500">Financial Diagnosis</p>
                    <p className="mt-2 text-sm text-slate-700">{item.diagnosis}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 p-4">
                    <p className="text-xs font-bold uppercase text-slate-500">Next Financial Action</p>
                    <p className="mt-2 text-sm text-slate-700">{item.nextAction}</p>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </section>
    </main>
  )
}
