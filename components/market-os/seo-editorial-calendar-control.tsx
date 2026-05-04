"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import {
  Activity,
  AlertTriangle,
  Archive,
  ArrowLeft,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  Filter,
  Globe,
  LayoutGrid,
  Link2,
  ListChecks,
  Megaphone,
  PlayCircle,
  Plus,
  RefreshCw,
  Search,
  Send,
  Sparkles,
  Target,
  Trash2,
  UserCheck,
  Wand2,
  XCircle,
} from "lucide-react"
import {
  calcConv,
  calcRead,
  calcSeo,
  deleteSeoItem,
  loadSeoItems,
  persistSeoItems,
  SEO_AUDIENCES,
  SEO_MARKETS,
  SEO_STATUS_LABELS,
  SEO_STATUSES,
  SEO_TYPES,
  type SeoItem,
  type SeoStatus,
} from "./seo-blog-workspace-lib"

function cn(...v: Array<string | false | null | undefined>) {
  return v.filter(Boolean).join(" ")
}

const button = "inline-flex items-center justify-center rounded-2xl px-4 py-3 text-sm font-black transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
const input = "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none placeholder:text-slate-400 focus:border-pink-400 focus:ring-4 focus:ring-pink-50"

function Badge({ children, tone = "slate" }: { children: React.ReactNode; tone?: "slate" | "pink" | "green" | "amber" | "red" | "violet" | "blue" | "dark" }) {
  const m = {
    slate: "bg-slate-100 text-slate-700 border-slate-200",
    pink: "bg-pink-50 text-pink-700 border-pink-200",
    green: "bg-emerald-50 text-emerald-700 border-emerald-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    red: "bg-red-50 text-red-700 border-red-200",
    violet: "bg-violet-50 text-violet-700 border-violet-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    dark: "bg-slate-900 text-white border-slate-800",
  }
  return <span className={cn("rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-wide", m[tone])}>{children}</span>
}

function statusTone(s: SeoStatus) {
  return s === "published" || s === "approved" ? "green" : s === "rejected" ? "red" : s === "review" ? "violet" : s === "writing" ? "amber" : s === "archived" ? "dark" : "slate"
}

function priorityTone(p: string) {
  return p === "urgent" ? "red" : p === "high" ? "amber" : p === "normal" ? "blue" : "slate"
}

function Metric({ label, value, icon: Icon, sub }: { label: string; value: string | number; icon: any; sub: string }) {
  return (
    <div className="rounded-[1.7rem] border border-white/10 bg-white/10 p-5 shadow-xl backdrop-blur">
      <Icon className="h-5 w-5 text-pink-200" />
      <p className="mt-4 text-[11px] font-black uppercase tracking-[0.2em]" style={{ color: "rgba(255,255,255,.75)" }}>{label}</p>
      <p className="mt-1 text-3xl font-black" style={{ color: "#fff" }}>{value}</p>
      <p className="mt-1 text-xs font-bold" style={{ color: "rgba(255,255,255,.65)" }}>{sub}</p>
    </div>
  )
}

function Panel({ title, subtitle, icon: Icon, children, dark = false }: { title: string; subtitle?: string; icon: any; children: React.ReactNode; dark?: boolean }) {
  return (
    <section className={cn("rounded-[2rem] border p-5 shadow-sm", dark ? "border-slate-800 bg-slate-950 text-white" : "border-slate-200 bg-white text-slate-950")}>
      <h2 className={cn("flex items-center gap-2 text-lg font-black", dark ? "text-white" : "text-slate-950")}>
        <Icon className={cn("h-5 w-5", dark ? "text-pink-300" : "text-pink-600")} />
        {title}
      </h2>
      {subtitle ? <p className={cn("mt-1 text-sm font-semibold", dark ? "text-white/70" : "text-slate-500")}>{subtitle}</p> : null}
      <div className="mt-5">{children}</div>
    </section>
  )
}

function getBucket(item: SeoItem) {
  const d = (item.deadline || "").toLowerCase()
  if (d.includes("today")) return "Today"
  if (d.includes("week")) return "This week"
  if (d.includes("month")) return "This month"
  if (!d) return "Unscheduled"
  return "Scheduled"
}

