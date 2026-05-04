"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  FileText,
  ImagePlus,
  Layers3,
  Megaphone,
  Save,
  Target,
  UserCheck,
} from "lucide-react"
import {
  channels,
  contentTypeLabels,
  creators,
  defaultServices,
  targets,
  type ContentPriority,
  type ContentType,
  type ContentWorkspaceItem,
  type ServiceOption,
} from "@/lib/market-os/content-workspace"

const STORAGE_KEY = "market-os-content-items"
const ENABLE_DEMO_CONTENT = false

function cn(...v: Array<string | false | null | undefined>) {
  return v.filter(Boolean).join(" ")
}

const input =
  "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none placeholder:text-slate-400 focus:border-pink-400 focus:ring-4 focus:ring-pink-50"
const button =
  "inline-flex items-center justify-center rounded-2xl px-4 py-3 text-sm font-black transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="space-y-1.5">
      <span className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-600">{label}</span>
      {children}
      {hint ? <span className="block text-xs font-bold text-slate-500">{hint}</span> : null}
    </label>
  )
}

const emptyForm = {
  title: "",
  content_type: "post" as ContentType,
  service_id: "",
  service_name: "",
  creator: "Content Officer",
  asset_url: "",
  stage: "planned" as const,
  priority: "normal" as ContentPriority,
  channel: "Meta",
  target: "Parents B2C",
  deadline: "",
  objective: "",
  output_notes: "",
  review_notes: "",
}

function saveLocalTask(item: ContentWorkspaceItem) {
  if (typeof window === "undefined") return
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    const current = saved ? JSON.parse(saved) : []
    const list = Array.isArray(current) ? current : []
    const exists = list.some((x: ContentWorkspaceItem) => x.id === item.id)
    const next = exists ? list.map((x: ContentWorkspaceItem) => (x.id === item.id ? item : x)) : [item, ...list]
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {}
}

