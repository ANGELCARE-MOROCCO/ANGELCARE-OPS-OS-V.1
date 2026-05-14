"use client"

import Link from "next/link"
import { useEffect, useMemo, useRef, useState } from "react"

type Snapshot = {
  key: string
  value?: string
  size?: number
  checksum?: string
  updatedAt?: string
  source?: string
  origin?: string
}

const MANAGED_PREFIXES = [
  "revenue_",
  "market_",
  "ambassador_",
  "seo_",
  "content_",
  "csv_",
  "task_",
  "tasks_",
  "staff_",
  "angelcare_",
]

const BLOCKED_FRAGMENTS = [
  "supabase.auth",
  "sb-",
  "auth-token",
  "access_token",
  "refresh_token",
  "password",
  "secret",
]

function isManagedKey(key: string) {
  const lower = key.toLowerCase()
  if (BLOCKED_FRAGMENTS.some((fragment) => lower.includes(fragment))) return false
  return MANAGED_PREFIXES.some((prefix) => lower.startsWith(prefix) || lower.includes(prefix))
}

function normalizeBackupPayload(payload: unknown) {
  const snapshots: { key: string; value: string; source: string; origin: string }[] = []
  if (!payload || typeof payload !== "object") return snapshots

  Object.entries(payload as Record<string, unknown>).forEach(([key, rawValue]) => {
    if (!isManagedKey(key)) return
    if (typeof rawValue === "string") {
      snapshots.push({ key, value: rawValue, source: "manual-json-import", origin: typeof window !== "undefined" ? window.location.origin : "manual" })
      return
    }
    if (rawValue != null) {
      snapshots.push({ key, value: JSON.stringify(rawValue), source: "manual-json-import", origin: typeof window !== "undefined" ? window.location.origin : "manual" })
    }
  })

  return snapshots
}

function formatKb(value: number) {
  return `${Math.round(value / 1024)} KB`
}

