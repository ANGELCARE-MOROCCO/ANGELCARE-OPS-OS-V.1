"use client"

import { useEffect, useState } from "react"
import { Activity, Brain, MailCheck, RefreshCw, ShieldCheck, Sparkles, Zap } from "lucide-react"

async function api(path: string, options?: RequestInit) {
  const res = await fetch(path, { ...options, headers: { "Content-Type": "application/json", ...(options?.headers || {}) } })
  return res.json()
}

export default function EnterpriseHardeningMegaPanel() {
  const [status, setStatus] = useState("Ready")
  const [audit, setAudit] = useState<any[]>([])

  async function loadAudit() {
    const result = await api("/api/email-os/security/audit-events")
    setAudit(result.data || [])
  }

  async function runReliability() {
    setStatus("Configuring reliability foundations...")
    await api("/api/email-os/reliability/smtp-retry-policy", { method: "POST", body: JSON.stringify({ policyName: "Enterprise Retry Policy" }) })
    await api("/api/email-os/reliability/spam-rules", { method: "POST", body: JSON.stringify({ ruleName: "Basic spam keyword flag", pattern: "spam" }) })
    await api("/api/email-os/realtime/publish", { method: "POST", body: JSON.stringify({ eventType: "reliability.configured", entityType: "system", payload: { phase: 28 } }) })
    setStatus("Reliability foundations configured")
  }

  async function runRealtime() {
    setStatus("Configuring realtime foundations...")
    await api("/api/email-os/realtime/channels", { method: "POST", body: JSON.stringify({ channelKey: "email-os.command", channelType: "command" }) })
    await api("/api/email-os/realtime/subscribe", { method: "POST", body: JSON.stringify({ channelKey: "email-os.command", subscriberKey: "operations-agent" }) })
    await api("/api/email-os/realtime/publish", { method: "POST", body: JSON.stringify({ eventType: "realtime.ready", entityType: "system" }) })
    setStatus("Realtime foundations configured")
  }

  async function runAI() {
    setStatus("Configuring AI foundations...")
    await api("/api/email-os/ai/memory", { method: "POST", body: JSON.stringify({ content: "Email-OS enterprise operational memory initialized.", memoryType: "system" }) })
    await api("/api/email-os/ai/workflow-plan", { method: "POST", body: JSON.stringify({ objective: "Resolve thread with safe AI-assisted workflow" }) })
    await api("/api/email-os/ai/copilot-action", { method: "POST", body: JSON.stringify({ actionType: "suggest_reply", payload: { mode: "review_required" } }) })
    setStatus("AI foundations configured")
  }

  async function runSecurity() {
    setStatus("Configuring security foundations...")
    await api("/api/email-os/security/rbac/seed", { method: "POST" })
    await api("/api/email-os/security/rbac/evaluate", { method: "POST", body: JSON.stringify({ roleKey: "operations", resource: "thread", action: "read" }) })
    await loadAudit()
    setStatus("Security foundations configured")
  }

  useEffect(() => { loadAudit() }, [])

  const cards = [
    ["Email Reliability", MailCheck],
    ["Realtime Infrastructure", Activity],
    ["AI Operations", Brain],
    ["Security Hardening", ShieldCheck],
    ["UX Maturity", Sparkles]
  ] as const

  return (
    <section className="space-y-5">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-slate-950 p-3 text-white">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-950">Enterprise Hardening Mega Center</h1>
              <p className="text-sm text-slate-500">{status}</p>
            </div>
          </div>
          <button onClick={loadAudit} className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-bold hover:bg-slate-50">
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-5">
          {cards.map(([label, Icon]) => (
            <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <Icon className="h-5 w-5 text-slate-500" />
              <div className="mt-3 text-sm font-black text-slate-950">{label}</div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <button onClick={runReliability} className="h-11 cursor-pointer rounded-2xl bg-slate-950 px-4 text-sm font-black text-white">Run Reliability</button>
          <button onClick={runRealtime} className="h-11 cursor-pointer rounded-2xl border border-slate-200 px-4 text-sm font-black">Run Realtime</button>
          <button onClick={runAI} className="h-11 cursor-pointer rounded-2xl border border-slate-200 px-4 text-sm font-black">Run AI</button>
          <button onClick={runSecurity} className="h-11 cursor-pointer rounded-2xl border border-slate-200 px-4 text-sm font-black">Run Security</button>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-black text-slate-950">Latest Security Audit</h2>
        <div className="mt-4 space-y-3">
          {audit.length === 0 ? <div className="text-sm font-bold text-slate-500">No security audit events yet.</div> : null}
          {audit.slice(0, 12).map((item) => (
            <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="font-black text-slate-950">{item.action} • {item.decision}</div>
              <div className="text-sm text-slate-500">{item.reason || item.resource}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
