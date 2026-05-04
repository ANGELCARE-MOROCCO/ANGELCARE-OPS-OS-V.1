"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { Archive, BarChart3, CalendarDays, CheckCircle2, Eye, FileText, Filter, Globe, Link2, PauseCircle, PlayCircle, Plus, Search, Send, Sparkles, Target, Trash2, Wand2, XCircle } from "lucide-react"
import { calcConv, calcRead, calcSeo, deleteSeoItem, loadSeoItems, persistSeoItems, SEO_STATUS_LABELS, SEO_STATUSES, SEO_TYPES, type SeoItem, type SeoStatus } from "./seo-blog-workspace-lib"

function cn(...v: Array<string | false | null | undefined>) { return v.filter(Boolean).join(" ") }
const button = "inline-flex items-center justify-center rounded-2xl px-4 py-3 text-sm font-black transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
const input = "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none placeholder:text-slate-400 focus:border-pink-400 focus:ring-4 focus:ring-pink-50"

function Badge({ children, tone = "slate" }: { children: React.ReactNode; tone?: "slate" | "pink" | "green" | "amber" | "red" | "violet" | "blue" | "dark" }) {
  const m = { slate: "bg-slate-100 text-slate-700 border-slate-200", pink: "bg-pink-50 text-pink-700 border-pink-200", green: "bg-emerald-50 text-emerald-700 border-emerald-200", amber: "bg-amber-50 text-amber-700 border-amber-200", red: "bg-red-50 text-red-700 border-red-200", violet: "bg-violet-50 text-violet-700 border-violet-200", blue: "bg-blue-50 text-blue-700 border-blue-200", dark: "bg-slate-900 text-white border-slate-800" }
  return <span className={cn("rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-wide", m[tone])}>{children}</span>
}
function statusTone(s: SeoStatus) { return s === "published" || s === "approved" ? "green" : s === "rejected" ? "red" : s === "review" ? "violet" : s === "writing" ? "amber" : s === "archived" ? "dark" : "slate" }
function priorityTone(p: string) { return p === "urgent" ? "red" : p === "high" ? "amber" : p === "normal" ? "blue" : "slate" }

function Metric({ label, value, icon: Icon, sub }: { label: string; value: string | number; icon: any; sub: string }) {
  return <div className="rounded-[1.7rem] border border-white/10 bg-white/10 p-5 shadow-xl backdrop-blur"><Icon className="h-5 w-5 text-pink-200" /><p className="mt-4 text-[11px] font-black uppercase tracking-[0.2em]" style={{ color: "rgba(255,255,255,.75)" }}>{label}</p><p className="mt-1 text-3xl font-black" style={{ color: "#fff" }}>{value}</p><p className="mt-1 text-xs font-bold" style={{ color: "rgba(255,255,255,.65)" }}>{sub}</p></div>
}
function Panel({ title, subtitle, icon: Icon, children, dark = false }: { title: string; subtitle?: string; icon: any; children: React.ReactNode; dark?: boolean }) {
  return <section className={cn("rounded-[2rem] border p-5 shadow-sm", dark ? "border-slate-800 bg-slate-950 text-white" : "border-slate-200 bg-white text-slate-950")}><h2 className={cn("flex items-center gap-2 text-lg font-black", dark ? "text-white" : "text-slate-950")}><Icon className={cn("h-5 w-5", dark ? "text-pink-300" : "text-pink-600")} />{title}</h2>{subtitle ? <p className={cn("mt-1 text-sm font-semibold", dark ? "text-white/70" : "text-slate-500")}>{subtitle}</p> : null}<div className="mt-5">{children}</div></section>
}

