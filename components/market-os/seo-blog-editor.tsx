"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { Activity, ArrowLeft, BarChart3, CheckCircle2, FileText, Globe, Link2, ListChecks, MessageCircle, PlayCircle, Plus, Save, Send, Sparkles, Target, Trash2, Wand2, XCircle } from "lucide-react"
import { calcConv, calcRead, calcSeo, checklistKey, deleteSeoItem, emptySeoItem, eventsKey, loadChecklist, loadEvents, loadSeoItems, persistChecklist, persistEvents, SEO_OWNERS, SEO_STATUS_LABELS, SEO_TYPES, type SeoChecklistItem, type SeoEvent, type SeoItem, type SeoStatus, upsertSeoItem } from "./seo-blog-workspace-lib"

function cn(...v: Array<string | false | null | undefined>) { return v.filter(Boolean).join(" ") }
const button = "inline-flex items-center justify-center rounded-2xl px-4 py-3 text-sm font-black transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
const input = "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none placeholder:text-slate-400 focus:border-pink-400 focus:ring-4 focus:ring-pink-50"
const panel = "rounded-[2.2rem] border border-slate-200 bg-white p-5 text-slate-950 shadow-sm"

function Badge({ children, tone = "slate" }: { children: React.ReactNode; tone?: "slate" | "pink" | "green" | "amber" | "red" | "violet" | "blue" | "dark" }) {
  const m = { slate: "bg-slate-100 text-slate-700 border-slate-200", pink: "bg-pink-50 text-pink-700 border-pink-200", green: "bg-emerald-50 text-emerald-700 border-emerald-200", amber: "bg-amber-50 text-amber-700 border-amber-200", red: "bg-red-50 text-red-700 border-red-200", violet: "bg-violet-50 text-violet-700 border-violet-200", blue: "bg-blue-50 text-blue-700 border-blue-200", dark: "bg-slate-900 text-white border-slate-800" }
  return <span className={cn("rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-wide", m[tone])}>{children}</span>
}
function statusTone(s: SeoStatus) { return s === "published" || s === "approved" ? "green" : s === "rejected" ? "red" : s === "review" ? "violet" : s === "writing" ? "amber" : s === "archived" ? "dark" : "slate" }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="space-y-1.5"><span className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-600">{label}</span>{children}</label> }

