"use client"

import { useEffect, useState } from "react"
import { ClipboardCopy, Database, HardDriveDownload, RefreshCw, ShieldCheck, TriangleAlert } from "lucide-react"

type StorageHealthResponse = {
  bridge?: {
    freeBytes?: number
    usedBytes?: number
    totalBytes?: number
    warning?: boolean
    critical?: boolean
  }
  usage?: {
    totalFiles?: number
    activeFiles?: number
    archivedFiles?: number
    deletedFiles?: number
    usedBytes?: number
    lastUpload?: any
    lastDownload?: any
    lastError?: any
    quota?: {
      quota_bytes?: number
      warning_threshold_bytes?: number
      critical_threshold_bytes?: number
      status?: string
    } | null
  }
  mailboxId?: string | null
}

function api(path: string) {
  return fetch(path, { cache: "no-store" }).then(async (response) => {
    const json = await response.json().catch(() => null)
    return { ok: response.ok && json?.ok !== false, data: json?.data ?? json, error: json?.error || (!response.ok ? `HTTP ${response.status}` : null) }
  })
}

function formatBytes(bytes?: number) {
  const value = Number(bytes || 0)
  if (!Number.isFinite(value) || value <= 0) return "0 B"
  const units = ["B", "KB", "MB", "GB", "TB"]
  let current = value
  let index = 0
  while (current >= 1024 && index < units.length - 1) {
    current /= 1024
    index += 1
  }
  return `${current.toFixed(index === 0 ? 0 : 1)} ${units[index]}`
}

function statusTone(status?: string) {
  const value = String(status || "").toLowerCase()
  if (value === "critical" || value === "failed" || value === "error") return "border-rose-200 bg-rose-50 text-rose-700"
  if (value === "warning" || value === "degraded") return "border-amber-200 bg-amber-50 text-amber-700"
  return "border-emerald-200 bg-emerald-50 text-emerald-700"
}

export default function StorageHealthPanel() {
  const [data, setData] = useState<StorageHealthResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  async function load() {
    setLoading(true)
    const result = await api("/api/storage/health")
    setLoading(false)
    if (result.ok) {
      setData(result.data || null)
      setMessage("")
    } else {
      setMessage(result.error || "Unable to load storage health")
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const bridge = data?.bridge || {}
  const usage = data?.usage || {}
  const quota = usage?.quota || null
  const usedBytes = Number(bridge.usedBytes || usage.usedBytes || 0)
  const totalBytes = Number(bridge.totalBytes || quota?.quota_bytes || 0)
  const freeBytes = Number(bridge.freeBytes || 0)
  const percentUsed = totalBytes > 0 ? Math.min(100, Math.round((usedBytes / totalBytes) * 100)) : 0
  const status = bridge.critical ? "critical" : bridge.warning ? "warning" : "operational"

  const restartProtocol = [
    "nssm restart angelcare-email-bridge",
    "nssm status angelcare-email-bridge",
    "curl.exe -s https://angelcare-mailbridge.duckdns.org/health"
  ].join("\n")

  async function copyProtocol() {
    await navigator.clipboard.writeText(restartProtocol)
    setMessage("Restart protocol copied")
  }

  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-sky-700">
            <HardDriveDownload className="h-3.5 w-3.5" />
            Storage health
          </div>
          <h3 className="mt-3 text-lg font-black text-slate-950">Windows storage gateway</h3>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">Email-OS attachments live on the Windows bridge. Supabase only keeps metadata.</p>
        </div>
        <button type="button" onClick={() => void load()} className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-black text-slate-700 hover:bg-slate-50">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <div className={`mt-5 rounded-2xl border px-4 py-3 text-sm font-black ${statusTone(status)}`}>
        {status === "critical" ? "Critical free-disk threshold reached." : status === "warning" ? "Warning free-disk threshold reached." : "Storage gateway healthy."}
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Metric label="Total quota" value={quota?.quota_bytes ? formatBytes(quota.quota_bytes) : "Not set"} />
        <Metric label="Used" value={formatBytes(usedBytes)} sub={`${percentUsed}% of total`} />
        <Metric label="Free disk" value={formatBytes(freeBytes)} sub={bridge.critical ? "critical < 25 GB" : bridge.warning ? "warning < 40 GB" : "healthy"} />
        <Metric label="Files" value={String(usage?.totalFiles || 0)} sub={`${String(usage?.activeFiles || 0)} active`} />
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <EventCard title="Last upload" value={usage?.lastUpload?.timestamp || "—"} detail={usage?.lastUpload?.message || usage?.lastUpload?.action || "No recent upload"} />
        <EventCard title="Last download" value={usage?.lastDownload?.timestamp || "—"} detail={usage?.lastDownload?.message || usage?.lastDownload?.action || "No recent download"} />
        <EventCard title="Last error" value={usage?.lastError?.timestamp || "—"} detail={usage?.lastError?.message || usage?.lastError?.action || "No recent storage error"} />
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center gap-2 text-sm font-black text-slate-900">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            Restart protocol
          </div>
          <pre className="mt-3 whitespace-pre-wrap rounded-2xl bg-slate-950 p-4 text-xs leading-6 text-slate-100">{restartProtocol}</pre>
          <button type="button" onClick={() => void copyProtocol()} className="mt-3 inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-black text-slate-700 hover:bg-slate-50">
            <ClipboardCopy className="h-4 w-4" />
            Copy protocol
          </button>
        </div>

        <div className="rounded-2xl border border-amber-100 bg-amber-50/60 p-4">
          <div className="flex items-center gap-2 text-sm font-black text-amber-800">
            <TriangleAlert className="h-4 w-4" />
            Backup reminder
          </div>
          <p className="mt-3 text-sm leading-6 text-amber-900">
            Keep the Windows storage root backed up before large compose or inbox sync changes. If disk warnings appear, archive older files before the next attachment batch.
          </p>
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-bold text-slate-700">
            <Database className="h-4 w-4 text-slate-500" />
            Email-OS metadata remains in Supabase only.
          </div>
        </div>
      </div>

      {message ? <div className="mt-4 text-sm font-semibold text-slate-500">{message}</div> : null}
    </section>
  )
}

function Metric({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">{label}</div>
      <div className="mt-2 text-xl font-black text-slate-950">{value}</div>
      {sub ? <div className="mt-1 text-xs font-bold text-slate-500">{sub}</div> : null}
    </div>
  )
}

function EventCard({ title, value, detail }: { title: string; value: string; detail: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">{title}</div>
      <div className="mt-2 text-sm font-black text-slate-900">{value}</div>
      <div className="mt-1 text-xs font-semibold leading-5 text-slate-500">{detail}</div>
    </div>
  )
}
