"use client"

import { useEffect, useMemo, useState } from "react"

type Objective = {
  id: string
  title: string
  owner_name: string | null
  status: "planned" | "active" | "blocked" | "completed"
  priority: "P0" | "P1" | "P2" | "P3"
  deadline?: string | null
  next_action?: string | null
}

function daysUntil(deadline?: string | null) {
  if (!deadline) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(deadline)
  target.setHours(0, 0, 0, 0)
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

function slaLabel(days: number | null, status: string) {
  if (status === "completed") return "completed"
  if (days === null) return "no_deadline"
  if (days < 0) return "overdue"
  if (days <= 1) return "critical"
  if (days <= 3) return "urgent"
  return "safe"
}

function badgeClass(value: string) {
  if (value === "P0" || value === "blocked" || value === "overdue" || value === "critical") {
    return "border-red-200 bg-red-50 text-red-700"
  }
  if (value === "P1" || value === "active" || value === "urgent" || value === "no_deadline") {
    return "border-amber-200 bg-amber-50 text-amber-700"
  }
  if (value === "completed" || value === "safe") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700"
  }
  return "border-slate-200 bg-slate-50 text-slate-700"
}

export default function DeadlineSlaControl() {
  const [objectives, setObjectives] = useState<Objective[]>([])
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState("all")
  const [error, setError] = useState("")

  async function loadObjectives() {
    setError("")
    const res = await fetch("/api/market-os/strategy-objectives")
    const json = await res.json()

    if (!res.ok) setError(json.error || "Failed to load objectives")
    else setObjectives(json.data || [])
  }

  useEffect(() => {
    loadObjectives()
  }, [])

  async function updateObjective(item: Objective, patch: Partial<Objective>) {
    const res = await fetch("/api/market-os/strategy-objectives", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...item, ...patch }),
    })

    const json = await res.json()
    if (!res.ok) setError(json.error || "Failed to update objective")
    else await loadObjectives()
  }

  const enriched = useMemo(() => {
    const q = query.toLowerCase().trim()

    return objectives
      .map((objective) => {
        const days = daysUntil(objective.deadline)
        const sla = slaLabel(days, objective.status)
        return { objective, days, sla }
      })
      .filter(({ objective, sla }) => {
        const queryMatch =
          !q ||
          objective.title.toLowerCase().includes(q) ||
          objective.owner_name?.toLowerCase().includes(q) ||
          objective.next_action?.toLowerCase().includes(q)

        const filterMatch = filter === "all" || sla === filter || objective.status === filter || objective.priority === filter

        return queryMatch && filterMatch
      })
      .sort((a, b) => {
        if (a.days === null) return 1
        if (b.days === null) return -1
        return a.days - b.days
      })
  }, [objectives, query, filter])

  const overdue = objectives.filter((o) => slaLabel(daysUntil(o.deadline), o.status) === "overdue").length
  const critical = objectives.filter((o) => slaLabel(daysUntil(o.deadline), o.status) === "critical").length
  const noDeadline = objectives.filter((o) => !o.deadline && o.status !== "completed").length
  const completed = objectives.filter((o) => o.status === "completed").length

  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-950">
      <section className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-[2rem] bg-slate-950 p-8 text-white">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-300">
            Market-OS · Hardening Pack 16
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight">
            Deadline & SLA Control Center
          </h1>
          <p className="mt-4 max-w-3xl text-slate-300">
            Control execution pressure by monitoring deadlines, overdue objectives, critical SLA risks and missing due dates.
          </p>

          <div className="mt-8 grid gap-3 md:grid-cols-4">
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="text-xs uppercase text-slate-300">Overdue</p>
              <p className="mt-2 text-3xl font-black">{overdue}</p>
            </div>
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="text-xs uppercase text-slate-300">Critical 24h</p>
              <p className="mt-2 text-3xl font-black">{critical}</p>
            </div>
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="text-xs uppercase text-slate-300">No Deadline</p>
              <p className="mt-2 text-3xl font-black">{noDeadline}</p>
            </div>
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="text-xs uppercase text-slate-300">Completed</p>
              <p className="mt-2 text-3xl font-black">{completed}</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-700">
            {error}
          </div>
        )}

        <div className="rounded-3xl border border-slate-200 bg-white p-4">
          <div className="grid gap-3 md:grid-cols-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search objective, owner, next action..."
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
            />

            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold"
            >
              <option value="all">All</option>
              <option value="overdue">Overdue</option>
              <option value="critical">Critical 24h</option>
              <option value="urgent">Urgent 3 days</option>
              <option value="no_deadline">No deadline</option>
              <option value="blocked">Blocked</option>
              <option value="P0">P0</option>
              <option value="P1">P1</option>
            </select>
          </div>
        </div>

        <div className="grid gap-5">
          {enriched.map(({ objective, days, sla }) => (
            <article key={objective.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="mb-3 flex flex-wrap gap-2">
                    <span className={`rounded-full border px-3 py-1 text-xs font-bold ${badgeClass(objective.priority)}`}>
                      {objective.priority}
                    </span>
                    <span className={`rounded-full border px-3 py-1 text-xs font-bold ${badgeClass(objective.status)}`}>
                      {objective.status}
                    </span>
                    <span className={`rounded-full border px-3 py-1 text-xs font-bold ${badgeClass(sla)}`}>
                      SLA: {sla.replace("_", " ")}
                    </span>
                  </div>

                  <h2 className="text-xl font-black">{objective.title}</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Owner: {objective.owner_name || "Unassigned"} · Deadline: {objective.deadline || "Not set"}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4 text-right">
                  <p className="text-xs font-bold uppercase text-slate-500">Days Remaining</p>
                  <p className="mt-1 text-2xl font-black">{days === null ? "—" : days}</p>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-slate-200 p-4">
                <p className="text-xs font-bold uppercase text-slate-500">Next Action</p>
                <p className="mt-2 text-sm text-slate-700">{objective.next_action || "No next action defined."}</p>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <button
                  onClick={() => updateObjective(objective, { status: "active" })}
                  className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-bold text-white"
                >
                  Mark Active
                </button>
                <button
                  onClick={() => updateObjective(objective, { status: "blocked" })}
                  className="rounded-2xl border border-red-200 px-4 py-2 text-sm font-bold text-red-700"
                >
                  Mark Blocked
                </button>
                <button
                  onClick={() => updateObjective(objective, { status: "completed" })}
                  className="rounded-2xl border border-emerald-200 px-4 py-2 text-sm font-bold text-emerald-700"
                >
                  Complete
                </button>
              </div>
            </article>
          ))}

          {!enriched.length && (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm font-bold text-slate-500">
              No deadline/SLA items found.
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