export default function SeoBlogEditor({ taskId }: { taskId: string }) {
  const [task, setTask] = useState<SeoItem>({ ...emptySeoItem, id: taskId })
  const [original, setOriginal] = useState<SeoItem | null>(null)
  const [checklist, setChecklist] = useState<SeoChecklistItem[]>([])
  const [events, setEvents] = useState<SeoEvent[]>([])
  const [newChecklist, setNewChecklist] = useState("")
  const [comment, setComment] = useState("")
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const found = loadSeoItems().find((x) => x.id === taskId) || { ...emptySeoItem, id: taskId, title: "New SEO/blog task" }
    setTask(found)
    setOriginal(found)
    setChecklist(loadChecklist(taskId))
    setEvents(loadEvents(taskId))
    fetch(`/api/market-os/seo-blog-workspace/${taskId}`).catch(() => {})
  }, [taskId])

  const dirty = useMemo(() => JSON.stringify(task) !== JSON.stringify(original), [task, original])
  const seoScore = calcSeo(task), readScore = calcRead(task), convScore = calcConv(task)

  function set<K extends keyof SeoItem>(k: K, v: SeoItem[K]) { setTask((t) => ({ ...t, [k]: v })) }
  function addEvent(message: string, type: "comment" | "event" = "event") {
    const next = [{ id: `${type}-${Date.now()}`, type, message, created_at: new Date().toISOString() }, ...events]
    setEvents(next); persistEvents(taskId, next)
  }
  function save(patch: Partial<SeoItem> = {}) {
    const merged = { ...task, ...patch, updated_at: new Date().toISOString() }
    const next = { ...merged, seo_score: calcSeo(merged), readability_score: calcRead(merged), conversion_score: calcConv(merged) }
    setTask(next); setOriginal(next); upsertSeoItem(next); addEvent("SEO/blog task saved."); setSaved(true); setTimeout(() => setSaved(false), 1800)
    fetch(`/api/market-os/seo-blog-workspace/${taskId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(next) }).catch(() => {})
  }
  function changeStatus(status: SeoStatus) { save({ status, approval_status: status }) }
  function smart(kind: "brief" | "outline" | "meta" | "links" | "body") {
    const map = {
      brief: `SEO BRIEF\nKeyword: ${task.primary_keyword || "Define keyword"}\nAudience: ${task.audience}\nIntent: ${task.search_intent || "Define intent"}\nConversion goal: WhatsApp / devis / contact.`,
      outline: `H1: ${task.title}\nH2: Introduction\nH2: Problem and user need\nH2: AngelCare solution\nH2: Benefits\nH2: FAQ\nH2: CTA`,
      meta: `Découvrez ${task.title || "AngelCare"} avec une approche fiable, humaine et organisée. Contactez AngelCare pour une orientation rapide.`,
      links: `/services\n/contact\n/testimonials\n/blog\n/service-page`,
      body: `Introduction\n\nPrésentez clairement le besoin du lecteur et la promesse AngelCare.\n\nSolution AngelCare\n\nExpliquez les bénéfices, les garanties, l'organisation et le CTA.\n\nConclusion\n\nInvitez le lecteur à contacter AngelCare pour une orientation rapide.`,
    }
    if (kind === "brief") save({ outline: `${task.outline}\n\n${map.brief}`.trim() })
    if (kind === "outline") save({ outline: `${task.outline}\n\n${map.outline}`.trim() })
    if (kind === "meta") save({ meta_description: task.meta_description || map.meta, meta_title: task.meta_title || `${task.title} | AngelCare` })
    if (kind === "links") save({ internal_links: `${task.internal_links}\n\n${map.links}`.trim() })
    if (kind === "body") save({ draft_body: `${task.draft_body}\n\n${map.body}`.trim() })
    addEvent(`Smart SEO tool used: ${kind}.`)
  }
  function toggleChecklist(id: string) {
    const next = checklist.map((x) => x.id === id ? { ...x, done: !x.done } : x)
    setChecklist(next); persistChecklist(taskId, next); addEvent("Checklist updated.")
  }
  function addChecklist() {
    if (!newChecklist.trim()) return
    const next = [...checklist, { id: `item-${Date.now()}`, label: newChecklist.trim(), done: false }]
    setChecklist(next); persistChecklist(taskId, next); setNewChecklist(""); addEvent("Checklist item added.")
  }
  function deleteTask() {
    if (!window.confirm("Delete this SEO/blog task permanently?")) return
    deleteSeoItem(taskId); window.localStorage.removeItem(checklistKey(taskId)); window.localStorage.removeItem(eventsKey(taskId)); window.location.href = "/market-os/seo-blog-workspace"
  }
  function addComment() { if (!comment.trim()) return; addEvent(comment.trim(), "comment"); setComment("") }

  return <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#ffe4f0,transparent_30%),linear-gradient(180deg,#f8fafc,#eef2f7)] p-5 text-slate-950 md:p-8"><section className="mx-auto max-w-[1600px] space-y-6">
    <div className="sticky top-3 z-40 flex flex-wrap items-center justify-between gap-3 rounded-[1.7rem] border border-white/70 bg-white/85 p-3 shadow-lg backdrop-blur"><Link href="/market-os/seo-blog-workspace" className={cn(button, "border border-slate-200 bg-white text-slate-950")}><ArrowLeft className="mr-2 h-4 w-4" />Back to SEO center</Link><div className="flex flex-wrap gap-2"><Badge tone={statusTone(task.status)}>{SEO_STATUS_LABELS[task.status]}</Badge>{dirty && <Badge tone="amber">Unsaved</Badge>}{saved && <Badge tone="green">Saved</Badge>}</div></div>
    <header className="overflow-hidden rounded-[2.7rem] border border-slate-900 bg-[radial-gradient(circle_at_top_right,rgba(236,72,153,.30),transparent_34%),linear-gradient(135deg,#020617,#0f172a_55%,#111827)] text-white shadow-2xl"><div className="grid gap-6 p-7 xl:grid-cols-[1.35fr_.95fr]"><div><div className="flex flex-wrap gap-2"><Badge tone="pink">SEO workshop</Badge><Badge tone="violet">{SEO_TYPES[task.content_type]}</Badge><Badge tone="green">Rank → Convert</Badge></div><h1 className="mt-5 text-4xl font-black tracking-tight md:text-6xl" style={{ color: "#fff" }}>{task.title || "SEO / Blog production desk"}</h1><p className="mt-4 max-w-4xl text-sm font-semibold leading-7" style={{ color: "rgba(255,255,255,.85)" }}>Configure keyword strategy, metadata, outline, writing, review, publishing and conversion readiness.</p><div className="mt-6 grid gap-3 md:grid-cols-5"><button onClick={() => save()} className={cn(button, "bg-white text-slate-950")}><Save className="mr-2 h-4 w-4" />Save</button><button onClick={() => changeStatus("review")} className={cn(button, "bg-violet-600 text-white")}><Send className="mr-2 h-4 w-4" />Submit</button><button onClick={() => changeStatus("approved")} className={cn(button, "bg-emerald-600 text-white")}><CheckCircle2 className="mr-2 h-4 w-4" />Approve</button><button onClick={() => changeStatus("published")} className={cn(button, "bg-pink-600 text-white")}><PlayCircle className="mr-2 h-4 w-4" />Publish</button><button onClick={deleteTask} className={cn(button, "bg-red-600 text-white")}><Trash2 className="mr-2 h-4 w-4" />Delete</button></div></div><div className="grid grid-cols-3 gap-3">{[["SEO", seoScore, Target], ["Read", readScore, FileText], ["CTA", convScore, BarChart3]].map(([l,v,I]: any) => <div key={l} className="rounded-[1.7rem] border border-white/10 bg-white/10 p-5"><I className="h-5 w-5 text-pink-200" /><p className="mt-4 text-xs font-black uppercase tracking-widest" style={{ color: "rgba(255,255,255,.7)" }}>{l}</p><p className="mt-1 text-3xl font-black" style={{ color: "#fff" }}>{v}%</p></div>)}</div></div></header>
    <nav className="rounded-[2rem] border border-slate-200 bg-white/90 p-3 shadow-sm backdrop-blur" aria-label="SEO editor navigation">
      <div className="grid gap-2 md:grid-cols-5">
        {[
          ["01", "Strategy", "#strategy"],
          ["02", "SERP", "#serp"],
          ["03", "Draft", "#draft"],
          ["04", "Links", "#links"],
          ["05", "Control", "#control"],
        ].map(([n, label, href]) => (
          <a key={label} href={href} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 transition hover:-translate-y-0.5 hover:border-pink-200 hover:bg-pink-50">
            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-pink-600">{n}</span>
            <p className="mt-1 text-sm font-black text-slate-950">{label}</p>
          </a>
        ))}
      </div>
    </nav>

    <div className="grid gap-6 xl:grid-cols-[1.05fr_.8fr_.55fr]">
      <section className="space-y-6"><div id="strategy" className={panel}><h2 className="flex items-center gap-2 text-xl font-black text-slate-950"><Target className="h-5 w-5 text-pink-600" />SEO strategy control</h2><div className="mt-5 grid gap-4 md:grid-cols-2"><Field label="Title"><input className={input} value={task.title} onChange={(e) => set("title", e.target.value)} /></Field><Field label="Slug"><input className={input} value={task.slug} onChange={(e) => set("slug", e.target.value)} /></Field><Field label="Primary keyword"><input className={input} value={task.primary_keyword} onChange={(e) => set("primary_keyword", e.target.value)} /></Field><Field label="Secondary keywords"><input className={input} value={task.secondary_keywords} onChange={(e) => set("secondary_keywords", e.target.value)} /></Field><Field label="Owner"><select className={input} value={task.owner} onChange={(e) => set("owner", e.target.value)}>{SEO_OWNERS.map((x) => <option key={x}>{x}</option>)}</select></Field><Field label="Service"><input className={input} value={task.service_name} onChange={(e) => set("service_name", e.target.value)} /></Field></div></div><div id="serp" className={panel}><h2 className="flex items-center gap-2 text-xl font-black text-slate-950"><Globe className="h-5 w-5 text-pink-600" />Metadata & SERP preview</h2><div className="mt-5 grid gap-4"><Field label="Meta title"><input className={input} value={task.meta_title} onChange={(e) => set("meta_title", e.target.value)} /></Field><Field label="Meta description"><textarea className={cn(input, "min-h-[90px]")} value={task.meta_description} onChange={(e) => set("meta_description", e.target.value)} /></Field><div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="text-lg font-black text-blue-700">{task.meta_title || task.title || "SERP title preview"}</p><p className="text-sm font-semibold text-emerald-700">angelcare.ma/{task.slug || "seo-url"}</p><p className="mt-1 text-sm font-semibold text-slate-600">{task.meta_description || "Meta description preview..."}</p></div></div></div><div id="draft" className={panel}><h2 className="flex items-center gap-2 text-xl font-black text-slate-950"><FileText className="h-5 w-5 text-pink-600" />Outline & article draft</h2><div className="mt-5 grid gap-4"><Field label="Search intent"><textarea className={cn(input, "min-h-[90px]")} value={task.search_intent} onChange={(e) => set("search_intent", e.target.value)} /></Field><Field label="Outline"><textarea className={cn(input, "min-h-[140px]")} value={task.outline} onChange={(e) => set("outline", e.target.value)} /></Field><Field label="Draft body"><textarea className={cn(input, "min-h-[240px]")} value={task.draft_body} onChange={(e) => set("draft_body", e.target.value)} /></Field></div></div></section>
      <section className="space-y-6"><div className="rounded-[2.2rem] border border-slate-900 bg-[radial-gradient(circle_at_top_right,rgba(236,72,153,.22),transparent_35%),linear-gradient(145deg,#020617,#0f172a)] p-5 text-white shadow-xl"><h2 className="flex items-center gap-2 text-xl font-black" style={{ color: "#fff" }}><Sparkles className="h-5 w-5 text-pink-300" />Smart SEO workshop tools</h2><div className="mt-5 grid gap-2">{[["SEO brief","brief"],["H1/H2 outline","outline"],["Meta generator","meta"],["Internal links","links"],["Draft starter","body"]].map(([label, kind]) => <button key={kind} onClick={() => smart(kind as any)} className={cn(button, "justify-start border border-white/10 bg-white/10 text-left text-white hover:bg-white/15")}><Wand2 className="mr-2 h-4 w-4 text-pink-200" />{label}</button>)}</div></div><div id="links" className={panel}><h2 className="flex items-center gap-2 text-xl font-black text-slate-950"><Link2 className="h-5 w-5 text-pink-600" />Linking & publishing</h2><div className="mt-5 grid gap-4"><Field label="Internal links"><textarea className={cn(input, "min-h-[100px]")} value={task.internal_links} onChange={(e) => set("internal_links", e.target.value)} /></Field><Field label="External links"><textarea className={cn(input, "min-h-[80px]")} value={task.external_links} onChange={(e) => set("external_links", e.target.value)} /></Field><Field label="Canonical URL"><input className={input} value={task.canonical_url} onChange={(e) => set("canonical_url", e.target.value)} /></Field><Field label="Publish URL"><input className={input} value={task.publish_url} onChange={(e) => set("publish_url", e.target.value)} /></Field>{task.publish_url ? <a href={task.publish_url} target="_blank" className={cn(button, "border border-slate-200 bg-white text-slate-900")}><Globe className="mr-2 h-4 w-4" />Open published URL</a> : null}</div></div><div className={panel}><h2 className="flex items-center gap-2 text-xl font-black text-slate-950"><ListChecks className="h-5 w-5 text-pink-600" />SEO checklist</h2><div className="mt-4 space-y-2">{checklist.map((item) => <div key={item.id} className="flex items-center gap-2 rounded-2xl bg-slate-50 p-3"><button onClick={() => toggleChecklist(item.id)} className={cn("h-8 w-8 rounded-xl border font-black", item.done ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-white text-slate-400")}>{item.done ? "✓" : ""}</button><span className={cn("flex-1 text-sm font-bold", item.done ? "text-slate-400 line-through" : "text-slate-800")}>{item.label}</span></div>)}</div><div className="mt-3 grid grid-cols-[1fr_auto] gap-2"><input className={input} value={newChecklist} onChange={(e) => setNewChecklist(e.target.value)} placeholder="Add checklist item" /><button onClick={addChecklist} className={cn(button, "bg-slate-950 text-white")}><Plus className="h-4 w-4" /></button></div></div></section>
      <aside className="space-y-6 xl:sticky xl:top-24 xl:self-start"><div id="control" className={panel}><h2 className="flex items-center gap-2 text-xl font-black text-slate-950"><Target className="h-5 w-5 text-pink-600" />Action dock</h2><div className="mt-5 grid gap-2"><button onClick={() => save()} className={cn(button, "bg-slate-950 text-white")}><Save className="mr-2 h-4 w-4" />Save changes</button><button onClick={() => changeStatus("review")} className={cn(button, "bg-violet-600 text-white")}><Send className="mr-2 h-4 w-4" />Submit review</button><button onClick={() => changeStatus("approved")} className={cn(button, "bg-emerald-600 text-white")}><CheckCircle2 className="mr-2 h-4 w-4" />Approve</button><button onClick={() => changeStatus("rejected")} className={cn(button, "bg-red-600 text-white")}><XCircle className="mr-2 h-4 w-4" />Reject</button><button onClick={() => changeStatus("published")} className={cn(button, "bg-pink-600 text-white")}><PlayCircle className="mr-2 h-4 w-4" />Publish</button><button onClick={deleteTask} className={cn(button, "border border-red-200 bg-red-50 text-red-700")}><Trash2 className="mr-2 h-4 w-4" />Delete permanently</button></div></div><div className={panel}><h2 className="flex items-center gap-2 text-xl font-black text-slate-950"><BarChart3 className="h-5 w-5 text-pink-600" />Score tracker</h2><div className="mt-4 space-y-4">{[["SEO", seoScore], ["Readability", readScore], ["Conversion", convScore]].map(([label, value]: any) => <div key={label}><div className="flex justify-between text-xs font-black uppercase tracking-widest text-slate-500"><span>{label}</span><span>{value}%</span></div><div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-pink-500" style={{ width: `${value}%` }} /></div></div>)}</div></div><div className={panel}><h2 className="flex items-center gap-2 text-xl font-black text-slate-950"><MessageCircle className="h-5 w-5 text-pink-600" />Comments & event log</h2><div className="mt-4 grid grid-cols-[1fr_auto] gap-2"><input className={input} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Add note..." /><button onClick={addComment} className={cn(button, "bg-pink-600 text-white")}>Add</button></div><div className="mt-4 max-h-[260px] space-y-2 overflow-auto">{events.map((event) => <article key={event.id} className="rounded-2xl bg-slate-50 p-3"><p className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500"><Activity className="h-3.5 w-3.5 text-pink-600" />{event.type}</p><p className="mt-2 text-sm font-semibold text-slate-700">{event.message}</p><time className="mt-1 block text-[10px] font-bold text-slate-400">{new Date(event.created_at).toLocaleString()}</time></article>)}</div></div></aside>
    </div>
  </section></main>
}
