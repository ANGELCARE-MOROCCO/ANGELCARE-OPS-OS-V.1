"use client"

import * as React from "react"
import Link from "next/link"
import { parseCsv } from "@/lib/csv/parser"
import { validateCsvRows } from "@/lib/csv/validators"
import { injectCsvRowsIntoContentCommandTasks } from "@/lib/csv/content-command-bridge/csv-to-content-task"
import {
  loadStore,
  type ContentTask,
} from "@/components/market-os/content-command/content-command-system"

export function CsvContentCommandTaskInjectionWorkspace() {
  const [rows, setRows] = React.useState<Record<string, string>[]>([])
  const [errors, setErrors] = React.useState<any[]>([])
  const [fileName, setFileName] = React.useState("")
  const [previewTasks, setPreviewTasks] = React.useState<Record<string, string>[]>([])
  const [liveTasks, setLiveTasks] = React.useState<ContentTask[]>([])
  const [result, setResult] = React.useState<any>(null)

  React.useEffect(() => {
    setLiveTasks(loadStore().tasks)
  }, [])

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    const text = await file.text()
    const parsed = parseCsv(text)
    const validation = validateCsvRows(parsed)

    setFileName(file.name)
    setRows(parsed)
    setPreviewTasks(parsed)
    setErrors(validation.errors)
    setResult(null)
  }

  function injectTasks() {
    if (errors.length > 0 || rows.length === 0) return

    const injectionResult = injectCsvRowsIntoContentCommandTasks(rows)
    setResult(injectionResult)
    setLiveTasks(loadStore().tasks)
  }

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="overflow-hidden rounded-[2rem] border border-slate-900 bg-[linear-gradient(135deg,#020617,#111827_55%,#7f1d1d)] p-8 text-white shadow-2xl">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-rose-300">
            Market OS / CSV Phase 6
          </p>

          <h1 className="mt-4 text-5xl font-black">
            Real Content Command Task Injection
          </h1>

          <p className="mt-5 max-w-4xl text-sm font-semibold leading-7 text-slate-300">
            Upload a validated tasks CSV and inject rows directly into the real Content Command task store.
            Imported tasks are persisted through the same localStorage keys and store logic used by your live dashboard.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <label className="inline-flex cursor-pointer items-center gap-3 rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950">
              Upload Tasks CSV
              <input type="file" accept=".csv" className="hidden" onChange={handleFile} />
            </label>

            <button
              onClick={injectTasks}
              disabled={errors.length > 0 || rows.length === 0}
              className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white disabled:opacity-40"
            >
              Inject Into Real Task Store
            </button>

            <Link
              href="/market-os/content-command-center/tasks"
              className="rounded-2xl border border-white/10 bg-white/10 px-5 py-3 text-sm font-black text-white"
            >
              Open Task Board
            </Link>

            <Link
              href="/market-os/content-command-center"
              className="rounded-2xl border border-white/10 bg-white/10 px-5 py-3 text-sm font-black text-white"
            >
              Open Dashboard
            </Link>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-5">
          <Metric label="CSV Rows" value={String(rows.length)} />
          <Metric label="Errors" value={String(errors.length)} />
          <Metric label="Live Store Tasks" value={String(liveTasks.length)} />
          <Metric label="File" value={fileName || "--"} />
          <Metric label="Imported" value={String(result?.imported ?? 0)} />
        </section>

        {errors.length > 0 ? (
          <section className="rounded-[2rem] border border-red-200 bg-red-50 p-6">
            <h2 className="text-2xl font-black text-red-800">Validation Errors</h2>
            <div className="mt-4 space-y-2">
              {errors.map((error, index) => (
                <p key={index} className="text-sm font-bold text-red-700">
                  Row {error.row} / {error.field} — {error.message}
                </p>
              ))}
            </div>
          </section>
        ) : null}

        {result ? (
          <section className="rounded-[2rem] border border-emerald-200 bg-emerald-50 p-6">
            <h2 className="text-2xl font-black text-emerald-800">Injection Complete</h2>
            <p className="mt-2 text-sm font-bold text-emerald-700">
              Imported {result.imported} tasks. Total live Content Command tasks: {result.totalTasks}.
            </p>
          </section>
        ) : null}

        <section className="grid gap-6 lg:grid-cols-2">
          <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-6">
              <h2 className="text-2xl font-black text-slate-950">CSV Preview</h2>
              <p className="mt-2 text-sm font-semibold text-slate-500">
                {fileName || "No file uploaded."}
              </p>
            </div>

            <div className="max-h-[520px] overflow-auto p-5">
              <div className="space-y-3">
                {previewTasks.map((task, index) => (
                  <article key={`${task.id}-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm font-black text-slate-950">{task.title}</p>
                    <p className="mt-2 text-xs font-bold text-slate-500">
                      {task.id} · {task.status} · {task.owner} · {task.priority} · {task.due_date}
                    </p>
                  </article>
                ))}

                {previewTasks.length === 0 ? (
                  <p className="rounded-3xl border border-dashed border-slate-300 p-8 text-center text-sm font-bold text-slate-500">
                    Upload a CSV file to preview tasks.
                  </p>
                ) : null}
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-6">
              <h2 className="text-2xl font-black text-slate-950">Real Content Command Tasks</h2>
              <p className="mt-2 text-sm font-semibold text-slate-500">
                Current tasks loaded from the actual Content Command store.
              </p>
            </div>

            <div className="max-h-[520px] overflow-auto p-5">
              <div className="space-y-3">
                {liveTasks.map((task) => (
                  <article key={task.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-sm font-black text-slate-950">{task.title}</p>
                      <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-black uppercase text-white">
                        {task.status}
                      </span>
                    </div>
                    <p className="mt-2 text-xs font-bold text-slate-500">
                      {task.id} · {task.owner} · {task.priority} · Due: {task.dueDate}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </section>
        </section>

        <section className="rounded-[2rem] border border-amber-200 bg-amber-50 p-6">
          <h2 className="text-xl font-black text-amber-900">
            Operational Note
          </h2>
          <p className="mt-2 text-sm font-bold text-amber-800">
            This phase injects tasks into the same Content Command store used by the dashboard. Refresh the main task board
            after injection to see the imported tasks. The bridge updates existing task IDs instead of duplicating them.
          </p>
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

export default CsvContentCommandTaskInjectionWorkspace