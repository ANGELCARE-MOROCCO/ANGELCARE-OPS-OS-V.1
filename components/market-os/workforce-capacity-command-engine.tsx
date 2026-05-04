"use client"

import { useMemo, useState } from "react"
import {
  roleLabel,
  statusLabel,
  workforceAgents,
  type AgentStatus,
  type CapacityRisk,
  type WorkforceRole,
} from "@/lib/market-os/workforce-capacity-command-engine"

function badgeClass(value: string) {
  if (value === "critical" || value === "high" || value === "overloaded" || value === "blocked") {
    return "border-red-200 bg-red-50 text-red-700"
  }
  if (value === "medium" || value === "focused") return "border-amber-200 bg-amber-50 text-amber-700"
  if (value === "low" || value === "available") return "border-emerald-200 bg-emerald-50 text-emerald-700"
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

export default function WorkforceCapacityCommandEngine() {
  const [query, setQuery] = useState("")
  const [role, setRole] = useState<WorkforceRole | "all">("all")
  const [status, setStatus] = useState<AgentStatus | "all">("all")
  const [risk, setRisk] = useState<CapacityRisk | "all">("all")

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    return workforceAgents.filter((agent) => {
      const queryMatch =
        !q ||
        agent.name.toLowerCase().includes(q) ||
        agent.currentFocus.toLowerCase().includes(q)

      return queryMatch && (role === "all" || agent.role === role) && (status === "all" || agent.status === status) && (risk === "all" || agent.risk === risk)
    })
  }, [query, role, status, risk])

  const totalTasks = workforceAgents.reduce((sum, a) => sum + a.activeTasks, 0)
  const blockedTasks = workforceAgents.reduce((sum, a) => sum + a.blockedTasks, 0)
  const overloaded = workforceAgents.filter((a) => a.status === "overloaded" || a.risk === "high" || a.risk === "critical").length
  const avgProductivity = Math.round(workforceAgents.reduce((sum, a) => sum + a.productivityScore, 0) / workforceAgents.length)

  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-950">
      <section className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-[2rem] bg-slate-950 p-8 text-white">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-300">
            Market-OS · Pack 14
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight">
            Marketing Workforce & Capacity Command Engine
          </h1>
          <p className="mt-4 max-w-3xl text-slate-300">
            This layer controls marketing people, workload, capacity, skill fit, task pressure,
            productivity, quality and redistribution decisions.
          </p>

          <div className="mt-8 grid gap-3 md:grid-cols-4">
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="text-xs uppercase text-slate-300">Active Tasks</p>
              <p className="mt-2 text-3xl font-black">{totalTasks}</p>
            </div>
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="text-xs uppercase text-slate-300">Blocked Tasks</p>
              <p className="mt-2 text-3xl font-black">{blockedTasks}</p>
            </div>
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="text-xs uppercase text-slate-300">Overloaded Agents</p>
              <p className="mt-2 text-3xl font-black">{overloaded}</p>
            </div>
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="text-xs uppercase text-slate-300">Avg Productivity</p>
              <p className="mt-2 text-3xl font-black">{avgProductivity}%</p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-4">
          <div className="grid gap-3 md:grid-cols-4">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search agent or current focus..."
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900"
            />

            <select value={role} onChange={(e) => setRole(e.target.value as WorkforceRole | "all")} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold">
              <option value="all">All roles</option>
              <option value="strategy">Strategy</option>
              <option value="content">Content</option>
              <option value="ads">Ads</option>
              <option value="partnership">Partnership</option>
              <option value="seo">SEO</option>
              <option value="sales_enablement">Sales Enablement</option>
              <option value="academy_marketing">Academy Marketing</option>
            </select>

            <select value={status} onChange={(e) => setStatus(e.target.value as AgentStatus | "all")} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold">
              <option value="all">All statuses</option>
              <option value="available">Available</option>
              <option value="focused">Focused</option>
              <option value="overloaded">Overloaded</option>
              <option value="blocked">Blocked</option>
            </select>

            <select value={risk} onChange={(e) => setRisk(e.target.value as CapacityRisk | "all")} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold">
              <option value="all">All risks</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        <div className="grid gap-5">
          {filtered.map((agent) => {
            const capacityUse = Math.round((agent.usedHours / agent.weeklyCapacityHours) * 100)

            return (
              <article key={agent.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="mb-3 flex flex-wrap gap-2">
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-700">
                        Role: {roleLabel(agent.role)}
                      </span>
                      <span className={`rounded-full border px-3 py-1 text-xs font-bold ${badgeClass(agent.status)}`}>
                        {statusLabel(agent.status)}
                      </span>
                      <span className={`rounded-full border px-3 py-1 text-xs font-bold ${badgeClass(agent.risk)}`}>
                        Risk: {agent.risk}
                      </span>
                    </div>

                    <h2 className="text-xl font-black">{agent.name}</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Focus: {agent.currentFocus}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4 text-right">
                    <p className="text-xs font-bold uppercase text-slate-500">Task Load</p>
                    <p className="mt-1 font-black">{agent.activeTasks} active</p>
                    <p className="text-xs text-slate-500">{agent.blockedTasks} blocked</p>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-4">
                  <div className="rounded-2xl border border-slate-200 p-4">
                    <div className="mb-2 flex justify-between text-sm">
                      <span className="font-bold">Capacity Used</span>
                      <span>{capacityUse}%</span>
                    </div>
                    <Bar value={capacityUse} />
                    <p className="mt-2 text-xs text-slate-500">{agent.usedHours}/{agent.weeklyCapacityHours}h</p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 p-4">
                    <div className="mb-2 flex justify-between text-sm">
                      <span className="font-bold">Productivity</span>
                      <span>{agent.productivityScore}%</span>
                    </div>
                    <Bar value={agent.productivityScore} />
                  </div>

                  <div className="rounded-2xl border border-slate-200 p-4">
                    <div className="mb-2 flex justify-between text-sm">
                      <span className="font-bold">Quality</span>
                      <span>{agent.qualityScore}%</span>
                    </div>
                    <Bar value={agent.qualityScore} />
                  </div>

                  <div className="rounded-2xl border border-slate-200 p-4">
                    <div className="mb-2 flex justify-between text-sm">
                      <span className="font-bold">Strategic Fit</span>
                      <span>{agent.strategicFit}%</span>
                    </div>
                    <Bar value={agent.strategicFit} />
                  </div>
                </div>

                <div className="mt-5 grid gap-4 lg:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200 p-4">
                    <p className="text-xs font-bold uppercase text-slate-500">Overload Reason</p>
                    <p className="mt-2 text-sm text-slate-700">{agent.overloadReason}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 p-4">
                    <p className="text-xs font-bold uppercase text-slate-500">Redistribution</p>
                    <p className="mt-2 text-sm text-slate-700">{agent.recommendedRedistribution}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 p-4">
                    <p className="text-xs font-bold uppercase text-slate-500">Management Action</p>
                    <p className="mt-2 text-sm text-slate-700">{agent.nextManagementAction}</p>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <MarketActionButton moduleKey="workforce" engine="data" actionKey="assign_reassign_tasks" actionLabel="Reassign Tasks" className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-bold text-white">Reassign Tasks</MarketActionButton>
                  <MarketActionButton moduleKey="workforce" engine="data" actionKey="add_capacity_note" actionLabel="Add Capacity Note" className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-bold">Add Capacity Note</MarketActionButton>
                  <MarketActionButton moduleKey="workforce" engine="data" actionKey="open_workload" actionLabel="Open Workload" className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-bold">Open Workload</MarketActionButton>
                  <MarketActionButton moduleKey="workforce" engine="data" actionKey="escalate_capacity_risk" actionLabel="Escalate Capacity Risk" className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-bold">Escalate Capacity Risk</MarketActionButton>
                </div>
              </article>
            )
          })}
        </div>
      </section>
    </main>
  )
}
