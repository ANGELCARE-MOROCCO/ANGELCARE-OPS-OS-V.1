"use client"

import { useEffect, useState } from "react"
import { CheckCircle2, Rocket, AlertTriangle, RefreshCw } from "lucide-react"

export default function Page() {
  const [data, setData] = useState<any>(null)

  async function load() {
    const res = await fetch("/api/email-os/launch-readiness")
    const json = await res.json()
    setData(json.data || json)
  }

  useEffect(() => { load() }, [])

  const blockers = data?.blockers || []
  const tables = data?.tables || []
  const status = data?.status || "checking"

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="rounded-2xl bg-slate-950 p-3 text-white">
                <Rocket className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-950">Email-OS Launch Operations</h1>
                <p className="mt-1 text-sm text-slate-500">Final launch readiness and rollback-safe validation.</p>
              </div>
            </div>
            <button onClick={load} className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold hover:bg-slate-50">
              <RefreshCw className="h-4 w-4" /> Refresh
            </button>
          </div>

          <div className={`mt-6 rounded-2xl border p-4 ${status === "launch-ready" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-800"}`}>
            <div className="flex items-center gap-2 font-black">
              {status === "launch-ready" ? <CheckCircle2 className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
              {status}
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-black text-slate-950">Blockers</h2>
            <div className="mt-4 space-y-3">
              {blockers.length === 0 ? <div className="rounded-2xl bg-emerald-50 p-4 text-sm font-bold text-emerald-700">No launch blockers detected.</div> : null}
              {blockers.map((item: string) => (
                <div key={item} className="rounded-2xl bg-amber-50 p-4 text-sm font-bold text-amber-700">{item}</div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-black text-slate-950">SQL Tables</h2>
            <div className="mt-4 max-h-[460px] space-y-2 overflow-y-auto">
              {tables.map((item: any) => (
                <div key={item.table} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm">
                  <span className="font-bold text-slate-700">{item.table}</span>
                  <span className={item.ok ? "font-black text-emerald-700" : "font-black text-rose-700"}>{item.ok ? "OK" : "Missing"}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
