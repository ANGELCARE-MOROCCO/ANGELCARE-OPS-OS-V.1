"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { MailCheck, Plus, RefreshCw, ServerCrash } from "lucide-react"

async function api(path: string) {
  const res = await fetch(path)
  return res.json()
}

export default function PremiumMailboxManagementPanel() {
  const [mailboxes, setMailboxes] = useState<any[]>([])
  const [credentials, setCredentials] = useState<any[]>([])
  const [provider, setProvider] = useState<any>(null)

  async function load() {
    const [m, c, p] = await Promise.all([
      api("/api/email-os/entities/mailboxes"),
      api("/api/email-os/mailbox-credentials"),
      api("/api/email-os/production/provider-validation")
    ])
    setMailboxes(m.data || [])
    setCredentials(c.data || [])
    setProvider(p.data || p)
  }

  useEffect(() => { load() }, [])

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-950">Premium Mailbox Management</h1>
            <p className="mt-1 text-sm text-slate-500">Manage real DB-backed mailboxes, credentials, provider readiness, and operational status.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={load} className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-bold hover:bg-slate-50">
              <RefreshCw className="h-4 w-4" /> Refresh
            </button>
            <Link href="/email-os/mailbox-setup" className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl bg-slate-950 px-3 text-sm font-bold text-white">
              <Plus className="h-4 w-4" /> New mailbox
            </Link>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="text-3xl font-black">{mailboxes.length}</div><div className="text-xs font-black uppercase text-slate-400">Mailboxes</div></div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="text-3xl font-black">{credentials.length}</div><div className="text-xs font-black uppercase text-slate-400">Credentials</div></div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="text-lg font-black">{provider?.smtpReady ? "SMTP Ready" : "SMTP Missing"}</div><div className="text-xs font-black uppercase text-slate-400">SMTP</div></div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="text-lg font-black">{provider?.imapReady ? "IMAP Ready" : "IMAP Missing"}</div><div className="text-xs font-black uppercase text-slate-400">IMAP</div></div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-black text-slate-950">Mailboxes</h2>
        <div className="mt-4 space-y-3">
          {mailboxes.length === 0 ? (
            <div className="flex min-h-[220px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
              <ServerCrash className="h-8 w-8 text-slate-400" />
              <div className="mt-4 text-lg font-black text-slate-950">No production mailboxes yet</div>
              <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">Use the premium onboarding wizard to create the first real mailbox and validate SMTP/IMAP.</p>
              <Link href="/email-os/mailbox-setup" className="mt-4 inline-flex h-10 items-center rounded-xl bg-slate-950 px-4 text-sm font-black text-white">Create mailbox</Link>
            </div>
          ) : null}

          {mailboxes.map((mailbox) => (
            <div key={mailbox.id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-white p-3 text-slate-700"><MailCheck className="h-5 w-5" /></div>
                <div>
                  <div className="font-black text-slate-950">{mailbox.name || mailbox.address}</div>
                  <div className="text-sm text-slate-500">{mailbox.address} • {mailbox.status}</div>
                </div>
              </div>
              <div className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-black uppercase text-slate-500">{mailbox.owner || "operations"}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
