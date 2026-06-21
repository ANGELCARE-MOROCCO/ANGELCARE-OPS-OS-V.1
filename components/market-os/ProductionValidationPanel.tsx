"use client"

import { useEffect, useState } from "react"
import { CheckCircle2, ClipboardCheck, Play, RefreshCw } from "lucide-react"

async function api(path: string, options?: RequestInit) {
  const res = await fetch(path, { ...options, headers: { "Content-Type": "application/json", ...(options?.headers || {}) } })
  return res.json()
}

export default function ProductionValidationPanel() {
  const [score, setScore] = useState<any>(null)
  const [sessions, setSessions] = useState<any[]>([])
  const [results, setResults] = useState<any[]>([])
  const [status, setStatus] = useState("Ready")

  async function load() {
    const [s, sessionsRes, resultsRes] = await Promise.all([
      api("/api/email-os/production/readiness-score"),
      api("/api/email-os/production/test-sessions"),
      api("/api/email-os/production/test-results")
    ])

    setScore(s.data || s)
    setSessions(sessionsRes.data || [])
    setResults(resultsRes.data || [])
  }

  async function createSession() {
    const result = await api("/api/email-os/production/test-sessions", {
      method: "POST",
      body: JSON.stringify({ sessionName: "Production QA Session", environment: "local" })
    })
    setStatus(result.ok ? "QA session created" : result.error || "Failed")
    await load()
  }

  async function seedManifest() {
    const sessionId = sessions[0]?.id || null
    const result = await api("/api/email-os/production/test-results", {
      method: "PUT",
      body: JSON.stringify({ sessionId })
    })
    setStatus(result.ok ? "QA manifest seeded" : result.error || "Failed")
    await load()
  }

  async function logPass() {
    const result = await api("/api/email-os/production/test-results", {
      method: "POST",
      body: JSON.stringify({
        area: "manual",
        testKey: "manual_click_test",
        testLabel: "Manual click-through validation",
        status: "passed",
        severity: "high",
        notes: "Manual validation logged from dashboard."
      })
    })
    setStatus(result.ok ? "Manual pass logged" : result.error || "Failed")
    await load()
  }

  useEffect(() => { load() }, [])

  return (
    <section className="space-y-5">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
              <ClipboardCheck className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-950">Production Validation</h1>
              <p className="text-sm text-slate-9500">{status}</p>
            </div>
          </div>
          <button onClick={load} className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-bold hover:bg-slate-50">
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-4xl font-black text-slate-950">{score?.score ?? 0}%</div>
            <div className="text-xs font-black uppercase text-slate-500">Readiness score</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-4xl font-black text-slate-950">{sessions.length}</div>
            <div className="text-xs font-black uppercase text-slate-500">QA sessions</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-4xl font-black text-slate-950">{results.length}</div>
            <div className="text-xs font-black uppercase text-slate-500">Test results</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-lg font-black text-slate-950">{score?.status || "checking"}</div>
            <div className="text-xs font-black uppercase text-slate-500">Status</div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <button onClick={createSession} className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-2xl bg-white px-4 text-sm font-black text-slate-950">
            <Play className="h-4 w-4" /> New QA Session
          </button>
          <button onClick={seedManifest} className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-2xl border border-slate-200 px-4 text-sm font-black hover:bg-slate-50">
            Seed QA Manifest
          </button>
          <button onClick={logPass} className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-2xl border border-slate-200 px-4 text-sm font-black hover:bg-slate-50">
            <CheckCircle2 className="h-4 w-4" /> Log Manual Pass
          </button>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-black text-slate-950">Readiness Checks</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {(score?.checks || []).map((check: any) => (
            <div key={check.key} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="font-black text-slate-950">{check.key}</div>
                <div className={check.ok ? "text-emerald-700" : "text-rose-700"}>{check.ok ? "OK" : "Missing"}</div>
              </div>
              <div className="mt-1 text-xs font-bold uppercase text-slate-500">Weight {check.weight}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
