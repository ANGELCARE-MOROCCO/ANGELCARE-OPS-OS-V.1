"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  Layers3,
  Link2,
  Plus,
  RefreshCw,
  ShieldCheck,
  Target,
  Zap,
} from "lucide-react"
import {
  buildAutoTaskPayload,
  contentTypeNames,
  defaultCampaignContentRequirements,
  missingOutputCount,
  syncScore,
  type CampaignContentRequirement,
  type CampaignSyncStatus,
} from "@/lib/market-os/content-campaign-sync"

function cn(...v: Array<string | false | null | undefined>) {
  return v.filter(Boolean).join(" ")
}

const button =
  "inline-flex items-center justify-center rounded-2xl px-4 py-3 text-sm font-black transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"

function tone(status: CampaignSyncStatus) {
  if (status === "critical") return "border-red-200 bg-red-50 text-red-700"
  if (status === "warning") return "border-amber-200 bg-amber-50 text-amber-700"
  return "border-emerald-200 bg-emerald-50 text-emerald-700"
}

function Badge({ children, status }: { children: React.ReactNode; status: CampaignSyncStatus }) {
  return <span className={cn("rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-wide", tone(status))}>{children}</span>
}

function Metric({ label, value, icon: Icon, sub }: { label: string; value: string | number; icon: any; sub: string }) {
  return (
    <div className="rounded-[1.7rem] border border-slate-200 bg-white p-5 shadow-sm">
      <Icon className="h-5 w-5 text-pink-600" />
      <p className="mt-4 text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-black text-slate-950">{value}</p>
      <p className="mt-1 text-xs font-bold text-slate-500">{sub}</p>
    </div>
  )
}

