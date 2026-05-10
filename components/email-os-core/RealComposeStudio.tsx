"use client"

import { useEffect, useState } from "react"
import { FileText, Mail, RefreshCw, Save, Send } from "lucide-react"
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

export default function RealComposeStudio() {
  const [mailboxes, setMailboxes] = useState<any[]>([])
  const [selectedMailboxId, setSelectedMailboxId] = useState("")
  const [toEmail, setToEmail] = useState("")
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")
  const [status, setStatus] = useState("Ready")
  const [busy, setBusy] = useState(false)

  async function load() {
    const result = await api("/api/email-os/entities/mailboxes")
    const normalized = (result.data || []).map(normalizeMailboxDisplay)
    setMailboxes(normalized)
    if (!selectedMailboxId && normalized[0]) setSelectedMailboxId(normalized[0].id)
  }

  async function sendEmail() {
    setBusy(true)
    setStatus("Sending email...")

    const mailbox = mailboxes.find((item) => item.id === selectedMailboxId)

    const result = await api("/api/email-os/compose/send", {
      method: "POST",
      body: JSON.stringify({
        mailboxId: selectedMailboxId || null,
        fromEmail: mailbox?.email,
        toEmail,
        subject,
        body
      })
    })

    setBusy(false)
    setStatus(result.ok ? "Email sent successfully" : result.error || "Send failed")
  }

  async function saveDraft() {
    setBusy(true)
    setStatus("Saving draft...")

    const mailbox = mailboxes.find((item) => item.id === selectedMailboxId)

    const result = await api("/api/email-os/compose/draft", {
      method: "POST",
      body: JSON.stringify({
        mailboxId: selectedMailboxId || null,
        fromEmail: mailbox?.email,
        toEmail,
        subject,
        body
      })
    })

    setBusy(false)
    setStatus(result.ok ? "Draft saved" : result.error || "Draft failed")
  }

  useEffect(() => { load() }, [])

  return (
    <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-slate-950 p-3 text-white">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-950">Real Compose Studio</h1>
              <p className="text-sm text-slate-500">{status}</p>
            </div>
          </div>

          <button onClick={load} className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-bold hover:bg-slate-50">
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        </div>

        <div className="mt-6 grid gap-4">
          <label className="block">
            <div className="mb-2 text-sm font-black text-slate-950">From mailbox</div>
            <select value={selectedMailboxId} onChange={(e) => setSelectedMailboxId(e.target.value)} className="h-12 w-full cursor-pointer rounded-2xl border border-slate-200 px-3 text-sm font-black outline-none">
              <option value="">Default SMTP account</option>
              {mailboxes.map((mailbox) => (
                <option key={mailbox.id} value={mailbox.id}>{mailbox.name} • {mailbox.email}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <div className="mb-2 text-sm font-black text-slate-950">To</div>
            <input value={toEmail} onChange={(e) => setToEmail(e.target.value)} placeholder="recipient@example.com" className="h-12 w-full rounded-2xl border border-slate-200 px-3 text-sm font-semibold outline-none" />
          </label>

          <label className="block">
            <div className="mb-2 text-sm font-black text-slate-950">Subject</div>
            <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" className="h-12 w-full rounded-2xl border border-slate-200 px-3 text-sm font-semibold outline-none" />
          </label>

          <label className="block">
            <div className="mb-2 text-sm font-black text-slate-950">Body</div>
            <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write your message..." className="min-h-[280px] w-full rounded-2xl border border-slate-200 p-4 text-sm font-semibold leading-6 outline-none" />
          </label>

          <div className="flex flex-wrap gap-2">
            <button disabled={busy || !toEmail || !subject || !body} onClick={sendEmail} className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-40">
              <Send className="h-4 w-4" /> Send real email
            </button>
            <button disabled={busy} onClick={saveDraft} className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-2xl border border-slate-200 px-5 text-sm font-black hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40">
              <Save className="h-4 w-4" /> Save draft
            </button>
          </div>
        </div>
      </div>

      <aside className="space-y-5">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-black text-slate-950">Send Requirements</h2>
          <div className="mt-4 space-y-3 text-sm font-semibold text-slate-600">
            <div className="rounded-2xl bg-slate-50 p-3">SMTP env must be configured.</div>
            <div className="rounded-2xl bg-slate-50 p-3">Recipient, subject, and body are required.</div>
            <div className="rounded-2xl bg-slate-50 p-3">Failed sends are stored in outbound messages.</div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-slate-500" />
            <h2 className="text-lg font-black text-slate-950">Important</h2>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            This page bypasses dead UI buttons and directly calls the real send/draft APIs.
          </p>
        </div>
      </aside>
    </section>
  )
}
