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
  Wifi
} from "lucide-react"

type ApiResult = {
  ok?: boolean
  data?: any
  error?: string
}

async function api(path: string, options?: RequestInit): Promise<ApiResult> {
  const res = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {})
    }
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

function getMailboxLabel(mailboxes: any[], mailboxId: string) {
  const mailbox = mailboxes.find((item) => item.id === mailboxId)

  if (!mailbox) return mailboxId || "default"

  return mailbox.name || mailbox.email_address || mailbox.address || mailbox.id
}

export default function RealInboxWorkspace() {
  const [mailboxes, setMailboxes] = useState<any[]>([])
  const [mailboxId, setMailboxId] = useState("all")
  const [inbox, setInbox] = useState<any[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [status, setStatus] = useState("Prêt")

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()

    if (!q) return inbox

    return inbox.filter((row) =>
      [
        row.subject,
        row.preview,
        row.from_email,
        row.to_email,
        row.status,
        row.mailbox_id
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    )
  }, [inbox, query])

  const selected = filtered.find((row) => row.id === selectedId) || filtered[0] || null

  async function loadMailboxes() {
    const result = await api("/api/email-os/mailboxes")

    if (result.ok) {
      const rows = result.data || []
      setMailboxes(rows)

      // Keep "all" selected by default so Inbox shows every persisted mailbox.
    }
  }

  async function loadInbox(nextMailboxId = mailboxId) {
    setLoading(true)

    const suffix = nextMailboxId && nextMailboxId !== "all"
      ? `?mailboxId=${encodeURIComponent(nextMailboxId)}`
      : ""

    const result = await api(`/api/email-os/inbox${suffix}`)

    if (result.ok) {
      const rows = result.data || []
      setInbox(rows)
      setSelectedId((current) => current || rows[0]?.id || null)
      setStatus(`Inbox chargée : ${rows.length} email(s)`)
    } else {
      setStatus(result.error || "Échec chargement inbox")
    }

    setLoading(false)
  }

  async function syncInbox() {
    if (!mailboxId || mailboxId === "all") {
      setStatus("Veuillez sélectionner une boîte mail précise pour synchroniser.")
      return
    }

    setSyncing(true)
    setStatus("Synchronisation IMAP en cours...")

    const result = await api("/api/email-os/sync", {
      method: "POST",
      body: JSON.stringify({
        mailboxId,
        limit: 25
      })
    })

    setSyncing(false)

    if (result.ok) {
      setStatus(`Synchronisation terminée : ${result.data?.count || 0} email(s)`)
      await loadInbox(mailboxId)
    } else {
      setStatus(result.error || "Synchronisation échouée")
    }
  }


  async function syncAllMailboxes() {
    if (mailboxes.length === 0) {
      setStatus("Aucune boîte mail disponible pour synchronisation.")
      return
    }

    setSyncing(true)
    setStatus(`Synchronisation de ${mailboxes.length} boîte(s)...`)

    let total = 0
    let failed = 0

    for (const mailbox of mailboxes) {
      const result = await api("/api/email-os/sync", {
        method: "POST",
        body: JSON.stringify({
          mailboxId: mailbox.id,
          limit: 25
        })
      })

      if (result.ok) {
        total += Number(result.data?.count || 0)
      } else {
        failed += 1
      }
    }

    setSyncing(false)
    setMailboxId("all")
    await loadInbox("all")

    setStatus(
      failed > 0
        ? `Sync terminée : ${total} email(s), ${failed} boîte(s) en échec`
        : `Sync terminée : ${total} email(s)`
    )
  }

  useEffect(() => {
    loadMailboxes()
  }, [])

  useEffect(() => {
    loadInbox(mailboxId)
  }, [mailboxId])

  return (
    <div className="grid min-h-[calc(100vh-112px)] grid-cols-1 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm lg:grid-cols-[430px_minmax(0,1fr)]">
      <section className="border-r border-slate-200">
        <div className="border-b border-slate-200 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-lg font-black text-slate-950">Inbox réelle</h1>
              <p className="text-xs font-semibold text-slate-500">{status}</p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => loadInbox(mailboxId)}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 px-3 text-sm font-black hover:bg-slate-50"
              >
                <RefreshCw className="h-4 w-4" />
              </button>

              <button
                type="button"
                disabled={syncing || mailboxId === "all"}
                onClick={syncInbox}
                title={mailboxId === "all" ? "Choisissez une boîte précise pour sync rapide" : "Synchroniser cette boîte"}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-950 px-3 text-sm font-black text-white disabled:opacity-50"
              >
                {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wifi className="h-4 w-4" />}
                Sync
              </button>
            </div>
          </div>

          <div className="mt-4 grid gap-3">
            <select
              value={mailboxId}
              onChange={(event) => setMailboxId(event.target.value)}
              className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-bold outline-none"
            >
              <option value="all">Toutes les boîtes</option>
              {mailboxes.map((mailbox) => (
                <option key={mailbox.id} value={mailbox.id}>
                  {mailbox.name || mailbox.email_address || mailbox.address} — {mailbox.email_address || mailbox.address}
                </option>
              ))}
            </select>

            <button
              type="button"
              disabled={syncing || mailboxes.length === 0}
              onClick={syncAllMailboxes}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-black text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wifi className="h-4 w-4" />}
              Synchroniser toutes les boîtes
            </button>

            <div className="flex h-11 items-center rounded-2xl border border-slate-200 bg-slate-50 px-3">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Rechercher dans l’inbox..."
                className="h-full flex-1 bg-transparent px-3 text-sm font-semibold outline-none"
              />
            </div>
          </div>
        </div>

        <div className="max-h-[calc(100vh-310px)] overflow-y-auto">
          {loading ? (
            <div className="flex items-center gap-2 p-5 text-sm font-bold text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Chargement...
            </div>
          ) : null}

          {!loading && filtered.length === 0 ? (
            <div className="p-8 text-center">
              <Inbox className="mx-auto h-9 w-9 text-slate-400" />
              <h2 className="mt-4 font-black text-slate-950">Aucun email réel affiché</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Sélectionnez une boîte puis cliquez Sync pour importer les emails IMAP.
              </p>
            </div>
          ) : null}

          {filtered.map((row) => (
            <button
              type="button"
              key={row.id}
              onClick={() => setSelectedId(row.id)}
              className={`block w-full border-b border-slate-100 p-4 text-left transition hover:bg-slate-50 ${
                selected?.id === row.id ? "bg-blue-50" : ""
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="truncate text-sm font-black text-slate-950">
                  {getSubject(row)}
                </div>
                <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-black uppercase text-slate-500">
                  {row.status || "received"}
                </span>
              </div>

              <div className="mt-1 truncate text-xs font-semibold text-slate-500">
                {getSender(row)}
              </div>

              <div className="mt-1 truncate text-[11px] font-black uppercase tracking-wide text-slate-400">
                {getMailboxLabel(mailboxes, row.mailbox_id)}
              </div>

              <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">
                {getPreview(row)}
              </p>

              <div className="mt-3 text-[11px] font-black uppercase tracking-wide text-slate-400">
                {row.created_at || row.updated_at || ""}
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="flex min-h-0 flex-col">
        {!selected ? (
          <div className="flex flex-1 items-center justify-center p-10 text-center">
            <div>
              <MailOpen className="mx-auto h-10 w-10 text-slate-400" />
              <h2 className="mt-4 text-lg font-black text-slate-950">Aucun email sélectionné</h2>
              <p className="mt-2 text-sm text-slate-500">Synchronisez une boîte puis sélectionnez un email.</p>
            </div>
          </div>
        ) : (
          <>
            <div className="border-b border-slate-200 p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black text-slate-950">
                    {getSubject(selected)}
                  </h2>
                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    {getSender(selected)} → {selected.to_email || "destination inconnue"}
                  </p>
                </div>

                <div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-black uppercase text-emerald-700">
                  <CheckCircle2 className="mr-1 inline h-3 w-3" />
                  Persisté DB
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <h3 className="font-black text-slate-950">Aperçu email</h3>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                  {getPreview(selected)}
                </p>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 p-4">
                  <div className="text-xs font-black uppercase text-slate-400">Mailbox</div>
                  <div className="mt-2 break-all font-black">{getMailboxLabel(mailboxes, selected.mailbox_id)}</div>
                </div>

                <div className="rounded-2xl border border-slate-200 p-4">
                  <div className="text-xs font-black uppercase text-slate-400">Provider UID</div>
                  <div className="mt-2 break-all font-black">{selected.provider_uid || "N/A"}</div>
                </div>

                <div className="rounded-2xl border border-slate-200 p-4">
                  <div className="text-xs font-black uppercase text-slate-400">Statut</div>
                  <div className="mt-2 font-black">{selected.status || "received"}</div>
                </div>
              </div>

              {selected.raw ? (
                <details className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
                  <summary className="cursor-pointer text-sm font-black text-slate-700">
                    Données techniques
                  </summary>
                  <pre className="mt-4 max-h-[260px] overflow-auto rounded-xl bg-slate-950 p-4 text-xs text-white">
                    {JSON.stringify(selected.raw, null, 2)}
                  </pre>
                </details>
              ) : null}

              {String(status).toLowerCase().includes("échou") || String(status).toLowerCase().includes("timeout") ? (
                <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <div className="flex gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-700" />
                    <div>
                      <div className="font-black text-amber-900">Synchronisation à vérifier</div>
                      <p className="mt-1 text-sm leading-6 text-amber-800">
                        Si IMAP timeout, le problème vient probablement du serveur email ou du réseau, pas de l’affichage inbox.
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </>
        )}
      </section>
    </div>
  )
}