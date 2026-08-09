"use client"

import { useEffect, useState } from "react"
import { MailCheck, RefreshCw } from "lucide-react"

async function api(path: string) {
  const res = await fetch(path)
  return res.json()
}

export default function RealOutboxQueue() {
  const [messages, setMessages] = useState<any[]>([])
  const [drafts, setDrafts] = useState<any[]>([])

  async function load() {
    const [outbox, savedDrafts] = await Promise.all([
      api("/api/email-os/outbound-messages"),
      api("/api/email-os/saved-drafts")
    ])

    setMessages(outbox.data || [])
    setDrafts(savedDrafts.data || [])
  }

  useEffect(() => { load() }, [])

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-slate-950 p-3 text-white">
              <MailCheck className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-950">Real Outbox Queue</h1>
              <p className="text-sm text-slate-500">Sent, failed, queued messages, and saved drafts.</p>
            </div>
          </div>

          <button onClick={load} className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-bold hover:bg-slate-50">
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="text-3xl font-black">{messages.length}</div><div className="text-xs font-black uppercase text-slate-400">Outbound</div></div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="text-3xl font-black">{messages.filter((m) => m.status === "sent").length}</div><div className="text-xs font-black uppercase text-slate-400">Sent</div></div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="text-3xl font-black">{messages.filter((m) => m.status === "failed").length}</div><div className="text-xs font-black uppercase text-slate-400">Failed</div></div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="text-3xl font-black">{drafts.length}</div><div className="text-xs font-black uppercase text-slate-400">Drafts</div></div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-black text-slate-950">Outbound Messages</h2>
        <div className="mt-4 space-y-3">
          {messages.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-sm font-bold text-slate-500">No outbound messages yet.</div> : null}
          {messages.map((message) => (
            <div key={message.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="font-black text-slate-950">{message.subject}</div>
                  <div className="text-sm text-slate-500">To {message.to_email} • From {message.from_email}</div>
                </div>
                <div className={message.status === "sent" ? "rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700" : message.status === "failed" ? "rounded-full bg-rose-100 px-3 py-1 text-xs font-black text-rose-700" : "rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600"}>
                  {message.status}
                </div>
              </div>
              {message.last_error ? <div className="mt-3 rounded-xl bg-rose-50 p-3 text-sm font-bold text-rose-700">{message.last_error}</div> : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
