"use client"

import * as React from "react"
import { parseCsv } from "@/lib/csv/parser"
import { validateCsvRows } from "@/lib/csv/validators"

export function CsvImportWorkspace() {
  const [rows, setRows] = React.useState<Record<string, string>[]>([])
  const [errors, setErrors] = React.useState<any[]>([])
  const [validated, setValidated] = React.useState(false)

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    const text = await file.text()
    const parsed = parseCsv(text)

    setRows(parsed)
    setValidated(false)
    setErrors([])
  }

  function validate() {
    const result = validateCsvRows(rows)
    setErrors(result.errors)
    setValidated(result.valid)
  }

  return (
    <main data-market-os-root className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto max-w-7xl space-y-6">

        <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-rose-600">
                Market OS / CSV Control
              </p>

              <h1 className="mt-3 text-4xl font-black text-slate-950">
                CSV Import Workspace
              </h1>

              <p className="mt-3 text-sm font-semibold text-slate-600">
                Upload, validate and preview structured CSV operational datasets.
              </p>
            </div>

            <label className="inline-flex cursor-pointer items-center gap-3 rounded-2xl bg-white px-5 py-4 text-sm font-black text-slate-950">
              Upload CSV
              <input
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFile}
              />
            </label>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-3">
          <Metric label="Rows" value={String(rows.length)} />
          <Metric label="Errors" value={String(errors.length)} />
          <Metric label="Validation" value={validated ? "READY" : "PENDING"} />
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black text-slate-950">
                Validation Control
              </h2>
            </div>

            <button
              onClick={validate}
              className="rounded-2xl bg-rose-600 px-5 py-3 text-sm font-black text-slate-950"
            >
              Validate Structure
            </button>
          </div>

          {errors.length > 0 ? (
            <div className="mt-6 rounded-3xl border border-red-200 bg-red-50 p-5">
              {errors.map((error, index) => (
                <div key={index} className="mb-2 text-sm font-bold text-red-700">
                  Row {error.row} / {error.field} — {error.message}
                </div>
              ))}
            </div>
          ) : validated ? (
            <div className="mt-6 rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
              <p className="text-sm font-black text-emerald-700">
                CSV validated successfully.
              </p>
            </div>
          ) : null}
        </section>

        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-6">
            <h2 className="text-2xl font-black text-slate-950">
              Preview Table
            </h2>
          </div>

          <div className="overflow-auto">
            <table className="w-full border-collapse">
              <thead className="bg-slate-100">
                <tr>
                  {rows[0]
                    ? Object.keys(rows[0]).map((header) => (
                        <th
                          key={header}
                          className="p-4 text-left text-xs font-black uppercase tracking-wider text-slate-600"
                        >
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
                      <td
                        key={idx}
                        className="p-4 text-sm font-semibold text-slate-700"
                      >
                        {value}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>

            {rows.length === 0 ? (
              <div className="p-10 text-center text-sm font-bold text-slate-9500">
                Upload a CSV file to preview records.
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  )
}

function Metric({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-wider text-slate-9500">
        {label}
      </p>

      <p className="mt-3 text-3xl font-black text-slate-950">
        {value}
      </p>
    </div>
  )
}

export default CsvImportWorkspace