export default function SeoEditorialCalendarControl() {
  const [items, setItems] = useState<SeoItem[]>([])
  const [selected, setSelected] = useState<SeoItem | null>(null)
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState<SeoStatus | "all">("all")
  const [market, setMarket] = useState("all")
  const [audience, setAudience] = useState("all")
  const [bucket, setBucket] = useState("all")
  const [message, setMessage] = useState("Editorial calendar control room ready.")

  useEffect(() => {
    const loaded = loadSeoItems()
    setItems(loaded)
    setSelected(loaded[0] || null)
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return items.filter((i) => {
      const qOk = !q || [i.title, i.primary_keyword, i.service_name, i.owner, i.market, i.audience, i.deadline].filter(Boolean).join(" ").toLowerCase().includes(q)
      const sOk = status === "all" || i.status === status
      const mOk = market === "all" || i.market === market
      const aOk = audience === "all" || i.audience === audience
      const bOk = bucket === "all" || getBucket(i) === bucket
      return qOk && sOk && mOk && aOk && bOk
    })
  }, [items, query, status, market, audience, bucket])

  const stats = useMemo(() => {
    const avgSeo = Math.round(items.reduce((s, i) => s + (i.seo_score || 0), 0) / Math.max(1, items.length))
    const overdue = items.filter((i) => i.deadline && i.status !== "published" && i.status !== "archived").length
    return {
      total: items.length,
      scheduled: items.filter((i) => !!i.deadline).length,
      review: items.filter((i) => i.status === "review").length,
      published: items.filter((i) => i.status === "published").length,
      overdue,
      avgSeo,
    }
  }, [items])

  function sync(next: SeoItem[], msg: string) {
    setItems(next)
    persistSeoItems(next)
    setSelected((current) => current ? next.find((x) => x.id === current.id) || next[0] || null : next[0] || null)
    setMessage(msg)
  }

  function patch(id: string, patch: Partial<SeoItem>, msg: string) {
    const next = items.map((item) => {
      if (item.id !== id) return item
      const merged = { ...item, ...patch, updated_at: new Date().toISOString() }
      return { ...merged, seo_score: calcSeo(merged), readability_score: calcRead(merged), conversion_score: calcConv(merged) }
    })
    sync(next, msg)
    fetch("/api/market-os/seo-blog-workspace/action", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, ...patch }) }).catch(() => {})
  }

  function bulk(status: SeoStatus) {
    if (!filtered.length) return setMessage("No filtered SEO tasks to update.")
    const ids = new Set(filtered.map((x) => x.id))
    const next = items.map((item) => ids.has(item.id) ? { ...item, status, approval_status: status, updated_at: new Date().toISOString() } : item)
    sync(next, `${filtered.length} filtered tasks moved to ${SEO_STATUS_LABELS[status]}.`)
  }

  function smartReschedule() {
    const next = items.map((item, index) => {
      if (item.status === "published" || item.status === "archived") return item
      const label = index % 3 === 0 ? "Today 18:00" : index % 3 === 1 ? "This week" : "This month"
      return { ...item, deadline: item.deadline || label }
    })
    sync(next, "Smart schedule applied to unscheduled active tasks.")
  }

  function deleteSelected() {
    if (!selected) return
    if (!window.confirm("Delete selected SEO/blog task permanently?")) return
    const next = deleteSeoItem(selected.id)
    setItems(next)
    setSelected(next[0] || null)
    setMessage("Selected SEO/blog task deleted.")
  }

  const buckets = ["all", "Today", "This week", "This month", "Scheduled", "Unscheduled"]

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#ffe4f0,transparent_30%),linear-gradient(180deg,#f8fafc,#eef2f7)] p-5 text-slate-950 md:p-8">
      <section className="mx-auto max-w-[1750px] space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/market-os/seo-blog-workspace" className={cn(button, "border border-slate-200 bg-white text-slate-950 shadow-sm")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to SEO workspace
          </Link>
          <div className="flex flex-wrap gap-2">
            <Link href="/market-os/seo-blog-workspace/create" className={cn(button, "bg-pink-600 text-white")}>
              <Plus className="mr-2 h-4 w-4" /> Create SEO task
            </Link>
            <button onClick={() => location.reload()} className={cn(button, "border border-slate-200 bg-white text-slate-900")}>
              <RefreshCw className="mr-2 h-4 w-4" /> Refresh
            </button>
          </div>
        </div>

        <header className="overflow-hidden rounded-[2.7rem] border border-slate-900 bg-[radial-gradient(circle_at_top_right,rgba(236,72,153,.30),transparent_34%),linear-gradient(135deg,#020617,#0f172a_55%,#111827)] text-white shadow-2xl">
          <div className="grid gap-6 p-7 xl:grid-cols-[1.35fr_.95fr]">
            <div>
              <div className="flex flex-wrap gap-2">
                <Badge tone="pink">SEO editorial calendar</Badge>
                <Badge tone="violet">Production management</Badge>
                <Badge tone="green">Monitoring & control</Badge>
              </div>
              <h1 className="mt-5 text-4xl font-black tracking-tight md:text-6xl" style={{ color: "#fff" }}>
                Editorial Calendar & SEO Production Control Room
              </h1>
              <p className="mt-4 max-w-4xl text-sm font-semibold leading-7" style={{ color: "rgba(255,255,255,.85)" }}>
                Monitor active SEO production, control publishing readiness, manage deadlines, review pressure, production bottlenecks, ownership, market focus and editorial output flow.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <button onClick={() => bulk("review")} className={cn(button, "bg-violet-600 text-white")}><Send className="mr-2 h-4 w-4" /> Bulk submit review</button>
                <button onClick={() => bulk("approved")} className={cn(button, "bg-emerald-600 text-white")}><CheckCircle2 className="mr-2 h-4 w-4" /> Bulk approve</button>
                <button onClick={smartReschedule} className={cn(button, "bg-pink-600 text-white")}><Sparkles className="mr-2 h-4 w-4" /> Smart schedule</button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Metric label="Total tasks" value={stats.total} icon={FileText} sub="SEO workload" />
              <Metric label="Scheduled" value={stats.scheduled} icon={CalendarDays} sub="planned outputs" />
              <Metric label="Review queue" value={stats.review} icon={Send} sub="approval pressure" />
              <Metric label="SEO health" value={`${stats.avgSeo}%`} icon={BarChart3} sub="average readiness" />
            </div>
          </div>
        </header>

        <div className="grid gap-5 xl:grid-cols-[.78fr_1.45fr_.86fr]">
          <aside className="space-y-5">
            <Panel title="1. Filters & production segmentation" subtitle="Control work by status, market, audience, deadline bucket and search." icon={Filter}>
              <div className="space-y-3">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
                  <input className={cn(input, "pl-10")} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search editorial work..." />
                </div>
                <select className={input} value={status} onChange={(e) => setStatus(e.target.value as any)}>
                  <option value="all">All statuses</option>
                  {SEO_STATUSES.map((s) => <option key={s} value={s}>{SEO_STATUS_LABELS[s]}</option>)}
                </select>
                <select className={input} value={market} onChange={(e) => setMarket(e.target.value)}>
                  <option value="all">All markets</option>
                  {SEO_MARKETS.map((x) => <option key={x}>{x}</option>)}
                </select>
                <select className={input} value={audience} onChange={(e) => setAudience(e.target.value)}>
                  <option value="all">All audiences</option>
                  {SEO_AUDIENCES.map((x) => <option key={x}>{x}</option>)}
                </select>
                <select className={input} value={bucket} onChange={(e) => setBucket(e.target.value)}>
                  {buckets.map((x) => <option key={x}>{x}</option>)}
                </select>
              </div>
            </Panel>

            <Panel title="2. Production cockpit actions" subtitle={message} icon={Wand2} dark>
              <div className="grid gap-2">
                <button onClick={() => bulk("writing")} className={cn(button, "justify-start border border-white/10 bg-white/10 text-white hover:bg-white/15")}><FileText className="mr-2 h-4 w-4 text-pink-200" /> Move filtered to writing</button>
                <button onClick={() => bulk("review")} className={cn(button, "justify-start border border-white/10 bg-white/10 text-white hover:bg-white/15")}><Send className="mr-2 h-4 w-4 text-pink-200" /> Move filtered to review</button>
                <button onClick={() => bulk("published")} className={cn(button, "justify-start border border-white/10 bg-white/10 text-white hover:bg-white/15")}><PlayCircle className="mr-2 h-4 w-4 text-pink-200" /> Publish filtered</button>
                <button onClick={() => bulk("archived")} className={cn(button, "justify-start border border-white/10 bg-white/10 text-white hover:bg-white/15")}><Archive className="mr-2 h-4 w-4 text-pink-200" /> Archive filtered</button>
              </div>
            </Panel>

            <Panel title="3. Risk & bottleneck watch" subtitle="Shows what needs manager attention." icon={AlertTriangle}>
              <div className="space-y-3">
                {[
                  ["Missing deadline", items.filter((i) => !i.deadline && i.status !== "published").length, "amber"],
                  ["Missing keyword", items.filter((i) => !i.primary_keyword).length, "red"],
                  ["Missing meta", items.filter((i) => !i.meta_title || !i.meta_description).length, "amber"],
                  ["Ready to publish", items.filter((i) => i.status === "approved").length, "green"],
                ].map(([label, value, tone]: any) => (
                  <div key={label} className="flex items-center justify-between rounded-2xl bg-slate-50 p-3">
                    <span className="text-sm font-black text-slate-700">{label}</span>
                    <Badge tone={tone}>{value}</Badge>
                  </div>
                ))}
              </div>
            </Panel>
          </aside>

          <section className="space-y-5">
            <Panel title="4. Editorial calendar board" subtitle={`${filtered.length} visible SEO/blog outputs.`} icon={CalendarDays}>
              <div className="grid gap-4 md:grid-cols-3">
                {["Today", "This week", "This month", "Scheduled", "Unscheduled", "Published"].map((col) => {
                  const list = filtered.filter((item) => col === "Published" ? item.status === "published" : getBucket(item) === col)
                  return (
                    <div key={col} className="rounded-[1.7rem] border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-black text-slate-950">{col}</h3>
                        <Badge tone="pink">{list.length}</Badge>
                      </div>
                      <div className="mt-4 space-y-3">
                        {list.map((item) => (
                          <article key={item.id} onClick={() => setSelected(item)} className={cn("cursor-pointer rounded-2xl border bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-lg", selected?.id === item.id ? "border-pink-300 ring-4 ring-pink-50" : "border-slate-200")}>
                            <div className="flex flex-wrap gap-2">
                              <Badge tone={statusTone(item.status)}>{SEO_STATUS_LABELS[item.status]}</Badge>
                              <Badge tone={priorityTone(item.priority)}>{item.priority}</Badge>
                            </div>
                            <h4 className="mt-3 line-clamp-2 text-sm font-black text-slate-950">{item.title || "Untitled"}</h4>
                            <p className="mt-1 line-clamp-1 text-xs font-bold text-slate-500">{item.primary_keyword || "No keyword"} · {item.owner}</p>
                            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                              <div className="h-full rounded-full bg-pink-500" style={{ width: `${Math.min(100, Math.max(0, item.seo_score || 0))}%` }} />
                            </div>
                          </article>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </Panel>

            <Panel title="5. Production table" subtitle="Fast operational control over all filtered SEO/blog work." icon={LayoutGrid}>
              <div className="overflow-hidden rounded-2xl border border-slate-200">
                <div className="grid grid-cols-[1.2fr_.7fr_.55fr_.55fr_.55fr] bg-slate-50 px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-500">
                  <span>Task</span><span>Keyword</span><span>Status</span><span>Score</span><span>Actions</span>
                </div>
                <div className="divide-y divide-slate-100">
                  {filtered.map((item) => (
                    <div key={item.id} className="grid grid-cols-[1.2fr_.7fr_.55fr_.55fr_.55fr] items-center gap-3 px-4 py-3 text-sm">
                      <div><p className="font-black text-slate-900">{item.title || "Untitled"}</p><p className="text-xs font-bold text-slate-500">{item.owner} · {item.deadline || "No deadline"}</p></div>
                      <p className="font-bold text-slate-600">{item.primary_keyword || "Missing"}</p>
                      <Badge tone={statusTone(item.status)}>{SEO_STATUS_LABELS[item.status]}</Badge>
                      <p className="font-black text-slate-900">{item.seo_score || 0}%</p>
                      <div className="flex gap-2">
                        <Link href={`/market-os/seo-blog-workspace/${item.id}`} className="rounded-xl border border-slate-200 bg-white p-2 text-slate-700"><Eye className="h-4 w-4" /></Link>
                        <button onClick={() => patch(item.id, { status: "review", approval_status: "submitted" }, "Task submitted to review.")} className="rounded-xl border border-violet-200 bg-violet-50 p-2 text-violet-700"><Send className="h-4 w-4" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Panel>
          </section>

          <aside className="space-y-5">
            <Panel title="6. Selected task control" subtitle="Operate the selected SEO/blog task." icon={Target}>
              {selected ? (
                <div className="space-y-4">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <Badge tone={statusTone(selected.status)}>{SEO_STATUS_LABELS[selected.status]}</Badge>
                      <Badge tone={priorityTone(selected.priority)}>{selected.priority}</Badge>
                    </div>
                    <h3 className="mt-3 text-xl font-black text-slate-950">{selected.title || "Untitled SEO task"}</h3>
                    <p className="mt-1 text-sm font-semibold text-slate-500">{selected.primary_keyword || "No keyword"} · {selected.market}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => patch(selected.id, { status: "review", approval_status: "submitted" }, "Submitted to review.")} className={cn(button, "bg-violet-600 text-white")}><Send className="mr-2 h-4 w-4" />Review</button>
                    <button onClick={() => patch(selected.id, { status: "approved", approval_status: "approved" }, "Approved.")} className={cn(button, "bg-emerald-600 text-white")}><CheckCircle2 className="mr-2 h-4 w-4" />Approve</button>
                    <button onClick={() => patch(selected.id, { status: "rejected", approval_status: "rejected" }, "Rejected.")} className={cn(button, "bg-red-600 text-white")}><XCircle className="mr-2 h-4 w-4" />Reject</button>
                    <button onClick={() => patch(selected.id, { status: "published", approval_status: "published" }, "Published.")} className={cn(button, "bg-slate-950 text-white")}><PlayCircle className="mr-2 h-4 w-4" />Publish</button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Link href={`/market-os/seo-blog-workspace/${selected.id}`} className={cn(button, "border border-slate-200 bg-white text-slate-900")}><Eye className="mr-2 h-4 w-4" />Open</Link>
                    <button onClick={deleteSelected} className={cn(button, "border border-red-200 bg-red-50 text-red-700")}><Trash2 className="mr-2 h-4 w-4" />Delete</button>
                  </div>
                </div>
              ) : <p className="text-sm font-semibold text-slate-500">Select a task from the calendar or table.</p>}
            </Panel>

            <Panel title="7. Performance simulation" subtitle="Readiness signals for publication governance." icon={BarChart3}>
              {selected ? (
                <div className="space-y-4">
                  {[["SEO", selected.seo_score || 0], ["Readability", selected.readability_score || 0], ["Conversion", selected.conversion_score || 0]].map(([label, value]: any) => (
                    <div key={label}>
                      <div className="flex justify-between text-xs font-black uppercase tracking-widest text-slate-500"><span>{label}</span><span>{value}%</span></div>
                      <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-pink-500" style={{ width: `${value}%` }} /></div>
                    </div>
                  ))}
                </div>
              ) : null}
            </Panel>

            <Panel title="8. Live activity pulse" subtitle="Current operational state." icon={Activity}>
              <div className="space-y-3">
                {[
                  `Filtered tasks: ${filtered.length}`,
                  `Published outputs: ${stats.published}`,
                  `Review queue: ${stats.review}`,
                  `SEO health average: ${stats.avgSeo}%`,
                  `Deadline pressure: ${stats.overdue}`,
                ].map((x) => (
                  <div key={x} className="rounded-2xl bg-slate-50 p-3 text-sm font-bold text-slate-700">{x}</div>
                ))}
              </div>
            </Panel>
          </aside>
        </div>
      </section>
    </main>
  )
}