export default function ContentCreatePage() {
  const [services, setServices] = useState<ServiceOption[]>(defaultServices)
  const [form, setForm] = useState(emptyForm)
  const [busy, setBusy] = useState(false)
  const [createdId, setCreatedId] = useState("")
  const [message, setMessage] = useState("Build a complete AngelCare content task, then send it to the command center pipeline.")

  useEffect(() => {
    fetch("/api/market-os/content-workspace/services")
      .then((r) => r.json())
      .then((j) => Array.isArray(j.data) && setServices(j.data))
      .catch(() => {})
  }, [])

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }))
  }

  async function createItem() {
    if (!form.title.trim()) return setMessage("Title is required.")
    setBusy(true)
    setMessage("Creating content task...")

    const service = services.find((s) => s.id === form.service_id)
    const item: ContentWorkspaceItem = {
      ...form,
      id: `content-${Date.now()}`,
      service_name: service?.name || form.service_name || "Non lié",
      approval_status: "none",
      production_score: form.asset_url ? 45 : 25,
    }

    saveLocalTask(item)

    try {
      const res = await fetch("/api/market-os/content-workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      })
      const json = await res.json().catch(() => ({}))
      const id = json?.data?.id || item.id
      setCreatedId(id)
      setMessage("Content task created and synced.")
    } catch {
      setCreatedId(item.id)
      setMessage("Created locally. API sync was unavailable, but the task is saved in the command center.")
    } finally {
      setBusy(false)
    }
  }

  const completeness = Math.round(
    ([form.title, form.content_type, form.service_id || form.service_name, form.creator, form.channel, form.target, form.deadline, form.objective, form.output_notes, form.asset_url].filter(Boolean).length / 10) * 100,
  )

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#ffe4f0,transparent_30%),linear-gradient(180deg,#f8fafc,#eef2f7)] p-5 text-slate-950 md:p-8">
      <section className="mx-auto max-w-[1500px] space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/market-os/content-command-center" className={cn(button, "border border-slate-200 bg-white !text-slate-900 shadow-sm")}>
            <ArrowLeft className="mr-2 h-4 w-4 text-slate-900" /> Back to content center
          </Link>
          {createdId ? (
            <Link href={`/market-os/content-command-center/${createdId}`} className={cn(button, "bg-pink-600 !text-white shadow-lg shadow-pink-500/20")}>
              Open created task
            </Link>
          ) : null}
        </div>

        <header className="overflow-hidden rounded-[2.6rem] border border-slate-900 bg-[radial-gradient(circle_at_top_right,rgba(236,72,153,0.25),transparent_34%),linear-gradient(135deg,#020617,#0f172a_55%,#111827)] text-white shadow-2xl shadow-slate-950/25">
          <div className="grid gap-6 p-7 xl:grid-cols-[1.25fr_.75fr]">
            <div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full border border-pink-200 bg-pink-50 px-3 py-1 text-[11px] font-black uppercase tracking-wide !text-pink-700">New content task</span>
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-black uppercase tracking-wide !text-emerald-700">Production ready</span>
              </div>
              <h1 className="mt-5 text-4xl font-black tracking-tight !text-white drop-shadow-sm md:text-6xl">Create AngelCare content properly</h1>
              <p className="mt-4 max-w-4xl text-sm font-semibold leading-7 !text-white/85">{message}</p>
            </div>
            <div className="rounded-[2rem] border border-white/10 bg-white/10 p-5 shadow-xl shadow-black/10 backdrop-blur">
              <Target className="h-6 w-6 text-pink-200" />
              <p className="mt-4 text-xs font-black uppercase tracking-[0.2em] !text-white/75">Brief completeness</p>
              <p className="mt-1 text-5xl font-black !text-white">{completeness}%</p>
              <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/15">
                <div className="h-full rounded-full bg-pink-500" style={{ width: `${completeness}%` }} />
              </div>
            </div>
          </div>
        </header>

        <div className="grid gap-6 xl:grid-cols-[1fr_.75fr]">
          <section className="rounded-[2.2rem] border border-slate-200 bg-white p-6 text-slate-950 shadow-sm">
            <h2 className="flex items-center gap-2 text-xl font-black text-slate-950">
              <FileText className="h-5 w-5 text-pink-600" /> Content configuration
            </h2>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <Field label="Deliverable title">
                <input className={input} value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Ex: Brochure partenaire AngelCare" />
              </Field>
              <Field label="Content type">
                <select className={input} value={form.content_type} onChange={(e) => set("content_type", e.target.value as ContentType)}>
                  {Object.entries(contentTypeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </Field>
              <Field label="Service related to" hint="Preloaded from services module when API exists.">
                <select className={input} value={form.service_id || ""} onChange={(e) => set("service_id", e.target.value)}>
                  <option value="">Choose service from services module</option>
                  {services.map((s) => <option key={s.id} value={s.id}>{s.name}{s.category ? ` · ${s.category}` : ""}</option>)}
                </select>
              </Field>
              <Field label="Assign creator">
                <select className={input} value={form.creator || ""} onChange={(e) => set("creator", e.target.value)}>
                  {creators.map((x) => <option key={x}>{x}</option>)}
                </select>
              </Field>
              <Field label="Channel">
                <select className={input} value={form.channel} onChange={(e) => set("channel", e.target.value)}>
                  {channels.map((x) => <option key={x}>{x}</option>)}
                </select>
              </Field>
              <Field label="Target">
                <select className={input} value={form.target} onChange={(e) => set("target", e.target.value)}>
                  {targets.map((x) => <option key={x}>{x}</option>)}
                </select>
              </Field>
              <Field label="Priority">
                <select className={input} value={form.priority} onChange={(e) => set("priority", e.target.value as ContentPriority)}>
                  {["urgent", "high", "normal", "low"].map((x) => <option key={x}>{x}</option>)}
                </select>
              </Field>
              <Field label="Deadline">
                <input className={input} value={form.deadline || ""} onChange={(e) => set("deadline", e.target.value)} placeholder="Today 18:00" />
              </Field>
            </div>

            <div className="mt-5 grid gap-4">
              <Field label="Mission / objective">
                <textarea className={cn(input, "min-h-[120px]")} value={form.objective} onChange={(e) => set("objective", e.target.value)} placeholder="What should this content achieve?" />
              </Field>
              <Field label="Production notes / script / visual direction">
                <textarea className={cn(input, "min-h-[150px]")} value={form.output_notes} onChange={(e) => set("output_notes", e.target.value)} placeholder="Hook, CTA, visual direction, caption, newsletter structure..." />
              </Field>
              <Field label="Attach asset URL">
                <input className={input} value={form.asset_url || ""} onChange={(e) => set("asset_url", e.target.value)} placeholder="Canva / Drive / video / image link" />
              </Field>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button disabled={busy || !form.title.trim()} onClick={createItem} className={cn(button, "bg-slate-950 !text-white")}>
                <Save className="mr-2 h-4 w-4 text-white" /> Create & sync task
              </button>
              <Link href="/market-os/content-command-center" className={cn(button, "border border-slate-200 bg-white !text-slate-900")}>
                Cancel
              </Link>
            </div>
          </section>

          <aside className="space-y-6">
            <section className="rounded-[2.2rem] border border-slate-200 bg-white p-6 text-slate-950 shadow-sm">
              <h2 className="flex items-center gap-2 text-xl font-black text-slate-950">
                <Layers3 className="h-5 w-5 text-pink-600" /> Production readiness
              </h2>
              <div className="mt-5 space-y-3">
                {[
                  ["Title", !!form.title],
                  ["Service linked", !!form.service_id],
                  ["Creator assigned", !!form.creator],
                  ["Objective written", !!form.objective],
                  ["Asset attached", !!form.asset_url],
                ].map(([label, ok]: any) => (
                  <div key={label} className="flex items-center justify-between rounded-2xl bg-slate-50 p-3 text-sm font-bold text-slate-700">
                    <span>{label}</span>
                    <CheckCircle2 className={cn("h-4 w-4", ok ? "text-emerald-600" : "text-slate-300")} />
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[2.2rem] border border-slate-900 bg-[radial-gradient(circle_at_top_right,rgba(236,72,153,0.22),transparent_35%),linear-gradient(145deg,#020617,#0f172a)] p-6 text-white shadow-xl">
              <h2 className="flex items-center gap-2 text-xl font-black !text-white">
                <Megaphone className="h-5 w-5 text-pink-300" /> Live production preview
              </h2>
              <div className="mt-5 space-y-3 text-sm font-bold">
                <div className="rounded-2xl bg-white/10 p-4 !text-white"><FileText className="mb-2 h-4 w-4 text-pink-200" />{form.title || "Untitled content"}</div>
                <div className="rounded-2xl bg-white/10 p-4 !text-white"><UserCheck className="mb-2 h-4 w-4 text-pink-200" />{form.creator}</div>
                <div className="rounded-2xl bg-white/10 p-4 !text-white"><CalendarDays className="mb-2 h-4 w-4 text-pink-200" />{form.deadline || "No deadline"}</div>
                <div className="rounded-2xl bg-white/10 p-4 !text-white"><ImagePlus className="mb-2 h-4 w-4 text-pink-200" />{form.asset_url ? "Asset attached" : "Asset waiting"}</div>
              </div>
            </section>
          </aside>
        </div>
      </section>
    </main>
  )
}