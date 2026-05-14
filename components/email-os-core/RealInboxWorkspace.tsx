"use client"

import { useEffect, useMemo, useState } from "react"
import {
  AlertCircle,
  CheckCircle2,
  Inbox,
  Loader2,
  MailOpen,
  RefreshCw,
  Search,
  ShieldCheck,
  Wifi,
  Zap
} from "lucide-react"

type ApiResult = { ok?: boolean; data?: any; error?: string }
type MailboxFilter = "all" | string
type StatusFilter = "all" | "received" | "open" | "resolved" | "failed"

async function api(path: string, options?: RequestInit): Promise<ApiResult> {
  const res = await fetch(path, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options?.headers || {}) }
  })

  const json = await res.json().catch(() => null)
  return {
    ok: res.ok && json?.ok !== false,
    data: json?.data,
    error: json?.error || (!res.ok ? `HTTP ${res.status}` : undefined)
  }
}

function getSender(row: any) {
  return row.from_email || row.fromEmail || "Expéditeur inconnu"
}

function getSubject(row: any) {
  return row.subject || "(Sans objet)"
}

function getPreview(row: any) {
  return row.preview || row.body || row.subject || "Aucun aperçu disponible."
}

function mailboxAddress(mailbox: any) {
  return mailbox.email_address || mailbox.address || mailbox.email || mailbox.name || mailbox.id
}

function getMailbox(mailboxes: any[], mailboxId: string) {
  return mailboxes.find((item) => item.id === mailboxId)
}

function getMailboxLabel(mailboxes: any[], mailboxId: string) {
  const mailbox = getMailbox(mailboxes, mailboxId)
  if (!mailbox) return mailboxId || "Mailbox inconnue"
  return mailbox.name || mailboxAddress(mailbox)
}

function getMailboxEmail(mailboxes: any[], mailboxId: string) {
  const mailbox = getMailbox(mailboxes, mailboxId)
  if (!mailbox) return mailboxId || "—"
  return mailboxAddress(mailbox)
}

function formatDate(value: any) {
  if (!value) return "—"
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      dateStyle: "medium",
      timeStyle: "short"
    }).format(new Date(value))
  } catch {
    return String(value)
  }
}

function statusStyle(status: string) {
  if (status === "received") return "border-emerald-200 bg-emerald-50 text-emerald-700"
  if (status === "open") return "border-blue-200 bg-blue-50 text-blue-700"
  if (status === "resolved") return "border-slate-200 bg-slate-50 text-slate-600"
  if (status === "failed") return "border-red-200 bg-red-50 text-red-700"
  return "border-slate-200 bg-slate-50 text-slate-600"
}

