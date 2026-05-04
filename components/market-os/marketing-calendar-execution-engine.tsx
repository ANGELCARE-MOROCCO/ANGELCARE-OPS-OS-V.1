"use client"

import { useMemo, useState } from "react"
import {
  calendarItems,
  statusLabel,
  typeLabel,
  type CalendarItemType,
  type CalendarRisk,
  type CalendarStatus,
} from "@/lib/market-os/marketing-calendar-execution-engine"

function badgeClass(value: string) {
  if (value === "critical" || value === "high" || value === "blocked" || value === "P0") return "border-red-200 bg-red-50 text-red-700"
  if (value === "medium" || value === "today" || value === "doing" || value === "P1") return "border-amber-200 bg-amber-50 text-amber-700"
  if (value === "low" || value === "done" || value === "P2") return "border-emerald-200 bg-emerald-50 text-emerald-700"
  return "border-slate-200 bg-slate-50 text-slate-700"
}
import MarketActionButton from "@/components/market-os/market-action-button"

export default function MarketingCalendarExecutionEngine() {
  const [query, setQuery] = useState("")
  const [type, setType] = useState<CalendarItemType | "all">("all")
  const [status, setStatus] = useState<CalendarStatus | "all">("all")
  const [risk, setRisk] = useState<CalendarRisk | "all">("all")

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()

    return calendarItems.filter((item) => {
      const queryMatch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.owner.toLowerCase().includes(q) ||
        item.linkedEngine.toLowerCase().includes(q)

      return (
        queryMatch &&
        (type === "all" || item.type === type) &&
        (status === "all" || item.status === status) &&
        (risk === "all" || item.risk === risk)
      )
    })
  }, [query, type, status, risk])

  const todayCount = calendarItems.filter((item) => item.status === "today" || item.status === "doing").length
  const blockedCount = calendarItems.filter((item) => item.status === "blocked").length
  const highRisk = calendarItems.filter((item) => item.risk === "high" || item.risk === "critical").length
  const p0Count = calendarItems.filter((item) => item.priority === "P0").length

  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-950">
      <section className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-[2rem] bg-slate-950 p-8 text-white">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-300">
            Market-OS · Pack 21
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight">
            Marketing Calendar & Daily Execution Board
          </h1>
          <p className="mt-4 max-w-3xl text-slate-300">
            This layer creates the daily operating rhythm for Market-OS: today’s approvals,
            launches, production blocks, reviews, partnership actions and execution priorities.
          </p>

          <div className="mt-8 grid gap-3 md:grid-cols-4">
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="text-xs uppercase text-slate-300">Today / Doing</p>
              <p className="mt-2 text-3xl font-black">{todayCount}</p>
            </div>
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="text-xs uppercase text-slate-300">Blocked</p>
              <p className="mt-2 text-3xl font-black">{blockedCount}</p>
            </div>
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="text-xs uppercase text-slate-300">High Risk</p>
              <p className="mt-2 text-3xl font-black">{highRisk}</p>
            </div>
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="text-xs uppercase text-slate-300">P0 Items</p>
              <p className="mt-2 text-3xl font-black">{p0Count}</p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-4">
          <div className="grid gap-3 md:grid-cols-4">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search calendar item, owner, engine..."
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900"
            />

            <select value={type} onChange={(e) => setType(e.target.value as CalendarItemType | "all")} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold">
              <option value="all">All types</option>
              <option value="campaign">Campaign</option>
              <option value="content">Content</option>
              <option value="approval">Approval</option>
              <option value="launch">Launch</option>
              <option value="review">Review</option>
              <option value="research">Research</option>
              <option value="partnership">Partnership</option>
            </select>

            <select value={status} onChange={(e) => setStatus(e.target.value as CalendarStatus | "all")} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold">
              <option value="all">All statuses</option>
              <option value="planned">Planned</option>
              <option value="today">Today</option>
              <option value="doing">Doing</option>
              <option value="blocked">Blocked</option>
              <option value="done">Done</option>
            </select>

            <select value={risk} onChange={(e) => setRisk(e.target.value as CalendarRisk | "all")} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold">
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
                    <span className={`rounded-full border px-3 py-1 text-xs font-bold ${badgeClass(item.status)}`}>
                      {statusLabel(item.status)}
                    </span>
                    <span className={`rounded-full border px-3 py-1 text-xs font-bold ${badgeClass(item.risk)}`}>
                      Risk: {item.risk}
                    </span>
                    <span className={`rounded-full border px-3 py-1 text-xs font-bold ${badgeClass(item.priority)}`}>
                      {item.priority}
                    </span>
                  </div>

                  <h2 className="text-xl font-black">{item.title}</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {item.date} · {item.timeBlock} · Owner: {item.owner}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4 text-right">
                  <p className="text-xs font-bold uppercase text-slate-500">Linked Engine</p>
                  <p className="mt-1 max-w-[220px] text-sm font-bold">{item.linkedEngine}</p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs font-bold uppercase text-slate-500">Expected Output</p>
                  <p className="mt-2 text-sm text-slate-700">{item.expectedOutput}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs font-bold uppercase text-slate-500">Blocker</p>
                  <p className="mt-2 text-sm text-slate-700">{item.blocker}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs font-bold uppercase text-slate-500">Next Action</p>
                  <p className="mt-2 text-sm text-slate-700">{item.nextAction}</p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <MarketActionButton moduleKey="calendar" engine="content" actionKey="start_work_block" actionLabel="Start Work Block" className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-bold text-white">Start Work Block</MarketActionButton>
                <MarketActionButton moduleKey="calendar" engine="content" actionKey="mark_done" actionLabel="Mark Done" className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-bold">Mark Done</MarketActionButton>
                <MarketActionButton moduleKey="calendar" engine="content" actionKey="move_date" actionLabel="Move Date" className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-bold">Move Date</MarketActionButton>
                <MarketActionButton moduleKey="calendar" engine="content" actionKey="escalate_blocker" actionLabel="Escalate Blocker" className="rounded-2xl border border-red-200 px-4 py-2 text-sm font-bold text-red-700">Escalate Blocker</MarketActionButton>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
