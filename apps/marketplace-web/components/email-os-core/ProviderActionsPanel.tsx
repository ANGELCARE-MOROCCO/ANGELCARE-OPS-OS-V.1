"use client"

import { useState } from "react"
import { RefreshCw, Send, Wifi } from "lucide-react"

async function post(path: string, body: unknown = {}) {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  })
  return res.json()
}

export default function ProviderActionsPanel() {
  const [status, setStatus] = useState("Ready")

  async function testProviders() {
    setStatus("Testing providers...")
    const result = await post("/api/email-os/provider-test", { mode: "all" })
    setStatus(result.ok ? "Provider test completed" : result.error || "Provider test failed")
  }

  async function syncImap() {
    setStatus("Syncing IMAP...")
    const result = await post("/api/email-os/sync", { limit: 10 })
    setStatus(result.ok ? `Synced ${result.data?.count || 0} messages` : result.error || "Sync failed")
  }

  async function retryQueue() {
    setStatus("Retrying queue...")
    const result = await post("/api/email-os/queue/retry", { limit: 10 })
    setStatus(result.ok ? "Queue retry completed" : result.error || "Queue retry failed")
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-950">Provider Execution</h2>
          <p className="mt-1 text-sm text-slate-500">{status}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={testProviders} className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold hover:bg-slate-50">
            <Wifi className="h-4 w-4" /> Test providers
          </button>
          <button onClick={syncImap} className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold hover:bg-slate-50">
            <RefreshCw className="h-4 w-4" /> Sync IMAP
          </button>
          <button onClick={retryQueue} className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl bg-slate-950 px-3 text-sm font-bold text-white hover:bg-slate-800">
            <Send className="h-4 w-4" /> Retry outbox
          </button>
        </div>
      </div>
    </section>
  )
}
