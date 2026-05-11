"use client"

import * as React from "react"
import { parseCsv } from "@/lib/csv/parser"
import { validateCsvRows } from "@/lib/csv/validators"
import { convertCsvRowsToLiveTasks, type LiveTask } from "@/lib/csv/live-bridge/task-adapter"
import {
  clearLiveTasksFromLocalStore,
  loadLiveTasksFromLocalStore,
  saveLiveTasksToLocalStore,
} from "@/lib/csv/live-bridge/local-live-store"

export function CsvLiveOperationsBridgeWorkspace() {
  const [rows, setRows] = React.useState<Record<string, string>[]>([])
  const [errors, setErrors] = React.useState<any[]>([])
  const [convertedTasks, setConvertedTasks] = React.useState<LiveTask[]>([])
  const [liveTasks, setLiveTasks] = React.useState<LiveTask[]>([])
  const [fileName, setFileName] = React.useState("")
  const [approved, setApproved] = React.useState(false)

  React.useEffect(() => {
    setLiveTasks(loadLiveTasksFromLocalStore())
  }, [])

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    const text = await file.text()
    const parsed = parseCsv(text)
    const validation = validateCsvRows(parsed)

    setFileName(file.name)
    setRows(parsed)
    setErrors(validation.errors)
    setConvertedTasks(validation.errors.length ? [] : convertCsvRowsToLiveTasks(parsed))
    setApproved(false)
  }

  function approveBridge() {
    if (errors.length > 0 || convertedTasks.length === 0) return

    saveLiveTasksToLocalStore(convertedTasks)
    setLiveTasks(loadLiveTasksFromLocalStore())
    setApproved(true)
  }

  function clearBridge() {
    clearLiveTasksFromLocalStore()
    setLiveTasks([])
    setApproved(false)
  }

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="overflow-hidden rounded-[2rem] border border-slate-900 bg-[linear-gradient(135deg,#020617,#111827_55%,#312e81)] p-8 text-white shadow-2xl">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-rose-300">
            Market OS / CSV Phase 5
          </p>

          <h1 className="mt-4 text-5xl font-black">
            CSV → Live Operations Bridge
          </h1>

          <p className="mt-5 max-w-4xl text-sm font-semibold leading-7 text-slate-300">
            Convert validated CSV task rows into live operational task objects.
            This bridge stores the imported tasks locally first so you can verify
            the mapping before connecting it deeper to Supabase, realtime and the main task board.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <label className="inline-flex cursor-pointer items-center gap-3 rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950">
              Upload Tasks CSV
              <input type="file" accept=".csv" className="hidden" onChange={handleFile} />
            </label>

            <button
              onClick={approveBridge}
              disabled={errors.length > 0 || convertedTasks.length === 0}
              className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white disabled:opacity-40"
            >
              Approve Live Bridge Import
            </button>

            <button
              onClick={clearBridge}
              className="rounded-2xl border border-white/10 bg-white/10 px-5 py-3 text-sm font-black text-white"
            >
              Clear Local Bridge
            </button>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-5">
          <Metric label="CSV Rows" value={String(rows.length)} />
          <Metric label="Errors" value={String(errors.length)} />
          <Metric label="Converted" value={String(convertedTasks.length)} />
          <Metric label="Live Local Tasks" value={String(liveTasks.length)} />
          <Metric label="Approved" value={approved ? "YES" : "NO"} />
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

        <section className="grid gap-6 lg:grid-cols-2">
          <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-6">
              <h2 className="text-2xl font-black text-slate-950">Converted Task Objects</h2>
              <p className="mt-2 text-sm font-semibold text-slate-500">
                {fileName || "Upload a CSV file to convert tasks."}
              </p>
            </div>

            <div className="max-h-[520px] overflow-auto p-5">
              <div className="space-y-3">
                {convertedTasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}

                {convertedTasks.length === 0 ? (
                  <p className="rounded-3xl border border-dashed border-slate-300 p-8 text-center text-sm font-bold text-slate-500">
                    No converted tasks yet.
                  </p>
                ) : null}
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-6">
              <h2 className="text-2xl font-black text-slate-950">Live Local Bridge Store</h2>
              <p className="mt-2 text-sm font-semibold text-slate-500">
                These are the tasks currently saved in the local bridge layer.
              </p>
            </div>

            <div className="max-h-[520px] overflow-auto p-5">
              <div className="space-y-3">
                {liveTasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}

                {liveTasks.length === 0 ? (
                  <p className="rounded-3xl border border-dashed border-slate-300 p-8 text-center text-sm font-bold text-slate-500">
                    No live local bridge tasks yet.
                  </p>
                ) : null}
              </div>
            </div>
          </section>
        </section>

        <section className="rounded-[2rem] border border-amber-200 bg-amber-50 p-6">
          <h2 className="text-xl font-black text-amber-900">
            Important Production Note
          </h2>
          <p className="mt-2 text-sm font-bold text-amber-800">
            Phase 5 intentionally writes to a local bridge store first. It does not blindly inject rows into the existing
            Content Command task board yet. This protects the app while validating the adapter. The next step is to connect
            this bridge to the exact task store or Supabase table used by your production task module.
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

function TaskCard({ task }: { task: LiveTask }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-black text-slate-950">{task.title}</p>
        <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-black uppercase text-white">
          {task.status}
        </span>
      </div>

      <div className="mt-3 grid gap-2 text-xs font-bold text-slate-600 md:grid-cols-2">
        <p>ID: {task.id}</p>
        <p>Owner: {task.owner}</p>
        <p>Priority: {task.priority}</p>
        <p>Due: {task.dueDate ?? "--"}</p>
        <p>Department: {task.department ?? "--"}</p>
        <p>Next: {task.nextAction ?? "--"}</p>
      </div>
    </article>
  )
}

export default CsvLiveOperationsBridgeWorkspace