"use client"

import { useEffect, useMemo, useState } from "react"
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  Inbox,
  Loader2,
  RefreshCw,
  RotateCcw,
  Search,
  Send,
  ShieldCheck,
  XCircle
} from "lucide-react"

type ApiResult = { ok?: boolean; data?: any; error?: string | null }
type StatusFilter = "all" | "queued" | "sent" | "failed" | "draft" | "sending"

async function api(path: string, options?: RequestInit): Promise<ApiResult> {
  const res = await fetch(path, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options?.headers || {}) }
  })
  const json = await res.json().catch(() => null)
  return { ok: res.ok && json?.ok !== false, data: json?.data, error: json?.error || (!res.ok ? `HTTP ${res.status}` : null) }
}

function normalizeRows(payload: any) {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  return []
}

function statusLabel(status: string) {
  if (status === "sent") return "Envoyé"
  if (status === "queued") return "En attente"
  if (status === "sending") return "Envoi en cours"
  if (status === "failed") return "Échec"
  if (status === "draft") return "Brouillon"
  return status || "Inconnu"
}

function statusStyle(status: string) {
  if (status === "sent") return "border-emerald-200 bg-emerald-50 text-emerald-700"
  if (status === "queued") return "border-blue-200 bg-blue-50 text-blue-700"
  if (status === "sending") return "border-amber-200 bg-amber-50 text-amber-700"
  if (status === "failed") return "border-red-200 bg-red-50 text-red-700"
  return "border-slate-200 bg-slate-50 text-slate-600"
}

function statusIcon(status: string) {
  if (status === "sent") return CheckCircle2
  if (status === "queued") return Clock
  if (status === "sending") return Loader2
  if (status === "failed") return XCircle
  return Inbox
}

function safeText(value: any, fallback = "—") {
  const text = String(value || "").trim()
  return text || fallback
}

function formatDate(value: any) {
  if (!value) return "—"
  try {
    return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value))
  } catch {
    return String(value)
  }
}

