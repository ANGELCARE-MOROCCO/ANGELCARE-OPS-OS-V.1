"use client"

import { useEffect, useState } from "react"

type Objective = {
  id: string
  title: string
  status: string
  priority?: string | null
  owner_name?: string | null
  next_action?: string | null
  deadline?: string | null
  target_mad?: number | null
}

type AuditEvent = {
  id: string
  objective_id: string | null
  event_type?: string | null
  event_title: string
  event_summary?: string | null
  actor_name?: string | null
  source_module?: string | null
  created_at: string
}

type ApiListResponse<T> = {
  data?: T[]
  error?: string
}

export default function StrategyGrowthControlRoom() {
  const [objectives, setObjectives] = useState<Objective[]>([])
  const [audit, setAudit] = useState<AuditEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

  async function load() {
    setError("")

    try {
      const [objectivesRes, auditRes] = await Promise.all([
        fetch("/api/market-os/strategy-objectives"),
        fetch("/api/market-os/audit-events"),
      ])

      const objectivesJson: ApiListResponse<Objective> = await objectivesRes.json()
      const auditJson: ApiListResponse<AuditEvent> = await auditRes.json()

      if (!objectivesRes.ok) {
        setError(objectivesJson.error || "Failed to load objectives")
        return
      }

      if (!auditRes.ok) {
        setError(auditJson.error || "Failed to load audit events")
        return
      }

      setObjectives(objectivesJson.data || [])
      setAudit(auditJson.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected loading error")
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function logEvent(objectiveId: string, title: string) {
    const res = await fetch("/api/market-os/audit-events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        objective_id: objectiveId,
        event_type: "action",
        event_title: title,
        actor_name: "User",
        source_module: "Strategy Growth Control Room",
      }),
    })

    if (!res.ok) {
      const json = await res.json().catch(() => null)
      throw new Error(json?.error || "Failed to create audit event")
    }
  }

  async function markCompleted(objective: Objective) {
    setLoading(true)
    setError("")
    setMessage("")

    try {
      const res = await fetch("/api/market-os/strategy-objectives", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...objective, status: "completed" }),
      })

      if (!res.ok) {
        const json = await res.json().catch(() => null)
        throw new Error(json?.error || "Failed to mark objective completed")
      }

      await logEvent(objective.id, "Objective marked as COMPLETED")
      await load()
      setMessage("Objective completed and audit event recorded.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to complete objective")
    } finally {
      setLoading(false)
    }
  }

  function auditForObjective(id: string) {
    return audit.filter((event) => event.objective_id === id)
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-950">
      <section className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-[2rem] bg-slate-950 p-8 text-white">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-300">
            Market-OS · Typed Recovery
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight">
            Execution + Audit System
          </h1>
          <p className="mt-4 max-w-3xl text-slate-300">
            Typed strategy execution page with objective completion and audit timeline tracking.
          </p>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
            {error}
          </div>
        )}

        {message && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
            {message}
          </div>
        )}

        <div className="grid gap-5">
          {objectives.map((objective) => {
            const objectiveAudit = auditForObjective(objective.id)

            return (
              <article key={objective.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h2 className="text-xl font-black">{objective.title}</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Status: {objective.status || "unknown"}
                      {objective.owner_name ? ` · Owner: ${objective.owner_name}` : ""}
                    </p>
                  </div>

                  <button
                    onClick={() => markCompleted(objective)}
                    disabled={loading || objective.status === "completed"}
                    className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
                  >
                    {objective.status === "completed" ? "Completed" : loading ? "Saving..." : "Complete"}
                  </button>
                </div>

                <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-black">Audit Timeline</p>

                  <div className="mt-3 grid gap-2">
                    {objectiveAudit.map((event) => (
                      <div key={event.id} className="rounded-2xl border border-slate-200 bg-white p-3 text-sm">
                        <p className="font-bold">{event.event_title}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {event.actor_name || "System"} · {new Date(event.created_at).toLocaleString()}
                        </p>
                      </div>
                    ))}

                    {!objectiveAudit.length && (
                      <div className="rounded-2xl border border-dashed border-slate-300 p-4 text-center text-xs font-bold text-slate-500">
                        No audit events yet.
                      </div>
                    )}
                  </div>
                </div>
              </article>
            )
          })}

          {!objectives.length && (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm font-bold text-slate-500">
              No objectives found.
            </div>
          )}
        </div>
      </section>
    </main>
  )
}