export default function SeoBlogWorkspace() {
  const [items, setItems] = useState<SeoItem[]>([])
  const [selected, setSelected] = useState<SeoItem | null>(null)
  const [filter, setFilter] = useState<SeoStatus | "all">("all")
  const [query, setQuery] = useState("")
  const [message, setMessage] = useState("SEO / Blog workspace ready.")
  const [busy, setBusy] = useState(false)

  useEffect(() => { const loaded = loadSeoItems(); setItems(loaded); setSelected(loaded[0] || null) }, [])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return items.filter((item) => {
      const statusMatch = filter === "all" ? true : item.status === filter
      const queryMatch = !q || [item.title, item.primary_keyword, item.service_name, item.owner, item.audience, item.market].filter(Boolean).join(" ").toLowerCase().includes(q)
      return statusMatch && queryMatch
    })
  }, [items, filter, query])

  const stats = useMemo(() => ({ total: items.length, review: items.filter((i) => i.status === "review").length, published: items.filter((i) => i.status === "published").length, avgSeo: Math.round(items.reduce((s, i) => s + (i.seo_score || 0), 0) / Math.max(1, items.length)) }), [items])

  function patchItem(id: string, patch: Partial<SeoItem>, action = "update") {
    setBusy(true)
    const next = items.map((item) => {
      if (item.id !== id) return item
      const merged = { ...item, ...patch, updated_at: new Date().toISOString() }
      return { ...merged, seo_score: calcSeo(merged), readability_score: calcRead(merged), conversion_score: calcConv(merged) }
    })
    setItems(next); persistSeoItems(next); setSelected(next.find((x) => x.id === id) || null); setMessage(`${action} synced.`)
    fetch("/api/market-os/seo-blog-workspace/action", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, action, ...patch }) }).catch(() => {})
    setBusy(false)
  }
  function runStatus(status: SeoStatus, item = selected) { if (item) patchItem(item.id, { status, approval_status: status }, status) }
  function deleteItem(item = selected) { if (!item) return; if (!window.confirm("Delete this SEO/blog task permanently?")) return; const next = deleteSeoItem(item.id); setItems(next); setSelected(next[0] || null); setMessage("SEO/blog task deleted permanently.") }
  function smartTool(kind: "brief" | "outline" | "meta" | "links" | "intent") {
    if (!selected) { setMessage("Select an SEO/blog task first."); return }
    const map = {
      brief: `SEO BRIEF\nAudience: ${selected.audience}\nMarket: ${selected.market}\nService: ${selected.service_name || "AngelCare service"}\nKeyword: ${selected.primary_keyword || "Define keyword"}\nGoal: rank, build trust and convert.`,
      outline: `H1: ${selected.title || "Article title"}\nH2: Problem and search intent\nH2: AngelCare solution\nH2: Benefits and trust proof\nH2: FAQ\nH2: CTA`,
      meta: `Découvrez une solution AngelCare fiable, humaine et organisée. Contactez-nous pour une orientation rapide.`,
      links: `/services\n/contact\n/testimonials\n/blog\n/relevant-service`,
      intent: `User wants practical, trustworthy information and a clear next step. Answer fast, show proof, and add WhatsApp/contact CTA.`,
    }
    if (kind === "brief") patchItem(selected.id, { outline: `${selected.outline}\n\n${map.brief}`.trim() }, "smart brief")
    if (kind === "outline") patchItem(selected.id, { outline: `${selected.outline}\n\n${map.outline}`.trim() }, "smart outline")
    if (kind === "meta") patchItem(selected.id, { meta_title: selected.meta_title || `${selected.title} | AngelCare`, meta_description: selected.meta_description || map.meta }, "smart meta")
    if (kind === "links") patchItem(selected.id, { internal_links: `${selected.internal_links}\n\n${map.links}`.trim() }, "smart links")
    if (kind === "intent") patchItem(selected.id, { search_intent: selected.search_intent || map.intent }, "smart intent")
  }

  return <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#ffe4f0,transparent_30%),linear-gradient(180deg,#f8fafc,#eef2f7)] p-5 text-slate-950 md:p-8"><section className="mx-auto max-w-[1700px] space-y-6">
    <header className="overflow-hidden rounded-[2.6rem] bg-slate-950 text-white shadow-2xl"><div className="relative grid gap-7 p-7 xl:grid-cols-[1.35fr_.9fr]"><div className="absolute right-0 top-0 h-80 w-80 rounded-full bg-pink-500/25 blur-3xl" /><div className="relative z-10"><div className="flex flex-wrap gap-2"><Badge tone="pink">MARKET-OS</Badge><Badge tone="violet">SEO / Blog workplace</Badge><Badge tone="green">Rank → Trust → Convert</Badge></div><h1 className="mt-5 max-w-5xl text-4xl font-black tracking-tight md:text-6xl" style={{ color: "#fff" }}>SEO / Blog Growth Operating Room</h1><p className="mt-4 max-w-4xl text-sm font-semibold leading-7" style={{ color: "rgba(255,255,255,.85)" }}>Operate SEO strategy, editorial production, metadata, keyword targeting, internal linking, review flow, publishing readiness and conversion signals from one premium workspace.</p><div className="mt-6 flex flex-wrap gap-3"><Link href="/market-os/seo-blog-workspace/create" className={cn(button, "bg-pink-500 text-white shadow-lg shadow-pink-500/20")}><Plus className="mr-2 h-4 w-4" />Create SEO / blog task</Link><Link href="/market-os/seo-blog-workspace/calendar" className={cn(button, "border border-white/15 bg-white/10 text-white")}><CalendarDays className="mr-2 h-4 w-4" />Editorial calendar</Link><button onClick={() => setFilter("review")} className={cn(button, "border border-white/15 bg-white/10 text-white")}><Send className="mr-2 h-4 w-4" />Review queue</button><button onClick={() => setFilter("published")} className={cn(button, "border border-white/15 bg-white/10 text-white")}><PlayCircle className="mr-2 h-4 w-4" />Published</button></div></div><div className="relative z-10 grid grid-cols-2 gap-3"><Metric label="Tasks" value={stats.total} icon={FileText} sub="SEO content load" /><Metric label="Review" value={stats.review} icon={Send} sub="approval queue" /><Metric label="Published" value={stats.published} icon={Globe} sub="live articles/pages" /><Metric label="SEO score" value={`${stats.avgSeo}%`} icon={BarChart3} sub="average readiness" /></div></div></header>

    <div className="grid gap-4 md:grid-cols-4">
      {[
        ["Keyword focus", selected?.primary_keyword || "Select task", Target, "Primary ranking target"],
        ["Market", selected?.market || "Global", Globe, "Geo SEO deployment"],
        ["Content type", selected ? SEO_TYPES[selected.content_type] : "None", FileText, "Production format"],
        ["Publish URL", selected?.publish_url ? "Attached" : "Missing", Link2, "Live output tracking"],
      ].map(([label, value, Icon, sub]: any) => (
        <div key={label} className="rounded-[1.7rem] border border-slate-200 bg-white p-5 shadow-sm">
          <Icon className="h-5 w-5 text-pink-600" />
          <p className="mt-4 text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">{label}</p>
          <p className="mt-1 truncate text-2xl font-black text-slate-950">{value}</p>
          <p className="mt-1 text-xs font-bold text-slate-500">{sub}</p>
        </div>
      ))}
    </div>

    <div className="grid gap-5 xl:grid-cols-[.75fr_1.45fr_.85fr]">
      <aside className="space-y-5"><Panel title="1. Navigation & creation" subtitle="Creation is handled in a focused page. No demo or static tasks are injected." icon={Plus}><Link href="/market-os/seo-blog-workspace/create" className={cn(button, "w-full bg-pink-600 text-white")}><Plus className="mr-2 h-4 w-4" />Create properly</Link></Panel><Panel title="2. Search & lifecycle filters" subtitle="Find work by keyword, service, owner, audience or market." icon={Search}><div className="relative"><Search className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-slate-400" /><input className={cn(input, "pl-10")} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search SEO/blog tasks..." /></div><div className="mt-3 flex flex-wrap gap-2"><button onClick={() => setFilter("all")} className={cn(button, filter === "all" ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-700")}>All</button>{SEO_STATUSES.map((s) => <button key={s} onClick={() => setFilter(s)} className={cn(button, filter === s ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-700")}>{SEO_STATUS_LABELS[s]}</button>)}</div></Panel><Panel title="3. Smart SEO tools" subtitle="All tools update the selected SEO task." icon={Sparkles} dark><div className="grid gap-2">{[["Generate SEO brief","brief"],["Build H1/H2 outline","outline"],["Generate meta","meta"],["Plan internal links","links"],["Analyze intent","intent"]].map(([label, kind]) => <button key={kind} onClick={() => smartTool(kind as any)} className={cn(button, "justify-start border border-white/10 bg-white/10 text-left text-white hover:bg-white/15")}><Wand2 className="mr-2 h-4 w-4 text-pink-200" />{label}</button>)}</div></Panel></aside>
      <section className="space-y-5"><Panel title="4. SEO content pipeline" subtitle={`${visible.length} visible tasks. Open any card for full editor/workshop.`} icon={Filter}>{visible.length === 0 ? <div className="rounded-[2rem] border border-dashed border-slate-300 bg-slate-50 p-8 text-center"><p className="text-lg font-black text-slate-800">No SEO/blog tasks yet.</p><p className="mt-2 text-sm font-semibold text-slate-500">Create your first real task. No generic demo tasks will appear automatically.</p><Link href="/market-os/seo-blog-workspace/create" className={cn(button, "mt-4 bg-pink-600 text-white")}>Create SEO / blog task</Link></div> : <div className="grid gap-4 lg:grid-cols-2">{visible.map((item) => <article key={item.id} onClick={() => setSelected(item)} className={cn("cursor-pointer rounded-[2rem] border bg-white p-5 text-slate-950 shadow-sm transition hover:-translate-y-1 hover:shadow-xl", selected?.id === item.id ? "border-pink-300 ring-4 ring-pink-50" : "border-slate-200")}><div className="flex items-start justify-between gap-3"><div><div className="flex flex-wrap gap-2"><Badge tone={priorityTone(item.priority)}>{item.priority}</Badge><Badge tone={statusTone(item.status)}>{SEO_STATUS_LABELS[item.status]}</Badge><Badge tone="pink">{SEO_TYPES[item.content_type]}</Badge></div><h3 className="mt-3 text-lg font-black leading-snug text-slate-950">{item.title || "Untitled SEO task"}</h3><p className="mt-1 text-sm font-semibold text-slate-500">{item.primary_keyword || "No keyword"} · {item.owner}</p></div><div className="rounded-2xl bg-pink-50 p-3 text-pink-600"><Target className="h-5 w-5" /></div></div><div className="mt-4 grid grid-cols-3 gap-2 text-xs font-bold text-slate-700"><div className="rounded-2xl bg-slate-50 p-3"><Globe className="mb-1 h-4 w-4 text-slate-500" />{item.market}</div><div className="rounded-2xl bg-slate-50 p-3"><Target className="mb-1 h-4 w-4 text-slate-500" />{item.audience}</div><div className="rounded-2xl bg-slate-50 p-3"><Link2 className="mb-1 h-4 w-4 text-slate-500" />{item.slug || "No slug"}</div></div><div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-pink-500" style={{ width: `${Math.min(100, Math.max(0, item.seo_score || 0))}%` }} /></div><div className="mt-4 flex flex-wrap gap-2"><Link onClick={(e) => e.stopPropagation()} href={`/market-os/seo-blog-workspace/${item.id}`} className={cn(button, "border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800")}><Eye className="mr-2 h-4 w-4" />Open editor</Link><button onClick={(e) => { e.stopPropagation(); patchItem(item.id, { status: "review", approval_status: "submitted" }, "submit review") }} className={cn(button, "border border-violet-200 bg-violet-50 px-3 py-2 text-xs text-violet-700")}><Send className="mr-2 h-4 w-4" />Review</button><button onClick={(e) => { e.stopPropagation(); patchItem(item.id, { status: "archived", approval_status: "archived" }, "archive") }} className={cn(button, "border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700")}><Archive className="mr-2 h-4 w-4" />Archive</button></div></article>)}</div>}</Panel><Panel title="5. Lifecycle command map" subtitle="Operational volume by SEO workflow stage." icon={Filter}><div className="grid gap-3 md:grid-cols-4">{SEO_STATUSES.map((s) => <button key={s} onClick={() => setFilter(s)} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left text-slate-900 transition hover:-translate-y-0.5 hover:bg-white"><Badge tone={statusTone(s)}>{SEO_STATUS_LABELS[s]}</Badge><p className="mt-3 text-2xl font-black">{items.filter((i) => i.status === s).length}</p><p className="text-xs font-bold text-slate-500">tasks</p></button>)}</div></Panel>
        <Panel title="6. Editorial calendar snapshot" subtitle="Operational scheduling view for SEO production." icon={Globe}>
          <div className="grid gap-3 md:grid-cols-3">
            {["Today", "This week", "This month"].map((bucket) => (
              <div key={bucket} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-black uppercase tracking-widest text-slate-500">{bucket}</p>
                <p className="mt-2 text-2xl font-black text-slate-950">
                  {items.filter((i) => i.deadline?.toLowerCase().includes(bucket.toLowerCase().split(" ")[0])).length}
                </p>
                <p className="text-xs font-bold text-slate-500">scheduled SEO outputs</p>
              </div>
            ))}
          </div>
        </Panel>
      </section>
      <aside className="space-y-5"><Panel title="7. Execution dock" subtitle={message} icon={Target}>{selected ? <div className="space-y-4"><div><div className="flex flex-wrap gap-2"><Badge tone={statusTone(selected.status)}>{SEO_STATUS_LABELS[selected.status]}</Badge><Badge tone={priorityTone(selected.priority)}>{selected.priority}</Badge></div><h3 className="mt-3 text-xl font-black text-slate-950">{selected.title || "Untitled SEO task"}</h3><p className="mt-1 text-sm font-semibold text-slate-500">{selected.primary_keyword || "No keyword"}</p></div><div className="grid grid-cols-2 gap-2"><button disabled={busy} onClick={() => runStatus("review")} className={cn(button, "bg-violet-600 text-white")}><Send className="mr-2 h-4 w-4" />Submit</button><button disabled={busy} onClick={() => runStatus("approved")} className={cn(button, "bg-emerald-600 text-white")}><CheckCircle2 className="mr-2 h-4 w-4" />Approve</button><button disabled={busy} onClick={() => runStatus("rejected")} className={cn(button, "bg-red-600 text-white")}><XCircle className="mr-2 h-4 w-4" />Reject</button><button disabled={busy} onClick={() => runStatus("published")} className={cn(button, "bg-slate-950 text-white")}><PlayCircle className="mr-2 h-4 w-4" />Publish</button><button disabled={busy} onClick={() => runStatus("archived")} className={cn(button, "border border-slate-200 bg-slate-100 text-slate-700")}><Archive className="mr-2 h-4 w-4" />Archive</button><button disabled={busy} onClick={() => runStatus("draft")} className={cn(button, "border border-blue-200 bg-blue-50 text-blue-700")}><PauseCircle className="mr-2 h-4 w-4" />Unpublish</button></div><div className="grid grid-cols-2 gap-2"><Link href={`/market-os/seo-blog-workspace/${selected.id}`} className={cn(button, "border border-slate-200 bg-white text-center text-slate-800")}><FileText className="mr-2 h-4 w-4" />Open editor</Link><button disabled={busy} onClick={() => deleteItem()} className={cn(button, "border border-red-200 bg-red-50 text-red-700")}><Trash2 className="mr-2 h-4 w-4" />Delete</button></div></div> : <p className="text-sm font-semibold text-slate-500">Select an SEO/blog task to execute.</p>}</Panel><Panel title="8. Selected SEO intelligence" subtitle="Live metadata and conversion readiness." icon={BarChart3}>{selected ? <div className="space-y-3"><div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-black uppercase tracking-widest text-slate-500">Meta title</p><p className="mt-2 text-sm font-semibold text-slate-700">{selected.meta_title || "Missing"}</p></div><div className="rounded-2xl bg-pink-50 p-4"><p className="text-xs font-black uppercase tracking-widest text-pink-700">Meta description</p><p className="mt-2 text-sm font-semibold text-slate-700">{selected.meta_description || "Missing"}</p></div><div className="grid grid-cols-3 gap-2 text-center"><div className="rounded-2xl bg-slate-50 p-3"><p className="text-lg font-black">{selected.seo_score || 0}%</p><p className="text-[10px] font-bold uppercase text-slate-500">SEO</p></div><div className="rounded-2xl bg-slate-50 p-3"><p className="text-lg font-black">{selected.readability_score || 0}%</p><p className="text-[10px] font-bold uppercase text-slate-500">Read</p></div><div className="rounded-2xl bg-slate-50 p-3"><p className="text-lg font-black">{selected.conversion_score || 0}%</p><p className="text-[10px] font-bold uppercase text-slate-500">CTA</p></div></div></div> : null}</Panel><Panel title="9. Publishing tracker" subtitle="Output health and operational pace." icon={Globe}><div className="space-y-4">{[["SEO readiness", stats.avgSeo], ["Published ratio", Math.round((stats.published / Math.max(1, stats.total)) * 100)], ["Review pressure", Math.round((stats.review / Math.max(1, stats.total)) * 100)]].map(([label, value]: any) => <div key={label}><div className="flex justify-between text-xs font-black uppercase tracking-widest text-slate-500"><span>{label}</span><span>{value}%</span></div><div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-pink-500" style={{ width: `${Math.min(100, Math.max(0, Number(value)))}%` }} /></div></div>)}</div></Panel></aside>
    </div>
  </section></main>
}
