"use client"

import * as React from "react"
import { parseCsv } from "@/lib/csv/parser"
import { validateCsvRows } from "@/lib/csv/validators"
import type { CsvDatasetType, CsvSyncMode } from "@/lib/csv/sync-types"

const datasetTypes: CsvDatasetType[] = [
  "content",
  "tasks",
  "partnerships",
  "leads",
  "recruitment",
  "academy",
  "ambassadors",
  "analytics",
  "media",
  "market_intel",
]

const syncModes: CsvSyncMode[] = ["dry_run", "create_only", "upsert", "update_only"]

export function CsvPhase3ServerSyncWorkspace() {
  const [rows, setRows] = React.useState<Record<string, string>[]>([])
  const [fileName, setFileName] = React.useState("")
  const [datasetType, setDatasetType] = React.useState<CsvDatasetType>("content")
  const [syncMode, setSyncMode] = React.useState<CsvSyncMode>("dry_run")
  const [errors, setErrors] = React.useState<any[]>([])
  const [result, setResult] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(false)

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    const text = await file.text()
    const parsed = parseCsv(text)
    const validation = validateCsvRows(parsed)

    setFileName(file.name)
    setRows(parsed)
    setErrors(validation.errors)
    setResult(null)
  }

  async function runServerSync() {
    setLoading(true)
    setResult(null)

    try {
      const response = await fetch("/api/market-os/imports/csv/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          datasetType,
          fileName,
          syncMode,
          rows,
        }),
      })

      const json = await response.json()
      setResult(json)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.25em] text-rose-600">
            Market OS / CSV Control / Phase 3
          </p>

          <h1 className="mt-3 text-4xl font-black text-slate-950">
            Server-side CSV Sync + Audit + Rollback
          </h1>

          <p className="mt-3 max-w-4xl text-sm font-semibold leading-6 text-slate-600">
            Controlled server-side CSV synchronization with Supabase templates, audit logging,
            import jobs, rollback snapshots and protected sync modes.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <select
              value={datasetType}
              onChange={(event) => setDatasetType(event.target.value as CsvDatasetType)}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-800"
            >
              {datasetTypes.map((type) => <option key={type} value={type}>{type}</option>)}
            </select>

            <select
              value={syncMode}
              onChange={(event) => setSyncMode(event.target.value as CsvSyncMode)}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-800"
            >
              {syncModes.map((mode) => <option key={mode} value={mode}>{mode}</option>)}
            </select>

            <label className="inline-flex cursor-pointer items-center gap-3 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white">
              Upload CSV
              <input type="file" accept=".csv" className="hidden" onChange={handleFile} />
            </label>

            <button
              onClick={runServerSync}
              disabled={loading || rows.length === 0}
              className="rounded-2xl bg-rose-600 px-5 py-3 text-sm font-black text-white disabled:opacity-50"
            >
              {loading ? "Running..." : "Run Server Sync"}
            </button>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-5">
          <Metric label="Dataset" value={datasetType} />
          <Metric label="Mode" value={syncMode} />
          <Metric label="Rows" value={String(rows.length)} />
          <Metric label="Errors" value={String(errors.length)} />
          <Metric label="File" value={fileName || "--"} />
        </section>

        {syncMode !== "dry_run" ? (
          <section className="rounded-[2rem] border border-amber-200 bg-amber-50 p-6">
            <h2 className="text-xl font-black text-amber-900">Production Safety Warning</h2>
            <p className="mt-2 text-sm font-bold text-amber-800">
              Non-dry-run modes can mutate database tables. Confirm Supabase schema, table mapping,
              RLS, backup, and rollback strategy before using create_only or upsert.
            </p>
          </section>
        ) : null}

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black text-slate-950">Sync Result</h2>
          <pre className="mt-4 max-h-[420px] overflow-auto rounded-3xl bg-slate-950 p-5 text-xs font-bold text-emerald-200">
            {result ? JSON.stringify(result, null, 2) : "No server sync executed yet."}
          </pre>
        </section>
      </div>
    </main>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-3 truncate text-2xl font-black text-slate-950">{value}</p>
    </div>
  )
}

export default CsvPhase3ServerSyncWorkspace