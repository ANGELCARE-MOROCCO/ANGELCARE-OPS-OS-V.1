"use client"

import { useMemo, useState } from "react"
import {
  formatMad,
  reports,
  statusLabel,
  typeLabel,
  type ReportRisk,
  type ReportStatus,
  type ReportType,
} from "@/lib/market-os/marketing-board-reporting-engine"

function badgeClass(value: string) {
  if (value === "critical" || value === "high" || value === "draft") return "border-red-200 bg-red-50 text-red-700"
  if (value === "medium" || value === "review") return "border-amber-200 bg-amber-50 text-amber-700"
  if (value === "low" || value === "approved" || value === "exported") return "border-emerald-200 bg-emerald-50 text-emerald-700"
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

export default function MarketingBoardReportingEngine() {
  const [query, setQuery] = useState("")
  const [type, setType] = useState<ReportType | "all">("all")
  const [status, setStatus] = useState<ReportStatus | "all">("all")
  const [risk, setRisk] = useState<ReportRisk | "all">("all")

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()

    return reports.filter((report) => {
      const queryMatch =
        !q ||
        report.title.toLowerCase().includes(q) ||
        report.owner.toLowerCase().includes(q) ||
        report.period.toLowerCase().includes(q)

      return (
        queryMatch &&
        (type === "all" || report.type === type) &&
        (status === "all" || report.status === status) &&
        (risk === "all" || report.risk === risk)
      )
    })
  }, [query, type, status, risk])

  const totalImpact = reports.reduce((sum, report) => sum + report.revenueImpactMad, 0)
  const avgInvestor = Math.round(reports.reduce((sum, report) => sum + report.investorReadiness, 0) / reports.length)
  const pendingReview = reports.filter((report) => report.status === "draft" || report.status === "review").length
  const highRisk = reports.filter((report) => report.risk === "high" || report.risk === "critical").length

  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-950">
      <section className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-[2rem] bg-slate-950 p-8 text-white">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-300">
            Market-OS · Pack 22
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight">
            Marketing Reporting & Board Export Engine
          </h1>
          <p className="mt-4 max-w-3xl text-slate-300">
            This layer converts Market-OS activity into daily, weekly, campaign and investor-ready
            reports with KPI health, execution health, financial impact, risks and decisions needed.
          </p>

          <div className="mt-8 grid gap-3 md:grid-cols-4">
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="text-xs uppercase text-slate-300">Reported Impact</p>
              <p className="mt-2 text-2xl font-black">{formatMad(totalImpact)}</p>
            </div>
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="text-xs uppercase text-slate-300">Investor Readiness</p>
              <p className="mt-2 text-3xl font-black">{avgInvestor}%</p>
            </div>
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="text-xs uppercase text-slate-300">Pending Review</p>
              <p className="mt-2 text-3xl font-black">{pendingReview}</p>
            </div>
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="text-xs uppercase text-slate-300">High Risk Reports</p>
              <p className="mt-2 text-3xl font-black">{highRisk}</p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-4">
          <div className="grid gap-3 md:grid-cols-4">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search report, owner, period..."
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900"
            />

            <select value={type} onChange={(e) => setType(e.target.value as ReportType | "all")} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold">
              <option value="all">All types</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="investor">Investor</option>
              <option value="campaign">Campaign</option>
              <option value="risk">Risk</option>
            </select>

            <select value={status} onChange={(e) => setStatus(e.target.value as ReportStatus | "all")} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold">
              <option value="all">All statuses</option>
              <option value="draft">Draft</option>
              <option value="review">Review</option>
              <option value="approved">Approved</option>
              <option value="exported">Exported</option>
            </select>

            <select value={risk} onChange={(e) => setRisk(e.target.value as ReportRisk | "all")} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold">
              <option value="all">All risks</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        <div className="grid gap-5">
          {filtered.map((report) => (
            <article key={report.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="mb-3 flex flex-wrap gap-2">
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-700">
                      Type: {typeLabel(report.type)}
                    </span>
                    <span className={`rounded-full border px-3 py-1 text-xs font-bold ${badgeClass(report.status)}`}>
                      {statusLabel(report.status)}
                    </span>
                    <span className={`rounded-full border px-3 py-1 text-xs font-bold ${badgeClass(report.risk)}`}>
                      Risk: {report.risk}
                    </span>
                  </div>

                  <h2 className="text-xl font-black">{report.title}</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Period: {report.period} · Owner: {report.owner}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4 text-right">
                  <p className="text-xs font-bold uppercase text-slate-500">Revenue Impact</p>
                  <p className="mt-1 font-black">{formatMad(report.revenueImpactMad)}</p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 p-4">
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="font-bold">KPI Health</span>
                    <span>{report.kpiHealth}%</span>
                  </div>
                  <Bar value={report.kpiHealth} />
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="font-bold">Execution Health</span>
                    <span>{report.executionHealth}%</span>
                  </div>
                  <Bar value={report.executionHealth} />
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="font-bold">Investor Readiness</span>
                    <span>{report.investorReadiness}%</span>
                  </div>
                  <Bar value={report.investorReadiness} />
                </div>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs font-bold uppercase text-slate-500">Summary</p>
                  <p className="mt-2 text-sm text-slate-700">{report.summary}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs font-bold uppercase text-slate-500">Key Risks</p>
                  <p className="mt-2 text-sm text-slate-700">{report.keyRisks}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs font-bold uppercase text-slate-500">Decisions Needed</p>
                  <p className="mt-2 text-sm text-slate-700">{report.decisionsNeeded}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs font-bold uppercase text-slate-500">Next Action</p>
                  <p className="mt-2 text-sm text-slate-700">{report.nextAction}</p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <MarketActionButton moduleKey="reporting" engine="data" actionKey="export_report" actionLabel="Export Report" className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-bold text-white">Export Report</MarketActionButton>
                <MarketActionButton moduleKey="reporting" engine="data" actionKey="submit_review" actionLabel="Submit Review" className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-bold">Submit Review</MarketActionButton>
                <MarketActionButton moduleKey="reporting" engine="data" actionKey="approve_report" actionLabel="Approve Report" className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-bold">Approve Report</MarketActionButton>
                <MarketActionButton moduleKey="reporting" engine="data" actionKey="create_board_task" actionLabel="Create Board Task" className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-bold">Create Board Task</MarketActionButton>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
