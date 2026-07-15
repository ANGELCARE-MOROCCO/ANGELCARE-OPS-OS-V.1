"use client"

import { useEffect, useMemo, useState } from "react"
import { Activity, AlertTriangle, CheckCircle2, Clock3, Database, Mail, RefreshCw, Search, Server, ShieldCheck, Wifi, XCircle } from "lucide-react"

async function api(path: string, options?: RequestInit) {
  const res = await fetch(path, { ...options, headers: { "Content-Type": "application/json", ...(options?.headers || {}) } })
  const json = await res.json().catch(() => null)
  return { ok: res.ok && json?.ok !== false, data: json?.data ?? json, error: json?.error || (!res.ok ? `HTTP ${res.status}` : null) }
}

function healthClass(health: string) {
  if (health === "live") return "bg-emerald-100 text-emerald-700 border-emerald-200"
  if (health === "partial") return "bg-amber-100 text-amber-700 border-amber-200"
  return "bg-rose-100 text-rose-700 border-rose-200"
}
function healthIcon(health: string) {
  if (health === "live") return <CheckCircle2 className="h-4 w-4" />
  if (health === "partial") return <AlertTriangle className="h-4 w-4" />
  return <XCircle className="h-4 w-4" />
}

export default function CEOMailboxLivenessMonitor() {
  const [loading, setLoading] = useState(false)
  const [probing, setProbing] = useState<string | null>(null)
  const [summary, setSummary] = useState<any>(null)
  const [mailboxes, setMailboxes] = useState<any[]>([])
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [probeResult, setProbeResult] = useState<any>(null)

  const selected = mailboxes.find((item) => item.key === selectedKey) || mailboxes[0] || null
  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    if (!q) return mailboxes
    return mailboxes.filter((item) => [item.label, item.email, item.key, item.health].join(" ").toLowerCase().includes(q))
  }, [mailboxes, query])

  async function load() {
    setLoading(true); setError(null)
    const result = await api("/api/email-os/mailbox-liveness")
    setLoading(false)
    if (!result.ok) { setError(result.error || "Unable to load mailbox liveness"); return }
    setSummary(result.data?.summary || null)
    setMailboxes(result.data?.mailboxes || [])
    setSelectedKey((current) => current || result.data?.mailboxes?.[0]?.key || null)
  }

  async function probe(key: string) {
    setProbing(key); setProbeResult(null)
    const result = await api("/api/email-os/mailbox-liveness/probe", { method: "POST", body: JSON.stringify({ key }) })
    setProbing(null)
    if (!result.ok) { setProbeResult({ ok: false, error: result.error }); return }
    setProbeResult(result.data)
    await load()
  }

  useEffect(() => { load() }, [])

  return (
    <div className="min-h-screen bg-[#f7f8ff] p-6 text-slate-950">
      <div className="mx-auto max-w-[1500px] space-y-6">
        <header className="rounded-[32px] border border-violet-100 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-violet-700"><ShieldCheck className="h-4 w-4" />CEO only</div>
              <h1 className="mt-3 text-3xl font-black tracking-tight">Email-OS Mailbox Liveness Command</h1>
              <p className="mt-2 max-w-3xl text-sm font-semibold text-slate-500">Monitor production health for every AngelCare mailbox: SMTP, IMAP, credentials, counters, and live probes.</p>
            </div>
            <button type="button" onClick={load} disabled={loading} className="inline-flex h-12 items-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-black text-white disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />Refresh live state</button>
          </div>
          {summary ? <div className="mt-6 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4"><div className="text-xs font-black uppercase text-slate-500">Total</div><div className="mt-2 text-3xl font-black">{summary.total}</div></div>
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4"><div className="text-xs font-black uppercase text-emerald-700">Live</div><div className="mt-2 text-3xl font-black text-emerald-700">{summary.live}</div></div>
            <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4"><div className="text-xs font-black uppercase text-amber-700">Partial</div><div className="mt-2 text-3xl font-black text-amber-700">{summary.partial}</div></div>
            <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4"><div className="text-xs font-black uppercase text-rose-700">Risk</div><div className="mt-2 text-3xl font-black text-rose-700">{summary.risk}</div></div>
          </div> : null}
        </header>

        {error ? <div className="rounded-3xl border border-rose-100 bg-rose-50 p-5 text-sm font-black text-rose-700">{error}</div> : null}

        <div className="grid gap-6 lg:grid-cols-[420px_minmax(0,1fr)]">
          <section className="rounded-[32px] border border-violet-100 bg-white p-5 shadow-sm">
            <div className="mb-4 flex h-11 items-center rounded-2xl border border-slate-100 bg-slate-50 px-3"><Search className="h-4 w-4 text-slate-400" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search mailbox..." className="h-full flex-1 bg-transparent px-3 text-sm font-semibold outline-none" /></div>
            <div className="max-h-[690px] space-y-3 overflow-y-auto pr-1">
              {filtered.map((mailbox) => <button key={mailbox.key} type="button" onClick={() => setSelectedKey(mailbox.key)} className={`w-full rounded-2xl border p-4 text-left transition ${selected?.key === mailbox.key ? "border-violet-200 bg-violet-50" : "border-slate-100 bg-white hover:bg-slate-50"}`}>
                <div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="truncate text-sm font-black">{mailbox.label}</div><div className="mt-1 truncate text-xs font-semibold text-slate-500">{mailbox.email}</div></div><span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-black uppercase ${healthClass(mailbox.health)}`}>{healthIcon(mailbox.health)}{mailbox.health}</span></div>
                <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-bold"><div className={`rounded-xl p-2 ${mailbox.smtp.reachable ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>SMTP {mailbox.smtp.reachable ? "OK" : "Risk"} · {mailbox.smtp.latencyMs}ms</div><div className={`rounded-xl p-2 ${mailbox.imap.reachable ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>IMAP {mailbox.imap.reachable ? "OK" : "Risk"} · {mailbox.imap.latencyMs}ms</div></div>
              </button>)}
            </div>
          </section>

          <section className="space-y-6">
            {selected ? <>
              <div className="rounded-[32px] border border-violet-100 bg-white p-6 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4"><div><div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-black uppercase ${healthClass(selected.health)}`}>{healthIcon(selected.health)}{selected.health}</div><h2 className="mt-3 text-3xl font-black">{selected.label}</h2><p className="mt-1 text-sm font-semibold text-slate-500">{selected.email}</p></div><button type="button" onClick={() => probe(selected.key)} disabled={probing === selected.key} className="inline-flex h-12 items-center gap-2 rounded-2xl bg-violet-600 px-5 text-sm font-black text-white disabled:opacity-50"><Activity className={`h-4 w-4 ${probing === selected.key ? "animate-pulse" : ""}`} />Run deep probe</button></div>
                <div className="mt-6 grid gap-4 xl:grid-cols-2">
                  <div className="rounded-3xl border border-slate-100 bg-slate-50 p-5"><div className="flex items-center gap-2 text-sm font-black"><Server className="h-4 w-4 text-violet-600" />SMTP Outgoing</div><div className="mt-4 space-y-2 text-sm font-semibold text-slate-600"><div>Host: <b>{selected.smtp.host}</b></div><div>Port: <b>{selected.smtp.port}</b> · Secure: <b>{String(selected.smtp.secure)}</b></div><div>User: <b>{selected.smtp.user}</b></div><div>Password configured: <b>{selected.smtp.passwordConfigured ? "yes" : "no"}</b></div><div>Reachable: <b>{selected.smtp.reachable ? "yes" : "no"}</b> · {selected.smtp.latencyMs}ms</div>{selected.smtp.error ? <div className="rounded-xl bg-rose-50 p-3 text-rose-700">{selected.smtp.error}</div> : null}</div></div>
                  <div className="rounded-3xl border border-slate-100 bg-slate-50 p-5"><div className="flex items-center gap-2 text-sm font-black"><Wifi className="h-4 w-4 text-violet-600" />IMAP Incoming</div><div className="mt-4 space-y-2 text-sm font-semibold text-slate-600"><div>Host: <b>{selected.imap.host}</b></div><div>Port: <b>{selected.imap.port}</b> · Secure: <b>{String(selected.imap.secure)}</b></div><div>User: <b>{selected.imap.user}</b></div><div>Password configured: <b>{selected.imap.passwordConfigured ? "yes" : "no"}</b></div><div>Reachable: <b>{selected.imap.reachable ? "yes" : "no"}</b> · {selected.imap.latencyMs}ms</div>{selected.imap.error ? <div className="rounded-xl bg-rose-50 p-3 text-rose-700">{selected.imap.error}</div> : null}</div></div>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-4"><div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm"><Mail className="h-5 w-5 text-violet-600" /><div className="mt-4 text-xs font-black uppercase text-slate-500">Inbox</div><div className="mt-2 text-3xl font-black">{selected.production.inboxCount}</div></div><div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm"><Database className="h-5 w-5 text-violet-600" /><div className="mt-4 text-xs font-black uppercase text-slate-500">Outbox</div><div className="mt-2 text-3xl font-black">{selected.production.outboxCount}</div></div><div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm"><CheckCircle2 className="h-5 w-5 text-emerald-600" /><div className="mt-4 text-xs font-black uppercase text-slate-500">Sent</div><div className="mt-2 text-3xl font-black">{selected.production.sentCount}</div></div><div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm"><AlertTriangle className="h-5 w-5 text-rose-600" /><div className="mt-4 text-xs font-black uppercase text-slate-500">Failed</div><div className="mt-2 text-3xl font-black">{selected.production.failedCount}</div></div></div>
              {probeResult ? <div className="rounded-[32px] border border-violet-100 bg-white p-6 shadow-sm"><div className="flex items-center gap-2 text-sm font-black"><Clock3 className="h-4 w-4 text-violet-600" />Last deep probe</div><pre className="mt-4 max-h-[360px] overflow-auto rounded-2xl bg-slate-950 p-4 text-xs font-semibold text-white">{JSON.stringify(probeResult, null, 2)}</pre></div> : null}
            </> : <div className="rounded-[32px] border border-violet-100 bg-white p-6 text-center shadow-sm">No mailbox selected</div>}
          </section>
        </div>
      </div>
    </div>
  )
}