export default function RealInboxWorkspace() {
  const [mailboxes, setMailboxes] = useState<any[]>([])
  const [mailboxId, setMailboxId] = useState<MailboxFilter>("all")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [inbox, setInbox] = useState<any[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [status, setStatus] = useState("Prêt")
  const [lastSync, setLastSync] = useState<Record<string, { status: string; count: number; at: string; error?: string }>>({})

  const mailboxStats = useMemo(() => {
    const map: Record<string, { total: number; latest?: string; failed: number }> = {}

    for (const mailbox of mailboxes) {
      map[mailbox.id] = { total: 0, failed: 0 }
    }

    for (const row of inbox) {
      const key = row.mailbox_id || "unknown"
      map[key] ||= { total: 0, failed: 0 }
      map[key].total += 1
      if (row.status === "failed") map[key].failed += 1
      const date = row.created_at || row.updated_at
      if (date && (!map[key].latest || new Date(date) > new Date(map[key].latest || 0))) {
        map[key].latest = date
      }
    }

    return map
  }, [inbox, mailboxes])

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()

    return inbox.filter((row) => {
      const matchesMailbox = mailboxId === "all" || row.mailbox_id === mailboxId
      const matchesStatus = statusFilter === "all" || row.status === statusFilter
      const haystack = [
        row.subject,
        row.preview,
        row.from_email,
        row.to_email,
        row.status,
        row.mailbox_id,
        getMailboxLabel(mailboxes, row.mailbox_id)
      ].filter(Boolean).join(" ").toLowerCase()

      return matchesMailbox && matchesStatus && (!q || haystack.includes(q))
    })
  }, [inbox, query, mailboxId, statusFilter, mailboxes])

  const selected = filtered.find((row) => row.id === selectedId) || filtered[0] || null

  const globalMetrics = useMemo(() => {
    const activeMailboxCount = new Set(inbox.map((row) => row.mailbox_id).filter(Boolean)).size
    return {
      total: inbox.length,
      visible: filtered.length,
      mailboxes: mailboxes.length,
      activeMailboxes: activeMailboxCount,
      received: inbox.filter((row) => row.status === "received").length,
      failed: inbox.filter((row) => row.status === "failed").length
    }
  }, [inbox, filtered, mailboxes])

  const selectedMailboxName = mailboxId === "all" ? "Toutes les boîtes" : getMailboxLabel(mailboxes, mailboxId)

  async function loadMailboxes() {
    const result = await api("/api/email-os/mailboxes")
    if (result.ok) setMailboxes(result.data || [])
    else setStatus(result.error || "Échec chargement boîtes mail")
  }

  async function loadInbox(nextMailboxId: MailboxFilter = mailboxId) {
    setLoading(true)
    const suffix = nextMailboxId && nextMailboxId !== "all" ? `?mailboxId=${encodeURIComponent(nextMailboxId)}` : ""
    const result = await api(`/api/email-os/inbox${suffix}`)

    if (result.ok) {
      const rows = result.data || []
      setInbox((current) => {
        if (nextMailboxId === "all") return rows
        const others = current.filter((row) => row.mailbox_id !== nextMailboxId)
        return [...rows, ...others].sort((a, b) => {
          const da = new Date(a.created_at || a.updated_at || 0).getTime()
          const db = new Date(b.created_at || b.updated_at || 0).getTime()
          return db - da
        })
      })

      setSelectedId((current) => {
        if (current && rows.some((row: any) => row.id === current)) return current
        return rows[0]?.id || null
      })

      setStatus(nextMailboxId === "all" ? `Toutes les boîtes chargées : ${rows.length} email(s)` : `${getMailboxLabel(mailboxes, nextMailboxId)} : ${rows.length} email(s)`)
    } else {
      setStatus(result.error || "Échec chargement inbox")
    }

    setLoading(false)
  }

  async function syncMailbox(targetMailboxId: string) {
    setSyncing(true)
    setStatus(`Synchronisation : ${getMailboxLabel(mailboxes, targetMailboxId)}...`)

    const result = await api("/api/email-os/sync", {
      method: "POST",
      body: JSON.stringify({ mailboxId: targetMailboxId, limit: 25 })
    })

    const at = new Date().toISOString()
    setLastSync((current) => ({
      ...current,
      [targetMailboxId]: {
        status: result.ok ? "completed" : "failed",
        count: Number(result.data?.count || 0),
        at,
        error: result.error
      }
    }))

    if (result.ok) {
      setStatus(`${getMailboxLabel(mailboxes, targetMailboxId)} synchronisée : ${result.data?.count || 0} email(s)`)
      await loadInbox(targetMailboxId)
    } else {
      setStatus(result.error || "Synchronisation échouée")
    }

    setSyncing(false)
  }

  async function syncAllMailboxes() {
    if (mailboxes.length === 0) {
      setStatus("Aucune boîte mail disponible.")
      return
    }

    setSyncing(true)
    let total = 0
    let failed = 0
    const nextSync: Record<string, { status: string; count: number; at: string; error?: string }> = {}

    for (const mailbox of mailboxes) {
      setStatus(`Synchronisation ${mailboxes.indexOf(mailbox) + 1}/${mailboxes.length} : ${getMailboxLabel(mailboxes, mailbox.id)}`)
      const result = await api("/api/email-os/sync", {
        method: "POST",
        body: JSON.stringify({ mailboxId: mailbox.id, limit: 25 })
      })
      const count = Number(result.data?.count || 0)
      total += count
      if (!result.ok) failed += 1
      nextSync[mailbox.id] = {
        status: result.ok ? "completed" : "failed",
        count,
        at: new Date().toISOString(),
        error: result.error
      }
    }

    setLastSync((current) => ({ ...current, ...nextSync }))
    setMailboxId("all")
    await loadInbox("all")
    setStatus(failed > 0 ? `Sync globale terminée : ${total} email(s), ${failed} boîte(s) en échec` : `Sync globale terminée : ${total} email(s)`)
    setSyncing(false)
  }

  useEffect(() => {
    loadMailboxes()
  }, [])

  useEffect(() => {
    loadInbox(mailboxId)
  }, [mailboxId])

  return (
    <section className="min-h-[calc(100vh-112px)] space-y-6">
      <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="rounded-3xl bg-slate-950 p-4 text-white">
              <Inbox className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-slate-950">Enterprise Inbox Command Center</h1>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                Vue consolidée des {mailboxes.length || 13} boîtes mail AngelCare avec sync, filtrage et traçabilité.
              </p>
              <div className="mt-4 inline-flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2">
                <span className="rounded-xl bg-white px-3 py-2 text-xs font-black text-slate-700">Vue active : {selectedMailboxName}</span>
                <span className="rounded-xl bg-white px-3 py-2 text-xs font-black text-slate-700">Statut : {status}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => loadInbox(mailboxId)} disabled={loading || syncing} className="inline-flex h-11 items-center gap-2 rounded-2xl border border-slate-200 px-4 text-sm font-black hover:bg-slate-50 disabled:opacity-50">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Actualiser
            </button>
            <button type="button" onClick={syncAllMailboxes} disabled={syncing || mailboxes.length === 0} className="inline-flex h-11 items-center gap-2 rounded-2xl bg-slate-950 px-4 text-sm font-black text-white hover:bg-slate-800 disabled:opacity-50">
              {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wifi className="h-4 w-4" />}
              Sync 13 boîtes
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-6">
          {[
            ["Emails DB", globalMetrics.total],
            ["Visibles", globalMetrics.visible],
            ["Boîtes", globalMetrics.mailboxes],
            ["Actives", globalMetrics.activeMailboxes],
            ["Reçus", globalMetrics.received],
            ["Échecs", globalMetrics.failed]
          ].map(([label, value]) => (
            <div key={String(label)} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs font-black uppercase text-slate-400">{label}</div>
              <div className="mt-2 text-2xl font-black text-slate-950">{value}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[360px_430px_minmax(0,1fr)]">
        <aside className="space-y-4">
          <div className="rounded-[32px] border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-slate-500" />
              <h2 className="font-black text-slate-950">Mailbox Control</h2>
            </div>

            <div className="mt-4 max-h-[620px] space-y-2 overflow-y-auto">
              <button type="button" onClick={() => setMailboxId("all")} className={`w-full rounded-2xl border p-3 text-left transition hover:bg-slate-50 ${mailboxId === "all" ? "border-slate-950 bg-slate-50" : "border-slate-200"}`}>
                <div className="flex items-center justify-between gap-2">
                  <div className="font-black text-slate-950">Toutes les boîtes</div>
                  <div className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-black text-slate-600">{inbox.length}</div>
                </div>
                <div className="mt-1 text-xs font-semibold text-slate-500">Vue consolidée multi-mailbox</div>
              </button>

              {mailboxes.map((mailbox) => {
                const stats = mailboxStats[mailbox.id] || { total: 0, failed: 0 }
                const sync = lastSync[mailbox.id]

                return (
                  <div key={mailbox.id} className={`rounded-2xl border p-3 transition ${mailboxId === mailbox.id ? "border-slate-950 bg-slate-50" : "border-slate-200 bg-white"}`}>
                    <button type="button" onClick={() => setMailboxId(mailbox.id)} className="w-full text-left">
                      <div className="flex items-center justify-between gap-2">
                        <div className="truncate font-black text-slate-950">{mailbox.name || mailboxAddress(mailbox)}</div>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-black text-slate-700">{stats.total}</span>
                      </div>
                      <div className="mt-1 truncate text-xs font-semibold text-slate-500">{mailboxAddress(mailbox)}</div>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-black ${sync?.status === "completed" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : sync?.status === "failed" ? "border-red-200 bg-red-50 text-red-700" : "border-slate-200 bg-slate-50 text-slate-500"}`}>
                          {sync?.status === "completed" ? "Synced" : sync?.status === "failed" ? "Sync failed" : "Not synced"}
                        </span>
                        <span className="text-[10px] font-black text-slate-400">{sync?.at ? formatDate(sync.at) : "Jamais"}</span>
                      </div>
                      {sync?.error ? <div className="mt-2 rounded-xl bg-red-50 p-2 text-[11px] font-bold text-red-700">{sync.error}</div> : null}
                    </button>
                    <button type="button" disabled={syncing} onClick={() => syncMailbox(mailbox.id)} className="mt-3 inline-flex h-9 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 text-xs font-black hover:bg-slate-50 disabled:opacity-50">
                      {syncing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wifi className="h-3.5 w-3.5" />}
                      Sync cette boîte
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        </aside>

        <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-black text-slate-950">{selectedMailboxName}</h2>
                <p className="text-xs font-semibold text-slate-500">{filtered.length} email(s) visibles</p>
              </div>
              <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-black text-slate-600">{mailboxId === "all" ? "Consolidé" : "Mailbox"}</div>
            </div>

            <div className="mt-4 grid gap-3">
              <div className="flex h-11 items-center rounded-2xl border border-slate-200 bg-slate-50 px-3">
                <Search className="h-4 w-4 text-slate-400" />
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher sujet, expéditeur, boîte..." className="h-full flex-1 bg-transparent px-3 text-sm font-semibold outline-none" />
              </div>

              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)} className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-bold outline-none">
                <option value="all">Tous les statuts</option>
                <option value="received">Reçus</option>
                <option value="open">Ouverts</option>
                <option value="resolved">Résolus</option>
                <option value="failed">Échecs</option>
              </select>
            </div>
          </div>

          <div className="max-h-[680px] overflow-y-auto">
            {loading ? <div className="flex items-center gap-2 p-5 text-sm font-bold text-slate-500"><Loader2 className="h-4 w-4 animate-spin" />Chargement...</div> : null}

            {!loading && filtered.length === 0 ? (
              <div className="p-8 text-center">
                <Inbox className="mx-auto h-9 w-9 text-slate-400" />
                <h2 className="mt-4 font-black text-slate-950">Aucun email affiché</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">Choisissez une boîte, lancez la synchronisation, ou changez les filtres.</p>
              </div>
            ) : null}

            {filtered.map((row) => (
              <button type="button" key={row.id} onClick={() => setSelectedId(row.id)} className={`block w-full border-b border-slate-100 p-4 text-left transition hover:bg-slate-50 ${selected?.id === row.id ? "bg-blue-50" : ""}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-black text-slate-950">{getSubject(row)}</div>
                    <div className="mt-1 truncate text-xs font-semibold text-slate-500">{getSender(row)}</div>
                    <div className="mt-1 truncate text-[11px] font-black uppercase tracking-wide text-slate-400">{getMailboxLabel(mailboxes, row.mailbox_id)}</div>
                  </div>
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-black uppercase ${statusStyle(row.status)}`}>{row.status || "received"}</span>
                </div>
                <p className="mt-3 line-clamp-2 text-xs leading-5 text-slate-500">{getPreview(row)}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-black uppercase tracking-wide text-slate-400">
                  <span>{formatDate(row.created_at || row.updated_at)}</span>
                  <span>UID: {row.provider_uid || "N/A"}</span>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="flex min-h-0 flex-col rounded-[32px] border border-slate-200 bg-white shadow-sm">
          {!selected ? (
            <div className="flex flex-1 items-center justify-center p-10 text-center">
              <div>
                <MailOpen className="mx-auto h-10 w-10 text-slate-400" />
                <h2 className="mt-4 text-lg font-black text-slate-950">Aucun email sélectionné</h2>
                <p className="mt-2 text-sm text-slate-500">Sélectionnez un email pour voir son contexte mailbox et son détail.</p>
              </div>
            </div>
          ) : (
            <>
              <div className="border-b border-slate-200 p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-black text-slate-600">
                      <Zap className="h-3.5 w-3.5" />
                      {getMailboxLabel(mailboxes, selected.mailbox_id)}
                    </div>
                    <h2 className="mt-4 text-2xl font-black text-slate-950">{getSubject(selected)}</h2>
                    <p className="mt-2 text-sm font-semibold text-slate-500">{getSender(selected)} → {selected.to_email || getMailboxEmail(mailboxes, selected.mailbox_id)}</p>
                  </div>
                  <div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-black uppercase text-emerald-700">
                    <CheckCircle2 className="mr-1 inline h-3 w-3" />Persisté DB
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="text-xs font-black uppercase text-slate-400">Mailbox</div><div className="mt-2 break-all font-black text-slate-950">{getMailboxEmail(mailboxes, selected.mailbox_id)}</div></div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="text-xs font-black uppercase text-slate-400">Reçu</div><div className="mt-2 font-black text-slate-950">{formatDate(selected.created_at || selected.updated_at)}</div></div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="text-xs font-black uppercase text-slate-400">Statut</div><div className="mt-2 font-black text-slate-950">{selected.status || "received"}</div></div>
                </div>

                <div className="mt-5 rounded-[28px] border border-slate-200 bg-slate-50 p-5">
                  <h3 className="font-black text-slate-950">Aperçu email</h3>
                  <p className="mt-3 whitespace-pre-wrap rounded-2xl bg-white p-5 text-sm leading-7 text-slate-700">{getPreview(selected)}</p>
                </div>

                <details className="mt-5 rounded-[28px] border border-slate-200 bg-white p-5">
                  <summary className="cursor-pointer text-sm font-black text-slate-700">Diagnostics techniques</summary>
                  <pre className="mt-4 max-h-[320px] overflow-auto rounded-2xl bg-slate-950 p-4 text-xs text-white">{JSON.stringify(selected, null, 2)}</pre>
                </details>

                {String(status).toLowerCase().includes("échou") || String(status).toLowerCase().includes("timeout") ? (
                  <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                    <div className="flex gap-3">
                      <AlertCircle className="h-5 w-5 text-amber-700" />
                      <div>
                        <div className="font-black text-amber-900">Synchronisation à vérifier</div>
                        <p className="mt-1 text-sm leading-6 text-amber-800">Si une boîte échoue, vérifiez le protocole POP3/IMAP, le mot de passe, et les variables Vercel.</p>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </>
          )}
        </section>
      </div>
    </section>
  )
}
