"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Brain, CheckCircle2, MailCheck, RefreshCw, ShieldCheck, Sparkles, Zap } from "lucide-react"
import FinalLiveOperationsWidget from "@/components/email-os-core/FinalLiveOperationsWidget"
import { EMAIL_OS_FINAL_NAVIGATION } from "@/lib/email-os-core/final-navigation"

async function api(path: string, options?: RequestInit) {
  const res = await fetch(path, { ...options, headers: { "Content-Type": "application/json", ...(options?.headers || {}) } })
  return res.json()
}

export default function FinalCommandCenterPanel() {
  const [readiness, setReadiness] = useState<any>(null)
  const [security, setSecurity] = useState<any>(null)
  const [ai, setAi] = useState<any>(null)
  const [status, setStatus] = useState("Ready")

  async function load() {
    const [r, s, a] = await Promise.all([
      api("/api/email-os/final/readiness"),
      api("/api/email-os/final/security/status"),
      api("/api/email-os/final/ai/status")
    ])
    setReadiness(r.data || r)
    setSecurity(s.data || s)
    setAi(a.data || a)
  }

  async function runFinalOps() {
    setStatus("Running final operational pass...")
    await api("/api/email-os/final/reliability/run", { method: "POST" })
    await api("/api/email-os/final/threading/repair", { method: "POST" })
    await api("/api/email-os/final/spam/evaluate", { method: "POST" })
    await api("/api/email-os/final/security/enforce", { method: "POST", body: JSON.stringify({ roleKey: "operations", resource: "thread", action: "read" }) })
    await api("/api/email-os/final/ai/draft-reply", { method: "POST", body: JSON.stringify({ subject: "Final readiness test", riskLevel: "normal" }) })
    setStatus("Final operational pass completed")
    await load()
  }

  useEffect(() => { load() }, [])

  const cards = [
    ["Readiness", readiness?.status || "checking", CheckCircle2],
    ["Security", security?.status || "checking", ShieldCheck],
    ["AI", ai?.enabled ? "configured" : "scaffold", Brain],
    ["Email Reliability", "foundation", MailCheck],
    ["UX", "consolidated", Sparkles]
  ] as const

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-slate-950 p-3 text-white">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-950">Email-OS Final Command Center</h1>
              <p className="text-sm text-slate-500">{status}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={load} className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-bold hover:bg-slate-50">
              <RefreshCw className="h-4 w-4" /> Refresh
            </button>
            <button onClick={runFinalOps} className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl bg-slate-950 px-3 text-sm font-bold text-white">
              <Zap className="h-4 w-4" /> Run final ops
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-5">
          {cards.map(([label, value, Icon]) => (
            <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <Icon className="h-5 w-5 text-slate-400" />
              <div className="mt-3 text-lg font-black text-slate-950">{value}</div>
              <div className="mt-1 text-xs font-black uppercase text-slate-400">{label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-black text-slate-950">Unified Email-OS Navigation</h2>
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {EMAIL_OS_FINAL_NAVIGATION.map((item) => (
              <Link key={item.href} href={item.href} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 hover:bg-white hover:shadow-sm">
                <div className="font-black text-slate-950">{item.label}</div>
                <div className="mt-1 text-xs font-black uppercase text-slate-400">{item.group}</div>
              </Link>
            ))}
          </div>
        </div>
        <FinalLiveOperationsWidget />
      </div>
    </section>
  )
}
