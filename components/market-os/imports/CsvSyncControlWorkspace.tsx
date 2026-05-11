"use client"

import * as React from "react"
import { parseCsv } from "@/lib/csv/parser"
import { validateCsvRows } from "@/lib/csv/validators"
import { createCsvSyncPlan, createImportJob } from "@/lib/csv/sync-engine"
import type { CsvDatasetType, CsvImportJob, CsvSyncPlan } from "@/lib/csv/sync-types"

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

export function CsvSyncControlWorkspace() {
  const [rows, setRows] = React.useState<Record<string, string>[]>([])
  const [fileName, setFileName] = React.useState("")
  const [datasetType, setDatasetType] = React.useState<CsvDatasetType>("content")
  const [errors, setErrors] = React.useState<any[]>([])
  const [job, setJob] = React.useState<CsvImportJob | null>(null)
  const [plan, setPlan] = React.useState<CsvSyncPlan | null>(null)
  const [history, setHistory] = React.useState<CsvImportJob[]>([])

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    const text = await file.text()
    const parsed = parseCsv(text)
    const validation = validateCsvRows(parsed)
    const nextJob = createImportJob({
      datasetType,
      fileName: file.name,
      rowCount: parsed.length,
      errorCount: validation.errors.length,
    })

    setFileName(file.name)
    setRows(parsed)
    setErrors(validation.errors)
    setJob(nextJob)
    setPlan(null)
    setHistory((current) => [nextJob, ...current].slice(0, 10))
  }

  function runDryPlan() {
    const validation = validateCsvRows(rows)
    setErrors(validation.errors)

    if (validation.errors.length > 0) {
      setPlan(null)
      return
    }

    setPlan(createCsvSyncPlan(rows))
  }

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.25em] text-rose-600">
            Market OS / CSV Control / Phase 2
          </p>
          <h1 className="mt-3 text-4xl font-black text-slate-950">
            CSV Sync Control Center
          </h1>
          <p className="mt-3 max-w-4xl text-sm font-semibold leading-6 text-slate-600">
            Prepare CSV datasets for controlled Supabase synchronization with dataset typing,
            dry-run planning, conflict detection, import jobs, audit-ready history, and rollback preparation.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <select
              value={datasetType}
              onChange={(event) => setDatasetType(event.target.value as CsvDatasetType)}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-800"
            >
              {datasetTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>

            <label className="inline-flex cursor-pointer items-center gap-3 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white">
              Upload CSV
              <input type="file" accept=".csv" className="hidden" onChange={handleFile} />
            </label>

            <button
              onClick={runDryPlan}
              className="rounded-2xl bg-rose-600 px-5 py-3 text-sm font-black text-white"
            >
              Run Dry Sync Plan
            </button>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-5">
          <Metric label="Dataset" value={datasetType} />
          <Metric label="Rows" value={String(rows.length)} />
          <Metric label="Errors" value={String(errors.length)} />
          <Metric label="Job" value={job?.status ?? "none"} />
          <Metric label="File" value={fileName || "--"} />
        </section>

        {plan ? (
          <section className="grid gap-5 lg:grid-cols-4">
            <Metric label="Creates" value={String(plan.creates)} />
            <Metric label="Updates" value={String(plan.updates)} />
            <Metric label="Skipped" value={String(plan.skipped)} />
            <Metric label="Conflicts" value={String(plan.conflicts)} />
          </section>
        ) : null}

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black text-slate-950">Dry-run Sync Plan</h2>
          <p className="mt-2 text-sm font-semibold text-slate-600">
            This phase does not push to Supabase. It prepares a safe import plan first.
          </p>

          {errors.length > 0 ? (
            <div className="mt-5 rounded-3xl border border-red-200 bg-red-50 p-5">
              {errors.map((error, index) => (
                <p key={index} className="text-sm font-bold text-red-700">
                  Row {error.row} / {error.field} — {error.message}
                </p>
              ))}
            </div>
          ) : plan ? (
            <div className="mt-5 rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
              <p className="text-sm font-black text-emerald-700">
                Dry-run plan ready. Phase 3 can activate server-side Supabase sync.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {plan.warnings.map((warning) => (
                  <span key={warning} className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-700">
                    {warning}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-5 rounded-3xl border border-dashed border-slate-300 p-6 text-sm font-bold text-slate-500">
              Upload a valid CSV, then run dry sync plan.
            </div>
          )}
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
          <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-6">
              <h2 className="text-2xl font-black text-slate-950">Preview</h2>
            </div>
            <div className="overflow-auto">
              <table className="w-full border-collapse">
                <thead className="bg-slate-100">
                  <tr>
                    {rows[0]
                      ? Object.keys(rows[0]).map((header) => (
                          <th key={header} className="p-4 text-left text-xs font-black uppercase tracking-wider text-slate-600">
                            {header}
                          </th>
                        ))
                      : null}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => (
                    <tr key={index} className="border-t border-slate-100">
                      {Object.values(row).map((value, idx) => (
                        <td key={idx} className="p-4 text-sm font-semibold text-slate-700">
                          {value}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {rows.length === 0 ? <div className="p-10 text-center text-sm font-bold text-slate-500">No CSV loaded.</div> : null}
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-black text-slate-950">Import History</h2>
            <div className="mt-5 space-y-3">
              {history.map((entry) => (
                <article key={entry.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-black text-slate-950">{entry.fileName}</p>
                  <p className="mt-1 text-xs font-bold text-slate-500">
                    {entry.datasetType} · {entry.rowCount} rows · {entry.status}
                  </p>
                </article>
              ))}
              {history.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-slate-300 p-5 text-sm font-bold text-slate-500">
                  No import jobs yet.
                </p>
              ) : null}
            </div>
          </section>
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

export default CsvSyncControlWorkspace