export default function CorporateOutboxCommandCenter() {
  const [rows, setRows] = useState<any[]>([])
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState<StatusFilter>("all")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState("Prêt")
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [lastAction, setLastAction] = useState<any>(null)

  const filteredRows = useMemo(() => {
    const q = query.toLowerCase().trim()
    return rows.filter((row) => {
      const matchesFilter = filter === "all" || row.status === filter
      const haystack = [row.subject, row.to_email, row.from_email, row.status, row.last_error, row.body].filter(Boolean).join(" ").toLowerCase()
      return matchesFilter && (!q || haystack.includes(q))
    })
  }, [rows, query, filter])

  const selected = filteredRows.find((row) => row.id === selectedId) || filteredRows[0] || null

  const metrics = useMemo(() => ({
    total: rows.length,
    sent: rows.filter((row) => row.status === "sent").length,
    queued: rows.filter((row) => row.status === "queued").length,
    failed: rows.filter((row) => row.status === "failed").length,
    drafts: rows.filter((row) => row.status === "draft").length,
    sending: rows.filter((row) => row.status === "sending").length
  }), [rows])

  async function load() {
    setBusy(true)
    setStatus("Chargement outbox...")
    const result = await api("/api/email-os/outbox")
    setBusy(false)
    if (result.ok) {
      const nextRows = normalizeRows(result.data)
      setRows(nextRows)
      setSelectedId((current) => current && nextRows.some((row: any) => row.id === current) ? current : nextRows[0]?.id || null)
      setStatus(`Outbox chargée : ${nextRows.length} message(s)`)
    } else {
      setStatus(result.error || "Échec chargement outbox")
    }
  }

  async function dispatchNow() {
    setBusy(true)
    setStatus("Dispatch SMTP en cours...")
    const result = await api("/api/email-os/dispatch-now", { method: "POST" })
    setLastAction(result)
    setBusy(false)
    if (result.ok) {
      setStatus(`Dispatch terminé : ${Array.isArray(result.data) ? result.data.length : 0} job(s) traité(s)`)
      await load()
    } else {
      setStatus(result.error || "Dispatch échoué")
    }
  }

  async function retry(row: any) {
    setBusy(true)
    setStatus("Réactivation du message...")
    const result = await api("/api/email-os/outbox/retry", { method: "POST", body: JSON.stringify({ outboxId: row.id }) })
    setLastAction(result)
    setBusy(false)
    if (result.ok) {
      setStatus("Message remis en file d’attente")
      await dispatchNow()
    } else {
      setStatus(result.error || "Retry échoué")
    }
  }

  async function copyReference(row: any) {
    await navigator.clipboard.writeText([
      `Subject: ${safeText(row.subject)}`,
      `To: ${safeText(row.to_email)}`,
      `From: ${safeText(row.from_email)}`,
      `Status: ${safeText(row.status)}`,
      `Outbox ID: ${safeText(row.id)}`,
      `Message ID: ${safeText(row.provider_message_id)}`
    ].join("\n"))
    setStatus("Référence copiée")
  }

  useEffect(() => { load() }, [])

  return (
    <section className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="rounded-3xl bg-slate-950 p-4 text-white"><Send className="h-6 w-6" /></div>
              <div>
                <h1 className="text-3xl font-black tracking-tight text-slate-950">Outbox Command Center</h1>
                <p className="mt-1 text-sm font-semibold text-slate-500">Suivi opérationnel des emails envoyés, en file, échoués et brouillons.</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={load} disabled={busy} className="inline-flex h-11 items-center gap-2 rounded-2xl border border-slate-200 px-4 text-sm font-black hover:bg-slate-50 disabled:opacity-50">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                Actualiser
              </button>
              <button type="button" onClick={dispatchNow} disabled={busy} className="inline-flex h-11 items-center gap-2 rounded-2xl bg-slate-950 px-4 text-sm font-black text-white hover:bg-slate-800 disabled:opacity-50">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                Dispatcher maintenant
              </button>
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-6">
            {[
              ["Total", metrics.total, "all"],
              ["Envoyés", metrics.sent, "sent"],
              ["En attente", metrics.queued, "queued"],
              ["En cours", metrics.sending, "sending"],
              ["Échecs", metrics.failed, "failed"],
              ["Brouillons", metrics.drafts, "draft"]
            ].map(([label, value, nextFilter]) => (
              <button key={String(label)} type="button" onClick={() => setFilter(nextFilter as StatusFilter)} className={`rounded-2xl border p-4 text-left transition hover:bg-slate-50 ${filter === nextFilter ? "border-slate-950 bg-slate-50" : "border-slate-200 bg-white"}`}>
                <div className="text-xs font-black uppercase text-slate-400">{label}</div>
                <div className="mt-2 text-2xl font-black text-slate-950">{value}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[460px_minmax(0,1fr)]">
          <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-4">
              <div className="text-sm font-black text-slate-950">{status}</div>
              <div className="mt-3 flex h-11 items-center rounded-2xl border border-slate-200 bg-slate-50 px-3">
                <Search className="h-4 w-4 text-slate-400" />
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher destinataire, objet, statut..." className="h-full flex-1 bg-transparent px-3 text-sm font-semibold outline-none" />
              </div>
            </div>

            <div className="max-h-[680px] overflow-y-auto">
              {filteredRows.length === 0 ? (
                <div className="p-8 text-center">
                  <Inbox className="mx-auto h-9 w-9 text-slate-400" />
                  <h2 className="mt-4 font-black text-slate-950">Aucun message</h2>
                  <p className="mt-2 text-sm text-slate-500">Aucun email ne correspond au filtre actuel.</p>
                </div>
              ) : null}

              {filteredRows.map((row) => {
                const Icon = statusIcon(row.status)
                return (
                  <button key={row.id} type="button" onClick={() => { setSelectedId(row.id); setDetailsOpen(false) }} className={`block w-full border-b border-slate-100 p-4 text-left transition hover:bg-slate-50 ${selected?.id === row.id ? "bg-blue-50" : ""}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-black text-slate-950">{safeText(row.subject, "(Sans objet)")}</div>
                        <div className="mt-1 truncate text-xs font-bold text-slate-500">À : {safeText(row.to_email)}</div>
                        <div className="mt-1 truncate text-xs font-bold text-slate-400">De : {safeText(row.from_email, "Expéditeur système")}</div>
                      </div>
                      <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-black ${statusStyle(row.status)}`}>
                        <Icon className={`h-3 w-3 ${row.status === "sending" ? "animate-spin" : ""}`} />
                        {statusLabel(row.status)}
                      </span>
                    </div>
                    {row.last_error ? <div className="mt-3 rounded-xl bg-red-50 p-2 text-xs font-bold text-red-700">{row.last_error}</div> : null}
                    <div className="mt-3 text-[11px] font-black uppercase tracking-wide text-slate-400">
                      {row.sent_at ? `Envoyé : ${formatDate(row.sent_at)}` : `Créé : ${formatDate(row.created_at)}`}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
            {!selected ? (
              <div className="flex min-h-[620px] items-center justify-center text-center">
                <div>
                  <Inbox className="mx-auto h-10 w-10 text-slate-400" />
                  <h2 className="mt-4 text-lg font-black text-slate-950">Aucun email sélectionné</h2>
                  <p className="mt-2 text-sm text-slate-500">Sélectionnez un message pour afficher le détail opérationnel.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-black ${statusStyle(selected.status)}`}>{statusLabel(selected.status)}</div>
                    <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950">{safeText(selected.subject, "(Sans objet)")}</h2>
                    <p className="mt-2 text-sm font-semibold text-slate-500">{safeText(selected.from_email, "Expéditeur système")} → {safeText(selected.to_email)}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selected.status === "failed" ? (
                      <button type="button" onClick={() => retry(selected)} disabled={busy} className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-black text-white disabled:opacity-50">
                        <RotateCcw className="h-4 w-4" />
                        Retry
                      </button>
                    ) : null}
                    <button type="button" onClick={() => copyReference(selected)} className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-black hover:bg-slate-50">
                      <Copy className="h-4 w-4" />
                      Copier
                    </button>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="text-xs font-black uppercase text-slate-400">Priorité</div><div className="mt-2 font-black text-slate-950">{safeText(selected.priority, "normal")}</div></div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="text-xs font-black uppercase text-slate-400">Créé</div><div className="mt-2 font-black text-slate-950">{formatDate(selected.created_at)}</div></div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="text-xs font-black uppercase text-slate-400">Envoyé</div><div className="mt-2 font-black text-slate-950">{formatDate(selected.sent_at)}</div></div>
                </div>

                <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
                  <h3 className="font-black text-slate-950">Message</h3>
                  <div className="mt-4 whitespace-pre-wrap rounded-2xl bg-white p-5 text-sm font-medium leading-7 text-slate-700">{safeText(selected.body, "Aucun contenu affichable.")}</div>
                </div>

                {selected.last_error ? (
                  <div className="rounded-[28px] border border-red-200 bg-red-50 p-5">
                    <div className="flex gap-3"><AlertCircle className="h-5 w-5 text-red-700" /><div><h3 className="font-black text-red-900">Erreur d’envoi</h3><p className="mt-2 text-sm font-semibold leading-6 text-red-800">{selected.last_error}</p></div></div>
                  </div>
                ) : null}

                <div className="rounded-[28px] border border-slate-200 bg-white p-5">
                  <button type="button" onClick={() => setDetailsOpen(!detailsOpen)} className="inline-flex items-center gap-2 text-sm font-black text-slate-700">
                    <ExternalLink className="h-4 w-4" />
                    {detailsOpen ? "Masquer diagnostics techniques" : "Afficher diagnostics techniques"}
                  </button>
                  {detailsOpen ? <pre className="mt-4 max-h-[360px] overflow-auto rounded-2xl bg-slate-950 p-4 text-xs text-white">{JSON.stringify(selected, null, 2)}</pre> : null}
                </div>

                {lastAction ? (
                  <div className="rounded-[28px] border border-slate-200 bg-white p-5">
                    <h3 className="font-black text-slate-950">Dernière action</h3>
                    <pre className="mt-4 max-h-[240px] overflow-auto rounded-2xl bg-slate-950 p-4 text-xs text-white">{JSON.stringify(lastAction, null, 2)}</pre>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
