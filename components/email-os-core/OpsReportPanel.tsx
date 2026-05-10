"use client"

import { useEffect, useState } from "react"
import { Download, FileText, RefreshCw } from "lucide-react"

export default function OpsReportPanel() {
  const [manifest, setManifest] = useState<any>(null)
  const [readiness, setReadiness] = useState<any>(null)

  async function load() {
    const [manifestRes, readinessRes] = await Promise.all([
      fetch("/api/email-os/backup-manifest"),
      fetch("/api/email-os/provider-readiness")
    ])

    setManifest(await manifestRes.json())
    setReadiness(await readinessRes.json())
  }

  useEffect(() => {
    load()
  }, [])

  const exports = manifest?.exports || []
  const status = readiness?.data?.status || "checking"

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-950">Operations Reporting</h2>
            <p className="text-sm text-slate-500">Provider readiness: {status}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={load}
          className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold hover:bg-slate-50"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {exports.map((href: string) => (
          <a
            key={href}
            href={href}
            className="inline-flex cursor-pointer items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-bold text-slate-700 hover:bg-slate-100"
          >
            {href.split("/").pop()}
            <Download className="h-4 w-4" />
          </a>
        ))}
      </div>
    </section>
  )
}
