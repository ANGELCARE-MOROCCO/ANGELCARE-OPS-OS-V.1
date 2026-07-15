"use client"

import { useEffect, useState } from "react"
import { DatabaseZap, RefreshCw, ShieldAlert } from "lucide-react"
import { normalizeMailboxDisplay } from "@/lib/email-os-core/mailbox-display"

async function api(path: string, options?: RequestInit) {
  const res = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {})
    }
  })
  return res.json()
}

export default function BulkMailboxPreinstallPanel() {
  const [mailboxes, setMailboxes] = useState<any[]>([])
  const [status, setStatus] = useState("Ready")

  async function load() {
    const result = await api("/api/email-os/entities/mailboxes")
    setMailboxes((result.data || []).map(normalizeMailboxDisplay))
  }

  async function preinstall() {
    setStatus("Preinstalling mailboxes...")
    const result = await api("/api/email-os/mailboxes/bulk-preinstall", {
      method: "POST"
    })
    setStatus(result.ok ? `Installed ${result.data.mailboxes} mailboxes` : result.error || "Preinstall failed")
    await load()
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-slate-950 p-3 text-white">
              <DatabaseZap className="h-5 w-5" />
            </div>

            <div>
              <h1 className="text-2xl font-black text-slate-950">
                Bulk Mailbox Preinstall
              </h1>
              <p className="text-sm text-slate-500">{status}</p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={load}
              className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-bold hover:bg-slate-50"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>

            <button
              onClick={preinstall}
              className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl bg-slate-950 px-3 text-sm font-bold text-white"
            >
              <DatabaseZap className="h-4 w-4" />
              Preinstall all
            </button>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-0.5 h-5 w-5 text-amber-700" />
            <div>
              <div className="font-black text-amber-900">Security note</div>
              <p className="mt-1 text-sm leading-6 text-amber-800">
                This preinstalls credentials for immediate validation. After successful tests, move secrets to a real vault and rotate production passwords.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-black text-slate-950">Installed Mailboxes</h2>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {mailboxes.map((mailbox) => (
            <div key={mailbox.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="font-black text-slate-950">{mailbox.name}</div>
              <div className="mt-1 text-sm text-slate-500">{mailbox.email}</div>
              <div className="mt-3 rounded-full bg-white px-3 py-1 text-xs font-black uppercase text-slate-500">
                {mailbox.owner} • {mailbox.status}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