export default function ProductionPersistenceCenterPage() {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [snapshots, setSnapshots] = useState<Snapshot[]>([])
  const [workspaceId, setWorkspaceId] = useState("angelcare-main")
  const [status, setStatus] = useState("Ready")
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)

  const totalSize = useMemo(() => snapshots.reduce((sum, item) => sum + Number(item.size || item.value?.length || 0), 0), [snapshots])
  const revenueProspects = useMemo(() => snapshots.find((item) => item.key === "revenue_prospects_v12_mega_store"), [snapshots])

  async function refreshSnapshots() {
    setError("")
    try {
      const response = await fetch("/api/persistence/local-storage", { cache: "no-store" })
      const data = await response.json().catch(() => ({}))
      if (!response.ok || data.ok === false) throw new Error(data.error || `Load failed: ${response.status}`)
      setWorkspaceId(data.workspaceId || "angelcare-main")
      setSnapshots(Array.isArray(data.snapshots) ? data.snapshots : [])
      setStatus("Loaded live persistence snapshots")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load persistence snapshots")
    }
  }

  async function importSnapshots(imported: { key: string; value: string; source: string; origin: string }[]) {
    if (imported.length === 0) throw new Error("No AngelCare managed stores found in this JSON file.")

    // Restore the browser immediately too, so old localStorage-based workspaces can see the data right away.
    imported.forEach((item) => localStorage.setItem(item.key, item.value))

    const response = await fetch("/api/persistence/local-storage", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ snapshots: imported }),
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok || data.ok === false) throw new Error(data.error || `Import failed: ${response.status}`)
    setWorkspaceId(data.workspaceId || "angelcare-main")
    setSnapshots(Array.isArray(data.snapshots) ? data.snapshots : [])
    return data
  }

  async function handleFile(file: File | null | undefined) {
    if (!file) return
    setBusy(true)
    setError("")
    try {
      setStatus("Reading JSON backup…")
      const text = await file.text()
      const payload = JSON.parse(text)
      const imported = normalizeBackupPayload(payload)
      setStatus(`Importing ${imported.length} recovered stores into Supabase…`)
      const data = await importSnapshots(imported)
      setStatus(`Import complete · ${data.received ?? imported.length} stores saved and restored in this browser`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed")
      setStatus("Import failed")
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  async function syncCurrentBrowser() {
    setBusy(true)
    setError("")
    try {
      const current: { key: string; value: string; source: string; origin: string }[] = []
      for (let index = 0; index < localStorage.length; index += 1) {
        const key = localStorage.key(index)
        if (!key || !isManagedKey(key)) continue
        const value = localStorage.getItem(key)
        if (value == null) continue
        current.push({ key, value, source: "manual-current-browser-sync", origin: window.location.origin })
      }
      setStatus(`Syncing ${current.length} local stores from this browser…`)
      const data = await importSnapshots(current)
      setStatus(`Browser sync complete · ${data.received ?? current.length} stores saved`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Browser sync failed")
      setStatus("Browser sync failed")
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    refreshSnapshots()
  }, [])

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-slate-100">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-[32px] border border-cyan-400/20 bg-gradient-to-br from-slate-900 via-slate-950 to-black p-8 shadow-2xl">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.3em] text-cyan-300">AngelCare Production Persistence OS</p>
              <h1 className="mt-3 text-4xl font-black text-white">Global browser-only data recovery and live persistence</h1>
              <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-slate-300">
                Import the recovered JSON backup, save former localStorage-only stores into Supabase, and restore the same data into this browser immediately.
              </p>
            </div>
            <Link href="/" className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-black text-white hover:bg-white/15">
              Back to app
            </Link>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Protected stores</p>
              <p className="mt-2 text-3xl font-black text-white">{snapshots.length}</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Saved payload</p>
              <p className="mt-2 text-3xl font-black text-white">{formatKb(totalSize)}</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Workspace</p>
              <p className="mt-2 text-3xl font-black text-white">{workspaceId}</p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3 rounded-3xl border border-cyan-300/20 bg-cyan-300/5 p-4">
            <input ref={inputRef} type="file" accept=".json,application/json" className="hidden" onChange={(event) => handleFile(event.target.files?.[0])} />
            <button
              type="button"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
              className="rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-950/40 hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Import recovered JSON backup
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={syncCurrentBrowser}
              className="rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-black text-white hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Sync current browser local data
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={refreshSnapshots}
              className="rounded-2xl border border-cyan-300/25 bg-cyan-300/10 px-5 py-3 text-sm font-black text-cyan-100 hover:bg-cyan-300/15 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Refresh status
            </button>
            <p className="text-sm font-bold text-slate-300">{busy ? "Working…" : status}</p>
          </div>
          {error ? <div className="mt-4 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm font-black text-red-100">{error}</div> : null}
          {revenueProspects ? (
            <div className="mt-4 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-sm font-black text-emerald-100">
              Revenue prospects backup is saved: {revenueProspects.key} · {formatKb(Number(revenueProspects.size || revenueProspects.value?.length || 0))}
            </div>
          ) : null}
        </div>

        <div className="overflow-hidden rounded-[28px] border border-white/10 bg-slate-900/80 shadow-2xl">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-6 py-4">
            <h2 className="text-lg font-black text-white">Synced local stores</h2>
            <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Supabase-backed snapshots</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-white/5 text-xs uppercase tracking-[0.16em] text-slate-400">
                <tr>
                  <th className="px-5 py-4">Store key</th>
                  <th className="px-5 py-4">Size</th>
                  <th className="px-5 py-4">Source</th>
                  <th className="px-5 py-4">Last sync</th>
                  <th className="px-5 py-4">Origin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {snapshots.map((item) => (
                  <tr key={item.key} className="text-slate-200">
                    <td className="px-5 py-4 font-black text-white">{item.key}</td>
                    <td className="px-5 py-4">{formatKb(Number(item.size || item.value?.length || 0))}</td>
                    <td className="px-5 py-4">{item.source || "browser"}</td>
                    <td className="px-5 py-4">{item.updatedAt ? new Date(item.updatedAt).toLocaleString() : "—"}</td>
                    <td className="px-5 py-4">{item.origin || "—"}</td>
                  </tr>
                ))}
                {snapshots.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-slate-400">
                      No snapshots yet. Click “Import recovered JSON backup” and select angelcare-revenue-prospects-localstorage-backup.json.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  )
}
