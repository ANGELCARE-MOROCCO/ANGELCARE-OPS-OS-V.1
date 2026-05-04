"use client"

import { useMemo, useState } from "react"
import {
  executionTasks,
  getSlaRisk,
  statusLabel,
  type ExecutionStatus,
} from "@/lib/market-os/strategy-execution-engine"

const statuses: Array<ExecutionStatus | "all"> = [
  "all",
  "todo",
  "doing",
  "review",
  "approved",
  "blocked",
  "done",
]

function badgeClass(value: string) {
  if (value === "P0" || value === "Critical" || value === "blocked") {
    return "border-red-200 bg-red-50 text-red-700"
  }
  if (value === "P1" || value === "High" || value === "review") {
    return "border-amber-200 bg-amber-50 text-amber-700"
  }
  if (value === "Controlled" || value === "approved" || value === "done") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700"
  }
  return "border-slate-200 bg-slate-50 text-slate-700"
}
import MarketActionButton from "@/components/market-os/market-action-button"

export default function StrategyExecutionEngine() {
  const [status, setStatus] = useState<ExecutionStatus | "all">("all")
  const [query, setQuery] = useState("")

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()

    return executionTasks.filter((task) => {
      const statusMatch = status === "all" || task.status === status
      const queryMatch =
        !q ||
        task.title.toLowerCase().includes(q) ||
        task.objective.toLowerCase().includes(q) ||
        task.owner.toLowerCase().includes(q) ||
        task.department.toLowerCase().includes(q)

      return statusMatch && queryMatch
    })
  }, [status, query])

  const totalTasks = executionTasks.length
  const blockedTasks = executionTasks.filter((t) => t.status === "blocked").length
  const approvalTasks = executionTasks.filter((t) => t.approvalRequired).length
  const evidenceTasks = executionTasks.filter((t) => t.evidenceRequired).length

  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-950">
      <section className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-[2rem] bg-slate-950 p-8 text-white">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-300">
            Market-OS · Pack 2
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight">
            Strategy Execution Engine
          </h1>
          <p className="mt-4 max-w-3xl text-slate-300">
            This is the execution layer connected logically after the Strategy Growth Control Room.
            It turns strategic objectives into accountable daily tasks with owners, deadlines,
            SLA risk, proof requirements, approvals and expected business impact.
          </p>

          <div className="mt-8 grid gap-3 md:grid-cols-4">
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="text-xs uppercase text-slate-300">Total Tasks</p>
              <p className="mt-2 text-3xl font-black">{totalTasks}</p>
            </div>
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="text-xs uppercase text-slate-300">Blocked</p>
              <p className="mt-2 text-3xl font-black">{blockedTasks}</p>
            </div>
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="text-xs uppercase text-slate-300">Need Approval</p>
              <p className="mt-2 text-3xl font-black">{approvalTasks}</p>
            </div>
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="text-xs uppercase text-slate-300">Need Evidence</p>
              <p className="mt-2 text-3xl font-black">{evidenceTasks}</p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search task, objective, owner, department..."
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900 md:max-w-xl"
            />

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ExecutionStatus | "all")}
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-slate-900"
            >
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {s === "all" ? "All statuses" : statusLabel(s)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-5">
          {filtered.map((task) => {
            const risk = getSlaRisk(task)

            return (
              <article key={task.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="mb-3 flex flex-wrap gap-2">
                      <span className={`rounded-full border px-3 py-1 text-xs font-bold ${badgeClass(task.priority)}`}>
                        {task.priority}
                      </span>
                      <span className={`rounded-full border px-3 py-1 text-xs font-bold ${badgeClass(task.status)}`}>
                        {statusLabel(task.status)}
                      </span>
                      <span className={`rounded-full border px-3 py-1 text-xs font-bold ${badgeClass(risk)}`}>
                        SLA Risk: {risk}
                      </span>
                    </div>

                    <h2 className="text-xl font-black">{task.title}</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Objective: {task.objective} · Owner: {task.owner} · Department: {task.department}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4 text-right">
                    <p className="text-xs font-bold uppercase text-slate-500">Deadline</p>
                    <p className="mt-1 font-black">{task.deadline}</p>
                    <p className="text-xs text-slate-500">SLA: {task.slaHours}h</p>
                  </div>
                </div>

                <div className="mt-5">
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="font-bold">Execution Progress</span>
                    <span>{task.progress}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-slate-950" style={{ width: `${task.progress}%` }} />
                  </div>
                </div>

                <div className="mt-5 grid gap-4 lg:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200 p-4">
                    <p className="text-xs font-bold uppercase text-slate-500">Blocker</p>
                    <p className="mt-2 text-sm text-slate-700">{task.blocker}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 p-4">
                    <p className="text-xs font-bold uppercase text-slate-500">Next Action</p>
                    <p className="mt-2 text-sm text-slate-700">{task.nextAction}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 p-4">
                    <p className="text-xs font-bold uppercase text-slate-500">Expected Impact</p>
                    <p className="mt-2 text-sm text-slate-700">{task.expectedImpact}</p>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <MarketActionButton moduleKey="strategy" engine="data" actionKey="mark_doing" actionLabel="Mark Doing" className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-bold text-white">Mark Doing</MarketActionButton>
                  <MarketActionButton moduleKey="strategy" engine="data" actionKey="submit_for_review" actionLabel="Submit for Review" className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-bold">Submit for Review</MarketActionButton>
                  <MarketActionButton moduleKey="strategy" engine="data" actionKey="add_proof" actionLabel="Add Proof" className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-bold">Add Proof</MarketActionButton>
                  <MarketActionButton moduleKey="strategy" engine="data" actionKey="escalate" actionLabel="Escalate" className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-bold">Escalate</MarketActionButton>
                </div>
              </article>
            )
          })}
        </div>
      </section>
    </main>
  )
}
