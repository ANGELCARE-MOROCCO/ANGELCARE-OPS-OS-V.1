"use client"

import * as React from "react"
import { parseCsv } from "@/lib/csv/parser"
import { csvDatasetRegistry } from "@/lib/csv/dataset-registry"
import { validateAgainstDatasetSchema } from "@/lib/csv/schema-validator"

export function CsvEnterpriseImportOperationsWorkspace() {
  const [datasetId, setDatasetId] = React.useState("content")
  const [rows, setRows] = React.useState<Record<string, string>[]>([])
  const [fileName, setFileName] = React.useState("")
  const [issues, setIssues] = React.useState<any[]>([])
  const [approved, setApproved] = React.useState(false)

  const schema = csvDatasetRegistry.find((dataset) => dataset.id === datasetId) ?? csvDatasetRegistry[0]
  const errors = issues.filter((issue) => issue.severity === "error")
  const warnings = issues.filter((issue) => issue.severity === "warning")

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    const text = await file.text()
    const parsed = parseCsv(text)

    setFileName(file.name)
    setRows(parsed)
    setIssues(validateAgainstDatasetSchema(datasetId, parsed))
    setApproved(false)
  }

  function revalidate() {
    setIssues(validateAgainstDatasetSchema(datasetId, rows))
    setApproved(false)
  }

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.25em] text-rose-600">
            Market OS / CSV Control / Phase 4
          </p>
          <h1 className="mt-3 text-4xl font-black text-slate-950">
            Enterprise Import Operations
          </h1>
          <p className="mt-3 max-w-4xl text-sm font-semibold leading-6 text-slate-600">
            Dataset schema registry, import review board, approval gate,
            CSV templates, column requirements, warnings, errors, and rollback readiness.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <select
              value={datasetId}
              onChange={(event) => {
                setDatasetId(event.target.value)
                setApproved(false)
              }}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-800"
            >
              {csvDatasetRegistry.map((dataset) => (
                <option key={dataset.id} value={dataset.id}>
                  {dataset.label}
                </option>
              ))}
            </select>

            <label className="inline-flex cursor-pointer items-center gap-3 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white">
              Upload CSV
              <input type="file" accept=".csv" className="hidden" onChange={handleFile} />
            </label>

            <button
              onClick={revalidate}
              className="rounded-2xl bg-rose-600 px-5 py-3 text-sm font-black text-white"
            >
              Validate Against Schema
            </button>

            <a
              href={`/csv-templates/${datasetId}.csv`}
              className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-800"
            >
              Download Template
            </a>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-5">
          <Metric label="Dataset" value={schema.label} />
          <Metric label="Rows" value={String(rows.length)} />
          <Metric label="Errors" value={String(errors.length)} />
          <Metric label="Warnings" value={String(warnings.length)} />
          <Metric label="Approved" value={approved ? "YES" : "NO"} />
        </section>

        <section className="grid gap-6 lg:grid-cols-[.8fr_1.2fr]">
          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-black text-slate-950">Dataset Schema</h2>
            <p className="mt-2 text-sm font-semibold text-slate-600">{schema.description}</p>
            <p className="mt-2 text-xs font-black uppercase tracking-wider text-rose-600">
              Target table: {schema.targetTable}
            </p>

            <div className="mt-5 space-y-3">
              {schema.columns.map((column) => (
                <article key={column.key} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-black text-slate-950">{column.key}</p>
                    <span className={`rounded-full px-3 py-1 text-xs font-black ${column.required ? "bg-rose-100 text-rose-700" : "bg-slate-200 text-slate-700"}`}>
                      {column.required ? "required" : "optional"}
                    </span>
                  </div>
                  <p className="mt-2 text-xs font-semibold text-slate-500">{column.description}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-black text-slate-950">Import Review Board</h2>
            <p className="mt-2 text-sm font-semibold text-slate-600">
              The file must have zero critical errors before approval.
            </p>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="rounded-3xl border border-red-200 bg-red-50 p-5">
                <h3 className="text-lg font-black text-red-800">Errors</h3>
                <div className="mt-3 space-y-2">
                  {errors.map((issue, index) => (
                    <p key={index} className="text-sm font-bold text-red-700">
                      {issue.field}: {issue.message}
                    </p>
                  ))}
                  {errors.length === 0 ? <p className="text-sm font-bold text-red-700">No critical errors.</p> : null}
                </div>
              </div>

              <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5">
                <h3 className="text-lg font-black text-amber-800">Warnings</h3>
                <div className="mt-3 space-y-2">
                  {warnings.map((issue, index) => (
                    <p key={index} className="text-sm font-bold text-amber-700">
                      {issue.field}: {issue.message}
                    </p>
                  ))}
                  {warnings.length === 0 ? <p className="text-sm font-bold text-amber-700">No warnings.</p> : null}
                </div>
              </div>
            </div>

            <button
              onClick={() => setApproved(true)}
              disabled={rows.length === 0 || errors.length > 0}
              className="mt-6 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white disabled:opacity-40"
            >
              Approve Import for Phase 5 Sync
            </button>
          </section>
        </section>

        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-6">
            <h2 className="text-2xl font-black text-slate-950">CSV Preview</h2>
            <p className="mt-2 text-sm font-semibold text-slate-500">{fileName || "No file uploaded."}</p>
          </div>

          <div className="overflow-auto">
            <table className="w-full border-collapse">
              <thead className="bg-slate-100">
                <tr>
                  {rows[0] ? Object.keys(rows[0]).map((header) => (
                    <th key={header} className="p-4 text-left text-xs font-black uppercase tracking-wider text-slate-600">
                      {header}
                    </th>
                  )) : null}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={index} className="border-t border-slate-100">
                    {Object.values(row).map((value, idx) => (
                      <td key={idx} className="p-4 text-sm font-semibold text-slate-700">{value}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>

            {rows.length === 0 ? (
              <div className="p-10 text-center text-sm font-bold text-slate-500">
                Upload a CSV file to begin review.
              </div>
            ) : null}
          </div>
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

export default CsvEnterpriseImportOperationsWorkspace