export default function ContentCampaignSyncEngine() {
  const [requirements, setRequirements] = useState<CampaignContentRequirement[]>(defaultCampaignContentRequirements)
  const [selected, setSelected] = useState<CampaignContentRequirement | null>(defaultCampaignContentRequirements[0])
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState("Campaign-content sync engine ready.")

  useEffect(() => {
    fetch("/api/market-os/content-campaign-sync")
      .then((r) => r.json())
      .then((j) => Array.isArray(j.data) && j.data.length && setRequirements(j.data))
      .catch(() => {})
  }, [])

  const stats = useMemo(() => {
    return {
      score: syncScore(requirements),
      missing: missingOutputCount(requirements),
      critical: requirements.filter((r) => r.status === "critical").length,
      warning: requirements.filter((r) => r.status === "warning").length,
    }
  }, [requirements])

  async function runAction(action: "generate_task" | "mark_synced" | "escalate", item = selected) {
    if (!item) return
    setBusy(true)
    setMessage(`Running ${action.replace("_", " ")}...`)

    try {
      const payload = action === "generate_task" ? buildAutoTaskPayload(item) : {}
      const res = await fetch("/api/market-os/content-campaign-sync/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, requirement_id: item.id, payload }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || "Action failed")
      setMessage(`${action.replace("_", " ")} completed.`)

      if (action === "generate_task") {
        window.location.href = `/market-os/content-command-center/create`
      }
    } catch (e: any) {
      setMessage(e?.message || "Action failed.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="space-y-6">
      <div className="rounded-[2.4rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-pink-200 bg-pink-50 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-pink-700">Content ↔ Campaign</span>
              <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-blue-700">Sync Engine</span>
            </div>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950">Campaign-driven content enforcement</h2>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-500">
              Detects missing campaign deliverables, creates required content tasks, monitors approval and publishing readiness, and highlights production risks.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button disabled={busy} onClick={() => location.reload()} className={cn(button, "border border-slate-200 bg-white text-slate-800")}>
              <RefreshCw className="mr-2 h-4 w-4" /> Refresh
            </button>
            <Link href="/market-os/content-command-center" className={cn(button, "bg-slate-950 text-white")}>
              <ArrowUpRight className="mr-2 h-4 w-4" /> Content center
            </Link>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <Metric label="Sync score" value={`${stats.score}%`} icon={BarChart3} sub="content-campaign coverage" />
          <Metric label="Missing outputs" value={stats.missing} icon={FileText} sub="tasks still required" />
          <Metric label="Critical risks" value={stats.critical} icon={AlertTriangle} sub="urgent management focus" />
          <Metric label="Warnings" value={stats.warning} icon={ClipboardCheck} sub="needs production follow-up" />
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
        <section className="rounded-[2.2rem] border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="flex items-center gap-2 text-xl font-black text-slate-950">
            <Layers3 className="h-5 w-5 text-pink-600" /> Campaign requirement board
          </h3>

          <div className="mt-5 grid gap-3">
            {requirements.map((item) => {
              const progress = Math.round((item.produced_count / Math.max(1, item.required_count)) * 100)
              return (
                <article
                  key={item.id}
                  onClick={() => setSelected(item)}
                  className={cn(
                    "cursor-pointer rounded-[1.8rem] border bg-white p-5 transition hover:-translate-y-1 hover:shadow-xl",
                    selected?.id === item.id ? "border-pink-300 ring-4 ring-pink-50" : "border-slate-200",
                  )}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap gap-2">
                        <Badge status={item.status}>{item.status}</Badge>
                        <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-slate-700">
                          {contentTypeNames[item.content_type]}
                        </span>
                      </div>
                      <h4 className="mt-3 text-lg font-black text-slate-950">{item.campaign_name}</h4>
                      <p className="mt-1 text-sm font-semibold text-slate-500">{item.service_name || "No service linked"} · {item.owner}</p>
                    </div>
                    <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-black text-slate-700">{item.deadline}</p>
                  </div>

                  <div className="mt-4 grid gap-2 md:grid-cols-4">
                    <div className="rounded-2xl bg-slate-50 p-3 text-sm font-black text-slate-700">Required: {item.required_count}</div>
                    <div className="rounded-2xl bg-slate-50 p-3 text-sm font-black text-slate-700">Produced: {item.produced_count}</div>
                    <div className="rounded-2xl bg-slate-50 p-3 text-sm font-black text-slate-700">Approved: {item.approved_count}</div>
                    <div className="rounded-2xl bg-slate-50 p-3 text-sm font-black text-slate-700">Published: {item.published_count}</div>
                  </div>

                  <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-pink-500" style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} />
                  </div>
                </article>
              )
            })}
          </div>
        </section>

        <aside className="space-y-5">
          <section className="rounded-[2.2rem] border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="flex items-center gap-2 text-xl font-black text-slate-950">
              <Zap className="h-5 w-5 text-pink-600" /> Sync action dock
            </h3>

            {selected ? (
              <div className="mt-5 space-y-4">
                <div>
                  <Badge status={selected.status}>{selected.status}</Badge>
                  <h4 className="mt-3 text-xl font-black text-slate-950">{selected.campaign_name}</h4>
                  <p className="mt-1 text-sm font-semibold text-slate-500">{selected.notes || "No notes."}</p>
                </div>

                <button disabled={busy} onClick={() => runAction("generate_task")} className={cn(button, "w-full bg-pink-600 text-white")}>
                  <Plus className="mr-2 h-4 w-4" /> Generate missing content task
                </button>
                <button disabled={busy} onClick={() => runAction("mark_synced")} className={cn(button, "w-full bg-emerald-600 text-white")}>
                  <CheckCircle2 className="mr-2 h-4 w-4" /> Mark sync reviewed
                </button>
                <button disabled={busy} onClick={() => runAction("escalate")} className={cn(button, "w-full bg-slate-950 text-white")}>
                  <ShieldCheck className="mr-2 h-4 w-4" /> Escalate to marketing manager
                </button>

                <p className="rounded-2xl bg-slate-50 p-4 text-sm font-bold text-slate-600">{message}</p>
              </div>
            ) : (
              <p className="mt-4 text-sm font-semibold text-slate-500">Select a requirement to operate.</p>
            )}
          </section>

          <section className="rounded-[2.2rem] border border-slate-200 bg-slate-950 p-5 text-white shadow-xl">
            <h3 className="flex items-center gap-2 text-xl font-black text-white">
              <Target className="h-5 w-5 text-pink-300" /> Governance rule
            </h3>
            <div className="mt-4 space-y-3 text-sm font-bold text-white/75">
              <p className="rounded-2xl bg-white/10 p-4">
                A campaign is not execution-ready until required content volume is produced, approved and published.
              </p>
              <p className="rounded-2xl bg-white/10 p-4">
                Critical items should trigger task creation and manager escalation.
              </p>
              <p className="rounded-2xl bg-white/10 p-4">
                Published outputs become inputs for KPI and ROI feedback loops.
              </p>
            </div>
          </section>
        </aside>
      </div>
    </section>
  )
}
