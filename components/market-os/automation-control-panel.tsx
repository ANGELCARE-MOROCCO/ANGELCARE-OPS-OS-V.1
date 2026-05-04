"use client"

import { useEffect, useState } from "react"

type AutomationLog = {
  id: string
  action: string | null
  rule_key: string | null
  objective_id: string | null
  created_at: string
}

export default function AutomationControlPanel() {
  const [loading, setLoading] = useState(false)
  const [actions, setActions] = useState<string[]>([])
  const [logs, setLogs] = useState<AutomationLog[]>([])
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  async function loadLogs() {
    const res = await fetch("/api/market-os/automation-logs")
    const json = await res.json()

    if (!res.ok) setError(json.error || "Failed to load automation logs")
    else setLogs(json.data || [])
  }

  useEffect(() => {
    loadLogs()
  }, [])

  async function runAutomation() {
    setLoading(true)
    setError("")
    setMessage("")
    setActions([])

    const res = await fetch("/api/market-os/automation-engine", {
      method: "POST",
    })

    const json = await res.json()

    if (!res.ok) {
      setError(json.error || "Automation failed")
    } else {
      setMessage(json.message || "Automation executed")
      setActions(json.actions || [])
      await loadLogs()
    }

    setLoading(false)
  }

  const overdueCount = logs.filter((log) => log.rule_key === "overdue_escalation").length
  const ownerCount = logs.filter((log) => log.rule_key === "missing_owner").length
  const blockerCount = logs.filter((log) => log.rule_key === "critical_blocker_task").length
  const nextActionCount = logs.filter((log) => log.rule_key === "missing_next_action").length

  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-950">
      <section className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-[2rem] bg-slate-950 p-8 text-white">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-300">
            Market-OS · Hardening Pack 24
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight">
            Automation Control Panel
          </h1>
          <p className="mt-4 max-w-3xl text-slate-300">
            Run Market-OS automation and review saved automation history across overdue escalation, owner assignment, blocker tasks and next-action repair.
          </p>

          <div className="mt-8 grid gap-3 md:grid-cols-4">
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="text-xs uppercase text-slate-300">Overdue Escalations</p>
              <p className="mt-2 text-3xl font-black">{overdueCount}</p>
            </div>
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="text-xs uppercase text-slate-300">Owner Fixes</p>
              <p className="mt-2 text-3xl font-black">{ownerCount}</p>
            </div>
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="text-xs uppercase text-slate-300">Blocker Tasks</p>
              <p className="mt-2 text-3xl font-black">{blockerCount}</p>
            </div>
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="text-xs uppercase text-slate-300">Next Action Fixes</p>
              <p className="mt-2 text-3xl font-black">{nextActionCount}</p>
            </div>
          </div>
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

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black">Run Automation Engine</h2>
          <p className="mt-2 text-sm text-slate-600">
            Scans objectives, notes, blockers, owners, deadlines and next actions.
          </p>

          <button
            onClick={runAutomation}
            disabled={loading}
            className="mt-5 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
          >
            {loading ? "Running Automation..." : "Run Automation Now"}
          </button>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black">Latest Run Actions</h2>

          <div className="mt-4 grid gap-3">
            {actions.map((action, index) => (
              <div key={index} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold">{action}</p>
              </div>
            ))}

            {!actions.length && (
              <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm font-bold text-slate-500">
                No latest actions yet.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h2 className="text-xl font-black">Saved Automation History</h2>
            <button
              onClick={loadLogs}
              className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-bold"
            >
              Refresh Logs
            </button>
          </div>

          <div className="mt-4 grid gap-3">
            {logs.map((log) => (
              <div key={log.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-sm font-bold">{log.action || "Automation action"}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Rule: {log.rule_key || "general"} · Objective: {log.objective_id || "—"}
                    </p>
                  </div>
                  <p className="text-xs font-semibold text-slate-500">
                    {new Date(log.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}

            {!logs.length && (
              <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm font-bold text-slate-500">
                No saved automation logs yet.
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}
