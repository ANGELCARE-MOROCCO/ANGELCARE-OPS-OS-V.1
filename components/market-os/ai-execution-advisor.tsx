"use client"

import { useEffect, useMemo, useState } from "react"

type Objective = {
  id: string
  title: string
  owner_name: string | null
  priority: string
  status: string
  deadline?: string | null
  next_action?: string | null
}

type Note = {
  objective_id: string
  severity: string
  status: string
  note_type: string
  title: string
}

function daysUntil(deadline?: string | null) {
  if (!deadline) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(deadline)
  target.setHours(0, 0, 0, 0)
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

function recommendation(objective: Objective, notes: Note[]) {
  const days = daysUntil(objective.deadline)
  const openNotes = notes.filter((n) => n.objective_id === objective.id && n.status === "open")
  const critical = openNotes.some((n) => n.severity === "critical" || n.severity === "high")

  if (objective.status === "completed") {
    return {
      urgency: "closed",
      action: "Close, audit, and convert learning into playbook.",
      reason: "The objective is completed and should now produce reusable operating knowledge.",
    }
  }

  if (critical) {
    return {
      urgency: "critical",
      action: "Resolve blocker first before pushing execution.",
      reason: "Open high/critical blockers are present and may cause execution failure.",
    }
  }

  if (days !== null && days < 0) {
    return {
      urgency: "critical",
      action: "Escalate immediately and reset deadline with owner commitment.",
      reason: "The objective is overdue and requires management intervention.",
    }
  }

  if (days !== null && days <= 1) {
    return {
      urgency: "urgent",
      action: "Focus this objective today and remove all non-essential work.",
      reason: "Deadline is within 24 hours.",
    }
  }

  if (!objective.owner_name) {
    return {
      urgency: "medium",
      action: "Assign accountable owner before more execution.",
      reason: "No clear owner means execution will drift.",
    }
  }

  if (!objective.next_action) {
    return {
      urgency: "medium",
      action: "Define the next concrete execution action.",
      reason: "The objective lacks a clear next step.",
    }
  }

  if (objective.priority === "P0") {
    return {
      urgency: "high",
      action: "Move into active execution and review progress daily.",
      reason: "P0 objective requires tight control even without visible blockers.",
    }
  }

  return {
    urgency: "normal",
    action: "Continue execution and review during normal operating rhythm.",
    reason: "No immediate execution danger detected.",
  }
}

function badgeClass(value: string) {
  if (value === "critical" || value === "high") return "border-red-200 bg-red-50 text-red-700"
  if (value === "urgent" || value === "medium") return "border-amber-200 bg-amber-50 text-amber-700"
  if (value === "normal" || value === "closed") return "border-emerald-200 bg-emerald-50 text-emerald-700"
  return "border-slate-200 bg-slate-50 text-slate-700"
}

export default function AiExecutionAdvisor() {
  const [objectives, setObjectives] = useState<Objective[]>([])
  const [notes, setNotes] = useState<Note[]>([])
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState("all")
  const [error, setError] = useState("")
  const [loadingId, setLoadingId] = useState<string | null>(null)

  async function load() {
    setError("")
    const objectiveRes = await fetch("/api/market-os/strategy-objectives")
    const notesRes = await fetch("/api/market-os/execution-notes")

    const objectiveJson = await objectiveRes.json()
    const notesJson = await notesRes.json()

    if (!objectiveRes.ok) setError(objectiveJson.error || "Failed to load objectives")
    if (!notesRes.ok) setError(notesJson.error || "Failed to load notes")

    setObjectives(objectiveJson.data || [])
    setNotes(notesJson.data || [])
  }

  useEffect(() => {
    load()
  }, [])

  async function convertToTaskChain(objective: Objective, recommendedAction: string) {
    setLoadingId(objective.id)
    setError("")

    const res = await fetch("/api/market-os/advisor-to-task-chain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        objective_id: objective.id,
        objective_title: objective.title,
        owner_name: objective.owner_name,
        recommended_action: recommendedAction,
      }),
    })

    const json = await res.json()

    if (!res.ok) {
      setError(json.error || "Failed to convert advisor action")
    } else {
      setError("Advisor action converted into task chain. Open AI Task Chain Orchestrator.")
    }

    setLoadingId(null)
  }

  const advisors = useMemo(() => {
    const q = query.toLowerCase().trim()

    return objectives
      .map((objective) => ({
        objective,
        advice: recommendation(objective, notes),
        days: daysUntil(objective.deadline),
      }))
      .filter(({ objective, advice }) => {
        const queryMatch =
          !q ||
          objective.title.toLowerCase().includes(q) ||
          objective.owner_name?.toLowerCase().includes(q) ||
          objective.next_action?.toLowerCase().includes(q)

        const filterMatch = filter === "all" || advice.urgency === filter

        return queryMatch && filterMatch
      })
  }, [objectives, notes, query, filter])

  const critical = advisors.filter((a) => a.advice.urgency === "critical").length
  const urgent = advisors.filter((a) => a.advice.urgency === "urgent").length
  const high = advisors.filter((a) => a.advice.urgency === "high").length
  const normal = advisors.filter((a) => a.advice.urgency === "normal").length

  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-950">
      <section className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-[2rem] bg-slate-950 p-8 text-white">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-300">
            Market-OS · Hardening Pack 20
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight">
            AI Execution Advisor
          </h1>
          <p className="mt-4 max-w-3xl text-slate-300">
            Converts objectives, deadlines and blockers into practical management recommendations, then converts recommendations into task chains.
          </p>

          <div className="mt-8 grid gap-3 md:grid-cols-4">
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="text-xs uppercase text-slate-300">Critical</p>
              <p className="mt-2 text-3xl font-black">{critical}</p>
            </div>
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="text-xs uppercase text-slate-300">Urgent</p>
              <p className="mt-2 text-3xl font-black">{urgent}</p>
            </div>
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="text-xs uppercase text-slate-300">High Priority</p>
              <p className="mt-2 text-3xl font-black">{high}</p>
            </div>
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="text-xs uppercase text-slate-300">Normal</p>
              <p className="mt-2 text-3xl font-black">{normal}</p>
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
              <option value="all">All urgency</option>
              <option value="critical">Critical</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="normal">Normal</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>

        <div className="grid gap-5">
          {advisors.map(({ objective, advice, days }) => (
            <article key={objective.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-3 flex flex-wrap gap-2">
                <span className={`rounded-full border px-3 py-1 text-xs font-bold ${badgeClass(advice.urgency)}`}>
                  {advice.urgency}
                </span>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-700">
                  {objective.priority}
                </span>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-700">
                  {objective.status}
                </span>
              </div>

              <h2 className="text-xl font-black">{objective.title}</h2>
              <p className="mt-1 text-sm text-slate-500">
                Owner: {objective.owner_name || "Unassigned"} · Deadline: {objective.deadline || "Not set"} · Days: {days ?? "—"}
              </p>

              <div className="mt-5 grid gap-4 lg:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs font-bold uppercase text-slate-500">Recommended Action</p>
                  <p className="mt-2 text-sm font-semibold text-slate-800">{advice.action}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs font-bold uppercase text-slate-500">Reason</p>
                  <p className="mt-2 text-sm text-slate-700">{advice.reason}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs font-bold uppercase text-slate-500">Current Next Action</p>
                  <p className="mt-2 text-sm text-slate-700">{objective.next_action || "No next action defined."}</p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <button
                  onClick={() => convertToTaskChain(objective, advice.action)}
                  disabled={loadingId === objective.id}
                  className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
                >
                  {loadingId === objective.id ? "Converting..." : "Convert to Task Chain"}
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
